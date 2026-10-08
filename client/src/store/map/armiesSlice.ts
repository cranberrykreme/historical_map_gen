import { StateCreator } from "zustand";
import { Army, ArmyMember } from "../../types";
import { existsAt } from "../../utils/timeline";
import { HistoryTime } from "../../utils/historyTime";
import { placementMoment } from "../../utils/lifespans";
import {
  joinArmy,
  leaveArmy,
  membersAt,
  newArmyId,
  nextArmyName,
} from "../../utils/armies";
import { useTimelineStore } from "../useTimelineStore";
import { withHistory } from "./history";
import { ArmiesSlice, MapStore } from "./types";

// Whether an army change actually changed anything (so a no-op adds no undo step)
const sameArmies = (a: Army[], b: Army[]) =>
  JSON.stringify(a) === JSON.stringify(b);

// The playhead's moment for joining and leaving armies: undefined at the story's start
function armyMoment(storyStart: HistoryTime): HistoryTime | undefined {
  return placementMoment(useTimelineStore.getState().now, storyStart);
}

export const createArmiesSlice: StateCreator<MapStore, [], [], ArmiesSlice> = (
  set,
  get
) => ({
  // Initial state
  armies: [],
  selectedArmyId: null,

  setArmies: (armies) => set({ armies }),

  // Selecting an army selects the units that are in it, and on the map, at the playhead
  selectArmy: (id) => {
    const state = get();
    const army = state.armies.find((a) => a.id === id);
    if (!army) {
      set({ selectedArmyId: null });
      return;
    }
    const moment = useTimelineStore.getState().now ?? state.storyStart;
    const present = new Set(
      state.placedUnits
        .filter((unit) => existsAt(unit, moment))
        .map((unit) => unit.id)
    );
    set({
      selectedArmyId: army.id,
      selectedUnitIds: new Set(
        membersAt(army, moment).filter((uid) => present.has(uid))
      ),
    });
  },

  // A new army of the selected units, from the playhead's moment. One undo step.
  createArmyFromSelection: () => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0) return null;
    const army: Army = {
      id: newArmyId(),
      name: nextArmyName(state.armies),
      members: [],
    };
    const armies = joinArmy(
      [...state.armies, army],
      army.id,
      unitIds,
      armyMoment(state.storyStart)
    );
    set({ ...withHistory(state), armies, selectedArmyId: army.id });
    return army.id;
  },

  renameArmy: (id, name) => {
    const state = get();
    const trimmed = name.trim();
    const army = state.armies.find((a) => a.id === id);
    if (!army || !trimmed || trimmed === army.name) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, name: trimmed } : a
      ),
    });
  },

  // Deleting an army keeps its units and marches; the marches just no longer belong to it
  deleteArmy: (id) => {
    const state = get();
    if (!state.armies.some((a) => a.id === id)) return;
    set({
      ...withHistory(state),
      armies: state.armies.filter((a) => a.id !== id),
      paths: state.paths.map((p) => {
        if (p.armyId !== id) return p;
        const { armyId: _owner, ...rest } = p;
        return rest;
      }),
      selectedArmyId: state.selectedArmyId === id ? null : state.selectedArmyId,
    });
  },

  // The selected units join the army at the playhead's moment (leaving any other army then)
  addSelectedUnitsToArmy: (id) => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0 || !state.armies.some((a) => a.id === id)) return;
    const armies = joinArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Units leave the army at the playhead's moment
  removeUnitsFromArmy: (id, unitIds) => {
    const state = get();
    const armies = leaveArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Erases one stint of a unit in an army, as if it never joined for it. Any of the army's
  // marches it was on go on without it. One undo step.
  eraseMembership: (id, member) => {
    const state = get();
    const same = (m: ArmyMember) =>
      m.unitId === member.unitId &&
      m.joins === member.joins &&
      m.leaves === member.leaves;
    const army = state.armies.find((a) => a.id === id);
    if (!army || !army.members.some(same)) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, members: a.members.filter((m) => !same(m)) } : a
      ),
    });
  },
});

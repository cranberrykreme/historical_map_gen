import { StateCreator } from "zustand";
import { Shot } from "../../types";
import {
  clampShot,
  DEFAULT_SHOT_SECONDS,
  moveShot,
  newShotId,
  nextShotName,
} from "../../utils/shots";
import { withHistory } from "./history";
import { MapStore, ShotsSlice } from "./types";

// How much history a new shot covers when nothing says otherwise: a week
const DEFAULT_SHOT_DAYS = 7;

const sameShot = (a: Shot, b: Shot) =>
  a.name === b.name &&
  a.seconds === b.seconds &&
  a.from === b.from &&
  a.to === b.to &&
  !!a.ease === !!b.ease &&
  !!a.hideDate === !!b.hideDate;

export const createShotsSlice: StateCreator<MapStore, [], [], ShotsSlice> = (
  set,
  get
) => ({
  // Initial state
  shots: [],
  selectedShotId: null,

  // For loading: bypasses history
  setShots: (shots) => set({ shots, selectedShotId: null }),

  selectShot: (id) =>
    set({
      selectedShotId:
        id !== null && get().shots.some((shot) => shot.id === id) ? id : null,
    }),

  // A new shot, straight after the selected one (or at the end), and selected. By default it
  // carries on from where the shot before it ends, covering a week of history in 10 seconds.
  // One undo step.
  addShot: (spec = {}) => {
    const state = get();
    const selectedIndex = state.shots.findIndex(
      (shot) => shot.id === state.selectedShotId
    );
    const index = selectedIndex >= 0 ? selectedIndex + 1 : state.shots.length;
    const before = state.shots[index - 1];
    const from = spec.from ?? before?.to ?? state.storyStart;
    const shot = clampShot({
      id: newShotId(),
      name: spec.name ?? nextShotName(state.shots),
      seconds: spec.seconds ?? DEFAULT_SHOT_SECONDS,
      from,
      to: spec.to ?? from + DEFAULT_SHOT_DAYS,
      ...(spec.ease ? { ease: true } : {}),
      ...(spec.hideDate ? { hideDate: true } : {}),
    });
    const shots = [...state.shots];
    shots.splice(index, 0, shot);
    set({ ...withHistory(state), shots, selectedShotId: shot.id });
    return shot.id;
  },

  // Changes a shot's name, length, history or options. One undo step; nothing changes (and
  // no undo step is added) if the shot ends up the same.
  updateShot: (id, patch) => {
    const state = get();
    const current = state.shots.find((shot) => shot.id === id);
    if (!current) return;
    const merged: Shot = { ...current, ...patch, id };
    if (typeof merged.name === "string")
      merged.name = merged.name.trim() || current.name;
    if (!merged.ease) delete merged.ease;
    if (!merged.hideDate) delete merged.hideDate;
    const next = clampShot(merged);
    if (sameShot(next, current)) return;
    set({
      ...withHistory(state),
      shots: state.shots.map((shot) => (shot.id === id ? next : shot)),
    });
  },

  deleteShot: (id) => {
    const state = get();
    if (!state.shots.some((shot) => shot.id === id)) return;
    set({
      ...withHistory(state),
      shots: state.shots.filter((shot) => shot.id !== id),
      selectedShotId: state.selectedShotId === id ? null : state.selectedShotId,
    });
  },

  // Moves a shot to another place in the running order. One undo step.
  moveShotTo: (id, index) => {
    const state = get();
    const shots = moveShot(state.shots, id, index);
    if (shots === state.shots) return;
    set({ ...withHistory(state), shots });
  },
});

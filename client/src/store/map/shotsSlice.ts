import { StateCreator } from "zustand";
import { MAP_SCENE, Shot } from "../../types";
import {
  clampShot,
  DEFAULT_SHOT_SECONDS,
  MIN_TRANSITION_SECONDS,
  moveShot,
  newShotId,
  nextShotName,
  sameTransition,
  sameView,
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
  !!a.hideDate === !!b.hideDate &&
  sameView(a.startView, b.startView) &&
  sameView(a.endView, b.endView) &&
  !!a.followOn === !!b.followOn &&
  sameTransition(a.transition, b.transition) &&
  (a.fadeOut ?? 0) === (b.fadeOut ?? 0) &&
  (a.follow ?? "") === (b.follow ?? "") &&
  (a.scene ?? MAP_SCENE) === (b.scene ?? MAP_SCENE);

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
      // A new shot shows the scene being edited, unless it says otherwise
      ...((spec.scene ?? state.activeSceneId) !== MAP_SCENE
        ? { scene: spec.scene ?? state.activeSceneId }
        : {}),
    });
    const shots = [...state.shots];
    shots.splice(index, 0, shot);
    set({ ...withHistory(state), shots, selectedShotId: shot.id });
    return shot.id;
  },

  // Changes a shot's name, length, history, camera, army followed, transition, fade out or
  // options. Passing undefined for a view, the army, the transition or the fade out clears it.
  // One undo step; nothing changes (and no undo step is added) if the shot ends up the same.
  updateShot: (id, patch) => {
    const state = get();
    const current = state.shots.find((shot) => shot.id === id);
    if (!current) return;
    const merged: Shot = { ...current, ...patch, id };
    if (typeof merged.name === "string")
      merged.name = merged.name.trim() || current.name;
    if (!merged.ease) delete merged.ease;
    if (!merged.hideDate) delete merged.hideDate;
    if (!merged.followOn) delete merged.followOn;
    if (!merged.startView) delete merged.startView;
    if (!merged.endView) delete merged.endView;
    if (!merged.follow) delete merged.follow;
    if (!merged.scene || merged.scene === MAP_SCENE) delete merged.scene;
    // Views and the army followed belong to the scene they were set in, so moving a shot to
    // another scene starts its camera afresh there
    if ((merged.scene ?? MAP_SCENE) !== (current.scene ?? MAP_SCENE)) {
      if (!("startView" in patch)) delete merged.startView;
      if (!("endView" in patch)) delete merged.endView;
      if (!("follow" in patch)) delete merged.follow;
      if (!("followOn" in patch)) delete merged.followOn;
    }
    if (!merged.fadeOut || merged.fadeOut <= 0) delete merged.fadeOut;
    else merged.fadeOut = Math.max(merged.fadeOut, MIN_TRANSITION_SECONDS);
    if (!merged.transition || merged.transition.kind === "cut") {
      delete merged.transition;
    } else {
      // Only a wipe has a direction, and a transition is never shorter than the minimum
      const { direction, ...rest } = merged.transition;
      merged.transition = {
        ...rest,
        seconds: Math.max(rest.seconds, MIN_TRANSITION_SECONDS),
        ...(rest.kind === "wipe" && direction ? { direction } : {}),
      };
    }
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

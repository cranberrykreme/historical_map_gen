// When the project saves itself. An edit starts a short wait; the save happens once the wait
// is over and nothing is in the middle of happening (a drag, the video playing, a march being
// drawn). ⌘S still saves at once.

export const AUTOSAVE_DELAY = 1500; // ms after the last edit

// The parts of the map store that are saved in the project file. A change to any of them is
// an edit; everything else (selection, drags in progress, the open scene) is not.
export interface DocumentFields {
  activeSceneId: string;
  placedUnits: unknown;
  paths: unknown;
  armies: unknown;
  shots: unknown;
  battles: unknown;
  sceneStash: unknown;
  storyStart: unknown;
  displayMode: unknown;
  pacing: unknown;
  videoFrame: unknown;
  selectedMapFilename: unknown;
}

const SAVED_FIELDS: (keyof DocumentFields)[] = [
  "placedUnits",
  "paths",
  "armies",
  "shots",
  "battles",
  "sceneStash",
  "storyStart",
  "displayMode",
  "pacing",
  "videoFrame",
  "selectedMapFilename",
];

// Whether going from `prev` to `next` changed the project. Opening another scene swaps the
// units, marches and armies around without changing the project, so it doesn't count.
export function isDocumentEdit(
  next: DocumentFields,
  prev: DocumentFields
): boolean {
  if (next.activeSceneId !== prev.activeSceneId) return false;
  return SAVED_FIELDS.some((field) => next[field] !== prev[field]);
}

// What is going on right now that a save must not interrupt
export interface Busy {
  dragging: boolean; // a mouse button is held down (moving a unit, a bar, a brush stroke)
  playing: boolean;
  drawing: boolean; // a march being drawn
}

export type AutosaveStep = "nothing" | "wait" | "save";

// What to do now: nothing to save, keep waiting, or save
export function autosaveStep(
  dirty: boolean,
  lastEdit: number,
  now: number,
  saving: boolean,
  busy: Busy
): AutosaveStep {
  if (!dirty) return "nothing";
  if (saving || now - lastEdit < AUTOSAVE_DELAY) return "wait";
  if (busy.dragging || busy.playing || busy.drawing) return "wait";
  return "save";
}

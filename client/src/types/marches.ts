// Marches: the routes units follow, and when in history they happen

// When a march happens in history (days since 1 January 1970, see utils/history/historyTime).
// The first `turn` days are spent turning on the spot, the rest travelling.
export interface MarchTiming {
  start: number;
  end: number;
  turn: number;
}

export interface PathPoint {
  x: number;
  y: number;
}

// A unit's place in a path's formation, measured from the formation's centre
// along and across the direction of travel, so the formation turns with the path
export interface PathAssignment {
  unitId: string;
  forward: number;
  right: number;
}

export interface MapPath {
  id: string;
  name: string;
  points: PathPoint[];
  assignments: PathAssignment[];
  // The way the group attached to this path faces at rest, in degrees (0 = right, 90 = down,
  // -90 = up). Formation slots are measured against it, so the formation keeps its shape
  // whichever way the route leaves. Missing on older paths, which use the start heading.
  direction?: number;
  // When this path's march happens in history. Set when units are attached.
  march?: MarchTiming;
  // The army this march belongs to, if any
  armyId?: string;
}

// From version 1 project files only: how the date was shown, and the date markers that
// paired seconds on the video with dates. They are converted when the project loads.
export type DateMode = "months" | "days";

export interface DateMarker {
  id: string;
  time: number; // seconds on the video's timeline
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

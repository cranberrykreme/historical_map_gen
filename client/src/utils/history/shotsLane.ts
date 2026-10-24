import { Shot } from "../../types";
import { snapTime } from "../marches/marches";
import { HistoryTime } from "./historyTime";

// The shots lane in History mode: each shot as a bracket over the stretch of history it
// shows, or a diamond at the moment it holds. Shots that overlap in history, or go back in
// it, stack in extra lines of the lane so none hides another.

export interface LanePlace {
  shot: Shot;
  line: number; // 0 is the top line
}

export interface ShotsLane {
  places: LanePlace[]; // in the order the shots play
  lines: number; // how many lines the lane needs (at least 1)
}

// Each shot, in video order, takes the first line it fits on: one where every shot so far
// ended before it starts. A shot may start where the one before it on the line ends, but a
// held moment needs the line clear up to it, so a title held between two shots drops below
// them rather than sitting on their join.
export function layoutShotsLane(shots: Shot[]): ShotsLane {
  const lineEnds: HistoryTime[] = [];
  const places = shots.map((shot) => {
    const held = shot.to - shot.from < 1e-9;
    let line = lineEnds.findIndex((end) =>
      held ? end < shot.from : end <= shot.from
    );
    if (line < 0) line = lineEnds.length;
    lineEnds[line] = shot.to;
    return { shot, line };
  });
  return { places, lines: Math.max(lineEnds.length, 1) };
}

// Which part of a bracket is being dragged: its start, its end, or the whole bracket
export type ShotDragPart = "from" | "to" | "move";

// A shot's stretch of history after dragging part of its bracket `delta` days, snapped to
// `snap`. An end dragged past the other stops there, so the shot holds that moment, as the
// shot's From and To boxes do.
export function dragShotSpan(
  shot: Pick<Shot, "from" | "to">,
  part: ShotDragPart,
  delta: number,
  snap: number
): { from: HistoryTime; to: HistoryTime } {
  if (part === "move") {
    const from = snapTime(shot.from + delta, snap);
    return { from, to: from + (shot.to - shot.from) };
  }
  if (part === "from")
    return {
      from: Math.min(snapTime(shot.from + delta, snap), shot.to),
      to: shot.to,
    };
  return {
    from: shot.from,
    to: Math.max(snapTime(shot.to + delta, snap), shot.from),
  };
}

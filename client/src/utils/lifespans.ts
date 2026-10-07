import { Unit } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";

// Two moments closer than this count as the same moment
const SAME_MOMENT = MINUTE / 2;

type Dated = Pick<Unit, "appears" | "leaves">;

// The moment a unit is placed at: when it appears, or the story's start for a unit that is
// there from the beginning. A unit is edited (moved, turned, deleted outright) at this moment,
// because that is where its placed position is what the map shows.
export function homeMoment(unit: Dated, storyStart: HistoryTime): HistoryTime {
  return unit.appears !== undefined
    ? Math.max(unit.appears, storyStart)
    : storyStart;
}

// Whether a unit can be edited with the playhead where it is (null is the story's start)
export function editableAt(
  unit: Dated,
  now: HistoryTime | null,
  storyStart: HistoryTime
): boolean {
  const current = now ?? storyStart;
  return Math.abs(current - homeMoment(unit, storyStart)) < SAME_MOMENT;
}

// When a unit placed now appears: at the playhead's moment once it is past the story's start,
// otherwise from the start (no date)
export function placementMoment(
  now: HistoryTime | null,
  storyStart: HistoryTime
): HistoryTime | undefined {
  return now !== null && now > storyStart ? now : undefined;
}

// Removing units with the playhead where it is. A unit at its own home moment is deleted
// outright; anywhere later it leaves at that moment and stays in history before it.
export function removeUnitsAt(
  units: Unit[],
  ids: ReadonlySet<string>,
  now: HistoryTime | null,
  storyStart: HistoryTime
): { units: Unit[]; deletedIds: Set<string> } {
  const deletedIds = new Set<string>();
  const kept: Unit[] = [];
  for (const unit of units) {
    if (!ids.has(unit.id)) {
      kept.push(unit);
    } else if (now === null || editableAt(unit, now, storyStart)) {
      deletedIds.add(unit.id);
    } else {
      kept.push({ ...unit, leaves: now });
    }
  }
  return { units: kept, deletedIds };
}

// When a new march for these units begins by default: once their earlier marches have ended
// (if they have any), never before the story starts, and never before the last of them has
// appeared
export function defaultMarchStart(
  handoverTime: HistoryTime | null,
  storyStart: HistoryTime,
  units: Dated[]
): HistoryTime {
  return units.reduce(
    (latest, unit) => Math.max(latest, unit.appears ?? -Infinity),
    handoverTime ?? storyStart
  );
}

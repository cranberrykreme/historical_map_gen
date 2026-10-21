import { Army, Unit } from "../../types";
import { membersAt } from "./armies";
import { ArmyTracker } from "../video/camera";
import { HistoryTime } from "../history/historyTime";
import { existsAt, Timeline } from "../history/timeline";

// How many moments a tracker remembers where the units were: a following camera asks about the
// same handful of moments over and over while the video plays
const REMEMBERED_MOMENTS = 64;

// Finds where an army is at any moment in history, for a camera to follow: the average position
// of its units that are members then and exist then, where the marches have taken them (or
// where they were placed, before the story starts and when they aren't marching).
export function armyTracker(
  timeline: Timeline,
  units: Unit[],
  armies: Army[],
  storyStart: HistoryTime
): ArmyTracker {
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const armyById = new Map(armies.map((army) => [army.id, army]));
  const remembered = new Map<HistoryTime, ReturnType<Timeline["stateAt"]>>();

  const statesAt = (time: HistoryTime) => {
    let states = remembered.get(time);
    if (!states) {
      states = timeline.stateAt(time);
      if (remembered.size >= REMEMBERED_MOMENTS) {
        const oldest = remembered.keys().next().value;
        if (oldest !== undefined) remembered.delete(oldest);
      }
      remembered.set(time, states);
    }
    return states;
  };

  return (armyId, time) => {
    const army = armyById.get(armyId);
    if (!army) return null;
    const present = membersAt(army, time)
      .map((id) => unitById.get(id))
      .filter((unit): unit is Unit => !!unit && existsAt(unit, time));
    if (present.length === 0) return null;

    // Before the story starts every unit stands where it was placed, as on the map
    const states = time > storyStart ? statesAt(time) : null;
    let x = 0;
    let y = 0;
    for (const unit of present) {
      const state = states?.get(unit.id);
      x += state ? state.x : unit.x;
      y += state ? state.y : unit.y;
    }
    return { x: x / present.length, y: y / present.length };
  };
}

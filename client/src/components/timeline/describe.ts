import {
  formatDuration,
  formatHistoryTime,
} from "../../utils/history/historyTime";
import { RowGroup } from "../../utils/history/timelineRows";
import { MarchTiming } from "../../types";

// A march's dates, turn and march time, for its tooltips
export const describe = (timing: MarchTiming) =>
  [
    `${formatHistoryTime(timing.start, "times")} to ${formatHistoryTime(timing.end, "times")}`,
    `Turning: ${formatDuration(timing.turn)}`,
    `Marching: ${formatDuration(timing.end - timing.start - timing.turn)}`,
  ].join("\n");

// An army's name, how many of its units are listed, and when things happen to them, for its
// tooltips
export const groupTitle = (group: RowGroup) => {
  const count =
    group.rows.length === group.total
      ? `${group.total} unit${group.total === 1 ? "" : "s"}`
      : `${group.rows.length} of ${group.total} units listed`;
  const when =
    group.start !== null && group.end !== null
      ? `\n${formatHistoryTime(group.start, "times")} to ${formatHistoryTime(group.end, "times")}`
      : "";
  return `${group.army ? group.army.name : "Units in no army"}\n${count}${when}`;
};

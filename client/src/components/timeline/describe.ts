import { formatDuration, formatHistoryTime } from "../../utils/historyTime";
import { RowFilter, RowGroup } from "../../utils/timelineRows";
import { MarchTiming } from "../../types";

// A march's dates, turn and march time, for its tooltips
export const describe = (timing: MarchTiming) =>
  [
    `${formatHistoryTime(timing.start, "times")} to ${formatHistoryTime(timing.end, "times")}`,
    `Turning: ${formatDuration(timing.turn)}`,
    `Marching: ${formatDuration(timing.end - timing.start - timing.turn)}`,
  ].join("\n");

// An army's name, how many of its marches are listed, and when they happen, for its tooltips
export const groupTitle = (group: RowGroup, rowFilter: RowFilter) => {
  const count =
    rowFilter === "all" || group.rows.length === group.total
      ? `${group.total} march${group.total === 1 ? "" : "es"}`
      : `${group.rows.length} of ${group.total} marches listed`;
  return `${group.army ? group.army.name : "Marches in no army"}\n${count}\n${formatHistoryTime(
    group.start,
    "times"
  )} to ${formatHistoryTime(group.end, "times")}`;
};

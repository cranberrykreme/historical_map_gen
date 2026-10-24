import { useEffect, useRef } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  barPlacement,
  fitView,
  viewShowing,
} from "../../utils/history/timeline";
import { groupKeyOfUnit } from "../../utils/history/timelineRows";
import { HistoryTime } from "../../utils/history/historyTime";
import { MarchTiming } from "../../types";

// Keeps what's selected in sight on the rows. Returns the refs the rows (by unit id) and
// group headers register themselves in, so they can be scrolled to.
export function useSelectionReveal(
  selectedPathId: string | null,
  selectedTiming: MarchTiming | undefined,
  selectedUnitIds: ReadonlySet<string>,
  selectedArmyId: string | null,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null
) {
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const headerRefs = useRef(new Map<string, HTMLDivElement>());

  // Opens a unit's group and scrolls its row into sight
  const revealRow = (unitId: string) => {
    useTimelineStore
      .getState()
      .expandGroup(groupKeyOfUnit(unitId, useMapStore.getState().armies));
    // After the group has opened
    return requestAnimationFrame(() =>
      rowRefs.current.get(unitId)?.scrollIntoView({ block: "nearest" })
    );
  };

  // Selecting a march (here, on the map or in a panel) brings its bar into view and scrolls
  // to the first row it's on
  useEffect(() => {
    if (!selectedPathId || !selectedTiming) return;
    const state = useTimelineStore.getState();
    const visible = state.view ?? fitView(storyStart, storyEnd);
    if (barPlacement(selectedTiming, visible) !== "inside") {
      state.setView(viewShowing(selectedTiming, visible));
    }
    const path = useMapStore
      .getState()
      .paths.find((p) => p.id === selectedPathId);
    const first = path?.assignments[0]?.unitId;
    if (!first) return;
    const frame = revealRow(first);
    return () => cancelAnimationFrame(frame);
    // Only when the selection changes, not on every edit of the selected march
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPathId]);

  // Selecting units scrolls to the first of their rows
  useEffect(() => {
    const first = selectedUnitIds.values().next().value;
    if (first === undefined) return;
    const frame = revealRow(first);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitIds]);

  // Selecting an army (in the Armies tab, say) opens its group and scrolls to it
  useEffect(() => {
    if (!selectedArmyId) return;
    useTimelineStore.getState().expandGroup(selectedArmyId);
    const frame = requestAnimationFrame(() =>
      headerRefs.current
        .get(selectedArmyId)
        ?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedArmyId]);

  return { rowRefs, headerRefs };
}

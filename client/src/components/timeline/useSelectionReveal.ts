import { useEffect, useRef } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { barPlacement, fitView, viewShowing } from "../../utils/timeline";
import { groupKeyOf } from "../../utils/timelineRows";
import { HistoryTime } from "../../utils/historyTime";
import { MarchTiming } from "../../types";

// Keeps the selected march or army in sight. Returns the refs the rows and group headers
// register themselves in, so they can be scrolled to.
export function useSelectionReveal(
  selectedPathId: string | null,
  selectedTiming: MarchTiming | undefined,
  selectedArmyId: string | null,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null
) {
  // Selecting a march (here, on the map or in a panel) brings its bar into view, opens its
  // group and scrolls its row into sight
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const headerRefs = useRef(new Map<string, HTMLDivElement>());
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
    if (path)
      state.expandGroup(groupKeyOf(path, useMapStore.getState().armies));
    // After the group has opened
    const frame = requestAnimationFrame(() =>
      rowRefs.current.get(selectedPathId)?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
    // Only when the selection changes, not on every edit of the selected march
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPathId]);

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

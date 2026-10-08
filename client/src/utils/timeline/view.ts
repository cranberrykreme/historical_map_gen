import { HistoryTime, HOUR, MINUTE } from "../historyTime";
import { MarchTiming } from "../marches";

// The timeline bar's view of history: which stretch is on show, zooming and panning it, and
// how far dragged dates snap

export interface HistoryView {
  from: HistoryTime;
  to: HistoryTime;
}

export const MIN_VIEW_DAYS = 2 * HOUR;
export const MAX_VIEW_DAYS = 1000 * 365.2425;

// A view that shows the whole story: from its start to the end of the last march (at least a
// week), with a little room either side
export function fitView(
  storyStart: HistoryTime,
  lastEnd: HistoryTime | null
): HistoryView {
  const to = Math.max(lastEnd ?? storyStart, storyStart + 7);
  const pad = (to - storyStart) * 0.04;
  return { from: storyStart - pad, to: to + pad };
}

// Where a march's bar is relative to the stretch of history on show
export type BarPlacement = "before" | "inside" | "after";

export function barPlacement(
  timing: MarchTiming,
  view: HistoryView
): BarPlacement {
  if (timing.end < view.from) return "before";
  if (timing.start > view.to) return "after";
  return "inside";
}

// A view that shows a march: the same zoom, centred on it, or zoomed out just enough to fit it
// with a little room either side if it is longer than the view
export function viewShowing(
  timing: MarchTiming,
  view: HistoryView
): HistoryView {
  const span = Math.max(view.to - view.from, MIN_VIEW_DAYS);
  const length = timing.end - timing.start;
  if (length * 1.2 > span) {
    const pad = Math.max(length * 0.1, MIN_VIEW_DAYS / 2);
    return { from: timing.start - pad, to: timing.end + pad };
  }
  const centre = (timing.start + timing.end) / 2;
  return { from: centre - span / 2, to: centre + span / 2 };
}

// Zooms a view by `factor` (above 1 zooms out) about the moment `anchor`, which stays under
// the pointer
export function zoomView(
  view: HistoryView,
  anchor: HistoryTime,
  factor: number
): HistoryView {
  const span = view.to - view.from;
  const next = Math.min(Math.max(span * factor, MIN_VIEW_DAYS), MAX_VIEW_DAYS);
  const from = anchor - (anchor - view.from) * (next / span);
  return { from, to: from + next };
}

const SNAP_STEPS = [MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR, 6 * HOUR, 1, 7, 30];

// How far dragged dates snap at a zoom level: the finest round step that is at least a few
// pixels wide, so you can always land on any step you can see
export function snapStepFor(daysPerPixel: number): number {
  return (
    SNAP_STEPS.find((step) => step >= daysPerPixel * 6) ??
    SNAP_STEPS[SNAP_STEPS.length - 1]
  );
}

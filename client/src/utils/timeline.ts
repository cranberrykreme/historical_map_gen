// The timeline's logic lives in utils/timeline/. This re-exports all of it, so code can keep
// importing from utils/timeline.
//
// - engine: building the timeline of marches and asking it for any moment in history
// - chaining: marches that pick their units up where earlier ones left them
// - view: the stretch of history the timeline bar shows
export {
  DEFAULT_MARCH_PACE,
  MIN_DEFAULT_MARCH,
  UNDATED_START,
  defaultMarch,
  validMarch,
  keepAfter,
  existsAt,
  createTimeline,
  getTimeline,
} from "./timeline/engine";
export type { Timeline } from "./timeline/engine";
export {
  handoverUnits,
  chainedPathIds,
  syncChainedStarts,
} from "./timeline/chaining";
export {
  MIN_VIEW_DAYS,
  MAX_VIEW_DAYS,
  fitView,
  barPlacement,
  viewShowing,
  zoomView,
  snapStepFor,
} from "./timeline/view";
export type { HistoryView, BarPlacement } from "./timeline/view";

// The stretch of the video the video strip shows, in seconds. With hundreds of shots the whole
// video squeezes each one to a sliver, so the strip can zoom in on part of it; the overview bar
// above it always shows the whole video and where the strip is looking.
export interface StripView {
  from: number;
  to: number;
}

// The strip never zooms in closer than this many seconds across
export const MIN_STRIP_SECONDS = 4;

// The whole video, with at least a second across so an empty video still has a strip
export const wholeStrip = (total: number): StripView => ({
  from: 0,
  to: Math.max(total, 1),
});

// A view the strip can show: no narrower than the minimum (or the video), no wider than the
// video, and inside it. Null (the whole video) when it would show all of it anyway.
export function clampStripView(
  view: StripView | null,
  total: number
): StripView | null {
  if (!view) return null;
  const whole = wholeStrip(total);
  const span = Math.min(
    Math.max(view.to - view.from, Math.min(MIN_STRIP_SECONDS, whole.to)),
    whole.to
  );
  if (span >= whole.to - 1e-9) return null;
  const from = Math.min(Math.max(view.from, 0), whole.to - span);
  return { from, to: from + span };
}

// Zooms in (factor below 1) or out (above 1) about a moment of the video, keeping that moment
// under the pointer
export function zoomStripView(
  view: StripView,
  anchor: number,
  factor: number,
  total: number
): StripView | null {
  const span = view.to - view.from;
  const share = span > 0 ? (anchor - view.from) / span : 0.5;
  const nextSpan = span * factor;
  const from = anchor - share * nextSpan;
  return clampStripView({ from, to: from + nextSpan }, total);
}

// Slides the view along the video by some seconds
export function panStripView(
  view: StripView,
  seconds: number,
  total: number
): StripView | null {
  return clampStripView(
    { from: view.from + seconds, to: view.to + seconds },
    total
  );
}

// The view moved just enough to show the stretch from..to: unchanged if it's already in view,
// otherwise slid so it sits a little in from the nearer edge (centred if it's wider than the
// view). Null stays null, since the whole video shows everything.
export function revealInStrip(
  view: StripView | null,
  from: number,
  to: number,
  total: number
): StripView | null {
  if (!view) return null;
  const span = view.to - view.from;
  if (from >= view.from && to <= view.to) return view;
  const margin = span * 0.1;
  let start: number;
  if (to - from >= span - 2 * margin) start = (from + to) / 2 - span / 2;
  else if (from < view.from) start = from - margin;
  else start = to + margin - span;
  return clampStripView({ from: start, to: start + span }, total);
}

// Which shots are at least partly in view, as a range of indexes [first, end), found by halving
// so it stays quick with thousands of shots. `starts` are the shots' start times in order.
export function shotsInView(
  starts: number[],
  lengths: number[],
  view: StripView
): [number, number] {
  // The first shot that ends after the view starts
  let low = 0;
  let high = starts.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (starts[mid] + lengths[mid] <= view.from) low = mid + 1;
    else high = mid;
  }
  const first = low;
  // The first shot that starts at or after the view ends
  high = starts.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (starts[mid] < view.to) low = mid + 1;
    else high = mid;
  }
  return [first, low];
}

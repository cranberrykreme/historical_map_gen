import {
  clampStripView,
  MIN_STRIP_SECONDS,
  panStripView,
  revealInStrip,
  shotsInView,
  wholeStrip,
  zoomStripView,
} from "./stripView";

test("the whole video is the strip's widest view", () => {
  expect(wholeStrip(120)).toEqual({ from: 0, to: 120 });
  expect(wholeStrip(0)).toEqual({ from: 0, to: 1 });
  // A view as wide as the video is the same as showing all of it
  expect(clampStripView({ from: -10, to: 200 }, 120)).toBeNull();
  expect(clampStripView(null, 120)).toBeNull();
});

test("a view stays inside the video and no narrower than the minimum", () => {
  expect(clampStripView({ from: 110, to: 130 }, 120)).toEqual({
    from: 100,
    to: 120,
  });
  expect(clampStripView({ from: 50, to: 51 }, 120)).toEqual({
    from: 50,
    to: 50 + MIN_STRIP_SECONDS,
  });
});

test("zooming keeps the moment under the pointer still", () => {
  const zoomed = zoomStripView({ from: 0, to: 100 }, 25, 0.5, 100)!;
  expect(zoomed.to - zoomed.from).toBeCloseTo(50, 9);
  // 25 s was a quarter of the way across, and still is
  expect((25 - zoomed.from) / (zoomed.to - zoomed.from)).toBeCloseTo(0.25, 9);
  // Zooming right out shows everything
  expect(zoomStripView({ from: 0, to: 50 }, 10, 4, 100)).toBeNull();
});

test("sliding along stops at either end", () => {
  expect(panStripView({ from: 10, to: 30 }, 15, 100)).toEqual({
    from: 25,
    to: 45,
  });
  expect(panStripView({ from: 10, to: 30 }, -50, 100)).toEqual({
    from: 0,
    to: 20,
  });
  expect(panStripView({ from: 70, to: 90 }, 50, 100)).toEqual({
    from: 80,
    to: 100,
  });
});

test("revealing a shot only moves the view when the shot is out of sight", () => {
  const view = { from: 20, to: 40 };
  expect(revealInStrip(view, 25, 30, 100)).toBe(view);
  const later = revealInStrip(view, 50, 55, 100)!;
  expect(later.to).toBeGreaterThanOrEqual(55);
  expect(later.to - later.from).toBeCloseTo(20, 9);
  const earlier = revealInStrip(view, 5, 8, 100)!;
  expect(earlier.from).toBeLessThanOrEqual(5);
  expect(revealInStrip(null, 50, 55, 100)).toBeNull();
});

test("only the shots in view are found, quickly", () => {
  // A thousand ten-second shots
  const lengths = Array.from({ length: 1000 }, () => 10);
  const starts = lengths.map((_, i) => i * 10);
  expect(shotsInView(starts, lengths, { from: 0, to: 25 })).toEqual([0, 3]);
  expect(shotsInView(starts, lengths, { from: 4995, to: 5010 })).toEqual([
    499, 501,
  ]);
  expect(shotsInView(starts, lengths, { from: 9990, to: 10000 })).toEqual([
    999, 1000,
  ]);
  expect(shotsInView([], [], { from: 0, to: 10 })).toEqual([0, 0]);
});

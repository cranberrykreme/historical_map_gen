import { croppedViewBox, mapToSvg, svgLayout, visibleRect } from "./mapPicture";

const box = { x: 0, y: 0, width: 1000, height: 500 };

test("a map with a viewBox keeps its shape, centred in its box", () => {
  // A 200 x 200 drawing in a 1000 x 500 box: 2.5x, with 250 to spare either side
  const layout = svgLayout({ viewBox: "0 0 200 200" }, box);
  expect(layout).toEqual({
    viewBox: { x: 0, y: 0, width: 200, height: 200 },
    fit: "meet",
  });
  expect(mapToSvg(layout, box, 250, 0)).toEqual({ x: 0, y: 0 });
  expect(mapToSvg(layout, box, 750, 500)).toEqual({ x: 200, y: 200 });
});

test("a map that stretches, or has no viewBox, maps straight across", () => {
  const stretched = svgLayout(
    { viewBox: "10 20 100 50", preserveAspectRatio: "none" },
    box
  );
  expect(mapToSvg(stretched, box, 500, 250)).toEqual({ x: 60, y: 45 });

  const plain = svgLayout({ width: "1000px", height: "500" }, box);
  expect(plain).toEqual({
    viewBox: { x: 0, y: 0, width: 1000, height: 500 },
    fit: "none",
  });
  expect(mapToSvg(plain, box, 123, 45)).toEqual({ x: 123, y: 45 });

  // Percentages say nothing about its own units: the box does
  expect(svgLayout({ width: "100%" }, box).viewBox.width).toBe(1000);
});

test("a frame shows the camera's view at the frame's shape", () => {
  expect(
    visibleRect({ centerX: 100, centerY: 50, height: 90 }, 1920, 1080)
  ).toEqual({
    x: 20,
    y: 5,
    width: 160,
    height: 90,
  });
});

test("the cropped viewBox draws exactly the part of the map in view", () => {
  const layout = svgLayout({ viewBox: "0 0 2000 1000" }, box); // half size in its box
  expect(
    croppedViewBox(layout, box, { x: 100, y: 50, width: 160, height: 90 })
  ).toEqual({ x: 200, y: 100, width: 320, height: 180 });
});

import {
  applyMapTransform,
  MAP_SCALE_VAR,
  mapPlaceOf,
  screenPx,
  watchMapPlace,
  zoomLevel,
} from "./mapTransform";

test("the map's transform and zoom variable are set together", () => {
  const map = document.createElement("div");
  applyMapTransform(map, 10, -20.5, 2.5);
  expect(map.style.transform).toBe("translate(10px, -20.5px) scale(2.5)");
  expect(map.style.getPropertyValue(MAP_SCALE_VAR)).toBe("2.5");
  expect(() => applyMapTransform(null, 0, 0, 1)).not.toThrow();
});

test("a screen length divides by the map's zoom", () => {
  expect(screenPx(6)).toBe("calc(6px / var(--map-scale, 1))");
});

test("the zoom level only changes when the zoom doubles or halves", () => {
  expect(zoomLevel(1)).toBe(1);
  expect(zoomLevel(1.3)).toBe(1);
  expect(zoomLevel(1.5)).toBe(2);
  expect(zoomLevel(2.7)).toBe(2);
  expect(zoomLevel(0.4)).toBe(0.5);
  expect(zoomLevel(0)).toBe(1);
});

test("watchers hear each move of the map, and where it is can be asked", () => {
  const map = document.createElement("div");
  expect(mapPlaceOf(map)).toEqual({ x: 0, y: 0, scale: 1 });
  const heard: unknown[] = [];
  const stop = watchMapPlace(map, (place) => heard.push(place));
  applyMapTransform(map, 5, 6, 2);
  expect(heard).toEqual([{ x: 5, y: 6, scale: 2 }]);
  expect(mapPlaceOf(map)).toEqual({ x: 5, y: 6, scale: 2 });
  stop();
  applyMapTransform(map, 1, 1, 1);
  expect(heard).toHaveLength(1);
});

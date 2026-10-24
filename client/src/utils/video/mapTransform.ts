// The map's pan and zoom, set on the map element in one go: the CSS transform, plus the zoom
// as the --map-scale variable. Things drawn a constant size on screen (path dots, rings,
// chevrons, line widths) read the variable, so they shrink in the same frame the map zooms
// rather than a frame late, which made them tremble while zooming.
export const MAP_SCALE_VAR = "--map-scale";

// Where the map is: its top left corner on screen, in pixels from the map area's corner, and
// its zoom
export interface MapPlace {
  x: number;
  y: number;
  scale: number;
}

type PlaceListener = (place: MapPlace) => void;

// The last place set on each map element, and who wants to know when it changes (the canvas
// the units are drawn on redraws in the same moment the map moves)
const places = new WeakMap<HTMLElement, MapPlace>();
const listeners = new WeakMap<HTMLElement, Set<PlaceListener>>();

export function applyMapTransform(
  element: HTMLElement | null,
  x: number,
  y: number,
  scale: number
): void {
  if (!element) return;
  element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  element.style.setProperty(MAP_SCALE_VAR, String(scale));
  const place = { x, y, scale };
  places.set(element, place);
  listeners.get(element)?.forEach((listener) => listener(place));
}

// Where the map element was last put (the start, before it's moved at all)
export const mapPlaceOf = (element: HTMLElement): MapPlace =>
  places.get(element) ?? { x: 0, y: 0, scale: 1 };

// Calls `listener` each time the map element moves or zooms; returns how to stop
export function watchMapPlace(
  element: HTMLElement,
  listener: PlaceListener
): () => void {
  let set = listeners.get(element);
  if (!set) {
    set = new Set();
    listeners.set(element, set);
  }
  set.add(listener);
  return () => {
    listeners.get(element)?.delete(listener);
  };
}

// A length in CSS that stays the same number of screen pixels at any zoom
export const screenPx = (pixels: number): string =>
  `calc(${pixels}px / var(${MAP_SCALE_VAR}, 1))`;

// The zoom rounded to the nearest power of two. Path chevrons are spaced by this rather than
// the exact zoom, so they hold still on the path while you zoom and only thin out or fill in
// when the zoom doubles or halves.
export const zoomLevel = (scale: number): number =>
  scale > 0 ? 2 ** Math.round(Math.log2(scale)) : 1;

// The map's pan and zoom, set on the map element in one go: the CSS transform, plus the zoom
// as the --map-scale variable. Things drawn a constant size on screen (path dots, rings,
// chevrons, line widths) read the variable, so they shrink in the same frame the map zooms
// rather than a frame late, which made them tremble while zooming.
export const MAP_SCALE_VAR = "--map-scale";

export function applyMapTransform(
  element: HTMLElement | null,
  x: number,
  y: number,
  scale: number
): void {
  if (!element) return;
  element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  element.style.setProperty(MAP_SCALE_VAR, String(scale));
}

// A length in CSS that stays the same number of screen pixels at any zoom
export const screenPx = (pixels: number): string =>
  `calc(${pixels}px / var(${MAP_SCALE_VAR}, 1))`;

// The zoom rounded to the nearest power of two. Path chevrons are spaced by this rather than
// the exact zoom, so they hold still on the path while you zoom and only thin out or fill in
// when the zoom doubles or halves.
export const zoomLevel = (scale: number): number =>
  scale > 0 ? 2 ** Math.round(Math.log2(scale)) : 1;

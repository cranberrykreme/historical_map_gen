// Where the selection card sits. It starts at the map's left edge under the date (or under
// the terrain tools' hint, when that's showing), and can be dragged anywhere on screen.

export interface CardPosition {
  x: number;
  y: number;
}

export const CARD_LEFT = 16; // px: the map's left margin
export const CARD_TOP = 88; // px: below the date in the top left corner
const GAP = 12; // px kept clear above the timeline and under the hint
const MIN_HEIGHT = 160; // px: the card never gets shorter than this
const KEEP_VISIBLE = 80; // px of the card's header that always stays on screen

// The card's spot before it's been dragged: under the date, or under the hint if it reaches
// further down
export function defaultCardTop(hintBottom: number | null): number {
  return hintBottom === null ? CARD_TOP : Math.max(CARD_TOP, hintBottom + GAP);
}

// Keeps enough of the card's header on screen to grab it again
export function clampCardPosition(
  position: CardPosition,
  windowWidth: number,
  windowHeight: number
): CardPosition {
  return {
    x: Math.round(
      Math.min(Math.max(position.x, 0), Math.max(0, windowWidth - KEEP_VISIBLE))
    ),
    y: Math.round(
      Math.min(Math.max(position.y, 0), Math.max(0, windowHeight - 40))
    ),
  };
}

// How tall the card may grow: down to the timeline when it sits above it, otherwise down to
// the window's bottom
export function cardMaxHeight(
  top: number,
  timelineTop: number | null,
  windowHeight: number
): number {
  const bottom =
    timelineTop !== null && top + MIN_HEIGHT <= timelineTop - GAP
      ? timelineTop
      : windowHeight;
  return Math.max(bottom - top - GAP, MIN_HEIGHT);
}

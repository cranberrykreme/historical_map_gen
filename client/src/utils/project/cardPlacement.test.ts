import {
  CARD_TOP,
  cardMaxHeight,
  clampCardPosition,
  defaultCardTop,
} from "./cardPlacement";

describe("defaultCardTop", () => {
  it("sits under the date when no hint is showing", () => {
    expect(defaultCardTop(null)).toBe(CARD_TOP);
  });

  it("moves under the hint when the hint reaches further down", () => {
    expect(defaultCardTop(150)).toBe(162);
  });

  it("stays under the date when the hint ends above it", () => {
    expect(defaultCardTop(40)).toBe(CARD_TOP);
  });
});

describe("clampCardPosition", () => {
  it("leaves a position on screen alone", () => {
    expect(clampCardPosition({ x: 200, y: 300 }, 1200, 800)).toEqual({
      x: 200,
      y: 300,
    });
  });

  it("keeps the header on screen when dragged off an edge", () => {
    expect(clampCardPosition({ x: -50, y: -20 }, 1200, 800)).toEqual({
      x: 0,
      y: 0,
    });
    expect(clampCardPosition({ x: 1500, y: 900 }, 1200, 800)).toEqual({
      x: 1120,
      y: 760,
    });
  });
});

describe("cardMaxHeight", () => {
  it("stops above the timeline when the card is above it", () => {
    expect(cardMaxHeight(88, 600, 800)).toBe(500);
  });

  it("reaches the window's bottom when there is no timeline", () => {
    expect(cardMaxHeight(88, null, 800)).toBe(700);
  });

  it("reaches the window's bottom when dragged down over the timeline", () => {
    expect(cardMaxHeight(500, 600, 800)).toBe(288);
  });

  it("never gets shorter than the smallest useful height", () => {
    expect(cardMaxHeight(780, null, 800)).toBe(160);
  });
});

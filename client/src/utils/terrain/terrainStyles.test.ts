import { Battle, TerrainFeature, TerrainStyle } from "../../types";
import { GROUND_COLOUR, TERRAIN_PATTERNS, TerrainStroke } from "./terrain";
import { battleStrokes, styleBattle, terrainSvg } from "./terrainScene";
import {
  isTerrainStyle,
  STYLE_SAMPLE,
  styleColour,
  styleGround,
  styleInfo,
  styleOverlay,
  stylePatterns,
  styleStrokes,
  TERRAIN_STYLES,
} from "./terrainStyles";

const hexToRgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const brightness = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const hill: TerrainFeature = {
  id: "h",
  kind: "hill",
  points: [
    { x: 100, y: 100 },
    { x: 300, y: 90 },
    { x: 320, y: 260 },
    { x: 120, y: 280 },
  ],
};
const ridge: TerrainFeature = {
  id: "r",
  kind: "ridge",
  points: [
    { x: 400, y: 100 },
    { x: 600, y: 140 },
  ],
};
const FOREST = "#3f6b25";
const GRASS = GROUND_COLOUR.land;

test("every style has a name and a hint, and styles are told apart from anything else", () => {
  const ids = TERRAIN_STYLES.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toEqual(
    expect.arrayContaining([
      "painted",
      "autumn",
      "winter",
      "arid",
      "night",
      "parchment",
      "ink",
      "textbook",
    ])
  );
  for (const s of TERRAIN_STYLES) {
    expect(s.label).toBeTruthy();
    expect(s.hint).toBeTruthy();
  }
  expect(isTerrainStyle("parchment")).toBe(true);
  expect(isTerrainStyle("watercolour")).toBe(false);
  expect(isTerrainStyle(undefined)).toBe(false);
  expect(styleInfo().id).toBe("painted");
  expect(styleInfo("night").label).toBe("Night");
});

test("painted leaves every colour as it is; others turn hex colours into hex colours", () => {
  expect(styleColour(FOREST, "painted")).toBe(FOREST);
  expect(styleColour(FOREST)).toBe(FOREST);
  for (const { id } of TERRAIN_STYLES) {
    expect(styleColour(FOREST, id)).toMatch(/^#[0-9a-f]{6}$/);
    expect(styleColour("#fff", id)).toMatch(/^#[0-9a-f]{3}([0-9a-f]{3})?$/);
    // fills that aren't colours are left alone
    expect(styleColour("none", id)).toBe("none");
    expect(styleColour("pattern:sand", id)).toBe("pattern:sand");
  }
});

test("each style recolours the way it says", () => {
  // autumn: green leaves turn orange-brown (red above green)
  const [r, g] = hexToRgb(styleColour(FOREST, "autumn"));
  expect(r).toBeGreaterThan(g);
  // night: everything darker
  for (const c of [FOREST, GRASS, "#5b9bd5", "#cbbf9f"])
    expect(brightness(styleColour(c, "night"))).toBeLessThan(brightness(c));
  // parchment: browns, the red above the green above the blue
  const [pr, pg, pb] = hexToRgb(styleColour(GRASS, "parchment"));
  expect(pr).toBeGreaterThanOrEqual(pg);
  expect(pg).toBeGreaterThanOrEqual(pb);
  // ink: near white grass, dark trees
  expect(brightness(styleColour(GRASS, "ink"))).toBeGreaterThan(0.85);
  expect(brightness(styleColour(FOREST, "ink"))).toBeLessThan(0.75);
  // winter: grass paler and greyer
  expect(brightness(styleColour(GRASS, "winter"))).toBeGreaterThan(
    brightness(GRASS)
  );
  // arid: water goes turquoise (more green in it than before)
  const [, wg] = hexToRgb(styleColour("#5b9bd5", "arid"));
  expect(wg).toBeGreaterThan(0x9b);
});

test("light and shadow stay as they are in the coloured styles", () => {
  expect(styleColour("#ffffff", "autumn")).toBe("#ffffff");
  expect(styleColour("#000", "night")).toBe("#000");
  // but turn to paper and ink in an old map
  expect(styleColour("#ffffff", "parchment")).not.toBe("#ffffff");
});

test("the ground takes the style", () => {
  expect(styleGround("land")).toBe(GRASS);
  expect(styleGround("sea", "night")).toBe(
    styleColour(GROUND_COLOUR.sea, "night")
  );
});

test("strokes are recoloured, use the style's patterns, and flat styles drop the shading", () => {
  const strokes: TerrainStroke[] = [
    { d: "M0 0", fill: FOREST, stroke: "#34591f", width: 2 },
    { d: "M1 1", fill: "pattern:field" },
    { d: "M2 2", fill: "pattern:shade", shading: true },
  ];
  expect(styleStrokes(strokes, "painted")).toBe(strokes);
  const autumn = styleStrokes(strokes, "autumn");
  expect(autumn).toHaveLength(3);
  expect(autumn[0].fill).toBe(styleColour(FOREST, "autumn"));
  expect(autumn[0].stroke).toBe(styleColour("#34591f", "autumn"));
  expect(autumn[0].width).toBe(2);
  expect(autumn[1].fill).toBe("pattern:autumn-field");
  const textbook = styleStrokes(strokes, "textbook");
  expect(textbook).toHaveLength(2);
  expect(textbook.some((s) => s.shading)).toBe(false);
});

test("each style has its own patterns, recoloured", () => {
  expect(stylePatterns()).toBe(TERRAIN_PATTERNS);
  const parchment = stylePatterns("parchment");
  expect(parchment).toContain('id="tp-parchment-field"');
  expect(parchment).not.toContain('id="tp-field"');
  expect(parchment).toContain('id="tp-parchment-paper"');
  expect(parchment).toContain('id="tp-parchment-vignette"');
  // the field's stripes are no longer their painted colour
  expect(parchment).not.toContain("#a9a55e");
  expect(stylePatterns("autumn")).not.toContain("tp-autumn-paper");
});

test("old maps draw hachures on high ground, textbook maps contours", () => {
  const features = [hill, ridge];
  const parchment = styleOverlay(features, 800, 600, "parchment");
  // a hill's hachures stay inside the hill
  expect(parchment.some((s) => s.clip && s.stroke && s.d.length > 100)).toBe(
    true
  );
  expect(parchment.some((s) => s.fill === "pattern:parchment-paper")).toBe(
    true
  );
  const textbook = styleOverlay(features, 800, 600, "textbook");
  expect(textbook.length).toBeGreaterThanOrEqual(3); // rings, summit, ridge loops
  expect(textbook.some((s) => s.fill && !s.fill.startsWith("pattern:"))).toBe(
    true
  ); // the mark on the top
  expect(styleOverlay(features, 800, 600, "autumn")).toEqual([]);
  expect(styleOverlay(features, 800, 600, "night")).toEqual([
    { d: "M0 0H800V600H0Z", fill: "pattern:night-vignette" },
  ]);
  expect(styleOverlay(features, 800, 600, "painted")).toEqual([]);
});

test("a styled battlefield is the plain one recoloured with the overlay on top", () => {
  const plain = battleStrokes([hill, ridge], "land", 800, 600);
  expect(styleBattle(plain, [hill, ridge], 800, 600)).toBe(plain);
  const ink = styleBattle(plain, [hill, ridge], 800, 600, "ink");
  expect(ink.length).toBeGreaterThan(plain.filter((s) => !s.shading).length);
});

test("the battleground the renderer draws is in the battle's style", () => {
  const battle = (style?: TerrainStyle): Battle => ({
    id: "b",
    name: "Hastings",
    kind: "land",
    width: 800,
    height: 600,
    terrain: [hill],
    style,
  });
  const painted = terrainSvg(battle());
  expect(painted).toContain(`fill="${GRASS}"`);
  const textbook = terrainSvg(battle("textbook"));
  expect(textbook).toContain('id="tp-textbook-field"');
  expect(textbook).toContain(`fill="${styleGround("land", "textbook")}"`);
  expect(textbook).not.toContain("url(#tp-shade)");
});

test("the picker's sample has a bit of everything", () => {
  const kinds = new Set(STYLE_SAMPLE.map((f) => f.kind));
  for (const kind of ["hill", "forest", "river", "road", "town", "lake"])
    expect(kinds.has(kind as TerrainFeature["kind"])).toBe(true);
});

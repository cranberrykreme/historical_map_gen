import { FormationBlock } from "../types";
import {
  blockHandles,
  blockLabel,
  blockOutline,
  blockSymbol,
  blockUnit,
  dragBlockHandle,
  newBlockSpec,
  tidyBlock,
  unitLabel,
} from "./blocks";

const block = (patch: Partial<FormationBlock> = {}): FormationBlock =>
  newBlockSpec({ width: 200, depth: 60, ...patch });

test("a block's sizes are kept in range, a near-straight bend snaps straight, and blank text goes", () => {
  const tidy = tidyBlock({
    kind: "foot",
    colour: "red",
    width: 5,
    depth: 9999,
    bend: 2,
    name: "  ",
    size: " c. 500 ",
  });
  expect(tidy.width).toBe(20);
  expect(tidy.depth).toBe(400);
  expect(tidy.bend).toBeUndefined();
  expect(tidy.name).toBeUndefined();
  expect(tidy.size).toBe("c. 500");
  // a bend can't bow more than half the width
  expect(tidyBlock(block({ bend: 500 })).bend).toBe(100);
});

test("a placed block is a unit facing up, at scale 1, that lists by its name", () => {
  const unit = blockUnit(block({ name: "Housecarls" }), 100, 200);
  expect(unit).toMatchObject({
    x: 100,
    y: 200,
    rotation: 0,
    scale: 1,
    assetType: "units",
  });
  expect(unit.forwardAngle).toBeUndefined(); // faces up, the default
  expect(unitLabel(unit)).toBe("Housecarls");
  expect(unitLabel(blockUnit(block({ kind: "horse" }), 0, 0))).toBe(
    "Horse block"
  );
  expect(
    unitLabel({ ...unit, block: undefined, filename: "Army_Red1.png" })
  ).toBe("Army_Red1");
});

test("the outline runs round the block, its front bowed by the bend", () => {
  const straight = blockOutline(block());
  expect(straight[0]).toEqual({ op: "move", to: { x: -100, y: -30 } });
  expect(straight[1]).toMatchObject({
    op: "curve",
    control: { x: 0, y: -30 },
    to: { x: 100, y: -30 },
  });
  // bent forward by 20: the curve's middle is 20 further forward, so its control point is 40
  const bent = blockOutline(block({ bend: 20 }));
  expect(bent[1]).toMatchObject({ control: { x: 0, y: -70 } });
  expect(blockHandles(block({ bend: 20 })).front).toEqual({ x: 0, y: -50 });
  expect(blockHandles(block({ bend: 20 })).back).toEqual({ x: 0, y: 10 });
});

test("each kind has its symbol: a cross, a diagonal, a row of dots, or nothing", () => {
  expect(blockSymbol(block({ kind: "foot" })).lines).toHaveLength(2);
  const horse = blockSymbol(block({ kind: "horse" }));
  expect(horse.lines).toHaveLength(1);
  // from the back left to the front right
  expect(horse.lines[0][0]).toEqual({ x: -100, y: 30 });
  expect(horse.lines[0][horse.lines[0].length - 1]).toEqual({ x: 100, y: -30 });
  const archers = blockSymbol(block({ kind: "archers" }));
  expect(archers.dots.length).toBeGreaterThan(5);
  expect(archers.dots.every((d) => d.y < 0)).toBe(true); // along the front
  expect(blockSymbol(block({ kind: "plain" }))).toEqual({
    lines: [],
    dots: [],
  });
  // the cross follows a bend, staying inside the block
  const bent = blockSymbol(block({ kind: "foot", bend: 60 }));
  for (const p of bent.lines.flat()) {
    const curve = 60 * (1 - ((2 * p.x) / 200) ** 2);
    expect(p.y).toBeGreaterThanOrEqual(-30 - curve - 0.01);
    expect(p.y).toBeLessThanOrEqual(30 - curve + 0.01);
  }
});

test("the label fits inside, on two lines when there's room, and never reads upside down", () => {
  expect(blockLabel(block(), 0)).toBeNull();
  const two = blockLabel(
    block({ name: "Breton cavalry", size: "c. 2,000" }),
    0
  )!;
  expect(two.lines.map((l) => l.text)).toEqual(["Breton cavalry", "c. 2,000"]);
  expect(two.lines[0].size).toBeGreaterThan(two.lines[1].size);
  expect(two.lines[0].size * 2.25).toBeLessThanOrEqual(60 * 0.86 + 0.01);
  expect(two.flip).toBe(false);
  expect(blockLabel(block({ name: "Fyrd" }), 170)!.flip).toBe(true);
  expect(blockLabel(block({ name: "Fyrd" }), -95)!.flip).toBe(true);
  expect(blockLabel(block({ name: "Fyrd" }), 80)!.flip).toBe(false);
  // a long thin line of men: the name goes behind it
  const thin = blockLabel(
    block({ depth: 8, width: 300, name: "Shield wall" }),
    0
  )!;
  expect(thin.y).toBeGreaterThan(4);
});

test("dragging the handles widens, deepens and bends the block", () => {
  const b = block();
  expect(dragBlockHandle(b, "right", { x: 150, y: 3 }).width).toBe(300);
  expect(dragBlockHandle(b, "left", { x: -50, y: 0 }).width).toBe(100);
  expect(dragBlockHandle(b, "back", { x: 0, y: 45 }).depth).toBe(90);
  expect(dragBlockHandle(b, "front", { x: 0, y: -70 }).bend).toBe(40);
  expect(dragBlockHandle(b, "front", { x: 0, y: -10 }).bend).toBe(-20);
  // dragged back to the edge, it's straight again
  expect(
    dragBlockHandle(block({ bend: 40 }), "front", { x: 0, y: -31 }).bend
  ).toBeUndefined();
  // the back handle allows for the bend
  expect(
    dragBlockHandle(block({ bend: 20 }), "back", { x: 0, y: 10 }).depth
  ).toBe(60);
});

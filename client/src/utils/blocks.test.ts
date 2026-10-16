import { FormationBlock } from "../types";
import {
  blockStrength,
  sizeAtStrength,
  thinnedBlock,
  unitAt,
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

test("losses thin a block steadily from the back and count down its size", () => {
  const b = block({
    size: "c. 2,000",
    losses: [{ start: 10, end: 20, share: 0.4 }],
  });
  expect(blockStrength(b, 5)).toBe(1);
  expect(blockStrength(b, 15)).toBeCloseTo(0.8, 5);
  expect(blockStrength(b, 30)).toBeCloseTo(0.6, 5);
  expect(thinnedBlock(b, 5)).toBeNull();
  const thin = thinnedBlock(b, 30)!;
  expect(thin.block.depth).toBeCloseTo(36, 5);
  expect(thin.forward).toBeCloseTo(12, 5); // its front stays put
  expect(thin.block.size).toBe("c. 1,200");
  // a block facing right (turned 90°) moves its middle right, towards its front
  const moved = unitAt({ x: 0, y: 0, rotation: 90, scale: 1, block: b }, 30);
  expect(moved.x).toBeCloseTo(12, 5);
  expect(moved.y).toBeCloseTo(0, 5);
});

test("sizes count down the way troop numbers are rounded, and losses are kept sensible", () => {
  expect(sizeAtStrength("c. 2,000", 0.63)).toBe("c. 1,250");
  expect(sizeAtStrength("800 men", 0.5)).toBe("400 men");
  expect(sizeAtStrength("Many", 0.5)).toBe("Many");
  // backwards dates are turned round, and all together they never take more than 95%
  const tidy = tidyBlock(
    block({
      losses: [
        { start: 20, end: 10, share: 0.8 },
        { start: 5, end: 6, share: 0.8 },
      ],
    })
  );
  expect(tidy.losses![0]).toMatchObject({ start: 5, end: 6 });
  expect(tidy.losses![1]).toMatchObject({ start: 10, end: 20 });
  expect(tidy.losses!.reduce((sum, l) => sum + l.share, 0)).toBeLessThanOrEqual(
    0.95
  );
  expect(tidyBlock(block({ losses: [] })).losses).toBeUndefined();
});

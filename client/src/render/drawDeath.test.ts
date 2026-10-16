import { drawFrame, FrameContext } from "./drawFrame";
import { sceneAt, SceneInput } from "./scene";
import { createTimeline } from "../utils/timeline";
import { blockUnit, newBlockSpec } from "../utils/blocks";
import { Unit } from "../types";

// A drawing surface that writes down everything drawn on it
function recorder() {
  const calls: {
    op: string;
    args: unknown[];
    alpha: number;
    fill: unknown;
    stroke: unknown;
  }[] = [];
  const ctx: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    globalAlpha: 1,
    font: "",
    textBaseline: "alphabetic",
    textAlign: "start",
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
  };
  for (const op of [
    "save",
    "restore",
    "setTransform",
    "translate",
    "rotate",
    "scale",
    "fillRect",
    "drawImage",
    "fillText",
    "strokeText",
    "beginPath",
    "moveTo",
    "lineTo",
    "quadraticCurveTo",
    "arc",
    "arcTo",
    "closePath",
    "rect",
    "clip",
    "fill",
    "stroke",
  ]) {
    ctx[op] = (...args: unknown[]) =>
      calls.push({
        op,
        args,
        alpha: ctx.globalAlpha as number,
        fill: ctx.fillStyle,
        stroke: ctx.strokeStyle,
      });
  }
  ctx.measureText = (text: string) => ({ width: text.length * 10 });
  return { ctx: ctx as unknown as FrameContext, calls };
}

// A block that dies on day 105, in a 10 second shot of days 100 to 110 (so at 5 seconds in)
function input(patch: Partial<Unit>): SceneInput {
  const unit: Unit = {
    ...blockUnit(newBlockSpec({ name: "Fyrd" }), 0, 0, "b1"),
    leaves: 105,
    ...patch,
  };
  return {
    shots: [{ id: "s", name: "s", seconds: 10, from: 100, to: 110 }],
    units: [unit],
    timeline: createTimeline([], [unit]),
    storyStart: 90,
    displayMode: "days",
    opening: { centerX: 0, centerY: 0, height: 500 },
  };
}

const draw = (scene: ReturnType<typeof sceneAt>) => {
  const r = recorder();
  drawFrame(
    r.ctx,
    scene,
    { map: null, unitImages: new Map() },
    1920,
    1080,
    null
  );
  return r.calls;
};

test("a dying block is drawn in pieces, clipped and fading, until its animation is over", () => {
  const exit = { style: "shatter" as const, seconds: 2 };
  const before = sceneAt(input({ exit }), 4);
  expect(before.units[0].exit).toBeUndefined();
  const during = sceneAt(input({ exit }), 6); // 1 second into 2
  expect(during.units).toHaveLength(1);
  expect(during.units[0].exit!.pieces).toHaveLength(18);
  const calls = draw(during);
  expect(calls.filter((c) => c.op === "clip")).toHaveLength(18);
  expect(calls.some((c) => c.op === "fill" && c.alpha < 1 && c.alpha > 0)).toBe(
    true
  );
  expect(sceneAt(input({ exit }), 7.5).units).toHaveLength(0);
});

test("a unit with no leaving animation simply vanishes; a marker is left where one fell", () => {
  expect(sceneAt(input({}), 5.5).units).toHaveLength(0);
  const scene = sceneAt(input({ exit: { style: "fade", marker: "patch" } }), 9);
  expect(scene.markers).toHaveLength(1);
  const calls = draw(scene);
  expect(
    calls.some((c) => c.op === "fill" && c.fill === "rgba(48, 32, 20, 0.38)")
  ).toBe(true);
});

test("a thinning block is drawn shallower, with its size counted down", () => {
  const scene = sceneAt(
    input({
      leaves: undefined,
      block: newBlockSpec({
        size: "c. 1,000",
        losses: [{ start: 100, end: 110, share: 0.5 }],
      }),
    }),
    10
  );
  expect(scene.units[0].block!.depth).toBeCloseTo(25, 5);
  expect(scene.units[0].block!.size).toBe("c. 500");
  // its front stays where it was: the middle moves up towards it (the block faces up)
  expect(scene.units[0].y).toBeCloseTo(-12.5, 5);
  const texts = draw(scene)
    .filter((c) => c.op === "fillText")
    .map((c) => c.args[0]);
  expect(texts).toContain("c. 500");
});

test("a sinking unit's ripple rings are thick enough to see: 5% of its picture's width", () => {
  const scene = sceneAt(input({ exit: { style: "sink", seconds: 2 } }), 6);
  const r = recorder();
  const ringWidths: number[] = [];
  const stroke = r.ctx.stroke.bind(r.ctx);
  (r.ctx as unknown as { stroke: () => void }).stroke = () => {
    if (r.ctx.strokeStyle === "rgba(235, 245, 255, 1)")
      ringWidths.push(r.ctx.lineWidth as number);
    stroke();
  };
  drawFrame(
    r.ctx,
    scene,
    { map: null, unitImages: new Map() },
    1920,
    1080,
    null
  );
  expect(ringWidths.length).toBeGreaterThan(0);
  // the picture's box is a little wider than the block itself, for its outline
  const blockWidth = scene.units[0].block!.width;
  for (const w of ringWidths) {
    expect(w).toBeGreaterThanOrEqual(0.05 * blockWidth);
    expect(w).toBeLessThan(0.06 * blockWidth);
  }
});

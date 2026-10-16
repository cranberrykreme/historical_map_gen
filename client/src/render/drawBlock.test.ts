import { drawFrame, FrameContext } from "./drawFrame";
import { Scene } from "./scene";
import { newBlockSpec } from "../utils/blocks";

// A drawing surface that writes down everything drawn on it
function recorder() {
  const calls: {
    op: string;
    args: unknown[];
    fill?: unknown;
    stroke?: unknown;
    font?: unknown;
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
        fill: ctx.fillStyle,
        stroke: ctx.strokeStyle,
        font: ctx.font,
      });
  }
  ctx.measureText = (text: string) => ({ width: text.length * 10 });
  return { ctx: ctx as unknown as FrameContext, calls };
}

const sceneWith = (rotation: number, bend = 0): Scene => ({
  view: { centerX: 0, centerY: 0, height: 1000 },
  units: [
    {
      id: "b",
      assetType: "units",
      path: "",
      x: 10,
      y: 20,
      rotation,
      scale: 1,
      flipped: false,
      block: newBlockSpec({
        kind: "foot",
        colour: "blue",
        name: "Fyrd",
        size: "c. 800",
        bend,
      }),
    },
  ],
  date: null,
  darkness: 0,
});

test("a block is drawn as a shape in its colour, with its symbol and name, not as a picture", () => {
  const { ctx, calls } = recorder();
  drawFrame(
    ctx,
    sceneWith(0),
    { map: null, unitImages: new Map() },
    1920,
    1080,
    null
  );
  expect(calls.some((c) => c.op === "drawImage")).toBe(false);
  expect(calls.some((c) => c.op === "fill" && c.fill === "#3b6fc0")).toBe(true);
  expect(
    calls.filter((c) => c.op === "quadraticCurveTo").length
  ).toBeGreaterThanOrEqual(3);
  const texts = calls.filter((c) => c.op === "fillText").map((c) => c.args[0]);
  expect(texts).toEqual(["Fyrd", "c. 800"]);
  // each line with a dark halo first
  expect(calls.filter((c) => c.op === "strokeText")).toHaveLength(2);
});

test("a block turned past a quarter turn has its name turned back the right way up", () => {
  const upright = recorder();
  drawFrame(
    upright.ctx,
    sceneWith(30),
    { map: null, unitImages: new Map() },
    1920,
    1080,
    null
  );
  const flipped = recorder();
  drawFrame(
    flipped.ctx,
    sceneWith(150),
    { map: null, unitImages: new Map() },
    1920,
    1080,
    null
  );
  const halfTurns = (calls: { op: string; args: unknown[] }[]) =>
    calls.filter(
      (c) =>
        c.op === "rotate" && Math.abs((c.args[0] as number) - Math.PI) < 1e-9
    ).length;
  expect(halfTurns(upright.calls)).toBe(0);
  expect(halfTurns(flipped.calls)).toBe(1);
});

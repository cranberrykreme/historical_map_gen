import {
  DateStyle,
  drawBlend,
  drawFrame,
  drawMapLayer,
  FrameContext,
  OUTSIDE_MAP,
  UNIT_WIDTH,
  wholeMapView,
  wipeRect,
} from "./drawFrame";
import { Scene } from "./scene";

// A drawing surface that writes down everything drawn on it
function recorder() {
  const calls: {
    op: string;
    args: unknown[];
    fill?: unknown;
    alpha?: unknown;
  }[] = [];
  const ctx: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
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
    "beginPath",
    "moveTo",
    "arcTo",
    "closePath",
    "rect",
    "clip",
    "fill",
    "stroke",
  ]) {
    ctx[op] = (...args: unknown[]) =>
      calls.push({ op, args, fill: ctx.fillStyle, alpha: ctx.globalAlpha });
  }
  ctx.measureText = (text: string) => ({ width: text.length * 10 });
  return { ctx: ctx as unknown as FrameContext, calls };
}

const style: DateStyle = {
  font: "28px serif",
  fontSize: 28,
  letterSpacing: 1,
  color: "gold",
  background: "purple",
  border: "brown",
  radius: 8,
  padX: 24,
  padY: 8,
  margin: 16,
};

const blank: Scene = { view: null, units: [], date: null, darkness: 0 };

test("the frame starts grey, the colour beyond the map", () => {
  const { ctx, calls } = recorder();
  drawFrame(ctx, blank, { map: null, unitImages: new Map() }, 1920, 1080, null);
  expect(calls.find((c) => c.op === "fillRect")).toMatchObject({
    args: [0, 0, 1920, 1080],
    fill: OUTSIDE_MAP,
  });
});

test("the camera puts its view's centre in the middle of the frame, at its zoom", () => {
  const { ctx, calls } = recorder();
  const scene: Scene = {
    ...blank,
    view: { centerX: 100, centerY: 50, height: 540 },
  };
  drawFrame(ctx, scene, { map: null, unitImages: new Map() }, 1920, 1080, null);
  // 540 map units fill 1080 pixels: twice the size, with (100, 50) at (960, 540)
  expect(calls.find((c) => c.op === "translate")?.args).toEqual([760, 440]);
  expect(calls.find((c) => c.op === "scale")?.args).toEqual([2, 2]);
});

test("a unit is centred on its spot, turned, sized and mirrored like the editor's", () => {
  const { ctx, calls } = recorder();
  const image = {} as CanvasImageSource;
  const scene: Scene = {
    ...blank,
    view: { centerX: 0, centerY: 0, height: 1080 },
    units: [
      {
        id: "a",
        assetType: "units",
        path: "a.png",
        x: 5,
        y: 6,
        rotation: 90,
        scale: 2,
        flipped: true,
      },
    ],
  };
  drawFrame(
    ctx,
    scene,
    {
      map: null,
      unitImages: new Map([["units/a.png", { image, aspect: 0.5 }]]),
    },
    1920,
    1080,
    null
  );
  const ops = calls.map((c) => c.op);
  const from = ops.lastIndexOf("translate");
  expect(calls[from].args).toEqual([5, 6]);
  expect(calls[from + 1]).toMatchObject({ op: "rotate", args: [Math.PI / 2] });
  expect(calls[from + 2]).toMatchObject({ op: "scale", args: [2, 2] });
  expect(calls[from + 3]).toMatchObject({ op: "scale", args: [-1, 1] });
  expect(calls[from + 4]).toMatchObject({
    op: "drawImage",
    args: [image, -UNIT_WIDTH / 2, -UNIT_WIDTH / 4, UNIT_WIDTH, UNIT_WIDTH / 2],
  });
});

test("a unit whose image hasn't loaded is skipped rather than breaking the frame", () => {
  const { ctx, calls } = recorder();
  const scene: Scene = {
    ...blank,
    view: { centerX: 0, centerY: 0, height: 1080 },
    units: [
      {
        id: "a",
        assetType: "units",
        path: "missing.png",
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        flipped: false,
      },
    ],
  };
  drawFrame(ctx, scene, { map: null, unitImages: new Map() }, 1920, 1080, null);
  expect(calls.some((c) => c.op === "drawImage")).toBe(false);
});

test("the map is drawn over its part of the view, with grey beyond its edges", () => {
  const { ctx, calls } = recorder();
  const image = {} as CanvasImageSource;
  const scene: Scene = {
    ...blank,
    view: { centerX: 0, centerY: 0, height: 100 },
  };
  drawFrame(
    ctx,
    scene,
    {
      map: {
        image,
        x: -88,
        y: -50,
        width: 177,
        height: 100,
        bounds: { x: 0, y: 0, width: 1000, height: 800 },
      },
      unitImages: new Map(),
    },
    1920,
    1080,
    null
  );
  expect(calls.find((c) => c.op === "drawImage")?.args).toEqual([
    image,
    -88,
    -50,
    177,
    100,
  ]);
  const rects = calls.filter((c) => c.op === "rect");
  expect(rects[1].args).toEqual([0, 0, 1000, 800]);
  expect(calls.find((c) => c.op === "fill")).toMatchObject({
    args: ["evenodd"],
    fill: OUTSIDE_MAP,
  });
});

test("the date sits in the top left in the editor's style, and fades darken everything", () => {
  const { ctx, calls } = recorder();
  drawFrame(
    ctx,
    { ...blank, date: "14 October 1066", darkness: 0.25 },
    { map: null, unitImages: new Map() },
    1920,
    1080,
    style
  );
  // 15 characters at 10 px each, plus padding either side, starting 16 px in
  const width = 150 + 48;
  const height = 28 * 1.2 + 16;
  expect(calls.find((c) => c.op === "moveTo")?.args).toEqual([16 + 8, 16]);
  const corners = calls.filter((c) => c.op === "arcTo").map((c) => c.args);
  expect(corners[1]).toEqual([16 + width, 16 + height, 16, 16 + height, 8]);
  expect(calls.find((c) => c.op === "fillText")).toMatchObject({
    args: ["14 October 1066", 16 + 24, 16 + (28 * 1.2 + 16) / 2],
    fill: "gold",
  });
  const last = calls.filter((c) => c.op === "fillRect").pop()!;
  expect(last).toMatchObject({
    args: [0, 0, 1920, 1080],
    fill: "#000",
    alpha: 0.25,
  });
});

test("with no camera set at all, the whole map is shown", () => {
  expect(wholeMapView({ x: 0, y: 0, width: 1000, height: 800 })).toEqual({
    centerX: 500,
    centerY: 400,
    height: 840,
  });
  expect(wholeMapView(null)).toBeNull();
});

describe("blending two shots", () => {
  const incoming = { tag: "new shot" } as unknown as CanvasImageSource;

  test("a wipe uncovers the new shot from the side it comes in", () => {
    expect(wipeRect("left", 0.25, 1920, 1080)).toEqual({
      x: 1440,
      y: 0,
      width: 480,
      height: 1080,
    });
    expect(wipeRect("right", 0.25, 1920, 1080)).toEqual({
      x: 0,
      y: 0,
      width: 480,
      height: 1080,
    });
    expect(wipeRect("up", 0.5, 1920, 1080)).toEqual({
      x: 0,
      y: 540,
      width: 1920,
      height: 540,
    });
    expect(wipeRect("down", 0.5, 1920, 1080)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 540,
    });
    expect(wipeRect("left", 1.5, 100, 100).width).toBe(100);
  });

  test("a dissolve lays the new shot over the old, see-through by how far it has gone", () => {
    const { ctx, calls } = recorder();
    drawBlend(
      ctx,
      incoming,
      { kind: "dissolve", direction: "left", progress: 0.3 },
      1920,
      1080
    );
    const draw = calls.find((c) => c.op === "drawImage")!;
    expect(draw.args).toEqual([incoming, 0, 0, 1920, 1080]);
    expect(draw.alpha).toBeCloseTo(0.3, 9);
    expect(calls.some((c) => c.op === "clip")).toBe(false);
  });

  test("a wipe draws the new shot only inside the uncovered part", () => {
    const { ctx, calls } = recorder();
    drawBlend(
      ctx,
      incoming,
      { kind: "wipe", direction: "right", progress: 0.5 },
      1920,
      1080
    );
    const ops = calls.map((c) => c.op);
    expect(ops.indexOf("clip")).toBeLessThan(ops.indexOf("drawImage"));
    expect(calls.find((c) => c.op === "rect")!.args).toEqual([0, 0, 960, 1080]);
    expect(calls.find((c) => c.op === "drawImage")!.alpha).toBe(1);
  });

  test("at the very start of a wipe nothing of the new shot shows", () => {
    const { ctx, calls } = recorder();
    drawBlend(
      ctx,
      incoming,
      { kind: "wipe", direction: "left", progress: 0 },
      1920,
      1080
    );
    expect(calls.some((c) => c.op === "drawImage")).toBe(false);
  });
});

test("the map layer skips units wholly outside the area in view", () => {
  const { ctx, calls } = recorder();
  const image = {} as CanvasImageSource;
  const unit = (id: string, x: number) => ({
    id,
    assetType: "units" as const,
    path: "a.png",
    x,
    y: 0,
    rotation: 0,
    scale: 1,
    flipped: false,
  });
  const assets = {
    map: null,
    unitImages: new Map([["units/a.png", { image, aspect: 1 }]]),
  };
  const area = { x: 0, y: -50, width: 100, height: 100 };
  // one in view, one just off the edge but reaching in, one far away
  drawMapLayer(
    ctx,
    [],
    [unit("in", 50), unit("edge", 120), unit("far", 500)],
    assets,
    1,
    area
  );
  expect(calls.filter((c) => c.op === "drawImage")).toHaveLength(2);
  // without an area, everything is drawn
  const all = recorder();
  drawMapLayer(all.ctx, [], [unit("far", 500)], assets, 1);
  expect(all.calls.filter((c) => c.op === "drawImage")).toHaveLength(1);
});

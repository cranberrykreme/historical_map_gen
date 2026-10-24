import { CameraView, FormationBlock } from "../types";
import { placementFor } from "../utils/video/camera";
import {
  BLOCK_FONT,
  blockBox,
  blockColours,
  blockFront,
  blockLabel,
  blockLineWidths,
  blockOutline,
  blockSymbol,
  BlockStep,
} from "../utils/units/blocks";
import {
  crossSize,
  crossStrokes,
  DrawMarker,
  ExitFrame,
  MARKER_HALO,
  MARKER_INK,
  PATCH_FILL,
  patchOutline,
  RIPPLE,
  RIPPLE_WIDTH,
  smoothClosed,
  TEAR_EDGE,
  TEAR_SHADOW,
} from "../utils/units/exits";
import { Blend, DrawUnit, Scene } from "./scene";

// What fills the frame wherever the map doesn't reach, the same grey as the editor
export const OUTSIDE_MAP = "#3a3a3a";

// How wide a unit's image is at scale 1, in map units; its height keeps the image's shape.
// The same as the editor's unit layer.
export const UNIT_WIDTH = 48;

// A rectangle in map units
export interface MapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// The map as a picture: an image covering `x, y, width, height` in map units (for a frame, just
// the part the camera sees, drawn sharp at the frame's own size). `bounds` is where the whole
// map sits; anything outside it is the grey beyond the map, as in the editor.
export interface MapPicture extends MapRect {
  image: CanvasImageSource;
  bounds: MapRect;
}

// The pictures a frame needs: the map, and each unit's image by asset type and path
export interface FrameAssets {
  map: MapPicture | null;
  unitImages: ReadonlyMap<string, { image: CanvasImageSource; aspect: number }>;
}

export const unitImageKey = (unit: Pick<DrawUnit, "assetType" | "path">) =>
  `${unit.assetType}/${unit.path}`;

// How the date box looks, read from the editor's own styles (see dateStyle)
export interface DateStyle {
  font: string; // a canvas font, e.g. `28px "Cinzel"`
  fontSize: number;
  letterSpacing: number; // px
  color: string;
  background: string;
  border: string;
  radius: number;
  padX: number;
  padY: number;
  margin: number; // from the frame's top left corner
}

// The whole map in view, with a little room around it: the camera for a video with no views
// set at all
export function wholeMapView(map: MapRect | null): CameraView | null {
  if (!map) return null;
  return {
    centerX: map.x + map.width / 2,
    centerY: map.y + map.height / 2,
    height: map.height * 1.05,
  };
}

// The minimal drawing surface a frame needs, so frames can be drawn (and tested) anywhere
export type FrameContext = Pick<
  CanvasRenderingContext2D,
  | "save"
  | "restore"
  | "setTransform"
  | "translate"
  | "rotate"
  | "scale"
  | "fillRect"
  | "drawImage"
  | "fillText"
  | "strokeText"
  | "measureText"
  | "beginPath"
  | "moveTo"
  | "lineTo"
  | "quadraticCurveTo"
  | "arc"
  | "arcTo"
  | "closePath"
  | "rect"
  | "clip"
  | "fill"
  | "stroke"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "lineCap"
  | "lineJoin"
  | "globalAlpha"
  | "font"
  | "textBaseline"
  | "textAlign"
  | "imageSmoothingEnabled"
  | "imageSmoothingQuality"
>;

// A unit part way through leaving, in pieces (see utils/units/exits). The unit's own space is already
// set up, centred on the middle of its picture's `width` by `height` box; `drawWhole` draws the
// whole picture there. `pixel` is one pixel of the frame in this space, for lines that should
// look the same thickness at any zoom.
function drawPieces(
  ctx: FrameContext,
  frame: ExitFrame,
  width: number,
  height: number,
  pixel: number,
  drawWhole: () => void
): void {
  const base = ctx.globalAlpha;
  for (const ripple of frame.ripples) {
    ctx.save();
    ctx.globalAlpha = base * ripple.alpha;
    ctx.strokeStyle = RIPPLE;
    ctx.lineWidth = RIPPLE_WIDTH * width;
    ctx.beginPath();
    ctx.arc(0, 0, ripple.radius * width, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const at = (p: { x: number; y: number }) => ({
    x: (p.x - 0.5) * width,
    y: (p.y - 0.5) * height,
  });
  for (const piece of frame.pieces) {
    if (piece.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = base * piece.alpha;
    const origin = at(piece.origin);
    ctx.translate(piece.x * width + origin.x, piece.y * width + origin.y);
    ctx.rotate((piece.rotate * Math.PI) / 180);
    ctx.scale(piece.scale, piece.scale);
    ctx.translate(-origin.x, -origin.y);
    if (piece.clip) {
      ctx.beginPath();
      piece.clip.forEach((p, i) => {
        const q = at(p);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.clip();
    }
    drawWhole();
    ctx.restore();
  }
  for (const tear of frame.tears) {
    if (tear.points.length < 2) continue;
    ctx.save();
    ctx.globalAlpha = base * tear.alpha;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const [colour, thickness] of [
      [TEAR_SHADOW, 3.5],
      [TEAR_EDGE, 1.8],
    ] as const) {
      ctx.beginPath();
      tear.points.forEach((p, i) => {
        const q = at(p);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.strokeStyle = colour;
      ctx.lineWidth = thickness * pixel;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawUnit(
  ctx: FrameContext,
  unit: DrawUnit,
  assets: FrameAssets,
  pixel: number
): void {
  const picture = assets.unitImages.get(unitImageKey(unit));
  if (!picture) return;
  const width = UNIT_WIDTH;
  const height = UNIT_WIDTH * picture.aspect;
  // As the editor does: centred on its spot, turned, sized, then mirrored in its own space
  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate((unit.rotation * Math.PI) / 180);
  ctx.scale(unit.scale, unit.scale);
  const drawWhole = () => {
    if (unit.flipped) ctx.scale(-1, 1);
    ctx.drawImage(picture.image, -width / 2, -height / 2, width, height);
  };
  if (unit.exit)
    drawPieces(ctx, unit.exit, width, height, pixel / unit.scale, drawWhole);
  else drawWhole();
  ctx.restore();
}

// Follows a block's outline steps as a path
function followSteps(ctx: FrameContext, steps: BlockStep[]): void {
  for (const step of steps) {
    if (step.op === "move") ctx.moveTo(step.to.x, step.to.y);
    else if (step.op === "line") ctx.lineTo(step.to.x, step.to.y);
    else
      ctx.quadraticCurveTo(
        step.control.x,
        step.control.y,
        step.to.x,
        step.to.y
      );
  }
}

// A formation block, as the panel previews draw it (see BlockShape): filled in its colour with
// a darker edge, its symbol, a thick front edge, and its name kept the right way up
function drawBlockBody(
  ctx: FrameContext,
  block: FormationBlock,
  rotation: number
): void {
  const { fill, edge } = blockColours(block.colour);
  const widths = blockLineWidths(block);
  const base = ctx.globalAlpha;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  followSteps(ctx, blockOutline(block));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = widths.edge;
  ctx.stroke();
  const symbol = blockSymbol(block);
  if (symbol.lines.length > 0) {
    ctx.globalAlpha = base * 0.75;
    ctx.lineWidth = widths.symbol;
    ctx.beginPath();
    for (const line of symbol.lines)
      line.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
    ctx.stroke();
    ctx.globalAlpha = base;
  }
  if (symbol.dots.length > 0) {
    ctx.globalAlpha = base * 0.85;
    ctx.fillStyle = edge;
    for (const dot of symbol.dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = base;
  }
  ctx.lineWidth = widths.front;
  ctx.beginPath();
  followSteps(ctx, blockFront(block));
  ctx.stroke();
  const label = blockLabel(block, rotation);
  if (label) {
    ctx.translate(0, label.y);
    if (label.flip) ctx.rotate(Math.PI);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const line of label.lines) {
      ctx.font = `${line.bold ? 700 : 500} ${line.size}px ${BLOCK_FONT}`;
      ctx.lineWidth = line.size * 0.22;
      ctx.strokeStyle = "rgba(26, 20, 16, 0.75)";
      ctx.strokeText(line.text, 0, line.y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line.text, 0, line.y);
    }
  }
  ctx.restore();
}

// A formation block on the map: in place, or in pieces while it's leaving
function drawBlock(ctx: FrameContext, unit: DrawUnit, pixel: number): void {
  const block = unit.block;
  if (!block) return;
  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate((unit.rotation * Math.PI) / 180);
  ctx.scale(unit.scale, unit.scale);
  const drawWhole = () => drawBlockBody(ctx, block, unit.rotation);
  if (unit.exit) {
    const box = blockBox(block);
    drawPieces(
      ctx,
      unit.exit,
      box.width,
      box.height,
      pixel / unit.scale,
      drawWhole
    );
  } else drawWhole();
  ctx.restore();
}

// A marker where a unit fell: a dark patch of ground the unit's size, turned with it, or a
// small cross that always stands upright
function drawMarker(ctx: FrameContext, marker: DrawMarker): void {
  ctx.save();
  ctx.globalAlpha = Math.min(Math.max(marker.alpha, 0), 1);
  ctx.translate(marker.x, marker.y);
  if (marker.kind === "patch") {
    ctx.rotate((marker.rotation * Math.PI) / 180);
    const curve = smoothClosed(
      patchOutline(marker.id, marker.width / 2, marker.depth / 2)
    );
    ctx.beginPath();
    ctx.moveTo(curve.start.x, curve.start.y);
    for (const c of curve.curves)
      ctx.quadraticCurveTo(c.control.x, c.control.y, c.to.x, c.to.y);
    ctx.closePath();
    ctx.fillStyle = PATCH_FILL;
    ctx.fill();
  } else {
    const size = crossSize(marker.width);
    ctx.lineCap = "butt";
    for (const [colour, thickness] of [
      [MARKER_HALO, 0.34],
      [MARKER_INK, 0.16],
    ] as const) {
      ctx.beginPath();
      for (const [a, b] of crossStrokes(size)) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = size * thickness;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// How far from its centre a unit's drawing can reach, in map units: further while it's
// breaking up, as its pieces fly apart
function unitReach(unit: DrawUnit, assets: FrameAssets): number {
  let width = UNIT_WIDTH;
  let height = UNIT_WIDTH;
  if (unit.block) ({ width, height } = blockBox(unit.block));
  else {
    const picture = assets.unitImages.get(unitImageKey(unit));
    if (picture) height = UNIT_WIDTH * picture.aspect;
  }
  return (Math.hypot(width, height) / 2) * unit.scale * (unit.exit ? 3 : 1);
}

const reaches = (area: MapRect, x: number, y: number, reach: number) =>
  x + reach >= area.x &&
  x - reach <= area.x + area.width &&
  y + reach >= area.y &&
  y - reach <= area.y + area.height;

// What's drawn on the map itself, in map units: the markers where units fell, then the units,
// bottom to top. The video and the editor both draw it this way. `pixel` is one pixel of the
// picture in map units. With `area`, anything wholly outside it is skipped.
export function drawMapLayer(
  ctx: FrameContext,
  markers: DrawMarker[],
  units: DrawUnit[],
  assets: FrameAssets,
  pixel: number,
  area?: MapRect
): void {
  for (const marker of markers)
    if (
      !area ||
      reaches(area, marker.x, marker.y, Math.max(marker.width, marker.depth))
    )
      drawMarker(ctx, marker);
  for (const unit of units) {
    if (area && !reaches(area, unit.x, unit.y, unitReach(unit, assets)))
      continue;
    if (unit.block) drawBlock(ctx, unit, pixel);
    else drawUnit(ctx, unit, assets, pixel);
  }
}

// A rectangle with rounded corners, as a path ready to fill and stroke
function roundedBox(
  ctx: FrameContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.max(Math.min(radius, width / 2, height / 2), 0);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawDate(ctx: FrameContext, text: string, style: DateStyle): void {
  ctx.save();
  ctx.font = style.font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing =
      `${style.letterSpacing}px`;
  }
  const textWidth = ctx.measureText(text).width;
  const boxWidth = textWidth + 2 * style.padX;
  const boxHeight = style.fontSize * 1.2 + 2 * style.padY;
  roundedBox(
    ctx,
    style.margin,
    style.margin,
    boxWidth,
    boxHeight,
    style.radius
  );
  ctx.fillStyle = style.background;
  ctx.fill();
  ctx.strokeStyle = style.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = style.color;
  ctx.fillText(text, style.margin + style.padX, style.margin + boxHeight / 2);
  ctx.restore();
}

// Draws one frame of the video: the map and units as the camera sees them, then the date,
// then any fade. `width` and `height` are the frame's size in pixels.
export function drawFrame(
  ctx: FrameContext,
  scene: Scene,
  assets: FrameAssets,
  width: number,
  height: number,
  dateStyle: DateStyle | null
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = OUTSIDE_MAP;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const view = scene.view ?? wholeMapView(assets.map?.bounds ?? null);
  if (view) {
    const { x, y, scale } = placementFor(view, {
      left: 0,
      top: 0,
      width,
      height,
    });
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (assets.map) {
      const { image, x: mx, y: my, width: mw, height: mh, bounds } = assets.map;
      ctx.drawImage(image, mx, my, mw, mh);
      // Beyond the map's edge is grey, whatever the map's own drawing does out there
      const reach = Math.max(mw, mh) * 4;
      ctx.beginPath();
      ctx.rect(mx - reach, my - reach, mw + 2 * reach, mh + 2 * reach);
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.fillStyle = OUTSIDE_MAP;
      ctx.fill("evenodd");
    }
    drawMapLayer(ctx, scene.markers ?? [], scene.units, assets, 1 / scale);
    ctx.restore();
  }

  if (scene.date && dateStyle) drawDate(ctx, scene.date, dateStyle);

  if (scene.darkness > 0) {
    ctx.globalAlpha = Math.min(scene.darkness, 1);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// The part of the frame the new shot covers part way through a wipe: the edge travels the way
// the wipe goes, so a wipe left brings the new shot in from the right
export function wipeRect(
  direction: Blend["direction"],
  progress: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const p = Math.min(Math.max(progress, 0), 1);
  switch (direction) {
    case "left":
      return { x: width * (1 - p), y: 0, width: width * p, height };
    case "right":
      return { x: 0, y: 0, width: width * p, height };
    case "up":
      return { x: 0, y: height * (1 - p), width, height: height * p };
    case "down":
      return { x: 0, y: 0, width, height: height * p };
  }
}

// Lays the new shot's finished frame (`incoming`, the frame's size) over the old shot's, which
// is already on `ctx`: faded in for a dissolve, or uncovered behind a moving edge for a wipe
export function drawBlend(
  ctx: FrameContext,
  incoming: CanvasImageSource,
  blend: Pick<Blend, "kind" | "direction" | "progress">,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (blend.kind === "dissolve") {
    ctx.globalAlpha = Math.min(Math.max(blend.progress, 0), 1);
    ctx.drawImage(incoming, 0, 0, width, height);
    ctx.globalAlpha = 1;
  } else {
    const area = wipeRect(blend.direction, blend.progress, width, height);
    if (area.width > 0 && area.height > 0) {
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.width, area.height);
      ctx.clip();
      ctx.drawImage(incoming, 0, 0, width, height);
    }
  }
  ctx.restore();
}

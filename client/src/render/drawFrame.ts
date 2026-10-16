import { CameraView } from "../types";
import { placementFor } from "../utils/camera";
import {
  BLOCK_FONT,
  blockColours,
  blockFront,
  blockLabel,
  blockLineWidths,
  blockOutline,
  blockSymbol,
  BlockStep,
} from "../utils/blocks";
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

function drawUnit(
  ctx: FrameContext,
  unit: DrawUnit,
  assets: FrameAssets
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
  if (unit.flipped) ctx.scale(-1, 1);
  ctx.drawImage(picture.image, -width / 2, -height / 2, width, height);
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

// A formation block, exactly as the editor draws it (see BlockShape): filled in its colour with
// a darker edge, its symbol, a thick front edge, and its name kept the right way up
function drawBlock(ctx: FrameContext, unit: DrawUnit): void {
  const block = unit.block;
  if (!block) return;
  const { fill, edge } = blockColours(block.colour);
  const widths = blockLineWidths(block);
  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate((unit.rotation * Math.PI) / 180);
  ctx.scale(unit.scale, unit.scale);
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
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = widths.symbol;
    ctx.beginPath();
    for (const line of symbol.lines)
      line.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (symbol.dots.length > 0) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = edge;
    for (const dot of symbol.dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = widths.front;
  ctx.beginPath();
  followSteps(ctx, blockFront(block));
  ctx.stroke();
  const label = blockLabel(block, unit.rotation);
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
    for (const unit of scene.units)
      if (unit.block) drawBlock(ctx, unit);
      else drawUnit(ctx, unit, assets);
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

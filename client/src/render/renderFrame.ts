import {
  drawBlend,
  drawFrame,
  FrameContext,
  MapPicture,
  wholeMapView,
} from "./drawFrame";
import { croppedSvgText, loadSvgImage, visibleRect } from "./mapPicture";
import { RenderJob } from "./prepare";
import { pictureAt, Scene } from "./scene";

// Draws one scene onto a canvas the size of the video. The map is drawn afresh at exactly the
// frame's size, so it is sharp at any zoom.
async function drawScene(
  ctx: FrameContext,
  job: RenderJob,
  scene: Scene
): Promise<void> {
  const view = scene.view ?? wholeMapView(job.map?.box ?? null);
  let map: MapPicture | null = null;
  if (job.map && view) {
    const visible = visibleRect(view, job.width, job.height);
    const image = await loadSvgImage(
      croppedSvgText(job.map, visible, job.width, job.height)
    );
    map = { image, ...visible, bounds: job.map.box };
  }
  drawFrame(
    ctx,
    { ...scene, view },
    { map, unitImages: job.unitImages },
    job.width,
    job.height,
    job.dateStyle
  );
}

// A second canvas the size of the video, kept with the job, for the shot coming in during a
// dissolve or a wipe
function scratchCanvas(job: RenderJob): HTMLCanvasElement {
  let canvas = job.scratch;
  if (!canvas) {
    canvas = document.createElement("canvas");
    job.scratch = canvas;
  }
  if (canvas.width !== job.width) canvas.width = job.width;
  if (canvas.height !== job.height) canvas.height = job.height;
  return canvas;
}

// Draws the frame of the video at `seconds` onto a canvas the size of the video. During a
// dissolve or a wipe both shots are drawn in full, the old one here and the new one on a
// second canvas, and then the new one is laid over the old.
export async function renderFrame(
  ctx: FrameContext,
  job: RenderJob,
  seconds: number
): Promise<void> {
  const { scene, blend } = pictureAt(job.input, seconds);
  if (!blend) {
    await drawScene(ctx, job, scene);
    return;
  }
  await drawScene(ctx, job, blend.outgoing);
  const scratch = scratchCanvas(job);
  const scratchCtx = scratch.getContext("2d");
  if (!scratchCtx) throw new Error("No canvas");
  await drawScene(scratchCtx, job, scene);
  drawBlend(ctx, scratch, blend, job.width, job.height);
}

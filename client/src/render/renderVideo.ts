import { useAssetStore } from "../store/useAssetStore";
import {
  DEFAULT_CRF,
  DEFAULT_FPS,
  DEFAULT_PRESET,
  frameCount,
  frameTime,
  RenderProgress,
  VideoRange,
  wholeVideo,
} from "./frames";
import { prepareRender } from "./prepare";
import { renderFrame } from "./renderFrame";
import {
  cancelRender,
  finishRender,
  FinishedRender,
  RenderSettings,
  sendFrame,
  startRender,
} from "./renderApi";

export class RenderCancelled extends Error {
  constructor() {
    super("Render cancelled");
    this.name = "RenderCancelled";
  }
}

// How long the last render took per frame on this computer, for guessing how long the next
// will take. Null until something has been rendered since the page was opened.
let lastSecondsPerFrame: number | null = null;
export const measuredSecondsPerFrame = (): number | null => lastSecondsPerFrame;

// Renders the video, or a stretch of it: draws every frame exactly as Preview frame does, and
// sends each to the server, which encodes them into an MP4 in the project's exports folder. One
// frame is being sent while the next is drawn. `signal` cancels it, throwing RenderCancelled;
// anything half made is thrown away.
export async function renderVideo({
  fps = DEFAULT_FPS,
  crf = DEFAULT_CRF,
  preset = DEFAULT_PRESET,
  range,
  name,
  onProgress,
  signal,
}: {
  fps?: number;
  crf?: number;
  preset?: string;
  range?: VideoRange; // the whole video if left out
  name?: string; // the start of the file's name; the project's name if left out
  onProgress?: (progress: RenderProgress) => void;
  signal?: AbortSignal;
} = {}): Promise<FinishedRender> {
  const project = useAssetStore.getState().currentProjectName;
  if (!project) throw new Error("No project is open");

  const job = await prepareRender();
  const { from, to } = range ?? wholeVideo(job.input.shots);
  const total = frameCount(to - from, fps);
  const settings: RenderSettings = {
    width: job.width,
    height: job.height,
    fps,
    crf,
    preset,
    name: name || project,
  };

  const canvas = document.createElement("canvas");
  canvas.width = job.width;
  canvas.height = job.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No canvas");

  const started = performance.now();
  const { jobId } = await startRender(project, settings);
  let sending: Promise<void> | null = null;
  try {
    for (let index = 0; index < total; index++) {
      if (signal?.aborted) throw new RenderCancelled();
      await renderFrame(ctx, job, frameTime(index, fps, from));
      const pixels = ctx.getImageData(0, 0, job.width, job.height).data;
      // Wait for the frame before to arrive before sending this one, so they stay in order
      if (sending) await sending;
      if (signal?.aborted) throw new RenderCancelled();
      sending = sendFrame(jobId, index, pixels).then(() =>
        onProgress?.({
          done: index + 1,
          total,
          elapsed: (performance.now() - started) / 1000,
        })
      );
      // A failed send is dealt with when it's next awaited; this just stops the browser
      // reporting it as unhandled in the meantime
      sending.catch(() => undefined);
    }
    if (sending) await sending;
    if (signal?.aborted) throw new RenderCancelled();
    const result = await finishRender(jobId);
    lastSecondsPerFrame = (performance.now() - started) / 1000 / total;
    return result;
  } catch (error) {
    // Don't leave a frame in flight behind
    await sending?.catch(() => undefined);
    await cancelRender(jobId);
    throw signal?.aborted ? new RenderCancelled() : error;
  }
}

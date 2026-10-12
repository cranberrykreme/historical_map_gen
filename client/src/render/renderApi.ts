import API_BASE_URL from "../config/api";

// The server's side of a render: it pipes the frames it is sent into ffmpeg, which writes the
// MP4 into the project's exports folder

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  crf: number; // quality: lower is better and bigger, 16 is visually lossless for maps
  preset: string; // how hard ffmpeg works to make the file small: "slow" is a good balance
  name?: string; // the start of the file's name; the project's name if left out
}

export interface FinishedRender {
  filename: string;
  frames: number;
  seconds: number;
  bytes: number;
  path: string; // where the file is on this computer
  tookSeconds: number;
}

// The server's error message, or a general one if it didn't send any
async function failure(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return new Error(body.error);
  } catch {
    // not JSON
  }
  return new Error(`${fallback} (${response.status})`);
}

export async function startRender(
  project: string,
  settings: RenderSettings
): Promise<{ jobId: string; filename: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${encodeURIComponent(project)}/render`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }
  );
  if (!response.ok) throw await failure(response, "Couldn't start the render");
  return response.json();
}

// One frame's pixels, as the canvas holds them (RGBA, top row first). Frames must be sent in
// order, starting from 0.
export async function sendFrame(
  jobId: string,
  index: number,
  pixels: Uint8ClampedArray
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/render/${jobId}/frame`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Frame-Index": String(index),
    },
    // The pixels own their whole buffer (a fresh ImageData), so the buffer is just this frame
    body: pixels.buffer as ArrayBuffer,
  });
  if (!response.ok)
    throw await failure(response, `Frame ${index} wasn't taken`);
}

export async function finishRender(jobId: string): Promise<FinishedRender> {
  const response = await fetch(`${API_BASE_URL}/api/render/${jobId}/finish`, {
    method: "POST",
  });
  if (!response.ok)
    throw await failure(response, "The video couldn't be finished");
  return response.json();
}

// Stops ffmpeg and throws the half-made file away. Never fails: there's nothing more to do.
export async function cancelRender(jobId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/render/${jobId}/cancel`, {
      method: "POST",
    });
  } catch {
    // the server will throw the render away itself once it has sat idle
  }
}

// Where a finished video can be watched, or downloaded
export const exportUrl = (
  project: string,
  filename: string,
  download = false
) =>
  `${API_BASE_URL}/api/projects/${encodeURIComponent(project)}/exports/${encodeURIComponent(
    filename
  )}${download ? "?download=1" : ""}`;

// A video already rendered into the project's exports folder
export interface ExportedVideo {
  filename: string;
  bytes: number;
  modified: number; // seconds since 1970
}

// The project's rendered videos, newest first
export async function listExports(project: string): Promise<ExportedVideo[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${encodeURIComponent(project)}/exports`
  );
  if (!response.ok) throw await failure(response, "Couldn't list the videos");
  return response.json();
}

// Saves a copy of a rendered video to the browser's downloads (the server marks it as a download,
// so the page stays where it is)
export function downloadExport(project: string, filename: string): void {
  const link = document.createElement("a");
  link.href = exportUrl(project, filename, true);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Deletes a rendered video from the project's exports folder, for good
export async function deleteExport(
  project: string,
  filename: string
): Promise<void> {
  const response = await fetch(exportUrl(project, filename), {
    method: "DELETE",
  });
  if (!response.ok) throw await failure(response, "Couldn't delete the video");
}

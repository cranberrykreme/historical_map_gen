import API_BASE_URL from "../config/api";
import { useAssetStore } from "../store/useAssetStore";
import { useCameraStore } from "../store/useCameraStore";
import { useMapStore } from "../store/useMapStore";
import { FRAME_PIXELS } from "../utils/camera";
import { armyTracker } from "../utils/follow";
import { getTimeline } from "../utils/timeline";
import { readDateStyle } from "./dateStyle";
import { DateStyle, FrameAssets, unitImageKey } from "./drawFrame";
import { PreparedMap, prepareMap } from "./mapPicture";
import { SceneInput } from "./scene";

// Everything needed to draw any frame of the video, gathered once
export interface RenderJob {
  input: SceneInput;
  map: PreparedMap | null;
  unitImages: FrameAssets["unitImages"];
  dateStyle: DateStyle;
  width: number;
  height: number;
  // A spare canvas for drawing the second shot during dissolves and wipes, made when first needed
  scratch?: HTMLCanvasElement;
}

// The `?for=render` keeps these apart from the editor's own copies in the browser's cache:
// those were fetched without asking for permission to read them back, and a cached copy like
// that can't be drawn onto a canvas that is later saved
const assetUrl = (project: string, assetType: string, path: string) =>
  `${API_BASE_URL}/api/projects/${project}/assets/${assetType}/${path}?for=render`;

// Loads one unit's image. Asked for "anonymously" so the finished frames can be read back and
// saved (a canvas that has drawn another site's image without permission can't be).
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// Gathers the project as it is now, the map's drawing and every unit's image, ready to draw
// frames. Needs the map on screen, since that's where the map's size and place are measured.
export async function prepareRender(): Promise<RenderJob> {
  const state = useMapStore.getState();
  const project = useAssetStore.getState().currentProjectName ?? "";
  const api = useCameraStore.getState().api;
  const { width, height } = FRAME_PIXELS[state.videoFrame];

  const timeline = getTimeline(state.paths, state.placedUnits);
  const input: SceneInput = {
    shots: state.shots,
    units: state.placedUnits,
    timeline,
    storyStart: state.storyStart,
    displayMode: state.displayMode,
    opening:
      state.savedViewport && api ? api.fromSaved(state.savedViewport) : null,
    tracker: armyTracker(
      timeline,
      state.placedUnits,
      state.armies,
      state.storyStart
    ),
  };

  // The map's drawing, placed where the editor shows it
  let map: PreparedMap | null = null;
  const box = api?.mapBox() ?? null;
  if (state.selectedMapFilename && box) {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${project}/map?filename=${state.selectedMapFilename}`
    );
    if (response.ok) map = prepareMap(await response.text(), box);
  }

  // Each image once, however many units use it
  const unitImages = new Map<
    string,
    { image: CanvasImageSource; aspect: number }
  >();
  const wanted = new Map<string, string>();
  for (const unit of state.placedUnits) {
    const key = unitImageKey({
      assetType: unit.assetType,
      path: unit.path ?? unit.filename,
    });
    if (!wanted.has(key))
      wanted.set(
        key,
        assetUrl(project, unit.assetType, unit.path ?? unit.filename)
      );
  }
  await Promise.all(
    Array.from(wanted, async ([key, url]) => {
      const image = await loadImage(url);
      if (image && image.naturalWidth > 0)
        unitImages.set(key, {
          image,
          aspect: image.naturalHeight / image.naturalWidth,
        });
    })
  );

  return { input, map, unitImages, dateStyle: readDateStyle(), width, height };
}

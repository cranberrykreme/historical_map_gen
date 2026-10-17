import API_BASE_URL from "../config/api";
import { useAssetStore } from "../store/useAssetStore";
import { useCameraStore } from "../store/useCameraStore";
import { useMapStore } from "../store/useMapStore";
import { FRAME_PIXELS } from "../utils/camera";
import { armyTracker } from "../utils/follow";
import { getTimeline } from "../utils/timeline";
import { allScenes } from "../utils/scenes";
import { battleCameras, battleScenes } from "../utils/battleCameras";
import { terrainSvg } from "../utils/terrainScene";
import { MAP_SCENE } from "../types";
import { readDateStyle } from "./dateStyle";
import { DateStyle, FrameAssets, unitImageKey } from "./drawFrame";
import { PreparedMap, prepareMap } from "./mapPicture";
import { SceneInput } from "./scene";

// Everything needed to draw any frame of the video, gathered once
export interface RenderJob {
  input: SceneInput;
  map: PreparedMap | null;
  // Each battle's ground (its terrain), drawn instead of the map in shots that show it
  grounds: Record<string, PreparedMap>;
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

// Gathers the project as it is now, the map's drawing, each battle's ground and every unit's
// image, ready to draw frames. Needs the map on screen, since that's where the map's size and
// place are measured (while a battle is open, where it was last measured).
export async function prepareRender(): Promise<RenderJob> {
  const state = useMapStore.getState();
  const project = useAssetStore.getState().currentProjectName ?? "";
  const api = useCameraStore.getState().api;
  const { width, height } = FRAME_PIXELS[state.videoFrame];

  // Every scene, whichever one is open in the editor
  const scenes = allScenes(state);
  const main = scenes[MAP_SCENE] ?? { units: [], paths: [], armies: [] };
  const battles = battleScenes(state.battles, scenes, state.storyStart);
  const timeline = getTimeline(main.paths, main.units);
  const input: SceneInput = {
    shots: state.shots,
    units: main.units,
    timeline,
    storyStart: state.storyStart,
    displayMode: state.displayMode,
    opening:
      state.savedViewport && api ? api.fromSaved(state.savedViewport) : null,
    tracker: armyTracker(timeline, main.units, main.armies, state.storyStart),
    battles,
    battleCameras: battleCameras(battles, state.videoFrame),
  };

  // Each battle's ground, from (0, 0) across its whole area
  const grounds: Record<string, PreparedMap> = {};
  for (const battle of state.battles) {
    const ground = prepareMap(terrainSvg(battle), {
      x: 0,
      y: 0,
      width: battle.width,
      height: battle.height,
    });
    if (ground) grounds[battle.id] = ground;
  }

  // The map's drawing, placed where the editor shows it
  let map: PreparedMap | null = null;
  if (state.selectedMapFilename && api) {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${project}/map?filename=${state.selectedMapFilename}`
    );
    if (response.ok) {
      const svgText = await response.text();
      const box = api.mainMapBox(svgText);
      if (box) map = prepareMap(svgText, box);
    }
  }

  // Each image once, however many units use it
  const unitImages = new Map<
    string,
    { image: CanvasImageSource; aspect: number }
  >();
  const wanted = new Map<string, string>();
  const everyUnit = Object.values(scenes).flatMap((scene) => scene.units);
  for (const unit of everyUnit) {
    // formation blocks are drawn, not pictures
    if (unit.block) continue;
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

  return {
    input,
    map,
    grounds,
    unitImages,
    dateStyle: readDateStyle(),
    width,
    height,
  };
}

import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { prepareRender } from "../../render/prepare";
import { renderFrame } from "../../render/renderFrame";
import { scaledDateStyle } from "../../render/dateStyle";
import { allScenes } from "../../utils/scenes/scenes";
import { thumbnailKey, thumbnailMoment } from "../../utils/video/thumbnails";
import { MAP_SCENE, Shot } from "../../types";

export const THUMB_HEIGHT = 40; // pixels on screen; drawn at twice that for sharp screens
const WAIT = 700; // ms after the last change before pictures are remade

// Numbers each array or object the first time it's seen, so a scene's version can be told
// from its contents' identity without comparing them
const ids = new WeakMap<object, number>();
let nextId = 1;
const idOf = (thing: object | undefined | null) => {
  if (!thing) return 0;
  let id = ids.get(thing);
  if (!id) {
    id = nextId++;
    ids.set(thing, id);
  }
  return id;
};

// Small pictures of the first frame of the shots in view, drawn by the same code as the
// finished video. Each picture is made once and remade only when its shot or its scene
// changes, a moment after editing stops and never while the video plays.
export function useShotThumbnails(
  shots: Shot[],
  inView: [number, number]
): Map<string, string> {
  const placedUnits = useMapStore((s) => s.placedUnits);
  const paths = useMapStore((s) => s.paths);
  const armies = useMapStore((s) => s.armies);
  const sceneStash = useMapStore((s) => s.sceneStash);
  const activeSceneId = useMapStore((s) => s.activeSceneId);
  const battles = useMapStore((s) => s.battles);
  const selectedMapFilename = useMapStore((s) => s.selectedMapFilename);
  const videoFrame = useMapStore((s) => s.videoFrame);
  const storyStart = useMapStore((s) => s.storyStart);
  const displayMode = useMapStore((s) => s.displayMode);
  const playing = useTimelineStore((s) => s.playing);
  const made = useRef(new Map<string, { key: string; url: string }>());
  const [, setVersion] = useState(0);

  // What each scene's pictures depend on
  const scenes = allScenes({
    activeSceneId,
    sceneStash,
    placedUnits,
    paths,
    armies,
  });
  const shared = `${selectedMapFilename}|${videoFrame}|${storyStart}|${displayMode}`;
  const sceneVersion = (sceneId: string) => {
    const scene = scenes[sceneId];
    const battle = battles.find((b) => b.id === sceneId);
    return `${shared}|${idOf(scene?.units)}.${idOf(scene?.paths)}.${idOf(scene?.armies)}.${idOf(battle)}`;
  };

  const [first, end] = inView;
  const wanted = shots
    .slice(first, end)
    .map((shot, k) => {
      const index = first + k;
      return {
        shot,
        index,
        key: thumbnailKey(shots, index, sceneVersion(shot.scene ?? MAP_SCENE)),
      };
    })
    .filter(({ shot, key }) => made.current.get(shot.id)?.key !== key);
  const wantedKey = wanted.map((w) => w.key).join("\n");

  useEffect(() => {
    if (playing || wanted.length === 0) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const job = await prepareRender();
        const height = THUMB_HEIGHT * 2;
        const width = Math.round((height * job.width) / job.height);
        const small = {
          ...job,
          width,
          height,
          dateStyle: scaledDateStyle(job.dateStyle, height / job.height),
          scratch: undefined,
        };
        for (const { shot, index, key } of wanted) {
          if (cancelled) return;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          await renderFrame(ctx, small, thumbnailMoment(shots, index));
          if (cancelled) return;
          made.current.set(shot.id, {
            key,
            url: canvas.toDataURL("image/jpeg", 0.75),
          });
          setVersion((v) => v + 1);
        }
      } catch (error) {
        // A picture is a nicety: the shot still shows its name without one
        console.warn("Couldn't draw a shot's picture:", error);
      }
    }, WAIT);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `wantedKey` stands for `wanted`, which is remade on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedKey, playing]);

  const urls = new Map<string, string>();
  made.current.forEach((value, id) => urls.set(id, value.url));
  return urls;
}

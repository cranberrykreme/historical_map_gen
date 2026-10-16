import {
  CameraView,
  FormationBlock,
  HistoryDisplay,
  Shot,
  Unit,
  WipeDirection,
} from "../types";
import {
  ArmyTracker,
  cameraAt,
  secondsInShot,
  transitionAt,
  videoDarkness,
} from "../utils/camera";
import { formatHistoryTime, HistoryTime } from "../utils/historyTime";
import { dateHiddenAt, videoMoment } from "../utils/shots";
import { existsAt, Timeline } from "../utils/timeline";
import { unitAt } from "../utils/blocks";
import {
  backAngle,
  DrawMarker,
  ExitFrame,
  exitFrame,
  leavingAt,
  markersAt,
  pictureAspect,
  videoExitAge,
} from "../utils/exits";

// One unit as the video shows it: where it is, which way it turns and faces, and how big it is
export interface DrawUnit {
  id: string;
  assetType: Unit["assetType"];
  path: string; // the asset's path, which picks its image
  x: number;
  y: number;
  rotation: number; // degrees
  scale: number;
  flipped: boolean;
  block?: FormationBlock; // a formation block, drawn instead of a picture
  // Part way through leaving (a death or other leaving animation): how to draw it, in pieces
  exit?: ExitFrame;
}

// Everything that goes into one frame of the video, worked out from the project alone. Paths,
// markers, the frame outline and anything selected are editing aids and never appear.
export interface Scene {
  view: CameraView | null; // what the camera sees; null when nothing says
  units: DrawUnit[]; // bottom to top
  markers?: DrawMarker[]; // where units fell, under the units
  date: string | null; // the on-screen date, or null when the shot hides it
  darkness: number; // 0 the picture as it is, 1 black (fades)
}

export interface SceneInput {
  shots: Shot[];
  units: Unit[];
  timeline: Timeline;
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  opening: CameraView | null; // the project's saved view, where the camera opens
  tracker?: ArmyTracker; // for shots that follow an army
}

// The moment in history the video shows at a moment of the video: the story's start until a
// shot takes it later, as the editor's playhead does
export function sceneMoment(input: SceneInput, seconds: number): HistoryTime {
  return (
    videoMoment(input.shots, seconds, input.storyStart) ?? input.storyStart
  );
}

const drawUnit = (unit: Unit, exit?: ExitFrame): DrawUnit => ({
  id: unit.id,
  assetType: unit.assetType,
  path: unit.path ?? unit.filename,
  x: unit.x,
  y: unit.y,
  rotation: unit.rotation,
  scale: unit.scale,
  flipped: !!unit.flipped,
  ...(unit.block ? { block: unit.block } : {}),
  ...(exit ? { exit } : {}),
});

// The units on the map at a moment, where the marches have taken them, blocks thinned by their
// losses. Before the story starts moving every unit stands where it was placed, as in the
// editor. With `ageOf` (how many seconds of video ago a unit left), units part way through
// leaving are there too, under the rest, frozen where they left and breaking up.
export function unitsAt(
  units: Unit[],
  timeline: Timeline,
  moment: HistoryTime,
  storyStart: HistoryTime,
  ageOf?: (unit: Unit) => number | null
): DrawUnit[] {
  const states = moment > storyStart ? timeline.stateAt(moment) : null;
  const leaving = ageOf
    ? leavingAt(units, timeline, moment, ageOf).map(({ unit, progress }) =>
        drawUnit(
          unit,
          exitFrame(
            unit.exit!.style,
            progress,
            unit.id,
            backAngle(unit),
            pictureAspect(unit)
          )
        )
      )
    : [];
  const here = units
    .filter((unit) => existsAt(unit, moment))
    .map((unit) => {
      const state = states?.get(unit.id);
      return drawUnit(unitAt(state ? { ...unit, ...state } : unit, moment));
    });
  return [...leaving, ...here];
}

// What the video shows at a moment of the video
export function sceneAt(input: SceneInput, seconds: number): Scene {
  const moment = sceneMoment(input, seconds);
  const ageOf = (unit: Unit) =>
    unit.leaves === undefined
      ? null
      : videoExitAge(input.shots, seconds, unit.leaves);
  return {
    view: cameraAt(input.shots, seconds, input.opening, input.tracker),
    units: unitsAt(
      input.units,
      input.timeline,
      moment,
      input.storyStart,
      ageOf
    ),
    markers: markersAt(input.units, input.timeline, moment, ageOf),
    date: dateHiddenAt(input.shots, seconds)
      ? null
      : formatHistoryTime(moment, input.displayMode),
    darkness: videoDarkness(input.shots, seconds),
  };
}

// Two shots on screen at once, part way through a dissolve or a wipe
export interface Blend {
  kind: "dissolve" | "wipe";
  direction: WipeDirection; // for a wipe: which way the edge travels
  progress: number; // 0 all the old shot to 1 all the new one, already eased
  outgoing: Scene; // the shot being left, holding its last frame once the cut has passed
}

// The whole picture at a moment of the video: one scene, or, during a dissolve or a wipe, the
// shot coming in (`scene`) blended over the shot being left
export interface Picture {
  scene: Scene;
  blend: Blend | null;
}

// What one shot shows at a moment of the video, kept within that shot (see secondsInShot),
// darkened as the whole video is at that moment
export function sceneOfShot(
  input: SceneInput,
  index: number,
  seconds: number
): Scene {
  return {
    ...sceneAt(input, secondsInShot(input.shots, index, seconds)),
    darkness: videoDarkness(input.shots, seconds),
  };
}

// What the video shows at a moment, with both shots during a dissolve or a wipe. Everything
// else (cuts, fades) is a single scene.
export function pictureAt(input: SceneInput, seconds: number): Picture {
  const place = transitionAt(input.shots, seconds);
  if (
    !place ||
    place.outgoing === null ||
    (place.kind !== "dissolve" && place.kind !== "wipe")
  ) {
    return { scene: sceneAt(input, seconds), blend: null };
  }
  return {
    scene: sceneOfShot(input, place.incoming, seconds),
    blend: {
      kind: place.kind,
      direction: place.direction,
      progress: place.progress,
      outgoing: sceneOfShot(input, place.outgoing, seconds),
    },
  };
}

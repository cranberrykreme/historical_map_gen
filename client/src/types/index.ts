export type AssetType = "units" | "portraits" | "maps";

export type TravelMode = "rotate" | "upright" | "fixed";

export interface Unit {
  id: string;
  filename: string;
  path: string;
  assetType: AssetType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipped?: boolean;
  // Direction the unit's artwork faces, in degrees (0 = right, 90 = down, -90 = up),
  // before mirroring. Defaults to -90 (up) when not set.
  forwardAngle?: number;
  // How the unit behaves travelling along a path: "rotate" turns to face travel,
  // "upright" never rotates and mirrors left/right instead (ships, portraits),
  // "fixed" never turns or mirrors. Defaults: units rotate, portraits stay upright.
  travelMode?: TravelMode;
  // When the unit exists in history (days since 1 January 1970, see utils/historyTime).
  // Missing means it is there from the start of the story, and never leaves.
  appears?: number;
  leaves?: number;
  // A formation block instead of a picture: a labelled, coloured rectangle as history books
  // draw troops (see utils/blocks). Blocks keep scale 1 and are sized by their own width and
  // depth; their front is the top edge, so they face up like unit art.
  block?: FormationBlock;
}

// What a formation block stands for, shown by the symbol inside it: foot soldiers (a cross),
// horsemen (one diagonal), archers (a row of dots along the front), or no symbol
export type BlockKind = "foot" | "horse" | "archers" | "plain";

// The faction colours, the same nine as the unit art's palette
export type BlockColour =
  | "purple"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "pink"
  | "grey"
  | "cyan";

export interface FormationBlock {
  kind: BlockKind;
  colour: BlockColour;
  width: number; // along the front, in map units
  depth: number; // front to back, in map units
  // How far the middle of the block bows forward (positive) or back (negative), in map units:
  // 0 is a straight rectangle, positive a curve with its middle out front, negative a crescent
  // with its ends forward
  bend?: number;
  name?: string; // "Breton cavalry"
  size?: string; // "c. 2,000"
}

// A unit's time in an army: from `joins` until `leaves` (days since 1 January 1970, see
// utils/historyTime). Missing `joins` means from the start; missing `leaves` means for good.
export interface ArmyMember {
  unitId: string;
  joins?: number;
  leaves?: number;
}

// A named group of units. A unit is in at most one army at any moment, and marches can
// belong to an army.
export interface Army {
  id: string;
  name: string;
  members: ArmyMember[];
}

// When a march happens in history (days since 1 January 1970, see utils/historyTime).
// The first `turn` days are spent turning on the spot, the rest travelling.
export interface MarchTiming {
  start: number;
  end: number;
  turn: number;
}

// A moment on the video paired with a moment in history. Kept from the date markers of
// older projects, which become their first shots.
export interface PacingKey {
  seconds: number;
  time: number;
}

// A stretch of the video showing a stretch of history. Shots play one after another, so the
// story can jump back and forth in time. Over its `seconds`, history runs from `from` to `to`
// (days since 1 January 1970, see utils/historyTime); a shot whose `from` and `to` are the
// same holds that moment, for a title or a pause.
export interface Shot {
  id: string;
  name: string;
  seconds: number;
  from: number;
  to: number;
  ease?: boolean; // eases in and out rather than running at a steady rate
  hideDate?: boolean; // hides the on-screen date while this shot is on screen
  // Where the camera is as the shot starts and ends (see utils/camera). A shot with no start
  // view carries on from where the camera was; one with no end view holds its start view.
  startView?: CameraView;
  endView?: CameraView;
  // Starts wherever the shot before it ends, so a run of shots is one continuous move. The
  // start view is kept but not used while this is on.
  followOn?: boolean;
  // How the video goes from the shot before into this one. Missing means a cut.
  transition?: ShotTransition;
  // On the last shot: the video fades to black over its final `fadeOut` seconds. Kept but
  // not used while the shot isn't last.
  fadeOut?: number;
  // The army the camera follows through this shot (its id). The shot's views still set the
  // zoom; the army sets where the camera points.
  follow?: string;
}

// What the camera sees: the map point at the centre of the video frame, and how many map
// units the frame shows from top to bottom. Measured against the frame rather than the
// window, so a view looks the same on any screen and in the rendered video.
export interface CameraView {
  centerX: number;
  centerY: number;
  height: number;
}

// The video's shape: landscape (16:9) for YouTube, portrait (9:16) for shorts
export type VideoFrame = "landscape" | "portrait";

// How one shot gives way to the next. "fade" dips to black and back, "dissolve" blends one
// picture into the other, "wipe" slides the new picture in over the old.
export type TransitionKind = "cut" | "fade" | "dissolve" | "wipe";

// The way a wipe travels: "left" means the new picture comes in from the right and moves left
export type WipeDirection = "left" | "right" | "up" | "down";

// A transition sits across the cut, half in each shot, so it never changes the video's length.
// Into the very first shot it comes in from black at the start of the video.
export interface ShotTransition {
  kind: TransitionKind;
  seconds: number;
  direction?: WipeDirection; // wipes only; left when missing
}

// A battle is a scene of its own, separate from the main map: a close-up battlefield of land
// or open sea, `width` by `height` map units, with its own units, paths and armies. The video
// can cut between the main map and its battles.
export type BattleKind = "land" | "sea";

export interface Battle {
  id: string;
  name: string;
  kind: BattleKind;
  width: number;
  height: number;
  // The battleground's features, bottom to top within each kind (see utils/terrain). Missing
  // on battles made before terrain.
  terrain?: TerrainFeature[];
}

// What can be drawn on a battleground. Areas are closed shapes (a smooth curve through their
// points, back to the start); lines are open ones (streams, roads).
export type TerrainKind =
  // water
  | "deep"
  | "shallows"
  | "lake"
  | "reef"
  // ground
  | "land"
  | "sand"
  | "field"
  | "scrub"
  | "marsh"
  | "snow"
  // high ground
  | "rocks"
  | "hill"
  | "mountain"
  // woods and settlements
  | "forest"
  | "pines"
  | "orchard"
  | "town"
  | "walled"
  // lines
  | "river"
  | "stream"
  | "ditch"
  | "road"
  | "bridge"
  | "ridge"
  | "cliff"
  | "wall"
  | "palisade";

export interface TerrainFeature {
  id: string;
  kind: TerrainKind;
  points: PathPoint[]; // map units, inside the battle's area
  name?: string; // shown in the terrain list; "Hill 1" and so on when not set
  // An area's holes, each a smooth closed curve through its points like the area's edge: a
  // clearing in a forest, an island in a lake. Made by the eraser; missing when there are none.
  holes?: PathPoint[][];
}

// Everything placed in one scene (the main map, or a battle)
export interface SceneContent {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
}

// The id of the main map among the scenes; every other scene is a battle, by its id
export const MAP_SCENE = "map";

// A battle as saved in the project file: the battle and what's in it
export interface SavedBattle extends Battle, SceneContent {}

// How the date reads: "October 1066", "14 October 1066", or with the time of day too
export type HistoryDisplay = "months" | "days" | "times";

// The project file version this app writes. Version 1 (no version field) timed marches in
// seconds on the video; version 2 dates them in history; version 3 lets army membership
// decide who is on an army's march.
export const PROJECT_VERSION = 3;

export interface ProjectData {
  name: string;
  version?: number;
  units: Unit[];
  paths?: MapPath[];
  armies?: Army[];
  storyStart?: number;
  displayMode?: HistoryDisplay;
  pacing?: PacingKey[];
  shots?: Shot[];
  videoFrame?: VideoFrame; // landscape when missing
  selectedMapFilename?: string | null;
  viewport?: SavedViewport | null;
  // The battles, each with its own units, paths and armies. The units, paths and armies above
  // are the main map's.
  battles?: SavedBattle[];
}

export type ToolbarTabId =
  | "assets"
  | "psd"
  | "portrait"
  | "paths"
  | "armies"
  | "battles";

export interface AssetFile {
  path: string;
  filename: string;
  folder: string | null;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface PsdLayer {
  index: number;
  name: string;
  filename: string;
}

export interface RecolourSpec {
  interior: RgbColor;
  border: RgbColor;
  fill: RgbColor;
  stroke: RgbColor;
}

// The map point at the centre of the screen plus the zoom level,
// so a saved view restores correctly on any window size
export interface SavedViewport {
  centerX: number;
  centerY: number;
  scale: number;
}

// How ProjectView reads and applies the map's current view
export interface ViewportApi {
  get: () => SavedViewport | null;
  apply: (viewport: SavedViewport) => void;
}

export interface PathPoint {
  x: number;
  y: number;
}

// A unit's place in a path's formation, measured from the formation's centre
// along and across the direction of travel, so the formation turns with the path
export interface PathAssignment {
  unitId: string;
  forward: number;
  right: number;
}

export interface MapPath {
  id: string;
  name: string;
  points: PathPoint[];
  assignments: PathAssignment[];
  // The way the group attached to this path faces at rest, in degrees (0 = right, 90 = down,
  // -90 = up). Formation slots are measured against it, so the formation keeps its shape
  // whichever way the route leaves. Missing on older paths, which use the start heading.
  direction?: number;
  // When this path's march happens in history. Set when units are attached.
  march?: MarchTiming;
  // The army this march belongs to, if any
  armyId?: string;
}

// From version 1 project files only: how the date was shown, and the date markers that
// paired seconds on the video with dates. They are converted when the project loads.
export type DateMode = "months" | "days";

export interface DateMarker {
  id: string;
  time: number; // seconds on the video's timeline
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

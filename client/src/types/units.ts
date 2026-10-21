// Units on the map: pictures, formation blocks, how they leave, and armies

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
  // When the unit exists in history (days since 1 January 1970, see utils/history/historyTime).
  // Missing means it is there from the start of the story, and never leaves.
  appears?: number;
  leaves?: number;
  // A formation block instead of a picture: a labelled, coloured rectangle as history books
  // draw troops (see utils/units/blocks). Blocks keep scale 1 and are sized by their own width and
  // depth; their front is the top edge, so they face up like unit art.
  block?: FormationBlock;
  // How the unit goes when it leaves (see utils/units/exits): a death or other leaving animation,
  // and a marker left where it went. Missing means it simply vanishes.
  exit?: UnitExit;
}

// The ways a unit can go when it leaves: fades away, topples over, breaks into pieces, goes
// under the water, breaks and runs, or tears like paper into an X
export type ExitStyle = "fade" | "fall" | "shatter" | "sink" | "rout" | "tear";

// What's left where a unit went: a small cross, or a dark patch of ground
export type MarkerKind = "cross" | "patch";

export interface UnitExit {
  style: ExitStyle;
  seconds?: number; // how long it takes, in seconds of video; each style has its own default
  marker?: MarkerKind;
  // The marker fades this many seconds of video after the unit has gone. Missing means it
  // stays for good.
  markerFades?: number;
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
  // Losses over time: the block thins (its back edge comes forward) and any number in its size
  // counts down. Missing when it loses nobody.
  losses?: BlockLoss[];
}

// A block losing `share` of its starting strength (0.3 is 30%) steadily from `start` to `end`
// (days since 1 January 1970, see utils/history/historyTime)
export interface BlockLoss {
  start: number;
  end: number;
  share: number;
}

// A unit's time in an army: from `joins` until `leaves` (days since 1 January 1970, see
// utils/history/historyTime). Missing `joins` means from the start; missing `leaves` means for good.
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

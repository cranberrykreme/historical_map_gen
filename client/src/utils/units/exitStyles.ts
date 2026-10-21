// Leaving: the styles a unit can leave in, and their settings

import { ExitStyle, MarkerKind, Unit, UnitExit } from "../../types";
import { unitFacing } from "../marches/unitFacing";

export const EXIT_STYLES: {
  style: ExitStyle;
  label: string;
  hint: string;
  seconds: number;
}[] = [
  { style: "fade", label: "Fade", hint: "Fades away", seconds: 1 },
  {
    style: "fall",
    label: "Fall",
    hint: "Topples over and fades: a single soldier or a portrait",
    seconds: 1.4,
  },
  {
    style: "shatter",
    label: "Shatter",
    hint: "Breaks into pieces that fly apart: a unit destroyed",
    seconds: 1.4,
  },
  {
    style: "sink",
    label: "Sink",
    hint: "Tilts, shrinks and goes under with ripples: ships",
    seconds: 2,
  },
  {
    style: "rout",
    label: "Rout",
    hint: "Flickers and drifts backwards as it fades: troops breaking and running",
    seconds: 1.6,
  },
  {
    style: "tear",
    label: "Tear",
    hint: "Tears like paper from both top corners into an X, then falls apart",
    seconds: 1.8,
  },
];

export const exitStyleInfo = (style: ExitStyle) =>
  EXIT_STYLES.find((s) => s.style === style) ?? EXIT_STYLES[0];

export const MARKER_KINDS: { kind: MarkerKind; label: string; hint: string }[] =
  [
    { kind: "cross", label: "Cross", hint: "A small cross where it fell" },
    {
      kind: "patch",
      label: "Patch",
      hint: "A dark patch of ground where it fell",
    },
  ];

// How long an animation can take, in seconds of video
export const EXIT_SECONDS = { min: 0.3, max: 6 };
// How long a marker can stay before fading, in seconds of video
export const MARKER_FADES = { min: 1, max: 120 };
// How long a marker takes to fade once its time is up, in seconds of video
export const MARKER_FADE_SECONDS = 1;

export const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, n));
const isNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

// A leaving animation with its settings in range (or undefined if it isn't one)
export function tidyExit(
  exit: UnitExit | undefined | null
): UnitExit | undefined {
  if (!exit || !EXIT_STYLES.some((s) => s.style === exit.style))
    return undefined;
  const out: UnitExit = { style: exit.style };
  if (isNumber(exit.seconds))
    out.seconds =
      Math.round(clamp(exit.seconds, EXIT_SECONDS.min, EXIT_SECONDS.max) * 10) /
      10;
  if (exit.marker && MARKER_KINDS.some((m) => m.kind === exit.marker)) {
    out.marker = exit.marker;
    if (isNumber(exit.markerFades))
      out.markerFades = Math.round(
        clamp(exit.markerFades, MARKER_FADES.min, MARKER_FADES.max)
      );
  }
  return out;
}

// How long a unit's leaving animation takes, in seconds of video
export const exitSeconds = (exit: UnitExit) =>
  exit.seconds ?? exitStyleInfo(exit.style).seconds;

// The death a unit gets if it dies without one set: ships sink, blocks shatter, portraits tear,
// anything else fades
export function defaultExit(unit: Unit): UnitExit {
  if (unit.block) return { style: "shatter" };
  if (unit.assetType === "portraits") return { style: "tear" };
  if (unitFacing(unit).travelMode === "upright") return { style: "sink" };
  return { style: "fade" };
}

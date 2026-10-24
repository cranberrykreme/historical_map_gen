import { Shot } from "../../types";
import { formatSeconds } from "./shots";
import { playedTransition } from "./camera";

// A shot opened in the timeline (double-click it in Video mode): its own rows, in its own
// seconds. Only rows with something in them show; later weeks add rows for characters,
// effects, light and sound by adding a kind of row here.

export interface ShotBar {
  from: number; // seconds into the shot
  to: number;
  label: string;
  hint?: string;
}

export interface ShotRow {
  key: string;
  label: string;
  bars: ShotBar[];
}

// Rows the "+ Row" menu will offer, and the week that brings what goes on them
export const LATER_ROWS: { label: string; week: string }[] = [
  { label: "Characters", week: "9.9" },
  { label: "Overlays (popups, portraits, name tags)", week: "10.5" },
  { label: "Narration", week: "10" },
  { label: "Sound", week: "10" },
  { label: "Effects and light", week: "15.8" },
];

const TRANSITION_WORDS: Record<string, string> = {
  fade: "Fade through black",
  dissolve: "Dissolve",
  wipe: "Wipe",
};

// What the camera does through the shot, in words
export function cameraWords(shot: Shot, followName: string | null): string {
  const start = shot.followOn
    ? "Carries on from the shot before"
    : shot.startView
      ? "Starts at its own view"
      : "Starts where the camera was";
  const end = shot.endView ? ", moves to its end view" : ", holds";
  const follow = followName ? ` · follows ${followName}` : "";
  return `${start}${end}${follow}`;
}

// The rows of the shot at `index`: the camera through the whole shot, how it comes in and
// goes out (transitions sit across the cut, half in each shot), and the date in the corner
export function shotRows(
  shots: Shot[],
  index: number,
  followName: string | null
): ShotRow[] {
  const shot = shots[index];
  if (!shot) return [];
  const rows: ShotRow[] = [
    {
      key: "camera",
      label: "Camera",
      bars: [
        {
          from: 0,
          to: shot.seconds,
          label: cameraWords(shot, followName),
        },
      ],
    },
  ];

  const cuts: ShotBar[] = [];
  const inward = playedTransition(shots, index);
  if (inward) {
    const into = index === 0 ? inward.seconds : inward.seconds / 2;
    cuts.push({
      from: 0,
      to: Math.min(into, shot.seconds),
      label: `In: ${TRANSITION_WORDS[inward.kind] ?? inward.kind}`,
      hint: `${formatSeconds(inward.seconds)} across the cut`,
    });
  }
  const outward = playedTransition(shots, index + 1);
  if (outward && index + 1 < shots.length) {
    const half = outward.seconds / 2;
    cuts.push({
      from: Math.max(shot.seconds - half, 0),
      to: shot.seconds,
      label: `Out: ${TRANSITION_WORDS[outward.kind] ?? outward.kind}`,
      hint: `${formatSeconds(outward.seconds)} across the cut`,
    });
  }
  if (index === shots.length - 1 && shot.fadeOut) {
    cuts.push({
      from: Math.max(shot.seconds - shot.fadeOut, 0),
      to: shot.seconds,
      label: "Fades to black",
    });
  }
  if (cuts.length) rows.push({ key: "cuts", label: "Cuts", bars: cuts });

  if (!shot.hideDate)
    rows.push({
      key: "overlays",
      label: "Overlays",
      bars: [{ from: 0, to: shot.seconds, label: "Date" }],
    });
  return rows;
}

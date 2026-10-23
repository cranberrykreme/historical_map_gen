import { HOUR } from "./historyTime";

// How much history plays per second of preview, as offered in the control bar
export const PACES: { days: number; label: string }[] = [
  { days: HOUR, label: "1 hr" },
  { days: 6 * HOUR, label: "6 hr" },
  { days: 1, label: "1 day" },
  { days: 7, label: "1 wk" },
  { days: 365.2425 / 12, label: "1 mo" },
  { days: 365.2425, label: "1 yr" },
];

// Which of the paces is in use: the nearest one, so the dropdown always shows something
export function paceIndex(pace: number): number {
  let best = 0;
  PACES.forEach(({ days }, index) => {
    if (
      Math.abs(Math.log(days / pace)) <
      Math.abs(Math.log(PACES[best].days / pace))
    )
      best = index;
  });
  return best;
}

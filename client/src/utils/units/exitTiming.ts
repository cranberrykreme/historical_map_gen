// Leaving: when a leaving animation runs, in seconds of video

import { Shot } from "../../types";
import { HistoryTime, MINUTE } from "../history/historyTime";
import { historyAt, shotAt, shotProgress, shotStarts } from "../video/shots";

// Two moments closer than this count as the same: a shot that starts where the one before
// ended carries straight on from it
const SAME_MOMENT = MINUTE / 2;

// How many seconds of video ago the video reached history moment `leaves`, at `seconds` into
// the video. Null while the video hasn't got there yet. The search goes back through the shot on
// screen and any shots before it that carry straight on; a cut that jumps past the moment means
// it happened off screen, long ago (Infinity), while a cut landing right on it starts the
// animation at the cut.
export function videoExitAge(
  shots: Shot[],
  seconds: number,
  leaves: HistoryTime
): number | null {
  const place = shotAt(shots, seconds);
  const moment = historyAt(shots, seconds);
  if (!place || moment === null || moment < leaves) return null;
  const starts = shotStarts(shots);
  let i = place.index;
  let local = place.local;
  for (;;) {
    const shot = shots[i];
    if (shot.from < leaves) {
      // Crossed during this shot: find when, by halving (a shot only moves forwards in time)
      let low = 0;
      let high = local;
      for (let k = 0; k < 40; k++) {
        const mid = (low + high) / 2;
        const at = shot.from + (shot.to - shot.from) * shotProgress(shot, mid);
        if (at < leaves) low = mid;
        else high = mid;
      }
      return Math.max(0, seconds - (starts[i] + high));
    }
    const before = i > 0 ? shots[i - 1] : null;
    if (before && Math.abs(before.to - shot.from) < SAME_MOMENT) {
      i -= 1;
      local = before.seconds;
      continue;
    }
    return shot.from - leaves < SAME_MOMENT
      ? Math.max(0, seconds - starts[i])
      : Infinity;
  }
}

// The same in history mode, where the playhead plays `pace` days of history a second: so
// scrubbing and playing show the animation at the speed playback would
export function historyExitAge(
  moment: HistoryTime,
  leaves: HistoryTime,
  pace: number
): number | null {
  return moment < leaves ? null : (moment - leaves) / Math.max(pace, 1e-9);
}

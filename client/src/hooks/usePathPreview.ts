import { useEffect, useState } from "react";
import { useMapStore } from "../store/useMapStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { getTimeline } from "../utils/history/timeline";

const PLAY_SPEED = 100; // map units per second at 1x

// Playing a march's preview: its units walk it at a steady speed. A preview never changes
// the project. Switching marches, or closing what shows it, ends the preview and puts the
// units back where they really are.
function usePathPreview(pathId: string | null) {
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    return () => usePathToolStore.getState().clearPreview();
  }, [pathId]);

  // Advances the preview until the end of the march. Changing the speed restarts this from
  // wherever the preview has got to.
  useEffect(() => {
    if (!isPlaying || !pathId) return;
    const { paths, placedUnits } = useMapStore.getState();
    const path = paths.find((p) => p.id === pathId);
    // The whole run: the pivot on the spot at the start, then the journey along the path
    const length =
      getTimeline(paths, placedUnits).playbacks.get(pathId)?.length ?? 0;
    if (!path || length === 0) {
      setIsPlaying(false);
      return;
    }

    const current = usePathToolStore.getState().preview;
    let position =
      current && current.pathId === pathId && current.progress < 1
        ? current.progress
        : 0;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      // Cap the step so a background tab resuming doesn't make the units leap
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      position = Math.min(
        position + (elapsed * PLAY_SPEED * playbackSpeed) / length,
        1
      );
      usePathToolStore.getState().setPreview(pathId, position);
      if (position >= 1) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, pathId, playbackSpeed]);

  return { isPlaying, setIsPlaying };
}

export default usePathPreview;

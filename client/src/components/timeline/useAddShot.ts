import { useMapStore } from "../../store/useMapStore";
import { HistoryTime } from "../../utils/history/historyTime";

// Adds a shot after the selected one. The very first covers the whole story.
export function useAddShot(storyEnd: HistoryTime | null) {
  const shots = useMapStore((state) => state.shots);
  const storyStart = useMapStore((state) => state.storyStart);
  const addShot = useMapStore((state) => state.addShot);
  const selectPath = useMapStore((state) => state.selectPath);

  return () => {
    if (shots.length === 0) {
      addShot({
        from: storyStart,
        to:
          storyEnd !== null && storyEnd > storyStart
            ? storyEnd
            : storyStart + 7,
      });
    } else {
      addShot();
    }
    selectPath(null);
  };
}

import { useMapStore } from "../store/useMapStore";

function useHistory() {
  const set = useMapStore((state) => state.set);
  const undo = useMapStore((state) => state.undo);
  const redo = useMapStore((state) => state.redo);

  return { undo, redo, set };
}

export default useHistory;

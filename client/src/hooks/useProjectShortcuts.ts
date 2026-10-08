import { useEffect } from "react";
import { useMapStore } from "../store/useMapStore";
import { usePathToolStore } from "../store/usePathToolStore";
import useHistory from "./useHistory";

// The editor's keyboard shortcuts: ⌘S to save, ⌘Z / ⇧⌘Z to undo and redo, ⌘C / ⌘V to copy
// and paste units, M to mirror them, Delete to remove them, and Escape / Backspace for path
// waypoints. Everything but ⌘S is off while a PSD or portrait editor is open, or a path is
// being drawn.
function useProjectShortcuts({
  editingPsd,
  portraitSource,
  isDrawingPath,
  handleSave,
}: {
  editingPsd: string | null;
  portraitSource: string | null;
  isDrawingPath: boolean;
  handleSave: () => void;
}) {
  const { undo, redo } = useHistory();
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const removeSelectedUnits = useMapStore((state) => state.removeSelectedUnits);
  const copySelectedUnits = useMapStore((state) => state.copySelectedUnits);
  const pasteUnits = useMapStore((state) => state.pasteUnits);
  const flipSelectedUnits = useMapStore((state) => state.flipSelectedUnits);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘S saves from anywhere, even while typing in a field. Leaving the field first applies
      // what was typed, so the edit is part of the save.
      if (e.metaKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        handleSave();
        return;
      }

      if (editingPsd || portraitSource || isDrawingPath) return;

      // Don't hijack keys while typing in a text field (rename, new folder, ...)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Path editing: Escape deselects, Backspace/Delete removes the selected waypoint
      const pathTool = usePathToolStore.getState();
      if (e.key === "Escape") {
        // Only stop the browser's own Escape (leaving fullscreen) when it deselected something
        if (pathTool.selectedWaypoint) {
          e.preventDefault();
          pathTool.clearWaypoint();
        } else if (useMapStore.getState().selectedPathId) {
          e.preventDefault();
          useMapStore.getState().selectPath(null);
        }
        return;
      }
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        pathTool.selectedWaypoint
      ) {
        e.preventDefault();
        pathTool.deleteSelectedWaypoint();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedUnitIds.size > 0) {
          removeSelectedUnits();
        }
      }
      if (e.metaKey && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if (e.metaKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.metaKey && e.key === "c") {
        e.preventDefault();
        copySelectedUnits();
      }
      if (e.metaKey && e.key === "v") {
        e.preventDefault();
        pasteUnits();
      }
      // M = mirror the selected units
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "m"
      ) {
        flipSelectedUnits();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingPsd,
    portraitSource,
    isDrawingPath,
    selectedUnitIds,
    undo,
    redo,
    removeSelectedUnits,
    handleSave,
    copySelectedUnits,
    pasteUnits,
    flipSelectedUnits,
  ]);
}

export default useProjectShortcuts;

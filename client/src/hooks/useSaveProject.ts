import React, { useCallback, useEffect, useRef, useState } from "react";
import { ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { SaveStatus } from "../components/project/ProjectHeader";
import useProject, { projectSnapshot } from "./useProject";
import { isMainMap } from "../utils/scenes/kinds";
import { autosaveStep, isDocumentEdit } from "../utils/project/autosave";

const CHECK_EVERY = 300; // ms between checks for a waiting autosave
const SAVED_SHOWN_FOR = 1500; // ms "Saved" stays in the header

// Saving the project. It saves itself a moment after each edit (never mid-drag, while the
// video plays or while a march is being drawn); ⌘S and the Save button save at once. The
// status goes to the header: Saving…, Saved, or Couldn't save, which stays until a save works.
// Autosave only starts once a project has finished loading (`markLoaded`), and stops before
// the next one is cleared away (`markUnloaded`), so a half-loaded project is never saved.
function useSaveProject(
  saveProject: ReturnType<typeof useProject>["saveProject"],
  viewportApiRef: React.RefObject<ViewportApi | null>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const armed = useRef(false);
  const dirty = useRef(false);
  const saving = useRef(false);
  const lastEdit = useRef(0);
  const pointerDown = useRef(false);
  const savedTimer = useRef<number | undefined>(undefined);

  // Runs one save and shows how it went
  const runSave = useCallback(
    async (withViewport: boolean) => {
      dirty.current = false;
      saving.current = true;
      window.clearTimeout(savedTimer.current);
      setSaveStatus("saving");
      const state = useMapStore.getState();
      // The saved view is the main map's, so saving while a battle is open keeps the last
      // one. Autosaves leave it out, and Flask keeps the last saved view.
      const viewport =
        withViewport && isMainMap(state.activeSceneId)
          ? viewportApiRef.current?.get()
          : undefined;
      const saved = await saveProject(projectSnapshot(viewport));
      saving.current = false;
      // The video's camera opens on the view just saved
      if (saved && viewport) state.setSavedViewport(viewport);
      if (saved) {
        setSaveStatus("saved");
        savedTimer.current = window.setTimeout(
          () => setSaveStatus((now) => (now === "saved" ? "idle" : now)),
          SAVED_SHOWN_FOR
        );
      } else {
        setSaveStatus("failed");
      }
      return saved;
    },
    [saveProject, viewportApiRef]
  );

  // ⌘S, the Save button and Retry
  const handleSave = useCallback(() => {
    runSave(true);
  }, [runSave]);

  // Rename and delete change files on disk, so they save the project straight away
  const autoSaveFromStore = useCallback(() => {
    runSave(false);
  }, [runSave]);

  const markLoaded = useCallback(() => {
    dirty.current = false;
    armed.current = true;
  }, []);

  const markUnloaded = useCallback(() => {
    armed.current = false;
    dirty.current = false;
  }, []);

  // Every edit to the project starts the wait again
  useEffect(
    () =>
      useMapStore.subscribe((state, prev) => {
        if (!armed.current || !isDocumentEdit(state, prev)) return;
        dirty.current = true;
        lastEdit.current = Date.now();
      }),
    []
  );

  // A held mouse button means something is being dragged
  useEffect(() => {
    const down = () => (pointerDown.current = true);
    const up = () => (pointerDown.current = false);
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("blur", up);
    };
  }, []);

  // Saves once the wait is over and nothing is in the middle of happening
  useEffect(() => {
    const timer = window.setInterval(() => {
      const step = autosaveStep(
        dirty.current,
        lastEdit.current,
        Date.now(),
        saving.current,
        {
          dragging: pointerDown.current,
          playing: useTimelineStore.getState().playing,
          drawing: usePathToolStore.getState().drawingPoints !== null,
        }
      );
      if (step === "save" && armed.current) runSave(false);
    }, CHECK_EVERY);
    return () => window.clearInterval(timer);
  }, [runSave]);

  // The browser asks before closing the tab while a save is waiting or under way
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty.current && !saving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  // Leaving the editor (back to the projects list) saves an edit that was still waiting
  useEffect(
    () => () => {
      if (armed.current && dirty.current) runSave(false);
    },
    [runSave]
  );

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  return {
    saveStatus,
    handleSave,
    autoSaveFromStore,
    markLoaded,
    markUnloaded,
  };
}

export default useSaveProject;

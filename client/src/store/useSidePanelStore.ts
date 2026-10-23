import { create } from "zustand";
import { LibrarySection, ToolbarTabId } from "../types";
import {
  clampPanelWidth,
  PanelPrefs,
  parsePanelPrefs,
  tabAfterClick,
} from "../utils/project/sidePanel";

// The side panel: which tab is open (if any), the last one opened, its width and the Library
// section. Remembered in this browser, for every project.

const KEY = "hmg-side-panel";

const load = (): PanelPrefs => {
  try {
    return parsePanelPrefs(localStorage.getItem(KEY));
  } catch {
    return parsePanelPrefs(null);
  }
};

const windowWidth = () =>
  typeof window === "undefined" ? Infinity : window.innerWidth;

interface SidePanelStore {
  openTab: ToolbarTabId | null;
  lastTab: ToolbarTabId;
  width: number;
  librarySection: LibrarySection;
  // Opens a tab's panel (or switches to it)
  open: (tab: ToolbarTabId) => void;
  // A click on a tab: opens it, or closes the panel when it's the open one
  clickTab: (tab: ToolbarTabId) => void;
  close: () => void;
  setWidth: (width: number) => void;
  setLibrarySection: (section: LibrarySection) => void;
}

const prefs = load();

export const useSidePanelStore = create<SidePanelStore>((set, get) => {
  const save = () => {
    const { openTab, lastTab, width, librarySection } = get();
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          tab: lastTab,
          open: openTab !== null,
          width,
          library: librarySection,
        })
      );
    } catch {
      // localStorage can fail (private browsing, quota); the panel just won't remember
    }
  };
  const update = (patch: Partial<SidePanelStore>) => {
    set(patch);
    save();
  };
  return {
    openTab: prefs.open ? prefs.tab : null,
    lastTab: prefs.tab,
    width: clampPanelWidth(prefs.width, windowWidth()),
    librarySection: prefs.library,
    open: (tab) => update({ openTab: tab, lastTab: tab }),
    clickTab: (tab) => {
      const next = tabAfterClick(get().openTab, tab);
      update({ openTab: next, lastTab: next ?? get().lastTab });
    },
    close: () => update({ openTab: null }),
    setWidth: (width) =>
      update({ width: clampPanelWidth(width, windowWidth()) }),
    setLibrarySection: (librarySection) => update({ librarySection }),
  };
});

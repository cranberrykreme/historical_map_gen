import { LibrarySection, ToolbarTabId } from "../../types";

// The side panel: a rail of tabs on the right edge, and the open tab's panel docked beside the
// map. The map gets narrower while a panel is open.

export const RAIL_WIDTH = 56;
export const PANEL_DEFAULT_WIDTH = 320;
export const PANEL_MIN_WIDTH = 260;
export const PANEL_MAX_WIDTH = 600;
// The map always keeps at least this much room beside an open panel
export const MAP_MIN_WIDTH = 360;

export const TAB_IDS: ToolbarTabId[] = [
  "library",
  "scenes",
  "build",
  "animate",
  "shots",
  "publish",
];

export const LIBRARY_SECTIONS: LibrarySection[] = [
  "maps",
  "units",
  "portraits",
  "tools",
];

// A panel width that fits: between the smallest and largest, and leaving the map its room in
// a window this wide
export function clampPanelWidth(width: number, windowWidth: number): number {
  const roomy = windowWidth - RAIL_WIDTH - MAP_MIN_WIDTH;
  const most = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, roomy));
  if (!Number.isFinite(width)) return Math.min(PANEL_DEFAULT_WIDTH, most);
  return Math.round(Math.min(Math.max(width, PANEL_MIN_WIDTH), most));
}

// Clicking a tab opens it; clicking the open tab again closes the panel
export const tabAfterClick = (
  open: ToolbarTabId | null,
  clicked: ToolbarTabId
): ToolbarTabId | null => (open === clicked ? null : clicked);

// How much of the window's right edge the rail and any open panel take
export const sideWidth = (open: boolean, panelWidth: number): number =>
  RAIL_WIDTH + (open ? panelWidth : 0);

// What this browser remembers about the panel
export interface PanelPrefs {
  tab: ToolbarTabId; // the last tab opened
  open: boolean;
  width: number;
  library: LibrarySection;
}

export const DEFAULT_PANEL_PREFS: PanelPrefs = {
  tab: "library",
  open: false,
  width: PANEL_DEFAULT_WIDTH,
  library: "maps",
};

// The tab names from before the six tabs, so a remembered tab still opens the right panel
const OLD_TABS: Record<string, ToolbarTabId> = {
  assets: "library",
  psd: "library",
  portrait: "library",
  scene: "scenes",
  drawing: "build",
  animations: "animate",
};

// Reads remembered panel settings, keeping only what's still valid
export function parsePanelPrefs(raw: string | null): PanelPrefs {
  let data: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") data = parsed;
  } catch {
    // Not JSON: start from the defaults
  }
  const tabName = typeof data.tab === "string" ? data.tab : "";
  const tab = TAB_IDS.includes(tabName as ToolbarTabId)
    ? (tabName as ToolbarTabId)
    : (OLD_TABS[tabName] ?? DEFAULT_PANEL_PREFS.tab);
  const library = LIBRARY_SECTIONS.includes(data.library as LibrarySection)
    ? (data.library as LibrarySection)
    : DEFAULT_PANEL_PREFS.library;
  const width =
    typeof data.width === "number" && Number.isFinite(data.width)
      ? data.width
      : DEFAULT_PANEL_PREFS.width;
  return { tab, open: data.open === true, width, library };
}

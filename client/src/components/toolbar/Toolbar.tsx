import React, { useEffect, useRef } from "react";
import ToolbarTabRail, { ToolbarTab } from "./ToolbarTabRail";
import LibraryPanel from "./LibraryPanel";
import ScenesPanel from "./ScenesPanel";
import BuildPanel from "./BuildPanel";
import AnimationsPanel from "./AnimationsPanel";
import ShotsPanel from "./ShotsPanel";
import PublishPanel from "./PublishPanel";
import { AssetType, ToolbarTabId } from "../../types";
import { useSidePanelStore } from "../../store/useSidePanelStore";
import { useMapStore } from "../../store/useMapStore";
import { sideWidth } from "../../utils/project/sidePanel";
import { activeBattle } from "../../utils/scenes/kinds";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onAddAsset: (type: AssetType | null) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onAssetRenamed: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;
  onSelectPsd: (name: string) => void;
  onSelectPortraitSource: (filename: string) => void;
}

// The six tabs, in the order a video is made
export const TABS: ToolbarTab[] = [
  {
    id: "library",
    icon: "❖",
    word: "Library",
    hint: "Library: maps, units, portraits and tools",
  },
  {
    id: "scenes",
    icon: "⚔",
    word: "Scenes",
    hint: "Scenes: the main map and battles",
  },
  {
    id: "build",
    icon: "⚒",
    word: "Build",
    hint: "Build: marches, armies and terrain in the open scene",
  },
  {
    id: "animate",
    icon: "✦",
    word: "Animate",
    hint: "Animate: arrivals, deaths, losses and army joins",
  },
  { id: "shots", icon: "▤", word: "Shots", hint: "Shots and chapters" },
  {
    id: "publish",
    icon: "↗",
    word: "Publish",
    hint: "Publish: render the video",
  },
];

// What's open in the editor, under the panel's title, for the tabs about the open scene
function OpenScene() {
  const battle = useMapStore(activeBattle);
  return <>{battle ? battle.name : "Main map"}</>;
}
const SHOWS_SCENE: ToolbarTabId[] = ["build", "animate"];

// Keys typed into a field are the field's
const typing = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable)
  );
};

// The side panel: a rail of tabs on the right edge, and the open tab's panel beside the map.
// A click opens a tab and it stays open; clicking it again, the ×, or Escape closes it. Drag
// the panel's left edge to make it wider or narrower. The tab, width and whether it's open are
// remembered in this browser.
function Toolbar({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
  onSelectPsd,
  onSelectPortraitSource,
}: ToolbarProps) {
  const openTab = useSidePanelStore((state) => state.openTab);
  const width = useSidePanelStore((state) => state.width);
  const clickTab = useSidePanelStore((state) => state.clickTab);
  const close = useSidePanelStore((state) => state.close);
  const setWidth = useSidePanelStore((state) => state.setWidth);
  const resizing = useRef<{ x: number; width: number } | null>(null);

  // The map, timeline and header make room for the side through this variable
  const side = sideWidth(openTab !== null, width);
  useEffect(() => {
    document.documentElement.style.setProperty("--side-width", `${side}px`);
  }, [side]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--side-width");
    },
    []
  );

  // Escape closes the panel, unless something else used it first (cancelling a march being
  // drawn, deselecting, closing a dialog) or it was typed into a field. Those run in their own
  // listeners, so this looks once they've all had the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || typing(e.target)) return;
      setTimeout(() => {
        if (!e.defaultPrevented && useSidePanelStore.getState().openTab)
          useSidePanelStore.getState().close();
      }, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A window made narrower keeps the panel within it
  useEffect(() => {
    const onResize = () => {
      const { width, setWidth } = useSidePanelStore.getState();
      setWidth(width);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = { x: e.clientX, width };
    document.body.style.cursor = "ew-resize";
    const onMove = (move: MouseEvent) => {
      const start = resizing.current;
      if (start) setWidth(start.width + (start.x - move.clientX));
    };
    const onUp = () => {
      resizing.current = null;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const tab = TABS.find((t) => t.id === openTab);

  return (
    <div className={styles.side} style={{ width: side }}>
      {tab && (
        <div className={styles.panel} style={{ width }}>
          <div
            className={styles.resizeEdge}
            onMouseDown={startResize}
            title="Drag to make the panel wider or narrower"
          />
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{tab.word}</span>
            {SHOWS_SCENE.includes(tab.id) && (
              <span className={styles.panelSub}>
                <OpenScene />
              </span>
            )}
            <button
              className={styles.closeButton}
              onClick={close}
              title="Close the panel (Esc)"
            >
              ×
            </button>
          </div>
          <div className={styles.panelBody}>
            {tab.id === "library" && (
              <LibraryPanel
                onAddAsset={onAddAsset}
                selectedMapFilename={selectedMapFilename}
                onSelectMap={onSelectMap}
                onDeleteAsset={onDeleteAsset}
                onAssetRenamed={onAssetRenamed}
                onSelectPsd={onSelectPsd}
                onSelectPortraitSource={onSelectPortraitSource}
              />
            )}
            {tab.id === "scenes" && <ScenesPanel />}
            {tab.id === "build" && <BuildPanel />}
            {tab.id === "animate" && <AnimationsPanel />}
            {tab.id === "shots" && <ShotsPanel />}
            {tab.id === "publish" && <PublishPanel />}
          </div>
        </div>
      )}

      <ToolbarTabRail tabs={TABS} activeTab={openTab} onClickTab={clickTab} />
    </div>
  );
}

export default Toolbar;

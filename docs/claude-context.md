# HistoryMapGenerator: client context

Generated on branch `refactor/split-large-files`. It contains the `client/src` tree (with line counts), then the full source of every file under `store/`, `utils/`, `types/`, `components/timeline/` and `components/toolbar/`, plus `hooks/useProject.ts`.

## client/src tree

```
src/
├── components/
│   ├── portrait-editor/
│   │   ├── PortraitCanvas.tsx (249)
│   │   ├── PortraitEditor.module.css (33)
│   │   └── PortraitEditor.tsx (304)
│   ├── psd-editor/
│   │   ├── PsdColorPalette.module.css (43)
│   │   ├── PsdColorPalette.tsx (45)
│   │   ├── PsdEditor.module.css (244)
│   │   ├── PsdEditor.tsx (382)
│   │   ├── PsdEditorCanvas.module.css (82)
│   │   ├── PsdEditorCanvas.tsx (148)
│   │   ├── PsdLayerList.module.css (73)
│   │   └── PsdLayerList.tsx (68)
│   ├── timeline/
│   │   ├── describe.ts (23)
│   │   ├── fields.tsx (182)
│   │   ├── MarchBar.tsx (165)
│   │   ├── MarchEditor.tsx (40)
│   │   ├── StoryStartEditor.tsx (34)
│   │   ├── Timeline.module.css (500)
│   │   ├── Timeline.tsx (160)
│   │   ├── TimelineRows.tsx (253)
│   │   ├── Transport.tsx (164)
│   │   ├── usePlayback.ts (36)
│   │   ├── useRowsHeight.ts (58)
│   │   ├── useSelectionReveal.ts (56)
│   │   └── useTimelineWheel.ts (47)
│   ├── toolbar/
│   │   ├── ArmiesPanel.tsx (325)
│   │   ├── AssetSection.module.css (98)
│   │   ├── AssetSection.tsx (177)
│   │   ├── AssetsPanel.module.css (33)
│   │   ├── AssetsPanel.tsx (93)
│   │   ├── AttachedUnitsSection.tsx (144)
│   │   ├── DeleteButton.module.css (25)
│   │   ├── MapSection.module.css (72)
│   │   ├── MapSection.tsx (71)
│   │   ├── PathList.tsx (84)
│   │   ├── PathPreview.tsx (105)
│   │   ├── PathsPanel.module.css (236)
│   │   ├── PathsPanel.tsx (157)
│   │   ├── PortraitPanel.tsx (88)
│   │   ├── PsdPanel.module.css (74)
│   │   ├── PsdPanel.tsx (76)
│   │   ├── SelectedUnitsSection.tsx (180)
│   │   ├── Toolbar.module.css (31)
│   │   ├── Toolbar.tsx (80)
│   │   ├── ToolbarButton.module.css (61)
│   │   ├── ToolbarButton.tsx (42)
│   │   ├── ToolbarTabRail.module.css (9)
│   │   ├── ToolbarTabRail.tsx (36)
│   │   ├── UnitThumbnail.module.css (56)
│   │   └── UnitThumbnail.tsx (105)
│   ├── AssetTypePopup.module.css (73)
│   ├── AssetTypePopup.tsx (57)
│   ├── DateDisplay.module.css (15)
│   ├── DateDisplay.tsx (20)
│   ├── DropZoneOverlay.module.css (48)
│   ├── DropZoneOverlay.tsx (84)
│   ├── MapCanvas.tsx (319)
│   ├── PathDrawOverlay.module.css (25)
│   ├── PathDrawOverlay.tsx (91)
│   ├── PathLayer.tsx (405)
│   ├── ProjectHeader.module.css (90)
│   ├── ProjectHeader.tsx (83)
│   ├── Timeline.tsx (2)
│   └── UnitLayer.tsx (418)
├── config/
│   └── api.ts (4)
├── constants/
│   └── palette.ts (41)
├── hooks/
│   ├── useAssetDrop.ts (59)
│   ├── useEditHistory.ts (56)
│   ├── useHistory.ts (11)
│   ├── useMapFetch.ts (35)
│   ├── useMapInteraction.ts (89)
│   ├── usePanZoom.ts (132)
│   ├── usePersistedCollapse.ts (33)
│   ├── usePortraitImage.ts (33)
│   ├── useProject.ts (82)
│   ├── useProjectShortcuts.ts (125)
│   ├── usePsdComposite.ts (135)
│   ├── usePsdLayerColouring.ts (106)
│   ├── usePsdLayers.ts (25)
│   └── useSelectionBox.ts (98)
├── pages/
│   ├── HomeScreen.module.css (108)
│   ├── HomeScreen.tsx (297)
│   └── ProjectView.tsx (261)
├── store/
│   ├── map/
│   │   ├── armiesSlice.ts (152)
│   │   ├── history.ts (92)
│   │   ├── pathsSlice.ts (273)
│   │   ├── selectionSlice.ts (47)
│   │   ├── storySlice.ts (45)
│   │   ├── types.ts (173)
│   │   └── unitsSlice.ts (346)
│   ├── armies.test.ts (114)
│   ├── armyErase.test.ts (101)
│   ├── armyMarches.test.ts (241)
│   ├── pathAttach.test.ts (199)
│   ├── pathChaining.test.ts (285)
│   ├── pathTiming.test.ts (141)
│   ├── timelineStore.test.ts (53)
│   ├── unitForward.test.ts (70)
│   ├── unitLifespans.test.ts (86)
│   ├── useAssetStore.ts (244)
│   ├── useMapStore.test.ts (86)
│   ├── useMapStore.ts (50)
│   ├── usePathToolStore.test.ts (133)
│   ├── usePathToolStore.ts (164)
│   └── useTimelineStore.ts (147)
├── styles/
│   └── tokens.css (42)
├── types/
│   └── index.ts (159)
├── utils/
│   ├── timeline/
│   │   ├── chaining.ts (145)
│   │   ├── engine.ts (259)
│   │   └── view.ts (76)
│   ├── armies.test.ts (149)
│   ├── armies.ts (348)
│   ├── chevrons.test.ts (33)
│   ├── convertArmies.test.ts (122)
│   ├── convertProject.test.ts (162)
│   ├── convertProject.ts (306)
│   ├── dates.test.ts (135)
│   ├── dates.ts (121)
│   ├── formation.test.ts (304)
│   ├── formation.ts (244)
│   ├── historyEdit.test.ts (80)
│   ├── historyEdit.ts (74)
│   ├── historyTime.test.ts (109)
│   ├── historyTime.ts (146)
│   ├── lifespans.test.ts (65)
│   ├── lifespans.ts (71)
│   ├── marches.test.ts (118)
│   ├── marches.ts (106)
│   ├── nearestOnPath.test.ts (39)
│   ├── pathGeometry.test.ts (86)
│   ├── pathGeometry.ts (325)
│   ├── pathHeading.test.ts (23)
│   ├── pathPhases.test.ts (99)
│   ├── pathPlayback.test.ts (483)
│   ├── pathPlayback.ts (231)
│   ├── portraitCircle.ts (52)
│   ├── portraitRender.ts (67)
│   ├── recolour.ts (60)
│   ├── timeline.test.ts (304)
│   ├── timeline.ts (33)
│   ├── timelineRows.test.ts (137)
│   ├── timelineRows.ts (106)
│   ├── timelineView.test.ts (59)
│   ├── travelSides.test.ts (53)
│   ├── unitFacing.test.ts (80)
│   └── unitFacing.ts (65)
├── App.module.css (6)
├── App.tsx (15)
├── index.css (15)
├── index.tsx (16)
└── react-app-env.d.ts (1)
```

## client/src/components/timeline/MarchBar.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  barPlacement,
  HistoryView,
  keepAfter,
  snapStepFor,
  viewShowing,
} from "../../utils/timeline";
import { dragMarch, MarchDragMode } from "../../utils/marches";
import { MapPath, MarchTiming } from "../../types";
import { describe } from "./describe";
import styles from "./Timeline.module.css";

// The arrow at a row's edge when its bar is outside the stretch of history on show. Click it
// to bring the bar into view.
const OFFSCREEN: React.CSSProperties = {
  position: "absolute",
  top: 4,
  bottom: 4,
  width: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-gold-subtle)",
  border: "1px solid var(--color-gold-dim)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-gold)",
  fontSize: 10,
  cursor: "pointer",
  zIndex: 2,
};

export const MIN_BAR_PX = 6; // a very short march still gets a bar you can see and grab

// One march's row of the bars: its bar with the drag handles, or an arrow at the edge when
// the bar is out of view
function MarchBar({
  path,
  timing,
  active,
  shown,
  trackRef,
}: {
  path: MapPath;
  timing: MarchTiming;
  active: boolean;
  shown: HistoryView;
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  const selectPath = useMapStore((state) => state.selectPath);
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const storyStart = useMapStore((state) => state.storyStart);
  const setDraftTiming = useTimelineStore((state) => state.setDraftTiming);
  const setView = useTimelineStore((state) => state.setView);

  const span = shown.to - shown.from;
  const percent = (t: number) => ((t - shown.from) / span) * 100;

  const reveal = (e: React.MouseEvent) => {
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);
    setView(viewShowing(timing, shown));
  };

  // Dragging a bar moves the march; its ends change its dates; the line between the turn
  // and the march changes how long the turn takes
  const startBarDrag = (e: React.MouseEvent, mode: MarchDragMode) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const daysPerPixel = span / rect.width;
    const snap = snapStepFor(daysPerPixel);
    const startX = e.clientX;
    let latest = timing;

    const onMove = (ev: MouseEvent) => {
      const dragged = dragMarch(
        timing,
        (ev.clientX - startX) * daysPerPixel,
        mode,
        snap
      );
      latest = keepAfter(dragged, storyStart, mode === "move");
      setDraftTiming({ pathId: path.id, timing: latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraftTiming(null);
      if (
        latest.start !== timing.start ||
        latest.end !== timing.end ||
        latest.turn !== timing.turn
      ) {
        setMarchTiming(path.id, latest);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const length = timing.end - timing.start;
  const turnShare = length > 0 ? (timing.turn / length) * 100 : 0;
  const placement = barPlacement(timing, shown);

  return (
    <div className={styles.row}>
      {placement === "before" && (
        <div
          style={{ ...OFFSCREEN, left: 2 }}
          title={`Earlier: ${describe(timing)}\nClick to show it`}
          onMouseDown={reveal}
        >
          {"◂"}
        </div>
      )}
      {placement === "after" && (
        <div
          style={{ ...OFFSCREEN, right: 2 }}
          title={`Later: ${describe(timing)}\nClick to show it`}
          onMouseDown={reveal}
        >
          {"▸"}
        </div>
      )}
      <div
        className={`${styles.bar} ${active ? styles.barActive : ""}`}
        style={{
          left: `${percent(timing.start)}%`,
          width: `${(length / span) * 100}%`,
          minWidth: MIN_BAR_PX,
          display: placement === "inside" ? undefined : "none",
        }}
        title={describe(timing)}
        onMouseDown={(e) => startBarDrag(e, "move")}
      >
        <div className={styles.barTurn} style={{ width: `${turnShare}%` }} />
        <div className={styles.barMarch} style={{ left: `${turnShare}%` }} />
        <div
          className={styles.splitHandle}
          style={{ left: `${turnShare}%` }}
          title="Drag to change how long the turn takes"
          onMouseDown={(e) => startBarDrag(e, "split")}
        />
        <div
          className={`${styles.handle} ${styles.handleStart}`}
          onMouseDown={(e) => startBarDrag(e, "start")}
        />
        <div
          className={`${styles.handle} ${styles.handleEnd}`}
          onMouseDown={(e) => startBarDrag(e, "end")}
        />
      </div>
    </div>
  );
}

export default MarchBar;
```

## client/src/components/timeline/MarchEditor.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { formatDuration } from "../../utils/historyTime";
import { MapPath, MarchTiming } from "../../types";
import { DurationInput, MomentInput } from "./fields";
import styles from "./Timeline.module.css";

// Exact dates for the selected march. Each change is one undo step.
function MarchEditor({ path, timing }: { path: MapPath; timing: MarchTiming }) {
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const marching = timing.end - timing.start - timing.turn;

  return (
    <div className={styles.editor}>
      <span className={styles.editorTitle} title={path.name}>
        {path.name}
      </span>
      <MomentInput
        label="Starts"
        value={timing.start}
        onCommit={(start) => setMarchTiming(path.id, { ...timing, start })}
      />
      <MomentInput
        label="Ends"
        value={timing.end}
        onCommit={(end) => setMarchTiming(path.id, { ...timing, end })}
      />
      <DurationInput
        label="Turning"
        value={timing.turn}
        onCommit={(turn) => setMarchTiming(path.id, { ...timing, turn })}
      />
      <span className={styles.editorDim}>
        Marching: {formatDuration(marching)}
      </span>
    </div>
  );
}

export default MarchEditor;
```

## client/src/components/timeline/StoryStartEditor.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { formatHistoryTime, HistoryTime } from "../../utils/historyTime";
import { allowedStoryStart } from "../../utils/historyEdit";
import { MomentInput } from "./fields";
import styles from "./Timeline.module.css";

// When the story begins. It can't be later than the first march.
function StoryStartEditor({ firstMarch }: { firstMarch: HistoryTime | null }) {
  const storyStart = useMapStore((state) => state.storyStart);
  const setStoryStart = useMapStore((state) => state.setStoryStart);

  const commit = (wanted: HistoryTime) => {
    const next = allowedStoryStart(wanted, firstMarch);
    setStoryStart(next);
    // A playhead at or before the new start is at the start
    const timeline = useTimelineStore.getState();
    if (timeline.now !== null && timeline.now <= next) timeline.setNow(null);
  };

  return (
    <div className={styles.editor}>
      <MomentInput label="Story starts" value={storyStart} onCommit={commit} />
      <span className={styles.editorDim}>
        {firstMarch !== null
          ? `No later than the first march (${formatHistoryTime(firstMarch, "times")})`
          : "Select a march to edit its dates"}
      </span>
    </div>
  );
}

export default StoryStartEditor;
```

## client/src/components/timeline/Timeline.module.css

```css
.timeline {
  position: fixed;
  left: var(--space-md);
  right: 72px;
  bottom: var(--space-md);
  z-index: 800;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  font-family: var(--font-ui);
  user-select: none;
  /* Never taller than the window: the rows area shrinks and scrolls first */
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2 * var(--space-md));
}

.transport {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
}

.iconButton {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  color: var(--color-gold);
  font-size: 14px;
  cursor: pointer;
}

.iconButton:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-gold-dim);
}

.playButton {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gold-subtle);
  border: 1px solid var(--color-gold);
  border-radius: 50%;
  color: var(--color-gold);
  font-size: 13px;
  cursor: pointer;
}

.playButton:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.time {
  min-width: 190px;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-variant-numeric: tabular-nums;
}

.speed {
  display: flex;
}

.speedButton {
  padding: 2px var(--space-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.speedButton:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.speedButton:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.speedActive {
  background: var(--color-gold-subtle);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.note {
  color: var(--color-text-dim);
  font-size: var(--font-size-sm);
}

.spacer {
  flex: 1;
}

/* Room for the ruler and about seven rows before it scrolls. The height you drag the top
   edge to is set on the element and overrides this. The columns start at the top and are
   as tall as their rows (flex-start), rather than being stretched to the visible height,
   so rows below the fold aren't clipped away. */
.body {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  max-height: 228px;
  overflow-y: auto;
  border-top: 1px solid var(--color-border-subtle);
}

.labels {
  width: 140px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-subtle);
}

/* Stays at the top beside the ruler while the rows scroll */
.labelSpacer {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  box-sizing: border-box;
}

.label {
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-sm);
  border-bottom: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.labelActive {
  color: var(--color-gold);
}

/* `clip` rather than `hidden`: it trims bars and labels at the sides without becoming its
   own scrolling box, so the ruler can stay pinned while the rows scroll */
.tracks {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: clip;
  cursor: pointer;
}

/* Stays at the top while the rows scroll */
.ruler {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
}

.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px solid var(--color-border-subtle);
}

.tickLabel {
  position: absolute;
  top: 4px;
  left: 4px;
  color: var(--color-text-dim);
  font-size: 10px;
  white-space: nowrap;
}

.row {
  position: relative;
  height: 28px;
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
}

.bar {
  position: absolute;
  top: 4px;
  bottom: 4px;
  min-width: 2px;
  border: 1px solid var(--color-gold-dim);
  border-radius: var(--radius-sm);
  cursor: grab;
}

.barActive {
  border-color: var(--color-gold);
}

/* The turn on the spot, then the march itself */
.barTurn {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgba(110, 160, 220, 0.35);
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  pointer-events: none;
}

.barMarch {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  background: var(--color-gold-subtle);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  pointer-events: none;
}

.barActive .barTurn {
  background: rgba(110, 160, 220, 0.6);
}

.barActive .barMarch {
  background: rgba(200, 168, 75, 0.35);
}

/* The line between turning and marching: drag it to make the turn faster or slower */
.splitHandle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  margin-left: -4px;
  z-index: 1;
  cursor: col-resize;
}

.splitHandle::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 3px;
  width: 2px;
  background: rgba(232, 224, 208, 0.7);
  border-radius: 1px;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  z-index: 2;
  cursor: ew-resize;
}

.handleStart {
  left: -4px;
}

.handleEnd {
  right: -4px;
}

.empty {
  padding: var(--space-sm);
  color: var(--color-text-dim);
  font-size: var(--font-size-sm);
}

/* Above the pinned ruler, so it shows the whole way up */
.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
  width: 2px;
  margin-left: -1px;
  background: #e8e0d0;
  pointer-events: none;
}

.modeLabel {
  color: var(--color-text-dim);
  font-size: var(--font-size-sm);
}

.textButton {
  padding: 2px var(--space-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.textButton:hover:not(:disabled) {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.textButton:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Shading over the history before the story starts */
.beforeStart {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

/* The row for typing exact dates: the selected march's, or the story's start */
.editor {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-md);
  padding: var(--space-xs) var(--space-sm);
  border-top: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.editorTitle {
  max-width: 140px;
  color: var(--color-gold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.editorLabel {
  margin-right: 2px;
  color: var(--color-text-dim);
}

.editorDim {
  color: var(--color-text-dim);
}

.editorInput,
.editorSelect {
  box-sizing: border-box;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  padding: 2px var(--space-xs);
  user-select: text;
}

.editorInput:focus,
.editorSelect:focus {
  outline: none;
  border-color: var(--color-gold);
}

/* No spinner arrows: they take up most of a narrow box */
.editorInput {
  -moz-appearance: textfield;
}

.editorInput::-webkit-outer-spin-button,
.editorInput::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Along the timeline's top edge: drag it up or down to give the rows more or less room */
.resizeHandle {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  z-index: 5;
  cursor: ns-resize;
}

.resizeHandle:hover::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 50%;
  width: 48px;
  height: 2px;
  margin-left: -24px;
  background: var(--color-gold-dim);
  border-radius: 1px;
}

/* An army's heading in the names column; the same height as a march's row */
.groupLabel {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 var(--space-xs);
  border-bottom: 1px solid var(--color-border-subtle);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  white-space: nowrap;
}

.groupToggle {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-gold);
  font-size: 10px;
  cursor: pointer;
}

.groupName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.groupCount {
  flex-shrink: 0;
  color: var(--color-text-dim);
  font-size: 10px;
  font-weight: normal;
}

/* A march listed under an army */
.labelIndented {
  padding-left: calc(var(--space-sm) + 14px);
}

/* An army's heading across the bars: one thin bar from its first march to its last */
.groupRow {
  position: relative;
  height: 28px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.groupBar {
  position: absolute;
  top: 11px;
  height: 6px;
  background: var(--color-gold-dim);
  border-radius: 3px;
  opacity: 0.6;
  pointer-events: none;
}

.groupBarActive {
  background: var(--color-gold);
  opacity: 1;
}
```

## client/src/components/timeline/Timeline.tsx

```tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import {
  currentMoment,
  useTimelineStore,
} from "../../store/useTimelineStore";
import { fitView, getTimeline, HistoryView } from "../../utils/timeline";
import {
  groupKeyOf,
  groupRows,
  MarchRow,
  NO_ARMY,
  RowGroup,
} from "../../utils/timelineRows";
import MarchEditor from "./MarchEditor";
import StoryStartEditor from "./StoryStartEditor";
import Transport from "./Transport";
import TimelineRows from "./TimelineRows";
import { usePlayback } from "./usePlayback";
import { useRowsHeight } from "./useRowsHeight";
import { useSelectionReveal } from "./useSelectionReveal";
import { useTimelineWheel } from "./useTimelineWheel";
import styles from "./Timeline.module.css";

function Timeline() {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const storyStart = useMapStore((state) => state.storyStart);
  const armies = useMapStore((state) => state.armies);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const expanded = useTimelineStore((state) => state.expanded);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const view = useTimelineStore((state) => state.view);
  const pause = useTimelineStore((state) => state.pause);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const collapsedGroups = useTimelineStore((state) => state.collapsedGroups);

  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const timeline = useMemo(
    () => getTimeline(paths, placedUnits),
    [paths, placedUnits]
  );
  const storyEnd = timeline.end;
  const current = currentMoment(now, storyStart);

  // The stretch of history on show: whatever you zoomed to, or the whole story. The fit
  // follows the saved dates only, so it holds still while a bar is being dragged.
  const fit = useMemo(
    () => fitView(storyStart, storyEnd),
    [storyStart, storyEnd]
  );
  const shown: HistoryView = view ?? fit;

  // One row per march; a bar being dragged shows its draft dates
  const rows: MarchRow[] = paths
    .filter((path) => timeline.timings.has(path.id))
    .map((path) => ({
      path,
      timing:
        draftTiming && draftTiming.pathId === path.id
          ? draftTiming.timing
          : timeline.timings.get(path.id)!,
    }));
  const hasMarches = rows.length > 0;
  const selectedRow = rows.find((row) => row.path.id === selectedPathId);

  // The rows, grouped by army and filtered. Headers only appear once some march belongs to
  // an army; until then it's a plain list.
  const groups = groupRows(
    rows,
    armies,
    rowFilter,
    current,
    shown,
    selectedPathId
  );
  const grouped = rows.some((row) => groupKeyOf(row.path, armies) !== NO_ARMY);
  const collapsed = new Set(collapsedGroups);
  const isOpen = (group: RowGroup) => !grouped || !collapsed.has(group.key);

  const selectedTiming = selectedPathId
    ? timeline.timings.get(selectedPathId)
    : undefined;
  const { rowRefs, headerRefs } = useSelectionReveal(
    selectedPathId,
    selectedTiming,
    selectedArmyId,
    storyStart,
    storyEnd
  );

  const { startResize, resetHeight, fittedHeight } = useRowsHeight();

  // Keep track of the bar's width, for spacing the ruler's labels
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => setTrackWidth(track.clientWidth));
    observer.observe(track);
    setTrackWidth(track.clientWidth);
    return () => observer.disconnect();
  }, [expanded]);

  useTimelineWheel(trackRef, shown, expanded, setView);

  usePlayback(playing, storyStart, storyEnd, pause);

  return (
    <div className={styles.timeline}>
      {expanded && (
        <div
          className={styles.resizeHandle}
          onMouseDown={startResize}
          onDoubleClick={resetHeight}
          title="Drag to give the marches more or less room (double-click for the usual height)"
        />
      )}
      <Transport
        current={current}
        hasMarches={hasMarches}
        storyEnd={storyEnd}
      />

      {expanded &&
        (selectedRow ? (
          <MarchEditor
            path={selectedRow.path}
            timing={timeline.timings.get(selectedRow.path.id)!}
          />
        ) : (
          <StoryStartEditor firstMarch={timeline.start} />
        ))}

      {expanded && (
        <TimelineRows
          groups={groups}
          grouped={grouped}
          isOpen={isOpen}
          shown={shown}
          current={current}
          hasMarches={hasMarches}
          height={fittedHeight}
          trackRef={trackRef}
          trackWidth={trackWidth}
          rowRefs={rowRefs}
          headerRefs={headerRefs}
        />
      )}
    </div>
  );
}

export default Timeline;
```

## client/src/components/timeline/TimelineRows.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { HistoryView } from "../../utils/timeline";
import {
  formatHistoryTime,
  historyTicks,
  HistoryTime,
} from "../../utils/historyTime";
import { RowGroup } from "../../utils/timelineRows";
import { describe, groupTitle } from "./describe";
import MarchBar, { MIN_BAR_PX } from "./MarchBar";
import styles from "./Timeline.module.css";

const TICK_SPACING = 90; // pixels between ruler labels, at least
const START_SNAP = 4; // pixels: a playhead this close to the story's start counts as at it

// The body of the timeline: the names column on the left, and the ruler, the bars and the
// playhead on the right, grouped by army
function TimelineRows({
  groups,
  grouped,
  isOpen,
  shown,
  current,
  hasMarches,
  height,
  trackRef,
  trackWidth,
  rowRefs,
  headerRefs,
}: {
  groups: RowGroup[];
  grouped: boolean;
  isOpen: (group: RowGroup) => boolean;
  shown: HistoryView;
  current: HistoryTime;
  hasMarches: boolean;
  height: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackWidth: number;
  rowRefs: React.RefObject<Map<string, HTMLDivElement>>;
  headerRefs: React.RefObject<Map<string, HTMLDivElement>>;
}) {
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const selectArmy = useMapStore((state) => state.selectArmy);

  const setNow = useTimelineStore((state) => state.setNow);
  const pause = useTimelineStore((state) => state.pause);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const toggleGroup = useTimelineStore((state) => state.toggleGroup);

  const span = shown.to - shown.from;
  const percent = (t: HistoryTime) => ((t - shown.from) / span) * 100;

  const ticks = historyTicks(
    shown.from,
    shown.to,
    Math.max(Math.floor(trackWidth / TICK_SPACING), 2)
  );

  // The moment under the pointer. Never before the story starts, and close enough to the
  // start counts as at it (null), where units can be edited.
  const momentAt = (clientX: number): HistoryTime | null => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const t = shown.from + ((clientX - rect.left) / rect.width) * span;
    const startX = rect.left + (percent(storyStart) / 100) * rect.width;
    return t <= storyStart || clientX - startX < START_SNAP ? null : t;
  };

  // Clicking or dragging on the ruler or an empty part of a row moves the playhead
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    usePathToolStore.getState().clearPreview();
    pause();
    setNow(momentAt(e.clientX));

    const onMove = (ev: MouseEvent) => setNow(momentAt(ev.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startShare = percent(storyStart);

  const emptyMessage =
    rowFilter === "now"
      ? `No marches under way on ${formatHistoryTime(current, "days")}`
      : "No marches in this stretch of history. Pan or zoom out, or click Fit.";

  // The rows a group shows: none while it's folded away
  const shownRows = (group: RowGroup) => (isOpen(group) ? group.rows : []);

  return (
    <div className={styles.body} style={{ maxHeight: height }}>
      <div className={styles.labels}>
        <div className={styles.labelSpacer} />
        {groups.map((group) => (
          <React.Fragment key={group.key}>
            {grouped && (
              <div
                ref={(el) => {
                  if (el) headerRefs.current.set(group.key, el);
                  else headerRefs.current.delete(group.key);
                }}
                className={`${styles.groupLabel} ${
                  group.army && group.army.id === selectedArmyId
                    ? styles.labelActive
                    : ""
                }`}
                title={groupTitle(group, rowFilter)}
              >
                <button
                  className={styles.groupToggle}
                  onClick={() => toggleGroup(group.key)}
                  title={
                    isOpen(group)
                      ? "Fold these marches away"
                      : "Show these marches"
                  }
                >
                  {isOpen(group) ? "▾" : "▸"}
                </button>
                <span
                  className={styles.groupName}
                  onClick={() =>
                    group.army
                      ? selectArmy(
                          group.army.id === selectedArmyId
                            ? null
                            : group.army.id
                        )
                      : toggleGroup(group.key)
                  }
                >
                  {group.army ? group.army.name : "No army"}
                </span>
                <span className={styles.groupCount}>
                  {rowFilter === "all" || group.rows.length === group.total
                    ? group.total
                    : `${group.rows.length}/${group.total}`}
                </span>
              </div>
            )}
            {shownRows(group).map(({ path, timing }) => (
              <div
                key={path.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(path.id, el);
                  else rowRefs.current.delete(path.id);
                }}
                className={`${styles.label} ${grouped ? styles.labelIndented : ""} ${
                  path.id === selectedPathId ? styles.labelActive : ""
                }`}
                title={`${path.name}\n${describe(timing)}`}
                onClick={() =>
                  selectPath(path.id === selectedPathId ? null : path.id)
                }
              >
                {path.name}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.tracks} ref={trackRef} onMouseDown={startScrub}>
        {startShare > 0 && (
          <div
            className={styles.beforeStart}
            style={{ width: `${Math.min(startShare, 100)}%` }}
            title="Before the story starts"
          />
        )}

        <div className={styles.ruler}>
          {ticks.map((tick) => (
            <div
              key={tick.time}
              className={styles.tick}
              style={{ left: `${percent(tick.time)}%` }}
            >
              <span className={styles.tickLabel}>{tick.label}</span>
            </div>
          ))}
        </div>

        {groups.map((group) => (
          <React.Fragment key={group.key}>
            {grouped && (
              <div
                className={styles.groupRow}
                title={groupTitle(group, rowFilter)}
              >
                {group.end >= shown.from && group.start <= shown.to && (
                  <div
                    className={`${styles.groupBar} ${
                      group.army && group.army.id === selectedArmyId
                        ? styles.groupBarActive
                        : ""
                    }`}
                    style={{
                      left: `${Math.max(percent(group.start), 0)}%`,
                      right: `${Math.max(100 - percent(group.end), 0)}%`,
                      minWidth: MIN_BAR_PX,
                    }}
                  />
                )}
              </div>
            )}
            {shownRows(group).map(({ path, timing }) => (
              <MarchBar
                key={path.id}
                path={path}
                timing={timing}
                active={path.id === selectedPathId}
                shown={shown}
                trackRef={trackRef}
              />
            ))}
          </React.Fragment>
        ))}

        {!hasMarches && (
          <div className={styles.empty}>
            Attach units to a path and its march appears here.
          </div>
        )}
        {hasMarches && groups.length === 0 && (
          <div className={styles.empty}>{emptyMessage}</div>
        )}

        {current >= shown.from && current <= shown.to && (
          <div
            className={styles.playhead}
            style={{ left: `${percent(current)}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default TimelineRows;
```

## client/src/components/timeline/Transport.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { isPastStart, useTimelineStore } from "../../store/useTimelineStore";
import { formatHistoryTime, HistoryTime, HOUR } from "../../utils/historyTime";
import { RowFilter } from "../../utils/timelineRows";
import { HistoryDisplay } from "../../types";
import styles from "./Timeline.module.css";

// How much history plays per second of preview
const PACES: { days: number; label: string }[] = [
  { days: HOUR, label: "1 hr" },
  { days: 6 * HOUR, label: "6 hr" },
  { days: 1, label: "1 day" },
  { days: 7, label: "1 wk" },
  { days: 365.2425 / 12, label: "1 mo" },
  { days: 365.2425, label: "1 yr" },
];

const DISPLAYS: { mode: HistoryDisplay; label: string }[] = [
  { mode: "months", label: "Months" },
  { mode: "days", label: "Days" },
  { mode: "times", label: "Times" },
];

const FILTERS: { filter: RowFilter; label: string; hint: string }[] = [
  { filter: "all", label: "All", hint: "List every march" },
  {
    filter: "now",
    label: "Now",
    hint: "List only the marches under way at the playhead",
  },
  {
    filter: "view",
    label: "In view",
    hint: "List the marches in the stretch of history on show",
  },
];

// The timeline's control strip: play and rewind, the pace, how dates are shown, Fit, which
// marches are listed, and the button that folds the timeline away
function Transport({
  current,
  hasMarches,
  storyEnd,
}: {
  current: HistoryTime;
  hasMarches: boolean;
  storyEnd: HistoryTime | null;
}) {
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const pace = useTimelineStore((state) => state.pace);
  const expanded = useTimelineStore((state) => state.expanded);
  const view = useTimelineStore((state) => state.view);
  const setNow = useTimelineStore((state) => state.setNow);
  const play = useTimelineStore((state) => state.play);
  const pause = useTimelineStore((state) => state.pause);
  const setPace = useTimelineStore((state) => state.setPace);
  const setExpanded = useTimelineStore((state) => state.setExpanded);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const setRowFilter = useTimelineStore((state) => state.setRowFilter);

  const handlePlay = () => {
    if (playing) {
      pause();
      return;
    }
    usePathToolStore.getState().clearPreview(); // the timeline and a path preview never both play
    if (storyEnd !== null && current >= storyEnd - 1e-9) setNow(null);
    play();
  };

  const handleRewind = () => {
    pause();
    setNow(null);
  };

  return (
    <div className={styles.transport}>
      <button
        className={styles.iconButton}
        onClick={handleRewind}
        title="Back to the start of the story (units can be edited there)"
      >
        {"⏮︎"}
      </button>
      <button
        className={styles.playButton}
        onClick={handlePlay}
        disabled={!hasMarches}
        title={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶︎"}
      </button>
      <span className={styles.time}>{formatHistoryTime(current, "times")}</span>
      <span className={styles.modeLabel}>Per second</span>
      <div className={styles.speed}>
        {PACES.map(({ days, label }) => (
          <button
            key={label}
            className={`${styles.speedButton} ${pace === days ? styles.speedActive : ""}`}
            onClick={() => setPace(days)}
          >
            {label}
          </button>
        ))}
      </div>
      <span className={styles.modeLabel}>Date</span>
      <div className={styles.speed} title="How the date is shown on screen">
        {DISPLAYS.map(({ mode, label }) => (
          <button
            key={mode}
            className={`${styles.speedButton} ${displayMode === mode ? styles.speedActive : ""}`}
            onClick={() => setDisplayMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={styles.textButton}
        onClick={() => setView(null)}
        disabled={view === null}
        title="Show the whole story (pinch or ⌘-scroll on the bars to zoom, swipe sideways or Shift-scroll to pan)"
      >
        Fit
      </button>
      <span className={styles.modeLabel}>Show</span>
      <div className={styles.speed} title="Which marches are listed">
        {FILTERS.map(({ filter, label, hint }) => (
          <button
            key={filter}
            title={hint}
            className={`${styles.speedButton} ${rowFilter === filter ? styles.speedActive : ""}`}
            onClick={() => setRowFilter(filter)}
          >
            {label}
          </button>
        ))}
      </div>
      {isPastStart(now, storyStart) && !playing && (
        <span className={styles.note}>
          Units can only be moved at the moment they appear
        </span>
      )}
      <div className={styles.spacer} />
      <button
        className={styles.iconButton}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse the timeline" : "Expand the timeline"}
      >
        {expanded ? "▾" : "▴"}
      </button>
    </div>
  );
}

export default Transport;
```

## client/src/components/timeline/describe.ts

```ts
import { formatDuration, formatHistoryTime } from "../../utils/historyTime";
import { RowFilter, RowGroup } from "../../utils/timelineRows";
import { MarchTiming } from "../../types";

// A march's dates, turn and march time, for its tooltips
export const describe = (timing: MarchTiming) =>
  [
    `${formatHistoryTime(timing.start, "times")} to ${formatHistoryTime(timing.end, "times")}`,
    `Turning: ${formatDuration(timing.turn)}`,
    `Marching: ${formatDuration(timing.end - timing.start - timing.turn)}`,
  ].join("\n");

// An army's name, how many of its marches are listed, and when they happen, for its tooltips
export const groupTitle = (group: RowGroup, rowFilter: RowFilter) => {
  const count =
    rowFilter === "all" || group.rows.length === group.total
      ? `${group.total} march${group.total === 1 ? "" : "es"}`
      : `${group.rows.length} of ${group.total} marches listed`;
  return `${group.army ? group.army.name : "Marches in no army"}\n${count}\n${formatHistoryTime(
    group.start,
    "times"
  )} to ${formatHistoryTime(group.end, "times")}`;
};
```

## client/src/components/timeline/fields.tsx

```tsx
import React, { useEffect, useState } from "react";
import { HistoryTime } from "../../utils/historyTime";
import {
  durationFields,
  fromDurationFields,
  fromMomentFields,
  momentFields,
  MomentFields,
  DurationFields,
} from "../../utils/historyEdit";
import { MONTH_NAMES } from "../../utils/dates";
import styles from "./Timeline.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");

// A number box that applies what you typed when you leave it or press Enter, so typing a
// year isn't a string of undo steps. Anything that isn't a number puts the old value back.
export function NumberField({
  value,
  min,
  max,
  width,
  title,
  padded,
  onCommit,
}: {
  value: number;
  min: number;
  max?: number;
  width: number;
  title: string;
  padded?: boolean;
  onCommit: (value: number) => void;
}) {
  const shown = padded ? pad2(value) : String(value);
  const [draft, setDraft] = useState(shown);

  // Follow the value when it changes elsewhere (undo, dragging the bar, another field)
  useEffect(() => setDraft(shown), [shown]);

  const finish = () => {
    const typed = Number(draft);
    setDraft(shown);
    if (draft.trim() === "" || !Number.isFinite(typed) || typed === value)
      return;
    onCommit(typed);
  };

  return (
    <input
      type="number"
      className={styles.editorInput}
      style={{ width }}
      min={min}
      max={max}
      value={draft}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

// A moment in history as day, month, year and time of day
export function MomentInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: HistoryTime;
  onCommit: (t: HistoryTime) => void;
}) {
  const fields = momentFields(value);
  const change = (patch: Partial<MomentFields>) => {
    const next = fromMomentFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.day}
        min={1}
        max={31}
        width={44}
        title="Day"
        onCommit={(day) => change({ day })}
      />
      <select
        className={styles.editorSelect}
        value={fields.month}
        title="Month"
        onChange={(e) => change({ month: Number(e.target.value) })}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <NumberField
        value={fields.year}
        min={1}
        max={9999}
        width={64}
        title="Year"
        onCommit={(year) => change({ year })}
      />
      <NumberField
        value={fields.hour}
        min={0}
        max={23}
        width={42}
        title="Hour (0 to 23)"
        padded
        onCommit={(hour) => change({ hour })}
      />
      <span className={styles.editorDim}>:</span>
      <NumberField
        value={fields.minute}
        min={0}
        max={59}
        width={42}
        title="Minute"
        padded
        onCommit={(minute) => change({ minute })}
      />
    </span>
  );
}

// A length of history as days, hours and minutes
export function DurationInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (days: number) => void;
}) {
  const fields = durationFields(value);
  const change = (patch: Partial<DurationFields>) => {
    const next = fromDurationFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.days}
        min={0}
        width={52}
        title="Days"
        onCommit={(days) => change({ days })}
      />
      <span className={styles.editorDim}>d</span>
      <NumberField
        value={fields.hours}
        min={0}
        width={42}
        title="Hours"
        onCommit={(hours) => change({ hours })}
      />
      <span className={styles.editorDim}>h</span>
      <NumberField
        value={fields.minutes}
        min={0}
        width={42}
        title="Minutes"
        onCommit={(minutes) => change({ minutes })}
      />
      <span className={styles.editorDim}>m</span>
    </span>
  );
}
```

## client/src/components/timeline/usePlayback.ts

```ts
import { useEffect } from "react";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { HistoryTime } from "../../utils/historyTime";

// Play: move through history at the chosen pace until the last march has finished
export function usePlayback(
  playing: boolean,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null,
  pause: () => void
) {
  useEffect(() => {
    if (!playing) return;
    if (storyEnd === null || storyEnd <= storyStart) {
      pause();
      return;
    }
    let last = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const elapsed = Math.min(Math.max((time - last) / 1000, 0), 0.1);
      last = time;
      const state = useTimelineStore.getState();
      const next = currentMoment(state.now, storyStart) + elapsed * state.pace;
      if (next >= storyEnd) {
        state.setNow(storyEnd);
        state.pause();
        return;
      }
      state.setNow(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, storyStart, storyEnd, pause]);
}
```

## client/src/components/timeline/useRowsHeight.ts

```ts
import React, { useEffect, useState } from "react";
import {
  clampRowsHeight,
  DEFAULT_ROWS_HEIGHT,
  useTimelineStore,
} from "../../store/useTimelineStore";

// How much room the rows get, and the handlers for the resize handle along the top edge
export function useRowsHeight() {
  const rowsHeight = useTimelineStore((state) => state.rowsHeight);

  // Drag the timeline's top edge to give the rows more or less room; double-click it to go
  // back to the usual height
  const startResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = useTimelineStore.getState().rowsHeight;
    const onMove = (ev: MouseEvent) =>
      useTimelineStore
        .getState()
        .setRowsHeight(
          clampRowsHeight(
            startHeight + (startY - ev.clientY),
            window.innerHeight
          )
        );
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      useTimelineStore.getState().saveRowsHeight();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const resetHeight = () => {
    const state = useTimelineStore.getState();
    state.setRowsHeight(
      clampRowsHeight(DEFAULT_ROWS_HEIGHT, window.innerHeight)
    );
    state.saveRowsHeight();
  };

  // Keep within the window as it is resized. (The panel as a whole is also capped to the
  // window's height in the CSS, so the rows give way first on a very small window.)
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window === "undefined" ? Infinity : window.innerHeight
  );
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const fittedHeight = clampRowsHeight(rowsHeight, windowHeight);

  return { startResize, resetHeight, fittedHeight };
}
```

## client/src/components/timeline/useSelectionReveal.ts

```ts
import { useEffect, useRef } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { barPlacement, fitView, viewShowing } from "../../utils/timeline";
import { groupKeyOf } from "../../utils/timelineRows";
import { HistoryTime } from "../../utils/historyTime";
import { MarchTiming } from "../../types";

// Keeps the selected march or army in sight. Returns the refs the rows and group headers
// register themselves in, so they can be scrolled to.
export function useSelectionReveal(
  selectedPathId: string | null,
  selectedTiming: MarchTiming | undefined,
  selectedArmyId: string | null,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null
) {
  // Selecting a march (here, on the map or in a panel) brings its bar into view, opens its
  // group and scrolls its row into sight
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const headerRefs = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => {
    if (!selectedPathId || !selectedTiming) return;
    const state = useTimelineStore.getState();
    const visible = state.view ?? fitView(storyStart, storyEnd);
    if (barPlacement(selectedTiming, visible) !== "inside") {
      state.setView(viewShowing(selectedTiming, visible));
    }
    const path = useMapStore
      .getState()
      .paths.find((p) => p.id === selectedPathId);
    if (path)
      state.expandGroup(groupKeyOf(path, useMapStore.getState().armies));
    // After the group has opened
    const frame = requestAnimationFrame(() =>
      rowRefs.current.get(selectedPathId)?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
    // Only when the selection changes, not on every edit of the selected march
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPathId]);

  // Selecting an army (in the Armies tab, say) opens its group and scrolls to it
  useEffect(() => {
    if (!selectedArmyId) return;
    useTimelineStore.getState().expandGroup(selectedArmyId);
    const frame = requestAnimationFrame(() =>
      headerRefs.current
        .get(selectedArmyId)
        ?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedArmyId]);

  return { rowRefs, headerRefs };
}
```

## client/src/components/timeline/useTimelineWheel.ts

```ts
import React, { useEffect, useRef } from "react";
import { HistoryView, zoomView } from "../../utils/timeline";

const ZOOM_SPEED = 0.01; // per unit of pinch or ⌘-scroll

// Pinching on a trackpad (or ⌘/Ctrl-scrolling) zooms about the pointer, and swiping
// sideways (or Shift-scrolling) pans. Plain scrolling is left alone, so it scrolls the
// rows. Attached by hand because React's wheel events can't stop the page from zooming.
export function useTimelineWheel(
  trackRef: React.RefObject<HTMLDivElement | null>,
  shown: HistoryView,
  expanded: boolean,
  setView: (view: HistoryView | null) => void
) {
  // The wheel handler is attached once, so it reads the latest view through a ref
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleWheel = (e: WheelEvent) => {
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const base = shownRef.current;
      const baseSpan = base.to - base.from;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const anchor =
          base.from + ((e.clientX - rect.left) / rect.width) * baseSpan;
        setView(zoomView(base, anchor, Math.exp(e.deltaY * ZOOM_SPEED)));
        return;
      }

      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (sideways) {
        e.preventDefault();
        const pixels = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        const shift = (pixels / rect.width) * baseSpan;
        setView({ from: base.from + shift, to: base.to + shift });
      }
    };
    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, [trackRef, expanded, setView]);
}
```

## client/src/components/toolbar/ArmiesPanel.tsx

```tsx
import React, { useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useAssetStore } from "../../store/useAssetStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { ArmyMember, Unit } from "../../types";
import { memberAt, membersAt } from "../../utils/armies";
import { formatHistoryTime } from "../../utils/historyTime";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const displayName = (unit: Unit) => unit.filename.replace(/\.[^/.]+$/, "");

// Small extras on top of the Paths panel's styles, inline so no CSS file changes
const DATES: React.CSSProperties = {
  display: "block",
  color: "var(--color-text-dim)",
  fontSize: 11,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
// Long names stop at "…" rather than widening the panel; hovering shows them in full
const ELLIPSIS: React.CSSProperties = {
  display: "block",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const ROW_NAME: React.CSSProperties = { ...ELLIPSIS, flex: 1 };
const MEMBER_TEXT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};
const FADED: React.CSSProperties = { opacity: 0.45 };
const FULL_WIDTH: React.CSSProperties = { width: "100%" };
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};

function ArmiesPanel() {
  const armies = useMapStore((state) => state.armies);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const paths = useMapStore((state) => state.paths);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectArmy = useMapStore((state) => state.selectArmy);
  const selectPath = useMapStore((state) => state.selectPath);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const createArmyFromSelection = useMapStore(
    (state) => state.createArmyFromSelection
  );
  const renameArmy = useMapStore((state) => state.renameArmy);
  const deleteArmy = useMapStore((state) => state.deleteArmy);
  const addSelectedUnitsToArmy = useMapStore(
    (state) => state.addSelectedUnitsToArmy
  );
  const removeUnitsFromArmy = useMapStore((state) => state.removeUnitsFromArmy);
  const eraseMembership = useMapStore((state) => state.eraseMembership);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const now = useTimelineStore((state) => state.now);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  const moment = currentMoment(now, storyStart);
  const atStart = now === null || now <= storyStart;
  const unitById = new Map(
    placedUnits.map((unit): [string, Unit] => [unit.id, unit])
  );
  const selectedArmy = armies.find((army) => army.id === selectedArmyId);

  // Selected units that aren't in the selected army at the playhead
  const joinable = selectedArmy
    ? Array.from(selectedUnitIds).filter(
        (id) => !membersAt(selectedArmy, moment).includes(id)
      )
    : [];

  const armyMarches = selectedArmy
    ? paths
        .filter((path) => path.armyId === selectedArmy.id)
        .sort((a, b) => (a.march?.start ?? 0) - (b.march?.start ?? 0))
    : [];

  const describe = (member: ArmyMember) =>
    [
      member.joins !== undefined
        ? `Joins ${formatHistoryTime(member.joins, "times")}`
        : "From the start",
      member.leaves !== undefined
        ? `leaves ${formatHistoryTime(member.leaves, "times")}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

  const commitRename = () => {
    if (renamingId === null) return;
    renameArmy(renamingId, renameValue);
    setRenamingId(null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.list}>
        <button
          className={styles.finishButton}
          style={FULL_WIDTH}
          disabled={selectedUnitIds.size === 0}
          onClick={() => createArmyFromSelection()}
          title="Make the selected units an army, from the playhead's moment"
        >
          New army from selection
        </button>

        {armies.length === 0 && (
          <p className={styles.emptyMessage}>
            No armies yet. Attaching units to a path makes one, or select units
            and click "New army from selection".
          </p>
        )}

        {armies.map((army) => {
          const isSelected = army.id === selectedArmyId;
          const count = membersAt(army, moment).length;
          return (
            <div
              key={army.id}
              className={`${styles.row} ${isSelected ? styles.rowActive : ""}`}
              onClick={() => {
                if (isSelected) {
                  selectArmy(null);
                  selectUnit(null);
                } else {
                  selectArmy(army.id);
                }
              }}
            >
              {renamingId === army.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className={styles.renameInput}
                />
              ) : (
                <span
                  className={`${styles.name} ${isSelected ? styles.nameActive : ""}`}
                  style={ROW_NAME}
                  title={army.name}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenameValue(army.name);
                    setRenamingId(army.id);
                  }}
                >
                  {army.name}
                </span>
              )}
              <span
                className={styles.count}
                title="Units in this army at the playhead"
              >
                {count}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteArmy(army.id);
                }}
                title="Delete army (its units and marches stay)"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          );
        })}

        {selectedArmy && (
          <div className={styles.section}>
            <p
              className={styles.sectionTitle}
              style={ELLIPSIS}
              title={selectedArmy.name}
            >
              {selectedArmy.name}: members
            </p>
            <button
              className={styles.cancelButton}
              style={FULL_WIDTH}
              disabled={joinable.length === 0}
              onClick={() => addSelectedUnitsToArmy(selectedArmy.id)}
              title={
                atStart
                  ? "The selected units join from the start"
                  : "The selected units join at the playhead's moment"
              }
            >
              Add selected units
              {joinable.length > 0 ? ` (${joinable.length})` : ""}
            </button>

            {selectedArmy.members.length === 0 && (
              <p className={styles.hint}>No members yet.</p>
            )}
            {selectedArmy.members.map((member, index) => {
              const unit = unitById.get(member.unitId);
              if (!unit) return null;
              const active = memberAt(member, moment);
              // Partway through this stint: it can leave here and keep the time before
              const canLeaveHere =
                active && !atStart && moment > (member.joins ?? -Infinity);
              return (
                <div
                  key={`${member.unitId}-${index}`}
                  className={styles.unitRow}
                  style={active ? undefined : FADED}
                  title={
                    active ? undefined : "Not in this army at the playhead"
                  }
                >
                  <img
                    src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
                    alt={unit.filename}
                    className={styles.unitThumb}
                    draggable={false}
                  />
                  <span style={MEMBER_TEXT}>
                    <span
                      className={styles.unitName}
                      style={ELLIPSIS}
                      title={displayName(unit)}
                    >
                      {displayName(unit)}
                    </span>
                    <span style={DATES} title={describe(member)}>
                      {describe(member)}
                    </span>
                  </span>
                  {canLeaveHere && (
                    <button
                      className={styles.cancelButton}
                      style={SMALL_BUTTON}
                      onClick={() =>
                        removeUnitsFromArmy(selectedArmy.id, [member.unitId])
                      }
                      title="Leaves this army at the playhead's moment, keeping its time in it before"
                    >
                      Leave here
                    </button>
                  )}
                  <button
                    onClick={() => eraseMembership(selectedArmy.id, member)}
                    title="Remove completely: as if it never joined for this stint"
                    className={deleteStyles.deleteButton}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <p className={styles.sectionTitle}>Marches</p>
            {armyMarches.length === 0 && (
              <p className={styles.hint}>
                None yet. Select this army's units, then click a path on the
                map.
              </p>
            )}
            {armyMarches.map((path) => (
              <div
                key={path.id}
                className={`${styles.row} ${path.id === selectedPathId ? styles.rowActive : ""}`}
                onClick={() =>
                  selectPath(path.id === selectedPathId ? null : path.id)
                }
              >
                <span style={MEMBER_TEXT}>
                  <span
                    className={`${styles.name} ${path.id === selectedPathId ? styles.nameActive : ""}`}
                    style={ELLIPSIS}
                    title={path.name}
                  >
                    {path.name}
                  </span>
                  {path.march && (
                    <span style={DATES}>
                      {formatHistoryTime(path.march.start, "days")} to{" "}
                      {formatHistoryTime(path.march.end, "days")}
                    </span>
                  )}
                </span>
              </div>
            ))}

            <p className={styles.hint}>
              Clicking an army selects its units on the map at the playhead.
              Units join at the playhead's moment, or from the start when the
              playhead is at the story's start. "Leave here" ends a unit's time
              in the army at the playhead; × removes that stint completely. A
              unit is in one army at a time, so joining another army leaves this
              one. Double-click a name to rename it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArmiesPanel;
```

## client/src/components/toolbar/AssetSection.module.css

```css
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.header {
  color: var(--color-gold-dim);
  font-size: var(--font-size-sm);
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--toolbar-transition);
}

.header:hover {
  background: var(--color-surface-hover);
}

.chevron {
  transition: transform var(--toolbar-transition);
}

.chevronCollapsed {
  transform: rotate(-90deg);
}

.newFolderButton {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 2px var(--space-sm);
  transition: color var(--toolbar-transition);
}

.newFolderButton:hover {
  color: var(--color-gold);
}

.newFolderInput {
  margin: 0 var(--space-sm);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-gold);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  padding: 2px var(--space-xs);
}

.folderGroup {
  display: flex;
  flex-direction: column;
}

.folderHeader {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  transition: background var(--toolbar-transition);
}

.folderHeader:hover {
  background: var(--color-surface-hover);
}

.folderHeaderDropTarget {
  background: var(--color-gold-subtle);
  outline: 1px dashed var(--color-gold);
}

.folderChevron {
  transition: transform var(--toolbar-transition);
}

.folderChevronCollapsed {
  transform: rotate(-90deg);
}

.folderContents {
  padding-left: var(--space-md);
}
```

## client/src/components/toolbar/AssetSection.tsx

```tsx
import React, { useState } from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType, AssetFile } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import usePersistedCollapse from "../../hooks/usePersistedCollapse";
import styles from "./AssetSection.module.css";

interface AssetSectionProps {
  title: string;
  assetType: AssetType;
  files: AssetFile[];
  folders: string[];
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onCreateFolder: (name: string) => void;
  onMoveAsset: (path: string, folder: string) => Promise<void>;
  onRenameAsset: (
    path: string,
    newFilename: string,
    folder: string | null
  ) => Promise<void>;
}

function AssetSection({
  title,
  assetType,
  files,
  folders,
  onDeleteAsset,
  onCreateFolder,
  onMoveAsset,
  onRenameAsset,
}: AssetSectionProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  const { collapsed: topLevelCollapsed, toggle: toggleTopLevel } =
    usePersistedCollapse(`${currentProjectName}-sections`);
  const isCollapsed = topLevelCollapsed.has(assetType);

  const { collapsed: collapsedFolders, toggle: toggleFolder } =
    usePersistedCollapse(`${currentProjectName}-${assetType}-folders`);

  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

  if (files.length === 0 && folders.length === 0) return null;

  const topLevelFiles = files.filter((f) => f.folder === null);
  const filesByFolder = (folder: string) =>
    files.filter((f) => f.folder === folder);

  const commitNewFolder = () => {
    const trimmed = newFolderName.trim();
    setIsCreatingFolder(false);
    setNewFolderName("");
    if (trimmed) {
      onCreateFolder(trimmed);
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    setDropTargetFolder(null);
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const { path, assetType: droppedType } = JSON.parse(data) as {
        path: string;
        assetType: AssetType;
      };
      if (droppedType === assetType) {
        onMoveAsset(path, folder);
      }
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  return (
    <div className={styles.section}>
      <div onClick={() => toggleTopLevel(assetType)} className={styles.header}>
        <span>{title}</span>
        <span
          className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>

      {!isCollapsed && (
        <>
          {topLevelFiles.map((file) => (
            <UnitThumbnail
              key={file.path}
              path={file.path}
              filename={file.filename}
              assetType={assetType}
              onDelete={() => onDeleteAsset(file.path, assetType)}
              onRename={(newFilename) =>
                onRenameAsset(file.path, newFilename, file.folder)
              }
            />
          ))}

          {folders.map((folder) => {
            const folderCollapsed = collapsedFolders.has(folder);
            const folderFiles = filesByFolder(folder);
            return (
              <div key={folder} className={styles.folderGroup}>
                <div
                  onClick={() => toggleFolder(folder)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetFolder(folder);
                  }}
                  onDragLeave={() => setDropTargetFolder(null)}
                  onDrop={(e) => handleFolderDrop(e, folder)}
                  className={`${styles.folderHeader} ${dropTargetFolder === folder ? styles.folderHeaderDropTarget : ""}`}
                >
                  <span
                    className={`${styles.folderChevron} ${folderCollapsed ? styles.folderChevronCollapsed : ""}`}
                  >
                    ▾
                  </span>
                  <span>{folder}</span>
                </div>
                {!folderCollapsed && (
                  <div className={styles.folderContents}>
                    {folderFiles.map((file) => (
                      <UnitThumbnail
                        key={file.path}
                        path={file.path}
                        filename={file.filename}
                        assetType={assetType}
                        onDelete={() => onDeleteAsset(file.path, assetType)}
                        onRename={(newFilename) =>
                          onRenameAsset(file.path, newFilename, file.folder)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isCreatingFolder ? (
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={commitNewFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewFolder();
                if (e.key === "Escape") {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name"
              className={styles.newFolderInput}
            />
          ) : (
            <button
              className={styles.newFolderButton}
              onClick={() => setIsCreatingFolder(true)}
            >
              + New folder
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default AssetSection;
```

## client/src/components/toolbar/AssetsPanel.module.css

```css
.panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    height: 100%;
    min-height: 0;
  }
  
  .sectionList {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    overflow-y: auto;
    margin-top: var(--space-md);
    scrollbar-width: none;
  }
  
  .sectionList::-webkit-scrollbar {
    width: 4px;
  }
  
  .sectionList::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sectionList::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: var(--radius-full);
  }
  
  .sectionList:hover::-webkit-scrollbar-thumb {
    background: var(--color-border);
  }
```

## client/src/components/toolbar/AssetsPanel.tsx

```tsx
import React from "react";
import ToolbarButton from "./ToolbarButton";
import AssetSection from "./AssetSection";
import MapSection from "./MapSection";
import { AssetType } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import styles from "./AssetsPanel.module.css";

interface AssetsPanelProps {
  onAddAsset: () => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onAssetRenamed: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;
}

function AssetsPanel({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
}: AssetsPanelProps) {
  const units = useAssetStore((state) => state.units);
  const portraits = useAssetStore((state) => state.portraits);
  const maps = useAssetStore((state) => state.maps);
  const createFolder = useAssetStore((state) => state.createFolder);
  const renameOrMoveAsset = useAssetStore((state) => state.renameOrMoveAsset);

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Add Asset"
        onClick={onAddAsset}
        isExpanded={true}
      />

      <div className={styles.sectionList}>
        <AssetSection
          title="Units"
          assetType="units"
          files={units.files}
          folders={units.folders}
          onDeleteAsset={onDeleteAsset}
          onCreateFolder={(name) => createFolder("units", name)}
          onMoveAsset={(path, folder) =>
            renameOrMoveAsset(path, "units", { folder }, onAssetRenamed)
          }
          onRenameAsset={(path, filename, folder) =>
            renameOrMoveAsset(
              path,
              "units",
              { filename, folder: folder ?? "" },
              onAssetRenamed
            )
          }
        />
        <AssetSection
          title="Portraits"
          assetType="portraits"
          files={portraits.files}
          folders={portraits.folders}
          onDeleteAsset={onDeleteAsset}
          onCreateFolder={(name) => createFolder("portraits", name)}
          onMoveAsset={(path, folder) =>
            renameOrMoveAsset(path, "portraits", { folder }, onAssetRenamed)
          }
          onRenameAsset={(path, filename, folder) =>
            renameOrMoveAsset(
              path,
              "portraits",
              { filename, folder: folder ?? "" },
              onAssetRenamed
            )
          }
        />
        <MapSection
          maps={maps.files}
          selectedMapFilename={selectedMapFilename}
          onSelectMap={onSelectMap}
          onDeleteAsset={onDeleteAsset}
        />
      </div>
    </div>
  );
}

export default AssetsPanel;
```

## client/src/components/toolbar/AttachedUnitsSection.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useAssetStore } from "../../store/useAssetStore";
import { MapPath, Unit } from "../../types";
import API_BASE_URL from "../../config/api";
import PathPreview from "./PathPreview";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const displayName = (unit: Unit) => unit.filename.replace(/\.[^/.]+$/, "");

const FORMATION_MODES: {
  mode: "keep" | "wheel";
  label: string;
  hint: string;
}[] = [
  {
    mode: "keep",
    label: "Keep as placed",
    hint: "Units turn on the spot to face the path; the formation stays exactly as you laid it out",
  },
  {
    mode: "wheel",
    label: "Turn with units",
    hint: "The whole group turns with its units, so a row facing north ends up a row facing the way the path leaves",
  },
];

// The selected path's units: detaching them, how the formation turns, re-recording it, and
// the preview
function AttachedUnitsSection({
  selectedPath,
  isPlaying,
  setIsPlaying,
}: {
  selectedPath: MapPath;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const armies = useMapStore((state) => state.armies);
  const detachUnitFromPath = useMapStore((state) => state.detachUnitFromPath);
  const refreshPathFormation = useMapStore(
    (state) => state.refreshPathFormation
  );
  const setFormationMode = useMapStore((state) => state.setFormationMode);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  const attachedUnits = selectedPath.assignments
    .map((a) => placedUnits.find((unit) => unit.id === a.unitId))
    .filter((unit): unit is Unit => unit !== undefined);

  // An army's march takes whoever is in the army as it sets off, so its units are changed
  // in the Armies tab rather than here
  const marchArmy = selectedPath.armyId
    ? armies.find((army) => army.id === selectedPath.armyId)
    : undefined;

  const formationMode = selectedPath.direction !== undefined ? "wheel" : "keep";

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{selectedPath.name}: attached units</p>
      {attachedUnits.length === 0 && !marchArmy && (
        <p className={styles.hint}>
          None yet. Select units, then click this path on the map.
        </p>
      )}
      {attachedUnits.map((unit) => (
        <div key={unit.id} className={styles.unitRow}>
          <img
            src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
            alt={unit.filename}
            className={styles.unitThumb}
            draggable={false}
          />
          <span className={styles.unitName}>{displayName(unit)}</span>
          <button
            onClick={() => detachUnitFromPath(selectedPath.id, unit.id)}
            title={
              marchArmy
                ? `Take off this march: it leaves ${marchArmy.name} as the march sets off`
                : "Detach from this path"
            }
            className={deleteStyles.deleteButton}
          >
            ×
          </button>
        </div>
      ))}
      {marchArmy && (
        <p className={styles.hint}>
          This is a march of {marchArmy.name}: it takes whoever is in the army
          as it sets off. Removing a unit here makes it leave the army then, so
          it sits out this march and the army's later ones.
        </p>
      )}

      {attachedUnits.length > 0 && (
        <>
          <div className={styles.segment}>
            {FORMATION_MODES.map(({ mode, label, hint }) => (
              <button
                key={mode}
                title={hint}
                className={`${styles.segmentButton} ${
                  formationMode === mode ? styles.segmentActive : ""
                }`}
                onClick={() => setFormationMode(selectedPath.id, mode)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            {FORMATION_MODES.find((m) => m.mode === formationMode)?.hint}
          </p>
          <button
            className={styles.cancelButton}
            title="Use where the units are, and the way they face, as the formation"
            onClick={() => refreshPathFormation(selectedPath.id)}
          >
            Re-record formation
          </button>

          <PathPreview
            pathId={selectedPath.id}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </>
      )}

      <p className={styles.hint}>
        Before setting off, the group pivots on the spot until its turning units
        face the path. Drag a dot to move it. Click the line to add a dot
        (deselect your units first). Select a dot and press Backspace to remove
        it. Double-click a name to rename it.
      </p>
    </div>
  );
}

export default AttachedUnitsSection;
```

## client/src/components/toolbar/DeleteButton.module.css

```css
.deleteButton {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border-radius: var(--radius-full);
    border: 1px solid #6a3030;
    background: transparent;
    color: #e07070;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background var(--toolbar-transition), border-color var(--toolbar-transition), opacity var(--toolbar-transition);
  }
  
  .deleteButton:hover {
    background: rgba(224, 112, 112, 0.15);
    border-color: #e07070;
  }
  
  .hidden {
    opacity: 0;
  }
```

## client/src/components/toolbar/MapSection.module.css

```css
.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  
  .header {
    color: var(--color-gold-dim);
    font-size: var(--font-size-sm);
    font-family: var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: var(--space-xs) var(--space-sm);
    cursor: pointer;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background var(--toolbar-transition);
  }
  
  .header:hover {
    background: var(--color-surface-hover);
  }
  
  .chevron {
    transition: transform var(--toolbar-transition);
  }
  
  .chevronCollapsed {
    transform: rotate(-90deg);
  }
  
  .mapRow {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--toolbar-transition);
  }
  
  .mapRow:hover {
    background: var(--color-surface-hover);
  }
  
  .mapRowActive {
    background: var(--color-gold-subtle);
  }
  
  .mapRowActive:hover {
    background: var(--color-gold-subtle);
  }
  
  .filename {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .filenameActive {
    color: var(--color-gold);
  }

  .mapRow:hover :global(.delete-button) {
  opacity: 1;
  }
```

## client/src/components/toolbar/MapSection.tsx

```tsx
import React, { useState } from "react";
import { AssetFile } from "../../types";
import styles from "./MapSection.module.css";
import deleteStyles from "./DeleteButton.module.css";

interface MapSectionProps {
  maps: AssetFile[];
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: "maps") => void;
}

function MapSection({
  maps,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
}: MapSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  if (maps.length === 0) return null;

  return (
    <div className={styles.section}>
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={styles.header}
      >
        <span>Maps</span>
        <span
          className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>
      {!isCollapsed &&
        maps.map((map) => {
          const isActive = selectedMapFilename === map.filename;
          const isHovered = hoveredPath === map.path;
          return (
            <div
              key={map.path}
              onClick={() => onSelectMap(isActive ? null : map.filename)}
              onMouseEnter={() => setHoveredPath(map.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className={`${styles.mapRow} ${isActive ? styles.mapRowActive : ""}`}
            >
              <span
                className={`${styles.filename} ${isActive ? styles.filenameActive : ""}`}
              >
                {map.filename}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAsset(map.path, "maps");
                }}
                title="Delete map"
                className={`${deleteStyles.deleteButton} ${isHovered ? "" : deleteStyles.hidden}`}
              >
                ×
              </button>
            </div>
          );
        })}
    </div>
  );
}

export default MapSection;
```

## client/src/components/toolbar/PathList.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

// What's being renamed. The state lives in PathsPanel so it survives the list being
// swapped out while a new path is drawn.
export interface PathRename {
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  startRename: (id: string, currentName: string) => void;
  commitRename: () => void;
  cancelRename: () => void;
}

// Every path, with its unit count and delete button. Click one to select it; double-click
// its name to rename it.
function PathList({ rename }: { rename: PathRename }) {
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const deletePath = useMapStore((state) => state.deletePath);

  return (
    <>
      {paths.length === 0 && (
        <p className={styles.emptyMessage}>
          No paths yet. Click "New path" to draw one.
        </p>
      )}
      {paths.map((path) => {
        const isSelected = path.id === selectedPathId;
        return (
          <div
            key={path.id}
            className={`${styles.row} ${isSelected ? styles.rowActive : ""}`}
            onClick={() => selectPath(isSelected ? null : path.id)}
          >
            {rename.renamingId === path.id ? (
              <input
                autoFocus
                value={rename.renameValue}
                onChange={(e) => rename.setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={rename.commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") rename.commitRename();
                  if (e.key === "Escape") rename.cancelRename();
                }}
                className={styles.renameInput}
              />
            ) : (
              <span
                className={`${styles.name} ${isSelected ? styles.nameActive : ""}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  rename.startRename(path.id, path.name);
                }}
              >
                {path.name}
              </span>
            )}
            {path.assignments.length > 0 && (
              <span className={styles.count}>{path.assignments.length}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePath(path.id);
              }}
              title="Delete path"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
        );
      })}
    </>
  );
}

export default PathList;
```

## client/src/components/toolbar/PathPreview.tsx

```tsx
import React from "react";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import styles from "./PathsPanel.module.css";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

// Its own component, so the panel doesn't re-render on every frame of playback
function PlaybackSlider({
  pathId,
  onScrub,
}: {
  pathId: string;
  onScrub: () => void;
}) {
  const progress = usePathToolStore((state) =>
    state.preview && state.preview.pathId === pathId
      ? state.preview.progress
      : 0
  );
  const setPreview = usePathToolStore((state) => state.setPreview);
  return (
    <input
      type="range"
      min={0}
      max={1000}
      step={1}
      value={Math.round(progress * 1000)}
      onChange={(e) => {
        onScrub();
        setPreview(pathId, Number(e.target.value) / 1000);
      }}
      onPointerUp={(e) => e.currentTarget.blur()}
      className={styles.slider}
    />
  );
}

// Play, reset, speed and a slider for previewing one path's march on its own. The play loop
// itself runs in PathsPanel, which owns `isPlaying`.
function PathPreview({
  pathId,
  isPlaying,
  setIsPlaying,
}: {
  pathId: string;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const clearPreview = usePathToolStore((state) => state.clearPreview);
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = usePathToolStore((state) => state.setPlaybackSpeed);

  return (
    <div className={styles.preview}>
      <div className={styles.actions}>
        <button
          className={styles.finishButton}
          onClick={() => {
            useTimelineStore.getState().pause();
            setIsPlaying((playing) => !playing);
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          className={styles.cancelButton}
          onClick={() => {
            setIsPlaying(false);
            clearPreview();
          }}
        >
          Reset
        </button>
      </div>
      <div className={styles.segment}>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            title={`${speed}x speed`}
            className={`${styles.segmentButton} ${
              playbackSpeed === speed ? styles.segmentActive : ""
            }`}
            onClick={() => setPlaybackSpeed(speed)}
          >
            {speed}×
          </button>
        ))}
      </div>
      <PlaybackSlider
        pathId={pathId}
        onScrub={() => {
          setIsPlaying(false);
          useTimelineStore.getState().pause();
        }}
      />
      <p className={styles.hint}>
        Preview only: your units go back to their real positions when you move
        the mouse off the toolbar.
      </p>
    </div>
  );
}

export default PathPreview;
```

## client/src/components/toolbar/PathsPanel.module.css

```css
.panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    height: 100%;
    min-height: 0;
  }
  
  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    overflow-y: auto;
    margin-top: var(--space-sm);
    scrollbar-width: none;
  }
  
  .list::-webkit-scrollbar {
    width: 4px;
  }
  
  .list::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .list::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: var(--radius-full);
  }
  
  .list:hover::-webkit-scrollbar-thumb {
    background: var(--color-border);
  }
  
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--toolbar-transition);
  }
  
  .row:hover {
    background: var(--color-surface-hover);
  }
  
  .rowActive {
    background: var(--color-gold-subtle);
  }
  
  .rowActive:hover {
    background: var(--color-gold-subtle);
  }
  
  .name {
    flex: 1;
    color: var(--color-text-secondary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .nameActive {
    color: var(--color-gold);
  }
  
  .emptyMessage {
    color: var(--color-text-dim);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    padding: var(--space-sm);
    margin: 0;
  }
  
  .drawing {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-sm);
  }
  
  .hint {
    color: var(--color-text-secondary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    margin: 0;
    line-height: 1.5;
  }
  
  .actions {
    display: flex;
    gap: var(--space-sm);
  }
  
  .finishButton {
    flex: 1;
    padding: var(--space-xs) var(--space-md);
    background: var(--color-gold-subtle);
    border: 1px solid var(--color-gold);
    border-radius: var(--radius-sm);
    color: var(--color-gold);
    font-family: var(--font-ui);
    font-size: var(--font-size-md);
    cursor: pointer;
  }
  
  .finishButton:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .cancelButton {
    padding: var(--space-xs) var(--space-md);
    background: transparent;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-text-dim);
    font-family: var(--font-ui);
    font-size: var(--font-size-md);
    cursor: pointer;
  }

  .renameInput {
    flex: 1;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-gold);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    padding: 2px var(--space-xs);
    min-width: 0;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
  }
  
  .sectionTitle {
    color: var(--color-gold-dim);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }
  
  .segment {
    display: flex;
  }
  
  .segmentButton {
    flex: 1;
    padding: var(--space-xs) var(--space-sm);
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: border-color var(--toolbar-transition), color var(--toolbar-transition),
      background var(--toolbar-transition);
  }
  
  .segmentButton:first-child {
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  }
  
  .segmentButton:last-child {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  
  .segmentButton:hover {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }
  
  .segmentActive {
    background: var(--color-gold-subtle);
    border-color: var(--color-gold);
    color: var(--color-gold);
  }
  
  .count {
    color: var(--color-text-dim);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    flex-shrink: 0;
  }
  
  .unitRow {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 2px var(--space-xs);
  }
  
  .unitThumb {
    width: 24px;
    height: 24px;
    object-fit: contain;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  
  .unitName {
    flex: 1;
    color: var(--color-text-secondary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-xs);
  }
  
  .slider {
    width: 100%;
    accent-color: var(--color-gold);
  }
```

## client/src/components/toolbar/PathsPanel.tsx

```tsx
import React, { useEffect, useState } from "react";
import ToolbarButton from "./ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { getTimeline } from "../../utils/timeline";
import SelectedUnitsSection from "./SelectedUnitsSection";
import PathList from "./PathList";
import AttachedUnitsSection from "./AttachedUnitsSection";
import styles from "./PathsPanel.module.css";

const PLAY_SPEED = 100; // map units per second at 1x

function PathsPanel() {
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const renamePath = useMapStore((state) => state.renamePath);

  const drawingPoints = usePathToolStore((state) => state.drawingPoints);
  const startDrawing = usePathToolStore((state) => state.startDrawing);
  const finishDrawing = usePathToolStore((state) => state.finishDrawing);
  const cancelDrawing = usePathToolStore((state) => state.cancelDrawing);
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isDrawing = drawingPoints !== null;
  const pointCount = drawingPoints?.length ?? 0;

  const selectedPath = paths.find((path) => path.id === selectedPathId);

  // Switching paths, or leaving this panel, ends the preview: units go back to where they
  // really are. (A preview never changes the project.)
  useEffect(() => {
    setIsPlaying(false);
    return () => usePathToolStore.getState().clearPreview();
  }, [selectedPathId]);

  // Play: advance the preview at a steady speed until the end of the path.
  // Changing the speed restarts this from wherever the preview has got to.
  useEffect(() => {
    if (!isPlaying || !selectedPathId) return;
    const { paths: allPaths, placedUnits: allUnits } = useMapStore.getState();
    const path = allPaths.find((p) => p.id === selectedPathId);
    // The whole run: the pivot on the spot at the start, then the journey along the path
    const length =
      getTimeline(allPaths, allUnits).playbacks.get(selectedPathId)?.length ??
      0;
    if (!path || length === 0) {
      setIsPlaying(false);
      return;
    }

    const current = usePathToolStore.getState().preview;
    let position =
      current && current.pathId === selectedPathId && current.progress < 1
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
      usePathToolStore.getState().setPreview(selectedPathId, position);
      if (position >= 1) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, selectedPathId, playbackSpeed]);

  const startRename = (id: string, currentName: string) => {
    setRenameValue(currentName);
    setRenamingId(id);
  };

  const commitRename = () => {
    if (renamingId === null) return;
    const id = renamingId;
    const current = paths.find((path) => path.id === id);
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (trimmed && current && trimmed !== current.name) {
      renamePath(id, trimmed);
    }
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="New path"
        isExpanded={true}
        isActive={isDrawing}
        onClick={() => {
          if (!isDrawing) startDrawing();
        }}
      />

      {isDrawing ? (
        <div className={styles.drawing}>
          <p className={styles.hint}>
            Move to the map and click to place waypoints. {pointCount} placed so
            far.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.finishButton}
              onClick={finishDrawing}
              disabled={pointCount < 2}
            >
              Finish
            </button>
            <button className={styles.cancelButton} onClick={cancelDrawing}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          <SelectedUnitsSection onStopPreview={() => setIsPlaying(false)} />

          <PathList
            rename={{
              renamingId,
              renameValue,
              setRenameValue,
              startRename,
              commitRename,
              cancelRename: () => setRenamingId(null),
            }}
          />

          {selectedPath && (
            <AttachedUnitsSection
              selectedPath={selectedPath}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default PathsPanel;
```

## client/src/components/toolbar/PortraitPanel.tsx

```tsx
import React, { useEffect } from "react";
import ToolbarButton from "./ToolbarButton";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PsdPanel.module.css";

interface PortraitPanelProps {
  onSelectSource: (filename: string) => void;
}

function PortraitPanel({ onSelectSource }: PortraitPanelProps) {
  const sources = useAssetStore((state) => state.portraitSources);
  const fetchPortraitSources = useAssetStore(
    (state) => state.fetchPortraitSources
  );
  const uploadPortraitSource = useAssetStore(
    (state) => state.uploadPortraitSource
  );
  const deletePortraitSource = useAssetStore(
    (state) => state.deletePortraitSource
  );
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  useEffect(() => {
    fetchPortraitSources();
  }, [fetchPortraitSources]);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (const file of Array.from(files)) {
        await uploadPortraitSource(file);
      }
    };
    input.click();
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Import Image"
        onClick={handleImport}
        isExpanded={true}
      />

      <div className={styles.psdList}>
        {sources.length === 0 && (
          <p className={styles.emptyMessage}>
            No portrait images imported yet.
          </p>
        )}
        {sources.map((name) => (
          <div
            key={name}
            className={styles.psdRow}
            onClick={() => onSelectSource(name)}
          >
            <img
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources/${name}`}
              alt={name}
              className={styles.thumbnail}
            />
            <span className={styles.psdName}>{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePortraitSource(name);
              }}
              title="Delete image"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PortraitPanel;
```

## client/src/components/toolbar/PsdPanel.module.css

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  height: 100%;
  min-height: 0;
}

.psdList {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  overflow-y: auto;
  margin-top: var(--space-sm);
  scrollbar-width: none;
}

.psdList::-webkit-scrollbar {
  width: 4px;
}

.psdList::-webkit-scrollbar-track {
  background: transparent;
}

.psdList::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: var(--radius-full);
}

.psdList:hover::-webkit-scrollbar-thumb {
  background: var(--color-border);
}

.psdRow {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--toolbar-transition);
}

.psdRow:hover {
  background: var(--color-surface-hover);
}

.psdName {
  flex: 1;
  color: var(--color-text-secondary);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emptyMessage {
  color: var(--color-text-dim);
  font-family: var(--font-ui);
  font-size: var(--font-size-sm);
  padding: var(--space-sm);
  margin: 0;
}

.thumbnail {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

## client/src/components/toolbar/PsdPanel.tsx

```tsx
import React, { useEffect } from "react";
import ToolbarButton from "./ToolbarButton";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PsdPanel.module.css";

interface PsdPanelProps {
  onSelectPsd: (name: string) => void;
}

function PsdPanel({ onSelectPsd }: PsdPanelProps) {
  const psds = useAssetStore((state) => state.psds);
  const fetchPsdList = useAssetStore((state) => state.fetchPsdList);
  const uploadPsd = useAssetStore((state) => state.uploadPsd);
  const deletePsd = useAssetStore((state) => state.deletePsd);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  useEffect(() => {
    fetchPsdList();
  }, [fetchPsdList]);

  const handleAddPsd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".psd";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadPsd(file);
    };
    input.click();
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Import PSD"
        onClick={handleAddPsd}
        isExpanded={true}
      />

      <div className={styles.psdList}>
        {psds.length === 0 && (
          <p className={styles.emptyMessage}>No PSD files imported yet.</p>
        )}
        {psds.map((name) => (
          <div
            key={name}
            className={styles.psdRow}
            onClick={() => onSelectPsd(name)}
          >
            <img
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/psd/${name}/preview`}
              alt={name}
              className={styles.thumbnail}
            />
            <span className={styles.psdName}>{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePsd(name);
              }}
              title="Delete PSD"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PsdPanel;
```

## client/src/components/toolbar/SelectedUnitsSection.tsx

```tsx
import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { unitFacing } from "../../utils/unitFacing";
import { formatHistoryTime } from "../../utils/historyTime";
import { TravelMode } from "../../types";
import styles from "./PathsPanel.module.css";

const TRAVEL_MODES: { mode: TravelMode; label: string; hint: string }[] = [
  {
    mode: "rotate",
    label: "Turn",
    hint: "Turns to face the direction of travel",
  },
  {
    mode: "upright",
    label: "Upright",
    hint: "Never turns; flips left or right so it is never upside down",
  },
  { mode: "fixed", label: "Fixed", hint: "Never turns or flips" },
];

// The lifespan rows (inline so PathsPanel.module.css doesn't change)
const LIFESPAN: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  margin: "6px 0",
};
const LIFESPAN_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "var(--font-size-sm)",
};
const LIFESPAN_LABEL: React.CSSProperties = {
  width: 56,
  flexShrink: 0,
  color: "var(--color-text-dim)",
};
const LIFESPAN_VALUE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  color: "var(--color-text-secondary)",
};
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};

// The selected units' travel mode, and when they exist in history. Shows nothing when no
// units are selected. `onStopPreview` stops the path preview before the playhead moves.
function SelectedUnitsSection({ onStopPreview }: { onStopPreview: () => void }) {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const setUnitsTravelMode = useMapStore((state) => state.setUnitsTravelMode);
  const bringBackUnits = useMapStore((state) => state.bringBackUnits);

  const selectedUnits = placedUnits.filter((unit) =>
    selectedUnitIds.has(unit.id)
  );
  const modes = new Set(
    selectedUnits.map((unit) => unitFacing(unit).travelMode)
  );
  const activeMode = modes.size === 1 ? Array.from(modes)[0] : null;

  // When the selected units exist in history
  const soleUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;
  const leavingUnits = selectedUnits.filter(
    (unit) => unit.leaves !== undefined
  );
  const goTo = (moment: number) => {
    usePathToolStore.getState().clearPreview();
    onStopPreview();
    const timeline = useTimelineStore.getState();
    timeline.pause();
    timeline.setNow(moment);
  };

  if (selectedUnits.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>
        {selectedUnits.length} unit
        {selectedUnits.length === 1 ? "" : "s"} selected
      </p>
      <div className={styles.segment}>
        {TRAVEL_MODES.map(({ mode, label, hint }) => (
          <button
            key={mode}
            title={hint}
            className={`${styles.segmentButton} ${
              activeMode === mode ? styles.segmentActive : ""
            }`}
            onClick={() =>
              setUnitsTravelMode(
                selectedUnits.map((unit) => unit.id),
                mode
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        {activeMode
          ? TRAVEL_MODES.find((m) => m.mode === activeMode)?.hint
          : "Mixed settings"}
        . Click a path on the map to attach the selected units to it.
      </p>

      {soleUnit && (
        <div style={LIFESPAN}>
          <div style={LIFESPAN_ROW}>
            <span style={LIFESPAN_LABEL}>Appears</span>
            <span style={LIFESPAN_VALUE}>
              {soleUnit.appears !== undefined
                ? formatHistoryTime(soleUnit.appears, "times")
                : "From the start"}
            </span>
            {soleUnit.appears !== undefined && (
              <button
                className={styles.cancelButton}
                style={SMALL_BUTTON}
                title="Move the playhead to when this unit appears, where it can be moved and turned"
                onClick={() => goTo(soleUnit.appears!)}
              >
                Go there
              </button>
            )}
          </div>
          <div style={LIFESPAN_ROW}>
            <span style={LIFESPAN_LABEL}>Leaves</span>
            <span style={LIFESPAN_VALUE}>
              {soleUnit.leaves !== undefined
                ? formatHistoryTime(soleUnit.leaves, "times")
                : "Never"}
            </span>
            {soleUnit.leaves !== undefined && (
              <button
                className={styles.cancelButton}
                style={SMALL_BUTTON}
                title="Keep this unit until the end of the story"
                onClick={() => bringBackUnits([soleUnit.id])}
              >
                Bring back
              </button>
            )}
          </div>
        </div>
      )}
      {!soleUnit && leavingUnits.length > 0 && (
        <div style={LIFESPAN_ROW}>
          <span style={LIFESPAN_VALUE}>
            {leavingUnits.length} of these leave during the story
          </span>
          <button
            className={styles.cancelButton}
            style={SMALL_BUTTON}
            title="Keep them until the end of the story"
            onClick={() => bringBackUnits(leavingUnits.map((unit) => unit.id))}
          >
            Bring back
          </button>
        </div>
      )}
      <p className={styles.hint}>
        Units placed with the playhead past the story's start appear then.
        Deleting a unit there makes it leave at that moment. Each unit can be
        moved only at the moment it appears.
      </p>
    </div>
  );
}

export default SelectedUnitsSection;
```

## client/src/components/toolbar/Toolbar.module.css

```css
.toolbar {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: var(--toolbar-width-collapsed);
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  background: transparent;
  border-left: 1px solid transparent;
  transition: width var(--toolbar-transition), background var(--toolbar-transition), border-color var(--toolbar-transition);
  z-index: 1000;
  box-sizing: border-box;
  overflow: hidden;
}

.toolbarExpanded {
  width: calc(var(--toolbar-width-expanded) + var(--toolbar-width-collapsed));
  background: var(--color-surface);
  border-left-color: var(--color-border-subtle);
}

.panelArea {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-sm) 0 var(--space-sm) var(--space-sm);
  box-sizing: border-box;
}
```

## client/src/components/toolbar/Toolbar.tsx

```tsx
import React, { useState } from "react";
import ToolbarTabRail, { ToolbarTab } from "./ToolbarTabRail";
import AssetsPanel from "./AssetsPanel";
import PsdPanel from "./PsdPanel";
import PortraitPanel from "./PortraitPanel";
import PathsPanel from "./PathsPanel";
import ArmiesPanel from "./ArmiesPanel";
import { AssetType, ToolbarTabId } from "../../types";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onAddAsset: () => void;
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

const TABS: ToolbarTab[] = [
  { id: "assets", icon: "+", label: "Assets" },
  { id: "psd", icon: "✎", label: "PSD Editor" },
  { id: "portrait", icon: "◎", label: "Portrait Maker" },
  { id: "paths", icon: "↝", label: "Paths" },
  { id: "armies", icon: "⚑", label: "Armies" },
];

function Toolbar({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
  onSelectPsd,
  onSelectPortraitSource,
}: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ToolbarTabId>("assets");

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`${styles.toolbar} ${isExpanded ? styles.toolbarExpanded : ""}`}
    >
      {isExpanded && (
        <div className={styles.panelArea}>
          {activeTab === "assets" && (
            <AssetsPanel
              onAddAsset={onAddAsset}
              selectedMapFilename={selectedMapFilename}
              onSelectMap={onSelectMap}
              onDeleteAsset={onDeleteAsset}
              onAssetRenamed={onAssetRenamed}
            />
          )}
          {activeTab === "psd" && <PsdPanel onSelectPsd={onSelectPsd} />}
          {activeTab === "portrait" && (
            <PortraitPanel onSelectSource={onSelectPortraitSource} />
          )}
          {activeTab === "paths" && <PathsPanel />}
          {activeTab === "armies" && <ArmiesPanel />}
        </div>
      )}

      <ToolbarTabRail
        tabs={TABS}
        activeTab={isExpanded ? activeTab : null}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}

export default Toolbar;
```

## client/src/components/toolbar/ToolbarButton.module.css

```css
.button {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    padding: var(--space-sm);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--toolbar-transition);
  }
  
  .button:hover {
    background: var(--color-surface-hover);
  }
  
  .buttonActive {
    background: var(--color-gold-subtle);
  }
  
  .buttonActive:hover {
    background: var(--color-gold-subtle);
  }
  
  .iconCircle {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-dim);
    font-size: 16px;
    line-height: 1;
    transition: border-color var(--toolbar-transition), color var(--toolbar-transition);
  }
  
  .iconCircleActive {
    border-color: var(--color-gold);
    color: var(--color-gold);
  }
  
  .iconInner {
    display: block;
    transform: translateY(-1px);
  }
  
  .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
  }
  
  .labelActive {
    color: var(--color-gold);
  }
```

## client/src/components/toolbar/ToolbarButton.tsx

```tsx
import React from "react";
import styles from "./ToolbarButton.module.css";

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  isExpanded: boolean;
  isActive?: boolean;
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isExpanded,
  isActive = false,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`${styles.button} ${isActive ? styles.buttonActive : ""}`}
    >
      <div
        className={`${styles.iconCircle} ${isActive ? styles.iconCircleActive : ""}`}
      >
        <span className={styles.iconInner}>{icon}</span>
      </div>

      {isExpanded && (
        <span
          className={`${styles.label} ${isActive ? styles.labelActive : ""}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export default ToolbarButton;
```

## client/src/components/toolbar/ToolbarTabRail.module.css

```css
.rail {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-xs);    
    width: var(--toolbar-width-collapsed);
    box-sizing: border-box;
    flex-shrink: 0;
  }
```

## client/src/components/toolbar/ToolbarTabRail.tsx

```tsx
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { ToolbarTabId } from "../../types";
import styles from "./ToolbarTabRail.module.css";

export interface ToolbarTab {
  id: ToolbarTabId;
  icon: string;
  label: string;
}

interface ToolbarTabRailProps {
  tabs: ToolbarTab[];
  activeTab: ToolbarTabId | null;
  onSelectTab: (id: ToolbarTabId) => void;
}

function ToolbarTabRail({ tabs, activeTab, onSelectTab }: ToolbarTabRailProps) {
  return (
    <div className={styles.rail}>
      {tabs.map((tab) => (
        <div key={tab.id} onMouseEnter={() => onSelectTab(tab.id)}>
          <ToolbarButton
            icon={tab.icon}
            label={tab.label}
            onClick={() => onSelectTab(tab.id)}
            isExpanded={false}
            isActive={activeTab === tab.id}
          />
        </div>
      ))}
    </div>
  );
}

export default ToolbarTabRail;
```

## client/src/components/toolbar/UnitThumbnail.module.css

```css
.thumbnail {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    cursor: grab;
    transition: background var(--toolbar-transition);
  }
  
  .thumbnail:hover {
    background: var(--color-surface-hover);
  }
  
  .image {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
  }
  
  .filename {
    flex: 1;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-family: var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .thumbnail:hover .deleteButton {
    opacity: 1;
  }
  
  .deleteIconInner {
    display: block;
    transform: translateY(-1px);
  }

  .thumbnail:hover :global(.delete-button) {
    opacity: 1;
  }

  .renameInput {
    flex: 1;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-gold);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-family: var(--font-ui);
    font-size: var(--font-size-sm);
    padding: 2px var(--space-xs);
    min-width: 0;
  }
```

## client/src/components/toolbar/UnitThumbnail.tsx

```tsx
import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";
import styles from "./UnitThumbnail.module.css";
import deleteStyles from "./DeleteButton.module.css";
import { useAssetStore } from "../../store/useAssetStore";

interface UnitThumbnailProps {
  path: string;
  filename: string;
  assetType: AssetType;
  onDelete: () => void;
  onRename: (newFilename: string) => void;
}

function UnitThumbnail({
  path,
  filename,
  assetType,
  onDelete,
  onRename,
}: UnitThumbnailProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const extensionMatch = filename.match(/\.[^/.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : "";
  const displayName = extension
    ? filename.slice(0, -extension.length)
    : filename;

  const [renameValue, setRenameValue] = useState<string>(displayName);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ path, assetType })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(displayName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    const newFilename = `${trimmed}${extension}`;
    if (trimmed && newFilename !== filename) {
      onRename(newFilename);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.thumbnail}
    >
      <img
        src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`}
        alt={filename}
        className={styles.image}
        draggable={false}
      />
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          className={styles.renameInput}
        />
      ) : (
        <span className={styles.filename} onDoubleClick={handleNameDoubleClick}>
          {displayName}
        </span>
      )}
      <button
        onClick={handleDeleteClick}
        title="Delete asset"
        className={`${deleteStyles.deleteButton} ${isHovered ? "" : deleteStyles.hidden}`}
      >
        ×
      </button>
    </div>
  );
}

export default UnitThumbnail;
```

## client/src/store/armies.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const store = () => useMapStore.getState();
const armyOf = (id: string) => store().armies.find((a) => a.id === id)!;

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
  store().setPlacedUnits([
    unit("a"),
    unit("b"),
    unit("c"),
    unit("late", { appears: S + 5 }),
  ]);
});

test("a new army from the selection is named automatically and is one undo step", () => {
  store().boxSelect(["a", "b"]);
  const id = store().createArmyFromSelection()!;

  expect(armyOf(id).name).toBe("Army 1");
  expect(armyOf(id).members).toEqual([{ unitId: "a" }, { unitId: "b" }]);
  expect(store().selectedArmyId).toBe(id);

  store().undo();
  expect(store().armies).toEqual([]);
  store().redo();
  expect(armyOf(id).members).toHaveLength(2);
});

test("units join and leave an army at the playhead's moment", () => {
  store().boxSelect(["a"]);
  const id = store().createArmyFromSelection()!;

  useTimelineStore.getState().setNow(S + 3);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(id);
  expect(armyOf(id).members).toEqual([
    { unitId: "a" },
    { unitId: "c", joins: S + 3 },
  ]);

  useTimelineStore.getState().setNow(S + 8);
  store().removeUnitsFromArmy(id, ["a"]);
  expect(armyOf(id).members[0]).toEqual({ unitId: "a", leaves: S + 8 });

  // Nothing to change: no undo step
  const steps = store().past.length;
  store().removeUnitsFromArmy(id, ["b"]);
  expect(store().past.length).toBe(steps);
});

test("selecting an army selects its members who are on the map at the playhead", () => {
  store().boxSelect(["a", "late"]);
  const id = store().createArmyFromSelection()!;
  store().selectUnit(null);

  store().selectArmy(id);
  expect(Array.from(store().selectedUnitIds)).toEqual(["a"]); // "late" hasn't appeared yet

  useTimelineStore.getState().setNow(S + 6);
  store().selectArmy(id);
  expect(Array.from(store().selectedUnitIds).sort()).toEqual(["a", "late"]);
});

test("renaming and deleting an army; its marches stay but no longer belong to it", () => {
  store().boxSelect(["a"]);
  const id = store().createArmyFromSelection()!;
  const pathId = store().addPath([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ]);
  store().setPaths(
    store().paths.map((p) => (p.id === pathId ? { ...p, armyId: id } : p))
  );

  store().renameArmy(id, "  Normans ");
  expect(armyOf(id).name).toBe("Normans");

  store().deleteArmy(id);
  expect(store().armies).toEqual([]);
  expect(store().paths[0].armyId).toBeUndefined();
  expect(store().placedUnits).toHaveLength(4);

  store().undo();
  expect(armyOf(id).name).toBe("Normans");
  expect(store().paths[0].armyId).toBe(id);
});

test("deleting a unit outright removes it from its army", () => {
  store().boxSelect(["a", "b"]);
  const id = store().createArmyFromSelection()!;

  store().boxSelect(["a"]);
  store().removeSelectedUnits();
  expect(armyOf(id).members).toEqual([{ unitId: "b" }]);
});
```

## client/src/store/armyErase.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 90,
  scale: 1,
});

const store = () => useMapStore.getState();
const pathOf = (id: string) => store().paths.find((p) => p.id === id)!;
const onMarch = (id: string) =>
  pathOf(id)
    .assignments.map((a) => a.unitId)
    .sort();
const armyOf = (id: string) => store().armies.find((a) => a.id === id)!;

// Army "a" marching east twice, days 0-10 then 10-20, and "c" joining it on day 5
function armyWithLateJoiner() {
  store().setPlacedUnits([unit("a", 0, 0), unit("c", 0, 200)]);
  store().boxSelect(["a"]);
  const first = store().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(first);
  store().setMarchTiming(first, { start: S, end: S + 10, turn: 0 });
  const second = store().addPath([
    { x: 1000, y: 0 },
    { x: 2000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(second);
  store().setMarchTiming(second, { start: S + 10, end: S + 20, turn: 0 });
  const armyId = pathOf(first).armyId!;

  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);
  useTimelineStore.getState().setNow(null);
  return { first, second, armyId };
}

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
});

test("erasing a later joiner's membership takes it out of the army and its marches", () => {
  const { second, armyId } = armyWithLateJoiner();
  expect(onMarch(second)).toEqual(["a", "c"]);
  const joiner = armyOf(armyId).members.find((m) => m.unitId === "c")!;
  expect(joiner).toEqual({ unitId: "c", joins: S + 5 });

  // With the playhead at the story's start, before it ever joins
  const steps = store().past.length;
  store().eraseMembership(armyId, joiner);

  expect(armyOf(armyId).members.map((m) => m.unitId)).toEqual(["a"]);
  expect(onMarch(second)).toEqual(["a"]);
  expect(store().past.length).toBe(steps + 1);

  // One undo brings it back
  store().undo();
  expect(onMarch(second)).toEqual(["a", "c"]);
});

test("erasing one stint keeps the unit's other stints in the army", () => {
  const { armyId } = armyWithLateJoiner();
  useTimelineStore.getState().setNow(S + 8);
  store().removeUnitsFromArmy(armyId, ["c"]);
  useTimelineStore.getState().setNow(S + 12);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  const stints = armyOf(armyId).members.filter((m) => m.unitId === "c");
  expect(stints).toEqual([
    { unitId: "c", joins: S + 5, leaves: S + 8 },
    { unitId: "c", joins: S + 12 },
  ]);

  store().eraseMembership(armyId, stints[0]);
  expect(armyOf(armyId).members.filter((m) => m.unitId === "c")).toEqual([
    { unitId: "c", joins: S + 12 },
  ]);
});

test("erasing a membership that isn't there changes nothing and adds no undo step", () => {
  const { armyId } = armyWithLateJoiner();
  const steps = store().past.length;
  store().eraseMembership(armyId, { unitId: "c", joins: S + 99 });
  expect(store().past.length).toBe(steps);
});
```

## client/src/store/armyMarches.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { getTimeline } from "../utils/timeline";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 90, // facing east, so marches east need no turn
  scale: 1,
  ...extra,
});

const store = () => useMapStore.getState();
const pathOf = (id: string) => store().paths.find((p) => p.id === id)!;
const onMarch = (id: string) =>
  pathOf(id)
    .assignments.map((a) => a.unitId)
    .sort();

// Army "a" and "b" marching east twice, days 0-10 then 10-20; "c" stands apart, in no army
function armyWithTwoMarches() {
  store().setPlacedUnits([
    unit("a", 0, -20),
    unit("b", 0, 20),
    unit("c", 0, 200),
  ]);
  store().boxSelect(["a", "b"]);
  const first = store().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(first);
  store().setMarchTiming(first, { start: S, end: S + 10, turn: 0 });
  const second = store().addPath([
    { x: 1000, y: 0 },
    { x: 2000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(second);
  store().setMarchTiming(second, { start: S + 10, end: S + 20, turn: 0 });
  const armyId = pathOf(first).armyId!;
  return { first, second, armyId };
}

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
});

test("both marches belong to the army made when the units were first attached", () => {
  const { first, second, armyId } = armyWithTwoMarches();
  expect(pathOf(second).armyId).toBe(armyId);
  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("a unit that joins mid-story marches with the army's later marches, not the current one", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a", "b", "c"]);

  // The march still starts where the first one ends
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);

  // It stands still until the army sets off on day 10, then marches with it, keeping its
  // place relative to the army's route
  const timeline = getTimeline(store().paths, store().placedUnits);
  const beforeSetOff = timeline.stateAt(S + 9).get("c") ?? { x: 0, y: 200 };
  expect(beforeSetOff.x).toBeCloseTo(0, 3);
  expect(beforeSetOff.y).toBeCloseTo(200, 3);
  const atEnd = timeline.stateAt(S + 20).get("c")!;
  expect(atEnd.x).toBeCloseTo(1000, 3);
  expect(atEnd.y).toBeCloseTo(200, 3);

  // Undo takes it off the march again
  store().undo();
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("a unit that leaves mid-story stops taking part in the army's later marches", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  useTimelineStore.getState().setNow(S + 5);
  store().removeUnitsFromArmy(armyId, ["b"]);

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a"]);

  // It stays where the first march left it, and the army's next march still starts where
  // the first one ends
  const timeline = getTimeline(store().paths, store().placedUnits);
  expect(timeline.stateAt(S + 20).get("b")!.x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);
  expect(timeline.stateAt(S + 20).get("a")!.y).toBeCloseTo(-20, 3);
});

test("attaching units to an army's march makes them join the army as it sets off", () => {
  const { second, armyId } = armyWithTwoMarches();

  store().boxSelect(["c"]);
  store().attachSelectedUnitsToPath(second);

  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.find((m) => m.unitId === "c")).toEqual({
    unitId: "c",
    joins: S + 10,
  });
  expect(onMarch(second)).toEqual(["a", "b", "c"]);
});

test("a unit that hasn't appeared yet, or has left the map, isn't on the march", () => {
  const { second, armyId } = armyWithTwoMarches();

  store().setPlacedUnits(
    store().placedUnits.map((u) => (u.id === "a" ? { ...u, leaves: S + 8 } : u))
  );
  expect(onMarch(second)).toEqual(["b"]);

  // Bringing it back puts it on the march again
  store().bringBackUnits(["a"]);
  expect(onMarch(second)).toEqual(["a", "b"]);
  expect(store().armies.find((a) => a.id === armyId)!.members).toHaveLength(2);
});

test("detaching a unit from an army's march makes it leave the army as the march sets off", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  store().detachUnitFromPath(second, "b");

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a"]);
  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.find((m) => m.unitId === "b")).toEqual({
    unitId: "b",
    leaves: S + 10,
  });
  // The march's start stays where the first march ends
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);

  // Undo puts it back in the army, and on the march
  store().undo();
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("detaching from a march at the story's start takes the unit out of the army altogether", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  store().detachUnitFromPath(first, "a");

  expect(onMarch(first)).toEqual(["b"]);
  expect(onMarch(second)).toEqual(["b"]);
  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.map((m) => m.unitId)).toEqual(["b"]);
});

test("a unit joining from elsewhere doesn't turn the army's formation", () => {
  const { second, armyId } = armyWithTwoMarches();
  store().setFormationMode(second, "wheel");

  // "c" faces north while the army faces east
  store().setPlacedUnits(
    store().placedUnits.map((u) => (u.id === "c" ? { ...u, rotation: 0 } : u))
  );
  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  // "a" and "b" still march straight east, side by side as before
  const timeline = getTimeline(store().paths, store().placedUnits);
  const atEnd = timeline.stateAt(S + 20);
  expect(atEnd.get("a")!.y).toBeCloseTo(-20, 3);
  expect(atEnd.get("b")!.y).toBeCloseTo(20, 3);
  expect(atEnd.get("a")!.x).toBeCloseTo(2000, 3);
});

// The same army with a third march, days 20-30, on to the south-east
function armyWithThreeMarches() {
  const marches = armyWithTwoMarches();
  store().boxSelect(["a", "b"]);
  const third = store().addPath([
    { x: 2000, y: 0 },
    { x: 3000, y: 500 },
  ]);
  store().attachSelectedUnitsToPath(third);
  store().setMarchTiming(third, { start: S + 20, end: S + 30, turn: 0 });
  return { ...marches, third };
}

const startOf = (id: string) => pathOf(id).points[0];

test("units joining or leaving never move where the army's later marches start", () => {
  const { second, third, armyId } = armyWithThreeMarches();
  expect(startOf(second)).toEqual({ x: 1000, y: 0 });
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "c" joins during the first march
  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);
  expect(onMarch(third)).toEqual(["a", "b", "c"]);
  expect(startOf(second)).toEqual({ x: 1000, y: 0 });
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "b" leaves during the second march
  useTimelineStore.getState().setNow(S + 15);
  store().removeUnitsFromArmy(armyId, ["b"]);
  expect(onMarch(third)).toEqual(["a", "c"]);
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // Taking "a" off the third march doesn't move it either
  store().detachUnitFromPath(third, "a");
  expect(onMarch(third)).toEqual(["c"]);
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "c" still keeps its place beside the route: the third march carries it as far as the
  // route goes, 1000 east and 500 south
  const timeline = getTimeline(store().paths, store().placedUnits);
  const setsOff = timeline.stateAt(S + 20).get("c")!;
  const atEnd = timeline.stateAt(S + 30).get("c")!;
  expect(atEnd.x - setsOff.x).toBeCloseTo(1000, 3);
  expect(atEnd.y - setsOff.y).toBeCloseTo(500, 3);
});
```

## client/src/store/map/armiesSlice.ts

```ts
import { StateCreator } from "zustand";
import { Army, ArmyMember } from "../../types";
import { existsAt } from "../../utils/timeline";
import { HistoryTime } from "../../utils/historyTime";
import { placementMoment } from "../../utils/lifespans";
import {
  joinArmy,
  leaveArmy,
  membersAt,
  newArmyId,
  nextArmyName,
} from "../../utils/armies";
import { useTimelineStore } from "../useTimelineStore";
import { withHistory } from "./history";
import { ArmiesSlice, MapStore } from "./types";

// Whether an army change actually changed anything (so a no-op adds no undo step)
const sameArmies = (a: Army[], b: Army[]) =>
  JSON.stringify(a) === JSON.stringify(b);

// The playhead's moment for joining and leaving armies: undefined at the story's start
function armyMoment(storyStart: HistoryTime): HistoryTime | undefined {
  return placementMoment(useTimelineStore.getState().now, storyStart);
}

export const createArmiesSlice: StateCreator<MapStore, [], [], ArmiesSlice> = (
  set,
  get
) => ({
  // Initial state
  armies: [],
  selectedArmyId: null,

  setArmies: (armies) => set({ armies }),

  // Selecting an army selects the units that are in it, and on the map, at the playhead
  selectArmy: (id) => {
    const state = get();
    const army = state.armies.find((a) => a.id === id);
    if (!army) {
      set({ selectedArmyId: null });
      return;
    }
    const moment = useTimelineStore.getState().now ?? state.storyStart;
    const present = new Set(
      state.placedUnits
        .filter((unit) => existsAt(unit, moment))
        .map((unit) => unit.id)
    );
    set({
      selectedArmyId: army.id,
      selectedUnitIds: new Set(
        membersAt(army, moment).filter((uid) => present.has(uid))
      ),
    });
  },

  // A new army of the selected units, from the playhead's moment. One undo step.
  createArmyFromSelection: () => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0) return null;
    const army: Army = {
      id: newArmyId(),
      name: nextArmyName(state.armies),
      members: [],
    };
    const armies = joinArmy(
      [...state.armies, army],
      army.id,
      unitIds,
      armyMoment(state.storyStart)
    );
    set({ ...withHistory(state), armies, selectedArmyId: army.id });
    return army.id;
  },

  renameArmy: (id, name) => {
    const state = get();
    const trimmed = name.trim();
    const army = state.armies.find((a) => a.id === id);
    if (!army || !trimmed || trimmed === army.name) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, name: trimmed } : a
      ),
    });
  },

  // Deleting an army keeps its units and marches; the marches just no longer belong to it
  deleteArmy: (id) => {
    const state = get();
    if (!state.armies.some((a) => a.id === id)) return;
    set({
      ...withHistory(state),
      armies: state.armies.filter((a) => a.id !== id),
      paths: state.paths.map((p) => {
        if (p.armyId !== id) return p;
        const { armyId: _owner, ...rest } = p;
        return rest;
      }),
      selectedArmyId: state.selectedArmyId === id ? null : state.selectedArmyId,
    });
  },

  // The selected units join the army at the playhead's moment (leaving any other army then)
  addSelectedUnitsToArmy: (id) => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0 || !state.armies.some((a) => a.id === id)) return;
    const armies = joinArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Units leave the army at the playhead's moment
  removeUnitsFromArmy: (id, unitIds) => {
    const state = get();
    const armies = leaveArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Erases one stint of a unit in an army, as if it never joined for it. Any of the army's
  // marches it was on go on without it. One undo step.
  eraseMembership: (id, member) => {
    const state = get();
    const same = (m: ArmyMember) =>
      m.unitId === member.unitId &&
      m.joins === member.joins &&
      m.leaves === member.leaves;
    const army = state.armies.find((a) => a.id === id);
    if (!army || !army.members.some(same)) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, members: a.members.filter((m) => !same(m)) } : a
      ),
    });
  },
});
```

## client/src/store/map/history.ts

```ts
import { StateCreator } from "zustand";
import { Army, MapPath, Unit } from "../../types";
import { HistorySlice, MapStore } from "./types";

// One undo step: the whole document, so units, paths and armies move through history together
export interface Snapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
}

export const snapshotOf = (state: MapStore): Snapshot => ({
  units: state.placedUnits,
  paths: state.paths,
  armies: state.armies,
});

// Records the current document as an undo step and clears redo.
// Spread this into a set() call: set({ ...withHistory(get()), placedUnits: ... })
export function withHistory(state: MapStore) {
  return {
    past: [...state.past, snapshotOf(state)],
    future: [] as Snapshot[],
  };
}

// After an undo/redo, drop any selection that points at something that no longer exists
export function reconcileSelection(
  state: MapStore,
  units: Unit[],
  paths: MapPath[]
) {
  const unitIds = new Set(units.map((unit) => unit.id));
  return {
    selectedUnitIds: new Set(
      Array.from(state.selectedUnitIds).filter((id) => unitIds.has(id))
    ),
    selectedPathId: paths.some((path) => path.id === state.selectedPathId)
      ? state.selectedPathId
      : null,
  };
}

export const createHistorySlice: StateCreator<
  MapStore,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  // Initial history state
  past: [],
  future: [],

  // History actions
  set: (newUnits) => {
    set({ ...withHistory(get()), placedUnits: newUnits });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      placedUnits: previous.units,
      paths: previous.paths,
      armies: previous.armies,
      future: [snapshotOf(state), ...state.future],
      ...reconcileSelection(state, previous.units, previous.paths),
      selectedArmyId: previous.armies.some((a) => a.id === state.selectedArmyId)
        ? state.selectedArmyId
        : null,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, snapshotOf(state)],
      placedUnits: next.units,
      paths: next.paths,
      armies: next.armies,
      future: state.future.slice(1),
      ...reconcileSelection(state, next.units, next.paths),
      selectedArmyId: next.armies.some((a) => a.id === state.selectedArmyId)
        ? state.selectedArmyId
        : null,
    });
  },
});
```

## client/src/store/map/pathsSlice.ts

```ts
import { StateCreator } from "zustand";
import { MapPath } from "../../types";
import {
  attachUnits,
  changeFormationMode,
  reanchorPaths,
  rerecordSlots,
} from "../../utils/formation";
import {
  chainedPathIds,
  defaultMarch,
  getTimeline,
  handoverUnits,
  keepAfter,
  validMarch,
} from "../../utils/timeline";
import { clampMarch } from "../../utils/marches";
import { createPlayback } from "../../utils/pathPlayback";
import { defaultMarchStart } from "../../utils/lifespans";
import { armyForAttach, joinArmy, leaveArmy } from "../../utils/armies";
import { withHistory } from "./history";
import { MapStore, PathsSlice } from "./types";

function nextPathName(paths: MapPath[]): string {
  const used = paths
    .map((path) => /^Path (\d+)$/.exec(path.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Path ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

const newPathId = () =>
  `path-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createPathsSlice: StateCreator<MapStore, [], [], PathsSlice> = (
  set,
  get
) => ({
  // Initial state
  paths: [],
  selectedPathId: null,

  // Path actions
  setPaths: (paths) => set({ paths }),

  selectPath: (id) => set({ selectedPathId: id }),

  addPath: (points) => {
    const state = get();
    const path: MapPath = {
      id: newPathId(),
      name: nextPathName(state.paths),
      points,
      assignments: [],
    };
    set({
      ...withHistory(state),
      paths: [...state.paths, path],
      selectedPathId: path.id,
    });
    return path.id;
  },

  updatePathPoints: (id, points) => {
    const state = get();
    const path = state.paths.find((p) => p.id === id);
    if (!path || points.length === 0) return;

    // Moving the start of an army's first march moves the army with it, the same way moving
    // the army moves the start. Its formation, and where it arrives, stay as they were.
    const dx = points[0].x - path.points[0].x;
    const dy = points[0].y - path.points[0].y;
    const startMoved = Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9;
    const chained = chainedPathIds(state.paths);

    if (
      startMoved &&
      points.length === path.points.length &&
      path.assignments.length > 0 &&
      !chained.has(id)
    ) {
      const armyIds = new Set(path.assignments.map((a) => a.unitId));
      const placedUnits = state.placedUnits.map((unit) =>
        armyIds.has(unit.id)
          ? { ...unit, x: unit.x + dx, y: unit.y + dy }
          : unit
      );
      const edited = state.paths.map((p) =>
        p.id === id
          ? { ...p, points, assignments: rerecordSlots(p, points, placedUnits) }
          : p
      );
      set({
        ...withHistory(state),
        placedUnits,
        // Any other first march of the same units follows them too
        paths: reanchorPaths(
          edited,
          state.placedUnits,
          placedUnits,
          new Set([...Array.from(chained), id])
        ),
      });
      return;
    }

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === id
          ? {
              ...p,
              points,
              // Editing the route can change the start heading, so re-measure the formation
              // from where the units are now and nothing jumps when playback starts
              assignments: rerecordSlots(p, points, state.placedUnits),
            }
          : p
      ),
    });
  },

  renamePath: (id, name) => {
    const state = get();
    set({
      ...withHistory(state),
      paths: state.paths.map((path) =>
        path.id === id ? { ...path, name } : path
      ),
    });
  },

  deletePath: (id) => {
    const state = get();
    set({
      ...withHistory(state),
      paths: state.paths.filter((path) => path.id !== id),
      selectedPathId: state.selectedPathId === id ? null : state.selectedPathId,
    });
  },

  // Attaches the selected units to a path and records each one's place in the formation
  // (see attachUnits for how the path's start is handled). One undo step.
  //
  // Units that already march along other paths are picked up where those marches leave them,
  // and this march is dated to begin when the last of those ends. Otherwise it begins at the
  // story's start, or once the last of the units has appeared. A march that already has dates
  // keeps them.
  attachSelectedUnitsToPath: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    const selected = state.placedUnits.filter((unit) =>
      state.selectedUnitIds.has(unit.id)
    );
    if (!path || selected.length === 0) return false;

    const others = state.paths.filter((p) => p.id !== pathId);
    const handover = handoverUnits(others, state.placedUnits, selected);

    const attachment = attachUnits(path, handover.units);
    if (!attachment) return false;

    const march =
      path.march ??
      defaultMarch(
        createPlayback({ ...path, ...attachment }, handover.units),
        defaultMarchStart(handover.time, state.storyStart, selected)
      );

    // The march belongs to the army its units are in when it sets off. Units in no army
    // become a new army; a mix of armies leaves it a plain march. A path that already
    // belongs to an army keeps it, and the selected units join that army as it sets off, so
    // they are on the march (an army's march is whoever is in the army then).
    const setsOff = march.start > state.storyStart ? march.start : undefined;
    const selectedIds = selected.map((unit) => unit.id);
    const owner = path.armyId
      ? {
          armies: joinArmy(state.armies, path.armyId, selectedIds, setsOff),
          armyId: path.armyId,
        }
      : armyForAttach(state.armies, selectedIds, setsOff);

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId
          ? { ...p, ...attachment, march, armyId: owner.armyId }
          : p
      ),
      armies: owner.armies,
      selectedPathId: pathId,
    });
    return true;
  },

  // Takes a unit off a march. An army's march is whoever is in the army as it sets off, so
  // for one of those the unit leaves the army at that moment: it is off this march and the
  // army's later ones, and stays wherever the earlier ones left it. One undo step.
  detachUnitFromPath: (pathId, unitId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path) return;
    const army = path.armyId
      ? state.armies.find((a) => a.id === path.armyId)
      : undefined;
    const march = validMarch(path.march);
    const setsOff =
      march && march.start > state.storyStart ? march.start : undefined;
    set({
      ...withHistory(state),
      armies: army
        ? leaveArmy(state.armies, army.id, [unitId], setsOff)
        : state.armies,
      paths: state.paths.map((p) =>
        p.id === pathId
          ? {
              ...p,
              assignments: p.assignments.filter((a) => a.unitId !== unitId),
            }
          : p
      ),
    });
  },

  // Re-records a path's formation from where its units stand when the march begins (where
  // they were placed, or where an earlier march leaves them), and the way they face then
  refreshPathFormation: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path || path.assignments.length === 0) return;

    const standing = getTimeline(state.paths, state.placedUnits).standing.get(
      pathId
    );
    if (!standing) return;
    const attachment = attachUnits(path, standing);
    if (!attachment) return;

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...attachment } : p
      ),
    });
  },

  // Switches a path between keeping its formation as placed and turning it with its units.
  // Nobody moves; the slots are re-measured. One undo step.
  setFormationMode: (pathId, mode) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path || path.assignments.length === 0) return;

    const change = changeFormationMode(path, state.placedUnits, mode);
    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...change } : p
      ),
    });
  },

  // When a march happens in history. It can't begin before the story starts. One undo step.
  setMarchTiming: (pathId, timing) => {
    const state = get();
    if (!state.paths.some((p) => p.id === pathId)) return;
    const march = keepAfter(clampMarch(timing), state.storyStart, true);
    set({
      ...withHistory(state),
      paths: state.paths.map((p) => (p.id === pathId ? { ...p, march } : p)),
    });
  },
});
```

## client/src/store/map/selectionSlice.ts

```ts
import { StateCreator } from "zustand";
import { MapStore, SelectionSlice } from "./types";

export const createSelectionSlice: StateCreator<
  MapStore,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  // Initial state
  selectedUnitIds: new Set(),
  dragPosition: null,
  dragRotation: null,
  dragScale: null,
  groupDragDelta: null,
  groupRotateDelta: null,
  groupScaleDelta: null,

  // Selection actions
  selectUnit: (id, addToSelection = false) => {
    if (id === null) {
      set({ selectedUnitIds: new Set() });
      return;
    }
    if (addToSelection) {
      const next = new Set(get().selectedUnitIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      set({ selectedUnitIds: next });
    } else {
      set({ selectedUnitIds: new Set([id]) });
    }
  },

  boxSelect: (ids) => set({ selectedUnitIds: new Set(ids) }),

  // Drag actions
  setDragPosition: (drag) => set({ dragPosition: drag }),
  setDragRotation: (drag) => set({ dragRotation: drag }),
  setDragScale: (drag) => set({ dragScale: drag }),
  setGroupDragDelta: (delta) => set({ groupDragDelta: delta }),
  setGroupRotateDelta: (delta) => set({ groupRotateDelta: delta }),
  setGroupScaleDelta: (delta) => set({ groupScaleDelta: delta }),
});
```

## client/src/store/map/storySlice.ts

```ts
import { StateCreator } from "zustand";
import { DEFAULT_STORY_START } from "../../utils/convertProject";
import { MapStore, StorySlice } from "./types";

export const createStorySlice: StateCreator<MapStore, [], [], StorySlice> = (
  set
) => ({
  // Initial state
  storyStart: DEFAULT_STORY_START,
  displayMode: "months",
  pacing: [],
  selectedMapFilename: null,

  setStoryStart: (storyStart) => set({ storyStart }),

  setDisplayMode: (displayMode) => set({ displayMode }),

  setPacing: (pacing) => set({ pacing }),

  setSelectedMap: (filename) => set({ selectedMapFilename: filename }),

  // Clears the whole document and its undo history for a newly loaded project
  resetMapState: () =>
    set({
      past: [],
      future: [],
      clipboard: [],
      placedUnits: [],
      paths: [],
      armies: [],
      selectedArmyId: null,
      storyStart: DEFAULT_STORY_START,
      displayMode: "months",
      pacing: [],
      selectedUnitIds: new Set(),
      selectedPathId: null,
      dragPosition: null,
      dragRotation: null,
      dragScale: null,
      groupDragDelta: null,
      groupRotateDelta: null,
      groupScaleDelta: null,
      selectedMapFilename: null,
    }),
});
```

## client/src/store/map/types.ts

```ts
import {
  Army,
  ArmyMember,
  Unit,
  AssetType,
  HistoryDisplay,
  MapPath,
  MarchTiming,
  PacingKey,
  PathPoint,
  TravelMode,
} from "../../types";
import { FormationMode } from "../../utils/formation";
import { HistoryTime } from "../../utils/historyTime";
import { Snapshot } from "./history";

export interface DragPosition {
  id: string;
  x: number;
  y: number;
}

export interface DragRotation {
  id: string;
  rotation: number;
}

export interface DragScale {
  id: string;
  scale: number;
}

export interface GroupDragDelta {
  dx: number;
  dy: number;
}

// Undo and redo over the whole document
export interface HistorySlice {
  past: Snapshot[];
  future: Snapshot[];

  set: (units: Unit[]) => void;
  undo: () => void;
  redo: () => void;
}

// What is selected, and the live previews while something is being dragged
export interface SelectionSlice {
  selectedUnitIds: Set<string>;
  dragPosition: DragPosition | null;
  dragRotation: DragRotation | null;
  dragScale: DragScale | null;
  groupDragDelta: GroupDragDelta | null;
  groupRotateDelta: number | null;
  groupScaleDelta: number | null;

  // Selection actions
  selectUnit: (id: string | null, addToSelection?: boolean) => void;
  boxSelect: (ids: string[]) => void;

  // Drag actions
  setDragPosition: (drag: DragPosition | null) => void;
  setDragRotation: (drag: DragRotation | null) => void;
  setDragScale: (drag: DragScale | null) => void;
  setGroupDragDelta: (delta: GroupDragDelta | null) => void;
  setGroupRotateDelta: (delta: number | null) => void;
  setGroupScaleDelta: (delta: number | null) => void;
}

// The placed units and everything that edits them directly
export interface UnitsSlice {
  placedUnits: Unit[];

  // Unit actions
  setPlacedUnits: (units: Unit[]) => void;
  addUnit: (path: string, assetType: AssetType) => void;
  removeSelectedUnits: () => void;
  addUnitAtPosition: (
    path: string,
    assetType: AssetType,
    x: number,
    y: number
  ) => void;
  cleanupRenamedAsset: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;

  // Cleanup when an asset is deleted elsewhere (called via useAssetStore's onDeleted callback)
  cleanupDeletedAsset: (path: string, assetType: AssetType) => void;

  // Commit actions
  commitUnitMove: (id: string, x: number, y: number) => void;
  commitUnitRotate: (id: string, rotation: number) => void;
  commitUnitScale: (id: string, scale: number) => void;
  commitGroupMove: (dx: number, dy: number) => void;
  commitGroupRotate: (delta: number) => void;
  commitGroupScale: (delta: number) => void;

  // copy/paste items
  clipboard: Unit[];
  copySelectedUnits: () => void;
  pasteUnits: () => void;

  // flip items
  flipSelectedUnits: () => void;
  setUnitForward: (unitId: string, forwardAngle: number) => void;
  setUnitsTravelMode: (unitIds: string[], mode: TravelMode) => void;
  bringBackUnits: (unitIds: string[]) => void;
}

// Movement paths, the units attached to them, and when they march
export interface PathsSlice {
  paths: MapPath[];
  selectedPathId: string | null;

  // Path actions (setPaths is for loading and bypasses history)
  setPaths: (paths: MapPath[]) => void;
  selectPath: (id: string | null) => void;
  addPath: (points: PathPoint[]) => string;
  updatePathPoints: (id: string, points: PathPoint[]) => void;
  renamePath: (id: string, name: string) => void;
  deletePath: (id: string) => void;

  attachSelectedUnitsToPath: (pathId: string) => boolean;
  detachUnitFromPath: (pathId: string, unitId: string) => void;
  refreshPathFormation: (pathId: string) => void;
  setFormationMode: (pathId: string, mode: FormationMode) => void;
  setMarchTiming: (pathId: string, timing: MarchTiming) => void;
}

// Armies (setArmies is for loading and bypasses history). Joining and leaving happen at the
// playhead's moment, or from the start when the playhead is at the story's start.
export interface ArmiesSlice {
  armies: Army[];
  selectedArmyId: string | null;
  setArmies: (armies: Army[]) => void;
  selectArmy: (id: string | null) => void;
  createArmyFromSelection: () => string | null;
  renameArmy: (id: string, name: string) => void;
  deleteArmy: (id: string) => void;
  addSelectedUnitsToArmy: (id: string) => void;
  removeUnitsFromArmy: (id: string, unitIds: string[]) => void;
  eraseMembership: (id: string, member: ArmyMember) => void;
}

export interface StorySlice {
  // The story in history. The placed units stand as they are at `storyStart`. These load
  // with the project and bypass undo.
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[]; // from older projects' date markers, for the first shot later
  setStoryStart: (storyStart: HistoryTime) => void;
  setDisplayMode: (mode: HistoryDisplay) => void;
  setPacing: (pacing: PacingKey[]) => void;

  // Track Map files
  selectedMapFilename: string | null;
  setSelectedMap: (filename: string | null) => void;

  // reset map on new project load.
  resetMapState: () => void;
}

// The whole map document store, made from its slices
export type MapStore = HistorySlice &
  SelectionSlice &
  UnitsSlice &
  PathsSlice &
  ArmiesSlice &
  StorySlice;
```

## client/src/store/map/unitsSlice.ts

```ts
import { StateCreator } from "zustand";
import { Unit, AssetType, MapPath } from "../../types";
import { reanchorPaths } from "../../utils/formation";
import { chainedPathIds } from "../../utils/timeline";
import { HistoryTime } from "../../utils/historyTime";
import { placementMoment, removeUnitsAt } from "../../utils/lifespans";
import { forgetUnits } from "../../utils/armies";
import { useTimelineStore } from "../useTimelineStore";
import { Snapshot, snapshotOf, withHistory } from "./history";
import { MapStore, UnitsSlice } from "./types";

// Keeps only the formation slots whose unit still exists
function keepAssignments(
  paths: MapPath[],
  keepUnitIds: Set<string>
): MapPath[] {
  return paths.map((path) => ({
    ...path,
    assignments: path.assignments.filter((a) => keepUnitIds.has(a.unitId)),
  }));
}

// A new unit starts with the facing and travel mode of the most recently placed unit made
// from the same asset, so they only need setting once. After that each unit is independent.
function inheritedFacing(units: Unit[], path: string, assetType: AssetType) {
  const sameAsset = [...units]
    .reverse()
    .filter(
      (unit) =>
        unit.assetType === assetType && (unit.path ?? unit.filename) === path
    );
  return {
    forwardAngle: sameAsset.find((unit) => unit.forwardAngle !== undefined)
      ?.forwardAngle,
    travelMode: sameAsset.find((unit) => unit.travelMode !== undefined)
      ?.travelMode,
  };
}

// When a unit placed right now appears: at the playhead once it is past the story's start,
// otherwise it is there from the start (no date)
function appearsNow(storyStart: HistoryTime): { appears?: number } {
  const appears = placementMoment(useTimelineStore.getState().now, storyStart);
  return appears === undefined ? {} : { appears };
}

export const createUnitsSlice: StateCreator<MapStore, [], [], UnitsSlice> = (
  set,
  get
) => ({
  clipboard: [],

  // Initial state
  placedUnits: [],

  // Unit actions — setPlacedUnits bypasses history (for loading)
  setPlacedUnits: (units) => set({ placedUnits: units }),

  addUnit: (path, assetType) => {
    const state = get();
    const filename = path.split("/").pop() ?? path;
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      path,
      assetType,
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      ...inheritedFacing(state.placedUnits, path, assetType),
      ...appearsNow(state.storyStart),
    };
    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, newUnit],
    });
  },

  // At a unit's own moment (the story's start, or when it appears) deleting removes it
  // outright. Anywhere later it leaves at the playhead's moment and stays in history before.
  removeSelectedUnits: () => {
    const state = get();
    if (state.selectedUnitIds.size === 0) return;
    const { units, deletedIds } = removeUnitsAt(
      state.placedUnits,
      state.selectedUnitIds,
      useTimelineStore.getState().now,
      state.storyStart
    );
    set({
      ...withHistory(state),
      placedUnits: units,
      // Units that only leave keep their places in their marches
      paths:
        deletedIds.size > 0
          ? keepAssignments(state.paths, new Set(units.map((u) => u.id)))
          : state.paths,
      // Deleted units are forgotten by their armies; units that only leave stay in them
      armies: forgetUnits(state.armies, deletedIds),
      selectedUnitIds: new Set(),
    });
  },

  // Cleanup when an asset is deleted elsewhere
  cleanupDeletedAsset: (path, assetType) => {
    const state = get();
    const usesAsset = (unit: Unit) =>
      unit.assetType === assetType && (unit.path ?? unit.filename) === path;

    // Removes the asset's units, and their formation slots, from a snapshot
    const strip = (snapshot: Snapshot): Snapshot => {
      const units = snapshot.units.filter((unit) => !usesAsset(unit));
      const gone = new Set(
        snapshot.units.filter(usesAsset).map((unit) => unit.id)
      );
      return {
        ...snapshot,
        units,
        paths: keepAssignments(snapshot.paths, new Set(units.map((u) => u.id))),
        armies: forgetUnits(snapshot.armies, gone),
      };
    };

    const current = strip(snapshotOf(state));
    const remainingIds = new Set(current.units.map((unit) => unit.id));

    set({
      placedUnits: current.units,
      paths: current.paths,
      armies: current.armies,
      past: state.past.map(strip),
      future: state.future.map(strip),
      selectedUnitIds: new Set(
        Array.from(state.selectedUnitIds).filter((id) => remainingIds.has(id))
      ),
    });

    if (assetType === "maps" && get().selectedMapFilename === path) {
      set({ selectedMapFilename: null });
    }
  },

  // Commit actions — all go through history
  commitUnitMove: (id, x, y) => {
    const state = get();
    const placedUnits = state.placedUnits.map((unit) =>
      unit.id === id ? { ...unit, x, y } : unit
    );
    set({
      ...withHistory(state),
      dragPosition: null,
      placedUnits,
      // Attached units that moved keep their place in the formation (see reanchorPaths)
      paths: reanchorPaths(
        state.paths,
        state.placedUnits,
        placedUnits,
        chainedPathIds(state.paths)
      ),
    });
  },

  commitUnitRotate: (id, rotation) => {
    const state = get();
    set({
      ...withHistory(state),
      dragRotation: null,
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === id ? { ...unit, rotation } : unit
      ),
    });
  },

  commitUnitScale: (id, scale) => {
    const state = get();
    set({
      ...withHistory(state),
      dragScale: null,
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === id ? { ...unit, scale } : unit
      ),
    });
  },

  commitGroupMove: (dx, dy) => {
    const state = get();
    const placedUnits = state.placedUnits.map((unit) =>
      state.selectedUnitIds.has(unit.id)
        ? { ...unit, x: unit.x + dx, y: unit.y + dy }
        : unit
    );
    set({
      ...withHistory(state),
      groupDragDelta: null,
      placedUnits,
      paths: reanchorPaths(
        state.paths,
        state.placedUnits,
        placedUnits,
        chainedPathIds(state.paths)
      ),
    });
  },

  commitGroupRotate: (delta) => {
    const state = get();
    set({
      ...withHistory(state),
      groupRotateDelta: null,
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, rotation: unit.rotation + delta }
          : unit
      ),
    });
  },

  commitGroupScale: (delta) => {
    const state = get();
    set({
      ...withHistory(state),
      groupScaleDelta: null,
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, scale: Math.min(Math.max(unit.scale + delta, 0.1), 5) }
          : unit
      ),
    });
  },

  addUnitAtPosition: (path, assetType, x, y) => {
    const state = get();
    const filename = path.split("/").pop() ?? path;
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      path,
      assetType,
      x,
      y,
      rotation: 0,
      scale: 1,
      ...inheritedFacing(state.placedUnits, path, assetType),
      ...appearsNow(state.storyStart),
    };
    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, newUnit],
    });
  },

  copySelectedUnits: () => {
    const { placedUnits, selectedUnitIds } = get();
    const copied = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
    set({ clipboard: copied });
  },

  pasteUnits: () => {
    const state = get();
    if (state.clipboard.length === 0) return;

    // Pasted units appear at the playhead's moment, like any other newly placed unit
    const newUnits: Unit[] = state.clipboard.map(
      ({ appears: _appears, leaves: _leaves, ...unit }) => ({
        ...unit,
        id: `${unit.filename}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: unit.x + 20,
        y: unit.y + 20,
        ...appearsNow(state.storyStart),
      })
    );

    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, ...newUnits],
      selectedUnitIds: new Set(newUnits.map((u) => u.id)),
    });
  },

  flipSelectedUnits: () => {
    const state = get();
    if (state.selectedUnitIds.size === 0) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, flipped: !unit.flipped }
          : unit
      ),
    });
  },

  // Sets which way one unit's art faces (one undo step)
  setUnitForward: (unitId, forwardAngle) => {
    const state = get();
    if (!state.placedUnits.some((unit) => unit.id === unitId)) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === unitId ? { ...unit, forwardAngle } : unit
      ),
    });
  },

  setUnitsTravelMode: (unitIds, mode) => {
    const state = get();
    const ids = new Set(unitIds);
    if (!state.placedUnits.some((unit) => ids.has(unit.id))) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        ids.has(unit.id) ? { ...unit, travelMode: mode } : unit
      ),
    });
  },

  // Undoes a unit leaving: it stays until the end of the story again. One undo step.
  bringBackUnits: (unitIds) => {
    const state = get();
    const ids = new Set(unitIds);
    const anyLeaving = state.placedUnits.some(
      (unit) => ids.has(unit.id) && unit.leaves !== undefined
    );
    if (!anyLeaving) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) => {
        if (!ids.has(unit.id) || unit.leaves === undefined) return unit;
        const { leaves: _left, ...back } = unit;
        return back;
      }),
    });
  },

  cleanupRenamedAsset: (oldPath, newPath, assetType) => {
    const { placedUnits } = get();
    const newFilename = newPath.split("/").pop() ?? newPath;
    const updatedUnits = placedUnits.map((unit) =>
      unit.path === oldPath && unit.assetType === assetType
        ? { ...unit, path: newPath, filename: newFilename }
        : unit
    );
    set({ placedUnits: updatedUnits });
  },
});
```

## client/src/store/pathAttach.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { Unit } from "../types";
import { playbackState } from "../utils/pathPlayback";

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
  ...extra,
});

const pathOf = (id: string) =>
  useMapStore.getState().paths.find((p) => p.id === id)!;
const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id)!;

// Two units either side of the line the path will run along, both selected
function setup() {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", 50, 20), unit("b", 50, -20)]);
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
  ]);
  useMapStore.getState().boxSelect(["a", "b"]);
  return id;
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("attaching moves the path start to the formation centre, as one undo step", () => {
  const id = setup();
  const stepsBefore = useMapStore.getState().past.length;

  expect(useMapStore.getState().attachSelectedUnitsToPath(id)).toBe(true);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(0, 6);
  expect(pathOf(id).assignments).toHaveLength(2);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(pathOf(id).points[0]).toEqual({ x: 0, y: 0 });
  expect(pathOf(id).assignments).toHaveLength(0);
});

test("attaching with nothing selected does nothing", () => {
  const id = setup();
  useMapStore.getState().selectUnit(null);
  expect(useMapStore.getState().attachSelectedUnitsToPath(id)).toBe(false);
  expect(pathOf(id).assignments).toHaveLength(0);
});

test("detaching removes one unit from the path, and undo restores it", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  useMapStore.getState().detachUnitFromPath(id, "a");
  expect(pathOf(id).assignments.map((a) => a.unitId)).toEqual(["b"]);

  useMapStore.getState().undo();
  expect(pathOf(id).assignments).toHaveLength(2);
});

test("travel mode is set on the chosen units only, as one undo step", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0), unit("b", 0, 0)]);

  useMapStore.getState().setUnitsTravelMode(["a"], "upright");
  expect(byId("a").travelMode).toBe("upright");
  expect(byId("b").travelMode).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("a").travelMode).toBeUndefined();
});

test("a new unit inherits the travel mode of the same asset already on the map", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("Ship", 0, 0, { travelMode: "upright" })]);

  useMapStore.getState().addUnitAtPosition("Ship.png", "units", 10, 10);
  expect(useMapStore.getState().placedUnits[1].travelMode).toBe("upright");

  useMapStore.getState().addUnitAtPosition("Army.png", "units", 20, 20);
  expect(useMapStore.getState().placedUnits[2].travelMode).toBeUndefined();
});

test("moving every attached unit together moves the path start with them, in one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().commitGroupMove(30, 30);
  expect(pathOf(id).points[0].x).toBeCloseTo(80, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(30, 6);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(byId("a").x).toBe(50);
});

test("moving one attached unit keeps the path start and re-records its slot", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  useMapStore.getState().commitUnitMove("a", 60, 40);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(0, 6);
  const slot = pathOf(id).assignments.find((s) => s.unitId === "a")!;
  // The path heads east, so a point 10 east and 40 south of the start is 10 ahead, 40 to the right
  expect(slot.forward).toBeCloseTo(10, 6);
  expect(slot.right).toBeCloseTo(40, 6);
});

test("editing a path keeps its attached units exactly where they are at the start of playback", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  // Bend the route so the start heading changes
  useMapStore
    .getState()
    .updatePathPoints(id, [
      pathOf(id).points[0],
      { x: 120, y: 90 },
      { x: 250, y: 0 },
    ]);

  const state = playbackState(
    pathOf(id),
    useMapStore.getState().placedUnits,
    0
  );
  expect(state.get("a")!.x).toBeCloseTo(50, 5);
  expect(state.get("a")!.y).toBeCloseTo(20, 5);
  expect(state.get("b")!.x).toBeCloseTo(50, 5);
  expect(state.get("b")!.y).toBeCloseTo(-20, 5);
});

test("attaching keeps the formation as placed by default", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  expect(pathOf(id).direction).toBeUndefined();
});

test("switching the formation mode re-measures the slots without moving anyone, as one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().setFormationMode(id, "wheel");
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  // Everyone is still exactly where they were placed
  const state = playbackState(
    pathOf(id),
    useMapStore.getState().placedUnits,
    0
  );
  expect(state.get("a")!.x).toBeCloseTo(50, 5);
  expect(state.get("a")!.y).toBeCloseTo(20, 5);

  useMapStore.getState().setFormationMode(id, "keep");
  expect(pathOf(id).direction).toBeUndefined();

  useMapStore.getState().undo();
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
});

test("re-recording a turning formation follows how the units face now, as one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  useMapStore.getState().setFormationMode(id, "wheel");

  useMapStore.getState().commitGroupRotate(90); // both units now face east
  expect(pathOf(id).direction).toBeCloseTo(-90, 6); // the formation has not followed yet

  useMapStore.getState().refreshPathFormation(id);
  expect(pathOf(id).direction).toBeCloseTo(0, 6);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);

  useMapStore.getState().undo();
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
});
```

## client/src/store/pathChaining.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { usePathToolStore } from "./usePathToolStore";
import { chainedPathIds, getTimeline } from "../utils/timeline";
import { Unit } from "../types";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

const pathOf = (id: string) =>
  useMapStore.getState().paths.find((p) => p.id === id)!;
const storyStart = () => useMapStore.getState().storyStart;

// Dates a march `from` to `to` days after the story starts, with no turn
const dateMarch = (id: string, from: number, to: number) =>
  useMapStore
    .getState()
    .setMarchTiming(id, {
      start: storyStart() + from,
      end: storyStart() + to,
      turn: 0,
    });

const currentTimeline = () => {
  const { paths, placedUnits } = useMapStore.getState();
  return getTimeline(paths, placedUnits);
};

// Every chained march starts at the centre of the units as they stand when it begins
function expectChainedStartsAtArrival() {
  const { paths } = useMapStore.getState();
  const timeline = currentTimeline();
  const chained = chainedPathIds(paths);
  expect(chained.size).toBeGreaterThan(0);

  chained.forEach((id) => {
    const standing = timeline.standing.get(id)!;
    const cx = standing.reduce((sum, u) => sum + u.x, 0) / standing.length;
    const cy = standing.reduce((sum, u) => sum + u.y, 0) / standing.length;
    expect(pathOf(id).points[0].x).toBeCloseTo(cx, 4);
    expect(pathOf(id).points[0].y).toBeCloseTo(cy, 4);
  });
}

// One army placed at the origin, marching east and then on towards the south
function twoMarches() {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);
  return { first, second };
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
  usePathToolStore.setState({
    drawingPoints: null,
    draftPath: null,
    selectedWaypoint: null,
    preview: null,
  });
});

test("the first march starts with the story, and a second is dated to begin when it ends", () => {
  const { first, second } = twoMarches();

  expect(pathOf(first).march!.start).toBe(storyStart());
  expect(pathOf(second).march!.start).toBeCloseTo(pathOf(first).march!.end, 9);
  expect(pathOf(second).march!.end).toBeGreaterThan(
    pathOf(second).march!.start
  );
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("the unit marches on from the end of the first march", () => {
  const { second } = twoMarches();
  const timeline = currentTimeline();
  const timing = timeline.timings.get(second)!;

  const atHandover = timeline.stateAt(timing.start).get("a")!;
  expect(atHandover.x).toBeCloseTo(1000, 3);
  expect(atHandover.y).toBeCloseTo(0, 3);

  const end = timeline.stateAt(timing.end).get("a")!;
  expect(end.x).toBeCloseTo(1000, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("moving the placed units shifts the first march's start but not a chained one", () => {
  const { first, second } = twoMarches();

  useMapStore.getState().commitUnitMove("a", 50, 20);
  expect(pathOf(first).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(first).points[0].y).toBeCloseTo(20, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);
});

test("attaching to a path that already has dates keeps them", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  dateMarch(second, 30, 40);
  useMapStore.getState().attachSelectedUnitsToPath(second);

  expect(pathOf(second).march).toEqual({
    start: storyStart() + 30,
    end: storyStart() + 40,
    turn: 0,
  });
  // ...but it still picks the unit up where the first march ended
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
});

test("re-recording a chained march keeps its start where the units arrive", () => {
  const { second } = twoMarches();

  useMapStore.getState().refreshPathFormation(second);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("reshaping the first march moves the chained march's start to the new arrival point", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  dateMarch(first, 0, 10);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);

  useMapStore
    .getState()
    .updatePathPoints(first, [pathOf(first).points[0], { x: 1500, y: 0 }]);

  expect(pathOf(second).points[0].x).toBeCloseTo(1500, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
  expectChainedStartsAtArrival();

  // Undo puts both marches back exactly as they were
  useMapStore.getState().undo();
  expect(pathOf(first).points[1].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
});

test("re-dating the marches re-chains them", () => {
  const { first, second } = twoMarches();

  // March the second route first: now the first one is the one that follows on
  dateMarch(first, 20, 32);
  dateMarch(second, 0, 10);

  expect(Array.from(chainedPathIds(useMapStore.getState().paths))).toEqual([
    first,
  ]);
  // The army now marches the second route first, so the first route picks up where that one
  // ends
  expect(pathOf(first).points[0].x).toBeCloseTo(1000, 4);
  expect(pathOf(first).points[0].y).toBeCloseTo(1000, 4);
});

test("a project saved before starts followed their units is fixed when it loads", () => {
  const { second } = twoMarches();

  // As an older project would have it: the second march still drawn from the origin
  useMapStore
    .getState()
    .setPaths(
      useMapStore
        .getState()
        .paths.map((p) =>
          p.id === second
            ? { ...p, points: [{ x: 0, y: 0 }, ...p.points.slice(1)] }
            : p
        )
    );

  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("reshaping the first march re-chains every march after it", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, -20), unit("b", 0, 20)]);
  useMapStore.getState().boxSelect(["a", "b"]);

  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  dateMarch(first, 0, 10);

  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);
  dateMarch(second, 10, 20);

  const third = useMapStore.getState().addPath([
    { x: 1000, y: 1000 },
    { x: 0, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(third);
  expectChainedStartsAtArrival();

  useMapStore
    .getState()
    .updatePathPoints(first, [pathOf(first).points[0], { x: 1500, y: 300 }]);

  expect(pathOf(second).points[0].x).toBeCloseTo(1500, 2);
  expect(pathOf(second).points[0].y).toBeCloseTo(300, 2);
  expectChainedStartsAtArrival();
});

test("a chained march's first waypoint can't be deleted", () => {
  const { second } = twoMarches();
  useMapStore
    .getState()
    .updatePathPoints(second, [
      pathOf(second).points[0],
      { x: 1000, y: 500 },
      pathOf(second).points[1],
    ]);

  usePathToolStore.getState().selectWaypoint(second, 0);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(false);

  usePathToolStore.getState().selectWaypoint(second, 1);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(true);
  expect(pathOf(second).points).toHaveLength(2);
});

test("dragging the start of the first march moves its army with it, so the next march stays put", () => {
  const { first, second } = twoMarches();
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore
    .getState()
    .updatePathPoints(first, [{ x: 40, y: 30 }, pathOf(first).points[1]]);

  const army = useMapStore.getState().placedUnits.find((u) => u.id === "a")!;
  expect(army.x).toBeCloseTo(40, 6);
  expect(army.y).toBeCloseTo(30, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  const restored = useMapStore
    .getState()
    .placedUnits.find((u) => u.id === "a")!;
  expect(restored.x).toBe(0);
  expect(pathOf(first).points[0].x).toBeCloseTo(0, 6);
});
```

## client/src/store/pathTiming.test.ts

```ts
import { useMapStore } from "./useMapStore";
import {
  currentMoment,
  isPastStart,
  useTimelineStore,
} from "./useTimelineStore";
import { MIN_SPAN_DAYS } from "../utils/marches";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const line = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

const S = DEFAULT_STORY_START;

beforeEach(() => {
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
});

test("dating a march is one undo step", () => {
  const id = useMapStore.getState().addPath(line);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S + 2, end: S + 9, turn: 1 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S + 2,
    end: S + 9,
    turn: 1,
  });
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].march).toBeUndefined();
});

test("a march can't begin before the story, end before it begins, or turn for longer than it lasts", () => {
  const id = useMapStore.getState().addPath(line);

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S - 4, end: S + 1, turn: 0 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S,
    end: S + 5,
    turn: 0,
  });

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S + 3, end: S + 1, turn: 2 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S + 3,
    end: S + 3 + MIN_SPAN_DAYS,
    turn: 0,
  });

  useMapStore.getState().setMarchTiming(id, { start: S, end: S + 2, turn: 5 });
  expect(useMapStore.getState().paths[0].march!.turn).toBeCloseTo(
    2 - MIN_SPAN_DAYS,
    9
  );
});

test("units attached with no earlier marches set off when the story starts", () => {
  const unit: Unit = {
    id: "a",
    filename: "a.png",
    path: "a.png",
    assetType: "units",
    x: 0,
    y: 0,
    rotation: 90,
    scale: 1,
  };
  useMapStore.getState().setStoryStart(S + 100);
  useMapStore.getState().setPlacedUnits([unit]);
  useMapStore.getState().boxSelect(["a"]);
  const id = useMapStore.getState().addPath(line);
  useMapStore.getState().attachSelectedUnitsToPath(id);

  const march = useMapStore.getState().paths[0].march!;
  expect(march.start).toBe(S + 100);
  expect(march.end).toBeGreaterThan(march.start);
  expect(march.turn).toBe(0); // already facing the way it goes
});

test("the story's start, display and pacing load without undo steps, and reset to defaults", () => {
  const map = useMapStore.getState();
  map.setStoryStart(S + 10);
  map.setDisplayMode("times");
  map.setPacing([{ seconds: 0, time: S }]);
  expect(useMapStore.getState().past).toHaveLength(0);

  map.resetMapState();
  const state = useMapStore.getState();
  expect(state.storyStart).toBe(S);
  expect(state.displayMode).toBe("months");
  expect(state.pacing).toEqual([]);
});

test("the playhead starts at the story's start, and only counts as past it once it moves on", () => {
  const timeline = useTimelineStore.getState();
  expect(useTimelineStore.getState().now).toBeNull();
  expect(currentMoment(null, S)).toBe(S);
  expect(isPastStart(null, S)).toBe(false);

  timeline.setNow(S + 3);
  expect(currentMoment(useTimelineStore.getState().now, S)).toBe(S + 3);
  expect(isPastStart(S + 3, S)).toBe(true);
  expect(isPastStart(S, S)).toBe(false);

  timeline.play();
  expect(useTimelineStore.getState().playing).toBe(true);
  timeline.pause();
  expect(useTimelineStore.getState().playing).toBe(false);
});

test("resetting goes back to the start and fits the view, but keeps the pace", () => {
  const timeline = useTimelineStore.getState();
  timeline.setPace(7);
  timeline.setNow(S + 5);
  timeline.setView({ from: S, to: S + 1 });
  timeline.play();
  timeline.setDraftTiming({
    pathId: "p",
    timing: { start: S, end: S + 1, turn: 0 },
  });

  timeline.reset();
  const state = useTimelineStore.getState();
  expect(state.now).toBeNull();
  expect(state.playing).toBe(false);
  expect(state.draftTiming).toBeNull();
  expect(state.view).toBeNull();
  expect(state.pace).toBe(7);
});
```

## client/src/store/timelineStore.test.ts

```ts
import {
  clampRowsHeight,
  DEFAULT_ROWS_HEIGHT,
  MIN_ROWS_HEIGHT,
  useTimelineStore,
} from "./useTimelineStore";

const timeline = () => useTimelineStore.getState();

beforeEach(() => {
  timeline().setRowFilter("all");
  timeline().setRowsHeight(DEFAULT_ROWS_HEIGHT);
  timeline().reset();
});

test("the rows area keeps between its smallest height and most of the window", () => {
  expect(clampRowsHeight(10, 1000)).toBe(MIN_ROWS_HEIGHT);
  expect(clampRowsHeight(300, 1000)).toBe(300);
  expect(clampRowsHeight(900, 1000)).toBe(700);
  // A tiny window still leaves the smallest height
  expect(clampRowsHeight(300, 50)).toBe(MIN_ROWS_HEIGHT);
});

test("groups fold and unfold", () => {
  timeline().toggleGroup("A");
  timeline().toggleGroup("B");
  expect(timeline().collapsedGroups).toEqual(["A", "B"]);
  timeline().toggleGroup("A");
  expect(timeline().collapsedGroups).toEqual(["B"]);
  timeline().expandGroup("B");
  timeline().expandGroup("C"); // already open: nothing happens
  expect(timeline().collapsedGroups).toEqual([]);
});

test("opening another project unfolds the groups but keeps the filter and the height", () => {
  timeline().setRowFilter("now");
  timeline().setRowsHeight(320);
  timeline().toggleGroup("A");
  timeline().setNow(42);

  timeline().reset();

  expect(timeline().now).toBeNull();
  expect(timeline().collapsedGroups).toEqual([]);
  expect(timeline().rowFilter).toBe("now");
  expect(timeline().rowsHeight).toBe(320);
});

test("remembering the filter and the height never throws, with or without browser storage", () => {
  expect(() => timeline().setRowFilter("view")).not.toThrow();
  expect(() => timeline().saveRowsHeight()).not.toThrow();
  expect(timeline().rowFilter).toBe("view");
});
```

## client/src/store/unitForward.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { Unit } from "../types";

const unit = (id: string, path: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: path,
  path,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id)!;

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("setting forwards changes only that unit, as one undo step", () => {
  useMapStore
    .getState()
    .setPlacedUnits([
      unit("a", "Army.png"),
      unit("b", "Army.png"),
      unit("c", "Archers.png"),
    ]);

  useMapStore.getState().setUnitForward("a", 90);
  expect(byId("a").forwardAngle).toBe(90);
  expect(byId("b").forwardAngle).toBeUndefined();
  expect(byId("c").forwardAngle).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("a").forwardAngle).toBeUndefined();
});

test("a pasted copy keeps its own facing, so changing one does not change the other", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", "Army.png", { forwardAngle: 45 })]);
  useMapStore.getState().selectUnit("a");
  useMapStore.getState().copySelectedUnits();
  useMapStore.getState().pasteUnits();

  const pasted = useMapStore.getState().placedUnits[1];
  expect(pasted.forwardAngle).toBe(45);

  useMapStore.getState().setUnitForward(pasted.id, -90);
  expect(byId("a").forwardAngle).toBe(45);
  expect(byId(pasted.id).forwardAngle).toBe(-90);
});

test("a new unit inherits the facing of the most recently placed unit of the same asset", () => {
  useMapStore
    .getState()
    .setPlacedUnits([
      unit("a", "Army.png", { forwardAngle: -90 }),
      unit("b", "Army.png", { forwardAngle: 0 }),
    ]);

  useMapStore.getState().addUnitAtPosition("Army.png", "units", 10, 10);
  expect(useMapStore.getState().placedUnits[2].forwardAngle).toBe(0);

  useMapStore.getState().addUnitAtPosition("Archers.png", "units", 20, 20);
  expect(useMapStore.getState().placedUnits[3].forwardAngle).toBeUndefined();
});
```

## client/src/store/unitLifespans.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id);

beforeEach(() => {
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
});

test("a unit placed at the story's start has no dates; placed later, it appears then", () => {
  useMapStore.getState().addUnitAtPosition("army.png", "units", 10, 20);
  expect(useMapStore.getState().placedUnits[0].appears).toBeUndefined();

  useTimelineStore.getState().setNow(S + 4);
  useMapStore.getState().addUnitAtPosition("army.png", "units", 30, 40);
  const later = useMapStore.getState().placedUnits[1];
  expect(later.appears).toBe(S + 4);
  expect(later.x).toBe(30);
});

test("pasted units appear at the playhead, and don't keep the copied unit's dates", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", { appears: S + 1, leaves: S + 2 })]);
  useMapStore.getState().boxSelect(["a"]);
  useMapStore.getState().copySelectedUnits();

  useTimelineStore.getState().setNow(S + 7);
  useMapStore.getState().pasteUnits();
  const pasted = useMapStore.getState().placedUnits[1];
  expect(pasted.appears).toBe(S + 7);
  expect(pasted.leaves).toBeUndefined();
});

test("deleting at the start removes a unit; later it leaves, and both are one undo step", () => {
  useMapStore.getState().setPlacedUnits([unit("a"), unit("b")]);

  useTimelineStore.getState().setNow(S + 3);
  useMapStore.getState().boxSelect(["a"]);
  useMapStore.getState().removeSelectedUnits();
  expect(byId("a")!.leaves).toBe(S + 3);

  useTimelineStore.getState().setNow(null);
  useMapStore.getState().boxSelect(["b"]);
  useMapStore.getState().removeSelectedUnits();
  expect(byId("b")).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("b")).toBeDefined();
  useMapStore.getState().undo();
  expect(byId("a")!.leaves).toBeUndefined();
});

test("a unit that left can be brought back, in one undo step", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", { leaves: S + 3 }), unit("b")]);
  const before = useMapStore.getState().past.length;

  useMapStore.getState().bringBackUnits(["a", "b"]);
  expect(byId("a")!.leaves).toBeUndefined();
  expect("leaves" in byId("a")!).toBe(false);
  expect(useMapStore.getState().past.length).toBe(before + 1);

  // Nothing to bring back: no undo step
  useMapStore.getState().bringBackUnits(["b"]);
  expect(useMapStore.getState().past.length).toBe(before + 1);
});
```

## client/src/store/useAssetStore.ts

```ts
import { create } from "zustand";
import { AssetType, AssetFile } from "../types";
import API_BASE_URL from "../config/api";

interface AssetTypeState {
  files: AssetFile[];
  folders: string[];
}

const emptyState: AssetTypeState = { files: [], folders: [] };

function parsePath(path: string): AssetFile {
  const parts = path.split("/");
  if (parts.length === 2) {
    return { path, filename: parts[1], folder: parts[0] };
  }
  return { path, filename: parts[0], folder: null };
}

interface AssetStore {
  currentProjectName: string | null;
  setCurrentProject: (name: string | null) => void;

  units: AssetTypeState;
  portraits: AssetTypeState;
  maps: AssetTypeState;

  fetchAssetList: (type: AssetType) => Promise<void>;
  createFolder: (assetType: AssetType, name: string) => Promise<void>;
  deleteAsset: (
    path: string,
    assetType: AssetType,
    onDeleted?: (path: string, assetType: AssetType) => void
  ) => Promise<void>;
  renameOrMoveAsset: (
    path: string,
    assetType: AssetType,
    updates: { filename?: string; folder?: string },
    onRenamed?: (oldPath: string, newPath: string, assetType: AssetType) => void
  ) => Promise<void>;

  psds: string[];
  fetchPsdList: () => Promise<void>;
  uploadPsd: (file: File) => Promise<void>;
  deletePsd: (name: string) => Promise<void>;

  portraitSources: string[];
  fetchPortraitSources: () => Promise<void>;
  uploadPortraitSource: (file: File) => Promise<void>;
  deletePortraitSource: (name: string) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  currentProjectName: null,
  setCurrentProject: (name) => set({ currentProjectName: name }),

  units: emptyState,
  portraits: emptyState,
  maps: emptyState,
  psds: [],
  portraitSources: [],

  fetchAssetList: async (type) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${type}`
      );
      const data = await response.json();
      const files: AssetFile[] = (data.files || []).map(parsePath);
      const folders: string[] = data.folders || [];
      set({ [type]: { files, folders } } as Partial<AssetStore>);
    } catch (error) {
      console.error(`Failed to fetch ${type} assets:`, error);
    }
  },

  createFolder: async (assetType, name) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/folder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  },

  deleteAsset: async (path, assetType, onDeleted) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
        onDeleted?.(path, assetType);
      }
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  },

  renameOrMoveAsset: async (path, assetType, updates, onRenamed) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
        onRenamed?.(path, data.path, assetType);
      }
    } catch (error) {
      console.error("Failed to rename/move asset:", error);
    }
  },

  fetchPsdList: async () => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/psd`
      );
      const data = await response.json();
      set({ psds: data.psds || [] });
    } catch (error) {
      console.error("Failed to fetch PSD list:", error);
    }
  },

  uploadPsd: async (file) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/psd/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchPsdList();
      }
    } catch (error) {
      console.error("Failed to upload PSD:", error);
    }
  },

  deletePsd: async (name) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/psd/${name}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchPsdList();
      }
    } catch (error) {
      console.error("Failed to delete PSD:", error);
    }
  },

  fetchPortraitSources: async () => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources`
      );
      const data = await response.json();
      set({ portraitSources: data.sources || [] });
    } catch (error) {
      console.error("Failed to fetch portrait sources:", error);
    }
  },

  uploadPortraitSource: async (file) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchPortraitSources();
      }
    } catch (error) {
      console.error("Failed to upload portrait source:", error);
    }
  },

  deletePortraitSource: async (name) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources/${name}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchPortraitSources();
      }
    } catch (error) {
      console.error("Failed to delete portrait source:", error);
    }
  },
}));
```

## client/src/store/useMapStore.test.ts

```ts
import { useMapStore } from "./useMapStore";
import { Unit } from "../types";

const unit = (id: string): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
});

const line = [
  { x: 0, y: 0 },
  { x: 100, y: 100 },
];

// A path with both units in its formation
function pathWithBothUnits() {
  useMapStore.getState().setPlacedUnits([unit("a"), unit("b")]);
  useMapStore.getState().addPath(line);
  const [path] = useMapStore.getState().paths;
  useMapStore.getState().setPaths([
    {
      ...path,
      assignments: [
        { unitId: "a", forward: 0, right: 0 },
        { unitId: "b", forward: 0, right: 10 },
      ],
    },
  ]);
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("undo and redo move units and paths together", () => {
  useMapStore.getState().setPlacedUnits([unit("a")]);
  useMapStore.getState().addPath(line);
  expect(useMapStore.getState().paths).toHaveLength(1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(useMapStore.getState().placedUnits).toHaveLength(1);

  useMapStore.getState().redo();
  expect(useMapStore.getState().paths).toHaveLength(1);
});

test("deleting a unit removes it from a formation, and undo brings it back", () => {
  pathWithBothUnits();
  useMapStore.getState().selectUnit("a");
  useMapStore.getState().removeSelectedUnits();

  expect(
    useMapStore.getState().paths[0].assignments.map((a) => a.unitId)
  ).toEqual(["b"]);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].assignments).toHaveLength(2);
});

test("deleting an asset removes its units from formations", () => {
  pathWithBothUnits();
  useMapStore.getState().cleanupDeletedAsset("a.png", "units");

  expect(useMapStore.getState().placedUnits.map((u) => u.id)).toEqual(["b"]);
  expect(
    useMapStore.getState().paths[0].assignments.map((a) => a.unitId)
  ).toEqual(["b"]);
});

test("deleting the selected path clears the selection, and undo restores the path", () => {
  const id = useMapStore.getState().addPath(line);
  expect(useMapStore.getState().selectedPathId).toBe(id);

  useMapStore.getState().deletePath(id);
  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(useMapStore.getState().selectedPathId).toBeNull();

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths).toHaveLength(1);
});
```

## client/src/store/useMapStore.ts

```ts
import { create } from "zustand";
import { syncChainedStarts } from "../utils/timeline";
import { syncArmyMarches } from "../utils/armies";
import { MapStore } from "./map/types";
import { createHistorySlice } from "./map/history";
import { createSelectionSlice } from "./map/selectionSlice";
import { createUnitsSlice } from "./map/unitsSlice";
import { createPathsSlice } from "./map/pathsSlice";
import { createArmiesSlice } from "./map/armiesSlice";
import { createStorySlice } from "./map/storySlice";

// The map document store. Each slice in store/map/ owns one part of it; they all share
// one set/get, so any action can read and write the whole document.
export const useMapStore = create<MapStore>((...a) => ({
  ...createHistorySlice(...a),
  ...createSelectionSlice(...a),
  ...createUnitsSlice(...a),
  ...createPathsSlice(...a),
  ...createArmiesSlice(...a),
  ...createStorySlice(...a),
}));

// Keeps the marches consistent with the rest of the document, whatever changed: units joining
// or leaving armies, reshaping or re-dating a march, moving units, undoing, loading a project.
// - Every army march is made up of whoever is in its army when it sets off.
// - Every chained march's start point is where its units arrive.
// Both are derived from the document, so they add no undo steps of their own.
useMapStore.subscribe((state, previous) => {
  if (
    state.paths === previous.paths &&
    state.placedUnits === previous.placedUnits &&
    state.armies === previous.armies
  ) {
    return;
  }
  const withMembers = syncArmyMarches(
    state.paths,
    state.armies,
    state.placedUnits
  );
  const synced = syncChainedStarts(withMembers, state.placedUnits);
  if (synced !== state.paths) useMapStore.setState({ paths: synced });
});

// Development only: lets you poke at the store from the browser console,
// e.g. mapStore.getState().paths
if (process.env.NODE_ENV === "development") {
  (window as unknown as { mapStore?: typeof useMapStore }).mapStore =
    useMapStore;
}
```

## client/src/store/usePathToolStore.test.ts

```ts
import { usePathToolStore } from "./usePathToolStore";
import { useMapStore } from "./useMapStore";

beforeEach(() => {
  useMapStore.getState().resetMapState();
  usePathToolStore.setState({
    drawingPoints: null,
    draftPath: null,
    selectedWaypoint: null,
    playbackSpeed: 1,
  });
});

test("finishing with fewer than two points does nothing", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 0, y: 0 });
  tool.finishDrawing();

  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(usePathToolStore.getState().drawingPoints).toHaveLength(1);
});

test("a repeated click on the same spot is ignored", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 10, y: 10 });
  tool.addDrawingPoint({ x: 10.2, y: 10.1 });

  expect(usePathToolStore.getState().drawingPoints).toHaveLength(1);
});

test("finishing turns the points into a selected path and leaves drawing mode", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 0, y: 0 });
  tool.addDrawingPoint({ x: 100, y: 50 });
  tool.finishDrawing();

  const { paths, selectedPathId } = useMapStore.getState();
  expect(paths).toHaveLength(1);
  expect(paths[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ]);
  expect(selectedPathId).toBe(paths[0].id);
  expect(usePathToolStore.getState().drawingPoints).toBeNull();
});

test("inserting a waypoint puts it in the right place and selects it", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  usePathToolStore.getState().insertWaypoint(id, 0, { x: 50, y: 20 });

  expect(useMapStore.getState().paths[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 50, y: 20 },
    { x: 100, y: 0 },
  ]);
  expect(usePathToolStore.getState().selectedWaypoint).toEqual({
    pathId: id,
    index: 1,
  });
});

test("deleting the selected waypoint works, but a path keeps at least two", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 0 },
  ]);

  usePathToolStore.getState().selectWaypoint(id, 1);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(true);
  expect(useMapStore.getState().paths[0].points).toHaveLength(2);

  usePathToolStore.getState().selectWaypoint(id, 0);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(false);
  expect(useMapStore.getState().paths[0].points).toHaveLength(2);
});

test("a finished drag is a single undo step", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  const stepsBefore = useMapStore.getState().past.length;

  const tool = usePathToolStore.getState();
  tool.setDraftPath({
    id,
    points: [
      { x: 0, y: 0 },
      { x: 120, y: 40 },
    ],
  });
  tool.commitDraftPath();

  expect(useMapStore.getState().paths[0].points[1]).toEqual({ x: 120, y: 40 });
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);
  expect(usePathToolStore.getState().draftPath).toBeNull();

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].points[1]).toEqual({ x: 100, y: 0 });
});

test("preview progress is clamped between 0 and 1 and can be cleared", () => {
  usePathToolStore.getState().setPreview("p", 1.7);
  expect(usePathToolStore.getState().preview).toEqual({
    pathId: "p",
    progress: 1,
  });

  usePathToolStore.getState().setPreview("p", -2);
  expect(usePathToolStore.getState().preview?.progress).toBe(0);

  usePathToolStore.getState().clearPreview();
  expect(usePathToolStore.getState().preview).toBeNull();
});

test("starting to draw ends any preview", () => {
  usePathToolStore.getState().setPreview("p", 0.5);
  usePathToolStore.getState().startDrawing();
  expect(usePathToolStore.getState().preview).toBeNull();
});

test("playback speed defaults to 1x and can be changed", () => {
  expect(usePathToolStore.getState().playbackSpeed).toBe(1);
  usePathToolStore.getState().setPlaybackSpeed(0.5);
  expect(usePathToolStore.getState().playbackSpeed).toBe(0.5);
});
```

## client/src/store/usePathToolStore.ts

```ts
import { create } from "zustand";
import { PathPoint } from "../types";
import { useMapStore } from "./useMapStore";

interface WaypointRef {
  pathId: string;
  index: number;
}

interface DraftPath {
  id: string;
  points: PathPoint[];
}

// Temporary state for drawing and editing paths. It is not part of the document or
// its undo history: changes only enter the map store (and history) when they are finished.
interface PathToolStore {
  // Drawing a new path (null when not drawing)
  drawingPoints: PathPoint[] | null;
  startDrawing: () => void;
  addDrawingPoint: (point: PathPoint) => void;
  removeLastDrawingPoint: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Editing an existing path
  selectedWaypoint: WaypointRef | null;
  draftPath: DraftPath | null; // a path mid-drag, shown before it is committed
  selectWaypoint: (pathId: string, index: number) => void;
  clearWaypoint: () => void;
  setDraftPath: (draft: DraftPath | null) => void;
  commitDraftPath: () => void;
  insertWaypoint: (
    pathId: string,
    segmentIndex: number,
    point: PathPoint
  ) => void;
  deleteSelectedWaypoint: () => boolean;
  // Playback preview (display only: it never touches the document or its history)
  preview: { pathId: string; progress: number } | null;
  setPreview: (pathId: string, progress: number) => void;
  clearPreview: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const DUPLICATE_DISTANCE = 0.5; // map units; a repeated click on the same spot is ignored

export const usePathToolStore = create<PathToolStore>((set, get) => ({
  drawingPoints: null,
  selectedWaypoint: null,
  draftPath: null,
  preview: null,
  playbackSpeed: 1,

  startDrawing: () => {
    useMapStore.getState().selectPath(null);
    useMapStore.getState().selectUnit(null);
    set({
      drawingPoints: [],
      selectedWaypoint: null,
      draftPath: null,
      preview: null,
    });
  },

  addDrawingPoint: (point) => {
    const { drawingPoints } = get();
    if (!drawingPoints) return;
    const last = drawingPoints[drawingPoints.length - 1];
    if (
      last &&
      Math.hypot(point.x - last.x, point.y - last.y) < DUPLICATE_DISTANCE
    )
      return;
    set({ drawingPoints: [...drawingPoints, point] });
  },

  removeLastDrawingPoint: () => {
    const { drawingPoints } = get();
    if (drawingPoints) set({ drawingPoints: drawingPoints.slice(0, -1) });
  },

  finishDrawing: () => {
    const { drawingPoints } = get();
    if (!drawingPoints || drawingPoints.length < 2) return;
    useMapStore.getState().addPath(drawingPoints);
    set({ drawingPoints: null });
  },

  cancelDrawing: () => set({ drawingPoints: null }),

  setPreview: (pathId, progress) =>
    set({ preview: { pathId, progress: Math.min(Math.max(progress, 0), 1) } }),

  clearPreview: () => set({ preview: null }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  selectWaypoint: (pathId, index) => {
    set({ selectedWaypoint: { pathId, index } });
    useMapStore.getState().selectPath(pathId);
    useMapStore.getState().selectUnit(null);
  },

  clearWaypoint: () => set({ selectedWaypoint: null }),

  setDraftPath: (draft) => set({ draftPath: draft }),

  // A finished drag becomes one undo step
  commitDraftPath: () => {
    const { draftPath } = get();
    set({ draftPath: null });
    if (draftPath) {
      useMapStore.getState().updatePathPoints(draftPath.id, draftPath.points);
    }
  },

  insertWaypoint: (pathId, segmentIndex, point) => {
    const path = useMapStore.getState().paths.find((p) => p.id === pathId);
    if (!path) return;
    const points = [...path.points];
    points.splice(segmentIndex + 1, 0, point);
    useMapStore.getState().updatePathPoints(pathId, points);
    get().selectWaypoint(pathId, segmentIndex + 1);
  },

  // Returns whether a waypoint was removed. A path always keeps at least two.
  deleteSelectedWaypoint: () => {
    const { selectedWaypoint } = get();
    if (!selectedWaypoint) return false;
    const path = useMapStore
      .getState()
      .paths.find((p) => p.id === selectedWaypoint.pathId);
    if (
      !path ||
      path.points.length <= 2 ||
      selectedWaypoint.index >= path.points.length
    ) {
      return false;
    }
    // The start of a march is where its units stand, so it can't be removed
    if (selectedWaypoint.index === 0 && path.assignments.length > 0) {
      return false;
    }
    useMapStore.getState().updatePathPoints(
      path.id,
      path.points.filter((_, i) => i !== selectedWaypoint.index)
    );
    set({ selectedWaypoint: null });
    return true;
  },
}));

// A selected waypoint only makes sense while its path is the selected thing:
// clear it when another path or any unit gets selected
useMapStore.subscribe((state) => {
  const waypoint = usePathToolStore.getState().selectedWaypoint;
  if (
    waypoint &&
    (state.selectedPathId !== waypoint.pathId || state.selectedUnitIds.size > 0)
  ) {
    usePathToolStore.setState({ selectedWaypoint: null });
  }
});
```

## client/src/store/useTimelineStore.ts

```ts
import { create } from "zustand";
import { MarchTiming } from "../types";
import { HistoryTime } from "../utils/historyTime";
import { HistoryView } from "../utils/timeline";
import { ROW_FILTERS, RowFilter } from "../utils/timelineRows";

// The rows area's height, in pixels: the ruler and about seven rows to begin with
export const DEFAULT_ROWS_HEIGHT = 228;
export const MIN_ROWS_HEIGHT = 80;
const MAX_ROWS_SHARE = 0.7; // of the window's height

// Between the smallest useful height and most of the window
export const clampRowsHeight = (height: number, windowHeight: number): number =>
  Math.round(
    Math.min(
      Math.max(height, MIN_ROWS_HEIGHT),
      Math.max(MIN_ROWS_HEIGHT, windowHeight * MAX_ROWS_SHARE)
    )
  );

// The row filter and the height are remembered in this browser. Storage can be missing or
// refuse (private windows, blocked site data), so every read and write is guarded.
const FILTER_KEY = "historyMap.timeline.rowFilter";
const HEIGHT_KEY = "historyMap.timeline.rowsHeight";

function remembered(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not remembered; it still applies until the page is reloaded
  }
}

function rememberedFilter(): RowFilter {
  const saved = remembered(FILTER_KEY);
  return ROW_FILTERS.includes(saved as RowFilter)
    ? (saved as RowFilter)
    : "all";
}

function rememberedHeight(): number {
  const saved = Number(remembered(HEIGHT_KEY));
  return Number.isFinite(saved) && saved >= MIN_ROWS_HEIGHT
    ? saved
    : DEFAULT_ROWS_HEIGHT;
}

interface DraftTiming {
  pathId: string;
  timing: MarchTiming;
}

// The playhead and the timeline bar's own state. It is not part of the document: the saved
// parts (each march's dates and the story's start) live in the map store.
interface TimelineStore {
  now: HistoryTime | null; // the playhead, a moment in history; null means the story's start
  playing: boolean;
  pace: number; // days of history played per second
  expanded: boolean;
  draftTiming: DraftTiming | null; // a bar being dragged, shown before it is saved
  view: HistoryView | null; // the stretch of history the bar shows; null fits the whole story
  rowFilter: RowFilter; // which marches are listed
  collapsedGroups: string[]; // the army groups folded away (keys from utils/timelineRows)
  rowsHeight: number; // the rows area's height in pixels; drag the timeline's top edge

  setNow: (now: HistoryTime | null) => void;
  play: () => void;
  pause: () => void;
  setPace: (pace: number) => void;
  setExpanded: (expanded: boolean) => void;
  setDraftTiming: (draft: DraftTiming | null) => void;
  setView: (view: HistoryView | null) => void;
  setRowFilter: (filter: RowFilter) => void;
  toggleGroup: (key: string) => void;
  expandGroup: (key: string) => void;
  setRowsHeight: (height: number) => void; // while dragging; not remembered yet
  saveRowsHeight: () => void; // when the drag ends
  reset: () => void; // for a newly opened project: keeps the filter and the height
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  now: null,
  playing: false,
  pace: 1,
  expanded: true,
  draftTiming: null,
  view: null,
  rowFilter: rememberedFilter(),
  collapsedGroups: [],
  rowsHeight: rememberedHeight(),

  setNow: (now) => set({ now }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setPace: (pace) => set({ pace }),
  setExpanded: (expanded) => set({ expanded }),
  setDraftTiming: (draftTiming) => set({ draftTiming }),
  setView: (view) => set({ view }),
  setRowFilter: (rowFilter) => {
    set({ rowFilter });
    remember(FILTER_KEY, rowFilter);
  },
  toggleGroup: (key) => {
    const collapsed = get().collapsedGroups;
    set({
      collapsedGroups: collapsed.includes(key)
        ? collapsed.filter((k) => k !== key)
        : [...collapsed, key],
    });
  },
  expandGroup: (key) => {
    const collapsed = get().collapsedGroups;
    if (collapsed.includes(key))
      set({ collapsedGroups: collapsed.filter((k) => k !== key) });
  },
  setRowsHeight: (rowsHeight) => set({ rowsHeight }),
  saveRowsHeight: () => remember(HEIGHT_KEY, String(get().rowsHeight)),
  reset: () =>
    set({
      now: null,
      playing: false,
      draftTiming: null,
      view: null,
      collapsedGroups: [],
    }),
}));

// The moment the playhead is at
export const currentMoment = (
  now: HistoryTime | null,
  storyStart: HistoryTime
): HistoryTime => now ?? storyStart;

// Whether the playhead is past the story's start. Placed units can only be edited at the
// start, because anywhere later they are shown where their marches have taken them.
export const isPastStart = (
  now: HistoryTime | null,
  storyStart: HistoryTime
): boolean => now !== null && now > storyStart;
```

## client/src/types/index.ts

```ts
export type AssetType = "units" | "portraits" | "maps";

export type TravelMode = "rotate" | "upright" | "fixed";

export interface Unit {
  id: string;
  filename: string;
  path: string;
  assetType: AssetType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipped?: boolean;
  // Direction the unit's artwork faces, in degrees (0 = right, 90 = down, -90 = up),
  // before mirroring. Defaults to -90 (up) when not set.
  forwardAngle?: number;
  // How the unit behaves travelling along a path: "rotate" turns to face travel,
  // "upright" never rotates and mirrors left/right instead (ships, portraits),
  // "fixed" never turns or mirrors. Defaults: units rotate, portraits stay upright.
  travelMode?: TravelMode;
  // When the unit exists in history (days since 1 January 1970, see utils/historyTime).
  // Missing means it is there from the start of the story, and never leaves.
  appears?: number;
  leaves?: number;
}

// A unit's time in an army: from `joins` until `leaves` (days since 1 January 1970, see
// utils/historyTime). Missing `joins` means from the start; missing `leaves` means for good.
export interface ArmyMember {
  unitId: string;
  joins?: number;
  leaves?: number;
}

// A named group of units. A unit is in at most one army at any moment, and marches can
// belong to an army.
export interface Army {
  id: string;
  name: string;
  members: ArmyMember[];
}

// When a march happens in history (days since 1 January 1970, see utils/historyTime).
// The first `turn` days are spent turning on the spot, the rest travelling.
export interface MarchTiming {
  start: number;
  end: number;
  turn: number;
}

// A moment on the video paired with a moment in history. Kept from the date markers of
// older projects, ready to become the first shot.
export interface PacingKey {
  seconds: number;
  time: number;
}

// How the date reads: "October 1066", "14 October 1066", or with the time of day too
export type HistoryDisplay = "months" | "days" | "times";

// The project file version this app writes. Version 1 (no version field) timed marches in
// seconds on the video; version 2 dates them in history; version 3 lets army membership
// decide who is on an army's march.
export const PROJECT_VERSION = 3;

export interface ProjectData {
  name: string;
  version?: number;
  units: Unit[];
  paths?: MapPath[];
  armies?: Army[];
  storyStart?: number;
  displayMode?: HistoryDisplay;
  pacing?: PacingKey[];
  selectedMapFilename?: string | null;
  viewport?: SavedViewport | null;
}

export type ToolbarTabId = "assets" | "psd" | "portrait" | "paths" | "armies";

export interface AssetFile {
  path: string;
  filename: string;
  folder: string | null;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface PsdLayer {
  index: number;
  name: string;
  filename: string;
}

export interface RecolourSpec {
  interior: RgbColor;
  border: RgbColor;
  fill: RgbColor;
  stroke: RgbColor;
}

// The map point at the centre of the screen plus the zoom level,
// so a saved view restores correctly on any window size
export interface SavedViewport {
  centerX: number;
  centerY: number;
  scale: number;
}

// How ProjectView reads and applies the map's current view
export interface ViewportApi {
  get: () => SavedViewport | null;
  apply: (viewport: SavedViewport) => void;
}

export interface PathPoint {
  x: number;
  y: number;
}

// A unit's place in a path's formation, measured from the formation's centre
// along and across the direction of travel, so the formation turns with the path
export interface PathAssignment {
  unitId: string;
  forward: number;
  right: number;
}

export interface MapPath {
  id: string;
  name: string;
  points: PathPoint[];
  assignments: PathAssignment[];
  // The way the group attached to this path faces at rest, in degrees (0 = right, 90 = down,
  // -90 = up). Formation slots are measured against it, so the formation keeps its shape
  // whichever way the route leaves. Missing on older paths, which use the start heading.
  direction?: number;
  // When this path's march happens in history. Set when units are attached.
  march?: MarchTiming;
  // The army this march belongs to, if any
  armyId?: string;
}

// From version 1 project files only: how the date was shown, and the date markers that
// paired seconds on the video with dates. They are converted when the project loads.
export type DateMode = "months" | "days";

export interface DateMarker {
  id: string;
  time: number; // seconds on the video's timeline
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}
```

## client/src/utils/armies.test.ts

```ts
import { Army, MapPath } from "../types";
import { toHistoryTime } from "./historyTime";
import {
  armyForAttach,
  armyOfUnitAt,
  deriveArmies,
  everMembers,
  forgetUnits,
  joinArmy,
  leaveArmy,
  membersAt,
  nextArmyName,
} from "./armies";

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });

const army = (id: string, members: Army["members"], name = id): Army => ({
  id,
  name,
  members,
});

const path = (id: string, unitIds: string[]): MapPath => ({
  id,
  name: id,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
  assignments: unitIds.map((unitId) => ({ unitId, forward: 0, right: 0 })),
});

test("an army's members are the units whose membership is in force at a moment", () => {
  const a = army("a", [
    { unitId: "u1" },
    { unitId: "u2", joins: S + 3 },
    { unitId: "u3", leaves: S + 5 },
  ]);

  expect(membersAt(a, S)).toEqual(["u1", "u3"]);
  expect(membersAt(a, S + 4)).toEqual(["u1", "u2", "u3"]);
  expect(membersAt(a, S + 5)).toEqual(["u1", "u2"]);
  expect(everMembers(a)).toEqual(["u1", "u2", "u3"]);
  expect(armyOfUnitAt([a], "u2", S)).toBeUndefined();
  expect(armyOfUnitAt([a], "u2", S + 3)?.id).toBe("a");
});

test("armies are named Army 1, Army 2... after the highest number used", () => {
  expect(nextArmyName([])).toBe("Army 1");
  expect(
    nextArmyName([army("x", [], "Army 4"), army("y", [], "Normans")])
  ).toBe("Army 5");
});

test("joining at a moment leaves the unit's other army then", () => {
  const armies = [army("a", [{ unitId: "u1" }]), army("b", [])];
  const next = joinArmy(armies, "b", ["u1"], S + 2);

  expect(next[0].members).toEqual([{ unitId: "u1", leaves: S + 2 }]);
  expect(next[1].members).toEqual([{ unitId: "u1", joins: S + 2 }]);
  expect(armyOfUnitAt(next, "u1", S + 1)?.id).toBe("a");
  expect(armyOfUnitAt(next, "u1", S + 2)?.id).toBe("b");

  // Already a member: nothing changes
  expect(joinArmy(next, "b", ["u1"], S + 3)).toEqual(next);
});

test("joining at the story's start moves the unit outright", () => {
  const armies = [army("a", [{ unitId: "u1" }]), army("b", [])];
  const next = joinArmy(armies, "b", ["u1"], undefined);
  expect(next[0].members).toEqual([]);
  expect(next[1].members).toEqual([{ unitId: "u1" }]);
});

test("leaving ends a membership then, or removes it if it began at that moment", () => {
  const armies = [
    army("a", [{ unitId: "u1" }, { unitId: "u2", joins: S + 4 }]),
  ];

  expect(leaveArmy(armies, "a", ["u1"], S + 6)[0].members[0]).toEqual({
    unitId: "u1",
    leaves: S + 6,
  });
  expect(leaveArmy(armies, "a", ["u2"], S + 4)[0].members).toEqual([
    { unitId: "u1" },
  ]);
  expect(leaveArmy(armies, "a", ["u1"], undefined)[0].members).toEqual([
    { unitId: "u2", joins: S + 4 },
  ]);
  // Not a member at that moment: nothing to end
  expect(leaveArmy(armies, "a", ["u2"], S + 1)).toEqual(armies);
});

test("units deleted from the project are forgotten by every army", () => {
  const armies = [
    army("a", [{ unitId: "u1" }, { unitId: "u2" }]),
    army("b", [{ unitId: "u3" }]),
  ];
  const next = forgetUnits(armies, new Set(["u2"]));
  expect(next[0].members).toEqual([{ unitId: "u1" }]);
  expect(next[1]).toBe(armies[1]);
});

test("attaching units picks their army, makes a new one, or none for a mix", () => {
  const armies = [army("a", [{ unitId: "u1" }, { unitId: "u2" }])];

  expect(armyForAttach(armies, ["u1", "u2"], S + 1)).toEqual({
    armies,
    armyId: "a",
  });

  const fresh = armyForAttach(armies, ["u3", "u4"], S + 2);
  expect(fresh.armies).toHaveLength(2);
  expect(fresh.armies[1].name).toBe("Army 1");
  expect(fresh.armies[1].members).toEqual([
    { unitId: "u3", joins: S + 2 },
    { unitId: "u4", joins: S + 2 },
  ]);
  expect(fresh.armyId).toBe(fresh.armies[1].id);

  expect(armyForAttach(armies, ["u1", "u3"], S + 1)).toEqual({
    armies,
    armyId: undefined,
  });
});

test("an older project's units that share marches become one army each", () => {
  const paths = [
    path("p1", ["a", "b"]),
    path("p2", ["b", "c"]),
    path("p3", ["d"]),
    path("empty", []),
  ];
  const derived = deriveArmies(paths, S);

  expect(derived.armies.map((a) => a.name)).toEqual(["Army 1", "Army 2"]);
  expect(derived.armies[0].members.map((m) => m.unitId)).toEqual([
    "a",
    "b",
    "c",
  ]);
  expect(derived.armies[1].members.map((m) => m.unitId)).toEqual(["d"]);
  expect(derived.paths.map((p) => p.armyId)).toEqual([
    derived.armies[0].id,
    derived.armies[0].id,
    derived.armies[1].id,
    undefined,
  ]);
});
```

## client/src/utils/armies.ts

```ts
import { Army, ArmyMember, MapPath, PathAssignment, Unit } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";
import { existsAt, validMarch } from "./timeline";

// Two moments closer than this count as the same moment
const SAME_MOMENT = MINUTE / 2;

// Moments are passed as `at`: a moment in history, or undefined for the story's start.
// Memberships store the same way: a missing `joins` means from the start.
const momentOf = (at: HistoryTime | undefined) => at ?? -Infinity;

const sameMoment = (a: HistoryTime | undefined, b: HistoryTime | undefined) =>
  a === undefined || b === undefined ? a === b : Math.abs(a - b) < SAME_MOMENT;

// Whether a membership is in force at a moment
export function memberAt(member: ArmyMember, t: HistoryTime): boolean {
  return (member.joins ?? -Infinity) <= t && t < (member.leaves ?? Infinity);
}

// The units in an army at a moment, in the order they joined the list
export function membersAt(army: Army, t: HistoryTime): string[] {
  const ids: string[] = [];
  for (const member of army.members) {
    if (memberAt(member, t) && !ids.includes(member.unitId))
      ids.push(member.unitId);
  }
  return ids;
}

// Every unit that is ever in an army
export function everMembers(army: Army): string[] {
  return Array.from(new Set(army.members.map((member) => member.unitId)));
}

// The army a unit is in at a moment, if any
export function armyOfUnitAt(
  armies: Army[],
  unitId: string,
  t: HistoryTime
): Army | undefined {
  return armies.find((army) =>
    army.members.some(
      (member) => member.unitId === unitId && memberAt(member, t)
    )
  );
}

export function nextArmyName(armies: Army[]): string {
  const used = armies
    .map((army) => /^Army (\d+)$/.exec(army.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Army ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

export const newArmyId = () =>
  `army-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Ends a membership at a moment. One that began at that same moment never really happened,
// so it is removed rather than left with no length.
function endAt(
  member: ArmyMember,
  at: HistoryTime | undefined
): ArmyMember | null {
  if (at === undefined || sameMoment(member.joins, at)) return null;
  return { ...member, leaves: at };
}

// Units leave an army at a moment (undefined: the story's start, so they were never in it then)
export function leaveArmy(
  armies: Army[],
  armyId: string,
  unitIds: string[],
  at: HistoryTime | undefined
): Army[] {
  const ids = new Set(unitIds);
  const t = momentOf(at);
  return armies.map((army) => {
    if (army.id !== armyId) return army;
    const members: ArmyMember[] = [];
    for (const member of army.members) {
      if (!ids.has(member.unitId) || !memberAt(member, t)) {
        members.push(member);
        continue;
      }
      const ended = endAt(member, at);
      if (ended) members.push(ended);
    }
    return { ...army, members };
  });
}

// Units join an army at a moment. A unit is in one army at a time, so any army it is in at
// that moment it leaves then. Units already in this army are left as they are.
export function joinArmy(
  armies: Army[],
  armyId: string,
  unitIds: string[],
  at: HistoryTime | undefined
): Army[] {
  const t = momentOf(at);
  let next = armies;
  for (const army of armies) {
    if (army.id === armyId) continue;
    const leaving = unitIds.filter((id) =>
      army.members.some((member) => member.unitId === id && memberAt(member, t))
    );
    if (leaving.length > 0) next = leaveArmy(next, army.id, leaving, at);
  }

  return next.map((army) => {
    if (army.id !== armyId) return army;
    const already = new Set(membersAt(army, t));
    const joining = unitIds
      .filter((id) => !already.has(id))
      .map(
        (unitId): ArmyMember =>
          at === undefined ? { unitId } : { unitId, joins: at }
      );
    return joining.length > 0
      ? { ...army, members: [...army.members, ...joining] }
      : army;
  });
}

// Forgets units entirely (they were deleted from the project)
export function forgetUnits(
  armies: Army[],
  unitIds: ReadonlySet<string>
): Army[] {
  if (unitIds.size === 0) return armies;
  return armies.map((army) =>
    army.members.some((member) => unitIds.has(member.unitId))
      ? {
          ...army,
          members: army.members.filter((member) => !unitIds.has(member.unitId)),
        }
      : army
  );
}

// The army a march for these units belongs to when they are attached to a path at a moment:
// - all of them are in the same army then: that army
// - none of them is in any army: a new army of just them, named automatically
// - a mix: no army (it stays a plain march)
export function armyForAttach(
  armies: Army[],
  unitIds: string[],
  at: HistoryTime | undefined
): { armies: Army[]; armyId: string | undefined } {
  const t = momentOf(at);
  const owners = unitIds.map((id) => armyOfUnitAt(armies, id, t)?.id);

  if (
    owners.length > 0 &&
    owners[0] !== undefined &&
    owners.every((id) => id === owners[0])
  ) {
    return { armies, armyId: owners[0] };
  }
  if (owners.length > 0 && owners.every((id) => id === undefined)) {
    const army: Army = {
      id: newArmyId(),
      name: nextArmyName(armies),
      members: unitIds.map((unitId) =>
        at === undefined ? { unitId } : { unitId, joins: at }
      ),
    };
    return { armies: [...armies, army], armyId: army.id };
  }
  return { armies, armyId: undefined };
}

// Memberships that reproduce exactly who was on each of an army's dated marches. Membership
// only matters when a march sets off, so a unit is a member from the start of the first march
// it is on until the start of the next march of the army that it isn't on. Marches that set
// off together count as one. Units only on undated marches are members from the start.
function membershipsFromMarches(
  armyId: string,
  paths: MapPath[],
  storyStart: HistoryTime
): ArmyMember[] {
  const own = paths.filter(
    (p) => p.armyId === armyId && p.assignments.length > 0
  );
  const dated = own
    .map((path) => ({ path, march: validMarch(path.march) }))
    .filter(
      (
        m
      ): m is {
        path: MapPath;
        march: NonNullable<ReturnType<typeof validMarch>>;
      } => m.march !== undefined
    )
    .sort((a, b) => a.march.start - b.march.start);

  // Marches that set off at the same moment, as one group each
  const groups: { start: HistoryTime; unitIds: Set<string> }[] = [];
  for (const { path, march } of dated) {
    const last = groups[groups.length - 1];
    const ids = path.assignments.map((a) => a.unitId);
    if (last && Math.abs(last.start - march.start) < SAME_MOMENT) {
      ids.forEach((id) => last.unitIds.add(id));
    } else {
      groups.push({ start: march.start, unitIds: new Set(ids) });
    }
  }

  const order: string[] = [];
  for (const path of own) {
    for (const { unitId } of path.assignments)
      if (!order.includes(unitId)) order.push(unitId);
  }

  const members: ArmyMember[] = [];
  for (const unitId of order) {
    let open: ArmyMember | null = null;
    let onAny = false;
    for (const group of groups) {
      if (group.unitIds.has(unitId)) {
        onAny = true;
        if (!open) {
          open = { unitId };
          if (group.start > storyStart) open.joins = group.start;
        }
      } else if (open) {
        members.push({ ...open, leaves: group.start });
        open = null;
      }
    }
    if (open) members.push(open);
    if (!onAny) members.push({ unitId }); // only on undated marches
  }
  return members;
}

// Rebuilds each army's memberships from its marches, so that every march keeps exactly the
// units it had. Units in an army that are on none of its marches keep their memberships.
export function rebuildMemberships(
  armies: Army[],
  paths: MapPath[],
  storyStart: HistoryTime
): Army[] {
  return armies.map((army) => {
    const derived = membershipsFromMarches(army.id, paths, storyStart);
    if (derived.length === 0) return army;
    const onMarches = new Set(derived.map((m) => m.unitId));
    const others = army.members.filter((m) => !onMarches.has(m.unitId));
    return { ...army, members: [...derived, ...others] };
  });
}

// Armies for a project that has none yet: units that share marches become one army, named
// Army 1, Army 2... in the order their first march appears, and those marches belong to it.
// Memberships are dated so that every march keeps exactly the units it had.
export function deriveArmies(
  paths: MapPath[],
  storyStart: HistoryTime
): { armies: Army[]; paths: MapPath[] } {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  for (const path of paths) {
    const ids = path.assignments.map((a) => a.unitId);
    ids.forEach((id) => {
      if (!parent.has(id)) parent.set(id, id);
    });
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  const armyByRoot = new Map<string, Army>();
  const armies: Army[] = [];
  const nextPaths = paths.map((path) => {
    if (path.assignments.length === 0) return path;
    const root = find(path.assignments[0].unitId);
    let army = armyByRoot.get(root);
    if (!army) {
      army = {
        id: `army-${armies.length + 1}-${root}`,
        name: `Army ${armies.length + 1}`,
        members: [],
      };
      armyByRoot.set(root, army);
      armies.push(army);
    }
    return { ...path, armyId: army.id };
  });

  return {
    armies: rebuildMemberships(armies, nextPaths, storyStart),
    paths: nextPaths,
  };
}

const sameUnits = (a: PathAssignment[], ids: string[]) =>
  a.length === ids.length &&
  ids.every((id) => a.some((slot) => slot.unitId === id));

// Keeps every army march made up of whoever is in its army, and on the map, when it sets off.
// Units that stay keep their places; units that join get a place that the timeline measures
// from where they stand when the march begins. Returns the same array when nothing changed.
export function syncArmyMarches(
  paths: MapPath[],
  armies: Army[],
  units: Unit[]
): MapPath[] {
  if (armies.length === 0) return paths;
  const armyById = new Map(
    armies.map((army): [string, Army] => [army.id, army])
  );
  const unitById = new Map(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );

  let changed = false;
  const next = paths.map((path) => {
    const army = path.armyId ? armyById.get(path.armyId) : undefined;
    const march = validMarch(path.march);
    if (!army || !march) return path;

    const ids = membersAt(army, march.start).filter((id) => {
      const unit = unitById.get(id);
      return unit !== undefined && existsAt(unit, march.start);
    });
    if (sameUnits(path.assignments, ids)) return path;

    changed = true;
    return {
      ...path,
      assignments: ids.map(
        (unitId) =>
          path.assignments.find((slot) => slot.unitId === unitId) ?? {
            unitId,
            forward: 0,
            right: 0,
          }
      ),
    };
  });
  return changed ? next : paths;
}
```

## client/src/utils/chevrons.test.ts

```ts
import { chevronsAlong } from "./pathGeometry";

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

test("chevrons are spread evenly along the path, away from the ends", () => {
  const chevrons = chevronsAlong(straight, 30);
  expect(chevrons).toHaveLength(3);
  expect(chevrons[0].x).toBeCloseTo(100 / 6, 3);
  expect(chevrons[1].x).toBeCloseTo(50, 3);
  expect(chevrons[2].x).toBeCloseTo(500 / 6, 3);
  chevrons.forEach((chevron) => expect(chevron.heading).toBeCloseTo(0, 5));
});

test("a path shorter than the spacing still gets one chevron in the middle", () => {
  const chevrons = chevronsAlong(straight, 500);
  expect(chevrons).toHaveLength(1);
  expect(chevrons[0].x).toBeCloseTo(50, 3);
});

test("the number of chevrons is capped", () => {
  const long = [
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ];
  expect(chevronsAlong(long, 1, 10)).toHaveLength(10);
});

test("there are no chevrons without a curve", () => {
  expect(chevronsAlong([{ x: 0, y: 0 }], 10)).toEqual([]);
});
```

## client/src/utils/convertArmies.test.ts

```ts
import { parseProject } from "./convertProject";
import { toHistoryTime } from "./historyTime";

const path = (id: string, unitIds: string[], extra: object = {}) => ({
  id,
  name: id,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
  assignments: unitIds.map((unitId) => ({ unitId, forward: 0, right: 0 })),
  ...extra,
});

test("a project saved before armies gets one army per group of units that march together", () => {
  const project = parseProject({
    version: 2,
    units: [],
    paths: [path("p1", ["a", "b"]), path("p2", ["b"]), path("p3", ["c"])],
  });

  expect(project.armies.map((a) => a.name)).toEqual(["Army 1", "Army 2"]);
  expect(project.armies[0].members).toEqual([{ unitId: "a" }, { unitId: "b" }]);
  expect(project.paths.map((p) => p.armyId)).toEqual([
    project.armies[0].id,
    project.armies[0].id,
    project.armies[1].id,
  ]);
});

test("saved armies are read as they are, and a march's missing army is dropped", () => {
  const project = parseProject({
    version: 3,
    units: [],
    paths: [
      path("p1", ["a"], { armyId: "x" }),
      path("p2", ["b"], { armyId: "gone" }),
    ],
    armies: [
      {
        id: "x",
        name: "Normans",
        members: [{ unitId: "a", joins: 5, leaves: "soon" }, { nope: true }],
      },
      { name: "no id" },
    ],
  });

  expect(project.armies).toEqual([
    { id: "x", name: "Normans", members: [{ unitId: "a", joins: 5 }] },
  ]);
  expect(project.paths[0].armyId).toBe("x");
  expect(project.paths[1].armyId).toBeUndefined();
});

test("an empty list of armies is kept empty, not re-derived", () => {
  const project = parseProject({
    version: 3,
    units: [],
    paths: [path("p1", ["a"])],
    armies: [],
  });
  expect(project.armies).toEqual([]);
  expect(project.paths[0].armyId).toBeUndefined();
});

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });
const dated = (start: number, end: number) => ({
  march: { start, end, turn: 0 },
});

test("armies saved before membership decided marches are rebuilt so every march keeps its units", () => {
  const project = parseProject({
    version: 2,
    storyStart: S,
    units: [],
    paths: [
      path("first", ["a", "b"], { armyId: "x", ...dated(S, S + 5) }),
      path("second", ["a", "c"], { armyId: "x", ...dated(S + 5, S + 9) }),
    ],
    armies: [
      {
        id: "x",
        name: "Normans",
        members: [
          { unitId: "a" },
          { unitId: "b" },
          { unitId: "c" },
          { unitId: "spare" },
        ],
      },
    ],
  });

  expect(project.armies[0].name).toBe("Normans");
  expect(project.armies[0].members).toEqual([
    { unitId: "a" }, // on both marches, from the start
    { unitId: "b", leaves: S + 5 }, // only on the first
    { unitId: "c", joins: S + 5 }, // only on the second
    { unitId: "spare" }, // on no march: kept as it was
  ]);
});

test("a project saved before armies gets dated memberships matching its marches", () => {
  const project = parseProject({
    version: 2,
    storyStart: S,
    units: [],
    paths: [
      path("first", ["a", "b"], dated(S + 1, S + 5)),
      path("second", ["a"], dated(S + 5, S + 9)),
      path("third", ["a", "b"], dated(S + 9, S + 12)),
    ],
  });

  expect(project.armies).toHaveLength(1);
  expect(project.armies[0].members).toEqual([
    { unitId: "a", joins: S + 1 },
    { unitId: "b", joins: S + 1, leaves: S + 5 },
    { unitId: "b", joins: S + 9 },
  ]);
});
```

## client/src/utils/convertProject.test.ts

```ts
import { MapPath, PathPoint, Unit } from "../types";
import {
  DEFAULT_STORY_START,
  emptyProject,
  legacyClock,
  pacingFromMarkers,
  parseProject,
} from "./convertProject";
import { attachUnits } from "./formation";
import { toHistoryTime } from "./historyTime";
import { createPlayback } from "./pathPlayback";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

const east = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];

// A path as a version 1 file stored it: timed in seconds on the video
function legacyPath(
  id: string,
  points: PathPoint[],
  units: Unit[],
  start?: number,
  end?: number
) {
  const attachment = attachUnits(
    { id, name: id, points, assignments: [] },
    units
  )!;
  return { id, name: id, ...attachment, start, end };
}

const day = (year: number, month: number, d: number) =>
  toHistoryTime({ year, month, day: d });

test("with no date markers, a second becomes a day from 1 January 1066", () => {
  const units = [unit("a", 0, 0)];
  const project = parseProject({
    units,
    paths: [legacyPath("p", east, units, 2, 13.5)],
  });

  expect(project.storyStart).toBe(DEFAULT_STORY_START);
  expect(project.storyStart).toBe(day(1066, 1, 1));
  const march = project.paths[0].march!;
  expect(march.start).toBeCloseTo(DEFAULT_STORY_START + 2, 9);
  expect(march.end).toBeCloseTo(DEFAULT_STORY_START + 13.5, 9);
  // The turn keeps its share of the bar: 150 of a 1150 run
  expect(march.turn).toBeCloseTo(11.5 * (150 / 1150), 3);
  expect(
    (project.paths[0] as MapPath & { start?: number }).start
  ).toBeUndefined();
});

test("between date markers the seconds run straight from one date to the next, and carry on beyond them", () => {
  const keys = pacingFromMarkers([
    { id: "b", time: 10, year: 1066, month: 10, day: 1 },
    { id: "a", time: 0, year: 1066, month: 9, day: 1 },
  ]);
  expect(keys.map((k) => k.seconds)).toEqual([0, 10]);

  const clock = legacyClock(keys);
  expect(clock(0)).toBe(day(1066, 9, 1));
  expect(clock(5)).toBeCloseTo(day(1066, 9, 16), 9); // 30 days over 10 seconds
  expect(clock(10)).toBe(day(1066, 10, 1));
  expect(clock(20)).toBeCloseTo(day(1066, 10, 31), 9);

  // One marker: a second is a day, either side of it
  const one = legacyClock(
    pacingFromMarkers([{ id: "a", time: 4, year: 1066, month: 10, day: 14 }])
  );
  expect(one(0)).toBe(day(1066, 10, 10));
});

test("an old march with no end set lasts as long as it did before", () => {
  const units = [unit("a", 0, 0)];
  const path = legacyPath("p", east, units);
  const project = parseProject({ units, paths: [path] });
  const length = createPlayback(path, units).length;

  expect(project.paths[0].march!.start).toBe(DEFAULT_STORY_START);
  expect(project.paths[0].march!.end - DEFAULT_STORY_START).toBeCloseTo(
    Math.round((length / 100) * 10) / 10,
    9
  );
});

test("an old project keeps its markers as pacing, its display mode, and starts where 0:00 was", () => {
  const units = [unit("a", 0, 0)];
  const project = parseProject({
    units,
    paths: [legacyPath("p", east, units, 0, 10)],
    dateMarkers: [
      { id: "a", time: 0, year: 1066, month: 9, day: 20 },
      { id: "b", time: 10, year: 1066, month: 9, day: 25 },
      { id: "bad", time: "x", year: 1066, month: 1, day: 1 },
    ],
    dateMode: "days",
  });

  expect(project.storyStart).toBe(day(1066, 9, 20));
  expect(project.displayMode).toBe("days");
  expect(project.pacing).toEqual([
    { seconds: 0, time: day(1066, 9, 20) },
    { seconds: 10, time: day(1066, 9, 25) },
  ]);
  expect(project.paths[0].march!.end).toBe(day(1066, 9, 25));
});

test("paths with no units are not dated", () => {
  const project = parseProject({
    units: [],
    paths: [{ id: "p", name: "p", points: east, assignments: [], start: 3 }],
  });
  expect(project.paths[0].march).toBeUndefined();
});

test("a version 2 project is read as it is", () => {
  const march = { start: day(1066, 9, 20), end: day(1066, 9, 25), turn: 0.5 };
  const project = parseProject({
    version: 2,
    units: [{ ...unit("a", 0, 0), appears: day(1066, 9, 1), leaves: "soon" }],
    paths: [{ id: "p", name: "p", points: east, assignments: [], march }],
    storyStart: day(1066, 9, 1),
    displayMode: "times",
    pacing: [
      { seconds: 0, time: 1 },
      { seconds: "x", time: 2 },
    ],
    selectedMapFilename: "england.svg",
    viewport: { centerX: 1, centerY: 2, scale: 3 },
  });

  expect(project.paths[0].march).toEqual(march);
  expect(project.storyStart).toBe(day(1066, 9, 1));
  expect(project.displayMode).toBe("times");
  expect(project.pacing).toEqual([{ seconds: 0, time: 1 }]);
  expect(project.units[0].appears).toBe(day(1066, 9, 1));
  expect(project.units[0].leaves).toBeUndefined();
  expect(project.selectedMapFilename).toBe("england.svg");
  expect(project.viewport).toEqual({ centerX: 1, centerY: 2, scale: 3 });

  expect(
    parseProject({ version: 2, units: [], displayMode: "weeks" }).displayMode
  ).toBe("months");
});

test("anything unreadable loads as an empty project", () => {
  expect(parseProject(null)).toEqual(emptyProject());
  expect(parseProject("nonsense")).toEqual(emptyProject());
});
```

## client/src/utils/convertProject.ts

```ts
import {
  Army,
  ArmyMember,
  DateMarker,
  HistoryDisplay,
  MapPath,
  MarchTiming,
  PacingKey,
  SavedViewport,
  Unit,
} from "../types";
import { clampDate, daysFromCivil } from "./dates";
import { HistoryTime, toHistoryTime } from "./historyTime";
import { clampMarch } from "./marches";
import { createPlayback } from "./pathPlayback";
import { deriveArmies, rebuildMemberships } from "./armies";

// Where a new project's story starts
export const DEFAULT_STORY_START = toHistoryTime({
  year: 1066,
  month: 1,
  day: 1,
});

// How version 1 projects timed a march with no end set: 100 map units per second, to the
// nearest tenth of a second, and never under half a second
const LEGACY_PACE = 100;
const LEGACY_MIN_SECONDS = 0.5;

export interface LoadedProject {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[];
  selectedMapFilename: string | null;
  viewport: SavedViewport | null;
}

export function emptyProject(): LoadedProject {
  return {
    units: [],
    paths: [],
    armies: [],
    storyStart: DEFAULT_STORY_START,
    displayMode: "months",
    pacing: [],
    selectedMapFilename: null,
    viewport: null,
  };
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const DISPLAYS: HistoryDisplay[] = ["months", "days", "times"];

// ---- Version 1: seconds on the video, with date markers ----

// The date markers of a version 1 project as pairs of seconds and history, in order. Two
// markers at the same second keep the first.
export function pacingFromMarkers(markers: DateMarker[]): PacingKey[] {
  const keys: PacingKey[] = [];
  [...markers]
    .sort((a, b) => a.time - b.time)
    .forEach((m) => {
      if (keys.length > 0 && keys[keys.length - 1].seconds === m.time) return;
      keys.push({ seconds: m.time, time: daysFromCivil(clampDate(m)) });
    });
  return keys;
}

// Turns seconds on a version 1 video timeline into history. Between markers it runs straight
// from one marker's date to the next. Beyond the first and last it carries on at the pace of
// the nearest stretch. With one marker, or none, a second is a day (from 1 January 1066 when
// there are none).
export function legacyClock(
  keys: PacingKey[]
): (seconds: number) => HistoryTime {
  if (keys.length === 0) return (seconds) => DEFAULT_STORY_START + seconds;
  if (keys.length === 1)
    return (seconds) => keys[0].time + (seconds - keys[0].seconds);

  return (seconds) => {
    let i = 0;
    while (i < keys.length - 2 && seconds > keys[i + 1].seconds) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const rate = (b.time - a.time) / (b.seconds - a.seconds);
    return a.time + (seconds - a.seconds) * rate;
  };
}

interface LegacyPath extends MapPath {
  start?: number; // seconds
  end?: number; // seconds
}

// Dates every version 1 march. Each is shown exactly as before: it starts and ends at the
// dates its bar's ends were at, and turns for the same share of the march.
export function convertLegacyPaths(
  paths: LegacyPath[],
  units: Unit[],
  keys: PacingKey[]
): MapPath[] {
  const clock = legacyClock(keys);

  return paths.map(({ start, end, ...path }) => {
    if (path.assignments.length === 0 || path.points.length < 2) return path;

    const playback = createPlayback(path, units);
    const startSeconds = Math.max(isNumber(start) ? start : 0, 0);
    const defaultEnd =
      startSeconds +
      Math.max(
        Math.round((playback.length / LEGACY_PACE) * 10) / 10,
        LEGACY_MIN_SECONDS
      );
    const endSeconds = Math.max(
      isNumber(end) ? end : defaultEnd,
      startSeconds + LEGACY_MIN_SECONDS
    );
    const share =
      playback.length > 0 ? playback.pivotLength / playback.length : 0;

    const from = clock(startSeconds);
    const turnEnd = clock(startSeconds + (endSeconds - startSeconds) * share);
    const to = clock(endSeconds);
    return {
      ...path,
      march: clampMarch({ start: from, end: to, turn: turnEnd - from }),
    };
  });
}

// ---- Reading a project file ----

function parseMarch(raw: unknown): MarchTiming | undefined {
  const m = raw as Partial<MarchTiming> | null | undefined;
  if (!m || !isNumber(m.start) || !isNumber(m.end)) return undefined;
  return clampMarch({
    start: m.start,
    end: m.end,
    turn: isNumber(m.turn) ? m.turn : 0,
  });
}

function parsePath(raw: any): LegacyPath {
  return {
    id: raw.id,
    name: raw.name,
    points: Array.isArray(raw.points) ? raw.points : [],
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
    direction: isNumber(raw.direction) ? raw.direction : undefined,
    march: parseMarch(raw.march),
    armyId: typeof raw.armyId === "string" ? raw.armyId : undefined,
    start: isNumber(raw.start) ? raw.start : undefined,
    end: isNumber(raw.end) ? raw.end : undefined,
  };
}

function parseArmies(raw: unknown): Army[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a: any) => a && typeof a.id === "string")
    .map((a: any) => ({
      id: a.id,
      name: typeof a.name === "string" && a.name.trim() ? a.name : "Army",
      members: Array.isArray(a.members)
        ? a.members
            .filter((m: any) => m && typeof m.unitId === "string")
            .map((m: any) => {
              const member: ArmyMember = { unitId: m.unitId };
              if (isNumber(m.joins)) member.joins = m.joins;
              if (isNumber(m.leaves)) member.leaves = m.leaves;
              return member;
            })
        : [],
    }));
}

// Gives a project its armies.
// - Saved before armies: units that share marches become one army each.
// - Saved with armies before version 3, when membership didn't yet decide who marches: each
//   army's memberships are rebuilt from its marches, so every march keeps exactly its units.
// - Version 3 and later: read as they are.
// Marches that point at an army that doesn't exist no longer belong to one.
function withArmies(
  project: Omit<LoadedProject, "armies">,
  rawArmies: unknown,
  version: number
): LoadedProject {
  if (!Array.isArray(rawArmies)) {
    const derived = deriveArmies(project.paths, project.storyStart);
    return { ...project, paths: derived.paths, armies: derived.armies };
  }

  const parsed = parseArmies(rawArmies);
  const known = new Set(parsed.map((a) => a.id));
  const paths = project.paths.map((p) => {
    if (p.armyId === undefined || known.has(p.armyId)) return p;
    const { armyId: _missing, ...rest } = p;
    return rest;
  });
  const armies =
    version >= 3
      ? parsed
      : rebuildMemberships(parsed, paths, project.storyStart);
  return { ...project, paths, armies };
}

function parseUnit(raw: any): Unit {
  const { appears, leaves, ...unit } = raw;
  return {
    ...unit,
    appears: isNumber(appears) ? appears : undefined,
    leaves: isNumber(leaves) ? leaves : undefined,
  };
}

function parseMarkers(raw: unknown): DateMarker[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m: DateMarker) =>
        m &&
        typeof m.id === "string" &&
        [m.time, m.year, m.month, m.day].every(isNumber)
    )
    .map((m: DateMarker) => ({
      id: m.id,
      time: Math.max(m.time, 0),
      ...clampDate(m),
    }));
}

function parsePacing(raw: unknown): PacingKey[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((k: PacingKey) => k && isNumber(k.seconds) && isNumber(k.time))
    .map((k: PacingKey) => ({ seconds: k.seconds, time: k.time }));
}

// Reads a project file as the app uses it. Version 1 files are converted: their marches are
// dated, the story starts at the date 0:00 had, and the date markers are kept as pacing.
export function parseProject(data: any): LoadedProject {
  if (!data || typeof data !== "object") return emptyProject();

  const rawViewport = data.viewport;
  const viewport: SavedViewport | null =
    rawViewport &&
    [rawViewport.centerX, rawViewport.centerY, rawViewport.scale].every(
      isNumber
    )
      ? {
          centerX: rawViewport.centerX,
          centerY: rawViewport.centerY,
          scale: rawViewport.scale,
        }
      : null;

  const units: Unit[] = Array.isArray(data.units)
    ? data.units.map(parseUnit)
    : [];
  const rawPaths: LegacyPath[] = Array.isArray(data.paths)
    ? data.paths.map(parsePath)
    : [];
  const selectedMapFilename = data.selectedMapFilename ?? null;

  const version = isNumber(data.version) ? data.version : 1;
  if (version >= 2) {
    return withArmies(
      {
        units,
        paths: rawPaths.map(({ start, end, ...path }) => path),
        storyStart: isNumber(data.storyStart)
          ? data.storyStart
          : DEFAULT_STORY_START,
        displayMode: DISPLAYS.includes(data.displayMode)
          ? data.displayMode
          : "months",
        pacing: parsePacing(data.pacing),
        selectedMapFilename,
        viewport,
      },
      data.armies,
      version
    );
  }

  const pacing = pacingFromMarkers(parseMarkers(data.dateMarkers));
  return withArmies(
    {
      units,
      paths: convertLegacyPaths(rawPaths, units, pacing),
      storyStart: legacyClock(pacing)(0),
      displayMode: data.dateMode === "days" ? "days" : "months",
      pacing,
      selectedMapFilename,
      viewport,
    },
    data.armies,
    version
  );
}
```

## client/src/utils/dates.test.ts

```ts
import { DateMarker } from "../types";
import {
  civilFromDays,
  clampDate,
  dateAtTime,
  daysFromCivil,
  daysInMonth,
  formatDate,
  isLeapYear,
} from "./dates";

const marker = (
  time: number,
  year: number,
  month: number,
  day: number,
  id = `m${time}`
): DateMarker => ({ id, time, year, month, day });

test("days are counted from 1 January 1970", () => {
  expect(daysFromCivil({ year: 1970, month: 1, day: 1 })).toBe(0);
  expect(daysFromCivil({ year: 1970, month: 1, day: 2 })).toBe(1);
  expect(daysFromCivil({ year: 1969, month: 12, day: 31 })).toBe(-1);
  expect(daysFromCivil({ year: 1971, month: 1, day: 1 })).toBe(365);
  expect(daysFromCivil({ year: 2000, month: 1, day: 1 })).toBe(10957);
});

test("every day round-trips through the calendar, across leap and non-leap years", () => {
  const first = daysFromCivil({ year: 1064, month: 1, day: 1 });
  for (let n = 0; n < 1500; n++) {
    const date = civilFromDays(first + n);
    expect(date.day).toBeGreaterThanOrEqual(1);
    expect(date.day).toBeLessThanOrEqual(daysInMonth(date.year, date.month));
    expect(daysFromCivil(date)).toBe(first + n);
  }

  const hastings = { year: 1066, month: 10, day: 14 };
  expect(civilFromDays(daysFromCivil(hastings))).toEqual(hastings);
});

test("leap years and the length of a month", () => {
  expect(isLeapYear(2000)).toBe(true);
  expect(isLeapYear(1900)).toBe(false);
  expect(isLeapYear(1104)).toBe(true);
  expect(isLeapYear(1100)).toBe(false);

  expect(daysInMonth(1066, 2)).toBe(28);
  expect(daysInMonth(1104, 2)).toBe(29);
  expect(daysInMonth(1066, 4)).toBe(30);
  expect(daysInMonth(1066, 1)).toBe(31);

  expect(
    civilFromDays(daysFromCivil({ year: 1100, month: 2, day: 28 }) + 1)
  ).toEqual({
    year: 1100,
    month: 3,
    day: 1,
  });
  expect(
    civilFromDays(daysFromCivil({ year: 1104, month: 2, day: 28 }) + 1)
  ).toEqual({
    year: 1104,
    month: 2,
    day: 29,
  });
});

test("clampDate makes a date valid", () => {
  expect(clampDate({ year: 1066, month: 13, day: 40 })).toEqual({
    year: 1066,
    month: 12,
    day: 31,
  });
  expect(clampDate({ year: 1066, month: 2, day: 31 })).toEqual({
    year: 1066,
    month: 2,
    day: 28,
  });
  expect(clampDate({ year: 1104, month: 2, day: 31 })).toEqual({
    year: 1104,
    month: 2,
    day: 29,
  });
  expect(clampDate({ year: 0, month: 0, day: 0 })).toEqual({
    year: 1,
    month: 1,
    day: 1,
  });
  expect(clampDate({ year: 12000, month: 6, day: 15 })).toEqual({
    year: 9999,
    month: 6,
    day: 15,
  });
  expect(clampDate({ year: 1066.4, month: 9.6, day: 14.2 })).toEqual({
    year: 1066,
    month: 10,
    day: 14,
  });
});

test("a date is shown as month and year, or with the day too", () => {
  const date = { year: 1066, month: 10, day: 14 };
  expect(formatDate(date, "months")).toBe("October 1066");
  expect(formatDate(date, "days")).toBe("14 October 1066");
});

test("with no markers there is no date, and outside them the nearest marker's date holds", () => {
  expect(dateAtTime([], 5)).toBeNull();

  const markers = [marker(5, 1066, 9, 28), marker(15, 1066, 10, 14)];
  expect(dateAtTime(markers, 0)).toEqual({ year: 1066, month: 9, day: 28 });
  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 9, day: 28 });
  expect(dateAtTime(markers, 15)).toEqual({ year: 1066, month: 10, day: 14 });
  expect(dateAtTime(markers, 99)).toEqual({ year: 1066, month: 10, day: 14 });
});

test("between two markers the date moves a whole number of days at a time", () => {
  const markers = [marker(0, 1066, 1, 1), marker(10, 1067, 1, 1)];

  // 365 days over 10 seconds: halfway is day 182, which is 2 July
  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 7, day: 2 });
  expect(formatDate(dateAtTime(markers, 5)!, "months")).toBe("July 1066");
  expect(dateAtTime(markers, 9.99)).toEqual({ year: 1066, month: 12, day: 31 });
});

test("markers do not need to be in order, and two at the same time do not break it", () => {
  const markers = [
    marker(10, 1067, 1, 1),
    marker(0, 1066, 1, 1),
    marker(10, 1068, 1, 1, "twin"),
  ];

  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 7, day: 2 });
  expect(dateAtTime(markers, 10)?.year).toBe(1068);
});
```

## client/src/utils/dates.ts

```ts
import { DateMarker, DateMode } from "../types";

export interface CalendarDate {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MIN_YEAR = 1;
const MAX_YEAR = 9999;

export const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

// Makes a date valid: a whole year in range, a month from 1 to 12, a day that exists
export function clampDate(date: CalendarDate): CalendarDate {
  const year = Math.min(Math.max(Math.round(date.year), MIN_YEAR), MAX_YEAR);
  const month = Math.min(Math.max(Math.round(date.month), 1), 12);
  const day = Math.min(
    Math.max(Math.round(date.day), 1),
    daysInMonth(year, month)
  );
  return { year, month, day };
}

// Days since 1 January 1970, counting the Gregorian calendar backwards for earlier years
// (Howard Hinnant's civil-days algorithm). Whole days only, so no time zones or daylight
// saving to get in the way.
export function daysFromCivil({ year, month, day }: CalendarDate): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const monthFromMarch = (month + 9) % 12;
  const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

export function civilFromDays(days: number): CalendarDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365
  );
  const y = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthFromMarch + 2) / 5) + 1;
  const month = monthFromMarch < 10 ? monthFromMarch + 3 : monthFromMarch - 9;
  return { year: month <= 2 ? y + 1 : y, month, day };
}

// "October 1066" (months) or "14 October 1066" (days)
export function formatDate(date: CalendarDate, mode: DateMode): string {
  const month = MONTH_NAMES[date.month - 1];
  return mode === "days"
    ? `${date.day} ${month} ${date.year}`
    : `${month} ${date.year}`;
}

// The date to show at a moment on the timeline: the first marker's date before it, the last
// marker's after it, and in between the date moves a whole number of days at a time.
// Null when there are no markers.
export function dateAtTime(
  markers: DateMarker[],
  time: number
): CalendarDate | null {
  if (markers.length === 0) return null;
  const sorted = [...markers].sort((a, b) => a.time - b.time);
  const toDate = (m: DateMarker): CalendarDate => ({
    year: m.year,
    month: m.month,
    day: m.day,
  });

  if (time <= sorted[0].time) return toDate(sorted[0]);
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return toDate(last);

  let i = 0;
  while (sorted[i + 1].time <= time) i++;
  const before = sorted[i];
  const after = sorted[i + 1];

  const span = after.time - before.time;
  const t = span <= 0 ? 1 : (time - before.time) / span;
  const from = daysFromCivil(toDate(before));
  const to = daysFromCivil(toDate(after));
  return civilFromDays(Math.floor(from + (to - from) * t));
}
```

## client/src/utils/formation.test.ts

```ts
import { MapPath, PathPoint } from "../types";
import { attachUnits, changeFormationMode, reanchorPaths } from "./formation";
import { applyOffset, headingAtDistance, samplePath } from "./pathGeometry";

const RAD = Math.PI / 180;

const path = (
  points: PathPoint[],
  assignments: MapPath["assignments"] = [],
  direction?: number
): MapPath => ({ id: "p", name: "Path 1", points, assignments, direction });

// The frame a path's slots are measured against: its direction if it has one (the formation
// turns with its units), otherwise its start heading (the formation stays as placed)
const frameOf = (p: { points: PathPoint[]; direction?: number }) =>
  p.direction !== undefined
    ? p.direction * RAD
    : headingAtDistance(samplePath(p.points), 0);

const east = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
];

test("the first attachment moves the path start to the formation centre", () => {
  const result = attachUnits(path(east), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;

  expect(result.points[0].x).toBeCloseTo(50, 6);
  expect(result.points[0].y).toBeCloseTo(0, 6);
  expect(result.points[1]).toEqual({ x: 200, y: 0 });
  expect(result.direction).toBeUndefined();
});

test("by default the formation is recorded against the path's own heading, as placed", () => {
  // Two units in a line across an east-bound path
  const result = attachUnits(
    path([
      { x: 0, y: 50 },
      { x: 200, y: 50 },
    ]),
    [
      { id: "a", x: 50, y: 30 },
      { id: "b", x: 50, y: 70 },
    ]
  )!;

  const [a, b] = result.assignments;
  expect(a.forward).toBeCloseTo(0, 6);
  expect(b.forward).toBeCloseTo(0, 6);
  expect(a.right).toBeCloseTo(-20, 6);
  expect(b.right).toBeCloseTo(20, 6);
});

test("when the group turns with its units, the formation is recorded against the way they face", () => {
  // Two units side by side facing north, with the route leaving to the north-west
  const result = attachUnits(
    path(
      [
        { x: 0, y: 0 },
        { x: -200, y: -200 },
      ],
      [],
      0
    ),
    [
      { id: "a", x: 30, y: 50 },
      { id: "b", x: 70, y: 50 },
    ]
  )!;

  expect(result.direction).toBeCloseTo(-90, 6);
  const [a, b] = result.assignments;
  expect(a.forward).toBeCloseTo(0, 6);
  expect(b.forward).toBeCloseTo(0, 6);
  expect(a.right).toBeCloseTo(-20, 6);
  expect(b.right).toBeCloseTo(20, 6);
});

test("the group direction is the average of the way its units are facing", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "a", x: 50, y: 0, rotation: 0 }, // faces north
    { id: "b", x: 60, y: 0, rotation: 90 }, // faces east
  ])!;

  expect(result.direction).toBeCloseTo(-45, 6);
});

test("a mirrored unit faces the other way", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "a", x: 50, y: 0, forwardAngle: 0, flipped: true },
  ])!;

  expect(Math.abs(result.direction!)).toBeCloseTo(180, 6);
});

test("with no unit turning to face travel, the direction falls back to the path's heading", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "ship", x: 50, y: 0, travelMode: "upright" },
  ])!;

  expect(result.direction).toBeCloseTo(0, 6);
});

test("portraits, which stay upright, do not count towards the group direction", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "army", x: 50, y: 0, rotation: 90 }, // faces east
    { id: "leader", x: 50, y: 30, assetType: "portraits" },
  ])!;

  expect(result.direction).toBeCloseTo(0, 6);
});

test("every slot reproduces the unit's own position at the start of the path, in either mode", () => {
  const units = [
    { id: "a", x: 120, y: 90, rotation: 30 },
    { id: "b", x: 150, y: 60 },
    { id: "c", x: 100, y: 40, rotation: -20 },
  ];
  const bent = [
    { x: 0, y: 0 },
    { x: 100, y: 60 },
    { x: 180, y: -20 },
  ];

  for (const startDirection of [undefined, 0]) {
    const result = attachUnits(path(bent, [], startDirection), units)!;
    result.assignments.forEach((slot, i) => {
      const position = applyOffset(result.points[0], slot, frameOf(result));
      expect(position.x).toBeCloseTo(units[i].x, 6);
      expect(position.y).toBeCloseTo(units[i].y, 6);
    });
  }
});

test("attaching more units keeps the start, the mode and the existing slots", () => {
  for (const startDirection of [undefined, 0]) {
    const first = attachUnits(path(east, [], startDirection), [
      { id: "a", x: 50, y: 20 },
      { id: "b", x: 50, y: -20 },
    ])!;
    const more = attachUnits(
      path(first.points, first.assignments, first.direction),
      [{ id: "c", x: 10, y: 10, rotation: 90 }]
    )!;

    expect(more.points[0]).toEqual(first.points[0]);
    expect(more.direction).toBe(first.direction);
    expect(more.assignments.map((a) => a.unitId).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(more.assignments.find((a) => a.unitId === "a")).toEqual(
      first.assignments.find((a) => a.unitId === "a")
    );
  }
});

test("re-attaching the whole group records a fresh formation and moves the start", () => {
  const first = attachUnits(path(east), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;
  const again = attachUnits(
    path(first.points, first.assignments, first.direction),
    [
      { id: "a", x: 70, y: 20 },
      { id: "b", x: 70, y: -20 },
    ]
  )!;

  expect(again.points[0].x).toBeCloseTo(70, 6);
  expect(again.assignments).toHaveLength(2);
});

test("attaching no units does nothing", () => {
  expect(attachUnits(path(east), [])).toBeNull();
});

test("switching the formation mode re-measures the slots without moving anyone", () => {
  const units = [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ];
  const attached = attachUnits(path(east), units)!;
  const keep = path(attached.points, attached.assignments, attached.direction);

  const wheel = changeFormationMode(keep, units, "wheel");
  expect(wheel.direction).toBeCloseTo(-90, 6);
  wheel.assignments.forEach((slot, i) => {
    const position = applyOffset(keep.points[0], slot, wheel.direction! * RAD);
    expect(position.x).toBeCloseTo(units[i].x, 6);
    expect(position.y).toBeCloseTo(units[i].y, 6);
  });

  const back = changeFormationMode(
    { ...keep, direction: wheel.direction, assignments: wheel.assignments },
    units,
    "keep"
  );
  expect(back.direction).toBeUndefined();
  back.assignments.forEach((slot, i) => {
    const position = applyOffset(keep.points[0], slot, frameOf(keep));
    expect(position.x).toBeCloseTo(units[i].x, 6);
    expect(position.y).toBeCloseTo(units[i].y, 6);
  });
});

// A path attached to two units, with its start at (50, 0)
const twoUnits = (direction?: number) => {
  const first = attachUnits(path(east, [], direction), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;
  return path(first.points, first.assignments, first.direction);
};

const beforeMove = [
  { id: "a", x: 50, y: 20 },
  { id: "b", x: 50, y: -20 },
];

test("moving every attached unit together carries the path start with them", () => {
  const afterMove = [
    { id: "a", x: 80, y: 50 },
    { id: "b", x: 80, y: 10 },
  ];
  const moved = reanchorPaths([twoUnits()], beforeMove, afterMove)[0];

  expect(moved.points[0].x).toBeCloseTo(80, 6);
  expect(moved.points[0].y).toBeCloseTo(30, 6);
  expect(moved.points[1]).toEqual({ x: 200, y: 0 });

  // Every slot still reproduces its unit's position, so nothing jumps when playback starts
  moved.assignments.forEach((slot, i) => {
    const position = applyOffset(moved.points[0], slot, frameOf(moved));
    expect(position.x).toBeCloseTo(afterMove[i].x, 6);
    expect(position.y).toBeCloseTo(afterMove[i].y, 6);
  });
});

test("moving one attached unit keeps the start and re-records that unit's slot", () => {
  const original = twoUnits();
  const moved = reanchorPaths([original], beforeMove, [
    { id: "a", x: 60, y: 40 },
    { id: "b", x: 50, y: -20 },
  ])[0];

  expect(moved.points).toEqual(original.points);
  expect(moved.direction).toBeUndefined();

  // The path heads east, so a point 10 east and 40 south of the start is 10 ahead, 40 to the right
  const a = moved.assignments.find((slot) => slot.unitId === "a")!;
  expect(a.forward).toBeCloseTo(10, 6);
  expect(a.right).toBeCloseTo(40, 6);

  const b = moved.assignments.find((slot) => slot.unitId === "b")!;
  const oldB = original.assignments.find((slot) => slot.unitId === "b")!;
  expect(b.forward).toBeCloseTo(oldB.forward, 6);
  expect(b.right).toBeCloseTo(oldB.right, 6);
});

test("a path that turns with its units keeps its direction when a unit is moved", () => {
  const original = twoUnits(0);
  expect(original.direction).toBeCloseTo(-90, 6);

  const moved = reanchorPaths([original], beforeMove, [
    { id: "a", x: 60, y: 40 },
    { id: "b", x: 50, y: -20 },
  ])[0];

  expect(moved.direction).toBeCloseTo(-90, 6);
  // The group faces north, so a point 40 south of the start is 40 behind it, 10 to its right
  const a = moved.assignments.find((slot) => slot.unitId === "a")!;
  expect(a.forward).toBeCloseTo(-40, 6);
  expect(a.right).toBeCloseTo(10, 6);
});

test("a path whose attached units did not move is left untouched", () => {
  const original = twoUnits();
  const result = reanchorPaths(
    [original],
    [...beforeMove, { id: "z", x: 0, y: 0 }],
    [...beforeMove, { id: "z", x: 99, y: 99 }]
  );
  expect(result[0]).toBe(original);
});

test("a path with no attached units is left untouched", () => {
  const bare = path([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  expect(
    reanchorPaths(
      [bare],
      [{ id: "a", x: 0, y: 0 }],
      [{ id: "a", x: 5, y: 5 }]
    )[0]
  ).toBe(bare);
});
```

## client/src/utils/formation.ts

```ts
import { MapPath, PathAssignment, PathPoint, Unit } from "../types";
import {
  headingAtDistance,
  offsetFromHeading,
  samplePath,
} from "./pathGeometry";
import {
  DEFAULT_FORWARD_ANGLE,
  defaultTravelMode,
  effectiveForward,
  normalizeDegrees,
} from "./unitFacing";

// What the formation maths needs to know about a unit. Only the position is required; the
// rest describe how it is facing and default the same way they do everywhere else.
export type FormationUnit = Pick<Unit, "id" | "x" | "y"> &
  Partial<
    Pick<
      Unit,
      "rotation" | "flipped" | "forwardAngle" | "travelMode" | "assetType"
    >
  >;

// "keep": the formation stays as placed and units turn on the spot (the path has no direction).
// "wheel": the whole group turns with its units (the path has a direction to turn from).
export type FormationMode = "keep" | "wheel";

export interface Attachment {
  points: PathPoint[];
  assignments: PathAssignment[];
  direction: number | undefined; // degrees; undefined when the formation is kept as placed
}

const MOVE_TOLERANCE = 1e-6;
const RAD = Math.PI / 180;

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

// The direction a unit is facing on screen (degrees), or null if it doesn't turn to face travel
function facingDegrees(unit: FormationUnit): number | null {
  const travelMode = unit.travelMode ?? defaultTravelMode(unit.assetType);
  if (travelMode !== "rotate") return null;
  const forward = unit.forwardAngle ?? DEFAULT_FORWARD_ANGLE;
  return effectiveForward(forward, !!unit.flipped) + (unit.rotation ?? 0);
}

// The average of several directions (degrees), or null if they cancel out
function circularMeanDegrees(angles: number[]): number | null {
  if (angles.length === 0) return null;
  const sin = angles.reduce((sum, a) => sum + Math.sin(a * RAD), 0);
  const cos = angles.reduce((sum, a) => sum + Math.cos(a * RAD), 0);
  if (Math.hypot(sin, cos) < 1e-6) return null;
  return normalizeDegrees(Math.atan2(sin, cos) / RAD);
}

const startHeadingDegrees = (points: PathPoint[]) =>
  headingAtDistance(samplePath(points), 0) / RAD;

// The direction the group faces: the average facing of the units that turn to face travel,
// or the path's start heading if there are none
function groupDirection(units: FormationUnit[], points: PathPoint[]): number {
  const facings = units
    .map(facingDegrees)
    .filter((angle): angle is number => angle !== null);
  return circularMeanDegrees(facings) ?? startHeadingDegrees(points);
}

// The frame (radians) a path's slots are measured against: its direction if it has one,
// otherwise its start heading
function frameFor(direction: number | undefined, points: PathPoint[]): number {
  return direction !== undefined
    ? direction * RAD
    : headingAtDistance(samplePath(points), 0);
}

// Each unit's place in the formation: its distance along and to the right of the frame,
// measured from the path's start point
function recordSlots(
  points: PathPoint[],
  units: FormationUnit[],
  frame: number
): PathAssignment[] {
  const start = points[0];
  return units.map((unit) => ({
    unitId: unit.id,
    ...offsetFromHeading({ x: unit.x - start.x, y: unit.y - start.y }, frame),
  }));
}

// Works out a path's new points and formation slots when units are attached to it.
//
// - If the selection covers every unit already on the path (or there are none), it is a
//   fresh formation: the path's start moves to the group's centre, so no unit teleports.
// - Otherwise the start stays where it is, and the new units' slots are measured against it.
//
// A path that has a direction turns its group with its units, so a fresh formation takes
// its direction from the way the units face. A path without one keeps the formation as placed.
export function attachUnits(
  path: MapPath,
  units: FormationUnit[]
): Attachment | null {
  if (units.length === 0 || path.points.length < 2) return null;

  const selected = new Set(units.map((unit) => unit.id));
  const isFreshFormation = path.assignments.every((a) =>
    selected.has(a.unitId)
  );

  const points = isFreshFormation
    ? [
        { x: mean(units.map((u) => u.x)), y: mean(units.map((u) => u.y)) },
        ...path.points.slice(1),
      ]
    : path.points;

  const turnsWithUnits = path.direction !== undefined;
  const direction = !turnsWithUnits
    ? undefined
    : isFreshFormation
      ? groupDirection(units, points)
      : path.direction;

  const kept = isFreshFormation
    ? []
    : path.assignments.filter((a) => !selected.has(a.unitId));

  return {
    points,
    direction,
    assignments: [
      ...kept,
      ...recordSlots(points, units, frameFor(direction, points)),
    ],
  };
}

// Switches a path between keeping its formation as placed and turning it with its units.
// Nobody moves: the path's points stay, and the slots are re-measured against the new frame.
// A formation that turns with its units faces the way they face on average, or the way just
// `facingFrom` face when given (the timeline passes the units arriving from earlier marches).
export function changeFormationMode(
  path: MapPath,
  units: FormationUnit[],
  mode: FormationMode,
  facingFrom?: FormationUnit[]
): { direction: number | undefined; assignments: PathAssignment[] } {
  const byId = new Map<string, FormationUnit>(
    units.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const present = path.assignments
    .map((a) => byId.get(a.unitId))
    .filter((unit): unit is FormationUnit => unit !== undefined);

  const direction =
    mode === "wheel"
      ? groupDirection(
          facingFrom && facingFrom.length > 0 ? facingFrom : present,
          path.points
        )
      : undefined;
  return {
    direction,
    assignments: recordSlots(
      path.points,
      present,
      frameFor(direction, path.points)
    ),
  };
}

// Keeps paths consistent after units have been moved, so nothing jumps when playback starts:
// - every attached unit moved by the same amount: the path start goes with them
// - only some moved: the start stays, and the slots are re-recorded from the new positions
// Paths whose attached units did not move are returned untouched.
export function reanchorPaths(
  paths: MapPath[],
  before: FormationUnit[],
  after: FormationUnit[],
  skip: ReadonlySet<string> = new Set()
): MapPath[] {
  const beforeById = new Map<string, FormationUnit>(
    before.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const afterById = new Map<string, FormationUnit>(
    after.map((unit): [string, FormationUnit] => [unit.id, unit])
  );

  return paths.map((path) => {
    if (skip.has(path.id)) return path;
    if (path.assignments.length === 0 || path.points.length < 2) return path;

    const units: FormationUnit[] = [];
    const moves: { dx: number; dy: number }[] = [];
    for (const assignment of path.assignments) {
      const was = beforeById.get(assignment.unitId);
      const now = afterById.get(assignment.unitId);
      if (!was || !now) return path;
      units.push(now);
      moves.push({ dx: now.x - was.x, dy: now.y - was.y });
    }

    const anyMoved = moves.some(
      (m) => Math.abs(m.dx) > MOVE_TOLERANCE || Math.abs(m.dy) > MOVE_TOLERANCE
    );
    if (!anyMoved) return path;

    const first = moves[0];
    const movedTogether = moves.every(
      (m) =>
        Math.abs(m.dx - first.dx) < MOVE_TOLERANCE &&
        Math.abs(m.dy - first.dy) < MOVE_TOLERANCE
    );

    const points = movedTogether
      ? [
          { x: path.points[0].x + first.dx, y: path.points[0].y + first.dy },
          ...path.points.slice(1),
        ]
      : path.points;

    return {
      ...path,
      points,
      assignments: recordSlots(points, units, frameFor(path.direction, points)),
    };
  });
}

// Re-records the formation slots after a path's points change, measuring from the units'
// current positions, so nothing jumps when playback starts
export function rerecordSlots(
  path: MapPath,
  points: PathPoint[],
  units: FormationUnit[]
): PathAssignment[] {
  const byId = new Map<string, FormationUnit>(
    units.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const present = path.assignments
    .map((a) => byId.get(a.unitId))
    .filter((unit): unit is FormationUnit => unit !== undefined);
  return recordSlots(points, present, frameFor(path.direction, points));
}
```

## client/src/utils/historyEdit.test.ts

```ts
import {
  allowedStoryStart,
  durationFields,
  fromDurationFields,
  fromMomentFields,
  momentFields,
  pathShownAt,
} from "./historyEdit";
import { HOUR, MINUTE, toHistoryTime } from "./historyTime";

const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

test("a moment splits into fields and comes back unchanged", () => {
  const t = toHistoryTime({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 30,
  });
  expect(momentFields(t)).toEqual({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 30,
  });
  expect(fromMomentFields(momentFields(t))).toBeCloseTo(t, 9);
});

test("typed fields out of range are pulled back in", () => {
  // 31 February 1066 is the last day of February; hours and minutes stay on the clock
  expect(
    fromMomentFields({ year: 1066, month: 2, day: 31, hour: 30, minute: -5 })
  ).toBeCloseTo(
    toHistoryTime({ year: 1066, month: 2, day: 28, hour: 23, minute: 0 }),
    9
  );
  expect(
    momentFields(
      fromMomentFields({ year: 1066, month: 13, day: 0, hour: 0, minute: 75 })
    )
  ).toEqual({ year: 1066, month: 12, day: 1, hour: 0, minute: 59 });
});

test("a length splits into days, hours and minutes, and typed parts add up", () => {
  expect(durationFields(1.5)).toEqual({ days: 1, hours: 12, minutes: 0 });
  expect(durationFields(2 * HOUR + 15 * MINUTE)).toEqual({
    days: 0,
    hours: 2,
    minutes: 15,
  });
  expect(durationFields(-1)).toEqual({ days: 0, hours: 0, minutes: 0 });

  expect(fromDurationFields({ days: 0, hours: 36, minutes: 0 })).toBeCloseTo(
    1.5,
    9
  );
  expect(fromDurationFields({ days: 1, hours: -3, minutes: 30 })).toBeCloseTo(
    1 + 30 * MINUTE,
    9
  );
  expect(fromDurationFields(durationFields(3.25))).toBeCloseTo(3.25, 9);
});

test("past the story's start a path shows only while its march is under way", () => {
  const march = { start: D + 2, end: D + 5 };
  expect(pathShownAt(march, null)).toBe(true); // at the start, everything shows
  expect(pathShownAt(march, D + 1)).toBe(false);
  expect(pathShownAt(march, D + 2)).toBe(true);
  expect(pathShownAt(march, D + 5)).toBe(true);
  expect(pathShownAt(march, D + 6)).toBe(false);
  expect(pathShownAt(undefined, D + 6)).toBe(true); // no march yet
});

test("the story can't start after its first march begins", () => {
  expect(allowedStoryStart(D + 10, D + 2)).toBe(D + 2);
  expect(allowedStoryStart(D - 10, D + 2)).toBe(D - 10);
  expect(allowedStoryStart(D + 10, null)).toBe(D + 10);
});
```

## client/src/utils/historyEdit.ts

```ts
import { clampDate } from "./dates";
import {
  fromHistoryTime,
  HistoryMoment,
  HistoryTime,
  MINUTES_PER_DAY,
  toHistoryTime,
} from "./historyTime";

// The pieces of a moment the editor shows as separate fields
export type MomentFields = HistoryMoment;

export interface DurationFields {
  days: number;
  hours: number;
  minutes: number;
}

const clampInt = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.round(value), min), max);

export function momentFields(t: HistoryTime): MomentFields {
  return fromHistoryTime(t);
}

// Turns typed fields back into a moment. Anything out of range is pulled back in: a day that
// doesn't exist in that month becomes its last day, hours run 0 to 23 and minutes 0 to 59.
export function fromMomentFields(fields: MomentFields): HistoryTime {
  return toHistoryTime({
    ...clampDate(fields),
    hour: clampInt(fields.hour, 0, 23),
    minute: clampInt(fields.minute, 0, 59),
  });
}

// A length of history as whole days, hours and minutes
export function durationFields(days: number): DurationFields {
  const total = Math.round(Math.max(days, 0) * MINUTES_PER_DAY);
  return {
    days: Math.floor(total / MINUTES_PER_DAY),
    hours: Math.floor((total % MINUTES_PER_DAY) / 60),
    minutes: total % 60,
  };
}

// Typed days, hours and minutes as a length in days. They simply add up, so "0 days 36 hours"
// is a day and a half. Nothing can be negative.
export function fromDurationFields(fields: DurationFields): number {
  const total =
    Math.max(Math.round(fields.days), 0) * MINUTES_PER_DAY +
    Math.max(Math.round(fields.hours), 0) * 60 +
    Math.max(Math.round(fields.minutes), 0);
  return total / MINUTES_PER_DAY;
}

// Whether a path is drawn on the map. At the story's start (no playhead) every path shows, so
// they can all be edited. Past it, a march's path shows only while the march is under way, and
// a path with no march (no units yet) always shows.
export function pathShownAt(
  march: { start: HistoryTime; end: HistoryTime } | undefined,
  now: HistoryTime | null
): boolean {
  if (now === null || !march) return true;
  return march.start <= now && now <= march.end;
}

// The story can't start after its first march begins, or that march would start before the
// story does. Asking for a later start stops at the first march.
export function allowedStoryStart(
  wanted: HistoryTime,
  firstMarch: HistoryTime | null
): HistoryTime {
  return firstMarch === null ? wanted : Math.min(wanted, firstMarch);
}
```

## client/src/utils/historyTime.test.ts

```ts
import {
  formatDuration,
  formatHistoryTime,
  fromHistoryTime,
  historyTicks,
  HOUR,
  MINUTES_PER_DAY,
  toHistoryTime,
} from "./historyTime";

test("a moment survives the trip to history time and back, to the minute", () => {
  const moment = { year: 1066, month: 10, day: 14, hour: 9, minute: 30 };
  expect(fromHistoryTime(toHistoryTime(moment))).toEqual(moment);
  expect(toHistoryTime({ year: 1970, month: 1, day: 2, hour: 12 })).toBeCloseTo(
    1.5,
    10
  );
});

test("a moment just before midnight reads as the next day's midnight, never 23:60", () => {
  const nearlyMidnight =
    toHistoryTime({ year: 1066, month: 10, day: 14 }) +
    1 -
    1 / (MINUTES_PER_DAY * 100);
  expect(fromHistoryTime(nearlyMidnight)).toEqual({
    year: 1066,
    month: 10,
    day: 15,
    hour: 0,
    minute: 0,
  });
});

test("a moment reads as a month, a day, or a day and time", () => {
  const t = toHistoryTime({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 5,
  });
  expect(formatHistoryTime(t, "months")).toBe("October 1066");
  expect(formatHistoryTime(t, "days")).toBe("14 October 1066");
  expect(formatHistoryTime(t, "times")).toBe("14 October 1066, 09:05");
});

test("a length of history reads in days, hours and minutes", () => {
  expect(formatDuration(0)).toBe("0 minutes");
  expect(formatDuration(3)).toBe("3 days");
  expect(formatDuration(1.5)).toBe("1 day 12 hours");
  expect(formatDuration(2.25 * HOUR)).toBe("2 hours 15 minutes");
});

test("zoomed into a day, the ruler ticks every six hours", () => {
  const from = toHistoryTime({ year: 1066, month: 10, day: 14 });
  const ticks = historyTicks(from, from + 1, 10);

  expect(ticks.map((t) => t.label)).toEqual([
    "00:00",
    "06:00",
    "12:00",
    "18:00",
    "00:00",
  ]);
  expect(ticks[0].time).toBeCloseTo(from, 10);
});

test("across two years, the ruler ticks every quarter", () => {
  const ticks = historyTicks(
    toHistoryTime({ year: 1066, month: 1, day: 1 }),
    toHistoryTime({ year: 1068, month: 1, day: 1 }),
    10
  );

  expect(ticks.map((t) => t.label)).toEqual([
    "Jan 1066",
    "Apr 1066",
    "Jul 1066",
    "Oct 1066",
    "Jan 1067",
    "Apr 1067",
    "Jul 1067",
    "Oct 1067",
    "Jan 1068",
  ]);
});

test("across centuries, the ruler ticks in round years", () => {
  const ticks = historyTicks(
    toHistoryTime({ year: 1000, month: 1, day: 1 }),
    toHistoryTime({ year: 1300, month: 1, day: 1 }),
    10
  );

  expect(ticks.map((t) => t.label)).toEqual([
    "1000",
    "1050",
    "1100",
    "1150",
    "1200",
    "1250",
    "1300",
  ]);
});

test("a ruler with no span has no ticks", () => {
  const t = toHistoryTime({ year: 1066, month: 10, day: 14 });
  expect(historyTicks(t, t, 10)).toEqual([]);
});
```

## client/src/utils/historyTime.ts

```ts
import {
  CalendarDate,
  civilFromDays,
  daysFromCivil,
  MONTH_NAMES,
} from "./dates";

// A moment in history: days since the start of 1 January 1970, with the time of day as the
// fraction (0.5 is midday). One continuous number keeps ordering, spans and interpolation
// simple, and it is precise to well under a second for any date we'd ever draw.
export type HistoryTime = number;

export interface HistoryMoment extends CalendarDate {
  hour: number; // 0 to 23
  minute: number; // 0 to 59
}

// How the date in the corner reads: "October 1066", "14 October 1066", or with the time too
export type HistoryDisplay = "months" | "days" | "times";

export const MINUTES_PER_DAY = 1440;
export const HOUR = 1 / 24;
export const MINUTE = 1 / MINUTES_PER_DAY;

const pad = (n: number) => String(n).padStart(2, "0");
const shortMonth = (month: number) => MONTH_NAMES[month - 1].slice(0, 3);

export function toHistoryTime(
  moment: CalendarDate & { hour?: number; minute?: number }
): HistoryTime {
  return (
    daysFromCivil(moment) +
    ((moment.hour ?? 0) * 60 + (moment.minute ?? 0)) / MINUTES_PER_DAY
  );
}

// Rounded to the nearest minute, so a moment a hair before midnight reads as the next day's
// 00:00, never as 23:60
export function fromHistoryTime(t: HistoryTime): HistoryMoment {
  const totalMinutes = Math.round(t * MINUTES_PER_DAY);
  const day = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const minuteOfDay = totalMinutes - day * MINUTES_PER_DAY;
  return {
    ...civilFromDays(day),
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
  };
}

export function formatHistoryTime(
  t: HistoryTime,
  display: HistoryDisplay
): string {
  const m = fromHistoryTime(t);
  const month = MONTH_NAMES[m.month - 1];
  if (display === "months") return `${month} ${m.year}`;
  if (display === "days") return `${m.day} ${month} ${m.year}`;
  return `${m.day} ${month} ${m.year}, ${pad(m.hour)}:${pad(m.minute)}`;
}

// A length of history in words: "3 days", "1 day 12 hours", "2 hours 15 minutes"
export function formatDuration(days: number): string {
  const totalMinutes = Math.round(Math.max(days, 0) * MINUTES_PER_DAY);
  const d = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const h = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const m = totalMinutes % 60;

  const parts: string[] = [];
  if (d) parts.push(`${d} day${d === 1 ? "" : "s"}`);
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m || parts.length === 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export interface HistoryTick {
  time: HistoryTime;
  label: string;
}

// Steps measured in days: hours, quarter days, days, weeks
const CLOCK_STEPS: { days: number; label: (m: HistoryMoment) => string }[] = [
  { days: HOUR, label: (m) => `${pad(m.hour)}:${pad(m.minute)}` },
  { days: 6 * HOUR, label: (m) => `${pad(m.hour)}:${pad(m.minute)}` },
  { days: 1, label: (m) => `${m.day} ${shortMonth(m.month)}` },
  { days: 7, label: (m) => `${m.day} ${shortMonth(m.month)}` },
];

// Steps measured in calendar months, so ticks land on the 1st: 1, 3 and 6 months, then
// 1, 5, 10, 50 and 100 years
const MONTH_STEPS = [1, 3, 6, 12, 60, 120, 600, 1200];
const AVERAGE_MONTH_DAYS = 365.2425 / 12;

// Ticks for a ruler showing `from` to `to`: the finest step that gives no more than
// `maxTicks`, so it reads in hours when zoomed right in and in centuries when zoomed right out
export function historyTicks(
  from: HistoryTime,
  to: HistoryTime,
  maxTicks: number
): HistoryTick[] {
  const span = to - from;
  if (!(span > 0) || maxTicks < 1) return [];

  for (const step of CLOCK_STEPS) {
    if (span / step.days > maxTicks) continue;
    const ticks: HistoryTick[] = [];
    for (
      let i = Math.ceil(from / step.days - 1e-9);
      i * step.days <= to + 1e-9;
      i++
    ) {
      const time = i * step.days;
      ticks.push({ time, label: step.label(fromHistoryTime(time)) });
    }
    return ticks;
  }

  const first = fromHistoryTime(from);
  const coarsest = MONTH_STEPS[MONTH_STEPS.length - 1];
  for (const months of MONTH_STEPS) {
    if (span / (months * AVERAGE_MONTH_DAYS) > maxTicks && months !== coarsest)
      continue;

    let index = first.year * 12 + (first.month - 1);
    if (
      toHistoryTime({ year: first.year, month: first.month, day: 1 }) <
      from - 1e-9
    )
      index++;
    while (index % months !== 0) index++;

    const ticks: HistoryTick[] = [];
    for (;;) {
      const year = Math.floor(index / 12);
      const month = (index % 12) + 1;
      const time = toHistoryTime({ year, month, day: 1 });
      if (time > to + 1e-9) break;
      ticks.push({
        time,
        label: months >= 12 ? `${year}` : `${shortMonth(month)} ${year}`,
      });
      index += months;
    }
    return ticks;
  }
  return [];
}
```

## client/src/utils/lifespans.test.ts

```ts
import { Unit } from "../types";
import { toHistoryTime } from "./historyTime";
import {
  defaultMarchStart,
  editableAt,
  homeMoment,
  placementMoment,
  removeUnitsAt,
} from "./lifespans";

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

test("a unit is placed at the story's start, or at the moment it appears", () => {
  expect(homeMoment({}, S)).toBe(S);
  expect(homeMoment({ appears: S + 5 }, S)).toBe(S + 5);
  // Appearing before the story starts counts as being there from the start
  expect(homeMoment({ appears: S - 5 }, S)).toBe(S);
});

test("a unit can only be edited at its own home moment", () => {
  expect(editableAt({}, null, S)).toBe(true);
  expect(editableAt({}, S + 1, S)).toBe(false);

  expect(editableAt({ appears: S + 5 }, null, S)).toBe(false);
  expect(editableAt({ appears: S + 5 }, S + 5, S)).toBe(true);
  expect(editableAt({ appears: S + 5 }, S + 5.1, S)).toBe(false);
});

test("units placed past the story's start appear then; at the start they have no date", () => {
  expect(placementMoment(null, S)).toBeUndefined();
  expect(placementMoment(S, S)).toBeUndefined();
  expect(placementMoment(S + 3, S)).toBe(S + 3);
});

test("removing at a unit's home moment deletes it; later, it leaves then", () => {
  const units = [unit("a"), unit("b", { appears: S + 5 }), unit("c")];

  const atStart = removeUnitsAt(units, new Set(["a"]), null, S);
  expect(atStart.units.map((u) => u.id)).toEqual(["b", "c"]);
  expect(Array.from(atStart.deletedIds)).toEqual(["a"]);

  const later = removeUnitsAt(units, new Set(["a", "b"]), S + 5, S);
  expect(Array.from(later.deletedIds)).toEqual(["b"]); // b appears now, so it goes outright
  expect(later.units.find((u) => u.id === "a")!.leaves).toBe(S + 5);
  expect(later.units.find((u) => u.id === "c")!.leaves).toBeUndefined();
});

test("a new march waits for its earlier marches and for its last unit to appear", () => {
  expect(defaultMarchStart(null, S, [{}])).toBe(S);
  expect(defaultMarchStart(S + 4, S, [{}])).toBe(S + 4);
  expect(defaultMarchStart(null, S, [{}, { appears: S + 9 }])).toBe(S + 9);
  expect(defaultMarchStart(S + 12, S, [{ appears: S + 9 }])).toBe(S + 12);
});
```

## client/src/utils/lifespans.ts

```ts
import { Unit } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";

// Two moments closer than this count as the same moment
const SAME_MOMENT = MINUTE / 2;

type Dated = Pick<Unit, "appears" | "leaves">;

// The moment a unit is placed at: when it appears, or the story's start for a unit that is
// there from the beginning. A unit is edited (moved, turned, deleted outright) at this moment,
// because that is where its placed position is what the map shows.
export function homeMoment(unit: Dated, storyStart: HistoryTime): HistoryTime {
  return unit.appears !== undefined
    ? Math.max(unit.appears, storyStart)
    : storyStart;
}

// Whether a unit can be edited with the playhead where it is (null is the story's start)
export function editableAt(
  unit: Dated,
  now: HistoryTime | null,
  storyStart: HistoryTime
): boolean {
  const current = now ?? storyStart;
  return Math.abs(current - homeMoment(unit, storyStart)) < SAME_MOMENT;
}

// When a unit placed now appears: at the playhead's moment once it is past the story's start,
// otherwise from the start (no date)
export function placementMoment(
  now: HistoryTime | null,
  storyStart: HistoryTime
): HistoryTime | undefined {
  return now !== null && now > storyStart ? now : undefined;
}

// Removing units with the playhead where it is. A unit at its own home moment is deleted
// outright; anywhere later it leaves at that moment and stays in history before it.
export function removeUnitsAt(
  units: Unit[],
  ids: ReadonlySet<string>,
  now: HistoryTime | null,
  storyStart: HistoryTime
): { units: Unit[]; deletedIds: Set<string> } {
  const deletedIds = new Set<string>();
  const kept: Unit[] = [];
  for (const unit of units) {
    if (!ids.has(unit.id)) {
      kept.push(unit);
    } else if (now === null || editableAt(unit, now, storyStart)) {
      deletedIds.add(unit.id);
    } else {
      kept.push({ ...unit, leaves: now });
    }
  }
  return { units: kept, deletedIds };
}

// When a new march for these units begins by default: once their earlier marches have ended
// (if they have any), never before the story starts, and never before the last of them has
// appeared
export function defaultMarchStart(
  handoverTime: HistoryTime | null,
  storyStart: HistoryTime,
  units: Dated[]
): HistoryTime {
  return units.reduce(
    (latest, unit) => Math.max(latest, unit.appears ?? -Infinity),
    handoverTime ?? storyStart
  );
}
```

## client/src/utils/marches.test.ts

```ts
import { Unit } from "../types";
import { attachUnits } from "./formation";
import {
  MIN_SPAN_DAYS,
  clampMarch,
  defaultTurn,
  dragMarch,
  marchPhase,
  snapTime,
} from "./marches";
import { createPlayback } from "./pathPlayback";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

const timing = { start: 0, end: 10, turn: 2 };

test("a march turns first, then travels, and is finished after its end", () => {
  expect(marchPhase(timing, -1)).toEqual({ turn: 0, travel: 0 });
  expect(marchPhase(timing, 1)).toEqual({ turn: 0.5, travel: 0 });
  expect(marchPhase(timing, 2)).toEqual({ turn: 1, travel: 0 });
  expect(marchPhase(timing, 6)).toEqual({ turn: 1, travel: 0.5 });
  expect(marchPhase(timing, 10)).toEqual({ turn: 1, travel: 1 });
  expect(marchPhase(timing, 20)).toEqual({ turn: 1, travel: 1 });
});

test("a march with no turn starts travelling straight away", () => {
  const noTurn = { start: 0, end: 10, turn: 0 };
  expect(marchPhase(noTurn, 0)).toEqual({ turn: 1, travel: 0 });
  expect(marchPhase(noTurn, 5)).toEqual({ turn: 1, travel: 0.5 });
});

test("by default the turn gets the same share of the march as in the playback", () => {
  const units = [unit("a", 0, 0)]; // faces north, so it turns 90° to head east
  const attachment = attachUnits(
    {
      id: "p",
      name: "p",
      points: [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
      ],
      assignments: [],
    },
    units
  )!;
  const playback = createPlayback({ id: "p", name: "p", ...attachment }, units);

  // 150 of turning in a run of 1150, over a march of 11.5 days
  expect(defaultTurn(playback, 0, 11.5)).toBeCloseTo(1.5, 6);
});

test("dragging a march's bar moves it, or moves an end, keeping the turn's length", () => {
  expect(dragMarch(timing, 2.5, "move", 0)).toEqual({
    start: 2.5,
    end: 12.5,
    turn: 2,
  });
  expect(dragMarch(timing, 0.3, "move", 0.25)).toEqual({
    start: 0.25,
    end: 10.25,
    turn: 2,
  });

  expect(dragMarch(timing, -3, "start", 0)).toEqual({
    start: -3,
    end: 10,
    turn: 2,
  });
  expect(dragMarch(timing, 20, "start", 0).start).toBeCloseTo(
    8 - MIN_SPAN_DAYS,
    10
  );

  expect(dragMarch(timing, 4, "end", 0)).toEqual({
    start: 0,
    end: 14,
    turn: 2,
  });
  expect(dragMarch(timing, -20, "end", 0).end).toBeCloseTo(
    2 + MIN_SPAN_DAYS,
    10
  );
});

test("dragging the split changes how long the turn takes, within the march", () => {
  expect(dragMarch(timing, 3, "split", 0).turn).toBeCloseTo(5, 10);
  expect(dragMarch(timing, -5, "split", 0).turn).toBe(0);
  expect(dragMarch(timing, 20, "split", 0).turn).toBeCloseTo(
    10 - MIN_SPAN_DAYS,
    10
  );
  expect(dragMarch(timing, 0.9, "split", 1).turn).toBe(3); // snapped to a whole day
});

test("timings are kept sensible, and times snap to whole steps", () => {
  expect(clampMarch({ start: 5, end: 2, turn: 1 })).toEqual({
    start: 5,
    end: 5 + MIN_SPAN_DAYS,
    turn: 0,
  });
  expect(clampMarch({ start: 0, end: 10, turn: 15 }).turn).toBeCloseTo(
    10 - MIN_SPAN_DAYS,
    10
  );
  expect(clampMarch({ start: 0, end: 10, turn: -1 }).turn).toBe(0);

  expect(snapTime(1.26, 0.25)).toBe(1.25);
  expect(snapTime(1.26, 0)).toBe(1.26);
});
```

## client/src/utils/marches.ts

```ts
import { MarchTiming } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";
import { Playback } from "./pathPlayback";

// When a march happens in history: from `start` to `end`, of which the first `turn` days are
// spent turning on the spot to face the route (0 when no turn is needed). Defined with the
// other saved types, because paths store it.
export type { MarchTiming };

// The shortest any part of a march can be
export const MIN_SPAN_DAYS = MINUTE;

// How far through its turn and through its travel a march is, each 0 to 1
export interface MarchPhase {
  turn: number;
  travel: number;
}

export type MarchDragMode = "move" | "start" | "end" | "split";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function marchPhase(timing: MarchTiming, t: HistoryTime): MarchPhase {
  const turnEnd = timing.start + timing.turn;
  const turn =
    timing.turn > 0
      ? clamp01((t - timing.start) / timing.turn)
      : t >= timing.start
        ? 1
        : 0;
  const travelSpan = timing.end - turnEnd;
  const travel =
    travelSpan > 0
      ? clamp01((t - turnEnd) / travelSpan)
      : t >= timing.end
        ? 1
        : 0;
  return { turn, travel };
}

// How long the turn takes by default: the same share of the march as turning takes in the
// playback at the standard turning and marching speeds
export function defaultTurn(
  playback: Playback,
  start: HistoryTime,
  end: HistoryTime
): number {
  if (playback.length <= 0) return 0;
  return ((end - start) * playback.pivotLength) / playback.length;
}

// Keeps a timing sensible: the march ends after it starts, and the turn leaves some travel
export function clampMarch(timing: MarchTiming): MarchTiming {
  const end = Math.max(timing.end, timing.start + MIN_SPAN_DAYS);
  const longestTurn = end - timing.start - MIN_SPAN_DAYS;
  const turn = Math.min(Math.max(timing.turn, 0), Math.max(longestTurn, 0));
  // Dates far from 1970 leave rounding crumbs; a turn under a millisecond is no turn
  return { start: timing.start, end, turn: turn < 1e-8 ? 0 : turn };
}

// Rounds a moment to the nearest whole step (an hour, a day...). A step of 0 leaves it as it is.
export function snapTime(t: number, step: number): number {
  return step > 0 ? Math.round(t / step) * step : t;
}

// What dragging part of a march's bar does. `delta` is how far the pointer moved, in days.
// "move" shifts the whole march, "start" and "end" change those edges and keep the turn's
// length, and "split" moves the line between turning and travelling, so a longer turn means a
// slower one. The edge being dragged snaps to `snap` days.
export function dragMarch(
  original: MarchTiming,
  delta: number,
  mode: MarchDragMode,
  snap: number
): MarchTiming {
  const { start, end, turn } = original;

  if (mode === "move") {
    const newStart = snapTime(start + delta, snap);
    return { start: newStart, end: newStart + (end - start), turn };
  }
  if (mode === "start") {
    const latest = end - turn - MIN_SPAN_DAYS;
    return {
      start: Math.min(snapTime(start + delta, snap), latest),
      end,
      turn,
    };
  }
  if (mode === "end") {
    const earliest = start + turn + MIN_SPAN_DAYS;
    return {
      start,
      end: Math.max(snapTime(end + delta, snap), earliest),
      turn,
    };
  }

  const longestTurn = Math.max(end - start - MIN_SPAN_DAYS, 0);
  const turnEnd = snapTime(start + turn + delta, snap);
  return {
    start,
    end,
    turn: Math.min(Math.max(turnEnd - start, 0), longestTurn),
  };
}
```

## client/src/utils/nearestOnPath.test.ts

```ts
import { nearestOnPath } from "./pathGeometry";

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

const arch = [
  { x: 0, y: 0 },
  { x: 50, y: 50 },
  { x: 100, y: 0 },
];

test("finds the closest point on a straight path", () => {
  const nearest = nearestOnPath(straight, { x: 30, y: 10 });
  expect(nearest).not.toBeNull();
  expect(nearest!.point.x).toBeCloseTo(30, 0);
  expect(nearest!.point.y).toBeCloseTo(0, 5);
  expect(nearest!.distance).toBeCloseTo(10, 0);
  expect(nearest!.segmentIndex).toBe(0);
});

test("reports segment 0 for a point on the first half of a curve", () => {
  // The curve passes through about (21.9, 28.1) halfway along its first segment
  const nearest = nearestOnPath(arch, { x: 22, y: 28 });
  expect(nearest!.segmentIndex).toBe(0);
  expect(nearest!.distance).toBeLessThan(1);
});

test("reports segment 1 for a point on the second half of a curve", () => {
  // ...and through about (78.1, 28.1) halfway along its second segment
  const nearest = nearestOnPath(arch, { x: 78, y: 28 });
  expect(nearest!.segmentIndex).toBe(1);
  expect(nearest!.distance).toBeLessThan(1);
});

test("returns null when there is no curve", () => {
  expect(nearestOnPath([{ x: 0, y: 0 }], { x: 5, y: 5 })).toBeNull();
});
```

## client/src/utils/pathGeometry.test.ts

```ts
import {
  samplePath,
  pointAtDistance,
  headingAtDistance,
  offsetFromHeading,
  applyOffset,
  facingRotation,
  svgPathData,
} from "./pathGeometry";

describe("pathGeometry", () => {
  const straight = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];

  test("a straight path has the right length", () => {
    expect(samplePath(straight).length).toBeCloseTo(100, 5);
  });

  test("pointAtDistance walks along the path", () => {
    const mid = pointAtDistance(samplePath(straight), 50);
    expect(mid.x).toBeCloseTo(50, 3);
    expect(mid.y).toBeCloseTo(0, 5);
  });

  test("distance is clamped to the ends of the path", () => {
    const path = samplePath(straight);
    expect(pointAtDistance(path, -10).x).toBeCloseTo(0, 5);
    expect(pointAtDistance(path, 1000).x).toBeCloseTo(100, 5);
  });

  test("the curve passes through every waypoint", () => {
    const path = samplePath([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);
    // With the default 40 steps per segment, sample 40 is the middle waypoint
    expect(path.samples[40].x).toBeCloseTo(50, 5);
    expect(path.samples[40].y).toBeCloseTo(50, 5);
    expect(path.length).toBeGreaterThan(100);
  });

  test("heading is 0 travelling right and 90 degrees travelling down", () => {
    expect(headingAtDistance(samplePath(straight), 50)).toBeCloseTo(0, 5);
    const down = samplePath([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);
    expect(headingAtDistance(down, 50)).toBeCloseTo(Math.PI / 2, 5);
  });

  test("offsetFromHeading and applyOffset are inverses", () => {
    const heading = 0.7;
    const delta = { x: 12, y: -5 };
    const back = applyOffset(
      { x: 0, y: 0 },
      offsetFromHeading(delta, heading),
      heading
    );
    expect(back.x).toBeCloseTo(12, 6);
    expect(back.y).toBeCloseTo(-5, 6);
  });

  test('"right" is the right-hand side of travel on screen (y points down)', () => {
    const p = applyOffset({ x: 0, y: 0 }, { forward: 0, right: 10 }, 0);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(10, 6);
  });

  test("facingRotation turns art to face the heading, allowing for mirroring", () => {
    expect(facingRotation(Math.PI / 2, 0, false)).toBeCloseTo(90, 6);
    expect(facingRotation(0, 0, true)).toBeCloseTo(-180, 6);
  });

  test("svgPathData starts with a move and has one curve per segment", () => {
    const d = svgPathData([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);
    expect(d.startsWith("M 0 0")).toBe(true);
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});
```

## client/src/utils/pathGeometry.ts

```ts
import { PathPoint } from "../types";

type Point = PathPoint;

interface BezierSegment {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
}

export interface PathSample extends Point {
  distance: number;
  // The curve's own direction of travel here, in radians. It is kept continuous from one
  // sample to the next, so it never jumps by a full turn between neighbours.
  angle: number;
}

export interface SampledPath {
  samples: PathSample[];
  length: number;
}

export interface FormationOffset {
  forward: number;
  right: number;
}

const RAD_TO_DEG = 180 / Math.PI;

// A smooth curve through every waypoint (Catmull-Rom, expressed as cubic Bezier segments)
export function buildSegments(points: Point[]): BezierSegment[] {
  if (points.length < 2) return [];
  const segments: BezierSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const before = points[i - 1] ?? p0;
    const after = points[i + 2] ?? p1;
    segments.push({
      p0,
      c1: { x: p0.x + (p1.x - before.x) / 6, y: p0.y + (p1.y - before.y) / 6 },
      c2: { x: p1.x - (after.x - p0.x) / 6, y: p1.y - (after.y - p0.y) / 6 },
      p1,
    });
  }
  return segments;
}

// The curve as an SVG path string, for drawing on the map
export function svgPathData(points: Point[]): string {
  const segments = buildSegments(points);
  if (segments.length === 0) return "";
  let d = `M ${segments[0].p0.x} ${segments[0].p0.y}`;
  for (const s of segments) {
    d += ` C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.p1.x} ${s.p1.y}`;
  }
  return d;
}

function bezierPoint(s: BezierSegment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
  };
}

function bezierTangent(s: BezierSegment, t: number): Point {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const c = 3 * t * t;
  return {
    x: a * (s.c1.x - s.p0.x) + b * (s.c2.x - s.c1.x) + c * (s.p1.x - s.c2.x),
    y: a * (s.c1.y - s.p0.y) + b * (s.c2.y - s.c1.y) + c * (s.p1.y - s.c2.y),
  };
}

export function samplePath(points: Point[], stepsPerSegment = 40): SampledPath {
  const segments = buildSegments(points);
  if (segments.length === 0) {
    return points.length === 1
      ? { samples: [{ ...points[0], distance: 0, angle: 0 }], length: 0 }
      : { samples: [], length: 0 };
  }

  // The curve's own direction of travel at a point, kept continuous from sample to sample
  let lastAngle: number | null = null;
  const angleAt = (segment: BezierSegment, t: number): number => {
    const tangent = bezierTangent(segment, t);
    const along =
      Math.hypot(tangent.x, tangent.y) < 1e-9
        ? { x: segment.p1.x - segment.p0.x, y: segment.p1.y - segment.p0.y }
        : tangent;
    const raw = Math.atan2(along.y, along.x);
    lastAngle =
      lastAngle === null
        ? raw
        : lastAngle +
          Math.atan2(Math.sin(raw - lastAngle), Math.cos(raw - lastAngle));
    return lastAngle;
  };

  const samples: PathSample[] = [
    { ...segments[0].p0, distance: 0, angle: angleAt(segments[0], 0) },
  ];
  let total = 0;
  for (const segment of segments) {
    let prev = segment.p0;
    for (let step = 1; step <= stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const p = bezierPoint(segment, t);
      total += Math.hypot(p.x - prev.x, p.y - prev.y);
      samples.push({ ...p, distance: total, angle: angleAt(segment, t) });
      prev = p;
    }
  }
  return { samples, length: total };
}

export function pointAtDistance(path: SampledPath, distance: number): Point {
  const { samples, length } = path;
  if (samples.length === 0) return { x: 0, y: 0 };
  if (samples.length === 1 || length === 0)
    return { x: samples[0].x, y: samples[0].y };

  const d = Math.min(Math.max(distance, 0), length);
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = b.distance - a.distance;
  const t = span === 0 ? 0 : (d - a.distance) / span;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Direction of travel in radians (0 = right, π/2 = down) at a distance along the path,
// taken from the curve's own tangent so it changes smoothly instead of in steps
export function headingAtDistance(path: SampledPath, distance: number): number {
  const { samples, length } = path;
  if (samples.length === 0) return 0;
  if (samples.length === 1 || length === 0) return samples[0].angle;

  const d = Math.min(Math.max(distance, 0), length);
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = b.distance - a.distance;
  const t = span === 0 ? 0 : (d - a.distance) / span;
  return a.angle + (b.angle - a.angle) * t;
}

// Where a point sits relative to a centre, measured along and to the right of a heading
export function offsetFromHeading(
  delta: Point,
  heading: number
): FormationOffset {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  return {
    forward: delta.x * fx + delta.y * fy,
    right: -delta.x * fy + delta.y * fx,
  };
}

// The inverse: the map position of a formation slot for a given centre and heading
export function applyOffset(
  base: Point,
  offset: FormationOffset,
  heading: number
): Point {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  return {
    x: base.x + offset.forward * fx - offset.right * fy,
    y: base.y + offset.forward * fy + offset.right * fx,
  };
}

// The rotation (degrees, as used by unit.rotation) that makes a unit's art face the heading.
// A mirrored unit's front points the opposite way horizontally, so its facing flips too.
export function facingRotation(
  heading: number,
  forwardAngleDeg: number,
  flipped: boolean
): number {
  const effectiveForward = flipped ? 180 - forwardAngleDeg : forwardAngleDeg;
  return heading * RAD_TO_DEG - effectiveForward;
}

export interface NearestOnPath {
  point: Point;
  // The segment (between waypoint i and i + 1) the nearest point lies on
  segmentIndex: number;
  // Straight-line distance from the target to that point
  distance: number;
}

// The closest point on the curve to a target, and which segment it belongs to,
// so a new waypoint can be inserted in the right place in the list
export function nearestOnPath(
  points: Point[],
  target: Point,
  stepsPerSegment = 200
): NearestOnPath | null {
  const { samples } = samplePath(points, stepsPerSegment);
  if (samples.length < 2) return null;

  let bestIndex = 0;
  let bestDistance = Infinity;
  samples.forEach((sample, i) => {
    const d = Math.hypot(sample.x - target.x, sample.y - target.y);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  });

  // Sample 0 is the start; samples 1..N belong to segment 0, N+1..2N to segment 1, and so on
  const segmentIndex = Math.min(
    Math.max(Math.ceil(bestIndex / stepsPerSegment) - 1, 0),
    points.length - 2
  );
  return {
    point: { x: samples[bestIndex].x, y: samples[bestIndex].y },
    segmentIndex,
    distance: bestDistance,
  };
}

export interface Chevron {
  x: number;
  y: number;
  heading: number; // radians, direction of travel
}

// Evenly spaced direction markers along a path, kept away from the very ends.
// Spacing is in map units; maxCount stops a very long path drawing hundreds.
export function chevronsAlong(
  points: Point[],
  spacing: number,
  maxCount = 150
): Chevron[] {
  const path = samplePath(points);
  if (path.length === 0 || spacing <= 0) return [];

  const count = Math.min(
    Math.max(Math.floor(path.length / spacing), 1),
    maxCount
  );
  const step = path.length / count;
  const chevrons: Chevron[] = [];
  for (let i = 0; i < count; i++) {
    const distance = (i + 0.5) * step;
    const p = pointAtDistance(path, distance);
    chevrons.push({
      x: p.x,
      y: p.y,
      heading: headingAtDistance(path, distance),
    });
  }
  return chevrons;
}

export interface TravelSideChange {
  distance: number;
  right: boolean;
}

// Whether a path is heading right or left across the screen, decided once for the whole
// path and stored as the distances where it changes. Small wobbles around vertical are
// ignored (dead zone), so a unit that must stay upright doesn't flicker back and forth,
// and the answer for a given distance never depends on how you got there.
export function buildTravelSides(
  path: SampledPath,
  deadZone = 0.35
): TravelSideChange[] {
  const { samples } = path;
  if (samples.length === 0) return [{ distance: 0, right: true }];

  const changes: TravelSideChange[] = [];
  let current: boolean | null = null;
  for (const sample of samples) {
    const across = Math.cos(headingAtDistance(path, sample.distance));
    if (current === null) {
      current = across >= 0;
      changes.push({ distance: 0, right: current });
    } else if (current && across < -deadZone) {
      current = false;
      changes.push({ distance: sample.distance, right: false });
    } else if (!current && across > deadZone) {
      current = true;
      changes.push({ distance: sample.distance, right: true });
    }
  }
  return changes;
}

export function travelSideAt(
  changes: TravelSideChange[],
  distance: number
): boolean {
  let right = changes[0]?.right ?? true;
  for (const change of changes) {
    if (change.distance <= distance) right = change.right;
    else break;
  }
  return right;
}
```

## client/src/utils/pathHeading.test.ts

```ts
import { headingAtDistance, samplePath } from "./pathGeometry";

const bend = samplePath([
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
]);

test("the heading at a waypoint is the curve's own tangent", () => {
  // The curve passes through the middle waypoint heading the way the next waypoint lies from
  // the previous one: down and to the right, 45°. Sample 40 is that waypoint.
  expect(headingAtDistance(bend, bend.samples[40].distance)).toBeCloseTo(
    Math.PI / 4,
    6
  );
});

test("the heading does not jump across a waypoint", () => {
  const at = bend.samples[40].distance;
  const before = headingAtDistance(bend, at - 0.01);
  const after = headingAtDistance(bend, at + 0.01);
  expect(Math.abs(after - before)).toBeLessThan(0.002);
});
```

## client/src/utils/pathPhases.test.ts

```ts
import { MapPath, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { createPlayback, easeTravel, PlaybackState } from "./pathPlayback";

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
  ...extra,
});

function pathFor(points: PathPoint[], units: Unit[]): MapPath {
  const attachment = attachUnits(
    { id: "p", name: "Path 1", points, assignments: [] },
    units
  )!;
  return { id: "p", name: "Path 1", ...attachment };
}

// Two units side by side, facing north, centred on (50, 100), with a route due east
const row = () => [unit("a", 30, 100), unit("b", 70, 100)];
const east = [
  { x: 0, y: 100 },
  { x: 1000, y: 100 },
];

function expectSame(
  a: Map<string, PlaybackState>,
  b: Map<string, PlaybackState>
) {
  expect(Array.from(a.keys())).toEqual(Array.from(b.keys()));
  a.forEach((state, id) => {
    const other = b.get(id)!;
    expect(state.x).toBeCloseTo(other.x, 6);
    expect(state.y).toBeCloseTo(other.y, 6);
    expect(state.rotation).toBeCloseTo(other.rotation, 6);
    expect(state.flipped).toBe(other.flipped);
  });
}

test("a playback read by phase agrees with the same moment read by overall progress", () => {
  const units = row();
  const playback = createPlayback(pathFor(east, units), units);

  expect(playback.pivotLength).toBeCloseTo(150, 6);
  expect(playback.routeLength).toBeCloseTo(950, 6);
  expect(playback.length).toBeCloseTo(1100, 6);

  // Halfway through the turn, then halfway through the travel
  expectSame(
    playback.stateAtPhase(0.5, 0),
    playback.stateAt(75 / playback.length)
  );
  expectSame(
    playback.stateAtPhase(1, 0.5),
    playback.stateAt((150 + 475) / playback.length)
  );
  expectSame(playback.stateAtPhase(1, 1), playback.stateAt(1));
});

test("nobody moves until the turn is done, then the travel eases in", () => {
  const units = row();
  const playback = createPlayback(pathFor(east, units), units);

  // Still turning: travel is ignored, so they're where they were placed, half turned
  const turning = playback.stateAtPhase(0.5, 0.7);
  expect(turning.get("a")!.x).toBeCloseTo(30, 6);
  expect(turning.get("a")!.rotation).toBeCloseTo(45, 6);

  // Turned and 5% into the travel: still setting off gently
  const settingOff = playback.stateAtPhase(1, 0.05);
  expect(settingOff.get("a")!.x).toBeCloseTo(30 + 950 * easeTravel(0.05), 6);
  expect(settingOff.get("a")!.rotation).toBeCloseTo(90, 6);

  // Units already facing the way they go have nothing to turn, so they travel at once
  const facingEast = [unit("e", 0, 50, { rotation: 90 })];
  const straight = createPlayback(
    pathFor(
      [
        { x: 0, y: 50 },
        { x: 1000, y: 50 },
      ],
      facingEast
    ),
    facingEast
  );
  expect(straight.pivotLength).toBe(0);
  expect(straight.stateAtPhase(0, 0.5).get("e")!.x).toBeCloseTo(500, 6);
});
```

## client/src/utils/pathPlayback.test.ts

```ts
import { MapPath, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { facingRotation, headingAtDistance, samplePath } from "./pathGeometry";
import {
  artFacesRight,
  createPlayback,
  PIVOT_DEGREES_PER_UNIT,
  playbackLength,
  playbackState,
  PlaybackState,
  easeTravel,
} from "./pathPlayback";
import { normalizeDegrees } from "./unitFacing";

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
  ...extra,
});

// A path with the given units attached, so its start sits at the units' centre.
// By default the formation is kept as placed; `wheel` makes the group turn with its units.
function pathFor(points: PathPoint[], units: Unit[], wheel = false): MapPath {
  const attachment = attachUnits(
    {
      id: "p",
      name: "Path 1",
      points,
      assignments: [],
      direction: wheel ? 0 : undefined,
    },
    units
  )!;
  return { id: "p", name: "Path 1", ...attachment };
}

const pair = () => [unit("a", 50, 20), unit("b", 50, -20)];
const east = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
];

// Two units side by side (40 apart), facing north, centred on (50, 100)
const row = () => [unit("a", 30, 100), unit("b", 70, 100)];

// The angle of the line from unit a to unit b: 0 when they stand side by side facing north,
// 90 once the block has turned to face east
const blockAngle = (state: Map<string, PlaybackState>) =>
  (Math.atan2(
    state.get("b")!.y - state.get("a")!.y,
    state.get("b")!.x - state.get("a")!.x
  ) *
    180) /
  Math.PI;

test("at the start of the path every unit is exactly where it was placed", () => {
  const units = pair();
  const state = playbackState(pathFor(east, units), units, 0);

  expect(state.get("a")!.x).toBeCloseTo(50, 6);
  expect(state.get("a")!.y).toBeCloseTo(20, 6);
  expect(state.get("b")!.x).toBeCloseTo(50, 6);
  expect(state.get("b")!.y).toBeCloseTo(-20, 6);
});

test("a group heading the way it faces moves as a rigid block", () => {
  const units = row();
  // The route runs due north from the formation centre
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 50, y: -300 },
    ],
    units
  );
  const state = playbackState(path, units, 0.5);

  expect(state.get("a")!.x).toBeCloseTo(30, 5);
  expect(state.get("a")!.y).toBeCloseTo(-100, 5);
  expect(state.get("b")!.x).toBeCloseTo(70, 5);
  expect(state.get("b")!.y).toBeCloseTo(-100, 5);
});

test("units turn on the spot to face the path, then set off with the formation unchanged", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );
  const total = playbackLength(path, units);
  const at = (elapsed: number) => playbackState(path, units, elapsed / total);

  // 150 to turn (90° at 0.6° per unit), then 950 along the route
  expect(total).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT + 950, 3);

  // While turning, nobody moves and each unit turns on the spot
  for (const elapsed of [0, 40, 75, 140]) {
    const state = at(elapsed);
    expect(state.get("a")!.x).toBeCloseTo(30, 5);
    expect(state.get("a")!.y).toBeCloseTo(100, 5);
    expect(state.get("b")!.x).toBeCloseTo(70, 5);
    expect(state.get("a")!.rotation).toBeCloseTo(
      elapsed * PIVOT_DEGREES_PER_UNIT,
      4
    );
    expect(state.get("b")!.rotation).toBeCloseTo(
      elapsed * PIVOT_DEGREES_PER_UNIT,
      4
    );
  }

  // Facing the path, they set off (gently at first) with the formation exactly as placed
  const travelled = 950 * easeTravel(10 / 950);
  const moving = at(160);
  expect(moving.get("a")!.x).toBeCloseTo(30 + travelled, 2);
  expect(moving.get("b")!.x).toBeCloseTo(70 + travelled, 2);
  expect(moving.get("a")!.y).toBeCloseTo(100, 5);
  expect(moving.get("a")!.rotation).toBeCloseTo(90, 3);

  const end = at(total);
  expect(end.get("a")!.x).toBeCloseTo(980, 3);
  expect(end.get("b")!.x).toBeCloseTo(1020, 3);
});

test("units placed in a line across the path stay in that line while they turn and travel", () => {
  // A north-south line of two units, facing north, with an east-bound route
  const units = [unit("a", 50, 80), unit("b", 50, 120)];
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );

  for (const progress of [0, 0.05, 0.1, 0.5, 1]) {
    const state = playbackState(path, units, progress);
    expect(state.get("a")!.x).toBeCloseTo(state.get("b")!.x, 5); // side by side across the route
    expect(state.get("b")!.y - state.get("a")!.y).toBeCloseTo(40, 5);
  }
});

test("a group that turns with its units pivots as a block, then sets off", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units,
    true
  );
  const total = playbackLength(path, units);
  const at = (elapsed: number) => playbackState(path, units, elapsed / total);

  expect(total).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT + 950, 3);

  // While pivoting, the centre never moves and the units turn with the block
  for (const elapsed of [0, 40, 75, 140]) {
    const state = at(elapsed);
    const a = state.get("a")!;
    const b = state.get("b")!;
    expect((a.x + b.x) / 2).toBeCloseTo(50, 5);
    expect((a.y + b.y) / 2).toBeCloseTo(100, 5);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(40, 5);
    expect(a.rotation).toBeCloseTo(elapsed * PIVOT_DEGREES_PER_UNIT, 4);
  }
  expect(blockAngle(at(0))).toBeCloseTo(0, 4); // side by side, facing north
  expect(blockAngle(at(75))).toBeCloseTo(45, 3); // halfway through the pivot

  // Now facing the path, it sets off with the block facing east
  const moving = at(160);
  expect(blockAngle(moving)).toBeCloseTo(90, 3);
  expect((moving.get("a")!.x + moving.get("b")!.x) / 2).toBeCloseTo(
    50 + 950 * easeTravel(10 / 950),
    2
  );

  const end = at(total);
  expect(end.get("a")!.x).toBeCloseTo(1000, 3);
  expect(end.get("a")!.y).toBeCloseTo(80, 3);
  expect(end.get("b")!.y).toBeCloseTo(120, 3);
});

test("a turning group pivots about its centre, and units that don't turn keep their rotation", () => {
  const units = [
    unit("army", 50, 20),
    unit("ship", 50, -20, { travelMode: "upright", forwardAngle: 0 }),
  ];
  const path = pathFor(east, units, true);
  const total = playbackLength(path, units);
  const state = playbackState(path, units, 75 / total);
  const army = state.get("army")!;
  const ship = state.get("ship")!;

  // Halfway through a 90° pivot the block has turned 45° about the centre, (50, 0)
  expect(ship.x).toBeCloseTo(50 + 20 * Math.SQRT1_2, 4);
  expect(ship.y).toBeCloseTo(-20 * Math.SQRT1_2, 4);
  expect(army.x).toBeCloseTo(50 - 20 * Math.SQRT1_2, 4);
  expect(army.y).toBeCloseTo(20 * Math.SQRT1_2, 4);
  expect(army.rotation).toBeCloseTo(45, 4);
  expect(ship.rotation).toBe(0);
});

test("a very fast pivot rate swings a turning group straight round", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units,
    true
  );

  expect(blockAngle(playbackState(path, units, 0.1, 1000))).toBeCloseTo(90, 3);
});

test("units already facing the way the path leaves do not pivot", () => {
  const facingEast = [unit("a", 0, 50, { rotation: 90 })];
  const path = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    facingEast
  );

  expect(playbackLength(path, facingEast)).toBeCloseTo(
    samplePath(path.points).length,
    4
  );
  expect(playbackState(path, facingEast, 0).get("a")!.rotation).toBeCloseTo(
    90,
    4
  );
  expect(playbackState(path, facingEast, 0.5).get("a")!.rotation).toBeCloseTo(
    90,
    4
  );
});

test("units facing another way pivot to face the path before moving", () => {
  const solo = [unit("a", 0, 50)]; // faces north

  const eastPath = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    solo
  );
  const eastTotal = playbackLength(eastPath, solo);
  const eastPivot = eastTotal - samplePath(eastPath.points).length;
  expect(eastPivot).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT, 3);

  // Halfway through the pivot it has turned 45° and has not moved
  const half = playbackState(eastPath, solo, eastPivot / 2 / eastTotal).get(
    "a"
  )!;
  expect(half.rotation).toBeCloseTo(45, 3);
  expect(half.x).toBeCloseTo(0, 5);
  expect(half.y).toBeCloseTo(50, 5);

  // Heading south from facing north is a half turn
  const southPath = pathFor(
    [
      { x: 0, y: 50 },
      { x: 0, y: 1000 },
    ],
    solo
  );
  const southPivot =
    playbackLength(southPath, solo) - samplePath(southPath.points).length;
  expect(southPivot).toBeCloseTo(180 / PIVOT_DEGREES_PER_UNIT, 3);
  expect(
    Math.abs(
      normalizeDegrees(playbackState(southPath, solo, 1).get("a")!.rotation)
    )
  ).toBeCloseTo(180, 3);
});

test("after the pivot, turning units face the path's heading exactly, round bends too", () => {
  const solo = [unit("a", 50, 0)];
  const path = pathFor(
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ],
    solo
  );
  const sampled = samplePath(path.points);
  const total = playbackLength(path, solo);
  const pivotLength = total - sampled.length;

  // `t` is how far into the travelling we are. The march speeds up and slows down, so the
  // distance it has covered by then is eased.
  for (const t of [0, 30, 60, 100, sampled.length]) {
    const state = playbackState(path, solo, (pivotLength + t) / total).get(
      "a"
    )!;
    const travelled = sampled.length * easeTravel(t / sampled.length);
    const expected = facingRotation(
      headingAtDistance(sampled, travelled),
      -90,
      false
    );
    expect(normalizeDegrees(state.rotation - expected)).toBeCloseTo(0, 4);
  }
});

test("units in Upright mode keep their rotation and mirror to face left or right", () => {
  const ship = (extra: Partial<Unit> = {}) =>
    unit("s", 150, 0, { travelMode: "upright", forwardAngle: 0, ...extra });

  const eastBound = [ship()];
  const eastState = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ],
      eastBound
    ),
    eastBound,
    0.5
  ).get("s")!;
  expect(eastState.flipped).toBe(false);
  expect(eastState.rotation).toBe(0);

  const westBound = [ship()];
  const westState = playbackState(
    pathFor(
      [
        { x: 300, y: 0 },
        { x: 0, y: 0 },
      ],
      westBound
    ),
    westBound,
    0.5
  ).get("s")!;
  expect(westState.flipped).toBe(true);
  expect(westState.rotation).toBe(0);

  // Art drawn facing left needs mirroring to travel east
  const leftFacing = [ship({ forwardAngle: 180 })];
  const leftState = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ],
      leftFacing
    ),
    leftFacing,
    0.5
  ).get("s")!;
  expect(leftState.flipped).toBe(true);
});

test("units in Fixed mode never turn or mirror", () => {
  const fixed = [
    unit("f", 0, 50, { travelMode: "fixed", rotation: 30, flipped: true }),
  ];
  const state = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 0, y: 200 },
      ],
      fixed
    ),
    fixed,
    0.5
  ).get("f")!;

  expect(state.rotation).toBe(30);
  expect(state.flipped).toBe(true);
});

test("progress outside 0 to 1 is clamped to the ends of the run", () => {
  const units = pair();
  const path = pathFor(east, units);

  expect(playbackState(path, units, -3).get("a")).toEqual(
    playbackState(path, units, 0).get("a")
  );
  expect(playbackState(path, units, 7).get("a")).toEqual(
    playbackState(path, units, 1).get("a")
  );
});

test("units that no longer exist are skipped", () => {
  const units = pair();
  const path = pathFor(east, units);

  expect(Array.from(playbackState(path, [units[0]], 0.5).keys())).toEqual([
    "a",
  ]);
});

test("artFacesRight tells which side the unmirrored art faces", () => {
  expect(artFacesRight(0)).toBe(true);
  expect(artFacesRight(180)).toBe(false);
  expect(artFacesRight(-135)).toBe(false);
  expect(artFacesRight(-90)).toBe(true);
  expect(artFacesRight(90)).toBe(true);
});

test("a prepared playback gives the same answers as one-off calls", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );
  const playback = createPlayback(path, units);

  expect(playback.length).toBeCloseTo(playbackLength(path, units), 10);
  for (const progress of [0, 0.07, 0.5, 1]) {
    expect(playback.stateAt(progress)).toEqual(
      playbackState(path, units, progress)
    );
  }
});

test("a march speeds up over its first 10% and slows down over its last 10%", () => {
  expect(easeTravel(0)).toBe(0);
  expect(easeTravel(1)).toBe(1);
  expect(easeTravel(0.5)).toBeCloseTo(0.5, 10);

  // Slow at the start: after 5% of the time it has covered well under 5% of the way
  expect(easeTravel(0.05)).toBeLessThan(0.02);
  // The end mirrors the start
  for (const u of [0.02, 0.07, 0.3]) {
    expect(easeTravel(u) + easeTravel(1 - u)).toBeCloseTo(1, 10);
  }
  // Steady in the middle, a little quicker than average to make up for the gentle ends
  expect(easeTravel(0.6) - easeTravel(0.5)).toBeCloseTo(0.1 / 0.9, 10);
  // Never goes backwards
  let previous = 0;
  for (let u = 0; u <= 1.0001; u += 0.01) {
    const s = easeTravel(u);
    expect(s).toBeGreaterThanOrEqual(previous - 1e-12);
    previous = s;
  }
});

test("a march sets off gently, keeps a steady pace, and settles exactly at its end", () => {
  const solo = [unit("a", 0, 50, { rotation: 90 })]; // already facing east, so no turning
  const path = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    solo
  );
  const x = (progress: number) =>
    playbackState(path, solo, progress).get("a")!.x;

  expect(x(0.01)).toBeLessThan(2); // barely moving yet
  expect(x(0.6) - x(0.5)).toBeCloseTo(x(0.5) - x(0.4), 6); // steady in the middle
  expect(x(0.99)).toBeGreaterThan(998); // almost stopped near the end
  expect(x(1)).toBeCloseTo(1000, 6);
});
```

## client/src/utils/pathPlayback.ts

```ts
import { MapPath, Unit } from "../types";
import {
  applyOffset,
  buildTravelSides,
  facingRotation,
  headingAtDistance,
  pointAtDistance,
  samplePath,
  travelSideAt,
} from "./pathGeometry";
import { normalizeDegrees, unitFacing } from "./unitFacing";

export interface PlaybackState {
  x: number;
  y: number;
  rotation: number;
  flipped: boolean;
}

// How fast the group pivots on the spot before it sets off, in degrees of turn per map unit
// of playback. 0.6 means a quarter turn takes 150 units (1.5 seconds at 1x). Lower is slower.
export const PIVOT_DEGREES_PER_UNIT = 0.6;

// How much of each march's travelling time is spent speeding up at the start, and the same
// again slowing down at the end
export const EASE_FRACTION = 0.1;

// How far along the route (0 to 1) a march is after `fraction` (0 to 1) of its travelling time.
// Speed builds up evenly over the first 10%, holds steady, and eases off evenly over the last
// 10%. The total time doesn't change: the steady part is a little quicker to make up for it.
export function easeTravel(
  fraction: number,
  ramp: number = EASE_FRACTION
): number {
  const u = Math.min(Math.max(fraction, 0), 1);
  if (ramp <= 0) return u;
  const a = Math.min(ramp, 0.5);
  const top = 1 / (1 - a); // the steady speed, as a share of the average
  if (u < a) return (top * u * u) / (2 * a);
  if (u <= 1 - a) return top * (u - a / 2);
  return 1 - (top * (1 - u) * (1 - u)) / (2 * a);
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// Whether the art's own front points right (rather than left) when unmirrored.
// Art that faces straight up or down has no side and counts as facing right.
export function artFacesRight(forwardAngleDeg: number): boolean {
  return Math.cos((forwardAngleDeg * Math.PI) / 180) > -1e-9;
}

interface Pivot {
  groupFacing: number; // degrees: the way the group faces at rest
  frameTurn: number; // degrees the block must turn to face the path's start heading
  unitTurns: Map<string, number>; // degrees each unit that turns to face travel must turn
  largest: number; // degrees: the biggest of all those turns
  length: number; // how long the pivot lasts, in map units of playback
}

// The turn the group makes on the spot before it sets off. Each turn-mode unit turns until it
// faces the path's start heading, and a group that turns with its units rotates as a block
// too. A group that keeps its formation as placed has no direction, so only the units turn.
// The pivot lasts until the last of them has finished.
function pivotFor(
  path: MapPath,
  units: Unit[],
  startHeading: number,
  rate: number
): Pivot {
  const startHeadingDeg = startHeading * RAD_TO_DEG;
  const groupFacing = path.direction ?? startHeadingDeg;
  const frameTurn = normalizeDegrees(startHeadingDeg - groupFacing);

  const byId = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );
  const unitTurns = new Map<string, number>();
  let largest = Math.abs(frameTurn);

  for (const slot of path.assignments) {
    const unit = byId.get(slot.unitId);
    if (!unit) continue;
    const { forwardAngle, travelMode } = unitFacing(unit);
    if (travelMode !== "rotate") continue;
    const turn = normalizeDegrees(
      facingRotation(startHeading, forwardAngle, !!unit.flipped) - unit.rotation
    );
    unitTurns.set(unit.id, turn);
    largest = Math.max(largest, Math.abs(turn));
  }

  return {
    groupFacing,
    frameTurn,
    unitTurns,
    largest,
    length: largest < 1e-6 ? 0 : largest / rate,
  };
}

export interface Playback {
  length: number; // the whole run in map units of playback: the turn, then the route
  pivotLength: number; // the turn's part of that
  routeLength: number; // the route's part of that
  // By overall progress through the run (0 to 1), the turn and route each getting their
  // natural share of it
  stateAt: (progress: number) => Map<string, PlaybackState>;
  // By phase: how far through the turn (0 to 1) and how far through the travel (0 to 1).
  // Until the turn is finished nobody moves, whatever `travel` says.
  stateAtPhase: (turn: number, travel: number) => Map<string, PlaybackState>;
}

// Does all the work that doesn't depend on how far through the run we are (sampling the path,
// working out the pivot and which way the path heads) once, so showing a frame is cheap.
// Build one per path and reuse it for every frame.
//
// A run is a pivot on the spot (the group does not move), then the journey, where the
// formation and turning units follow the path's heading exactly, easing in and out.
export function createPlayback(
  path: MapPath,
  units: Unit[],
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): Playback {
  const sampled = samplePath(path.points);
  if (sampled.samples.length === 0) {
    const empty = () => new Map<string, PlaybackState>();
    return {
      length: 0,
      pivotLength: 0,
      routeLength: 0,
      stateAt: empty,
      stateAtPhase: empty,
    };
  }

  const startHeading = headingAtDistance(sampled, 0);
  const pivot = pivotFor(path, units, startHeading, pivotRate);
  const travelSides = buildTravelSides(sampled);
  const total = pivot.length + sampled.length;

  const byId = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );
  const members = path.assignments.flatMap((slot) => {
    const unit = byId.get(slot.unitId);
    return unit ? [{ slot, unit, ...unitFacing(unit) }] : [];
  });

  const stateAtPhase = (
    turn: number,
    travel: number
  ): Map<string, PlaybackState> => {
    const result = new Map<string, PlaybackState>();

    const isPivoting = pivot.length > 0 && turn < 1;
    const turnedSoFar = isPivoting ? clamp01(turn) * pivot.largest : Infinity; // degrees
    const turnBy = (needed: number) =>
      Math.sign(needed) * Math.min(Math.abs(needed), turnedSoFar);

    // Once facing the right way, the march sets off gently, holds a steady pace, and slows
    // to a stop at the end of the route
    const distance =
      isPivoting || sampled.length === 0
        ? 0
        : sampled.length * easeTravel(travel);

    const centre = pointAtDistance(sampled, distance);
    const heading = headingAtDistance(sampled, distance);
    const travellingRight = travelSideAt(travelSides, distance);

    // The formation turns on the spot, then follows the path's heading exactly
    const frame = isPivoting
      ? (pivot.groupFacing + turnBy(pivot.frameTurn)) * DEG_TO_RAD
      : heading;

    for (const { slot, unit, forwardAngle, travelMode } of members) {
      const position = applyOffset(centre, slot, frame);

      let rotation = unit.rotation;
      let flipped = !!unit.flipped;
      if (travelMode === "rotate") {
        rotation = isPivoting
          ? unit.rotation + turnBy(pivot.unitTurns.get(unit.id) ?? 0)
          : facingRotation(heading, forwardAngle, flipped);
      } else if (travelMode === "upright") {
        flipped = artFacesRight(forwardAngle) !== travellingRight;
      }

      result.set(unit.id, { x: position.x, y: position.y, rotation, flipped });
    }
    return result;
  };

  const stateAt = (progress: number): Map<string, PlaybackState> => {
    const elapsed = clamp01(progress) * total;
    return stateAtPhase(
      pivot.length > 0 ? elapsed / pivot.length : 1,
      sampled.length > 0 ? (elapsed - pivot.length) / sampled.length : 1
    );
  };

  return {
    length: total,
    pivotLength: pivot.length,
    routeLength: sampled.length,
    stateAt,
    stateAtPhase,
  };
}

// How long a whole run takes, in map units of playback
export function playbackLength(
  path: MapPath,
  units: Unit[],
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): number {
  return createPlayback(path, units, pivotRate).length;
}

// One-off version of createPlayback(...).stateAt(...), for tests and one-time use
export function playbackState(
  path: MapPath,
  units: Unit[],
  progress: number,
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): Map<string, PlaybackState> {
  return createPlayback(path, units, pivotRate).stateAt(progress);
}
```

## client/src/utils/portraitCircle.ts

```ts
export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

const MIN_RADIUS = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function defaultCircle(size: ImageSize): Circle {
  return {
    cx: size.width / 2,
    cy: size.height / 2,
    r: (Math.min(size.width, size.height) / 2) * 0.8,
  };
}

// Moving keeps the radius and stops the circle leaving the image
export function moveCircle(
  origin: Circle,
  dx: number,
  dy: number,
  size: ImageSize
): Circle {
  return {
    ...origin,
    cx: clamp(origin.cx + dx, origin.r, size.width - origin.r),
    cy: clamp(origin.cy + dy, origin.r, size.height - origin.r),
  };
}

// Resizing keeps the centre and stops the circle growing past an image edge
export function resizeCircle(
  origin: Circle,
  distance: number,
  size: ImageSize
): Circle {
  const maxR = Math.min(
    origin.cx,
    size.width - origin.cx,
    origin.cy,
    size.height - origin.cy
  );
  return { ...origin, r: clamp(distance, Math.min(MIN_RADIUS, maxR), maxR) };
}
```

## client/src/utils/portraitRender.ts

```ts
import { Circle } from "./portraitCircle";
import { RgbColor } from "../types";

const MAX_OUTPUT = 1024;

export function renderPortraitBlob(
  image: HTMLImageElement,
  circle: Circle,
  ringColour: RgbColor | null,
  ringPercent: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const diameter = Math.max(1, Math.round(circle.r * 2));
    const outSize = Math.min(diameter, MAX_OUTPUT);

    const canvas = document.createElement("canvas");
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    // Cut the image out to a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      circle.cx - circle.r,
      circle.cy - circle.r,
      circle.r * 2,
      circle.r * 2,
      0,
      0,
      outSize,
      outSize
    );
    ctx.restore();

    // Faction ring, drawn just inside the edge
    if (ringColour) {
      const ringWidth = (outSize / 2) * (ringPercent / 100);
      ctx.beginPath();
      ctx.arc(
        outSize / 2,
        outSize / 2,
        outSize / 2 - ringWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.lineWidth = ringWidth;
      ctx.strokeStyle = `rgb(${ringColour.r}, ${ringColour.g}, ${ringColour.b})`;
      ctx.stroke();
    }

    try {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch (error) {
      console.error("Failed to render portrait (CORS?):", error);
      resolve(null);
    }
  });
}
```

## client/src/utils/recolour.ts

```ts
import { RgbColor } from "../types";

const TOLERANCE = 48;

export function recolourImageData(
  original: ImageData,
  interior: RgbColor,
  border: RgbColor,
  newFill: RgbColor,
  newStroke: RgbColor
): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(original.data),
    original.width,
    original.height
  );
  const src = original.data;
  const dst = out.data;

  const dr = interior.r - border.r;
  const dg = interior.g - border.g;
  const db = interior.b - border.b;
  const lengthSq = dr * dr + dg * dg + db * db;
  // If interior and border are basically the same colour, treat it as one flat colour.
  const isFlat = lengthSq < 16;

  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue;

    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    let t: number;
    let distance: number;

    if (isFlat) {
      t = 1;
      distance = Math.hypot(r - interior.r, g - interior.g, b - interior.b);
    } else {
      const raw =
        ((r - border.r) * dr + (g - border.g) * dg + (b - border.b) * db) /
        lengthSq;
      t = Math.min(Math.max(raw, 0), 1);
      distance = Math.hypot(
        r - (border.r + t * dr),
        g - (border.g + t * dg),
        b - (border.b + t * db)
      );
    }

    if (distance > TOLERANCE) continue;

    dst[i] = newStroke.r + t * (newFill.r - newStroke.r);
    dst[i + 1] = newStroke.g + t * (newFill.g - newStroke.g);
    dst[i + 2] = newStroke.b + t * (newFill.b - newStroke.b);
  }

  return out;
}
```

## client/src/utils/timeline.test.ts

```ts
import { MapPath, MarchTiming, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { HOUR, MINUTE, toHistoryTime } from "./historyTime";
import { createPlayback, easeTravel } from "./pathPlayback";
import {
  chainedPathIds,
  createTimeline,
  DEFAULT_MARCH_PACE,
  defaultMarch,
  existsAt,
  fitView,
  getTimeline,
  handoverUnits,
  keepAfter,
  MAX_VIEW_DAYS,
  MIN_DEFAULT_MARCH,
  MIN_VIEW_DAYS,
  snapStepFor,
  zoomView,
} from "./timeline";

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
  ...extra,
});

function pathFor(
  id: string,
  points: PathPoint[],
  units: Unit[],
  march?: MarchTiming
): MapPath {
  const attachment = attachUnits(
    { id, name: id, points, assignments: [] },
    units
  )!;
  return { id, name: id, ...attachment, march };
}

// 20 September 1066, midnight
const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

const east = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];
const south = [
  { x: 0, y: 0 },
  { x: 0, y: 1000 },
];

test("a new march lasts as long as its run takes at the default pace, turn included", () => {
  const units = [unit("a", 0, 0)]; // faces north, so it turns 90° (150 of run) to head east
  const playback = createPlayback(pathFor("p", east, units), units);
  const march = defaultMarch(playback, D);

  expect(march.start).toBe(D);
  expect(march.end - D).toBeCloseTo(1150 / DEFAULT_MARCH_PACE, 2); // 11.5 days
  expect(march.turn).toBeCloseTo(1.5, 2);

  // A very short run still lasts a while
  const facingEast = [unit("b", 0, 0, { rotation: 90 })];
  const tiny = createPlayback(
    pathFor(
      "q",
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      facingEast
    ),
    facingEast
  );
  expect(defaultMarch(tiny, D).end - D).toBeCloseTo(MIN_DEFAULT_MARCH, 10);
});

test("a march's dates are used as they are, and the timeline knows when the story's marches begin and end", () => {
  const units = [unit("a", 0, 0)];
  const march = { start: D + 2, end: D + 6, turn: 0.5 };
  const timeline = createTimeline([pathFor("p", east, units, march)], units);

  expect(timeline.timings.get("p")).toEqual(march);
  expect(timeline.start).toBe(D + 2);
  expect(timeline.end).toBe(D + 6);

  const empty = createTimeline([], units);
  expect(empty.start).toBeNull();
  expect(empty.end).toBeNull();
});

test("units wait where they were placed, turn, travel, then stay at the end", () => {
  const units = [unit("a", 0, 0)];
  const timeline = createTimeline(
    [pathFor("p", east, units, { start: D, end: D + 11.5, turn: 1.5 })],
    units
  );

  expect(timeline.stateAt(D - 1).has("a")).toBe(false);

  const turning = timeline.stateAt(D + 0.75).get("a")!;
  expect(turning.x).toBeCloseTo(0, 6);
  expect(turning.rotation).toBeCloseTo(45, 4);

  const halfway = timeline.stateAt(D + 1.5 + 5).get("a")!;
  expect(halfway.x).toBeCloseTo(1000 * easeTravel(0.5), 3);
  expect(halfway.rotation).toBeCloseTo(90, 4);

  expect(timeline.stateAt(D + 20).get("a")!.x).toBeCloseTo(1000, 3);
});

test("a longer turn is a slower turn, and the travel keeps its own share", () => {
  const units = [unit("a", 0, 0)];
  const timeline = createTimeline(
    [pathFor("p", east, units, { start: D, end: D + 13, turn: 3 })],
    units
  );

  expect(timeline.stateAt(D + 1.5).get("a")!.rotation).toBeCloseTo(45, 4);
  expect(timeline.stateAt(D + 3).get("a")!.x).toBeCloseTo(0, 6);
  expect(timeline.stateAt(D + 8).get("a")!.x).toBeCloseTo(
    1000 * easeTravel(0.5),
    3
  );
});

test("when a unit has two marches, the one that started most recently drives it", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("first", east, units, {
    start: D,
    end: D + 11.5,
    turn: 1.5,
  });
  const second = pathFor("second", south, units, {
    start: D + 5,
    end: D + 15,
    turn: 1,
  });
  const timeline = createTimeline([first, second], units);

  // The second picks the unit up where the first had got to on day 5: 35% of the way
  // through its travel
  const pickedUp = 1000 * easeTravel(0.35);
  const atHandover = timeline.stateAt(D + 5).get("a")!;
  expect(atHandover.x).toBeCloseTo(pickedUp, 3);
  expect(atHandover.y).toBeCloseTo(0, 3);

  const end = timeline.stateAt(D + 15).get("a")!;
  expect(end.x).toBeCloseTo(pickedUp, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("a draft timing overrides a stored one for that march only", () => {
  const units = [unit("a", 0, 0), unit("b", 0, 500)];
  const p = pathFor("p", east, [units[0]], { start: D, end: D + 10, turn: 0 });
  const q = pathFor(
    "q",
    east.map((pt) => ({ x: pt.x, y: 500 })),
    [units[1]],
    {
      start: D,
      end: D + 10,
      turn: 0,
    }
  );
  const timeline = createTimeline([p, q], units);

  const draft = new Map([["p", { start: D + 20, end: D + 30, turn: 0 }]]);
  const states = timeline.stateAt(D + 10, draft);
  expect(states.has("a")).toBe(false); // p hasn't started under its draft dates
  expect(states.get("b")!.x).toBeCloseTo(1000, 3);
});

test("paths with no attached units, or no route, are not marches", () => {
  const units = [unit("a", 0, 0)];
  const bare: MapPath = {
    id: "bare",
    name: "bare",
    points: east,
    assignments: [],
  };
  const dot: MapPath = {
    id: "dot",
    name: "dot",
    points: [{ x: 0, y: 0 }],
    assignments: [{ unitId: "a", forward: 0, right: 0 }],
  };
  const timeline = createTimeline([bare, dot], units);
  expect(timeline.timings.size).toBe(0);
});

test("the same paths and units share one built timeline", () => {
  const units = [unit("a", 0, 0)];
  const paths = [pathFor("p", east, units, { start: D, end: D + 1, turn: 0 })];
  expect(getTimeline(paths, units)).toBe(getTimeline(paths, units));
  expect(getTimeline([...paths], units)).not.toBe(getTimeline(paths, units));
});

test("units are handed over where their earlier marches leave them, when the last one ends", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("first", east, units, {
    start: D,
    end: D + 11.5,
    turn: 1.5,
  });
  const handover = handoverUnits([first], units, units);

  expect(handover.time).toBe(D + 11.5);
  expect(handover.units[0].x).toBeCloseTo(1000, 3);
  expect(handover.units[0].rotation).toBeCloseTo(90, 4);

  expect(handoverUnits([], units, units)).toEqual({ units, time: null });
});

test("a march is chained when an earlier one moves any of its units, in date order", () => {
  const units = [unit("a", 0, 0)];
  const early = pathFor("early", east, units, {
    start: D,
    end: D + 2,
    turn: 0,
  });
  const late = pathFor("late", south, units, {
    start: D + 5,
    end: D + 6,
    turn: 0,
  });

  expect(Array.from(chainedPathIds([late, early]))).toEqual(["late"]);

  // Re-dating swaps which one follows the other
  const swapped = { ...early, march: { start: D + 9, end: D + 10, turn: 0 } };
  expect(Array.from(chainedPathIds([late, swapped]))).toEqual(["early"]);

  // Marches that start together chain in list order
  const together = { ...late, march: { start: D, end: D + 1, turn: 0 } };
  expect(Array.from(chainedPathIds([early, together]))).toEqual(["late"]);
});

test("a march can't begin before the story starts: moving shifts it, dragging its start stops", () => {
  const timing = { start: D - 2, end: D + 3, turn: 1 };

  expect(keepAfter(timing, D, true)).toEqual({ start: D, end: D + 5, turn: 1 });
  expect(keepAfter(timing, D, false)).toEqual({
    start: D,
    end: D + 3,
    turn: 1,
  });
  expect(keepAfter({ start: D + 1, end: D + 2, turn: 0 }, D, true).start).toBe(
    D + 1
  );
});

test("a unit exists from when it appears until it leaves", () => {
  expect(existsAt({}, D)).toBe(true);
  expect(existsAt({ appears: D }, D - 1)).toBe(false);
  expect(existsAt({ appears: D }, D)).toBe(true);
  expect(existsAt({ appears: D, leaves: D + 2 }, D + 1)).toBe(true);
  expect(existsAt({ appears: D, leaves: D + 2 }, D + 2)).toBe(false);
});

test("the bar fits the whole story, and zooms about the pointer within limits", () => {
  const fit = fitView(D, D + 100);
  expect(fit.from).toBeLessThan(D);
  expect(fit.to).toBeGreaterThan(D + 100);
  expect(fitView(D, null).to).toBeGreaterThan(D + 7); // at least a week

  // Zooming in about day 50 keeps day 50 where it was on screen
  const view = { from: D, to: D + 100 };
  const zoomed = zoomView(view, D + 50, 0.5);
  expect(zoomed.from).toBeCloseTo(D + 25, 6);
  expect(zoomed.to).toBeCloseTo(D + 75, 6);
  const anchorShare = (D + 30 - view.from) / 100;
  const z2 = zoomView(view, D + 30, 0.1);
  expect((D + 30 - z2.from) / (z2.to - z2.from)).toBeCloseTo(anchorShare, 6);

  expect(zoomView(view, D, 1e-9).to - zoomView(view, D, 1e-9).from).toBeCloseTo(
    MIN_VIEW_DAYS,
    9
  );
  expect(zoomView(view, D, 1e9).to - zoomView(view, D, 1e9).from).toBeCloseTo(
    MAX_VIEW_DAYS,
    3
  );
});

test("dragged dates snap to round steps a few pixels wide", () => {
  expect(snapStepFor(MINUTE / 10)).toBe(MINUTE);
  expect(snapStepFor(HOUR / 100)).toBe(5 * MINUTE);
  expect(snapStepFor(HOUR / 20)).toBe(HOUR);
  expect(snapStepFor(1 / 20)).toBe(1);
  expect(snapStepFor(1)).toBe(7);
  expect(snapStepFor(100)).toBe(30);
});
```

## client/src/utils/timeline.ts

```ts
// The timeline's logic lives in utils/timeline/. This re-exports all of it, so code can keep
// importing from utils/timeline.
//
// - engine: building the timeline of marches and asking it for any moment in history
// - chaining: marches that pick their units up where earlier ones left them
// - view: the stretch of history the timeline bar shows
export {
  DEFAULT_MARCH_PACE,
  MIN_DEFAULT_MARCH,
  UNDATED_START,
  defaultMarch,
  validMarch,
  keepAfter,
  existsAt,
  createTimeline,
  getTimeline,
} from "./timeline/engine";
export type { Timeline } from "./timeline/engine";
export {
  handoverUnits,
  chainedPathIds,
  syncChainedStarts,
} from "./timeline/chaining";
export {
  MIN_VIEW_DAYS,
  MAX_VIEW_DAYS,
  fitView,
  barPlacement,
  viewShowing,
  zoomView,
  snapStepFor,
} from "./timeline/view";
export type { HistoryView, BarPlacement } from "./timeline/view";
```

## client/src/utils/timeline/chaining.ts

```ts
import { MapPath, PathPoint, Unit } from "../../types";
import { HistoryTime } from "../historyTime";
import { createTimeline, getTimeline, isMovement, marchStart } from "./engine";

// Where `selected` units stand once the marches they already belong to have finished, and
// when the last of those ends (null if they have none). Pass the paths *other than* the one
// being attached to. This is how a new march picks its units up where the old ones left them.
export function handoverUnits(
  paths: MapPath[],
  units: Unit[],
  selected: Unit[]
): { units: Unit[]; time: HistoryTime | null } {
  const timeline = createTimeline(paths, units);
  const ids = new Set(selected.map((unit) => unit.id));

  let time: HistoryTime | null = null;
  for (const path of paths) {
    const timing = timeline.timings.get(path.id);
    if (timing && path.assignments.some((a) => ids.has(a.unitId))) {
      time = time === null ? timing.end : Math.max(time, timing.end);
    }
  }
  if (time === null) return { units: selected, time: null };

  const states = timeline.stateAt(time);
  return {
    units: selected.map((unit) => {
      const state = states.get(unit.id);
      return state
        ? {
            ...unit,
            x: state.x,
            y: state.y,
            rotation: state.rotation,
            flipped: state.flipped,
          }
        : unit;
    }),
    time,
  };
}

// The marches that start from wherever an earlier march leaves their units, rather than from
// where the units were placed. Moving the placed units must not drag these.
export function chainedPathIds(paths: MapPath[]): Set<string> {
  const movements = paths.filter(isMovement).map((path, order) => ({
    path,
    order,
    start: marchStart(path),
  }));

  const chained = new Set<string>();
  for (const m of movements) {
    const hasEarlier = movements.some(
      (other) =>
        other !== m &&
        (other.start < m.start ||
          (other.start === m.start && other.order < m.order)) &&
        other.path.assignments.some((a) =>
          m.path.assignments.some((b) => b.unitId === a.unitId)
        )
    );
    if (hasEarlier) chained.add(m.path.id);
  }
  return chained;
}

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

// The army march just before this one: the latest-starting earlier march of the same army
// that has units. Undefined for a march in no army, or an army's first march.
function previousArmyMarch(
  path: MapPath,
  paths: MapPath[]
): MapPath | undefined {
  if (!path.armyId) return undefined;
  const order = (p: MapPath) => paths.indexOf(p);
  const start = marchStart(path);
  let best: MapPath | undefined;
  for (const other of paths) {
    if (other === path || other.armyId !== path.armyId || !isMovement(other))
      continue;
    const otherStart = marchStart(other);
    const earlier =
      otherStart < start ||
      (otherStart === start && order(other) < order(path));
    if (!earlier) continue;
    if (
      !best ||
      otherStart > marchStart(best) ||
      (otherStart === marchStart(best) && order(other) > order(best))
    ) {
      best = other;
    }
  }
  return best;
}

// Where an army's previous march ends: the last point of its route. The army's centre
// follows its route from march to march, so units joining or leaving it along the way never
// move where it goes next. Undefined when the march isn't an army's, or is its army's first.
function armyArrival(path: MapPath, paths: MapPath[]): PathPoint | undefined {
  const previous = previousArmyMarch(path, paths);
  return previous ? previous.points[previous.points.length - 1] : undefined;
}

// Keeps every chained march's start point at the place its units arrive:
// - an army's march starts where the army's previous march ends, so units joining or leaving
//   the army along the way never move it (each unit keeps its own place relative to the route)
// - any other chained march starts at the centre of its units as they stand when it begins
// One march's start can change where the next one's units arrive, so this repeats until
// nothing moves. Returns the same array when nothing needed to change.
export function syncChainedStarts(paths: MapPath[], units: Unit[]): MapPath[] {
  let current = paths;
  for (let pass = 0; pass <= paths.length; pass++) {
    const chained = chainedPathIds(current);
    if (chained.size === 0) break;
    const timeline = getTimeline(current, units);

    let changed = false;
    const next = current.map((path) => {
      const standing = timeline.standing.get(path.id);
      if (!chained.has(path.id) || !standing || standing.length === 0)
        return path;

      const arrival = armyArrival(path, current) ?? {
        x: mean(standing.map((unit) => unit.x)),
        y: mean(standing.map((unit) => unit.y)),
      };
      const start = path.points[0];
      if (Math.hypot(arrival.x - start.x, arrival.y - start.y) < 1e-6)
        return path;

      changed = true;
      return {
        ...path,
        points: [{ x: arrival.x, y: arrival.y }, ...path.points.slice(1)],
      };
    });
    if (!changed) break;
    current = next;
  }
  return current;
}
```

## client/src/utils/timeline/engine.ts

```ts
import { MapPath, Unit } from "../../types";
import { changeFormationMode } from "../formation";
import { HistoryTime, HOUR, MINUTE } from "../historyTime";
import { clampMarch, defaultTurn, MarchTiming, marchPhase } from "../marches";
import { createPlayback, Playback, PlaybackState } from "../pathPlayback";

// How fast a march goes by default, in map units per day, its turn on the spot counted the
// same way. Played at one day per second, a march moves as fast as the path preview at 1x.
export const DEFAULT_MARCH_PACE = 100;

// The shortest a new march is by default
export const MIN_DEFAULT_MARCH = HOUR;

// Where a march with no date sits. The store dates every march when units are attached and
// old projects are dated when they load, so this is only a fallback.
export const UNDATED_START = 0;

// A new march starting at `start`: as long as its run takes at the default pace (to the
// nearest minute), with the turn taking its natural share
export function defaultMarch(
  playback: Playback,
  start: HistoryTime
): MarchTiming {
  const length = Number.isFinite(playback.length) ? playback.length : 0;
  const days = Math.max(
    Math.round(length / DEFAULT_MARCH_PACE / MINUTE) * MINUTE,
    MIN_DEFAULT_MARCH
  );
  const end = start + days;
  const turn = defaultTurn(playback, start, end);
  return clampMarch({ start, end, turn: Number.isFinite(turn) ? turn : 0 });
}

// A march's stored dates, if they are usable. Anything missing or not a real number (which
// would draw nothing and sort unpredictably) counts as no dates.
export function validMarch(
  march: MarchTiming | undefined
): MarchTiming | undefined {
  if (!march) return undefined;
  const { start, end, turn } = march;
  if (![start, end].every(Number.isFinite)) return undefined;
  return clampMarch({ start, end, turn: Number.isFinite(turn) ? turn : 0 });
}

// Keeps a march from starting before `earliest` (the story's start). Moving a whole march
// shifts it; dragging its start just stops there.
export function keepAfter(
  timing: MarchTiming,
  earliest: HistoryTime,
  keepLength: boolean
): MarchTiming {
  if (timing.start >= earliest) return timing;
  if (keepLength) {
    const shift = earliest - timing.start;
    return { ...timing, start: earliest, end: timing.end + shift };
  }
  return clampMarch({ ...timing, start: earliest });
}

// Whether a unit exists at a moment in history
export function existsAt(
  unit: Pick<Unit, "appears" | "leaves">,
  t: HistoryTime
): boolean {
  return (unit.appears ?? -Infinity) <= t && t < (unit.leaves ?? Infinity);
}

// Whether a path is a march: it has units and a route to follow
export const isMovement = (path: MapPath) =>
  path.assignments.length > 0 && path.points.length >= 2;
// When a march begins, or the fallback for one with no usable dates
export const marchStart = (path: MapPath) =>
  validMarch(path.march)?.start ?? UNDATED_START;

interface Movement {
  id: string;
  unitIds: string[];
  playback: Playback;
  timing: MarchTiming;
}

export interface Timeline {
  start: HistoryTime | null; // when the first march begins (null when there are none)
  end: HistoryTime | null; // when the last march ends (null when there are none)
  timings: Map<string, MarchTiming>; // each march's dates
  // Each march's run as it plays (a chained march starts from where its units arrive), for
  // previewing one on its own
  playbacks: Map<string, Playback>;
  // The units of each march as they stand when it begins
  standing: Map<string, Unit[]>;
  // How every unit that has started a march looks at a moment in history. Units that have not
  // started one are left out: they stay where they were placed. `overrides` lets a bar being
  // dragged show its draft dates before they are saved.
  stateAt: (
    time: HistoryTime,
    overrides?: ReadonlyMap<string, MarchTiming>
  ) => Map<string, PlaybackState>;
}

const stateDuring = (
  movement: Movement,
  timing: MarchTiming,
  time: HistoryTime
) => {
  const phase = marchPhase(timing, time);
  return movement.playback.stateAtPhase(phase.turn, phase.travel);
};

// Does the heavy work (sampling every path, working out each pivot) once. Build it when
// paths or units change, then ask it for any moment in history as often as you like.
//
// Marches are built in the order they start, so each can pick its units up where the earlier
// ones left them. A march whose units have marched before is measured from where they stand
// when it begins, not from where they were placed.
export function createTimeline(paths: MapPath[], units: Unit[]): Timeline {
  const placed = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );

  const ordered = paths
    .filter(isMovement)
    .map((path, order) => ({ path, order }))
    .sort(
      (a, b) => marchStart(a.path) - marchStart(b.path) || a.order - b.order
    );

  const movements: Movement[] = [];
  const standing = new Map<string, Unit[]>();

  // Where a unit is at a moment, according to the marches built so far. They are in order of
  // start, so the last one that has begun is the one that most recently started.
  const stateOfBuilt = (
    unitId: string,
    time: HistoryTime
  ): PlaybackState | undefined => {
    for (let i = movements.length - 1; i >= 0; i--) {
      const m = movements[i];
      if (m.timing.start <= time && m.unitIds.includes(unitId)) {
        return stateDuring(m, m.timing, time).get(unitId);
      }
    }
    return undefined;
  };

  for (const { path } of ordered) {
    const start = marchStart(path);

    // The units as they stand when this march begins: wherever the most recent earlier march
    // leaves them, or where they were placed
    const standingUnits: Unit[] = [];
    const arrived: Unit[] = []; // those an earlier march brought here
    for (const slot of path.assignments) {
      const unit = placed.get(slot.unitId);
      if (!unit) continue;
      const state = stateOfBuilt(unit.id, start);
      const standingUnit = state
        ? {
            ...unit,
            x: state.x,
            y: state.y,
            rotation: state.rotation,
            flipped: state.flipped,
          }
        : unit;
      standingUnits.push(standingUnit);
      if (state) arrived.push(standingUnit);
    }

    // The formation is measured from where the units actually are when the march begins, so
    // it never jumps, however the earlier marches are reshaped or re-dated. A formation that
    // turns with its units faces the way the arriving units face, so a unit joining from
    // elsewhere doesn't swing the whole group round.
    const effective: MapPath = {
      ...path,
      ...changeFormationMode(
        path,
        standingUnits,
        path.direction !== undefined ? "wheel" : "keep",
        arrived
      ),
    };
    const playback = createPlayback(effective, standingUnits);
    const timing = validMarch(path.march) ?? defaultMarch(playback, start);

    movements.push({
      id: path.id,
      unitIds: path.assignments.map((a) => a.unitId),
      playback,
      timing,
    });
    standing.set(path.id, standingUnits);
  }

  const timings = new Map<string, MarchTiming>(
    movements.map((m): [string, MarchTiming] => [m.id, m.timing])
  );
  const playbacks = new Map<string, Playback>(
    movements.map((m): [string, Playback] => [m.id, m.playback])
  );
  const first =
    movements.length > 0
      ? Math.min(...movements.map((m) => m.timing.start))
      : null;
  const last =
    movements.length > 0
      ? Math.max(...movements.map((m) => m.timing.end))
      : null;

  const stateAt = (
    time: HistoryTime,
    overrides?: ReadonlyMap<string, MarchTiming>
  ): Map<string, PlaybackState> => {
    // The march that most recently started for a unit is the one that drives it
    const driver = new Map<
      string,
      { movement: Movement; timing: MarchTiming }
    >();
    for (const movement of movements) {
      const timing = overrides?.get(movement.id) ?? movement.timing;
      if (time < timing.start) continue;
      for (const unitId of movement.unitIds) {
        const current = driver.get(unitId);
        if (!current || timing.start >= current.timing.start) {
          driver.set(unitId, { movement, timing });
        }
      }
    }

    // Work out each driving march once, then hand every unit its own state
    const computed = new Map<Movement, Map<string, PlaybackState>>();
    const result = new Map<string, PlaybackState>();
    driver.forEach(({ movement, timing }, unitId) => {
      let states = computed.get(movement);
      if (!states) {
        states = stateDuring(movement, timing, time);
        computed.set(movement, states);
      }
      const state = states.get(unitId);
      if (state) result.set(unitId, state);
    });
    return result;
  };

  return { start: first, end: last, timings, playbacks, standing, stateAt };
}

// The same timeline for the same paths and units, so every component that asks for it
// shares one build
let lastBuild: { paths: MapPath[]; units: Unit[]; timeline: Timeline } | null =
  null;

export function getTimeline(paths: MapPath[], units: Unit[]): Timeline {
  if (lastBuild && lastBuild.paths === paths && lastBuild.units === units) {
    return lastBuild.timeline;
  }
  const timeline = createTimeline(paths, units);
  lastBuild = { paths, units, timeline };
  return timeline;
}
```

## client/src/utils/timeline/view.ts

```ts
import { HistoryTime, HOUR, MINUTE } from "../historyTime";
import { MarchTiming } from "../marches";

// The timeline bar's view of history: which stretch is on show, zooming and panning it, and
// how far dragged dates snap

export interface HistoryView {
  from: HistoryTime;
  to: HistoryTime;
}

export const MIN_VIEW_DAYS = 2 * HOUR;
export const MAX_VIEW_DAYS = 1000 * 365.2425;

// A view that shows the whole story: from its start to the end of the last march (at least a
// week), with a little room either side
export function fitView(
  storyStart: HistoryTime,
  lastEnd: HistoryTime | null
): HistoryView {
  const to = Math.max(lastEnd ?? storyStart, storyStart + 7);
  const pad = (to - storyStart) * 0.04;
  return { from: storyStart - pad, to: to + pad };
}

// Where a march's bar is relative to the stretch of history on show
export type BarPlacement = "before" | "inside" | "after";

export function barPlacement(
  timing: MarchTiming,
  view: HistoryView
): BarPlacement {
  if (timing.end < view.from) return "before";
  if (timing.start > view.to) return "after";
  return "inside";
}

// A view that shows a march: the same zoom, centred on it, or zoomed out just enough to fit it
// with a little room either side if it is longer than the view
export function viewShowing(
  timing: MarchTiming,
  view: HistoryView
): HistoryView {
  const span = Math.max(view.to - view.from, MIN_VIEW_DAYS);
  const length = timing.end - timing.start;
  if (length * 1.2 > span) {
    const pad = Math.max(length * 0.1, MIN_VIEW_DAYS / 2);
    return { from: timing.start - pad, to: timing.end + pad };
  }
  const centre = (timing.start + timing.end) / 2;
  return { from: centre - span / 2, to: centre + span / 2 };
}

// Zooms a view by `factor` (above 1 zooms out) about the moment `anchor`, which stays under
// the pointer
export function zoomView(
  view: HistoryView,
  anchor: HistoryTime,
  factor: number
): HistoryView {
  const span = view.to - view.from;
  const next = Math.min(Math.max(span * factor, MIN_VIEW_DAYS), MAX_VIEW_DAYS);
  const from = anchor - (anchor - view.from) * (next / span);
  return { from, to: from + next };
}

const SNAP_STEPS = [MINUTE, 5 * MINUTE, 15 * MINUTE, HOUR, 6 * HOUR, 1, 7, 30];

// How far dragged dates snap at a zoom level: the finest round step that is at least a few
// pixels wide, so you can always land on any step you can see
export function snapStepFor(daysPerPixel: number): number {
  return (
    SNAP_STEPS.find((step) => step >= daysPerPixel * 6) ??
    SNAP_STEPS[SNAP_STEPS.length - 1]
  );
}
```

## client/src/utils/timelineRows.test.ts

```ts
import {
  groupRows,
  groupKeyOf,
  MarchRow,
  NO_ARMY,
  overlapsView,
  underWay,
} from "./timelineRows";
import { Army, MapPath } from "../types";

const S = 0;

const row = (
  id: string,
  start: number,
  end: number,
  armyId?: string
): MarchRow => ({
  path: { id, name: id, points: [], assignments: [], armyId } as MapPath,
  timing: { start: S + start, end: S + end, turn: 0 },
});

const army = (id: string): Army => ({ id, name: id, members: [] });

const everything = { from: S - 100, to: S + 100 };
const ids = (groups: ReturnType<typeof groupRows>) =>
  groups.map((group) => [group.key, group.rows.map((r) => r.path.id)]);

test("a march is under way from setting off to arriving, ends included", () => {
  const { timing } = row("p", 2, 5);
  expect(underWay(timing, S + 1.9)).toBe(false);
  expect(underWay(timing, S + 2)).toBe(true);
  expect(underWay(timing, S + 5)).toBe(true);
  expect(underWay(timing, S + 5.1)).toBe(false);
});

test("a march overlaps the view if any part of it is on show", () => {
  const { timing } = row("p", 2, 5);
  expect(overlapsView(timing, { from: S + 4, to: S + 10 })).toBe(true);
  expect(overlapsView(timing, { from: S - 10, to: S + 3 })).toBe(true);
  expect(overlapsView(timing, { from: S + 3, to: S + 4 })).toBe(true);
  expect(overlapsView(timing, { from: S + 6, to: S + 10 })).toBe(false);
});

test("groups follow the armies' order, with marches in no army last, earliest first", () => {
  const rows = [
    row("loose", 0, 1),
    row("b2", 8, 9, "B"),
    row("a1", 1, 2, "A"),
    row("b1", 3, 4, "B"),
    row("lost", 5, 6, "gone"), // its army no longer exists
  ];
  const groups = groupRows(
    rows,
    [army("A"), army("B")],
    "all",
    S,
    everything,
    null
  );
  expect(ids(groups)).toEqual([
    ["A", ["a1"]],
    ["B", ["b1", "b2"]],
    [NO_ARMY, ["loose", "lost"]],
  ]);
  expect(groups[1].start).toBe(S + 3);
  expect(groups[1].end).toBe(S + 9);
});

test("armies with no marches get no group", () => {
  const groups = groupRows(
    [row("a1", 0, 1, "A")],
    [army("A"), army("B")],
    "all",
    S,
    everything,
    null
  );
  expect(ids(groups)).toEqual([["A", ["a1"]]]);
});

test("Now lists only the marches under way at the playhead", () => {
  const rows = [row("a1", 0, 4, "A"), row("a2", 4, 8, "A"), row("loose", 6, 9)];
  const groups = groupRows(rows, [army("A")], "now", S + 5, everything, null);
  expect(ids(groups)).toEqual([["A", ["a2"]]]);
  expect(groups[0].total).toBe(2);
});

test("In view lists the marches overlapping the stretch on show", () => {
  const rows = [
    row("a1", 0, 4, "A"),
    row("a2", 4, 8, "A"),
    row("loose", 20, 30),
  ];
  const groups = groupRows(
    rows,
    [army("A")],
    "view",
    S,
    { from: S + 5, to: S + 25 },
    null
  );
  expect(ids(groups)).toEqual([
    ["A", ["a2"]],
    [NO_ARMY, ["loose"]],
  ]);
});

test("the selected march is always listed", () => {
  const rows = [row("a1", 0, 4, "A"), row("loose", 20, 30)];
  const groups = groupRows(
    rows,
    [army("A")],
    "now",
    S + 1,
    everything,
    "loose"
  );
  expect(ids(groups)).toEqual([
    ["A", ["a1"]],
    [NO_ARMY, ["loose"]],
  ]);
});

test("nothing under way lists nothing", () => {
  const rows = [row("a1", 0, 4, "A")];
  expect(groupRows(rows, [army("A")], "now", S + 10, everything, null)).toEqual(
    []
  );
});

test("a march's group is its army's, or no army's", () => {
  const armies = [army("A")];
  expect(groupKeyOf(row("x", 0, 1, "A").path, armies)).toBe("A");
  expect(groupKeyOf(row("y", 0, 1, "gone").path, armies)).toBe(NO_ARMY);
  expect(groupKeyOf(row("z", 0, 1).path, armies)).toBe(NO_ARMY);
});
```

## client/src/utils/timelineRows.ts

```ts
import { Army, MapPath, MarchTiming } from "../types";
import { HistoryTime } from "./historyTime";
import { HistoryView } from "./timeline";

// Which marches the timeline lists:
//   all  - every march
//   now  - only marches under way at the playhead
//   view - marches that overlap the stretch of history on show
export type RowFilter = "all" | "now" | "view";

export const ROW_FILTERS: RowFilter[] = ["all", "now", "view"];

export const NO_ARMY = "no-army"; // the key of the group for marches that belong to no army

export interface MarchRow {
  path: MapPath;
  timing: MarchTiming;
}

export interface RowGroup {
  key: string; // the army's id, or NO_ARMY
  army: Army | null;
  rows: MarchRow[]; // the marches listed, earliest first
  total: number; // how many marches the group has, listed or not
  start: HistoryTime; // from the group's first march setting off...
  end: HistoryTime; // ...to its last one arriving
}

// A march is under way from the moment it sets off until it arrives
export const underWay = (timing: MarchTiming, moment: HistoryTime): boolean =>
  timing.start <= moment && moment <= timing.end;

// Any part of the march falls in the stretch of history on show
export const overlapsView = (timing: MarchTiming, view: HistoryView): boolean =>
  timing.end >= view.from && timing.start <= view.to;

export function rowPasses(
  timing: MarchTiming,
  filter: RowFilter,
  moment: HistoryTime,
  view: HistoryView
): boolean {
  if (filter === "now") return underWay(timing, moment);
  if (filter === "view") return overlapsView(timing, view);
  return true;
}

// The group a march is listed under
export const groupKeyOf = (path: MapPath, armies: Army[]): string =>
  path.armyId && armies.some((army) => army.id === path.armyId)
    ? path.armyId
    : NO_ARMY;

// The timeline's rows: one group per army, in the order the armies were made, then the
// marches that belong to no army. Each group lists its marches earliest first, keeping
// those the filter lets through. The selected march is always listed. Groups with nothing
// to list are left out.
export function groupRows(
  rows: MarchRow[],
  armies: Army[],
  filter: RowFilter,
  moment: HistoryTime,
  view: HistoryView,
  selectedPathId: string | null
): RowGroup[] {
  const byKey = new Map<string, MarchRow[]>();
  for (const row of rows) {
    const key = groupKeyOf(row.path, armies);
    const list = byKey.get(key);
    if (list) list.push(row);
    else byKey.set(key, [row]);
  }

  const order: { key: string; army: Army | null }[] = [
    ...armies.map((army) => ({ key: army.id, army })),
    { key: NO_ARMY, army: null },
  ];

  const groups: RowGroup[] = [];
  for (const { key, army } of order) {
    const all = byKey.get(key);
    if (!all || all.length === 0) continue;
    // Earliest first; marches that set off together keep the order they were drawn in
    const sorted = all
      .map((row, index) => ({ row, index }))
      .sort(
        (a, b) => a.row.timing.start - b.row.timing.start || a.index - b.index
      )
      .map(({ row }) => row);
    const listed = sorted.filter(
      (row) =>
        row.path.id === selectedPathId ||
        rowPasses(row.timing, filter, moment, view)
    );
    if (listed.length === 0) continue;
    groups.push({
      key,
      army,
      rows: listed,
      total: sorted.length,
      start: Math.min(...sorted.map((row) => row.timing.start)),
      end: Math.max(...sorted.map((row) => row.timing.end)),
    });
  }
  return groups;
}
```

## client/src/utils/timelineView.test.ts

```ts
import { toHistoryTime } from "./historyTime";
import {
  barPlacement,
  MIN_VIEW_DAYS,
  validMarch,
  viewShowing,
} from "./timeline";

const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

test("a bar is before, inside or after the stretch on show", () => {
  const view = { from: D, to: D + 10 };
  expect(barPlacement({ start: D - 5, end: D - 1, turn: 0 }, view)).toBe(
    "before"
  );
  expect(barPlacement({ start: D - 5, end: D + 1, turn: 0 }, view)).toBe(
    "inside"
  );
  expect(barPlacement({ start: D + 9, end: D + 20, turn: 0 }, view)).toBe(
    "inside"
  );
  expect(barPlacement({ start: D + 11, end: D + 12, turn: 0 }, view)).toBe(
    "after"
  );
});

test("showing a march keeps the zoom and centres it, or zooms out just enough to fit it", () => {
  const view = { from: D, to: D + 10 };

  const short = viewShowing({ start: D + 100, end: D + 102, turn: 0 }, view);
  expect(short.to - short.from).toBeCloseTo(10, 9);
  expect((short.from + short.to) / 2).toBeCloseTo(D + 101, 9);

  const long = viewShowing({ start: D + 100, end: D + 150, turn: 0 }, view);
  expect(long.from).toBeLessThan(D + 100);
  expect(long.to).toBeGreaterThan(D + 150);

  const tiny = viewShowing(
    { start: D, end: D, turn: 0 },
    { from: D, to: D + MIN_VIEW_DAYS / 4 }
  );
  expect(tiny.to - tiny.from).toBeGreaterThanOrEqual(MIN_VIEW_DAYS - 1e-9);
});

test("a march with unusable dates counts as having none", () => {
  expect(validMarch(undefined)).toBeUndefined();
  expect(validMarch({ start: NaN, end: D, turn: 0 })).toBeUndefined();
  expect(validMarch({ start: D, end: Infinity, turn: 0 })).toBeUndefined();
  expect(validMarch({ start: D, end: D + 2, turn: NaN })).toEqual({
    start: D,
    end: D + 2,
    turn: 0,
  });
  expect(validMarch({ start: D, end: D + 2, turn: 1 })).toEqual({
    start: D,
    end: D + 2,
    turn: 1,
  });
});
```

## client/src/utils/travelSides.test.ts

```ts
import { buildTravelSides, samplePath, travelSideAt } from "./pathGeometry";

test("an east-bound path faces right the whole way", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ])
  );
  expect(sides).toEqual([{ distance: 0, right: true }]);
  expect(travelSideAt(sides, 50)).toBe(true);
});

test("a west-bound path faces left the whole way", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ])
  );
  expect(sides).toEqual([{ distance: 0, right: false }]);
  expect(travelSideAt(sides, 50)).toBe(false);
});

test("a U-turn flips exactly once, where the heading passes the dead zone", () => {
  const path = samplePath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ]);
  const sides = buildTravelSides(path);

  expect(sides).toHaveLength(2);
  expect(sides[0].right).toBe(true);
  expect(sides[1].right).toBe(false);
  expect(travelSideAt(sides, 0)).toBe(true);
  expect(travelSideAt(sides, sides[1].distance - 0.01)).toBe(true);
  expect(travelSideAt(sides, sides[1].distance)).toBe(false);
  expect(travelSideAt(sides, path.length)).toBe(false);
});

test("a mostly vertical, wobbling path does not flicker", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 0, y: 0 },
      { x: 2, y: 50 },
      { x: -2, y: 100 },
      { x: 2, y: 150 },
    ])
  );
  expect(sides).toHaveLength(1);
});
```

## client/src/utils/unitFacing.test.ts

```ts
import { Unit } from "../types";
import { facingRotation } from "./pathGeometry";
import {
  effectiveForward,
  forwardFromPointer,
  normalizeDegrees,
  snapDegrees,
  unitFacing,
} from "./unitFacing";

const unit = (extra: Partial<Unit> = {}): Unit => ({
  id: "a",
  filename: "a.png",
  path: "a.png",
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

test("normalizeDegrees wraps into (-180, 180]", () => {
  expect(normalizeDegrees(270)).toBeCloseTo(-90, 6);
  expect(normalizeDegrees(-270)).toBeCloseTo(90, 6);
  expect(normalizeDegrees(180)).toBeCloseTo(180, 6);
  expect(normalizeDegrees(-180)).toBeCloseTo(180, 6);
  expect(normalizeDegrees(360)).toBeCloseTo(0, 6);
  expect(normalizeDegrees(725)).toBeCloseTo(5, 6);
});

test("snapDegrees snaps to 45° steps only when close to one", () => {
  expect(snapDegrees(3)).toBeCloseTo(0, 6);
  expect(snapDegrees(43)).toBeCloseTo(45, 6);
  expect(snapDegrees(92)).toBeCloseTo(90, 6);
  expect(snapDegrees(178)).toBeCloseTo(180, 6);
  expect(snapDegrees(-178)).toBeCloseTo(180, 6);
  expect(snapDegrees(52)).toBeCloseTo(52, 6);
});

test("forwardFromPointer allows for rotation and mirroring", () => {
  expect(forwardFromPointer(10, 0, 0, false)).toBeCloseTo(0, 6);
  expect(forwardFromPointer(0, 10, 0, false)).toBeCloseTo(90, 6);
  // Mirrored art whose front now points right was facing left before it was flipped
  expect(forwardFromPointer(10, 0, 0, true)).toBeCloseTo(180, 6);
  // A unit turned 90° that is dragged to point down still has its art's front pointing right
  expect(forwardFromPointer(0, 10, 90, false)).toBeCloseTo(0, 6);
  expect(forwardFromPointer(10, 0, 90, false)).toBeCloseTo(-90, 6);
});

test("unitFacing defaults: art faces up, units turn to face travel, portraits stay upright", () => {
  expect(unitFacing(unit())).toEqual({
    forwardAngle: -90,
    travelMode: "rotate",
  });
  expect(unitFacing(unit({ assetType: "portraits" }))).toEqual({
    forwardAngle: -90,
    travelMode: "upright",
  });
  expect(unitFacing(unit({ forwardAngle: 90, travelMode: "fixed" }))).toEqual({
    forwardAngle: 90,
    travelMode: "fixed",
  });
  expect(
    unitFacing(unit({ assetType: "portraits", travelMode: "rotate" }))
      .travelMode
  ).toBe("rotate");
});

test("the arrow's direction and the facing rotation agree, mirrored or not", () => {
  const heading = 1; // radians
  const headingDeg = (heading * 180) / Math.PI;
  for (const flipped of [false, true]) {
    for (const forward of [0, 30, 90, -135, 180]) {
      const rotation = facingRotation(heading, forward, flipped);
      const facingNow = rotation + effectiveForward(forward, flipped);
      expect(normalizeDegrees(facingNow - headingDeg)).toBeCloseTo(0, 6);
    }
  }
});
```

## client/src/utils/unitFacing.ts

```ts
import { AssetType, TravelMode, Unit } from "../types";

export interface UnitFacing {
  forwardAngle: number;
  travelMode: TravelMode;
}

// Art faces up by default (-90° in screen angles, where 0 is right and 90 is down)
export const DEFAULT_FORWARD_ANGLE = -90;

export function defaultTravelMode(
  assetType: AssetType | undefined
): TravelMode {
  return assetType === "portraits" ? "upright" : "rotate";
}

// Defaults: units turn to face their direction of travel; portraits stay upright
// (mirroring instead) so a face is never upside down
export function unitFacing(unit: Unit): UnitFacing {
  return {
    forwardAngle: unit.forwardAngle ?? DEFAULT_FORWARD_ANGLE,
    travelMode: unit.travelMode ?? defaultTravelMode(unit.assetType),
  };
}

// Wraps any angle into (-180, 180]
export function normalizeDegrees(angle: number): number {
  let wrapped = ((angle % 360) + 360) % 360;
  if (wrapped > 180) wrapped -= 360;
  return wrapped;
}

const SNAP_STEP = 45;
const SNAP_WINDOW = 6;

// Snaps to the nearest 45° when within a few degrees of it
export function snapDegrees(angle: number): number {
  const nearest = Math.round(angle / SNAP_STEP) * SNAP_STEP;
  return Math.abs(angle - nearest) <= SNAP_WINDOW
    ? normalizeDegrees(nearest)
    : angle;
}

// The direction the front points in the unit's own (unrotated) space.
// Mirroring flips the image horizontally, which turns an angle a into 180 - a.
export function effectiveForward(
  forwardAngle: number,
  flipped: boolean
): number {
  return flipped ? 180 - forwardAngle : forwardAngle;
}

// Turns a pointer position (relative to the unit's centre, in screen pixels) into the
// stored forwards angle, allowing for the unit's rotation and mirroring
export function forwardFromPointer(
  dx: number,
  dy: number,
  unitRotationDeg: number,
  flipped: boolean
): number {
  const screenAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const local = screenAngle - unitRotationDeg;
  const stored = flipped ? 180 - local : local;
  return snapDegrees(normalizeDegrees(stored));
}
```

## client/src/hooks/useProject.ts

```ts
import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import {
  Army,
  HistoryDisplay,
  MapPath,
  PacingKey,
  PROJECT_VERSION,
  ProjectData,
  SavedViewport,
  Unit,
} from "../types";
import {
  emptyProject,
  LoadedProject,
  parseProject,
} from "../utils/convertProject";
import { HistoryTime } from "../utils/historyTime";

export interface ProjectSnapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[];
  selectedMapFilename: string | null;
  // Left out (undefined) for auto-saves; Flask then keeps the last saved view
  viewport?: SavedViewport | null;
}

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (snapshot: ProjectSnapshot): Promise<boolean> => {
      const projectData: ProjectData = {
        name: projectName,
        version: PROJECT_VERSION,
        units: snapshot.units,
        paths: snapshot.paths,
        armies: snapshot.armies,
        storyStart: snapshot.storyStart,
        displayMode: snapshot.displayMode,
        pacing: snapshot.pacing,
        selectedMapFilename: snapshot.selectedMapFilename,
        viewport: snapshot.viewport,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/projects/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        const data = await response.json();
        return !!data.success;
      } catch (error) {
        console.error("Failed to save project: ", error);
        return false;
      }
    },
    [projectName]
  );

  // Older project files are converted as they load (see parseProject). They are written
  // back in the new form the next time the project is saved.
  const loadProject = useCallback(async (): Promise<LoadedProject> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/load/${projectName}`
      );
      if (!response.ok) return emptyProject();
      return parseProject(await response.json());
    } catch (error) {
      console.error("Failed to load project: ", error);
      return emptyProject();
    }
  }, [projectName]);

  return { saveProject, loadProject };
}

export default useProject;
```

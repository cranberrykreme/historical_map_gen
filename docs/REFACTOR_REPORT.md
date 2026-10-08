# Refactor report: splitting the large files

Branch `refactor/split-large-files`, from `main` at `7a875f4` (the same commit as the tag `v0.11-week5.5-complete`).

This change only moves code. There are no logic changes, no renamed store actions, no changes to the store's state shape and no changes to the project file format. `useMapStore`, `useTimelineStore` and every default-exported component keep their import paths.

## 1. Test and type check results

| | Before (`7a875f4`) | After (each step and at the end) |
|---|---|---|
| `CI=true npx react-scripts test --watchAll=false` | 31 suites, **212 passed**, 0 failed | 31 suites, **212 passed**, 0 failed |
| `npx tsc --noEmit` | exit 0, no errors | exit 0, no errors |
| `npx eslint src` | 3 warnings (see section 5) | the same 3 warnings, no new ones |

Every commit (steps 1 to 5) passed the tests and the type check before it was made. No test files were changed, not even their import paths, because every old import path still works.

**Manual check in the running app.** The CRA dev server (port 3000) and the Flask server (port 5001) were already running from this working tree. I drove headless Google Chrome (`playwright-core`) against a throwaway copy of `TestProject1`, which has 14 units, 10 paths and 7 armies. I deleted the copy afterwards.

- **Timeline:** it loads with the marches grouped under their armies, the ruler, the bars and the story-start editor.
- **Paths tab:** all 10 paths are listed. Selecting "Group" opens the march editor in the timeline and the "attached units" section, which shows the army hint, the formation modes and the preview controls. Pressing Play on the preview moved the slider (0 → ~245 out of 1000), and Reset worked.
- **Armies tab:** all 7 armies are listed with their member counts.
- **Timeline playback:** at 1 day per second, the time went from 5 Feb 1066 00:00 to 6 Feb 1066 16:00 in about 1.5 s. Rewind, the Show filter and Fit all respond.
- **Save and load:** ⌘S sent `POST /api/projects/save` and got 200. After a reload, the same marches are listed. The saved `project.json` has the same keys and values as the file that was loaded.
- The browser console had no errors or page errors.

## 2. The new `client/src` tree (line counts)

New or changed files are marked ★.

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
│   │   ├── describe.ts (23) ★
│   │   ├── fields.tsx (182) ★
│   │   ├── MarchBar.tsx (165) ★
│   │   ├── MarchEditor.tsx (40) ★
│   │   ├── StoryStartEditor.tsx (34) ★
│   │   ├── Timeline.module.css (500) ★
│   │   ├── Timeline.tsx (160) ★
│   │   ├── TimelineRows.tsx (253) ★
│   │   ├── Transport.tsx (164) ★
│   │   ├── usePlayback.ts (36) ★
│   │   ├── useRowsHeight.ts (58) ★
│   │   ├── useSelectionReveal.ts (56) ★
│   │   └── useTimelineWheel.ts (47) ★
│   ├── toolbar/
│   │   ├── ArmiesPanel.tsx (325)
│   │   ├── AssetSection.module.css (98)
│   │   ├── AssetSection.tsx (177)
│   │   ├── AssetsPanel.module.css (33)
│   │   ├── AssetsPanel.tsx (93)
│   │   ├── AttachedUnitsSection.tsx (144) ★
│   │   ├── DeleteButton.module.css (25)
│   │   ├── MapSection.module.css (72)
│   │   ├── MapSection.tsx (71)
│   │   ├── PathList.tsx (84) ★
│   │   ├── PathPreview.tsx (105) ★
│   │   ├── PathsPanel.module.css (236)
│   │   ├── PathsPanel.tsx (157) ★
│   │   ├── PortraitPanel.tsx (88)
│   │   ├── PsdPanel.module.css (74)
│   │   ├── PsdPanel.tsx (76)
│   │   ├── SelectedUnitsSection.tsx (180) ★
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
│   ├── Timeline.tsx (2) ★
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
│   ├── useProjectShortcuts.ts (125) ★
│   ├── usePsdComposite.ts (135)
│   ├── usePsdLayerColouring.ts (106)
│   ├── usePsdLayers.ts (25)
│   └── useSelectionBox.ts (98)
├── pages/
│   ├── HomeScreen.module.css (108)
│   ├── HomeScreen.tsx (297)
│   └── ProjectView.tsx (261) ★
├── store/
│   ├── map/
│   │   ├── armiesSlice.ts (152) ★
│   │   ├── history.ts (92) ★
│   │   ├── pathsSlice.ts (273) ★
│   │   ├── selectionSlice.ts (47) ★
│   │   ├── storySlice.ts (45) ★
│   │   ├── types.ts (173) ★
│   │   └── unitsSlice.ts (346) ★
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
│   ├── useMapStore.ts (50) ★
│   ├── usePathToolStore.test.ts (133)
│   ├── usePathToolStore.ts (164)
│   └── useTimelineStore.ts (147)
├── styles/
│   └── tokens.css (42)
├── types/
│   └── index.ts (159)
├── utils/
│   ├── timeline/
│   │   ├── chaining.ts (145) ★
│   │   ├── engine.ts (259) ★
│   │   └── view.ts (76) ★
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
│   ├── timeline.ts (33) ★
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

## 3. Where every moved symbol went

### `store/useMapStore.ts` → `store/map/`

| Symbol | Old file | New file |
|---|---|---|
| `DragPosition`, `DragRotation`, `DragScale`, `GroupDragDelta` (interfaces) | store/useMapStore.ts | store/map/types.ts (now exported) |
| `MapStore` (interface) | store/useMapStore.ts | store/map/types.ts (an intersection of the slice interfaces below) |
| `HistorySlice`, `SelectionSlice`, `UnitsSlice`, `PathsSlice`, `ArmiesSlice`, `StorySlice` | (new) | store/map/types.ts |
| `Snapshot` | store/useMapStore.ts | store/map/history.ts |
| `snapshotOf`, `withHistory`, `reconcileSelection` | store/useMapStore.ts | store/map/history.ts |
| actions `set`, `undo`, `redo`; state `past`, `future` | store/useMapStore.ts | store/map/history.ts (`createHistorySlice`) |
| state `selectedUnitIds`, `dragPosition`, `dragRotation`, `dragScale`, `groupDragDelta`, `groupRotateDelta`, `groupScaleDelta` | store/useMapStore.ts | store/map/selectionSlice.ts |
| actions `selectUnit`, `boxSelect`, `setDragPosition`, `setDragRotation`, `setDragScale`, `setGroupDragDelta`, `setGroupRotateDelta`, `setGroupScaleDelta` | store/useMapStore.ts | store/map/selectionSlice.ts |
| `keepAssignments`, `inheritedFacing`, `appearsNow` (private helpers) | store/useMapStore.ts | store/map/unitsSlice.ts |
| state `placedUnits`, `clipboard` | store/useMapStore.ts | store/map/unitsSlice.ts |
| actions `setPlacedUnits`, `addUnit`, `addUnitAtPosition`, `removeSelectedUnits`, `cleanupDeletedAsset`, `cleanupRenamedAsset`, `commitUnitMove`, `commitUnitRotate`, `commitUnitScale`, `commitGroupMove`, `commitGroupRotate`, `commitGroupScale`, `copySelectedUnits`, `pasteUnits`, `flipSelectedUnits`, `setUnitForward`, `setUnitsTravelMode`, `bringBackUnits` | store/useMapStore.ts | store/map/unitsSlice.ts |
| `nextPathName`, `newPathId` (private helpers) | store/useMapStore.ts | store/map/pathsSlice.ts |
| state `paths`, `selectedPathId` | store/useMapStore.ts | store/map/pathsSlice.ts |
| actions `setPaths`, `selectPath`, `addPath`, `updatePathPoints`, `renamePath`, `deletePath`, `attachSelectedUnitsToPath`, `detachUnitFromPath`, `refreshPathFormation`, `setFormationMode`, `setMarchTiming` | store/useMapStore.ts | store/map/pathsSlice.ts |
| `sameArmies`, `armyMoment` (private helpers) | store/useMapStore.ts | store/map/armiesSlice.ts |
| state `armies`, `selectedArmyId` | store/useMapStore.ts | store/map/armiesSlice.ts |
| actions `setArmies`, `selectArmy`, `createArmyFromSelection`, `renameArmy`, `deleteArmy`, `addSelectedUnitsToArmy`, `removeUnitsFromArmy`, `eraseMembership` | store/useMapStore.ts | store/map/armiesSlice.ts |
| state `storyStart`, `displayMode`, `pacing`, `selectedMapFilename` | store/useMapStore.ts | store/map/storySlice.ts |
| actions `setStoryStart`, `setDisplayMode`, `setPacing`, `setSelectedMap`, `resetMapState` | store/useMapStore.ts | store/map/storySlice.ts |
| `useMapStore`, the derived-sync subscriber (`syncArmyMarches` then `syncChainedStarts`), the `window.mapStore` development hook | store/useMapStore.ts | store/useMapStore.ts (stays) |

### `components/Timeline.tsx` → `components/timeline/`

| Symbol | Old file | New file |
|---|---|---|
| `Timeline` (default export) | components/Timeline.tsx | components/timeline/Timeline.tsx. components/Timeline.tsx is now a 2-line re-export |
| `Timeline.module.css` | components/Timeline.module.css | components/timeline/Timeline.module.css (moved with `git mv`, unchanged) |
| `pad2`, `NumberField`, `MomentInput`, `DurationInput` | components/Timeline.tsx | components/timeline/fields.tsx |
| `MarchEditor` | components/Timeline.tsx | components/timeline/MarchEditor.tsx |
| `StoryStartEditor` | components/Timeline.tsx | components/timeline/StoryStartEditor.tsx |
| `PACES`, `DISPLAYS`, `FILTERS`, `handlePlay`, `handleRewind`, the transport JSX | components/Timeline.tsx | components/timeline/Transport.tsx |
| `TICK_SPACING`, `START_SNAP`, `ticks`, `momentAt`, `startScrub`, `emptyMessage`, `shownRows`, the names column, ruler, group bars, empty messages, playhead | components/Timeline.tsx | components/timeline/TimelineRows.tsx |
| `OFFSCREEN`, `MIN_BAR_PX`, `reveal`, `startBarDrag`, the per-march bar, handles and off-screen arrows | components/Timeline.tsx | components/timeline/MarchBar.tsx |
| `describe`, `groupTitle` | components/Timeline.tsx (closures) | components/timeline/describe.ts (`groupTitle` now takes `rowFilter` as an argument) |
| the play loop effect | components/Timeline.tsx | components/timeline/usePlayback.ts |
| `ZOOM_SPEED`, `shownRef`, the wheel zoom and pan effect | components/Timeline.tsx | components/timeline/useTimelineWheel.ts |
| `startResize`, `resetHeight`, `windowHeight` and the resize effect, `fittedHeight` | components/Timeline.tsx | components/timeline/useRowsHeight.ts |
| `rowRefs`, `headerRefs`, the effects that reveal the selected march and army | components/Timeline.tsx | components/timeline/useSelectionReveal.ts |
| `trackRef`, `trackWidth` and its ResizeObserver effect, `rows`, `groups`, `isOpen` | components/Timeline.tsx | components/timeline/Timeline.tsx (stays in the composing component) |

### `utils/timeline.ts` → `utils/timeline/`

| Symbol | Old file | New file |
|---|---|---|
| `DEFAULT_MARCH_PACE`, `MIN_DEFAULT_MARCH`, `UNDATED_START` | utils/timeline.ts | utils/timeline/engine.ts |
| `defaultMarch`, `validMarch`, `keepAfter`, `existsAt` | utils/timeline.ts | utils/timeline/engine.ts |
| `isMovement`, `marchStart` | utils/timeline.ts (private) | utils/timeline/engine.ts (exported for chaining.ts, but not re-exported from the barrel) |
| `Movement`, `stateDuring` (private) | utils/timeline.ts | utils/timeline/engine.ts |
| `Timeline` (type), `createTimeline`, `getTimeline` (and its `lastBuild` cache) | utils/timeline.ts | utils/timeline/engine.ts |
| `handoverUnits`, `chainedPathIds`, `syncChainedStarts` | utils/timeline.ts | utils/timeline/chaining.ts |
| `mean`, `previousArmyMarch`, `armyArrival` (private) | utils/timeline.ts | utils/timeline/chaining.ts |
| `HistoryView`, `MIN_VIEW_DAYS`, `MAX_VIEW_DAYS`, `fitView`, `BarPlacement`, `barPlacement`, `viewShowing`, `zoomView`, `SNAP_STEPS`, `snapStepFor` | utils/timeline.ts | utils/timeline/view.ts |
| everything that was public | utils/timeline.ts | utils/timeline.ts (a barrel with the same exported names) |

### `components/toolbar/PathsPanel.tsx`

| Symbol | Old file | New file |
|---|---|---|
| `TRAVEL_MODES`, `LIFESPAN*` styles, `SMALL_BUTTON`, `goTo`, the selected-units section (travel mode and lifespan rows) | PathsPanel.tsx | toolbar/SelectedUnitsSection.tsx |
| the path rows (select, rename input, count, delete) and the "No paths yet" message | PathsPanel.tsx | toolbar/PathList.tsx |
| `displayName`, `FORMATION_MODES`, `attachedUnits`, `marchArmy`, `formationMode`, the attached units section (detach, formation mode, re-record) | PathsPanel.tsx | toolbar/AttachedUnitsSection.tsx |
| `SPEEDS`, `PlaybackSlider`, the play, reset and speed controls | PathsPanel.tsx | toolbar/PathPreview.tsx |
| `PLAY_SPEED`, the preview reset effect and play loop, the `isPlaying` / `renamingId` / `renameValue` state, `startRename`, `commitRename`, drawing mode | PathsPanel.tsx | PathsPanel.tsx (stays) |

### Step 5

| Symbol | Old file | New file |
|---|---|---|
| the keyboard shortcut `keydown` effect (⌘S, undo/redo, copy/paste, M, Delete, Escape/Backspace for waypoints) | pages/ProjectView.tsx | hooks/useProjectShortcuts.ts |

## 4. Exports of each new module

**store/map/types.ts**
- `interface DragPosition { id: string; x: number; y: number }`
- `interface DragRotation { id: string; rotation: number }`
- `interface DragScale { id: string; scale: number }`
- `interface GroupDragDelta { dx: number; dy: number }`
- `interface HistorySlice { past: Snapshot[]; future: Snapshot[]; set(units: Unit[]): void; undo(): void; redo(): void }`
- `interface SelectionSlice { selectedUnitIds: Set<string>; drag…/group… previews; selectUnit(id: string | null, addToSelection?: boolean): void; boxSelect(ids: string[]): void; setDrag…/setGroup…(…): void }`
- `interface UnitsSlice { placedUnits: Unit[]; clipboard: Unit[]; …18 unit actions }`
- `interface PathsSlice { paths: MapPath[]; selectedPathId: string | null; …11 path actions }`
- `interface ArmiesSlice { armies: Army[]; selectedArmyId: string | null; …8 army actions }`
- `interface StorySlice { storyStart: HistoryTime; displayMode: HistoryDisplay; pacing: PacingKey[]; selectedMapFilename: string | null; …5 actions }`
- `type MapStore = HistorySlice & SelectionSlice & UnitsSlice & PathsSlice & ArmiesSlice & StorySlice`

**store/map/history.ts**
- `interface Snapshot { units: Unit[]; paths: MapPath[]; armies: Army[] }`
- `const snapshotOf: (state: MapStore) => Snapshot`
- `function withHistory(state: MapStore): { past: Snapshot[]; future: Snapshot[] }`
- `function reconcileSelection(state: MapStore, units: Unit[], paths: MapPath[]): { selectedUnitIds: Set<string>; selectedPathId: string | null }`
- `const createHistorySlice: StateCreator<MapStore, [], [], HistorySlice>`

**store/map/selectionSlice.ts**
- `const createSelectionSlice: StateCreator<MapStore, [], [], SelectionSlice>`

**store/map/unitsSlice.ts**
- `const createUnitsSlice: StateCreator<MapStore, [], [], UnitsSlice>`

**store/map/pathsSlice.ts**
- `const createPathsSlice: StateCreator<MapStore, [], [], PathsSlice>`

**store/map/armiesSlice.ts**
- `const createArmiesSlice: StateCreator<MapStore, [], [], ArmiesSlice>`

**store/map/storySlice.ts**
- `const createStorySlice: StateCreator<MapStore, [], [], StorySlice>`

**components/timeline/fields.tsx**
- `function NumberField(props: { value: number; min: number; max?: number; width: number; title: string; padded?: boolean; onCommit: (value: number) => void }): JSX.Element`
- `function MomentInput(props: { label: string; value: HistoryTime; onCommit: (t: HistoryTime) => void }): JSX.Element`
- `function DurationInput(props: { label: string; value: number; onCommit: (days: number) => void }): JSX.Element`

**components/timeline/MarchEditor.tsx**
- `default function MarchEditor(props: { path: MapPath; timing: MarchTiming }): JSX.Element`

**components/timeline/StoryStartEditor.tsx**
- `default function StoryStartEditor(props: { firstMarch: HistoryTime | null }): JSX.Element`

**components/timeline/Transport.tsx**
- `default function Transport(props: { current: HistoryTime; hasMarches: boolean; storyEnd: HistoryTime | null }): JSX.Element`

**components/timeline/TimelineRows.tsx**
- `default function TimelineRows(props: { groups: RowGroup[]; grouped: boolean; isOpen: (group: RowGroup) => boolean; shown: HistoryView; current: HistoryTime; hasMarches: boolean; height: number; trackRef: RefObject<HTMLDivElement | null>; trackWidth: number; rowRefs: RefObject<Map<string, HTMLDivElement>>; headerRefs: RefObject<Map<string, HTMLDivElement>> }): JSX.Element`

**components/timeline/MarchBar.tsx**
- `const MIN_BAR_PX: 6`
- `default function MarchBar(props: { path: MapPath; timing: MarchTiming; active: boolean; shown: HistoryView; trackRef: RefObject<HTMLDivElement | null> }): JSX.Element`

**components/timeline/describe.ts**
- `const describe: (timing: MarchTiming) => string`
- `const groupTitle: (group: RowGroup, rowFilter: RowFilter) => string`

**components/timeline/usePlayback.ts**
- `function usePlayback(playing: boolean, storyStart: HistoryTime, storyEnd: HistoryTime | null, pause: () => void): void`

**components/timeline/useTimelineWheel.ts**
- `function useTimelineWheel(trackRef: RefObject<HTMLDivElement | null>, shown: HistoryView, expanded: boolean, setView: (view: HistoryView | null) => void): void`

**components/timeline/useRowsHeight.ts**
- `function useRowsHeight(): { startResize: (e: React.MouseEvent) => void; resetHeight: () => void; fittedHeight: number }`

**components/timeline/useSelectionReveal.ts**
- `function useSelectionReveal(selectedPathId: string | null, selectedTiming: MarchTiming | undefined, selectedArmyId: string | null, storyStart: HistoryTime, storyEnd: HistoryTime | null): { rowRefs: RefObject<Map<string, HTMLDivElement>>; headerRefs: RefObject<Map<string, HTMLDivElement>> }`

**components/timeline/Timeline.tsx**
- `default function Timeline(): JSX.Element`

**utils/timeline/engine.ts**
- `const DEFAULT_MARCH_PACE: 100`
- `const MIN_DEFAULT_MARCH: number`
- `const UNDATED_START: 0`
- `function defaultMarch(playback: Playback, start: HistoryTime): MarchTiming`
- `function validMarch(march: MarchTiming | undefined): MarchTiming | undefined`
- `function keepAfter(timing: MarchTiming, earliest: HistoryTime, keepLength: boolean): MarchTiming`
- `function existsAt(unit: Pick<Unit, "appears" | "leaves">, t: HistoryTime): boolean`
- `const isMovement: (path: MapPath) => boolean`
- `const marchStart: (path: MapPath) => HistoryTime`
- `interface Timeline { start; end; timings; playbacks; standing; stateAt(time, overrides?) }`
- `function createTimeline(paths: MapPath[], units: Unit[]): Timeline`
- `function getTimeline(paths: MapPath[], units: Unit[]): Timeline`

**utils/timeline/chaining.ts**
- `function handoverUnits(paths: MapPath[], units: Unit[], selected: Unit[]): { units: Unit[]; time: HistoryTime | null }`
- `function chainedPathIds(paths: MapPath[]): Set<string>`
- `function syncChainedStarts(paths: MapPath[], units: Unit[]): MapPath[]`

**utils/timeline/view.ts**
- `interface HistoryView { from: HistoryTime; to: HistoryTime }`
- `const MIN_VIEW_DAYS: number`
- `const MAX_VIEW_DAYS: number`
- `function fitView(storyStart: HistoryTime, lastEnd: HistoryTime | null): HistoryView`
- `type BarPlacement = "before" | "inside" | "after"`
- `function barPlacement(timing: MarchTiming, view: HistoryView): BarPlacement`
- `function viewShowing(timing: MarchTiming, view: HistoryView): HistoryView`
- `function zoomView(view: HistoryView, anchor: HistoryTime, factor: number): HistoryView`
- `function snapStepFor(daysPerPixel: number): number`

**components/toolbar/SelectedUnitsSection.tsx**
- `default function SelectedUnitsSection(props: { onStopPreview: () => void }): JSX.Element | null`

**components/toolbar/PathList.tsx**
- `interface PathRename { renamingId: string | null; renameValue: string; setRenameValue(value: string): void; startRename(id: string, currentName: string): void; commitRename(): void; cancelRename(): void }`
- `default function PathList(props: { rename: PathRename }): JSX.Element`

**components/toolbar/AttachedUnitsSection.tsx**
- `default function AttachedUnitsSection(props: { selectedPath: MapPath; isPlaying: boolean; setIsPlaying: Dispatch<SetStateAction<boolean>> }): JSX.Element`

**components/toolbar/PathPreview.tsx**
- `default function PathPreview(props: { pathId: string; isPlaying: boolean; setIsPlaying: Dispatch<SetStateAction<boolean>> }): JSX.Element`

**hooks/useProjectShortcuts.ts**
- `default function useProjectShortcuts(args: { editingPsd: string | null; portraitSource: string | null; isDrawingPath: boolean; handleSave: () => void }): void`

## 5. Noticed but deliberately not changed

- **`store/map/unitsSlice.ts` is 346 lines,** a little over the ~300 target. It holds everything the brief listed for units. I moved selection and the live drag previews into a sixth slice, `selectionSlice.ts`, which the brief didn't ask for. Splitting it further, for example by moving the six `commit*` actions out, would separate those actions from the unit editing they belong to.
- **`components/timeline/Timeline.module.css` is still one 499-line file.** Its classes are interleaved and some rules depend on cascade order (for example, `.barActive .barTurn` has to come after `.barTurn`). Splitting it by component could change which rule wins.
- **`trackRef` and `trackWidth` stay in `Timeline.tsx`** rather than in `TimelineRows`. `TimelineRows` mounts only while the timeline is expanded. If it held `trackWidth`, the width would reset to 0 each time the timeline is expanded, which would draw the ruler with 2 ticks for one frame.
- **The rename and `isPlaying` state stays in `PathsPanel`.** The list unmounts while a new path is being drawn, and `goTo` in the selected-units section stops the preview too, so this state has to outlive the sections.
- **`groupTitle` now takes `rowFilter` as an argument.** It used to be a closure. The output is the same.
- **`useTimelineWheel` lists `trackRef` in its effect dependencies** to satisfy `react-hooks/exhaustive-deps`. A ref object never changes identity, so the effect runs exactly as before.
- **`utils/timeline.ts` uses explicit named re-exports** instead of `export *`. This keeps `isMovement` and `marchStart`, which are now exported from `engine.ts` for `chaining.ts`, out of the public surface.
- **Three ESLint warnings existed before this branch and were left alone,** because fixing them would change behaviour or is out of scope:
  - `no-loop-func` in `syncChainedStarts` (now in `utils/timeline/chaining.ts`)
  - `exhaustive-deps` in `components/portrait-editor/PortraitCanvas.tsx:54`
  - `exhaustive-deps` in `hooks/useMapInteraction.ts:86`
- **Files over 350 lines that were left as they are:**
  - `components/UnitLayer.tsx` (418): the four drag handlers (move, rotate, scale, forward arrow) share the layer's props, store actions and zoom scale. Pulling them into hooks would need around 15 parameters each. That isn't an obvious, safe split.
  - `components/PathLayer.tsx` (405): this is one SVG layer whose click and waypoint-drag handlers and render helpers all share the zoom `scale` state and the draft path. Same reasoning.
  - `components/psd-editor/PsdEditor.tsx` (382): the editing state (samples, applied colours, unsaved detection, undo shortcuts) is closely coupled. The JSX could be split out, but only by passing most of the state down.
  - `utils/pathPlayback.test.ts` (483): this is a test file, and the brief says not to change test logic.
- **No server Python file is over 400 lines.** The largest is `server/routes/assets.py` at 165 lines.
- **Prettier isn't installed in `client/`, and there's no Prettier config.** I matched the existing style by hand: double quotes, semicolons, trailing commas, 2-space indent and roughly 80 columns. Some long template strings in JSX were already over 80 columns before this branch, and I kept them as they were.

# Refactor plan: making the code modular again

Written 21 October 2026 after reviewing the code at `fdbb8cc` (Week 9.8). Nothing has been changed yet. This builds on `REFACTOR_REPORT.md` (the Week 5.5 split) and fits in front of the UI work in `UI_STREAMLINING_PLAN.md`.

## What I found

The code is in good health: `tsc` is clean, logic sits in pure tested functions, and the store is already split into slices. Since Week 5.5 it has grown to about 37,000 lines, and four things now make it harder to work in:

1. **`utils/` is one flat folder of 67 files** (about 14,600 lines). Terrain, marches, deaths, shots, cameras and dates sit side by side, so it's hard to see what belongs together.
2. **A few files have become very large:** `utils/terrain.ts` (1,718 lines), `utils/terrainScene.ts` (1,450), `utils/exits.ts` (673), `components/UnitLayer.tsx` (600), `utils/terrainStyles.ts` (619). `types/index.ts` (385) holds every type in the app.
3. **"Every scene that isn't the main map is a battle."** That rule is written into the types (`MAP_SCENE`) and checked by hand in about 20 files (`MapCanvas`, `render/prepare`, `render/scene`, `useSceneCameras`, `ShotEditor`, `ProjectHeader` and others). 9.9a adds story scenes, 17.5 adds screens (family tree, documents) and 21 adds more maps, so each of those would need edits in all 20 places.
4. **The editor and the video draw things in two separate ways.** The map in the editor is HTML pictures and SVG (`UnitLayer`, `exits/ExitPieces`, `exits/MarkerLayer`), while the video is drawn on a canvas (`render/drawFrame`). The maths is shared, but the drawing is written twice: deaths, for example, exist once in `ExitPieces.tsx` and again in `drawFrame.ts`. Nearly everything still to come (story figures, arrivals, march motion, dust, clashes, volleys, marks, borders) would have to be drawn twice too, and the two could drift apart.

## The plan

Every step keeps the app working exactly as it does now, keeps the project file format unchanged (old projects open as before), and passes the tests, `tsc` and eslint before the next step starts. Steps 1 to 3 only move and split code; step 4 changes how the editor draws, so it gets its own test round.

### Step 1: folders by topic (moves only)

- `utils/` into topic folders, each test moving with its file:
  - `utils/history/`: dates, historyTime, historyEdit, lifespans, timeline (and `timeline/`), timelineRows, stripView
  - `utils/marches/`: pathGeometry, pathPlayback, marches, formation, unitFacing, follow, armies
  - `utils/units/`: blocks, exits, recolour, portraitCircle, portraitRender
  - `utils/video/`: shots, chapters, camera, battleCameras, mapTransform
  - `utils/terrain/`: terrain, terrainScene, terrainBrush, terrainStyles
  - `utils/scenes/`: scenes
  - `utils/project/`: convertProject
- The loose files in `components/` go into `components/map/` (MapCanvas, UnitLayer, PathLayer, BattleGround, BlockShape, DateDisplay, FrameOverlay, PathDrawOverlay, DropZoneOverlay) and `components/project/` (ProjectHeader, AssetTypePopup).
- `types/index.ts` split by topic (units, marches, shots, scenes, terrain, project), with `types/index.ts` still exporting everything so no import has to change.
- Imports updated with a script; no code inside the files changes.

### Step 2: split the big files

- `utils/terrain/terrain.ts` into `kinds.ts` (the table of terrain kinds), `curves.ts` (smooth curves, sampling), `strokes.ts` (outlines and lines) and `scatter.ts` (trees, houses and other scattered items).
- `utils/terrain/terrainScene.ts` into one file per family of terrain (water, ground, high ground, woods and towns, lines) plus the file that puts a whole battle together.
- `utils/units/exits.ts` into `exitStyles.ts`, `exitFrame.ts` (the pieces of a unit leaving) and `markers.ts`.
- `components/map/UnitLayer.tsx` into the unit picture, its drag and select handling (a hook), and the selection outline.
- Left alone on purpose: the toolbar panels (U1 rebuilds them as the six tabs) and the timeline and its 860-line stylesheet (U3 rebuilds them). Splitting those now would be thrown away.

### Step 3: scene kinds

- A `SceneKind` (`map`, `battle`, and later `story` and `screen`) and one small table in `utils/scenes/kinds.ts` that says, for each kind: how its ground is drawn, its size, its default camera, and which Build sections and tools apply.
- The 20 or so places that ask "is this a battle?" ask the table instead. 9.9a then adds a story scene by adding one entry, and U1's Scenes tab (grouped by kind, R6) reads the same table.
- The project file stays the same: battles are still saved in their list; the kind is worked out when it loads.

### Step 4: one way of drawing (the bigger step)

- The editor's map shows the picture with the same canvas drawing the video uses (`render/drawFrame`), on one canvas under the editing layer.
- HTML and SVG stay only for editing aids: handles, march lines, selection boxes, the brush, and invisible hit areas so dragging and selecting work as now.
- `ExitPieces` and `MarkerLayer` go away, because the canvas already draws deaths and markers.
- From then on, every new effect is drawn once and looks the same in the editor, the frame preview and the video.
- Risks to test: dragging and box-selecting units, Firefox speed with many units, picture sharpness when zoomed.

### Step 5: housekeeping

- `server/requirements.txt` from the venv, so the server can be set up again.
- `CLAUDE.md` layout section brought up to date; `docs/claude-context.md` (stale since Week 5.5) removed, if you agree.
- `pages/ProjectView.tsx` (28 hooks in one component) gathers its keyboard and loading wiring into two hooks.

## Where it goes in the order

| When | What |
|---|---|
| **Now, before U1** | Refactor part 1: steps 1, 2, 3 and 5. U1 then moves panels in a tidy tree, and the Scenes tab uses scene kinds. |
| U1, U2, U3 | as agreed |
| **After U3, before 9.9a** | Refactor part 2: step 4, one way of drawing, so story figures and every week 11 effect are drawn once. |
| 9.9a, 9.10, then 10.4 and 11.1 to 11.5 | as agreed |

## Testing

Part 1 changes nothing you can see, so its test list is short: open an old project, play, scrub, open a battle, draw terrain, kill a unit, render a frame preview, save and reload. Part 2 gets a full test list (drag, select, deaths, markers, blocks, battles, Firefox speed, editor next to frame preview).

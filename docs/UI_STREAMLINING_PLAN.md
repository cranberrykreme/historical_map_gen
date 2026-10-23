# UI streamlining: plan

Agreed with Chris on 20 October 2026, and updated on 21 October for the new backlog (feature ideas and animation plan), before any code was written. The ideas, with pictures, are on the [UI ideas page](https://claude.ai/artifact/VNFjZfKv2BnsB5ihCuBzge); the whole design on full screens, with the 21 October changes, is on the [mockup page](https://claude.ai/artifact/J5vzN88wME7CRgCX3jPSLo). The aim is an editor that is quick to find your way round, with a calm timeline.

## What was agreed

| # | Idea | Answer |
|---|------|--------|
| 1 | Side panel opens on click and stays open | Yes |
| 2 | Scene bar along the top | **No** |
| 3 | Tabs in the order you work | Yes, as five tabs |
| 4 | One card for whatever is selected | Yes |
| 5 | Tools on the map, with keys and a shortcut sheet | Yes, and it must tuck away when not in use (idea 10) |
| 6 | A calmer timeline control bar | Yes |
| 7 | Save automatically | Yes |
| 8 | "What's next" checklist | **No** |
| 9 | Timeline rework | Yes |
| 10 | Tool strip that tucks away | Yes |
| 11 | Small header that stays put | **No** |
| 12 | Right-click menus | Yes |
| 13 | One word for each thing | Yes |
| 14 | Uploads without the type popup | Yes |
| 15 | Find anything with ⌘K | Yes |

## Decisions

1. **Side panel.** A tab opens its panel on click and the panel stays open; clicking the same tab again or pressing Escape closes it. Hovering a tab only shows its name. The panel sits beside the map (the map gets narrower) instead of over it. It is 320px by default, its left edge drags to resize, and the width and last tab are remembered in the browser.
2. **Five tabs**, in the order a video is made, each with a short word under its icon:
   - **Library**: sub-tabs Maps, Units, Portraits, Story art (9.9: backdrops, characters, props), and Tools (PSD editor, portrait maker). Formation blocks stay with units.
   - **Scenes**: the main map, battles and (9.9) story scenes. Click one to open it; make, rename and delete them here.
   - **Build**: what's in the open scene. Marches and armies always; terrain (shapes, brush, eraser, style) in battles; the set (backdrop, props, floor line) in story scenes.
   - **Animate**: arrivals, deaths, block losses, army joins and leaves.
   - **Shots**: chapters, the shot list, rendering.
3. **Words on screen** (idea 13). A route is a **march** everywhere (no more "path" on screen). Uploaded pictures are the **Library**. A unit's arrival and death are **Arrives** and **Leaves** in the card. Only on-screen words change: the code and project files keep their names, so old projects open as before.
4. **Selection card** (idea 4). Selecting something shows one card at the left edge of the map with all its settings; deselecting hides it. It covers:
   - a unit: name, size (blocks), facing and turning, army, how it arrives, how it leaves, losses (blocks), its marches, and "Draw a march for it";
   - a march: name, starts, ends, turning, units it carries;
   - a shot: scene, length, chapter; history it shows (from, to, ease, hold, hide date); camera (start, end, follow); the cut in (transition); delete;
   - a terrain feature: its kind and name;
   - (9.9) a character or prop: pose, colour, item and hat layers, flip.
   Several units selected: only what they share. The tabs keep their lists of everything; the card is for the one thing in hand. Rows that are moments in history (arrives, leaves, a march's start) jump the playhead there when clicked.
5. **Timeline rework** (ideas 6 and 9).
   - **Control bar:** left, rewind, play and the date (Preview frame beside the clock in Video mode); middle, History | Video; right, pace as one dropdown ("1 day / sec", History mode only), Render, a ⚙ video settings popup, and open/close.
   - **Video settings popup:** video shape (16:9, 9:16), how the date shows (months, days, times), and when the story starts. Saved with the project.
   - **No editor rows.** The shot editor, camera row, march editor and story start row leave the timeline; their settings are in the selection card and the settings popup.
   - **History mode:** one ruler in dates. A **shots lane** above the marches shows each shot as a bracket over the stretch of history it shows; held shots show as a diamond at their moment. Drag a bracket's ends to change From and To. Shots that overlap in history, or go back in it, stack in extra lines of the lane so none hides another. The selected shot's stretch is shaded over the marches. Below, the marches grouped by army as now, with Fit and the All / Now / In view filter on the marches' header.
   - **Video mode:** one ruler in seconds of video. A chapters lane, then the shots, each with a small picture of its first frame, then an empty sound lane ready for week 10. The overview bar becomes a thin scrollbar under the shots, shown only when zoomed in.
   - **Heights:** closed (control bar only), normal and tall. Double-clicking the top edge switches between normal and tall; dragging it still works.
6. **Autosave** (idea 7). About 1.5 seconds after the last edit the project saves itself; never during a drag, while the video plays, or while a march is being drawn. ⌘S still saves at once. Because there is no new header (idea 11), the save state shows where it does now, in the existing header's status (Saving…, Saved, or "Couldn't save · Retry" in red, which stays until a save works). Firefox asks before closing the tab if a save is still waiting. Redo stays on ⇧⌘Z.
7. **Map tools** (ideas 5 and 10). A tool strip floats on the map's left edge: Select (V), Draw march (P), Place block (K), and in battles Brush (B) and Eraser (E); in 9.9 story scenes a Floor line tool replaces the brush and eraser. Tools that don't apply are greyed. It **tucks away** to one button showing the current tool: click it to open, picking a tool tucks it away again, it tucks away while the video plays and on its own a few seconds after the mouse leaves it. Keys work whether it's open or not, except while typing in a field. `?` opens a sheet listing every shortcut.
8. **Right-click menus** (idea 12). A short menu for a unit, a march, a terrain feature, a shot and a march bar, and for empty map (paste, place a block here, select all). Each item shows its key. Every item also exists elsewhere, so the menu is never the only way.
9. **Uploads** (idea 14). Dropping files on a Library section, or using that section's own + button, puts them straight there, with a short message: "3 portraits added · Change type · Undo". Dropping on the map or anywhere unclear still asks, as now.
10. **Find with ⌘K** (idea 15). A search box over the map. Results cover scenes, shots, chapters, marches, units and armies, and actions such as "Add shot" and "Render video". Picking one opens its scene, selects it and shows it (and moves the playhead to it where that makes sense).


## Changes for the new backlog (agreed 21 October 2026)

These seven changes (R1 to R7) fit the decisions above to `FEATURE_IDEAS_PLAN.md` and `ANIMATION_PLAN.md`. Where they differ from a decision above, they win.

1. **R1 Open a shot.** In Video mode, double-clicking a shot opens it in the timeline: the ruler becomes that shot's seconds, with a breadcrumb (chapter › shot) and "← All shots" to go back. Rows: Camera (presets and cues, B3), one row per character (poses, walks, speech A1, reactions A2, entrances A6, moods E1), Effects (E4), Light (B2), Sound (H1). Only rows with something in them show, plus "+ Row". Map and battle shots get Camera, Overlay (freeze and name E2, spotlight F2) and Sound rows. **This replaces 9.9's plan for per-character rows under the strip.**
2. **R2 History rows hold everything.** A row per unit (grouped by army) shows everything that happens to it: arrival ◆, marches, losses, formation changes (G1), volleys, waver and rout (G2), leaving. A clash spans the two rows it joins (11.5). An **On the map** group above holds map-wide things: campaign arrows, labels, pins, event icons, borders, spotlights, day and night (12, 13, F2, F3, F6). The Show filter becomes Everything, Marches, Battle, Map. Rows are built so later weeks add a kind of bar, not a new row type. The Animate tab stays the list view of the same things.
3. **R3 Video mode lanes.** Markers (week 10) as flags on the ruler; lanes for Chapters, Shots, Overlays (date, popups, portraits, locator inset, name tags, counters, title cards), Narration (D2, the words shown on the bars), Music, and Sound effects made from events (H1, shown faint). Each lane folds away. U3 builds them as empty slots that later weeks fill.
4. **R4 Overlays on the video frame.** In Video mode the frame shows overlays where the viewer will see them (date, locator inset, popups, portraits, subtitles); drag to move. 9:16 keeps its own layout for shorts (H4). Built with 10.5.
5. **R5 Six tabs.** A sixth tab, **Publish**: render, quick drafts and chapter renders (H2), YouTube pack and thumbnail maker (H3), shorts (H4); Render ▸ on the control bar opens it. Library sub-tabs: **Cast** first (D1), Maps, Units, Portraits, Story art, Beats (A4), Sound (music and effects), Tools. Build sections change with the scene kind (maps: marches, armies, places F7, marks, borders; battles add terrain; story scenes: the set, characters, crowds and doors). Shots gets a **Script** view (D2). The header's save status opens the save points list (H5).
6. **R6 Scenes grouped by kind:** Maps (more than one, C5), Battles, Story scenes, Screens (family tree C3, documents C4, tapestry C6), with one "+ New scene" menu for every kind. Built in U1.
7. **R7 Grouped tools and a lean card.** The tool strip groups related tools behind one button with a flyout (Marks: arrow, label, pin, event icon; Measure: distance, spotlight; Terrain: brush, eraser, hill), keeping it to about seven buttons, and still tucks away. Story scenes: Select, Floor line, Door, Crowd area, Effect. The selection card shows only the settings in use, with "+ Add" for the rest (camera moves, light and mood, silhouette, flashback look, view as one side, freeze and name, film look, narration).

**Effect on the build order:** U1 adds R6 and the six-tab layout (Publish starts with the existing render dialog). U3 adds R1 to R3 and the lean card (R7), and should be finished before 9.9 development. U4 adds the tool groups. R4 comes with 10.5; the rest of Publish with weeks 16 and 20.

## Build order

The parts are in the order they should be built. Parts U1 to U3 should come **before 9.9 development**, while the 9.9 art is being made, so story scenes get built straight into the new tabs, card and timeline.

1. **U1 Panels and tabs** (ideas 1, 3, 13): the click-to-open panel beside the map; five tabs with their sub-tabs; on-screen words. Mostly moving existing sections. Small to medium.
2. **U2 Quick wins** (ideas 6, 7, 14): the new control bar and video settings popup; autosave; uploads without the popup. Small.
3. **U3 Selection card and timeline** (ideas 4, 9): the card for units, marches, shots and terrain; the shots lane in History mode; Video mode with chapters, thumbnails and the sound lane; heights. Large; can be split into U3a card and U3b timeline, tested separately.
4. **U4 Map tools and menus** (ideas 5, 10, 12): the tucking tool strip and its keys, the shortcut sheet, right-click menus. Medium.
5. **U5 Find** (idea 15). Medium.

## Logic (pure, tested in `utils/`)

- Shots lane layout: each shot's bracket from its from and to, held shots as one moment, stacking overlapping or out-of-order shots into lines.
- Dragging a bracket's end: the new from or to, keeping from ≤ to, as the shot editor does now.
- What several selected units share (for the card).
- Autosave timing: when an edit should start the wait, and when a save must wait (drag, playing, drawing).
- Upload target: which asset type a drop goes to from where it landed.
- Keyboard map: one table of keys and actions, used by the shortcut handler, the tooltips and the `?` sheet, so they never disagree.
- Finder: matching and ranking names across scenes, shots, chapters, marches, units and armies.

## Notes

- Thumbnails reuse the renderer's frame drawing at small size, made once per shot and remade only when that shot or its scene changes.
- `toolbarPanels.test.tsx` will need updating as panels move between tabs.
- Nothing about saved project files changes except the new video settings already being in the project (story start, display mode, video frame), so old projects open as before.

# Feature ideas plan

Agreed with Chris on 20 and 21 October 2026, before any code was written. Chris wants all 45 ideas from two rounds. The sketches are on the [first ideas page](https://claude.ai/artifact/3XrWXecVMWG9wNRv4hMcyD) (A to D) and the [second ideas page](https://claude.ai/artifact/JBg21mWtaVkGYtEqkTJ2Me) (E to H). This plan builds on `STORY_SCENES_PLAN.md` (9.9), `ANIMATION_PLAN.md` and `UI_STREAMLINING_PLAN.md`; nothing here repeats them.

Same shared rules as the animation plan: effects inside a shot run in seconds of video, moments in history stay moments in history, all logic is pure functions in `client/src/utils/` with Jest tests used by both the editor and the renderer, and every automatic effect has an off switch. Each item ends with a numbered test list for Chris, and Chris commits when a whole item is tested.

## The ideas

### A. Story scenes: acting
- **A1 Speech and subtitles.** A talk action carries a line of text, shown as a speech bubble, thought bubble or bottom subtitle, optionally typing itself out. The talk pose runs while the line shows.
- **A2 Reaction marks.** Marks that pop up above a head for a moment: ! ? anger lines, sweat drop, zzz, music notes, heart. Placed as actions on the character's row.
- **A3 Two-person actions.** Hand a prop over, crown someone, knight, swear on relics, shake hands, push, a two-person sword fight. The app lines the two up and passes the prop between hands. Needs 15.5 holding props.
- **A4 Beats.** Save a run of actions across several characters and drop it on other characters in any shot, then nudge the timing. Starter beats: toast, argument, messenger brings news, oath, coronation, council vote.
- **A5 Crowds.** Mark a floor area, pick support characters, colours and a count; the app fills it with a varied mix that can react together (cheer, gasp, bow, murmur) with small random delays.
- **A6 Entrances and exits.** Enter or leave by the left edge, right edge, or a door marked on the backdrop, walking to or from the placed spot.

### B. Story scenes: the look
- **B1 Depth layers.** Backdrop PSD layers named `front` draw over the characters; layers named `far` move slower when the camera pans (parallax).
- **B2 Lighting moods.** Per shot: day, dusk, night, candlelight, storm. Tints backdrop, props and people together; fire props cast a flickering glow on people near them; storms can flash lightning on cue.
- **B3 Scene camera presets.** Wide, Two-shot, Close-up on a character; camera cues inside a shot; a "follow the speaker" switch (with A1); a quick push-in for reactions.
- **B4 Weather in scenes.** Rain, snow, wind, mist in outdoor story scenes; wind blows banners and sails. With week 17.
- **B5 Ships and horses, side-on.** A rocking side-on ship set characters stand on; horses characters ride, walk or gallop. Needs one ship and one horse from Chris.

### C. New kinds of scene
- **C1 Split screen.** Two scenes side by side (top and bottom in 9:16), each with its own camera and date; the divider can slide in and out.
- **C2 Locator inset.** A small corner map with a pulsing pin, on any story scene or battle, from the main map picture.
- **C3 Family tree and claims board.** A fourth scene kind: portraits joined by family and marriage lines that draw themselves in, claim arrows, crowns that move between people, greying or crossing out at death.
- **C4 Document close-up.** Full-screen letter, charter or chronicle page: text writes itself as handwriting, words underlined or circled, a wax seal stamps down, a source line at the bottom.
- **C5 More than one map.** Several map scenes, each with its own picture, lined up once against each other so marches show on all of them; zoom through (15.6) dives between them.
- **C6 Tapestry strip.** Story scenes laid end to end on one long embroidered strip with borders, the camera panning along it.

### D. Telling the whole story
- **D1 Cast list.** One record per person: name, portrait(s), side and colour, born and died, titles that change on dates. Popups, corner portraits, story scenes, the family tree, labels and name tags read from it.
- **D2 Script and subtitles.** Narration written per shot; shot lengths suggested from reading speed until the voice track sets them; shown as subtitles and saved as `.srt`.
- **D3 Numbers on screen.** Army counters that tick down with losses, strength bars, a casualty tally, read from existing units; ranges for uncertain sizes.
- **D4 Film looks.** Paper grain, vignette, sepia or cool grade, faint flicker, for the whole video or per chapter.
- **D5 Episode series.** Projects in a series share cast, maps and story sets; a new episode can start from the last one's end state.

### E. Story scenes: drama
- **E1 Portrait variants and moods.** A person can have several portrait pictures Chris makes (older, wounded, crowned, or another expression); an action swaps between them with a blend, and dated swaps use D1. **Moods never draw on the face**, because the eyes sit in a different place on every portrait (Chris, 21 Oct). They work around the circle instead: angry = red glow, quick shake and steam puffs; sad = colour greys, stick arms droop; afraid = fast tremble; happy = small bounce. A2 marks can add to any of them.
- **E2 Freeze and name.** Freeze mid-action, dim slightly, pop name tags with lines to each person (from D1), then carry on. Works on battles, tagging blocks.
- **E3 Silhouette shots.** A story shot switch that turns characters and props black against a chosen sky (sunrise, sunset, fire).
- **E4 Scene effects.** Smoke, sparks, falling dust, an arrow thudding into a wall, fire spreading across a building, a flash. Bars on their own row, like actions.
- **E5 Dreams and flashbacks.** Another shot inside a thought or dream bubble, or a whole shot marked as a flashback (soft edge, faded sepia, date paused, its own date in the corner).
- **E6 Rooms side by side.** A cutaway set of two or three rooms, each with its own backdrop; characters walk through doorways; the camera follows or shows the whole building.

### F. The map tells more
- **F1 Distance and time.** A measuring line between two places or along a march, labelled with distance (scale set once per map) and how long it took (from the march's dates).
- **F2 Spotlight.** Dim the map except a circle or drawn area; it can grow, follow a unit, and fade, over a stretch of history.
- **F3 Day and night.** Over multi-day stretches the map darkens at night and brightens at dawn, camps glowing in the dark; fast stretches flicker gently.
- **F4 Showing doubt.** Units, marches or places marked uncertain draw faint and dashed with a ?; two versions side by side with a note; ranges on army sizes (with D3).
- **F5 What each side knows.** A per-shot "view as" switch: what one side didn't know sits under fog until a scout or messenger reaches it.
- **F6 Event icons.** Animated icons on places over a stretch of history: a town burning then smoking, a tightening siege ring, a coronation crown, a treaty scroll.
- **F7 Places list.** Named places pinned once per map; labels, pins, icons, measuring lines and cameras pick a place by name; "frame York" sets a shot camera.

### G. Battles in depth
- **G1 Formation changes.** A block changes shape over a stretch of history (line, column, shield wall, wedge, circle, skirmish), pieces moving to their new places.
- **G2 Wavering and rout.** A block wavers (edge shivers, flag dips), then routs: pieces break up and flee in a chosen direction, thinning. A feigned retreat turns and reforms.
- **G3 Commanders and standards.** A leader on a block flies their banner, shows their portrait when the camera is close; if they die the banner falls and the block can waver. Rumour popups over the field.
- **G4 Hills and slopes.** A shaded hill terrain feature; units slow a little going up; an optional side-on slope inset.
- **G5 Zoom into the fight.** From a clash, an automatic side-on close-up of support characters in each side's colours trading blows, on a backdrop picked from the battle's terrain style.

### H. Making and publishing
- **H1 Sound effects that follow events.** A small sound library that attaches to events (clash, volley, march, toast, door); each can be turned off or swapped.
- **H2 Quick drafts and chapter renders.** A fast low-quality draft of a shot or chapter; full renders kept per chapter and joined; only changed shots re-render.
- **H3 YouTube pack.** After a render: chapter timestamps, a sources list, the `.srt` file, and a thumbnail maker (any frame plus big title text).
- **H4 Shorts from chapters.** Make a 9:16 short from a chapter or shots: cameras reframed to follow the main unit or speaker, overlays moved, trimmed to 60 seconds.
- **H5 Save points.** Named project save points to restore or open side by side and copy a shot back; a few automatic ones per day alongside U2 autosave.

## Where they go (proposed backlog changes, for Chris's OK)

Small ideas join items already planned; bigger ones get new items. Existing numbers stay as they are.

| Item | What | Ideas |
|---|---|---|
| **9.9 Story scenes** | adds the small extras while the code is fresh | + A2, A6, B1, E1, E3 |
| **New 9.10 Story talk and camera** | right after 9.9 | A1, B3 |
| **10 Audio and markers** | adds sound effects and the script | + H1, D2 |
| **New 10.4 Cast list** | before the corner overlays so they use it | D1 |
| **10.5 Corner overlays** | adds | + C2, E2 |
| **New 11.6 Battle depth** | after 11.5 battle action | G1, G2, G3, G4 |
| **New 11.7 Fight close-ups** | needs 9.9 and 11.5 | G5 |
| **12 Path trails and marks** | starts with the places list; adds | + F7 (first), F1, F2, F3 |
| **13 Territory borders** | adds | + F4, F6 |
| **15.5 Story scene extras** | stays as planned (holding props, poses, moving props) | |
| **New 15.7 Story scenes together** | needs 15.5 | A3, A4, A5 |
| **New 15.8 Story scene look** | | B2, E4, E5 |
| **16 Full render** | adds | + H2 |
| **17 Weather** | adds | + B4 |
| **New 17.5 New screens** | before the Episode 1 trial, which opens on the claimants | C3, C4, C1, D3 |
| **18 Packaging** | adds | + H5 |
| **19 Polish and Episode 1 trial** | stays | |
| **New 20 Publishing** | after the trial | H3, H4 |
| **New 21 Bigger extras** | order to choose after Episode 1 | C5, F5, B5, E6, C6, D4, D5 |

Notes on the order:
- **C5 more than one map** is large but matters for episodes that cross Europe. It can move up (for example to before week 12) if Episode 1 needs Norway.
- **H5 save points** could instead go with UI part U2 (autosave), if U2 is built first.
- **B5 ships and horses** and **E6 rooms** need new art from Chris, like 9.9.

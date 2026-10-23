# 9.9 Story scenes: plan

Agreed with Chris on 17 October 2026, before any code was written. Story scenes are scenes other than the main map and battles, such as a meeting between people or a dinner. They are seen **from the side**, not from above like everything else, and the video can cut to them the way 9.6 battle shots cut to battles.

## Prerequisite: art to make in Photopea (Chris)

Make these before development starts, so the first scene can be built and tested with real art.

**Backdrops** (most useful first; the first three cover a dinner and a meeting):
1. Great hall: timber walls, hangings, a hearth (feasts, councils, Edward's court)
2. Tent interior (war councils, William before Hastings)
3. Camp outside: a field with tents behind (speeches, troops gathering)
4. Church interior (the coronation, Harold's oath on the relics)
5. Shoreline with ships (the crossing, Harold's shipwreck, the landing at Pevensey)
6. Open countryside (meetings on the road, messengers)

**Support characters:** soldier (helmet, spear, shield), messenger or servant (hat, scroll), monk (hood, book or cross), attendant (plain, goblet).

**Props:** long table (food and goblets drawn on), bench, chair, throne, banner on a pole, hearth fire, chest, map table.

**Tips**
- Backdrops wider than the video, about 2:1 (for example 4000×2000), so the camera can pan.
- Floor about three quarters of the way down; keep the lower middle clear for characters.
- Muted colours, so the bright faction colours stand out.
- Anything to recolour (banners, tent cloth, hangings, a support character's body) is its own shape layer with its border in the same layer, like the unit art, so the PSD recolouring works on it.
- Support characters: circle head, body narrow at the top and wider at the bottom, no hands or feet. Each item and each hat or helmet is its own layer, so it can be switched on or off.
- No tables or chairs in backdrops: they are props, so characters can sit behind them.

### Art specs (how the app will read the PSDs)

**Rules for every library PSD**
- Flat layers only, no groups: the app reads every layer, and a group would come through as an extra copy.
- Vector shape layers like the unit art, with the border as the stroke on the same layer.
- Layer names tell the app what to do:
  - `colour <name>`, such as `colour body`: recoloured to the faction colour. Draw it in the palette's grey (fill `#a0a0a0`, border `#5a5a5a`) so the app knows exactly what to swap; no sampling needed.
  - `item <name>` or `hat <name>`, such as `item spear` or `hat helmet`: optional, switched on or off per character or prop.
  - Anything else: always shown, never recoloured (grey is fine on these, such as a steel helmet).
  - Backdrops only: `front <name>`, such as `front pillar`, is drawn **over** the characters (pillars, a window frame, a tent flap); `far <name>`, such as `far window`, moves slower when the camera pans, for depth. Optional; a backdrop without them works as before (added 21 October 2026, idea B1 in `FEATURE_IDEAS_PLAN.md`).
- Layer order in the PSD is drawing order: bottom layer drawn first.
- **Scale:** a standing adult is **500 px** tall, feet to top of head, in every file, so characters, props and backdrops match without resizing.
- Characters and props face **right**; the app flips them to face left. Transparent background, nothing touching the sides.

**Great hall (backdrop)**
- Canvas **4000 × 2000 px**. Floor line at **y = 1500**: everything below is floor.
- Layers, bottom to top: `wall` (timber planks or wattle, fills the canvas), `beams` (posts and roof beams), `floor` (y 1500 down: flagstones or rushes, a little darker at the bottom), `hearth` (against the back wall, off to one side), `colour hangings` (two or three wall hangings, grey).
- A doorway, if any, is about 700 px tall. Keep the area above the floor between x 1000 and 3000 fairly plain, as that's where people stand and talk.

**Soldier (support character)**
- Canvas **500 × 800 px**. The bottom of the body sits on the bottom edge, centred left to right; the app stands it on the floor there.
- Figure 500 px tall: body 340 px tall, about 100 px wide at the top and 220 px at the bottom; head a 160 px circle sitting on top.
- Layers, bottom to top: `colour body`, `head` (plain skin-tone circle, optional dot eye on the right side), `item shield` (round or kite shield over the front of the body), `item spear` (upright, about 700 px, in front of the body), `hat helmet` (Norman nasal helmet).

**Long table (prop)**
- Canvas **2000 × 600 px**, side-on, legs on the bottom edge.
- Tabletop about **230 px** above the floor (waist height for a 500 px person), about 30 px thick.
- Layers, bottom to top: `table` (legs and top, wood), `colour cloth` (a runner hanging over the front edge, grey), `item food` (bread, meat, bowls on top), `item goblets`.

## Decisions

1. **Scene model.** A story scene is a third kind of scene next to the main map and battles, using the same machinery: it opens from the Scene tab, has its own undo, and a shot picks it in the Scene picker with its own camera. The scene itself is the **set**: its backdrop, its props, and where every character stands and how they pose at the start.
2. **Timing.** Every action belongs to the **shot**, timed in **seconds within that shot**. Nothing goes on the history timeline. A story shot holds one moment in history (`from` = `to`).
3. **Carrying on.** A shot that directly follows another shot of the same story scene (a wide shot, then a close-up) starts where everyone ended up in that shot. A switch in the shot editor turns this off, so it starts from the set again.
4. **Stage.** A flat side-on rectangle with a floor line. Lower on the stage means nearer, so it is drawn in front. No automatic scaling with depth: each character's size is set by hand, like a puppet theatre.
5. **Support characters.** PSDs in a shared library used by every project. Placing one, you pick its colour (the usual nine) and tick which item and hat layers show. The app makes the picture for that combination with the existing PSD recolouring. With no legs, they glide when they move, with a small bob. They can flip to face left or right but have no poses.
6. **Portrait characters.** The project's circle portraits are the whole body. The app draws stick arms out of the sides and stick legs out of the bottom, in **one dark colour for everyone**, behind the circle so they stick out of it.
7. **Backdrops.** All Chris's own pictures (PNG or PSD) in the shared library. The stage takes its shape from the picture, with a size setting to scale it. Each backdrop's floor line is set once, in the library. PSD backdrops can be recoloured.
8. **Poses** (portrait characters): stand, walk, sit, talk, point, wave, cheer (both arms up), arms folded, bow, kneel, fall. More poses later. The limbs blend smoothly from one pose to the next. Everyone has a gentle idle bob so they never look frozen.
9. **Props.** Chris's own pictures in the shared library, recolourable. Placed, sized and flipped on the stage, layered by how low they stand like characters, so a table placed lower than a seated character hides their legs. Sitting on a chair or bench is lined up by hand (no snapping). Props stay still in 9.9.
10. **Date.** Story shots hide the on-screen date by default; the existing per-shot setting turns it back on.

**Not in 9.9:** characters holding props (later), more poses (later), snapping to chairs, moving props, speech bubbles (10.5's popup messages cover messages on screen).

## Editor

- **Assets tab, Library section:** the shared library is a section inside Assets with Backdrops, Characters and Props subsections. Upload PSDs and PNGs there, delete them, and set each backdrop's floor line by dragging it on a preview.
- **Scene tab, Story scenes section:** under Battles. The + button asks for a name and a backdrop. Opening a story scene shows its stage on the canvas, with the floor line visible while editing. The header's open-scene bar shows it like an open battle.
- **Building the set:** drag portraits in from Assets and support characters and props in from the Library section. Selecting one shows its size and flip; a character also shows its starting pose; a support character also shows its colour and its item and hat layers.
- **Actions:** when the selected shot shows a story scene, the timeline shows one row per character under the strip, in that shot's seconds. Actions are bars on the rows, like march bars. Click a row at the playhead to add one, pick what it does, and drag the bar to set when it starts and how long it lasts.
  - **Pose:** the character moves into a pose, blending over the bar's length, and holds it. Talk and walk keep moving for as long as they are held.
  - **Move:** the character walks (portrait) or glides (support) along the floor to a point dragged on the stage, over the bar's length, turning to face the way it goes. Walking plays the walk pose by itself.
- **Shots:** the Scene picker lists story scenes after battles, with their own mark on the strip like ⚔ for battles. Choosing a story scene sets the shot to hold one moment and hide the date. The carry-on switch sits in the shot editor.

## Data (sketch)

```ts
// A picture in the shared library, as one scene uses it
interface LibraryRef {
  kind: "backdrops" | "characters" | "props";
  path: string;
  colour?: BlockColour; // recoloured to one of the nine
  layers?: string[]; // support characters: the item and hat layers switched on
}

interface StoryScene {
  id: string;
  name: string;
  backdrop: LibraryRef;
  scale?: number; // the stage's size against the backdrop picture
}

type PoseName = "stand" | "walk" | "sit" | "talk" | "point" | "wave"
  | "cheer" | "folded" | "bow" | "kneel" | "fall";

interface StoryCharacter {
  id: string;
  portrait?: string; // a portrait's asset path, for a portrait character
  support?: LibraryRef; // or a support character from the library
  x: number; // feet, in stage units
  y: number;
  scale: number;
  flipped?: boolean;
  pose?: PoseName; // starting pose, stand when missing
}

interface StoryProp { id: string; ref: LibraryRef; x: number; y: number; scale: number; flipped?: boolean }

// Saved in the project file next to the battles
interface SavedStory extends StoryScene { characters: StoryCharacter[]; props: StoryProp[] }

// On Shot: the shot's own actions when it shows a story scene (Shot.scene = the story's id)
interface ShotStory {
  restart?: boolean; // start from the set instead of carrying on
  actions: StoryAction[];
}
type StoryAction =
  | { id: string; characterId: string; kind: "pose"; pose: PoseName; start: number; seconds: number }
  | { id: string; characterId: string; kind: "move"; to: { x: number; y: number }; start: number; seconds: number };
```

The shared library lives in `server/library/` (`backdrops/`, `characters/`, `props/`) with a `library.json` for floor lines, kept in git so the art is backed up. A new `server/routes/library.py` blueprint lists, uploads, deletes and serves it, reusing the PSD layer code. Recoloured combinations are made once and cached.

## Logic (pure, tested in `utils/`)

- `storyPoses.ts`: each pose as limb angles (shoulder, elbow, hip, knee for each side), blending between two poses, the looping talk and walk, the idle bob.
- `storyActions.ts`: where every character is and how it stands at a second of a shot: the set or the carried-on state, then the shot's actions in order; the end state of a shot, for carrying on.
- `storyFigure.ts`: a portrait character's limb lines from its pose, position, size and flip.
- Depth order: props and characters sorted by how low they stand.

The editor and the renderer both use these, so the editor shows what the video will.

## Rendering

- `prepare.ts` loads each story scene's backdrop and every library picture and portrait used, recoloured combinations made once.
- `scene.ts` gives a story shot's frame: the backdrop as its ground, then props and characters back to front, with each portrait character's limbs.
- `drawFrame.ts` draws the limbs as round-ended dark lines behind the circle.
- Cuts, fades, dissolves and wipes between story scenes, battles and the map work as they do now.

## Additions agreed 21 October 2026

Five small ideas from `FEATURE_IDEAS_PLAN.md` join 9.9, built after step 6 (or folded into steps 3 and 4 where they fit):
- **A2 Reaction marks:** ! ? anger lines, sweat drop, zzz, music notes, heart, popping up above a head for a moment; an action on the character's row.
- **A6 Entrances and exits:** enter or leave by the left edge, right edge, or a door marked on the backdrop, walking to or from the placed spot.
- **B1 Depth layers:** `front` and `far` backdrop layers (see the art specs).
- **E1 Portrait variants and moods:** several portrait pictures per person, swapped by an action with a blend. Moods never draw on the face, because the eyes sit in a different place on every portrait: angry = red glow, quick shake and steam puffs; sad = colour greys and arms droop; afraid = fast tremble; happy = small bounce.
- **E3 Silhouette shots:** a story shot switch that turns characters and props black against a chosen sky colour.

The next item, **9.10 Story talk and camera**, adds A1 speech and subtitles and B3 scene camera presets.

## Build steps

1. **Library:** the server folder and routes; the Library section in Assets; uploading, deleting, floor lines; recoloured combinations.
2. **Story scenes and the set:** the model and project file (load and save); the Story scenes section in the Scene tab; the stage on the canvas; placing, sizing, flipping and layering characters and props; support character colour and layers.
3. **Portrait figures and poses:** stick limbs, the eleven poses, blending, idle bob, with tests.
4. **Shot actions:** the per-character timeline rows; pose and move actions; carrying on between shots and the restart switch, with tests.
5. **Shots:** story scenes in the Scene picker, the strip mark, holding one moment and hiding the date by default.
6. **Renderer:** story shots in the video, transitions included.

Each step ends with a numbered test list for Chris. Chris commits when the whole of 9.9 is tested.

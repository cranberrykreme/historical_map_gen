# Animation plan

Agreed with Chris on 20 October 2026, before any code was written. This plan adds a lot more movement to HistoryMapGenerator, area by area. Nothing here is built yet; each item is built and tested on its own, in the backlog order at the end.

## What moves today

- Units march along paths: they turn on the spot first, then speed up and slow down (`utils/pathPlayback.ts`).
- Blocks thin as they take losses; armies join and leave.
- Six death styles with crosses or patches left behind, timed in seconds of video from the `leaves` moment (`utils/exits.ts`).
- Cameras move per shot; cuts, fades, dissolves and wipes between shots.
- Units **appear** with no animation, and nothing moves while it stands still.

## Shared rules

- **Effects run in seconds of video**, like deaths, so a sway or a volley looks the same however fast a shot moves through history. **When** something happens (an arrival, a clash) is still a moment in history, as now.
- All the logic is pure functions in `client/src/utils/` with Jest tests, used by both the editor and the renderer, so the editor shows exactly what the video will.
- Every automatic effect has an off switch, so a clean textbook look is always possible.

## 1. Arrivals (week 11)

Arrivals mirror deaths. Each unit gets an **arrival style** and a length in seconds in the Animations tab, starting when the video reaches its `appears` moment.

| Style | What it does | Default for | Mirrors |
|---|---|---|---|
| Fade in | Fades up | anything else | Fade |
| Grow | Grows from a dot with a small overshoot | | |
| Drop in | Falls onto the map with a shadow and a small bounce, like a game piece | | |
| Ink in | Outline draws itself, then fills | portraits | Tear |
| Rally | Pieces fly together | blocks | Shatter |
| Surface | Rises out of the water with ripples | ships | Sink |

Marching or sailing in from the edge of the map stays week 11's own feature, as planned.

**Data:** `Unit.arrival?: { style: ArrivalStyle; seconds?: number }`, tidied like `tidyExit`. The Animations tab's list of arrivals shows the style, like deaths.

## 2. Life while marching (week 11)

**March motion**, automatic from the unit's kind while it is on a march, stopping when it stops:
- soldiers (rotating unit art): a small step sway
- horse blocks: a quicker bounce
- foot and archer blocks: a gentle ripple along the front
- portraits: a bob
- ships (upright travel): a slow rock

Per unit in the Animations tab: an Off switch and a strength slider.

**Dust and wakes**, automatic: small puffs of dust that drift and fade behind land marches, and a short V-shaped wake behind ships. In battles, land or water comes from the terrain under the unit; on the main map it follows the unit's kind (ships get a wake, everything else dust). A switch per unit and one for the whole project.

**Data:** `Unit.motion?: { off?: boolean; strength?: number; trail?: boolean }`; `ProjectData.trails?: boolean` (on when missing).

## 3. Battle action (new week 11.5)

Battle events are **placed by hand**, the way block losses are set now: pick the units, and a start and end on the timeline. They show as bars in the Animations tab and on the timeline, and can be listed and removed like losses.

- **Clash:** pick two units. From start to end, both fronts jostle, and flashes and dust puffs flicker along the line between them. (Chris chose hand placement over automatic contact.)
- **Arrow volley:** pick the shooting unit and its target, start and end, and how often a volley flies (seconds of video). A flight of small arrows arcs across and fades where it lands. Archer blocks suggest themselves as the shooter. The same event can later cover ship cannon and catapults.
- **Charge:** a **Charge** switch on a march. Instead of easing in and out it builds speed and arrives fast; units lean forward slightly, with short speed lines and heavier dust; a small jolt on arrival, running into a clash if one starts there. An optional **camera shake** on arrival, with its own switch.

**Data (sketch):**
```ts
interface BattleEvent {
  id: string;
  kind: "clash" | "volley";
  a: string;        // unit id (the shooter, for a volley)
  b: string;        // unit id (the target, for a volley)
  start: number;    // history
  end: number;      // history
  every?: number;   // volleys: seconds of video between volleys
}
// SceneContent.events?: BattleEvent[]  (main map and battles alike)
// MarchTiming.charge?: boolean; MarchTiming.shake?: boolean
```

## 4. Marks on the map (week 12 and 13)

**Week 12** keeps its march trails, and adds marks you place yourself in the Drawing tab, on the main map and in battles. Each draws itself on over a stretch of history and can fade later or stay:
- **Campaign arrows:** big curved textbook arrows, drawn tip first along a curve.
- **Labels:** place names that write themselves in letter by letter.
- **Pins:** drop on a place with a pulsing ring.

**Week 13** territory borders: each change of shape picks how it animates, **Ink spread** by default (new land floods out from the old border with a dark leading edge; lost land drains back), or **Smooth morph** (the border slides to the new shape), or **Fade** (old fades out as new fades in).

## 5. Idle life (week 15)

**Battle terrain moves by itself:** deep water and lakes shimmer with slow waves, rivers flow, forests sway gently, towns send up thin smoke, marsh reeds ripple. A switch and a strength slider per battle. The main map is Chris's own picture, so the app can't tell water from land there and it stays still (week 17 weather can cover it).

**Unit art moves by its PSD layer names**, like the 9.9 art specs:
- `flag` flutters, `sail` billows, `swing` (a sword or axe arm) swings, `oars` row
- a tiny `pivot` dot layer marks where an arm or flag turns

Timing is automatic: flags and sails always move gently, oars row while marching, and swing layers swing during a clash or volley the unit is in. Art without these layer names keeps working and stays still.

## 6. Text and titles (week 10.5, and later)

- **Date:** rolls its numbers like an odometer while time runs (each part rolls only when it changes, blurring past when time moves fast), and flips like a calendar page when a cut jumps to a new date.
- **Popups and portraits (10.5):** slide in from their corner and slide back out; popup text can optionally type itself out letter by letter.
- **Title cards:** no automatic chapter cards. Chris wants to place title cards by hand, eventually: a later item, with text placed on a shot and animated in and out.

## 7. Story scenes after 9.9

All three wanted, in this order:
1. **Holding props:** a goblet raised in a toast, a scroll read out, a sword drawn.
2. **More poses:** drink, eat, shake hands, embrace, kneel to swear an oath, sleep.
3. **Moving props:** a door swings, a fire flickers, a banner waves, using the week 15 layer names.

## 8. Transitions

Five new kinds in the existing transition picker, drawn in the renderer's existing blend step:
- **Page turn:** the old picture curls away like a book page.
- **Ink bleed:** the new shot spreads in like ink on paper.
- **Iris:** a circle closes on a point and opens on the next shot.
- **Burn:** the old picture browns and burns away from its edges.
- **Zoom through:** the camera dives into a battle's spot on the map and comes out in the battle.

## Backlog changes (agreed 20 October 2026)

- **10.5 corner overlays:** adds the rolling and flipping date, and popups and portraits sliding in with optional typing.
- **11 asset animations:** 11.1 arrival styles; 11.2 march motion; 11.3 dust and wakes; 11.4 arriving from the map edge and ships boarding (as planned).
- **New 11.5 battle action:** clashes, arrow volleys, charges and camera shake.
- **12 path trails:** adds hand-placed arrows, labels and pins.
- **13 territory borders:** with ink spread, morph and fade per change.
- **15 PSD animation:** layer-name motion with automatic timing (15.1), plus moving battle terrain (15.2).
- **New 15.5 story scene extras:** holding props, more poses, moving props.
- **New 15.6 transitions and title cards:** the five transitions, then hand-placed title cards.
- 16 full render, 17 weather, 18 packaging, 19 polish stay as they are.

Each item ends with a numbered test list for Chris. Chris commits when a whole item is tested.

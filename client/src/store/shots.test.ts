import { useMapStore } from "./useMapStore";
import { DEFAULT_STORY_START } from "../utils/project/convertProject";
import { MIN_SHOT_SECONDS, MIN_TRANSITION_SECONDS } from "../utils/video/shots";

const S = DEFAULT_STORY_START;
const store = () => useMapStore.getState();
const ids = () => store().shots.map((shot) => shot.id);

beforeEach(() => store().resetMapState());

test("a new shot carries on from the one before it and is selected", () => {
  const first = store().addShot({ from: S, to: S + 3, seconds: 8 });
  expect(store().shots[0]).toMatchObject({
    name: "Shot 1",
    from: S,
    to: S + 3,
    seconds: 8,
  });
  expect(store().selectedShotId).toBe(first);

  const second = store().addShot();
  expect(store().shots[1]).toMatchObject({
    name: "Shot 2",
    from: S + 3,
    to: S + 10,
    seconds: 10,
  });
  expect(store().selectedShotId).toBe(second);
});

test("a new shot goes straight after the selected one", () => {
  const a = store().addShot();
  const b = store().addShot();
  store().selectShot(a);
  const c = store().addShot();
  expect(ids()).toEqual([a, c, b]);
});

test("the very first shot starts at the story's start", () => {
  store().addShot();
  expect(store().shots[0].from).toBe(S);
});

test("editing a shot is one undo step, keeps it playable, and a no-op adds no step", () => {
  const id = store().addShot();
  const steps = store().past.length;

  store().updateShot(id, { seconds: 0, ease: true, name: "  Hastings " });
  expect(store().shots[0]).toMatchObject({
    seconds: MIN_SHOT_SECONDS,
    ease: true,
    name: "Hastings",
  });
  expect(store().past.length).toBe(steps + 1);

  store().updateShot(id, { name: "Hastings" });
  expect(store().past.length).toBe(steps + 1);

  // Turning an option off removes it rather than storing false
  store().updateShot(id, { ease: false });
  expect("ease" in store().shots[0]).toBe(false);

  store().undo();
  expect(store().shots[0].ease).toBe(true);
});

test("shots can be reordered and deleted, and undo brings them back", () => {
  const a = store().addShot();
  const b = store().addShot();
  const c = store().addShot();

  store().moveShotTo(c, 0);
  expect(ids()).toEqual([c, a, b]);

  store().deleteShot(a);
  expect(ids()).toEqual([c, b]);
  expect(store().selectedShotId).toBe(c);

  store().undo();
  expect(ids()).toEqual([c, a, b]);
  store().undo();
  expect(ids()).toEqual([a, b, c]);
});

test("undo past a shot's creation clears it from the selection", () => {
  const id = store().addShot();
  expect(store().selectedShotId).toBe(id);
  store().undo();
  expect(store().shots).toEqual([]);
  expect(store().selectedShotId).toBeNull();
});

test("loading shots bypasses undo, and starting a new project clears them", () => {
  store().setShots([
    { id: "x", name: "Shot 1", seconds: 5, from: S, to: S + 1 },
  ]);
  expect(store().past).toHaveLength(0);
  store().selectShot("x");
  store().selectShot("not-a-shot");
  expect(store().selectedShotId).toBeNull();

  store().resetMapState();
  expect(store().shots).toEqual([]);
});

test("a shot's camera views and transition are one undo step each, and can be cleared", () => {
  const id = store().addShot();
  const view = { centerX: 10, centerY: 20, height: 300 };
  const steps = store().past.length;

  store().updateShot(id, { startView: view });
  expect(store().shots[0].startView).toEqual(view);
  expect(store().past.length).toBe(steps + 1);

  // The same view again is not a change
  store().updateShot(id, { startView: { ...view } });
  expect(store().past.length).toBe(steps + 1);

  store().updateShot(id, {
    transition: { kind: "fade", seconds: 0, direction: "up" },
    followOn: true,
  });
  // Only wipes keep a direction, and a transition is never shorter than the minimum
  expect(store().shots[0].transition).toEqual({
    kind: "fade",
    seconds: MIN_TRANSITION_SECONDS,
  });
  expect(store().shots[0].followOn).toBe(true);

  // Clearing: no start view, a cut, and not following on leave nothing stored
  store().updateShot(id, {
    startView: undefined,
    transition: { kind: "cut", seconds: 1 },
    followOn: false,
  });
  const cleared = store().shots[0];
  expect("startView" in cleared).toBe(false);
  expect("transition" in cleared).toBe(false);
  expect("followOn" in cleared).toBe(false);

  store().undo();
  expect(store().shots[0].transition?.kind).toBe("fade");
  store().undo();
  store().undo();
  expect(store().shots[0].startView).toBeUndefined();
});

test("the video's shape is set without an undo step, and a new project starts landscape", () => {
  store().setVideoFrame("portrait");
  expect(store().videoFrame).toBe("portrait");
  expect(store().past).toHaveLength(0);
  store().resetMapState();
  expect(store().videoFrame).toBe("landscape");
});

test("a fade out is one undo step, never shorter than the minimum, and clears away", () => {
  const id = store().addShot();
  const steps = store().past.length;
  store().updateShot(id, { fadeOut: 0.01 });
  expect(store().shots[0].fadeOut).toBe(MIN_TRANSITION_SECONDS);
  store().updateShot(id, { fadeOut: 2 });
  store().updateShot(id, { fadeOut: 2 }); // no change, no step
  expect(store().past.length).toBe(steps + 2);
  store().updateShot(id, { fadeOut: undefined });
  expect("fadeOut" in store().shots[0]).toBe(false);
  store().undo();
  expect(store().shots[0].fadeOut).toBe(2);
});

test("the saved view is remembered without an undo step, and cleared for a new project", () => {
  store().setSavedViewport({ centerX: 1, centerY: 2, scale: 3 });
  expect(store().savedViewport).toEqual({ centerX: 1, centerY: 2, scale: 3 });
  expect(store().past).toHaveLength(0);
  store().resetMapState();
  expect(store().savedViewport).toBeNull();
});

test("following an army is one undo step, and choosing nobody clears it", () => {
  const id = store().addShot();
  store().updateShot(id, { follow: "army-1" });
  expect(store().shots[0].follow).toBe("army-1");
  store().updateShot(id, { follow: undefined });
  expect("follow" in store().shots[0]).toBe(false);
  store().undo();
  expect(store().shots[0].follow).toBe("army-1");
});

describe("shots of battles", () => {
  const view = { centerX: 1, centerY: 2, height: 300 };

  test("a shot added while a battle is open films that battle", () => {
    const battle = store().addBattle({ name: "Hastings" });
    store().switchScene(battle);
    const id = store().addShot();
    expect(store().shots.find((s) => s.id === id)?.scene).toBe(battle);
    store().switchScene("map");
    const other = store().addShot();
    expect(store().shots.find((s) => s.id === other)).not.toHaveProperty(
      "scene"
    );
  });

  test("moving a shot to another scene starts its camera afresh there", () => {
    const battle = store().addBattle();
    const id = store().addShot();
    store().updateShot(id, { startView: view, endView: view, follow: "x" });
    store().updateShot(id, { scene: battle });
    const moved = store().shots[0];
    expect(moved.scene).toBe(battle);
    expect(moved).not.toHaveProperty("startView");
    expect(moved).not.toHaveProperty("endView");
    expect(moved).not.toHaveProperty("follow");

    // Back to the main map leaves no scene behind
    store().updateShot(id, { scene: "map" });
    expect(store().shots[0]).not.toHaveProperty("scene");
  });

  test("deleting a battle sends its shots back to the main map, and undo brings them back", () => {
    const battle = store().addBattle();
    const id = store().addShot();
    store().updateShot(id, { scene: battle });
    store().updateShot(id, { endView: view });
    store().deleteBattle(battle);
    expect(store().shots[0]).not.toHaveProperty("scene");
    expect(store().shots[0]).not.toHaveProperty("endView");
    store().undo();
    expect(store().shots[0]).toMatchObject({ scene: battle, endView: view });
  });
});

describe("chapters", () => {
  const names = () => store().shots.map((shot) => shot.chapter ?? "-");

  test("naming a chapter on a shot starts it there; clearing the name ends it", () => {
    const a = store().addShot();
    const b = store().addShot();
    store().updateShot(b, { chapter: "  Landing " });
    expect(names()).toEqual(["-", "Landing"]);
    store().updateShot(b, { chapter: "" });
    expect(names()).toEqual(["-", "-"]);
    store().updateShot(a, { chapter: "Opening" });
    store().updateShot(a, { chapter: undefined });
    expect(names()).toEqual(["-", "-"]);
  });

  test("moving or deleting the shot that starts a chapter leaves the chapter in place", () => {
    const a = store().addShot();
    const b = store().addShot();
    const c = store().addShot();
    store().updateShot(b, { chapter: "Landing" });
    store().moveShotTo(b, 0);
    expect(ids()).toEqual([b, a, c]);
    // The chapter stays where it was, now starting at the shot that was after b
    expect(names()).toEqual(["-", "-", "Landing"]);

    store().deleteShot(c);
    expect(names()).toEqual(["-", "-"]);
    store().undo();
    expect(names()).toEqual(["-", "-", "Landing"]);
  });
});

test("dropping a shot into another chapter is one undo step", () => {
  const a = store().addShot();
  const b = store().addShot();
  store().updateShot(b, { chapter: "Landing" });
  const steps = store().past.length;
  store().dropShotAt(a, { beforeId: null, join: false });
  expect(ids()).toEqual([b, a]);
  expect(store().past.length).toBe(steps + 1);
  store().undo();
  expect(ids()).toEqual([a, b]);
});

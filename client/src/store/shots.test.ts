import { useMapStore } from "./useMapStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { MIN_SHOT_SECONDS } from "../utils/shots";

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

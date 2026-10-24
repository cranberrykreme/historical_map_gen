import { dragShotSpan, layoutShotsLane } from "./shotsLane";
import { Shot } from "../../types";

const shot = (id: string, from: number, to: number): Shot => ({
  id,
  name: id,
  seconds: 5,
  from,
  to,
});

const lines = (shots: Shot[]) =>
  layoutShotsLane(shots).places.map((place) => [place.shot.id, place.line]);

test("shots that follow on through history share one line", () => {
  expect(lines([shot("a", 0, 2), shot("b", 2, 5), shot("c", 6, 8)])).toEqual([
    ["a", 0],
    ["b", 0],
    ["c", 0],
  ]);
  expect(layoutShotsLane([shot("a", 0, 2)]).lines).toBe(1);
});

test("shots that overlap or go back in history stack below", () => {
  const lane = layoutShotsLane([
    shot("a", 0, 5),
    shot("overlap", 3, 6),
    shot("back", 1, 2),
    shot("on", 6, 7),
  ]);
  expect(lane.places.map((p) => p.line)).toEqual([0, 1, 2, 0]);
  expect(lane.lines).toBe(3);
});

test("a held moment between two shots drops below their join", () => {
  expect(
    lines([shot("a", 0, 2), shot("title", 2, 2), shot("b", 2, 4)])
  ).toEqual([
    ["a", 0],
    ["title", 1],
    ["b", 0],
  ]);
});

test("an empty lane still has one line", () => {
  expect(layoutShotsLane([])).toEqual({ places: [], lines: 1 });
});

test("dragging a bracket's ends changes From and To, snapped", () => {
  const s = { from: 10, to: 20 };
  expect(dragShotSpan(s, "from", 2.4, 1)).toEqual({ from: 12, to: 20 });
  expect(dragShotSpan(s, "to", -3.6, 1)).toEqual({ from: 10, to: 16 });
  expect(dragShotSpan(s, "move", 5.2, 1)).toEqual({ from: 15, to: 25 });
});

test("an end dragged past the other stops there, so the shot holds that moment", () => {
  const s = { from: 10, to: 20 };
  expect(dragShotSpan(s, "from", 15, 1)).toEqual({ from: 20, to: 20 });
  expect(dragShotSpan(s, "to", -15, 1)).toEqual({ from: 10, to: 10 });
});

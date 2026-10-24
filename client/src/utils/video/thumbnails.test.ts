import { thumbnailKey, thumbnailMoment } from "./thumbnails";
import { Shot } from "../../types";

const shot = (id: string, extra: Partial<Shot> = {}): Shot => ({
  id,
  name: id,
  seconds: 10,
  from: 0,
  to: 1,
  ...extra,
});
const view = { centerX: 0, centerY: 0, height: 100 };

test("a shot's picture comes from just after its transition in", () => {
  const shots = [
    shot("a", { transition: { kind: "fade", seconds: 2 } }),
    shot("b", { transition: { kind: "dissolve", seconds: 4 } }),
    shot("c"),
  ];
  expect(thumbnailMoment(shots, 0)).toBeCloseTo(2.05);
  expect(thumbnailMoment(shots, 1)).toBeCloseTo(12.05);
  expect(thumbnailMoment(shots, 2)).toBeCloseTo(20.05);
});

test("a very short shot still gives a moment inside it", () => {
  const shots = [
    shot("a", { seconds: 1, transition: { kind: "fade", seconds: 1 } }),
  ];
  expect(thumbnailMoment(shots, 0)).toBeCloseTo(0.9);
});

test("the picture is remade when the shot, the shot it carries on from, or its scene changes", () => {
  const shots = [shot("a"), shot("b")];
  const key = thumbnailKey(shots, 1, "v1");
  expect(thumbnailKey(shots, 1, "v1")).toBe(key);
  expect(thumbnailKey(shots, 1, "v2")).not.toBe(key);
  expect(
    thumbnailKey([shot("a", { seconds: 4 }), shot("b")], 1, "v1")
  ).not.toBe(key);
  // A shot with its own start view doesn't depend on the one before
  const own = [shot("a"), shot("b", { startView: view })];
  expect(thumbnailKey(own, 1, "v1")).toBe(
    thumbnailKey([shot("a", { seconds: 4 }), own[1]], 1, "v1")
  );
});

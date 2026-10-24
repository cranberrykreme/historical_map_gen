import { cameraWords, shotRows } from "./openShot";
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

test("the camera row says what the camera does, and who it follows", () => {
  expect(cameraWords(shot("a"), null)).toBe(
    "Starts where the camera was, holds"
  );
  expect(
    cameraWords(shot("a", { startView: view, endView: view }), "Normans")
  ).toBe("Starts at its own view, moves to its end view · follows Normans");
  expect(cameraWords(shot("a", { followOn: true }), null)).toBe(
    "Carries on from the shot before, holds"
  );
});

test("a plain shot has a camera row and the date", () => {
  const rows = shotRows([shot("a")], 0, null);
  expect(rows.map((row) => row.key)).toEqual(["camera", "overlays"]);
  expect(rows[0].bars[0]).toMatchObject({ from: 0, to: 10 });
});

test("transitions sit half in each shot, and the first comes in from black in full", () => {
  const shots = [
    shot("a", { transition: { kind: "fade", seconds: 2 } }),
    shot("b", { transition: { kind: "dissolve", seconds: 4 } }),
    shot("c", { fadeOut: 3, hideDate: true }),
  ];
  expect(shotRows(shots, 0, null)[1].bars).toEqual([
    {
      from: 0,
      to: 2,
      label: "In: Fade through black",
      hint: "0:02 across the cut",
    },
    { from: 8, to: 10, label: "Out: Dissolve", hint: "0:04 across the cut" },
  ]);
  expect(shotRows(shots, 1, null)[1].bars[0]).toMatchObject({ from: 0, to: 2 });
  const last = shotRows(shots, 2, null);
  expect(last.map((row) => row.key)).toEqual(["camera", "cuts"]);
  expect(last[1].bars).toEqual([{ from: 7, to: 10, label: "Fades to black" }]);
});

test("a shot that isn't there has no rows", () => {
  expect(shotRows([], 0, null)).toEqual([]);
});

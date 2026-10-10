import { parseProject, shotsFromPacing } from "./convertProject";
import { historyAt } from "./shots";
import { toHistoryTime } from "./historyTime";

const D1 = toHistoryTime({ year: 1066, month: 9, day: 25 });
const D2 = toHistoryTime({ year: 1066, month: 10, day: 14 });
const D3 = toHistoryTime({ year: 1066, month: 12, day: 25 });

test("date markers become one shot per stretch between them, playing as the old video did", () => {
  const keys = [
    { seconds: 0, time: D1 },
    { seconds: 30, time: D2 },
    { seconds: 50, time: D3 },
  ];
  const shots = shotsFromPacing(keys);
  expect(shots).toEqual([
    { id: "shot-1", name: "Shot 1", seconds: 30, from: D1, to: D2 },
    { id: "shot-2", name: "Shot 2", seconds: 20, from: D2, to: D3 },
  ]);
  // Every second of the old video shows the same moment as before
  expect(historyAt(shots, 15)).toBeCloseTo(D1 + (D2 - D1) / 2, 9);
  expect(historyAt(shots, 40)).toBeCloseTo(D2 + (D3 - D2) / 2, 9);
});

test("a first marker after 0:00 gets a shot for the time before it", () => {
  const shots = shotsFromPacing([
    { seconds: 10, time: D1 },
    { seconds: 30, time: D2 },
  ]);
  expect(shots).toHaveLength(2);
  expect(shots[0].seconds).toBe(10);
  expect(shots[0].to).toBe(D1);
  // Carrying on at the pace of the first stretch, back to 0:00
  expect(shots[0].from).toBeCloseTo(D1 - (D2 - D1) / 2, 9);
});

test("no markers, or a single one at 0:00, means no shots yet", () => {
  expect(shotsFromPacing([])).toEqual([]);
  expect(shotsFromPacing([{ seconds: 0, time: D1 }])).toEqual([]);
});

test("a version 1 project's date markers become its first shots", () => {
  const project = parseProject({
    units: [],
    paths: [],
    dateMarkers: [
      { id: "m1", time: 0, year: 1066, month: 9, day: 25 },
      { id: "m2", time: 30, year: 1066, month: 10, day: 14 },
    ],
  });
  expect(project.shots).toEqual([
    { id: "shot-1", name: "Shot 1", seconds: 30, from: D1, to: D2 },
  ]);
});

test("a project saved before shots gets them from its pacing; saved shots are kept as they are", () => {
  const pacing = [
    { seconds: 0, time: D1 },
    { seconds: 30, time: D2 },
  ];
  expect(parseProject({ version: 3, units: [], pacing }).shots).toHaveLength(1);

  const saved = [{ id: "x", name: "Hastings", seconds: 12, from: D2, to: D2 }];
  expect(
    parseProject({ version: 3, units: [], pacing, shots: saved }).shots
  ).toEqual(saved);
  // Deleting every shot and saving keeps it that way
  expect(
    parseProject({ version: 3, units: [], pacing, shots: [] }).shots
  ).toEqual([]);
});

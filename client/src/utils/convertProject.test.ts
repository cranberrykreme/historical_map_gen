import { MapPath, PathPoint, Unit } from "../types";
import {
  DEFAULT_STORY_START,
  emptyProject,
  legacyClock,
  pacingFromMarkers,
  parseProject,
} from "./convertProject";
import { attachUnits } from "./formation";
import { toHistoryTime } from "./historyTime";
import { createPlayback } from "./pathPlayback";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

const east = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];

// A path as a version 1 file stored it: timed in seconds on the video
function legacyPath(
  id: string,
  points: PathPoint[],
  units: Unit[],
  start?: number,
  end?: number
) {
  const attachment = attachUnits(
    { id, name: id, points, assignments: [] },
    units
  )!;
  return { id, name: id, ...attachment, start, end };
}

const day = (year: number, month: number, d: number) =>
  toHistoryTime({ year, month, day: d });

test("with no date markers, a second becomes a day from 1 January 1066", () => {
  const units = [unit("a", 0, 0)];
  const project = parseProject({
    units,
    paths: [legacyPath("p", east, units, 2, 13.5)],
  });

  expect(project.storyStart).toBe(DEFAULT_STORY_START);
  expect(project.storyStart).toBe(day(1066, 1, 1));
  const march = project.paths[0].march!;
  expect(march.start).toBeCloseTo(DEFAULT_STORY_START + 2, 9);
  expect(march.end).toBeCloseTo(DEFAULT_STORY_START + 13.5, 9);
  // The turn keeps its share of the bar: 150 of a 1150 run
  expect(march.turn).toBeCloseTo(11.5 * (150 / 1150), 3);
  expect(
    (project.paths[0] as MapPath & { start?: number }).start
  ).toBeUndefined();
});

test("between date markers the seconds run straight from one date to the next, and carry on beyond them", () => {
  const keys = pacingFromMarkers([
    { id: "b", time: 10, year: 1066, month: 10, day: 1 },
    { id: "a", time: 0, year: 1066, month: 9, day: 1 },
  ]);
  expect(keys.map((k) => k.seconds)).toEqual([0, 10]);

  const clock = legacyClock(keys);
  expect(clock(0)).toBe(day(1066, 9, 1));
  expect(clock(5)).toBeCloseTo(day(1066, 9, 16), 9); // 30 days over 10 seconds
  expect(clock(10)).toBe(day(1066, 10, 1));
  expect(clock(20)).toBeCloseTo(day(1066, 10, 31), 9);

  // One marker: a second is a day, either side of it
  const one = legacyClock(
    pacingFromMarkers([{ id: "a", time: 4, year: 1066, month: 10, day: 14 }])
  );
  expect(one(0)).toBe(day(1066, 10, 10));
});

test("an old march with no end set lasts as long as it did before", () => {
  const units = [unit("a", 0, 0)];
  const path = legacyPath("p", east, units);
  const project = parseProject({ units, paths: [path] });
  const length = createPlayback(path, units).length;

  expect(project.paths[0].march!.start).toBe(DEFAULT_STORY_START);
  expect(project.paths[0].march!.end - DEFAULT_STORY_START).toBeCloseTo(
    Math.round((length / 100) * 10) / 10,
    9
  );
});

test("an old project keeps its markers as pacing, its display mode, and starts where 0:00 was", () => {
  const units = [unit("a", 0, 0)];
  const project = parseProject({
    units,
    paths: [legacyPath("p", east, units, 0, 10)],
    dateMarkers: [
      { id: "a", time: 0, year: 1066, month: 9, day: 20 },
      { id: "b", time: 10, year: 1066, month: 9, day: 25 },
      { id: "bad", time: "x", year: 1066, month: 1, day: 1 },
    ],
    dateMode: "days",
  });

  expect(project.storyStart).toBe(day(1066, 9, 20));
  expect(project.displayMode).toBe("days");
  expect(project.pacing).toEqual([
    { seconds: 0, time: day(1066, 9, 20) },
    { seconds: 10, time: day(1066, 9, 25) },
  ]);
  expect(project.paths[0].march!.end).toBe(day(1066, 9, 25));
});

test("paths with no units are not dated", () => {
  const project = parseProject({
    units: [],
    paths: [{ id: "p", name: "p", points: east, assignments: [], start: 3 }],
  });
  expect(project.paths[0].march).toBeUndefined();
});

test("a version 2 project is read as it is", () => {
  const march = { start: day(1066, 9, 20), end: day(1066, 9, 25), turn: 0.5 };
  const project = parseProject({
    version: 2,
    units: [{ ...unit("a", 0, 0), appears: day(1066, 9, 1), leaves: "soon" }],
    paths: [{ id: "p", name: "p", points: east, assignments: [], march }],
    storyStart: day(1066, 9, 1),
    displayMode: "times",
    pacing: [
      { seconds: 0, time: 1 },
      { seconds: "x", time: 2 },
    ],
    selectedMapFilename: "england.svg",
    viewport: { centerX: 1, centerY: 2, scale: 3 },
  });

  expect(project.paths[0].march).toEqual(march);
  expect(project.storyStart).toBe(day(1066, 9, 1));
  expect(project.displayMode).toBe("times");
  expect(project.pacing).toEqual([{ seconds: 0, time: 1 }]);
  expect(project.units[0].appears).toBe(day(1066, 9, 1));
  expect(project.units[0].leaves).toBeUndefined();
  expect(project.selectedMapFilename).toBe("england.svg");
  expect(project.viewport).toEqual({ centerX: 1, centerY: 2, scale: 3 });

  expect(
    parseProject({ version: 2, units: [], displayMode: "weeks" }).displayMode
  ).toBe("months");
});

test("anything unreadable loads as an empty project", () => {
  expect(parseProject(null)).toEqual(emptyProject());
  expect(parseProject("nonsense")).toEqual(emptyProject());
});

import { Shot } from "../types";
import {
  cleanName,
  formatBytes,
  formatDuration,
  frameCount,
  frameTime,
  secondsLeft,
  shotRange,
  wholeVideo,
} from "./frames";

const shot = (
  id: string,
  seconds: number,
  extra: Partial<Shot> = {}
): Shot => ({
  id,
  name: id,
  seconds,
  from: 0,
  to: 10,
  ...extra,
});

test("a video has one frame for every 1/fps seconds of it", () => {
  expect(frameCount(10, 24)).toBe(240);
  expect(frameCount(2.5, 24)).toBe(60);
  // a part frame at the end rounds to the nearest frame
  expect(frameCount(1.02, 24)).toBe(24);
  expect(frameCount(1.03, 24)).toBe(25);
});

test("even an empty video has a frame, so it still makes a file", () => {
  expect(frameCount(0, 24)).toBe(1);
});

test("each frame shows its own moment, starting at the very start", () => {
  expect(frameTime(0, 24)).toBe(0);
  expect(frameTime(24, 24)).toBe(1);
  expect(frameTime(36, 24)).toBe(1.5);
});

test("the time left is guessed from the pace so far, once there's enough to go on", () => {
  expect(secondsLeft(3, 100, 1)).toBeNull();
  expect(secondsLeft(10, 100, 5)).toBe(45);
  expect(secondsLeft(100, 100, 50)).toBe(0);
});

test("durations and sizes read naturally", () => {
  expect(formatDuration(45)).toBe("45 s");
  expect(formatDuration(125)).toBe("2 min 05 s");
  expect(formatBytes(500)).toBe("1 KB");
  expect(formatBytes(35_860_000)).toBe("34.2 MB");
});

test("a stretch of the video starts its frames from its own start", () => {
  expect(frameTime(0, 24, 5)).toBe(5);
  expect(frameTime(12, 24, 5)).toBe(5.5);
});

test("the whole video runs from the start to the end of the last shot", () => {
  expect(wholeVideo([shot("a", 4), shot("b", 6)])).toEqual({ from: 0, to: 10 });
  expect(wholeVideo([])).toEqual({ from: 0, to: 0 });
});

describe("one shot on its own", () => {
  test("with cuts either side, it's just the shot", () => {
    const shots = [shot("a", 4), shot("b", 6), shot("c", 5)];
    expect(shotRange(shots, 1)).toEqual({ from: 4, to: 10 });
  });

  test("it takes in the halves of the transitions into and out of it", () => {
    const shots = [
      shot("a", 4),
      shot("b", 6, { transition: { kind: "dissolve", seconds: 2 } }),
      shot("c", 5, {
        transition: { kind: "wipe", seconds: 1, direction: "left" },
      }),
    ];
    expect(shotRange(shots, 1)).toEqual({ from: 3, to: 10.5 });
  });

  test("the first shot's fade from black and the last shot's fade out are inside it", () => {
    const shots = [
      shot("a", 4, { transition: { kind: "fade", seconds: 2 } }),
      shot("b", 6, { fadeOut: 2 }),
    ];
    expect(shotRange(shots, 0)).toEqual({ from: 0, to: 4 });
    expect(shotRange(shots, 1)).toEqual({ from: 4, to: 10 });
  });

  test("a shot that isn't there has no range", () => {
    expect(shotRange([shot("a", 4)], 3)).toBeNull();
  });
});

test("file names are cleaned the way the server cleans them", () => {
  expect(cleanName("Battle of Hastings!")).toBe("Battle_of_Hastings");
  expect(cleanName("my-video.mp4")).toBe("my-video");
  expect(cleanName("???")).toBe("video");
});

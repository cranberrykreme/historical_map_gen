import { Shot } from "../types";
import {
  chapterOfShot,
  dropShot,
  chaptersOf,
  handOnChapter,
  nextChapterName,
  shotListRows,
} from "./chapters";

const shot = (id: string, seconds = 10, chapter?: string): Shot => ({
  id,
  name: `Shot ${id}`,
  seconds,
  from: 0,
  to: 1,
  ...(chapter !== undefined ? { chapter } : {}),
});

const video = [
  shot("a", 5),
  shot("b", 10, "Landing"),
  shot("c", 10),
  shot("d", 20, "Battle"),
];

test("a chapter runs from the shot that starts it to the next one", () => {
  expect(chaptersOf(video)).toEqual([
    { name: null, first: 0, last: 0, from: 0, to: 5 },
    { name: "Landing", first: 1, last: 2, from: 5, to: 25 },
    { name: "Battle", first: 3, last: 3, from: 25, to: 45 },
  ]);
  expect(chaptersOf([])).toEqual([]);
  // A video that starts with a chapter has no unnamed run
  expect(chaptersOf(video.slice(1)).map((c) => c.name)).toEqual([
    "Landing",
    "Battle",
  ]);
});

test("each shot belongs to one chapter", () => {
  const chapters = chaptersOf(video);
  expect(chapterOfShot(chapters, 2)?.name).toBe("Landing");
  expect(chapterOfShot(chapters, 0)?.name).toBeNull();
  expect(chapterOfShot(chapters, 9)).toBeNull();
});

test("new chapters are numbered after the highest used", () => {
  expect(nextChapterName(video)).toBe("Chapter 1");
  expect(
    nextChapterName([shot("x", 1, "Chapter 4"), shot("y", 1, "Chapter 2")])
  ).toBe("Chapter 5");
});

test("a shot leaving its place hands its chapter on to the next shot", () => {
  const handed = handOnChapter(video, "b");
  expect(handed[1]).not.toHaveProperty("chapter");
  expect(handed[2].chapter).toBe("Landing");
  // Unless the next shot starts a chapter of its own
  const both = [shot("p", 1, "One"), shot("q", 1, "Two")];
  expect(handOnChapter(both, "p")[1].chapter).toBe("Two");
  // A shot that starts no chapter changes nothing
  expect(handOnChapter(video, "c")).toBe(video);
});

describe("the shot list", () => {
  const chapters = chaptersOf(video);
  const lines = (search = "", folded = new Set<string>()) =>
    shotListRows(video, chapters, search, folded).map((row) =>
      row.kind === "chapter"
        ? `# ${row.chapter.name ?? "-"}`
        : video[row.index].id
    );

  test("lists every shot under its chapter's heading", () => {
    expect(lines()).toEqual([
      "# -",
      "a",
      "# Landing",
      "b",
      "c",
      "# Battle",
      "d",
    ]);
  });

  test("a folded chapter keeps its heading and hides its shots", () => {
    expect(lines("", new Set(["b"]))).toEqual([
      "# -",
      "a",
      "# Landing",
      "# Battle",
      "d",
    ]);
  });

  test("searching keeps matching shots, and every shot of a matching chapter", () => {
    expect(lines("shot c")).toEqual(["# Landing", "c"]);
    expect(lines("battle", new Set(["d"]))).toEqual(["# Battle", "d"]);
    expect(lines("nothing")).toEqual([]);
  });

  test("with no chapters there are no headings", () => {
    const plain = [shot("a"), shot("b")];
    expect(
      shotListRows(plain, chaptersOf(plain), "", new Set()).map((r) => r.kind)
    ).toEqual(["shot", "shot"]);
  });
});

describe("dropping a shot in the shot list", () => {
  const order = (shots: Shot[]) =>
    shots.map((s) => (s.chapter ? `${s.id}:${s.chapter}` : s.id)).join(" ");

  test("dropped before a shot, it goes there, in that shot's chapter", () => {
    // a | b:Landing c | d:Battle  -> move a after c, i.e. before d without joining Battle
    expect(order(dropShot(video, "a", { beforeId: "d", join: false }))).toBe(
      "b:Landing c a d:Battle"
    );
  });

  test("dropped on a chapter's heading, it becomes that chapter's first shot", () => {
    expect(order(dropShot(video, "c", { beforeId: "d", join: true }))).toBe(
      "a b:Landing c:Battle d"
    );
  });

  test("the chapter a moved shot started stays in its place", () => {
    expect(order(dropShot(video, "b", { beforeId: null, join: false }))).toBe(
      "a c:Landing d:Battle b"
    );
  });

  test("dropping where it already is changes nothing", () => {
    expect(dropShot(video, "c", { beforeId: "d", join: false })).toBe(video);
    expect(dropShot(video, "d", { beforeId: null, join: false })).toBe(video);
    expect(dropShot(video, "c", { beforeId: "c", join: true })).toBe(video);
    expect(dropShot(video, "nope", { beforeId: null, join: false })).toBe(
      video
    );
  });
});

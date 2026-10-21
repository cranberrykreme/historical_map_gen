import { Shot } from "../../types";

// A run of shots in the video. A chapter starts at a shot that carries a chapter name and runs
// until the next one; shots before the first named chapter sit in an unnamed run at the start.
export interface Chapter {
  name: string | null; // null for the shots before the first chapter
  first: number; // index of its first shot
  last: number; // index of its last shot
  from: number; // when it starts on the video, in seconds
  to: number; // when it ends
}

// The video's chapters in order. Every shot belongs to exactly one. No shots, no chapters.
export function chaptersOf(shots: Shot[]): Chapter[] {
  const chapters: Chapter[] = [];
  let at = 0;
  shots.forEach((shot, index) => {
    const current = chapters[chapters.length - 1];
    if (!current || shot.chapter !== undefined) {
      chapters.push({
        name: shot.chapter ?? null,
        first: index,
        last: index,
        from: at,
        to: at + shot.seconds,
      });
    } else {
      current.last = index;
      current.to = at + shot.seconds;
    }
    at += shot.seconds;
  });
  return chapters;
}

// The chapter a shot belongs to (by index), or null when there are no shots
export function chapterOfShot(
  chapters: Chapter[],
  index: number
): Chapter | null {
  return (
    chapters.find(
      (chapter) => index >= chapter.first && index <= chapter.last
    ) ?? null
  );
}

// Chapters are named Chapter 1, Chapter 2... after the highest number used
export function nextChapterName(shots: Shot[]): string {
  const used = shots
    .map((shot) => /^Chapter (\d+)$/.exec(shot.chapter ?? ""))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Chapter ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

// A chapter belongs to its place in the video, not to the shot that happens to start it. When
// a shot starting a chapter leaves its place (moved or deleted), the shot after it takes the
// chapter over, unless that one starts a chapter of its own. Returns the shots with the moving
// shot's chapter handed on and taken off it; `id` is the shot leaving.
export function handOnChapter(shots: Shot[], id: string): Shot[] {
  const index = shots.findIndex((shot) => shot.id === id);
  const leaving = shots[index];
  if (!leaving || leaving.chapter === undefined) return shots;
  const next = shots[index + 1];
  return shots.map((shot, i) => {
    if (i === index) {
      const { chapter: _gone, ...rest } = shot;
      return rest;
    }
    if (shot === next && next.chapter === undefined)
      return { ...next, chapter: leaving.chapter };
    return shot;
  });
}

// One line of the shot list: a chapter's heading, or a shot (by its index in the video)
export type ShotListRow =
  | { kind: "chapter"; chapter: Chapter; key: string; shown: number }
  | { kind: "shot"; index: number };

// The shot list's lines: each chapter's heading with its shots under it, unless the chapter is
// folded away (`folded` holds the keys: the id of each chapter's first shot). A search keeps
// only the shots whose name, or whose chapter's name, has the text in it, and the chapters that
// still have shots; folded chapters open up while searching. The run of shots before the first
// chapter only gets a heading once there are chapters.
export function shotListRows(
  shots: Shot[],
  chapters: Chapter[],
  search: string,
  folded: Set<string>
): ShotListRow[] {
  const text = search.trim().toLowerCase();
  const titled = chapters.some((chapter) => chapter.name !== null);
  const rows: ShotListRow[] = [];
  for (const chapter of chapters) {
    const key = shots[chapter.first].id;
    const chapterMatches =
      !!text && (chapter.name ?? "").toLowerCase().includes(text);
    const indexes: number[] = [];
    for (let i = chapter.first; i <= chapter.last; i++) {
      if (!text || chapterMatches || shots[i].name.toLowerCase().includes(text))
        indexes.push(i);
    }
    if (text && indexes.length === 0) continue;
    if (titled)
      rows.push({ kind: "chapter", chapter, key, shown: indexes.length });
    if (titled && !text && folded.has(key)) continue;
    for (const index of indexes) rows.push({ kind: "shot", index });
  }
  return rows;
}

// Where a shot dragged in the shot list lands: just before the shot `beforeId` (null for the
// very end), and with `join` set, as the new first shot of the chapter that shot starts.
export interface ShotDrop {
  beforeId: string | null;
  join: boolean;
}

// The shots with one moved to where it was dropped. A chapter the moved shot started stays in
// its place (see handOnChapter); joining a chapter at its start takes the chapter's name over
// from the shot that started it. The same array back when nothing would change.
export function dropShot(shots: Shot[], id: string, drop: ShotDrop): Shot[] {
  const moving = shots.find((shot) => shot.id === id);
  if (!moving || drop.beforeId === id) return shots;
  const target = drop.beforeId
    ? shots.find((shot) => shot.id === drop.beforeId)
    : undefined;
  if (drop.beforeId && !target) return shots;
  const joins = drop.join && target?.chapter !== undefined;

  // Already there: straight before the target (or last), and not taking a chapter over
  const index = shots.indexOf(moving);
  const after = shots[index + 1];
  if (!joins && (target ? after === target : index === shots.length - 1))
    return shots;

  const rest = handOnChapter(shots, id).filter((shot) => shot.id !== id);
  const { chapter: _own, ...plain } = moving;
  const placed: Shot = joins ? { ...plain, chapter: target!.chapter } : plain;
  const at = target
    ? rest.findIndex((shot) => shot.id === target.id)
    : rest.length;
  const next = rest.map((shot) => {
    if (joins && shot.id === target!.id) {
      const { chapter: _taken, ...left } = shot;
      return left;
    }
    return shot;
  });
  next.splice(at, 0, placed);
  return next;
}

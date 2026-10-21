import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  chapterOfShot,
  chaptersOf,
  nextChapterName,
  shotListRows,
  ShotDrop,
} from "../../utils/video/chapters";
import { formatSeconds, shotStarts } from "../../utils/video/shots";
import ToolbarButton from "./ToolbarButton";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";
import { findBattle } from "../../utils/scenes/kinds";

const ROW_HEIGHT = 28; // every line of the list is this tall, so only the ones on screen are drawn
const SPARE_ROWS = 8; // drawn above and below the visible ones, so fast scrolling stays filled
const DRAG_THRESHOLD = 4; // pixels the pointer moves before a press becomes a drag
const SCROLL_ZONE = 28; // dragging this close to the list's top or bottom scrolls it
const SCROLL_STEP = 14;

const LIST: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  position: "relative",
  marginTop: "var(--space-sm)",
};
const LINE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  height: ROW_HEIGHT,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 var(--space-sm)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const HEADING: React.CSSProperties = {
  ...LINE,
  color: "var(--color-gold)",
  borderBottom: "1px solid var(--color-border)",
  cursor: "pointer",
  userSelect: "none",
};
const NUMBER: React.CSSProperties = {
  width: 34,
  flexShrink: 0,
  color: "var(--color-text-dim)",
  fontSize: 11,
  textAlign: "right",
};
const DIM: React.CSSProperties = {
  flexShrink: 0,
  color: "var(--color-text-dim)",
  fontSize: 11,
};
const NAME: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const INPUT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  background: "var(--color-surface-raised)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
  padding: "3px 6px",
};

// Every shot in the video, in order and grouped by chapter, for finding your way round a video
// of hundreds of shots. Drag a shot up or down to move it, into another chapter if you like
// (drop it on a chapter's heading to make it that chapter's first shot). Click a shot to select it (the strip slides to it, and in video mode
// the video goes to its start). Click a chapter's heading to fold it away, double-click to
// rename it; × ends the chapter, joining its shots onto the one before. + Chapter starts a
// chapter at the selected shot. Only the lines on screen are drawn, so it stays quick.
function ShotsPanel() {
  const shots = useMapStore((state) => state.shots);
  const battles = useMapStore((state) => state.battles);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const selectShot = useMapStore((state) => state.selectShot);
  const selectPath = useMapStore((state) => state.selectPath);
  const updateShot = useMapStore((state) => state.updateShot);
  const addShot = useMapStore((state) => state.addShot);
  const inVideo = useTimelineStore((state) => state.mode === "video");

  const [search, setSearch] = useState("");
  const [folded, setFolded] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const dropShotAt = useMapStore((state) => state.dropShotAt);
  // A shot being dragged to a new place: where it would land, and where to draw the line
  const [drag, setDrag] = useState<{
    id: string;
    drop: ShotDrop;
    lineTop: number;
  } | null>(null);
  const [height, setHeight] = useState(400);

  const starts = useMemo(() => shotStarts(shots), [shots]);
  const chapters = useMemo(() => chaptersOf(shots), [shots]);
  const rows = useMemo(
    () => shotListRows(shots, chapters, search, folded),
    [shots, chapters, search, folded]
  );
  const selectedIndex = shots.findIndex((shot) => shot.id === selectedShotId);
  const selectedShot = shots[selectedIndex];

  // Keep track of how tall the list is, to know how many lines to draw
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => setHeight(list.clientHeight || 400);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // A shot selected elsewhere (the strip, the overview) scrolls into view, opening its chapter
  // if it was folded. Only when the selection changes, so its chapter can still be folded after.
  useEffect(() => {
    if (selectedIndex < 0) return;
    const chapter = chapterOfShot(chapters, selectedIndex);
    const key = chapter ? shots[chapter.first].id : null;
    let open = folded;
    if (key && folded.has(key)) {
      open = new Set(folded);
      open.delete(key);
      setFolded(open);
    }
    const row = shotListRows(shots, chapters, search, open).findIndex(
      (r) => r.kind === "shot" && r.index === selectedIndex
    );
    if (row < 0) return;
    // After the list has redrawn with the chapter open
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;
      const top = row * ROW_HEIGHT;
      if (
        top < list.scrollTop ||
        top + ROW_HEIGHT > list.scrollTop + list.clientHeight
      )
        list.scrollTop = top - list.clientHeight / 2 + ROW_HEIGHT / 2;
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId]);

  const pick = (index: number) => {
    selectPath(null);
    selectShot(shots[index].id);
    if (inVideo) useTimelineStore.getState().setVideoTime(starts[index]);
  };

  // Where a shot dragged to a point of the list would land. Over a chapter's heading it becomes
  // that chapter's first shot; over a shot, it goes before it (top half) or after it (bottom
  // half). Before a shot that starts a chapter counts as joining that chapter at its start.
  const dropAt = (clientY: number): { drop: ShotDrop; lineTop: number } => {
    const list = listRef.current;
    const y = list
      ? clientY - list.getBoundingClientRect().top + list.scrollTop
      : 0;
    const r = Math.max(Math.floor(y / ROW_HEIGHT), 0);
    const row = rows[r];
    if (!row)
      return {
        drop: { beforeId: null, join: false },
        lineTop: rows.length * ROW_HEIGHT,
      };
    if (row.kind === "chapter")
      return {
        drop: { beforeId: shots[row.chapter.first].id, join: true },
        lineTop: (r + 1) * ROW_HEIGHT,
      };
    const upper = y - r * ROW_HEIGHT < ROW_HEIGHT / 2;
    if (upper)
      return {
        drop: {
          beforeId: shots[row.index].id,
          join: shots[row.index].chapter !== undefined,
        },
        lineTop: r * ROW_HEIGHT,
      };
    return {
      drop: { beforeId: shots[row.index + 1]?.id ?? null, join: false },
      lineTop: (r + 1) * ROW_HEIGHT,
    };
  };

  // Press on a shot: a click selects it; moving the pointer drags it to a new place, maybe in
  // another chapter. Letting go drops it there (one undo step).
  const startDrag = (e: React.MouseEvent, index: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const id = shots[index].id;
    const startY = e.clientY;
    let moving = false;
    let latest: ShotDrop | null = null;

    const onMove = (ev: MouseEvent) => {
      if (!moving && Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) return;
      moving = true;
      const list = listRef.current;
      if (list) {
        const rect = list.getBoundingClientRect();
        if (ev.clientY < rect.top + SCROLL_ZONE) list.scrollTop -= SCROLL_STEP;
        else if (ev.clientY > rect.bottom - SCROLL_ZONE)
          list.scrollTop += SCROLL_STEP;
      }
      const { drop, lineTop } = dropAt(ev.clientY);
      latest = drop;
      setDrag({ id, drop, lineTop });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDrag(null);
      if (!moving) pick(index);
      else if (latest) dropShotAt(id, latest);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggle = (key: string) => {
    const next = new Set(folded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFolded(next);
  };

  const commitRename = () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    // Renaming the run before the first chapter makes it a chapter of its own
    if (name) updateShot(renaming.key, { chapter: name });
    setRenaming(null);
  };

  const startChapter = () => {
    if (!selectedShot) return;
    updateShot(selectedShot.id, { chapter: nextChapterName(shots) });
    setRenaming({ key: selectedShot.id, name: nextChapterName(shots) });
  };

  const first = Math.max(Math.floor(scrollTop / ROW_HEIGHT) - SPARE_ROWS, 0);
  const end = Math.min(
    Math.ceil((scrollTop + height) / ROW_HEIGHT) + SPARE_ROWS,
    rows.length
  );

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Add shot"
        hint="Add a shot after the selected one"
        onClick={() => {
          selectPath(null);
          addShot();
        }}
        isExpanded={true}
      />
      <ToolbarButton
        icon="+"
        label="Start a chapter here"
        hint={
          !selectedShot
            ? "Select a shot to start a chapter at it"
            : selectedShot.chapter !== undefined
              ? "This shot already starts a chapter"
              : "Start a new chapter at the selected shot"
        }
        onClick={startChapter}
        disabled={!selectedShot || selectedShot.chapter !== undefined}
        isExpanded={true}
      />
      <input
        style={{ ...INPUT, flex: "none" }}
        value={search}
        placeholder="Find a shot or chapter"
        onChange={(e) => {
          setSearch(e.target.value);
          if (listRef.current) listRef.current.scrollTop = 0;
        }}
      />
      {shots.length === 0 ? (
        <p className={styles.emptyMessage}>
          No shots yet. Add one here or with + Shot on the video strip.
        </p>
      ) : rows.length === 0 ? (
        <p className={styles.emptyMessage}>Nothing matches “{search}”.</p>
      ) : null}
      <div
        ref={listRef}
        style={LIST}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: rows.length * ROW_HEIGHT }} />
        {rows.slice(first, end).map((row, k) => {
          const top = (first + k) * ROW_HEIGHT;
          if (row.kind === "chapter") {
            const { chapter, key } = row;
            const isFolded = folded.has(key) && !search.trim();
            if (renaming?.key === key)
              return (
                <div key={`c-${key}`} style={{ ...HEADING, top }}>
                  <input
                    style={INPUT}
                    autoFocus
                    value={renaming.name}
                    onChange={(e) => setRenaming({ key, name: e.target.value })}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setRenaming(null);
                    }}
                  />
                </div>
              );
            return (
              <div
                key={`c-${key}`}
                style={{ ...HEADING, top }}
                onClick={() => toggle(key)}
                onDoubleClick={() =>
                  setRenaming({ key, name: chapter.name ?? "" })
                }
                title={
                  chapter.name === null
                    ? "The shots before the first chapter. Double-click to make them a chapter."
                    : "Click to fold away, double-click to rename"
                }
              >
                <span style={{ ...DIM, width: 10 }}>
                  {isFolded ? "▸" : "▾"}
                </span>
                <span style={NAME}>{chapter.name ?? "Opening"}</span>
                <span style={DIM}>
                  {chapter.last - chapter.first + 1} ·{" "}
                  {formatSeconds(chapter.to - chapter.from)}
                </span>
                {chapter.name !== null && (
                  <button
                    className={deleteStyles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateShot(key, { chapter: undefined });
                    }}
                    title="End this chapter: its shots join the chapter before"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }
          const shot = shots[row.index];
          const active = shot.id === selectedShotId;
          const battle = findBattle(battles, shot.scene);
          return (
            <div
              key={shot.id}
              className={`${styles.row} ${active ? styles.rowActive : ""}`}
              style={{
                ...LINE,
                top,
                opacity: drag?.id === shot.id ? 0.4 : 1,
                cursor: drag ? "grabbing" : "pointer",
              }}
              onMouseDown={(e) => startDrag(e, row.index)}
              title={`${shot.name}${battle ? ` (${battle.name})` : ""}: starts at ${formatSeconds(
                starts[row.index]
              )}, ${formatSeconds(shot.seconds)} long`}
            >
              <span style={NUMBER}>{row.index + 1}</span>
              <span
                className={`${styles.name} ${active ? styles.nameActive : ""}`}
                style={NAME}
              >
                {shot.scene ? "⚔ " : ""}
                {shot.name}
              </span>
              <span style={DIM}>{formatSeconds(starts[row.index])}</span>
              <span style={{ ...DIM, width: 38, textAlign: "right" }}>
                {formatSeconds(shot.seconds)}
              </span>
            </div>
          );
        })}
        {/* Where the dragged shot would land */}
        {drag && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: drag.lineTop - 1,
              height: 2,
              background: "var(--color-gold)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ShotsPanel;

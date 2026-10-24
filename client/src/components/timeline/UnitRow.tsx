import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { HistoryView, viewShowing } from "../../utils/history/timeline";
import {
  formatHistoryTime,
  HistoryTime,
} from "../../utils/history/historyTime";
import { itemSpan, RowItem, UnitRow } from "../../utils/history/timelineRows";
import { exitStyleInfo } from "../../utils/units/exits";
import MarchBar from "./MarchBar";
import styles from "./Timeline.module.css";

// The arrow at a row's edge when some of its row is outside the stretch of history on show.
// Click it to bring the nearest of them into view.
const OFFSCREEN: React.CSSProperties = {
  position: "absolute",
  top: 4,
  bottom: 4,
  width: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-gold-subtle)",
  border: "1px solid var(--color-gold-dim)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-gold)",
  fontSize: 10,
  cursor: "pointer",
  zIndex: 2,
};

// What an item is, for its tooltip
function describeItem(item: RowItem): string {
  const at = (t: HistoryTime) => formatHistoryTime(t, "times");
  switch (item.kind) {
    case "arrives":
      return `Arrives ${at(item.at)}`;
    case "leaves":
      return `Leaves ${at(item.at)}${item.style ? ` (${exitStyleInfo(item.style).label.toLowerCase()})` : ""}`;
    case "loss":
      return `Loses ${Math.round(item.share * 100)}% from ${at(item.start)} to ${at(item.end)}`;
    default:
      return item.path.name;
  }
}

// A unit's name in the names column. Click to select it; Shift- or ⌘-click to add it to the
// selection.
export function UnitRowLabel({
  row,
  grouped,
  rowRef,
}: {
  row: UnitRow;
  grouped: boolean;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const selected = useMapStore((state) =>
    state.selectedUnitIds.has(row.unit.id)
  );
  const selectUnit = useMapStore((state) => state.selectUnit);
  return (
    <div
      ref={rowRef}
      className={`${styles.label} ${grouped ? styles.labelIndented : ""} ${
        selected ? styles.labelActive : ""
      }`}
      title={[row.label, ...row.items.map(describeItem)].join("\n")}
      onClick={(e) => selectUnit(row.unit.id, e.shiftKey || e.metaKey)}
    >
      {row.label}
    </div>
  );
}

// A unit's row across the bars: a faint line while it's in history, a diamond where it
// arrives and another where it leaves, its marches (drag them as before), and its losses as a
// red strip along the bottom. Clicking a diamond or a loss moves the playhead there.
export function UnitRowTrack({
  row,
  shown,
  trackRef,
}: {
  row: UnitRow;
  shown: HistoryView;
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  const storyStart = useMapStore((state) => state.storyStart);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selected = useMapStore((state) =>
    state.selectedUnitIds.has(row.unit.id)
  );
  const selectUnit = useMapStore((state) => state.selectUnit);
  const setView = useTimelineStore((state) => state.setView);

  const span = shown.to - shown.from;
  const percent = (t: number) => ((t - shown.from) / span) * 100;
  const clampPercent = (t: number) => Math.min(Math.max(percent(t), 0), 100);

  // Puts the playhead on a moment of this unit's history, with the unit selected
  const jumpTo = (e: React.MouseEvent, at: HistoryTime) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a scrub
    e.preventDefault();
    if (!selected) selectUnit(row.unit.id);
    const timeline = useTimelineStore.getState();
    timeline.pause();
    timeline.setMode("history");
    timeline.setNow(at <= storyStart ? null : at);
  };

  // The items out of view on either side, nearest first
  const before = row.items
    .filter((item) => itemSpan(item)[1] < shown.from)
    .reverse();
  const after = row.items.filter((item) => itemSpan(item)[0] > shown.to);
  const reveal = (e: React.MouseEvent, item: RowItem) => {
    e.stopPropagation();
    e.preventDefault();
    const [start, end] = itemSpan(item);
    setView(viewShowing({ start, end, turn: 0 }, shown));
  };

  // While the unit is in history
  const from = row.unit.appears ?? storyStart;
  const until = row.unit.leaves;

  return (
    <div className={`${styles.row} ${selected ? styles.rowSelected : ""}`}>
      {(until === undefined || until >= shown.from) && from <= shown.to && (
        <div
          className={styles.lifeLine}
          style={{
            left: `${clampPercent(from)}%`,
            right: `${100 - (until === undefined ? 100 : clampPercent(until))}%`,
          }}
        />
      )}
      {row.items.map((item) => {
        if (item.kind === "march")
          return (
            <MarchBar
              key={`march-${item.path.id}`}
              path={item.path}
              timing={item.timing}
              active={item.path.id === selectedPathId || selected}
              shown={shown}
              trackRef={trackRef}
            />
          );
        if (item.kind === "loss") {
          if (item.end < shown.from || item.start > shown.to) return null;
          return (
            <div
              key={`loss-${item.index}`}
              className={styles.rowLoss}
              style={{
                left: `${percent(item.start)}%`,
                width: `${percent(item.end) - percent(item.start)}%`,
              }}
              title={describeItem(item)}
              onMouseDown={(e) => jumpTo(e, item.start)}
            />
          );
        }
        if (item.at < shown.from || item.at > shown.to) return null;
        return (
          <div
            key={item.kind}
            className={`${styles.rowDiamond} ${
              item.kind === "arrives" ? styles.rowArrives : styles.rowLeaves
            }`}
            style={{ left: `${percent(item.at)}%` }}
            title={`${describeItem(item)}\nClick to move the playhead there`}
            onMouseDown={(e) => jumpTo(e, item.at)}
          />
        );
      })}
      {before.length > 0 && (
        <div
          style={{ ...OFFSCREEN, left: 2 }}
          title={`Earlier: ${describeItem(before[0])}\nClick to show it`}
          onMouseDown={(e) => reveal(e, before[0])}
        >
          {"◂"}
        </div>
      )}
      {after.length > 0 && (
        <div
          style={{ ...OFFSCREEN, right: 2 }}
          title={`Later: ${describeItem(after[0])}\nClick to show it`}
          onMouseDown={(e) => reveal(e, after[0])}
        >
          {"▸"}
        </div>
      )}
    </div>
  );
}

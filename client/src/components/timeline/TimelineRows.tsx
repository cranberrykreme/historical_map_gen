import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { HistoryView } from "../../utils/timeline";
import {
  formatHistoryTime,
  historyTicks,
  HistoryTime,
} from "../../utils/historyTime";
import { RowGroup } from "../../utils/timelineRows";
import { describe, groupTitle } from "./describe";
import MarchBar, { MIN_BAR_PX } from "./MarchBar";
import styles from "./Timeline.module.css";

const TICK_SPACING = 90; // pixels between ruler labels, at least
const START_SNAP = 4; // pixels: a playhead this close to the story's start counts as at it

// The body of the timeline: the names column on the left, and the ruler, the bars and the
// playhead on the right, grouped by army
function TimelineRows({
  groups,
  grouped,
  isOpen,
  shown,
  current,
  hasMarches,
  height,
  trackRef,
  trackWidth,
  rowRefs,
  headerRefs,
}: {
  groups: RowGroup[];
  grouped: boolean;
  isOpen: (group: RowGroup) => boolean;
  shown: HistoryView;
  current: HistoryTime;
  hasMarches: boolean;
  height: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackWidth: number;
  rowRefs: React.RefObject<Map<string, HTMLDivElement>>;
  headerRefs: React.RefObject<Map<string, HTMLDivElement>>;
}) {
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const selectArmy = useMapStore((state) => state.selectArmy);

  const setNow = useTimelineStore((state) => state.setNow);
  const pause = useTimelineStore((state) => state.pause);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const toggleGroup = useTimelineStore((state) => state.toggleGroup);

  const span = shown.to - shown.from;
  const percent = (t: HistoryTime) => ((t - shown.from) / span) * 100;

  const ticks = historyTicks(
    shown.from,
    shown.to,
    Math.max(Math.floor(trackWidth / TICK_SPACING), 2)
  );

  // The moment under the pointer. Never before the story starts, and close enough to the
  // start counts as at it (null), where units can be edited.
  const momentAt = (clientX: number): HistoryTime | null => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const t = shown.from + ((clientX - rect.left) / rect.width) * span;
    const startX = rect.left + (percent(storyStart) / 100) * rect.width;
    return t <= storyStart || clientX - startX < START_SNAP ? null : t;
  };

  // Clicking or dragging on the ruler or an empty part of a row moves the playhead
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    usePathToolStore.getState().clearPreview();
    pause();
    setNow(momentAt(e.clientX));

    const onMove = (ev: MouseEvent) => setNow(momentAt(ev.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startShare = percent(storyStart);

  const emptyMessage =
    rowFilter === "now"
      ? `No marches under way on ${formatHistoryTime(current, "days")}`
      : "No marches in this stretch of history. Pan or zoom out, or click Fit.";

  // The rows a group shows: none while it's folded away
  const shownRows = (group: RowGroup) => (isOpen(group) ? group.rows : []);

  return (
    <div className={styles.body} style={{ maxHeight: height }}>
      <div className={styles.labels}>
        <div className={styles.labelSpacer} />
        {groups.map((group) => (
          <React.Fragment key={group.key}>
            {grouped && (
              <div
                ref={(el) => {
                  if (el) headerRefs.current.set(group.key, el);
                  else headerRefs.current.delete(group.key);
                }}
                className={`${styles.groupLabel} ${
                  group.army && group.army.id === selectedArmyId
                    ? styles.labelActive
                    : ""
                }`}
                title={groupTitle(group, rowFilter)}
              >
                <button
                  className={styles.groupToggle}
                  onClick={() => toggleGroup(group.key)}
                  title={
                    isOpen(group)
                      ? "Fold these marches away"
                      : "Show these marches"
                  }
                >
                  {isOpen(group) ? "▾" : "▸"}
                </button>
                <span
                  className={styles.groupName}
                  onClick={() =>
                    group.army
                      ? selectArmy(
                          group.army.id === selectedArmyId
                            ? null
                            : group.army.id
                        )
                      : toggleGroup(group.key)
                  }
                >
                  {group.army ? group.army.name : "No army"}
                </span>
                <span className={styles.groupCount}>
                  {rowFilter === "all" || group.rows.length === group.total
                    ? group.total
                    : `${group.rows.length}/${group.total}`}
                </span>
              </div>
            )}
            {shownRows(group).map(({ path, timing }) => (
              <div
                key={path.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(path.id, el);
                  else rowRefs.current.delete(path.id);
                }}
                className={`${styles.label} ${grouped ? styles.labelIndented : ""} ${
                  path.id === selectedPathId ? styles.labelActive : ""
                }`}
                title={`${path.name}\n${describe(timing)}`}
                onClick={() =>
                  selectPath(path.id === selectedPathId ? null : path.id)
                }
              >
                {path.name}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.tracks} ref={trackRef} onMouseDown={startScrub}>
        {startShare > 0 && (
          <div
            className={styles.beforeStart}
            style={{ width: `${Math.min(startShare, 100)}%` }}
            title="Before the story starts"
          />
        )}

        <div className={styles.ruler}>
          {ticks.map((tick) => (
            <div
              key={tick.time}
              className={styles.tick}
              style={{ left: `${percent(tick.time)}%` }}
            >
              <span className={styles.tickLabel}>{tick.label}</span>
            </div>
          ))}
        </div>

        {groups.map((group) => (
          <React.Fragment key={group.key}>
            {grouped && (
              <div
                className={styles.groupRow}
                title={groupTitle(group, rowFilter)}
              >
                {group.end >= shown.from && group.start <= shown.to && (
                  <div
                    className={`${styles.groupBar} ${
                      group.army && group.army.id === selectedArmyId
                        ? styles.groupBarActive
                        : ""
                    }`}
                    style={{
                      left: `${Math.max(percent(group.start), 0)}%`,
                      right: `${Math.max(100 - percent(group.end), 0)}%`,
                      minWidth: MIN_BAR_PX,
                    }}
                  />
                )}
              </div>
            )}
            {shownRows(group).map(({ path, timing }) => (
              <MarchBar
                key={path.id}
                path={path}
                timing={timing}
                active={path.id === selectedPathId}
                shown={shown}
                trackRef={trackRef}
              />
            ))}
          </React.Fragment>
        ))}

        {!hasMarches && (
          <div className={styles.empty}>
            Attach units to a path and its march appears here.
          </div>
        )}
        {hasMarches && groups.length === 0 && (
          <div className={styles.empty}>{emptyMessage}</div>
        )}

        {current >= shown.from && current <= shown.to && (
          <div
            className={styles.playhead}
            style={{ left: `${percent(current)}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default TimelineRows;

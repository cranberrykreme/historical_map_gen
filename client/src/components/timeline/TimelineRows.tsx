import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { HistoryView } from "../../utils/history/timeline";
import { historyTicks, HistoryTime } from "../../utils/history/historyTime";
import { COMING_LATER, RowGroup } from "../../utils/history/timelineRows";
import { ShotsLane } from "../../utils/history/shotsLane";
import { groupTitle } from "./describe";
import { MIN_BAR_PX } from "./MarchBar";
import { UnitRowLabel, UnitRowTrack } from "./UnitRow";
import { ShotDraft, ShotsLaneLabel, ShotsLaneTrack } from "./ShotsLane";
import styles from "./Timeline.module.css";

const TICK_SPACING = 90; // pixels between ruler labels, at least
const START_SNAP = 4; // pixels: a playhead this close to the story's start counts as at it

// The body of the timeline in History mode: the names column on the left, and on the right
// the date ruler, the shots lane, then a row per unit, grouped by army, with the playhead
// running down through them
function TimelineRows({
  groups,
  grouped,
  isOpen,
  shown,
  current,
  hasUnits,
  height,
  trackRef,
  trackWidth,
  rowRefs,
  headerRefs,
  band,
  lane,
  shotDraft,
  setShotDraft,
  storyEnd,
}: {
  groups: RowGroup[];
  grouped: boolean;
  isOpen: (group: RowGroup) => boolean;
  shown: HistoryView;
  current: HistoryTime;
  hasUnits: boolean;
  height: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackWidth: number;
  rowRefs: React.RefObject<Map<string, HTMLDivElement>>;
  headerRefs: React.RefObject<Map<string, HTMLDivElement>>;
  // The selected shot's stretch of history, shaded across the rows
  band: { from: HistoryTime; to: HistoryTime } | null;
  lane: ShotsLane;
  shotDraft: ShotDraft | null;
  setShotDraft: (draft: ShotDraft | null) => void;
  storyEnd: HistoryTime | null;
}) {
  const storyStart = useMapStore((state) => state.storyStart);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const selectArmy = useMapStore((state) => state.selectArmy);

  const setNow = useTimelineStore((state) => state.setNow);
  const pause = useTimelineStore((state) => state.pause);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const toggleGroup = useTimelineStore((state) => state.toggleGroup);
  const setMode = useTimelineStore((state) => state.setMode);

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

  // Clicking or dragging on the ruler or an empty part of a row moves the playhead. It goes
  // back to following history, since the video no longer decides the moment.
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    usePathToolStore.getState().clearPreview();
    pause();
    setMode("history");
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

  const later = COMING_LATER[rowFilter];
  const emptyMessage = !hasUnits
    ? "Place units on the map and they appear here, one row each."
    : later
      ? `Nothing here yet: these arrive in ${later}.`
      : "No units march yet. Select units and draw a march for them.";

  // The rows a group shows: none while it's folded away
  const shownRows = (group: RowGroup) => (isOpen(group) ? group.rows : []);

  return (
    <div className={styles.body} style={{ maxHeight: height }}>
      <div className={styles.labels}>
        <div className={styles.labelSpacer} />
        <ShotsLaneLabel lines={lane.lines} storyEnd={storyEnd} />
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
                title={groupTitle(group)}
              >
                <button
                  className={styles.groupToggle}
                  onClick={() => toggleGroup(group.key)}
                  title={
                    isOpen(group) ? "Fold these units away" : "Show these units"
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
                  {group.rows.length === group.total
                    ? group.total
                    : `${group.rows.length}/${group.total}`}
                </span>
              </div>
            )}
            {shownRows(group).map((row) => (
              <UnitRowLabel
                key={row.unit.id}
                row={row}
                grouped={grouped}
                rowRef={(el) => {
                  if (el) rowRefs.current.set(row.unit.id, el);
                  else rowRefs.current.delete(row.unit.id);
                }}
              />
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

        {band && band.to >= shown.from && band.from <= shown.to && (
          <div
            className={styles.shotBand}
            style={{
              left: `${percent(band.from)}%`,
              width: `${percent(band.to) - percent(band.from)}%`,
            }}
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

        <ShotsLaneTrack
          lane={lane}
          shown={shown}
          trackRef={trackRef}
          draft={shotDraft}
          setDraft={setShotDraft}
        />

        {groups.map((group) => (
          <React.Fragment key={group.key}>
            {grouped && (
              <div className={styles.groupRow} title={groupTitle(group)}>
                {group.start !== null &&
                  group.end !== null &&
                  group.end >= shown.from &&
                  group.start <= shown.to && (
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
            {shownRows(group).map((row) => (
              <UnitRowTrack
                key={row.unit.id}
                row={row}
                shown={shown}
                trackRef={trackRef}
              />
            ))}
          </React.Fragment>
        ))}

        {groups.length === 0 && (
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

import React, { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { MAP_SCENE, Shot } from "../../types";
import { formatHistoryTime } from "../../utils/history/historyTime";
import { chapterOfShot, chaptersOf } from "../../utils/video/chapters";
import { formatSeconds, isHeld, shotStarts } from "../../utils/video/shots";
import { LATER_ROWS, shotRows } from "../../utils/video/openShot";
import { secondsTicks } from "../../utils/video/videoRuler";
import { allScenes } from "../../utils/scenes/scenes";
import styles from "./Timeline.module.css";

const TICK_SPACING = 70; // pixels between ruler labels, at least

// One shot opened up in Video mode: the ruler becomes the shot's own seconds, with a row for
// each kind of thing that happens in it (the camera, how it cuts in and out, the date). Later
// weeks add rows for characters, overlays, sound and effects. "← All shots" or Escape goes
// back to the whole video.
function OpenShot({ shot, height }: { shot: Shot; height: number }) {
  const shots = useMapStore((state) => state.shots);
  const selectShot = useMapStore((state) => state.selectShot);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const videoTime = useTimelineStore((state) => state.videoTime);
  const setOpenShot = useTimelineStore((state) => state.setOpenShot);

  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [adding, setAdding] = useState(false);

  const index = shots.findIndex((s) => s.id === shot.id);
  const start = shotStarts(shots)[index] ?? 0;
  const chapter = chapterOfShot(chaptersOf(shots), index);
  const followName = shot.follow
    ? (allScenes(useMapStore.getState())[shot.scene ?? MAP_SCENE]?.armies.find(
        (army) => army.id === shot.follow
      )?.name ?? null)
    : null;
  const rows = shotRows(shots, index, followName);

  const percent = (seconds: number) => (seconds / shot.seconds) * 100;
  const ticks = secondsTicks(
    0,
    shot.seconds,
    Math.max(Math.floor(trackWidth / TICK_SPACING), 2)
  );
  const local = videoTime - start;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTrackWidth(track.clientWidth));
    });
    observer.observe(track);
    setTrackWidth(track.clientWidth);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Escape goes back to all the shots (unless you're typing somewhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, select, textarea")
      )
        return;
      e.preventDefault(); // so the side panel doesn't close too
      setOpenShot(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpenShot]);

  // Click or drag anywhere on the rows to scrub through the shot
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (selectedShotId !== shot.id) selectShot(shot.id);
    const timeline = useTimelineStore.getState();
    timeline.pause();
    const scrubTo = (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const t = ((clientX - rect.left) / rect.width) * shot.seconds;
      useTimelineStore
        .getState()
        .setVideoTime(start + Math.min(Math.max(t, 0), shot.seconds));
    };
    scrubTo(e.clientX);
    const onMove = (ev: MouseEvent) => scrubTo(ev.clientX);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const history = isHeld(shot)
    ? `holds ${formatHistoryTime(shot.from, "times")}`
    : `${formatHistoryTime(shot.from, "times")} to ${formatHistoryTime(shot.to, "times")}`;

  return (
    <>
      <div className={styles.crumbs}>
        <button
          className={styles.textButton}
          onClick={() => setOpenShot(null)}
          title="Back to the whole video (Esc)"
        >
          ← All shots
        </button>
        {chapter?.name && (
          <span className={styles.crumbDim}>{chapter.name} ›</span>
        )}
        <span className={styles.crumbName}>
          {shot.scene ? "⚔ " : ""}
          {shot.name}
        </span>
        <span className={styles.crumbDim}>
          · {formatSeconds(shot.seconds)} · {history}
        </span>
        <span className={styles.spacer} />
        <span className={styles.addRowAnchor}>
          <button
            className={styles.textButton}
            onClick={() => setAdding(!adding)}
            title="Rows for the other things that happen in a shot"
          >
            + Row
          </button>
          {adding && (
            <div
              className={styles.addRowMenu}
              onMouseLeave={() => setAdding(false)}
            >
              {LATER_ROWS.map((row) => (
                <div key={row.label} className={styles.addRowItem}>
                  {row.label}
                  <span className={styles.crumbDim}>week {row.week}</span>
                </div>
              ))}
            </div>
          )}
        </span>
      </div>
      <div className={styles.body} style={{ maxHeight: height }}>
        <div className={styles.labels}>
          <div className={styles.labelSpacer} />
          {rows.map((row) => (
            <div key={row.key} className={styles.label}>
              {row.label}
            </div>
          ))}
        </div>
        <div className={styles.tracks} ref={trackRef} onMouseDown={startScrub}>
          <div className={styles.ruler}>
            {ticks.map((tick) => (
              <div
                key={tick.seconds}
                className={styles.tick}
                style={{ left: `${percent(tick.seconds)}%` }}
              >
                <span className={styles.tickLabel}>{tick.label}</span>
              </div>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.key} className={styles.row}>
              {row.bars.map((bar, i) => (
                <div
                  key={i}
                  className={`${styles.shotRowBar} ${
                    row.key === "camera" ? styles.shotRowCamera : ""
                  }`}
                  style={{
                    left: `${percent(bar.from)}%`,
                    width: `${percent(bar.to) - percent(bar.from)}%`,
                  }}
                  title={[bar.label, bar.hint].filter(Boolean).join("\n")}
                >
                  <span className={styles.shotRowLabel}>{bar.label}</span>
                </div>
              ))}
            </div>
          ))}
          <div className={styles.row} />
          {local >= 0 && local <= shot.seconds && (
            <div
              className={styles.videoPlayhead}
              style={{ left: `${percent(local)}%` }}
              title="Drag to scrub through the shot"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default OpenShot;

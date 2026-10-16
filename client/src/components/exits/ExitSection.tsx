import React, { useEffect, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { ExitStyle, MarkerKind, UnitExit } from "../../types";
import {
  EXIT_SECONDS,
  EXIT_STYLES,
  exitSeconds,
  exitStyleInfo,
  MARKER_FADES,
  MARKER_KINDS,
} from "../../utils/exits";
import { formatHistoryTime } from "../../utils/historyTime";
import { editableAt } from "../../utils/lifespans";
import styles from "../toolbar/PathsPanel.module.css";

const WRAP: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 4 };
const CHIP: React.CSSProperties = {
  flex: "1 0 auto",
  borderRadius: 4,
  padding: "3px 8px",
};
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const LABEL: React.CSSProperties = { width: 48, flexShrink: 0 };
const SLIDER: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  accentColor: "#c8a84b",
};
const VALUE: React.CSSProperties = {
  width: 36,
  textAlign: "right",
  flexShrink: 0,
};
const DISABLED: React.CSSProperties = { opacity: 0.4, cursor: "not-allowed" };

// A slider that shows its value as it moves and hands it over when it's let go, so a drag is
// one undo step
function CommitSlider({
  value,
  min,
  max,
  step,
  format,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        style={SLIDER}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <span style={VALUE}>{format(draft)}</span>
    </>
  );
}

// How the selected units go when they leave (die, break, sink...), the marker left where they
// fall, and "Dies here" to kill them at the playhead. Shows nothing with nothing selected.
function ExitSection() {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const storyStart = useMapStore((state) => state.storyStart);
  const setUnitsExit = useMapStore((state) => state.setUnitsExit);
  const killSelectedUnits = useMapStore((state) => state.killSelectedUnits);
  const now = useTimelineStore((state) => state.now);

  const selected = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
  if (selected.length === 0) return null;
  const ids = selected.map((unit) => unit.id);

  // The setting they share, or null when it's mixed
  const shared = <T,>(read: (exit: UnitExit | undefined) => T): T | null => {
    const values = new Set(
      selected.map((unit) => JSON.stringify(read(unit.exit) ?? null))
    );
    return values.size === 1 ? (read(selected[0].exit) as T) : null;
  };
  const style = shared((exit) => exit?.style ?? "none");
  const marker = shared((exit) => exit?.marker ?? "none");
  const fades = shared((exit) =>
    exit?.markerFades === undefined ? "stays" : "fades"
  );
  const first = selected[0].exit;
  const sameExit = style !== null && style !== "none" && first;

  // Changes one setting on every selected unit that has a leaving animation
  const change = (patch: Partial<UnitExit>) =>
    setUnitsExit(ids, (current) => (current ? { ...current, ...patch } : null));
  const pickStyle = (picked: ExitStyle | "none") => {
    if (picked === "none") {
      setUnitsExit(ids, null);
      return;
    }
    // Each keeps its own marker; the length goes back to the new style's own
    setUnitsExit(ids, (current) => {
      const { seconds: _old, ...rest } = current ?? { style: picked };
      return { ...rest, style: picked };
    });
  };

  // Units that can die at the playhead: past the moment they appear, and not already gone
  const killable =
    now !== null &&
    now > storyStart &&
    selected.some(
      (unit) =>
        !editableAt(unit, now, storyStart) &&
        (unit.appears ?? -Infinity) <= now &&
        (unit.leaves === undefined || unit.leaves > now)
    );

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Death and leaving</p>
      <div style={WRAP}>
        {(
          ["none", ...EXIT_STYLES.map((s) => s.style)] as (ExitStyle | "none")[]
        ).map((s) => (
          <button
            key={s}
            className={`${styles.segmentButton} ${style === s ? styles.segmentActive : ""}`}
            style={CHIP}
            title={s === "none" ? "Simply vanishes" : exitStyleInfo(s).hint}
            onClick={() => pickStyle(s)}
          >
            {s === "none" ? "None" : exitStyleInfo(s).label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        {style === null
          ? "Mixed settings."
          : style === "none"
            ? "Simply vanishes when it leaves."
            : `${exitStyleInfo(style).hint}.`}
      </p>

      {sameExit && (
        <>
          <label style={ROW} title="How long it takes, in seconds of video">
            <span style={LABEL}>Length</span>
            <CommitSlider
              value={exitSeconds(first)}
              min={EXIT_SECONDS.min}
              max={EXIT_SECONDS.max}
              step={0.1}
              format={(n) => `${n.toFixed(1)} s`}
              onCommit={(seconds) => change({ seconds })}
            />
          </label>
          <div style={ROW}>
            <span style={LABEL}>Marker</span>
            <div className={styles.segment} style={{ flex: 1 }}>
              {(
                ["none", ...MARKER_KINDS.map((m) => m.kind)] as (
                  | MarkerKind
                  | "none"
                )[]
              ).map((m) => (
                <button
                  key={m}
                  className={`${styles.segmentButton} ${marker === m ? styles.segmentActive : ""}`}
                  title={
                    m === "none"
                      ? "Leaves nothing behind"
                      : MARKER_KINDS.find((k) => k.kind === m)?.hint
                  }
                  onClick={() =>
                    change(
                      m === "none"
                        ? { marker: undefined, markerFades: undefined }
                        : { marker: m }
                    )
                  }
                >
                  {m === "none"
                    ? "None"
                    : MARKER_KINDS.find((k) => k.kind === m)?.label}
                </button>
              ))}
            </div>
          </div>
          {marker !== null && marker !== "none" && (
            <>
              <div style={ROW}>
                <span style={LABEL} />
                <div className={styles.segment} style={{ flex: 1 }}>
                  <button
                    className={`${styles.segmentButton} ${fades === "stays" ? styles.segmentActive : ""}`}
                    title="The marker stays for the rest of the story"
                    onClick={() => change({ markerFades: undefined })}
                  >
                    Stays
                  </button>
                  <button
                    className={`${styles.segmentButton} ${fades === "fades" ? styles.segmentActive : ""}`}
                    title="The marker fades a while after the unit has gone"
                    onClick={() =>
                      change({ markerFades: first.markerFades ?? 10 })
                    }
                  >
                    Fades
                  </button>
                </div>
              </div>
              {fades === "fades" && (
                <label
                  style={ROW}
                  title="Seconds of video the marker stays before it fades"
                >
                  <span style={LABEL}>After</span>
                  <CommitSlider
                    value={first.markerFades ?? 10}
                    min={MARKER_FADES.min}
                    max={60}
                    step={1}
                    format={(n) => `${n} s`}
                    onCommit={(markerFades) => change({ markerFades })}
                  />
                </label>
              )}
            </>
          )}
        </>
      )}

      <button
        className={styles.finishButton}
        style={killable ? undefined : DISABLED}
        disabled={!killable}
        title={
          killable
            ? "The selected units die at the playhead's moment (K)"
            : "Move the playhead to the moment they die (after they appear)"
        }
        onClick={() => killSelectedUnits()}
      >
        Dies here
        {now !== null && killable ? `: ${formatHistoryTime(now, "times")}` : ""}{" "}
        (K)
      </button>
      <p className={styles.hint}>
        A unit that dies leaves at the playhead with its animation (units with
        none get the usual one for their kind: ships sink, blocks shatter,
        portraits tear). Deleting a unit part way through the story plays it
        too. The animation takes the same seconds on screen however fast the
        video moves through history. Every death is listed below; × there
        removes it.
      </p>
    </div>
  );
}

export default ExitSection;

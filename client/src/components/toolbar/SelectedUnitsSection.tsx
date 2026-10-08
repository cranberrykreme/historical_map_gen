import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { unitFacing } from "../../utils/unitFacing";
import { formatHistoryTime } from "../../utils/historyTime";
import { TravelMode } from "../../types";
import styles from "./PathsPanel.module.css";

const TRAVEL_MODES: { mode: TravelMode; label: string; hint: string }[] = [
  {
    mode: "rotate",
    label: "Turn",
    hint: "Turns to face the direction of travel",
  },
  {
    mode: "upright",
    label: "Upright",
    hint: "Never turns; flips left or right so it is never upside down",
  },
  { mode: "fixed", label: "Fixed", hint: "Never turns or flips" },
];

// The lifespan rows (inline so PathsPanel.module.css doesn't change)
const LIFESPAN: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  margin: "6px 0",
};
const LIFESPAN_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "var(--font-size-sm)",
};
const LIFESPAN_LABEL: React.CSSProperties = {
  width: 56,
  flexShrink: 0,
  color: "var(--color-text-dim)",
};
const LIFESPAN_VALUE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  color: "var(--color-text-secondary)",
};
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};

// The selected units' travel mode, and when they exist in history. Shows nothing when no
// units are selected. `onStopPreview` stops the path preview before the playhead moves.
function SelectedUnitsSection({ onStopPreview }: { onStopPreview: () => void }) {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const setUnitsTravelMode = useMapStore((state) => state.setUnitsTravelMode);
  const bringBackUnits = useMapStore((state) => state.bringBackUnits);

  const selectedUnits = placedUnits.filter((unit) =>
    selectedUnitIds.has(unit.id)
  );
  const modes = new Set(
    selectedUnits.map((unit) => unitFacing(unit).travelMode)
  );
  const activeMode = modes.size === 1 ? Array.from(modes)[0] : null;

  // When the selected units exist in history
  const soleUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;
  const leavingUnits = selectedUnits.filter(
    (unit) => unit.leaves !== undefined
  );
  const goTo = (moment: number) => {
    usePathToolStore.getState().clearPreview();
    onStopPreview();
    const timeline = useTimelineStore.getState();
    timeline.pause();
    timeline.setNow(moment);
  };

  if (selectedUnits.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>
        {selectedUnits.length} unit
        {selectedUnits.length === 1 ? "" : "s"} selected
      </p>
      <div className={styles.segment}>
        {TRAVEL_MODES.map(({ mode, label, hint }) => (
          <button
            key={mode}
            title={hint}
            className={`${styles.segmentButton} ${
              activeMode === mode ? styles.segmentActive : ""
            }`}
            onClick={() =>
              setUnitsTravelMode(
                selectedUnits.map((unit) => unit.id),
                mode
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
      <p className={styles.hint}>
        {activeMode
          ? TRAVEL_MODES.find((m) => m.mode === activeMode)?.hint
          : "Mixed settings"}
        . Click a path on the map to attach the selected units to it.
      </p>

      {soleUnit && (
        <div style={LIFESPAN}>
          <div style={LIFESPAN_ROW}>
            <span style={LIFESPAN_LABEL}>Appears</span>
            <span style={LIFESPAN_VALUE}>
              {soleUnit.appears !== undefined
                ? formatHistoryTime(soleUnit.appears, "times")
                : "From the start"}
            </span>
            {soleUnit.appears !== undefined && (
              <button
                className={styles.cancelButton}
                style={SMALL_BUTTON}
                title="Move the playhead to when this unit appears, where it can be moved and turned"
                onClick={() => goTo(soleUnit.appears!)}
              >
                Go there
              </button>
            )}
          </div>
          <div style={LIFESPAN_ROW}>
            <span style={LIFESPAN_LABEL}>Leaves</span>
            <span style={LIFESPAN_VALUE}>
              {soleUnit.leaves !== undefined
                ? formatHistoryTime(soleUnit.leaves, "times")
                : "Never"}
            </span>
            {soleUnit.leaves !== undefined && (
              <button
                className={styles.cancelButton}
                style={SMALL_BUTTON}
                title="Keep this unit until the end of the story"
                onClick={() => bringBackUnits([soleUnit.id])}
              >
                Bring back
              </button>
            )}
          </div>
        </div>
      )}
      {!soleUnit && leavingUnits.length > 0 && (
        <div style={LIFESPAN_ROW}>
          <span style={LIFESPAN_VALUE}>
            {leavingUnits.length} of these leave during the story
          </span>
          <button
            className={styles.cancelButton}
            style={SMALL_BUTTON}
            title="Keep them until the end of the story"
            onClick={() => bringBackUnits(leavingUnits.map((unit) => unit.id))}
          >
            Bring back
          </button>
        </div>
      )}
      <p className={styles.hint}>
        Units placed with the playhead past the story's start appear then.
        Deleting a unit there makes it leave at that moment. Each unit can be
        moved only at the moment it appears.
      </p>
    </div>
  );
}

export default SelectedUnitsSection;

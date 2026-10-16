import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { BlockLoss, Unit } from "../../types";
import { unitLabel } from "../../utils/blocks";
import { exitSeconds, exitStyleInfo, MARKER_KINDS } from "../../utils/exits";
import { formatHistoryTime } from "../../utils/historyTime";
import ExitSection from "../exits/ExitSection";
import BlockLosses from "../blocks/BlockLosses";
import UnitIcon from "../blocks/UnitIcon";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

// Small extras on top of the Paths panel's styles, the same as the Armies panel's lists
const ELLIPSIS: React.CSSProperties = {
  display: "block",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const DETAIL: React.CSSProperties = {
  ...ELLIPSIS,
  color: "var(--color-text-dim)",
  fontSize: 11,
};
const TEXT: React.CSSProperties = { flex: 1, minWidth: 0, overflow: "hidden" };
const CLICKABLE: React.CSSProperties = { cursor: "pointer" };

// How a unit goes, in words: "Shatter (1.4 s) · cross left behind"
export function describeExit(unit: Unit): string {
  const exit = unit.exit;
  if (!exit) return "Simply vanishes";
  const how = `${exitStyleInfo(exit.style).label} (${exitSeconds(exit).toFixed(1)} s)`;
  const marker = MARKER_KINDS.find((m) => m.kind === exit.marker);
  return marker ? `${how} · ${marker.label.toLowerCase()} left behind` : how;
}

// Every animation in the scene being edited (the main map, or the open battle) in one place:
// the deaths and leavings, and the blocks' losses. Click a row to select its unit and go to
// that moment; × removes it. The selected units' death settings sit at the top.
function AnimationsPanel() {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const bringBackUnits = useMapStore((state) => state.bringBackUnits);
  const updateBlock = useMapStore((state) => state.updateBlock);
  const mode = useTimelineStore((state) => state.mode);
  const setNow = useTimelineStore((state) => state.setNow);

  const selected = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
  const soleBlock =
    selected.length === 1 && selected[0].block ? selected[0] : null;

  const leaving = placedUnits
    .filter((unit) => unit.leaves !== undefined)
    .sort((a, b) => a.leaves! - b.leaves!);
  const losses = placedUnits
    .flatMap((unit) =>
      (unit.block?.losses ?? []).map((loss, index) => ({ unit, loss, index }))
    )
    .sort((a, b) => a.loss.start - b.loss.start);

  // Selects the unit and, in history mode, moves the playhead to the moment
  const goTo = (unit: Unit, moment: number) => {
    selectUnit(unit.id);
    if (mode === "history") setNow(moment);
  };
  const removeLoss = (unit: Unit, index: number) => {
    const all: BlockLoss[] = unit.block?.losses ?? [];
    updateBlock(unit.id, { losses: all.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.list}>
        {selected.length === 0 ? (
          <p className={styles.hint}>
            Select units on the map to choose how they die, or kill them at the
            playhead (K).
          </p>
        ) : (
          <ExitSection />
        )}
        {soleBlock && (
          <div className={styles.section}>
            <BlockLosses unit={soleBlock} />
          </div>
        )}

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Deaths and leaving</p>
          {leaving.length === 0 && (
            <p className={styles.hint}>
              Nobody dies or leaves in this scene yet.
            </p>
          )}
          {leaving.map((unit) => (
            <div
              key={unit.id}
              className={styles.unitRow}
              style={CLICKABLE}
              title="Select this unit and go to the moment it goes"
              onClick={() => goTo(unit, unit.leaves!)}
            >
              <UnitIcon unit={unit} className={styles.unitThumb} />
              <span style={TEXT}>
                <span className={styles.unitName} style={ELLIPSIS}>
                  {unitLabel(unit)}
                </span>
                <span style={DETAIL}>
                  {formatHistoryTime(unit.leaves!, "times")}
                </span>
                <span style={DETAIL}>{describeExit(unit)}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  bringBackUnits([unit.id]);
                }}
                title="Remove this death: the unit stays to the end of the story (its death style is kept)"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Block losses</p>
          {losses.length === 0 && (
            <p className={styles.hint}>
              No block loses anyone yet. Select one block to add a loss.
            </p>
          )}
          {losses.map(({ unit, loss, index }) => (
            <div
              key={`${unit.id}-${index}`}
              className={styles.unitRow}
              style={CLICKABLE}
              title="Select this block and go to the start of the loss"
              onClick={() => goTo(unit, loss.start)}
            >
              <UnitIcon unit={unit} className={styles.unitThumb} />
              <span style={TEXT}>
                <span className={styles.unitName} style={ELLIPSIS}>
                  {unitLabel(unit)}: loses {Math.round(loss.share * 100)}%
                </span>
                <span style={DETAIL}>
                  From {formatHistoryTime(loss.start, "times")}
                </span>
                <span style={DETAIL}>
                  To {formatHistoryTime(loss.end, "times")}
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLoss(unit, index);
                }}
                title="Remove this loss"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <p className={styles.hint}>
          These are the animations in the scene you're editing (the main map, or
          the open battle). Click one to select its unit and go to that moment;
          × removes it. Arrival animations will join this list in Week 11.
        </p>
      </div>
    </div>
  );
}

export default AnimationsPanel;

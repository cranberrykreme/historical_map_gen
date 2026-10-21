import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { ArmyMember, BlockLoss, Unit } from "../../types";
import { unitLabel } from "../../utils/units/blocks";
import { exitSeconds, exitStyleInfo, MARKER_KINDS } from "../../utils/units/exits";
import { formatHistoryTime } from "../../utils/history/historyTime";
import ExitSection from "../exits/ExitSection";
import BlockLosses from "../blocks/BlockLosses";
import UnitIcon from "../blocks/UnitIcon";
import CollapsibleSection from "./CollapsibleSection";
import SelectedUnitsSection from "./SelectedUnitsSection";
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

// Everything that happens over time in the scene being edited (the main map, or the open
// battle), in one place. At the top, the selected units' turning, their time on the map, how
// they die and (for one block) its losses. Below, lists of every arrival, death, block loss and
// army join or leave: click a row to select its unit and go to that moment; × removes it.
function AnimationsPanel() {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const bringBackUnits = useMapStore((state) => state.bringBackUnits);
  const updateBlock = useMapStore((state) => state.updateBlock);
  const armies = useMapStore((state) => state.armies);
  const eraseMembership = useMapStore((state) => state.eraseMembership);
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

  const arriving = placedUnits
    .filter((unit) => unit.appears !== undefined)
    .sort((a, b) => a.appears! - b.appears!);
  const unitById = new Map(placedUnits.map((u): [string, Unit] => [u.id, u]));
  // Every stint in an army that starts or ends part way through the story
  const stints = armies
    .flatMap((army) =>
      army.members
        .filter((m) => m.joins !== undefined || m.leaves !== undefined)
        .map((member) => ({ army, member, unit: unitById.get(member.unitId) }))
    )
    .filter(
      (s): s is { army: typeof s.army; member: ArmyMember; unit: Unit } =>
        s.unit !== undefined
    )
    .sort(
      (a, b) =>
        (a.member.joins ?? a.member.leaves ?? 0) -
        (b.member.joins ?? b.member.leaves ?? 0)
    );

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
            Select units on the map to set how they turn, when they're on the
            map and how they die, or kill them at the playhead (K).
          </p>
        ) : (
          <>
            <SelectedUnitsSection />
            <ExitSection />
          </>
        )}
        {soleBlock && (
          <CollapsibleSection
            id="block-losses-edit"
            title={`${unitLabel(soleBlock)}: losses`}
          >
            <BlockLosses unit={soleBlock} />
          </CollapsibleSection>
        )}

        <CollapsibleSection id="arrivals" title="Arrivals">
          {arriving.length === 0 && (
            <p className={styles.hint}>
              Everyone is there from the start. Units placed with the playhead
              past the story's start arrive then.
            </p>
          )}
          {arriving.map((unit) => (
            <div
              key={unit.id}
              className={styles.unitRow}
              style={CLICKABLE}
              title="Select this unit and go to the moment it arrives, where it can be moved and turned"
              onClick={() => goTo(unit, unit.appears!)}
            >
              <UnitIcon unit={unit} className={styles.unitThumb} />
              <span style={TEXT}>
                <span className={styles.unitName} style={ELLIPSIS}>
                  {unitLabel(unit)}
                </span>
                <span style={DETAIL}>
                  Arrives {formatHistoryTime(unit.appears!, "times")}
                </span>
              </span>
            </div>
          ))}
        </CollapsibleSection>

        <CollapsibleSection id="deaths" title="Deaths and leaving">
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
        </CollapsibleSection>

        <CollapsibleSection id="losses" title="Block losses">
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
        </CollapsibleSection>

        <CollapsibleSection id="army-stints" title="Army joins and leaves">
          {stints.length === 0 && (
            <p className={styles.hint}>
              Nobody joins or leaves an army part way through the story.
            </p>
          )}
          {stints.map(({ army, member, unit }, index) => (
            <div
              key={`${army.id}-${member.unitId}-${index}`}
              className={styles.unitRow}
              style={CLICKABLE}
              title="Select this unit and go to the moment it joins (or leaves)"
              onClick={() => goTo(unit, member.joins ?? member.leaves ?? 0)}
            >
              <UnitIcon unit={unit} className={styles.unitThumb} />
              <span style={TEXT}>
                <span className={styles.unitName} style={ELLIPSIS}>
                  {unitLabel(unit)}: {army.name}
                </span>
                <span style={DETAIL}>
                  {member.joins !== undefined
                    ? `Joins ${formatHistoryTime(member.joins, "times")}`
                    : "In it from the start"}
                </span>
                {member.leaves !== undefined && (
                  <span style={DETAIL}>
                    Leaves {formatHistoryTime(member.leaves, "times")}
                  </span>
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  eraseMembership(army.id, member);
                }}
                title="Remove this stint completely: as if it never joined for it"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          ))}
        </CollapsibleSection>

        <p className={styles.hint}>
          These are the animations in the scene you're editing (the main map, or
          the open battle). Click one to select its unit and go to that moment;
          × removes it. Arrival animations come in Week 11; for now an arrival
          simply appears.
        </p>
      </div>
    </div>
  );
}

export default AnimationsPanel;

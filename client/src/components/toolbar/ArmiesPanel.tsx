import React, { useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useAssetStore } from "../../store/useAssetStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { ArmyMember, Unit } from "../../types";
import { memberAt, membersAt } from "../../utils/armies";
import { formatHistoryTime } from "../../utils/historyTime";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const displayName = (unit: Unit) => unit.filename.replace(/\.[^/.]+$/, "");

// Small extras on top of the Paths panel's styles, inline so no CSS file changes
const DATES: React.CSSProperties = {
  display: "block",
  color: "var(--color-text-dim)",
  fontSize: 11,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
// Long names stop at "…" rather than widening the panel; hovering shows them in full
const ELLIPSIS: React.CSSProperties = {
  display: "block",
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const ROW_NAME: React.CSSProperties = { ...ELLIPSIS, flex: 1 };
const MEMBER_TEXT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};
const FADED: React.CSSProperties = { opacity: 0.45 };
const FULL_WIDTH: React.CSSProperties = { width: "100%" };
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};

function ArmiesPanel() {
  const armies = useMapStore((state) => state.armies);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const paths = useMapStore((state) => state.paths);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectArmy = useMapStore((state) => state.selectArmy);
  const selectPath = useMapStore((state) => state.selectPath);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const createArmyFromSelection = useMapStore(
    (state) => state.createArmyFromSelection
  );
  const renameArmy = useMapStore((state) => state.renameArmy);
  const deleteArmy = useMapStore((state) => state.deleteArmy);
  const addSelectedUnitsToArmy = useMapStore(
    (state) => state.addSelectedUnitsToArmy
  );
  const removeUnitsFromArmy = useMapStore((state) => state.removeUnitsFromArmy);
  const eraseMembership = useMapStore((state) => state.eraseMembership);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const now = useTimelineStore((state) => state.now);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  const moment = currentMoment(now, storyStart);
  const atStart = now === null || now <= storyStart;
  const unitById = new Map(
    placedUnits.map((unit): [string, Unit] => [unit.id, unit])
  );
  const selectedArmy = armies.find((army) => army.id === selectedArmyId);

  // Selected units that aren't in the selected army at the playhead
  const joinable = selectedArmy
    ? Array.from(selectedUnitIds).filter(
        (id) => !membersAt(selectedArmy, moment).includes(id)
      )
    : [];

  const armyMarches = selectedArmy
    ? paths
        .filter((path) => path.armyId === selectedArmy.id)
        .sort((a, b) => (a.march?.start ?? 0) - (b.march?.start ?? 0))
    : [];

  const describe = (member: ArmyMember) =>
    [
      member.joins !== undefined
        ? `Joins ${formatHistoryTime(member.joins, "times")}`
        : "From the start",
      member.leaves !== undefined
        ? `leaves ${formatHistoryTime(member.leaves, "times")}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

  const commitRename = () => {
    if (renamingId === null) return;
    renameArmy(renamingId, renameValue);
    setRenamingId(null);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.list}>
        <button
          className={styles.finishButton}
          style={FULL_WIDTH}
          disabled={selectedUnitIds.size === 0}
          onClick={() => createArmyFromSelection()}
          title="Make the selected units an army, from the playhead's moment"
        >
          New army from selection
        </button>

        {armies.length === 0 && (
          <p className={styles.emptyMessage}>
            No armies yet. Attaching units to a path makes one, or select units
            and click "New army from selection".
          </p>
        )}

        {armies.map((army) => {
          const isSelected = army.id === selectedArmyId;
          const count = membersAt(army, moment).length;
          return (
            <div
              key={army.id}
              className={`${styles.row} ${isSelected ? styles.rowActive : ""}`}
              onClick={() => {
                if (isSelected) {
                  selectArmy(null);
                  selectUnit(null);
                } else {
                  selectArmy(army.id);
                }
              }}
            >
              {renamingId === army.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className={styles.renameInput}
                />
              ) : (
                <span
                  className={`${styles.name} ${isSelected ? styles.nameActive : ""}`}
                  style={ROW_NAME}
                  title={army.name}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenameValue(army.name);
                    setRenamingId(army.id);
                  }}
                >
                  {army.name}
                </span>
              )}
              <span
                className={styles.count}
                title="Units in this army at the playhead"
              >
                {count}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteArmy(army.id);
                }}
                title="Delete army (its units and marches stay)"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          );
        })}

        {selectedArmy && (
          <div className={styles.section}>
            <p
              className={styles.sectionTitle}
              style={ELLIPSIS}
              title={selectedArmy.name}
            >
              {selectedArmy.name}: members
            </p>
            <button
              className={styles.cancelButton}
              style={FULL_WIDTH}
              disabled={joinable.length === 0}
              onClick={() => addSelectedUnitsToArmy(selectedArmy.id)}
              title={
                atStart
                  ? "The selected units join from the start"
                  : "The selected units join at the playhead's moment"
              }
            >
              Add selected units
              {joinable.length > 0 ? ` (${joinable.length})` : ""}
            </button>

            {selectedArmy.members.length === 0 && (
              <p className={styles.hint}>No members yet.</p>
            )}
            {selectedArmy.members.map((member, index) => {
              const unit = unitById.get(member.unitId);
              if (!unit) return null;
              const active = memberAt(member, moment);
              // Partway through this stint: it can leave here and keep the time before
              const canLeaveHere =
                active && !atStart && moment > (member.joins ?? -Infinity);
              return (
                <div
                  key={`${member.unitId}-${index}`}
                  className={styles.unitRow}
                  style={active ? undefined : FADED}
                  title={
                    active ? undefined : "Not in this army at the playhead"
                  }
                >
                  <img
                    src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
                    alt={unit.filename}
                    className={styles.unitThumb}
                    draggable={false}
                  />
                  <span style={MEMBER_TEXT}>
                    <span
                      className={styles.unitName}
                      style={ELLIPSIS}
                      title={displayName(unit)}
                    >
                      {displayName(unit)}
                    </span>
                    <span style={DATES} title={describe(member)}>
                      {describe(member)}
                    </span>
                  </span>
                  {canLeaveHere && (
                    <button
                      className={styles.cancelButton}
                      style={SMALL_BUTTON}
                      onClick={() =>
                        removeUnitsFromArmy(selectedArmy.id, [member.unitId])
                      }
                      title="Leaves this army at the playhead's moment, keeping its time in it before"
                    >
                      Leave here
                    </button>
                  )}
                  <button
                    onClick={() => eraseMembership(selectedArmy.id, member)}
                    title="Remove completely: as if it never joined for this stint"
                    className={deleteStyles.deleteButton}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <p className={styles.sectionTitle}>Marches</p>
            {armyMarches.length === 0 && (
              <p className={styles.hint}>
                None yet. Select this army's units, then click a path on the
                map.
              </p>
            )}
            {armyMarches.map((path) => (
              <div
                key={path.id}
                className={`${styles.row} ${path.id === selectedPathId ? styles.rowActive : ""}`}
                onClick={() =>
                  selectPath(path.id === selectedPathId ? null : path.id)
                }
              >
                <span style={MEMBER_TEXT}>
                  <span
                    className={`${styles.name} ${path.id === selectedPathId ? styles.nameActive : ""}`}
                    style={ELLIPSIS}
                    title={path.name}
                  >
                    {path.name}
                  </span>
                  {path.march && (
                    <span style={DATES}>
                      {formatHistoryTime(path.march.start, "days")} to{" "}
                      {formatHistoryTime(path.march.end, "days")}
                    </span>
                  )}
                </span>
              </div>
            ))}

            <p className={styles.hint}>
              Clicking an army selects its units on the map at the playhead.
              Units join at the playhead's moment, or from the start when the
              playhead is at the story's start. "Leave here" ends a unit's time
              in the army at the playhead; × removes that stint completely. A
              unit is in one army at a time, so joining another army leaves this
              one. Double-click a name to rename it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArmiesPanel;

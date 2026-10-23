import React from "react";
import CollapsibleSection from "../toolbar/CollapsibleSection";
import SelectedUnitsSection from "../toolbar/SelectedUnitsSection";
import ExitSection from "../exits/ExitSection";
import BlockLosses from "../blocks/BlockLosses";
import { SelectedBlockFields } from "../blocks/BlocksSection";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useBlockToolStore } from "../../store/useBlockToolStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { useSidePanelStore } from "../../store/useSidePanelStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { membersAt } from "../../utils/marches/armies";
import { formatHistoryTime } from "../../utils/history/historyTime";
import { Unit } from "../../types";
import styles from "../toolbar/PathsPanel.module.css";

const ROW_TEXT: React.CSSProperties = { flex: 1, minWidth: 0 };
const DETAIL: React.CSSProperties = {
  color: "var(--color-text-dim)",
  fontSize: 11,
  flexShrink: 0,
};

// Everything about the selected units: for one block its look and losses; for any units how
// they turn, when they arrive and leave, their army and their marches. Several units show
// only what they share.
function UnitCard({ units }: { units: Unit[] }) {
  const armies = useMapStore((state) => state.armies);
  const paths = useMapStore((state) => state.paths);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectArmy = useMapStore((state) => state.selectArmy);
  const selectPath = useMapStore((state) => state.selectPath);
  const createArmyFromSelection = useMapStore(
    (state) => state.createArmyFromSelection
  );
  const now = useTimelineStore((state) => state.now);

  const sole = units.length === 1 ? units[0] : null;
  const ids = new Set(units.map((unit) => unit.id));
  const them = sole ? "it" : "them";
  const moment = currentMoment(now, storyStart);

  // The armies they're in at the playhead, and the marches that carry any of them
  const inArmies = armies.filter((army) =>
    membersAt(army, moment).some((id) => ids.has(id))
  );
  const marches = paths
    .filter((path) => path.assignments.some((a) => ids.has(a.unitId)))
    .sort((a, b) => (a.march?.start ?? 0) - (b.march?.start ?? 0));

  const openArmy = (armyId: string) => {
    selectArmy(armyId);
    useSidePanelStore.getState().open("build");
  };

  // One tool at a time: drawing a march puts the others down
  const drawMarch = () => {
    useBlockToolStore.getState().stopPlacing();
    const terrain = useTerrainToolStore.getState();
    terrain.stopDrawing();
    terrain.setBrush(null);
    usePathToolStore.getState().startDrawing(Array.from(ids));
  };

  return (
    <>
      {sole?.block && <SelectedBlockFields unit={sole} />}
      <SelectedUnitsSection />

      <CollapsibleSection id="card-army" title="Army">
        {inArmies.length === 0 && (
          <p className={styles.hint}>
            {sole ? "Not in an army" : "None of these are in an army"} at the
            playhead.
          </p>
        )}
        {inArmies.map((army) => (
          <div
            key={army.id}
            className={styles.row}
            onClick={() => openArmy(army.id)}
            title="Open this army in the Build tab"
          >
            <span className={styles.name} style={ROW_TEXT}>
              {army.name}
            </span>
          </div>
        ))}
        <button
          className={styles.cancelButton}
          onClick={() => createArmyFromSelection()}
          title={`Make ${them} a new army, from the playhead's moment`}
        >
          {sole ? "Make it an army" : "Make them an army"}
        </button>
      </CollapsibleSection>

      <ExitSection />

      {sole?.block && (
        <CollapsibleSection id="card-losses" title="Losses">
          <BlockLosses unit={sole} />
        </CollapsibleSection>
      )}

      <CollapsibleSection id="card-marches" title="Marches">
        {marches.length === 0 && (
          <p className={styles.hint}>
            {sole ? "It isn't" : "None of these are"} on a march yet.
          </p>
        )}
        {marches.map((path) => (
          <div
            key={path.id}
            className={`${styles.row} ${path.id === selectedPathId ? styles.rowActive : ""}`}
            onClick={() => selectPath(path.id)}
            title="Show this march on the card"
          >
            <span className={styles.name} style={ROW_TEXT}>
              {path.name}
            </span>
            {path.march && (
              <span style={DETAIL}>
                {formatHistoryTime(path.march.start, "days")}
              </span>
            )}
          </div>
        ))}
        <button
          className={styles.cancelButton}
          onClick={drawMarch}
          title={`Click waypoints on the map, then Finish: ${them} go on the new march`}
        >
          {sole ? "Draw a march for it" : "Draw a march for them"}
        </button>
      </CollapsibleSection>
    </>
  );
}

export default UnitCard;

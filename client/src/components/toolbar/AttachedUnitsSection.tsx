import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useAssetStore } from "../../store/useAssetStore";
import { MapPath, Unit } from "../../types";
import API_BASE_URL from "../../config/api";
import PathPreview from "./PathPreview";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const displayName = (unit: Unit) => unit.filename.replace(/\.[^/.]+$/, "");

const FORMATION_MODES: {
  mode: "keep" | "wheel";
  label: string;
  hint: string;
}[] = [
  {
    mode: "keep",
    label: "Keep as placed",
    hint: "Units turn on the spot to face the path; the formation stays exactly as you laid it out",
  },
  {
    mode: "wheel",
    label: "Turn with units",
    hint: "The whole group turns with its units, so a row facing north ends up a row facing the way the path leaves",
  },
];

// The selected path's units: detaching them, how the formation turns, re-recording it, and
// the preview
function AttachedUnitsSection({
  selectedPath,
  isPlaying,
  setIsPlaying,
}: {
  selectedPath: MapPath;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const armies = useMapStore((state) => state.armies);
  const detachUnitFromPath = useMapStore((state) => state.detachUnitFromPath);
  const refreshPathFormation = useMapStore(
    (state) => state.refreshPathFormation
  );
  const setFormationMode = useMapStore((state) => state.setFormationMode);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  const attachedUnits = selectedPath.assignments
    .map((a) => placedUnits.find((unit) => unit.id === a.unitId))
    .filter((unit): unit is Unit => unit !== undefined);

  // An army's march takes whoever is in the army as it sets off, so its units are changed
  // in the Armies tab rather than here
  const marchArmy = selectedPath.armyId
    ? armies.find((army) => army.id === selectedPath.armyId)
    : undefined;

  const formationMode = selectedPath.direction !== undefined ? "wheel" : "keep";

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{selectedPath.name}: attached units</p>
      {attachedUnits.length === 0 && !marchArmy && (
        <p className={styles.hint}>
          None yet. Select units, then click this path on the map.
        </p>
      )}
      {attachedUnits.map((unit) => (
        <div key={unit.id} className={styles.unitRow}>
          <img
            src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
            alt={unit.filename}
            className={styles.unitThumb}
            draggable={false}
          />
          <span className={styles.unitName}>{displayName(unit)}</span>
          <button
            onClick={() => detachUnitFromPath(selectedPath.id, unit.id)}
            title={
              marchArmy
                ? `Take off this march: it leaves ${marchArmy.name} as the march sets off`
                : "Detach from this path"
            }
            className={deleteStyles.deleteButton}
          >
            ×
          </button>
        </div>
      ))}
      {marchArmy && (
        <p className={styles.hint}>
          This is a march of {marchArmy.name}: it takes whoever is in the army
          as it sets off. Removing a unit here makes it leave the army then, so
          it sits out this march and the army's later ones.
        </p>
      )}

      {attachedUnits.length > 0 && (
        <>
          <div className={styles.segment}>
            {FORMATION_MODES.map(({ mode, label, hint }) => (
              <button
                key={mode}
                title={hint}
                className={`${styles.segmentButton} ${
                  formationMode === mode ? styles.segmentActive : ""
                }`}
                onClick={() => setFormationMode(selectedPath.id, mode)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            {FORMATION_MODES.find((m) => m.mode === formationMode)?.hint}
          </p>
          <button
            className={styles.cancelButton}
            title="Use where the units are, and the way they face, as the formation"
            onClick={() => refreshPathFormation(selectedPath.id)}
          >
            Re-record formation
          </button>

          <PathPreview
            pathId={selectedPath.id}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </>
      )}

      <p className={styles.hint}>
        Before setting off, the group pivots on the spot until its turning units
        face the path. Drag a dot to move it. Click the line to add a dot
        (deselect your units first). Select a dot and press Backspace to remove
        it. Double-click a name to rename it.
      </p>
    </div>
  );
}

export default AttachedUnitsSection;

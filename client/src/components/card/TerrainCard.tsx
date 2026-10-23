import React, { useState } from "react";
import CommitText from "./CommitText";
import AddTerrainDialog from "../terrain/AddTerrainDialog";
import TerrainSwatch from "../terrain/TerrainSwatch";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { featureLabels, kindInfo } from "../../utils/terrain/terrain";
import { Battle, TerrainFeature } from "../../types";
import styles from "../toolbar/PathsPanel.module.css";

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const LABEL: React.CSSProperties = { width: 40, flexShrink: 0 };
const GROW: React.CSSProperties = { flex: 1, minWidth: 0 };

// The selected terrain feature: what it is (changed through the same picker as adding one),
// its name, and deleting it
function TerrainCard({
  battle,
  feature,
}: {
  battle: Battle;
  feature: TerrainFeature;
}) {
  const updateTerrain = useMapStore((state) => state.updateTerrain);
  const deleteTerrain = useMapStore((state) => state.deleteTerrain);
  const [picking, setPicking] = useState(false);
  const label = featureLabels(battle.terrain ?? []).get(feature.id) ?? "";

  return (
    <>
      <div style={ROW}>
        <TerrainSwatch kind={feature.kind} style={battle.style} />
        <span style={GROW}>{kindInfo(feature.kind).label}</span>
        <button
          className={styles.cancelButton}
          title="Change what this feature is (areas to areas, lines to lines)"
          onClick={() => setPicking(true)}
        >
          Change type…
        </button>
      </div>
      <label style={ROW}>
        <span style={LABEL}>Name</span>
        <CommitText
          value={feature.name ?? ""}
          placeholder={label}
          title="Its name in the terrain list (leave empty for the usual one)"
          onCommit={(name) =>
            updateTerrain(battle.id, feature.id, {
              name: name.trim() || undefined,
            })
          }
        />
      </label>
      <button
        className={styles.cancelButton}
        onClick={() => {
          deleteTerrain(battle.id, feature.id);
          useTerrainToolStore.getState().select(null);
        }}
        title="Delete this feature (⌘Z brings it back)"
      >
        Delete
      </button>
      {picking && (
        <AddTerrainDialog
          title={`Change ${label} to…`}
          shape={kindInfo(feature.kind).shape}
          current={feature.kind}
          style={battle.style}
          onClose={() => setPicking(false)}
          onPick={(kind) => {
            setPicking(false);
            updateTerrain(battle.id, feature.id, { kind });
          }}
        />
      )}
    </>
  );
}

export default TerrainCard;

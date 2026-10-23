import React, { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import ToolbarButton from "./ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import PathList from "./PathList";
import styles from "./PathsPanel.module.css";

function PathsPanel() {
  const paths = useMapStore((state) => state.paths);
  const renamePath = useMapStore((state) => state.renamePath);

  const drawingPoints = usePathToolStore((state) => state.drawingPoints);
  const startDrawing = usePathToolStore((state) => state.startDrawing);
  const finishDrawing = usePathToolStore((state) => state.finishDrawing);
  const cancelDrawing = usePathToolStore((state) => state.cancelDrawing);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  const isDrawing = drawingPoints !== null;
  const pointCount = drawingPoints?.length ?? 0;

  const startRename = (id: string, currentName: string) => {
    setRenameValue(currentName);
    setRenamingId(id);
  };

  const commitRename = () => {
    if (renamingId === null) return;
    const id = renamingId;
    const current = paths.find((path) => path.id === id);
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (trimmed && current && trimmed !== current.name) {
      renamePath(id, trimmed);
    }
  };

  return (
    <>
      <CollapsibleSection id="paths" title="All marches" sub>
        <ToolbarButton
          icon="+"
          label="New march"
          isExpanded={true}
          isActive={isDrawing}
          onClick={() => {
            if (!isDrawing) startDrawing();
          }}
        />

        {isDrawing ? (
          <div className={styles.drawing}>
            <p className={styles.hint}>
              Move to the map and click to place waypoints. {pointCount} placed
              so far.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.finishButton}
                onClick={finishDrawing}
                disabled={pointCount < 2}
              >
                Finish
              </button>
              <button className={styles.cancelButton} onClick={cancelDrawing}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.hint}>
              Select units, then click a march on the map to attach them to it.
              Select a march to see its dates and units on the card at the map's
              left.
            </p>
            <PathList
              rename={{
                renamingId,
                renameValue,
                setRenameValue,
                startRename,
                commitRename,
                cancelRename: () => setRenamingId(null),
              }}
            />
          </>
        )}
      </CollapsibleSection>
    </>
  );
}

export default PathsPanel;

import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { kindInfo, minPoints } from "../../utils/terrain/terrain";
import styles from "./TerrainHint.module.css";

// What the terrain tools are doing, top left under the battle's badge, with the buttons that
// finish what's under way. Shown only while drawing, editing or brushing terrain in a battle.
function TerrainHint({ battleId }: { battleId: string }) {
  const drawing = useTerrainToolStore((state) => state.drawing);
  const draft = useTerrainToolStore((state) => state.draft);
  const editing = useTerrainToolStore((state) => state.editing);
  const selectedId = useTerrainToolStore((state) => state.selectedId);
  const tool = useTerrainToolStore.getState;
  const addTerrain = useMapStore((state) => state.addTerrain);
  const deleteTerrain = useMapStore((state) => state.deleteTerrain);
  const brush = useTerrainToolStore((state) => state.brush);
  const brushKind = useTerrainToolStore((state) => state.brushKind);
  const eraseAll = useTerrainToolStore((state) => state.eraseAll);

  if (brush) {
    const kind = kindInfo(brushKind).label.toLowerCase();
    const line = kindInfo(brushKind).shape === "line";
    return (
      <div className={styles.hint} onMouseDown={(e) => e.stopPropagation()}>
        <span className={styles.title}>
          {brush === "erase"
            ? eraseAll
              ? "Erasing all terrain"
              : `Erasing ${kind}`
            : `Painting ${kind}`}
        </span>
        <span className={styles.text}>
          {brush === "paint" && line
            ? "Drag to draw a line"
            : brush === "paint"
              ? "Drag to paint"
              : "Drag to rub out"}
          {brush === "paint" && line ? "" : " · [ and ] change the size"} · X
          swaps brush and eraser · hold Space and drag to pan · Esc puts it down
        </span>
        <button
          className={styles.button}
          onClick={() => tool().setBrush(brush === "erase" ? "paint" : "erase")}
        >
          {brush === "erase" ? "Brush" : "Eraser"}
        </button>
        <button className={styles.button} onClick={() => tool().setBrush(null)}>
          Done
        </button>
      </div>
    );
  }

  if (drawing) {
    const info = kindInfo(drawing);
    const enough = draft.length >= minPoints(drawing);
    return (
      <div className={styles.hint} onMouseDown={(e) => e.stopPropagation()}>
        <span className={styles.title}>Drawing {info.label.toLowerCase()}</span>
        <span className={styles.text}>
          Click to add points · double-click or Enter to finish · Backspace
          undoes a point · Esc cancels
        </span>
        <button
          className={styles.button}
          disabled={!enough}
          title={
            enough
              ? "Finish this shape"
              : `A ${info.label.toLowerCase()} needs at least ${minPoints(drawing)} points`
          }
          onClick={() => {
            const id = addTerrain(battleId, drawing, draft);
            tool().stopDrawing();
            if (id) {
              tool().setEditing(true);
              tool().select(id);
            }
          }}
        >
          Finish
        </button>
        <button className={styles.button} onClick={() => tool().stopDrawing()}>
          Cancel
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className={styles.hint} onMouseDown={(e) => e.stopPropagation()}>
        <span className={styles.title}>Editing terrain</span>
        <span className={styles.text}>
          {selectedId
            ? "Drag points or the shape · double-click it to add a point · Alt-click a point to remove it · Delete removes it"
            : "Click a feature to select it"}
        </span>
        {selectedId && (
          <button
            className={styles.button}
            onClick={() => {
              deleteTerrain(battleId, selectedId);
              tool().select(null);
            }}
          >
            Delete
          </button>
        )}
        <button
          className={styles.button}
          onClick={() => tool().setEditing(false)}
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}

export default TerrainHint;

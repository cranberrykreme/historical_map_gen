import React, { useState } from "react";
import ToolbarButton from "../toolbar/ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { useBlockToolStore } from "../../store/useBlockToolStore";
import { Battle, TerrainKind } from "../../types";
import {
  featureLabels,
  isLine,
  kindInfo,
  TERRAIN_GROUPS,
} from "../../utils/terrain/terrain";
import { BRUSH_MAX, BRUSH_MIN } from "../../utils/terrain/terrainBrush";
import { styleInfo } from "../../utils/terrain/terrainStyles";
import AddTerrainDialog from "./AddTerrainDialog";
import TerrainStyleDialog from "./TerrainStyleDialog";
import TerrainStylePreview from "./TerrainStylePreview";
import TerrainSwatch from "./TerrainSwatch";
import CollapsibleSection from "../toolbar/CollapsibleSection";
import deleteStyles from "../toolbar/DeleteButton.module.css";
import styles from "../toolbar/PathsPanel.module.css";

const KIND_BUTTON: React.CSSProperties = { borderRadius: 4 };
// The panel's segment buttons have no greyed-out look of their own
const DISABLED: React.CSSProperties = { opacity: 0.35, cursor: "not-allowed" };
const GROUP_LABEL: React.CSSProperties = {
  margin: "6px 0 2px",
  color: "var(--color-text-dim)",
  fontSize: 11,
};
const TYPE_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};
const TYPE_NAME: React.CSSProperties = {
  flex: 1,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const SETTING_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const SLIDER: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  accentColor: "#c8a84b",
};
const SIZE_VALUE: React.CSSProperties = {
  width: 28,
  textAlign: "right",
  flexShrink: 0,
};
// Fills the section's width, padding and border included, so it never runs past the panel

// The little picture of the battle's style
const STYLE_PICTURE: React.CSSProperties = { width: 64, flexShrink: 0 };

// The open battle's terrain: its style (how the whole battlefield looks, picked from a popup
// of pictures), a button to add a feature (it opens a picker with every kind),
// a switch to edit what's drawn on the map, the brush and eraser (with the kind they work
// with, their size, and whether the eraser rubs out every kind), and the features grouped by
// type. Click one to select it (its kind and name are on the selection card), double-click
// its name to rename it, × to delete it.
function TerrainSection({ battle }: { battle: Battle }) {
  const drawing = useTerrainToolStore((state) => state.drawing);
  const editing = useTerrainToolStore((state) => state.editing);
  const selectedId = useTerrainToolStore((state) => state.selectedId);
  const tool = useTerrainToolStore.getState;
  const updateTerrain = useMapStore((state) => state.updateTerrain);
  const updateBattle = useMapStore((state) => state.updateBattle);
  const deleteTerrain = useMapStore((state) => state.deleteTerrain);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const brush = useTerrainToolStore((state) => state.brush);
  const brushKind = useTerrainToolStore((state) => state.brushKind);
  const brushSize = useTerrainToolStore((state) => state.brushSize);
  const eraseAll = useTerrainToolStore((state) => state.eraseAll);

  const [picker, setPicker] = useState<"add" | "brush" | "style" | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const features = battle.terrain ?? [];
  const labels = featureLabels(features);

  const draw = (kind: TerrainKind) => {
    usePathToolStore.getState().cancelDrawing();
    useBlockToolStore.getState().stopPlacing();
    selectUnit(null);
    tool().startDrawing(kind);
  };

  // Takes up the brush or eraser, or puts it down if it's already in hand
  const toggleBrush = (mode: "paint" | "erase") => {
    usePathToolStore.getState().cancelDrawing();
    useBlockToolStore.getState().stopPlacing();
    selectUnit(null);
    tool().setBrush(brush === mode ? null : mode);
  };
  const brushLabel = kindInfo(brushKind).label;

  const commitRename = () => {
    if (renamingId !== null)
      updateTerrain(battle.id, renamingId, {
        name: renameValue.trim() || undefined,
      });
    setRenamingId(null);
  };

  return (
    <CollapsibleSection id="terrain" title={`Terrain: ${battle.name}`}>
      <div style={TYPE_ROW} title={styleInfo(battle.style).hint}>
        <div style={STYLE_PICTURE}>
          <TerrainStylePreview style={battle.style} height={22} />
        </div>
        <span style={TYPE_NAME}>Style: {styleInfo(battle.style).label}</span>
        <button
          className={styles.cancelButton}
          title="Pick how this battle's terrain looks: a season, night, or an old or textbook map"
          onClick={() => setPicker("style")}
        >
          Change…
        </button>
      </div>
      {drawing ? (
        <div className={styles.actions}>
          <span className={styles.hint} style={{ flex: 1 }}>
            Drawing {kindInfo(drawing).label.toLowerCase()}: click points on the
            map
          </span>
          <button
            className={styles.cancelButton}
            onClick={() => tool().stopDrawing()}
          >
            Cancel
          </button>
        </div>
      ) : (
        <ToolbarButton
          icon="+"
          label="Add terrain"
          hint="Pick a kind of terrain to draw"
          isExpanded={true}
          onClick={() => setPicker("add")}
        />
      )}
      <button
        className={`${styles.segmentButton} ${editing ? styles.segmentActive : ""}`}
        style={
          features.length === 0 ? { ...KIND_BUTTON, ...DISABLED } : KIND_BUTTON
        }
        disabled={features.length === 0}
        title="Click features on the map to select, reshape, move or delete them"
        onClick={() => tool().setEditing(!editing)}
      >
        {editing ? "Done editing" : "Edit terrain on the map"}
      </button>
      <div className={styles.segment}>
        <button
          className={`${styles.segmentButton} ${brush === "paint" ? styles.segmentActive : ""}`}
          title="Paint terrain freehand: drag on the map (X swaps to the eraser)"
          onClick={() => toggleBrush("paint")}
        >
          Brush
        </button>
        <button
          className={`${styles.segmentButton} ${brush === "erase" ? styles.segmentActive : ""}`}
          title="Rub terrain out: drag on the map (X swaps to the brush)"
          onClick={() => toggleBrush("erase")}
        >
          Eraser
        </button>
      </div>
      {brush && (
        <>
          <div style={TYPE_ROW}>
            <TerrainSwatch kind={brushKind} style={battle.style} />
            <span style={TYPE_NAME}>{brushLabel}</span>
            <button
              className={styles.cancelButton}
              title={
                brush === "erase"
                  ? "Pick the kind of terrain the eraser rubs out"
                  : "Pick the kind of terrain to paint"
              }
              onClick={() => setPicker("brush")}
            >
              Change…
            </button>
          </div>
          {!(brush === "paint" && isLine(brushKind)) && (
            <label
              style={SETTING_ROW}
              title="The brush's size ([ and ] change it too)"
            >
              Size
              <input
                type="range"
                min={BRUSH_MIN}
                max={BRUSH_MAX}
                value={brushSize}
                style={SLIDER}
                onChange={(e) => tool().setBrushSize(Number(e.target.value))}
              />
              <span style={SIZE_VALUE}>{brushSize}</span>
            </label>
          )}
          {brush === "erase" && (
            <label style={SETTING_ROW}>
              <input
                type="checkbox"
                checked={eraseAll}
                onChange={(e) => tool().setEraseAll(e.target.checked)}
              />
              Erase every kind, not just {brushLabel.toLowerCase()}
            </label>
          )}
        </>
      )}

      {features.length === 0 ? (
        <p className={styles.emptyMessage}>
          Nothing drawn yet. Add terrain and click points on the map, or paint
          it on with the brush.
        </p>
      ) : (
        TERRAIN_GROUPS.map((group) => {
          const inGroup = features.filter(
            (f) => kindInfo(f.kind).group === group
          );
          if (inGroup.length === 0) return null;
          return (
            <React.Fragment key={group}>
              <p style={GROUP_LABEL}>{group}</p>
              {inGroup.map((f) => {
                const active = f.id === selectedId;
                return (
                  <div
                    key={f.id}
                    className={`${styles.row} ${active ? styles.rowActive : ""}`}
                    title={`${kindInfo(f.kind).label} (double-click the name to rename)`}
                    onClick={() => {
                      tool().setEditing(true);
                      tool().select(active ? null : f.id);
                    }}
                  >
                    <TerrainSwatch kind={f.kind} style={battle.style} />
                    {renamingId === f.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        placeholder={labels.get(f.id)}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className={styles.renameInput}
                      />
                    ) : (
                      <span
                        className={`${styles.name} ${active ? styles.nameActive : ""}`}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setRenameValue(f.name ?? "");
                          setRenamingId(f.id);
                        }}
                      >
                        {labels.get(f.id)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTerrain(battle.id, f.id);
                        if (active) tool().select(null);
                      }}
                      title="Delete this feature"
                      className={deleteStyles.deleteButton}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })
      )}

      {picker === "add" && (
        <AddTerrainDialog
          title="Add terrain"
          style={battle.style}
          onClose={() => setPicker(null)}
          onPick={(kind) => {
            setPicker(null);
            draw(kind);
          }}
        />
      )}
      {picker === "brush" && (
        <AddTerrainDialog
          title={brush === "erase" ? "Erase…" : "Paint with…"}
          current={brushKind}
          style={battle.style}
          onClose={() => setPicker(null)}
          onPick={(kind) => {
            setPicker(null);
            tool().setBrushKind(kind);
          }}
        />
      )}
      {picker === "style" && (
        <TerrainStyleDialog
          battleName={battle.name}
          current={battle.style}
          onClose={() => setPicker(null)}
          onPick={(style) => {
            setPicker(null);
            updateBattle(battle.id, { style });
          }}
        />
      )}
    </CollapsibleSection>
  );
}

export default TerrainSection;

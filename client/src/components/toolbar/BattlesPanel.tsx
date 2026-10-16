import React, { useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { Battle, BattleKind, MAP_SCENE, TerrainKind } from "../../types";
import { BATTLE_SIZES, nextBattleName } from "../../utils/scenes";
import {
  featureLabels,
  isLine,
  kindInfo,
  TERRAIN_GROUPS,
} from "../../utils/terrain";
import { BRUSH_MAX, BRUSH_MIN } from "../../utils/terrainBrush";
import AddTerrainDialog from "../terrain/AddTerrainDialog";
import BlocksSection from "../blocks/BlocksSection";
import { useBlockToolStore } from "../../store/useBlockToolStore";
import TerrainPatterns from "../terrain/TerrainPatterns";
import TerrainSwatch from "../terrain/TerrainSwatch";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const KINDS: { kind: BattleKind; label: string; hint: string }[] = [
  { kind: "land", label: "Land", hint: "A battlefield of open ground" },
  { kind: "sea", label: "Sea", hint: "Open water, for fleets" },
];

const COUNT: React.CSSProperties = { flexShrink: 0 };
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
const INPUT: React.CSSProperties = {
  flex: "none",
  width: "100%",
  boxSizing: "border-box",
};

// The open battle's terrain: a button to add a feature (it opens a picker with every kind),
// a switch to edit what's drawn on the map, the brush and eraser (with the kind they work
// with, their size, and whether the eraser rubs out every kind), and the features grouped by
// type. Click one to select it, double-click its name to rename it, × to delete it; the
// selected one's type can be changed through the same picker.
function TerrainSection({ battle }: { battle: Battle }) {
  const drawing = useTerrainToolStore((state) => state.drawing);
  const editing = useTerrainToolStore((state) => state.editing);
  const selectedId = useTerrainToolStore((state) => state.selectedId);
  const tool = useTerrainToolStore.getState;
  const updateTerrain = useMapStore((state) => state.updateTerrain);
  const deleteTerrain = useMapStore((state) => state.deleteTerrain);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const brush = useTerrainToolStore((state) => state.brush);
  const brushKind = useTerrainToolStore((state) => state.brushKind);
  const brushSize = useTerrainToolStore((state) => state.brushSize);
  const eraseAll = useTerrainToolStore((state) => state.eraseAll);

  const [picker, setPicker] = useState<"add" | "change" | "brush" | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const features = battle.terrain ?? [];
  const selected = features.find((f) => f.id === selectedId) ?? null;
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
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Terrain</p>
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
        <button
          className={styles.finishButton}
          title="Pick a kind of terrain to draw"
          onClick={() => setPicker("add")}
        >
          + Add terrain
        </button>
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
            <TerrainSwatch kind={brushKind} />
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
                    <TerrainSwatch kind={f.kind} />
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

      {selected && (
        <div style={TYPE_ROW}>
          <TerrainSwatch kind={selected.kind} />
          <span style={TYPE_NAME}>{kindInfo(selected.kind).label}</span>
          <button
            className={styles.cancelButton}
            title="Change what the selected feature is (areas to areas, lines to lines)"
            onClick={() => setPicker("change")}
          >
            Change type…
          </button>
        </div>
      )}

      {picker === "add" && (
        <AddTerrainDialog
          title="Add terrain"
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
          onClose={() => setPicker(null)}
          onPick={(kind) => {
            setPicker(null);
            tool().setBrushKind(kind);
          }}
        />
      )}
      {picker === "change" && selected && (
        <AddTerrainDialog
          title={`Change ${labels.get(selected.id)} to…`}
          shape={kindInfo(selected.kind).shape}
          current={selected.kind}
          onClose={() => setPicker(null)}
          onPick={(kind) => {
            setPicker(null);
            updateTerrain(battle.id, selected.id, { kind });
          }}
        />
      )}
    </div>
  );
}

// The scenes: the main map and its battles. Click one to edit it; each battle is a separate
// battlefield with its own units, paths and armies. New battles are made at the bottom.
function BattlesPanel() {
  const battles = useMapStore((state) => state.battles);
  const activeSceneId = useMapStore((state) => state.activeSceneId);
  const sceneStash = useMapStore((state) => state.sceneStash);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const switchScene = useMapStore((state) => state.switchScene);
  const addBattle = useMapStore((state) => state.addBattle);
  const updateBattle = useMapStore((state) => state.updateBattle);
  const deleteBattle = useMapStore((state) => state.deleteBattle);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<BattleKind>("land");
  const [newSize, setNewSize] = useState(0);

  // How many units each scene has, the open one counted live
  const unitCount = (sceneId: string) =>
    sceneId === activeSceneId
      ? placedUnits.length
      : (sceneStash[sceneId]?.units.length ?? 0);

  const commitRename = () => {
    if (renamingId !== null) updateBattle(renamingId, { name: renameValue });
    setRenamingId(null);
  };

  const create = () => {
    const size = BATTLE_SIZES[newSize];
    const id = addBattle({
      name: newName,
      kind: newKind,
      width: size.width,
      height: size.height,
    });
    setNewName("");
    switchScene(id);
  };

  const onMap = activeSceneId === MAP_SCENE;
  const openBattle = battles.find((b) => b.id === activeSceneId) ?? null;

  return (
    <div className={styles.panel}>
      <TerrainPatterns />
      <div className={styles.list}>
        <p className={styles.sectionTitle}>Scenes</p>
        <div
          className={`${styles.row} ${onMap ? styles.rowActive : ""}`}
          onClick={() => switchScene(MAP_SCENE)}
          title="Edit the main map"
        >
          <span className={`${styles.name} ${onMap ? styles.nameActive : ""}`}>
            Main map
          </span>
          <span className={styles.count} style={COUNT} title="Units placed">
            {unitCount(MAP_SCENE)}
          </span>
        </div>

        {battles.length === 0 && (
          <p className={styles.emptyMessage}>
            No battles yet. A battle is a close-up battlefield of its own, which
            the video can cut to from the map.
          </p>
        )}

        {battles.map((battle) => {
          const active = battle.id === activeSceneId;
          if (confirmingId === battle.id) {
            return (
              <div key={battle.id} className={styles.section}>
                <p className={styles.hint}>
                  Delete “{battle.name}” and the {unitCount(battle.id)} units,
                  paths and armies in it?
                </p>
                <div className={styles.actions}>
                  <button
                    className={styles.finishButton}
                    onClick={() => {
                      deleteBattle(battle.id);
                      setConfirmingId(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setConfirmingId(null)}
                  >
                    Keep
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={battle.id}
              className={`${styles.row} ${active ? styles.rowActive : ""}`}
              onClick={() => switchScene(battle.id)}
              title={`Edit ${battle.name} (double-click the name to rename)`}
            >
              <span className={styles.count} style={COUNT}>
                {battle.kind === "sea" ? "⚓" : "⚔"}
              </span>
              {renamingId === battle.id ? (
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
                  className={`${styles.name} ${active ? styles.nameActive : ""}`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenameValue(battle.name);
                    setRenamingId(battle.id);
                  }}
                >
                  {battle.name}
                </span>
              )}
              <span className={styles.count} style={COUNT} title="Units placed">
                {unitCount(battle.id)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(battle.id);
                }}
                title="Delete this battle and everything in it"
                className={deleteStyles.deleteButton}
              >
                ×
              </button>
            </div>
          );
        })}

        {openBattle && <TerrainSection battle={openBattle} />}
        {openBattle && <BlocksSection />}

        <div className={styles.section}>
          <p className={styles.sectionTitle}>New battle</p>
          <input
            className={styles.renameInput}
            style={INPUT}
            value={newName}
            placeholder={nextBattleName(battles)}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
          />
          <div className={styles.segment}>
            {KINDS.map(({ kind, label, hint }) => (
              <button
                key={kind}
                title={hint}
                className={`${styles.segmentButton} ${newKind === kind ? styles.segmentActive : ""}`}
                onClick={() => setNewKind(kind)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.segment}>
            {BATTLE_SIZES.map((size, index) => (
              <button
                key={size.label}
                title={`${size.width} × ${size.height} map units (a unit is 48 wide)`}
                className={`${styles.segmentButton} ${newSize === index ? styles.segmentActive : ""}`}
                onClick={() => setNewSize(index)}
              >
                {size.label}
              </button>
            ))}
          </div>
          <button className={styles.finishButton} onClick={create}>
            Create and open
          </button>
        </div>
      </div>
    </div>
  );
}

export default BattlesPanel;

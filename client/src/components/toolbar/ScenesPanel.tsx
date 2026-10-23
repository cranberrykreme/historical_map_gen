import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import CollapsibleSection from "./CollapsibleSection";
import { useMapStore } from "../../store/useMapStore";
import { BattleKind } from "../../types";
import { BATTLE_SIZES, nextBattleName } from "../../utils/scenes/scenes";
import {
  NEW_SCENE_OPTIONS,
  NewSceneOption,
  sceneGroups,
  SceneEntry,
} from "../../utils/scenes/kinds";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

const COUNT: React.CSSProperties = { flexShrink: 0 };
const INPUT: React.CSSProperties = {
  flex: "none",
  width: "100%",
  boxSizing: "border-box",
};
const MENU: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "var(--space-xs)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-surface-raised)",
};
const NEW_FORM: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
  padding: "var(--space-sm)",
  border: "1px solid var(--color-gold-dim)",
  borderRadius: "var(--radius-sm)",
};
const FORM_TITLE: React.CSSProperties = {
  color: "var(--color-gold)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-md)",
};

const KIND_ICON: Record<BattleKind, string> = { land: "⚔", sea: "⚓" };

// Every scene the video can show, grouped by kind: the main map, then the battles. Click one
// to open it; double-click a battle's name to rename it. "New scene" makes a scene of any kind.
function ScenesPanel() {
  const battles = useMapStore((state) => state.battles);
  const activeSceneId = useMapStore((state) => state.activeSceneId);
  const sceneStash = useMapStore((state) => state.sceneStash);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const switchScene = useMapStore((state) => state.switchScene);
  const addBattle = useMapStore((state) => state.addBattle);
  const updateBattle = useMapStore((state) => state.updateBattle);
  const deleteBattle = useMapStore((state) => state.deleteBattle);

  const [menuOpen, setMenuOpen] = useState(false);
  const [making, setMaking] = useState<NewSceneOption | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
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
    if (!making) return;
    const size = BATTLE_SIZES[newSize];
    const id = addBattle({
      name: newName,
      kind: making.battleKind ?? "land",
      width: size.width,
      height: size.height,
    });
    setNewName("");
    setMaking(null);
    switchScene(id);
  };

  const sceneRow = (scene: SceneEntry) => {
    const active = scene.id === activeSceneId;
    const battle = battles.find((b) => b.id === scene.id);
    if (battle && confirmingId === battle.id) {
      return (
        <div key={scene.id} className={styles.section}>
          <p className={styles.hint}>
            Delete “{battle.name}” and the {unitCount(battle.id)} units, marches
            and armies in it?
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
        key={scene.id}
        className={`${styles.row} ${active ? styles.rowActive : ""}`}
        onClick={() => switchScene(scene.id)}
        title={
          battle
            ? `Open ${battle.name} (double-click the name to rename)`
            : `Open the ${scene.name.toLowerCase()}`
        }
      >
        {battle && (
          <span className={styles.count} style={COUNT}>
            {KIND_ICON[battle.kind]}
          </span>
        )}
        {battle && renamingId === battle.id ? (
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
              if (!battle) return;
              e.stopPropagation();
              setRenameValue(battle.name);
              setRenamingId(battle.id);
            }}
          >
            {scene.name}
          </span>
        )}
        <span className={styles.count} style={COUNT} title="Units placed">
          {unitCount(scene.id)}
        </span>
        {battle && (
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
        )}
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="New scene"
        hint="Make a new scene"
        isActive={menuOpen}
        isExpanded={true}
        onClick={() => {
          setMenuOpen(!menuOpen);
          setMaking(null);
        }}
      />
      {menuOpen && (
        <div style={MENU}>
          {NEW_SCENE_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={styles.row}
              title={option.hint}
              onClick={() => {
                setMaking(option);
                setMenuOpen(false);
              }}
            >
              <span className={styles.count} style={COUNT}>
                {option.icon}
              </span>
              <span className={styles.name}>{option.label}</span>
            </div>
          ))}
        </div>
      )}
      {making && (
        <div style={NEW_FORM}>
          <span style={FORM_TITLE}>New {making.label.toLowerCase()}</span>
          <input
            autoFocus
            className={styles.renameInput}
            style={INPUT}
            value={newName}
            placeholder={nextBattleName(battles)}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") setMaking(null);
            }}
          />
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
          <div className={styles.actions}>
            <button className={styles.finishButton} onClick={create}>
              Create and open
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setMaking(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {sceneGroups(battles).map(({ kind, group, scenes }) => (
          <CollapsibleSection key={kind} id={`scenes-${kind}`} title={group}>
            {scenes.length === 0 ? (
              <p className={styles.emptyMessage}>
                No {group.toLowerCase()} yet. A battle is a close-up battlefield
                of its own, which the video can cut to from the map. Make one
                with “New scene”.
              </p>
            ) : (
              scenes.map(sceneRow)
            )}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}

export default ScenesPanel;

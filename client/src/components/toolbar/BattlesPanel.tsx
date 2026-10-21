import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import CollapsibleSection from "./CollapsibleSection";
import { useMapStore } from "../../store/useMapStore";
import { BattleKind, MAP_SCENE } from "../../types";
import { BATTLE_SIZES, nextBattleName } from "../../utils/scenes/scenes";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";
import { isMainMap } from "../../utils/scenes/kinds";

const KINDS: { kind: BattleKind; label: string; hint: string }[] = [
  { kind: "land", label: "Land", hint: "A battlefield of open ground" },
  { kind: "sea", label: "Sea", hint: "Open water, for fleets" },
];

const COUNT: React.CSSProperties = { flexShrink: 0 };
const INPUT: React.CSSProperties = {
  flex: "none",
  width: "100%",
  boxSizing: "border-box",
};

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

  const onMap = isMainMap(activeSceneId);

  return (
    <>
      <CollapsibleSection id="scenes" title="Main map and battles" sub>
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
      </CollapsibleSection>

      <CollapsibleSection id="new-battle" title="New battle" sub>
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
        <ToolbarButton
          icon="+"
          label="Create and open"
          hint="Make this battle and open it"
          isExpanded={true}
          onClick={create}
        />
      </CollapsibleSection>
    </>
  );
}

export default BattlesPanel;

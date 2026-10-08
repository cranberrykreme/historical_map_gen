import React from "react";
import { useMapStore } from "../../store/useMapStore";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";

// What's being renamed. The state lives in PathsPanel so it survives the list being
// swapped out while a new path is drawn.
export interface PathRename {
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  startRename: (id: string, currentName: string) => void;
  commitRename: () => void;
  cancelRename: () => void;
}

// Every path, with its unit count and delete button. Click one to select it; double-click
// its name to rename it.
function PathList({ rename }: { rename: PathRename }) {
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const deletePath = useMapStore((state) => state.deletePath);

  return (
    <>
      {paths.length === 0 && (
        <p className={styles.emptyMessage}>
          No paths yet. Click "New path" to draw one.
        </p>
      )}
      {paths.map((path) => {
        const isSelected = path.id === selectedPathId;
        return (
          <div
            key={path.id}
            className={`${styles.row} ${isSelected ? styles.rowActive : ""}`}
            onClick={() => selectPath(isSelected ? null : path.id)}
          >
            {rename.renamingId === path.id ? (
              <input
                autoFocus
                value={rename.renameValue}
                onChange={(e) => rename.setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={rename.commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") rename.commitRename();
                  if (e.key === "Escape") rename.cancelRename();
                }}
                className={styles.renameInput}
              />
            ) : (
              <span
                className={`${styles.name} ${isSelected ? styles.nameActive : ""}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  rename.startRename(path.id, path.name);
                }}
              >
                {path.name}
              </span>
            )}
            {path.assignments.length > 0 && (
              <span className={styles.count}>{path.assignments.length}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePath(path.id);
              }}
              title="Delete path"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
        );
      })}
    </>
  );
}

export default PathList;

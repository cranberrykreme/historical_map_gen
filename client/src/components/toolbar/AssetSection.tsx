import React, { useState } from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType, AssetFile } from "../../types";
import styles from "./AssetSection.module.css";

interface AssetSectionProps {
  title: string;
  assetType: AssetType;
  files: AssetFile[];
  folders: string[];
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onCreateFolder: (name: string) => void;
  onMoveAsset: (path: string, folder: string) => Promise<void>;
  onRenameAsset: (
    path: string,
    newFilename: string,
    folder: string | null
  ) => Promise<void>;
}

function AssetSection({
  title,
  assetType,
  files,
  folders,
  onDeleteAsset,
  onCreateFolder,
  onMoveAsset,
  onRenameAsset,
}: AssetSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

  if (files.length === 0 && folders.length === 0) return null;

  const topLevelFiles = files.filter((f) => f.folder === null);
  const filesByFolder = (folder: string) =>
    files.filter((f) => f.folder === folder);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const commitNewFolder = () => {
    const trimmed = newFolderName.trim();
    setIsCreatingFolder(false);
    setNewFolderName("");
    if (trimmed) {
      onCreateFolder(trimmed);
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    setDropTargetFolder(null);
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const { path, assetType: droppedType } = JSON.parse(data) as {
        path: string;
        assetType: AssetType;
      };
      if (droppedType === assetType) {
        onMoveAsset(path, folder);
      }
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  return (
    <div className={styles.section}>
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={styles.header}
      >
        <span>{title}</span>
        <span
          className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>

      {!isCollapsed && (
        <>
          {topLevelFiles.map((file) => (
            <UnitThumbnail
              key={file.path}
              path={file.path}
              filename={file.filename}
              assetType={assetType}
              onDelete={() => onDeleteAsset(file.path, assetType)}
              onRename={(newFilename) =>
                onRenameAsset(file.path, newFilename, file.folder)
              }
            />
          ))}

          {folders.map((folder) => {
            const folderCollapsed = collapsedFolders.has(folder);
            const folderFiles = filesByFolder(folder);
            return (
              <div key={folder} className={styles.folderGroup}>
                <div
                  onClick={() => toggleFolder(folder)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetFolder(folder);
                  }}
                  onDragLeave={() => setDropTargetFolder(null)}
                  onDrop={(e) => handleFolderDrop(e, folder)}
                  className={`${styles.folderHeader} ${dropTargetFolder === folder ? styles.folderHeaderDropTarget : ""}`}
                >
                  <span
                    className={`${styles.folderChevron} ${folderCollapsed ? styles.folderChevronCollapsed : ""}`}
                  >
                    ▾
                  </span>
                  <span>{folder}</span>
                </div>
                {!folderCollapsed && (
                  <div className={styles.folderContents}>
                    {folderFiles.map((file) => (
                      <UnitThumbnail
                        key={file.path}
                        path={file.path}
                        filename={file.filename}
                        assetType={assetType}
                        onDelete={() => onDeleteAsset(file.path, assetType)}
                        onRename={(newFilename) =>
                          onRenameAsset(file.path, newFilename, file.folder)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isCreatingFolder ? (
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={commitNewFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewFolder();
                if (e.key === "Escape") {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name"
              className={styles.newFolderInput}
            />
          ) : (
            <button
              className={styles.newFolderButton}
              onClick={() => setIsCreatingFolder(true)}
            >
              + New folder
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default AssetSection;

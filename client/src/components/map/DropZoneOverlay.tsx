import React, { useState, useEffect } from "react";
import { AssetType } from "../../types";
import { uploadTargetFor } from "../../utils/project/uploads";
import styles from "./DropZoneOverlay.module.css";

interface DropZoneOverlayProps {
  // Where the files go: a Library section they were dropped on, or null to ask
  onFilesDrop: (files: File[], target: AssetType | null) => void;
}

const SECTION_NAMES: Record<AssetType, string> = {
  maps: "Maps",
  units: "Units",
  portraits: "Portraits",
};

// The Library section under the pointer, if it takes pictures
function targetAt(target: EventTarget | null): AssetType | null {
  if (!(target instanceof Element)) return null;
  const section = target.closest("[data-library-section]");
  return uploadTargetFor(section?.getAttribute("data-library-section"));
}

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];

function DropZoneOverlay({ onFilesDrop }: DropZoneOverlayProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<AssetType | null>(null);

  const isAllowedFile = (file: File): boolean => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(extension ?? "");
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setError(null);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setHovered(targetAt(e.target));
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const fileList = e.dataTransfer?.files;
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      const invalidFiles = files.filter((file) => !isAllowedFile(file));

      if (invalidFiles.length > 0) {
        setError(
          `File type not supported. Please use: ${ALLOWED_EXTENSIONS.join(", ")}`
        );
        setTimeout(() => setError(null), 3000);
        return;
      }

      onFilesDrop(files, targetAt(e.target));
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFilesDrop]);

  return (
    <div className={styles.overlay}>
      {isDragging && (
        <div className={styles.dragOverlay}>
          <p className={styles.dragMessage}>
            {hovered
              ? `Drop to add to ${SECTION_NAMES[hovered]}`
              : "Drop to add to the Library"}
          </p>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}

export default DropZoneOverlay;

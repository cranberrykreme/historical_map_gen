import React, { useState, useEffect } from "react";
import styles from "./DropZoneOverlay.module.css";

interface DropZoneOverlayProps {
  onFilesDrop: (files: File[]) => void;
}

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];

function DropZoneOverlay({ onFilesDrop }: DropZoneOverlayProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      onFilesDrop(files);
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
          <p className={styles.dragMessage}>Drop to add asset</p>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}

export default DropZoneOverlay;

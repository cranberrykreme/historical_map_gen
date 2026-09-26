import React, { useState, useEffect } from "react";
import styles from "./DropZoneOverlay.module.css";

interface DropZoneOverlayProps {
  onFileDrop: (file: File) => void;
}

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];

function DropZoneOverlay({ onFileDrop }: DropZoneOverlayProps) {
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

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      if (!isAllowedFile(file)) {
        setError(
          `File type not supported. Please use: ${ALLOWED_EXTENSIONS.join(", ")}`
        );
        setTimeout(() => setError(null), 3000);
        return;
      }

      onFileDrop(file);
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
  }, [onFileDrop]);

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

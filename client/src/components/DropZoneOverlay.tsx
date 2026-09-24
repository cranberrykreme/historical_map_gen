import React, { useState, useEffect } from "react";

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 500,
        pointerEvents: "none",
      }}
    >
      {isDragging && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(200, 168, 75, 0.08)",
            border: "2px dashed var(--color-gold)",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              color: "var(--color-gold)",
              fontFamily: "var(--font-ui)",
              fontSize: "18px",
              background: "var(--color-surface)",
              padding: "var(--space-md) var(--space-lg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            Drop to add asset
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "var(--space-lg)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-surface)",
            border: "1px solid #6a3030",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            color: "#e07070",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--font-size-md)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default DropZoneOverlay;

import React from "react";

// A selected unit's handles: the dot above it turns it, the square at its corner resizes it
function TurnAndSizeHandles({
  canScale,
  isShiftHeld,
  onRotate,
  onScale,
}: {
  canScale: boolean;
  isShiftHeld: boolean;
  onRotate: (e: React.MouseEvent) => void;
  onScale: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      <div
        onMouseDown={(e) => onRotate(e)}
        style={{
          position: "absolute",
          top: "-24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: "#c8a84b",
          cursor: isShiftHeld ? "default" : "alias",
          pointerEvents: "all",
        }}
      />
      {/* A block is sized with its own handles instead */}
      {canScale && (
        <div
          onMouseDown={(e) => onScale(e)}
          style={{
            position: "absolute",
            bottom: "-6px",
            right: "-6px",
            width: "12px",
            height: "12px",
            background: "#c8a84b",
            cursor: isShiftHeld ? "default" : "nwse-resize",
            pointerEvents: "all",
          }}
        />
      )}
    </>
  );
}

export default TurnAndSizeHandles;

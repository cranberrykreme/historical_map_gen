import React from "react";

const ARROW_LENGTH = 64; // in the unit's own space, so it scales with the unit

// The arrow on a selected unit showing which way it faces, with a handle at its tip to drag
function ForwardArrow({
  angle,
  isShiftHeld,
  onMouseDown,
}: {
  angle: number; // degrees, on screen
  isShiftHeld: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transform: `rotate(${angle}deg)`,
        pointerEvents: "none",
        filter: "drop-shadow(0 0 1px rgba(26, 18, 37, 0.9))",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: -1,
          width: ARROW_LENGTH,
          height: 2,
          background: "#c8a84b",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: ARROW_LENGTH - 2,
          top: -6,
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: "10px solid #c8a84b",
          pointerEvents: "none",
        }}
      />
      <div
        title="Drag to set which way this unit faces"
        onMouseDown={(e) => onMouseDown(e)}
        style={{
          position: "absolute",
          left: ARROW_LENGTH - 9,
          top: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          cursor: isShiftHeld ? "default" : "grab",
          pointerEvents: "all",
        }}
      />
    </div>
  );
}

export default ForwardArrow;

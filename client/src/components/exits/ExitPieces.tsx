import React from "react";
import {
  ExitFrame,
  RIPPLE,
  RIPPLE_WIDTH,
  TEAR_EDGE,
  TEAR_SHADOW,
} from "../../utils/units/exits";

const percent = (n: number) => `${Math.round(n * 10000) / 100}%`;

// A unit part way through leaving, in the editor: its picture (`children`) drawn once per
// piece, each cut to its shape and moved, turned and faded as utils/units/exits says, with any tear
// lines over it and ripples round it. `width` is the picture's width in pixels at the unit's
// own size, which the pieces' movements are measured in. Drawn the same way as the video.
function ExitPieces({
  frame,
  width,
  children,
}: {
  frame: ExitFrame;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", pointerEvents: "none" }}>
      {frame.ripples.map((ripple, i) => (
        <div
          key={`ripple-${i}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2 * ripple.radius * width,
            height: 2 * ripple.radius * width,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `${RIPPLE_WIDTH * width}px solid ${RIPPLE}`,
            boxSizing: "border-box",
            opacity: ripple.alpha,
          }}
        />
      ))}
      {frame.pieces.map((piece, i) => (
        <div
          key={i}
          style={{
            // The first piece sits in the flow so the box keeps the picture's size
            position: i === 0 ? "relative" : "absolute",
            left: 0,
            top: 0,
            width: i === 0 ? undefined : "100%",
            height: i === 0 ? undefined : "100%",
            opacity: Math.max(piece.alpha, 0),
            transformOrigin: `${percent(piece.origin.x)} ${percent(piece.origin.y)}`,
            transform: `translate(${piece.x * width}px, ${piece.y * width}px) rotate(${piece.rotate}deg) scale(${piece.scale})`,
            clipPath: piece.clip
              ? `polygon(${piece.clip.map((p) => `${percent(p.x)} ${percent(p.y)}`).join(", ")})`
              : undefined,
          }}
        >
          {children}
        </div>
      ))}
      {frame.tears.length > 0 && (
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          {frame.tears.map((tear, i) => {
            const d = tear.points
              .map((p, k) => `${k === 0 ? "M" : "L"}${p.x} ${p.y}`)
              .join("");
            return (
              <g key={i} opacity={tear.alpha}>
                <path
                  d={d}
                  fill="none"
                  stroke={TEAR_SHADOW}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={TEAR_EDGE}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export default ExitPieces;

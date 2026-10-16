import React from "react";
import {
  crossSize,
  crossStrokes,
  DrawMarker,
  MARKER_HALO,
  MARKER_INK,
  PATCH_FILL,
  patchOutline,
  smoothClosed,
} from "../../utils/exits";

const n = (v: number) => Math.round(v * 100) / 100;

// A patch marker's outline as SVG path data
function patchPath(marker: DrawMarker): string {
  const curve = smoothClosed(
    patchOutline(marker.id, marker.width / 2, marker.depth / 2)
  );
  return (
    `M${n(curve.start.x)} ${n(curve.start.y)}` +
    curve.curves
      .map(
        (c) => `Q${n(c.control.x)} ${n(c.control.y)} ${n(c.to.x)} ${n(c.to.y)}`
      )
      .join("") +
    "Z"
  );
}

// The markers where units fell, in map units, under the units: a dark patch of ground turned
// with the unit, or a small upright cross. Drawn the same way as the video (see drawFrame).
function MarkerLayer({ markers }: { markers: DrawMarker[] }) {
  if (markers.length === 0) return null;
  return (
    <svg
      width={1}
      height={1}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {markers.map((marker) => (
        <g
          key={marker.id}
          opacity={Math.min(Math.max(marker.alpha, 0), 1)}
          transform={`translate(${n(marker.x)} ${n(marker.y)})`}
        >
          {marker.kind === "patch" ? (
            <path
              d={patchPath(marker)}
              fill={PATCH_FILL}
              transform={`rotate(${n(marker.rotation)})`}
            />
          ) : (
            (() => {
              const size = crossSize(marker.width);
              const d = crossStrokes(size)
                .map(([a, b]) => `M${n(a.x)} ${n(a.y)}L${n(b.x)} ${n(b.y)}`)
                .join("");
              return (
                <>
                  <path
                    d={d}
                    stroke={MARKER_HALO}
                    strokeWidth={size * 0.34}
                    fill="none"
                  />
                  <path
                    d={d}
                    stroke={MARKER_INK}
                    strokeWidth={size * 0.16}
                    fill="none"
                  />
                </>
              );
            })()
          )}
        </g>
      ))}
    </svg>
  );
}

export default MarkerLayer;

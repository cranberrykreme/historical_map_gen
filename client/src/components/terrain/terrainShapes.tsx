import React from "react";
import { TerrainFeature } from "../../types";
import { featureStrokes, svgFill, TerrainStroke } from "../../utils/terrain";

// Strokes as SVG paths, exactly as the renderer will draw them (see strokesSvg). A stroke drawn
// inside a shape (or any of several) gets a clip path, named from `idPrefix` so drawings on one
// page don't clash.
export function TerrainStrokes({
  strokes,
  idPrefix,
}: {
  strokes: TerrainStroke[];
  idPrefix: string;
}) {
  return (
    <>
      {strokes.map((s, i) => {
        const path = (
          <path
            key={i}
            d={s.d}
            fill={svgFill(s.fill)}
            fillRule={s.fillRule}
            stroke={s.stroke ?? "none"}
            strokeWidth={s.width}
            strokeLinecap={s.cap ?? "round"}
            strokeLinejoin="round"
            strokeDasharray={s.dash}
            opacity={s.opacity}
          />
        );
        if (!s.clip) return path;
        const id = `${idPrefix}${i}`;
        return (
          <g key={i}>
            <clipPath id={id}>
              {(Array.isArray(s.clip) ? s.clip : [s.clip]).map((d, j) => (
                <path key={j} d={d} clipRule={s.clipRule} />
              ))}
            </clipPath>
            <g clipPath={`url(#${id})`}>{path}</g>
          </g>
        );
      })}
    </>
  );
}

// One feature's drawing on its own (the shape being drawn), without the ways it meets others
export function FeatureDrawing({
  feature,
  opacity,
}: {
  feature: TerrainFeature;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <TerrainStrokes strokes={featureStrokes(feature)} idPrefix="draft" />
    </g>
  );
}

// A name for clip paths that's safe in a url(#...) reference
export const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

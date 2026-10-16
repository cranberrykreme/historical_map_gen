import React from "react";
import { FormationBlock } from "../types";
import {
  BLOCK_FONT,
  blockColours,
  blockFront,
  blockLabel,
  blockLineWidths,
  blockBox,
  blockOutline,
  blockSymbol,
  stepsPath,
} from "../utils/blocks";

const polyline = (points: { x: number; y: number }[]) =>
  points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${Math.round(p.x * 100) / 100} ${Math.round(p.y * 100) / 100}`
    )
    .join("");

// The parts of a block, drawn in its own space (centred on 0, 0, facing up): for use inside
// another SVG. `rotation` is how far it's turned on screen, so the label can stay upright.
export function BlockDrawing({
  block,
  rotation = 0,
  selected = false,
}: {
  block: FormationBlock;
  rotation?: number;
  selected?: boolean;
}) {
  const { fill, edge } = blockColours(block.colour);
  const widths = blockLineWidths(block);
  const symbol = blockSymbol(block);
  const label = blockLabel(block, rotation);
  const outline = stepsPath(blockOutline(block), true);
  return (
    <g>
      <path
        d={outline}
        fill={fill}
        stroke={edge}
        strokeWidth={widths.edge}
        strokeLinejoin="round"
      />
      {symbol.lines.length > 0 && (
        <path
          d={symbol.lines.map(polyline).join("")}
          fill="none"
          stroke={edge}
          strokeWidth={widths.symbol}
          strokeOpacity={0.75}
          strokeLinecap="round"
        />
      )}
      {symbol.dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={edge}
          fillOpacity={0.85}
        />
      ))}
      <path
        d={stepsPath(blockFront(block))}
        fill="none"
        stroke={edge}
        strokeWidth={widths.front}
        strokeLinecap="round"
      />
      {label && (
        <g
          transform={`translate(0 ${label.y})${label.flip ? " rotate(180)" : ""}`}
        >
          {label.lines.map((line, i) => (
            <text
              key={i}
              x={0}
              y={line.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={BLOCK_FONT}
              fontSize={line.size}
              fontWeight={line.bold ? 700 : 500}
              fill="#ffffff"
              stroke="#1a1410"
              strokeOpacity={0.75}
              strokeWidth={line.size * 0.22}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ userSelect: "none" }}
            >
              {line.text}
            </text>
          ))}
        </g>
      )}
      {selected && (
        <path
          d={outline}
          fill="none"
          stroke="#c8a84b"
          strokeWidth={2}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}

// A block as an SVG picture of its own, centred on the block, in map units (or scaled to fit
// `fit` pixels wide, for previews in the panel)
function BlockShape({
  block,
  rotation = 0,
  selected = false,
  fit,
  style,
  onMouseDown,
  children,
}: {
  block: FormationBlock;
  rotation?: number;
  selected?: boolean;
  fit?: { width: number; height: number };
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  children?: React.ReactNode; // more drawing on top, in the block's space (handles)
}) {
  const { width: w, height: h } = blockBox(block);
  const k = fit ? Math.min(fit.width / w, fit.height / h) : 1;
  return (
    <svg
      width={w * k}
      height={h * k}
      viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`}
      style={{ display: "block", overflow: "visible", ...style }}
      onMouseDown={onMouseDown}
    >
      <BlockDrawing block={block} rotation={rotation} selected={selected} />
      {children}
    </svg>
  );
}

export default BlockShape;

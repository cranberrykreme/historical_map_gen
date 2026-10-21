import React, { useEffect } from "react";
import { Battle, PathPoint, TerrainFeature } from "../../types";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import useMapScale from "../../hooks/useMapScale";
import {
  baseStrokes,
  holesPath,
  insertionIndex,
  isLine,
  minPoints,
  polylinePath,
  smoothPath,
} from "../../utils/terrain/terrain";
import { styleColour } from "../../utils/terrain/terrainStyles";
import { FeatureDrawing } from "./terrainShapes";
import styles from "../map/BattleGround.module.css";

const GOLD = "#c8a84b";

// What's drawn over the units while working on terrain: the shape being drawn, stretching to
// the mouse; the selected feature's outline and points; and the brush's circle and the stroke
// it's making.
// - Drag a point to move it, or drag the shape to move it all
// - Double-click the shape to add a point there; Alt-click a point to take it away
// - Delete removes the selected feature; Esc deselects, then stops editing
// The map pans as usual everywhere else.
function TerrainHandles({
  battle,
  mapRef,
  scaleRef,
  isDraggingUnit,
}: {
  battle: Battle;
  mapRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
}) {
  const scale = useMapScale(mapRef, scaleRef);
  const drawing = useTerrainToolStore((state) => state.drawing);
  const draft = useTerrainToolStore((state) => state.draft);
  const hover = useTerrainToolStore((state) => state.hover);
  const editing = useTerrainToolStore((state) => state.editing);
  const selectedId = useTerrainToolStore((state) => state.selectedId);
  const preview = useTerrainToolStore((state) => state.preview);
  const brush = useTerrainToolStore((state) => state.brush);
  const brushKind = useTerrainToolStore((state) => state.brushKind);
  const brushSize = useTerrainToolStore((state) => state.brushSize);
  const stroke = useTerrainToolStore((state) => state.stroke);
  const updateTerrain = useMapStore((state) => state.updateTerrain);
  const deleteTerrain = useMapStore((state) => state.deleteTerrain);

  const saved = battle.terrain?.find((f) => f.id === selectedId) ?? null;
  const selected: TerrainFeature | null = saved
    ? preview?.id === saved.id
      ? { ...saved, points: preview.points }
      : saved
    : null;

  // Delete removes the selected feature; Esc deselects, then stops editing
  useEffect(() => {
    if (!editing || drawing) return;
    const onKey = (e: KeyboardEvent) => {
      // Typing in a box isn't drawing
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select")
      )
        return;
      const tool = useTerrainToolStore.getState();
      if ((e.key === "Delete" || e.key === "Backspace") && tool.selectedId) {
        e.preventDefault();
        deleteTerrain(battle.id, tool.selectedId);
        tool.select(null);
      } else if (e.key === "Escape") {
        if (tool.selectedId) tool.select(null);
        else tool.setEditing(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, drawing, battle.id, deleteTerrain]);

  // Where the mouse is, in map units
  const toMap = (e: { clientX: number; clientY: number }): PathPoint => {
    const rect = mapRef.current?.getBoundingClientRect();
    const s = scaleRef.current ?? 1;
    return rect
      ? { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s }
      : { x: 0, y: 0 };
  };

  // Drags one point (pointIndex) or the whole shape (null). The map doesn't pan meanwhile, and
  // the drag is one undo step when it's let go.
  const startDrag = (
    e: React.MouseEvent,
    feature: TerrainFeature,
    pointIndex: number | null
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDraggingUnit.current = true;
    const start = toMap(e);
    const original = feature.points;
    let latest = original;
    const tool = useTerrainToolStore.getState();
    const onMove = (ev: MouseEvent) => {
      const at = toMap(ev);
      latest =
        pointIndex === null
          ? original.map((p) => ({
              x: p.x + at.x - start.x,
              y: p.y + at.y - start.y,
            }))
          : original.map((p, i) => (i === pointIndex ? at : p));
      tool.setPreview({ id: feature.id, points: latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      isDraggingUnit.current = false;
      if (latest !== original)
        updateTerrain(battle.id, feature.id, { points: latest });
      useTerrainToolStore.getState().setPreview(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const removePoint = (feature: TerrainFeature, index: number) => {
    if (feature.points.length <= minPoints(feature.kind)) return;
    updateTerrain(battle.id, feature.id, {
      points: feature.points.filter((_, i) => i !== index),
    });
  };

  const addPointAt = (e: React.MouseEvent, feature: TerrainFeature) => {
    const at = toMap(e);
    const index = insertionIndex(feature.points, at, !isLine(feature.kind));
    const points = [...feature.points];
    points.splice(index, 0, at);
    updateTerrain(battle.id, feature.id, { points });
  };

  if (!drawing && !(editing && selected) && !brush) return null;

  // Sizes on screen stay the same however far the map is zoomed
  const px = (n: number) => n / scale;

  // The shape being drawn: its points so far, out to the mouse
  let drawingLayer: React.ReactNode = null;
  if (drawing) {
    const points = hover ? [...draft, hover] : draft;
    const line = isLine(drawing);
    drawingLayer = (
      <g>
        {points.length >= minPoints(drawing) && (
          <FeatureDrawing
            feature={{ id: "draft", kind: drawing, points }}
            opacity={0.75}
            style={battle.style}
          />
        )}
        {points.length >= 2 && (
          <path
            d={smoothPath(points, !line && points.length >= 3)}
            fill="none"
            stroke={GOLD}
            strokeWidth={px(1.5)}
            strokeDasharray={`${px(6)} ${px(4)}`}
          />
        )}
        {draft.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={px(4)}
            fill={i === 0 ? GOLD : "#fff"}
            stroke={GOLD}
            strokeWidth={px(1.5)}
          />
        ))}
      </g>
    );
  }

  // The brush: the stroke so far (painted in the kind's colour, or pale for the eraser), and its
  // circle at the mouse. A line kind is painted as the line itself, with a small dot.
  let brushLayer: React.ReactNode = null;
  if (brush) {
    const lineBrush = brush === "paint" && isLine(brushKind);
    const colour =
      brush === "erase"
        ? "#ffffff"
        : styleColour(
            baseStrokes({ id: "brush", kind: brushKind, points: [] })[0]
              ?.fill ?? GOLD,
            battle.style
          );
    const at = hover ?? (stroke ? stroke[stroke.length - 1] : null);
    brushLayer = (
      <g>
        {stroke &&
          (lineBrush ? (
            stroke.length >= 2 && (
              <FeatureDrawing
                feature={{ id: "stroke", kind: brushKind, points: stroke }}
                opacity={0.8}
                style={battle.style}
              />
            )
          ) : (
            <path
              d={
                stroke.length === 1
                  ? `${polylinePath(stroke)}l0.01 0`
                  : polylinePath(stroke)
              }
              fill="none"
              stroke={colour.startsWith("pattern:") ? GOLD : colour}
              strokeWidth={brushSize * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={brush === "erase" ? 0.45 : 0.6}
            />
          ))}
        {at &&
          (lineBrush ? (
            <circle cx={at.x} cy={at.y} r={px(3)} fill={GOLD} />
          ) : (
            <>
              <circle
                cx={at.x}
                cy={at.y}
                r={brushSize}
                fill="none"
                stroke="#000"
                strokeOpacity={0.35}
                strokeWidth={px(3)}
              />
              <circle
                cx={at.x}
                cy={at.y}
                r={brushSize}
                fill="none"
                stroke={brush === "erase" ? "#fff" : GOLD}
                strokeWidth={px(1.5)}
                strokeDasharray={
                  brush === "erase" ? `${px(4)} ${px(3)}` : undefined
                }
              />
            </>
          ))}
      </g>
    );
  }

  let editLayer: React.ReactNode = null;
  if (!drawing && editing && selected) {
    const closed = !isLine(selected.kind);
    editLayer = (
      <g>
        {/* The shape itself takes drags (to move it) and double-clicks (to add a point) */}
        <path
          d={
            smoothPath(selected.points, closed) +
            (closed ? holesPath(selected) : "")
          }
          fill={closed ? "rgba(200, 168, 75, 0.08)" : "none"}
          fillRule="evenodd"
          stroke={GOLD}
          strokeWidth={px(closed ? 2 : 24)}
          strokeOpacity={closed ? 1 : 0.25}
          strokeDasharray={closed ? `${px(6)} ${px(4)}` : undefined}
          style={{ pointerEvents: "visiblePainted", cursor: "move" }}
          onMouseDown={(e) => startDrag(e, selected, null)}
          onDoubleClick={(e) => addPointAt(e, selected)}
        />
        {selected.points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={px(6)}
            fill="#fff"
            stroke={GOLD}
            strokeWidth={px(2)}
            style={{ pointerEvents: "all", cursor: "grab" }}
            onMouseDown={(e) => {
              if (e.altKey) {
                e.preventDefault();
                removePoint(selected, i);
              } else startDrag(e, selected, i);
            }}
          />
        ))}
      </g>
    );
  }

  return (
    <svg
      className={styles.handles}
      width={battle.width}
      height={battle.height}
      viewBox={`0 0 ${battle.width} ${battle.height}`}
    >
      {drawingLayer}
      {editLayer}
      {brushLayer}
    </svg>
  );
}

export default TerrainHandles;

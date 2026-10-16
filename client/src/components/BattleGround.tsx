import React, { useMemo, useRef } from "react";
import { Battle } from "../types";
import { useTerrainToolStore } from "../store/useTerrainToolStore";
import {
  featurePath,
  GROUND_COLOUR,
  isLine,
  LINE_WIDTH,
  sortedFeatures,
  TERRAIN_PATTERNS,
} from "../utils/terrain";
import { battleStrokes } from "../utils/terrainScene";
import { safeId, TerrainStrokes } from "./terrain/terrainShapes";
import styles from "./BattleGround.module.css";

// How far the mouse can move (in pixels) and still count as a click rather than a pan
const CLICK_SLOP = 4;

// The ground of a battle scene, drawn where the main map's picture would be: grass for a land
// battle, open water for a sea battle, and the terrain drawn on it, with the ways features
// meet (river mouths, bridges, coastlines: see terrainScene). It fills the battle's area, from
// (0, 0) in map units. While editing terrain, clicking a feature selects it (the handles to
// reshape it are drawn above the units, by TerrainHandles) and clicking open ground deselects.
function BattleGround({ battle }: { battle: Battle }) {
  const editing = useTerrainToolStore((state) => state.editing);
  const drawing = useTerrainToolStore((state) => state.drawing);
  const preview = useTerrainToolStore((state) => state.preview);
  const select = useTerrainToolStore((state) => state.select);
  const down = useRef<{ x: number; y: number } | null>(null);

  const selectable = editing && !drawing;
  // The features as they are now, with any being dragged where the drag has it
  const features = useMemo(
    () =>
      (battle.terrain ?? []).map((feature) =>
        preview && preview.id === feature.id
          ? { ...feature, points: preview.points }
          : feature
      ),
    [battle.terrain, preview]
  );
  const strokes = useMemo(
    () => battleStrokes(features, battle.kind, battle.width, battle.height),
    [features, battle.kind, battle.width, battle.height]
  );

  const isClick = (e: React.MouseEvent) =>
    !!down.current &&
    Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) <=
      CLICK_SLOP;

  return (
    <svg
      className={styles.ground}
      width={battle.width}
      height={battle.height}
      viewBox={`0 0 ${battle.width} ${battle.height}`}
      onMouseDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <defs dangerouslySetInnerHTML={{ __html: TERRAIN_PATTERNS }} />
      <rect
        width={battle.width}
        height={battle.height}
        fill={GROUND_COLOUR[battle.kind]}
        style={{ pointerEvents: selectable ? "fill" : "none" }}
        onClick={(e) => {
          if (selectable && isClick(e)) select(null);
        }}
      />
      <g style={{ pointerEvents: "none" }}>
        <TerrainStrokes
          strokes={strokes}
          idPrefix={`bg${safeId(battle.id)}-`}
        />
      </g>
      {/* What takes the clicks: each feature's shape, invisible, the topmost on top (clicks in
          an area's hole go through it). Lines get a wide edge, as they're thin. */}
      {selectable &&
        sortedFeatures(features).map((feature) => {
          const line = isLine(feature.kind);
          return (
            <path
              key={feature.id}
              d={featurePath(feature)}
              fill="transparent"
              fillRule="evenodd"
              stroke="transparent"
              strokeWidth={
                line ? Math.max(30, LINE_WIDTH[feature.kind] ?? 0) : 0
              }
              style={{
                pointerEvents: line ? "stroke" : "fill",
                cursor: "pointer",
              }}
              onClick={(e) => {
                if (isClick(e)) select(feature.id);
              }}
            />
          );
        })}
    </svg>
  );
}

export default BattleGround;

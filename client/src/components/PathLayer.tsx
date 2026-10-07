import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../store/useMapStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { isPastStart, useTimelineStore } from "../store/useTimelineStore";
import {
  chevronsAlong,
  nearestOnPath,
  svgPathData,
} from "../utils/pathGeometry";
import { MapPath, PathPoint } from "../types";
import { chainedPathIds } from "../utils/timeline";
import { pathShownAt } from "../utils/historyEdit";

interface PathLayerProps {
  // "lines" sits under the units and can be clicked; "markers" sits above them
  mode: "lines" | "markers";
  scaleRef: React.RefObject<number>;
  positionRef: React.RefObject<{ x: number; y: number }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDraggingUnit: React.RefObject<boolean>;
}

const LINE = "#e8e0d0";
const SELECTED = "#c8a84b";
const ACTIVE_FILL = "#fff3c4";
const DARK = "#1a1225";
const OUTLINE = "rgba(26, 18, 37, 0.6)";
const START_COLOUR = "#5fbf6a";
const END_COLOUR = "#e05a5a";
const CLICK_TOLERANCE_PX = 4; // moving further than this is a pan or a drag, not a click
const CHEVRON_SPACING_PX = 90;
const CHEVRON = "M -5 -5 L 3 0 L -5 5";

// Colours go in inline styles, not SVG attributes: an inline style beats any stylesheet
// rule, whereas an attribute loses to every one of them
const SVG_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: 1,
  height: 1,
  overflow: "visible",
  pointerEvents: "none",
};

function PathLayer({
  mode,
  scaleRef,
  positionRef,
  containerRef,
  isDraggingUnit,
}: PathLayerProps) {
  const allPaths = useMapStore((state) => state.paths);
  const chainedIds = useMemo(() => chainedPathIds(allPaths), [allPaths]);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const attachSelectedUnitsToPath = useMapStore(
    (state) => state.attachSelectedUnitsToPath
  );
  const storyStart = useMapStore((state) => state.storyStart);
  const now = useTimelineStore((state) => state.now);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const drawingPoints = usePathToolStore((state) => state.drawingPoints);
  const draftPath = usePathToolStore((state) => state.draftPath);
  const selectedWaypoint = usePathToolStore((state) => state.selectedWaypoint);
  const selectWaypoint = usePathToolStore((state) => state.selectWaypoint);
  const setDraftPath = usePathToolStore((state) => state.setDraftPath);
  const commitDraftPath = usePathToolStore((state) => state.commitDraftPath);
  const insertWaypoint = usePathToolStore((state) => state.insertWaypoint);
  const preview = usePathToolStore((state) => state.preview);
  const [scale, setScale] = useState<number>(1);
  const mouseDownAt = useRef<{ x: number; y: number } | null>(null);

  // Which paths are on the map right now. At the story's start (or while previewing one path
  // on its own) every path shows, so they can all be edited. Past the start, a march's path
  // shows only while the march is under way; a bar being dragged uses its draft dates.
  const shownAt = !preview && isPastStart(now, storyStart) ? now : null;
  const paths = useMemo(
    () =>
      allPaths.filter((path) =>
        pathShownAt(
          draftTiming && draftTiming.pathId === path.id
            ? draftTiming.timing
            : path.march,
          shownAt
        )
      ),
    [allPaths, draftTiming, shownAt]
  );

  // The map's zoom lives in a ref (so zooming never re-renders the whole map).
  // Only this layer watches it, so lines and dots keep a constant on-screen size.
  const active = allPaths.length > 0 || drawingPoints !== null;
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      setScale(scaleRef.current); // React skips the render when the value is unchanged
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, scaleRef]);

  const px = (screenPixels: number) => screenPixels / scale;

  // A path mid-drag is drawn from its draft points
  const pointsFor = (path: MapPath): PathPoint[] =>
    draftPath && draftPath.id === path.id ? draftPath.points : path.points;

  const toMapPoint = (clientX: number, clientY: number): PathPoint | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (clientX - rect.left - positionRef.current.x) / scaleRef.current,
      y: (clientY - rect.top - positionRef.current.y) / scaleRef.current,
    };
  };

  const handleLineClick = (e: React.MouseEvent, path: MapPath) => {
    e.stopPropagation();
    const start = mouseDownAt.current;
    mouseDownAt.current = null;
    if (
      start &&
      Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_TOLERANCE_PX
    ) {
      return; // that was a pan
    }

    // With units selected, clicking a path attaches them, unless they are all attached already
    const { selectedUnitIds } = useMapStore.getState();
    const allAttached = Array.from(selectedUnitIds).every((id) =>
      path.assignments.some((a) => a.unitId === id)
    );
    if (selectedUnitIds.size > 0 && !allAttached) {
      attachSelectedUnitsToPath(path.id);
      return;
    }

    // First click selects the path; a click on the selected path adds a waypoint
    if (path.id !== selectedPathId) {
      selectPath(path.id);
      return;
    }
    const target = toMapPoint(e.clientX, e.clientY);
    if (!target) return;
    const nearest = nearestOnPath(path.points, target);
    if (!nearest) return;
    const onExistingWaypoint = path.points.some(
      (p) => Math.hypot(p.x - nearest.point.x, p.y - nearest.point.y) < px(6)
    );
    if (onExistingWaypoint) return;
    insertWaypoint(path.id, nearest.segmentIndex, nearest.point);
  };

  const startWaypointDrag = (
    e: React.MouseEvent,
    path: MapPath,
    index: number
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectWaypoint(path.id, index);

    isDraggingUnit.current = true; // stops the map from panning under the drag
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = path.points;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      if (
        !moved &&
        Math.hypot(ev.clientX - startX, ev.clientY - startY) <
          CLICK_TOLERANCE_PX
      ) {
        return;
      }
      moved = true;
      const dx = (ev.clientX - startX) / scaleRef.current;
      const dy = (ev.clientY - startY) / scaleRef.current;
      setDraftPath({
        id: path.id,
        points: origin.map((p, i) =>
          i === index ? { x: p.x + dx, y: p.y + dy } : p
        ),
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      isDraggingUnit.current = false;
      commitDraftPath();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // A ring marks where a path starts (green) or ends (red), with a dark halo for contrast
  const ring = (key: string, point: PathPoint, colour: string) => (
    <g key={key} style={{ pointerEvents: "none" }}>
      <circle
        cx={point.x}
        cy={point.y}
        r={px(11)}
        style={{ fill: "none", stroke: OUTLINE, strokeWidth: px(6) }}
      />
      <circle
        cx={point.x}
        cy={point.y}
        r={px(11)}
        style={{ fill: "none", stroke: colour, strokeWidth: px(3) }}
      />
    </g>
  );

  if (mode === "lines") {
    return (
      <svg style={SVG_STYLE}>
        {paths.map((path) => {
          const points = pointsFor(path);
          const d = svgPathData(points);
          const isSelected = path.id === selectedPathId;
          const chevronColour = isSelected ? SELECTED : LINE;
          return (
            <g key={path.id}>
              {/* Wide invisible stroke so the line is easy to click */}
              <path
                d={d}
                style={{
                  fill: "none",
                  stroke: "rgba(0, 0, 0, 0)",
                  strokeWidth: px(16),
                  pointerEvents: "stroke",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // stops the map deselecting your units on this click
                  mouseDownAt.current = { x: e.clientX, y: e.clientY };
                }}
                onClick={(e) => handleLineClick(e, path)}
              />
              <path
                d={d}
                style={{
                  fill: "none",
                  stroke: OUTLINE,
                  strokeWidth: px(isSelected ? 7 : 5),
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  pointerEvents: "none",
                }}
              />
              <path
                d={d}
                style={{
                  fill: "none",
                  stroke: isSelected ? SELECTED : LINE,
                  strokeWidth: px(isSelected ? 4 : 3),
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  pointerEvents: "none",
                }}
              />

              {/* Direction chevrons, a constant size on screen */}
              {chevronsAlong(points, px(CHEVRON_SPACING_PX)).map(
                (chevron, index) => (
                  <g
                    key={index}
                    transform={`translate(${chevron.x} ${chevron.y}) rotate(${
                      (chevron.heading * 180) / Math.PI
                    }) scale(${1 / scale})`}
                    style={{ pointerEvents: "none" }}
                  >
                    <path
                      d={CHEVRON}
                      style={{
                        fill: "none",
                        stroke: OUTLINE,
                        strokeWidth: 5,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      }}
                    />
                    <path
                      d={CHEVRON}
                      style={{
                        fill: "none",
                        stroke: chevronColour,
                        strokeWidth: 2.5,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      }}
                    />
                  </g>
                )
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Only a path that is on the map shows its waypoints
  const selectedPath = paths.find((path) => path.id === selectedPathId);

  return (
    <svg style={{ ...SVG_STYLE, zIndex: 2000 }}>
      {/* Start (green) and end (red) rings on every path */}
      {paths.map((path) => {
        const points = pointsFor(path);
        if (points.length < 2) return null;
        return (
          <g key={`ends-${path.id}`}>
            {ring("start", points[0], START_COLOUR)}
            {ring("end", points[points.length - 1], END_COLOUR)}
          </g>
        );
      })}

      {selectedPath &&
        drawingPoints === null &&
        pointsFor(selectedPath).map((point, index) => {
          const isActive =
            selectedWaypoint !== null &&
            selectedWaypoint.pathId === selectedPath.id &&
            selectedWaypoint.index === index;
          return (
            <g key={index}>
              {/* Larger invisible circle: an easy target to grab. A chained movement's start
                  can't be moved: it always sits where its units arrive. */}
              {!(index === 0 && chainedIds.has(selectedPath.id)) && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={px(13)}
                  style={{
                    fill: "rgba(0, 0, 0, 0)",
                    pointerEvents: "all",
                    cursor: "move",
                  }}
                  onMouseDown={(e) => startWaypointDrag(e, selectedPath, index)}
                />
              )}
              <circle
                cx={point.x}
                cy={point.y}
                r={px(isActive ? 8 : 6)}
                style={{
                  fill: isActive ? ACTIVE_FILL : SELECTED,
                  stroke: isActive ? SELECTED : DARK,
                  strokeWidth: px(2),
                  pointerEvents: "none",
                }}
              />
            </g>
          );
        })}

      {/* The path currently being drawn */}
      {drawingPoints && (
        <g>
          {drawingPoints.length >= 2 && (
            <path
              d={svgPathData(drawingPoints)}
              style={{
                fill: "none",
                stroke: SELECTED,
                strokeWidth: px(3),
                strokeDasharray: `${px(10)} ${px(8)}`,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                pointerEvents: "none",
              }}
            />
          )}
          {drawingPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={px(6)}
              style={{
                fill: SELECTED,
                stroke: DARK,
                strokeWidth: px(2),
                pointerEvents: "none",
              }}
            />
          ))}
          {drawingPoints.length > 0 &&
            ring("draw-start", drawingPoints[0], START_COLOUR)}
        </g>
      )}
    </svg>
  );
}

export default PathLayer;

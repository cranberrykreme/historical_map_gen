import React, { useEffect, useMemo, useRef, useState } from "react";
import useMapFetch from "../hooks/useMapFetch";
import useMapInteraction from "../hooks/useMapInteraction";
import useSelectionBox from "../hooks/useSelectionBox";
import useAssetDrop from "../hooks/useAssetDrop";
import UnitLayer from "./UnitLayer";
import PathLayer from "./PathLayer";
import PathDrawOverlay from "./PathDrawOverlay";
import FrameOverlay from "./FrameOverlay";
import BattleGround from "./BattleGround";
import SceneBadge from "./SceneBadge";
import TerrainHandles from "./terrain/TerrainHandles";
import TerrainDrawOverlay from "./terrain/TerrainDrawOverlay";
import TerrainBrushOverlay from "./terrain/TerrainBrushOverlay";
import TerrainHint from "./terrain/TerrainHint";
import BlockPlaceOverlay from "./blocks/BlockPlaceOverlay";
import useCamera from "../hooks/useCamera";
import useVideoCamera from "../hooks/useVideoCamera";
import useFullscreenKeys from "../hooks/useFullscreenKeys";
import API_BASE_URL from "../config/api";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { useTerrainToolStore } from "../store/useTerrainToolStore";
import { useBlockToolStore } from "../store/useBlockToolStore";
import { ViewportApi } from "../types";
import {
  currentMoment,
  isPastStart,
  useTimelineStore,
} from "../store/useTimelineStore";
import { existsAt, getTimeline } from "../utils/timeline";
import { editableAt } from "../utils/lifespans";
import { videoDarkness } from "../utils/camera";
import { fitBox } from "../utils/scenes";

function MapCanvas({
  viewportApiRef,
}: {
  viewportApiRef: React.RefObject<ViewportApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingUnit = useRef<boolean>(false);
  const [isShiftHeld, setIsShiftHeld] = useState<boolean>(false);
  const [activeCursor, setActiveCursor] = useState<string>("grab");

  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const svgContent = useMapFetch(
    selectedMapFilename && currentProjectName
      ? `${API_BASE_URL}/api/projects/${currentProjectName}/map?filename=${selectedMapFilename}`
      : null
  );
  const boxSelect = useMapStore((state) => state.boxSelect);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const dragPosition = useMapStore((state) => state.dragPosition);
  const dragRotation = useMapStore((state) => state.dragRotation);
  const dragScale = useMapStore((state) => state.dragScale);
  const groupDragDelta = useMapStore((state) => state.groupDragDelta);
  const groupRotateDelta = useMapStore((state) => state.groupRotateDelta);
  const groupScaleDelta = useMapStore((state) => state.groupScaleDelta);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const addUnitAtPosition = useMapStore((state) => state.addUnitAtPosition);
  const isDrawingPath = usePathToolStore(
    (state) => state.drawingPoints !== null
  );
  const paths = useMapStore((state) => state.paths);
  const preview = usePathToolStore((state) => state.preview);
  const storyStart = useMapStore((state) => state.storyStart);
  const now = useTimelineStore((state) => state.now);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoFrame = useMapStore((state) => state.videoFrame);
  const shots = useMapStore((state) => state.shots);
  const videoTime = useTimelineStore((state) => state.videoTime);
  const activeSceneId = useMapStore((state) => state.activeSceneId);
  // The battle being edited, if it's a battle rather than the main map
  const battle = useMapStore(
    (state) => state.battles.find((b) => b.id === state.activeSceneId) ?? null
  );
  const inBattle = battle !== null;
  const drawingTerrain = useTerrainToolStore((state) => state.drawing !== null);
  const brushing = useTerrainToolStore((state) => state.brush !== null);
  const placingBlock = useBlockToolStore((state) => state.placing);

  // Everything about the paths (sampling, pivots, who is where when) is worked out once per
  // change, and each frame just looks it up
  const timeline = useMemo(
    () => getTimeline(paths, placedUnits),
    [paths, placedUnits]
  );

  // While previewing a path on its own, its attached units are shown along it (display only)
  const playback = preview
    ? (timeline.playbacks.get(preview.pathId)?.stateAt(preview.progress) ??
      null)
    : null;

  // Otherwise, once the playhead is past the story's start, the timeline drives the units:
  // each follows the march that most recently started for it, and stays where it was placed
  // until then. A path preview wins over it.
  const timelineActive = !preview && isPastStart(now, storyStart);
  const timelineStates =
    timelineActive && now !== null
      ? timeline.stateAt(
          now,
          draftTiming
            ? new Map([[draftTiming.pathId, draftTiming.timing]])
            : undefined
        )
      : null;

  // Only the units that exist at the playhead's moment are shown. A unit with no dates is
  // there for the whole story.
  const moment = currentMoment(now, storyStart);

  // Each unit is edited at its own moment: the story's start, or when it appears. Anywhere
  // else it is locked, because the map shows it where history has taken it. While previewing
  // one path, units are only locked if they don't exist from the start.
  const lockedIds = useMemo(
    () =>
      new Set(
        placedUnits
          .filter((unit) => !editableAt(unit, preview ? null : now, storyStart))
          .map((unit) => unit.id)
      ),
    [placedUnits, preview, now, storyStart]
  );

  const displayUnits = placedUnits
    .filter((unit) => existsAt(unit, moment))
    .map((unit) => {
      let display = { ...unit };
      const onPath = playback?.get(unit.id) ?? timelineStates?.get(unit.id);
      if (onPath) {
        display.x = onPath.x;
        display.y = onPath.y;
        display.rotation = onPath.rotation;
        display.flipped = onPath.flipped;
      }
      if (dragPosition && dragPosition.id === unit.id) {
        display.x = dragPosition.x;
        display.y = dragPosition.y;
      }
      if (dragRotation && dragRotation.id === unit.id) {
        display.rotation = dragRotation.rotation;
      }
      if (dragScale && dragScale.id === unit.id) {
        display.scale = dragScale.scale;
      }
      if (groupDragDelta && selectedUnitIds.has(unit.id)) {
        display.x = unit.x + groupDragDelta.dx;
        display.y = unit.y + groupDragDelta.dy;
      }
      if (groupRotateDelta !== null && selectedUnitIds.has(unit.id)) {
        display.rotation = unit.rotation + groupRotateDelta;
      }
      if (groupScaleDelta !== null && selectedUnitIds.has(unit.id)) {
        display.scale = Math.min(
          Math.max(unit.scale + groupScaleDelta, 0.1),
          5
        );
      }
      return display;
    });

  // The map is placed in a shadow root so the styles inside the SVG file can't leak out
  // and restyle the rest of the app (path lines, portrait editor, ...)
  useEffect(() => {
    const host = svgRef.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    // A battle shows its own ground instead of the map
    root.innerHTML = inBattle ? "" : (svgContent ?? "");
  }, [svgContent, inBattle]);

  // Each scene keeps its own view while you move between them: leaving a scene remembers
  // where the map was, and coming back puts it there again. A battle opened for the first
  // time is fitted into the space above the timeline.
  const sceneViews = useRef(
    new Map<string, { x: number; y: number; scale: number }>()
  );
  const lastScene = useRef(activeSceneId);
  useEffect(() => {
    const previous = lastScene.current;
    if (previous === activeSceneId) return;
    lastScene.current = activeSceneId;
    // Terrain and block tools belong to the scene they were used in
    useTerrainToolStore.getState().reset();
    useBlockToolStore.getState().stopPlacing();
    sceneViews.current.set(previous, {
      ...positionRef.current,
      scale: scaleRef.current,
    });
    const container = containerRef.current;
    let place = sceneViews.current.get(activeSceneId) ?? null;
    if (!place && battle && container && container.clientWidth > 0) {
      const top = useTimelineStore.getState().timelineTop;
      const room =
        top === null
          ? container.clientHeight
          : Math.min(
              container.clientHeight,
              top - container.getBoundingClientRect().top
            );
      place = fitBox(
        { x: 0, y: 0, width: battle.width, height: battle.height },
        container.clientWidth,
        Math.max(room, 100)
      );
    }
    if (!place) return;
    positionRef.current = { x: place.x, y: place.y };
    scaleRef.current = place.scale;
    if (mapRef.current) {
      mapRef.current.style.transform = `translate(${place.x}px, ${place.y}px) scale(${place.scale})`;
    }
  }, [activeSceneId, battle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftHeld(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Leaving the project (or switching projects) abandons any path being drawn
  useEffect(() => {
    return () => usePathToolStore.getState().cancelDrawing();
  }, []);

  // ⇧F for full screen that keeps Esc for the editor
  useFullscreenKeys();

  useMapInteraction(
    containerRef,
    mapRef,
    true,
    scaleRef,
    isDraggingUnit,
    positionRef
  );

  // Lets ProjectView read the current view (for saving) and apply a saved one (on load)
  useEffect(() => {
    const api: ViewportApi = {
      get: () => {
        const container = containerRef.current;
        if (!container || container.clientWidth === 0) return null;
        const scale = scaleRef.current;
        return {
          centerX: (container.clientWidth / 2 - positionRef.current.x) / scale,
          centerY: (container.clientHeight / 2 - positionRef.current.y) / scale,
          scale,
        };
      },
      apply: (viewport) => {
        const container = containerRef.current;
        if (!container || container.clientWidth === 0) return;
        const x = container.clientWidth / 2 - viewport.centerX * viewport.scale;
        const y =
          container.clientHeight / 2 - viewport.centerY * viewport.scale;
        positionRef.current = { x, y };
        scaleRef.current = viewport.scale;
        if (mapRef.current) {
          mapRef.current.style.transform = `translate(${x}px, ${y}px) scale(${viewport.scale})`;
        }
      },
    };
    viewportApiRef.current = api;
    return () => {
      if (viewportApiRef.current === api) viewportApiRef.current = null;
    };
  }, [viewportApiRef]);

  // The video frame is only drawn in video mode, where the camera moves the map and fades
  // darken it. It is still measured in history mode, so Go can move the map to a shot's views.
  const frame = useCamera(containerRef, mapRef, svgRef, positionRef, scaleRef);
  useVideoCamera(frame);
  const darkness = inVideo ? videoDarkness(shots, videoTime) : 0;

  const { startSelection, boxStyle } = useSelectionBox({
    containerRef,
    scaleRef,
    positionRef,
    displayUnits,
    boxSelect,
  });

  const { handleDragOver, handleDrop } = useAssetDrop({
    containerRef,
    scaleRef,
    positionRef,
    addUnitAtPosition,
  });

  const setCursor = (cursor: string) => {
    setActiveCursor(cursor);
    if (containerRef.current) {
      containerRef.current.style.cursor = cursor;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-unit]")) return;

    if (e.shiftKey && !isDrawingPath) {
      startSelection(e);
    } else {
      selectUnit(null);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isShiftHeld ? "default" : activeCursor,
        background:
          selectedMapFilename && !inBattle ? "transparent" : "#3a3a3a",
      }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(activeCursor === "alias" || activeCursor === "nwse-resize") && (
        <style>{`div, img { cursor: ${activeCursor} !important; }`}</style>
      )}
      {selectedMapFilename && !svgContent && !inBattle && <p>Loading map...</p>}
      <div
        ref={mapRef}
        style={{ transformOrigin: "0 0", willChange: "transform" }}
      >
        {battle && <BattleGround battle={battle} />}
        <div ref={svgRef} />
        <PathLayer
          mode="lines"
          scaleRef={scaleRef}
          positionRef={positionRef}
          containerRef={containerRef}
          isDraggingUnit={isDraggingUnit}
        />
        <UnitLayer
          units={displayUnits}
          scaleRef={scaleRef}
          isDraggingUnit={isDraggingUnit}
          isShiftHeld={isShiftHeld}
          setCursor={setCursor}
          lockedIds={lockedIds}
        />
        <PathLayer
          mode="markers"
          scaleRef={scaleRef}
          positionRef={positionRef}
          containerRef={containerRef}
          isDraggingUnit={isDraggingUnit}
        />
        {battle && (
          <TerrainHandles
            battle={battle}
            mapRef={mapRef}
            scaleRef={scaleRef}
            isDraggingUnit={isDraggingUnit}
          />
        )}
      </div>
      {frame && inVideo && (
        <FrameOverlay frame={frame} shape={videoFrame} darkness={darkness} />
      )}
      <SceneBadge />
      {battle && drawingTerrain && (
        <TerrainDrawOverlay
          battle={battle}
          mapRef={mapRef}
          scaleRef={scaleRef}
        />
      )}
      {battle && brushing && (
        <TerrainBrushOverlay
          battle={battle}
          mapRef={mapRef}
          scaleRef={scaleRef}
          isDraggingUnit={isDraggingUnit}
        />
      )}
      {battle && <TerrainHint battleId={battle.id} />}
      {placingBlock && !drawingTerrain && !brushing && (
        <BlockPlaceOverlay mapRef={mapRef} scaleRef={scaleRef} />
      )}
      {isDrawingPath && (
        <PathDrawOverlay
          containerRef={containerRef}
          scaleRef={scaleRef}
          positionRef={positionRef}
        />
      )}
      {boxStyle && (
        <div
          style={{
            position: "absolute",
            left: boxStyle.left,
            top: boxStyle.top,
            width: boxStyle.width,
            height: boxStyle.height,
            border: "1px dashed #c8a84b",
            background: "rgba(200, 168, 75, 0.1)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default MapCanvas;

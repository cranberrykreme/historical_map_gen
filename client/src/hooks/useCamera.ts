import React, { useCallback, useEffect, useState } from "react";
import { CameraApi, useCameraStore } from "../store/useCameraStore";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { CameraView, SavedViewport } from "../types";
import {
  FrameRect,
  frameRect,
  frameRoom,
  placementFor,
  viewOnScreen,
} from "../utils/camera";

// The video frame on the map, and the camera that reads and moves the map through it. The
// frame is the biggest of the video's shape that fits above the timeline. Returns the frame
// in pixels from the map area's top left corner, or null before the map is laid out.
function useCamera(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapRef: React.RefObject<HTMLDivElement | null>,
  svgRef: React.RefObject<HTMLDivElement | null>,
  positionRef: React.RefObject<{ x: number; y: number }>,
  scaleRef: React.RefObject<number>
): FrameRect | null {
  const videoFrame = useMapStore((state) => state.videoFrame);
  const timelineTop = useTimelineStore((state) => state.timelineTop);
  const [frame, setFrame] = useState<FrameRect | null>(null);

  // The frame as things are laid out right now
  const measure = useCallback((): FrameRect | null => {
    const container = containerRef.current;
    if (!container || container.clientWidth === 0) return null;
    const box = container.getBoundingClientRect();
    const top = useTimelineStore.getState().timelineTop;
    const room = frameRoom(
      container.clientWidth,
      container.clientHeight,
      top === null ? null : top - box.top
    );
    return frameRect(room, useMapStore.getState().videoFrame);
  }, [containerRef]);

  // Tell the rest of the app where the frame is on the screen (the date sits in its corner)
  const publishOnScreen = useCallback(
    (frame: FrameRect | null) => {
      const container = containerRef.current;
      const { frameOnScreen, setFrameOnScreen } = useCameraStore.getState();
      if (!frame || !container) {
        if (frameOnScreen) setFrameOnScreen(null);
        return;
      }
      const box = container.getBoundingClientRect();
      const next = {
        left: box.left + frame.left,
        top: box.top + frame.top,
        width: frame.width,
        height: frame.height,
      };
      if (
        !frameOnScreen ||
        frameOnScreen.left !== next.left ||
        frameOnScreen.top !== next.top ||
        frameOnScreen.width !== next.width ||
        frameOnScreen.height !== next.height
      )
        setFrameOnScreen(next);
    },
    [containerRef]
  );

  // Follow the map area's size, the timeline's height and the video's shape. Measuring waits
  // for the next frame: changing the layout from inside a ResizeObserver callback makes the
  // browser report a "ResizeObserver loop" error.
  useEffect(() => {
    let pending = 0;
    const measureNow = () => {
      const next = measure();
      publishOnScreen(next);
      setFrame((current) =>
        current &&
        next &&
        current.left === next.left &&
        current.top === next.top &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next
      );
    };
    const update = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(measureNow);
    };
    measureNow();
    window.addEventListener("resize", update);
    const container = containerRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(update)
        : null;
    if (observer && container) observer.observe(container);
    return () => {
      cancelAnimationFrame(pending);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [measure, publishOnScreen, containerRef, videoFrame, timelineTop]);

  // Leaving the map takes the frame off the screen
  useEffect(() => {
    return () => useCameraStore.getState().setFrameOnScreen(null);
  }, []);

  // Let the shot editor (and, when playing, the video) read and set what the frame shows
  useEffect(() => {
    const api: CameraApi = {
      viewNow: () => {
        const now = measure();
        if (!now) return null;
        const { x, y } = positionRef.current;
        return viewOnScreen({ x, y, scale: scaleRef.current ?? 1 }, now);
      },
      show: (view: CameraView) => {
        const now = measure();
        if (!now) return;
        const { x, y, scale } = placementFor(view, now);
        positionRef.current = { x, y };
        scaleRef.current = scale;
        if (mapRef.current) {
          mapRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
      },
      // A saved view puts its centre at the middle of the whole map area (see MapCanvas)
      fromSaved: (viewport: SavedViewport) => {
        const container = containerRef.current;
        const now = measure();
        if (!container || !now) return null;
        const { centerX, centerY, scale } = viewport;
        return viewOnScreen(
          {
            x: container.clientWidth / 2 - centerX * scale,
            y: container.clientHeight / 2 - centerY * scale,
            scale,
          },
          now
        );
      },
      // Measured from the drawing as it is on screen: wherever the map lays it out, at whatever
      // size, the renderer puts it in the same place
      mapBox: () => {
        const svg = svgRef.current?.shadowRoot?.querySelector("svg");
        const map = mapRef.current;
        if (!svg || !map) return null;
        const scale = scaleRef.current ?? 1;
        const drawing = svg.getBoundingClientRect();
        const origin = map.getBoundingClientRect();
        if (drawing.width === 0 || drawing.height === 0) return null;
        return {
          x: (drawing.left - origin.left) / scale,
          y: (drawing.top - origin.top) / scale,
          width: drawing.width / scale,
          height: drawing.height / scale,
        };
      },
    };
    useCameraStore.getState().setApi(api);
    return () => {
      if (useCameraStore.getState().api === api)
        useCameraStore.getState().setApi(null);
    };
  }, [measure, containerRef, mapRef, svgRef, positionRef, scaleRef]);

  return frame;
}

export default useCamera;

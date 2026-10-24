import React, { useEffect, useLayoutEffect, useRef } from "react";
import { drawMapLayer, FrameAssets } from "../../render/drawFrame";
import { DrawUnit } from "../../render/scene";
import { DrawMarker } from "../../utils/units/exits";
import {
  MapPlace,
  mapPlaceOf,
  watchMapPlace,
} from "../../utils/video/mapTransform";

interface SceneCanvasProps {
  // The element the map's pan and zoom are set on (this canvas sits inside it), and the area
  // the map is seen through
  mapRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  markers: DrawMarker[];
  units: DrawUnit[]; // bottom to top
  images: FrameAssets["unitImages"];
}

// The units, their deaths and the markers where they fell, drawn on one canvas by the same
// code that draws the video's frames (render/drawFrame), so the editor shows exactly what the
// video will. The canvas covers the map area at the screen's own sharpness: it sits inside the
// map's moving layer, between the march lines and the editing handles, and undoes that layer's
// pan and zoom on itself, drawing everything at the map's zoom instead. It redraws whenever
// the map moves, in the same moment.
function SceneCanvas({
  mapRef,
  containerRef,
  markers,
  units,
  images,
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ markers, units, images });
  latest.current = { markers, units, images };

  const drawRef = useRef<(place?: MapPlace) => void>(() => {});
  drawRef.current = (place?: MapPlace) => {
    const canvas = canvasRef.current;
    const map = mapRef.current;
    const container = containerRef.current;
    if (!canvas || !map || !container) return;
    const { x, y, scale } = place ?? mapPlaceOf(map);
    const width = container.clientWidth;
    const height = container.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    const pixelsWide = Math.max(Math.round(width * ratio), 1);
    const pixelsHigh = Math.max(Math.round(height * ratio), 1);
    if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
    if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // Undo the map layer's own move, so the canvas stays put over the map area
    canvas.style.transform = `scale(${1 / scale}) translate(${-x}px, ${-y}px)`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * x, ratio * y);
    const { markers, units, images } = latest.current;
    drawMapLayer(
      ctx,
      markers,
      units,
      { map: null, unitImages: images },
      1 / (scale * ratio),
      // the part of the map in view, in map units
      {
        x: -x / scale,
        y: -y / scale,
        width: width / scale,
        height: height / scale,
      }
    );
  };

  // Draw again whenever what's on the map changes
  useLayoutEffect(() => {
    drawRef.current();
  }, [markers, units, images]);

  // ...whenever the map pans or zooms, the map area changes size, or the fonts the blocks'
  // names use arrive
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const stopWatching = watchMapPlace(map, (place) => drawRef.current(place));
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => drawRef.current());
      observer.observe(container);
    }
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const redraw = () => drawRef.current();
    fonts?.addEventListener?.("loadingdone", redraw);
    // The first draw: the map's layers only have their elements once everything is in place
    redraw();
    return () => {
      stopWatching();
      observer?.disconnect();
      fonts?.removeEventListener?.("loadingdone", redraw);
    };
  }, [mapRef, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformOrigin: "0 0",
        pointerEvents: "none",
      }}
    />
  );
}

export default SceneCanvas;

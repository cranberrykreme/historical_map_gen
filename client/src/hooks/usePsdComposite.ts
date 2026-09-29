import { useCallback, useEffect, useRef, useState } from "react";
import { PsdLayer, RecolourSpec } from "../types";
import { recolourImageData } from "../utils/recolour";

interface UsePsdCompositeParams {
  layerBaseUrl: string;
  layers: PsdLayer[];
  edits: Record<string, RecolourSpec>;
  enabled: boolean;
}

function usePsdComposite({
  layerBaseUrl,
  layers,
  edits,
  enabled,
}: UsePsdCompositeParams) {
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Map<string, ImageData>>(new Map());
  const [loaded, setLoaded] = useState<number>(0);

  // Load every layer's pixel data once per PSD
  useEffect(() => {
    dataRef.current = new Map();
    setLoaded(0);
    if (layers.length === 0) return;

    let cancelled = false;
    layers.forEach((layer) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        const temp = document.createElement("canvas");
        temp.width = img.naturalWidth;
        temp.height = img.naturalHeight;
        const ctx = temp.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            dataRef.current.set(
              layer.filename,
              ctx.getImageData(0, 0, temp.width, temp.height)
            );
          } catch (error) {
            console.error("Failed to read layer pixels:", error);
          }
        }
        setLoaded((count) => count + 1);
      };
      img.onerror = () => {
        if (cancelled) return;
        console.error("Failed to load layer:", layer.filename);
        setLoaded((count) => count + 1);
      };
      img.src = `${layerBaseUrl}/${layer.filename}`;
    });

    return () => {
      cancelled = true;
    };
  }, [layerBaseUrl, layers]);

  const ready = layers.length > 0 && loaded >= layers.length;

  // Draws the full recoloured stack onto any canvas
  const drawStack = useCallback(
    (canvas: HTMLCanvasElement): boolean => {
      const ordered = [...layers].sort((a, b) => a.index - b.index);
      const reference = ordered
        .map((l) => dataRef.current.get(l.filename))
        .find(Boolean);
      if (!reference) return false;

      canvas.width = reference.width;
      canvas.height = reference.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const offscreen = document.createElement("canvas");
      offscreen.width = reference.width;
      offscreen.height = reference.height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return false;

      ordered.forEach((layer) => {
        const data = dataRef.current.get(layer.filename);
        if (!data) return;
        const spec = edits[layer.filename];
        const pixels = spec
          ? recolourImageData(
              data,
              spec.interior,
              spec.border,
              spec.fill,
              spec.stroke
            )
          : data;
        offCtx.putImageData(pixels, 0, 0);
        ctx.drawImage(offscreen, 0, 0);
      });
      return true;
    },
    [layers, edits]
  );

  // Redraw the visible composite whenever the edits change
  useEffect(() => {
    if (!enabled || !ready) return;
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    drawStack(canvas);
  }, [enabled, ready, drawStack]);

  // Render the composite to a PNG on demand, whichever view is showing
  const renderToBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!ready) {
        resolve(null);
        return;
      }
      const canvas = document.createElement("canvas");
      if (!drawStack(canvas)) {
        resolve(null);
        return;
      }
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [ready, drawStack]);

  return { compositeCanvasRef, ready, renderToBlob };
}

export default usePsdComposite;

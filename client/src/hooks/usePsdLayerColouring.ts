import { useRef, useState, useCallback } from "react";
import { RgbColor } from "../types";
import { recolourImageData } from "../utils/recolour";

function usePsdLayerColouring() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<ImageData | null>(null);
  const loadIdRef = useRef<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const loadImageToCanvas = useCallback((imageUrl: string) => {
    const loadId = ++loadIdRef.current;
    setImageLoaded(false);
    originalRef.current = null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (loadId !== loadIdRef.current) return; // a newer layer was selected meanwhile
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      try {
        originalRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        setImageLoaded(true);
      } catch (error) {
        console.error("Failed to read layer pixels (CORS?):", error);
      }
    };
    img.onerror = () => {
      console.error("Failed to load layer image:", imageUrl);
    };
    img.src = imageUrl;
  }, []);

  const sampleColorAt = useCallback(
    (clientX: number, clientY: number): RgbColor | null => {
      const canvas = canvasRef.current;
      const original = originalRef.current;
      if (!canvas || !original) return null;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width);
      const y = Math.floor(
        ((clientY - rect.top) / rect.height) * canvas.height
      );
      if (x < 0 || y < 0 || x >= original.width || y >= original.height)
        return null;

      const index = (y * original.width + x) * 4;
      const data = original.data;
      if (data[index + 3] === 0) return null; // transparent — nothing to sample
      return { r: data[index], g: data[index + 1], b: data[index + 2] };
    },
    []
  );

  const applyRecolour = useCallback(
    (
      interior: RgbColor,
      border: RgbColor,
      fill: RgbColor,
      stroke: RgbColor
    ) => {
      const canvas = canvasRef.current;
      const original = originalRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !original || !ctx) return;
      ctx.putImageData(
        recolourImageData(original, interior, border, fill, stroke),
        0,
        0
      );
    },
    []
  );

  const restoreOriginal = useCallback(() => {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !original || !ctx) return;
    ctx.putImageData(original, 0, 0);
  }, []);

  return {
    canvasRef,
    imageLoaded,
    loadImageToCanvas,
    sampleColorAt,
    applyRecolour,
    restoreOriginal,
  };
}

export default usePsdLayerColouring;

import { useEffect, useRef, useState, useCallback } from "react";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 40;
const DRAG_THRESHOLD = 4;

const clamp = (value: number) =>
  Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

function usePanZoom() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const hasDragged = useRef<boolean>(false);
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  // Zoom keeping the point under (clientX, clientY) fixed.
  // Transforms are relative to the viewport centre, so mouse coords are too.
  const zoomAt = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mx = clientX - (rect.left + rect.width / 2);
      const my = clientY - (rect.top + rect.height / 2);

      setTransform((prev) => {
        const newScale = clamp(prev.scale * factor);
        const ratio = newScale / prev.scale;
        return {
          scale: newScale,
          x: mx - (mx - prev.x) * ratio,
          y: my - (my - prev.y) * ratio,
        };
      });
    },
    []
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [zoomAt]
  );

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // Wheel needs a non-passive native listener so preventDefault works.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag.isDown) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!hasDragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      hasDragged.current = true;
      setIsPanning(true);
      setTransform((prev) => ({
        ...prev,
        x: drag.originX + dx,
        y: drag.originY + dy,
      }));
    };
    const onUp = () => {
      dragRef.current.isDown = false;
      setIsPanning(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasDragged.current = false;
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    };
  };

  return {
    viewportRef,
    transform,
    isPanning,
    hasDragged,
    onMouseDown,
    zoomBy,
    reset,
  };
}

export default usePanZoom;

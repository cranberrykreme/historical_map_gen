import { useEffect, useRef } from 'react';

function useMapInteraction(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapRef: React.RefObject<HTMLDivElement | null>,
  isReady: boolean,
  scaleRef: React.RefObject<number>,
  isDraggingUnit: React.RefObject<boolean>
) {
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanning = useRef<boolean>(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isReady) return;
    const container = containerRef.current;
    if (!container) return;

    const applyTransform = () => {
      if (!mapRef.current) return;
      const { x, y } = positionRef.current;
      const scale = scaleRef.current ?? 1;
      mapRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const prevScale = scaleRef.current;
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(prevScale + delta, 0.3), 10);
      const { x, y } = positionRef.current;
      positionRef.current = {
        x: mouseX - (mouseX - x) * (newScale / prevScale),
        y: mouseY - (mouseY - y) * (newScale / prevScale),
      };
      scaleRef.current = newScale;
      applyTransform();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      panStart.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      if (isDraggingUnit.current) {
        isPanning.current = false;
        container.style.cursor = 'grab';
        return;
      }
      positionRef.current = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      applyTransform();
    };

    const handleMouseUp = () => {
      isPanning.current = false;
      container.style.cursor = 'grab';
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      isDraggingUnit.current = true;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isReady, scaleRef, isDraggingUnit]);
}

export default useMapInteraction;
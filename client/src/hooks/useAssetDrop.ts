import { useCallback } from "react";
import { AssetType } from "../types";

interface UseAssetDropParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
  positionRef: React.RefObject<{ x: number; y: number }>;
  addUnitAtPosition: (
    filename: string,
    assetType: AssetType,
    x: number,
    y: number
  ) => void;
}

function useAssetDrop({
  containerRef,
  scaleRef,
  positionRef,
  addUnitAtPosition,
}: UseAssetDropParams) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const { filename, assetType } = JSON.parse(data) as {
          filename: string;
          assetType: AssetType;
        };
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const scale = scaleRef.current ?? 1;
        const position = positionRef.current ?? { x: 0, y: 0 };

        const mapX = (screenX - position.x) / scale;
        const mapY = (screenY - position.y) / scale;

        addUnitAtPosition(filename, assetType, mapX, mapY);
      } catch (error) {
        console.error("Failed to parse drop data:", error);
      }
    },
    [containerRef, scaleRef, positionRef, addUnitAtPosition]
  );

  return { handleDragOver, handleDrop };
}

export default useAssetDrop;

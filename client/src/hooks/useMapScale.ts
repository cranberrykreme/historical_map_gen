import React, { useEffect, useState } from "react";

// The map's zoom, kept up to date as the map is zoomed (by the wheel, or the video's camera).
// For things drawn on the map that should stay the same size on screen, like editing handles.
// Panning doesn't change it, so nothing re-renders while the map is dragged around.
function useMapScale(
  mapRef: React.RefObject<HTMLDivElement | null>,
  scaleRef: React.RefObject<number>
): number {
  const [scale, setScale] = useState(scaleRef.current ?? 1);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof MutationObserver === "undefined") return;
    const update = () => {
      const next = scaleRef.current ?? 1;
      setScale((current) => (Math.abs(current - next) > 1e-6 ? next : current));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(map, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [mapRef, scaleRef]);
  return scale;
}

export default useMapScale;

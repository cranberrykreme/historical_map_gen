import React, { useEffect, useRef } from "react";
import { HistoryView, zoomView } from "../../utils/timeline";

const ZOOM_SPEED = 0.01; // per unit of pinch or ⌘-scroll

// Pinching on a trackpad (or ⌘/Ctrl-scrolling) zooms about the pointer, and swiping
// sideways (or Shift-scrolling) pans. Plain scrolling is left alone, so it scrolls the
// rows. Attached by hand because React's wheel events can't stop the page from zooming.
export function useTimelineWheel(
  trackRef: React.RefObject<HTMLDivElement | null>,
  shown: HistoryView,
  expanded: boolean,
  setView: (view: HistoryView | null) => void
) {
  // The wheel handler is attached once, so it reads the latest view through a ref
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleWheel = (e: WheelEvent) => {
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const base = shownRef.current;
      const baseSpan = base.to - base.from;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const anchor =
          base.from + ((e.clientX - rect.left) / rect.width) * baseSpan;
        setView(zoomView(base, anchor, Math.exp(e.deltaY * ZOOM_SPEED)));
        return;
      }

      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (sideways) {
        e.preventDefault();
        const pixels = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        const shift = (pixels / rect.width) * baseSpan;
        setView({ from: base.from + shift, to: base.to + shift });
      }
    };
    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, [trackRef, expanded, setView]);
}

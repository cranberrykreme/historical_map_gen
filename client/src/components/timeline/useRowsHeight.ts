import React, { useEffect, useState } from "react";
import {
  clampRowsHeight,
  toggledRowsHeight,
  useTimelineStore,
} from "../../store/useTimelineStore";

// How much room the rows get, and the handlers for the resize handle along the top edge
export function useRowsHeight() {
  const rowsHeight = useTimelineStore((state) => state.rowsHeight);

  // Drag the timeline's top edge to give the rows more or less room; double-click it to switch
  // between the usual height and tall
  const startResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = useTimelineStore.getState().rowsHeight;
    const onMove = (ev: MouseEvent) =>
      useTimelineStore
        .getState()
        .setRowsHeight(
          clampRowsHeight(
            startHeight + (startY - ev.clientY),
            window.innerHeight
          )
        );
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      useTimelineStore.getState().saveRowsHeight();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleTall = () => {
    const state = useTimelineStore.getState();
    state.setRowsHeight(
      toggledRowsHeight(
        clampRowsHeight(state.rowsHeight, window.innerHeight),
        window.innerHeight
      )
    );
    state.saveRowsHeight();
  };

  // Keep within the window as it is resized. (The panel as a whole is also capped to the
  // window's height in the CSS, so the rows give way first on a very small window.)
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window === "undefined" ? Infinity : window.innerHeight
  );
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const fittedHeight = clampRowsHeight(rowsHeight, windowHeight);

  return { startResize, toggleTall, fittedHeight };
}

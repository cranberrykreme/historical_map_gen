import { useEffect } from "react";

// The Keyboard Lock API (Chrome and Edge): while the page is full screen, it lets a quick press
// of Esc reach the page instead of leaving full screen. Holding Esc still leaves it.
type KeyboardLock = {
  lock?: (keys?: string[]) => Promise<void>;
  unlock?: () => void;
};
const keyboard = () =>
  (navigator as unknown as { keyboard?: KeyboardLock }).keyboard;

// Whether this browser can keep Esc for the editor in full screen
export const canKeepEscape = () => typeof keyboard()?.lock === "function";

const TIP =
  "This browser always leaves full screen on Esc, which would also cancel what you're " +
  "drawing. Use the browser's own full screen instead: F11, or ⌃⌘F on a Mac. Esc then " +
  "stays with the editor.";

// A short message at the bottom of the screen that goes away by itself (or when clicked)
function showTip(message: string): void {
  const existing = document.getElementById("fullscreen-tip");
  existing?.remove();
  const tip = document.createElement("div");
  tip.id = "fullscreen-tip";
  tip.textContent = message;
  Object.assign(tip.style, {
    position: "fixed",
    left: "50%",
    bottom: "24px",
    transform: "translateX(-50%)",
    zIndex: "3000",
    maxWidth: "460px",
    padding: "10px 14px",
    background: "rgba(20, 18, 14, 0.94)",
    border: "1px solid #c8a84b",
    borderRadius: "6px",
    color: "#e8e0cc",
    font: "13px/1.45 system-ui, sans-serif",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.5)",
    cursor: "pointer",
  });
  tip.addEventListener("click", () => tip.remove());
  document.body.appendChild(tip);
  window.setTimeout(() => tip.remove(), 9000);
}

// Puts the editor full screen, or takes it out again. Browsers that can't keep Esc for the
// page (Firefox, Safari) get a tip to use their own full screen instead, where Esc doesn't
// leave it.
export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  } else if (!canKeepEscape()) {
    showTip(TIP);
  } else {
    document.documentElement.requestFullscreen().catch(() => undefined);
  }
}

// Full screen that keeps Esc for the editor (cancelling a drawing, deselecting). ⇧F goes full
// screen and back in Chrome and Edge. Elsewhere it explains how to use the browser's own full
// screen, which never takes Esc.
function useFullscreenKeys(): void {
  useEffect(() => {
    const onChange = () => {
      const kb = keyboard();
      if (document.fullscreenElement)
        kb?.lock?.(["Escape"]).catch(() => undefined);
      else kb?.unlock?.();
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select")
      )
        return;
      if (
        e.shiftKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}

export default useFullscreenKeys;

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { prepareRender } from "../../render/prepare";
import { renderFrame } from "../../render/renderFrame";
import { formatSeconds } from "../../utils/video/shots";
import styles from "./FramePreview.module.css";

// One frame of the video exactly as the finished video will show it, at full size, for checking
// against the editor before rendering the whole thing. It is drawn straight into the page body,
// so it sits over everything (the date, the toolbar) rather than inside the timeline's layer.
function FramePreview({
  seconds,
  onClose,
}: {
  seconds: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"drawing" | "ready" | "failed">(
    "drawing"
  );
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const job = await prepareRender();
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        canvas.width = job.width;
        canvas.height = job.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas");
        await renderFrame(ctx, job, seconds);
        if (!cancelled) {
          setSize({ width: job.width, height: job.height });
          setStatus("ready");
        }
      } catch (error) {
        console.error("Couldn't draw the frame:", error);
        if (!cancelled) setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seconds]);

  // Escape closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault(); // so the side panel doesn't close too
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const savePng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `frame-${formatSeconds(seconds).replace(/[:.]/g, "-")}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            Frame at {formatSeconds(seconds)}
            {size ? ` · ${size.width}×${size.height}` : ""}
          </span>
          <span className={styles.spacer} />
          <button
            className={styles.button}
            onClick={savePng}
            disabled={status !== "ready"}
            title="Save this frame as a PNG at full size"
          >
            Save PNG
          </button>
          <button
            className={styles.button}
            onClick={onClose}
            title="Close (Esc)"
          >
            Close
          </button>
        </div>
        <div className={styles.stage}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ visibility: status === "ready" ? "visible" : "hidden" }}
          />
          {status === "drawing" && <div className={styles.note}>Drawing…</div>}
          {status === "failed" && (
            <div className={styles.note}>
              The frame couldn't be drawn. The browser console has the details.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FramePreview;

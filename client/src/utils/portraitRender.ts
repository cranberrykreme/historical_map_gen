import { Circle } from "./portraitCircle";
import { RgbColor } from "../types";

const MAX_OUTPUT = 1024;

export function renderPortraitBlob(
  image: HTMLImageElement,
  circle: Circle,
  ringColour: RgbColor | null,
  ringPercent: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const diameter = Math.max(1, Math.round(circle.r * 2));
    const outSize = Math.min(diameter, MAX_OUTPUT);

    const canvas = document.createElement("canvas");
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    // Cut the image out to a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      circle.cx - circle.r,
      circle.cy - circle.r,
      circle.r * 2,
      circle.r * 2,
      0,
      0,
      outSize,
      outSize
    );
    ctx.restore();

    // Faction ring, drawn just inside the edge
    if (ringColour) {
      const ringWidth = (outSize / 2) * (ringPercent / 100);
      ctx.beginPath();
      ctx.arc(
        outSize / 2,
        outSize / 2,
        outSize / 2 - ringWidth / 2,
        0,
        Math.PI * 2
      );
      ctx.lineWidth = ringWidth;
      ctx.strokeStyle = `rgb(${ringColour.r}, ${ringColour.g}, ${ringColour.b})`;
      ctx.stroke();
    }

    try {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch (error) {
      console.error("Failed to render portrait (CORS?):", error);
      resolve(null);
    }
  });
}

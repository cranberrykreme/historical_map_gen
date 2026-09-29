import { RgbColor } from "../types";

const TOLERANCE = 48;

export function recolourImageData(
  original: ImageData,
  interior: RgbColor,
  border: RgbColor,
  newFill: RgbColor,
  newStroke: RgbColor
): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(original.data),
    original.width,
    original.height
  );
  const src = original.data;
  const dst = out.data;

  const dr = interior.r - border.r;
  const dg = interior.g - border.g;
  const db = interior.b - border.b;
  const lengthSq = dr * dr + dg * dg + db * db;
  // If interior and border are basically the same colour, treat it as one flat colour.
  const isFlat = lengthSq < 16;

  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue;

    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    let t: number;
    let distance: number;

    if (isFlat) {
      t = 1;
      distance = Math.hypot(r - interior.r, g - interior.g, b - interior.b);
    } else {
      const raw =
        ((r - border.r) * dr + (g - border.g) * dg + (b - border.b) * db) /
        lengthSq;
      t = Math.min(Math.max(raw, 0), 1);
      distance = Math.hypot(
        r - (border.r + t * dr),
        g - (border.g + t * dg),
        b - (border.b + t * db)
      );
    }

    if (distance > TOLERANCE) continue;

    dst[i] = newStroke.r + t * (newFill.r - newStroke.r);
    dst[i + 1] = newStroke.g + t * (newFill.g - newStroke.g);
    dst[i + 2] = newStroke.b + t * (newFill.b - newStroke.b);
  }

  return out;
}

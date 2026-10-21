export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

const MIN_RADIUS = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function defaultCircle(size: ImageSize): Circle {
  return {
    cx: size.width / 2,
    cy: size.height / 2,
    r: (Math.min(size.width, size.height) / 2) * 0.8,
  };
}

// Moving keeps the radius and stops the circle leaving the image
export function moveCircle(
  origin: Circle,
  dx: number,
  dy: number,
  size: ImageSize
): Circle {
  return {
    ...origin,
    cx: clamp(origin.cx + dx, origin.r, size.width - origin.r),
    cy: clamp(origin.cy + dy, origin.r, size.height - origin.r),
  };
}

// Resizing keeps the centre and stops the circle growing past an image edge
export function resizeCircle(
  origin: Circle,
  distance: number,
  size: ImageSize
): Circle {
  const maxR = Math.min(
    origin.cx,
    size.width - origin.cx,
    origin.cy,
    size.height - origin.cy
  );
  return { ...origin, r: clamp(distance, Math.min(MIN_RADIUS, maxR), maxR) };
}

import { CameraView } from "../types";
import { MapRect } from "./drawFrame";

// How the map's SVG lays its drawing out: the part of its own drawing space (its viewBox) that
// fills it, and how it fits that into its box on the map
export interface SvgLayout {
  viewBox: MapRect; // in the SVG's own units
  fit: "meet" | "none"; // keep its shape (centred) or stretch to the box
}

// Reads an SVG's layout from its attributes. With no viewBox, its own units are its width and
// height in pixels; with neither, the box it is drawn in.
export function svgLayout(
  attrs: {
    viewBox?: string | null;
    width?: string | null;
    height?: string | null;
    preserveAspectRatio?: string | null;
  },
  box: MapRect
): SvgLayout {
  const numbers = (attrs.viewBox ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const fit = (attrs.preserveAspectRatio ?? "").trim().startsWith("none")
    ? "none"
    : "meet";
  if (
    numbers.length === 4 &&
    numbers.every(Number.isFinite) &&
    numbers[2] > 0 &&
    numbers[3] > 0
  ) {
    const [x, y, width, height] = numbers;
    return { viewBox: { x, y, width, height }, fit };
  }
  const px = (value?: string | null) => {
    const n = parseFloat(value ?? "");
    return value && !value.trim().endsWith("%") && Number.isFinite(n) && n > 0
      ? n
      : null;
  };
  return {
    viewBox: {
      x: 0,
      y: 0,
      width: px(attrs.width) ?? box.width,
      height: px(attrs.height) ?? box.height,
    },
    fit: "none",
  };
}

// The SVG's own units for a point on the map, given where the SVG sits on the map
export function mapToSvg(
  layout: SvgLayout,
  box: MapRect,
  x: number,
  y: number
): { x: number; y: number } {
  const vb = layout.viewBox;
  if (layout.fit === "none") {
    return {
      x: vb.x + ((x - box.x) / box.width) * vb.width,
      y: vb.y + ((y - box.y) / box.height) * vb.height,
    };
  }
  // Keeps its shape and sits in the middle of its box
  const scale = Math.min(box.width / vb.width, box.height / vb.height);
  const offsetX = (box.width - vb.width * scale) / 2;
  const offsetY = (box.height - vb.height * scale) / 2;
  return {
    x: vb.x + (x - box.x - offsetX) / scale,
    y: vb.y + (y - box.y - offsetY) / scale,
  };
}

// The part of the map a frame shows, in map units
export function visibleRect(
  view: CameraView,
  width: number,
  height: number
): MapRect {
  const visibleHeight = view.height;
  const visibleWidth = (view.height * width) / height;
  return {
    x: view.centerX - visibleWidth / 2,
    y: view.centerY - visibleHeight / 2,
    width: visibleWidth,
    height: visibleHeight,
  };
}

// The viewBox that makes the SVG draw exactly the part of the map a frame shows, so it can be
// drawn at the frame's own size and stay sharp at any zoom
export function croppedViewBox(
  layout: SvgLayout,
  box: MapRect,
  visible: MapRect
): MapRect {
  const topLeft = mapToSvg(layout, box, visible.x, visible.y);
  const bottomRight = mapToSvg(
    layout,
    box,
    visible.x + visible.width,
    visible.y + visible.height
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

// The map's SVG, ready to be drawn at any view: read once, then cropped for each frame
export interface PreparedMap {
  box: MapRect; // where the SVG sits on the map, in map units
  layout: SvgLayout;
  document: Document;
}

export function prepareMap(svgText: string, box: MapRect): PreparedMap | null {
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = document.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") return null;
  const layout = svgLayout(
    {
      viewBox: root.getAttribute("viewBox"),
      width: root.getAttribute("width"),
      height: root.getAttribute("height"),
      preserveAspectRatio: root.getAttribute("preserveAspectRatio"),
    },
    box
  );
  return { box, layout, document };
}

// The SVG text for one frame: the map's drawing, showing exactly `visible`, at the frame's size
export function croppedSvgText(
  map: PreparedMap,
  visible: MapRect,
  width: number,
  height: number
): string {
  const vb = croppedViewBox(map.layout, map.box, visible);
  const root = map.document.documentElement.cloneNode(true) as Element;
  root.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  root.setAttribute("preserveAspectRatio", "none");
  if (!root.getAttribute("xmlns"))
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}

// Turns SVG text into an image that can be drawn onto a canvas
export function loadSvgImage(svgText: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([svgText], { type: "image/svg+xml" })
    );
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The map couldn't be drawn"));
    };
    image.src = url;
  });
}

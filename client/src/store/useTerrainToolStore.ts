import { create } from "zustand";
import { PathPoint, TerrainKind } from "../types";
import { BRUSH_DEFAULT, BRUSH_MAX, BRUSH_MIN } from "../utils/terrainBrush";

// What the brush is doing: painting a kind on, or rubbing terrain out
export type BrushMode = "paint" | "erase";

// The terrain tools' state while you work on a battleground. None of it is part of the
// project or of undo: the features themselves live with the battle (see scenesSlice). Only one
// tool is in use at a time: drawing a shape point by point, editing what's drawn, or the brush.
interface TerrainToolStore {
  // Drawing a new feature: its kind, and the points clicked so far
  drawing: TerrainKind | null;
  draft: PathPoint[];
  // Editing the features already drawn: clicking one on the map selects it
  editing: boolean;
  selectedId: string | null;
  // A feature's points while they're being dragged, before the drag is committed
  preview: { id: string; points: PathPoint[] } | null;
  // Where the mouse is over the map while drawing or brushing, so the shape can stretch to it
  // and the brush's circle can follow it
  hover: PathPoint | null;
  // The brush: what it's doing (null when it's put away), the kind it paints (and the kind the
  // eraser rubs out, unless it's set to rub out every kind), its radius in map units, and the
  // stroke being made, while the mouse is down
  brush: BrushMode | null;
  brushKind: TerrainKind;
  brushSize: number;
  eraseAll: boolean;
  stroke: PathPoint[] | null;

  startDrawing: (kind: TerrainKind) => void;
  addPoint: (point: PathPoint) => void;
  removeLastPoint: () => void;
  stopDrawing: () => void;
  setEditing: (editing: boolean) => void;
  select: (id: string | null) => void;
  setPreview: (preview: { id: string; points: PathPoint[] } | null) => void;
  setHover: (hover: PathPoint | null) => void;
  setBrush: (mode: BrushMode | null) => void;
  setBrushKind: (kind: TerrainKind) => void;
  setBrushSize: (size: number) => void;
  setEraseAll: (eraseAll: boolean) => void;
  setStroke: (stroke: PathPoint[] | null) => void;
  reset: () => void;
}

const clampSize = (size: number) =>
  Math.round(Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, size)));

export const useTerrainToolStore = create<TerrainToolStore>((set) => ({
  drawing: null,
  draft: [],
  editing: false,
  selectedId: null,
  preview: null,
  hover: null,
  brush: null,
  brushKind: "forest",
  brushSize: BRUSH_DEFAULT,
  eraseAll: false,
  stroke: null,

  startDrawing: (kind) =>
    set({
      drawing: kind,
      draft: [],
      selectedId: null,
      preview: null,
      brush: null,
      stroke: null,
    }),
  addPoint: (point) => set((state) => ({ draft: [...state.draft, point] })),
  removeLastPoint: () => set((state) => ({ draft: state.draft.slice(0, -1) })),
  stopDrawing: () => set({ drawing: null, draft: [], hover: null }),
  setEditing: (editing) =>
    set(
      editing
        ? { editing, brush: null, stroke: null }
        : { editing, selectedId: null, preview: null }
    ),
  select: (id) => set({ selectedId: id, preview: null }),
  setPreview: (preview) => set({ preview }),
  setHover: (hover) => set({ hover }),
  // Taking up the brush (or eraser) puts the other tools down
  setBrush: (mode) =>
    set(
      mode
        ? {
            brush: mode,
            stroke: null,
            drawing: null,
            draft: [],
            editing: false,
            selectedId: null,
            preview: null,
          }
        : { brush: null, stroke: null, hover: null }
    ),
  setBrushKind: (kind) => set({ brushKind: kind }),
  setBrushSize: (size) => set({ brushSize: clampSize(size) }),
  setEraseAll: (eraseAll) => set({ eraseAll }),
  setStroke: (stroke) => set({ stroke }),
  // Leaving the battle: everything put down. The brush keeps its kind, size and setting.
  reset: () =>
    set({
      drawing: null,
      draft: [],
      editing: false,
      selectedId: null,
      preview: null,
      hover: null,
      brush: null,
      stroke: null,
    }),
}));

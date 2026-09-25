import { create } from "zustand";
import { Unit, AssetType } from "../types";
import API_BASE_URL from "../config/api";

interface DragPosition {
  id: string;
  x: number;
  y: number;
}

interface DragRotation {
  id: string;
  rotation: number;
}

interface DragScale {
  id: string;
  scale: number;
}

interface GroupDragDelta {
  dx: number;
  dy: number;
}

interface MapStore {
  // History
  past: Unit[][];
  future: Unit[][];

  // State
  placedUnits: Unit[];
  selectedUnitIds: Set<string>;
  dragPosition: DragPosition | null;
  dragRotation: DragRotation | null;
  dragScale: DragScale | null;
  groupDragDelta: GroupDragDelta | null;
  groupRotateDelta: number | null;
  groupScaleDelta: number | null;

  // History actions
  set: (units: Unit[]) => void;
  undo: () => void;
  redo: () => void;

  // Unit actions
  setPlacedUnits: (units: Unit[]) => void;
  addUnit: (filename: string, assetType: AssetType) => void;
  removeSelectedUnits: () => void;
  addUnitAtPosition: (
    filename: string,
    assetType: AssetType,
    x: number,
    y: number
  ) => void;

  // Selection actions
  selectUnit: (id: string | null, addToSelection?: boolean) => void;
  boxSelect: (ids: string[]) => void;

  // Drag actions
  setDragPosition: (drag: DragPosition | null) => void;
  setDragRotation: (drag: DragRotation | null) => void;
  setDragScale: (drag: DragScale | null) => void;
  setGroupDragDelta: (delta: GroupDragDelta | null) => void;
  setGroupRotateDelta: (delta: number | null) => void;
  setGroupScaleDelta: (delta: number | null) => void;

  // Commit actions
  commitUnitMove: (id: string, x: number, y: number) => void;
  commitUnitRotate: (id: string, rotation: number) => void;
  commitUnitScale: (id: string, scale: number) => void;
  commitGroupMove: (dx: number, dy: number) => void;
  commitGroupRotate: (delta: number) => void;
  commitGroupScale: (delta: number) => void;

  // copy/paste items
  clipboard: Unit[];
  copySelectedUnits: () => void;
  pasteUnits: () => void;

  // Track Map files
  selectedMapFilename: string | null;
  setSelectedMap: (filename: string | null) => void;

  // Available assets (shared across App and Toolbar)
  availableUnits: string[];
  availablePortraits: string[];
  availableMaps: string[];
  fetchAssetList: (type: AssetType) => Promise<void>;
}

export const useMapStore = create<MapStore>((set, get) => ({
  // Initial history state
  past: [],
  future: [],
  clipboard: [],

  // Initial state
  placedUnits: [],
  selectedUnitIds: new Set(),
  dragPosition: null,
  dragRotation: null,
  dragScale: null,
  groupDragDelta: null,
  groupRotateDelta: null,
  groupScaleDelta: null,
  selectedMapFilename: null,

  // Initial available assets
  availableUnits: [],
  availablePortraits: [],
  availableMaps: [],

  // History actions
  set: (newUnits) => {
    const { placedUnits, past } = get();
    set({
      past: [...past, placedUnits],
      placedUnits: newUnits,
      future: [],
    });
  },

  undo: () => {
    const { past, placedUnits, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      placedUnits: previous,
      future: [placedUnits, ...future],
    });
  },

  redo: () => {
    const { past, placedUnits, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, placedUnits],
      placedUnits: next,
      future: future.slice(1),
    });
  },

  // Unit actions — setPlacedUnits bypasses history (for loading)
  setPlacedUnits: (units) => set({ placedUnits: units }),

  addUnit: (filename, assetType) => {
    const { placedUnits, past } = get();
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      assetType,
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
    };
    set({
      past: [...past, placedUnits],
      placedUnits: [...placedUnits, newUnit],
      future: [],
    });
  },

  removeSelectedUnits: () => {
    const { placedUnits, selectedUnitIds, past } = get();
    const newUnits = placedUnits.filter(
      (unit) => !selectedUnitIds.has(unit.id)
    );
    set({
      past: [...past, placedUnits],
      placedUnits: newUnits,
      future: [],
      selectedUnitIds: new Set(),
    });
  },

  // Selection actions
  selectUnit: (id, addToSelection = false) => {
    if (id === null) {
      set({ selectedUnitIds: new Set() });
      return;
    }
    if (addToSelection) {
      const next = new Set(get().selectedUnitIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      set({ selectedUnitIds: next });
    } else {
      set({ selectedUnitIds: new Set([id]) });
    }
  },

  boxSelect: (ids) => set({ selectedUnitIds: new Set(ids) }),

  // Drag actions
  setDragPosition: (drag) => set({ dragPosition: drag }),
  setDragRotation: (drag) => set({ dragRotation: drag }),
  setDragScale: (drag) => set({ dragScale: drag }),
  setGroupDragDelta: (delta) => set({ groupDragDelta: delta }),
  setGroupRotateDelta: (delta) => set({ groupRotateDelta: delta }),
  setGroupScaleDelta: (delta) => set({ groupScaleDelta: delta }),

  // Commit actions — all go through history
  commitUnitMove: (id, x, y) => {
    const { placedUnits, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      dragPosition: null,
      placedUnits: placedUnits.map((unit) =>
        unit.id === id ? { ...unit, x, y } : unit
      ),
    });
  },

  commitUnitRotate: (id, rotation) => {
    const { placedUnits, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      dragRotation: null,
      placedUnits: placedUnits.map((unit) =>
        unit.id === id ? { ...unit, rotation } : unit
      ),
    });
  },

  commitUnitScale: (id, scale) => {
    const { placedUnits, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      dragScale: null,
      placedUnits: placedUnits.map((unit) =>
        unit.id === id ? { ...unit, scale } : unit
      ),
    });
  },

  commitGroupMove: (dx, dy) => {
    const { placedUnits, selectedUnitIds, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      groupDragDelta: null,
      placedUnits: placedUnits.map((unit) =>
        selectedUnitIds.has(unit.id)
          ? { ...unit, x: unit.x + dx, y: unit.y + dy }
          : unit
      ),
    });
  },

  commitGroupRotate: (delta) => {
    const { placedUnits, selectedUnitIds, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      groupRotateDelta: null,
      placedUnits: placedUnits.map((unit) =>
        selectedUnitIds.has(unit.id)
          ? { ...unit, rotation: unit.rotation + delta }
          : unit
      ),
    });
  },

  commitGroupScale: (delta) => {
    const { placedUnits, selectedUnitIds, past } = get();
    set({
      past: [...past, placedUnits],
      future: [],
      groupScaleDelta: null,
      placedUnits: placedUnits.map((unit) =>
        selectedUnitIds.has(unit.id)
          ? { ...unit, scale: Math.min(Math.max(unit.scale + delta, 0.1), 5) }
          : unit
      ),
    });
  },

  addUnitAtPosition: (filename, assetType, x, y) => {
    const { placedUnits, past } = get();
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      assetType,
      x,
      y,
      rotation: 0,
      scale: 1,
    };
    set({
      past: [...past, placedUnits],
      placedUnits: [...placedUnits, newUnit],
      future: [],
    });
  },

  copySelectedUnits: () => {
    const { placedUnits, selectedUnitIds } = get();
    const copied = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
    set({ clipboard: copied });
  },

  pasteUnits: () => {
    const { placedUnits, clipboard, past } = get();
    if (clipboard.length === 0) return;

    const newUnits: Unit[] = clipboard.map((unit) => ({
      ...unit,
      id: `${unit.filename}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      x: unit.x + 20,
      y: unit.y + 20,
    }));

    const newIds = new Set(newUnits.map((u) => u.id));

    set({
      past: [...past, placedUnits],
      future: [],
      placedUnits: [...placedUnits, ...newUnits],
      selectedUnitIds: newIds,
    });
  },

  setSelectedMap: (filename) => set({ selectedMapFilename: filename }),

  fetchAssetList: async (type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/${type}`);
      const data = await response.json();
      if (type === "units") set({ availableUnits: data.files || [] });
      if (type === "portraits") set({ availablePortraits: data.files || [] });
      if (type === "maps") set({ availableMaps: data.files || [] });
    } catch (error) {
      console.error(`Failed to fetch ${type} assets:`, error);
    }
  },
}));

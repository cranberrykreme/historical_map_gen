import { create } from "zustand";
import { AssetType } from "../types";
import API_BASE_URL from "../config/api";

interface AssetStore {
  currentProjectName: string | null;
  setCurrentProject: (name: string | null) => void;
  availableUnits: string[];
  availablePortraits: string[];
  availableMaps: string[];
  fetchAssetList: (type: AssetType) => Promise<void>;
  deleteAsset: (
    filename: string,
    assetType: AssetType,
    onDeleted?: (filename: string, assetType: AssetType) => void
  ) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  currentProjectName: null,
  setCurrentProject: (name) => set({ currentProjectName: name }),

  availableUnits: [],
  availablePortraits: [],
  availableMaps: [],

  fetchAssetList: async (type) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${type}`
      );
      const data = await response.json();
      if (type === "units") set({ availableUnits: data.files || [] });
      if (type === "portraits") set({ availablePortraits: data.files || [] });
      if (type === "maps") set({ availableMaps: data.files || [] });
    } catch (error) {
      console.error(`Failed to fetch ${type} assets:`, error);
    }
  },

  deleteAsset: async (filename, assetType, onDeleted) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${filename}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
        onDeleted?.(filename, assetType);
      }
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  },
}));

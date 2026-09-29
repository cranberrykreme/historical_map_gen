import { create } from "zustand";
import { AssetType, AssetFile } from "../types";
import API_BASE_URL from "../config/api";

interface AssetTypeState {
  files: AssetFile[];
  folders: string[];
}

const emptyState: AssetTypeState = { files: [], folders: [] };

function parsePath(path: string): AssetFile {
  const parts = path.split("/");
  if (parts.length === 2) {
    return { path, filename: parts[1], folder: parts[0] };
  }
  return { path, filename: parts[0], folder: null };
}

interface AssetStore {
  currentProjectName: string | null;
  setCurrentProject: (name: string | null) => void;

  units: AssetTypeState;
  portraits: AssetTypeState;
  maps: AssetTypeState;

  fetchAssetList: (type: AssetType) => Promise<void>;
  createFolder: (assetType: AssetType, name: string) => Promise<void>;
  deleteAsset: (
    path: string,
    assetType: AssetType,
    onDeleted?: (path: string, assetType: AssetType) => void
  ) => Promise<void>;
  renameOrMoveAsset: (
    path: string,
    assetType: AssetType,
    updates: { filename?: string; folder?: string },
    onRenamed?: (oldPath: string, newPath: string, assetType: AssetType) => void
  ) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  currentProjectName: null,
  setCurrentProject: (name) => set({ currentProjectName: name }),

  units: emptyState,
  portraits: emptyState,
  maps: emptyState,

  fetchAssetList: async (type) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${type}`
      );
      const data = await response.json();
      const files: AssetFile[] = (data.files || []).map(parsePath);
      const folders: string[] = data.folders || [];
      set({ [type]: { files, folders } } as Partial<AssetStore>);
    } catch (error) {
      console.error(`Failed to fetch ${type} assets:`, error);
    }
  },

  createFolder: async (assetType, name) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/folder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  },

  deleteAsset: async (path, assetType, onDeleted) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
        onDeleted?.(path, assetType);
      }
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  },

  renameOrMoveAsset: async (path, assetType, updates, onRenamed) => {
    const { currentProjectName } = get();
    if (!currentProjectName) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      const data = await response.json();
      if (data.success) {
        get().fetchAssetList(assetType);
        onRenamed?.(path, data.path, assetType);
      }
    } catch (error) {
      console.error("Failed to rename/move asset:", error);
    }
  },
}));

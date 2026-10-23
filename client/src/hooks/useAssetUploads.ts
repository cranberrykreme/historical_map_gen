import { useCallback, useRef, useState } from "react";
import { AssetType } from "../types";
import { useAssetStore } from "../store/useAssetStore";
import API_BASE_URL from "../config/api";
import { newlyAdded } from "../utils/project/uploads";

// What was just added straight to a Library section, for the message with Change type and Undo
export interface RecentUpload {
  files: File[];
  type: AssetType;
  added: string[]; // paths new to the Library (not replacing a picture of the same name)
}

const MESSAGE_SHOWN_FOR = 8000; // ms

// Adding pictures to the project. Files dropped on a Library section, or picked with its own
// Add button, go straight there with a short message (Change type, Undo). Files dropped
// anywhere else wait in `pendingFiles` while the type popup asks what they are.
function useAssetUploads(
  projectName: string | undefined,
  // A picture taken away again by Undo or Change type, so units using it can let go of it
  onRemoved: (path: string, type: AssetType) => void
) {
  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const deleteAsset = useAssetStore((state) => state.deleteAsset);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [recent, setRecent] = useState<RecentUpload | null>(null);
  // While set, the type popup is changing the type of the recent upload
  const [changing, setChanging] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  // Uploads the files as one type; returns the paths they were saved under
  const upload = useCallback(
    async (files: File[], type: AssetType): Promise<string[]> => {
      const paths: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/projects/${projectName}/assets/upload`,
            { method: "POST", body: formData }
          );
          const data = await response.json();
          if (data.success) paths.push(data.path);
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
        }
      }
      await fetchAssetList(type);
      return paths;
    },
    [projectName, fetchAssetList]
  );

  const showRecent = (next: RecentUpload | null) => {
    window.clearTimeout(hideTimer.current);
    setRecent(next);
    if (next)
      hideTimer.current = window.setTimeout(
        () => setRecent(null),
        MESSAGE_SHOWN_FOR
      );
  };

  // Straight into one section of the Library
  const uploadStraight = async (files: File[], type: AssetType) => {
    const before = useAssetStore.getState()[type].files.map((f) => f.path);
    const uploaded = await upload(files, type);
    showRecent({ files, type, added: newlyAdded(before, uploaded) });
  };

  const removeAdded = (upload: RecentUpload) => {
    for (const path of upload.added) deleteAsset(path, upload.type, onRemoved);
  };

  // Files dropped or picked: straight in when it's clear where they go, otherwise ask
  const handleFilesSelected = (files: File[], type: AssetType | null) => {
    if (type) uploadStraight(files, type);
    else setPendingFiles(files);
  };

  const handleAddAsset = (type: AssetType | null) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.svg";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesSelected(Array.from(files), type);
      }
    };
    input.click();
  };

  // The type popup's answer: for new files, or for changing the recent upload's type
  const handleConfirm = async (files: File[], type: AssetType) => {
    setPendingFiles([]);
    if (changing && recent) {
      setChanging(false);
      if (type === recent.type) return;
      removeAdded(recent);
      await uploadStraight(recent.files, type);
      return;
    }
    await upload(files, type);
  };

  const handleCancel = () => {
    setPendingFiles([]);
    if (changing) {
      setChanging(false);
      showRecent(recent); // the message goes on to close by itself
    }
  };

  const changeRecentType = () => {
    if (!recent) return;
    window.clearTimeout(hideTimer.current); // stays while the popup is open
    setChanging(true);
    setPendingFiles(recent.files);
  };

  const undoRecent = () => {
    if (!recent) return;
    removeAdded(recent);
    showRecent(null);
  };

  return {
    pendingFiles,
    changingType: changing,
    recentUpload: recent,
    handleFilesSelected,
    handleAddAsset,
    handleConfirm,
    handleCancel,
    changeRecentType,
    undoRecent,
    dismissRecent: () => showRecent(null),
  };
}

export default useAssetUploads;

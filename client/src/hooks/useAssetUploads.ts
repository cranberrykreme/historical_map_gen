import { useState } from "react";
import { AssetType } from "../types";
import { useAssetStore } from "../store/useAssetStore";
import API_BASE_URL from "../config/api";

// Adding pictures to the project: files picked or dropped wait in `pendingFiles` while the
// type popup asks what they are, then upload
function useAssetUploads(projectName: string | undefined) {
  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(files);
  };

  const handleAddAsset = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.svg";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesSelected(Array.from(files));
      }
    };
    input.click();
  };

  const handleConfirm = async (files: File[], type: AssetType) => {
    setPendingFiles([]);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      try {
        await fetch(
          `${API_BASE_URL}/api/projects/${projectName}/assets/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }

    fetchAssetList(type);
  };

  const handleCancel = () => {
    setPendingFiles([]);
  };

  return {
    pendingFiles,
    handleFilesSelected,
    handleAddAsset,
    handleConfirm,
    handleCancel,
  };
}

export default useAssetUploads;

import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import { PsdLayer } from "../types";

function usePsdLayers(projectName: string | null, psdName: string) {
  const [layers, setLayers] = useState<PsdLayer[]>([]);

  useEffect(() => {
    if (!projectName) return;
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/projects/${projectName}/psd/${psdName}/layers`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setLayers(data.layers || []);
      })
      .catch((error) => console.error("Failed to fetch PSD layers:", error));
    return () => {
      cancelled = true;
    };
  }, [projectName, psdName]);

  return layers;
}

export default usePsdLayers;

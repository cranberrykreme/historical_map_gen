import { useEffect, useMemo, useState } from "react";
import { ImageSize } from "../utils/portraitCircle";

function usePortraitImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setImage(null);
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.onerror = () => {
      if (!cancelled) console.error("Failed to load portrait source:", url);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  const size = useMemo<ImageSize | null>(
    () =>
      image ? { width: image.naturalWidth, height: image.naturalHeight } : null,
    [image]
  );

  return { image, size };
}

export default usePortraitImage;

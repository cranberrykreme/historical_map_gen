import { useEffect, useState } from "react";

function useMapFetch(url: string | null) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSvgContent(null);
      return;
    }

    let isCancelled = false;

    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        if (!isCancelled) {
          setSvgContent(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          console.error("Could not load map");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return svgContent;
}

export default useMapFetch;

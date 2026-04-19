import { useEffect, useState } from 'react';

function useMapFetch(url: string) {
    const [svgContent, setSvgContent] = useState<string | null>(null);

    useEffect(() => {
        fetch(url)
            .then(response => response.text())
            .then(data => setSvgContent(data))
            .catch(() => console.error('Could not load map'));
    }, [url]);

    return svgContent;
}

export default useMapFetch;
import React, { useState, useEffect } from 'react';

function MapCanvas() {
    const [svgContent, setSvgContent] = useState<string | null>(null)

    useEffect(() => {
        fetch('http://localhost:5000/api/map')
            .then(response => response.text())
            .then(data => setSvgContent(data))
            .catch(() => console.error('could not load map'));
    }, []);

    return (
        <div>
            {!svgContent && <p>Loading Map...</p>}
            {svgContent && (
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
            )} 
        </div>
    )
}

export default MapCanvas;
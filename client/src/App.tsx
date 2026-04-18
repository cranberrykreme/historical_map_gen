import React, { useEffect, useState } from 'react';
import MapCanvas from './components/MapCanvas';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(response => response.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Could not reach backend'));
  }, []);

  return(
    <div>
      <h1>History Map Tool</h1>
      <p>Backend status: {backendStatus}</p>
      <MapCanvas />
    </div>
  )
}

export default App
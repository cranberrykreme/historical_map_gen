import React, { useEffect, useState } from 'react';
import MapCanvas from './components/MapCanvas';
import API_BASE_URL from './config/api';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
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
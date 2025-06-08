import React, { useEffect, useState } from 'react';

const Debug = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      console.log('Starting fetch to /api/users/view...');
      try {
        const response = await fetch('https://celestialcenter-835108787508.us-south1.run.app/api/users/view');
        console.log('Response received:', response);

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Data fetched successfully:', data);
        setData(data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setData(null);
      }
    };

    fetchDebugData();
  }, []);

  return (
    <div>
      <h1>Debug Page</h1>
      {error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : data ? (
        <div>
          <h2>Fetched Users Data:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default Debug;

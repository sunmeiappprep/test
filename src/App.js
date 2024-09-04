import React, { useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/main');  // Use relative path
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Yelp Review Summary</h1>
      <button onClick={fetchData}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {data && (
        <div>
          <h2>Combined Text:</h2>
          <pre>{data.combinedText}</pre>
          <h2>Average Rating:</h2>
          <p>{data.averageRating}</p>
          <h2>GPT Summary:</h2>
          <pre>{data.gptSummary}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

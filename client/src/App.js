import React, { useState, useEffect } from 'react';

function App() {
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('https://try2-06kz.onrender.com/webhook', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => console.log(data))
    .catch(error => {
      console.error('Error:', error);
      setError('Could not connect to the backend. Please try again later.');
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Messenger Webhook</h1>
        <p>This is a simple Messenger Webhook integration.</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </header>
    </div>
  );
}

export default App;

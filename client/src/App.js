import React, { useState, useEffect } from 'react';

function App() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = 'https://f99a-197-19-70-96.ngrok-free.app/webhook';
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'mohtadi',
      'hub.challenge': 'CHALLENGE_ACCEPTED',
    });

    fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.text();  // Since the webhook verification typically returns plain text
    })
    .then(data => {
      console.log('Challenge response:', data);
    })
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

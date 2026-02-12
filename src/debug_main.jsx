import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('Debug Main starting...');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <div style={{ padding: 20, background: 'green', color: 'white' }}>
      <h1>React is working!</h1>
      <p>If you see this, the React environment is healthy.</p>
    </div>
  );
  console.log('Debug Main render called');
} catch (e) {
  console.error('Debug Main crashed', e);
}

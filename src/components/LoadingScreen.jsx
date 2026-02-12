import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '400px', // Ensure it takes up space
      width: '100%',
      color: 'var(--text-muted)'
    }}>
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '1.5rem', fontWeight: 500, animation: 'pulse 2s infinite' }}>
        Loading Workspace...
      </p>
      
      <style>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--bg-subtle);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;

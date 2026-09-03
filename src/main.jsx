import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Last-resort net: any unhandled render error shows a calm message (and logs to the
// console) instead of a blank white page — your photos stay safe in IndexedDB.
const Fallback = (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: '#050506',
      color: '#e8e8e8',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      textAlign: 'center',
      padding: 24,
    }}
  >
    <p style={{ fontSize: 18 }}>Something hiccuped while drawing your moments.</p>
    <p style={{ fontSize: 14, color: '#9a9a9a' }}>
      Your photos are safe on this device — please reload the page.
    </p>
  </div>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={Fallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

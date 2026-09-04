import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign Vite HMR websocket disconnection messages in sandboxed preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (typeof event.reason === 'string' || typeof event.reason?.message === 'string')
    ) {
      const msg = String(event.reason?.message || event.reason);
      if (
        msg.includes('WebSocket closed without opened') ||
        msg.includes('[vite] failed to connect to websocket')
      ) {
        event.preventDefault();
      }
    }
  });

  // Register offline Service Worker for TV Kiosk Mode
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('[SW] Registration notice:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


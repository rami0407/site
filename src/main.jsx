import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA Service Worker for offline capabilities, push notifications and app installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Musheirifa PWA ServiceWorker active with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Musheirifa PWA ServiceWorker registration failed:', error);
      });
  });
}


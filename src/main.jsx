import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Auto-recovery for Vite dynamic chunks & preloads when new deployments occur
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preloadError detected (new deployment). Reloading page...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Unable to preload CSS') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module')
  ) {
    const isRefreshed = sessionStorage.getItem('auto_chunk_reload_done');
    if (!isRefreshed) {
      sessionStorage.setItem('auto_chunk_reload_done', 'true');
      console.warn('Chunk load error detected, auto-refreshing for updated assets...');
      window.location.reload();
    }
  }
});

// Register PWA Service Worker for offline capabilities, push notifications and app installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update().catch(() => {});
        console.log('Musheirifa PWA ServiceWorker active with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Musheirifa PWA ServiceWorker registration failed:', error);
      });
  });
}



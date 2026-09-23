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

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.includes('Failed to fetch dynamically imported module') ||
    reason.includes('Unable to preload CSS') ||
    reason.includes('error loading dynamically imported module')
  ) {
    console.warn('Dynamic import rejected (new deployment detected). Reloading...', reason);
    window.location.reload();
  }
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
  let isRefreshing = false;

  // When a newly installed service worker takes control (via skipWaiting + claim), reload page once
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      console.log('Musheirifa PWA updated to latest version. Reloading...');
      window.location.reload();
    }
  });

  // Listen for emergency chunk 404 reload broadcast from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'CHUNK_404_RELOAD') {
      console.warn('ServiceWorker signaled missing chunk (new deployment). Reloading page...');
      window.location.reload();
    }
  });

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

  // Check for updates when user refocuses tab
  window.addEventListener('focus', () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}));
  });
}



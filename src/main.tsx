import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const DASHBOARD_CACHE_GUARD = 'qghn-dashboard-cache-guard-v2';

async function clearStaleDashboardRuntime() {
  if (typeof window === 'undefined') return;

  try {
    const registrations = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistrations()
      : [];

    const hadServiceWorker = registrations.length > 0;
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) =>
            /^(aegisbot|workbox|vite-pwa|qghn)/i.test(name)
          )
          .map((name) => caches.delete(name))
      );
    }

    const alreadyReloaded = sessionStorage.getItem(DASHBOARD_CACHE_GUARD) === '1';
    if (hadServiceWorker && !alreadyReloaded) {
      sessionStorage.setItem(DASHBOARD_CACHE_GUARD, '1');
      window.location.reload();
      return;
    }
  } catch {
    // The app can still boot normally if browser cache APIs are unavailable.
  }
}

void clearStaleDashboardRuntime().finally(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});

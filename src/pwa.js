// Service Worker (offline spielbar, installierbar als App). Nur im Produktions-Build; in eingebetteten
// Ansichten (iframe ohne Service Worker) wird er still übergangen.
export function registerSW() {
  if (import.meta.env.DEV) return;
  window.addEventListener('load', () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('./sw.js').catch(() => { /* ohne Offline-Modus weiter */ });
    } catch (_) { /* ohne Offline-Modus weiter */ }
  });
}

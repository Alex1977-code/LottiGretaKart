// Service Worker (offline spielbar, installierbar als App). Nur im Produktions-Build; in eingebetteten
// Ansichten (iframe ohne Service Worker) wird er still übergangen.
export function registerSW() {
  if (import.meta.env.DEV) return;
  // iPhone-App: alle Dateien liegen ohnehin im App-Paket
  if (window.Capacitor?.isNativePlatform?.()) return;
  window.addEventListener('load', () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('./sw.js').catch(() => { /* ohne Offline-Modus weiter */ });
    } catch (_) { /* ohne Offline-Modus weiter */ }
  });
}

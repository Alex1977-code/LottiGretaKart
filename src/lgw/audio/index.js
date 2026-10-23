// Audio-Fassade: Freischaltung bei der ersten Geste, Effekte, Musik, Stummschaltung.
import { engine } from './AudioEngine.js';
import { sfx, renderSfx, SFX_NAMES, COURSE_SFX } from './sfx.js';
import { music } from './Music.js';

// Test-/Debug-Zugriff auf die Effekte (über window.__audio.engine erreichbar):
// Namen, Kurs-Vertragsnamen, Abspielen und Offline-Rendern zum Vermessen.
engine.effects = { play: sfx, names: SFX_NAMES, course: COURSE_SFX, render: renderSfx };

let installed = false;

/**
 * Richtet die Audio-Freischaltung bei Nutzergesten ein (wie Phaser in der Lotti-&-Greta-Welt):
 * Der AudioContext entsteht erst bei einer echten Freigabe-Geste (Loslassen/Klick/Taste – auf dem iPhone zählt
 * touchstart nicht), wird fortgesetzt, und in derselben Geste läuft ein winziger stiller Puffer an. Erst damit gibt
 * iOS Safari den Ton wirklich aus. Der Stummschalter des iPhones wirkt dabei ganz normal (lautlos = kein Ton).
 * Die Freischaltung bleibt aktiv: nach Unterbrechungen (Anruf, App im Hintergrund) weckt die nächste Geste den Ton.
 */
export function installAudioUnlock() {
  if (installed) return;
  installed = true;
  const unlock = () => {
    engine.unlock();
    const ctx = engine.ctx;
    if (!ctx) return;
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (_) { /* egal */ }
    if (!ctx.__lgWatch) {
      ctx.__lgWatch = true;
      ctx.addEventListener?.('statechange', () => { if (engine.ready) music.resumePending(); });
    }
    try { ctx.resume?.().then(() => music.resumePending(), () => {}); } catch (_) { /* egal */ }
    setTimeout(() => { if (engine.ready) music.resumePending(); }, 50);
  };
  for (const ev of ['touchend', 'pointerup', 'mouseup', 'click', 'keydown']) {
    window.addEventListener(ev, unlock, { passive: true, capture: true });
  }
  // zurück aus dem Hintergrund: weiterspielen, sobald es erlaubt ist
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && engine.ctx && engine.ctx.state !== 'running') { try { engine.ctx.resume(); } catch (_) { /* egal */ } }
  });
}

export { engine, sfx, music };

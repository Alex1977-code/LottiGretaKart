// Audio-Fassade: Freischaltung bei der ersten Geste, Effekte, Musik, Stummschaltung.
import { engine } from './AudioEngine.js';
import { sfx, renderSfx, SFX_NAMES, COURSE_SFX } from './sfx.js';
import { music } from './Music.js';

// Test-/Debug-Zugriff auf die Effekte (über window.__audio.engine erreichbar):
// Namen, Kurs-Vertragsnamen, Abspielen und Offline-Rendern zum Vermessen.
engine.effects = { play: sfx, names: SFX_NAMES, course: COURSE_SFX, render: renderSfx };

let installed = false;

/** Richtet die Audio-Freischaltung bei der ersten Nutzergeste ein. */
export function installAudioUnlock() {
  if (installed) return;
  installed = true;
  // iPhone/iPad: Audio-Sitzung „ambient“ – der Stummschalter schaltet das Spiel stumm, andere Musik läuft weiter
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (_) { /* egal */ }
  const unlock = () => {
    engine.unlock();
    const ctx = engine.ctx;
    if (!ctx) return;
    if (!ctx.__lgWatch) {
      ctx.__lgWatch = true;
      ctx.addEventListener?.('statechange', () => { if (engine.ready) music.resumePending(); });
    }
    // resume() ist asynchron: erst danach die wartende Musik starten (und zur Sicherheit noch einmal später)
    try { ctx.resume?.().then(() => music.resumePending(), () => {}); } catch (_) { /* egal */ }
    setTimeout(() => { if (engine.ready) music.resumePending(); }, 50);
    setTimeout(() => { if (engine.ready) music.resumePending(); }, 400);
  };
  for (const ev of ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown']) {
    window.addEventListener(ev, unlock, { passive: true });
  }
}

export { engine, sfx, music };

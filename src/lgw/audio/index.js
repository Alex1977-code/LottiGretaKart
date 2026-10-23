// Audio-Fassade: Freischaltung bei der ersten Geste, Effekte, Musik, Stummschaltung.
import { engine } from './AudioEngine.js';
import { sfx, renderSfx, SFX_NAMES, COURSE_SFX } from './sfx.js';
import { music } from './Music.js';

// Test-/Debug-Zugriff auf die Effekte (über window.__audio.engine erreichbar):
// Namen, Kurs-Vertragsnamen, Abspielen und Offline-Rendern zum Vermessen.
engine.effects = { play: sfx, names: SFX_NAMES, course: COURSE_SFX, render: renderSfx };

let installed = false;
// 0,1 s Stille als WAV (8 kHz, 8 bit, mono) – hält auf dem iPhone die Audio-Sitzung auf „Wiedergabe“
const SILENT_WAV = (() => {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  let s = ''; for (const x of b) s += String.fromCharCode(x);
  return `data:audio/wav;base64,${btoa(s)}`;
})();

/** iPhone/iPad: Ton 'always' (auch bei Stummschalter, Standard) oder 'switch' (Stummschalter macht stumm). */
export function getIosSound() { try { return localStorage.getItem('lgkart.iosSound') ?? 'always'; } catch (_) { return 'always'; } }
export function setIosSound(v) { try { localStorage.setItem('lgkart.iosSound', v); } catch (_) { /* egal */ } }

/** Richtet die Audio-Freischaltung bei der ersten Nutzergeste ein. */
export function installAudioUnlock() {
  if (installed) return;
  installed = true;
  // iPhone/iPad: Audio-Sitzung „playback“ (Ton auch bei Stummschalter) oder „ambient“ (Stummschalter wirkt)
  const always = getIosSound() === 'always';
  try { if (navigator.audioSession) navigator.audioSession.type = always ? 'playback' : 'ambient'; } catch (_) { /* egal */ }
  let primed = false;
  const unlock = () => {
    if (always && !primed) {
      primed = true;
      try {
        const el = document.createElement('audio');
        el.src = SILENT_WAV; el.loop = true; el.setAttribute('playsinline', ''); el.volume = 0.01;
        const p = el.play(); if (p && p.catch) p.catch(() => { primed = false; });
      } catch (_) { /* egal */ }
    }
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

// Ton: Effekte und Eurodance-Musik aus der Lotti-&-Greta-Welt (Web-Audio-Synth, src/lgw/audio), dazu ein
// synthetischer Kart-Motor (zwei Oszillatoren, Tiefpass) für die Spielerin und die Start-Ampel-Töne.

import { engine, sfx as playSfx, music, installAudioUnlock } from '../lgw/audio/index.js';

class GameAudio {
  constructor() {
    installAudioUnlock();
    this.motor = null;
    this.musicName = null;
  }

  get muted() { return engine.muted; }
  toggleMute() { return engine.toggleMuted(); }

  sfx(name) { try { if (engine.ready) playSfx(name); } catch (_) { /* egal */ } }

  play(name) {
    this.musicName = name;
    try { music.play(name); } catch (_) { /* egal */ }
  }

  stopMusic() { this.musicName = null; try { music.stop(); } catch (_) { /* egal */ } }

  /** Energie-Ebene der Musik (Funkelstern, letzte Runde). */
  energy(on) { try { music.setDrums(on); } catch (_) { /* egal */ } }

  beep(freq = 660, duration = 0.18, volume = 0.22) {
    engine.tone({ type: 'square', freq, duration, volume });
    engine.tone({ type: 'triangle', freq: freq * 2, duration, volume: volume * 0.4 });
  }

  /** Kart-Motor: Drehzahl folgt dem Tempo, Turbo macht ihn heller. */
  setMotor(on, speed = 0, top = 25, boost = 0, offroad = false) {
    if (!engine.ready) return;
    const ctx = engine.ctx;
    if (!this.motor && on) {
      const a = ctx.createOscillator(), b = ctx.createOscillator();
      a.type = 'sawtooth'; b.type = 'square';
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 3;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      a.connect(lp); b.connect(lp); lp.connect(gain); gain.connect(engine.sfxBus);
      a.start(); b.start();
      this.motor = { a, b, lp, gain };
    }
    if (!this.motor) return;
    const m = this.motor, t = ctx.currentTime;
    const k = Math.min(1.4, Math.abs(speed) / top);
    const f = 48 + 120 * k + 30 * boost + (offroad ? 6 * Math.sin(t * 40) : 0);
    m.a.frequency.setTargetAtTime(f, t, 0.05);
    m.b.frequency.setTargetAtTime(f * 0.5 + 2, t, 0.05);
    m.lp.frequency.setTargetAtTime(380 + 900 * k + 1200 * boost, t, 0.05);
    m.gain.gain.setTargetAtTime(on ? 0.07 + 0.05 * k : 0, t, 0.08);
  }

  stopMotor() {
    if (!this.motor) return;
    const m = this.motor;
    try {
      m.gain.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.05);
      setTimeout(() => { try { m.a.stop(); m.b.stop(); m.gain.disconnect(); } catch (_) { /* egal */ } }, 300);
    } catch (_) { /* egal */ }
    this.motor = null;
  }
}

export const audio = new GameAudio();

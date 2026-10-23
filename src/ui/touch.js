// Touch-Steuerung (Querformat): linke Bildschirmhälfte = Lenkrad, rechte Hälfte = Knöpfe.
//   GAS (groß, unten rechts) · DRIFT (gibt auch Gas) · ★ Gegenstand · BREMSE/ZURÜCK (halten = bremsen, dann rückwärts)
// Der rechte Daumen darf zwischen den Knöpfen gleiten (z. B. von Gas auf Drift) – es zählt der Knopf unter dem Finger.
// Schreibt in das gemeinsame `touch`-Objekt aus input.js.

import { touch } from './input.js';

export class TouchControls {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="t-steer"><div class="t-wheel"><div class="t-wheel-in"></div></div></div>
      <div class="t-pad">
        <button class="t-btn t-gas" data-k="gas"><span>GAS</span></button>
        <button class="t-btn t-drift" data-k="drift"><span>DRIFT</span></button>
        <button class="t-btn t-item" data-k="item"><span>★</span></button>
        <button class="t-btn t-brake" data-k="brake"><span>BREMSE<br/>ZURÜCK</span></button>
      </div>`;
    this.zone = root.querySelector('.t-steer');
    this.wheel = root.querySelector('.t-wheel');
    this.steerId = null; this.x0 = 0;
    this.onStartTap = null;
    const zone = this.zone;
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touch.active = true;
      const t = e.changedTouches[0];
      this.steerId = t.identifier; this.x0 = t.clientX;
      this.wheel.style.left = `${t.clientX}px`; this.wheel.style.top = `${t.clientY}px`;
      this.wheel.classList.add('on');
      this.onStartTap?.();
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== this.steerId) continue;
        let dx = t.clientX - this.x0;
        const max = 78;
        if (Math.abs(dx) > max) { this.x0 = t.clientX - Math.sign(dx) * max; dx = Math.sign(dx) * max; }
        // kleine Totzone und weiche Kurve: kleine Daumenbewegungen lenken fein, voller Ausschlag voll
        const n = Math.max(0, Math.abs(dx) / max - 0.06) / 0.94;
        touch.steer = -Math.sign(dx) * Math.pow(n, 1.35);
        this.wheel.style.left = `${this.x0}px`;
        this.wheel.firstElementChild.style.transform = `rotate(${dx * 1.3}deg)`;
      }
    }, { passive: false });
    const endSteer = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== this.steerId) continue;
        this.steerId = null; touch.steer = 0;
        this.wheel.classList.remove('on');
        this.wheel.firstElementChild.style.transform = '';
      }
    };
    zone.addEventListener('touchend', endSteer);
    zone.addEventListener('touchcancel', endSteer);
    // Rechte Hälfte: jeder Finger drückt den Knopf, über dem er gerade ist (mit etwas Spielraum)
    this.pad = root.querySelector('.t-pad');
    this.btns = [...root.querySelectorAll('.t-btn')];
    this.fingers = new Map();   // touch-id → Knopf-Schlüssel
    const hit = (x, y) => {
      let best = null, bd = Infinity;
      for (const b of this.btns) {
        if (b.offsetParent === null) continue;   // ausgeblendet (z. B. GAS bei Automatik)
        const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(x - cx, y - cy) - r.width / 2;
        if (d < 26 && d < bd) { bd = d; best = b.dataset.k; }
      }
      return best;
    };
    const sync = () => {
      const held = new Set(this.fingers.values());
      for (const b of this.btns) {
        const k = b.dataset.k, on = held.has(k);
        if (on && !touch[k]) { if (k === 'item') touch.itemTap = true; if (k === 'drift') touch.driftTap = true; }
        touch[k] = on;
        b.classList.toggle('down', on);
      }
    };
    const down = (e) => {
      e.preventDefault(); touch.active = true;
      for (const t of e.changedTouches) this.fingers.set(t.identifier, hit(t.clientX, t.clientY));
      sync(); this.onStartTap?.();
    };
    const move = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (this.fingers.has(t.identifier)) this.fingers.set(t.identifier, hit(t.clientX, t.clientY));
      sync();
    };
    const up = (e) => { e.preventDefault(); for (const t of e.changedTouches) this.fingers.delete(t.identifier); sync(); };
    this.pad.addEventListener('touchstart', down, { passive: false });
    this.pad.addEventListener('touchmove', move, { passive: false });
    this.pad.addEventListener('touchend', up, { passive: false });
    this.pad.addEventListener('touchcancel', up, { passive: false });
    this.setAutoGas(touch.autoGas);
  }

  setAutoGas(on) {
    touch.autoGas = on;
    this.root.classList.toggle('manual-gas', !on);
  }

  show(on) {
    this.root.classList.toggle('visible', on);
    if (!on) { touch.steer = 0; touch.drift = touch.item = touch.brake = touch.gas = false; this.fingers?.clear(); for (const b of this.btns ?? []) b.classList.remove('down'); }
  }
}

// Touch-Steuerung (Querformat): linke Bildschirmhälfte = Lenkrad, rechts runde Knöpfe.
// Schreibt in das gemeinsame `touch`-Objekt aus input.js.

import { touch } from './input.js';

export class TouchControls {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="t-steer"><div class="t-wheel"><div class="t-wheel-in"></div></div></div>
      <button class="t-btn t-drift" data-k="drift"><span>DRIFT</span></button>
      <button class="t-btn t-item" data-k="item"><span>★</span></button>
      <button class="t-btn t-brake" data-k="brake"><span>BREMSE</span></button>
      <button class="t-btn t-gas" data-k="gas"><span>GAS</span></button>`;
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
        const max = 70;
        if (Math.abs(dx) > max) { this.x0 = t.clientX - Math.sign(dx) * max; dx = Math.sign(dx) * max; }
        touch.steer = -dx / max;
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
    for (const b of root.querySelectorAll('.t-btn')) {
      const k = b.dataset.k;
      const on = (e) => {
        e.preventDefault(); touch.active = true; touch[k] = true; b.classList.add('down'); this.onStartTap?.();
        if (k === 'item') touch.itemTap = true;
        if (k === 'drift') touch.driftTap = true;
      };
      const off = (e) => { e.preventDefault(); touch[k] = false; b.classList.remove('down'); };
      b.addEventListener('touchstart', on, { passive: false });
      b.addEventListener('touchend', off, { passive: false });
      b.addEventListener('touchcancel', off, { passive: false });
    }
    this.setAutoGas(touch.autoGas);
  }

  setAutoGas(on) {
    touch.autoGas = on;
    this.root.classList.toggle('manual-gas', !on);
  }

  show(on) {
    this.root.classList.toggle('visible', on);
    if (!on) { touch.steer = 0; touch.drift = touch.item = touch.brake = touch.gas = false; }
  }
}

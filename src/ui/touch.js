// Touch-Steuerung (Querformat): linke Bildschirmhälfte = Lenkrad, rechte Hälfte = Knöpfe – mit mehreren Fingern
// gleichzeitig (links lenken, rechts Gas/Gegenstand/Bremse).
//   GAS (groß, unten rechts) · ★ Gegenstand · BREMSE/ZURÜCK (halten = bremsen, dann rückwärts)
//   Driften durch „Pumpen“: Gas – loslassen – Gas in schneller Folge. Der zweite schnelle Druck lässt das Kart hüpfen
//   und driften; danach einfach Gas halten (oder weiter pumpen) und in Ruhe lenken. Gas länger loslassen beendet den
//   Drift mit Mini-Turbo.
//   Mit Automatik-Gas gibt es stattdessen einen DRIFT-Knopf.
// Ein Finger gehört der Hälfte, in der er aufgesetzt wurde. Alle Finger werden bei jedem Touch-Ereignis aus
// e.touches neu gelesen – so bremst kein Finger den anderen aus und kein Finger bleibt „hängen“.
// Schreibt in das gemeinsame `touch`-Objekt aus input.js.

import { touch } from './input.js';

const PUMP_GAP = 0.36;   // s: so kurz loslassen und wieder drücken = Pumpen
const STEER_MAX = 92;    // px Daumenweg für vollen Lenkausschlag

export class TouchControls {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="t-steer"><div class="t-wheel"><div class="t-wheel-in"></div></div></div>
      <div class="t-pad">
        <button class="t-btn t-gas" data-k="gas"><span>GAS<small>2× tippen + halten = Drift</small></span></button>
        <button class="t-btn t-drift" data-k="drift"><span>DRIFT</span></button>
        <button class="t-btn t-item" data-k="item"><span>★</span></button>
        <button class="t-btn t-brake" data-k="brake"><span>BREMSE<br/>ZURÜCK</span></button>
      </div>`;
    this.wheel = root.querySelector('.t-wheel');
    this.btns = [...root.querySelectorAll('.t-btn')];
    this.gasBtn = root.querySelector('.t-gas');
    this.onStartTap = null;
    this.steerId = null; this.x0 = 0;
    this.fingers = new Map();   // touch-id → Knopf-Schlüssel (rechte Hälfte)
    this.gasUp = -1;

    const ev = (fn) => (e) => { if (e.cancelable) e.preventDefault(); fn(e); };
    root.addEventListener('touchstart', ev((e) => {
      touch.active = true;
      let pad = false;
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth / 2) {
          this.steerId = t.identifier; this.x0 = t.clientX;
          this.wheel.style.left = `${t.clientX}px`; this.wheel.style.top = `${t.clientY}px`;
          this.wheel.classList.add('on');
          this.steerTo(t.clientX);
        } else {
          this.fingers.set(t.identifier, null);
          pad = true;
        }
      }
      this.read(e);
      // Startturbo zählt nur ein Druck auf die Knöpfe (Gas/Drift), nicht das Lenkrad
      if (pad) this.onStartTap?.();
    }), { passive: false });
    root.addEventListener('touchmove', ev((e) => this.read(e)), { passive: false });
    const end = ev((e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.steerId) this.releaseSteer();
        this.fingers.delete(t.identifier);
      }
      this.read(e);
    });
    root.addEventListener('touchend', end, { passive: false });
    root.addEventListener('touchcancel', end, { passive: false });
    // iOS: keine Zoom-Geste, wenn zwei Daumen gleichzeitig drücken
    for (const g of ['gesturestart', 'gesturechange']) root.addEventListener(g, (e) => e.preventDefault(), { passive: false });
    this.setAutoGas(touch.autoGas);
  }

  /** Alle Finger aus e.touches übernehmen (auch die, die sich in diesem Ereignis nicht bewegt haben). */
  read(e) {
    const live = new Map();
    for (const t of e.touches) live.set(t.identifier, t);
    if (this.steerId !== null) {
      const t = live.get(this.steerId);
      if (t) this.steerTo(t.clientX); else this.releaseSteer();
    }
    for (const id of [...this.fingers.keys()]) {
      const t = live.get(id);
      if (t) this.fingers.set(id, this.hit(t.clientX, t.clientY)); else this.fingers.delete(id);
    }
    this.sync();
  }

  steerTo(x) {
    let dx = x - this.x0;
    if (Math.abs(dx) > STEER_MAX) { this.x0 = x - Math.sign(dx) * STEER_MAX; dx = Math.sign(dx) * STEER_MAX; }
    // kleine Totzone und weiche Kurve: kleine Daumenbewegungen lenken fein, voller Ausschlag voll
    const n = Math.max(0, Math.abs(dx) / STEER_MAX - 0.06) / 0.94;
    touch.steer = -Math.sign(dx) * Math.pow(n, 1.6);
    touch.steerLin = -Math.sign(dx) * n;   // linear: Drift-Richtung und Drift-Bogen
    touch.steerId = this.steerId;
    this.wheel.style.left = `${this.x0}px`;
    this.wheel.firstElementChild.style.transform = `rotate(${dx * 1.3}deg)`;
  }

  releaseSteer() {
    this.steerId = null; touch.steer = 0; touch.steerLin = 0; touch.steerId = null;
    this.wheel.classList.remove('on');
    this.wheel.firstElementChild.style.transform = '';
  }

  /** Knopf unter dem Finger (mit etwas Spielraum) – der Daumen darf zwischen den Knöpfen gleiten. */
  hit(x, y) {
    let best = null, bd = Infinity;
    for (const b of this.btns) {
      if (b.offsetParent === null) continue;   // ausgeblendet (z. B. GAS bei Automatik)
      const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy) - r.width / 2;
      if (d < 26 && d < bd) { bd = d; best = b.dataset.k; }
    }
    return best;
  }

  sync() {
    const held = new Set(this.fingers.values());
    const now = performance.now() / 1000;
    for (const b of this.btns) {
      const k = b.dataset.k, on = held.has(k);
      if (on && !touch[k]) {
        if (k === 'item') touch.itemTap = true;
        if (k === 'drift') touch.driftTap = true;
        if (k === 'gas') this.gasDown(now);
      }
      if (!on && touch[k] && k === 'gas') this.gasRelease(now);
      touch[k] = on;
      b.classList.toggle('down', on);
    }
  }

  gasDown(now) {
    const pumped = now - this.gasUp < PUMP_GAP;
    if (touch.driftUntil > now || pumped) {
      // schnell wieder gedrückt: Drift beginnt (Hüpfer) bzw. geht weiter
      touch.driftTap = true;   // jedes Pumpen kann einen Drift (neu) starten
      touch.driftUntil = now + PUMP_GAP;
      touch.driftHold = true;   // ab jetzt hält Gas-Halten den Drift
      this.watchDrift();
    }
  }

  gasRelease(now) {
    this.gasUp = now;
    // beim Loslassen kurz weiterrollen (sonst bremst das Kart zwischen zwei Gas-Stößen)
    touch.coastUntil = now + PUMP_GAP;
    if (touch.driftUntil > now) touch.driftUntil = now + PUMP_GAP;
  }

  /** Gas-Knopf blau, solange gedriftet wird. */
  watchDrift() {
    this.gasBtn.classList.add('drifting');
    if (this.driftRaf) return;
    const tick = () => {
      if (touch.driftUntil > performance.now() / 1000) { this.driftRaf = requestAnimationFrame(tick); return; }
      this.driftRaf = 0; this.gasBtn.classList.remove('drifting');
    };
    this.driftRaf = requestAnimationFrame(tick);
  }

  setAutoGas(on) {
    touch.autoGas = on;
    this.root.classList.toggle('manual-gas', !on);
  }

  show(on) {
    this.root.classList.toggle('visible', on);
    if (!on) {
      this.releaseSteer();
      touch.drift = touch.item = touch.brake = touch.gas = false;
      touch.coastUntil = touch.driftUntil = 0; touch.driftHold = false;
      this.fingers.clear();
      for (const b of this.btns) b.classList.remove('down', 'drifting');
    }
  }
}

// Renn-Anzeige (DOM über der 3D-Leinwand): Runde, Zeit, Gegenstand mit Glücksrad, Bitcoins, Platz, Minikarte,
// Countdown und Einblendungen.

import { ITEMS, ITEM_IDS } from '../game/items.js';
import { itemIcon } from './icons.js';
import { RACERS } from '../game/racers.js';

export const fmtTime = (s) => {
  if (!isFinite(s)) return '--:--.--';
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r.toFixed(2).padStart(5, '0')}`;
};
const PLACE_COLORS = ['#ffc21a', '#d6dbe8', '#e0905a', '#8fd468', '#8fd468', '#8fd468', '#8fd468', '#8fd468'];

export class Hud {
  constructor(root, renderer) {
    this.root = root;
    this.renderer = renderer;
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-tl">
        <div class="hud-lap"><small>RUNDE</small> <b class="lap">1</b><i>/<span class="laps">3</span></i></div>
        <div class="hud-time">0:00.00</div>
      </div>
      <div class="hud-item"><div class="slot"><img alt="" /><span class="badge"></span></div></div>
      <div class="hud-bl"><div class="hud-coins"><span class="coin-ic">₿</span> <b class="coins">0</b></div></div>
      <div class="hud-br"><canvas class="minimap" width="220" height="220"></canvas><div class="hud-place"><b>8</b><small>.</small></div></div>
      <div class="hud-center"><div class="countdown"></div><div class="message"></div></div>
      <div class="hud-wrong">FALSCHE RICHTUNG!</div>`;
    root.appendChild(this.el);
    this.q = (s) => this.el.querySelector(s);
    this.lapEl = this.q('.lap'); this.lapsEl = this.q('.laps'); this.timeEl = this.q('.hud-time');
    this.itemImg = this.q('.hud-item img'); this.badge = this.q('.hud-item .badge'); this.slot = this.q('.hud-item .slot');
    this.coinsEl = this.q('.coins'); this.placeEl = this.q('.hud-place');
    this.countEl = this.q('.countdown'); this.msgEl = this.q('.message'); this.wrongEl = this.q('.hud-wrong');
    this.map = this.q('.minimap'); this.mctx = this.map.getContext('2d');
    this.msgT = 0;
    this.rollT = 0; this.rollIdx = 0;
    this.lastItem = null;
    this.colors = Object.fromEntries(RACERS.map((r) => [r.id, r.color]));
  }

  show(on) { this.el.classList.toggle('visible', on); }

  setupMap(track) {
    this.track = track;
    const W = this.map.width, H = this.map.height;
    this.mt = track.mapTransform(W, H, 16);
    // Strecke einmal vorzeichnen
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';
    const path = () => {
      c.beginPath();
      for (let i = 0; i <= track.N; i += 2) {
        const k = i % track.N;
        const [x, y] = this.mt.map(track.px[k], track.pz[k]);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    };
    path(); c.strokeStyle = 'rgba(20,16,40,0.55)'; c.lineWidth = 15; c.stroke();
    path(); c.strokeStyle = '#fff8ee'; c.lineWidth = 9; c.stroke();
    path(); c.strokeStyle = '#a6a3b8'; c.lineWidth = 6; c.stroke();
    const [sx, sy] = this.mt.map(track.px[0], track.pz[0]);
    c.fillStyle = '#2a2834'; c.fillRect(sx - 5, sy - 5, 10, 10);
    c.fillStyle = '#fff'; c.fillRect(sx - 5, sy - 5, 5, 5); c.fillRect(sx, sy, 5, 5);
    this.mapBg = off;
  }

  message(text, dur = 1.6, cls = '') {
    this.msgEl.textContent = text;
    this.msgEl.className = `message show ${cls}`;
    this.msgT = dur;
  }

  countdown(text, cls = '') {
    this.countEl.textContent = text;
    this.countEl.className = `countdown ${text ? 'show' : ''} ${cls}`;
    // Animation neu starten
    void this.countEl.offsetWidth;
  }

  update(dt, race) {
    const p = race.player;
    if (!p) return;
    this.lapsEl.textContent = race.laps;
    this.lapEl.textContent = Math.max(1, Math.min(race.laps, p.lap));
    this.timeEl.textContent = fmtTime(p.finished ? p.finishTime : race.time);
    this.coinsEl.textContent = p.coins;
    this.coinsEl.parentElement.classList.toggle('full', p.coins >= 10);
    const pl = p.place;
    this.placeEl.innerHTML = `<b>${pl}</b><small>.</small>`;
    this.placeEl.style.color = PLACE_COLORS[pl - 1] ?? '#fff';
    // Gegenstand / Glücksrad
    if (p.roulette > 0) {
      this.rollT -= dt;
      if (this.rollT <= 0) {
        this.rollT = 0.07;
        this.rollIdx = (this.rollIdx + 1) % ITEM_IDS.length;
        this.itemImg.src = itemIcon(this.renderer, ITEMS[ITEM_IDS[this.rollIdx]].icon ?? ITEM_IDS[this.rollIdx]);
        if (Math.random() < 0.5) race.audio.sfx('step');
      }
      this.slot.classList.add('rolling', 'filled');
      this.badge.textContent = '';
      this.lastItem = '?';
    } else if (p.item) {
      const id = p.item.id, def = ITEMS[id];
      const key = `${id}:${p.item.charges}`;
      if (key !== this.lastItem) {
        this.itemImg.src = itemIcon(this.renderer, def.icon ?? id);
        this.badge.textContent = p.item.charges > 1 ? `×${p.item.charges}` : '';
        this.slot.classList.remove('rolling');
        this.slot.classList.add('filled', 'pop');
        setTimeout(() => this.slot.classList.remove('pop'), 300);
        this.lastItem = key;
      }
    } else if (this.lastItem !== null) {
      this.itemImg.removeAttribute('src');
      this.badge.textContent = '';
      this.slot.classList.remove('rolling', 'filled');
      this.lastItem = null;
    }
    // Einblendungen
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.msgEl.className = 'message'; }
    this.wrongEl.classList.toggle('show', p.wrongWayT > 1.2 && race.state === 'race');
    this.drawMap(race);
  }

  drawMap(race) {
    if (!this.mapBg) return;
    const c = this.mctx, W = this.map.width, H = this.map.height;
    c.clearRect(0, 0, W, H);
    c.drawImage(this.mapBg, 0, 0);
    // Geschosse/Gefahren als kleine Punkte
    for (const pr of race.items.projectiles) {
      const [x, y] = this.mt.map(pr.pos.x, pr.pos.z);
      c.fillStyle = pr.kind === 'zauberkugel' ? '#3ae0d0' : pr.kind === 'kaefer' ? '#e8392d' : '#fff';
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }
    // Fahrer (Spielerin zuletzt, größer)
    const list = [...race.racers].sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
    for (const r of list) {
      const [x, y] = this.mt.map(r.pos.x, r.pos.z);
      const rad = r.isPlayer ? 8 : 5.5;
      c.beginPath(); c.arc(x, y, rad + 2, 0, Math.PI * 2); c.fillStyle = r.isPlayer ? '#fff' : 'rgba(20,16,40,0.8)'; c.fill();
      c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fillStyle = this.colors[r.id] ?? '#fff'; c.fill();
    }
  }

  dispose() { this.el.remove(); }
}

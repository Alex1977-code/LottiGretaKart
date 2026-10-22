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
const pointXZ = (tr, s) => { const p = tr.pointAtS(s, 0); return [p.x, p.z]; };
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
      <div class="hud-br"><canvas class="minimap" width="240" height="185"></canvas><div class="hud-place"><b>8</b><small>.</small></div></div>
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

  /** Karte: ganze Insel (einmal je Welt gezeichnet), darüber der Rennpfad dieses Rennens. */
  setupMap(race) {
    const world = race.world;
    const W = this.map.width, H = this.map.height;
    const b = world.def.bounds;
    const s = Math.min(W / (b.maxX - b.minX), H / (b.maxZ - b.minZ));
    const ox = (W - (b.maxX - b.minX) * s) / 2, oz = (H - (b.maxZ - b.minZ) * s) / 2;
    this.mt = { s, map: (x, z) => [ox + (x - b.minX) * s, oz + (z - b.minZ) * s] };
    if (!world.mapCanvas || world.mapCanvas.width !== W) {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const c = off.getContext('2d');
      const img = c.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const wx = b.minX + (x - ox) / s, wz = b.minZ + (y - oz) / s, h = world.heightAt(wx, wz);
        const i = (y * W + x) * 4;
        let col;
        if (h < -2.5) col = [0, 0, 0, 0];
        else if (h < 0) col = [90, 170, 240, 200];
        else if (h < 1.2) col = [240, 225, 170, 235];
        else { const k = Math.min(1, h / 40); col = [110 + 90 * k, 200 - 50 * k, 90 + 50 * k, 235]; }
        img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = col[3];
      }
      c.putImageData(img, 0, 0);
      c.lineJoin = 'round'; c.lineCap = 'round';
      for (const tr of world.roads) {
        c.beginPath();
        for (let i = 0; i <= tr.N; i += 3) {
          const k = Math.min(i, tr.N - 1) % tr.N;
          const [x, y] = this.mt.map(tr.px[k], tr.pz[k]);
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        if (tr.closed) c.closePath();
        c.strokeStyle = 'rgba(255,248,238,0.95)'; c.lineWidth = 3; c.stroke();
      }
      world.mapCanvas = off;
    }
    // Rennpfad hervorheben
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');
    c.drawImage(world.mapCanvas, 0, 0);
    const tr = race.track;
    if (tr) {
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < tr.N; i += 3) { const [x, y] = this.mt.map(tr.px[i], tr.pz[i]); if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.strokeStyle = 'rgba(42,30,62,0.6)'; c.lineWidth = 6; c.stroke();
      c.strokeStyle = '#ffc21a'; c.lineWidth = 3.5; c.stroke();
      const [fx, fy] = this.mt.map(...pointXZ(tr, tr.finishS));
      c.fillStyle = '#2a2834'; c.fillRect(fx - 4, fy - 4, 8, 8);
      c.fillStyle = '#fff'; c.fillRect(fx - 4, fy - 4, 4, 4); c.fillRect(fx, fy, 4, 4);
      for (const cp of tr.checkpoints) { const [x, y] = this.mt.map(...pointXZ(tr, cp.s)); c.fillStyle = '#e8392d'; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
    }
    this.mapBg = off;
    this.race = race;
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

  /** p = der Fahrer dieser Anzeige (im geteilten Bildschirm je Spieler eine Anzeige). */
  update(dt, race, p = race.player) {
    if (!p) return;
    this.me = p;
    // Runde / Anfahrt / Checkpoint / Sternmünzen
    let lapHtml;
    if (race.free) {
      const got = race.starCoins.filter((c) => c.got).length;
      lapHtml = `<small>STERNE</small> <b>${got}</b><i>/${race.starCoins.length}</i>`;
    } else if (race.ko) {
      const tr = race.track, n = tr.checkpoints.length;
      lapHtml = `<small>CHECKPOINT</small> <b>${Math.min(n, p.cp ?? 0)}</b><i>/${n}</i><span class="sub">noch ${race.active().length} im Rennen</span>`;
    } else {
      const route = race.track.lapMarks.length && p.progress < race.track.lapMarks[0] && race.track.label.includes('→');
      lapHtml = `<small>RUNDE</small> <b>${Math.max(1, Math.min(race.laps, p.lap))}</b><i>/${race.laps}</i>${route ? '<span class="sub">Anfahrt</span>' : ''}`;
    }
    if (lapHtml !== this.lapHtml) { this.lapHtml = lapHtml; this.q('.hud-lap').innerHTML = lapHtml; }
    this.timeEl.textContent = fmtTime(p.finished ? p.finishTime : race.time);
    this.coinsEl.textContent = p.coins;
    this.coinsEl.parentElement.classList.toggle('full', p.coins >= 10);
    const pl = p.place;
    this.placeEl.style.visibility = race.free ? 'hidden' : 'visible';
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
    this.wrongEl.classList.toggle('show', p.wrongWayT > 1.2 && race.state === 'race' && !p.finished);
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
    // Sternmünzen (Freie Fahrt)
    if (race.free) for (const sc of race.starCoins) {
      if (sc.got) continue;
      const [x, y] = this.mt.map(sc.x, sc.z);
      c.fillStyle = '#8fe060'; c.beginPath(); c.arc(x, y, 2.5, 0, Math.PI * 2); c.fill();
    }
    // Fahrer (eigener zuletzt und am größten, andere Menschen mittel)
    const me = this.me ?? race.player;
    const rank = (r) => (r === me ? 2 : r.isPlayer ? 1 : 0);
    const list = race.racers.filter((r) => !r.out).sort((a, b) => rank(a) - rank(b));
    for (const r of list) {
      const [x, y] = this.mt.map(r.pos.x, r.pos.z);
      const rad = r === me ? 8 : r.isPlayer ? 6.5 : 5.5;
      c.beginPath(); c.arc(x, y, rad + 2, 0, Math.PI * 2); c.fillStyle = r === me ? '#fff' : r.isPlayer ? '#ffd400' : 'rgba(20,16,40,0.8)'; c.fill();
      c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fillStyle = this.colors[r.id] ?? '#fff'; c.fill();
    }
  }

  dispose() { this.el.remove(); }
}

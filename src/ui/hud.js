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
      <div class="hud-br"><canvas class="minimap" width="300" height="300"></canvas><div class="hud-place"><b>8</b><small>.</small></div></div>
      <div class="hud-dir"><i></i><span>Hier entlang</span></div>
      <div class="hud-intro"><small class="cup"></small><b class="name"></b><span class="laps-info"></span></div>
      <div class="hud-center"><div class="hud-lights"><i></i><i></i><i></i></div><div class="countdown"></div><div class="message"></div><div class="hud-tip"></div></div>
      <div class="hud-wrong">FALSCHE RICHTUNG!</div>
      <div class="hud-wet">${'<i></i>'.repeat(22)}<b>PLATSCH!</b></div>`;
    root.appendChild(this.el);
    this.q = (s) => this.el.querySelector(s);
    this.lapEl = this.q('.lap'); this.lapsEl = this.q('.laps'); this.timeEl = this.q('.hud-time');
    this.itemImg = this.q('.hud-item img'); this.badge = this.q('.hud-item .badge'); this.slot = this.q('.hud-item .slot');
    this.coinsEl = this.q('.coins'); this.placeEl = this.q('.hud-place');
    this.countEl = this.q('.countdown'); this.msgEl = this.q('.message'); this.wrongEl = this.q('.hud-wrong');
    this.lightsEl = this.q('.hud-lights'); this.lamps = [...this.lightsEl.children]; this.tipEl = this.q('.hud-tip');
    this.introEl = this.q('.hud-intro');
    this.wetEl = this.q('.hud-wet');
    this.map = this.q('.minimap'); this.mctx = this.map.getContext('2d');
    this.dirEl = this.q('.hud-dir'); this.dirArrow = this.q('.hud-dir i');
    // Antippen/Klicken der Karte: zwischen Nahkarte (dreht mit) und ganzer Insel wechseln
    this.mapMode = 'near';
    const toggle = (e) => { e.preventDefault(); e.stopPropagation(); this.mapMode = this.mapMode === 'near' ? 'island' : 'near'; this.el.classList.toggle('map-island', this.mapMode === 'island'); };
    this.map.addEventListener('pointerdown', toggle);
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

  /**
   * Start-Ampel oben in der Mitte (wie Lakitus Ampel): phase 3/2/1 = eine, zwei, drei rote Lampen, 0 = alle grün,
   * -1 = Ampel erscheint (alle aus), null = ausblenden. tip: kleiner Hinweis darunter (Turbostart).
   */
  lights(phase, tip = '') {
    this.el.classList.toggle('counting', phase !== null);
    if (phase === null) { this.lightsEl.className = 'hud-lights'; this.tipEl.classList.remove('show'); return; }
    const on = phase === 0 ? 3 : phase > 0 ? 4 - phase : 0;
    this.lamps.forEach((l, i) => { l.className = i < on ? (phase === 0 ? 'go' : 'red') : ''; });
    this.lightsEl.className = `hud-lights show ${phase === 0 ? 'go' : ''}`;
    if (tip) this.tipEl.textContent = tip;
    this.tipEl.classList.toggle('show', !!tip && phase !== 0);
  }

  /** Nass gespritzt: Wassertropfen auf dem Bildschirm, die langsam herunterlaufen und verblassen. */
  wet(sec = 2.6) {
    for (const d of this.wetEl.querySelectorAll('i')) {
      const s = 26 + Math.random() * 70;
      d.style.cssText = `left:${Math.random() * 96}%;top:${Math.random() * 80}%;width:${s}px;height:${s * (1 + Math.random() * 0.35)}px;animation-delay:${(Math.random() * 0.25).toFixed(2)}s;animation-duration:${(sec * (0.7 + Math.random() * 0.4)).toFixed(2)}s`;
    }
    this.wetEl.classList.remove('show');
    void this.wetEl.offsetWidth;
    this.wetEl.classList.add('show');
    clearTimeout(this.wetTimer);
    this.wetTimer = setTimeout(() => this.wetEl.classList.remove('show'), sec * 1000 + 400);
  }

  /** Vorstellung vor dem Start: übrige Anzeigen ausblenden, Streckenname groß zeigen. */
  intro(on, { name = '', cup = '', laps = '' } = {}) {
    this.el.classList.toggle('intro', on);
    if (on) {
      this.introEl.querySelector('.name').textContent = name;
      this.introEl.querySelector('.cup').textContent = cup;
      this.introEl.querySelector('.laps-info').textContent = laps;
    }
  }

  /** p = der Fahrer dieser Anzeige (im geteilten Bildschirm je Spieler eine Anzeige). */
  update(dt, race, p = race.player) {
    if (!p) return;
    this.me = p;
    // Runde
    const lapHtml = `<small>RUNDE</small> <b>${Math.max(1, Math.min(race.laps, p.lap))}</b><i>/${race.laps}</i>`;
    if (lapHtml !== this.lapHtml) { this.lapHtml = lapHtml; this.q('.hud-lap').innerHTML = lapHtml; }
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
    this.wrongEl.classList.toggle('show', p.wrongWayT > 1.2 && race.state === 'race' && !p.finished);
    this.updateDir(race, p);
    this.drawMap(race);
  }

  /** Richtungspfeil: zeigt zum Rennpfad ein Stück voraus, wenn eine Kurve kommt oder das Kart abseits steht. */
  updateDir(race, p) {
    const tr = p.path;
    let show = false, ang = 0;
    if (tr && !p.finished && (race.state === 'race' || race.state === 'countdown')) {
      const i = p.loc.i, off = Math.abs(p.loc.lat) > tr.hw[i] + 2;
      const a = tr.pointAtS(Math.min(tr.finishS ?? Infinity, p.progress + (off ? 18 : 40)), 0);
      const want = Math.atan2(-(a.z - p.pos.z), a.x - p.pos.x);
      let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      ang = d;
      show = off || Math.abs(d) > 0.6;
    }
    this.dirEl.classList.toggle('show', show && p.wrongWayT <= 1.2);
    if (show) this.dirArrow.style.transform = `rotate(${(-ang * 180) / Math.PI}deg)`;
  }

  drawMap(race) {
    // Karte nur jedes zweite Bild neu zeichnen (spart viel Zeichenarbeit, sieht gleich aus)
    this.mapFrame = (this.mapFrame ?? 0) + 1;
    if (this.mapFrame & 1) return;
    if (this.mapMode === 'near') { this.drawNearMap(race); return; }
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

  /**
   * Nahkarte: Ausschnitt um den eigenen Fahrer (≈ 320 m), Fahrtrichtung zeigt nach oben. Alle Straßen grau,
   * der Rennpfad gelb mit Pfeilen nach vorn, Ziel und Checkpoints, Wasser und Lava, Gegner als Punkte.
   */
  drawNearMap(race) {
    const c = this.mctx, W = this.map.width, H = this.map.height, me = this.me ?? race.player;
    if (!me) return;
    const R = 160, s = (W / 2) / R;   // Meter im Radius
    c.clearRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 3, 0, Math.PI * 2); c.closePath();
    c.fillStyle = 'rgba(70, 150, 70, 0.78)'; c.fill();
    c.clip();
    // Welt → Karte: verschieben, drehen (Fahrtrichtung oben), skalieren
    c.translate(W / 2, H / 2);
    c.rotate(-Math.PI / 2 + me.yaw);   // Blickrichtung (cos yaw, −sin yaw) zeigt nach oben
    c.scale(s, s);
    c.translate(-me.pos.x, -me.pos.z);
    const P = (x, z) => [x, z];        // Draufsicht: x nach rechts (Osten), z nach unten (Süden)
    const world = race.world, near = (x, z) => (x - me.pos.x) * (x - me.pos.x) + (z - me.pos.z) * (z - me.pos.z) < R * R * 2.25;
    // Wasser und Lava
    for (const l of world.def.lakes) { if (!near(l.x, l.z) && Math.hypot(l.x - me.pos.x, l.z - me.pos.z) > R + l.r) continue; c.fillStyle = 'rgba(80,160,240,0.9)'; c.beginPath(); c.arc(...P(l.x, l.z), l.r, 0, Math.PI * 2); c.fill(); }
    for (const l of world.lava ?? []) { if (!near(l.x, l.z)) continue; c.fillStyle = '#ff6a1a'; c.beginPath(); c.arc(...P(l.x, l.z), l.r, 0, Math.PI * 2); c.fill(); }
    // alle Straßen
    c.lineCap = 'round'; c.lineJoin = 'round';
    const mx = me.pos.x, mz = me.pos.z, RR = R * 1.5;
    for (let ri = 0; ri < world.roads.length; ri++) {
      const tr = world.roads[ri], bb = tr.bounds;
      // Straßen weit weg gar nicht erst durchgehen
      if (bb && (mx < bb.minX - RR || mx > bb.maxX + RR || mz < bb.minZ - RR || mz > bb.maxZ + RR)) continue;
      c.beginPath();
      let pen = false;
      for (let i = 0; i < tr.N; i += 3) {
        if (!near(tr.px[i], tr.pz[i])) { pen = false; continue; }
        const x = tr.px[i], y = tr.pz[i];
        if (pen) c.lineTo(x, y); else c.moveTo(x, y);
        pen = true;
      }
      c.strokeStyle = 'rgba(250,246,238,0.95)'; c.lineWidth = Math.max(5, tr.hw[0] * 2); c.stroke();
    }
    // Rennpfad: hinter dem Fahrer blass, voraus gelb mit Pfeilen
    const tr = me.path;
    if (tr) {
      const i0 = me.loc.i ?? 0;
      const seg = (a, b, col, w) => {
        c.beginPath();
        for (let i = a; i <= b; i += 2) { const k = Math.max(0, Math.min(tr.N - 1, i)); const x = tr.px[k], y = tr.pz[k]; if (i === a) c.moveTo(x, y); else c.lineTo(x, y); }
        c.strokeStyle = col; c.lineWidth = w; c.stroke();
      };
      const ahead = Math.round(R * 1.4 / tr.ds);
      seg(Math.max(0, i0 - Math.round(60 / tr.ds)), i0, 'rgba(255,212,0,0.45)', 5);
      seg(i0, Math.min(tr.N - 1, i0 + ahead), '#ffd400', 6);
      // Pfeile alle 40 m
      c.fillStyle = '#e60012';
      for (let d = 25; d < R * 1.4; d += 40) {
        const k = Math.min(tr.N - 2, i0 + Math.round(d / tr.ds));
        const [x, y] = P(tr.px[k], tr.pz[k]);
        const ang = Math.atan2(tr.tz[k], tr.tx[k]);
        c.save(); c.translate(x, y); c.rotate(ang);
        c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -5); c.lineTo(-2, 0); c.lineTo(-4, 5); c.closePath(); c.fill();
        c.restore();
      }
      // Ziel
      const mark = (S, col) => { const q = tr.pointAtS(S, 0); if (!near(q.x, q.z)) return; const [x, y] = P(q.x, q.z); c.fillStyle = '#fff'; c.fillRect(x - 6, y - 6, 12, 12); c.fillStyle = col; c.fillRect(x - 6, y - 6, 6, 6); c.fillRect(x, y, 6, 6); };
      mark(tr.finishS, '#222');
    }
    // andere Fahrer
    for (const r of race.racers) {
      if (r.out || r.parked || r === me || !near(r.pos.x, r.pos.z)) continue;
      const [x, y] = P(r.pos.x, r.pos.z);
      c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fillStyle = r.isPlayer ? '#ffd400' : 'rgba(20,16,40,0.85)'; c.fill();
      c.beginPath(); c.arc(x, y, 4.2, 0, Math.PI * 2); c.fillStyle = this.colors[r.id] ?? '#fff'; c.fill();
    }
    c.restore();
    // eigenes Kart: Pfeil in der Mitte, nach oben
    c.save(); c.translate(W / 2, H / 2);
    c.beginPath(); c.moveTo(0, -16); c.lineTo(11, 12); c.lineTo(0, 6); c.lineTo(-11, 12); c.closePath();
    c.fillStyle = this.colors[me.id] ?? '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); c.fill();
    c.restore();
    // Rand und Norden-Hinweis
    c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 3, 0, Math.PI * 2); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 5; c.stroke();
    c.font = 'bold 22px sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center';
    const na = -Math.PI + me.yaw;   // Norden (−z) auf der gedrehten Karte
    c.fillText('N', W / 2 + Math.cos(na) * (W / 2 - 22), H / 2 + Math.sin(na) * (W / 2 - 22) + 8);
  }

  dispose() { this.el.remove(); }
}

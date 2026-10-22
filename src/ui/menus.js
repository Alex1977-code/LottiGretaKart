// Menüs (DOM): Titel, Modus, Fahrer-Auswahl, Cup/Strecke, Ergebnisse, Grand-Prix-Wertung, Pause, Einstellungen.
// Im Hintergrund fährt ein Demo-Rennen der Computer-Fahrer.

import { RACERS, RACER_BY_ID } from '../game/racers.js';
import { TRACKS, TRACK_BY_ID, CUPS } from '../tracks/index.js';
import { CC } from '../game/Race.js';
import { Ceremony } from '../game/Ceremony.js';
import { Track } from '../world/Track.js';
import { getTheme } from '../world/themes.js';
import { racerIcon, preloadIcons } from './icons.js';
import { fmtTime } from './hud.js';
import { touch, isTouch } from './input.js';

const POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
const STAT_NAMES = { speed: 'Tempo', accel: 'Beschleunigung', weight: 'Gewicht', handling: 'Lenkung', offroad: 'Gelände' };
const SAVE_KEY = 'lgkart.settings.v1';
const BEST_KEY = 'lgkart.best.v1';
const CUP_KEY = 'lgkart.cups.v1';

function load(key, def) { try { return { ...def, ...JSON.parse(localStorage.getItem(key) ?? '{}') }; } catch (_) { return { ...def }; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) { /* egal */ } }

export class Menus {
  constructor(ctx) {
    this.ctx = ctx;
    this.root = document.getElementById('ui');
    this.el = document.createElement('div');
    this.el.className = 'menus';
    this.root.appendChild(this.el);
    this.settings = load(SAVE_KEY, { cc: 100, laps: 3, autoGas: true, racer: 'lotti' });
    this.best = load(BEST_KEY, {});
    this.cups = load(CUP_KEY, {});
    ctx.touch.setAutoGas(this.settings.autoGas);
    this.mode = 'gp';
    this.gp = null;
    this.screen = null;
    this.trackThumbs = {};
  }

  // ------------------------------------------------------------------ Grundlagen
  hideAll() { this.el.innerHTML = ''; this.el.className = 'menus'; this.screen = null; }

  show(name, html, cls = '') {
    this.screen = name;
    this.el.className = `menus visible ${cls}`;
    this.el.innerHTML = html;
    this.focusFirst();
    return this.el;
  }

  focusFirst() {
    const b = this.el.querySelector('[data-focus]') ?? this.el.querySelector('button');
    b?.focus({ preventScroll: true });
  }

  on(sel, fn) { for (const b of this.el.querySelectorAll(sel)) b.addEventListener('click', (e) => { this.ctx.audio.sfx('select'); fn(b, e); }); }

  toggleMute() {
    const m = this.ctx.audio.toggleMute();
    for (const b of document.querySelectorAll('.btn-mute')) b.textContent = m ? '🔇' : '🔊';
    return m;
  }

  /** Tastatur/Gamepad im Menü: Pfeile bewegen den Fokus, Bestätigen klickt, Pause im Rennen. */
  input(meta) {
    const race = this.ctx.race;
    if (meta.pause && race && !race.demo && race.state !== 'done') {
      if (this.ctx.paused) this.resume(); else this.pause();
      return;
    }
    if (!this.screen) return;
    const items = [...this.el.querySelectorAll('button:not([disabled])')];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    const move = (d) => { const n = items[(Math.max(0, i) + d + items.length) % items.length]; n.focus({ preventScroll: true }); n.dispatchEvent(new Event('focusmove')); };
    if (meta.left || meta.up) move(-1);
    if (meta.right || meta.down) move(1);
    if (meta.confirm && i >= 0) items[i].click();
    if (meta.back) this.el.querySelector('[data-back]')?.click();
  }

  /** Hintergrund-Demo (Computer-Rennen), solange ein Menü offen ist. */
  ensureDemo() {
    const r = this.ctx.race;
    if (r && r.demo) return;
    if (r && !r.demo) this.ctx.endRace();
    const trackDef = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    this.ctx.startRace({ trackDef, roster: [...RACERS].sort(() => Math.random() - 0.5), cc: 100, laps: 99, demo: true, seed: Math.floor(Math.random() * 1e6) });
    this.ctx.audio.play('course_map');
  }

  render(renderer) {
    renderer.setClearColor(0x2b8de8, 1);
    renderer.clear();
  }

  // ------------------------------------------------------------------ Titel
  showTitle() {
    this.ensureDemo();
    preloadIcons(this.ctx.renderer, RACERS);
    const el = this.show('title', `
      <div class="panel title">
        <h1 class="logo"><span class="l1">Lotti</span><span class="amp">&amp;</span><span class="l2">Greta</span><span class="kart">KART</span></h1>
        <p class="sub">Das Funrennen der Grünen Blockinsel</p>
        <div class="row col">
          <button class="big" data-mode="gp" data-focus>🏆 Grand Prix</button>
          <button class="big" data-mode="single">🏁 Einzelrennen</button>
          <button class="big alt" data-mode="trial">⏱️ Zeitfahren</button>
        </div>
        <div class="row">
          <button class="small" data-act="settings">⚙️ Einstellungen</button>
          <button class="small" data-act="help">❓ Steuerung</button>
          <button class="small btn-mute" data-act="mute">${this.ctx.audio.muted ? '🔇' : '🔊'}</button>
        </div>
      </div>`, 'center');
    this.on('[data-mode]', (b) => { this.mode = b.dataset.mode; this.showRacers(); });
    this.on('[data-act="settings"]', () => this.showSettings());
    this.on('[data-act="help"]', () => this.showHelp());
    this.on('[data-act="mute"]', () => this.toggleMute());
    return el;
  }

  showHelp() {
    this.show('help', `
      <div class="panel help">
        <h2>Steuerung</h2>
        <div class="cols">
          <div>
            <h3>Tastatur</h3>
            <p><kbd>←</kbd><kbd>→</kbd> lenken &nbsp; <kbd>↑</kbd> Gas &nbsp; <kbd>↓</kbd> Bremse / rückwärts</p>
            <p><kbd>Leertaste</kbd> Hüpfer &amp; Driften – lange in der Kurve halten, loslassen = <b>Mini-Turbo</b> (blau → orange → pink)</p>
            <p><kbd>X</kbd> Gegenstand &nbsp; <kbd>Esc</kbd> Pause &nbsp; <kbd>M</kbd> Ton</p>
            <p>Startturbo: Gas genau bei der <b>2</b> drücken!</p>
          </div>
          <div>
            <h3>Handy (quer)</h3>
            <p>Linke Hälfte: Daumen nach links/rechts ziehen = lenken. Gas gibt das Kart von selbst.</p>
            <p>Rechts: <b>DRIFT</b> halten, <b>★</b> Gegenstand, <b>BREMSE</b>.</p>
            <h3>Gamepad</h3>
            <p>Stick lenken, A Gas, B Bremse, R Driften, L Gegenstand.</p>
          </div>
        </div>
        <h3>Gegenstände aus den Funkel-Kisten</h3>
        <p class="items-help">Turbo-Beere · Panzer · Goldpanzer (sucht sich ein Ziel) · Krabbelkäfer (hinten ablegen) · Kickbombe · Funkenblüte (3 Funkenbälle) · Funkelstern (unverwundbar) · Riesentrank · Zauberkugel (trifft die Spitze)</p>
        <p class="items-help">Bitcoins machen dein Kart schneller (bis zu 10). Turbo-Pfeile und Schanzen nutzen – in der Luft Drift drücken für einen Trick-Turbo!</p>
        <div class="row"><button data-back data-focus>Zurück</button></div>
      </div>`, 'center');
    this.on('[data-back]', () => this.showTitle());
  }

  showSettings() {
    const s = this.settings;
    const ccBtns = Object.entries(CC).map(([k, v]) => `<button class="opt ${Number(k) === s.cc ? 'on' : ''}" data-cc="${k}">${v.label}<small>${k} ccm</small></button>`).join('');
    const lapBtns = [1, 2, 3, 5].map((n) => `<button class="opt ${n === s.laps ? 'on' : ''}" data-laps="${n}">${n}</button>`).join('');
    this.show('settings', `
      <div class="panel settings">
        <h2>Einstellungen</h2>
        <h3>Klasse</h3><div class="row">${ccBtns}</div>
        <h3>Runden</h3><div class="row">${lapBtns}</div>
        <h3>Handy: Gas</h3><div class="row">
          <button class="opt ${s.autoGas ? 'on' : ''}" data-gas="1">automatisch</button>
          <button class="opt ${!s.autoGas ? 'on' : ''}" data-gas="0">Knopf</button>
        </div>
        <div class="row"><button class="small" data-act="reset">Bestzeiten löschen</button></div>
        <div class="row"><button data-back data-focus>Fertig</button></div>
      </div>`, 'center');
    this.on('[data-cc]', (b) => { s.cc = Number(b.dataset.cc); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-laps]', (b) => { s.laps = Number(b.dataset.laps); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-gas]', (b) => { s.autoGas = b.dataset.gas === '1'; this.ctx.touch.setAutoGas(s.autoGas); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-act="reset"]', (b) => {
      if (b.dataset.sure) { this.best = {}; save(BEST_KEY, this.best); b.textContent = 'gelöscht ✓'; }
      else { b.dataset.sure = '1'; b.textContent = 'Wirklich löschen?'; }
    });
    this.on('[data-back]', () => this.showTitle());
  }

  // ------------------------------------------------------------------ Fahrer-Auswahl
  showRacers() {
    const r = this.ctx.renderer;
    const cards = RACERS.map((d) => `
      <button class="card racer" data-id="${d.id}" style="--c:${d.color}">
        <img src="${racerIcon(r, d)}" alt="" /><span>${d.name}</span>
      </button>`).join('');
    this.show('racers', `
      <div class="panel racers">
        <h2>Wer fährt?</h2>
        <div class="grid">${cards}</div>
        <div class="info"></div>
        <div class="row"><button data-back>Zurück</button><button class="go" data-go>Los geht's!</button></div>
      </div>`, 'wide');
    const info = this.el.querySelector('.info');
    const pick = (id) => {
      this.settings.racer = id; save(SAVE_KEY, this.settings);
      const d = RACER_BY_ID[id];
      for (const c of this.el.querySelectorAll('.card')) c.classList.toggle('on', c.dataset.id === id);
      info.innerHTML = `<h3 style="color:${d.color}">${d.name}</h3><p>${d.blurb}</p>
        <div class="stats">${Object.entries(d.stats).map(([k, v]) => `<div class="stat"><span>${STAT_NAMES[k]}</span><i>${'<b></b>'.repeat(v)}${'<em></em>'.repeat(5 - v)}</i></div>`).join('')}</div>`;
    };
    pick(this.settings.racer ?? 'lotti');
    for (const c of this.el.querySelectorAll('.card')) {
      c.addEventListener('focus', () => pick(c.dataset.id));
      c.addEventListener('click', () => { this.ctx.audio.sfx('select'); pick(c.dataset.id); });
      c.addEventListener('dblclick', () => this.afterRacer());
    }
    this.el.querySelector(`.card[data-id="${this.settings.racer}"]`)?.focus({ preventScroll: true });
    this.on('[data-back]', () => this.showTitle());
    this.on('[data-go]', () => this.afterRacer());
  }

  afterRacer() {
    if (this.mode === 'gp') this.showCups();
    else this.showTracks();
  }

  // ------------------------------------------------------------------ Cups und Strecken
  thumb(def) {
    if (this.trackThumbs[def.id]) return this.trackThumbs[def.id];
    const th = getTheme(def.theme);
    const tr = new Track(def, th);
    const c = document.createElement('canvas');
    c.width = 240; c.height = 150;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, 150);
    const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
    bg.addColorStop(0, hex(th.sky[1][1])); bg.addColorStop(1, hex(th.grass));
    x.fillStyle = bg; x.fillRect(0, 0, 240, 150);
    const mt = tr.mapTransform(240, 150, 14);
    x.lineJoin = 'round';
    const path = () => { x.beginPath(); for (let i = 0; i <= tr.N; i += 3) { const k = i % tr.N; const [a, b] = mt.map(tr.px[k], tr.pz[k]); if (i) x.lineTo(a, b); else x.moveTo(a, b); } x.closePath(); };
    path(); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 11; x.stroke();
    path(); x.strokeStyle = hex(th.curbB); x.lineWidth = 8; x.stroke();
    path(); x.strokeStyle = hex(th.road); x.lineWidth = 5; x.stroke();
    const url = c.toDataURL();
    this.trackThumbs[def.id] = url;
    return url;
  }

  showCups() {
    const cards = CUPS.map((c) => {
      const won = this.cups[`${c.id}:${this.settings.cc}`];
      return `<button class="card cup" data-cup="${c.id}">
        <div class="trophy ${won ? `won p${won}` : ''}">🏆</div><span>${c.name}</span>
        <small>${c.tracks.map((t) => TRACK_BY_ID[t].short ?? TRACK_BY_ID[t].name).join(' · ')}</small>
      </button>`;
    }).join('');
    this.show('cups', `
      <div class="panel cups">
        <h2>Grand Prix · ${CC[this.settings.cc].label}</h2>
        <div class="grid cups">${cards}</div>
        <div class="row"><button data-back>Zurück</button></div>
      </div>`, 'wide');
    this.on('[data-cup]', (b) => this.startGP(CUPS.find((c) => c.id === b.dataset.cup)));
    this.on('[data-back]', () => this.showRacers());
  }

  showTracks() {
    const cards = TRACKS.map((t) => {
      const b = this.best[t.id];
      return `<button class="card track" data-track="${t.id}">
        <img src="${this.thumb(t)}" alt="" /><span>${t.name}</span>
        <small>${b ? `Bestzeit ${fmtTime(b.time)} (${RACER_BY_ID[b.racer]?.name ?? ''})` : getTheme(t.theme).label}</small>
      </button>`;
    }).join('');
    this.show('tracks', `
      <div class="panel tracks">
        <h2>${this.mode === 'trial' ? 'Zeitfahren' : 'Einzelrennen'} – Strecke wählen</h2>
        <div class="grid tracks">${cards}</div>
        <div class="row"><button data-back>Zurück</button></div>
      </div>`, 'wide');
    this.on('[data-track]', (b) => this.startSingle(TRACK_BY_ID[b.dataset.track]));
    this.on('[data-back]', () => this.showRacers());
  }

  // ------------------------------------------------------------------ Rennen
  roster(playerId, order = null) {
    if (order) return order.map((id) => RACER_BY_ID[id]);
    const others = RACERS.filter((r) => r.id !== playerId).sort(() => Math.random() - 0.5);
    others.splice(5, 0, RACER_BY_ID[playerId]); // Spielerin startet als Sechste
    return others;
  }

  startSingle(trackDef) {
    const s = this.settings;
    const trial = this.mode === 'trial';
    const roster = trial ? [RACER_BY_ID[s.racer]] : this.roster(s.racer);
    this.hideAll();
    this.ctx.startRace({
      trackDef, roster, playerId: s.racer, cc: s.cc, laps: s.laps, trial,
      onDone: (res) => this.showResults(res, { trackDef, single: true }),
      onEvent: (e, v) => this.onRaceEvent(e, v),
    });
  }

  startGP(cup) {
    const s = this.settings;
    this.gp = { cup, index: 0, points: Object.fromEntries(RACERS.map((r) => [r.id, 0])), order: this.roster(s.racer).map((r) => r.id) };
    this.nextGP();
  }

  nextGP() {
    const g = this.gp, s = this.settings;
    const trackDef = TRACK_BY_ID[g.cup.tracks[g.index]];
    this.hideAll();
    const race = this.ctx.startRace({
      trackDef, roster: this.roster(s.racer, g.order), playerId: s.racer, cc: s.cc, laps: s.laps,
      onDone: (res) => this.showResults(res, { trackDef, gp: true }),
      onEvent: (e, v) => this.onRaceEvent(e, v),
    });
    this.ctx.hud.message(`${g.cup.name} · Rennen ${g.index + 1}/${g.cup.tracks.length}`, 2.6, 'intro');
    return race;
  }

  onRaceEvent(e, v) {
    if (e === 'finish') {
      const msg = v === 1 ? 'Super – 1. Platz!' : v <= 3 ? `Toll – ${v}. Platz!` : `${v}. Platz`;
      this.ctx.hud.message(msg, 4, v <= 3 ? 'good' : '');
    }
  }

  showResults(res, { trackDef, gp = false, single = false }) {
    const r = this.ctx.renderer;
    const me = res.find((x) => x.isPlayer);
    // Bestzeit
    let record = false;
    if (me && me.place && trackDef) {
      const b = this.best[trackDef.id];
      if (!b || me.time < b.time) { this.best[trackDef.id] = { time: me.time, racer: me.id }; save(BEST_KEY, this.best); record = true; }
    }
    let rows;
    if (gp) {
      res.forEach((x, i) => { this.gp.points[x.id] += POINTS[i] ?? 0; });
      rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}</td><td>${fmtTime(x.time)}</td><td class="pts">+${POINTS[i] ?? 0}</td><td class="tot">${this.gp.points[x.id]}</td></tr>`).join('');
    } else {
      rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}</td><td>${fmtTime(x.time)}</td><td>${isFinite(x.best) ? `Runde ${fmtTime(x.best)}` : ''}</td></tr>`).join('');
    }
    const last = gp && this.gp.index >= this.gp.cup.tracks.length - 1;
    this.show('results', `
      <div class="panel results">
        <h2>${trackDef.name}</h2>
        ${record && me ? `<p class="record">Neue Bestzeit: ${fmtTime(me.time)}!</p>` : ''}
        <table>${rows}</table>
        <div class="row">
          ${gp ? `<button class="go" data-next data-focus>${last ? 'Gesamtwertung' : 'Nächstes Rennen'}</button>` : `<button class="go" data-again data-focus>Nochmal</button><button data-other>Andere Strecke</button>`}
          <button data-menu>Menü</button>
        </div>
      </div>`, 'results');
    this.ctx.hud.show(false);
    this.ctx.touch.show(false);
    this.on('[data-next]', () => {
      if (last) { this.showStandings(); return; }
      // Startaufstellung nach Gesamtwertung (Führende vorn)
      this.gp.order = Object.keys(this.gp.points).sort((a, b) => this.gp.points[b] - this.gp.points[a]);
      this.gp.index++;
      this.nextGP();
    });
    this.on('[data-again]', () => this.startSingle(trackDef));
    this.on('[data-other]', () => { this.ctx.endRace(); this.showTracks(); this.ensureDemo(); });
    this.on('[data-menu]', () => { this.gp = null; this.ctx.endRace(); this.showTitle(); });
  }

  showStandings() {
    const r = this.ctx.renderer, g = this.gp;
    const order = Object.keys(g.points).sort((a, b) => g.points[b] - g.points[a]);
    const myPlace = order.indexOf(this.settings.racer) + 1;
    const cupKey = `${g.cup.id}:${this.settings.cc}`;
    if (myPlace <= 3 && (!this.cups[cupKey] || myPlace < this.cups[cupKey])) { this.cups[cupKey] = myPlace; save(CUP_KEY, this.cups); }
    const trophy = myPlace === 1 ? 'Gold-Pokal' : myPlace === 2 ? 'Silber-Pokal' : myPlace === 3 ? 'Bronze-Pokal' : null;
    this.ctx.setScene(new Ceremony(this.ctx, order.slice(0, 3).map((id) => RACER_BY_ID[id])));
    const podium = order.slice(0, 3).map((id, i) => `<div class="pod p${i + 1}"><img src="${racerIcon(r, RACER_BY_ID[id])}" alt="" /><span>${RACER_BY_ID[id].name}</span><b>${g.points[id]}</b><div class="step">${i + 1}</div></div>`);
    const rows = order.map((id, i) => `<tr class="${id === this.settings.racer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[id])}" alt="" /></td><td>${RACER_BY_ID[id].name}</td><td class="tot">${g.points[id]}</td></tr>`).join('');
    this.show('standings', `
      <div class="panel standings side">
        <h2>${g.cup.name} – Gesamtwertung</h2>
        ${trophy ? `<p class="record big">🏆 ${trophy} für ${RACER_BY_ID[this.settings.racer].name}!</p>` : `<p>Platz ${myPlace} – beim nächsten Mal klappt's!</p>`}
        <div class="podium">${podium[1]}${podium[0]}${podium[2]}</div>
        <table class="compact">${rows}</table>
        <div class="row"><button class="go" data-menu data-focus>Zum Menü</button></div>
      </div>`, 'results');
    if (trophy) this.ctx.audio.sfx('star');
    this.on('[data-menu]', () => { this.gp = null; this.ctx.endRace(); this.showTitle(); });
  }

  // ------------------------------------------------------------------ Pause
  pause() {
    const race = this.ctx.race;
    if (!race || race.demo) return;
    this.ctx.paused = true;
    this.ctx.audio.setMotor(false);
    this.ctx.audio.sfx('pause');
    this.show('pause', `
      <div class="panel pause">
        <h2>Pause</h2>
        <div class="row col">
          <button class="big" data-resume data-focus>Weiter</button>
          <button data-restart>Neustart</button>
          <button class="btn-mute" data-mute>${this.ctx.audio.muted ? '🔇 Ton aus' : '🔊 Ton an'}</button>
          <button data-quit>Aufgeben</button>
        </div>
      </div>`, 'center dim');
    this.on('[data-resume]', () => this.resume());
    this.on('[data-mute]', (b) => { const m = this.toggleMute(); b.textContent = m ? '🔇 Ton aus' : '🔊 Ton an'; });
    this.on('[data-restart]', () => {
      if (this.gp) { this.nextGP(); return; }
      const def = race.def;
      this.startSingle(def);
    });
    this.on('[data-quit]', () => { this.gp = null; this.ctx.endRace(); this.showTitle(); });
  }

  resume() {
    this.ctx.paused = false;
    this.hideAll();
  }
}

// Menüs (DOM): Titel, Modus, Fahrer-Auswahl, Cup/Strecke, Ergebnisse, Grand-Prix-Wertung, Pause, Einstellungen.
// Im Hintergrund fährt ein Demo-Rennen der Computer-Fahrer.

import { RACERS, RACER_BY_ID } from '../game/racers.js';
import { TRACKS, TRACK_BY_ID } from '../tracks/index.js';
import { WORLD_CUPS as CUPS, KO_TOURS } from '../world/worldDef.js';
import { CC } from '../game/Race.js';
import { Ceremony } from '../game/Ceremony.js';
import { Track } from '../world/Track.js';
import { getTheme } from '../world/themes.js';
import { racerIcon, preloadIcons } from './icons.js';
import { logoHTML } from './logo.js';
import { fmtTime } from './hud.js';
import { touch, isTouch, readJoin, deviceLabel, rumble } from './input.js';

const POINTS = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const STAT_NAMES = { speed: 'Tempo', accel: 'Beschleunigung', weight: 'Gewicht', handling: 'Lenkung', offroad: 'Gelände' };
const PCOL = ['#e60012', '#1e6cff', '#22b03c', '#ffb800'];
const MODE_NAMES = { gp: 'Grand Prix', ko: 'K.-o.-Tour', single: 'Einzelrennen', free: 'Freie Fahrt', trial: 'Zeitfahren' };
const SAVE_KEY = 'lgkart.settings.v1';
const BEST_KEY = 'lgkart.best.v1';
const CUP_KEY = 'lgkart.cups.v1';
const STAR_KEY = 'lgkart.starcoins.v1';

function load(key, def) { try { return { ...def, ...JSON.parse(localStorage.getItem(key) ?? '{}') }; } catch (_) { return { ...def }; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) { /* egal */ } }

export class Menus {
  constructor(ctx) {
    this.ctx = ctx;
    this.root = document.getElementById('ui');
    this.el = document.createElement('div');
    this.el.className = 'menus';
    this.root.appendChild(this.el);
    this.settings = load(SAVE_KEY, { cc: 100, laps: 3, autoGas: true, assist: true, racer: 'lotti' });
    this.best = load(BEST_KEY, {});
    this.cups = load(CUP_KEY, {});
    ctx.touch.setAutoGas(this.settings.autoGas);
    this.mode = 'gp';
    this.gp = null;
    this.screen = null;
    this.trackThumbs = {};
    try { ctx.collected = new Set(JSON.parse(localStorage.getItem(STAR_KEY) ?? '[]')); } catch (_) { ctx.collected = new Set(); }
    document.body.classList.toggle('touch-ui', isTouch());
  }

  /** Kopfzeile (schräger Reiter) und Tasten-Hinweise. */
  head(title, sub = '') { return `<header class="mhead"><b><span>${title}</span></b>${sub ? `<small class="chip">${sub}</small>` : ''}</header>`; }
  hints(back = true) { return `<footer class="mhints"><span><i class="a">A</i>Enter · Auswählen</span>${back ? '<span><i>B</i>Esc · Zurück</span>' : ''}</footer>`; }
  get modeSub() { return `${MODE_NAMES[this.mode] ?? ''}${this.multi ? ` · ${this.party.length} Spieler` : ''} · ${CC[this.settings.cc].label}`; }

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
    if (this.screen === 'lobby') { this.lobbyInput(meta); return; }
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
    if (r) this.ctx.endRace();
    const trackDef = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    this.ctx.startRace({ mode: 'demo', courseId: trackDef.id, roster: [...RACERS].sort(() => Math.random() - 0.5), cc: 100, laps: 40, seed: Math.floor(Math.random() * 1e6) });
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
    const item = (mode, ic, col, name, sub, focus = false) => `<button class="mitem" data-mode="${mode}" style="--ic:${col}" ${focus ? 'data-focus' : ''}><i class="ic">${ic}</i><span><b>${name}</b><small>${sub}</small></span></button>`;
    const el = this.show('title', `
      <div class="mscreen title">
        <div class="mside">
          ${logoHTML('h1')}
          <nav class="mlist">
            ${item('gp', '🏆', '#ffb800', 'Grand Prix', `${CUPS.length} Cups · von Strecke zu Strecke`, true)}
            ${item('ko', '💥', '#e60012', 'K.-o.-Tour', 'Rallye über die Insel – die Letzten fliegen raus')}
            ${item('single', '🏁', '#1e6cff', 'Einzelrennen', `${TRACKS.length} Strecken zur Wahl`)}
            ${item('free', '🗺️', '#22b03c', 'Freie Fahrt', 'Insel erkunden, Sternmünzen sammeln')}
            ${item('trial', '⏱️', '#9b4dff', 'Zeitfahren', 'Allein gegen die Uhr')}
            ${item('multi', '👥', '#ff5ab4', 'Mehrspieler', '2–4 Spieler · ein Bildschirm · auch offline')}
          </nav>
          <div class="mtools">
            <button class="small" data-act="settings">⚙️ Einstellungen</button>
            <button class="small" data-act="help">❓ Steuerung</button>
            <button class="small" data-act="tv">📺 Auf den TV</button>
            <button class="small btn-mute" data-act="mute">${this.ctx.audio.muted ? '🔇' : '🔊'}</button>
          </div>
          <p class="mtip offline-chip">${navigator.serviceWorker?.controller ? '✈️ Offline bereit – läuft auch im Flugmodus' : ''}</p>
          <p class="mtip ios-tip">📲 Vollbild: Teilen → „Zum Home-Bildschirm“</p>
        </div>
      </div>${this.hints(false)}`);
    this.on('[data-mode]', (b) => {
      if (b.dataset.mode === 'multi') { this.showLobby(); return; }
      this.party = null; this.mode = b.dataset.mode; this.showRacers();
    });
    this.on('[data-act="tv"]', () => this.showTV());
    this.on('[data-act="settings"]', () => this.showSettings());
    this.on('[data-act="help"]', () => this.showHelp());
    this.on('[data-act="mute"]', () => this.toggleMute());
    return el;
  }

  showHelp() {
    this.show('help', `
      <div class="mscreen">
        ${this.head('Steuerung')}
        <div class="mbody"><div class="glass help">
          <div class="cols">
            <div>
              <h3>Tastatur</h3>
              <p><kbd>←</kbd><kbd>→</kbd> lenken &nbsp; <kbd>↑</kbd> Gas &nbsp; <kbd>↓</kbd> Bremse / rückwärts</p>
              <p><kbd>Leertaste</kbd> Hüpfer &amp; Driften – lange in der Kurve halten, loslassen = <b>Mini-Turbo</b> (blau → orange → pink)</p>
              <p><kbd>X</kbd> Gegenstand &nbsp; <kbd>Esc</kbd> Pause &nbsp; <kbd>M</kbd> Ton</p>
              <p>Startturbo: Gas genau bei der <b>2</b> drücken!</p>
              <p><b>Aufladesprung:</b> Drift-Taste geradeaus gedrückt halten und loslassen – damit springst du auf <b>Schienen</b> und grindest los.</p>
            </div>
            <div>
              <h3>Handy (quer)</h3>
              <p>Linke Hälfte: Daumen nach links/rechts ziehen = lenken (wenig ziehen = fein lenken). Gas gibt das Kart von selbst.</p>
              <p>Rechts: <b>DRIFT</b> halten, <b>★</b> Gegenstand, <b>BREMSE</b>.</p>
              <h3>Controller (Xbox, PlayStation, Switch)</h3>
              <p>Stick/Steuerkreuz lenken, A oder RT Gas, B Bremse, R Driften, L/LT Gegenstand, Start Pause. Menüs gehen auch mit dem Controller. Bei Treffern vibriert er.</p>
              <h3>Mehrspieler (2–4)</h3>
              <p>Jeder mit eigenem Controller – oder Tastatur teilen: links <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, Driften <kbd>Leertaste</kbd>, Gegenstand <kbd>Q</kbd>; rechts Pfeiltasten, Driften <kbd>Shift</kbd>/<kbd>L</kbd>, Gegenstand <kbd>Enter</kbd>/<kbd>K</kbd>.</p>
            </div>
          </div>
          <h3>Gegenstände aus den Funkel-Kisten</h3>
          <p class="items-help">Turbo-Beere · Panzer · Goldpanzer (sucht sich ein Ziel) · Krabbelkäfer (hinten ablegen) · Kickbombe · Funkenblüte (3 Funkenbälle) · Funkelstern (unverwundbar) · Riesentrank · Zauberkugel (trifft die Spitze)</p>
          <p class="items-help">Bitcoins machen dein Kart schneller (bis zu 10). Turbo-Pfeile und Schanzen nutzen – in der Luft Drift drücken für einen Trick-Turbo! Über den See fährst du einfach auf dem Wasser.</p>
          <h3>Die Insel</h3>
          <p class="items-help"><b>Grand Prix</b>: ab dem zweiten Rennen fährst du über die Landstraße zur nächsten Strecke. <b>K.-o.-Tour</b>: quer über die Insel, an jedem Checkpoint scheiden die Letzten aus. <b>Freie Fahrt</b>: erkunde alles und finde die 36 Sternmünzen.</p>
          <div class="row"><button data-back data-focus>Zurück</button></div>
        </div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-back]', () => this.showTitle());
  }

  showSettings() {
    const s = this.settings;
    const ccBtns = Object.entries(CC).map(([k, v]) => `<button class="opt ${Number(k) === s.cc ? 'on' : ''}" data-cc="${k}">${v.label}<small>${k} ccm</small></button>`).join('');
    const lapBtns = [1, 2, 3, 5].map((n) => `<button class="opt ${n === s.laps ? 'on' : ''}" data-laps="${n}">${n}</button>`).join('');
    const q = this.ctx.quality;
    const qBtns = [[1, 'Sparsam', 'ältere Handys'], [2, 'Hoch', 'Standard'], [3, 'Ultra', 'mehr Details']].map(([v, n, d]) => `<button class="opt ${v === q ? 'on' : ''}" data-q="${v}">${n}<small>${d}</small></button>`).join('');
    this.show('settings', `
      <div class="mscreen">
        ${this.head('Einstellungen')}
        <div class="mbody center"><div class="glass">
          <div class="setlist">
            <h3>Klasse</h3><div class="row">${ccBtns}</div>
            <h3>Runden</h3><div class="row">${lapBtns}</div>
            <h3>Lenkhilfe</h3><div class="row">
              <button class="opt ${s.assist ? 'on' : ''}" data-assist="1">an<small>bleibt auf der Strecke</small></button>
              <button class="opt ${!s.assist ? 'on' : ''}" data-assist="0">aus</button>
            </div>
            <h3>Handy: Gas</h3><div class="row">
              <button class="opt ${s.autoGas ? 'on' : ''}" data-gas="1">automatisch</button>
              <button class="opt ${!s.autoGas ? 'on' : ''}" data-gas="0">Knopf</button>
            </div>
            <h3>Grafik</h3><div class="row">${qBtns}</div>
          </div>
          <div class="row"><button class="small" data-act="reset">Bestzeiten löschen</button><button class="go" data-back data-focus>Fertig</button></div>
        </div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-q]', (b) => {
      const v = Number(b.dataset.q);
      if (v === q) return;
      try { localStorage.setItem('lgkart.quality', String(v)); } catch (_) { /* egal */ }
      location.reload();   // die Insel wird mit der neuen Detailstufe neu gebaut
    });
    this.on('[data-cc]', (b) => { s.cc = Number(b.dataset.cc); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-laps]', (b) => { s.laps = Number(b.dataset.laps); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-assist]', (b) => { s.assist = b.dataset.assist === '1'; save(SAVE_KEY, s); this.showSettings(); });
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
      <div class="mscreen">
        ${this.head('Wer fährt?', this.modeSub)}
        <div class="mbody split">
          <div class="grid racers">${cards}</div>
          <div class="glass profile"></div>
        </div>
      </div>${this.hints()}`, 'full');
    const info = this.el.querySelector('.profile');
    const pick = (id) => {
      this.settings.racer = id; save(SAVE_KEY, this.settings);
      const d = RACER_BY_ID[id];
      for (const c of this.el.querySelectorAll('.card')) c.classList.toggle('on', c.dataset.id === id);
      info.innerHTML = `<img src="${racerIcon(r, d)}" alt="" /><h3 style="color:${d.color}">${d.name}</h3><p>${d.blurb}</p>
        <div class="stats">${Object.entries(d.stats).map(([k, v]) => `<div class="stat"><span>${STAT_NAMES[k]}</span><i><u style="width:${v * 20}%"></u></i></div>`).join('')}</div>
        <div class="row"><button data-back>Zurück</button><button class="go" data-go>Los geht's!</button></div>`;
      for (const b2 of info.querySelectorAll('[data-back]')) b2.onclick = () => { this.ctx.audio.sfx('select'); this.showTitle(); };
      for (const b2 of info.querySelectorAll('[data-go]')) b2.onclick = () => { this.ctx.audio.sfx('select'); this.afterRacer(); };
    };
    pick(this.settings.racer ?? 'lotti');
    for (const c of this.el.querySelectorAll('.card')) {
      c.addEventListener('focus', () => pick(c.dataset.id));
      c.addEventListener('click', () => { this.ctx.audio.sfx('select'); pick(c.dataset.id); });
      c.addEventListener('dblclick', () => this.afterRacer());
    }
    this.el.querySelector(`.card[data-id="${this.settings.racer}"]`)?.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ Mehrspieler
  /** Spieler im geteilten Bildschirm (null = Einzelspieler). */
  get multi() { return this.party && this.party.length > 1; }
  partyPlayers() { return this.multi ? this.party.map((p) => ({ id: p.racer, src: p.src })) : undefined; }

  showLobby() {
    this.ensureDemo();
    this.party = this.party?.length ? this.party.map((p) => ({ ...p, ready: false })) : [];
    this.renderLobby();
  }

  renderLobby() {
    const r = this.ctx.renderer;
    const slots = [0, 1, 2, 3].map((i) => {
      const p = this.party[i];
      if (!p) {
        return `<div class="pslot empty"><div class="ptag" style="--pc:${PCOL[i]}">P${i + 1}</div>
          <p>Zum Mitspielen drücken:</p>
          <p><b>A</b> am Controller<br/><b>Leertaste</b> (Tastatur links)<br/><b>Enter</b> (Tastatur rechts)</p></div>`;
      }
      const d = RACER_BY_ID[p.racer];
      return `<div class="pslot ${p.ready ? 'ready' : ''}" style="--pc:${PCOL[i]}">
        <div class="ptag">P${i + 1}</div>
        <img src="${racerIcon(r, d)}" alt="" />
        <b style="color:${d.color}">◀ ${d.name} ▶</b>
        <small>${deviceLabel(p.src)}</small>
        <span class="pstate">${p.ready ? '✔ Bereit!' : 'A / Leertaste / Enter = bereit'}</span>
      </div>`;
    }).join('');
    const n = this.party.length, allReady = n >= 2 && this.party.every((p) => p.ready);
    this.show('lobby', `
      <div class="mscreen">
        ${this.head('Mehrspieler', '2–4 Spieler · geteilter Bildschirm')}
        <div class="mbody"><div class="lobby">${slots}</div>
          <p class="lobby-tip">${n < 2 ? 'Mindestens zwei Spieler: Controller per Bluetooth verbinden oder die Tastatur teilen (links WASD, rechts Pfeile).' : allReady ? 'Alle bereit – los geht\'s!' : 'Figur mit ◀ ▶ wählen, dann bestätigen.'}</p>
          <div class="row"><button data-back>Zurück</button><button class="go" data-next ${allReady ? 'data-focus' : 'disabled'}>Weiter</button></div>
        </div>
      </div>${this.hints()}`, this.screen === 'lobby' ? 'full still' : 'full');
    this.on('[data-back]', () => { this.party = null; this.showTitle(); });
    this.on('[data-next]', () => this.showMpModes());
  }

  lobbyInput(meta) {
    const ev = readJoin();
    let changed = false;
    const taken = (id, except) => this.party.some((p) => p !== except && p.racer === id);
    const cycle = (p, d) => {
      let k = RACERS.findIndex((x) => x.id === p.racer);
      for (let n = 0; n < RACERS.length; n++) { k = (k + d + RACERS.length) % RACERS.length; if (!taken(RACERS[k].id, p)) break; }
      p.racer = RACERS[k].id;
    };
    for (const { src, act } of ev) {
      const p = this.party.find((x) => x.src === src);
      if (!p) {
        if (act === 'confirm' && this.party.length < 4) {
          const free = RACERS.find((x) => !taken(x.id));
          this.party.push({ src, racer: free.id, ready: false });
          this.ctx.audio.sfx('oneup'); rumble(src, 0.4, 0.4, 150); changed = true;
        }
        continue;
      }
      if (act === 'left' && !p.ready) { cycle(p, -1); this.ctx.audio.sfx('select'); changed = true; }
      if (act === 'right' && !p.ready) { cycle(p, 1); this.ctx.audio.sfx('select'); changed = true; }
      if (act === 'confirm') {
        if (!p.ready) { p.ready = true; this.ctx.audio.sfx('checkpoint'); changed = true; }
        else if (this.party.length >= 2 && this.party.every((x) => x.ready)) { this.showMpModes(); return; }
      }
      if (act === 'back') {
        if (p.ready) p.ready = false; else this.party.splice(this.party.indexOf(p), 1);
        this.ctx.audio.sfx('pause'); changed = true;
      }
    }
    if (meta.back && !this.party.length) { this.party = null; this.showTitle(); return; }
    if (changed) this.renderLobby();
  }

  showMpModes() {
    const card = (mode, ic, name, sub) => `<button class="card cup" data-mm="${mode}"><div class="trophy won">${ic}</div><span>${name}</span><small>${sub}</small></button>`;
    this.show('mpmodes', `
      <div class="mscreen">
        ${this.head('Was wollt ihr fahren?', `${this.party.length} Spieler · ${CC[this.settings.cc].label}`)}
        <div class="mbody"><div class="grid cups">
          ${card('gp', '🏆', 'Grand Prix', 'Cup mit 4 Rennen und Punkten')}
          ${card('single', '🏁', 'Rennen', 'eine Strecke frei wählen')}
          ${card('ko', '💥', 'K.-o.-Tour', 'Rallye – die Letzten fliegen raus')}
          ${card('free', '🗺️', 'Freie Fahrt', 'gemeinsam die Insel erkunden')}
        </div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-mm]', (b) => { this.mode = b.dataset.mm; this.afterRacer(); });
    this.on('[data-back]', () => this.showLobby());
  }

  /** Auf den Fernseher bringen: Anleitung je Gerät, Vollbild. */
  showTV() {
    const url = 'alex1977-code.github.io/LottiGretaKart';
    this.show('tv', `
      <div class="mscreen">
        ${this.head('Auf den Fernseher', 'großes Bild · Controller · Mehrspieler')}
        <div class="mbody"><div class="glass help">
          <div class="cols">
            <div>
              <h3>📱 iPhone / iPad</h3>
              <p>Apple TV oder AirPlay-Fernseher: <b>Kontrollzentrum → Bildschirmsynchronisierung</b>. Gerät quer halten.</p>
              <h3>🤖 Android</h3>
              <p>Chromecast / Smart-TV: <b>Schnelleinstellungen → Bildschirm übertragen</b> (auch „Smart View“).</p>
              <h3>💻 Laptop / PC</h3>
              <p><b>HDMI-Kabel</b> zum Fernseher – oder in Chrome: <b>Menü → Streamen → Tab</b>.</p>
            </div>
            <div>
              <h3>📺 Smart-TV, Fire TV, Konsole mit Browser</h3>
              <p>Direkt öffnen: <b>${url}</b> und Controller verbinden.</p>
              <h3>🎮 Controller</h3>
              <p>Xbox-, PlayStation- oder Switch-Controller per <b>Bluetooth</b> mit dem Gerät koppeln, auf dem das Spiel läuft. Bis zu vier Spieler.</p>
              <h3>✈️ Im Flugzeug</h3>
              <p>Spiel vorher einmal online öffnen – danach läuft es ohne Internet. Mehrspieler auf einem iPad/Laptop mit Controllern oder geteilter Tastatur.</p>
            </div>
          </div>
          <div class="row"><button data-full>⛶ Vollbild</button><button class="go" data-back data-focus>Fertig</button></div>
        </div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-full]', () => { try { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: 'hide' }))?.catch?.(() => {}); } catch (_) { /* egal */ } });
    this.on('[data-back]', () => this.showTitle());
  }

  afterRacer() {
    if (this.mode === 'gp') this.showCups();
    else if (this.mode === 'ko') this.showTours();
    else if (this.mode === 'free') this.startFree();
    else this.showTracks();
  }

  showTours() {
    const cards = KO_TOURS.map((t) => `<button class="card cup" data-tour="${t.id}">
        <div class="trophy won">💥</div><span>${t.name}</span>
        <small>${t.stops.map((id) => TRACK_BY_ID[id].short ?? TRACK_BY_ID[id].name).join(' → ')}</small>
        <small>12 Fahrer · ${t.survivors.length} Checkpoints</small>
      </button>`).join('');
    this.show('tours', `
      <div class="mscreen">
        ${this.head('Tour wählen', this.modeSub)}
        <div class="mbody"><div class="grid cups">${cards}</div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-tour]', (b) => this.startKO(KO_TOURS.find((t) => t.id === b.dataset.tour)));
    this.on('[data-back]', () => (this.multi ? this.showMpModes() : this.showRacers()));
  }

  startKO(tour) {
    const s = this.settings;
    this.lastKO = tour;
    this.hideAll();
    this.ctx.startRace({
      mode: 'ko', tour, courseId: tour.stops[tour.stops.length - 1], roster: this.roster(s.racer, null, 12), playerId: this.leadId, players: this.partyPlayers(), cc: s.cc, assist: s.assist,
      onDone: (res) => this.showResults(res, { title: tour.name, ko: true }),
      onEvent: (e, v, r) => this.onRaceEvent(e, v, r),
    });
    this.ctx.hud.message(tour.name, 2.6, 'intro');
  }

  startFree() {
    const s = this.settings;
    this.hideAll();
    const ids = this.humanIds;
    const others = RACERS.filter((r) => !ids.includes(r.id)).sort(() => Math.random() - 0.5).slice(0, 8 - ids.length);
    this.ctx.startRace({
      mode: 'free', roster: [...ids.map((id) => RACER_BY_ID[id]), ...others], playerId: this.leadId, players: this.partyPlayers(), cc: s.cc, assist: false,
      onEvent: (e, v, r) => this.onRaceEvent(e, v, r),
    });
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
      <div class="mscreen">
        ${this.head('Cup wählen', this.modeSub)}
        <div class="mbody"><div class="grid cups">${cards}</div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-cup]', (b) => this.startGP(CUPS.find((c) => c.id === b.dataset.cup)));
    this.on('[data-back]', () => (this.multi ? this.showMpModes() : this.showRacers()));
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
      <div class="mscreen">
        ${this.head('Strecke wählen', this.modeSub)}
        <div class="mbody"><div class="grid tracks">${cards}</div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-track]', (b) => this.startSingle(TRACK_BY_ID[b.dataset.track]));
    this.on('[data-back]', () => (this.multi ? this.showMpModes() : this.showRacers()));
  }

  // ------------------------------------------------------------------ Rennen
  /** Figuren der Menschen (Einzelspieler: die gewählte Figur). */
  get humanIds() { return this.multi ? this.party.map((p) => p.racer) : [this.settings.racer]; }
  get leadId() { return this.humanIds[0]; }

  roster(playerId, order = null, n = 12) {
    if (order) return order.map((id) => RACER_BY_ID[id]);
    const ids = this.humanIds;
    const others = RACERS.filter((r) => !ids.includes(r.id)).sort(() => Math.random() - 0.5).slice(0, n - ids.length);
    // Menschen starten weiter hinten
    ids.forEach((id, k) => others.splice(Math.min(others.length, Math.round(n * 0.62) + k), 0, RACER_BY_ID[id]));
    return others;
  }

  startSingle(trackDef) {
    const s = this.settings;
    const trial = this.mode === 'trial';
    const roster = trial ? [RACER_BY_ID[s.racer]] : this.roster(s.racer);
    this.hideAll();
    this.ctx.startRace({
      mode: trial ? 'trial' : 'race', courseId: trackDef.id, roster, playerId: this.leadId, players: trial ? undefined : this.partyPlayers(), cc: s.cc, laps: s.laps, assist: s.assist,
      onDone: (res) => this.showResults(res, { trackDef, single: true }),
      onEvent: (e, v, r) => this.onRaceEvent(e, v, r),
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
    const from = g.index > 0 ? g.cup.tracks[g.index - 1] : null;
    const race = this.ctx.startRace({
      mode: 'gp', courseId: trackDef.id, fromId: from, roster: this.roster(s.racer, g.order), playerId: this.leadId, players: this.partyPlayers(), cc: s.cc,
      laps: from ? Math.max(1, s.laps - 1) : s.laps, assist: s.assist,
      onDone: (res) => this.showResults(res, { trackDef, gp: true }),
      onEvent: (e, v, r) => this.onRaceEvent(e, v, r),
    });
    this.ctx.hud.message(`${g.cup.name} · Rennen ${g.index + 1}/${g.cup.tracks.length}${from ? ' · mit Anfahrt' : ''}`, 2.6, 'intro');
    return race;
  }

  onRaceEvent(e, v, r = null) {
    if (e === 'starcoin') {
      this.ctx.collected.add(v);
      try { localStorage.setItem(STAR_KEY, JSON.stringify([...this.ctx.collected])); } catch (_) { /* egal */ }
      return;
    }
    if (this.ctx.race?.split) {
      if (e === 'out') this.ctx.race.hudOf(r)?.message(`Ausgeschieden – Platz ${v}`, 4);
      return;   // Zieleinlauf zeigt das Rennen selbst in der jeweiligen Bildhälfte
    }
    if (e === 'out') { this.ctx.hud.message(`Ausgeschieden – Platz ${v}`, 4); return; }
    if (e === 'finish') {
      const msg = v === 1 ? 'Super – 1. Platz!' : v <= 3 ? `Toll – ${v}. Platz!` : `${v}. Platz`;
      this.ctx.hud.message(msg, 4, v <= 3 ? 'good' : '');
    }
  }

  showResults(res, { trackDef = null, gp = false, single = false, ko = false, title = '' }) {
    const r = this.ctx.renderer;
    const me = res.find((x) => x.isPlayer);
    // Bestzeit
    let record = false;
    if (me && me.place && trackDef && !me.out && !this.multi) {
      const b = this.best[trackDef.id];
      if (!b || me.time < b.time) { this.best[trackDef.id] = { time: me.time, racer: me.id }; save(BEST_KEY, this.best); record = true; }
    }
    const tag = (x) => (this.multi && x.isPlayer ? ` <em class="ptag" style="--pc:${PCOL[x.pi ?? 0]}">P${(x.pi ?? 0) + 1}</em>` : '');
    if (this.multi) record = false;
    let rows;
    if (gp) {
      res.forEach((x, i) => { this.gp.points[x.id] += POINTS[i] ?? 0; });
      rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}${tag(x)}</td><td>${fmtTime(x.time)}</td><td class="pts">+${POINTS[i] ?? 0}</td><td class="tot">${this.gp.points[x.id]}</td></tr>`).join('');
    } else {
      rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}${tag(x)}</td><td>${x.out ? 'ausgeschieden' : fmtTime(x.time)}</td><td>${!ko && isFinite(x.best) ? `Runde ${fmtTime(x.best)}` : ''}</td></tr>`).join('');
    }
    const last = gp && this.gp.index >= this.gp.cup.tracks.length - 1;
    this.show('results', `
      <div class="mscreen">
        ${this.head(title || trackDef?.name || 'Ergebnis', gp ? `${this.gp.cup.name} · Rennen ${this.gp.index + 1}/${this.gp.cup.tracks.length}` : '')}
        <div class="mbody"><div class="results-wrap">
          ${record && me ? `<p class="record">Neue Bestzeit: ${fmtTime(me.time)}!</p>` : ''}
          <table>${rows}</table>
          <div class="row">
            ${gp ? `<button class="go" data-next data-focus>${last ? 'Gesamtwertung' : 'Nächstes Rennen'}</button>` : `<button class="go" data-again data-focus>Nochmal</button><button data-other>${ko ? 'Andere Tour' : 'Andere Strecke'}</button>`}
            <button data-menu>Menü</button>
          </div>
        </div></div>
      </div>${this.hints(false)}`, 'results dim');
    this.ctx.hud.show(false);
    this.ctx.touch.show(false);
    this.on('[data-next]', () => {
      if (last) { this.showStandings(); return; }
      // Startaufstellung nach Gesamtwertung (Führende vorn)
      this.gp.order = Object.keys(this.gp.points).sort((a, b) => this.gp.points[b] - this.gp.points[a]);
      this.gp.index++;
      this.nextGP();
    });
    this.on('[data-again]', () => (ko ? this.startKO(this.lastKO) : this.startSingle(trackDef)));
    this.on('[data-other]', () => { this.ctx.endRace(); this.ensureDemo(); if (ko) this.showTours(); else this.showTracks(); });
    this.on('[data-menu]', () => { this.gp = null; this.ctx.endRace(); this.showTitle(); });
  }

  showStandings() {
    const r = this.ctx.renderer, g = this.gp;
    const order = Object.keys(g.points).sort((a, b) => g.points[b] - g.points[a]);
    const ids = this.humanIds;
    const best = ids.reduce((a, id) => (order.indexOf(id) < order.indexOf(a) ? id : a), ids[0]);
    const myPlace = order.indexOf(best) + 1;
    const cupKey = `${g.cup.id}:${this.settings.cc}`;
    if (myPlace <= 3 && (!this.cups[cupKey] || myPlace < this.cups[cupKey])) { this.cups[cupKey] = myPlace; save(CUP_KEY, this.cups); }
    const trophy = myPlace === 1 ? 'Gold-Pokal' : myPlace === 2 ? 'Silber-Pokal' : myPlace === 3 ? 'Bronze-Pokal' : null;
    this.ctx.setScene(new Ceremony(this.ctx, order.slice(0, 3).map((id) => RACER_BY_ID[id])));
    const rows = order.map((id, i) => `<tr class="${ids.includes(id) ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[id])}" alt="" /></td><td>${RACER_BY_ID[id].name}</td><td class="tot">${g.points[id]}</td></tr>`).join('');
    this.show('standings', `
      <div class="mscreen standings">
        <div class="glass">
          <h2>${g.cup.name} – Gesamtwertung</h2>
          ${trophy ? `<p class="record big">🏆 ${trophy} für ${RACER_BY_ID[best].name}!</p>` : `<p style="text-align:center;font-weight:800">Platz ${myPlace} – beim nächsten Mal klappt's!</p>`}
          <table class="compact">${rows}</table>
          <div class="row"><button class="go" data-menu data-focus>Zum Menü</button></div>
        </div>
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
      <div class="mscreen"><div class="mbody center"><div class="pausebox">
        <h2>Pause</h2>
        <button class="go" data-resume data-focus>Weiter</button>
        <button data-restart>Neustart</button>
        <button class="btn-mute" data-mute>${this.ctx.audio.muted ? '🔇 Ton aus' : '🔊 Ton an'}</button>
        <button data-quit>Aufgeben</button>
      </div></div></div>`, 'dim');
    this.on('[data-resume]', () => this.resume());
    this.on('[data-mute]', (b) => { const m = this.toggleMute(); b.textContent = m ? '🔇 Ton aus' : '🔊 Ton an'; });
    this.on('[data-restart]', () => {
      if (this.gp) { this.nextGP(); return; }
      if (race.ko) { this.startKO(this.lastKO); return; }
      if (race.free) { this.startFree(); return; }
      this.startSingle(race.def);
    });
    this.on('[data-quit]', () => { this.gp = null; this.ctx.endRace(); this.showTitle(); });
  }

  resume() {
    this.ctx.paused = false;
    this.hideAll();
  }
}

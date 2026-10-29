// Menüs (DOM): Titel, Modus, Fahrer-Auswahl, Cup/Strecke, Ergebnisse, Grand-Prix-Wertung, Pause, Einstellungen.
// Im Hintergrund fährt ein Demo-Rennen der Computer-Fahrer.

import { RACERS, RACER_BY_ID } from '../game/racers.js';
import { TRACKS, TRACK_BY_ID } from '../tracks/index.js';
import { WORLD_CUPS as CUPS } from '../world/worldDef.js';
import { CC } from '../game/Race.js';
import { Ceremony } from '../game/Ceremony.js';
import { Track } from '../world/Track.js';
import { getTheme } from '../world/themes.js';
import { setNight } from '../world/night.js';
import { setWeatherSetting } from '../world/weather.js';
import { racerIcon, preloadIcons } from './icons.js';
import { logoHTML } from './logo.js';
import { NetSession } from '../net/session.js';
import { nearbyAvailable } from '../net/nearby.js';
import { qrSVG, scanQR } from '../net/qr.js';
import { fmtTime } from './hud.js';
import { touch, isTouch, readJoin, deviceLabel, rumble } from './input.js';

const POINTS = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const STAT_NAMES = { speed: 'Tempo', accel: 'Beschleunigung', weight: 'Gewicht', handling: 'Lenkung', offroad: 'Gelände' };
const PCOL = ['#e60012', '#1e6cff', '#22b03c', '#ffb800'];
const MODE_NAMES = { gp: 'Grand Prix', single: 'Einzelrennen', trial: 'Zeitfahren' };
const SAVE_KEY = 'lgkart.settings.v1';
const BEST_KEY = 'lgkart.best.v1';
const CUP_KEY = 'lgkart.cups.v1';
const PUBLIC_URL = 'https://alex1977-code.github.io/LottiGretaKart/';   // Beitritts-Link (auch aus der App heraus)

function load(key, def) { try { return { ...def, ...JSON.parse(localStorage.getItem(key) ?? '{}') }; } catch (_) { return { ...def }; } }
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) { /* egal */ } }

export class Menus {
  constructor(ctx) {
    this.ctx = ctx;
    this.root = document.getElementById('ui');
    this.el = document.createElement('div');
    this.el.className = 'menus';
    this.root.appendChild(this.el);
    this.settings = load(SAVE_KEY, { cc: 100, laps: 3, autoGas: false, assist: false, racer: 'lotti' });
    // Version 2: Gas am Handy jetzt standardmäßig per Knopf (flexibler, mit Rückwärtsgang)
    if ((this.settings.v ?? 1) < 2) { this.settings.autoGas = false; this.settings.assist = false; this.settings.v = 2; save(SAVE_KEY, this.settings); }
    this.best = load(BEST_KEY, {});
    this.cups = load(CUP_KEY, {});
    ctx.touch.setAutoGas(this.settings.autoGas);
    setNight(this.settings.night);
    setWeatherSetting(this.settings.weather ?? 'sun');
    this.mode = 'gp';
    this.gp = null;
    this.screen = null;
    this.trackThumbs = {};
    document.body.classList.toggle('touch-ui', isTouch());
  }

  /** Kopfzeile (schräger Reiter) und Tasten-Hinweise. */
  head(title, sub = '') { return `<header class="mhead"><b><span>${title}</span></b>${sub ? `<small class="chip">${sub}</small>` : ''}</header>`; }
  hints(back = true) { return `<footer class="mhints"><span><i class="a">A</i>Enter · Auswählen</span>${back ? '<span><i>B</i>Esc · Zurück</span>' : ''}</footer>`; }
  get modeSub() { return `${MODE_NAMES[this.mode] ?? ''}${this.multi ? ` · ${this.humanIds.length} Spieler` : ''} · ${CC[this.settings.cc].label}`; }

  // ------------------------------------------------------------------ Grundlagen
  hideAll() { this.el.innerHTML = ''; this.el.className = 'menus'; this.screen = null; document.body.classList.remove('menu-open'); }

  show(name, html, cls = '') {
    this.screen = name;
    // Touch-Steuerung liegt über den Menüs: solange ein Menü offen ist (Pause, Ergebnis …), ausblenden – sonst fangen
    // die Lenk- und Gas-Flächen die Fingertipps auf „Weiter“ ab
    document.body.classList.add('menu-open');
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

  /**
   * Hintergrund-Demo (Computer-Rennen), solange ein Menü offen ist – auf der zuletzt geladenen Strecke (beim
   * Spielstart eine zufällige). Liefert ein Versprechen, das erfüllt ist, sobald die Demo fährt.
   */
  ensureDemo() {
    const r = this.ctx.race;
    if (r && r.demo) return Promise.resolve();
    if (r) this.ctx.endRace();
    const id = this.ctx.courseId ?? TRACKS[Math.floor(Math.random() * TRACKS.length)].id;
    const token = (this.demoToken = (this.demoToken ?? 0) + 1);
    this.demoReady = this.ctx.loadCourse(id).then(() => {
      if (token !== this.demoToken || this.ctx.race) return;   // inzwischen ein Rennen gestartet
      this.ctx.startRace({ mode: 'demo', courseId: id, roster: [...RACERS].sort(() => Math.random() - 0.5), cc: 100, laps: 40, seed: Math.floor(Math.random() * 1e6) });
      this.ctx.audio.play('course_map');
    });
    return this.demoReady;
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
            ${item('gp', '🏆', '#ffb800', 'Grand Prix', `${CUPS.length} Cups · je vier Strecken`, true)}
            ${item('single', '🏁', '#1e6cff', 'Einzelrennen', `${TRACKS.length} Strecken zur Wahl`)}
            ${item('trial', '⏱️', '#9b4dff', 'Zeitfahren', 'Allein gegen die Uhr')}
            ${item('multi', '👥', '#ff5ab4', 'Mehrspieler', '2–4 Spieler · ein Bildschirm · auch offline')}
          </nav>
          <div class="mtools">
            <button class="small" data-act="settings">⚙️ Einstellungen</button>
            <button class="small" data-act="help">❓ Steuerung</button>
            <button class="small" data-act="tv">📺 Auf den TV</button>
            <button class="small btn-mute" data-act="mute">${this.ctx.audio.muted ? '🔇' : '🔊'}</button>
          </div>
          <p class="mtip offline-chip">${navigator.serviceWorker?.controller || nearbyAvailable() ? '✈️ Offline bereit – läuft auch im Flugmodus' : ''}</p>
          <p class="mtip ios-tip">📲 Vollbild: Teilen → „Zum Home-Bildschirm“</p>
        </div>
      </div>${this.hints(false)}`);
    this.on('[data-mode]', (b) => {
      if (b.dataset.mode === 'multi') { this.showMultiChoice(); return; }
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
              <p>Linke Hälfte: Daumen nach links/rechts ziehen = lenken (wenig ziehen = fein lenken).</p>
              <p>Rechts: <b>GAS</b> halten. Links lenken und rechts Gas geben geht gleichzeitig. <b>Driften:</b> in der Kurve Gas kurz loslassen und gleich wieder drücken („pumpen“) – das Kart hüpft und driftet. Dann <b>Gas einfach halten</b> und in Ruhe lenken; Gas loslassen = Mini-Turbo. <b>Richtungswechsel:</b> deutlich zur anderen Seite lenken beendet den Drift (Mini-Turbo, wenn aufgeladen) – für einen Drift in die neue Richtung einfach neu pumpen. <b>Drift-Richtung:</b> beim Hüpfer den linken Daumen schon ein kleines Stück zur Seite schieben (geht auch kurz nach der Landung). Im Drift gilt die Daumenstellung vom Driftbeginn als mittlerer Bogen: weiter hinein = enger, zurück zur Mitte = weiter, auf die andere Seite = Kart richtet sich auf und lenkt leicht gegen – so lässt sich die Richtung auch quer in der Kurve korrigieren. <b>★</b> Gegenstand, <b>BREMSE/ZURÜCK</b> halten = bremsen und rückwärts fahren. Mit Automatik-Gas (Einstellungen) gibt es einen DRIFT-Knopf.</p>
              <h3>Controller (Xbox, PlayStation, Switch)</h3>
              <p>Stick/Steuerkreuz lenken, A oder RT Gas, B Bremse, R Driften, L/LT Gegenstand, Start Pause. Menüs gehen auch mit dem Controller. Bei Treffern vibriert er.</p>
              <h3>Mehrspieler (2–4)</h3>
              <p>Jeder mit eigenem Controller – oder Tastatur teilen: links <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, Driften <kbd>Leertaste</kbd>, Gegenstand <kbd>Q</kbd>; rechts Pfeiltasten, Driften <kbd>Shift</kbd>/<kbd>L</kbd>, Gegenstand <kbd>Enter</kbd>/<kbd>K</kbd>.</p>
            </div>
          </div>
          <h3>Gegenstände aus den Funkel-Kisten</h3>
          <p class="items-help">Turbo-Beere · Panzer · Goldpanzer (sucht sich ein Ziel) · Krabbelkäfer (hinten ablegen) · Kickbombe · Funkenblüte (3 Funkenbälle) · Funkelstern (unverwundbar) · Riesentrank · Zauberkugel (trifft die Spitze)</p>
          <p class="items-help">Bitcoins machen dein Kart schneller (bis zu 10). Turbo-Pfeile und Schanzen nutzen – in der Luft Drift drücken für einen Trick-Turbo! Blaue Schanzen öffnen den Gleiter: im Gleitflug lenken.</p>
          <h3>Mehrere Handys</h3>
          <p class="items-help"><b>Über das Internet</b> (beliebig weit weg): einer wählt „Spiel erstellen“ und nennt den Raumcode, die anderen „Beitreten“ und tippen ihn ein. <b>Ohne Internet</b>: in der iPhone-App findet man Spiele „in der Nähe“ direkt (Bluetooth/WLAN, auch im Flugmodus). Im Browser: alle im selben WLAN – Gastgeber zeigt einen QR-Code, Gast scannt ihn und zeigt seinen Antwort-Code zurück (das iPhone kann im Flugmodus keinen Hotspot öffnen).</p>
          <h3>Grand Prix</h3>
          <p class="items-help">Ein Cup hat vier Strecken, für jeden Platz gibt es Punkte. Wer am Ende die meisten hat, gewinnt den Pokal.</p>
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
              <button class="opt ${!s.autoGas ? 'on' : ''}" data-gas="0">Knopf<small>2× Gas = Drift, halten = weiterdriften</small></button>
              <button class="opt ${s.autoGas ? 'on' : ''}" data-gas="1">automatisch</button>
            </div>
            <h3>Tageszeit</h3><div class="row">
              <button class="opt ${!s.night ? 'on' : ''}" data-night="0">☀️ Tag</button>
              <button class="opt ${s.night ? 'on' : ''}" data-night="1">🌙 Nacht<small>Laternen, Scheinwerfer, Neon</small></button>
            </div>
            <h3>Wetter</h3><div class="row">${[['sun', '☀️ Sonne', ''], ['rain', '🌧️ Regen', 'nasse Straße, Gischt'], ['calima', '🌫️ Calima', 'Saharastaub-Dunst'], ['random', '🎲 Zufall', 'jedes Rennen anders']].map(([v, n, d]) => `<button class="opt ${(s.weather ?? 'sun') === v ? 'on' : ''}" data-weather="${v}">${n}${d ? `<small>${d}</small>` : ''}</button>`).join('')}</div>
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
    this.on('[data-weather]', (b) => { s.weather = b.dataset.weather; setWeatherSetting(s.weather); save(SAVE_KEY, s); this.showSettings(); });
    this.on('[data-night]', (b) => { s.night = b.dataset.night === '1'; setNight(s.night); save(SAVE_KEY, s); this.showSettings(); });
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
  get multi() { return (this.party && this.party.length > 1) || !!this.netHost; }
  get netHost() { return this.net?.isHost && this.net.guests.some((g) => g.racer) ? this.net : null; }
  partyPlayers() {
    if (this.netHost) return this.net.players();
    return this.party && this.party.length > 1 ? this.party.map((p) => ({ id: p.racer, src: p.src })) : undefined;
  }

  /**
   * Rennen starten: erst die Strecke laden (eigene Welt wie in Mario Kart 8 Deluxe), dann los; beim Gastgeber
   * mehrerer Handys bekommen die Gäste die Startdaten.
   */
  async launch(o) {
    const net = this.netHost;
    this.demoToken = (this.demoToken ?? 0) + 1;   // keine Demo mehr starten
    this.hideAll();
    await this.ctx.loadCourse(o.courseId);
    const race = this.ctx.startRace(net ? { ...o, net } : o);
    if (net) net.startRace(race, { mode: o.mode, courseId: o.courseId, laps: o.laps, roster: o.roster.map((r) => r.id), cc: o.cc });
    return race;
  }

  // ------------------------------------------------------------------ Mehrere Handys
  /** Im Browser: deutlich sagen, dass es hier kein Bluetooth gibt (nur in der iPhone-App). */
  noBluetoothBox() {
    if (nearbyAvailable()) return '';
    return `<div class="glass netcode nobt"><p>📵 <b>Hier im Browser gibt es kein Bluetooth</b></p><small>Apple erlaubt Webseiten
      (Safari, Home-Bildschirm) keinen Zugriff auf Bluetooth – Bluetooth am iPhone einschalten hilft deshalb nicht.
      Handys <b>ohne Internet</b> verbinden geht nur mit der <b>iPhone-App</b> (beide Handys!). Im Browser:
      Raumcode übers Internet oder QR-Kopplung im selben WLAN.</small></div>`;
  }

  showMultiChoice() {
    this.ensureDemo();
    const card = (k, ic, name, sub) => `<button class="card cup" data-mc="${k}"><div class="trophy won">${ic}</div><span>${name}</span><small>${sub}</small></button>`;
    const app = nearbyAvailable();
    this.show('multichoice', `
      <div class="mscreen">
        ${this.head('Mehrspieler', 'wie wollt ihr spielen?')}
        <div class="mbody"><div class="grid cups">
          ${card('couch', '🎮', 'Ein Bildschirm', '2–4 Spieler mit Controllern oder geteilter Tastatur')}
          ${card('host', '📡', 'Mehrere Handys: Spiel erstellen', app ? 'du bist Gastgeber – Handys in der Nähe (auch Flugmodus) oder übers Internet' : 'du bist Gastgeber – über Internet oder im selben WLAN')}
          ${card('join', '📲', 'Mehrere Handys: Beitreten', app ? 'Spiel in der Nähe antippen oder Raumcode' : 'mit Raumcode oder QR-Code')}
        </div>
        ${app ? '' : `<div class="mbox-nobt">${this.noBluetoothBox()}</div>`}
        <p class="lobby-tip">${app
    ? '✈️ Im Flugzeug: Flugmodus an, dann <b>WLAN und Bluetooth wieder einschalten</b> – die Handys mit der App finden sich direkt, ganz ohne Internet.'
    : '✈️ Im Flugzeug: ein Bildschirm geht immer (Controller per Bluetooth). Mehrere Handys brauchen ein gemeinsames WLAN – das iPhone kann im Flugmodus keinen Hotspot öffnen, viele Android-Handys schon. Direkt per Bluetooth geht es nur in der iPhone-App.'}</p>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-mc="couch"]', () => this.showLobby());
    this.on('[data-mc="host"]', () => this.showNetHost());
    this.on('[data-mc="join"]', () => this.showNetJoin());
    this.on('[data-back]', () => this.showTitle());
  }

  netHandlers() {
    return {
      onChange: () => { if (this.screen === 'nethost') this.renderNetHost(); if (this.screen === 'netlobby' || this.screen === 'netjoin') this.renderNetGuest(); },
      onStart: (o) => this.startGuestRace(o),
      onDone: (m) => { const r = this.ctx.race; if (r?.netGuest) r.netDone(m.res.map((x) => ({ ...x, isPlayer: x.id === this.net.myRacer }))); },
      onMenu: () => { if (!this.net?.isHost) { this.ctx.endRace(); this.ensureDemo(); this.renderNetGuest(); } },
      onLost: (msg) => { this.ctx.endRace(); this.net = null; this.ensureDemo(); this.showNetMessage(msg); },
    };
  }

  leaveNet() { this.net?.close(); this.net = null; }

  showNetMessage(msg) {
    this.show('netmsg', `
      <div class="mscreen">${this.head('Mehrspieler')}
        <div class="mbody center"><div class="glass" style="text-align:center;max-width:520px">
          <p style="font-weight:800">${msg}</p>
          <div class="row"><button class="go" data-back data-focus>OK</button></div>
        </div></div></div>${this.hints()}`, 'full');
    this.on('[data-back]', () => this.showMultiChoice());
  }

  async showNetHost() {
    if (!this.net?.isHost) {
      this.leaveNet();
      this.net = new NetSession('host', this.netHandlers());
      this.net.racerIds = RACERS.map((r) => r.id);
      this.net.myRacer = this.settings.racer;
      this.netStatus = navigator.onLine ? 'Raum wird geöffnet …' : nearbyAvailable() ? '' : 'Kein Internet – koppelt die Handys per QR-Code im selben WLAN.';
      if (nearbyAvailable()) {
        const name = `Spiel von ${RACER_BY_ID[this.net.myRacer]?.name ?? 'Lotti'} (${10 + Math.floor(Math.random() * 90)})`;
        this.nearbyStatus = 'wird sichtbar …';
        const n = this.net;
        n.openNearby(name, (msg) => { this.nearbyStatus = msg; if (this.screen === 'nethost') this.renderNetHost(); })
          .then(() => { this.nearbyStatus = ''; if (this.screen === 'nethost' && this.net === n) this.renderNetHost(); })
          .catch((e) => { this.nearbyStatus = `nicht möglich: ${e.message ?? e}`; if (this.screen === 'nethost' && this.net === n) this.renderNetHost(); });
      }
      if (navigator.onLine) {
        this.net.openOnline().then((code) => { this.netStatus = ''; this.net.code = code; this.renderNetHost(); })
          .catch(() => { this.netStatus = nearbyAvailable() ? 'Kein Internet – Raumcode nicht möglich.' : 'Raumcode nicht möglich (kein Internet?) – koppelt per QR-Code im selben WLAN.'; this.renderNetHost(); });
      }
    }
    this.renderNetHost();
  }

  renderNetHost() {
    this.ensureDemo();
    const n = this.net, r = this.ctx.renderer;
    const url = `${nearbyAvailable() ? PUBLIC_URL : location.origin + location.pathname}?join=${n.code ?? ''}`;
    const me = RACER_BY_ID[n.myRacer];
    const rows = [`<div class="pslot" style="--pc:${PCOL[0]}"><div class="ptag">P1</div><img src="${racerIcon(r, me)}" alt="" /><b style="color:${me.color}">${me.name}</b><small>Gastgeber (dieses Handy)</small>
        <div class="row"><button class="small" data-me="-1">◀</button><button class="small" data-me="1">▶</button></div></div>`,
      ...n.guests.map((g, i) => { const d = RACER_BY_ID[g.racer]; return d ? `<div class="pslot ready" style="--pc:${PCOL[(i + 1) % 4]}"><div class="ptag">P${i + 2}</div><img src="${racerIcon(r, d)}" alt="" /><b style="color:${d.color}">${d.name}</b><small>📱 Gast verbunden</small></div>` : ''; })].join('');
    this.show('nethost', `
      <div class="mscreen">
        ${this.head('Spiel erstellen', 'Gastgeber · mehrere Handys')}
        <div class="mbody"><div class="netwrap"><div class="netcol">
          ${this.noBluetoothBox()}
          ${nearbyAvailable() ? `<div class="glass netcode near"><p>📶 <b>In der Nähe</b> – auch im Flugmodus</p>
            ${n.nearbyName && !this.nearbyStatus ? `<div class="bigcode small">${n.nearbyName}</div><small>Andere tippen in ihrer App auf „Beitreten“ und wählen dieses Spiel. WLAN und Bluetooth müssen an sein (geht auch im Flugmodus).</small>` : `<small>${this.nearbyStatus ?? ''}</small>`}
          </div>` : ''}
          <div class="glass netcode" ${nearbyAvailable() && !n.code && !this.netStatus ? 'hidden' : ''}>
            ${n.code ? `<p>Raumcode</p><div class="bigcode">${n.code}</div><div class="qr">${qrSVG(url, 3)}</div><small>Mit dem Handy scannen oder den Code unter „Beitreten“ eingeben – klappt über beliebige Entfernungen.</small>` : `<p>${this.netStatus || ''}</p>`}
            ${nearbyAvailable() ? '' : '<div class="row"><button class="small" data-offline>📶 Ohne Internet koppeln (QR)</button></div>'}
          </div></div>
          <div class="lobby">${rows}</div>
        </div>
        <div class="row"><button data-back>Zurück</button><button class="go" data-next ${n.guests.some((g) => g.racer) ? 'data-focus' : 'disabled'}>Weiter</button></div></div>
      </div>${this.hints()}`, this.screen === 'nethost' ? 'full still' : 'full');
    this.on('[data-me]', (b) => { const k = RACERS.findIndex((x) => x.id === n.myRacer); let j = k; do { j = (j + Number(b.dataset.me) + RACERS.length) % RACERS.length; } while (n.guests.some((g) => g.racer === RACERS[j].id)); n.setMyRacer(RACERS[j].id); this.settings.racer = RACERS[j].id; save(SAVE_KEY, this.settings); this.renderNetHost(); });
    this.on('[data-offline]', () => this.showNetOffer());
    this.on('[data-back]', () => { this.leaveNet(); this.showMultiChoice(); });
    this.on('[data-next]', () => { this.party = null; this.showMpModes(); });
  }

  /** Gastgeber ohne Internet: Angebot als QR zeigen, Antwort des Gasts scannen. */
  async showNetOffer() {
    const n = this.net;
    this.show('netoffer', `<div class="mscreen">${this.head('Handy koppeln', 'ohne Internet · gleiches WLAN oder Hotspot')}<div class="mbody center"><div class="glass"><p>Code wird erstellt …</p></div></div></div>`, 'full');
    let code;
    try { code = await n.newOffer(); } catch (e) { this.showNetMessage(`Koppeln nicht möglich: ${e.message}`); return; }
    this.show('netoffer', `
      <div class="mscreen">
        ${this.head('Handy koppeln', 'ohne Internet · gleiches WLAN oder Hotspot')}
        <div class="mbody"><div class="netwrap">
          <div class="glass netcode"><p><b>1.</b> Der Gast wählt „Beitreten → QR scannen“ und scannt diesen Code:</p><div class="qr big">${qrSVG(code, 3)}</div>
            <details><summary>Code als Text</summary><textarea readonly>${code}</textarea></details></div>
          <div class="glass netcode"><p><b>2.</b> Dann den Antwort-Code vom Gast-Handy scannen:</p>
            <video class="scan" playsinline muted></video>
            <div class="row"><button class="small" data-cam>📷 Kamera starten</button></div>
            <details><summary>Antwort als Text einfügen</summary><textarea class="ans" placeholder="LGK1A…"></textarea><button class="small" data-paste>Übernehmen</button></details>
            <p class="netinfo"></p></div>
        </div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    const info = this.el.querySelector('.netinfo');
    const done = async (text) => {
      info.textContent = 'Verbinde …';
      try { this.stopScan?.(); await n.acceptAnswer(text); this.ctx.audio.sfx('oneup'); this.renderNetHost(); } catch (e) { info.textContent = e.message; }
    };
    this.on('[data-cam]', async () => { try { this.stopScan = await scanQR(this.el.querySelector('video.scan'), (t) => { if (t.startsWith('LGK1A')) done(t); }); } catch (e) { info.textContent = 'Kamera nicht verfügbar – Antwort als Text einfügen.'; } });
    this.on('[data-paste]', () => done(this.el.querySelector('textarea.ans').value));
    this.on('[data-back]', () => { this.stopScan?.(); this.renderNetHost(); });
  }

  showNetJoin(code = '') {
    if (!this.net || this.net.isHost) {
      this.leaveNet();
      this.net = new NetSession('guest', this.netHandlers());
      this.net.myRacer = this.settings.racer;
    }
    this.show('netjoin', `
      <div class="mscreen">
        ${this.head('Beitreten', 'mehrere Handys')}
        <div class="mbody"><div class="netwrap"><div class="netcol">
          ${this.noBluetoothBox()}
          ${nearbyAvailable() ? `<div class="glass netcode near"><p>📶 <b>In der Nähe</b> (auch im Flugmodus) – Spiel antippen:</p>
            <div class="nearlist"><small>Suche … (WLAN und Bluetooth an?)</small></div></div>` : ''}
          <div class="glass netcode"><p><b>Mit Internet</b> – Raumcode vom Gastgeber eingeben:</p>
            <input class="codein" maxlength="4" autocapitalize="characters" autocomplete="off" placeholder="z. B. K7P2" value="${code}" />
            <div class="row"><button class="go" data-join>Beitreten</button></div></div>
          ${nearbyAvailable() ? '' : `<div class="glass netcode"><p><b>Ohne Internet</b> (gleiches WLAN) – QR-Code vom Gastgeber scannen:</p>
            <video class="scan" playsinline muted></video>
            <div class="row"><button class="small" data-cam>📷 Kamera starten</button></div>
            <details><summary>Code als Text einfügen</summary><textarea class="off" placeholder="LGK1O…"></textarea><button class="small" data-paste>Übernehmen</button></details>
            <div class="answer"></div></div>`}
        </div>
        <p class="lobby-tip netinfo"></p>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    const info = this.el.querySelector('.netinfo');
    const join = async () => {
      const c = this.el.querySelector('.codein').value.trim();
      if (c.length < 4) { info.textContent = 'Bitte den vierstelligen Raumcode eingeben.'; return; }
      info.textContent = 'Verbinde …';
      try { await this.net.joinOnline(c); this.renderNetGuest(); } catch (e) { info.textContent = e.message ?? String(e); }
    };
    const offer = async (text) => {
      try {
        this.stopScan?.();
        const ans = await this.net.answer(text);
        this.el.querySelector('.answer').innerHTML = `<p><b>Jetzt diesen Code dem Gastgeber zeigen:</b></p><div class="qr big">${qrSVG(ans, 3)}</div><details><summary>Als Text</summary><textarea readonly>${ans}</textarea></details>`;
        info.textContent = 'Warte auf den Gastgeber …';
      } catch (e) { info.textContent = e.message; }
    };
    this.on('[data-join]', join);
    if (nearbyAvailable()) this.findNearby(info);
    this.on('[data-cam]', async () => { try { this.stopScan = await scanQR(this.el.querySelector('video.scan'), (t) => { if (t.startsWith('LGK1O')) offer(t); else if (/[?&]join=/.test(t)) { this.el.querySelector('.codein').value = t.split('join=')[1].slice(0, 4); join(); } }); } catch (e) { info.textContent = 'Kamera nicht verfügbar – Code als Text einfügen.'; } });
    this.on('[data-paste]', () => offer(this.el.querySelector('textarea.off').value));
    this.on('[data-back]', () => { this.stopScan?.(); this.leaveNet(); this.showMultiChoice(); });
    if (code && code.length === 4) join();
  }

  /** Gast in der App: Spiele in der Nähe auflisten; Antippen tritt bei. */
  findNearby(info) {
    const n = this.net;
    const box = () => (this.screen === 'netjoin' && this.net === n ? this.el.querySelector('.nearlist') : null);
    const render = (list) => {
      n.nearList = list;
      const el = box();
      if (!el) return;
      el.innerHTML = list.length ? list.map((p) => `<button class="small nearbtn" data-near="${p.id}">🏁 ${p.name.replace(/[<>&"]/g, '')}</button>`).join('') : '<small>Suche … (WLAN und Bluetooth an?)</small>';
      for (const b of el.querySelectorAll('[data-near]')) {
        b.addEventListener('click', async () => {
          this.ctx.audio.sfx('select');
          info.textContent = 'Verbinde …';
          try { await n.joinNearby(b.dataset.near); this.renderNetGuest(); } catch (e) { info.textContent = e.message ?? String(e); }
        });
      }
    };
    if (n.finder) { render(n.nearList ?? []); return; }
    // nach 10 s ohne Treffer: Hinweise, woran es meistens liegt
    const t0 = Date.now();
    const help = () => {
      if (this.screen !== 'netjoin' || this.net !== n || n.link) return;
      const el = box();
      if (el && !(n.nearList ?? []).length && Date.now() - t0 > 10000) {
        el.innerHTML = `<small>Noch nichts gefunden. Bitte prüfen:<br/>1. Beide Handys nutzen die <b>App</b> (nicht Safari), eins hat „Spiel erstellen“ offen.<br/>
          2. Auf beiden im Kontrollzentrum <b>WLAN und Bluetooth</b> an (WLAN darf ohne Netz sein).<br/>
          3. <b>Einstellungen → Lotti &amp; Greta Kart → Lokales Netzwerk</b> einschalten (auf beiden).<br/>
          4. Handys nah beieinander, Bildschirm an, App im Vordergrund. Danach „Zurück“ und nochmal öffnen.</small>`;
        return;
      }
      setTimeout(help, 1000);
    };
    setTimeout(help, 1000);
    n.findNearby(RACER_BY_ID[n.myRacer]?.name ?? 'Gast', render, (msg) => { info.textContent = msg; })
      .catch((e) => { info.textContent = `Suche nicht möglich: ${e.message ?? e}`; });
  }

  /** Gast: verbunden – Figur wählen und auf den Start warten. */
  renderNetGuest() {
    const n = this.net;
    if (!n || n.isHost || !n.link) return;
    const r = this.ctx.renderer;
    const lob = n.lobby?.players ?? [];
    const slots = lob.map((p, i) => { const d = RACER_BY_ID[p.racer]; if (!d) return ''; const me = p.id === n.myId; return `<div class="pslot ${me ? '' : 'ready'}" style="--pc:${PCOL[i % 4]}"><div class="ptag">P${i + 1}</div><img src="${racerIcon(r, d)}" alt="" /><b style="color:${d.color}">${d.name}</b><small>${i === 0 ? 'Gastgeber' : me ? 'Du' : 'Gast'}</small>${me ? '<div class="row"><button class="small" data-pick="-1">◀</button><button class="small" data-pick="1">▶</button></div>' : ''}</div>`; }).join('');
    this.show('netlobby', `
      <div class="mscreen">
        ${this.head('Verbunden!', n.lobby?.code ? `Raum ${n.lobby.code}` : n.finder ? 'in der Nähe' : 'ohne Internet')}
        <div class="mbody"><div class="lobby">${slots}</div>
          <p class="lobby-tip">Wähle deine Figur – der Gastgeber sucht die Strecke aus und startet.</p>
          <div class="row"><button data-back>Verlassen</button></div></div>
      </div>${this.hints()}`, this.screen === 'netlobby' ? 'full still' : 'full');
    this.on('[data-pick]', (b) => {
      const taken = new Set(lob.filter((p) => p.id !== n.myId).map((p) => p.racer));
      let j = RACERS.findIndex((x) => x.id === n.myRacer);
      do { j = (j + Number(b.dataset.pick) + RACERS.length) % RACERS.length; } while (taken.has(RACERS[j].id));
      n.pick(RACERS[j].id); this.settings.racer = RACERS[j].id; save(SAVE_KEY, this.settings);
    });
    this.on('[data-back]', () => { this.leaveNet(); this.showMultiChoice(); });
  }

  /** Gast: Rennen nach den Startdaten des Gastgebers aufbauen. */
  async startGuestRace(o) {
    const n = this.net;
    this.demoToken = (this.demoToken ?? 0) + 1;
    this.hideAll();
    await this.ctx.loadCourse(o.courseId);
    const race = this.ctx.startRace({
      mode: o.mode, courseId: o.courseId, laps: o.laps, roster: o.roster.map((id) => RACER_BY_ID[id]),
      playerId: n.myRacer, players: [{ id: n.myRacer, src: 'auto' }], cc: o.cc, assist: this.settings.assist, net: n,
      onDone: (res) => this.showResults(res, { trackDef: TRACK_BY_ID[o.courseId], netGuest: true }),
    });
    n.race = race;
  }

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
        ${this.head('Was wollt ihr fahren?', `${this.humanIds.length} Spieler · ${CC[this.settings.cc].label}`)}
        <div class="mbody"><div class="grid cups">
          ${card('gp', '🏆', 'Grand Prix', 'Cup mit 4 Rennen und Punkten')}
          ${card('single', '🏁', 'Rennen', 'eine Strecke frei wählen')}
        </div>
        <div class="row"><button data-back>Zurück</button></div></div>
      </div>${this.hints()}`, 'full');
    this.on('[data-mm]', (b) => { this.mode = b.dataset.mm; this.afterRacer(); });
    this.on('[data-back]', () => (this.netHost ? this.renderNetHost() : this.showLobby()));
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
              <p>Spiel vorher einmal online öffnen – danach läuft es ohne Internet. Mehrspieler auf einem iPad/Laptop mit Controllern (Bluetooth darf im Flugmodus an sein) oder geteilter Tastatur. Mehrere iPhones: mit der iPhone-App direkt in der Nähe.</p>
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
  get humanIds() {
    if (this.netHost) return this.net.players().map((p) => p.id);
    return this.party && this.party.length > 1 ? this.party.map((p) => p.racer) : [this.settings.racer];
  }
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
    this.launch({
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
    return this.launch({
      mode: 'gp', courseId: trackDef.id, roster: this.roster(s.racer, g.order), playerId: this.leadId, players: this.partyPlayers(), cc: s.cc,
      laps: s.laps, assist: s.assist,
      onDone: (res) => this.showResults(res, { trackDef, gp: true }),
      onEvent: (e, v, r) => this.onRaceEvent(e, v, r),
    }).then((race) => { this.ctx.hud.message(`${g.cup.name} · Rennen ${g.index + 1}/${g.cup.tracks.length}`, 2.6, 'intro'); return race; });
  }

  onRaceEvent(e, v) {
    if (this.ctx.race?.split) return;   // Zieleinlauf zeigt das Rennen selbst in der jeweiligen Bildhälfte
    if (e === 'finish') {
      const msg = v === 1 ? 'Super – 1. Platz!' : v <= 3 ? `Toll – ${v}. Platz!` : `${v}. Platz`;
      this.ctx.hud.message(msg, 4, v <= 3 ? 'good' : '');
    }
  }

  showResults(res, { trackDef = null, gp = false, single = false, title = '', netGuest = false }) {
    if (netGuest) { this.showGuestResults(res, title || trackDef?.name || 'Ergebnis'); return; }
    const r = this.ctx.renderer;
    const me = res.find((x) => x.isPlayer);
    // Bestzeit
    let record = false;
    if (me && me.place && trackDef && !this.multi) {
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
      rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}${tag(x)}</td><td>${fmtTime(x.time)}</td><td>${isFinite(x.best) ? `Runde ${fmtTime(x.best)}` : ''}</td></tr>`).join('');
    }
    const last = gp && this.gp.index >= this.gp.cup.tracks.length - 1;
    this.show('results', `
      <div class="mscreen">
        ${this.head(title || trackDef?.name || 'Ergebnis', gp ? `${this.gp.cup.name} · Rennen ${this.gp.index + 1}/${this.gp.cup.tracks.length}` : '')}
        <div class="mbody"><div class="results-wrap">
          ${record && me ? `<p class="record">Neue Bestzeit: ${fmtTime(me.time)}!</p>` : ''}
          <table>${rows}</table>
          <div class="row">
            ${gp ? `<button class="go" data-next data-focus>${last ? 'Gesamtwertung' : 'Nächstes Rennen'}</button>` : `<button class="go" data-again data-focus>Nochmal</button><button data-other>Andere Strecke</button>`}
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
    this.on('[data-again]', () => this.startSingle(trackDef));
    this.on('[data-other]', () => { this.ctx.endRace(); this.ensureDemo(); this.showTracks(); });
    this.on('[data-menu]', () => { this.gp = null; this.ctx.endRace(); if (this.netHost) { this.net.toMenu(); this.ensureDemo(); this.renderNetHost(); } else this.showTitle(); });
  }

  /** Gast: Ergebnisse vom Gastgeber; das nächste Rennen startet der Gastgeber. */
  showGuestResults(res, title) {
    const r = this.ctx.renderer;
    const rows = res.map((x, i) => `<tr class="${x.isPlayer ? 'me' : ''}"><td class="pl">${i + 1}.</td><td><img src="${racerIcon(r, RACER_BY_ID[x.id])}" alt="" /></td><td>${x.name}</td><td>${fmtTime(x.time)}</td></tr>`).join('');
    this.show('results', `
      <div class="mscreen">
        ${this.head(title, 'Mehrspieler')}
        <div class="mbody"><div class="results-wrap"><table>${rows}</table>
          <p class="lobby-tip">Warte auf den Gastgeber …</p>
          <div class="row"><button data-leave>Verlassen</button></div></div></div>
      </div>`, 'results dim');
    this.ctx.hud.show(false);
    this.ctx.touch.show(false);
    this.on('[data-leave]', () => { this.ctx.endRace(); this.leaveNet(); this.ensureDemo(); this.showMultiChoice(); });
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
    this.on('[data-menu]', () => { this.gp = null; this.ctx.endRace(); if (this.netHost) { this.net.toMenu(); this.ensureDemo(); this.renderNetHost(); } else this.showTitle(); });
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
      this.startSingle(race.def);
    });
    this.on('[data-quit]', () => { this.gp = null; this.ctx.endRace(); if (this.net) { if (this.net.isHost) { this.net.toMenu(); this.ensureDemo(); this.renderNetHost(); } else { this.leaveNet(); this.ensureDemo(); this.showMultiChoice(); } } else this.showTitle(); });
  }

  resume() {
    this.ctx.paused = false;
    this.hideAll();
  }
}

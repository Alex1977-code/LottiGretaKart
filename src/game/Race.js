// Ein Rennen in der Insel-Welt (wie Mario Kart World). Die Welt (Gelände, Strecken, Kulisse, Himmel) besteht
// dauerhaft; das Rennen legt Fahrer, Gegenstände, Gefahren und Effekte in eine eigene Gruppe und folgt einem
// Rennpfad (RacePath). Modi:
//   race   Runden auf einer Strecke                  gp     Grand Prix: ab dem 2. Rennen mit Anfahrt
//   trial  Zeitfahren (allein, drei Turbo-Beeren)     ko     K.-o.-Tour über die Insel mit Checkpoints
//   free   Freie Fahrt (offene Welt, Sternmünzen)     demo   Menü-Hintergrund (nur Computer-Fahrer)
// Zustände: intro → countdown → race → finish → done (Freie Fahrt/Demo: free/demo)
// Mehrspieler: bis zu vier Menschen im geteilten Bildschirm (je Spieler Kamera, Anzeige und Eingabequelle).

import * as THREE from 'three';
import { Racer } from './Racer.js';
import { Items } from './items.js';
import { Hazards } from './hazards.js';
import { Effects } from './effects.js';
import { RacePath } from './RacePath.js';
import { initAI, aiInput } from './ai.js';
import { readDrive, touch, rumble } from '../ui/input.js';
import { Hud } from '../ui/hud.js';
import { SPARK_COLORS } from './kartModel.js';
import { getModel } from '../lgw/course/models/index.js';
import { getTheme } from '../world/themes.js';

const TAU = Math.PI * 2;
const wrapA = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
const damp = (c, t, r, dt) => c + (t - c) * (1 - Math.exp(-r * dt));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const CC = {
  50: { label: 'Gemütlich', mult: 0.86, skill: 0.25, rubber: 0.06, ai: 0.93 },
  100: { label: 'Flott', mult: 1.0, skill: 0.55, rubber: 0.08, ai: 0.98 },
  150: { label: 'Rasant', mult: 1.14, skill: 0.85, rubber: 0.1, ai: 1.02 },
};

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Race {
  /**
   * @param {object} app  { renderer, camera, audio, hud, world, worldView, sky, scene, quality }
   * @param {object} o    { mode, courseId, fromId, laps, tour, roster (Startreihenfolge, vorn zuerst), playerId, cc, assist,
   *                        players ([{ id, src }] für Mehrspieler; sonst playerId mit Eingabe 'auto'),
   *                        seed, onDone(results), onEvent(name, value, racer) }
   */
  constructor(app, o) {
    this.app = app;
    this.audio = app.audio;
    this.hud = app.hud;
    this.camera = app.camera;
    this.view = { renderer: app.renderer };
    this.world = app.world;
    this.mode = o.mode ?? 'race';
    this.demo = this.mode === 'demo';
    this.free = this.mode === 'free';
    this.trial = this.mode === 'trial';
    this.ko = this.mode === 'ko';
    this.assist = !!o.assist;
    this.ccKey = o.cc ?? 100;
    this.ccDef = CC[this.ccKey] ?? CC[100];
    this.cc = this.ccDef.mult;
    this.rnd = mulberry(o.seed ?? (Date.now() & 0xffff));
    this.time = 0; this.clock = 0;
    this.stateT = 0;
    this.shake = 0;
    this.finishOrder = [];
    this.outOrder = [];
    this.onDone = o.onDone ?? null;
    this.onEvent = o.onEvent ?? null;
    this.tour = o.tour ?? null;

    // Rennpfad
    const w = this.world;
    if (this.ko) this.track = RacePath.forTour(w, o.tour.stops, o.tour.survivors);
    else if (this.free) this.track = null;
    else if (this.mode === 'gp' && o.fromId && o.fromId !== o.courseId) this.track = RacePath.forRoute(w, o.fromId, o.courseId, o.laps ?? 2);
    else this.track = RacePath.forCourse(w, o.courseId, o.laps ?? 3);
    this.laps = this.track?.laps ?? 1;
    this.course = w.courseById[o.courseId ?? this.track?.courseId ?? 'kraxelwiese'] ?? w.courses[0];
    this.def = this.course.def;
    this.theme = this.course.theme;
    this.label = this.track?.label ?? 'Freie Fahrt';

    // Gruppe für alles Rennen-eigene (wird mit dispose entfernt)
    this.scene = new THREE.Group();
    this.scene.name = 'rennen';
    app.scene.add(this.scene);
    this.effects = new Effects(this.scene);
    this.items = new Items(this);
    this.items.build(w, { boxes: !this.trial });
    this.hazards = new Hazards(this);
    this.hazards.build(w);
    // Licht an der Spielerin (dunkel in Höhle und Zelt; Stärke folgt der Region, Anzahl Lichter bleibt gleich)
    this.playerLight = new THREE.PointLight(0xffd0a0, 0, 24, 1.5);
    this.scene.add(this.playerLight);

    // Fahrer
    this.racers = [];
    const players = this.demo ? [] : o.players ?? (o.playerId ? [{ id: o.playerId, src: 'auto' }] : []);
    this.humans = [];
    o.roster.forEach((def, slot) => {
      const pi = players.findIndex((p) => p.id === def.id);
      const isPlayer = pi >= 0;
      const r = new Racer(this, def, slot, isPlayer);
      if (!isPlayer) initAI(r, clamp(this.ccDef.skill + (this.rnd() - 0.5) * 0.3, 0.1, 1), this.rnd);
      else { r.pi = pi; r.src = players[pi].src ?? 'auto'; this.humans[pi] = r; }
      r.lap = 1;
      this.racers.push(r);
    });
    this.humans = this.humans.filter(Boolean);
    this.player = this.humans[0] ?? null;
    this.split = this.humans.length > 1;
    if (this.free) this.setupFree(); else this.grid();
    if (this.trial) for (const h of this.humans) h.item = { id: 'beere3', charges: 3 };
    // Start-Ampel neben der Startlinie
    if (this.track) {
      const q = this.track.pointAtS(this.track.startS + 8, 0);
      const side = this.track.pointAtS(this.track.startS + 8, -(q.hw + 2.6));
      this.trafficLight = { model: getModel('traffic_light'), state: 'off' };
      const m = this.trafficLight.model.root;
      m.position.set(side.x, Math.max(0, side.y), side.z);
      m.rotation.y = side.yaw + Math.PI;
      m.scale.setScalar(1.15);
      this.scene.add(m);
    }
    this.camState = { pos: new THREE.Vector3(), look: new THREE.Vector3(), yaw: 0, fov: 70 };
    this.focus = (this.player ?? this.racers[0]).pos;
    this.setupViews();
    this.introSetup();
    this.ambT = 0;
  }

  /**
   * Ansichten: eine je Mensch (Kamera, Kamerazustand, Anzeige). Einzelspieler nutzt Kamera und Anzeige der App;
   * im geteilten Bildschirm bekommt jeder Spieler eine eigene Kamera und eine eigene Anzeige über seinem Bildteil.
   * Bei drei Spielern zeigt das vierte Feld die Spitze des Rennens.
   */
  setupViews() {
    if (!this.split) {
      this.views = [{ racer: this.player, cam: this.camera, cs: this.camState, hud: this.demo ? null : this.hud, shake: 0 }];
      this.views[0].hud?.setupMap(this);
      return;
    }
    this.splitRoot = document.createElement('div');
    this.splitRoot.className = 'splitviews';
    (document.getElementById('ui') ?? document.body).prepend(this.splitRoot);
    this.app.hud?.show(false);
    const mk = (racer) => {
      const el = document.createElement('div');
      el.className = `hudview n${this.humans.length}`;
      this.splitRoot.appendChild(el);
      const cam = new THREE.PerspectiveCamera(64, 1, 0.1, this.camera.far);
      const cs = { pos: new THREE.Vector3(), look: new THREE.Vector3(), yaw: 0, fov: 64 };
      let hud = null;
      if (racer) { hud = new Hud(el, this.view.renderer); hud.setupMap(this); hud.show(true); hud.el.classList.add(`p${racer.pi + 1}`); }
      return { racer, cam, cs, hud, el, shake: 0 };
    };
    this.views = this.humans.map((h) => mk(h));
    if (this.humans.length === 3) this.views.push(mk(null));
  }

  /** Ansicht eines Fahrers (Mensch) oder null. */
  viewOf(r) { return this.views?.find((v) => v.racer === r) ?? null; }
  hudOf(r) { return this.viewOf(r)?.hud ?? null; }
  /** Anzeigen aller Menschen (für gemeinsame Einblendungen). */
  huds() { return (this.views ?? []).map((v) => v.hud).filter(Boolean); }
  /** Kleinster quadrierter Abstand zu einem der Kamera-Mittelpunkte (Sichtbarkeit, Simulation in der Nähe). */
  focusDist2(x, z) {
    let d = Infinity;
    for (const f of this.foci ?? [this.focus]) if (f) d = Math.min(d, (x - f.x) ** 2 + (z - f.z) ** 2);
    return d;
  }

  /** Startaufstellung: zwei Reihen versetzt hinter der Startlinie des Pfads. */
  grid() {
    const tr = this.track;
    this.racers.forEach((r, k) => {
      const row = Math.floor(k / 2), side = k % 2 ? 1 : -1;
      const s = tr.startS - 5 - row * 4.2 - (k % 2) * 1.6;
      const p0 = tr.pointAtS(s, 0);
      const p = tr.pointAtS(s, side * Math.min(2.6, p0.hw * 0.4));
      r.placeAt(p.x, p.z, p.yaw, p.i);
      r.updateProgress(r.loc);
    });
  }

  /** Freie Fahrt: Spielerin an der Kraxelwiese, Computer-Fahrer kreisen auf ihren Heimstrecken. */
  setupFree() {
    const w = this.world, ids = w.courses.map((c) => c.id);
    this.racers.forEach((r, k) => {
      if (r.isPlayer) {
        const tr = w.courseById.kraxelwiese.track, p = tr.pointAt(0.02, ((r.pi ?? 0) - (this.humans.length - 1) / 2) * 3);
        r.path = null;
        r.placeAt(p.x, p.z, p.yaw);
        return;
      }
      const cid = ids[k % ids.length];
      r.path = RacePath.loop(w, cid, 40);
      const s = r.path.startS + 30 + this.rnd() * (r.path.length * 0.05);
      const p = r.path.pointAtS(s, (this.rnd() - 0.5) * 4);
      r.placeAt(p.x, p.z, p.yaw, p.i);
      r.updateProgress(r.loc);
    });
    // Sternmünzen
    this.starCoins = w.def.starCoins.map(([x, z], k) => {
      const m = getModel('star_coin');
      const y = Math.max(0, w.heightAt(x, z));
      m.root.position.set(x, y + 0.9, z);
      m.root.scale.setScalar(1.6);
      this.scene.add(m.root);
      return { k, x, z, y, m, got: !!this.app.collected?.has(k) };
    });
    for (const c of this.starCoins) c.m.root.visible = !c.got;
  }

  // ------------------------------------------------------------------ Hilfen für Gegenstände/KI
  active() { return this.racers.filter((r) => !r.out); }
  leader() { return this.racers.find((r) => r.place === 1 && !r.out) ?? this.racers.find((r) => !r.out); }
  racerAhead(r) { return this.racers.find((o) => o.place === r.place - 1 && !o.out && o.path === r.path) ?? null; }
  racerBehind(r) { return this.racers.find((o) => o.place === r.place + 1 && !o.out && o.path === r.path) ?? null; }

  /** Gummiband: Computer-Fahrer hinter der Spielerin werden etwas schneller, vorn etwas langsamer. */
  rubber(r) {
    if (r.isPlayer || !this.player || r.finished || this.free || !this.player.path) return 1;
    // Bezug: der vorderste Mensch, der noch fährt
    let ref = this.player;
    for (const h of this.humans) if (!h.finished && !h.out && (ref.finished || ref.out || h.progress > ref.progress)) ref = h;
    const d = r.progress - ref.progress;
    const k = this.ccDef.rubber;
    const skill = this.ccDef.ai + 0.05 * ((r.ai?.skill ?? 0.5) - 0.5);
    if (d > 0) return skill * (1 - clamp(d / 160, 0, 1) * k);
    return skill * (1 + clamp(-d / 120, 0, 1) * k * 1.4);
  }

  /** Fortschritt eines Fahrers: Runden, Checkpoints (K.-o.), Ziel. */
  onProgress(r) {
    const tr = r.path;
    if (!tr || r.finished || r.out || tr !== this.track) return;
    let lap = 1;
    for (const m of tr.lapMarks) if (r.progress >= m) lap++;
    lap = Math.min(lap, tr.laps + 1);
    if (lap > r.lap) {
      r.lapTimes.push(this.time - r.lapStart);
      r.lapStart = this.time;
      r.lap = lap;
      this.onLap(r);
    }
    if (this.ko) {
      r.cp = r.cp ?? 0;
      const cp = tr.checkpoints[r.cp];
      if (cp && r.progress >= cp.s) {
        r.cp++;
        cp.passed = (cp.passed ?? 0) + 1;
        if (r.isPlayer) { this.hudOf(r)?.message(`Checkpoint: ${cp.name}`, 1.6, 'good'); this.audio.sfx('checkpoint'); }
        if (cp.passed >= cp.survivors && !cp.closed) this.closeCheckpoint(cp, r.cp);
      }
    }
    if (r.progress >= tr.finishS) this.finishRacer(r);
  }

  /** K.-o.: Sobald genug Fahrer durch sind, scheiden alle anderen aus. */
  closeCheckpoint(cp, index) {
    cp.closed = true;
    const losers = this.racers.filter((r) => !r.out && !r.finished && (r.cp ?? 0) < index).sort((a, b) => a.progress - b.progress);
    for (const r of losers) this.eliminate(r);
    for (const h of this.humans) if (!h.out) this.hudOf(h)?.message(`Weiter! Noch ${this.active().length} im Rennen`, 2.2, 'final');
  }

  eliminate(r) {
    r.out = true;
    r.finished = true;
    r.finishTime = this.time;
    this.outOrder.push(r);
    this.effects.sparkle(r.pos, 0xffffff, 24, 4);
    this.effects.confetti(r.pos, 20, 2);
    r.root.visible = false;
    if (r.isPlayer) {
      const hud = this.hudOf(r), v = this.viewOf(r);
      this.audio.sfx('die');
      hud?.countdown('RAUS!', 'goal');
      setTimeout(() => hud?.countdown(''), 1800);
      this.onEvent?.('out', this.active().length + 1, r);
      if (v) v.spectate = this.leader();
      if (!this.split) this.spectate = this.leader();
      this.checkHumansDone();
    }
  }

  onLap(r) {
    if (!r.isPlayer || r.lap > this.laps) return;
    const hud = this.hudOf(r);
    if (r.lap === this.laps && this.laps > 1) {
      hud?.message('LETZTE RUNDE!', 2.2, 'final');
      this.audio.sfx('timewarn');
      this.audio.energy(true);
    } else if (r.lap > 1) {
      hud?.message(`RUNDE ${r.lap}`, 1.4);
      this.audio.sfx('checkpoint');
    }
  }

  finishRacer(r) {
    r.finished = true;
    r.finishTime = this.time;
    this.finishOrder.push(r);
    r.cancelDrift();
    if (r.isPlayer) this.playerFinished(r);
  }

  /** Sind alle Menschen im Ziel oder ausgeschieden? Dann endet das Rennen bald. */
  checkHumansDone() {
    if (this.state === 'finish' || this.state === 'done') return;
    if (this.humans.every((h) => h.finished || h.out)) {
      this.state = 'finish'; this.stateT = 0;
    }
  }

  onHit(r, kind, by) {
    if (r.isPlayer) {
      const v = this.viewOf(r);
      if (v) v.shake = Math.max(v.shake, kind === 'tumble' ? 0.9 : 0.4);
      rumble(r.src, kind === 'tumble' ? 1 : 0.7, 0.6, kind === 'tumble' ? 420 : 260);
    }
    // wer getroffen hat, freut sich kurz
    if (by && by !== r && by.driver) by.gloatT = 1.1;
  }

  onStar(r, on) {
    if (!r.isPlayer) return;
    if (on) { this.audio.play('course_star'); this.starMusic = true; }
  }

  playerFinished(p = this.player) {
    const hud = this.hudOf(p);
    this.audio.sfx('goalpole');
    const place = this.finishOrder.indexOf(p) + 1;
    hud?.countdown('ZIEL!', 'goal');
    setTimeout(() => hud?.countdown(''), 1800);
    p.ai = null;
    initAI(p, 0.6, this.rnd);
    this.effects.confetti(p.pos, 80, 5);
    if (this.split) hud?.message(place === 1 ? '1. Platz!' : `${place}. Platz`, 4, place <= 3 ? 'good' : '');
    this.onEvent?.('finish', place, p);
    if (this.humans.every((h) => h.finished || h.out)) {
      this.audio.energy(false);
      this.audio.play('course_clear');
      this.checkHumansDone();
    }
  }

  // ------------------------------------------------------------------ Ablauf
  introSetup() {
    this.stateT = 0;
    if (this.demo) { this.state = 'demo'; return; }
    if (this.free) { this.state = 'free'; this.audio.play('course_map'); for (const h of this.huds()) h.message('Freie Fahrt – erkunde die Insel!', 3, 'intro'); return; }
    this.state = 'intro';
    this.audio.play(this.def.music ?? 'course_grass');
  }

  /**
   * Lenkhilfe (für Kinder, abschaltbar): hält die Spielerin auf der Fahrbahn – nahe am Rand lenkt sie sanft zur
   * Mitte zurück; fährt sie verkehrt herum, dreht sie mit.
   */
  steerAssist(r, inp) {
    const tr = r.path;
    if (!tr) return inp;
    const i = r.loc.i, hw = tr.hw[i];
    const k = Math.abs(r.loc.lat) / hw;
    const ahead = tr.pointAt(tr.wrap(i + Math.round((6 + Math.abs(r.speed) * 0.45) / tr.ds)) / (tr.N - 1), r.loc.lat * 0.6);
    const want = Math.atan2(-(ahead.z - r.pos.z), ahead.x - r.pos.x);
    const diff = wrapA(want - r.yaw);
    const auto = clamp(diff * 2.2, -1, 1);
    if (k > 0.7) {
      const w = clamp((k - 0.7) / 0.5, 0, 1) * 0.7;
      inp.steer = clamp(inp.steer * (1 - w) + auto * w, -1, 1);
    }
    if (Math.abs(diff) > 2.2 && !r.drift.on) inp.steer = auto;
    return inp;
  }

  /** Touch: Tippen während des Countdowns zählt als Gasgeben für den Startturbo. */
  startTap() {
    if (this.state !== 'countdown') return;
    for (const h of this.humans) {
      if ((h.src !== 'touch' && h.src !== 'auto') || h.startGas) continue;
      h.startGas = this.cdPhase === 2 ? 2 : this.cdPhase === 1 ? 1 : 0;
    }
  }

  skipIntro() { if (this.state === 'intro') { this.state = 'countdown'; this.stateT = 0; } }

  update(dt) {
    dt = Math.min(dt, 1 / 20);
    this.stateT += dt;
    const t = (this.clock += dt);

    if (this.state === 'intro' && this.stateT > 3.2) { this.state = 'countdown'; this.stateT = 0; }
    if (this.state === 'countdown') this.countdown();
    const running = ['race', 'finish', 'demo', 'free'].includes(this.state);
    if (running) this.time += dt;

    for (const r of this.racers) {
      if (r.out) continue;
      let inp;
      if (!running) inp = { steer: 0, throttle: 0, brake: 0 };
      else if (r.isPlayer && !r.finished && !r.autopilot) inp = this.assist ? this.steerAssist(r, readDrive(r.src)) : readDrive(r.src);   // autopilot: Tests
      else inp = aiInput(r, this, dt);
      if (r.finished && !r.isPlayer) inp.item = false;
      r.update(dt, inp);
    }
    if (running) {
      this.rescue(dt);
      this.collide();
      this.items.update(dt, t);
      if (this.free) this.updateFree(dt, t);
    } else this.items.update(0, t);
    this.hazards.update(running ? dt : 0, t);
    this.rank();
    this.emit(dt, t);
    for (const r of this.racers) if (!r.out) r.syncVisual(dt, t);
    this.trafficLight?.model.update(dt, this.trafficLight.state);
    this.effects.update(dt, this.app.viewH ?? 800);

    if (this.starMusic && this.humans.every((h) => h.starT <= 0)) {
      this.starMusic = false;
      if (this.state === 'race') this.audio.play(this.def.music ?? 'course_grass');
      if (this.state === 'free') this.audio.play('course_map');
    }
    if (this.player && !this.demo) {
      const p = this.player;
      this.audio.setMotor(this.state !== 'intro' && !p.out, p.speed, p.phys.top, p.boostT > 0 ? 1 : 0, p.offroad);
    }
    if (this.state === 'finish') {
      const allDone = this.racers.every((r) => r.finished);
      if (this.stateT > (this.ko && this.humans.every((h) => h.out) ? 5 : 7) || (allDone && this.stateT > 4)) { this.state = 'done'; this.complete(); }
    }
    this.updateCamera(dt, t);
    this.updateAmbience(dt);
    if (!this.demo) for (const v of this.views) if (v.hud && v.racer) v.hud.update(dt, this, v.racer);
  }

  countdown() {
    const c = this.stateT;
    const phase = c < 0.6 ? -1 : c < 1.6 ? 3 : c < 2.6 ? 2 : c < 3.6 ? 1 : 0;
    if (phase !== this.cdPhase) {
      this.cdPhase = phase;
      if (phase > 0) { for (const h of this.huds()) h.countdown(String(phase)); this.audio.beep(520, 0.2); }
      if (this.trafficLight) this.trafficLight.state = phase === 3 || phase === 2 ? 'red' : phase === 1 ? 'yellow' : phase === 0 ? 'green' : 'off';
      if (phase === 0) {
        const huds = this.huds();
        for (const h of huds) h.countdown('LOS!', 'go');
        this.audio.beep(1040, 0.5, 0.3);
        this.state = 'race'; this.stateT = 0; this.time = 0;
        for (const r of this.racers) r.lapStart = 0;
        setTimeout(() => { for (const h of huds) h.countdown(''); }, 900);
        // Startturbo: Gas genau beim „2“ gedrückt (nicht vorher)
        for (const r of this.racers) {
          const good = r.isPlayer ? r.startGas === 2 : r.ai && this.rnd() < r.ai.skill * 0.7;
          if (good) { r.boost(1.0, 0xffc21a, 1.0); if (r.isPlayer) rumble(r.src, 0.3, 0.8, 200); }
          else if (r.isPlayer && r.startGas === 3) { r.spinT = 0.6; this.audio.sfx('hurt'); }
        }
      }
    }
    for (const h of this.humans) {
      if (h.src === 'touch' || (h.src === 'auto' && touch.active)) continue;
      const gas = readDrive(h.src).throttle > 0;
      if (gas && !h.startGas) h.startGas = phase === 2 ? 2 : phase === 3 ? 3 : phase === 1 ? 1 : 0;
      if (!gas && h.startGas === 3 && phase >= 2) h.startGas = 0;
    }
  }

  /** Freie Fahrt: Sternmünzen einsammeln. */
  updateFree(dt, t) {
    if (!this.humans.length) return;
    for (const c of this.starCoins) {
      if (c.got) continue;
      const vis = this.focusDist2(c.x, c.z) < 260 * 260;
      c.m.root.visible = vis;
      if (!vis) continue;
      c.m.update(dt, 'idle');
      c.m.root.rotation.y = t * 2 + c.k;
      const p = this.humans.find((h) => (h.pos.x - c.x) ** 2 + (h.pos.z - c.z) ** 2 < 2.4 * 2.4 && Math.abs(h.pos.y - c.y) < 3);
      if (p) {
        c.got = true;
        c.m.root.visible = false;
        this.effects.sparkle(c.m.root.position, 0x8fe060, 30, 5);
        this.audio.sfx('bigCoin');
        this.onEvent?.('starcoin', c.k);
        const got = this.starCoins.filter((x) => x.got).length;
        this.hudOf(p)?.message(got === this.starCoins.length ? 'Alle Sternmünzen gefunden!' : `Sternmünze ${got}/${this.starCoins.length}`, 2, 'good');
      }
    }
  }

  /** Stimmung (Himmel, Licht, Nebel) nach der Region um die Kamera-Mitte. */
  updateAmbience(dt) {
    this.ambT -= dt;
    if (this.ambT > 0) return;
    this.ambT = 0.15;
    const f = this.focus ?? this.camera.position;
    const ws = this.world.ambienceAt(f.x, f.z).map((x) => ({ theme: getTheme(x.theme), w: x.w, name: x.theme }));
    this.app.sky.blend(ws);
    const dark = ws.reduce((a, x) => a + ((x.name === 'cave' || x.name === 'circus') ? x.w : x.name === 'castle' ? x.w * 0.6 : 0), 0);
    this.playerLight.intensity = 26 * dark;
    // in Höhle und Zelt kaum Studio-Reflexionen
    if (this.app.scene.environment) this.app.scene.environmentIntensity = (this.app.envIntensity ?? 0.42) * (1 - 0.7 * Math.min(1, dark));
    this.darkness = dark;
  }

  /** Ergebnis: Ziel-Reihenfolge, dann die übrigen nach Fortschritt, zuletzt die Ausgeschiedenen. */
  complete() {
    const fin = this.finishOrder.filter((r) => !r.out);
    const rest = this.racers.filter((r) => !r.finished).sort((a, b) => b.progress - a.progress);
    for (const r of rest) {
      const left = (this.track?.finishS ?? 0) - r.progress;
      r.finishTime = this.time + left / Math.max(8, r.phys.top * 0.85);
      r.finished = true;
      fin.push(r);
    }
    const order = [...fin, ...[...this.outOrder].reverse()];
    this.audio.stopMotor();
    this.onDone?.(order.map((r, i) => ({ id: r.id, name: r.name, place: i + 1, time: r.finishTime, isPlayer: r.isPlayer, pi: r.pi, out: !!r.out, best: Math.min(...r.lapTimes, Infinity) })));
  }

  /**
   * Rettung: kommt jemand nicht voran (festgefahren) oder fällt ins offene Meer, setzt ihn der Waldkobold mit
   * kurzem Aufblitzen ein Stück weiter auf die Straße zurück.
   */
  rescue(dt) {
    for (const r of this.racers) {
      if (r.out || (r.finished && !r.isPlayer)) continue;
      const rs = r.rescueState ?? (r.rescueState = { best: r.progress, t: 0, sea: 0 });
      rs.sea = r.surface === 'sea' ? rs.sea + dt : 0;
      let need = rs.sea > 0.6;
      if (!need && r.path) {
        if (r.progress > rs.best + 4 || (r.isPlayer && !r.trying)) { rs.best = Math.max(rs.best, r.progress); rs.t = 0; continue; }
        rs.t += dt;
        need = rs.t > (r.isPlayer ? 6 : 4);
      }
      if (!need) continue;
      if ((this.rescueLog ??= []).length < 30) this.rescueLog.push(`${r.id}@${r.loc.i}/${r.loc.lat?.toFixed(1)} x=${r.pos.x.toFixed(0)} z=${r.pos.z.toFixed(0)} sp=${r.speed.toFixed(1)} surf=${r.surface} sea=${rs.sea.toFixed(1)}`);
      this.effects.sparkle(r.pos, 0xffffff, 16, 3);
      if (r.path) {
        const tr = r.path, i = tr.wrap(r.loc.i + 6);
        const q = tr.pointAt(i / (tr.N - 1), 0);
        r.placeAt(q.x, q.z, q.yaw, i);
      } else {
        const nr = this.world.nearestRoad(r.pos.x, r.pos.z, 12, {});
        if (nr.road) {
          const tr = nr.road, i = nr.i;
          r.placeAt(tr.px[i], tr.pz[i], Math.atan2(-tr.tz[i], tr.tx[i]));
        }
      }
      r.cancelDrift();
      r.invulnT = 2;
      if (r.ai) { r.ai.reverse = 0; r.ai.stuck = 0; r.ai.drifting = false; }
      this.effects.sparkle(r.pos, 0xfff2a0, 16, 3);
      this.rescues = (this.rescues ?? 0) + 1;
      if (r.isPlayer) { this.hudOf(r)?.message('Hopp – zurück auf die Strecke!', 1.6); this.audio.sfx('oneup'); }
      rs.best = r.progress; rs.t = 0; rs.sea = 0;
    }
  }

  rank() {
    if (this.free) { this.racers.forEach((r, i) => { r.place = i + 1; }); return; }
    const fin = this.finishOrder.filter((r) => !r.out);
    const rest = this.racers.filter((r) => !r.finished).sort((a, b) => b.progress - a.progress);
    fin.forEach((r, i) => { r.place = i + 1; });
    rest.forEach((r, i) => { r.place = fin.length + i + 1; });
    [...this.outOrder].reverse().forEach((r, i) => { r.place = fin.length + rest.length + i + 1; });
  }

  /** Karts schubsen sich gegenseitig (Gewicht zählt); Stern/Riese werfen andere um. */
  collide() {
    const rs = this.racers;
    for (let a = 0; a < rs.length; a++) {
      if (rs[a].out) continue;
      for (let b = a + 1; b < rs.length; b++) {
        const A = rs[a], B = rs[b];
        if (B.out) continue;
        const dx = B.pos.x - A.pos.x, dz = B.pos.z - A.pos.z, dy = B.pos.y - A.pos.y;
        const rr = A.radius + B.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 > rr * rr || Math.abs(dy) > 1.4) continue;
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, pen = rr - d;
        const wa = A.weight, wb = B.weight, sum = wa + wb;
        A.pos.x -= nx * pen * (wb / sum); A.pos.z -= nz * pen * (wb / sum);
        B.pos.x += nx * pen * (wa / sum); B.pos.z += nz * pen * (wa / sum);
        const push = 4.5;
        A.vlat -= push * (wb / sum) * (nx * Math.sin(A.yaw) + nz * Math.cos(A.yaw));
        B.vlat += push * (wa / sum) * (nx * Math.sin(B.yaw) + nz * Math.cos(B.yaw));
        if (A.starT > 0 && B.starT <= 0) B.hit('spin', A);
        else if (B.starT > 0 && A.starT <= 0) A.hit('spin', B);
        if (A.giantT > 0 && B.giantT <= 0 && B.starT <= 0) B.hit('squish', A);
        else if (B.giantT > 0 && A.giantT <= 0 && A.starT <= 0) A.hit('squish', B);
        if ((A.isPlayer || B.isPlayer) && (A.bumpCooldown <= 0 || B.bumpCooldown <= 0)) {
          A.bumpCooldown = B.bumpCooldown = 0.3;
          this.audio.sfx('stomp');
        }
      }
    }
  }

  /** Partikel: Drift-Funken, Turbo, Staub, Wasser-Gischt, Schienen-Funken, Funkelstern. */
  emit(dt, t) {
    const fx = this.effects;
    for (const r of this.racers) {
      if (r.out) continue;
      if (this.focusDist2(r.pos.x, r.pos.z) > 120 * 120) continue;
      if (r.grind && Math.random() < 0.9) fx.trail(r.pos.x, r.pos.y, r.pos.z, 0xfff0a0, 0.5);
      if (r.air) continue;
      const c = Math.cos(r.yaw), s = -Math.sin(r.yaw);
      const bx = r.pos.x - c * 0.9 * r.giantScale, bz = r.pos.z - s * 0.9 * r.giantScale;
      if (r.drift.on && Math.random() < 0.9) {
        const col = SPARK_COLORS[r.drift.level] ?? 0xffffff;
        for (const side of [-1, 1]) fx.trail(bx + s * side * 0.55, r.pos.y + 0.1, bz - c * side * 0.55, r.drift.level ? col : 0xfff0d0, r.drift.level ? 0.55 : 0.3);
      }
      if (r.charge > 0.2 && Math.random() < 0.6) fx.trail(bx, r.pos.y + 0.1, bz, r.charge > 1 ? 0xff5ad0 : 0x58b8ff, 0.4);
      if (r.boostT > 0 && Math.random() < 0.8) fx.trail(bx - c * 0.3, r.pos.y + 0.35, bz - s * 0.3, r.boostColor, 0.7);
      if (r.offroad && Math.abs(r.speed) > 4 && Math.random() < 0.5) fx.dust(bx, r.pos.y, bz, 0xe8d8b0, 0.9);
      if (r.onWater && Math.abs(r.speed) > 3 && Math.random() < 0.8) {
        for (const side of [-1, 1]) fx.dust(bx + s * side * 0.6, r.pos.y + 0.1, bz - c * side * 0.6, 0xeaf8ff, 1.1);
      }
      if (r.starT > 0 && Math.random() < 0.8) fx.rainbow(r.pos);
    }
  }

  // ------------------------------------------------------------------ Kamera
  updateCamera(dt, t) {
    const targets = this.views.map((v) => this.updateViewCamera(v, dt, t));
    this.foci = targets.map((tg) => tg.pos);
    this.focus = this.foci[0];
    this.app.sky.update(dt, this.views[0].cam, this.focus);
    this.app.worldView.update(dt, t, this.split ? this.foci : this.focus);
    this.playerLight.position.set(this.focus.x, this.focus.y + 3.5, this.focus.z);
  }

  /** Kamera einer Ansicht (Intro-Flug, Menü-Demo, Zielrunde, Verfolger); liefert das Ziel. */
  updateViewCamera(v, dt, t) {
    const cam = v.cam, cs = v.cs;
    const pos = new THREE.Vector3(), look = new THREE.Vector3();
    let fov = 70;
    const spec = v.spectate ?? this.spectate ?? (v.racer ? null : this.leader());
    let target = spec && !spec.out ? spec : v.racer ?? this.racers.find((r) => r.place === 1) ?? this.racers[0];
    if (target.out) target = this.leader() ?? target;
    if (this.state === 'intro') {
      // Kameraflug: über das Starterfeld hinweg zur Startlinie
      const k = clamp(this.stateT / 3.2, 0, 1), e = k * k * (3 - 2 * k);
      const tr = this.track;
      const g = tr.pointAtS(tr.startS - 18, 0), p0 = tr.pointAtS(tr.startS, 0);
      const ang = p0.yaw + Math.PI * (0.35 + 0.75 * e);
      const R = 30 - 16 * e;
      pos.set(g.x + Math.cos(ang) * R, Math.max(0, g.y) + 14 - 8 * e, g.z - Math.sin(ang) * R);
      look.set(g.x, Math.max(0, g.y) + 1, g.z);
      cs.pos.copy(pos); cs.look.copy(look);
      cs.yaw = target.yaw;
    } else if (this.state === 'demo') {
      // Menü-Hintergrund: wechselnde Kamerafahrten, bevorzugt Lotti und Greta
      this.demoT = (this.demoT ?? 0) - dt;
      if (this.demoT <= 0 || !this.demoTarget) {
        const pick = this.rnd() < 0.6 ? this.racers.filter((r) => r.id === 'lotti' || r.id === 'greta') : this.racers;
        this.demoTarget = pick[Math.floor(this.rnd() * pick.length)] ?? this.racers[0];
        this.demoT = 6 + this.rnd() * 3;
        this.demoMode = Math.floor(this.rnd() * 3);
        this.demoSide = this.rnd() < 0.5 ? -1 : 1;
        cs.snap = true;
      }
      const r = this.demoTarget, c = Math.cos(r.yaw), s = -Math.sin(r.yaw);
      if (this.demoMode === 0) pos.set(r.pos.x + c * 4.2 - s * 2.4 * this.demoSide, r.pos.y + 1.3, r.pos.z + s * 4.2 + c * 2.4 * this.demoSide);
      else if (this.demoMode === 1) pos.set(r.pos.x - s * 4.5 * this.demoSide - c * 0.5, r.pos.y + 1.6, r.pos.z + c * 4.5 * this.demoSide - s * 0.5);
      else pos.set(r.pos.x - c * 6, r.pos.y + 3.2, r.pos.z - s * 6);
      look.set(r.pos.x + c * 0.5, r.pos.y + 0.7, r.pos.z + s * 0.5);
      if (cs.snap) { cs.pos.copy(pos); cs.look.copy(look); cs.snap = false; }
      cs.pos.lerp(pos, 1 - Math.exp(-6 * dt)); cs.look.lerp(look, 1 - Math.exp(-10 * dt));
      fov = 55;
      target = r;
    } else if ((this.state === 'finish' || this.state === 'done' || (this.split && v.racer?.finished && !v.racer.out)) && !spec) {
      const a = t * 0.35, R = 6.5;
      pos.set(target.pos.x + Math.cos(a) * R, target.pos.y + 2.6, target.pos.z + Math.sin(a) * R);
      look.set(target.pos.x, target.pos.y + 0.9, target.pos.z);
      cs.pos.lerp(pos, 1 - Math.exp(-3 * dt)); cs.look.lerp(look, 1 - Math.exp(-6 * dt));
    } else {
      // Verfolger-Kamera hinter dem Kart; beim Driften schwingt sie mit
      const r = target;
      const vy = r.yaw + (r.visDrift ?? 0) * 0.45;
      cs.yaw = cs.yaw + wrapA(vy - cs.yaw) * (1 - Math.exp(-(r.spinT > 0 ? 1.5 : 5.5) * dt));
      const dist = 4.4 * (0.75 + 0.25 * r.giantScale) + clamp(r.speed / 30, 0, 1) * 0.5;
      const h = 1.85 * (0.75 + 0.25 * r.giantScale);
      const cx = Math.cos(cs.yaw), cz = -Math.sin(cs.yaw);
      pos.set(r.pos.x - cx * dist, r.pos.y + h, r.pos.z - cz * dist);
      const gy = Math.max(0, this.world.heightAt(pos.x, pos.z)) + 0.8;
      if (pos.y < gy) pos.y = gy;
      // Blick leicht in die Kurve hinein (Lenkung/Drift), damit man sieht, wohin es geht
      const lead = clamp((r.steer ?? 0) * 0.9 + (r.drift.on ? r.drift.dir * 0.6 : 0), -1.2, 1.2);
      cs.lead = damp(cs.lead ?? 0, lead, 4, dt);
      const lx = cx * 3 + cz * cs.lead * 1.6, lz = cz * 3 - cx * cs.lead * 1.6; // + = links
      look.set(r.pos.x + lx, r.pos.y + 1.0, r.pos.z + lz);
      const blend = this.state === 'countdown' && this.stateT < 1.2 ? 1 - Math.exp(-3 * dt) : spec ? 1 - Math.exp(-4 * dt) : 1;
      const yS = cs.pos.y;
      cs.pos.lerp(pos, blend);
      if (blend === 1) cs.pos.y = damp(yS, pos.y, 8, dt);
      cs.look.lerp(look, blend === 1 ? 1 - Math.exp(-20 * dt) : blend);
      fov = 64 + (r.boostT > 0 ? 8 : 0) + clamp((r.speed - 20) / 10, 0, 1) * 4;
    }
    if (this.app.camOverride) { const o = this.app.camOverride; cs.pos.set(...o.pos); cs.look.set(...o.look); fov = o.fov ?? 50; cs.fov = fov; }
    cs.fov = damp(cs.fov, fov, 4, dt);
    cam.position.copy(cs.pos);
    if (v === this.views[0] && this.shake > 0) { v.shake = Math.max(v.shake, this.shake); this.shake = 0; }
    if (v.shake > 0) {
      v.shake = Math.max(0, v.shake - dt * 2);
      cam.position.x += (Math.random() - 0.5) * v.shake * 0.5;
      cam.position.y += (Math.random() - 0.5) * v.shake * 0.5;
    }
    cam.lookAt(cs.look);
    if (Math.abs(cam.fov - cs.fov) > 0.05) { cam.fov = cs.fov; cam.updateProjectionMatrix(); }
    return target;
  }

  render(renderer) {
    if (!this.split) { renderer.render(this.app.scene, this.camera); return; }
    // geteilter Bildschirm: zwei Spieler oben/unten, drei oder vier in vier Feldern
    const W = window.innerWidth, H = window.innerHeight, n = this.views.length;
    const rects = n === 2 ? [[0, 0, W, H / 2], [0, H / 2, W, H / 2]]
      : [[0, 0, W / 2, H / 2], [W / 2, 0, W / 2, H / 2], [0, H / 2, W / 2, H / 2], [W / 2, H / 2, W / 2, H / 2]];
    const key = `${W}x${H}`;
    renderer.setScissorTest(true);
    this.views.forEach((v, i) => {
      const [x, y, w, h] = rects[i];
      if (v.layoutKey !== key) {
        v.layoutKey = key;
        Object.assign(v.el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
        v.cam.aspect = w / h; v.cam.updateProjectionMatrix();
      }
      renderer.setViewport(x, H - y - h, w, h);
      renderer.setScissor(x, H - y - h, w, h);
      this.app.sky.update(0, v.cam, this.foci?.[i] ?? this.focus);
      renderer.render(this.app.scene, v.cam);
    });
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
  }

  dispose() {
    this.audio.stopMotor();
    for (const r of this.racers) r.dispose();
    this.items.dispose();
    this.hazards.dispose();
    this.effects.dispose();
    this.trafficLight?.model.dispose();
    for (const c of this.starCoins ?? []) c.m.dispose();
    if (this.splitRoot) { for (const v of this.views) v.hud?.dispose(); this.splitRoot.remove(); }
    this.scene.removeFromParent();
  }
}

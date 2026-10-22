// Ein Rennen: baut Szene (Himmel, Strecke, Kulisse, Kisten, Gefahren), stellt die acht Karts auf, zählt mit der
// Start-Ampel herunter, simuliert Physik/KI/Gegenstände, ermittelt Platzierungen und führt die Kamera.
// Zustände: intro (Kameraflug) → countdown → race → finish (Spielerin im Ziel, die anderen fahren zu Ende) → done

import * as THREE from 'three';
import { Track } from '../world/Track.js';
import { Sky } from '../world/Sky.js';
import { Decor } from '../world/decor.js';
import { getTheme } from '../world/themes.js';
import { Racer } from './Racer.js';
import { Items } from './items.js';
import { Hazards } from './hazards.js';
import { Effects } from './effects.js';
import { initAI, aiInput } from './ai.js';
import { readDrive, touch } from '../ui/input.js';
import { SPARK_COLORS } from './kartModel.js';

const TAU = Math.PI * 2;
const wrapA = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
const damp = (c, t, r, dt) => c + (t - c) * (1 - Math.exp(-r * dt));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const CC = {
  50: { label: 'Gemütlich', mult: 0.86, skill: 0.25, rubber: 0.06 },
  100: { label: 'Flott', mult: 1.0, skill: 0.55, rubber: 0.08 },
  150: { label: 'Rasant', mult: 1.14, skill: 0.85, rubber: 0.1 },
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
   * @param {object} app  { renderer, camera, audio, hud, quality }
   * @param {object} o    { trackDef, roster: [racerDef...] (Startreihenfolge, vorn zuerst), playerId, cc, laps, demo }
   */
  constructor(app, o) {
    this.app = app;
    this.audio = app.audio;
    this.hud = app.hud;
    this.camera = app.camera;
    this.view = { renderer: app.renderer };
    this.def = o.trackDef;
    this.laps = o.laps ?? 3;
    this.ccKey = o.cc ?? 100;
    this.ccDef = CC[this.ccKey] ?? CC[100];
    this.cc = this.ccDef.mult;
    this.demo = !!o.demo;
    this.rnd = mulberry(o.seed ?? (Date.now() & 0xffff));
    this.time = 0;
    this.state = 'intro';
    this.stateT = 0;
    this.shake = 0;
    this.finishOrder = [];
    this.onDone = o.onDone ?? null;
    this.onEvent = o.onEvent ?? null;

    this.scene = new THREE.Scene();
    this.theme = getTheme(this.def.theme);
    this.sky = new Sky(this.scene, this.theme, { quality: app.quality ?? 1 });
    this.track = new Track(this.def, this.theme);
    this.track.cell = (app.quality ?? 2) >= 2 ? 3 : 4.5;
    this.scene.add(this.track.build());
    this.effects = new Effects(this.scene);
    this.decor = new Decor(this, this.track, this.theme, this.def.seed ?? 3, app.quality ?? 2);
    this.def.scenery?.(this.decor, this);
    this.decor.build();
    this.trial = !!o.trial;
    this.items = new Items(this);
    // Zeitfahren: keine Kisten, dafür drei Turbo-Beeren
    this.items.build(this.trial ? { ...this.def, items: [] } : this.def);
    this.hazards = new Hazards(this);
    this.hazards.build(this.def.hazards ?? []);
    // Ampel und Start-Tor
    this.decor.startGate(this.def.banner ?? 'LOTTI & GRETA KART');
    const lightAt = this.track.pointAt(8 / this.track.length, -(this.track.hw[0] + 2.2));
    this.trafficLight = this.decor.model('traffic_light', { x: lightAt.x, z: lightAt.z }, { yaw: lightAt.yaw + Math.PI, state: 'off', scale: 1.15 });
    // Licht an der Spielerin (Höhle, Zirkus)
    if (this.theme.playerLight) {
      const pl = this.theme.playerLight;
      this.playerLight = new THREE.PointLight(pl.color, pl.intensity, pl.distance, 1.5);
      this.scene.add(this.playerLight);
    }

    // Fahrer
    this.racers = [];
    o.roster.forEach((def, slot) => {
      const isPlayer = !this.demo && def.id === o.playerId;
      const r = new Racer(this, def, slot, isPlayer);
      if (!isPlayer) initAI(r, clamp(this.ccDef.skill + (this.rnd() - 0.5) * 0.3, 0.1, 1), this.rnd);
      this.racers.push(r);
      if (isPlayer) this.player = r;
    });
    this.grid();
    if (this.trial && this.player) this.player.item = { id: 'beere3', charges: 3 };
    this.camState = { pos: new THREE.Vector3(), look: new THREE.Vector3(), yaw: 0, fov: 70 };
    this.introSetup();
    if (this.hud && !this.demo) { this.hud.setupMap(this.track); }
  }

  /** Startaufstellung: zwei Reihen versetzt hinter der Linie. */
  grid() {
    const tr = this.track;
    this.racers.forEach((r, k) => {
      const row = Math.floor(k / 2), side = k % 2 ? 1 : -1;
      const s = -5 - row * 4.2 - (k % 2) * 1.6;
      const p = tr.pointAt(s / tr.length, side * Math.min(2.6, tr.hw[0] * 0.4));
      r.placeAt(p.x, p.z, p.yaw);
      r.lap = 0; r.passedHalf = true;
      r.updateProgress(r.loc);
    });
  }

  // ------------------------------------------------------------------ Hilfen für Gegenstände/KI
  leader() { return this.racers.find((r) => r.place === 1); }
  racerAhead(r) { return this.racers.find((o) => o.place === r.place - 1) ?? null; }
  racerBehind(r) { return this.racers.find((o) => o.place === r.place + 1) ?? null; }

  /** Gummiband: Computer-Fahrer hinter der Spielerin werden etwas schneller, vorn etwas langsamer. */
  rubber(r) {
    if (r.isPlayer || !this.player || r.finished) return 1;
    const d = r.progress - this.player.progress;
    const k = this.ccDef.rubber;
    const skill = 0.95 + 0.07 * (r.ai?.skill ?? 0.5);
    if (d > 0) return skill * (1 - clamp(d / 160, 0, 1) * k);
    return skill * (1 + clamp(-d / 120, 0, 1) * k * 1.4);
  }

  onLap(r) {
    if (r.lap > 1) r.lapTimes.push(this.time - r.lapStart);
    r.lapStart = this.time;
    if (r.lap > this.laps && !r.finished) {
      r.finished = true;
      r.finishTime = this.time;
      this.finishOrder.push(r);
      r.cancelDrift();
      if (r.isPlayer) this.playerFinished();
      return;
    }
    if (r.isPlayer && r.lap > 1) {
      if (r.lap === this.laps) {
        this.hud?.message('LETZTE RUNDE!', 2.2, 'final');
        this.audio.sfx('timewarn');
        this.audio.energy(true);
      } else {
        this.hud?.message(`RUNDE ${r.lap}`, 1.4);
        this.audio.sfx('checkpoint');
      }
    }
  }

  onHit(r, kind) {
    if (r.isPlayer) this.shake = Math.max(this.shake, kind === 'tumble' ? 0.9 : 0.4);
  }

  onStar(r, on) {
    if (!r.isPlayer) return;
    if (on) { this.audio.play('course_star'); this.starMusic = true; }
  }

  playerFinished() {
    this.state = 'finish';
    this.stateT = 0;
    this.audio.energy(false);
    this.audio.play('course_clear');
    this.audio.sfx('goalpole');
    const place = this.finishOrder.indexOf(this.player) + 1;
    this.hud?.countdown('ZIEL!', 'goal');
    setTimeout(() => this.hud?.countdown(''), 1800);
    this.player.ai = null;
    initAI(this.player, 0.6, this.rnd);
    this.effects.confetti(this.player.pos, 80, 5);
    this.onEvent?.('finish', place);
  }

  // ------------------------------------------------------------------ Ablauf
  introSetup() {
    this.stateT = 0;
    if (this.demo) { this.state = 'demo'; return; }
    this.state = 'intro';
    this.audio.play(this.def.music ?? 'course_grass');
  }

  /** Touch: Tippen während des Countdowns zählt als Gasgeben für den Startturbo. */
  startTap() {
    if (this.state !== 'countdown' || this.startGas) return;
    this.startGas = this.cdPhase === 2 ? 2 : this.cdPhase === 1 ? 1 : 0;
  }

  skipIntro() { if (this.state === 'intro') { this.state = 'countdown'; this.stateT = 0; } }

  update(dt) {
    dt = Math.min(dt, 1 / 20);
    this.stateT += dt;
    const t = (this.clock = (this.clock ?? 0) + dt);
    const S = this.state;

    // Countdown mit Start-Ampel und Startturbo
    if (S === 'intro' && this.stateT > 3.2) { this.state = 'countdown'; this.stateT = 0; }
    if (this.state === 'countdown') {
      const c = this.stateT;
      const phase = c < 0.6 ? -1 : c < 1.6 ? 3 : c < 2.6 ? 2 : c < 3.6 ? 1 : 0;
      if (phase !== this.cdPhase) {
        this.cdPhase = phase;
        if (phase > 0) { this.hud?.countdown(String(phase)); this.audio.beep(520, 0.2); }
        this.trafficLight.state = phase === 3 ? 'red' : phase === 2 ? 'red' : phase === 1 ? 'yellow' : phase === 0 ? 'green' : 'off';
        if (phase === 0) {
          this.hud?.countdown('LOS!', 'go');
          this.audio.beep(1040, 0.5, 0.3);
          this.state = 'race'; this.stateT = 0; this.time = 0;
          setTimeout(() => this.hud?.countdown(''), 900);
          // Startturbo: Gas genau beim „2“ gedrückt (nicht vorher)
          for (const r of this.racers) {
            const good = r.isPlayer ? this.startGas === 2 : r.ai && this.rnd() < r.ai.skill * 0.7;
            if (good) r.boost(1.0, 0xffc21a, 1.0);
            else if (r.isPlayer && this.startGas === 3) { r.spinT = 0.6; this.audio.sfx('hurt'); }
          }
        }
      }
      if (this.player && !touch.active) {
        const gas = readDrive().throttle > 0;
        if (gas && !this.startGas) this.startGas = phase === 2 ? 2 : phase === 3 ? 3 : phase === 1 ? 1 : 0;
        if (!gas && this.startGas === 3 && phase >= 2) this.startGas = 0;
      }
    }
    if (this.state === 'race' || this.state === 'finish' || this.state === 'demo') this.time += dt;

    // Simulation
    const running = this.state === 'race' || this.state === 'finish' || this.state === 'demo';
    for (const r of this.racers) {
      let inp;
      if (!running) inp = { steer: 0, throttle: 0, brake: 0 };
      else if (r.isPlayer && !r.finished) inp = readDrive();
      else inp = aiInput(r, this, dt);
      if (r.finished && !r.isPlayer) inp.item = false;
      r.update(dt, inp);
    }
    if (running) {
      this.rescue(dt);
      this.collide();
      this.items.update(dt, t);
    } else this.items.update(0, t);
    this.hazards.update(running ? dt : 0, t);
    this.rank();
    this.emit(dt, t);
    for (const r of this.racers) r.syncVisual(dt, t);
    this.decor.update(dt, t);
    this.effects.update(dt, this.app.viewH ?? 800);

    // Funkelstern-Musik zurück
    if (this.starMusic && this.player && this.player.starT <= 0) {
      this.starMusic = false;
      if (this.state === 'race') this.audio.play(this.def.music ?? 'course_grass');
    }
    // Motor
    if (this.player && !this.demo) {
      const p = this.player;
      this.audio.setMotor(this.state !== 'intro', p.speed, p.phys.top, p.boostT > 0 ? 1 : 0, p.offroad);
    }
    // Ende: alle im Ziel oder genug Zeit nach der Spielerin
    if (this.state === 'finish' && (this.stateT > 7 || this.racers.every((r) => r.finished) && this.stateT > 4)) {
      this.state = 'done';
      this.complete();
    }
    if (this.state === 'demo' && this.player === undefined) {
      // Demo endlos: nichts zu tun
    }
    this.updateCamera(dt, t);
    if (this.playerLight && this.player) this.playerLight.position.set(this.player.pos.x, this.player.pos.y + 3.5, this.player.pos.z);
    this.sky.update(dt, this.camera, this.focus ?? this.camera.position);
    if (this.hud && !this.demo) this.hud.update(dt, this);
  }

  /** Restliche Fahrer nach ihrem Fortschritt einordnen und Zielzeiten schätzen. */
  complete() {
    const rest = this.racers.filter((r) => !r.finished).sort((a, b) => b.progress - a.progress);
    for (const r of rest) {
      const left = this.laps * this.track.length - r.progress;
      r.finishTime = this.time + left / Math.max(8, r.phys.top * 0.85);
      r.finished = true;
      this.finishOrder.push(r);
    }
    this.audio.stopMotor();
    this.onDone?.(this.finishOrder.map((r, i) => ({ id: r.id, name: r.name, place: i + 1, time: r.finishTime, isPlayer: r.isPlayer, best: Math.min(...r.lapTimes, Infinity) })));
  }

  /**
   * Rettung: kommt jemand 6 s lang nicht voran (festgefahren, eingeklemmt), setzt ihn der Waldkobold mit
   * kurzem Aufblitzen ein Stück weiter auf die Fahrbahnmitte zurück.
   */
  rescue(dt) {
    if (this.state !== 'race' && this.state !== 'finish' && this.state !== 'demo') return;
    for (const r of this.racers) {
      if (r.finished && !r.isPlayer) continue;
      const rs = r.rescueState ?? (r.rescueState = { best: r.progress, t: 0 });
      if (r.progress > rs.best + 4 || (r.isPlayer && !r.trying)) { rs.best = Math.max(rs.best, r.progress); rs.t = 0; continue; }
      rs.t += dt;
      if (rs.t > (r.isPlayer ? 6 : 4)) {
        const tr = this.track;
        if ((this.rescueLog ??= []).length < 20) this.rescueLog.push(`${r.id}@${r.loc.i}/${r.loc.lat.toFixed(1)} sp=${r.speed.toFixed(1)} yaw=${r.yaw.toFixed(2)} y=${r.pos.y.toFixed(1)} air=${r.air} spin=${r.spinT.toFixed(1)} sq=${r.squishT.toFixed(1)}`);
        const i = tr.wrap(r.loc.i + 6);
        const q = tr.pointAt(i / tr.N, 0);
        this.effects.sparkle(r.pos, 0xffffff, 16, 3);
        const prevI = r.lastI;
        r.placeAt(q.x, q.z, q.yaw);
        r.lastI = prevI; // Rundenzählung sieht das Überqueren der Ziellinie im nächsten Schritt
        r.cancelDrift();
        r.invulnT = 2;
        if (r.ai) { r.ai.reverse = 0; r.ai.stuck = 0; r.ai.drifting = false; }
        this.effects.sparkle(r.pos, 0xfff2a0, 16, 3);
        this.rescues = (this.rescues ?? 0) + 1;
        if (r.isPlayer) { this.hud?.message('Hopp – zurück auf die Strecke!', 1.6); this.audio.sfx('oneup'); }
        rs.best = r.progress; rs.t = 0;
      }
    }
  }

  rank() {
    const fin = this.finishOrder;
    const rest = this.racers.filter((r) => !fin.includes(r)).sort((a, b) => b.progress - a.progress);
    fin.forEach((r, i) => { r.place = i + 1; });
    rest.forEach((r, i) => { r.place = fin.length + i + 1; });
  }

  /** Karts schubsen sich gegenseitig (Gewicht zählt); Stern/Riese werfen andere um. */
  collide() {
    const rs = this.racers;
    for (let a = 0; a < rs.length; a++) {
      for (let b = a + 1; b < rs.length; b++) {
        const A = rs[a], B = rs[b];
        const dx = B.pos.x - A.pos.x, dz = B.pos.z - A.pos.z, dy = B.pos.y - A.pos.y;
        const rr = A.radius + B.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 > rr * rr || Math.abs(dy) > 1.4) continue;
        const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, pen = rr - d;
        const wa = A.weight, wb = B.weight, sum = wa + wb;
        A.pos.x -= nx * pen * (wb / sum); A.pos.z -= nz * pen * (wb / sum);
        B.pos.x += nx * pen * (wa / sum); B.pos.z += nz * pen * (wa / sum);
        // seitlicher Stoß (in Kart-Koordinaten)
        const push = 4.5;
        A.vlat -= push * (wb / sum) * (nx * Math.sin(A.yaw) + nz * Math.cos(A.yaw));
        B.vlat += push * (wa / sum) * (nx * Math.sin(B.yaw) + nz * Math.cos(B.yaw));
        // Sonderfälle
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

  /** Partikel: Drift-Funken, Turbo, Staub, Funkelstern. */
  emit(dt, t) {
    const fx = this.effects;
    for (const r of this.racers) {
      if (r.air) continue;
      const c = Math.cos(r.yaw), s = -Math.sin(r.yaw);
      const bx = r.pos.x - c * 0.9 * r.giantScale, bz = r.pos.z - s * 0.9 * r.giantScale;
      if (r.drift.on && Math.random() < 0.9) {
        const col = SPARK_COLORS[r.drift.level] ?? 0xffffff;
        for (const side of [-1, 1]) fx.trail(bx + s * side * 0.55, r.pos.y + 0.1, bz - c * side * 0.55, r.drift.level ? col : 0xfff0d0, r.drift.level ? 0.55 : 0.3);
      }
      if (r.boostT > 0 && Math.random() < 0.8) fx.trail(bx - c * 0.3, r.pos.y + 0.35, bz - s * 0.3, r.boostColor, 0.7);
      if (r.offroad && Math.abs(r.speed) > 4 && Math.random() < 0.5) fx.dust(bx, r.pos.y, bz, this.theme.offroad, 0.9);
      if (r.starT > 0 && Math.random() < 0.8) fx.rainbow(r.pos);
    }
  }

  // ------------------------------------------------------------------ Kamera
  updateCamera(dt, t) {
    const cam = this.camera, cs = this.camState;
    let pos = new THREE.Vector3(), look = new THREE.Vector3(), fov = 70;
    const target = this.player ?? this.racers.find((r) => r.place === 1) ?? this.racers[0];
    if (this.state === 'intro') {
      // Kameraflug: über das Starterfeld hinweg zur Startlinie
      const k = clamp(this.stateT / 3.2, 0, 1), e = k * k * (3 - 2 * k);
      const p0 = this.track.pointAt(0.04, 0), g = this.track.pointAt(-20 / this.track.length, 0);
      const ang = p0.yaw + Math.PI * (0.35 + 0.75 * e);
      const R = 26 - 14 * e;
      pos.set(g.x + Math.cos(ang) * R, g.y + 12 - 7 * e, g.z - Math.sin(ang) * R);
      look.set(g.x, g.y + 1, g.z);
      cs.pos.copy(pos); cs.look.copy(look);
      cs.yaw = target.yaw;
    } else if (this.state === 'demo' && !this.player) {
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
      if (this.demoMode === 0) { // schräg von vorn
        pos.set(r.pos.x + c * 4.2 - s * 2.4 * this.demoSide, r.pos.y + 1.3, r.pos.z + s * 4.2 + c * 2.4 * this.demoSide);
      } else if (this.demoMode === 1) { // seitlich mitfahrend
        pos.set(r.pos.x - s * 4.5 * this.demoSide - c * 0.5, r.pos.y + 1.6, r.pos.z + c * 4.5 * this.demoSide - s * 0.5);
      } else { // von hinten oben
        pos.set(r.pos.x - c * 6, r.pos.y + 3.2, r.pos.z - s * 6);
      }
      look.set(r.pos.x + c * 0.5, r.pos.y + 0.7, r.pos.z + s * 0.5);
      if (cs.snap) { cs.pos.copy(pos); cs.look.copy(look); cs.snap = false; }
      cs.pos.lerp(pos, 1 - Math.exp(-6 * dt)); cs.look.lerp(look, 1 - Math.exp(-10 * dt));
      fov = 55;
    } else if (this.state === 'finish' || this.state === 'done' || this.state === 'demo') {
      // Umkreisen der Spielerin (bzw. der Spitze in der Demo)
      const a = t * 0.35;
      const R = this.state === 'demo' ? 9 : 6.5;
      pos.set(target.pos.x + Math.cos(a) * R, target.pos.y + 2.6, target.pos.z + Math.sin(a) * R);
      look.set(target.pos.x, target.pos.y + 0.9, target.pos.z);
      cs.pos.lerp(pos, 1 - Math.exp(-3 * dt)); cs.look.lerp(look, 1 - Math.exp(-6 * dt));
    } else {
      // Verfolger-Kamera hinter dem Kart; beim Driften schwingt sie mit
      const r = target;
      const vy = r.yaw + (r.visDrift ?? 0) * 0.45;
      cs.yaw = cs.yaw + wrapA(vy - cs.yaw) * (1 - Math.exp(-(r.spinT > 0 ? 1.5 : 7) * dt));
      const dist = 4.4 * (0.75 + 0.25 * r.giantScale) + clamp(r.speed / 30, 0, 1) * 0.5;
      const h = 1.85 * (0.75 + 0.25 * r.giantScale);
      const cx = Math.cos(cs.yaw), cz = -Math.sin(cs.yaw);
      pos.set(r.pos.x - cx * dist, r.pos.y + h, r.pos.z - cz * dist);
      // Kamera nicht unter das Gelände
      const gy = this.track.heightAt(pos.x, pos.z) + 0.8;
      if (pos.y < gy) pos.y = gy;
      look.set(r.pos.x + cx * 3, r.pos.y + 1.0, r.pos.z + cz * 3);
      // waagerecht starr am Kart (Gier ist schon geglättet), Höhe weich (Sprünge)
      const blend = this.state === 'countdown' && this.stateT < 1.2 ? 1 - Math.exp(-3 * dt) : 1;
      const yS = cs.pos.y;
      cs.pos.lerp(pos, blend);
      if (blend === 1) cs.pos.y = damp(yS, pos.y, 8, dt);
      cs.look.lerp(look, blend === 1 ? 1 - Math.exp(-20 * dt) : blend);
      fov = 64 + (r.boostT > 0 ? 8 : 0) + clamp((r.speed - 20) / 10, 0, 1) * 4;
    }
    if (this.app.camOverride) { const o = this.app.camOverride; cs.pos.set(...o.pos); cs.look.set(...o.look); fov = o.fov ?? 50; cs.fov = fov; }
    cs.fov = damp(cs.fov, fov, 4, dt);
    cam.position.copy(cs.pos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      cam.position.x += (Math.random() - 0.5) * this.shake * 0.5;
      cam.position.y += (Math.random() - 0.5) * this.shake * 0.5;
    }
    cam.lookAt(cs.look);
    if (Math.abs(cam.fov - cs.fov) > 0.05) { cam.fov = cs.fov; cam.updateProjectionMatrix(); }
    this.focus = target.pos;
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.audio.stopMotor();
    for (const r of this.racers) r.dispose();
    this.items.dispose();
    this.hazards.dispose();
    this.decor.dispose();
    this.effects.dispose();
    this.sky.dispose();
    this.track.dispose();
    this.scene.traverse((o) => { if (o.isMesh && o.geometry && !o.geometry.userData?.shared) { /* geteilte Geometrien bleiben */ } });
  }
}

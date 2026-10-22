// Ein Teilnehmer: Kart-Physik (Arcade), Driften mit Mini-Turbo, Sprünge, Treffer, Runden-Zählung und die
// Darstellung (Kart + Fahrerfigur). Gesteuert über ein Eingabe-Objekt – vom Spieler oder von der KI.
//
// Eingabe { steer (-1..1, + = links), throttle (0..1), brake (0..1), drift (bool, gehalten), item (bool, Flanke) }

import * as THREE from 'three';
import { buildKart, SPARK_COLORS } from './kartModel.js';
import { createDriver } from './drivers.js';
import { physicsOf } from './racers.js';
import { glowTexture } from '../lgw/course/models/lib/kit.js';

const GRAVITY = 28;
const TAU = Math.PI * 2;
const wrapA = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const damp = (c, t, r, dt) => c + (t - c) * (1 - Math.exp(-r * dt));

export const DRIFT_LEVELS = [0.85, 1.8, 2.9];        // Ladezeit bis blau / orange / pink
const DRIFT_BOOST = [0, 0.7, 1.1, 1.6];              // Turbo-Dauer je Stufe

export class Racer {
  constructor(race, def, slot, isPlayer) {
    this.race = race;
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.slot = slot;
    this.isPlayer = isPlayer;
    this.phys = physicsOf(def, race.cc);
    // Zustand
    this.pos = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 0;
    this.vlat = 0;
    this.vy = 0;
    this.air = false;
    this.steer = 0;
    this.lap = 0; this.lastI = -1; this.passedHalf = true;
    this.progress = 0;
    this.place = slot + 1;
    this.finished = false; this.finishTime = 0; this.lapTimes = []; this.lapStart = 0;
    this.coins = 0;
    this.item = null;           // { id, charges }
    this.roulette = 0;          // >0: Glücksrad dreht noch
    this.boostT = 0; this.boostColor = 0xff8a2a;
    this.starT = 0; this.giantT = 0; this.spinT = 0; this.tumbleT = 0; this.squishT = 0; this.invulnT = 0;
    this.throwT = 0;
    this.drift = { on: false, dir: 0, charge: 0, level: 0, hop: false };
    this.trick = { ready: false, done: false, t: 0 };
    this.wrongWayT = 0;
    this.giantScale = 1;
    this.loc = { i: 0, lat: 0, s: 0, hw: 7 };
    this.prevInput = { drift: false, item: false };
    this.bumpCooldown = 0;
    this.spinAngle = 0; this.tumbleAngle = 0;
    this.radius = 0.85;
    // KI-Zustand (von ai.js gefüllt)
    this.ai = null;
    // Darstellung
    this.root = new THREE.Group();
    this.root.name = `racer:${def.id}`;
    this.root.rotation.order = 'YZX';
    this.kart = buildKart(def.kart);
    this.root.add(this.kart.root);
    this.driver = createDriver(race.view, def, this.kart);
    this.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    // Funkelstern-Schein (eigenes Material: Farbe läuft durch den Regenbogen)
    this.starGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    this.starGlow.scale.setScalar(3.4);
    this.starGlow.position.y = 0.7;
    this.root.add(this.starGlow);
    race.scene.add(this.root);
  }

  get weight() { return this.phys.weight * (this.giantT > 0 ? 4 : 1) * (this.starT > 0 ? 2 : 1); }
  get disabled() { return this.spinT > 0 || this.tumbleT > 0; }
  get invincible() { return this.starT > 0 || this.giantT > 0; }
  get fwdX() { return Math.cos(this.yaw); }
  get fwdZ() { return -Math.sin(this.yaw); }

  /** Auf einen Startplatz stellen. */
  placeAt(x, z, yaw) {
    this.pos.set(x, this.race.track.heightAt(x, z), z);
    this.yaw = yaw;
    this.speed = 0; this.vlat = 0; this.vy = 0; this.air = false;
    this.lastI = -1;
    this.race.track.locate(x, z, -1, this.loc);
    this.lastI = this.loc.i;
    this.syncVisual(0, 0);
  }

  // ------------------------------------------------------------------ Ereignisse
  /** Turbo (Pilz/Beere, Mini-Turbo, Startturbo, Boost-Feld). */
  boost(t, color = 0xff8a2a, kick = 1.25) {
    this.boostT = Math.max(this.boostT, t);
    this.boostColor = color;
    this.speed = Math.max(this.speed, this.phys.top * kick);
    if (this.isPlayer) this.race.audio.sfx('swoop');
  }

  /** Treffer: 'spin' (Panzer, Käfer, Funkenball) | 'tumble' (Explosion) | 'squish' (Riese, Stampfstein). */
  hit(kind = 'spin', by = null) {
    if (this.invincible || this.invulnT > 0 || this.finished && kind !== 'squish') return false;
    this.cancelDrift();
    if (kind === 'squish') { this.squishT = 2.2; this.speed *= 0.45; }
    else if (kind === 'tumble') { this.tumbleT = 1.5; this.vy = 7.5; this.air = true; this.speed *= 0.25; }
    else { this.spinT = 1.05; this.speed *= 0.35; }
    this.invulnT = kind === 'squish' ? 2.4 : 2.0;
    this.boostT = 0;
    const lost = Math.min(this.coins, kind === 'tumble' ? 3 : 2);
    if (lost > 0) { this.coins -= lost; this.race.effects?.coinBurst(this.pos, lost); }
    this.race.onHit?.(this, kind, by);
    if (this.isPlayer) this.race.audio.sfx(kind === 'tumble' ? 'slam' : 'hurt');
    return true;
  }

  cancelDrift() { this.drift.on = false; this.drift.dir = 0; this.drift.charge = 0; this.drift.level = 0; this.drift.hop = false; }

  // ------------------------------------------------------------------ Simulation
  update(dt, input) {
    const P = this.phys, track = this.race.track;
    const timers = ['boostT', 'starT', 'giantT', 'spinT', 'tumbleT', 'squishT', 'invulnT', 'throwT', 'bumpCooldown'];
    for (const k of timers) if (this[k] > 0) this[k] = Math.max(0, this[k] - dt);

    const loc = track.locate(this.pos.x, this.pos.z, this.lastI, this.loc);
    const absLat = Math.abs(loc.lat);
    const offroad = absLat > loc.hw + 0.9 && !this.air;
    this.offroad = offroad;

    // --- Zielgeschwindigkeit
    let top = P.top * (1 + 0.006 * this.coins) * (this.race.rubber?.(this) ?? 1);
    if (offroad && this.boostT <= 0 && this.starT <= 0) top *= P.offroad;
    if (this.boostT > 0) top *= 1.34;
    if (this.starT > 0) top *= 1.16;
    if (this.giantT > 0) top *= 1.1;
    if (this.squishT > 0) top *= 0.55;

    const disabled = this.disabled;
    const throttle = disabled ? 0 : clamp(input.throttle ?? 0, 0, 1);
    const brake = disabled ? 0 : clamp(input.brake ?? 0, 0, 1);

    if (!this.air) {
      if (this.boostT > 0) this.speed = damp(this.speed, top, 6, dt);
      else if (throttle > 0 && this.speed >= -0.5) {
        if (this.speed < top) this.speed += P.accel * throttle * (1 - 0.8 * clamp(this.speed / top, 0, 1)) * dt;
        else this.speed = damp(this.speed, top, 2.2, dt);
      } else if (brake > 0) {
        if (this.speed > 0.5) this.speed -= 26 * brake * dt;
        else this.speed = Math.max(-7, this.speed - 9 * brake * dt);
      } else {
        this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), (offroad ? 9 : 4.5) * dt);
      }
      if (throttle > 0 && this.speed < -0.5) this.speed = Math.min(0, this.speed + 18 * dt);
      if (disabled) this.speed *= Math.exp(-2.4 * dt);
    }

    // --- Lenken und Driften
    const steerIn = disabled ? 0 : clamp(input.steer ?? 0, -1, 1);
    this.steer = damp(this.steer, steerIn, 12, dt);
    const d = this.drift;
    const driftPressed = !!input.drift && !this.prevInput.drift;
    if (driftPressed && !this.air && !disabled && this.speed > 6) {
      this.vy = 3.4; this.air = true; d.hop = true; d.dir = 0;
      if (this.isPlayer) this.race.audio.sfx('jump');
    }
    if (this.air && d.hop && d.dir === 0 && Math.abs(steerIn) > 0.25) d.dir = Math.sign(steerIn);
    if (d.on) {
      if (!input.drift || this.speed < 5 || disabled) {
        if (d.level > 0 && !disabled) this.boost(DRIFT_BOOST[d.level], SPARK_COLORS[d.level], 1.12);
        this.cancelDrift();
      } else {
        const into = Math.max(0, steerIn * d.dir);
        d.charge += dt * (0.8 + 0.9 * into) * (offroad ? 0.4 : 1);
        const lv = d.charge >= DRIFT_LEVELS[2] ? 3 : d.charge >= DRIFT_LEVELS[1] ? 2 : d.charge >= DRIFT_LEVELS[0] ? 1 : 0;
        if (lv > d.level && this.isPlayer) this.race.audio.sfx('select');
        d.level = lv;
      }
    }
    const sf = clamp(Math.abs(this.speed) / 7, 0, 1) * (1 - 0.22 * clamp((Math.abs(this.speed) - 16) / 14, 0, 1));
    let yawRate;
    if (d.on) yawRate = d.dir * P.turn * (0.62 + 0.48 * steerIn * d.dir) * clamp(Math.abs(this.speed) / 10, 0.5, 1);
    else yawRate = this.steer * P.turn * sf * Math.sign(this.speed || 1);
    if (this.air && !d.hop) yawRate *= 0.35;
    if (this.giantT > 0) yawRate *= 0.9;
    this.yaw = wrapA(this.yaw + yawRate * dt);

    // --- Bewegung
    const fx = Math.cos(this.yaw), fz = -Math.sin(this.yaw);
    const rx = -fz, rz = fx; // rechts
    // Drift: Kart rutscht leicht nach außen
    const slide = d.on ? -d.dir * Math.abs(this.speed) * 0.12 : 0;
    this.vlat = damp(this.vlat, slide, d.on ? 3 : P.grip, dt);
    this.pos.x += (fx * this.speed + rx * this.vlat) * dt;
    this.pos.z += (fz * this.speed + rz * this.vlat) * dt;

    // --- Banden
    track.locate(this.pos.x, this.pos.z, loc.i, loc);
    const limit = track.wallAt(loc.i) - 0.7 * this.giantScale;
    if (Math.abs(loc.lat) > limit) {
      const sgn = Math.sign(loc.lat), pen = Math.abs(loc.lat) - limit;
      const ntx = track.tx[loc.i], ntz = track.tz[loc.i];
      // Normale der Bande (zur Mitte hin)
      const nx = sgn * ntz, nz = -sgn * ntx;
      this.pos.x += nx * pen; this.pos.z += nz * pen;
      const into = -(fx * nx + fz * nz) * Math.sign(this.speed || 1); // > 0: fährt auf die Bande zu
      if (into > 0.05) {
        this.speed *= 1 - 0.55 * into;
        this.vlat = Math.min(5, 2 + Math.abs(this.speed) * into * 0.3) * (nx * rx + nz * rz);
        // Ausrichten an der Bande
        const tYaw = Math.atan2(-ntz, ntx), back = Math.abs(wrapA(this.yaw - tYaw)) > Math.PI / 2;
        const along = back ? wrapA(tYaw + Math.PI) : tYaw;
        this.yaw = wrapA(this.yaw + wrapA(along - this.yaw) * 0.35 * into);
        if (this.bumpCooldown <= 0 && Math.abs(this.speed) > 6) {
          this.bumpCooldown = 0.35;
          if (this.isPlayer) this.race.audio.sfx('land');
          this.race.effects?.sparks(this.pos, nx, nz);
        }
      }
    }

    // --- Höhe, Sprünge, Landung
    const ground = track.heightAt(this.pos.x, this.pos.z);
    if (this.air) {
      this.vy -= GRAVITY * (d.hop ? 1.15 : 1) * dt;
      this.pos.y += this.vy * dt;
      if (this.trick.ready && driftPressed && !this.trick.done) { this.trick.done = true; this.trick.t = 0; if (this.isPlayer) this.race.audio.sfx('backflip'); }
      if (this.pos.y <= ground) {
        this.pos.y = ground;
        const hard = this.vy < -7;
        this.vy = 0; this.air = false;
        if (d.hop) {
          d.hop = false;
          if (input.drift && d.dir === 0 && Math.abs(steerIn) > 0.2) d.dir = Math.sign(steerIn);
          if (input.drift && d.dir !== 0 && this.speed > 6 && !disabled) { d.on = true; d.charge = 0; d.level = 0; }
          else d.dir = 0;
        }
        if (this.trick.ready) {
          if (this.trick.done) this.boost(0.9, 0x58b8ff, 1.15);
          this.trick.ready = false; this.trick.done = false;
        }
        if (hard) { this.landSquash = 1; if (this.isPlayer) this.race.audio.sfx('land'); }
      }
    } else {
      this.pos.y = ground;
    }
    if (this.trick.done) this.trick.t += dt;

    // --- Fortschritt und Runden
    this.updateProgress(loc);

    // Falsche Richtung?
    const trackDot = fx * track.tx[loc.i] + fz * track.tz[loc.i];
    if (trackDot < -0.35 && Math.abs(this.speed) > 2 && !this.finished) this.wrongWayT += dt; else this.wrongWayT = Math.max(0, this.wrongWayT - dt * 2);

    // --- Gegenstand
    if (input.item && !this.prevInput.item && !disabled) this.race.items.use(this);
    this.prevInput.drift = !!input.drift;
    this.prevInput.item = !!input.item;
  }

  /** Sprungschanze / Trampolin: in die Luft, Trick per Drift-Taste in der Luft. */
  launch(vy = 9) {
    if (this.air && this.vy > 2) return;
    this.cancelDrift();
    this.air = true; this.vy = vy;
    this.trick.ready = true; this.trick.done = false;
    if (this.isPlayer) this.race.audio.sfx('bounce');
  }

  updateProgress(loc) {
    const N = this.race.track.N, i = loc.i, prev = this.lastI;
    if (prev >= 0) {
      if (prev > N * 0.75 && i < N * 0.25) {
        if (this.passedHalf) { this.passedHalf = false; this.lap++; this.race.onLap(this); }
      } else if (prev < N * 0.25 && i > N * 0.75) {
        this.lap--; this.passedHalf = true;
      }
    }
    if (i > N * 0.4 && i < N * 0.6) this.passedHalf = true;
    this.lastI = i;
    this.progress = (this.lap - 1) * this.race.track.length + loc.s;
  }

  // ------------------------------------------------------------------ Darstellung
  syncVisual(dt, t) {
    const track = this.race.track;
    const fx = Math.cos(this.yaw), fz = -Math.sin(this.yaw);
    // Neigung aus dem Gelände
    const h0 = track.heightAt(this.pos.x - fx * 0.8, this.pos.z - fz * 0.8), h1 = track.heightAt(this.pos.x + fx * 0.8, this.pos.z + fz * 0.8);
    const r0 = track.heightAt(this.pos.x + fz * 0.6, this.pos.z - fx * 0.6), r1 = track.heightAt(this.pos.x - fz * 0.6, this.pos.z + fx * 0.6);
    const pitch = Math.atan2(h1 - h0, 1.6), roll = Math.atan2(r0 - r1, 1.2);
    this.root.position.copy(this.pos);
    // Drehungen: Drift (Kart zeigt nach innen), Schleudern, Überschlag, Trick
    const d = this.drift;
    this.visDrift = damp(this.visDrift ?? 0, d.on ? d.dir * 0.42 : 0, 9, dt || 1);
    if (this.spinT > 0) this.spinAngle += dt * 14 * Math.min(1, this.spinT * 1.5); else this.spinAngle = damp(wrapA(this.spinAngle), 0, 10, dt || 1);
    if (this.tumbleT > 0) this.tumbleAngle = (1 - this.tumbleT / 1.5) * TAU; else this.tumbleAngle = 0;
    const trickRoll = this.trick.done ? Math.min(1, this.trick.t / 0.45) * TAU : 0;
    this.root.rotation.set(roll + this.tumbleAngle + trickRoll, this.yaw + this.visDrift + this.spinAngle, pitch + (this.air && !d.hop ? clamp(this.vy * 0.02, -0.25, 0.25) : 0));
    // Größe: Riesentrank, platt gedrückt, Landung
    this.giantScale = damp(this.giantScale, this.giantT > 0 ? 1.75 : 1, 5, dt || 1);
    this.landSquash = damp(this.landSquash ?? 0, 0, 9, dt || 1);
    const sq = this.squishT > 0 ? 0.32 : 1;
    const ls = 1 - 0.18 * (this.landSquash ?? 0);
    this.root.scale.set(this.giantScale * (1 + (1 - sq) * 0.3), this.giantScale * sq * ls, this.giantScale * (1 + (1 - sq) * 0.3));
    this.radius = 0.85 * this.giantScale;
    // Kart-Animation
    this.kart.update(dt, {
      speed: this.speed, steer: this.disabled ? 0 : this.steer, t,
      boost: this.boostT > 0 ? Math.min(1, this.boostT * 2) : 0, boostColor: this.boostColor,
      drift: d.on ? d.dir : 0, sparkLevel: d.level, offroad: this.offroad,
    });
    // Fahrer
    let mood = 'drive';
    if (this.spinT > 0 || this.tumbleT > 0 || this.squishT > 1.2) mood = 'hit';
    else if (this.finished) mood = this.place <= 3 ? 'cheer' : 'sad';
    else if (this.throwT > 0) mood = 'throw';
    else if (this.boostT > 0 || this.starT > 0) mood = 'boost';
    this.driver.update(dt, t, {
      speed: Math.abs(this.speed), steer: this.steer, mood, phase: 1 - this.throwT / 0.45,
      power: this.starT > 0 ? 'stern' : this.giantT > 0 ? 'riese' : 'none', vy: this.vy, grounded: !this.air,
    });
    // Funkelstern-Schein
    if (this.starT > 0) {
      this.starGlow.material.opacity = 0.55 + 0.2 * Math.sin(t * 20);
      this.starGlow.material.color.setHSL((t * 1.6) % 1, 1, 0.6);
    } else this.starGlow.material.opacity = 0;
  }

  dispose() {
    this.driver.dispose();
    this.root.removeFromParent();
  }
}

// Fahrer-Darstellung: setzt die Original-Figuren der Lotti-&-Greta-Welt ins Kart.
//   Heldinnen (Lotti, Greta)  → HeroAvatar im Kurs-Modus mit dem Zustand 'kart' (sitzen, lenken, jubeln)
//   Pflaume                   → PflaumeAvatar im Kurs-Modus
//   Gegner (Pilzling, Kröten, Bulle) → Kurs-Modelle aus der Registry, tief in den Sitz gesetzt
//   Baron Brummbär            → eigenes Modell mit rotem Roadster (ersetzt das Kart)
//
// createDriver(view, racer, kart) → { root, update(dt, t, info), dispose() }
//   info { speed, steer, mood ('drive'|'boost'|'hit'|'cheer'|'throw'|'sad'), phase, power, vy, grounded }

import * as THREE from 'three';
import { createAvatarFor } from './avatars.js';
import { getModel } from '../lgw/course/models/index.js';

const AVATAR_H = 1.5;
const HIP_U = 0.5;          // Hüfte der Heldin über dem Fußpunkt (Avatar-Einheiten)

class HeroDriver {
  constructor(view, racer, kart) {
    this.root = new THREE.Group();
    this.height = 1.08;                      // Körpergröße im Kart (m) – etwas größer als im Kurs, wie im Vorbild
    const s = this.height / AVATAR_H;
    this.root.scale.setScalar(s);
    // Becken auf den Sitz: Fußpunkt liegt um die Hüfthöhe tiefer
    this.root.position.set(0.02, -HIP_U * s + 0.03, 0);
    kart.seat.add(this.root);
    this.proxy = {
      texture: { key: racer.hero }, key: racer.hero,
      x: 0, y: 0, width: 0, height: 0, angle: 0, scaleX: 1, scaleY: 1, alpha: 1, visible: true,
      flipX: false, body: { velocity: { x: 0, y: 0 } }, moveState: 'ground', onGround: true,
      mount: null, leaf: { visible: false }, swooping: false, dead: false, locked: false,
      course: { state: 'kart', speed: 0, vy: 0, grounded: true, phase: 0, power: 'none', big: true, holding: false, climbing: false, steer: 0, mood: 'drive' },
    };
    this.avatar = createAvatarFor(view, this.proxy);
    if (this.avatar) {
      this.avatar.setCourseMode?.(true);
      this.root.add(this.avatar.root);
    }
  }

  update(dt, t, info) {
    if (!this.avatar) return;
    const c = this.proxy.course;
    c.state = 'kart';
    c.speed = info.speed; c.vy = info.vy ?? 0; c.grounded = info.grounded ?? true;
    c.steer = info.steer; c.mood = info.mood; c.phase = info.phase ?? 0;
    c.power = info.power === 'stern' ? 'stern' : 'none';
    try { this.avatar.animate(dt, t); } catch (err) { console.error('Heldin-Animation:', err); this.avatar = null; }
  }

  dispose() { this.avatar?.dispose(); this.root.removeFromParent(); }
}

class PflaumeDriver {
  constructor(view, racer, kart) {
    this.root = new THREE.Group();
    const s = 0.78 / AVATAR_H;
    this.root.scale.setScalar(s);
    this.root.position.set(-0.08, -0.06, 0);
    kart.seat.add(this.root);
    this.proxy = {
      texture: { key: 'pflaume' }, key: 'pflaume',
      x: 0, y: 0, width: 0, height: 0, angle: 0, scaleX: 1, scaleY: 1, alpha: 1, visible: true, flipX: false,
      body: { velocity: { x: 0, y: 0 }, blocked: { down: true }, touching: { down: true } }, power: 'none',
      course: { state: 'idle', speed: 0, vy: 0, grounded: true, power: 'none', gear: null, rider: null },
    };
    this.avatar = createAvatarFor(view, this.proxy);
    if (this.avatar) {
      this.avatar.setCourseMode?.(true);
      this.root.add(this.avatar.root);
    }
    this.spin = 0;
  }

  update(dt, t, info) {
    if (!this.avatar) return;
    const c = this.proxy.course;
    // Pflaume sitzt im Kart: Ruhepose, bei Treffern Hopser, beim Jubel Siegesfreude
    c.state = info.mood === 'cheer' ? 'victory' : info.mood === 'hit' ? 'jump' : info.mood === 'boost' ? 'ride' : 'idle';
    c.speed = info.mood === 'boost' ? 0 : 0; c.vy = info.mood === 'hit' ? 3 : 0; c.grounded = info.mood !== 'hit';
    c.power = info.power === 'stern' ? 'yellow' : info.power === 'riese' ? 'red' : 'none';
    this.root.rotation.y = 0.35 * info.steer;
    try { this.avatar.animate(dt, t); } catch (err) { console.error('Pflaume-Animation:', err); this.avatar = null; }
  }

  dispose() { this.avatar?.dispose(); this.root.removeFromParent(); }
}

class ModelDriver {
  constructor(view, racer, kart) {
    this.racer = racer;
    this.root = new THREE.Group();
    const seat = racer.seat ?? {};
    this.root.scale.setScalar(seat.scale ?? 1);
    this.root.position.set(seat.x ?? 0, seat.y ?? 0, 0);
    kart.seat.add(this.root);
    this.model = getModel(racer.model, {});
    this.root.add(this.model.root);
    this.model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.anim = null; this.animT = 0;
  }

  update(dt, t, info) {
    const a = this.racer.anims ?? {};
    let anim = a[info.mood] ?? a.drive ?? 'idle';
    if (anim !== this.anim) { this.anim = anim; this.animT = 0; } else this.animT += dt;
    // Lenken: Oberkörper dreht mit, beim Jubel hüpft die Figur im Sitz
    this.root.rotation.y = 0.3 * info.steer;
    this.root.rotation.x = -0.12 * info.steer;
    const hop = info.mood === 'cheer' ? Math.abs(Math.sin(this.animT * 7)) * 0.12 : 0;
    this.model.root.position.y = hop;
    this.model.update(dt, { anim, speed: 2, progress: info.mood === 'throw' ? info.phase : undefined });
  }

  dispose() { this.model.dispose(); this.root.removeFromParent(); }
}

class BaronDriver {
  constructor(view, racer, kart) {
    this.root = new THREE.Group();
    this.scale = racer.scale ?? 0.4;
    this.root.scale.setScalar(this.scale);
    kart.body.add(this.root);
    // Das Kart selbst ausblenden – der Baron fährt seinen Roadster (Flammen/Funken bleiben)
    kart.body.children.forEach((c) => { if (c.isMesh) c.visible = false; });
    kart.steering.visible = false;
    for (const w of kart.wheels) w.hub.visible = false;
    for (const f of kart.flames) f.position.x = -1.05;
    this.model = getModel('baron_brummbaer', { withCar: true });
    this.root.add(this.model.root);
    this.model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  update(dt, t, info) {
    const anim = info.mood === 'hit' ? 'hit' : info.mood === 'sad' ? 'stunned' : info.mood === 'throw' ? 'throw' : 'drive';
    this.model.update(dt, { anim, speed: info.speed / this.scale, steer: info.steer, progress: info.mood === 'throw' ? info.phase : undefined });
  }

  dispose() { this.model.dispose(); this.root.removeFromParent(); }
}

export function createDriver(view, racer, kart) {
  switch (racer.kind) {
    case 'hero': return new HeroDriver(view, racer, kart);
    case 'pflaume': return new PflaumeDriver(view, racer, kart);
    case 'baron': return new BaronDriver(view, racer, kart);
    default: return new ModelDriver(view, racer, kart);
  }
}

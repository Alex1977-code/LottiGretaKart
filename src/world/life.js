// Lebendige Insel: Segelboote kreuzen vor der Küste, Vogelschwärme ziehen ihre Kreise, Schmetterlinge flattern um das
// eigene Kart (nur auf Wiesen, nicht unter Wasser, nicht in Höhle/Schnee/Wüste). Alles wenige Zeichenaufrufe
// (InstancedMesh bzw. eine Gruppe je Boot), Bewegung in update().

import * as THREE from 'three';
import { Build, vcol } from '../lgw/course/models/lib/kit.js';
import { Rnd } from '../lgw/three/world/geometry.js';

const TAU = Math.PI * 2;

function boatGeo(sail, stripe) {
  const b = new Build();
  b.dome(1, (x, y) => (y > -0.25 ? 0xf8f8f8 : 0x1e3a6a), { p: [0, 0.35, 0], r: [Math.PI, 0, 0], s: [3.2, 0.9, 1.1] }, Math.PI / 2, 20, 6);
  b.box(5.4, 0.12, 1.9, 0xc8a070, { p: [-0.2, 0.36, 0] }, 0.05);
  b.box(1.6, 0.6, 1.2, 0xffffff, { p: [-0.9, 0.7, 0] }, 0.15);
  b.cyl(0.07, 0.09, 7, 0xe8e8e8, { p: [0.4, 3.8, 0] }, 6);
  const tri = new THREE.Shape();
  tri.moveTo(0, 0); tri.lineTo(2.8, 0); tri.lineTo(0, 6.2); tri.closePath();
  b.extrude(tri, 0.04, (x, y) => (y > 2.2 && y < 2.9 ? stripe : sail), { p: [0.32, 0.9, 0], r: [0, Math.PI, 0] }, 0, 1);
  const fore = new THREE.Shape();
  fore.moveTo(0, 0); fore.lineTo(2.2, 0); fore.lineTo(0, 5.2); fore.closePath();
  b.extrude(fore, 0.04, sail, { p: [0.5, 0.9, 0] }, 0, 1);
  return b.geometry();
}

export class IslandLife {
  constructor(scene, world, quality = 2) {
    this.world = world;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'inselleben';
    scene.add(this.group);
    const rnd = new Rnd(4711);
    // ---------------------------------------------------------------- Segelboote vor der Küste
    this.boats = [];
    const is = world.def.island;
    const sails = [[0xffffff, 0xe8392d], [0xfff4d8, 0x2a7ad8], [0xffffff, 0x3aa84a], [0xffe8a8, 0xff8a1a], [0xffffff, 0x8a3ab8]];
    const nb = quality >= 2 ? 9 : 4;
    for (let k = 0; k < nb; k++) {
      const [sc, st] = sails[k % sails.length];
      const m = new THREE.Mesh(boatGeo(sc, st), vcol(0.5, { side: THREE.DoubleSide }, 'boat'));
      m.castShadow = true;
      const a0 = rnd.frac() * TAU, rr = 1.6 + rnd.frac() * 0.12;   // außerhalb der Nachbarinseln
      this.boats.push({ m, a0, rr, w: (rnd.frac() < 0.5 ? -1 : 1) * (0.004 + rnd.frac() * 0.004), ph: rnd.frac() * 10 });
      this.group.add(m);
    }
    this.is = is;
    // ---------------------------------------------------------------- Vogelschwärme
    const birdG = new Build()
      .box(0.5, 0.06, 0.12, 0xffffff, { p: [0, 0, 0] }, 0.02)
      .box(0.12, 0.03, 0.75, 0xffffff, { p: [0, 0, 0.36], r: [0.25, 0, 0] }, 0.01)
      .box(0.12, 0.03, 0.75, 0xffffff, { p: [0, 0, -0.36], r: [-0.25, 0, 0] }, 0.01)
      .geometry();
    this.flocks = [];
    const nf = quality >= 2 ? 6 : 3, per = 8;
    this.birds = new THREE.InstancedMesh(birdG, vcol(0.6, {}, 'bird'), nf * per);
    this.birds.frustumCulled = false;
    const bc = new THREE.Color();
    for (let f = 0; f < nf; f++) {
      const b = world.def.bounds;
      this.flocks.push({ cx: b.minX + 300 + rnd.frac() * (b.maxX - b.minX - 600), cz: b.minZ + 250 + rnd.frac() * (b.maxZ - b.minZ - 500), r: 60 + rnd.frac() * 90, y: 45 + rnd.frac() * 35, w: (rnd.frac() < 0.5 ? -1 : 1) * (0.08 + rnd.frac() * 0.05), a0: rnd.frac() * TAU });
      for (let j = 0; j < per; j++) this.birds.setColorAt(f * per + j, bc.setHex(f % 2 ? 0xf4f4f8 : 0x3a3a48));
    }
    this.perFlock = per;
    this.group.add(this.birds);
    // ---------------------------------------------------------------- Schmetterlinge (folgen dem Spieler)
    const nB = quality >= 2 ? 18 : 0;
    this.flies = [];
    if (nB) {
      const wing = new Build()
        .sphere(1, 0xffffff, { p: [0, 0, 0.17], s: [0.14, 0.01, 0.17] }, 10, 4)
        .sphere(1, 0xffffff, { p: [-0.1, 0, 0.12], s: [0.09, 0.01, 0.11] }, 8, 4)
        .geometry();
      this.wingL = new THREE.InstancedMesh(wing, vcol(0.5, { side: THREE.DoubleSide }, 'fly'), nB);
      this.wingR = new THREE.InstancedMesh(wing, vcol(0.5, { side: THREE.DoubleSide }, 'fly'), nB);
      for (const im of [this.wingL, this.wingR]) { im.frustumCulled = false; this.group.add(im); }
      const cols = [0xffd21f, 0xff6fa8, 0x5ab8ff, 0xffffff, 0xff8a2a, 0xb47fe6];
      for (let k = 0; k < nB; k++) {
        const c = bc.setHex(cols[k % cols.length]);
        this.wingL.setColorAt(k, c); this.wingR.setColorAt(k, c);
        this.flies.push({ x: 0, z: 0, set: false, ph: rnd.frac() * 10, sp: 0.6 + rnd.frac() * 0.6 });
      }
    }
    this.rnd = rnd;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.p = new THREE.Vector3(); this.s = new THREE.Vector3(1, 1, 1);
  }

  update(dt, t, focus) {
    const { m, q, e, p, s } = this;
    // Boote: große Ellipse um die Insel, leichtes Schaukeln
    for (const b of this.boats) {
      const a = b.a0 + t * b.w, ex = Math.cos(a), ez = Math.sin(a);
      const x = this.is.cx + ex * this.is.rx * b.rr, z = this.is.cz + ez * this.is.rz * b.rr;
      b.m.position.set(x, 0.05 + Math.sin(t * 1.3 + b.ph) * 0.12, z);
      // Fahrtrichtung = Tangente der Ellipse
      const tx = -Math.sin(a) * this.is.rx * Math.sign(b.w), tz = Math.cos(a) * this.is.rz * Math.sign(b.w);
      b.m.rotation.set(Math.sin(t * 1.1 + b.ph) * 0.05, Math.atan2(-tz, tx), Math.sin(t * 0.9 + b.ph) * 0.08 + 0.12 * Math.sign(b.w));
    }
    // Vögel: Schwarm kreist, jeder Vogel mit Abstand und Flügelschlag
    let k = 0;
    for (const f of this.flocks) {
      const a = f.a0 + t * f.w;
      for (let j = 0; j < this.perFlock; j++, k++) {
        const off = j - this.perFlock / 2, lag = a - off * 0.012 * Math.sign(f.w) - Math.abs(off) * 0.01 * Math.sign(f.w);
        const rr = f.r + Math.abs(off) * 2.2;
        p.set(f.cx + Math.cos(lag) * rr, f.y + Math.sin(t * 0.7 + j) * 1.2 + Math.abs(off) * 0.4, f.cz + Math.sin(lag) * rr);
        const dirA = lag + Math.PI / 2 * Math.sign(f.w);
        e.set(0, -dirA, 0);
        q.setFromEuler(e);
        const flap = 0.55 + 0.45 * Math.sin(t * 9 + j * 1.7);
        s.set(2.2, 2.2, 2.2 * flap);
        m.compose(p, q, s);
        this.birds.setMatrixAt(k, m);
      }
    }
    this.birds.instanceMatrix.needsUpdate = true;
    // Schmetterlinge in der Nähe des Spielers
    if (this.flies.length && focus) {
      const w = this.world;
      const ok = focus.y > 0.3 && !(w.hasUnderwater && w.underwaterAt(focus.x, focus.z));
      const amb = ok ? w.ambienceAt(focus.x, focus.z) : [];
      const meadow = ok && !amb.some((r) => ['snow', 'desert', 'volcano', 'cave', 'castle', 'halloween', 'city'].includes(r.theme) && r.w > 0.35);
      this.wingL.visible = this.wingR.visible = meadow;
      if (meadow) {
        this.flies.forEach((b, i) => {
          if (!b.set || (b.x - focus.x) ** 2 + (b.z - focus.z) ** 2 > 40 * 40) {
            const a = this.rnd.frac() * TAU, r = 8 + this.rnd.frac() * 25;
            b.x = focus.x + Math.cos(a) * r; b.z = focus.z + Math.sin(a) * r; b.set = true;
          }
          const tt = t * b.sp + b.ph;
          b.x += Math.cos(tt * 0.7) * dt * 1.4; b.z += Math.sin(tt * 0.9) * dt * 1.4;
          const gy = w.heightAt(b.x, b.z);
          const y = Math.max(gy, 0.2) + 0.8 + Math.sin(tt * 2.3) * 0.4 + Math.sin(tt * 0.6) * 0.5;
          const yaw = Math.atan2(-Math.sin(tt * 0.9), Math.cos(tt * 0.7));
          const flap = Math.sin(t * 16 + b.ph * 5) * 0.9;
          p.set(b.x, y, b.z);
          for (const [im, sg] of [[this.wingL, 1], [this.wingR, -1]]) {
            e.set(sg * flap, yaw, 0, 'YXZ');
            q.setFromEuler(e);
            s.set(1.6, 1.6, 1.6 * sg);
            m.compose(p, q, s);
            im.setMatrixAt(i, m);
          }
        });
        this.wingL.instanceMatrix.needsUpdate = true;
        this.wingR.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

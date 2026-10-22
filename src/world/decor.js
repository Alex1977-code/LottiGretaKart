// Kulisse neben der Strecke. Zwei Sorten:
//  - Massenware als InstancedMesh (ein Zeichenaufruf je Art): runde Bäume, Tannen, Herbstbäume, Büsche, Blumen,
//    Riesenpilze, Felsen, Kristalle, Tropfsteine, ferne Hügel, Stadt-Silhouette.
//  - Einzelne Original-Modelle der Lotti-&-Greta-Welt (Röhren, Blöcke, Laternen, Zuschauer, Ampel …) mit Animation.
// Platzierung immer außerhalb der Banden (Abstand wird geprüft).

import * as THREE from 'three';
import { Build, vcol } from '../lgw/course/models/lib/kit.js';
import { getModel } from '../lgw/course/models/index.js';
import { Rnd } from '../lgw/three/world/geometry.js';

// ------------------------------------------------------------------ Geometrien der Massenware (Ursprung = Fuß)
const GEO = {};
function g(key, make) { return GEO[key] ?? (GEO[key] = make()); }

const roundTree = () => g('roundTree', () => new Build()
  .cyl(0.28, 0.4, 2.2, 0x9a6534, { p: [0, 1.1, 0] }, 10)
  .sphere(1.9, 0xffffff, { p: [0, 3.6, 0] }, 16, 12)
  .sphere(1.35, 0xffffff, { p: [0.9, 3.0, 0.6] }, 14, 10)
  .sphere(1.3, 0xffffff, { p: [-0.8, 3.2, -0.6] }, 14, 10)
  .geometry());
const pineTree = () => g('pineTree', () => new Build()
  .cyl(0.25, 0.32, 1.4, 0x8a5a2e, { p: [0, 0.7, 0] }, 8)
  .cone(2.0, 2.6, 0xffffff, { p: [0, 2.4, 0] }, 12)
  .cone(1.6, 2.2, 0xffffff, { p: [0, 3.6, 0] }, 12)
  .cone(1.1, 1.8, 0xffffff, { p: [0, 4.7, 0] }, 12)
  .geometry());
const bush = () => g('bush', () => new Build()
  .sphere(0.9, 0xffffff, { p: [0, 0.6, 0] }, 12, 8)
  .sphere(0.7, 0xffffff, { p: [0.7, 0.45, 0.2] }, 12, 8)
  .sphere(0.65, 0xffffff, { p: [-0.6, 0.45, -0.25] }, 12, 8)
  .geometry());
const flower = () => g('flower', () => {
  const b = new Build().cyl(0.03, 0.03, 0.5, 0x3f9a2a, { p: [0, 0.25, 0] }, 5);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.sphere(0.1, 0xffffff, { p: [Math.cos(a) * 0.12, 0.55, Math.sin(a) * 0.12], s: [1, 0.5, 1] }, 8, 5); }
  return b.sphere(0.08, 0xffd21f, { p: [0, 0.57, 0] }, 8, 5).geometry();
});
const mushroom = () => g('mushroom', () => {
  const b = new Build()
    .cyl(0.7, 0.9, 2.6, 0xfff3df, { p: [0, 1.3, 0] }, 14)
    .dome(2.4, 0xffffff, { p: [0, 2.4, 0], s: [1, 0.75, 1] }, Math.PI / 2, 22, 8)
    .cyl(2.4, 2.4, 0.18, 0xffffff, { p: [0, 2.42, 0] }, 22);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, el = 0.55 + (i % 2) * 0.35;
    b.sphere(0.36, 0xfff8ee, { p: [Math.cos(a) * 2.4 * Math.cos(el), 2.4 + 1.8 * Math.sin(el), Math.sin(a) * 2.4 * Math.cos(el)], s: [1, 0.5, 1] }, 10, 6);
  }
  b.sphere(0.8, 0xfff8ee, { p: [0, 4.15, 0], s: [1, 0.4, 1] }, 12, 6);
  return b.geometry();
});
const rock = () => g('rock', () => new Build()
  .sphere(1, 0xffffff, { p: [0, 0.5, 0], s: [1.2, 0.8, 1] }, 10, 7)
  .sphere(0.7, 0xffffff, { p: [0.8, 0.35, 0.3], s: [1, 0.8, 1] }, 9, 6)
  .geometry());
const crystal = () => g('crystal', () => new Build()
  .cone(0.35, 2.2, 0xffffff, { p: [0, 1.1, 0] }, 6)
  .cone(0.25, 1.5, 0xffffff, { p: [0.4, 0.7, 0.1], r: [0.2, 0, -0.35] }, 6)
  .cone(0.22, 1.3, 0xffffff, { p: [-0.35, 0.6, -0.1], r: [-0.2, 0, 0.4] }, 6)
  .geometry());
const stalactite = () => g('stalactite', () => new Build()
  .cone(0.9, 5, 0xffffff, { p: [0, -2.5, 0], r: [Math.PI, 0, 0] }, 8)
  .cone(0.5, 3, 0xffffff, { p: [0.9, -1.5, 0.3], r: [Math.PI, 0, 0] }, 7)
  .geometry());
const hill = () => g('hill', () => new Build().sphere(1, 0xffffff, { s: [1, 1, 1] }, 20, 10).geometry());
const building = () => g('building', () => new Build().box(1, 1, 1, 0xffffff, { p: [0, 0.5, 0] }, 0.02, 1).geometry());
const block = () => g('block', () => new Build().box(1, 1, 1, 0xffffff, { p: [0, 0.5, 0] }, 0.08).geometry());

const KINDS = { roundTree, pineTree, bush, flower, mushroom, rock, crystal, stalactite, hill, building, block };

export class Decor {
  constructor(race, track, theme, seed = 1, quality = 2) {
    this.race = race;
    this.quality = quality;
    this.density = quality >= 2 ? 1 : 0.55;   // Handy: weniger Kulisse
    this.track = track;
    this.theme = theme;
    this.group = new THREE.Group();
    this.group.name = 'kulisse';
    this.rnd = new Rnd(seed);
    this.batches = new Map(); // kind → [{ m: Matrix4, c: Color }]
    this.models = [];          // { model, state, holder, tick? }
    this.lights = [];
  }

  r() { return this.rnd.frac(); }

  /** Freier Platz? (Abstand zur Bande, eigene Größe) */
  clear(x, z, size = 2) {
    const { i, d } = this.track.nearestIndex(x, z, 4);
    return d > this.track.wallAt(i) + 1.2 + size;
  }

  add(kind, x, y, z, s = 1, color = 0xffffff, ry = 0, sy = s) {
    let list = this.batches.get(kind);
    if (!list) { list = []; this.batches.set(kind, list); }
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, sy, s));
    list.push({ m, c: new THREE.Color(color) });
  }

  /** Viele Objekte zufällig im Band dist0..dist1 neben der Strecke verstreuen. */
  scatter(kind, n, { dist0 = 3, dist1 = 40, s0 = 0.8, s1 = 1.3, colors = [0xffffff], size = 2, sink = 0, u0 = 0, u1 = 1 } = {}) {
    n = Math.round(n * this.density);
    let placed = 0, tries = 0;
    const tr = this.track;
    while (placed < n && tries < n * 12) {
      tries++;
      const u = u0 + (u1 - u0) * this.r(), side = this.r() < 0.5 ? -1 : 1;
      const p = tr.pointAt(u, 0);
      const lat = side * (tr.wallAt(p.i) + dist0 + (dist1 - dist0) * this.r() ** 1.3);
      const q = tr.pointAt(u, lat);
      const s = s0 + (s1 - s0) * this.r();
      if (!this.clear(q.x, q.z, size * s)) continue;
      this.add(kind, q.x, q.y - sink, q.z, s, colors[Math.floor(this.r() * colors.length)], this.r() * Math.PI * 2);
      placed++;
    }
  }

  /** Ring aus fernen Hügeln/Bergen um die Strecke. */
  hillsRing(color, color2, r0 = 260, n = 26, h0 = 30, h1 = 70) {
    const b = this.track.bounds;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const R = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2 + r0 * 0.5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.r() * 0.2;
      const rr = R + 40 + this.r() * 80, h = h0 + this.r() * (h1 - h0);
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      this.add('hill', x, this.track.heightAt(x, z) - h * 0.35, z, h * (1.3 + this.r() * 0.6), this.r() < 0.5 ? color : color2, 0, h);
    }
  }

  /** Stadt-Silhouette (Abendautobahn): Hochhäuser mit warm leuchtenden Fenstern (Vertexfarben-Streifen). */
  city(colors, windowColor, r0 = 140, n = 70) {
    const b = this.track.bounds;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const R = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2 + r0;
    const parts = new Build();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.r() * 0.05;
      const rr = R + this.r() * 120;
      const w = 12 + this.r() * 18, h = 25 + this.r() * 80, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      const col = colors[i % colors.length];
      parts.box(w, h, w, col, { p: [x, h / 2 - 5, z], r: [0, -a, 0] }, 0.5, 1);
      // Fensterbänder
      for (let y = 6; y < h - 4; y += 7) {
        if (this.r() < 0.35) continue;
        parts.box(w * 1.01, 1.2, w * 1.01, windowColor, { p: [x, y - 5, z], r: [0, -a, 0] }, 0, 1);
      }
    }
    const geo = parts.geometry();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }));
    m.name = 'stadt';
    this.group.add(m);
  }

  /** Einzelnes Modell aus der Welt; at = { u, side, dist (über die Bande hinaus) } oder { x, z }. */
  model(name, at, { opts = {}, scale = 1, state = 'idle', yaw = null, y = 0, face = 'track', tick = null } = {}) {
    let x, z, base, yy;
    const tr = this.track;
    if (at.x !== undefined) { x = at.x; z = at.z; base = { yaw: 0 }; }
    else {
      const p0 = tr.pointAt(at.u, 0);
      const lat = at.lat !== undefined ? at.lat * p0.hw : (at.side ?? 1) * (tr.wallAt(p0.i) + (at.dist ?? 2));
      const p = tr.pointAt(at.u, lat);
      x = p.x; z = p.z; base = p;
      if (yaw === null) {
        // Modelle blicken nach +X: 'track' = zur Fahrbahn, 'along' = in Fahrtrichtung, sonst entgegen
        if (face === 'track') yaw = p.yaw + (lat > 0 ? Math.PI / 2 : -Math.PI / 2);
        else if (face === 'along') yaw = p.yaw;
        else yaw = p.yaw + Math.PI;
      } else yaw += p.yaw;
    }
    yy = tr.heightAt(x, z) + y;
    const m = getModel(name, opts);
    m.root.position.set(x, yy, z);
    m.root.rotation.y = yaw ?? 0;
    m.root.scale.setScalar(scale);
    m.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.group.add(m.root);
    const entry = { model: m, state, tick, base, t: this.r() * 10 };
    this.models.push(entry);
    return entry;
  }

  /** Punktlicht (Laternen, Höhle, Zirkus). */
  light(x, y, z, color, intensity, distance) {
    const l = new THREE.PointLight(color, intensity, distance, 1.6);
    l.position.set(x, y, z);
    this.group.add(l);
    this.lights.push(l);
    return l;
  }

  /** Zuschauer-Tribüne: Reihe aus Figuren am Rand (jubeln). */
  crowd(u, side, names, { dist = 2.2, spacing = 1.6, scale = 1.3 } = {}) {
    const n = names.length;
    const tr = this.track;
    for (let k = 0; k < n; k++) {
      const du = ((k - (n - 1) / 2) * spacing) / tr.length;
      const e = this.model(names[k], { u: u + du, side, dist }, { scale, state: names[k] === 'fairy_spotter' ? 'cheer' : names[k] === 'bunny_small' ? 'hop' : 'idle' });
      e.cheer = true;
    }
  }

  /** Start-Ziel-Tor: zwei Pfosten, Banner mit Schriftzug und Schachbrett. */
  startGate(text = 'LOTTI & GRETA KART') {
    const tr = this.track, p = tr.pointAt(0, 0), hw = tr.hw[0] + 1.6;
    const b = new Build();
    const H = 6.2;
    for (const s of [-1, 1]) {
      b.cyl(0.32, 0.38, H, 0xf8f6f0, { p: [0, H / 2, s * hw] }, 14);
      b.sphere(0.5, 0xffc21a, { p: [0, H + 0.3, s * hw] }, 14, 10);
      b.cyl(0.5, 0.6, 0.4, 0x3b7cf0, { p: [0, 0.2, s * hw] }, 14);
    }
    b.box(0.5, 1.4, hw * 2, 0xe8392d, { p: [0, H - 0.6, 0] }, 0.15);
    const geo = b.geometry();
    const gate = new THREE.Mesh(geo, vcol(0.4));
    gate.castShadow = true;
    const grp = new THREE.Group();
    grp.add(gate);
    // Banner-Schrift auf beiden Seiten
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#e8392d'; x.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? '#2a2834' : '#faf8f2'; x.fillRect(i * 32, 0, 32, 16); x.fillStyle = i % 2 ? '#faf8f2' : '#2a2834'; x.fillRect(i * 32, 112, 32, 16); }
    x.fillStyle = '#fff8ee'; x.font = 'bold 76px "Trebuchet MS", "Arial Rounded MT Bold", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 10; x.strokeStyle = '#7a1a20'; x.strokeText(text, 512, 66); x.fillText(text, 512, 66);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    for (const s of [1, -1]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 - 0.2, 1.3), mat);
      pl.position.set(s * 0.26, H - 0.6, 0);
      pl.rotation.y = s * Math.PI / 2;
      grp.add(pl);
    }
    grp.position.set(p.x, p.y, p.z);
    grp.rotation.y = p.yaw;
    this.group.add(grp);
    return grp;
  }

  /** Zirkuszelt über der ganzen Strecke: gestreifte Wand, Kegeldach, Masten, Lichterketten, Scheinwerferkegel. */
  buildTent() {
    const b = this.track.bounds;
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    let R = 0;
    for (let i = 0; i < this.track.N; i += 4) R = Math.max(R, Math.hypot(this.track.px[i] - cx, this.track.pz[i] - cz) + this.track.wallAt(i));
    R += 26;
    const H = 18, roof = 34, seg = 48;
    const wall = new THREE.CylinderGeometry(R, R, H, seg, 1, true);
    const roofG = new THREE.ConeGeometry(R, roof, seg, 1, true);
    const stripe = (g, y0) => {
      const P = g.attributes.position, col = new Float32Array(P.count * 3);
      const A = new THREE.Color(0xd23440), B = new THREE.Color(0xfff4e0);
      for (let i = 0; i < P.count; i++) {
        const a = Math.atan2(P.getZ(i), P.getX(i));
        const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * seg + 0.5) % 2;
        const c = k ? A : B;
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g.toNonIndexed();
    };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, flatShading: true });
    const w = new THREE.Mesh(stripe(wall), mat);
    w.position.set(cx, H / 2 - 2, cz);
    const r = new THREE.Mesh(stripe(roofG), mat);
    r.position.set(cx, H - 2 + roof / 2, cz);
    this.group.add(w, r);
    // Mittelmast und Scheinwerferkegel
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, H + roof, 12), new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.4 }));
    mast.position.set(cx, (H + roof) / 2 - 2, cz);
    this.group.add(mast);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.beams = [];
    for (let i = 0; i < 6; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(7, 36, 20, 1, true), beamMat);
      cone.geometry.translate(0, -18, 0);
      const holder = new THREE.Group();
      holder.position.set(cx, H + roof * 0.4, cz);
      holder.add(cone);
      cone.rotation.z = 0.5;
      holder.rotation.y = (i / 6) * Math.PI * 2;
      this.group.add(holder);
      this.beams.push(holder);
    }
    // Lichterketten (Kugeln, additiv) vom Mast zur Wand
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 16 * 22);
    const cols = [0xffc94a, 0xff6fa8, 0x58b8ff, 0x8fe060];
    const m = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      for (let j = 0; j < 22; j++) {
        const f = (j + 1) / 23;
        const x = cx + Math.cos(a) * R * f * 0.98, z = cz + Math.sin(a) * R * f * 0.98;
        const y = H - 2 + roof * (1 - f) - 3 * Math.sin(f * Math.PI);
        m.makeTranslation(x, y, z);
        bulbs.setMatrixAt(k, m);
        bulbs.setColorAt(k, new THREE.Color(cols[(i + j) % 4]));
        k++;
      }
    }
    this.group.add(bulbs);
  }

  /** Höhlendecke (dunkler Fels) über allem. */
  buildCeiling() {
    const b = this.track.bounds;
    const w = b.maxX - b.minX + 200, d = b.maxZ - b.minZ + 200;
    const g = new THREE.PlaneGeometry(w, d, 30, 30);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 0.08) * 2 + Math.cos(P.getY(i) * 0.07) * 2);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x3a3044, roughness: 1, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI / 2;
    m.position.set((b.minX + b.maxX) / 2, 17, (b.minZ + b.maxZ) / 2);
    this.group.add(m);
  }

  /** Autobahn-Schilderbrücken mit Text. */
  buildSigns(list) {
    for (const [u, text, color] of list) {
      const p = this.track.pointAt(u, 0), hw = p.hw + 1.4;
      const grp = new THREE.Group();
      const post = new THREE.MeshStandardMaterial({ color: 0x8f94a4, roughness: 0.4, metalness: 0.4 });
      for (const s of [-1, 1]) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 7.2, 10), post);
        c.position.set(0, 3.6, s * hw);
        c.castShadow = true;
        grp.add(c);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, hw * 2), post);
      beam.position.set(0, 6.9, 0);
      grp.add(beam);
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 128;
      const x = cv.getContext('2d');
      x.fillStyle = `#${color.toString(16).padStart(6, '0')}`; x.fillRect(0, 0, 512, 128);
      x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(8, 8, 496, 112);
      x.fillStyle = '#fff'; x.font = 'bold 50px "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, 256, 66, 470);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      board.position.set(-0.25, 6.0, 0);
      board.rotation.y = -Math.PI / 2;
      grp.add(board);
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = p.yaw;
      this.group.add(grp);
    }
  }

  build() {
    if (this.tent) this.buildTent();
    if (this.ceiling) this.buildCeiling();
    if (this.signs) this.buildSigns(this.signs);
    for (const [kind, list] of this.batches) {
      const im = new THREE.InstancedMesh(KINDS[kind](), vcol(kind === 'crystal' ? 0.2 : 0.55, kind === 'crystal' ? { emissive: 0x2a4a6a } : {}, kind === 'crystal' ? 'crystal' : ''), list.length);
      list.forEach((e, i) => { im.setMatrixAt(i, e.m); im.setColorAt(i, e.c); });
      im.castShadow = this.quality >= 2 ? !['hill', 'flower', 'building', 'stalactite'].includes(kind) : ['roundTree', 'pineTree', 'mushroom'].includes(kind);
      im.receiveShadow = true;
      im.computeBoundingSphere();
      im.name = `kulisse:${kind}`;
      this.group.add(im);
    }
    this.race.scene.add(this.group);
  }

  update(dt, t) {
    if (this.beams) this.beams.forEach((b, i) => { b.rotation.y = (i / this.beams.length) * Math.PI * 2 + Math.sin(t * 0.4 + i) * 0.5; });
    for (const e of this.models) {
      e.t += dt;
      if (e.tick) e.tick(e, dt, t);
      else e.model.update(dt, e.state);
    }
  }

  dispose() {
    for (const e of this.models) e.model.dispose();
    this.group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
    this.group.removeFromParent();
  }
}

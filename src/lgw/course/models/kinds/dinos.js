// Dino-Modelle für die Strecke „Dino-Dschungel“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt, Blick/Laufrichtung +X.
//
// trex          Tyrannosaurus ≈ 5 m hoch, grün.            state { anim: 'idle'|'walk'|'roar', speed }
// brachio       Brachiosaurus ≈ 11 m hoch, langer Hals.    state { anim: 'idle'|'walk', speed }  Hals schwingt, frisst.
// triceratops   Triceratops ≈ 2,6 m hoch, drei Hörner.     state { anim: 'idle'|'walk', speed }
// ptero         Flugsaurier, Spannweite ≈ 5 m.             state { anim: 'fly' }  Flügelschlag.
// dino_egg      geflecktes Dino-Ei ≈ 1,2 m im Nest.        state { anim: 'idle' }  wackelt ab und zu.
// fern          Baumfarn ≈ 4 m.                            opts { size }
// waterfall     Wasserfall am Felsen ≈ 14 m hoch mit Becken, Wasser fließt (animiert).

import * as THREE from 'three';
import { Build, mesh, vcol, std, cached, joint, eyes, makeModel, Clock, TAU, clamp } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;

/** Bein als Gelenk: Oberschenkel + Unterschenkel + Fuß (eine Geometrie), Drehpunkt an der Hüfte. */
function leg(key, len, r, color, foot = 0xe8e0c8) {
  return cached(`dino:leg:${key}`, () => new Build()
    .capsule(r, len * 0.55, color, { p: [0, -len * 0.38, 0] }, 4, 10)
    .sphere(1, color, { p: [len * 0.08, -len * 0.92, 0], s: [r * 1.5, r * 0.6, r * 1.2] }, 10, 6)
    .cone(r * 0.25, r * 0.6, foot, { p: [len * 0.08 + r * 1.4, -len * 0.95, 0], r: [0, 0, -Math.PI / 2] }, 5)
    .geometry());
}

function walkLegs(legs, ph, amp = 0.45, pairs = [[0, 3], [1, 2]]) {
  legs.forEach((l, i) => { l.rotation.z = sin(ph + (pairs[0].includes(i) ? 0 : Math.PI)) * amp; });
}

// =============================================================================================
function trex() {
  const G = 0x4aa83a, G2 = 0x3a8a2e, BELLY = 0xd8e8a0;
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('dino:trex', () => {
    const b = new Build();
    const shade = (x, y) => (y < -0.35 ? BELLY : sin(x * 9) > 0.75 ? G2 : G);
    b.sphere(1, shade, { p: [0, 3.0, 0], r: [0, 0, 0.35], s: [1.7, 1.1, 0.95] }, 22, 14);                 // Rumpf
    b.capsule(0.45, 1.2, G, { p: [1.3, 3.9, 0], r: [0, 0, -0.9] }, 4, 12);                               // Hals
    b.tube([[-1.4, 2.8, 0], [-2.8, 2.6, 0], [-4.2, 2.1, 0], [-5.2, 1.6, 0]], 0.42, G, {}, 16, 10);        // Schwanz
    b.cone(0.42, 1.1, G, { p: [-5.7, 1.4, 0], r: [0, 0, Math.PI / 2 + 0.4] }, 10);
    for (let i = 0; i < 6; i++) b.cone(0.18, 0.4, 0xe8a030, { p: [-0.8 - i * 0.7, 4.0 - i * 0.28, 0], r: [0, 0, 0.3] }, 4);   // Rückenzacken
    return b.geometry();
  }), vcol(0.55), {}, true));
  const head = joint([1.9, 4.6, 0]);
  head.add(mesh(cached('dino:trex:head', () => {
    const b = new Build();
    b.sphere(1, G, { p: [0.55, 0.2, 0], s: [0.95, 0.6, 0.6] }, 18, 12);
    b.box(0.25, 0.06, 0.7, 0xffffff, { p: [1.15, -0.08, 0] }, 0.02);                                     // Zähne (Leiste)
    for (const s of [1, -1]) b.sphere(0.05, 0x1a2a10, { p: [1.42, 0.3, s * 0.15] }, 6, 4);              // Nasenlöcher
    return b.geometry();
  }), vcol(0.5), {}, true));
  const jaw = joint([0.2, -0.1, 0], mesh(cached('dino:trex:jaw', () => new Build().sphere(1, BELLY, { p: [0.55, -0.15, 0], s: [0.8, 0.22, 0.48] }, 14, 8).geometry()), vcol(0.5), {}, true));
  head.add(jaw);
  head.add(eyes([{ p: [0.85, 0.48, 0.38], r: 0.13, dir: [0.4, 0.2, 1] }, { p: [0.85, 0.48, -0.38], r: 0.13, dir: [0.4, 0.2, -1] }], { key: 'dino:trex', iris: 0xe8b020, pupil: 0.45, slit: true }));
  const arms = [1, -1].map((s) => joint([1.3, 3.3, s * 0.65], mesh(cached('dino:trex:arm', () => new Build().capsule(0.12, 0.45, G, { p: [0.2, -0.3, 0], r: [0, 0, 0.8] }, 3, 8).geometry()), vcol(0.5), {}, true)));
  const legs = [1, -1].map((s) => joint([-0.2, 2.6, s * 0.75], mesh(leg('trex', 2.6, 0.38, G), vcol(0.55), {}, true)));
  body.add(head, ...arms, ...legs);
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t;
    if (anim === 'walk') {
      const ph = t * (2 + (st.speed ?? 1.5) * 0.9);
      legs.forEach((l, i) => { l.rotation.z = sin(ph + i * Math.PI) * 0.5; });
      body.position.y = Math.abs(sin(ph)) * 0.18;
      body.rotation.x = sin(ph) * 0.05;
      head.rotation.z = sin(ph * 2) * 0.05;
      jaw.rotation.z = -0.1;
    } else {
      legs.forEach((l) => { l.rotation.z = 0; });
      body.position.y = 0;
      const roar = anim === 'roar' || (t % 6) > 4.8;
      head.rotation.z = roar ? 0.35 : 0.05 * sin(t * 1.2);
      jaw.rotation.z = roar ? -0.6 - 0.1 * sin(t * 30) : -0.08;
    }
    arms.forEach((a, i) => { a.rotation.z = 0.2 * sin(t * 3 + i); });
  };
  return makeModel('trex', root, update);
}

function brachio() {
  const C = 0x6a9ad0, C2 = 0x5a86bc, BELLY = 0xc8dcf0;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('dino:brachio', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.4 ? BELLY : sin(x * 7 + y * 3) > 0.8 ? C2 : C), { p: [0, 4.2, 0], s: [3.2, 2.0, 1.8] }, 24, 14);
    b.tube([[-2.8, 4.0, 0], [-4.8, 3.4, 0], [-6.6, 2.4, 0], [-8.2, 1.4, 0]], 0.7, C, {}, 18, 10);
    b.cone(0.7, 1.5, C, { p: [-8.8, 1.2, 0], r: [0, 0, Math.PI / 2 + 0.3] }, 10);
    return b.geometry();
  }), vcol(0.6), {}, true));
  const neck = joint([2.4, 5.2, 0]);
  neck.add(mesh(cached('dino:brachio:neck', () => {
    const b = new Build();
    b.tube([[0, 0, 0], [0.9, 1.8, 0], [1.6, 3.8, 0], [2.0, 5.6, 0]], 0.55, C, {}, 20, 10);
    b.sphere(1, C, { p: [2.4, 5.9, 0], s: [0.8, 0.5, 0.5] }, 14, 10);
    b.box(0.05, 0.05, 0.4, 0x2a3a50, { p: [3.1, 5.75, 0] }, 0.01);   // Mund
    return b.geometry();
  }), vcol(0.6), {}, true));
  neck.add(eyes([{ p: [2.6, 6.08, 0.32], r: 0.1, dir: [0.4, 0.2, 1] }, { p: [2.6, 6.08, -0.32], r: 0.1, dir: [0.4, 0.2, -1] }], { key: 'dino:brachio', iris: 0x3a2a10, pupil: 0.6 }));
  const legs = [[1.8, 1], [1.8, -1], [-1.8, 1], [-1.8, -1]].map(([x, s]) => joint([x, 3.4, s * 1.1], mesh(cached('dino:brachio:leg', () => new Build().cyl(0.55, 0.6, 3.4, C, { p: [0, -1.7, 0] }, 12).cyl(0.68, 0.7, 0.3, 0xd8e0e8, { p: [0, -3.3, 0] }, 12).geometry()), vcol(0.6), {}, true)));
  body.add(neck, ...legs);
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t;
    if (anim === 'walk') walkLegs(legs, t * (1.5 + (st.speed ?? 1) * 0.6), 0.25);
    else legs.forEach((l) => { l.rotation.z = 0; });
    // Hals schwingt, ab und zu nach unten zum Fressen
    const eat = Math.max(0, sin(t * 0.25)) ** 6;
    neck.rotation.z = 0.08 * sin(t * 0.6) - eat * 0.9;
    neck.rotation.y = 0.25 * sin(t * 0.35);
  };
  return makeModel('brachio', root, update);
}

function triceratops() {
  const C = 0xe8963a, C2 = 0xc8762a, FRILL = 0xd8503a;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('dino:trike', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.45 ? 0xf0d8a8 : sin(x * 10) > 0.7 ? C2 : C), { p: [0, 1.6, 0], s: [1.9, 1.05, 1.1] }, 22, 14);
    b.tube([[-1.6, 1.6, 0], [-2.6, 1.3, 0], [-3.4, 0.9, 0]], 0.35, C, {}, 12, 8);
    b.cone(0.35, 0.8, C, { p: [-3.7, 0.8, 0], r: [0, 0, Math.PI / 2 + 0.4] }, 8);
    return b.geometry();
  }), vcol(0.6), {}, true));
  const head = joint([1.7, 1.8, 0]);
  head.add(mesh(cached('dino:trike:head', () => {
    const b = new Build();
    b.sphere(1, C, { p: [0.6, -0.1, 0], s: [0.8, 0.55, 0.6] }, 16, 10);
    b.cyl(1.0, 1.0, 0.18, FRILL, { p: [0.05, 0.4, 0], r: [0, 0, Math.PI / 2 - 0.5] }, 20);                   // Nackenschild
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; b.sphere(0.14, 0xffe08a, { p: [0.05 - sin(a) * 0.05 + cos(a) * 0.5 * 0.45, 0.4 + sin(a) * 0.95, cos(a) * 0.95], s: [0.6, 1, 1] }, 6, 4); }
    for (const s of [1, -1]) b.cone(0.1, 0.9, 0xf8f0dc, { p: [1.0, 0.45, s * 0.3], r: [0, 0, -1.0] }, 8);   // Hörner
    b.cone(0.09, 0.4, 0xf8f0dc, { p: [1.32, 0.05, 0], r: [0, 0, -1.2] }, 8);
    b.cone(0.18, 0.35, 0xc8b898, { p: [1.42, -0.25, 0], r: [0, 0, -Math.PI / 2 - 0.4] }, 8);                 // Schnabel
    return b.geometry();
  }), vcol(0.55), {}, true));
  head.add(eyes([{ p: [0.95, 0.12, 0.38], r: 0.09, dir: [0.4, 0.2, 1] }, { p: [0.95, 0.12, -0.38], r: 0.09, dir: [0.4, 0.2, -1] }], { key: 'dino:trike', iris: 0x3a2a10, pupil: 0.6 }));
  const legs = [[0.9, 1], [0.9, -1], [-0.9, 1], [-0.9, -1]].map(([x, s]) => joint([x, 1.2, s * 0.75], mesh(leg('trike', 1.2, 0.26, C), vcol(0.6), {}, true)));
  body.add(head, ...legs);
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t;
    if (anim === 'walk') { const ph = t * (3 + (st.speed ?? 1.5)); walkLegs(legs, ph, 0.4); body.position.y = Math.abs(sin(ph)) * 0.06; head.rotation.z = sin(ph) * 0.06; }
    else { legs.forEach((l) => { l.rotation.z = 0; }); head.rotation.z = -0.15 * Math.max(0, sin(t * 0.5)) ** 4; head.rotation.y = 0.2 * sin(t * 0.4); }
  };
  return makeModel('triceratops', root, update);
}

function ptero() {
  const C = 0xd86a3a, WING = 0xe88a5a;
  const root = new THREE.Group();
  const body = joint([0, 0.6, 0]);
  body.add(mesh(cached('dino:ptero', () => {
    const b = new Build();
    b.sphere(1, C, { s: [0.7, 0.28, 0.3] }, 14, 8);
    b.sphere(1, C, { p: [0.75, 0.2, 0], s: [0.35, 0.2, 0.18] }, 12, 8);
    b.cone(0.1, 0.8, 0xf0c070, { p: [1.25, 0.15, 0], r: [0, 0, -Math.PI / 2 + 0.1] }, 6);    // Schnabel
    b.cone(0.12, 0.7, C, { p: [0.55, 0.45, 0], r: [0, 0, 1.3] }, 6);                          // Kamm
    return b.geometry();
  }), vcol(0.5), {}, true));
  body.add(eyes([{ p: [0.9, 0.3, 0.12], r: 0.06, dir: [0.4, 0.2, 1] }, { p: [0.9, 0.3, -0.12], r: 0.06, dir: [0.4, 0.2, -1] }], { key: 'dino:ptero', iris: 0xe8b020, pupil: 0.5 }));
  const wings = [1, -1].map((s) => {
    const j = joint([0.1, 0.05, s * 0.2]);
    j.add(mesh(cached(`dino:ptero:wing:${s}`, () => {
      const g = new THREE.BufferGeometry();
      const v = new Float32Array([0.5, 0, 0, -0.6, 0, 0, 0.2, 0, s * 2.6, 0.5, 0, 0, 0.2, 0, s * 2.6, 0.9, 0, s * 1.4]);
      g.setAttribute('position', new THREE.BufferAttribute(v, 3));
      g.computeVertexNormals();
      const b = new Build();
      b.add(g, WING);
      return b.geometry();
    }), std('dino:wing', { color: 0xffffff, vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), {}, true));
    return j;
  });
  body.add(...wings);
  root.add(body);
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'fly');
    const t = clk.t;
    wings.forEach((w, i) => { w.rotation.x = (i ? -1 : 1) * 0.6 * sin(t * 6); });
    body.position.y = 0.6 + 0.15 * sin(t * 6 + 1);
  };
  return makeModel('ptero', root, update);
}

function dinoEgg() {
  const root = new THREE.Group();
  root.add(mesh(cached('dino:nest', () => new Build().torus(0.75, 0.28, 0x8a6a3a, { p: [0, 0.2, 0], r: [Math.PI / 2, 0, 0] }, 8, 18).geometry()), vcol(0.9), {}, true));
  const egg = joint([0, 0.15, 0], mesh(cached('dino:egg', () => new Build().sphere(1, (x, y, z) => (sin(x * 9) * cos(z * 8) + sin(y * 7) > 0.9 ? 0x6ab83a : 0xf4ecd8), { p: [0, 0.65, 0], s: [0.5, 0.7, 0.5] }, 18, 12).geometry()), vcol(0.4), {}, true));
  root.add(egg);
  const clk = new Clock();
  const update = (dt) => { clk.tick(dt, 'idle'); const w = (clk.t % 5) > 4.3 ? sin(clk.t * 30) * 0.15 : 0; egg.rotation.z = w; };
  return makeModel('dino_egg', root, update);
}

function fern(opts = {}) {
  const S = opts.size ?? 1;
  const root = new THREE.Group();
  root.add(mesh(cached(`dino:fern:${S}`, () => {
    const b = new Build();
    b.cyl(0.18 * S, 0.28 * S, 3 * S, 0x6a4a2a, { p: [0, 1.5 * S, 0] }, 7);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      b.sphere(1, i % 2 ? 0x3a9a2a : 0x4aaa34, { p: [cos(a) * 1.3 * S, 3.0 * S - 0.25 * S, sin(a) * 1.3 * S], r: [0, -a, 0.55], s: [1.6 * S, 0.08 * S, 0.45 * S] }, 10, 4);
    }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('fern', root, () => {});
}

function waterfall() {
  const root = new THREE.Group();
  root.add(mesh(cached('dino:fallrock', () => {
    const b = new Build();
    b.sphere(1, 0x7a7068, { p: [-3, 7, 0], s: [4, 8, 7] }, 16, 12);
    b.sphere(1, 0x6a625a, { p: [-2, 2, 4], s: [3, 3, 3] }, 12, 8);
    b.sphere(1, 0x6a625a, { p: [-2, 2, -4], s: [3, 3, 3] }, 12, 8);
    for (let k = 0; k < 8; k++) { const a = k * 0.8; b.sphere(1, 0x8a8078, { p: [3 + cos(a) * 5, 0.4, sin(a) * 5.5], s: [1.2, 0.7, 1.1] }, 8, 5); }
    for (let k = 0; k < 6; k++) b.sphere(1, 0x3a9a2a, { p: [-1 + (k % 3), 12 + (k % 2) * 2, -4 + k * 1.6], s: [1.6, 0.9, 1.4] }, 8, 5);
    return b.geometry();
  }), vcol(0.85), {}, true));
  // fließendes Wasser: Textur mit Streifen, die nach unten wandert
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#5ab8f0'; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; x.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 4, 20 + Math.random() * 40); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(4, 13), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9 }));
  fall.position.set(0.9, 7, 0); fall.rotation.y = Math.PI / 2;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5, 24), std('dino:pool', { color: 0x3aa0e0, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9 }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(3, 0.35, 0);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(2, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(1.6, 0.4, 0);
  root.add(fall, pool, foam);
  const clk = new Clock();
  const update = (dt) => { clk.tick(dt, 'idle'); tex.offset.y = clk.t * 1.2; foam.scale.setScalar(1 + 0.15 * sin(clk.t * 6)); };
  return makeModel('waterfall', root, update, [fall.geometry, pool.geometry, foam.geometry, tex]);
}

export const MODELS = { trex, brachio, triceratops, ptero, dino_egg: dinoEgg, fern, waterfall };
void clamp;

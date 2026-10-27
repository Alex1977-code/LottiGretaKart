// Katzen-Modelle für die Strecke „Katzeninsel“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt, Blick nach +X.
//
// cat          Katze (stehend), Schwanz wedelt, schaut umher.  opts { color: orange|black|white|grey|calico|tabby }
//              state 'idle'|'walk'|'squashed'  (walk: Beine laufen)
// kitten       kleines Kätzchen (wie cat, verspielter).  opts { color }
// giant_cat    riesige schlafende Katze (≈ 14 m), atmet, Schwanz schwingt, Zzz.  opts { color }
// mouse        Maus, flitzt.  state 'walk'
// yarn_ball    Wollknäuel (Gefahr): Ursprung = Mitte, Radius 1.  opts { color }
// cat_tree     Kratzbaum mit Plattformen, Höhle und baumelndem Spielzeug (≈ 7 m).
// cat_box      Karton-Tunnel zum Durchfahren mit Katzen, die oben herausschauen.  opts { length (24), width (28) }
// lucky_cat    Winkekatze (Statue), die Pfote winkt.
// fish_bone    großes Fischgräten-Skelett.
// cat_bowl     Napf mit Milch.
// cushion      dickes Kissen.  opts { color }

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, eyes, makeModel, Clock, TAU, canvasTexture } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const FUR = {
  orange: [0xff9a3a, 0xffd8a8, 0xe8782a], black: [0x2a2632, 0x4a4652, 0x1a1820], white: [0xfaf8f4, 0xffffff, 0xe8e4dc],
  grey: [0x9a9aa8, 0xd8d8e0, 0x7a7a88], calico: [0xfaf8f4, 0xff9a3a, 0x2a2632], tabby: [0xc89a6a, 0xf0dcc0, 0x8a6a42],
};
const furOf = (c) => FUR[c] ?? FUR.orange;

/** Fellfarbe nach Ort: Bauch hell, Streifen bzw. Flecken. */
function furPaint(c) {
  const [a, belly, b] = furOf(c);
  return (x, y, z) => {
    if (y < -0.25) return belly;
    if (c === 'calico') return sin(x * 4 + z * 3) > 0.5 ? a : sin(x * 3 - z * 5) > 0.3 ? 0xff9a3a : 0x2a2632;
    if (c === 'tabby' || c === 'orange') return Math.floor((x + 3) * 4.5) % 2 ? a : b;
    return a;
  };
}

function buildCat(name, color, small = false) {
  const root = new THREE.Group();
  const paint = furPaint(color), [a, belly] = furOf(color);
  const body = joint([0, 0.38, 0]);
  body.add(mesh(cached(`cat:body:${color}`, () => new Build().sphere(1, paint, { s: [0.36, 0.18, 0.17] }, 16, 10).geometry()), vcol(0.7), {}, true));
  // Kopf mit Ohren, Schnauze, Nase, Schnurrhaaren
  const head = joint([0.34, 0.14, 0]);
  head.add(mesh(cached(`cat:head:${color}`, () => {
    const b = new Build();
    b.sphere(0.17, a, { s: [1, 0.92, 1.05] }, 16, 12);
    b.sphere(0.08, belly, { p: [0.12, -0.05, 0], s: [0.9, 0.7, 1.3] }, 10, 8);
    b.sphere(0.022, 0xff8aa8, { p: [0.2, -0.02, 0] }, 6, 4);
    for (const s of [1, -1]) {
      b.cone(0.07, 0.13, a, { p: [-0.01, 0.15, s * 0.09], r: [s * 0.25, 0, -0.1] }, 4);
      b.cone(0.04, 0.08, 0xffb8c8, { p: [0.005, 0.145, s * 0.09], r: [s * 0.25, 0, -0.1] }, 4);
      for (const k of [-1, 1]) b.cyl(0.003, 0.003, 0.16, 0xffffff, { p: [0.18, -0.04 + k * 0.012, s * 0.1], r: [Math.PI / 2 + s * k * 0.15, 0, 0] }, 3);
    }
    return b.geometry();
  }), vcol(0.7), {}, true));
  head.add(eyes([{ p: [0.13, 0.04, 0.065], r: 0.045, sy: 1.2 }, { p: [0.13, 0.04, -0.065], r: 0.045, sy: 1.2 }], { key: `cat:${color === 'black' ? 'y' : 'g'}`, iris: color === 'black' ? 0xffd23a : 0x6ac84a, pupil: 0.55, slit: true }));
  body.add(head);
  // Beine und Schwanz (Gelenke)
  const legG = cached(`cat:leg:${color}`, () => new Build().capsule(0.045, 0.2, a, { p: [0, -0.12, 0] }, 2, 6).sphere(0.05, belly, { p: [0.02, -0.25, 0], s: [1.2, 0.6, 1] }, 6, 4).geometry());
  const legs = [];
  for (const [x, z] of [[0.22, 0.09], [0.22, -0.09], [-0.22, 0.09], [-0.22, -0.09]]) { const j = joint([x, -0.06, z], mesh(legG, vcol(0.7))); body.add(j); legs.push(j); }
  const tailRoot = joint([-0.34, 0.05, 0]);
  let tj = tailRoot;
  const tails = [];
  for (let k = 0; k < 5; k++) {
    const j = joint([k === 0 ? 0 : -0.09, k === 0 ? 0 : 0.03, 0], mesh(cached(`cat:tail:${color}:${k}`, () => new Build().capsule(0.035 - k * 0.003, 0.08, k === 4 && color === 'calico' ? 0x2a2632 : a, { r: [0, 0, Math.PI / 2 - 0.4], p: [-0.04, 0.02, 0] }, 2, 6).geometry()), vcol(0.7)));
    tj.add(j); tj = j; tails.push(j);
  }
  body.add(tailRoot);
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.35, 1.3); return; }
    body.scale.setScalar(1);
    const t = clk.t * (small ? 1.3 : 1);
    tails.forEach((j, k) => { j.rotation.y = sin(t * 2.2 - k * 0.6) * 0.35; j.rotation.z = 0.25 + sin(t * 1.3 - k) * 0.08; });
    if (anim === 'walk') {
      const sp = (st.speed ?? 2) * 3.2;
      legs.forEach((j, k) => { j.rotation.z = sin(t * sp + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6; });
      body.position.y = 0.38 + Math.abs(sin(t * sp)) * 0.02;
      head.rotation.set(0, 0, 0);
    } else {
      legs.forEach((j) => { j.rotation.z = 0; });
      head.rotation.y = sin(t * 0.5) * 0.5;
      head.rotation.z = sin(t * 0.33) * 0.12;
    }
  };
  return makeModel(name, root, update);
}
const cat = (opts = {}) => buildCat('cat', opts.color ?? 'orange');
function kitten(opts = {}) { const m = buildCat('kitten', opts.color ?? 'grey', true); m.root.children[0].scale.setScalar(0.7); return m; }

function giantCat(opts = {}) {
  const c = opts.color ?? 'orange', paint = furPaint(c), [a, belly] = furOf(c);
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached(`cat:giant:${c}`, () => {
    const b = new Build();
    b.sphere(1, paint, { p: [0, 2.4, 0], s: [6.5, 2.6, 3.4] }, 24, 14);
    // Kopf liegt auf den Pfoten
    b.sphere(2.4, a, { p: [6.2, 2.2, 0.6], s: [1, 0.85, 1.05] }, 20, 14);
    b.sphere(1.0, belly, { p: [7.9, 1.6, 0.6], s: [0.8, 0.6, 1.2] }, 12, 8);
    b.sphere(0.25, 0xff8aa8, { p: [8.55, 1.95, 0.6] }, 8, 6);
    for (const s of [1, -1]) {
      b.cone(1.0, 1.6, a, { p: [5.9, 4.3, 0.6 + s * 1.3], r: [s * 0.3, 0, -0.15] }, 4);
      b.cone(0.55, 0.9, 0xffb8c8, { p: [6.05, 4.2, 0.6 + s * 1.3], r: [s * 0.3, 0, -0.15] }, 4);
      b.capsule(0.7, 2.2, belly, { p: [7.2, 0.7, s * 1.6], r: [0, 0, Math.PI / 2] }, 3, 10);
      // geschlossene Augen (Striche)
      b.torus(0.4, 0.07, 0x2a2632, { p: [8.25, 2.5, 0.6 + s * 0.85], r: [0, Math.PI / 2 + s * 0.4, Math.PI] }, 4, 10, Math.PI);
    }
    return b.geometry();
  }), vcol(0.75), {}, true));
  const tail = joint([-6.2, 1.5, -1.5]);
  tail.add(mesh(cached(`cat:gtail:${c}`, () => new Build().tube([[0, 0, 0], [-2, -0.6, -1.5], [-3.5, -1, 0.5], [-2.5, -1.1, 3]], 0.55, a, null, 16, 8).geometry()), vcol(0.75), {}, true));
  body.add(tail);
  root.add(body);
  // Zzz
  const zs = [];
  const zTex = canvasTexture('cat:z', 64, 64, (x) => { x.font = 'bold 54px sans-serif'; x.fillStyle = '#ffffff'; x.strokeStyle = '#5a4a8a'; x.lineWidth = 6; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('Z', 32, 34); x.fillText('Z', 32, 34); });
  for (let k = 0; k < 3; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false }));
    root.add(sp); zs.push(sp);
  }
  const clk = new Clock();
  return makeModel('giant_cat', root, (dt) => {
    clk.tick(dt, 'idle');
    const br = sin(clk.t * 1.1);
    body.scale.set(1, 1 + br * 0.03, 1 + br * 0.02);
    tail.rotation.y = sin(clk.t * 0.7) * 0.4;
    zs.forEach((sp, k) => { const f = (clk.t * 0.25 + k / 3) % 1; sp.position.set(8 + f * 2, 5 + f * 5, 0.6 + sin(f * 6) * 0.6); sp.scale.setScalar(0.8 + f * 1.6); sp.material.opacity = 1 - f; });
  }, zs.map((s) => s.material));
}

function mouse() {
  const root = new THREE.Group();
  const body = joint([0, 0.09, 0]);
  body.add(mesh(cached('cat:mouse', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.3 ? 0xf0e8e8 : 0x9a96a4), { s: [0.13, 0.08, 0.08] }, 12, 8);
    b.cone(0.06, 0.12, 0x9a96a4, { p: [0.15, 0.0, 0], r: [0, 0, -Math.PI / 2] }, 8);
    b.sphere(0.018, 0xff8aa8, { p: [0.21, 0, 0] }, 5, 4);
    for (const s of [1, -1]) { b.sphere(0.045, 0xb0acba, { p: [0.08, 0.07, s * 0.05], s: [0.4, 1, 1] }, 8, 6); b.sphere(0.03, 0xffb8c8, { p: [0.085, 0.07, s * 0.05], s: [0.3, 0.8, 0.8] }, 6, 4); }
    b.tube([[-0.12, 0, 0], [-0.2, 0.02, 0.04], [-0.3, 0.05, -0.02]], 0.008, 0xffb8c8, null, 8, 4);
    return b.geometry();
  }), vcol(0.6), {}, true));
  body.add(eyes([{ p: [0.13, 0.035, 0.035], r: 0.016 }, { p: [0.13, 0.035, -0.035], r: 0.016 }], { key: 'mouse', iris: 0x1a1a1a, pupil: 0.8 }));
  root.add(body);
  const clk = new Clock();
  return makeModel('mouse', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'walk');
    if (st.anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    body.scale.setScalar(1);
    body.position.y = 0.09 + Math.abs(sin(clk.t * 22)) * 0.02;
  });
}

function yarnBall(opts = {}) {
  const col = opts.color ?? 0xff5aa8;
  const root = new THREE.Group();
  root.add(mesh(cached(`cat:yarn:${col}`, () => {
    const b = new Build();
    b.sphere(0.94, col, {}, 20, 14);
    const d = new THREE.Color(col).multiplyScalar(0.75);
    for (let k = 0; k < 9; k++) b.torus(0.95, 0.05, d, { r: [k * 0.7, k * 1.3, k * 0.4] }, 4, 32);
    b.tube([[0.7, -0.6, 0], [1.2, -0.9, 0.3], [1.6, -0.95, -0.2]], 0.05, col, null, 10, 4);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('yarn_ball', root, () => {});
}

function catTree() {
  const root = new THREE.Group();
  const SIS = 0xd8b88a, PLUSH = 0xb88ad8, PLUSH2 = 0xff9ac8;
  root.add(mesh(cached('cat:tree', () => {
    const b = new Build();
    b.box(3.2, 0.3, 3.2, PLUSH, { p: [0, 0.15, 0] }, 0.1);
    const rope = (x, z, h, y0 = 0.3) => b.cyl(0.3, 0.3, h, (px, py) => (Math.floor((py + 10) * 8) % 2 ? SIS : 0xc8a878), { p: [x, y0 + h / 2, z] }, 12);
    rope(-0.8, -0.8, 3.4); rope(0.9, 0.7, 5.2); rope(-0.6, 0.9, 2.2);
    b.box(2.2, 0.25, 2.2, PLUSH2, { p: [-0.4, 3.85, -0.4] }, 0.1);
    b.box(2.4, 0.25, 2.4, PLUSH, { p: [0.6, 5.65, 0.5] }, 0.1);
    b.cyl(1.2, 1.2, 0.4, PLUSH2, { p: [0.6, 6.0, 0.5] }, 18, true);
    // Höhle
    b.box(1.6, 1.4, 1.6, PLUSH2, { p: [-0.6, 2.95, 0.9] }, 0.2);
    b.cyl(0.45, 0.45, 0.1, 0x3a2a4a, { p: [-0.6, 2.9, 1.71], r: [Math.PI / 2, 0, 0] }, 14);
    // Hängematte
    b.sphere(1, PLUSH, { p: [0.6, 2.2, -0.6], s: [0.9, 0.25, 0.7] }, 12, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  const toy = joint([1.6, 5.5, 0.5]);
  toy.add(mesh(cached('cat:toy', () => new Build().cyl(0.01, 0.01, 1.2, 0xffffff, { p: [0, -0.6, 0] }, 3).sphere(0.15, 0xff3a6a, { p: [0, -1.25, 0] }, 10, 8).cone(0.08, 0.3, 0xffd23a, { p: [0, -1.45, 0], r: [Math.PI, 0, 0] }, 6).geometry()), vcol(0.5)));
  root.add(toy);
  const clk = new Clock();
  return makeModel('cat_tree', root, (dt) => { clk.tick(dt, 'idle'); toy.rotation.x = sin(clk.t * 1.8) * 0.3; toy.rotation.z = cos(clk.t * 1.3) * 0.2; });
}

function catBox(opts = {}) {
  const L = opts.length ?? 24, W = (opts.width ?? 28) / 2, H = 8;
  const CB = 0xc89a5a, CB2 = 0xb8884a;
  const root = new THREE.Group();
  root.add(mesh(cached(`cat:box:${L}:${W}`, () => {
    const b = new Build();
    for (const s of [1, -1]) {
      b.box(L, H, 0.4, (x, y) => (Math.abs(y) < 0.3 ? 0xa87838 : CB), { p: [0, H / 2, s * (W + 0.2)] }, 0.05);
      b.box(L, 0.08, 0.42, 0xd8c8a8, { p: [0, H * 0.75, s * (W + 0.2)] }, 0);   // Klebeband
      b.box(L * 0.9, 0.3, 3.2, CB2, { p: [0, H + 1.4, s * (W + 1.2)], r: [s * 1.1, 0, 0] }, 0.05);   // Klappen
    }
    b.box(L, 0.4, W * 2 + 0.8, CB, { p: [0, H + 0.2, 0] }, 0.05);
    // Löcher im Deckel (dunkel), aus denen Katzen schauen
    for (const z of [-W * 0.5, 0, W * 0.5]) b.cyl(1.0, 1.0, 0.1, 0x3a2a1a, { p: [0, H + 0.42, z] }, 16);
    return b.geometry();
  }), vcol(0.9), {}, true));
  // Aufschrift
  for (const s of [1, -1]) {
    const tex = canvasTexture('cat:boxtxt', 512, 192, (x) => { x.font = 'bold 120px "Lilita One", sans-serif'; x.fillStyle = '#7a4a1a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MIAU!', 256, 100); });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), basic('cat:boxtxt', { map: tex, transparent: true }));
    pl.position.set(0, H * 0.45, s * (W + 0.42));
    if (s < 0) pl.rotation.y = Math.PI;
    root.add(pl);
  }
  // drei Katzen spazieren oben auf dem Karton und schauen über den Rand
  const heads = [];
  ['orange', 'black', 'white'].forEach((c, k) => {
    const m = buildCat('cat', c);
    m.root.scale.setScalar(4);
    root.add(m.root);
    heads.push(m);
  });
  const clk = new Clock();
  return makeModel('cat_box', root, (dt) => {
    clk.tick(dt, 'idle');
    heads.forEach((m, k) => {
      const x = (k - 1) * L * 0.3 + sin(clk.t * 0.3 + k * 2) * L * 0.12, walking = Math.cos(clk.t * 0.3 + k * 2) > 0;
      m.root.position.set(x, H + 0.4, (k - 1) * W * 0.45);
      m.root.rotation.y = walking ? 0 : Math.PI;
      m.update(dt, { anim: Math.abs(Math.cos(clk.t * 0.3 + k * 2)) > 0.3 ? 'walk' : 'idle', speed: 1 });
    });
  }, heads);
}

function luckyCat() {
  const root = new THREE.Group();
  root.add(mesh(cached('cat:lucky', () => {
    const b = new Build();
    b.box(1.6, 0.4, 1.6, 0xe8392d, { p: [0, 0.2, 0] }, 0.08);
    b.sphere(1, 0xfaf8f4, { p: [0, 1.25, 0], s: [0.65, 0.85, 0.65] }, 18, 12);
    b.sphere(0.6, 0xfaf8f4, { p: [0.05, 2.35, 0] }, 18, 12);
    b.torus(0.48, 0.08, 0xe8392d, { p: [0.05, 1.95, 0], r: [Math.PI / 2, 0, 0] }, 6, 20);
    b.cyl(0.18, 0.18, 0.05, 0xffc21a, { p: [0.55, 1.75, 0], r: [0, 0, Math.PI / 2] }, 12);
    for (const s of [1, -1]) { b.cone(0.22, 0.35, 0xfaf8f4, { p: [0, 2.9, s * 0.3], r: [s * 0.3, 0, 0] }, 4); b.cone(0.13, 0.22, 0xff8aa8, { p: [0.04, 2.88, s * 0.3], r: [s * 0.3, 0, 0] }, 4); }
    b.capsule(0.15, 0.5, 0xfaf8f4, { p: [0.4, 1.2, 0.35], r: [0, 0, 1.3] }, 2, 8);
    b.sphere(0.05, 0xff8aa8, { p: [0.62, 2.3, 0] }, 6, 4);
    return b.geometry();
  }), vcol(0.3), {}, true));
  root.add(eyes([{ p: [0.55, 2.45, 0.2], r: 0.12 }, { p: [0.55, 2.45, -0.2], r: 0.12 }], { key: 'lucky', iris: 0x1a1a1a, pupil: 0.6 }));
  const arm = joint([0.15, 1.75, -0.4], mesh(cached('cat:luckyarm', () => new Build().capsule(0.15, 0.6, 0xfaf8f4, { p: [0, 0.4, 0] }, 2, 8).sphere(0.18, 0xfaf8f4, { p: [0, 0.8, 0] }, 8, 6).geometry()), vcol(0.3)));
  root.add(arm);
  const clk = new Clock();
  return makeModel('lucky_cat', root, (dt) => { clk.tick(dt, 'idle'); arm.rotation.x = -0.3 + sin(clk.t * 3) * 0.45; });
}

function fishBone() {
  const root = new THREE.Group();
  root.add(mesh(cached('cat:fishbone', () => {
    const b = new Build();
    b.cyl(0.12, 0.12, 4, 0xf4f0e8, { p: [0, 0.3, 0], r: [0, 0, Math.PI / 2] }, 6);
    b.sphere(0.6, 0xf4f0e8, { p: [2.4, 0.5, 0], s: [1.2, 0.9, 0.5] }, 12, 8);
    b.sphere(0.12, 0x2a2a30, { p: [2.8, 0.7, 0.28] }, 6, 4);
    b.cone(0.7, 0.9, 0xf4f0e8, { p: [-2.4, 0.3, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.3] }, 3);
    for (let k = 0; k < 7; k++) for (const s of [1, -1]) b.cyl(0.05, 0.05, 1.1, 0xf4f0e8, { p: [-1.5 + k * 0.5, 0.3, s * 0.45], r: [s * 0.4, 0, 0.3] }, 4);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('fish_bone', root, () => {});
}

function catBowl() {
  const root = new THREE.Group();
  root.add(mesh(cached('cat:bowl', () => new Build()
    .lathe([[0.01, 0], [0.9, 0], [1.1, 0.45], [0.95, 0.5], [0.8, 0.12], [0.01, 0.12]], 0x3a8ae8, {}, 24)
    .cyl(0.84, 0.84, 0.05, 0xffffff, { p: [0, 0.35, 0] }, 24)
    .geometry()), vcol(0.3), {}, true));
  return makeModel('cat_bowl', root, () => {});
}

function cushion(opts = {}) {
  const c = opts.color ?? 0xff9ac8;
  const root = new THREE.Group();
  root.add(mesh(cached(`cat:cushion:${c}`, () => {
    const b = new Build();
    b.sphere(1, c, { p: [0, 0.45, 0], s: [1.6, 0.45, 1.6] }, 18, 10);
    b.sphere(0.12, new THREE.Color(c).multiplyScalar(0.8), { p: [0, 0.9, 0] }, 8, 6);
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.78; b.sphere(0.2, 0xffd23a, { p: [cos(a) * 1.5, 0.45, sin(a) * 1.5] }, 8, 6); }
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('cushion', root, () => {});
}

export const MODELS = { cat, kitten, giant_cat: giantCat, mouse, yarn_ball: yarnBall, cat_tree: catTree, cat_box: catBox, lucky_cat: luckyCat, fish_bone: fishBone, cat_bowl: catBowl, cushion };

// Kaninchen-Modelle für die Strecke „Hasenhügel“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt, Blick nach +X.
//
// rabbit         Kaninchen, hoppelt bzw. mümmelt.  opts { color: white|brown|grey|black|cream }  state 'idle'|'walk'|'hop'|'squashed'
// easter_egg     bemaltes Riesen-Ei (Gefahr, rollt): Ursprung = Mitte, Radius 1.  opts { color, stripe }
// egg_deco       bemaltes Ei aufrecht stehend (Deko).  opts { color, stripe }
// giant_carrot   Riesenmöhre, halb in der Erde (≈ 5 m Kraut).
// carrot_patch   Möhrenbeet: Reihen mit Kraut und orangefarbenen Köpfen (≈ 10 × 6 m).
// burrow_tunnel  Hasenbau zum Durchfahren: Erdhügel mit Röhre, Wurzeln, Laternen.  opts { length (30), width (28) }
// burrow_hole    Hasenloch, aus dem ein Kaninchen schaut.  opts { color }
// hutch          Hasenstall aus Holz mit Gitter und Heu.
// windmill       Windmühle, Flügel drehen sich (≈ 14 m).
// cabbage        Kohlkopf.

import * as THREE from 'three';
import { Build, mesh, vcol, basic, cached, joint, eyes, makeModel, Clock, TAU, glowSprite } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const FUR = { white: [0xfaf8f4, 0xffffff], brown: [0xa8784a, 0xf0dcc0], grey: [0x9a96a0, 0xe8e4e8], black: [0x3a3440, 0xd8d0d8], cream: [0xf0d8b0, 0xfff4e0] };

function rabbit(opts = {}) {
  const [a, belly] = FUR[opts.color] ?? FUR.white;
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached(`rb:body:${a}`, () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.2 ? belly : a), { p: [0, 0.32, 0], s: [0.34, 0.3, 0.26] }, 16, 10);
    b.sphere(0.12, 0xffffff, { p: [-0.33, 0.4, 0] }, 10, 8);   // Puschelschwanz
    for (const s of [1, -1]) {
      b.sphere(1, a, { p: [-0.1, 0.18, s * 0.18], s: [0.2, 0.14, 0.1] }, 10, 6);   // Hinterbeine
      b.sphere(1, belly, { p: [0.05, 0.03, s * 0.2], s: [0.2, 0.04, 0.07] }, 8, 4);  // Pfoten
      b.capsule(0.04, 0.12, a, { p: [0.22, 0.1, s * 0.09] }, 2, 6);                  // Vorderbeine
    }
    return b.geometry();
  }), vcol(0.8), {}, true));
  const head = joint([0.3, 0.5, 0]);
  head.add(mesh(cached(`rb:head:${a}`, () => {
    const b = new Build();
    b.sphere(0.18, a, { s: [1.05, 0.95, 1] }, 16, 12);
    b.sphere(0.09, belly, { p: [0.13, -0.05, 0], s: [0.8, 0.7, 1.3] }, 10, 8);
    b.sphere(0.025, 0xff8aa8, { p: [0.2, -0.01, 0] }, 6, 4);
    b.box(0.02, 0.05, 0.05, 0xffffff, { p: [0.19, -0.1, 0] }, 0.005);   // Zähnchen
    return b.geometry();
  }), vcol(0.8), {}, true));
  head.add(eyes([{ p: [0.12, 0.05, 0.08], r: 0.05 }, { p: [0.12, 0.05, -0.08], r: 0.05 }], { key: 'rabbit', iris: 0x3a2418, pupil: 0.65 }));
  const earG = cached(`rb:ear:${a}`, () => new Build().sphere(1, a, { p: [0, 0.2, 0], s: [0.05, 0.22, 0.08] }, 10, 6).sphere(1, 0xffb8c8, { p: [0.03, 0.2, 0], s: [0.02, 0.17, 0.05] }, 8, 4).geometry());
  const ears = [1, -1].map((s) => { const j = joint([-0.03, 0.13, s * 0.07], mesh(earG, vcol(0.8))); j.rotation.x = s * 0.18; head.add(j); return [j, s]; });
  body.add(head);
  root.add(body);
  const clk = new Clock();
  return makeModel('rabbit', root, (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.35, 1.3); return; }
    body.scale.setScalar(1);
    if (anim === 'walk' || anim === 'hop') {
      const ph = (clk.t * 2.6 * (st.speed ? Math.min(2, st.speed) : 1)) % 1;
      const up = sin(ph * Math.PI);
      body.position.y = up * 0.35;
      body.rotation.z = (0.5 - ph) * 0.5 * up;
      for (const [j, s] of ears) j.rotation.z = -up * 0.4;
    } else {
      body.position.y = 0; body.rotation.z = 0;
      head.rotation.z = sin(clk.t * 9) * 0.03;   // mümmeln
      head.rotation.y = sin(clk.t * 0.6) * 0.4;
      for (const [j, s] of ears) { j.rotation.z = sin(clk.t * 1.3 + s) * 0.12; }
    }
  });
}

const EGG_COLORS = [0xff6aa8, 0x5ab8ff, 0xffd23a, 0x8ad86a, 0xb88ad8, 0xff8a3a];
function eggGeo(color, stripe, center) {
  return new Build().sphere(1, { v: (x, y, z) => {
    const band = Math.abs(y - 0.3) < 0.12 || Math.abs(y + 0.25) < 0.1;
    const dots = sin(x * 9) * sin(z * 9) * cos(y * 7) > 0.55;
    return band ? stripe : dots ? 0xffffff : color;
  } }, { p: [0, center ? 0 : 1.25, 0], s: [0.85, 1.25, 0.85] }, 22, 16).geometry();
}
function easterEgg(opts = {}) {
  const c = opts.color ?? EGG_COLORS[0], s = opts.stripe ?? 0xffffff;
  const root = new THREE.Group();
  const m = mesh(cached(`rb:eggball:${c}:${s}`, () => eggGeo(c, s, true)), vcol(0.35), {}, true);
  m.rotation.z = Math.PI / 2;   // liegt und rollt
  m.scale.setScalar(0.85);
  root.add(m);
  return makeModel('easter_egg', root, () => {});
}
function eggDeco(opts = {}) {
  const c = opts.color ?? EGG_COLORS[1], s = opts.stripe ?? 0xffffff;
  const root = new THREE.Group();
  root.add(mesh(cached(`rb:egg:${c}:${s}`, () => eggGeo(c, s, false)), vcol(0.35), {}, true));
  return makeModel('egg_deco', root, () => {});
}

const carrotTop = (b, x, z, s = 1, y = 0) => {
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5; b.cone(0.07 * s, 0.6 * s, 0x4fb833, { p: [x + cos(a) * 0.06 * s, y + 0.35 * s, z + sin(a) * 0.06 * s], r: [sin(a) * 0.35, 0, cos(a) * 0.35] }, 4); }
  b.cone(0.11 * s, 0.25 * s, 0xff8a1a, { p: [x, y + 0.02, z], r: [Math.PI, 0, 0] }, 8);
  b.sphere(0.11 * s, 0xff8a1a, { p: [x, y + 0.08 * s, z], s: [1, 0.5, 1] }, 8, 4);
};

function giantCarrot() {
  const root = new THREE.Group();
  const top = joint([0, 0, 0]);
  root.add(mesh(cached('rb:giantcarrot', () => {
    const b = new Build();
    b.cone(1.4, 3.2, (x, y) => (Math.floor((y + 5) * 2) % 2 ? 0xff8a1a : 0xff7a10), { p: [0.6, 0.9, 0], r: [0, 0, Math.PI - 0.5] }, 16);
    b.sphere(1.4, 0xff8a1a, { p: [-0.1, 2.3, 0], s: [1, 0.4, 1] }, 16, 8);
    b.sphere(2.2, 0x7a5a3a, { p: [0, -0.4, 0], s: [1, 0.35, 1] }, 14, 8);   // Erdhaufen
    return b.geometry();
  }), vcol(0.6), {}, true));
  top.add(mesh(cached('rb:giantcarrottop', () => {
    const b = new Build();
    for (let k = 0; k < 7; k++) { const a = k * TAU / 7; b.cone(0.2, 3.2, k % 2 ? 0x4fb833 : 0x3fa02a, { p: [cos(a) * 0.3, 1.5, sin(a) * 0.3], r: [sin(a) * 0.35, 0, cos(a) * 0.35] }, 5); }
    return b.geometry();
  }), vcol(0.7), {}, true));
  top.position.set(-0.1, 2.4, 0);
  root.add(top);
  const clk = new Clock();
  return makeModel('giant_carrot', root, (dt) => { clk.tick(dt, 'idle'); top.rotation.x = sin(clk.t * 1.1) * 0.06; top.rotation.z = cos(clk.t * 0.9) * 0.05; });
}

function carrotPatch() {
  const root = new THREE.Group();
  root.add(mesh(cached('rb:carrotpatch', () => {
    const b = new Build();
    for (let r = 0; r < 4; r++) {
      b.box(10, 0.3, 1.0, 0x7a5a3a, { p: [0, 0.12, -2.25 + r * 1.5] }, 0.15);
      for (let c = 0; c < 9; c++) carrotTop(b, -4.4 + c * 1.1 + (r % 2) * 0.3, -2.25 + r * 1.5, 1 + ((r * 9 + c) % 3) * 0.15);
    }
    return b.geometry();
  }), vcol(0.75), {}, true));
  return makeModel('carrot_patch', root, () => {});
}

function burrowTunnel(opts = {}) {
  const L = opts.length ?? 30, W = (opts.width ?? 28) / 2, H = 8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rb:tunnel:${L}:${W}`, () => {
    const b = new Build();
    const earth = (x, y, z) => (sin(x * 1.3 + z * 0.7) * cos(y * 1.1) > 0.5 ? 0x8a6040 : 0x9a7048);
    // Hügel über der Röhre: äußere Halbröhre (oben Gras), innere Halbröhre (Erde), Stirnseiten als Halbringe
    const RO = W + 7, HO = H + 5, RI = W + 0.6;
    b.add(new THREE.CylinderGeometry(RO, RO, L + 12, 28, 1, true, 0, Math.PI), { v: (x) => (x > RO * 0.55 ? 0x6ac84a : 0x9a7048) }, { r: [0, 0, Math.PI / 2], s: [HO / RO, 1, 1] });
    b.add(new THREE.CylinderGeometry(RI, RI, L + 12, 24, 1, true, 0, Math.PI), earth, { r: [0, 0, Math.PI / 2], s: [H / RI, 1, 1] });
    for (const xe of [-(L / 2 + 6), L / 2 + 6]) {
      const sh = new THREE.Shape();
      sh.absellipse(0, 0, RO, HO, 0, Math.PI, false);
      sh.lineTo(-RI, 0);
      sh.absellipse(0, 0, RI, H, Math.PI, 0, true);
      sh.lineTo(RO, 0);
      b.add(new THREE.ShapeGeometry(sh, 16), 0x8a6040, { p: [xe, 0, 0], r: [0, Math.PI / 2, 0] });
    }
    // Grasbüschel und Steine auf dem Hügel
    for (let k = 0; k < 12; k++) { const x = -L / 2 + (k * 37) % L, a = 0.6 + (k % 5) * 0.4; b.sphere(0.9, k % 3 ? 0x5ab83a : 0x8a8278, { p: [x, sin(a) * HO, cos(a) * RO * (k % 2 ? 1 : -1)], s: [1, 0.6, 1] }, 8, 5); }
    // Eingangsbögen aus Wurzeln und Steinen
    for (const xe of [-(L / 2 + 6), L / 2 + 6]) {
      b.torus(W + 0.8, 0.7, 0x6a4a2a, { p: [xe, 0, 0], r: [0, Math.PI / 2, 0], s: [1, H / (W + 0.8), 1] }, 6, 24, Math.PI);
      for (let k = 0; k < 7; k++) { const a = 0.2 + k * 0.45; b.sphere(0.9, 0x8a8278, { p: [xe, sin(a) * H * 0.98, cos(a) * (W + 1)], s: [1, 0.8, 1] }, 8, 6); }
    }
    // Wurzeln an der Decke
    for (let k = 0; k < 10; k++) b.tube([[-L / 2 + k * (L / 9), H * 0.97, -3 + (k % 3) * 3], [-L / 2 + k * (L / 9) + 0.5, H * 0.8, -2.5 + (k % 3) * 3], [-L / 2 + k * (L / 9) + 0.2, H * 0.6, -3 + (k % 3) * 3]], 0.12, 0x6a4a2a, null, 6, 5);
    // Möhren als Wegweiser auf dem Hügel
    for (let k = 0; k < 6; k++) carrotTop(b, -L / 2 + k * (L / 5), (k % 2 ? 1 : -1) * 3, 3, HO - 0.6);
    return b.geometry();
  }), vcol(0.9, { side: THREE.DoubleSide }, 'tunnel'), {}, true));
  // Laternen (Glühwürmchen-Gläser) innen
  const lights = [];
  for (let k = 0; k < 4; k++) {
    for (const s of [1, -1]) {
      const g = glowSprite(0xffe08a, 2.2, 0.7);
      g.position.set(-L / 2 + 3 + k * ((L - 6) / 3), H * 0.62, s * (W - 1.8));
      root.add(g); lights.push(g);
    }
  }
  const clk = new Clock();
  return makeModel('burrow_tunnel', root, (dt) => { clk.tick(dt, 'idle'); lights.forEach((g, k) => { g.material.opacity = 0.55 + 0.2 * sin(clk.t * 3 + k); }); });
}

function burrowHole(opts = {}) {
  const root = new THREE.Group();
  root.add(mesh(cached('rb:hole', () => new Build()
    .sphere(1.0, 0x8a6040, { p: [0, 0, 0], s: [1.2, 0.4, 1.2] }, 14, 8)
    .cyl(0.55, 0.55, 0.05, 0x2a1a10, { p: [0, 0.38, 0] }, 16)
    .geometry()), vcol(0.9), {}, true));
  const r = rabbit({ color: opts.color ?? 'brown' });
  r.root.scale.setScalar(1.4);
  root.add(r.root);
  const clk = new Clock();
  return makeModel('burrow_hole', root, (dt) => {
    clk.tick(dt, 'idle');
    const up = Math.max(0, sin(clk.t * 0.7));
    r.root.position.y = -0.7 + up * 0.75;
    r.update(dt, 'idle');
  }, [r]);
}

function hutch() {
  const root = new THREE.Group();
  root.add(mesh(cached('rb:hutch', () => {
    const b = new Build();
    for (const [x, z] of [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]]) b.box(0.15, 1.0, 0.15, 0x8a5a32, { p: [x, 0.5, z] }, 0.03);
    b.box(3.2, 0.15, 1.9, 0xa87848, { p: [0, 1.0, 0] }, 0.03);
    b.box(3.2, 1.4, 0.1, 0xc89a5a, { p: [0, 1.75, -0.9] }, 0.03);
    for (const x of [-1.55, 1.55]) b.box(0.1, 1.4, 1.9, 0xc89a5a, { p: [x, 1.75, 0] }, 0.03);
    b.box(1.4, 1.4, 1.8, 0xc89a5a, { p: [-0.85, 1.75, 0] }, 0.03);
    for (let k = 0; k < 9; k++) b.cyl(0.015, 0.015, 1.4, 0xd8d8e0, { p: [0.1 + k * 0.16, 1.75, 0.92] }, 3);
    for (const s of [1, -1]) b.box(3.6, 0.1, 1.3, 0xc8392d, { p: [0, 2.75, s * 0.5], r: [s * 0.5, 0, 0] }, 0.03);
    b.sphere(1, 0xe8c84a, { p: [0.8, 1.15, 0], s: [0.5, 0.15, 0.6] }, 10, 6);   // Heu
    return b.geometry();
  }), vcol(0.8), {}, true));
  const r = rabbit({ color: 'grey' }); r.root.position.set(0.7, 1.07, 0.1); r.root.scale.setScalar(1.1); root.add(r.root);
  return makeModel('hutch', root, (dt) => r.update(dt, 'idle'), [r]);
}

function windmill() {
  const root = new THREE.Group();
  root.add(mesh(cached('rb:windmill', () => {
    const b = new Build();
    b.cyl(2.2, 3.2, 10, (x, y) => (y > 3 ? 0xfaf4e8 : 0xe8dcc8), { p: [0, 5, 0] }, 16);
    b.cone(2.8, 3.2, 0xc8392d, { p: [0, 11.6, 0] }, 16);
    b.box(0.2, 2.2, 1.4, 0x6a4428, { p: [3.1, 1.1, 0] }, 0.05);
    for (const y of [4.5, 7.5]) b.box(0.15, 1.2, 0.9, 0x5ab8ff, { p: [2.7 - (y - 4.5) * 0.15, y, 0] }, 0.03);
    return b.geometry();
  }), vcol(0.6), {}, true));
  const rotor = joint([2.8, 9.5, 0], mesh(cached('rb:rotor', () => {
    const b = new Build().cyl(0.4, 0.4, 0.6, 0x6a4428, { r: [0, 0, Math.PI / 2] }, 10);
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4; b.box(0.1, 6, 1.2, 0xfaf4e8, { p: [0.35, cos(a) * 3.2, sin(a) * 3.2], r: [a, 0, 0] }, 0.03); }
    return b.geometry();
  }), vcol(0.6)));
  root.add(rotor);
  const clk = new Clock();
  return makeModel('windmill', root, (dt) => { clk.tick(dt, 'idle'); rotor.rotation.x = clk.t * 0.8; });
}

function cabbage() {
  const root = new THREE.Group();
  root.add(mesh(cached('rb:cabbage', () => {
    const b = new Build().sphere(0.45, 0x9ad86a, { p: [0, 0.4, 0] }, 12, 8);
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6; b.sphere(1, 0x7ac84a, { p: [cos(a) * 0.4, 0.35, sin(a) * 0.4], r: [0, -a, 0.9], s: [0.35, 0.05, 0.3] }, 8, 4); }
    return b.geometry();
  }), vcol(0.7, { side: THREE.DoubleSide }, 'cab'), {}, true));
  return makeModel('cabbage', root, () => {});
}

export const MODELS = { rabbit, easter_egg: easterEgg, egg_deco: eggDeco, giant_carrot: giantCarrot, carrot_patch: carrotPatch, burrow_tunnel: burrowTunnel, burrow_hole: burrowHole, hutch, windmill, cabbage };

// Halloween-Modelle für die Strecke „Spukinsel“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt, kindgerecht-gruselig).
// Maßstab Meter, Ursprung = Fußpunkt, Blick nach +X.
//
// jack_o_lantern  Kürbislaterne mit leuchtendem Gesicht.  opts { size (1), face (0..2) }
// pumpkin_ball    rollender Kürbis (Gefahr): Ursprung = Mitte, Radius 1, Gesicht leuchtet.
// haunted_mansion Spukhaus zum Durchfahren: Halle mit Kronleuchtern, Bildern, Kerzen; Türme, leuchtende Fenster.
//                 opts { length (50), width (28, innen) }  Achse +X, Ursprung = Boden Mitte.
// tombstone       Grabstein.  opts { kind (0..2) }
// dead_tree       kahler, verdrehter Baum mit Ästen.
// iron_fence      schmiedeeiserner Zaun (6 m entlang +X).
// lantern_post    Laterne mit flackerndem Licht.
// cauldron        Hexenkessel mit blubberndem grünem Trank.
// ghost           Gespenst (Laken mit Gesicht), schwebt und wabert.  state 'swim'|'walk'|'squashed'
// bat             Fledermaus, schlägt mit den Flügeln.  state 'fly'
// witch           Hexe auf dem Besen.  state 'fly'
// spider_web      Spinnennetz zwischen zwei Pfosten mit Spinne.
// scarecrow       Vogelscheuche mit Kürbiskopf.
// moon            großer Vollmond mit Schein (weit weg aufstellen).  opts { r (30) }

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, eyes, makeModel, Clock, TAU, glowSprite } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const ORANGE = 0xff8a1a, ORANGE2 = 0xe86a10, STEM = 0x4a6a2a, GLOW = 0xffd23a, STONE = 0x8a8696, STONE2 = 0x6a6676;

/** Kürbis (Rippen) – Färbung nach Rippe, Mitte bei y = r. */
function pumpkinBody(b, r, p = [0, r, 0]) {
  b.sphere(1, { v: (x, y, z) => { const a = Math.atan2(z, x); return Math.cos(a * 8) > 0.2 ? ORANGE : ORANGE2; } }, { p, s: [r * 1.15, r * 0.9, r * 1.15] }, 24, 14);
  b.cyl(r * 0.12, r * 0.16, r * 0.45, STEM, { p: [p[0], p[1] + r * 0.95, p[2]], r: [0.2, 0, 0.15] }, 7);
}
/** Leuchtendes Gesicht (Augen, Nase, Zickzack-Mund) vorn bei +X. */
function pumpkinFace(b, r, cy, kind = 0) {
  // Punkt knapp vor der Kürbis-Oberfläche (Ellipsoid 1,15 r × 0,9 r)
  const surf = (y, z) => r * 1.15 * Math.sqrt(Math.max(0.05, 1 - (z / (r * 1.15)) ** 2 - (y / (r * 0.9)) ** 2)) + r * 0.03;
  const tri = (y, z, s, up = true) => {
    const sh = new THREE.Shape();
    if (up) { sh.moveTo(-s, -s * 0.7); sh.lineTo(s, -s * 0.7); sh.lineTo(0, s * 0.8); }
    else { sh.moveTo(-s, s * 0.7); sh.lineTo(s, s * 0.7); sh.lineTo(0, -s * 0.8); }
    sh.closePath();
    b.extrude(sh, 0.02, GLOW, { p: [surf(y, z), cy + y, z], r: [0, Math.PI / 2 - Math.asin(Math.max(-0.9, Math.min(0.9, z / (r * 1.15)))), 0] }, 0, 1);
  };
  const eyeUp = kind !== 1;
  tri(r * 0.25, r * 0.38, r * 0.17, eyeUp); tri(r * 0.25, -r * 0.38, r * 0.17, eyeUp);
  tri(r * 0.02, 0, r * 0.1, true);
  // Mund: Reihe Zacken
  for (let k = -3; k <= 3; k++) {
    const z = k * r * 0.13, y = -r * 0.3 + (kind === 2 ? 0.05 * r * k * k : 0);
    tri(y, z, r * 0.1, k % 2 === 0);
  }
}

function jackOLantern(opts = {}) {
  const r = 0.6 * (opts.size ?? 1), kind = opts.face ?? 0;
  const root = new THREE.Group();
  root.add(mesh(cached(`hw:pump:${r}`, () => { const b = new Build(); pumpkinBody(b, r); return b.geometry(); }), vcol(0.55), {}, true));
  root.add(mesh(cached(`hw:pumpface:${r}:${kind}`, () => { const b = new Build(); pumpkinFace(b, r, r, kind); return b.geometry(); }), basic('hw:glow', { vertexColors: true })));
  const glow = glowSprite(0xffa030, r * 4, 0.55); glow.position.set(r * 0.4, r, 0); root.add(glow);
  const clk = new Clock();
  return makeModel('jack_o_lantern', root, (dt) => { clk.tick(dt, 'idle'); glow.material.opacity = 0.42 + 0.15 * sin(clk.t * 9) * sin(clk.t * 3.7); });
}

function pumpkinBall() {
  const root = new THREE.Group();
  const spin = joint();
  spin.add(mesh(cached('hw:pumpball', () => { const b = new Build(); pumpkinBody(b, 0.88, [0, 0, 0]); return b.geometry(); }), vcol(0.5), {}, true));
  spin.add(mesh(cached('hw:pumpballface', () => { const b = new Build(); pumpkinFace(b, 0.88, 0, 2); return b.geometry(); }), basic('hw:glow', { vertexColors: true })));
  root.add(spin);
  const glow = glowSprite(0xffa030, 3.2, 0.4); root.add(glow);
  return makeModel('pumpkin_ball', root, () => {});
}

// =============================================================================================
// Spukhaus (zum Durchfahren)
// =============================================================================================
function hauntedMansion(opts = {}) {
  const L = opts.length ?? 50, W = (opts.width ?? 28) / 2, H = 9, T = 1;
  const key = `hw:mansion:${L}:${W}`;
  const WOOD = 0x5a4a6a, WOOD2 = 0x4a3a58, ROOF = 0x2a2238, TRIM = 0x8a7aa0;
  const root = new THREE.Group();
  root.add(mesh(cached(key, () => {
    const b = new Build();
    // Wände mit Brettern (Streifen), Innenseite dunkelrot tapeziert
    for (const s of [1, -1]) {
      b.box(L, H, T, (x, y) => (Math.floor((y + 10) * 1.2) % 2 ? WOOD : WOOD2), { p: [0, H / 2, s * (W + T / 2)] }, 0.05);
      b.box(L - 0.4, H - 0.5, 0.1, (x, y) => (Math.floor((x + 50) / 1.5) % 2 ? 0x5a1a2a : 0x6a2232), { p: [0, H / 2, s * (W - 0.05)] }, 0);
      b.box(L, 0.4, T + 0.3, TRIM, { p: [0, H, s * (W + T / 2)] }, 0.05);
      // Bilderrahmen innen
      for (let x = -L / 2 + 6; x < L / 2 - 4; x += 8) {
        b.box(2.4, 3, 0.15, 0xc8a030, { p: [x, 4.5, s * (W - 0.15)] }, 0.05);
        b.box(2.0, 2.6, 0.18, 0x2a2a3a, { p: [x, 4.5, s * (W - 0.17)] }, 0);
      }
    }
    // Decke, Dach (Satteldach) mit Giebeln, zwei Türme
    b.box(L, 0.6, W * 2 + T * 2, WOOD2, { p: [0, H + 0.3, 0] }, 0.05);
    for (const s of [1, -1]) b.box(L + 1.5, 0.4, W + 3, ROOF, { p: [0, H + 4.2, s * (W + 1.5) / 2], r: [s * 0.62, 0, 0] }, 0.05);
    for (const xe of [-L / 2, L / 2]) {
      // Giebelwand mit großem Torbogen (offen)
      b.box(1.2, H + 0.6, W - 7, WOOD, { p: [xe, (H + 0.6) / 2, W - (W - 7) / 2 + 0.5] }, 0.05);
      b.box(1.2, H + 0.6, W - 7, WOOD, { p: [xe, (H + 0.6) / 2, -W + (W - 7) / 2 - 0.5] }, 0.05);
      b.torus(W - 3, 0.6, TRIM, { p: [xe, H - 4.5, 0], r: [0, Math.PI / 2, 0], s: [1, 0.55, 1] }, 6, 20, Math.PI);
      b.cone(W + 2, 5, ROOF, { p: [xe, H + 3.3, 0], r: [0, 0, 0], s: [0.06, 1, 1] }, 3);
    }
    for (const [x, z] of [[-L / 2 + 3, W + 3], [L / 2 - 3, -W - 3]]) {
      b.cyl(3, 3.2, H + 8, WOOD, { p: [x, (H + 8) / 2, z] }, 12);
      b.cone(3.8, 6, ROOF, { p: [x, H + 11, z] }, 12);
      b.cyl(0.12, 0.12, 2, 0x2a2a30, { p: [x, H + 15, z] }, 5);
    }
    // Kronleuchter-Ketten
    for (let x = -L / 2 + 10; x < L / 2 - 5; x += 14) {
      b.cyl(0.05, 0.05, 2.2, 0x2a2a30, { p: [x, H - 1.1, 0] }, 4);
      b.torus(1.4, 0.12, 0xc8a030, { p: [x, H - 2.3, 0], r: [Math.PI / 2, 0, 0] }, 5, 18);
    }
    return b.geometry();
  }), vcol(0.75), {}, true));
  // leuchtende Fenster außen, Kerzen und Kronleuchter-Lichter innen
  root.add(mesh(cached(`${key}:glow`, () => {
    const b = new Build();
    for (const s of [1, -1]) {
      for (let x = -L / 2 + 4; x < L / 2 - 2; x += 6) {
        b.box(1.6, 2.2, 0.08, (Math.round(x) % 3) ? 0xffd860 : 0x8aff8a, { p: [x, 6, s * (W + T + 0.05)] }, 0);
        b.cyl(0.08, 0.08, 0.35, 0xfff0c0, { p: [x + 3, 2.4, s * (W - 0.4)] }, 5);
      }
    }
    for (const [x, z] of [[-L / 2 + 3, W + 3], [L / 2 - 3, -W - 3]]) b.box(1.2, 1.6, 6.5, 0xffd860, { p: [x, H + 4, z] }, 0);
    for (let x = -L / 2 + 10; x < L / 2 - 5; x += 14) for (let k = 0; k < 8; k++) { const a = k * TAU / 8; b.sphere(0.16, 0xfff0a0, { p: [x + cos(a) * 1.4, H - 2.0, sin(a) * 1.4] }, 6, 4); }
    return b.geometry();
  }), basic('hw:mansionglow', { vertexColors: true })));
  const glows = [];
  for (let x = -L / 2 + 10; x < L / 2 - 5; x += 14) { const g = glowSprite(0xffd880, 6, 0.4); g.position.set(x, H - 2.3, 0); root.add(g); glows.push(g); }
  const clk = new Clock();
  return makeModel('haunted_mansion', root, (dt) => { clk.tick(dt, 'idle'); glows.forEach((g, k) => { g.material.opacity = 0.32 + 0.1 * sin(clk.t * 7 + k * 2); }); });
}

function tombstone(opts = {}) {
  const k = opts.kind ?? 0;
  const root = new THREE.Group();
  root.add(mesh(cached(`hw:tomb:${k}`, () => {
    const b = new Build();
    const st = (x, y, z) => (sin(x * 7 + y * 5) > 0.7 ? 0x6a8a5a : STONE);   // etwas Moos
    if (k === 0) { b.box(0.3, 1.1, 0.8, st, { p: [0, 0.55, 0] }, 0.06); b.cyl(0.4, 0.4, 0.3, st, { p: [0, 1.1, 0], r: [Math.PI / 2, 0, Math.PI / 2] }, 14); }
    else if (k === 1) { b.box(0.25, 1.6, 0.25, STONE2, { p: [0, 0.8, 0] }, 0.04); b.box(0.25, 0.25, 0.9, STONE2, { p: [0, 1.15, 0] }, 0.04); }
    else { b.box(0.35, 0.8, 1.1, st, { p: [0, 0.4, 0], r: [0, 0, 0.12] }, 0.08); }
    b.box(1.4, 0.15, 1.4, 0x4a3a30, { p: [0.6, 0.06, 0] }, 0.05);   // Erdhügel
    b.box(0.04, 0.12, 0.5, 0x2a2a34, { p: [0.17, k === 2 ? 0.55 : 0.75, 0] }, 0);   // Inschrift
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('tombstone', root, () => {});
}

function deadTree() {
  const root = new THREE.Group();
  root.add(mesh(cached('hw:deadtree', () => {
    const b = new Build();
    const C = 0x3a2a2a;
    b.tube([[0, 0, 0], [0.3, 2, 0.1], [-0.2, 4, 0], [0.2, 6, -0.2]], 0.35, C, null, 10, 7);
    const branch = (p, d, len, r, depth) => {
      const e = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len];
      b.tube([p, [(p[0] + e[0]) / 2 + d[2] * 0.3, (p[1] + e[1]) / 2 + 0.2, (p[2] + e[2]) / 2], e], r, C, null, 6, 5);
      if (depth > 0) for (const s of [-1, 1]) branch(e, [d[0] * 0.7 + s * d[2] * 0.6, 0.45, d[2] * 0.7 - s * d[0] * 0.6], len * 0.6, r * 0.6, depth - 1);
    };
    for (let k = 0; k < 4; k++) { const a = k * 1.7; branch([0.1, 3.4 + k * 0.7, 0], [cos(a), 0.35, sin(a)], 2.2, 0.16, 2); }
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('dead_tree', root, () => {});
}

function ironFence() {
  const root = new THREE.Group();
  root.add(mesh(cached('hw:fence', () => {
    const b = new Build();
    for (let k = 0; k <= 12; k++) { b.cyl(0.04, 0.04, 1.6, 0x1a1a22, { p: [k * 0.5, 0.8, 0] }, 4); b.cone(0.08, 0.2, 0x1a1a22, { p: [k * 0.5, 1.7, 0] }, 4); }
    for (const y of [0.4, 1.3]) b.box(6, 0.06, 0.06, 0x1a1a22, { p: [3, y, 0] }, 0);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('iron_fence', root, () => {});
}

function lanternPost() {
  const root = new THREE.Group();
  root.add(mesh(cached('hw:lantern', () => new Build()
    .cyl(0.08, 0.12, 3.2, 0x1a1a22, { p: [0, 1.6, 0] }, 6)
    .box(0.6, 0.08, 0.08, 0x1a1a22, { p: [0.28, 3.1, 0] }, 0)
    .cone(0.3, 0.3, 0x1a1a22, { p: [0.55, 2.95, 0] }, 6)
    .geometry()), vcol(0.5), {}, true));
  root.add(mesh(cached('hw:lanternlight', () => new Build().box(0.32, 0.4, 0.32, 0xffc860, { p: [0.55, 2.6, 0] }, 0.03).geometry()), basic('hw:glow', { vertexColors: true })));
  const g = glowSprite(0xffb050, 3.5, 0.55); g.position.set(0.55, 2.6, 0); root.add(g);
  const clk = new Clock();
  return makeModel('lantern_post', root, (dt) => { clk.tick(dt, 'idle'); g.material.opacity = 0.45 + 0.12 * sin(clk.t * 11) * sin(clk.t * 4.1); });
}

function cauldron() {
  const root = new THREE.Group();
  root.add(mesh(cached('hw:cauldron', () => {
    const b = new Build();
    b.lathe([[0.1, 0], [0.9, 0.2], [1.15, 0.8], [1.05, 1.4], [0.95, 1.5]], 0x2a2a30, { p: [0, 0.4, 0] }, 20);
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; b.cyl(0.08, 0.08, 0.6, 0x2a2a30, { p: [cos(a) * 0.7, 0.25, sin(a) * 0.7], r: [sin(a) * 0.3, 0, -cos(a) * 0.3] }, 5); }
    for (let k = 0; k < 7; k++) { const a = k * 0.9; b.box(0.25, 0.25, 0.8, 0x5a3a22, { p: [cos(a) * 0.5, 0.12, sin(a) * 0.5], r: [0, a, 0] }, 0.05); }
    return b.geometry();
  }), vcol(0.4), {}, true));
  const brew = mesh(cached('hw:brew', () => new Build().cyl(0.95, 0.95, 0.06, 0x6aff3a, {}, 20).geometry()), basic('hw:brew', { vertexColors: true }), { p: [0, 1.82, 0] });
  root.add(brew);
  const bub = [];
  for (let k = 0; k < 5; k++) { const m = mesh(cached('hw:bubble', () => new Build().sphere(0.14, 0x9aff6a, {}, 8, 6).geometry()), basic('hw:brew', { vertexColors: true })); root.add(m); bub.push(m); }
  const g = glowSprite(0x6aff3a, 4, 0.5); g.position.y = 2.1; root.add(g);
  const clk = new Clock();
  return makeModel('cauldron', root, (dt) => {
    clk.tick(dt, 'idle');
    bub.forEach((m, k) => { const f = (clk.t * 0.7 + k / 5) % 1; m.position.set(cos(k * 2.3) * 0.5, 1.85 + f * 1.2, sin(k * 2.3) * 0.5); m.scale.setScalar(1 - f); });
  });
}

// =============================================================================================
// Spukgestalten
// =============================================================================================
function ghost() {
  const root = new THREE.Group();
  const body = joint([0, 1.4, 0]);
  const sheet = mesh(cached('hw:ghost', () => {
    const b = new Build();
    b.lathe([[0.001, 1.25], [0.45, 1.15], [0.7, 0.8], [0.78, 0.2], [0.82, -0.5], [0.9, -0.75]], 0xf4f4ff, {}, 22, 2);
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; b.sphere(0.2, 0xf4f4ff, { p: [cos(a) * 0.82, -0.78, sin(a) * 0.82] }, 8, 6); }
    for (const s of [1, -1]) b.capsule(0.13, 0.4, 0xf4f4ff, { p: [0.1, 0.25, s * 0.78], r: [s * 0.9, 0, 0] }, 3, 8);
    return b.geometry();
  }), std('hw:ghostmat', { vertexColors: true, transparent: true, opacity: 0.82, emissive: 0x6a6aa8, emissiveIntensity: 0.5, roughness: 0.6, side: THREE.DoubleSide }));
  body.add(sheet);
  body.add(eyes([{ p: [0.62, 0.65, 0.22], r: 0.15, sy: 1.4 }, { p: [0.62, 0.65, -0.22], r: 0.15, sy: 1.4 }], { key: 'ghost', white: 0x1a1a2a, iris: 0x1a1a2a, pupil: 0.4, pupilColor: 0x1a1a2a }));
  body.add(mesh(cached('hw:ghostmouth', () => new Build().sphere(0.12, 0x1a1a2a, { s: [0.5, 1.2, 1.4] }, 10, 8).geometry()), vcol(0.5), { p: [0.72, 0.28, 0] }));
  const glow = glowSprite(0xc8d0ff, 3, 0.3); body.add(glow);
  root.add(body);
  const clk = new Clock();
  return makeModel('ghost', root, (dt, st) => {
    const anim = st.anim ?? 'swim';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    body.scale.setScalar(1);
    body.position.y = 1.4 + sin(clk.t * 2.1) * 0.3;
    sheet.rotation.y = sin(clk.t * 1.3) * 0.15;
    body.rotation.z = sin(clk.t * 1.7) * 0.08;
  });
}

function bat() {
  const root = new THREE.Group();
  const body = joint([0, 1.2, 0]);
  body.add(mesh(cached('hw:bat', () => new Build()
    .sphere(1, 0x2a2238, { s: [0.32, 0.28, 0.26] }, 12, 8)
    .sphere(0.2, 0x2a2238, { p: [0.28, 0.12, 0] }, 10, 8)
    .cone(0.07, 0.18, 0x2a2238, { p: [0.3, 0.32, 0.09] }, 5)
    .cone(0.07, 0.18, 0x2a2238, { p: [0.3, 0.32, -0.09] }, 5)
    .geometry()), vcol(0.5), {}, true));
  body.add(eyes([{ p: [0.44, 0.17, 0.08], r: 0.06 }, { p: [0.44, 0.17, -0.08], r: 0.06 }], { key: 'bat', white: 0xffe04a, iris: 0xff4a1a, pupil: 0.5 }));
  const wingG = cached('hw:batwing', () => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.3, 0.9); sh.quadraticCurveTo(0.05, 0.75, -0.05, 1.05); sh.quadraticCurveTo(-0.2, 0.7, -0.35, 0.9); sh.quadraticCurveTo(-0.3, 0.4, -0.2, 0); sh.closePath();
    return new Build().extrude(sh, 0.03, 0x3a2a48, { r: [Math.PI / 2, 0, 0] }, 0, 6).geometry();
  });
  const wings = [1, -1].map((s) => { const j = joint([0, 0.05, s * 0.15], mesh(wingG, vcol(0.6, { side: THREE.DoubleSide }, 'batw'), { r: [0, 0, 0], s: [1, 1, s] })); body.add(j); return [j, s]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('bat', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'fly');
    if (st.anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    body.scale.setScalar(1);
    for (const [j, s] of wings) j.rotation.x = s * sin(clk.t * 14) * 0.8;
    body.position.y = 1.2 + sin(clk.t * 3) * 0.2;
  });
}

function witch() {
  const root = new THREE.Group();
  const body = joint([0, 1.4, 0]);
  body.add(mesh(cached('hw:witch', () => {
    const b = new Build();
    // Besen
    b.cyl(0.05, 0.05, 2.4, 0x8a5a32, { p: [0, 0, 0], r: [0, 0, Math.PI / 2] }, 6);
    b.cone(0.3, 0.7, 0xd8a84a, { p: [-1.45, 0, 0], r: [0, 0, Math.PI / 2] }, 10);
    // Kleid, Umhang, Kopf, Hut
    b.cone(0.45, 1.0, 0x5a2a8a, { p: [0.1, 0.45, 0], r: [0, 0, 0.3] }, 12);
    b.sphere(0.24, 0x9ad86a, { p: [0.3, 1.05, 0] }, 12, 10);
    b.sphere(0.06, 0x7ab84a, { p: [0.53, 1.02, 0] }, 6, 4);
    b.cyl(0.45, 0.45, 0.05, 0x1a1a2a, { p: [0.28, 1.25, 0] }, 16);
    b.cone(0.25, 0.75, 0x1a1a2a, { p: [0.22, 1.62, 0], r: [0, 0, 0.25] }, 12);
    b.cyl(0.26, 0.26, 0.08, 0x8a3aff, { p: [0.28, 1.31, 0] }, 14);
    for (const s of [1, -1]) b.capsule(0.06, 0.35, 0x5a2a8a, { p: [0.45, 0.6, s * 0.15], r: [0, 0, 1.2] }, 2, 6);
    b.sphere(0.25, 0xff8a2a, { p: [0.15, 1.1, 0], s: [0.6, 1.2, 1.3] }, 10, 6);   // rote Haare
    return b.geometry();
  }), vcol(0.5), {}, true));
  body.add(eyes([{ p: [0.5, 1.1, 0.09], r: 0.06 }, { p: [0.5, 1.1, -0.09], r: 0.06 }], { key: 'witch', iris: 0x3a8a3a, pupil: 0.55 }));
  const spark = glowSprite(0xb06aff, 1.4, 0.6); spark.position.set(-1.8, 0, 0); body.add(spark);
  root.add(body);
  const clk = new Clock();
  return makeModel('witch', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'fly');
    if (st.anim === 'squashed') { body.scale.set(1.2, 0.4, 1.2); return; }
    body.scale.setScalar(1);
    body.position.y = 1.4 + sin(clk.t * 2.2) * 0.25;
    body.rotation.z = sin(clk.t * 1.5) * 0.08;
    spark.material.opacity = 0.4 + 0.3 * sin(clk.t * 12);
  });
}

function spiderWeb() {
  const root = new THREE.Group();
  root.add(mesh(cached('hw:web', () => {
    const b = new Build();
    for (const z of [-2, 2]) b.cyl(0.08, 0.1, 3.2, 0x3a2a2a, { p: [0, 1.6, z] }, 5);
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; b.cyl(0.012, 0.012, 2, 0xe8e8f0, { p: [0, 1.9 + sin(a) * 1, cos(a) * 1], r: [-a, 0, 0] }, 3); }
    for (let r = 1; r <= 4; r++) b.torus(r * 0.45, 0.012, 0xe8e8f0, { p: [0, 1.9, 0], r: [0, Math.PI / 2, 0] }, 3, 8);
    return b.geometry();
  }), vcol(0.5, { side: THREE.DoubleSide }, 'web')));
  const spider = joint([0.05, 2.3, 0.3], mesh(cached('hw:spider', () => {
    const b = new Build().sphere(0.2, 0x1a1a22, {}, 10, 8).sphere(0.12, 0x1a1a22, { p: [0, 0.18, 0] }, 8, 6);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; b.cyl(0.015, 0.015, 0.45, 0x1a1a22, { p: [0, cos(a) * 0.25, sin(a) * 0.25], r: [a, 0, 0] }, 3); }
    return b.geometry();
  }), vcol(0.4)));
  root.add(spider);
  const clk = new Clock();
  return makeModel('spider_web', root, (dt) => { clk.tick(dt, 'idle'); spider.position.y = 2.3 - (0.5 + 0.5 * sin(clk.t * 0.6)) * 1.0; });
}

function scarecrow() {
  const root = new THREE.Group();
  const swing = joint();
  swing.add(mesh(cached('hw:scarecrow', () => {
    const b = new Build();
    b.cyl(0.07, 0.07, 3, 0x8a5a32, { p: [0, 1.5, 0] }, 6);
    b.cyl(0.05, 0.05, 2.2, 0x8a5a32, { p: [0, 2.2, 0], r: [Math.PI / 2, 0, 0] }, 6);
    b.box(0.5, 0.9, 1.2, 0x6a4a8a, { p: [0, 2.0, 0] }, 0.1);
    for (const s of [1, -1]) b.cone(0.12, 0.35, 0xd8b04a, { p: [0, 2.15, s * 1.15], r: [s * Math.PI / 2, 0, 0] }, 6);
    pumpkinBody(b, 0.35, [0, 2.85, 0]);
    b.cone(0.5, 0.5, 0x5a3a22, { p: [0, 3.35, 0] }, 10);
    return b.geometry();
  }), vcol(0.7), {}, true));
  swing.add(mesh(cached('hw:scareface', () => { const b = new Build(); pumpkinFace(b, 0.35, 2.85, 1); return b.geometry(); }), basic('hw:glow', { vertexColors: true })));
  root.add(swing);
  const clk = new Clock();
  return makeModel('scarecrow', root, (dt) => { clk.tick(dt, 'idle'); swing.rotation.x = sin(clk.t * 0.9) * 0.03; });
}

function moon(opts = {}) {
  const R = opts.r ?? 30;
  const root = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false }));
  // Krater als dunklere Flecken
  const crater = new THREE.MeshBasicMaterial({ color: 0xe8dcb8, fog: false });
  for (const [x, y, r] of [[-0.3, 0.2, 0.18], [0.25, -0.1, 0.12], [0.05, 0.4, 0.08], [-0.1, -0.35, 0.14]]) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(R * r, 24), crater);
    c.position.set(x * R, y * R, 0.1); disc.add(c);
  }
  const halo = glowSprite(0xfff0c8, R * 6, 0.35); halo.material.fog = false;
  root.add(disc, halo);
  disc.userData.noShadow = true;
  return makeModel('moon', root, () => {}, [disc.geometry, disc.material, crater]);
}

export const MODELS = {
  jack_o_lantern: jackOLantern, pumpkin_ball: pumpkinBall, haunted_mansion: hauntedMansion, tombstone, dead_tree: deadTree,
  iron_fence: ironFence, lantern_post: lanternPost, cauldron, ghost, bat, witch, spider_web: spiderWeb, scarecrow, moon,
};

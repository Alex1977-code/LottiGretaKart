// Piraten-Modelle für die Strecke „Piratenbucht“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt (Schiff: Wasserlinie), Blick/Bug nach +X.
//
// pirate_ship     Galeone ≈ 22 m lang: Rumpf mit Kanonenluken, drei Masten mit Totenkopf-Segeln, Flagge, Krähennest.
//                 state { anim: 'idle'|'fire', side (±1, Breitseite), n }  idle: schaukelt; fire: Rückstoß + Mündungsblitz.
// pirate_cannon   Kanone auf Holzlafette ≈ 2,2 m, Rohr nach +X.  state { anim: 'idle'|'fire', n }
// cannonball      Kanonenkugel ⌀ 0,8 m mit glimmender Lunte.  state { fuse (0..1) }
// skull_rock      Totenkopf-Felsen ≈ 14 m hoch (Augenhöhlen, Zähne), Gesicht nach +X.
// barrel          Fass ≈ 1,2 m (Holz, Eisenringe).
// treasure_pile   Goldhaufen mit Münzen und Edelsteinen ≈ 2,5 m breit, funkelt.
// pirate_flag     Fahnenmast mit Totenkopf-Flagge ≈ 6 m, Flagge flattert.
// dock            Holzsteg ≈ 12 × 3 m auf Pfählen.  opts { length }
// lighthouse      Leuchtturm ≈ 16 m, rot-weiß, Licht dreht sich.

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, makeModel, Clock, TAU, glowSprite, sparkleSprite } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const WOOD = 0x7a4a26, WOOD2 = 0x5a3418, WOOD3 = 0x9a6a3a, GOLD = 0xffc21a, IRON = 0x3a3a44, SAIL = 0xf4ecd8;

const TEX = new Map();
/** Totenkopf (Schädel mit gekreuzten Knochen) auf Stoff – für Segel und Flaggen. */
function skullTexture(key, bg, fg) {
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 256);
  x.fillStyle = fg; x.strokeStyle = fg; x.lineCap = 'round';
  x.lineWidth = 22;
  x.beginPath(); x.moveTo(60, 170); x.lineTo(196, 230); x.moveTo(196, 170); x.lineTo(60, 230); x.stroke();
  for (const [a, b] of [[60, 170], [196, 230], [196, 170], [60, 230]]) { x.beginPath(); x.arc(a, b, 15, 0, TAU); x.fill(); }
  x.beginPath(); x.ellipse(128, 105, 62, 58, 0, 0, TAU); x.fill();
  x.fillRect(96, 140, 64, 34);
  x.fillStyle = bg;
  x.beginPath(); x.ellipse(103, 105, 17, 19, 0, 0, TAU); x.ellipse(153, 105, 17, 19, 0, 0, TAU); x.fill();
  x.beginPath(); x.moveTo(128, 122); x.lineTo(118, 140); x.lineTo(138, 140); x.fill();
  for (let i = 0; i < 4; i++) x.fillRect(104 + i * 14, 160, 5, 14);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  TEX.set(key, t);
  return t;
}

// =============================================================================================
// Piratenschiff
// =============================================================================================
function pirateShip() {
  const root = new THREE.Group();
  const rock = joint();
  root.add(rock);
  rock.add(mesh(cached('pir:ship', () => {
    const b = new Build();
    const L = 22, B = 6.4;
    // Rumpf: gestreckte, nach unten gewölbte Halbkugel (Färbung in Einheitskoordinaten: y 0 = Reling, 1 = Kiel)
    const hull = (x, y) => (y < 0.1 ? WOOD2 : y < 0.2 ? GOLD : y < 0.75 ? WOOD : 0x2a1a10);
    b.dome(1, hull, { p: [0, 2.6, 0], r: [Math.PI, 0, 0], s: [L / 2, 2.8, B / 2] }, Math.PI / 2, 40, 12);
    for (const s of [1, -1]) b.box(L * 0.78, 0.8, 0.25, WOOD2, { p: [-0.4, 3.1, s * B * 0.46] }, 0.08);   // Reling
    b.box(L * 0.82, 0.5, B * 0.92, WOOD3, { p: [-0.6, 2.7, 0] }, 0.1);                          // Deck
    // Achterkastell und Back
    b.box(6, 2.6, B * 0.9, WOOD, { p: [-7.6, 4.1, 0] }, 0.2);
    b.box(6.2, 0.4, B * 0.95, WOOD2, { p: [-7.6, 5.5, 0] }, 0.1);
    for (const z of [-1.6, 0, 1.6]) b.box(0.25, 1.0, 0.8, 0xffd27a, { p: [-10.65, 4.2, z] }, 0.05);  // Heckfenster
    b.box(4, 1.6, B * 0.8, WOOD, { p: [8.2, 3.5, 0] }, 0.2);
    // Bugspriet und Galionsfigur
    b.cyl(0.18, 0.28, 7, WOOD2, { p: [12.6, 4.8, 0], r: [0, 0, -1.2] }, 8);
    b.sphere(0.6, GOLD, { p: [11.2, 3.0, 0] }, 12, 8);
    // Kanonenluken mit Rohren auf beiden Seiten
    for (const s of [1, -1]) for (let k = 0; k < 5; k++) {
      const x = -5 + k * 2.6;
      b.box(0.9, 0.7, 0.15, 0x1a1008, { p: [x, 2.0, s * (B / 2 - 0.12)] }, 0.03);
      b.cyl(0.18, 0.2, 1.0, IRON, { p: [x, 2.0, s * (B / 2 + 0.3)], r: [Math.PI / 2, 0, 0] }, 8);
    }
    // Masten, Rahen, Krähennest
    for (const [x, h] of [[-4.5, 12], [1.5, 15], [7.2, 10]]) {
      b.cyl(0.22, 0.32, h, WOOD2, { p: [x, 2.8 + h / 2, 0] }, 10);
      for (const y of [h * 0.45, h * 0.8]) b.cyl(0.12, 0.12, B * 1.25, WOOD2, { p: [x, 2.8 + y, 0], r: [Math.PI / 2, 0, 0] }, 6);
    }
    b.cyl(0.9, 0.7, 0.8, WOOD, { p: [1.5, 2.8 + 15 * 0.86, 0] }, 12);
    return b.geometry();
  }), vcol(0.6), {}, true));
  // Segel (gebogene Flächen mit Totenkopf) und Flagge
  const sailMat = new THREE.MeshStandardMaterial({ map: skullTexture('sail', '#f4ecd8', '#2a2028'), side: THREE.DoubleSide, roughness: 0.9 });
  const sails = [];
  for (const [x, h, w] of [[-4.5, 12, 7], [1.5, 15, 8.5], [7.2, 10, 6]]) {
    for (const [y0, y1, sc] of [[h * 0.45, h * 0.8, 1], [h * 0.1 + 1.5, h * 0.45, 0.85]]) {
      const g = new THREE.PlaneGeometry(w * sc, (y1 - y0) * 0.95, 8, 4);
      const P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const u = P.getX(i) / (w * sc / 2); P.setZ(i, (1 - u * u) * 0.9); }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, sailMat);
      m.position.set(x + 0.4, 2.8 + (y0 + y1) / 2, 0);
      m.rotation.y = -Math.PI / 2;
      m.castShadow = true;
      rock.add(m); sails.push(m);
    }
  }
  const flagMat = new THREE.MeshBasicMaterial({ map: skullTexture('flag', '#15121a', '#ffffff'), side: THREE.DoubleSide });
  const flagG = new THREE.PlaneGeometry(3.2, 2.2, 8, 2);
  const flag = new THREE.Mesh(flagG, flagMat);
  flag.position.set(-0.1, 2.8 + 15 + 1.0, 0);
  const flagJ = joint([1.5, 0, 0], flag);
  flag.position.x = -1.6;
  rock.add(flagJ);
  // Mündungsblitze (Breitseite)
  const flashes = [];
  for (const s of [1, -1]) for (let k = 0; k < 5; k++) {
    const f = glowSprite(0xffa040, 2.2, 0.95);
    f.position.set(-5 + k * 2.6, 2.0, s * 4.4);
    f.visible = false;
    rock.add(f); flashes.push({ f, s, k });
  }
  const clk = new Clock();
  let lastN = -1, fireT = 9;
  const P0 = flagG.attributes.position.array.slice();
  const update = (dt, st) => {
    clk.tick(dt, st.anim ?? 'idle');
    const t = clk.t;
    if (st.anim === 'fire' && st.n !== lastN) { lastN = st.n; fireT = 0; }
    fireT += dt;
    const kick = fireT < 0.5 ? Math.sin(Math.min(1, fireT / 0.5) * Math.PI) : 0;
    rock.rotation.x = sin(t * 0.7) * 0.03 + kick * 0.05 * (st.side ?? 1);
    rock.rotation.z = sin(t * 0.5) * 0.02;
    rock.position.y = sin(t * 0.9) * 0.15;
    for (const { f, s, k } of flashes) {
      const on = fireT < 0.35 && s === (st.side ?? 1) && fireT > k * 0.05;
      f.visible = on; if (on) f.scale.setScalar(2.4 * (1 - fireT / 0.35) + 0.5);
    }
    // Flagge flattert
    const P = flagG.attributes.position;
    for (let i = 0; i < P.count; i++) { const x0 = P0[i * 3]; const u = (x0 + 1.6) / 3.2; P.setZ(i, sin(t * 7 - u * 4) * 0.25 * u); }
    P.needsUpdate = true;
    sails.forEach((m, i) => { m.scale.z = 1 + 0.12 * sin(t * 1.3 + i); });
  };
  return makeModel('pirate_ship', root, update, [flagG, ...sails.map((m) => m.geometry)]);
}

function pirateCannon() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:carriage', () => {
    const b = new Build();
    b.box(1.8, 0.5, 1.1, WOOD, { p: [-0.1, 0.55, 0] }, 0.08);
    for (const s of [1, -1]) for (const x of [-0.6, 0.5]) b.cyl(0.38, 0.38, 0.18, WOOD2, { p: [x, 0.38, s * 0.62], r: [Math.PI / 2, 0, 0] }, 14);
    return b.geometry();
  }), vcol(0.6), {}, true));
  const barrel = joint([0, 1.05, 0], mesh(cached('pir:barrel', () => new Build()
    .cyl(0.32, 0.42, 2.1, IRON, { p: [0.6, 0, 0], r: [0, 0, -Math.PI / 2] }, 16)
    .torus(0.34, 0.07, 0x5a5a66, { p: [1.62, 0, 0], r: [0, Math.PI / 2, 0] }, 8, 18)
    .sphere(0.36, IRON, { p: [-0.5, 0, 0] }, 12, 8)
    .geometry()), std('pir:iron', { color: 0x4a4a56, roughness: 0.35, metalness: 0.6 }), {}, true));
  barrel.rotation.z = 0.25;
  const flash = glowSprite(0xffa040, 1.8, 0.95);
  flash.position.set(1.9, 0.35, 0);
  flash.visible = false;
  barrel.add(flash);
  root.add(barrel);
  const clk = new Clock();
  let lastN = -1, ft = 9;
  const update = (dt, st) => {
    clk.tick(dt, st.anim ?? 'idle');
    if (st.anim === 'fire' && st.n !== lastN) { lastN = st.n; ft = 0; }
    ft += dt;
    const k = ft < 0.4 ? 1 - ft / 0.4 : 0;
    barrel.position.x = -k * 0.35;
    flash.visible = ft < 0.25; flash.scale.setScalar(1.8 * (1 - ft / 0.25) + 0.3);
  };
  return makeModel('pirate_cannon', root, update);
}

function cannonball() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:ball', () => new Build().sphere(0.4, 0x1e1e26, { p: [0, 0.4, 0] }, 16, 12).cyl(0.03, 0.03, 0.3, 0x8a6a4a, { p: [0, 0.9, 0] }, 5).geometry()), std('pir:ball', { color: 0xffffff, vertexColors: true, roughness: 0.3, metalness: 0.5 }), {}, true));
  const spark = sparkleSprite(0xffd060, 0.5);
  spark.position.y = 1.05;
  root.add(spark);
  const clk = new Clock();
  const update = (dt, st) => {
    clk.tick(dt, 'lit');
    spark.scale.setScalar(0.35 + 0.25 * Math.abs(sin(clk.t * 25)));
    spark.position.y = 1.05 - (st.fuse ?? 0) * 0.15;
  };
  return makeModel('cannonball', root, update);
}

function skullRock() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:skullrock', () => {
    const b = new Build();
    const R = 0x9a9488, R2 = 0x8a8478, D = 0x2a2420;
    b.sphere(1, { v: (x, y) => new THREE.Color(R).lerp(new THREE.Color(R2), (y + 1) / 2) }, { p: [0, 7.5, 0], s: [6, 7, 6.5] }, 26, 18);   // Schädel
    b.sphere(1, R2, { p: [1.5, 2.5, 0], s: [5.2, 3, 5.6] }, 20, 12);                                                             // Kiefer/Sockel
    for (const s of [1, -1]) b.sphere(1, D, { p: [4.9, 8.6, s * 2.3], s: [1.6, 2.0, 1.7] }, 16, 12);                              // Augenhöhlen
    b.cone(0.9, 1.6, D, { p: [5.6, 6.2, 0], r: [0, 0, Math.PI] }, 3);                                                              // Nase
    b.box(1.2, 1.4, 6, D, { p: [5.7, 3.8, 0] }, 0.2);                                                                              // Mund
    for (let i = -2; i <= 2; i++) b.box(0.8, 1.0, 0.85, 0xf4ecdc, { p: [6.0, 4.3, i * 1.15] }, 0.15);                              // Zähne
    for (let k = 0; k < 7; k++) { const a = k * 0.9; b.sphere(1, [R, R2][k % 2], { p: [cos(a) * 6.5, 0.6, sin(a) * 6.5], s: [1.8, 1.1, 1.6] }, 9, 6); }
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('skull_rock', root, () => {});
}

function barrel() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:barrel2', () => {
    const b = new Build();
    b.lathe([[0, 0], [0.42, 0], [0.5, 0.3], [0.54, 0.6], [0.5, 0.9], [0.42, 1.2], [0, 1.2]], { v: (x, y) => (Math.abs(y - 0.18) < 0.05 || Math.abs(y - 1.02) < 0.05 ? 0x4a4a52 : WOOD3) }, {}, 18, 2);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('barrel', root, () => {});
}

function treasurePile() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:treasure', () => {
    const b = new Build();
    b.sphere(1, GOLD, { p: [0, 0.2, 0], s: [1.3, 0.7, 1.1] }, 18, 10);
    for (let k = 0; k < 26; k++) {
      const a = k * 2.4, r = 0.3 + (k % 5) * 0.22, y = 0.35 + 0.55 * (1 - r / 1.3);
      b.cyl(0.16, 0.16, 0.05, k % 7 === 0 ? 0xe8e8f0 : GOLD, { p: [cos(a) * r, y, sin(a) * r], r: [0.5 * sin(k), 0, 0.5 * cos(k)] }, 12);
    }
    for (const [x, z, c] of [[0.3, 0.2, 0xff2a5a], [-0.4, -0.1, 0x2a8aff], [0.1, -0.5, 0x2ae08a], [-0.2, 0.5, 0xb05aff]]) b.sphere(0.13, c, { p: [x, 0.75, z] }, 6, 4);
    return b.geometry();
  }), vcol(0.25, { metalness: 0.5, emissive: 0x3a2a00 }, 'gold'), {}, true));
  const sp = [0, 1, 2].map(() => { const s = sparkleSprite(0xffffff, 0.5); root.add(s); return s; });
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    sp.forEach((s, i) => {
      const k = (clk.t * 0.8 + i / 3) % 1;
      s.position.set(cos(i * 2.1) * 0.6, 0.6 + k * 0.4, sin(i * 2.1) * 0.6);
      s.scale.setScalar(0.6 * sin(k * Math.PI));
    });
  };
  return makeModel('treasure_pile', root, update);
}

function pirateFlag() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:flagpole', () => new Build().cyl(0.08, 0.1, 6, WOOD2, { p: [0, 3, 0] }, 8).sphere(0.16, GOLD, { p: [0, 6.05, 0] }, 8, 6).geometry()), vcol(0.6), {}, true));
  const g = new THREE.PlaneGeometry(2.4, 1.6, 8, 2);
  const flag = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: skullTexture('flag', '#15121a', '#ffffff'), side: THREE.DoubleSide }));
  flag.position.set(-1.2, 5.1, 0);
  root.add(flag);
  const P0 = g.attributes.position.array.slice();
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const u = (P0[i * 3] + 1.2) / 2.4; P.setZ(i, sin(clk.t * 7 + u * 4) * 0.22 * (1 - u)); }
    P.needsUpdate = true;
  };
  return makeModel('pirate_flag', root, update, [g]);
}

function dock(opts = {}) {
  const L = opts.length ?? 12;
  const root = new THREE.Group();
  root.add(mesh(cached(`pir:dock:${L}`, () => {
    const b = new Build();
    for (let x = 0; x < L; x += 0.55) b.box(0.5, 0.12, 3, (Math.round(x / 0.55) % 3) ? WOOD3 : WOOD, { p: [x + 0.25, 0.9, 0] }, 0.02, 1);
    for (let x = 0; x <= L; x += 3) for (const s of [1, -1]) b.cyl(0.14, 0.16, 2.6, WOOD2, { p: [x, 0.2, s * 1.4] }, 8);
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('dock', root, () => {});
}

function lighthouse() {
  const root = new THREE.Group();
  root.add(mesh(cached('pir:lighthouse', () => {
    const b = new Build();
    b.cyl(3.2, 3.6, 1.2, 0x9a9488, { p: [0, 0.6, 0] }, 20);
    b.cyl(1.6, 2.4, 13, { v: (x, y) => (Math.floor((y + 6.5) / 2.6) % 2 ? 0xe8392d : 0xfaf6ee) }, { p: [0, 7.6, 0] }, 20);
    b.cyl(2.3, 2.3, 0.4, 0x2a2a34, { p: [0, 14.2, 0] }, 20);
    b.cyl(1.3, 1.3, 1.8, 0xfff2a0, { p: [0, 15.3, 0] }, 16);
    b.cone(1.7, 1.6, 0xe8392d, { p: [0, 17.0, 0] }, 16);
    return b.geometry();
  }), vcol(0.45), {}, true));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 24, 16, 1, true), basic('pir:beam', { color: 0xfff2a0, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.rotation.z = Math.PI / 2; beam.position.x = 12;
  const beamJ = joint([0, 15.3, 0], beam);
  root.add(beamJ, (() => { const g = glowSprite(0xfff2a0, 4, 0.8); g.position.y = 15.3; return g; })());
  const clk = new Clock();
  const update = (dt) => { clk.tick(dt, 'idle'); beamJ.rotation.y = clk.t * 0.8; };
  return makeModel('lighthouse', root, update, [beam.geometry]);
}

export const MODELS = {
  pirate_ship: pirateShip, pirate_cannon: pirateCannon, cannonball, skull_rock: skullRock, barrel,
  treasure_pile: treasurePile, pirate_flag: pirateFlag, dock, lighthouse,
};

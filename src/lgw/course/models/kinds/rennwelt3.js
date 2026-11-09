// Modelle für die Strecken ab Etappe 11 (Archetypen aus Mario Kart 8 Deluxe, eigene Gestaltung):
// bounce_pad      federnder Pilzhut als Trampolin auf der Fahrbahn (Pilzschlucht), opts { r, color }; Zustand { squash }
// rail_track      Gleis mit Schwellen quer über die Fahrbahn (entlang X), opts { length }
// train_loco      Lokomotive (vorn = +X), opts { color }
// train_car       Güter-/Personenwagen, opts { color }
// crossing_signal Warnkreuz mit zwei roten Lampen; Zustand { on, blink }
// pinball_bumper  Flipper-Bumper (leuchtet beim Treffer); Zustand { pulse }
// pinball         Flipperkugel aus Chrom (Mitte = Ursprung, Radius 1) – rollt als Gefahr
// flipper         Flipperarm, schlägt regelmäßig
// fountain        Springbrunnen mit Becken (Einkaufszentrum)
// shop_front      Ladenfront mit Markise und Schaufenster, opts { color, text }
// escalator       Rolltreppe (Deko)
// choco_bar       riesige Schokoladentafel, schräg im Boden
// glow_mushroom   leuchtender Pilz (Pilzschlucht-Höhle), opts { color }
// gingerbread     Lebkuchenhaus mit Zuckerguss
// xmas_tree       geschmückter Weihnachtsbaum mit Lichtern und Stern
// present         Geschenk mit Schleife, opts { color }
// reindeer        Rentier (vorn = +X), trottet
// ship_hull       Kreuzfahrtschiff-Rumpf mit Aufbauten und Schornstein (entlang X), opts { length }
// deck_chair      Liegestuhl
// ghost_lantern   schwebendes Irrlicht

import * as THREE from 'three';
import { Build, mesh, vcol, cached, joint, makeModel, Clock } from '../lib/kit.js';

const { sin } = Math;

function bouncePad(o = {}) {
  const R = o.r ?? 3, C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  const cap = mesh(cached(`rw3:bounce:${R}:${C}`, () => {
    const b = new Build();
    b.dome(R, (x, y, z) => (Math.sin(x * 1.3) * Math.sin(z * 1.3) > 0.5 ? 0xffffff : C), { s: [1, 0.35, 1] }, Math.PI / 2, 24, 8);
    b.torus(R * 0.98, 0.18, 0xffc21a, { r: [Math.PI / 2, 0, 0] }, 6, 28);
    return b.geometry();
  }), vcol(0.35), {}, true);
  root.add(cap);
  return makeModel('bounce_pad', root, (dt, st) => { const s = st.squash ?? 0; cap.scale.set(1 + s * 0.15, 1 - s * 0.6, 1 + s * 0.15); });
}

function railTrack(o = {}) {
  const L = o.length ?? 300;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:rails:${L}`, () => {
    const b = new Build();
    for (let x = -L / 2; x < L / 2; x += 1.6) b.box(0.5, 0.18, 3.2, 0x6a4a32, { p: [x, 0.09, 0] }, 0.02);
    for (const z of [-0.75, 0.75]) b.box(L, 0.16, 0.14, 0x9a9aa6, { p: [0, 0.26, z] }, 0.02);
    b.box(L, 0.08, 4.2, 0x8a8278, { p: [0, 0.02, 0] }, 0);
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.6 }), {}, false));
  return makeModel('rail_track', root, () => {});
}

function trainLoco(o = {}) {
  const C = o.color ?? 0xd8281e;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:loco:${C}`, () => {
    const b = new Build();
    b.box(12, 0.6, 3, 0x2a2a30, { p: [0, 1, 0] }, 0.05);
    b.cyl(1.4, 1.4, 7, 0x2a2a34, { p: [2.5, 2.8, 0], r: [0, 0, Math.PI / 2] }, 16);
    b.box(4, 4, 3.2, C, { p: [-3.6, 3.3, 0] }, 0.2);
    b.box(4.4, 0.4, 3.6, 0x1a1a1a, { p: [-3.6, 5.5, 0] }, 0.1);
    b.cyl(0.5, 0.7, 2.2, 0x1a1a1a, { p: [4.8, 5, 0] }, 10);
    b.cone(1.6, 1.6, 0xd8281e, { p: [6.6, 1.3, 0], r: [0, 0, Math.PI / 2] }, 4);
    b.sphere(0.4, 0xfff4c8, { p: [6.1, 3.2, 0] }, 8, 6);
    for (const x of [-4, -1.5, 1.5, 4]) for (const s of [-1, 1]) b.cyl(0.8, 0.8, 0.3, 0x1a1a1a, { p: [x, 0.8, s * 1.3], r: [Math.PI / 2, 0, 0] }, 14);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('train_loco', root, () => {});
}

function trainCar(o = {}) {
  const C = o.color ?? 0x3a6ae8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:car:${C}`, () => {
    const b = new Build();
    b.box(11.5, 0.5, 3, 0x2a2a30, { p: [0, 1, 0] }, 0.05);
    b.box(11, 3.4, 3.2, C, { p: [0, 3, 0] }, 0.2);
    b.box(11.2, 0.4, 3.4, 0xe8e4dc, { p: [0, 4.9, 0] }, 0.15);
    for (let x = -4; x <= 4; x += 2) for (const s of [-1, 1]) b.box(1.2, 1, 0.05, 0xbfe0f4, { p: [x, 3.4, s * 1.62] }, 0.02);
    for (const x of [-4, 4]) for (const s of [-1, 1]) b.cyl(0.6, 0.6, 0.3, 0x1a1a1a, { p: [x, 0.7, s * 1.3], r: [Math.PI / 2, 0, 0] }, 12);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('train_car', root, () => {});
}

function crossingSignal() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:xsig', () => {
    const b = new Build();
    b.cyl(0.15, 0.15, 4.4, 0xfaf8f4, { p: [0, 2.2, 0] }, 8);
    for (const r of [0.7, -0.7]) b.box(0.08, 0.35, 2.4, (x, y, z) => (Math.floor((z + 1.2) * 3) % 2 ? 0xe8392d : 0xffffff), { p: [0.15, 4.2, 0], r: [r, 0, 0] }, 0.02);
    b.box(0.3, 0.6, 1.6, 0x1a1a1a, { p: [0, 3.1, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const off = new THREE.MeshBasicMaterial({ color: 0x3a1010 }), on = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a1a).multiplyScalar(3) });
  const lamps = [-0.45, 0.45].map((z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.24, 14), off); m.position.set(0.17, 3.1, z); m.rotation.y = Math.PI / 2; root.add(m); return m; });
  return makeModel('crossing_signal', root, (dt, st) => {
    lamps[0].material = st.on && st.blink ? on : off;
    lamps[1].material = st.on && !st.blink ? on : off;
  }, [lamps[0].geometry, lamps[1].geometry, on, off]);
}

function pinballBumper() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:bumper', () => {
    const b = new Build();
    b.cyl(1.9, 2.1, 0.6, 0xfaf8f4, { p: [0, 0.3, 0] }, 24);
    b.cyl(1.5, 1.6, 1.6, 0xe8392d, { p: [0, 1.4, 0] }, 24);
    b.cyl(1.8, 1.8, 0.4, 0xffc21a, { p: [0, 2.4, 0] }, 24);
    b.dome(1.2, 0xfaf8f4, { p: [0, 2.6, 0] });
    return b.geometry();
  }), vcol(0.25), {}, true));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.18, 8, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3ab8) }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.9; root.add(ring);
  const base = new THREE.Color(0xff3ab8), hot = new THREE.Color(0xffffff).multiplyScalar(3);
  return makeModel('pinball_bumper', root, (dt, st) => { ring.material.color.copy(base).lerp(hot, st.pulse ?? 0).multiplyScalar(1.6); }, [ring.geometry, ring.material]);
}

function pinball() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:pinball', () => new THREE.SphereGeometry(1, 28, 20)), new THREE.MeshStandardMaterial({ color: 0xe8eef6, metalness: 1, roughness: 0.12 }), {}, true));
  return makeModel('pinball', root, () => {});
}

function flipper(o = {}) {
  const side = o.side ?? 1;
  const root = new THREE.Group();
  const arm = joint([0, 0.8, 0]);
  arm.add(mesh(cached('rw3:flipper', () => {
    const b = new Build();
    b.cyl(1.2, 1.2, 1.4, 0xfaf8f4, {}, 18);
    b.box(9, 1.4, 1.6, 0xfaf8f4, { p: [4.5, 0, 0] }, 0.6);
    b.box(9.2, 0.3, 1.7, 0xe8392d, { p: [4.5, 0.75, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.3), {}, true));
  root.add(arm);
  let t = Math.random() * 4;
  return makeModel('flipper', root, (dt) => { t += dt; const p = t % 2.4; arm.rotation.y = side * (p < 0.25 ? -0.6 * (p / 0.25) : -0.6 * Math.max(0, 1 - (p - 0.25) / 0.4)) + side * 0.35; });
}

function fountain() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:fountain', () => {
    const b = new Build();
    b.cyl(7, 7.4, 1.2, 0xe8e4dc, { p: [0, 0.6, 0] }, 28);
    b.cyl(6.4, 6.4, 0.2, 0x6ac8f4, { p: [0, 1.15, 0] }, 28);
    b.cyl(0.8, 1, 4, 0xe8e4dc, { p: [0, 2.6, 0] }, 14);
    b.cyl(2.6, 2.2, 0.6, 0xe8e4dc, { p: [0, 4.6, 0] }, 20);
    b.cyl(2.2, 2.2, 0.15, 0x8ad8f8, { p: [0, 4.9, 0] }, 20);
    return b.geometry();
  }), vcol(0.3), {}, true));
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.6, depthWrite: false }));
  jet.position.y = 7; root.add(jet);
  let t = 0;
  return makeModel('fountain', root, (dt) => { t += dt; jet.scale.y = 1 + 0.15 * sin(t * 6); }, [jet.geometry, jet.material]);
}

const signTex = new Map();
function signTexture(text, color) {
  const key = text + color;
  if (signTex.has(key)) return signTex.get(key);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#ffffff'; g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  signTex.set(key, t);
  return t;
}

function shopFront(o = {}) {
  const C = o.color ?? 0xe8392d, text = o.text ?? 'SHOP';
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:shop:${C}`, () => {
    const b = new Build();
    b.box(12, 9, 2, 0xf4efe6, { p: [0, 4.5, -1] }, 0.1);
    b.box(10, 5, 0.2, 0x9ad4f4, { p: [0, 3, 0.05] }, 0.02);
    b.box(1.6, 4, 0.25, 0x5a6a7a, { p: [3.5, 2, 0.1] }, 0.02);
    for (let k = 0; k < 6; k++) b.box(2, 0.3, 2.4, k % 2 ? C : 0xffffff, { p: [-5 + k * 2, 6.2, 1], r: [0.5, 0, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: signTexture(text, '#' + C.toString(16).padStart(6, '0')) }));
  sign.position.set(0, 7.8, 0.05); root.add(sign);
  return makeModel('shop_front', root, () => {}, [sign.geometry, sign.material]);
}

function escalator() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:escalator', () => {
    const b = new Build();
    for (let k = 0; k < 14; k++) b.box(1.2, 0.3, 3, 0x8a8a96, { p: [k * 1.1, k * 0.7 + 0.15, 0] }, 0.02);
    for (const s of [-1, 1]) b.box(16, 1.2, 0.3, 0xc8ccd6, { p: [7.5, 5.5, s * 1.7], r: [0, 0, 0.56] }, 0.1);
    b.box(2, 10, 3.6, 0xe8e4dc, { p: [16, 5, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('escalator', root, () => {});
}

function chocoBar() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:choco', () => {
    const b = new Build();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.box(2.8, 0.8, 2.8, 0x5a3218, { p: [i * 3 - 4.5, 0.4, j * 3 - 3] }, 0.25);
    b.box(12.4, 0.6, 9.2, 0x4a2812, { p: [0, 0, 0] }, 0.1);
    b.box(6, 0.2, 9.4, 0xd8281e, { p: [-3.5, 0.1, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.35), {}, true));
  root.children[0].rotation.set(0.9, 0, 0.3);
  root.children[0].position.y = 3;
  return makeModel('choco_bar', root, () => {});
}

function glowMushroom(o = {}) {
  const C = o.color ?? 0x3ad8ff;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:gmush:${C}`, () => {
    const b = new Build();
    b.cyl(0.6, 0.8, 5, 0xe8f0f4, { p: [0, 2.5, 0] }, 10);
    return b.geometry();
  }), vcol(0.5), {}, true));
  const cap = new THREE.Mesh(cached(`rw3:gcap`, () => { const g = new THREE.SphereGeometry(3, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.55, 1); return g; }), new THREE.MeshBasicMaterial({ color: new THREE.Color(C).multiplyScalar(1.6) }));
  cap.position.y = 4.8; root.add(cap);
  return makeModel('glow_mushroom', root, () => {}, [cap.material]);
}

function gingerbread() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:ginger', () => {
    const b = new Build();
    const G = 0xb8702a, W = 0xffffff;
    b.box(8, 6, 7, G, { p: [0, 3, 0] }, 0.3);
    for (const s of [1, -1]) b.box(8.6, 0.6, 5.4, W, { p: [0, 7.6, s * 2.1], r: [s * 0.75, 0, 0] }, 0.25);
    const sh = new THREE.Shape(); sh.moveTo(-3.5, 0); sh.lineTo(3.5, 0); sh.lineTo(0, 3.2); sh.lineTo(-3.5, 0);
    for (const x of [4.01, -4.01]) b.extrude(sh, 0.2, G, { p: [x, 6, 0], r: [0, Math.PI / 2, 0] });
    b.box(0.25, 3, 1.8, 0x7a3a1a, { p: [4.1, 1.5, 0] }, 0.05);
    for (const z of [-2.2, 2.2]) { b.box(0.2, 1.5, 1.5, 0xffd23a, { p: [4.1, 3.8, z] }, 0.05); b.box(0.22, 0.2, 1.7, W, { p: [4.12, 4.6, z] }, 0.05); }
    for (let k = 0; k < 8; k++) b.sphere(0.3, [0xe8392d, 0x3aa84a, 0xffd23a, 0x3a8ae8][k % 4], { p: [4.15, 6.2 + (k % 2) * 0.3, -3 + k * 0.85] }, 8, 6);
    b.cyl(0.4, 0.4, 2, 0xe8392d, { p: [-2, 9.5, -1.8] }, 8);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('gingerbread', root, () => {});
}

function xmasTree() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:xmas', () => {
    const b = new Build();
    b.cyl(0.8, 1, 3, 0x6a4a32, { p: [0, 1.5, 0] }, 8);
    for (let k = 0; k < 4; k++) b.cone(7 - k * 1.5, 6, 0x2a7a3a, { p: [0, 5 + k * 3.6, 0] }, 12);
    for (let k = 0; k < 30; k++) { const y = 4 + (k % 10) * 1.5, r = (7 - (y - 3) * 0.42) * 0.85, a = k * 2.4; b.sphere(0.4, [0xe8392d, 0xffd23a, 0x3a8ae8, 0xfaf8f4][k % 4], { p: [Math.cos(a) * r, y, Math.sin(a) * r] }, 8, 6); }
    return b.geometry();
  }), vcol(0.4), {}, true));
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd23a).multiplyScalar(2.5) }));
  star.position.y = 18.5; root.add(star);
  let t = 0;
  return makeModel('xmas_tree', root, (dt) => { t += dt; star.rotation.y = t; }, [star.geometry, star.material]);
}

function present(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:present:${C}`, () => {
    const b = new Build();
    b.box(3, 3, 3, C, { p: [0, 1.5, 0] }, 0.1);
    b.box(3.05, 3.05, 0.5, 0xffd23a, { p: [0, 1.5, 0] }, 0.02);
    b.box(0.5, 3.05, 3.05, 0xffd23a, { p: [0, 1.5, 0] }, 0.02);
    for (const s of [1, -1]) b.torus(0.6, 0.18, 0xffd23a, { p: [s * 0.5, 3.4, 0], r: [0, 0, s * 0.6] }, 6, 14);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('present', root, () => {});
}

function reindeer() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  const B = 0x8a5a32;
  body.add(mesh(cached('rw3:reindeer', () => {
    const b = new Build();
    b.sphere(1, B, { p: [0, 1.6, 0], s: [1.2, 0.6, 0.5] }, 14, 10);
    b.cyl(0.18, 0.25, 1, B, { p: [1, 2.2, 0], r: [0, 0, -0.6] }, 8);
    b.sphere(0.35, B, { p: [1.45, 2.65, 0], s: [1.3, 1, 0.9] }, 10, 8);
    b.sphere(0.13, 0xe8202a, { p: [1.9, 2.6, 0] }, 8, 6);
    for (const s of [1, -1]) { b.tube([[1.3, 2.9, s * 0.15], [1.2, 3.5, s * 0.4], [1.0, 3.9, s * 0.5], [1.3, 4.1, s * 0.6]], 0.05, 0xd8c8a8, {}, 8, 5); b.sphere(0.05, 0x1a1a1a, { p: [1.68, 2.75, s * 0.2] }, 6, 4); }
    b.sphere(0.15, 0xffffff, { p: [-1.2, 1.8, 0] }, 6, 4);
    return b.geometry();
  }), vcol(0.7), {}, true));
  const legG = cached('rw3:rleg', () => new Build().cyl(0.08, 0.07, 1.2, B, { p: [0, -0.6, 0] }, 6).geometry());
  const legs = [[0.7, 0.2], [0.7, -0.2], [-0.7, 0.2], [-0.7, -0.2]].map(([x, z], i) => { const j = joint([x, 1.3, z], mesh(legG, vcol(0.7))); body.add(j); return [j, i]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('reindeer', root, (dt, st) => {
    const anim = st.anim ?? 'idle'; clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.2, 0.4, 1.2); return; }
    body.scale.setScalar(1);
    for (const [j, i] of legs) j.rotation.z = anim === 'walk' ? sin(clk.t * 7 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 : 0;
  });
}

/** Rumpf eines Kreuzfahrtschiffs (entlang X, Deckhöhe ≈ 12 m), Aufbauten mit Fensterreihen, Schornstein. */
function shipHull(o = {}) {
  const L = o.length ?? 200;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:hull:${L}`, () => {
    const b = new Build();
    b.box(L, 14, 40, (x, y) => (y < 2 ? 0xd8281e : 0xfaf8f4), { p: [0, 5, 0] }, 2);
    b.sphere(20, 0xfaf8f4, { p: [L / 2, 5, 0], s: [1.6, 0.35, 1] }, 18, 8);
    for (const s of [1, -1]) for (let x = -L / 2 + 6; x < L / 2; x += 4) b.box(2, 1.2, 0.2, 0x2a4a6a, { p: [x, 8, s * 20.05] }, 0.05);
    b.box(L * 0.3, 10, 26, 0xfaf8f4, { p: [-L * 0.3, 17, 0] }, 1);
    for (const s of [1, -1]) for (let x = -L * 0.44; x < -L * 0.16; x += 3) for (const y of [15, 19]) b.box(2, 1.2, 0.2, 0x2a4a6a, { p: [x, y, s * 13.05] }, 0.05);
    b.cyl(4, 5, 10, 0x2a5ae8, { p: [-L * 0.3, 27, 0] }, 16);
    b.cyl(4.1, 4.1, 2, 0x1a1a22, { p: [-L * 0.3, 31, 0] }, 16);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('ship_hull', root, () => {});
}

function deckChair() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:chair', () => {
    const b = new Build();
    b.box(2, 0.15, 0.8, 0x3a8ae8, { p: [0, 0.5, 0], r: [0, 0, 0] }, 0.03);
    b.box(1, 0.15, 0.8, 0x3a8ae8, { p: [-1.3, 0.85, 0], r: [0, 0, -0.7] }, 0.03);
    for (const x of [-0.8, 0.8]) for (const z of [-0.35, 0.35]) b.cyl(0.04, 0.04, 0.5, 0xc8c8d0, { p: [x, 0.25, z] }, 4);
    return b.geometry();
  }), vcol(0.4), {}, false));
  return makeModel('deck_chair', root, () => {});
}

function ghostLantern() {
  const root = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8affd8).multiplyScalar(2) }));
  root.add(orb);
  let t = Math.random() * 6;
  return makeModel('ghost_lantern', root, (dt) => { t += dt; orb.position.set(sin(t * 0.7) * 1.5, 3 + sin(t * 1.3) * 0.8, sin(t * 0.5) * 1.5); }, [orb.geometry, orb.material]);
}

export const MODELS = {
  bounce_pad: bouncePad, rail_track: railTrack, train_loco: trainLoco, train_car: trainCar, crossing_signal: crossingSignal,
  pinball_bumper: pinballBumper, pinball, flipper, fountain, shop_front: shopFront, escalator, choco_bar: chocoBar,
  glow_mushroom: glowMushroom, gingerbread, xmas_tree: xmasTree, present, reindeer, ship_hull: shipHull, deck_chair: deckChair,
  ghost_lantern: ghostLantern,
};

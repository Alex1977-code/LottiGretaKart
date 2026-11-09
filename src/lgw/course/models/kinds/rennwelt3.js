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
// canal_house     schmales Giebelhaus an der Gracht, opts { color, floors }
// houseboat       Hausboot, opts { color }
// cyclist         Radfahrer (vorn = +X), tritt in die Pedale, opts { color }
// golden_stupa    goldener Tempel mit Spitze
// tuk_tuk         dreirädriges Taxi (fährt im Verkehr mit), opts { color }
// long_boat       Langboot des schwimmenden Markts mit Obst, opts { color }
// ancient_temple  antiker Tempel mit Säulenhalle und Giebel
// colosseum       Arena-Rund mit Bogenreihen
// toy_block       Bauklotz mit Buchstabe, opts { letter, color }
// teddy           riesiger Teddybär
// toy_soldier     Spielzeugsoldat (marschiert)
// crayon          Buntstift, liegt, opts { color }
// book_stack      Bücherstapel

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

function canalHouse(o = {}) {
  const C = o.color ?? 0xb8482a, F = o.floors ?? 4, H = F * 3.2;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:canal:${C}:${F}`, () => {
    const b = new Build();
    b.box(6, H, 7, C, { p: [0, H / 2, 0] }, 0.05);
    const sh = new THREE.Shape(); sh.moveTo(-3.5, 0); sh.lineTo(3.5, 0); sh.lineTo(3.5, 1.4); sh.lineTo(2.2, 1.4); sh.lineTo(2.2, 2.8); sh.lineTo(1, 2.8); sh.lineTo(1, 4.2); sh.lineTo(-1, 4.2); sh.lineTo(-1, 2.8); sh.lineTo(-2.2, 2.8); sh.lineTo(-2.2, 1.4); sh.lineTo(-3.5, 1.4); sh.lineTo(-3.5, 0);
    b.extrude(sh, 0.6, C, { p: [3.1, H, 0], r: [0, Math.PI / 2, 0] });
    for (let f = 0; f < F; f++) for (const z of [-1.8, 0, 1.8]) { b.box(0.15, 1.8, 1.2, 0xfaf8f4, { p: [3.02, 1.6 + f * 3.2, z] }, 0.02); b.box(0.16, 1.4, 0.9, 0x2a3a4a, { p: [3.06, 1.6 + f * 3.2, z] }, 0.02); }
    b.box(0.2, 0.3, 7.2, 0xfaf8f4, { p: [3.05, H, 0] }, 0.02);
    b.box(0.2, 2.4, 1.2, 0x2a4a3a, { p: [3.05, 1.2, 2.4] }, 0.02);
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('canal_house', root, () => {});
}

function houseboat(o = {}) {
  const C = o.color ?? 0x3aa84a;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:hboat:${C}`, () => {
    const b = new Build();
    b.box(16, 1.6, 5, 0x2a2a34, { p: [0, 0.5, 0] }, 0.4);
    b.box(10, 2.6, 4.2, C, { p: [-1, 2.6, 0] }, 0.1);
    b.box(10.6, 0.3, 4.8, 0x8a5a32, { p: [-1, 4, 0] }, 0.05);
    for (let x = -5; x <= 3; x += 2) for (const s of [-1, 1]) b.box(1, 1, 0.1, 0xbfe0f4, { p: [x, 2.8, s * 2.12] }, 0.02);
    b.box(0.8, 0.8, 0.8, 0xe8392d, { p: [6, 1.7, 1] }, 0.1);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('houseboat', root, () => {});
}

function cyclist(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached(`rw3:cyc:${C}`, () => {
    const b = new Build();
    for (const x of [-0.6, 0.6]) b.torus(0.4, 0.05, 0x1a1a1a, { p: [x, 0.42, 0] }, 6, 18);
    b.tube([[-0.6, 0.42, 0], [-0.1, 0.9, 0], [0.5, 0.9, 0], [0.6, 0.42, 0]], 0.04, C, {}, 10, 5);
    b.tube([[-0.1, 0.9, 0], [0.05, 0.42, 0], [-0.6, 0.42, 0]], 0.04, C, {}, 8, 5);
    b.box(0.3, 0.06, 0.18, 0x1a1a1a, { p: [-0.15, 1.0, 0] }, 0.02);
    b.capsule(0.18, 0.45, 0x3a7ae8, { p: [0, 1.35, 0], r: [0, 0, -0.3] }, 3, 8);
    b.sphere(0.17, 0xf2c8a0, { p: [0.2, 1.8, 0] }, 10, 8);
    b.sphere(0.19, 0xffd23a, { p: [0.18, 1.88, 0], s: [1, 0.6, 1] }, 10, 6);
    b.tube([[0.1, 1.5, 0], [0.4, 1.2, 0.15], [0.55, 1.0, 0.18]], 0.05, 0xf2c8a0, {}, 6, 4);
    b.box(0.4, 0.3, 0.35, 0x8a5a32, { p: [-0.7, 0.85, 0] }, 0.03);
    return b.geometry();
  }), vcol(0.5), {}, true));
  root.add(body);
  const clk = new Clock();
  return makeModel('cyclist', root, (dt, st) => { clk.tick(dt, st.anim); body.scale.y = st.anim === 'squashed' ? 0.4 : 1; body.rotation.x = sin(clk.t * 4) * 0.04; });
}

function goldenStupa() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:stupa', () => {
    const b = new Build();
    const G = 0xffc21a;
    b.box(26, 3, 26, 0xfaf4e4, { p: [0, 1.5, 0] }, 0.2);
    b.box(20, 3, 20, 0xfaf4e4, { p: [0, 4.5, 0] }, 0.2);
    b.lathe([[9, 0], [9, 2], [8, 6], [5, 10], [2.5, 13], [1.6, 17], [1.2, 22], [0.5, 30], [0, 34]], G, { p: [0, 6, 0] }, 28);
    for (let k = 0; k < 6; k++) b.torus(1.8 - k * 0.15, 0.2, 0xffd85a, { p: [0, 20 + k * 1.5, 0], r: [Math.PI / 2, 0, 0] }, 6, 20);
    for (const [x, z] of [[11, 11], [-11, 11], [11, -11], [-11, -11]]) b.cone(1.2, 8, G, { p: [x, 10, z] }, 10);
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.3 }), {}, true));
  return makeModel('golden_stupa', root, () => {});
}

function tukTuk(o = {}) {
  const C = o.color ?? 0x3aa84a;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached(`rw3:tuk:${C}`, () => {
    const b = new Build();
    b.box(3.2, 1, 1.6, C, { p: [-0.2, 0.8, 0] }, 0.25);
    b.box(1.2, 0.9, 1.0, C, { p: [1.6, 0.85, 0] }, 0.2);
    b.box(3.4, 0.15, 1.9, 0x1a1a22, { p: [-0.2, 2.5, 0] }, 0.05);
    for (const [x, z] of [[1.2, 0.7], [1.2, -0.7], [-1.6, 0.85], [-1.6, -0.85]]) b.box(0.08, 1.4, 0.08, 0xc8c8d0, { p: [x, 1.8, z] }, 0.02);
    b.box(0.6, 0.6, 1.2, 0x2a3a5a, { p: [-0.6, 1.4, 0] }, 0.05);
    for (const [x, z] of [[2, 0], [-1.4, 0.8], [-1.4, -0.8]]) b.cyl(0.35, 0.35, 0.25, 0x1a1a1a, { p: [x, 0.35, z], r: [Math.PI / 2, 0, 0] }, 12);
    b.box(0.08, 0.2, 0.4, 0xfff4c8, { p: [2.22, 1, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.4), {}, true));
  root.add(body);
  return makeModel('tuk_tuk', root, (dt, st) => { body.scale.y = st.anim === 'squashed' ? 0.5 : 1; });
}

function longBoat(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:lboat:${C}`, () => {
    const b = new Build();
    b.sphere(1, 0x8a5a32, { p: [0, 0.2, 0], s: [5, 0.6, 1] }, 18, 8);
    b.box(9, 0.2, 1.6, 0x6a4428, { p: [0, 0.6, 0] }, 0.05);
    for (let k = 0; k < 6; k++) b.sphere(0.35, [0xffd23a, 0xe8392d, 0x3aa84a, 0xff8a1a][k % 4], { p: [-3 + k * 1.2, 0.95, (k % 2) * 0.4 - 0.2] }, 8, 6);
    b.cone(1.1, 0.6, C, { p: [1, 1.9, 0] }, 12);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('long_boat', root, () => {});
}

function ancientTemple() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:atemple', () => {
    const b = new Build();
    const M = 0xf2ece0;
    for (let k = 0; k < 3; k++) b.box(40 - k * 2, 1, 22 - k * 2, M, { p: [0, 0.5 + k, 0] }, 0.05);
    for (let x = -17; x <= 17; x += 4.25) for (const z of [-8.5, 8.5]) b.cyl(1, 1.15, 12, M, { p: [x, 9, z] }, 14);
    for (const x of [-17, 17]) for (let z = -4.25; z <= 4.25; z += 4.25) b.cyl(1, 1.15, 12, M, { p: [x, 9, z] }, 14);
    b.box(38, 2, 20, M, { p: [0, 16, 0] }, 0.1);
    b.box(38.6, 0.6, 20.6, 0xc85a3a, { p: [0, 15.2, 0] }, 0.05);
    const sh = new THREE.Shape(); sh.moveTo(-10.5, 0); sh.lineTo(10.5, 0); sh.lineTo(0, 4.5); sh.lineTo(-10.5, 0);
    b.extrude(sh, 38, M, { p: [0, 17, 0], r: [0, Math.PI / 2, 0] });
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('ancient_temple', root, () => {});
}

function colosseum() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:colos', () => {
    const b = new Build();
    const S = 0xd8c09a, S2 = 0xc8b08a;
    const n = 36, R = 34;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R * 0.8;
      if (k > 30) continue;   // eingestürzter Teil
      for (let f = 0; f < 3 + (k % 5 === 0 ? 0 : 1) - (k > 26 ? 1 : 0); f++) {
        b.box(1.4, 7, 2, S, { p: [x, 3.5 + f * 7.2, z], r: [0, -a, 0] }, 0.05);
        b.box(6.2, 1, 2.2, S2, { p: [Math.cos(a + 0.087) * R, 7 + f * 7.2, Math.sin(a + 0.087) * R * 0.8], r: [0, -a - Math.PI / 2, 0] }, 0.05);
      }
    }
    b.cyl(R - 6, R - 6, 0.6, 0xd8b88a, { p: [0, 0.3, 0], s: [1, 1, 0.8] }, 32);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('colosseum', root, () => {});
}

const letterTex = new Map();
function letterTexture(L, color) {
  const key = L + color;
  if (letterTex.has(key)) return letterTex.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff8ee'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#' + color.toString(16).padStart(6, '0'); g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  letterTex.set(key, t);
  return t;
}

function toyBlock(o = {}) {
  const C = o.color ?? 0xe8392d, L = o.letter ?? 'A';
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:block:${C}`, () => new Build().box(5, 5, 5, C, { p: [0, 2.5, 0] }, 0.4).geometry()), vcol(0.5), {}, true));
  const mat = new THREE.MeshStandardMaterial({ map: letterTexture(L, C), roughness: 0.6 });
  const g = new THREE.PlaneGeometry(4, 4);
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(g, mat); const a = (k * Math.PI) / 2; m.position.set(Math.sin(a) * 2.52, 2.5, Math.cos(a) * 2.52); m.rotation.y = a; root.add(m); }
  return makeModel('toy_block', root, () => {}, [g, mat]);
}

function teddy() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:teddy', () => {
    const b = new Build();
    const B = 0xb8783a, L = 0xe8c08a;
    b.sphere(14, B, { p: [0, 16, 0], s: [1, 1.15, 0.9] }, 20, 14);
    b.sphere(9, L, { p: [7, 14, 0], s: [0.4, 1, 0.8] }, 14, 10);
    b.sphere(10, B, { p: [0, 38, 0] }, 20, 14);
    b.sphere(4, L, { p: [8.5, 36, 0], s: [0.8, 0.7, 1] }, 12, 8);
    b.sphere(1.2, 0x2a1a12, { p: [11.5, 37, 0] }, 8, 6);
    for (const s of [1, -1]) {
      b.sphere(3.6, B, { p: [0, 46, s * 7.5] }, 12, 8);
      b.sphere(2.2, L, { p: [1, 46, s * 7.5], s: [0.6, 1, 1] }, 10, 6);
      b.sphere(1.1, 0x1a1a1a, { p: [8.4, 40, s * 3.6] }, 8, 6);
      b.sphere(5, B, { p: [4, 22, s * 13], s: [1.4, 0.8, 0.8] }, 12, 8);
      b.sphere(6, B, { p: [6, 4, s * 7], s: [1.4, 0.7, 0.9] }, 12, 8);
    }
    b.torus(6, 1, 0xe8392d, { p: [0, 29, 0], r: [Math.PI / 2, 0, 0] }, 6, 20);
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('teddy', root, () => {});
}

function toySoldier() {
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('rw3:soldier', () => {
    const b = new Build();
    b.cyl(0.35, 0.4, 1, 0xe8392d, { p: [0, 1.5, 0] }, 10);
    b.box(0.85, 0.12, 0.85, 0xffd23a, { p: [0, 1.1, 0] }, 0.02);
    b.sphere(0.3, 0xf2c8a0, { p: [0, 2.25, 0] }, 10, 8);
    b.cyl(0.32, 0.3, 0.9, 0x1a1a22, { p: [0, 2.8, 0] }, 10);
    for (const s of [1, -1]) { b.cyl(0.13, 0.13, 1, 0x2a3a8a, { p: [0, 0.55, s * 0.18] }, 6); b.cyl(0.1, 0.1, 0.8, 0xe8392d, { p: [0, 1.5, s * 0.45] }, 6); }
    b.cyl(0.04, 0.04, 1.4, 0x8a5a32, { p: [0.15, 2.2, 0.55] }, 4);
    for (const z of [-0.08, 0.08]) b.sphere(0.04, 0x1a1a1a, { p: [0.28, 2.3, z] }, 6, 4);
    return b.geometry();
  }), vcol(0.4), {}, true));
  root.add(body);
  const clk = new Clock();
  return makeModel('toy_soldier', root, (dt, st) => { clk.tick(dt, st.anim); body.scale.y = st.anim === 'squashed' ? 0.3 : 1; body.rotation.x = st.anim === 'walk' ? sin(clk.t * 6) * 0.08 : 0; });
}

function crayon(o = {}) {
  const C = o.color ?? 0x3a8ae8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw3:crayon:${C}`, () => {
    const b = new Build();
    b.cyl(1.4, 1.4, 22, C, { p: [0, 1.4, 0], r: [0, 0, Math.PI / 2] }, 12);
    b.cyl(1.45, 1.45, 14, 0xfaf8f4, { p: [-1, 1.4, 0], r: [0, 0, Math.PI / 2] }, 12);
    b.cone(1.4, 3.6, 0xe8d0a8, { p: [12.8, 1.4, 0], r: [0, 0, -Math.PI / 2] }, 12);
    b.cone(0.5, 1.3, C, { p: [14, 1.4, 0], r: [0, 0, -Math.PI / 2] }, 10);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('crayon', root, () => {});
}

function bookStack() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw3:books', () => {
    const b = new Build();
    const cols = [0xe8392d, 0x3a6ae8, 0x3aa84a, 0xffc21a, 0x8a3ae8];
    let y = 0;
    for (let k = 0; k < 5; k++) { const h = 3 + (k % 2); b.box(46 - k * 3, h, 34 - k * 2, cols[k], { p: [(k % 2) * 2, y + h / 2, (k % 3) - 1], r: [0, k * 0.06, 0] }, 0.3); b.box(45.5 - k * 3, h - 0.6, 0.3, 0xfaf4e4, { p: [(k % 2) * 2, y + h / 2, (34 - k * 2) / 2 + (k % 3) - 1], r: [0, k * 0.06, 0] }, 0.05); y += h; }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('book_stack', root, () => {});
}

export const MODELS = {
  canal_house: canalHouse, houseboat, cyclist, golden_stupa: goldenStupa, tuk_tuk: tukTuk, long_boat: longBoat,
  ancient_temple: ancientTemple, colosseum, toy_block: toyBlock, teddy, toy_soldier: toySoldier, crayon, book_stack: bookStack,
  bounce_pad: bouncePad, rail_track: railTrack, train_loco: trainLoco, train_car: trainCar, crossing_signal: crossingSignal,
  pinball_bumper: pinballBumper, pinball, flipper, fountain, shop_front: shopFront, escalator, choco_bar: chocoBar,
  glow_mushroom: glowMushroom, gingerbread, xmas_tree: xmasTree, present, reindeer, ship_hull: shipHull, deck_chair: deckChair,
  ghost_lantern: ghostLantern,
};

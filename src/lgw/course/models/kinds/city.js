// Großstadt-Modelle für die Strecke „Palmen-City“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt, kindgerecht:
// Verfolgungsjagd mit der Polizei, keine Waffen). Maßstab Meter, Ursprung = Fußpunkt, Blick/Front nach +X.
//
// police_car     Polizeiauto mit blinkendem Blaulicht (rot/blau).  state 'walk'|'idle'|'squashed'
// city_car       Stadtauto.  opts { color, taxi (bool) }
// police_heli    Polizeihubschrauber mit Rotor und Suchscheinwerfer.
// neon_sign      Neon-Schild auf Stelzen, flackert.  opts { text, color ('#ff3a8a') }
// street_lamp    Straßenlaterne mit Licht (≈ 7 m).
// traffic_light  Ampel, schaltet um.
// gas_station    Tankstelle mit Dach, Zapfsäulen und Schild.
// barricade      rot-weiße Absperrung mit Blinklicht.
// traffic_cone   Leitkegel.
// neon_tower     Hochhaus mit leuchtenden Kanten und Antenne.  opts { h (60), color }
// hydrant        Hydrant.

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, makeModel, Clock, TAU, glowSprite, canvasTexture } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;

/** Grundform Auto (≈ 4,4 m): Karosserie, Dach, Scheiben, Räder, Lichter. */
function carBody(b, body, roof, { stripe = null } = {}) {
  b.box(4.4, 0.9, 1.9, body, { p: [0, 0.75, 0] }, 0.3);
  b.box(2.3, 0.75, 1.75, roof, { p: [-0.3, 1.52, 0] }, 0.3);
  b.box(0.05, 0.6, 1.55, 0x2a3a5a, { p: [0.86, 1.5, 0], r: [0, 0, -0.5] }, 0.02);
  b.box(0.05, 0.55, 1.5, 0x2a3a5a, { p: [-1.47, 1.5, 0], r: [0, 0, 0.5] }, 0.02);
  for (const s of [1, -1]) b.box(1.9, 0.5, 0.04, 0x2a3a5a, { p: [-0.3, 1.52, s * 0.89] }, 0.02);
  if (stripe) for (const s of [1, -1]) b.box(4.42, 0.22, 0.04, stripe, { p: [0, 0.78, s * 0.96] }, 0.02);
  for (const [x, z] of [[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]]) {
    b.cyl(0.42, 0.42, 0.3, 0x1a1a22, { p: [x, 0.42, z], r: [Math.PI / 2, 0, 0] }, 14);
    b.cyl(0.22, 0.22, 0.32, 0xc8c8d0, { p: [x, 0.42, z], r: [Math.PI / 2, 0, 0] }, 10);
  }
  for (const s of [1, -1]) {
    b.box(0.05, 0.22, 0.4, 0xfff4c8, { p: [2.21, 0.85, s * 0.62] }, 0.02);
    b.box(0.05, 0.2, 0.4, 0xe8202a, { p: [-2.21, 0.88, s * 0.62] }, 0.02);
  }
  b.box(0.12, 0.25, 1.9, 0x3a3a44, { p: [2.2, 0.45, 0] }, 0.05);
  b.box(0.12, 0.25, 1.9, 0x3a3a44, { p: [-2.2, 0.45, 0] }, 0.05);
}

function policeCar() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('city:police', () => {
    const b = new Build();
    carBody(b, 0xfaf8f4, 0x1a2a6a, { stripe: 0x2a5ae8 });
    b.box(0.6, 0.12, 1.3, 0x2a2a34, { p: [-0.3, 1.95, 0] }, 0.03);
    return b.geometry();
  }), vcol(0.35), {}, true));
  // Aufschrift
  const tex = canvasTexture('city:polizei', 512, 96, (x) => { x.font = 'bold 80px "Lilita One", sans-serif'; x.fillStyle = '#1a3a9a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('POLIZEI', 256, 52); });
  for (const s of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), basic('city:polizei', { map: tex, transparent: true }));
    pl.position.set(0.1, 1.0, s * 0.97);
    if (s < 0) pl.rotation.y = Math.PI;
    body.add(pl);
  }
  const red = mesh(cached('city:lightbox', () => new Build().box(0.4, 0.2, 0.55, 0xffffff, {}, 0.05).geometry()), basic('city:red', { color: 0xff2a2a }), { p: [-0.3, 2.1, 0.35] });
  const blue = mesh(cached('city:lightbox', () => new Build().box(0.4, 0.2, 0.55, 0xffffff, {}, 0.05).geometry()), basic('city:blue', { color: 0x2a6aff }), { p: [-0.3, 2.1, -0.35] });
  const gR = glowSprite(0xff3a3a, 3.5, 0.8), gB = glowSprite(0x3a6aff, 3.5, 0.8);
  gR.position.set(-0.3, 2.2, 0.4); gB.position.set(-0.3, 2.2, -0.4);
  body.add(red, blue, gR, gB);
  root.add(body);
  const clk = new Clock();
  return makeModel('police_car', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'walk');
    if (st.anim === 'squashed') { body.scale.set(1.1, 0.4, 1.1); return; }
    body.scale.setScalar(1);
    const on = Math.floor(clk.t * 6) % 2 === 0;
    gR.material.opacity = on ? 0.9 : 0.1; gB.material.opacity = on ? 0.1 : 0.9;
    red.visible = on; blue.visible = !on;
    body.position.y = Math.abs(sin(clk.t * 14)) * 0.03;
  }, [gR.material, gB.material]);
}

function cityCar(opts = {}) {
  const taxi = !!opts.taxi, c = taxi ? 0xffc21a : opts.color ?? 0xe8392d;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached(`city:car:${c}:${taxi}`, () => {
    const b = new Build();
    carBody(b, c, taxi ? 0xffc21a : new THREE.Color(c).multiplyScalar(0.8), { stripe: taxi ? 0x1a1a22 : null });
    if (taxi) b.box(0.7, 0.3, 0.35, 0xffffff, { p: [-0.3, 2.05, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.3), {}, true));
  root.add(body);
  const clk = new Clock();
  return makeModel('city_car', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'idle');
    if (st.anim === 'squashed') { body.scale.set(1.1, 0.4, 1.1); return; }
    body.scale.setScalar(1);
  });
}

function policeHeli() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:heli', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y > 0.1 ? 0x1a2a6a : 0xfaf8f4), { s: [2.4, 1.2, 1.2] }, 18, 12);
    b.sphere(0.9, 0x6ac8ff, { p: [1.6, 0.2, 0], s: [0.8, 0.8, 1] }, 12, 8);
    b.cyl(0.25, 0.15, 4, 0x1a2a6a, { p: [-3.6, 0.3, 0], r: [0, 0, Math.PI / 2] }, 8);
    b.box(0.6, 1.2, 0.1, 0x1a2a6a, { p: [-5.5, 0.9, 0] }, 0.05);
    for (const s of [1, -1]) b.box(3, 0.12, 0.12, 0x3a3a44, { p: [0, -1.4, s * 0.8] }, 0.03);
    b.cyl(0.12, 0.12, 0.6, 0x3a3a44, { p: [0, 1.4, 0] }, 6);
    return b.geometry();
  }), vcol(0.35), {}, true));
  const rotor = joint([0, 1.75, 0], mesh(cached('city:rotor', () => new Build().box(9, 0.05, 0.4, 0x2a2a30, {}, 0.02).box(0.4, 0.05, 9, 0x2a2a30, {}, 0.02).geometry()), vcol(0.4)));
  const tail = joint([-5.6, 0.9, 0.12], mesh(cached('city:tailrotor', () => new Build().box(0.05, 2, 0.25, 0x2a2a30, {}, 0.02).geometry()), vcol(0.4)));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(5, 26, 18, 1, true), basic('city:beam', { color: 0xfff4c8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(1, -13, 0);
  beam.userData.noShadow = true;
  const lamp = glowSprite(0xffffff, 2.5, 0.9); lamp.position.set(1.2, -1.2, 0);
  const blink = glowSprite(0xff3a3a, 1.5, 0.9); blink.position.set(-5.5, 1.6, 0);
  root.add(rotor, tail, beam, lamp, blink);
  const clk = new Clock();
  return makeModel('police_heli', root, (dt) => {
    clk.tick(dt, 'idle');
    rotor.rotation.y = clk.t * 24; tail.rotation.z = clk.t * 30;
    beam.rotation.z = sin(clk.t * 0.7) * 0.25; beam.rotation.x = cos(clk.t * 0.5) * 0.2;
    blink.material.opacity = Math.floor(clk.t * 2) % 2 ? 0.9 : 0.1;
  }, [beam.geometry]);
}

function neonSign(opts = {}) {
  const text = opts.text ?? 'PALMEN-CITY', color = opts.color ?? '#ff3a8a';
  const root = new THREE.Group();
  root.add(mesh(cached('city:signposts', () => new Build()
    .cyl(0.15, 0.15, 6, 0x3a3a44, { p: [0, 3, -3.2] }, 6).cyl(0.15, 0.15, 6, 0x3a3a44, { p: [0, 3, 3.2] }, 6)
    .box(0.3, 2.8, 8, 0x1a1428, { p: [0, 7, 0] }, 0.1).geometry()), vcol(0.5), {}, true));
  const tex = canvasTexture(`city:neon:${text}:${color}`, 1024, 320, (x) => {
    x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, 1024, 320);
    x.font = 'bold 170px "Lilita One", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = color; x.shadowBlur = 40; x.fillStyle = color; x.fillText(text, 512, 165);
    x.shadowBlur = 0; x.lineWidth = 6; x.strokeStyle = '#ffffff'; x.strokeText(text, 512, 165);
  });
  const mats = [];
  for (const s of [1, -1]) {
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    mats.push(m);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 2.4), m);
    pl.position.set(s * 0.17, 7, 0); pl.rotation.y = s * Math.PI / 2;
    root.add(pl);
  }
  const clk = new Clock();
  return makeModel('neon_sign', root, (dt) => { clk.tick(dt, 'idle'); const f = sin(clk.t * 23) > 0.97 ? 0.4 : 1; for (const m of mats) m.opacity = f; }, mats);
}

function streetLamp() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:lamp', () => new Build()
    .cyl(0.12, 0.18, 7, 0x4a4a58, { p: [0, 3.5, 0] }, 8)
    .box(2.2, 0.15, 0.2, 0x4a4a58, { p: [1, 7, 0] }, 0.03)
    .box(0.8, 0.25, 0.45, 0x4a4a58, { p: [2, 6.9, 0] }, 0.05)
    .geometry()), vcol(0.4), {}, true));
  root.add(mesh(cached('city:lamplight', () => new Build().box(0.6, 0.06, 0.35, 0xfff0b0, { p: [2, 6.74, 0] }, 0.01).geometry()), basic('city:lampglow', { vertexColors: true })));
  const g = glowSprite(0xffe0a0, 4, 0.6); g.position.set(2, 6.6, 0); root.add(g);
  return makeModel('street_lamp', root, () => {});
}

function trafficLight() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:tlight', () => new Build()
    .cyl(0.1, 0.12, 4.5, 0x3a3a44, { p: [0, 2.25, 0] }, 8)
    .box(0.4, 1.3, 0.45, 0x1a1a22, { p: [0.1, 4.8, 0] }, 0.05)
    .geometry()), vcol(0.4), {}, true));
  const lights = [0xff2a2a, 0xffc21a, 0x3aff6a].map((c, k) => {
    const m = mesh(cached('city:tl', () => new Build().cyl(0.14, 0.14, 0.05, 0xffffff, { r: [0, 0, Math.PI / 2] }, 12).geometry()), basic(`city:tl${k}`, { color: c }), { p: [0.32, 5.2 - k * 0.4, 0] });
    root.add(m); return m;
  });
  const clk = new Clock();
  return makeModel('traffic_light', root, (dt) => {
    clk.tick(dt, 'idle');
    const ph = (clk.t % 8) / 8, on = ph < 0.45 ? 2 : ph < 0.55 ? 1 : 0;
    lights.forEach((m, k) => { m.visible = k === on; });
  });
}

function gasStation() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:gas', () => {
    const b = new Build();
    b.box(14, 0.6, 8, 0xe8392d, { p: [0, 5.3, 0] }, 0.2);
    b.box(14.2, 0.2, 8.2, 0xfaf8f4, { p: [0, 4.95, 0] }, 0.05);
    for (const [x, z] of [[-5, -3], [5, -3], [-5, 3], [5, 3]]) b.box(0.4, 5, 0.4, 0xfaf8f4, { p: [x, 2.5, z] }, 0.05);
    for (const x of [-2.5, 2.5]) { b.box(0.8, 1.8, 0.6, 0x2a7ad8, { p: [x, 0.9, 0] }, 0.1); b.box(0.6, 0.4, 0.62, 0x1a1a22, { p: [x, 1.4, 0] }, 0.02); }
    b.box(10, 4, 6, 0xd8dce4, { p: [0, 2, -9] }, 0.2);
    b.box(9, 1.6, 0.1, 0x6ac8ff, { p: [0, 2.2, -5.95] }, 0.02);
    b.cyl(0.25, 0.25, 8, 0x4a4a58, { p: [9, 4, 3] }, 8);
    b.box(0.4, 2.4, 2.4, 0xffc21a, { p: [9, 8.6, 3] }, 0.1);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('gas_station', root, () => {});
}

function barricade() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:barricade', () => {
    const b = new Build();
    for (const z of [-1.2, 1.2]) b.box(0.12, 1.1, 0.12, 0xfaf8f4, { p: [0, 0.55, z] }, 0.02);
    for (const y of [0.5, 0.95]) b.box(0.1, 0.25, 2.8, (x, yy, z) => (Math.floor((z + 2) * 2.5) % 2 ? 0xe8392d : 0xfaf8f4), { p: [0, y, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.5), {}, true));
  const g = glowSprite(0xffa020, 1.4, 0.8); g.position.set(0, 1.25, 1.2); root.add(g);
  const clk = new Clock();
  return makeModel('barricade', root, (dt) => { clk.tick(dt, 'idle'); g.material.opacity = Math.floor(clk.t * 3) % 2 ? 0.9 : 0.15; });
}

function trafficCone() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:cone', () => new Build()
    .box(0.6, 0.06, 0.6, 0x1a1a22, { p: [0, 0.03, 0] }, 0.02)
    .cone(0.25, 0.75, (x, y) => (Math.abs(y) < 0.1 ? 0xffffff : 0xff6a1a), { p: [0, 0.42, 0] }, 12)
    .geometry()), vcol(0.5), {}, true));
  return makeModel('traffic_cone', root, () => {});
}

function neonTower(opts = {}) {
  const H = opts.h ?? 60, c = opts.color ?? 0x3a2f5c, edge = opts.edge ?? 0xff3a8a;
  const root = new THREE.Group();
  root.add(mesh(cached(`city:tower:${H}:${c}`, () => {
    const b = new Build();
    b.box(14, H, 14, c, { p: [0, H / 2, 0] }, 0.3, 1);
    b.box(10, H * 0.18, 10, c, { p: [0, H + H * 0.09, 0] }, 0.3, 1);
    b.cyl(0.25, 0.4, 12, 0x8a8aa0, { p: [0, H * 1.18 + 6, 0] }, 6);
    for (let y = 4; y < H - 2; y += 4.5) for (const s of [1, -1]) {
      b.box(14.05, 1.4, 0.05, (Math.round(y) % 3) ? 0xffd88a : 0x6ac8ff, { p: [0, y, s * 7.01] }, 0);
      b.box(0.05, 1.4, 14.05, (Math.round(y) % 2) ? 0xffd88a : 0x2a2a3a, { p: [s * 7.01, y, 0] }, 0);
    }
    return b.geometry();
  }), vcol(0.5, { emissive: 0x2a1e3a, emissiveIntensity: 0.3 }, 'tower'), {}, true));
  // leuchtende Kanten
  root.add(mesh(cached(`city:toweredge:${H}:${edge}`, () => {
    const b = new Build();
    for (const [x, z] of [[7, 7], [7, -7], [-7, 7], [-7, -7]]) b.box(0.3, H, 0.3, edge, { p: [x, H / 2, z] }, 0);
    for (const [x, z] of [[5, 5], [5, -5], [-5, 5], [-5, -5]]) b.box(0.25, H * 0.18, 0.25, edge, { p: [x, H * 1.09, z] }, 0);
    return b.geometry();
  }), basic('city:edge', { vertexColors: true })));
  const tip = glowSprite(0xff3a3a, 3, 0.9); tip.position.y = H * 1.18 + 12.2; root.add(tip);
  const clk = new Clock();
  return makeModel('neon_tower', root, (dt) => { clk.tick(dt, 'idle'); tip.material.opacity = Math.floor(clk.t * 1.5) % 2 ? 0.9 : 0.2; });
}

function hydrant() {
  const root = new THREE.Group();
  root.add(mesh(cached('city:hydrant', () => new Build()
    .cyl(0.2, 0.24, 0.8, 0xe8392d, { p: [0, 0.4, 0] }, 10).sphere(0.22, 0xe8392d, { p: [0, 0.82, 0] }, 10, 6)
    .cyl(0.08, 0.08, 0.6, 0xc8c8d0, { p: [0, 0.55, 0], r: [Math.PI / 2, 0, 0] }, 6)
    .geometry()), vcol(0.4), {}, true));
  return makeModel('hydrant', root, () => {});
}

export const MODELS = {
  police_car: policeCar, city_car: cityCar, police_heli: policeHeli, neon_sign: neonSign, street_lamp: streetLamp,
  traffic_light: trafficLight, gas_station: gasStation, barricade, traffic_cone: trafficCone, neon_tower: neonTower, hydrant,
};

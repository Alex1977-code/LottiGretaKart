// Weitere Modelle für die Strecken nach den Archetypen von Mario Kart 8 Deluxe (eigene Gestaltung), ab Etappe 6:
// cow            Kuh (schwarz-weiß gefleckt), grast oder trottet über die Fahrbahn (Kuhweide); vorn = +X
// barn           rote Scheune mit weißen Kanten, Mansarddach und großem Tor
// silo           Futtersilo mit Kuppel
// hay_bale       runder Heuballen (liegt), opts { r }
// tractor        grüner Traktor mit großen Hinterrädern
// crab           rote Krabbe mit Scheren, läuft seitwärts (Palmenstrand); vorn = +X
// beach_hut      Strandhütte auf Stelzen mit Strohdach, opts { color }
// lifeguard      Rettungsturm (rot-weiß) mit Fahne
// surfboard      aufrecht im Sand steckendes Surfbrett, opts { color }
// sand_castle    Sandburg mit Türmchen
// beach_ball     Wasserball (Mitte = Ursprung, Radius 1) – rollt als Gefahr über die Fahrbahn
// farm_fence     Holzzaun (6 m entlang +X), weiß gestrichen
// rock_pillar    Felssäule (Felsental), teilt die Fahrbahn; opts { h }
// giant_egg      riesiges gepunktetes Ei (Mitte = Ursprung, Radius 1) – rollt durch das Felsental
// igloo          Iglu aus Schneeblöcken
// ice_arch       Eishöhle als Bogen über der Fahrbahn (Durchfahrt entlang X), opts { width, length }
// giant_drum     Riesentrommel (Musikpark), Fell schwingt im Takt
// trumpet        goldene Riesentrompete
// music_note     schwebende Musiknote, opts { color }
// guitar         Riesengitarre (liegt schräg), opts { color }
// torii          rotes Tor (Kirschblüteninsel) über der Fahrbahn, opts { width }
// pagoda         Pagode mit fünf geschwungenen Dächern
// bamboo         Bambusgruppe, wiegt sich
// stone_lantern  Steinlaterne (leuchtet)
// great_wall     Abschnitt der Drachenmauer: Zinnen, Pflaster oben (entlang X), opts { length }
// wall_tower     Wachturm der Mauer mit Pagodendach
// dragon_head    riesiger Drachenkopf als Tunneltor (Durchfahrt entlang X), opts { width }
// hover_car      Schwebeauto der Neonmetropole (fährt im Verkehr mit), opts { color }
// sky_tower      Zukunfts-Hochhaus mit Leuchtringen, opts { h, color }
// gold_pile      Haufen Goldnuggets (glänzt)
// mine_frame     hölzerner Stollenrahmen über der Fahrbahn (Durchfahrt entlang X), opts { width }
// cheese_wedge   Käseecke mit Löchern
// cheese_wheel   Käselaib (Mitte = Ursprung, Radius 1, Achse entlang X) – rollt als Gefahr
// giant_tree     Riesenbaum mit dickem Stamm und breiter Krone (Baumwipfelweg)
// giant_mushroom Riesenpilz, opts { color }
// acacia         Schirmakazie (Abendsteppe)
// elephant       Elefant, trottet (vorn = +X)
// giraffe        Giraffe
// bathtub        riesige Badewanne mit Schaum (Badezimmer)
// rubber_duck    Gummiente (vorn = +X), watschelt
// soap           Seifenstück, opts { color }
// toothbrush     Zahnbürste im Becher
// gear           Zahnrad, dreht sich, opts { r, color, speed }
// clock_face     Zifferblatt mit drehenden Zeigern, opts { r }
// clock_tower    Turm mit Uhr (Stadtrundfahrt)
// tv_tower       Fernsehturm mit Kugel
// room_walls     vier geflieste Wände eines riesigen Raums (Badezimmer), opts { size, h }
// truck          Sattelzug mit Auflieger (Nachtautobahn), vorn = +X, Länge ≈ 10 m, opts { color }

import * as THREE from 'three';
import { Build, mesh, vcol, cached, joint, makeModel, Clock } from '../lib/kit.js';

const { sin } = Math;

/** Kuh: Körper, Kopf mit Hörnern, Euter, vier Beine (laufen), Schwanz. */
function cow(o = {}) {
  const brown = o.color === 'brown';
  const A = brown ? 0x8a5232 : 0xfaf8f2, B = brown ? 0xf4ece0 : 0x1e1c22;
  const spots = (x, y, z) => (sin(x * 5.1 + z * 3.3) + sin(z * 6.7 - x * 2.1 + y * 4) > 0.9 ? B : A);
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached(`rw2:cow:${brown}`, () => {
    const b = new Build();
    b.capsule(0.42, 0.9, spots, { p: [0, 0.95, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 1.05] }, 4, 14);
    b.sphere(0.2, 0xffb0c0, { p: [-0.25, 0.55, 0], s: [1, 0.7, 1] }, 10, 6);   // Euter
    b.cyl(0.03, 0.05, 0.7, A, { p: [-0.92, 0.85, 0], r: [0, 0, -0.35] }, 6);    // Schwanz
    b.sphere(0.08, B, { p: [-1.05, 0.52, 0] }, 6, 4);
    return b.geometry();
  }), vcol(0.75), {}, true));
  const head = joint([0.78, 1.2, 0]);
  head.add(mesh(cached(`rw2:cowhead:${brown}`, () => {
    const b = new Build();
    b.box(0.5, 0.42, 0.38, A, { p: [0.18, 0, 0] }, 0.14);
    b.box(0.22, 0.26, 0.4, 0xf4b8b0, { p: [0.45, -0.08, 0] }, 0.1);   // Maul
    for (const s of [1, -1]) {
      b.cone(0.05, 0.22, 0xf2ead0, { p: [0.08, 0.27, s * 0.16], r: [s * 0.5, 0, 0] }, 6);   // Hörner
      b.box(0.08, 0.1, 0.22, B, { p: [0.04, 0.12, s * 0.27], r: [s * 0.4, 0, 0] }, 0.03); // Ohren
      b.sphere(0.05, 0x1a1a1a, { p: [0.32, 0.08, s * 0.16] }, 6, 4);                        // Augen
    }
    b.cyl(0.06, 0.06, 0.08, 0xffc21a, { p: [-0.05, -0.28, 0] }, 8);   // Glocke
    return b.geometry();
  }), vcol(0.7), {}, true));
  body.add(head);
  const legG = cached('rw2:cowleg', () => new Build().cyl(0.09, 0.08, 0.6, A, { p: [0, -0.3, 0] }, 8).cyl(0.1, 0.1, 0.1, 0x3a2a22, { p: [0, -0.62, 0] }, 8).geometry());
  const legs = [[0.5, 0.2], [0.5, -0.2], [-0.5, 0.2], [-0.5, -0.2]].map(([x, z], i) => { const j = joint([x, 0.68, z], mesh(legG, vcol(0.75))); body.add(j); return [j, i]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('cow', root, (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.2, 0.4, 1.2); return; }
    body.scale.setScalar(1);
    if (anim === 'walk') {
      const ph = clk.t * 5;
      for (const [j, i] of legs) j.rotation.z = sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45;
      body.position.y = Math.abs(sin(ph)) * 0.05;
      head.rotation.z = sin(ph * 0.5) * 0.08;
    } else {
      for (const [j] of legs) j.rotation.z = 0;
      head.rotation.z = -0.5 + sin(clk.t * 0.8) * 0.15;   // grasen
    }
  });
}

/** Rote Scheune mit Mansarddach, weißen Kanten und großem Tor (vorn = +X). */
function barn() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:barn', () => {
    const b = new Build();
    const R = 0xb8282a, W = 0xfaf6ee;
    b.box(12, 7, 16, R, { p: [0, 3.5, 0] }, 0.1);
    // Mansarddach: zwei Neigungen je Seite
    for (const s of [1, -1]) {
      b.add(new THREE.BoxGeometry(3.9, 0.4, 16.6), 0x5a3a32, { p: [s * 5.0, 8.6, 0], r: [0, 0, -s * 1.0] });
      b.add(new THREE.BoxGeometry(4.6, 0.4, 16.6), 0x6a4238, { p: [s * 1.95, 10.9, 0], r: [0, 0, -s * 0.36] });
    }
    // Giebel vorn und hinten
    for (const x of [5.95, -5.95]) {
      const sh = new THREE.Shape();
      sh.moveTo(-6, 0); sh.lineTo(6, 0); sh.lineTo(3.9, 3.4); sh.lineTo(0, 4.6); sh.lineTo(-3.9, 3.4); sh.lineTo(-6, 0);
      b.extrude(sh, 0.3, R, { p: [x, 7, 0], r: [0, Math.PI / 2, 0] });
    }
    b.box(0.25, 5, 5.2, W, { p: [6.1, 2.6, 0] }, 0.05);
    b.box(0.3, 4.6, 4.6, 0x8a1a1c, { p: [6.15, 2.4, 0] }, 0.05);
    for (const s of [1, -1]) b.box(0.32, 0.25, 6.4, W, { p: [6.2, 2.4, 0], r: [s * 0.78, 0, 0] }, 0.02);
    b.box(0.3, 1.6, 1.6, W, { p: [6.15, 8.4, 0] }, 0.05);
    b.box(0.32, 1.2, 1.2, 0x3a2a22, { p: [6.2, 8.4, 0] }, 0.05);
    for (const z of [8.02, -8.02]) for (const y of [0.2, 6.9]) b.box(12.2, 0.3, 0.1, W, { p: [0, y, z] }, 0.02);
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('barn', root, () => {});
}

function silo() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:silo', () => {
    const b = new Build();
    b.cyl(2.6, 2.6, 15, 0xd8d4cc, { p: [0, 7.5, 0] }, 18);
    for (let k = 1; k < 6; k++) b.torus(2.62, 0.08, 0x9a968e, { p: [0, k * 2.5, 0], r: [Math.PI / 2, 0, 0] }, 4, 24);
    b.dome(2.7, 0x4a7ab8, { p: [0, 15, 0] });
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('silo', root, () => {});
}

function hayBale(o = {}) {
  const R = o.r ?? 1;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:hay:${R}`, () => {
    const b = new Build();
    b.cyl(R, R, R * 1.3, (x, y, z) => (Math.abs(z) > R * 0.6 ? 0xd8b048 : (sin(y * 14 + x * 9) > 0.6 ? 0xc89a38 : 0xe8c45a)), { p: [0, R, 0], r: [Math.PI / 2, 0, 0] }, 20);
    return b.geometry();
  }), vcol(0.95), {}, true));
  return makeModel('hay_bale', root, () => {});
}

function tractor() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:tractor', () => {
    const b = new Build();
    const G = 0x2f9a3a;
    b.box(2.6, 1.1, 1.3, G, { p: [0.6, 1.3, 0] }, 0.2);
    b.box(1.4, 1.4, 1.6, G, { p: [-0.7, 1.7, 0] }, 0.15);
    b.box(1.5, 0.12, 1.8, 0x1a1a22, { p: [-0.7, 3.2, 0] }, 0.04);
    for (const s of [1, -1]) for (const x of [-1.35, -0.05]) b.box(0.08, 1, 0.08, 0x1a1a22, { p: [x, 2.7, s * 0.85] }, 0.02);
    b.cyl(0.08, 0.08, 1.2, 0x3a3a3a, { p: [1.3, 2.3, 0.3] }, 6);
    for (const s of [1, -1]) {
      b.cyl(0.95, 0.95, 0.55, 0x1a1a1a, { p: [-0.9, 0.95, s * 1.0], r: [Math.PI / 2, 0, 0] }, 18);
      b.cyl(0.5, 0.5, 0.58, 0xffc21a, { p: [-0.9, 0.95, s * 1.0], r: [Math.PI / 2, 0, 0] }, 12);
      b.cyl(0.5, 0.5, 0.35, 0x1a1a1a, { p: [1.5, 0.5, s * 0.8], r: [Math.PI / 2, 0, 0] }, 14);
      b.cyl(0.25, 0.25, 0.37, 0xffc21a, { p: [1.5, 0.5, s * 0.8], r: [Math.PI / 2, 0, 0] }, 10);
    }
    return b.geometry();
  }), vcol(0.45), {}, true));
  return makeModel('tractor', root, () => {});
}

/** Krabbe: flacher roter Panzer, Stielaugen, zwei Scheren (klappen beim Laufen), sechs Beinchen. */
function crab(o = {}) {
  const C = o.color ?? 0xe8402a;
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached(`rw2:crab:${C}`, () => {
    const b = new Build();
    b.sphere(0.5, C, { p: [0, 0.4, 0], s: [0.85, 0.45, 1.1] }, 16, 10);
    for (const s of [1, -1]) {
      b.cyl(0.03, 0.03, 0.25, C, { p: [0.3, 0.65, s * 0.14] }, 6);
      b.sphere(0.07, 0xffffff, { p: [0.3, 0.8, s * 0.14] }, 8, 6);
      b.sphere(0.035, 0x1a1a1a, { p: [0.35, 0.82, s * 0.14] }, 6, 4);
      for (let k = 0; k < 3; k++) b.cyl(0.03, 0.025, 0.5, C, { p: [-0.15 + k * 0.15, 0.25, s * 0.55], r: [s * 0.9, 0, 0] }, 5);
    }
    return b.geometry();
  }), vcol(0.45), {}, true));
  const clawG = cached(`rw2:claw:${C}`, () => new Build().sphere(0.18, C, { p: [0.2, 0, 0], s: [1.3, 0.9, 0.8] }, 10, 8).cone(0.08, 0.25, C, { p: [0.45, 0.06, 0], r: [0, 0, -Math.PI / 2] }, 6).geometry());
  const claws = [1, -1].map((s) => { const j = joint([0.35, 0.45, s * 0.42], mesh(clawG, vcol(0.45))); body.add(j); return [j, s]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('crab', root, (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    body.scale.setScalar(1);
    // Krabben laufen seitwärts: Körper quer zur Laufrichtung drehen
    body.rotation.y = anim === 'walk' ? Math.PI / 2 : 0;
    body.position.y = anim === 'walk' ? Math.abs(sin(clk.t * 10)) * 0.06 : 0;
    for (const [j, s] of claws) j.rotation.y = s * (0.3 + 0.25 * sin(clk.t * 6 + s));
  });
}

function beachHut(o = {}) {
  const C = o.color ?? 0x2fb8c8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:hut:${C}`, () => {
    const b = new Build();
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) b.cyl(0.15, 0.15, 1.6, 0x8a6a42, { p: [x, 0.8, z] }, 6);
    b.box(4, 0.25, 4, 0xb8905a, { p: [0, 1.65, 0] }, 0.05);
    b.box(3.4, 2.4, 3.4, C, { p: [0, 2.95, 0] }, 0.08);
    b.box(0.1, 1.6, 1.2, 0xfaf6ee, { p: [1.72, 2.8, 0] }, 0.03);
    b.cone(3.4, 2.2, 0xd8b868, { p: [0, 5.2, 0] }, 8);
    return b.geometry();
  }), vcol(0.8), {}, true));
  return makeModel('beach_hut', root, () => {});
}

function lifeguard() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:lifeguard', () => {
    const b = new Build();
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(0.1, 0.12, 3.4, 0xfaf6ee, { p: [x * 0.9, 1.7, z * 0.9], r: [z * 0.08, 0, -x * 0.08] }, 6);
    b.box(2.6, 0.2, 2.6, 0xfaf6ee, { p: [0, 3.4, 0] }, 0.04);
    b.box(2.2, 1.8, 2.2, 0xe8392d, { p: [0, 4.4, 0] }, 0.08);
    b.box(0.08, 0.8, 1.6, 0x8acaf0, { p: [1.12, 4.6, 0] }, 0.02);
    b.box(2.8, 0.25, 2.8, 0xfaf6ee, { p: [0, 5.4, 0] }, 0.05);
    b.cyl(0.04, 0.04, 2.4, 0xc8c8c8, { p: [0, 6.6, 0] }, 6);
    b.box(0.04, 0.6, 1, 0xffc21a, { p: [0, 7.5, 0.5] }, 0.01);
    for (let k = 0; k < 5; k++) b.box(0.6, 0.06, 0.8, 0xfaf6ee, { p: [1.6, 0.4 + k * 0.62, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('lifeguard', root, () => {});
}

function surfboard(o = {}) {
  const C = o.color ?? 0xff8a3a;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:surf:${C}`, () => {
    const b = new Build();
    b.sphere(1, (x, y, z) => (Math.abs(z) < 0.08 ? 0xffffff : C), { p: [0, 1.3, 0], s: [0.08, 1.4, 0.36] }, 14, 10);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('surfboard', root, () => {});
}

function sandCastle() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:sandcastle', () => {
    const b = new Build();
    const S = 0xe8cf8a;
    b.box(3, 1.2, 3, S, { p: [0, 0.6, 0] }, 0.15);
    for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { b.cyl(0.5, 0.6, 2, S, { p: [x, 1, z] }, 10); b.cone(0.55, 0.7, 0xd8bf7a, { p: [x, 2.35, z] }, 10); }
    b.cyl(0.8, 0.9, 2.6, S, { p: [0, 2.3, 0] }, 12);
    b.cone(0.9, 1, 0xd8bf7a, { p: [0, 4.1, 0] }, 12);
    b.box(0.04, 0.4, 0.5, 0xe8392d, { p: [0, 4.9, 0.25] }, 0.01);
    b.cyl(0.02, 0.02, 0.8, 0xfaf6ee, { p: [0, 4.8, 0] }, 4);
    return b.geometry();
  }), vcol(0.95), {}, true));
  return makeModel('sand_castle', root, () => {});
}

/** Wasserball: sechs bunte Segmente, Mitte im Ursprung, Radius 1; dreht sich beim Rollen. */
function beachBall() {
  const root = new THREE.Group();
  const cols = [0xe8392d, 0xfaf6ee, 0x2a7ae8, 0xfaf6ee, 0xffc21a, 0xfaf6ee];
  const ball = mesh(cached('rw2:beachball', () => new Build().sphere(1, (x, y, z) => (Math.abs(y) > 0.93 ? 0xffffff : cols[Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 6) % 6]), {}, 24, 16).geometry()), vcol(0.25), {}, true);
  root.add(ball);
  return makeModel('beach_ball', root, (dt, st) => { if (st.anim === 'roll') ball.rotation.x += dt * 3; });
}

function farmFence() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:fence', () => {
    const b = new Build();
    for (const x of [-3, 0, 3]) b.box(0.18, 1.3, 0.18, 0xfaf6ee, { p: [x, 0.65, 0] }, 0.03);
    for (const y of [0.5, 1.0]) b.box(6.1, 0.14, 0.08, 0xfaf6ee, { p: [0, y, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.7), {}, false));
  return makeModel('farm_fence', root, () => {});
}

/** Sattelzug: Zugmaschine vorn (+X), langer Auflieger, Lampen vorn und hinten. */
function truck(o = {}) {
  const C = o.color ?? 0x2a5ae8;
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached(`rw2:truck:${C}`, () => {
    const b = new Build();
    b.box(2.2, 2.6, 2.3, C, { p: [3.9, 1.9, 0] }, 0.25);
    b.box(0.05, 1, 2, 0x2a3a5a, { p: [5.02, 2.5, 0] }, 0.02);
    b.box(0.2, 0.6, 2.3, 0xc8c8d0, { p: [5.05, 1.1, 0] }, 0.05);
    b.box(7.2, 3, 2.4, o.trailer ?? 0xf4f2ee, { p: [-0.9, 2.3, 0] }, 0.08);
    b.box(7.2, 0.4, 2.2, 0x3a3a44, { p: [-0.9, 0.6, 0] }, 0.05);
    for (const [x, s] of [[4, 1], [4, -1], [1.5, 1], [1.5, -1], [-3.4, 1], [-3.4, -1], [-2.4, 1], [-2.4, -1]]) {
      b.cyl(0.5, 0.5, 0.4, 0x1a1a22, { p: [x, 0.5, s * 1.0], r: [Math.PI / 2, 0, 0] }, 14);
      b.cyl(0.26, 0.26, 0.42, 0xc8c8d0, { p: [x, 0.5, s * 1.0], r: [Math.PI / 2, 0, 0] }, 10);
    }
    for (const s of [1, -1]) b.box(0.08, 0.3, 0.45, 0xfff4c8, { p: [5.05, 1.25, s * 0.8] }, 0.02);
    for (const s of [1, -1]) b.box(0.08, 0.3, 0.4, 0xe8202a, { p: [-4.52, 1.2, s * 0.9] }, 0.02);
    return b.geometry();
  }), vcol(0.35), {}, true));
  root.add(body);
  return makeModel('truck', root, (dt, st) => { body.scale.set(1, st.anim === 'squashed' ? 0.5 : 1, 1); });
}

/** Felssäule: unregelmäßige Steinblöcke übereinander, Moos oben. */
function rockPillar(o = {}) {
  const H = o.h ?? 12;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:pillar:${H}`, () => {
    const b = new Build();
    let y = 0;
    for (let k = 0; y < H; k++) {
      const h = 2.4 + (k % 3) * 0.8, r = 2.4 - k * 0.12 + (k % 2) * 0.3;
      b.add(new THREE.DodecahedronGeometry(1, 0), k % 2 ? 0x8a8078 : 0x9a9088, { p: [sin(k * 2.1) * 0.3, y + h / 2, 0], s: [r, h * 0.62, r * 0.9], r: [0, k * 1.3, 0] });
      y += h * 0.85;
    }
    b.add(new THREE.DodecahedronGeometry(1, 0), 0x5a9a3a, { p: [0, y + 0.2, 0], s: [1.8, 0.6, 1.6] });
    return b.geometry();
  }), vcol(0.95), {}, true));
  return makeModel('rock_pillar', root, () => {});
}

function giantEgg(o = {}) {
  const C = o.color ?? 0x4fb833;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:egg:${C}`, () => new Build().sphere(1, (x, y, z) => (sin(x * 7) * sin(y * 7) * sin(z * 7) > 0.25 ? C : 0xfaf8f2), { s: [0.85, 1, 0.85] }, 22, 16).geometry()), vcol(0.35), {}, true));
  const egg = root.children[0];
  return makeModel('giant_egg', root, (dt, st) => { if (st.anim === 'roll') egg.rotation.x += dt * 2.5; });
}

function igloo() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:igloo', () => {
    const b = new Build();
    b.dome(4, (x, y, z) => (Math.floor(y * 1.6) % 2 ? 0xf4f8fc : 0xe2ecf6), { p: [0, 0, 0] }, Math.PI / 2, 20, 10);
    b.cyl(1.4, 1.4, 2.6, 0xeef4fa, { p: [4, 1.1, 0], r: [0, 0, Math.PI / 2] }, 14);
    b.cyl(1.0, 1.0, 2.7, 0x2a3a4a, { p: [4.1, 1.0, 0], r: [0, 0, Math.PI / 2] }, 14);
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('igloo', root, () => {});
}

/** Eishöhle: Gewölbe aus blauem Eis über der Fahrbahn (Halbröhre entlang X), Eisrippen, Eiszapfen an der Decke. */
function iceArch(o = {}) {
  const W = o.width ?? 20, L = o.length ?? 30;
  const R = W / 2 + 1.5;
  const root = new THREE.Group();
  const shell = mesh(cached(`rw2:iceshell:${W}:${L}`, () => {
    const g = new THREE.CylinderGeometry(R, R, L, 28, 6, true, -Math.PI / 2, Math.PI);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 0.8, 1);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const n = 1 + 0.05 * Math.sin(x * 0.7 + z * 0.9); P.setY(i, y * n); P.setZ(i, z * n); }
    g.computeVertexNormals();
    return g;
  }), cachedIce(), {}, false);
  root.add(shell);
  root.add(mesh(cached(`rw2:icerib:${W}:${L}`, () => {
    const b = new Build();
    for (let x = -L / 2; x <= L / 2 + 0.01; x += L / 4) b.torus(R, 0.7, 0x9ad4f4, { p: [x, 0, 0], r: [0, Math.PI / 2, 0], s: [1, 0.8, 1] }, 6, 20, Math.PI);
    for (let x = -L / 2 + 2; x < L / 2; x += 3.3) for (let k = 0; k < 3; k++) b.cone(0.35, 1.6 + ((x + k) % 2 ? 0.8 : 0), 0xe4f6ff, { p: [x, R * 0.8 - 1, (k - 1) * W * 0.25], r: [Math.PI, 0, 0] }, 6);
    return b.geometry();
  }), vcol(0.2, { emissive: 0x1a3a5a }, 'icerib'), {}, false));
  return makeModel('ice_arch', root, () => {});
}
let ICE_MAT = null;
const cachedIce = () => (ICE_MAT ??= new THREE.MeshStandardMaterial({ color: 0xa8dcf8, emissive: 0x1a4a6a, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));

function giantDrum(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:drum:${C}`, () => {
    const b = new Build();
    b.cyl(4, 4, 4.4, C, { p: [0, 2.2, 0] }, 24);
    for (const y of [0.2, 4.2]) b.torus(4.05, 0.25, 0xffc21a, { p: [0, y, 0], r: [Math.PI / 2, 0, 0] }, 6, 28);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.box(0.12, 4, 0.12, 0xfaf6ee, { p: [Math.cos(a) * 4.05, 2.2, Math.sin(a) * 4.05], r: [0, 0, k % 2 ? 0.3 : -0.3] }, 0.02); }
    return b.geometry();
  }), vcol(0.35), {}, true));
  const skin = new THREE.Mesh(new THREE.CircleGeometry(3.9, 28), new THREE.MeshStandardMaterial({ color: 0xfaf4e4, roughness: 0.6 }));
  skin.rotation.x = -Math.PI / 2; skin.position.y = 4.42; root.add(skin);
  let t = Math.random() * 3;
  return makeModel('giant_drum', root, (dt) => { t += dt; skin.position.y = 4.42 + Math.max(0, Math.sin(t * 8)) * 0.12; }, [skin.geometry, skin.material]);
}

function trumpet() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:trumpet', () => {
    const b = new Build();
    const G = 0xffc21a;
    b.cyl(0.5, 0.5, 12, G, { p: [0, 0, 0], r: [0, 0, Math.PI / 2] }, 12);
    b.lathe([[0.5, 0], [0.7, 1.5], [1.4, 3], [3, 4.2], [3.2, 4.3]], G, { p: [6, 0, 0], r: [0, 0, -Math.PI / 2] }, 24);
    b.torus(1.6, 0.4, G, { p: [-1, -1.8, 0], r: [0, 0, 0] }, 8, 20);
    for (const x of [-1, 0, 1]) { b.cyl(0.35, 0.35, 1.8, G, { p: [x, 1.2, 0] }, 10); b.cyl(0.45, 0.45, 0.3, 0xfaf6ee, { p: [x, 2.2, 0] }, 10); }
    b.cyl(0.5, 0.35, 1.2, G, { p: [-6.4, 0, 0], r: [0, 0, Math.PI / 2] }, 10);
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.7, roughness: 0.25 }), {}, true));
  return makeModel('trumpet', root, () => {});
}

function musicNote(o = {}) {
  const C = o.color ?? 0x3a2aff;
  const root = new THREE.Group();
  const note = mesh(cached(`rw2:note:${C}`, () => {
    const b = new Build();
    b.sphere(1, C, { p: [0, 0, 0], s: [1.3, 0.9, 0.6], r: [0, 0, 0.4] }, 16, 10);
    b.box(0.25, 5, 0.25, C, { p: [1.1, 2.4, 0] }, 0.05);
    b.box(1.8, 0.6, 0.25, C, { p: [1.9, 4.6, 0], r: [0, 0, -0.4] }, 0.1);
    return b.geometry();
  }), vcol(0.3, { emissive: 0x111133 }, 'note'), {}, true);
  root.add(note);
  let t = Math.random() * 6;
  return makeModel('music_note', root, (dt) => { t += dt; note.position.y = 3 + Math.sin(t * 1.5) * 0.8; note.rotation.y = Math.sin(t * 0.7) * 0.6; });
}

function guitar(o = {}) {
  const C = o.color ?? 0xe86a2a;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:guitar:${C}`, () => {
    const b = new Build();
    b.sphere(4, C, { p: [0, 0, 0], s: [1, 1, 0.3] }, 22, 12);
    b.sphere(3, C, { p: [4.6, 0, 0], s: [1, 0.9, 0.3] }, 20, 12);
    b.cyl(1.3, 1.3, 0.3, 0x2a1a12, { p: [3.4, 0, 1.2], r: [Math.PI / 2, 0, 0] }, 20);
    b.box(11, 1.2, 0.6, 0x5a3a22, { p: [11, 0, 0.6] }, 0.1);
    b.box(2.4, 1.8, 0.6, 0x3a2418, { p: [17.5, 0, 0.6] }, 0.2);
    for (let k = 0; k < 6; k++) b.box(16, 0.06, 0.06, 0xe8e8e8, { p: [9, (k - 2.5) * 0.18, 1.3] }, 0.01);
    return b.geometry();
  }), vcol(0.35), {}, true));
  return makeModel('guitar', root, () => {});
}

function torii(o = {}) {
  const W = o.width ?? 20;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:torii:${W}`, () => {
    const b = new Build();
    const R = 0xd8281e;
    for (const s of [1, -1]) { b.cyl(0.6, 0.7, 10, R, { p: [0, 5, s * W / 2] }, 12); b.cyl(0.85, 0.85, 1, 0x1a1a1a, { p: [0, 0.5, s * W / 2] }, 12); }
    b.box(1.2, 0.9, W + 3, R, { p: [0, 8.2, 0] }, 0.1);
    b.box(1.6, 0.6, W + 6, 0x1a1a1a, { p: [0, 10.1, 0] }, 0.1);
    for (const s of [1, -1]) b.box(1.6, 0.6, 2.2, 0x1a1a1a, { p: [0, 10.4, s * (W / 2 + 3.4)], r: [s * 0.25, 0, 0] }, 0.1);
    b.box(0.5, 1.4, 1.6, R, { p: [0, 9.1, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.45), {}, true));
  return makeModel('torii', root, () => {});
}

function pagoda() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:pagoda', () => {
    const b = new Build();
    let y = 0;
    for (let k = 0; k < 5; k++) {
      const w = 9 - k * 1.3, h = 3.2;
      b.box(w, h, w, 0xf4ead8, { p: [0, y + h / 2, 0] }, 0.05);
      for (let q = 0; q < 4; q++) b.box(0.4, h, 0.4, 0xc82a1e, { p: [Math.cos(q * Math.PI / 2 + 0.78) * w * 0.68, y + h / 2, Math.sin(q * Math.PI / 2 + 0.78) * w * 0.68] }, 0.02);
      b.add(new THREE.ConeGeometry(w * 0.95, 2.2, 4, 1, true), 0x2a3a4a, { p: [0, y + h + 0.9, 0], r: [0, Math.PI / 4, 0] });
      b.add(new THREE.ConeGeometry(w * 0.95, 2.2, 4), 0x2a3a4a, { p: [0, y + h + 0.9, 0], r: [0, Math.PI / 4, 0] });
      y += h + 1.6;
    }
    b.cyl(0.2, 0.2, 5, 0xffc21a, { p: [0, y + 2, 0] }, 6);
    for (let k = 0; k < 5; k++) b.torus(0.5, 0.1, 0xffc21a, { p: [0, y + 0.6 + k * 0.8, 0], r: [Math.PI / 2, 0, 0] }, 4, 12);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('pagoda', root, () => {});
}

function bamboo() {
  const root = new THREE.Group();
  const stalks = [];
  for (let k = 0; k < 7; k++) {
    const h = 9 + (k % 3) * 2.5;
    const g = mesh(cached(`rw2:bamboo:${h}`, () => {
      const b = new Build();
      for (let y = 0; y < h; y += 1.5) { b.cyl(0.16, 0.18, 1.45, 0x6aaa3a, { p: [0, y + 0.72, 0] }, 7); b.cyl(0.2, 0.2, 0.12, 0x8ac04a, { p: [0, y + 1.47, 0] }, 7); }
      for (let q = 0; q < 4; q++) b.box(1.6, 0.04, 0.3, 0x4f9a2a, { p: [0.7, h - q * 1.2, 0], r: [0, q * 1.6, -0.4] }, 0.01);
      return b.geometry();
    }), vcol(0.6), {}, false);
    g.position.set(Math.cos(k * 2.4) * 1.4, 0, Math.sin(k * 2.4) * 1.4);
    root.add(g); stalks.push(g);
  }
  let t = Math.random() * 5;
  return makeModel('bamboo', root, (dt) => { t += dt; stalks.forEach((g, k) => { g.rotation.z = Math.sin(t * 0.9 + k) * 0.03; }); });
}

function stoneLantern() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:stonelantern', () => {
    const b = new Build();
    const S = 0x9a968e;
    b.box(1.4, 0.4, 1.4, S, { p: [0, 0.2, 0] }, 0.05);
    b.cyl(0.25, 0.3, 1.6, S, { p: [0, 1.2, 0] }, 8);
    b.box(1.2, 0.3, 1.2, S, { p: [0, 2.1, 0] }, 0.05);
    for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) b.box(0.15, 0.8, 0.15, S, { p: [x, 2.65, z] }, 0.02);
    b.cone(1.1, 0.8, S, { p: [0, 3.45, 0], r: [0, Math.PI / 4, 0] }, 4);
    b.sphere(0.2, S, { p: [0, 3.95, 0] }, 8, 6);
    return b.geometry();
  }), vcol(0.9), {}, true));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.75), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb44a).multiplyScalar(2) }));
  glow.position.y = 2.65; root.add(glow);
  return makeModel('stone_lantern', root, () => {}, [glow.geometry, glow.material]);
}

function greatWall(o = {}) {
  const L = o.length ?? 30;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:wall:${L}`, () => {
    const b = new Build();
    b.box(L, 6, 4, 0x9a8a72, { p: [0, 3, 0] }, 0.1);
    for (let x = -L / 2 + 1; x < L / 2; x += 2) b.box(1, 1.2, 0.6, 0x8a7a62, { p: [x, 6.6, 1.7] }, 0.05);
    for (let x = -L / 2; x < L / 2; x += 3) b.box(2.9, 0.08, 3.9, (x / 3) % 2 ? 0xa8987e : 0xb4a488, { p: [x + 1.5, 6.03, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('great_wall', root, () => {});
}

function wallTower() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:walltower', () => {
    const b = new Build();
    b.box(9, 10, 9, 0x9a8a72, { p: [0, 5, 0] }, 0.1);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(1, 1.2, 1, 0x8a7a62, { p: [Math.cos(a) * 4.3, 10.6, Math.sin(a) * 4.3] }, 0.05); }
    b.box(6, 4, 6, 0xc82a1e, { p: [0, 12, 0] }, 0.05);
    b.add(new THREE.ConeGeometry(6.4, 3, 4), 0x2a4a3a, { p: [0, 15.5, 0], r: [0, Math.PI / 4, 0] });
    for (const s of [1, -1]) b.box(0.2, 2, 2, 0x3a2a1a, { p: [s * 3.05, 12, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('wall_tower', root, () => {});
}

/** Drachenkopf als Tunneltor: die Karts fahren (in +X) durch das offene Maul; Schnauze, Zähne, gelbe Augen, Hörner
 *  und rote Mähne. */
function dragonHead(o = {}) {
  const W = o.width ?? 20;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:dhead:${W}`, () => {
    const b = new Build();
    const G = 0x2a9a4a, G2 = 0x1f7a3a, Y = 0xffd23a, RED = 0xd8281e, T = 0xfaf6ee;
    const R = W / 2 + 2;
    // Oberkiefer als Gewölbe über der Fahrbahn, Unterkiefer als Wülste an den Seiten
    for (let x = -6; x <= 6; x += 2) for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI; b.box(2.2, 2.4, 2.6, (k + x) % 2 ? G : G2, { p: [x, Math.sin(a) * R * 0.85 + 0.6, Math.cos(a) * R], r: [a - Math.PI / 2, 0, 0] }, 0.4); }
    for (const s of [1, -1]) b.box(16, 2.2, 3, G2, { p: [0, 1.1, s * (R + 0.5)] }, 0.5);
    // Schnauze nach vorn (den ankommenden Karts entgegen), Nasenlöcher
    b.box(10, R * 0.5, R * 1.6, G, { p: [-9, R * 0.85, 0] }, 1.5);
    for (const s of [1, -1]) b.sphere(0.8, 0x1a3a22, { p: [-14, R * 0.95, s * 2.2] }, 8, 6);
    // Zähne am Rand des Mauls
    for (let k = 1; k < 12; k++) { const a = (k / 12) * Math.PI; b.cone(0.5, 1.6, T, { p: [-7, Math.sin(a) * R * 0.85 - 0.6, Math.cos(a) * (R - 0.6)], r: [a - Math.PI / 2 + Math.PI, 0, 0] }, 6); }
    // Kopf, Augen mit Brauen, Hörner nach hinten, rote Mähne
    b.sphere(R * 0.62, G, { p: [2, R * 1.05, 0], s: [1.4, 0.75, 1] }, 20, 12);
    for (const s of [1, -1]) {
      b.sphere(1.5, Y, { p: [-3, R * 1.2, s * R * 0.42] }, 12, 8);
      b.sphere(0.7, 0x1a1a1a, { p: [-4.2, R * 1.2, s * R * 0.42] }, 8, 6);
      b.box(4, 0.8, 1.4, G2, { p: [-3, R * 1.2 + 1.8, s * R * 0.42], r: [s * 0.3, 0, 0.2] }, 0.2);
      b.cone(1, 9, Y, { p: [8, R * 1.3 + 2, s * R * 0.35], r: [s * 0.3, 0, -1.2] }, 8);
      b.cone(0.6, 5, RED, { p: [-12, R * 0.7, s * (R * 0.8 + 1)], r: [s * 1.2, 0, 0] }, 6);   // Barteln
    }
    for (let k = 0; k < 6; k++) b.cone(1.1, 3.4, RED, { p: [4 + k * 2.2, R * 1.45 - k * 0.3, 0], r: [0, 0, -0.5] }, 6);
    return b.geometry();
  }), vcol(0.45), {}, true));
  return makeModel('dragon_head', root, () => {});
}

function hoverCar(o = {}) {
  const C = o.color ?? 0x3ad8ff;
  const root = new THREE.Group();
  const body = joint([0, 0.6, 0]);
  body.add(mesh(cached(`rw2:hover:${C}`, () => {
    const b = new Build();
    b.sphere(1, 0xe8eef6, { p: [0, 0.5, 0], s: [2.3, 0.5, 1] }, 18, 10);
    b.sphere(0.9, 0x2a3a5a, { p: [0.2, 0.85, 0], s: [1.2, 0.55, 0.85] }, 14, 8);
    for (const s of [1, -1]) b.box(3.6, 0.15, 0.2, C, { p: [0, 0.45, s * 0.98] }, 0.05);
    b.box(0.1, 0.18, 1.4, C, { p: [2.25, 0.5, 0] }, 0.03);
    return b.geometry();
  }), vcol(0.25), {}, true));
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(C).multiplyScalar(2), transparent: true, opacity: 0.7 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; glow.scale.set(1.8, 1, 1); root.add(glow);
  root.add(body);
  let t = Math.random() * 5;
  return makeModel('hover_car', root, (dt, st) => { t += dt; body.position.y = 0.6 + Math.sin(t * 3) * 0.12; body.scale.y = st.anim === 'squashed' ? 0.5 : 1; }, [glow.geometry, glow.material]);
}

function skyTower(o = {}) {
  const H = o.h ?? 60, C = o.color ?? 0x3ad8ff;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:skytower:${H}`, () => {
    const b = new Build();
    b.cyl(5, 7, H, 0x2a3048, { p: [0, H / 2, 0] }, 8);
    b.cyl(7.5, 5, 6, 0x343a58, { p: [0, H + 3, 0] }, 8);
    b.cone(3, 10, 0x343a58, { p: [0, H + 11, 0] }, 8);
    return b.geometry();
  }), vcol(0.3), {}, true));
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C).multiplyScalar(2.2) });
  const own = [mat];
  for (let k = 1; k < 6; k++) {
    const g = new THREE.TorusGeometry(7 - (k / 6) * 1.8 + 0.3, 0.25, 6, 24); own.push(g);
    const m = new THREE.Mesh(g, mat); m.rotation.x = Math.PI / 2; m.position.y = (H * k) / 6; root.add(m);
  }
  return makeModel('sky_tower', root, () => {}, own);
}

function goldPile() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:gold', () => {
    const b = new Build();
    for (let k = 0; k < 14; k++) b.add(new THREE.DodecahedronGeometry(0.5 + (k % 3) * 0.2, 0), k % 3 ? 0xffc21a : 0xffd85a, { p: [Math.cos(k * 2.4) * (k * 0.12), 0.3 + (14 - k) * 0.08, Math.sin(k * 2.4) * (k * 0.12)] });
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.8, roughness: 0.25, emissive: 0x3a2a00 }), {}, true));
  return makeModel('gold_pile', root, () => {});
}

function mineFrame(o = {}) {
  const W = o.width ?? 18;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:mineframe:${W}`, () => {
    const b = new Build();
    const Wd = 0x7a5232;
    for (const s of [1, -1]) b.box(0.8, 9, 0.8, Wd, { p: [0, 4.5, s * W / 2] }, 0.05);
    b.box(1, 1, W + 2, Wd, { p: [0, 9.3, 0] }, 0.05);
    for (const s of [1, -1]) b.box(0.5, 3, 0.5, Wd, { p: [0, 8, s * (W / 2 - 1.2)], r: [s * 0.8, 0, 0] }, 0.03);
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('mine_frame', root, () => {});
}

function cheeseWedge() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:wedge', () => {
    const b = new Build();
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(8, 0); sh.lineTo(0, 5); sh.lineTo(0, 0);
    b.extrude(sh, 6, 0xffcf3a, { p: [-3, 0, 0] }, 0.3);
    for (const [x, y, z, r] of [[-1, 1.5, 3.05, 0.8], [1.5, 1, 3.05, 0.5], [-2, 3, -3.05, 0.6], [0.5, 1.6, -3.05, 0.9], [-2.6, 1.2, 0, 0.7]]) b.sphere(r, 0xe8a82a, { p: [x, y, z], s: [1, 1, 0.3] }, 10, 6);
    b.box(8.2, 0.3, 6.2, 0xffe08a, { p: [1, 0.15, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('cheese_wedge', root, () => {});
}

function cheeseWheel() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:wheel', () => {
    const b = new Build();
    b.cyl(1, 1, 0.9, (x, y, z) => (Math.abs(y) > 0.4 ? 0xffd85a : 0xf0a82a), { r: [0, 0, Math.PI / 2] }, 24);
    for (let k = 0; k < 5; k++) b.sphere(0.12, 0xd89a2a, { p: [0.46, Math.cos(k * 1.3) * 0.6, Math.sin(k * 1.3) * 0.6], s: [0.3, 1, 1] }, 6, 4);
    return b.geometry();
  }), vcol(0.45), {}, true));
  return makeModel('cheese_wheel', root, () => {});
}

function giantTree() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:gtree', () => {
    const b = new Build();
    b.cyl(2.2, 3.4, 30, 0x7a5232, { p: [0, 15, 0] }, 12);
    for (let k = 0; k < 5; k++) { const a = k * 1.26; b.cyl(0.5, 1.2, 4, 0x6a4428, { p: [Math.cos(a) * 3, 1, Math.sin(a) * 3], r: [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6] }, 6); }
    for (let k = 0; k < 7; k++) { const a = k * 0.9; b.sphere(7 + (k % 3), k % 2 ? 0x3f9a2a : 0x4fae34, { p: [Math.cos(a) * 6, 32 + (k % 3) * 2, Math.sin(a) * 6], s: [1, 0.6, 1] }, 12, 8); }
    b.sphere(9, 0x4fb833, { p: [0, 37, 0], s: [1, 0.6, 1] }, 14, 8);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('giant_tree', root, () => {});
}

function giantMushroom(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:gmush:${C}`, () => {
    const b = new Build();
    b.cyl(1.4, 1.8, 10, 0xfaf0dc, { p: [0, 5, 0] }, 12);
    b.dome(6, (x, y, z) => (Math.sin(x * 1.1) * Math.sin(z * 1.1) > 0.55 ? 0xffffff : C), { p: [0, 9.5, 0], s: [1, 0.6, 1] });
    b.cyl(6, 6, 0.4, 0xf4e4c8, { p: [0, 9.5, 0] }, 24);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('giant_mushroom', root, () => {});
}

function acacia() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:acacia', () => {
    const b = new Build();
    b.cyl(0.35, 0.55, 6, 0x6a4a32, { p: [0, 3, 0], r: [0, 0, 0.12] }, 8);
    for (const s of [1, -1]) b.cyl(0.2, 0.3, 3.4, 0x6a4a32, { p: [s * 1.2 + 0.4, 6.8, 0], r: [0, 0, -s * 0.7] }, 6);
    b.sphere(5, 0x6a9a3a, { p: [0.4, 8.6, 0], s: [1, 0.25, 0.8] }, 16, 8);
    b.sphere(3.4, 0x7aaa42, { p: [2.4, 8.9, 1], s: [1, 0.3, 1] }, 12, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('acacia', root, () => {});
}

function elephant() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  const G = 0x8a8a96;
  body.add(mesh(cached('rw2:elephant', () => {
    const b = new Build();
    b.sphere(1, G, { p: [0, 2.4, 0], s: [2, 1.4, 1.3] }, 16, 10);
    b.sphere(1, G, { p: [2.1, 3, 0], s: [0.9, 0.9, 0.85] }, 14, 10);
    b.tube([[2.8, 2.8, 0], [3.4, 1.8, 0], [3.5, 0.8, 0], [3.8, 0.4, 0]], 0.25, G, {}, 12, 8);
    for (const s of [1, -1]) {
      b.sphere(1, 0x9a9aa8, { p: [1.8, 3.1, s * 0.95], s: [0.15, 1.1, 0.9] }, 10, 8);
      b.cone(0.12, 1, 0xfaf6ee, { p: [2.9, 2.2, s * 0.35], r: [0, 0, -2] }, 6);
      b.sphere(0.12, 0x1a1a1a, { p: [2.7, 3.3, s * 0.55] }, 6, 4);
    }
    b.cyl(0.05, 0.05, 1, G, { p: [-2.1, 2.2, 0], r: [0, 0, -0.5] }, 4);
    return b.geometry();
  }), vcol(0.8), {}, true));
  const legG = cached('rw2:eleg', () => new Build().cyl(0.42, 0.45, 1.8, G, { p: [0, -0.9, 0] }, 10).geometry());
  const legs = [[1.1, 0.6], [1.1, -0.6], [-1.1, 0.6], [-1.1, -0.6]].map(([x, z], i) => { const j = joint([x, 1.8, z], mesh(legG, vcol(0.8))); body.add(j); return [j, i]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('elephant', root, (dt, st) => {
    const anim = st.anim ?? 'idle'; clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.1, 0.6, 1.1); return; }
    body.scale.setScalar(1);
    const w = anim === 'walk' ? 1 : 0;
    for (const [j, i] of legs) j.rotation.z = w * sin(clk.t * 3 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.3;
  });
}

function giraffe() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:giraffe', () => {
    const b = new Build();
    const spot = (x, y, z) => (sin(x * 6) * sin(y * 6) * sin(z * 6 + 1) > 0.15 ? 0xa8642a : 0xf4c86a);
    b.sphere(1, spot, { p: [0, 3.6, 0], s: [1.4, 0.8, 0.7] }, 14, 10);
    b.cyl(0.25, 0.4, 4, spot, { p: [1.3, 5.8, 0], r: [0, 0, -0.35] }, 8);
    b.box(1.3, 0.6, 0.55, 0xf4c86a, { p: [2.2, 7.8, 0] }, 0.2);
    for (const s of [1, -1]) { b.cyl(0.06, 0.06, 0.5, 0x6a4a2a, { p: [2, 8.3, s * 0.15] }, 4); b.sphere(0.08, 0x1a1a1a, { p: [2.5, 7.95, s * 0.28] }, 6, 4); }
    for (const [x, z] of [[0.8, 0.4], [0.8, -0.4], [-0.8, 0.4], [-0.8, -0.4]]) b.cyl(0.13, 0.13, 3.2, 0xf4c86a, { p: [x, 1.6, z] }, 6);
    return b.geometry();
  }), vcol(0.8), {}, true));
  return makeModel('giraffe', root, () => {});
}

function bathtub() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:tub', () => {
    const b = new Build();
    b.box(40, 14, 18, 0xfaf8f4, { p: [0, 9, 0] }, 4);
    b.box(36, 2, 14, 0x8ad4f4, { p: [0, 15.2, 0] }, 1);
    for (let k = 0; k < 14; k++) b.sphere(2 + (k % 3), 0xffffff, { p: [-16 + k * 2.6, 16.5, Math.sin(k * 1.7) * 4] }, 10, 8);
    for (const [x, z] of [[-17, -7], [17, -7], [-17, 7], [17, 7]]) b.sphere(1.6, 0xd8b84a, { p: [x, 1.4, z], s: [1, 1.4, 1] }, 10, 8);
    b.cyl(0.8, 0.8, 6, 0xc8c8d4, { p: [-21, 19, 0] }, 10);
    b.cyl(0.6, 0.6, 5, 0xc8c8d4, { p: [-19, 22, 0], r: [0, 0, Math.PI / 2] }, 10);
    return b.geometry();
  }), vcol(0.2), {}, true));
  return makeModel('bathtub', root, () => {});
}

function rubberDuck() {
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('rw2:duck', () => {
    const b = new Build();
    b.sphere(1, 0xffd21f, { p: [0, 0.7, 0], s: [1.2, 0.75, 0.9] }, 16, 10);
    b.sphere(0.55, 0xffd21f, { p: [0.75, 1.5, 0] }, 14, 10);
    b.sphere(0.3, 0xff8a1a, { p: [1.25, 1.42, 0], s: [1, 0.45, 0.9] }, 10, 6);
    b.cone(0.3, 0.6, 0xffd21f, { p: [-1.2, 1.1, 0], r: [0, 0, 1.2] }, 8);
    for (const s of [1, -1]) b.sphere(0.09, 0x1a1a1a, { p: [1.1, 1.68, s * 0.25] }, 6, 4);
    return b.geometry();
  }), vcol(0.25), {}, true));
  root.add(body);
  const clk = new Clock();
  return makeModel('rubber_duck', root, (dt, st) => {
    const anim = st.anim ?? 'idle'; clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.2, 0.5, 1.2); return; }
    body.scale.setScalar(1);
    body.rotation.x = sin(clk.t * (anim === 'walk' ? 8 : 2)) * 0.15;
  });
}

function soap(o = {}) {
  const C = o.color ?? 0xff9ac8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:soap:${C}`, () => new Build().box(6, 2.2, 3.6, C, { p: [0, 1.1, 0] }, 1).geometry()), vcol(0.15), {}, true));
  return makeModel('soap', root, () => {});
}

function toothbrush() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:brush', () => {
    const b = new Build();
    b.cyl(2.2, 1.8, 6, 0x8ad4f4, { p: [0, 3, 0] }, 16, true);
    b.cyl(0.35, 0.35, 14, 0x3a8ae8, { p: [0.6, 9, 0], r: [0, 0, -0.12] }, 8);
    b.box(0.8, 2.6, 1, 0xfaf8f4, { p: [-0.2, 15.6, 0.6] }, 0.2);
    b.cyl(0.35, 0.35, 12, 0xff5aa8, { p: [-0.6, 8.5, 0.6], r: [0.1, 0, 0.12] }, 8);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('toothbrush', root, () => {});
}

/** Zahnrad (steht aufrecht, Achse entlang Z), dreht sich. */
function gear(o = {}) {
  const R = o.r ?? 6, C = o.color ?? 0xc8a03a, sp = o.speed ?? 0.4;
  const root = new THREE.Group();
  const g = mesh(cached(`rw2:gear:${R}:${C}`, () => {
    const b = new Build();
    const n = Math.max(8, Math.round(R * 2));
    b.cyl(R, R, 1.2, C, { r: [Math.PI / 2, 0, 0] }, 32);
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.box(1.2, R * 0.25, 1.2, C, { p: [Math.cos(a) * R, Math.sin(a) * R, 0], r: [0, 0, a + Math.PI / 2] }, 0.05); }
    b.cyl(R * 0.3, R * 0.3, 1.6, 0x6a5a3a, { r: [Math.PI / 2, 0, 0] }, 16);
    for (let k = 0; k < 4; k++) b.box(R * 0.12, R * 1.3, 0.8, 0x8a7a4a, { r: [0, 0, (k * Math.PI) / 4] }, 0.05);
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.7, roughness: 0.35 }), {}, true);
  g.position.y = R + 0.5;
  root.add(g);
  return makeModel('gear', root, (dt) => { g.rotation.z += dt * sp; });
}

function clockFace(o = {}) {
  const R = o.r ?? 10;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:clock:${R}`, () => {
    const b = new Build();
    b.cyl(R, R, 1, 0xfaf4e4, { r: [Math.PI / 2, 0, 0] }, 40);
    b.torus(R, 0.6, 0xc8a03a, {}, 8, 40);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.box(0.5, k % 3 ? 1.2 : 2.2, 0.3, 0x2a2a34, { p: [Math.sin(a) * R * 0.85, Math.cos(a) * R * 0.85, 0.6], r: [0, 0, -a] }, 0.02); }
    return b.geometry();
  }), vcol(0.4), {}, true));
  const hand = (len, w, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.3).translate(0, len / 2, 0), new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.4 })); m.position.z = 0.9; root.add(m); return m; };
  const hh = hand(R * 0.5, 0.8, 0x2a2a34), mh = hand(R * 0.8, 0.5, 0x2a2a34);
  let t = Math.random() * 10;
  return makeModel('clock_face', root, (dt) => { t += dt; mh.rotation.z = -t * 0.6; hh.rotation.z = -t * 0.05; }, [hh.geometry, hh.material, mh.geometry, mh.material]);
}

function clockTower() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:ctower', () => {
    const b = new Build();
    b.box(10, 44, 10, 0xc8b89a, { p: [0, 22, 0] }, 0.2);
    for (let y = 8; y < 40; y += 6) b.box(10.4, 0.6, 10.4, 0xa89878, { p: [0, y, 0] }, 0.05);
    b.box(11, 10, 11, 0xb8a888, { p: [0, 49, 0] }, 0.2);
    b.cone(8, 16, 0x3a5a4a, { p: [0, 62, 0], r: [0, Math.PI / 4, 0] }, 4);
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; b.cyl(3.6, 3.6, 0.4, 0xfaf4e4, { p: [Math.cos(a) * 5.6, 49, Math.sin(a) * 5.6], r: [Math.PI / 2, 0, -a + Math.PI / 2] }, 24); }
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('clock_tower', root, () => {});
}

function tvTower() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw2:tvtower', () => {
    const b = new Build();
    b.cyl(2, 4, 80, 0xd8d8e0, { p: [0, 40, 0] }, 16);
    b.sphere(8, 0xc0c4d0, { p: [0, 84, 0] }, 24, 16);
    b.torus(8.05, 0.5, 0x3a8ae8, { p: [0, 84, 0], r: [Math.PI / 2, 0, 0] }, 6, 32);
    b.cyl(0.6, 1, 26, 0xe8392d, { p: [0, 104, 0] }, 8);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('tv_tower', root, () => {});
}

/** Riesiger gefliester Raum: vier Wände mit Fliesenfugen und Bordüre (Ursprung = Raummitte am Boden). */
function roomWalls(o = {}) {
  const S = o.size ?? 600, H = o.h ?? 160, c1 = o.c1 ?? 0xf4f8fc, c2 = o.c2 ?? 0xdceef8, band = o.band ?? 0x3a8ae8, T = o.tile ?? 12;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw2:room:${S}:${H}:${c1}:${c2}:${band}:${T}`, () => {
    const b = new Build();
    const tile = (x, y, z) => { const u = Math.abs(x) + Math.abs(z); return y > H * 0.55 && y < H * 0.6 ? band : (Math.floor(u / T) + Math.floor(y / T)) % 2 ? c1 : c2; };
    for (let k = 0; k < 4; k++) {
      const g = new THREE.PlaneGeometry(S, H, 50, 14);
      g.translate(0, H / 2, 0);
      const a = (k * Math.PI) / 2;
      b.add(g, tile, { p: [Math.sin(a) * -S / 2, 0, Math.cos(a) * -S / 2], r: [0, a, 0] });
    }
    return b.geometry();
  }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, side: THREE.DoubleSide }), {}, false));
  return makeModel('room_walls', root, () => {});
}

export const MODELS = {
  room_walls: roomWalls,
  cheese_wedge: cheeseWedge, cheese_wheel: cheeseWheel, giant_tree: giantTree, giant_mushroom: giantMushroom, acacia, elephant, giraffe,
  bathtub, rubber_duck: rubberDuck, soap, toothbrush, gear, clock_face: clockFace, clock_tower: clockTower, tv_tower: tvTower,
  torii, pagoda, bamboo, stone_lantern: stoneLantern, great_wall: greatWall, wall_tower: wallTower, dragon_head: dragonHead,
  hover_car: hoverCar, sky_tower: skyTower, gold_pile: goldPile, mine_frame: mineFrame,
  rock_pillar: rockPillar, giant_egg: giantEgg, igloo, ice_arch: iceArch, giant_drum: giantDrum, trumpet, music_note: musicNote, guitar,
  cow, barn, silo, hay_bale: hayBale, tractor, crab, beach_hut: beachHut, lifeguard, surfboard, sand_castle: sandCastle,
  beach_ball: beachBall, truck, farm_fence: farmFence,
};

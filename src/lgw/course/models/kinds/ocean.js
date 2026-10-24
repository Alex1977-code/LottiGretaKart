// Meeres-Modelle für die Strecke „Wrack-Riff“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt (Schiffe: Wasserlinie bzw. Meeresgrund), Blick/Bug nach +X.
//
// ferry          Große Auto-Fähre zum Durchfahren: Autodeck als Halle (Lampen, Streifen, Container), offene
//                Heckklappe und hochgeklappter Bug-Visor, darüber weiße Decks mit Fenstern, Brücke, Schornstein,
//                Rettungsbooten und Radar.  opts { length (130), width (28, innen), deck (3,8 = Fahrbahn über Wasser) }
// shipwreck      Versunkener alter Dampfer, aufgebrochen, zum Durchfahren: Rost, Algen, Löcher, Spanten, umgestürzter
//                Mast und Schornstein.  opts { length (44), width (27, innen) }  Ursprung = Meeresgrund, Achse +X.
// rock_arch      Felsbogen über der Fahrbahn mit Korallen.  opts { span (30) }  Bogen quer (Z), Ursprung Mitte.
// coral_branch   Geweihkoralle.  opts { color }
// coral_brain    Hirnkoralle (Halbkugel mit Rillen).  opts { color }
// coral_fan      Fächerkoralle, wiegt sich.  opts { color }
// kelp           Seetang-Büschel, 6–11 m hoch, wiegt sich.  opts { height }
// anemone        Seeanemone mit zwei Clownfischen.
// sea_star       Seestern.  opts { color }
// giant_clam     Riesenmuschel mit leuchtender Perle, öffnet und schließt sich.
// treasure_chest Offene Schatzkiste mit Gold.
// jellyfish      Qualle (leuchtend, pulsiert und schwebt).  opts { color: 'blue'|'pink' }  state 'swim'|'squashed'
// pufferfish     Kugelfisch mit Stacheln, bläst sich auf.  state 'fly'|'squashed'
// fish_school    Fischschwarm (Instanzen), kreist.  opts { n (36), r (6), colors }
// sea_turtle     Meeresschildkröte, rudert mit den Flossen.
// manta          Mantarochen, schlägt mit den Flügeln.
// light_rays     Lichtstrahlen von der Wasseroberfläche (additiv).  opts { h (10) }
// bubble_vent    Blasen-Quelle am Grund.
// submarine      Gelbes U-Boot mit Bullaugen und Propeller.
// harbor_crane   Hafenkran (Portal) mit Container am Haken.
// container      Schiffscontainer 6 × 2,6 × 2,4 m.  opts { color }
// bollard        Poller mit Tau.
// seagull        Möwe, segelt.  state 'fly'

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, eyes, makeModel, Clock, TAU, glowSprite, starShape } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const NAVY = 0x1e3a6a, WHITE = 0xf6f8fb, RED = 0xc8282a, STEEL = 0x9aa2ae, GLASS = 0x1a2a40;

const TEX = new Map();
function nameTexture(key, text, sub) {
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 1024, 256);
  x.font = 'bold 132px "Lilita One", "Trebuchet MS", "Arial Rounded MT Bold", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 12; x.strokeStyle = '#0a1a3a'; x.strokeText(text, 512, 104);
  x.fillStyle = '#ffffff'; x.fillText(text, 512, 104);
  if (sub) { x.font = 'bold 54px "Trebuchet MS", sans-serif'; x.fillStyle = '#ffd23a'; x.fillText(sub, 512, 210); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  TEX.set(key, t);
  return t;
}
function rayTexture() {
  if (TEX.has('rays')) return TEX.get('rays');
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  const h = x.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c);
  TEX.set('rays', t);
  return t;
}

/** Keil (Prisma mit Spitze nach +X): hinten Rechteck w × h, vorn Spitze nach len – für den Bug-Visor. */
function wedgeGeo(len, h, w, tipDrop = 1) {
  const v = [
    [0, 0, -w], [0, 0, w], [0, h, -w], [0, h, w],   // hinten unten/oben
    [len * 0.75, 0, 0], [len, h - tipDrop, 0],       // Spitze unten/oben
  ];
  const f = [[0, 4, 1], [2, 3, 5], [0, 2, 5], [0, 5, 4], [1, 4, 5], [1, 5, 3]];
  const pos = [];
  for (const t of f) for (const i of t) pos.push(...v[i]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// =============================================================================================
// Fähre
// =============================================================================================
function ferry(opts = {}) {
  const L = opts.length ?? 130, W = (opts.width ?? 28) / 2, D = opts.deck ?? 3.8, IH = 8;   // innen: halbe Breite, Deckhöhe, Hallenhöhe
  const T = 1.2, top = D + IH, x0 = -L / 2, x1 = L / 2;
  const key = `ocean:ferry:${L}:${W}:${D}`;
  const root = new THREE.Group();
  root.add(mesh(cached(key, () => {
    const b = new Build();
    // Rumpf-Seiten: rot unter Wasser, blau bis über das Autodeck, darüber weiß
    for (const s of [1, -1]) {
      const z = s * (W + T / 2);
      b.box(L, 5, T, RED, { p: [0, -2.5, z] }, 0.1);
      b.box(L, D + 3.2, T, NAVY, { p: [0, (D + 3.2) / 2, z] }, 0.1);
      b.box(L, top - D - 3.2 + 0.8, T, WHITE, { p: [0, (D + 3.2 + top + 0.8) / 2, z] }, 0.1);
      b.box(L, 0.35, T + 0.1, 0xffd23a, { p: [0, D + 3.2, z] }, 0.05);                 // gelber Zierstreifen
      // Innenverkleidung der Halle mit Warnstreifen unten
      b.box(L - 0.4, IH, 0.15, 0xdfe3ea, { p: [0, D + IH / 2, s * (W - 0.05)] }, 0);
      for (let k = 0; k < L / 2; k++) b.box(1, 0.7, 0.18, k % 2 ? 0x1a1a22 : 0xffc21a, { p: [x0 + 0.5 + k * 2, D + 0.4, s * (W - 0.08)], r: [0, 0, 0.6] }, 0);
    }
    // Boden (unter Wasser) und Autodeck-Decke mit Querträgern
    b.box(L, 0.6, W * 2 + T * 2, RED, { p: [0, -5, 0] }, 0.1);
    b.box(L, 0.9, W * 2 + T * 2, WHITE, { p: [0, top + 0.45, 0] }, 0.1);
    b.box(L - 0.4, 0.1, W * 2, 0xc8ced8, { p: [0, top - 0.06, 0] }, 0);
    for (let x = x0 + 4; x < x1 - 2; x += 8) b.box(0.7, 0.9, W * 2, STEEL, { p: [x, top - 0.5, 0] }, 0.05);
    // Heck: Portal mit hochgeklappter Heckklappe; Bug: Rahmen und Visor
    for (const xe of [x0, x1]) {
      b.box(1.4, IH + 1, 1.6, WHITE, { p: [xe, D + IH / 2, W - 0.6] }, 0.1);
      b.box(1.4, IH + 1, 1.6, WHITE, { p: [xe, D + IH / 2, -W + 0.6] }, 0.1);
      b.box(1.4, 1.2, W * 2 + T * 2, WHITE, { p: [xe, top + 0.3, 0] }, 0.1);
    }
    b.box(0.6, IH + 0.6, W * 2, NAVY, { p: [x0 - 2.6, top + 3.2, 0], r: [0, 0, -1.2] }, 0.1);   // Heckklappe (hochgeklappt)
    // Bug-Visor (hochgeklappt um die Vorderkante der Decke)
    {
      const vis = wedgeGeo(14, top + 3, W + T, 1.2);
      vis.translate(0, -(top + 3), 0);              // Drehpunkt oben hinten
      vis.rotateZ(1.25);
      vis.translate(x1, top + 3.4, 0);
      b.add(vis, { v: (x, y) => (y > top + 11 ? WHITE : NAVY) });
    }
    // Aufbauten: drei Decks, Brücke, Schornstein
    const deck = (xa, xb, y, h, w, col = WHITE) => b.box(xb - xa, h, w * 2, col, { p: [(xa + xb) / 2, y + h / 2, 0] }, 0.25);
    deck(x0 + 4, x1 - 16, top + 0.9, 3.2, W - 0.6);
    deck(x0 + 10, x1 - 24, top + 4.1, 3.0, W - 2.2);
    deck(x0 + 20, x1 - 30, top + 7.1, 2.8, W - 4);
    deck(x1 - 40, x1 - 28, top + 7.1, 3.2, W + 1.2);                                   // Brücke mit Nocken
    b.box(1, 1.2, W * 2 - 1, GLASS, { p: [x1 - 27.6, top + 8.8, 0] }, 0.05);            // Brückenfenster
    for (const s of [1, -1]) b.box(0.2, 0.9, 0.2, WHITE, { p: [x1 - 28, top + 11, s * 4] }, 0.02);
    // Schornstein: rot mit weißem Band und schwarzer Kappe, Logo-Herz
    b.cyl(3.4, 4.0, 9, RED, { p: [-14, top + 14.4, 0], s: [1.5, 1, 0.75] }, 24);
    b.cyl(3.45, 3.45, 1.3, WHITE, { p: [-14, top + 15.6, 0], s: [1.5, 1, 0.75] }, 24);
    b.cyl(3.3, 3.4, 1.2, 0x1a1a22, { p: [-14, top + 19.4, 0], s: [1.5, 1, 0.75] }, 24);
    // Mast mit Radar
    b.cyl(0.25, 0.35, 8, WHITE, { p: [x1 - 34, top + 14, 0] }, 8);
    b.box(0.3, 0.3, 5, WHITE, { p: [x1 - 34, top + 16.5, 0] }, 0.05);
    // Reling auf allen Decks
    for (const [y, w, xa, xb] of [[top + 1.8, W + 0.5, x0, x1], [top + 5, W - 0.6, x0 + 4, x1 - 16], [top + 7.9, W - 2.2, x0 + 10, x1 - 24]]) {
      for (const s of [1, -1]) b.box(xb - xa, 0.12, 0.12, WHITE, { p: [(xa + xb) / 2, y + 1, s * w] }, 0);
    }
    // Rettungsboote (orange) an Davits
    for (const s of [1, -1]) for (let k = 0; k < 7; k++) {
      const x = x0 + 16 + k * ((L - 40) / 6);
      b.capsule(1.1, 5, 0xff7a1a, { p: [x, top + 5.2, s * (W - 1.2)], r: [0, 0, Math.PI / 2], s: [1, 1, 0.9] }, 4, 10);
      b.box(5.8, 0.4, 2, WHITE, { p: [x, top + 5.8, s * (W - 1.2)] }, 0.15);
      for (const dx of [-2.6, 2.6]) b.box(0.25, 2.4, 0.25, WHITE, { p: [x + dx, top + 6.2, s * (W - 0.6)] }, 0.02);
    }
    // Sonnendeck hinten: Pool und Sonnenschirme
    b.box(10, 0.4, 7, 0x2ab8f0, { p: [x0 + 14, top + 7.35, 0] }, 0.1);
    for (const [px, pz, c] of [[x0 + 22, 6, 0xff5a7a], [x0 + 22, -6, 0xffd23a], [x0 + 26, 0, 0x3ac0ff]]) {
      b.cyl(0.08, 0.08, 2.4, WHITE, { p: [px, top + 8.4, pz] }, 5);
      b.cone(1.8, 0.8, c, { p: [px, top + 9.8, pz] }, 10);
    }
    // Container und Kisten an den Hallenwänden
    for (const s of [1, -1]) for (let x = x0 + 8; x < x1 - 8; x += 13) {
      const c = [0xe8392d, 0x2a7ad8, 0x3aa84a, 0xffb21a][Math.abs(Math.round(x * 7 + s * 3)) % 4];
      b.box(6, 2.6, 1.6, c, { p: [x, D + 1.3, s * (W - 1.0)] }, 0.06);
      for (let r = 0; r < 6; r++) b.box(0.08, 2.4, 1.62, 0x000000, { p: [x - 2.5 + r, D + 1.3, s * (W - 1.0)] }, 0);
    }
    return b.geometry();
  }), vcol(0.5), {}, true));
  // Leuchtende Fenster, Bullaugen und Lampenbänder
  root.add(mesh(cached(`${key}:lights`, () => {
    const b = new Build();
    for (const s of [1, -1]) {
      for (let x = x0 + 3; x < x1 - 2; x += 3.2) b.cyl(0.45, 0.45, 0.1, 0xffe9a8, { p: [x, D + 5.4, s * (W + T + 0.02)], r: [Math.PI / 2, 0, 0] }, 10);
      for (let x = x0 + 6; x < x1 - 18; x += 2.4) b.box(1.6, 1.2, 0.08, (Math.round(x) % 3) ? 0x9ad8ff : 0xffe9a8, { p: [x, top + 2.6, s * (W - 0.55)] }, 0);
      for (let x = x0 + 12; x < x1 - 26; x += 2.4) b.box(1.6, 1.1, 0.08, (Math.round(x) % 4) ? 0x9ad8ff : 0xffe9a8, { p: [x, top + 5.6, s * (W - 2.15)] }, 0);
    }
    for (const z of [-W * 0.6, 0, W * 0.6]) for (let x = x0 + 4; x < x1 - 2; x += 8) b.box(5, 0.12, 0.7, 0xfff6dc, { p: [x + 4, top - 0.14, z] }, 0);
    return b.geometry();
  }), basic('ocean:lamps', { vertexColors: true })));
  // Namen am Rumpf
  for (const s of [1, -1]) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), basic('ocean:ferryname', { map: nameTexture('ferry', 'LOTTI & GRETA', 'INSEL-FÄHRE'), transparent: true, depthWrite: false }));
    n.position.set(x1 - 22, D + 1.2, s * (W + T + 0.05));
    if (s < 0) n.rotation.y = Math.PI;
    root.add(n);
  }
  const radar = joint([x1 - 34, top + 18.4, 0], mesh(cached('ocean:radar', () => new Build().box(0.4, 0.5, 5, WHITE, {}, 0.1).geometry()), vcol(0.5)));
  root.add(radar);
  const smoke = [];
  for (let k = 0; k < 4; k++) { const g = glowSprite(0xe8eef4, 6, 0.0); g.material = g.material.clone(); g.material.blending = THREE.NormalBlending; root.add(g); smoke.push(g); }
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    radar.rotation.y = clk.t * 1.4;
    smoke.forEach((g, k) => {
      const f = (clk.t * 0.25 + k / smoke.length) % 1;
      g.position.set(-14 - f * 14, top + 21 + f * 9, 0);
      g.scale.setScalar(5 + f * 10);
      g.material.opacity = 0.45 * (1 - f);
    });
  };
  return makeModel('ferry', root, update, [...smoke.map((g) => g.material)]);
}

// =============================================================================================
// Schiffswrack
// =============================================================================================
function shipwreck(opts = {}) {
  const L = opts.length ?? 44, W = (opts.width ?? 27) / 2, H = 7;
  const key = `ocean:wreck:${L}:${W}`;
  const RUST = 0x8a4a2a, RUST2 = 0x6a3a22, ALGAE = 0x4a7a3a, ALGAE2 = 0x6a9a4a;
  const rusty = (x, y, z) => { const n = sin(x * 1.3 + z * 0.7) * cos(y * 1.9 - x * 0.4); return n > 0.55 ? ALGAE : n > 0.25 ? ALGAE2 : n < -0.5 ? RUST2 : RUST; };
  const root = new THREE.Group();
  root.add(mesh(cached(key, () => {
    const b = new Build();
    // Seitenwände aus Platten – einige fehlen (Löcher), leicht nach außen gekippt
    for (const s of [1, -1]) {
      for (let k = 0; k < L / 4; k++) {
        if ((k * 7 + (s > 0 ? 2 : 5)) % 5 === 0) continue;
        const x = -L / 2 + 2 + k * 4;
        const h = H - ((k * 3) % 4) * 0.6 - (k === Math.floor(L / 8) ? 3 : 0);
        b.box(4.05, h, 0.9, rusty, { p: [x, h / 2, s * (W + 0.5)], r: [s * 0.08, 0, 0] }, 0.1);
      }
      // Bullaugen (dunkel) und Rumpf-Leiste
      for (let x = -L / 2 + 3; x < L / 2 - 2; x += 3.5) b.cyl(0.4, 0.4, 0.2, 0x10161c, { p: [x, H * 0.62, s * (W + 1.0)], r: [Math.PI / 2, 0, 0] }, 8);
      b.box(L, 0.5, 1.1, RUST2, { p: [0, H - 0.2, s * (W + 0.7)] }, 0.1);
    }
    // Spanten (Rippen) als Bögen über die Fahrbahn
    for (let x = -L / 2 + 3; x < L / 2; x += 6) b.torus(W + 0.6, 0.35, RUST2, { p: [x, H - 2.5, 0], r: [0, Math.PI / 2, 0], s: [1, 0.55, 1] }, 6, 20, Math.PI);
    // Deck-Reste oben (Teile fehlen)
    for (let k = 0; k < L / 6; k++) if (k % 3 !== 1) b.box(5.5, 0.5, W * 2 + 1.6, rusty, { p: [-L / 2 + 3 + k * 6, H + 0.2, 0], r: [0.04 * (k % 2 ? 1 : -1), 0, 0.03] }, 0.1);
    // Bug (vorn, spitz) und Heck (abgebrochen)
    const bow = wedgeGeo(10, H, W + 1, 0.5);
    bow.translate(L / 2, 0, 0);
    b.add(bow, rusty);
    // Brückenhaus schief obendrauf, umgestürzter Schornstein und Mast daneben
    b.box(8, 4, 8, rusty, { p: [-4, H + 2.4, 0], r: [0.1, 0.2, 0.08] }, 0.2);
    for (let k = 0; k < 4; k++) b.box(1.2, 0.9, 0.1, 0x10161c, { p: [-6 + k * 1.8, H + 3, 4.05], r: [0.1, 0.2, 0.08] }, 0);
    b.cyl(1.6, 1.8, 7, 0x6a2a1a, { p: [6, 1.8, W + 7], r: [Math.PI / 2 - 0.2, 0.3, 0] }, 14);
    b.cyl(0.35, 0.45, 18, RUST2, { p: [-10, H + 4, -W - 3], r: [0.9, 0, 0.4] }, 8);
    // Ankerkette und Anker
    for (let k = 0; k < 10; k++) b.torus(0.35, 0.1, 0x4a3a32, { p: [L / 2 + 2 + k * 0.6, 0.3, -W - 2 - k * 0.3], r: [k % 2 ? Math.PI / 2 : 0, 0.5, 0] }, 5, 10);
    b.cyl(0.25, 0.25, 3.5, 0x4a3a32, { p: [L / 2 + 8.5, 1.4, -W - 5], r: [0, 0, 0.3] }, 8);
    b.torus(1.4, 0.25, 0x4a3a32, { p: [L / 2 + 8, 0.6, -W - 5], r: [0, 0, 0] }, 6, 16, Math.PI);
    // Seepocken, Algenbüschel
    for (let k = 0; k < 40; k++) {
      const x = -L / 2 + ((k * 37) % L), s = k % 2 ? 1 : -1, y = 0.5 + ((k * 13) % 70) / 10;
      b.sphere(0.25 + (k % 3) * 0.1, k % 4 ? 0xd8d0b8 : 0x9ad04a, { p: [x, y, s * (W + 1.0)], s: [1, 0.6, 1] }, 6, 4);
    }
    for (let k = 0; k < 18; k++) {
      const x = -L / 2 + 2 + ((k * 29) % (L - 4)), s = k % 2 ? 1 : -1;
      b.cone(0.25, 1.6 + (k % 3) * 0.6, 0x3a8a3a, { p: [x, H + 1.1, s * (W - 1 - (k % 4))], r: [0.2 * s, 0, 0.1] }, 5);
    }
    return b.geometry();
  }), vcol(0.85), {}, true));
  // Schwaches Leuchten in den Bullaugen (Geisterschiff)
  root.add(mesh(cached(`${key}:glow`, () => {
    const b = new Build();
    for (const s of [1, -1]) for (let x = -L / 2 + 3; x < L / 2 - 2; x += 7) b.cyl(0.3, 0.3, 0.05, 0x7affd8, { p: [x, H * 0.62, s * (W + 1.12)], r: [Math.PI / 2, 0, 0] }, 8);
    return b.geometry();
  }), basic('ocean:wreckglow', { vertexColors: true })));
  return makeModel('shipwreck', root, () => {});
}

// =============================================================================================
// Felsbogen
// =============================================================================================
function rockArch(opts = {}) {
  const S = opts.span ?? 30, R = S / 2, YS = 0.42;   // flacher Bogen (bleibt unter der Wasseroberfläche)
  const root = new THREE.Group();
  root.add(mesh(cached(`ocean:arch:${S}`, () => {
    const b = new Build();
    const rockC = (x, y, z) => (sin(x * 2.1 + y * 1.3 + z) > 0.6 ? 0x7a6a8a : 0x8a7a72);
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI;
      const z = cos(a) * R, y = sin(a) * R * YS;
      b.sphere(2.6 + (k % 3) * 0.5, rockC, { p: [((k * 7) % 5) * 0.3 - 0.6, y, z], s: [1.2, 1, 1] }, 10, 7);
    }
    for (const s of [1, -1]) b.sphere(4, rockC, { p: [0, 1, s * R], s: [1.3, 0.8, 1.1] }, 12, 8);
    // Korallen-Schmuck oben
    for (let k = 0; k < 10; k++) {
      const a = 0.4 + (k / 9) * (Math.PI - 0.8), z = cos(a) * R, y = sin(a) * R * YS + 2.6;
      b.sphere(0.7, [0xff5a8a, 0xffb21a, 0xb05aff, 0x3ad8c8][k % 4], { p: [0.8 - (k % 2) * 1.6, y, z], s: [1, 0.7, 1] }, 8, 6);
    }
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('rock_arch', root, () => {});
}

// =============================================================================================
// Korallen, Tang, Anemone, Seestern, Muschel, Schatz
// =============================================================================================
const CORAL = { pink: 0xff6aa0, orange: 0xff8a3a, purple: 0xa85aff, yellow: 0xffd23a, red: 0xe8392d, teal: 0x3ad8c8 };
const coralCol = (c) => CORAL[c] ?? (typeof c === 'number' ? c : CORAL.pink);

function coralBranch(opts = {}) {
  const c = coralCol(opts.color);
  const root = new THREE.Group();
  root.add(mesh(cached(`ocean:coralb:${c}`, () => {
    const b = new Build();
    const tip = new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.45);
    const grow = (p, dir, len, r, depth) => {
      const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
      b.tube([p, [(p[0] + e[0]) / 2 + dir[2] * 0.1, (p[1] + e[1]) / 2, (p[2] + e[2]) / 2], e], r, c, null, 4, 6);
      if (depth === 0) { b.sphere(r * 1.3, tip, { p: e }, 6, 4); return; }
      for (const k of [-1, 1]) {
        const a = k * 0.55 + depth * 0.7;
        const nd = [dir[0] * cos(a) - dir[2] * sin(a) + 0.15 * k, dir[1] * 0.9 + 0.2, dir[2] * cos(a) + dir[0] * sin(a)];
        const l = Math.hypot(...nd);
        grow(e, nd.map((v) => v / l), len * 0.72, r * 0.72, depth - 1);
      }
    };
    for (let k = 0; k < 4; k++) { const a = k * 1.6; grow([0, 0, 0], [cos(a) * 0.35, 0.94, sin(a) * 0.35], 1.0, 0.18, 2); }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('coral_branch', root, () => {});
}

function coralBrain(opts = {}) {
  const c = coralCol(opts.color ?? 'yellow');
  const root = new THREE.Group();
  root.add(mesh(cached(`ocean:coralbr:${c}`, () => {
    const a = new THREE.Color(c), d = a.clone().multiplyScalar(0.62);
    return new Build().dome(1, { v: (x, y, z) => (sin(x * 9 + sin(z * 7) * 1.6) > 0.2 ? a : d) }, { s: [1.2, 0.8, 1.2] }, Math.PI / 2, 26, 12).geometry();
  }), vcol(0.75), {}, true));
  return makeModel('coral_brain', root, () => {});
}

function coralFan(opts = {}) {
  const c = coralCol(opts.color ?? 'purple');
  const root = new THREE.Group();
  const fan = mesh(cached(`ocean:coralf:${c}`, () => {
    const b = new Build();
    b.cyl(0.1, 0.16, 0.8, 0x6a4a5a, { p: [0, 0.4, 0] }, 6);
    for (let k = 0; k < 9; k++) {
      const a = -1.2 + k * 0.3;
      b.cyl(0.04, 0.06, 2.0, c, { p: [sin(a) * 1, 0.8 + cos(a) * 1, 0], r: [0, 0, -a] }, 4);
    }
    for (let r = 1; r <= 3; r++) b.torus(r * 0.6, 0.035, c, { p: [0, 0.8, 0], r: [0, 0, Math.PI * 0.12] }, 4, 16, Math.PI * 0.76);
    return b.geometry();
  }), vcol(0.6, { side: THREE.DoubleSide }, 'fan'), {}, true);
  root.add(fan);
  const clk = new Clock();
  return makeModel('coral_fan', root, (dt) => { clk.tick(dt, 'idle'); fan.rotation.x = sin(clk.t * 0.9) * 0.12; });
}

function kelp(opts = {}) {
  const H = opts.height ?? 8;
  const root = new THREE.Group();
  const segG = cached('ocean:kelpseg', () => {
    const b = new Build();
    b.cyl(0.07, 0.09, 1, 0x5a7a2a, { p: [0, 0.5, 0] }, 5);
    b.sphere(1, 0x6aa83a, { p: [0.28, 0.6, 0], r: [0, 0, -0.6], s: [0.32, 0.6, 0.06] }, 8, 5);
    b.sphere(1, 0x5a9a32, { p: [-0.24, 0.3, 0.05], r: [0, 0, 0.6], s: [0.28, 0.5, 0.05] }, 8, 5);
    return b.geometry();
  });
  const mat = vcol(0.7, { side: THREE.DoubleSide }, 'kelp');
  const stalks = [];
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3, base = joint([cos(a) * 0.7 * (k % 3), 0, sin(a) * 0.7 * (k % 3)]);
    base.rotation.y = a;
    let parent = base;
    const n = Math.round((H * (0.75 + 0.1 * (k % 3))) / 1);
    const js = [];
    for (let i = 0; i < n; i++) {
      const j = joint([0, i === 0 ? 0 : 1, 0], mesh(segG, mat));
      parent.add(j); parent = j; js.push(j);
    }
    root.add(base);
    stalks.push({ js, ph: k * 0.9 });
  }
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    for (const s of stalks) s.js.forEach((j, i) => { j.rotation.z = sin(clk.t * 0.8 + s.ph + i * 0.35) * 0.06; j.rotation.x = cos(clk.t * 0.6 + s.ph + i * 0.3) * 0.04; });
  };
  return makeModel('kelp', root, update);
}

function anemone() {
  const root = new THREE.Group();
  root.add(mesh(cached('ocean:anem:base', () => new Build().cyl(0.7, 0.9, 0.6, 0xc83a6a, { p: [0, 0.3, 0] }, 14).geometry()), vcol(0.5)));
  const tentG = cached('ocean:anem:t', () => new Build().capsule(0.07, 0.8, 0xff9ac8, { p: [0, 0.45, 0] }, 2, 6).sphere(0.1, 0xffe0f0, { p: [0, 0.95, 0] }, 6, 4).geometry());
  const tents = [];
  for (let k = 0; k < 22; k++) {
    const a = k * 2.39, r = 0.15 + (k % 4) * 0.15;
    const j = joint([cos(a) * r, 0.55, sin(a) * r], mesh(tentG, vcol(0.4)));
    j.rotation.set(sin(a) * 0.4 * r * 2, 0, cos(a) * 0.4 * r * 2);
    root.add(j); tents.push([j, a]);
  }
  const fishG = cached('ocean:clown', () => {
    const b = new Build();
    b.sphere(1, (x) => (Math.abs(x) < 0.15 || Math.abs(x - 0.55) < 0.1 ? 0xffffff : 0xff7a1a), { s: [0.22, 0.13, 0.08] }, 10, 6);
    b.cone(0.09, 0.14, 0xff7a1a, { p: [-0.26, 0, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.4] }, 6);
    return b.geometry();
  });
  const fish = [0, 1].map(() => { const m = mesh(fishG, vcol(0.3)); root.add(m); return m; });
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    for (const [j, a] of tents) j.rotation.x = sin(clk.t * 1.4 + a) * 0.25;
    fish.forEach((m, k) => {
      const a = clk.t * (0.9 + k * 0.3) + k * 3;
      m.position.set(cos(a) * 1.1, 1.3 + sin(clk.t * 2 + k) * 0.2, sin(a) * 1.1);
      m.rotation.y = -a - Math.PI / 2;
    });
  };
  return makeModel('anemone', root, update);
}

function seaStar(opts = {}) {
  const c = coralCol(opts.color ?? 'orange');
  const root = new THREE.Group();
  root.add(mesh(cached(`ocean:star:${c}`, () => new Build().extrude(starShape(0.6, 0.22, 5), 0.12, c, { r: [-Math.PI / 2, 0, 0], p: [0, 0.07, 0] }, 0.05, 6, 2, true).geometry()), vcol(0.6)));
  return makeModel('sea_star', root, () => {});
}

function giantClam() {
  const root = new THREE.Group();
  const shellG = cached('ocean:clam', () => new Build().dome(1, { v: (x, y, z) => (sin(Math.atan2(z, x) * 9) > 0 ? 0x8a5ac8 : 0xb88ae8) }, { s: [1.5, 0.7, 1.2] }, Math.PI / 2, 24, 8).geometry());
  const mat = vcol(0.45, { side: THREE.DoubleSide }, 'clam');
  const bottom = mesh(shellG, mat, { r: [Math.PI, 0, 0], p: [0, 0.7, 0] });
  const lidJ = joint([-1.4, 0.7, 0], mesh(shellG, mat, { p: [1.4, 0, 0] }));
  const pearl = mesh(cached('ocean:pearl', () => new Build().sphere(0.4, 0xffffff, {}, 16, 12).geometry()), basic('ocean:pearl', { vertexColors: true }), { p: [0.2, 0.9, 0] });
  const glow = glowSprite(0xe8f4ff, 2.2, 0.6); glow.position.set(0.2, 0.95, 0);
  root.add(bottom, lidJ, pearl, glow);
  const clk = new Clock();
  return makeModel('giant_clam', root, (dt) => { clk.tick(dt, 'idle'); lidJ.rotation.z = (0.5 + 0.5 * sin(clk.t * 0.7)) * 0.75; glow.material.opacity = 0.3 + 0.3 * lidJ.rotation.z; });
}

function treasureChest() {
  const root = new THREE.Group();
  root.add(mesh(cached('ocean:chest', () => {
    const b = new Build();
    b.box(1.8, 1.0, 1.2, 0x7a4a26, { p: [0, 0.5, 0] }, 0.08);
    for (const x of [-0.7, 0, 0.7]) b.box(0.12, 1.04, 1.24, 0xc8a030, { p: [x, 0.5, 0] }, 0.02);
    b.dome(1, 0xffc21a, { p: [0, 1.0, 0], s: [0.85, 0.35, 0.55] }, Math.PI / 2, 14, 5);
    for (let k = 0; k < 8; k++) b.cyl(0.12, 0.12, 0.03, 0xffd84a, { p: [-0.6 + k * 0.17, 1.15 + (k % 3) * 0.05, -0.2 + (k % 2) * 0.35], r: [0.3 * k, 0, 0.4] }, 10);
    b.box(1.8, 0.2, 1.2, 0x6a3a1e, { p: [0, 1.5, -0.95], r: [-1.1, 0, 0] }, 0.08);
    b.sphere(0.16, 0xff3a6a, { p: [0.3, 1.32, 0.1] }, 8, 6);
    b.sphere(0.14, 0x3ac8ff, { p: [-0.3, 1.3, -0.05] }, 8, 6);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const glow = glowSprite(0xffd84a, 3, 0.55); glow.position.y = 1.3; root.add(glow);
  const clk = new Clock();
  return makeModel('treasure_chest', root, (dt) => { clk.tick(dt, 'idle'); glow.material.opacity = 0.4 + 0.2 * sin(clk.t * 3); });
}

// =============================================================================================
// Tiere
// =============================================================================================
function jellyfish(opts = {}) {
  const pink = opts.color === 'pink';
  const c = pink ? 0xff7ac8 : 0x6ac8ff, ce = pink ? 0x8a2a6a : 0x1a5a8a;
  const root = new THREE.Group();
  const body = joint([0, 1.9, 0]);
  const bell = mesh(cached(`ocean:jelly:${c}`, () => new Build().dome(1, { v: (x, y) => new THREE.Color(c).lerp(new THREE.Color(0xffffff), Math.max(0, y) * 0.5) }, { s: [1, 0.75, 1] }, Math.PI / 2, 22, 10).geometry()),
    std(`ocean:jellymat:${c}`, { vertexColors: true, transparent: true, opacity: 0.72, emissive: ce, emissiveIntensity: 0.8, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
  const core = mesh(cached('ocean:jellycore', () => new Build().sphere(0.42, 0xffffff, { p: [0, 0.25, 0] }, 12, 8).geometry()), basic(`ocean:jellycore:${c}`, { color: c, transparent: true, opacity: 0.8 }));
  body.add(bell, core);
  if (opts.face !== false) {
    const f = eyes([{ p: [0.66, 0.3, 0.24], r: 0.12 }, { p: [0.66, 0.3, -0.24], r: 0.12 }], { key: 'jelly', iris: 0x1a1a3a, pupil: 0.6 });
    body.add(f);
  }
  const tentG = cached(`ocean:jellyt:${c}`, () => new Build().tube([[0, 0, 0], [0.12, -0.5, 0.05], [-0.06, -1.0, 0], [0.1, -1.5, -0.05], [0, -1.9, 0]], 0.025, c, null, 14, 4).geometry());
  const tents = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU, rr = k % 2 ? 0.6 : 0.35;
    const j = joint([cos(a) * rr, 0, sin(a) * rr], mesh(tentG, std(`ocean:jellyt:${c}`, { color: c, transparent: true, opacity: 0.7, emissive: ce, emissiveIntensity: 0.6 })));
    body.add(j); tents.push([j, a]);
  }
  const glow = glowSprite(c, 3.2, 0.35); glow.position.y = 0.2; body.add(glow);
  // Mundarme (kurze, gekräuselte Bänder in der Mitte)
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.4;
    body.add(mesh(cached(`ocean:jellyarm:${c}`, () => new Build().sphere(1, c, { p: [0, -0.55, 0], s: [0.09, 0.55, 0.22] }, 8, 6).geometry()), std(`ocean:jellyt:${c}`, { color: c, transparent: true, opacity: 0.7, emissive: ce, emissiveIntensity: 0.6 }), { p: [cos(a) * 0.12, 0, sin(a) * 0.12], r: [0, a, 0.15] }));
  }
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'swim';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    const p = sin(clk.t * 2.6);
    body.scale.set(1 + 0.08 * p, 1 - 0.1 * p, 1 + 0.08 * p);
    body.position.y = 1.9 + sin(clk.t * 1.3) * 0.35;
    for (const [j, a] of tents) { j.rotation.x = sin(clk.t * 2.6 + a) * 0.2; j.rotation.z = cos(clk.t * 2.2 + a) * 0.2; }
  };
  return makeModel('jellyfish', root, update);
}

function pufferfish() {
  const root = new THREE.Group();
  const body = joint([0, 0.9, 0]);
  body.add(mesh(cached('ocean:puffer', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.25 ? 0xfff4d8 : (sin(x * 9) * cos(y * 7) > 0.6 ? 0x8a6a1a : 0xffd23a)), { s: [0.75, 0.7, 0.7] }, 22, 14);
    // Stacheln rundum (gleichmäßig auf der Kugel verteilt, jeweils nach außen gerichtet)
    const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < 40; k++) {
      const u = (k + 0.5) / 40, el = Math.asin(2 * u - 1), az = k * 2.39;
      const d = new THREE.Vector3(cos(el) * cos(az), sin(el), cos(el) * sin(az));
      e.setFromQuaternion(q.setFromUnitVectors(up, d));
      b.cone(0.07, 0.3, 0xfff0c0, { p: [d.x * 0.78, d.y * 0.72, d.z * 0.72], r: [e.x, e.y, e.z] }, 5);
    }
    b.torus(0.12, 0.05, 0xff8a8a, { p: [0.74, -0.08, 0], r: [0, Math.PI / 2, 0] }, 6, 12);
    for (const s of [1, -1]) b.sphere(1, 0xffb21a, { p: [0.1, 0, s * 0.68], r: [0, 0, 0.3], s: [0.22, 0.14, 0.04] }, 8, 5);
    b.cone(0.3, 0.35, 0xffb21a, { p: [-0.85, 0, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.3] }, 8);
    return b.geometry();
  }), vcol(0.35), {}, true));
  body.add(eyes([{ p: [0.55, 0.3, 0.3], r: 0.17 }, { p: [0.55, 0.3, -0.3], r: 0.17 }], { key: 'puffer', iris: 0x2a5a1a, pupil: 0.55 }));
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'fly';
    clk.tick(dt, anim);
    if (anim === 'squashed') { body.scale.set(1.3, 0.3, 1.3); return; }
    const puff = Math.max(0, sin(clk.t * 0.9)) ** 4;
    body.scale.setScalar(1 + puff * 0.4);
    body.rotation.y = sin(clk.t * 6) * 0.1;
    body.position.y = 0.9 + sin(clk.t * 2) * 0.15;
  };
  return makeModel('pufferfish', root, update);
}

function fishSchool(opts = {}) {
  const n = opts.n ?? 36, R = opts.r ?? 6;
  const cols = opts.colors ?? [0x3ac8ff, 0xffd23a, 0x5ad8a8];
  const geo = cached('ocean:smallfish', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (y < -0.2 ? 0xffffff : 0xdddddd), { s: [0.32, 0.14, 0.07] }, 10, 6);
    b.cone(0.12, 0.2, 0xcccccc, { p: [-0.38, 0, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.3] }, 6);
    return b.geometry();
  });
  const im = new THREE.InstancedMesh(geo, vcol(0.3, {}, 'fishschool'), n);
  const c = new THREE.Color();
  const fish = [];
  for (let k = 0; k < n; k++) {
    im.setColorAt(k, c.setHex(cols[k % cols.length]));
    fish.push({ a: (k / n) * TAU * 1.7, r: R * (0.6 + ((k * 37) % 40) / 100), y: 1.5 + ((k * 13) % 30) / 10, s: 0.8 + ((k * 7) % 5) / 10, w: 0.5 + ((k * 11) % 10) / 30 });
  }
  im.instanceColor.needsUpdate = true;
  im.frustumCulled = false;
  const root = new THREE.Group();
  root.add(im);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler();
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    for (let k = 0; k < n; k++) {
      const f = fish[k], a = f.a + clk.t * f.w;
      p.set(cos(a) * f.r, f.y + sin(clk.t * 1.3 + k) * 0.4, sin(a) * f.r * 0.7);
      e.set(0, -a - Math.PI / 2 + sin(clk.t * 8 + k) * 0.15, 0);
      q.setFromEuler(e);
      s.setScalar(f.s * 2);
      m.compose(p, q, s);
      im.setMatrixAt(k, m);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  return makeModel('fish_school', root, update, [im]);
}

function seaTurtle() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('ocean:turtle', () => {
    const b = new Build();
    b.dome(1, (x, y, z) => (sin(x * 8) * sin(z * 8) > 0.2 ? 0x5a7a3a : 0x7a9a4a), { s: [1.3, 0.55, 1.0] }, Math.PI / 2, 18, 8);
    b.sphere(1, 0xd8d0a0, { s: [1.25, 0.18, 0.95] }, 16, 8);
    b.sphere(0.4, 0x8aa86a, { p: [1.45, 0.1, 0], s: [1.2, 0.8, 0.9] }, 12, 8);
    return b.geometry();
  }), vcol(0.5), {}, true));
  body.add(eyes([{ p: [1.8, 0.22, 0.2], r: 0.08 }, { p: [1.8, 0.22, -0.2], r: 0.08 }], { key: 'turtle', iris: 0x1a1a10, pupil: 0.7 }));
  const finG = cached('ocean:turtlefin', () => new Build().sphere(1, 0x8aa86a, { p: [0, 0, 0.6], s: [0.35, 0.06, 0.7] }, 10, 5).geometry());
  const fins = [];
  for (const [x, s, k] of [[0.7, 1, 1], [0.7, -1, 1], [-0.8, 1, 0.5], [-0.8, -1, 0.5]]) {
    const j = joint([x, 0, s * 0.8], mesh(finG, vcol(0.5), { r: [0, s > 0 ? 0 : Math.PI, 0], s: [1, 1, k] }));
    body.add(j); fins.push([j, s, x]);
  }
  root.add(body);
  const clk = new Clock();
  return makeModel('sea_turtle', root, (dt) => {
    clk.tick(dt, 'idle');
    for (const [j, s, x] of fins) j.rotation.x = s * sin(clk.t * 1.6 + (x > 0 ? 0 : 1.5)) * 0.6;
    body.rotation.z = sin(clk.t * 1.6) * 0.05;
  });
}

function manta() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('ocean:manta', () => new Build().sphere(1, (x, y) => (y < 0 ? 0xf4f4f8 : 0x2a3448), { s: [1.4, 0.3, 0.9] }, 16, 8).cyl(0.04, 0.08, 2.4, 0x2a3448, { p: [-2.4, 0, 0], r: [0, 0, Math.PI / 2] }, 5).geometry()), vcol(0.4), {}, true));
  const wingG = cached('ocean:mantawing', () => new Build().sphere(1, (x, y) => (y < 0 ? 0xf4f4f8 : 0x2a3448), { p: [0, 0, 1.6], s: [1.0, 0.12, 1.8] }, 14, 6).geometry());
  const wings = [1, -1].map((s) => { const j = joint([0, 0, s * 0.6], mesh(wingG, vcol(0.4), { r: [0, s > 0 ? 0 : Math.PI, 0] })); body.add(j); return [j, s]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('manta', root, (dt) => { clk.tick(dt, 'idle'); for (const [j, s] of wings) j.rotation.x = s * sin(clk.t * 1.2) * 0.45; body.position.y = sin(clk.t * 1.2 + 1) * 0.3; });
}

// =============================================================================================
// Licht, Blasen, U-Boot
// =============================================================================================
function lightRays(opts = {}) {
  const H = opts.h ?? 10;
  const root = new THREE.Group();
  const mats = [];
  for (let k = 0; k < 6; k++) {
    const m = new THREE.MeshBasicMaterial({ map: rayTexture(), color: 0xc8f4ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    mats.push(m);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2 + (k % 3), H), m);
    pl.userData.noShadow = true;
    pl.position.set(((k * 37) % 16) - 8, H / 2, ((k * 23) % 12) - 6);
    pl.rotation.set(0, k * 0.9, 0.25);
    root.add(pl);
  }
  const clk = new Clock();
  return makeModel('light_rays', root, (dt) => { clk.tick(dt, 'idle'); mats.forEach((m, k) => { m.opacity = 0.12 + 0.12 * (0.5 + 0.5 * sin(clk.t * 0.7 + k * 1.7)); }); }, [...mats, ...root.children.map((c) => c.geometry)]);
}

function bubbleVent() {
  const root = new THREE.Group();
  root.add(mesh(cached('ocean:vent', () => new Build().cyl(0.5, 1.0, 0.8, 0x6a6070, { p: [0, 0.4, 0] }, 10).geometry()), vcol(0.9)));
  const g = cached('ocean:bubble', () => new Build().sphere(1, 0xffffff, {}, 10, 8).geometry());
  const mat = basic('ocean:bubble', { color: 0xdff6ff, transparent: true, opacity: 0.4, depthWrite: false });
  const bs = [];
  for (let k = 0; k < 14; k++) { const m = mesh(g, mat); m.userData.noShadow = true; root.add(m); bs.push({ m, o: k / 14, s: 0.12 + (k % 4) * 0.06 }); }
  const clk = new Clock();
  return makeModel('bubble_vent', root, (dt) => {
    clk.tick(dt, 'idle');
    for (const b of bs) {
      const f = (clk.t * 0.18 + b.o) % 1;
      b.m.position.set(sin(f * 20 + b.o * 9) * 0.3, 0.8 + f * 10, cos(f * 17 + b.o * 7) * 0.3);
      b.m.scale.setScalar(b.s * (1 + f));
    }
  });
}

function submarine() {
  const root = new THREE.Group();
  root.add(mesh(cached('ocean:sub', () => {
    const b = new Build();
    b.capsule(1.3, 4.5, 0xffd23a, { r: [0, 0, Math.PI / 2] }, 6, 18);
    b.box(2.2, 1.4, 1.2, 0xffc21a, { p: [0.4, 1.4, 0] }, 0.4);
    b.cyl(0.12, 0.12, 1.6, 0x8a8a92, { p: [0.9, 2.5, 0] }, 8);
    b.cyl(0.16, 0.16, 0.6, 0x8a8a92, { p: [1.1, 3.3, 0], r: [0, 0, Math.PI / 2] }, 8);
    for (const s of [1, -1]) for (const x of [-1.2, 0, 1.2]) {
      b.torus(0.38, 0.09, 0xb8b8c0, { p: [x, 0.1, s * 1.28] }, 6, 14);
      b.cyl(0.36, 0.36, 0.05, 0x8ad8ff, { p: [x, 0.1, s * 1.27], r: [Math.PI / 2, 0, 0] }, 12);
    }
    for (const s of [1, -1]) b.box(1.2, 0.12, 1.4, 0xe8a81a, { p: [-3.2, 0, s * 0.8] }, 0.04);
    b.box(1.2, 1.4, 0.12, 0xe8a81a, { p: [-3.2, 0.5, 0] }, 0.04);
    return b.geometry();
  }), vcol(0.35), {}, true));
  const prop = joint([-3.9, 0, 0], mesh(cached('ocean:subprop', () => new Build().box(0.1, 1.6, 0.25, 0x8a8a92, {}, 0.03).box(0.1, 0.25, 1.6, 0x8a8a92, {}, 0.03).geometry()), vcol(0.3)));
  const lamp = glowSprite(0xfff2b0, 3, 0.7); lamp.position.set(3.6, 0, 0);
  root.add(prop, lamp);
  const clk = new Clock();
  return makeModel('submarine', root, (dt) => { clk.tick(dt, 'idle'); prop.rotation.x = clk.t * 8; root.children[0].rotation.z = sin(clk.t * 0.8) * 0.04; });
}

// =============================================================================================
// Hafen
// =============================================================================================
function container(opts = {}) {
  const c = opts.color ?? 0x2a7ad8;
  const root = new THREE.Group();
  root.add(mesh(cached(`ocean:cont:${c}`, () => {
    const b = new Build();
    b.box(6, 2.6, 2.4, c, { p: [0, 1.3, 0] }, 0.05);
    const d = new THREE.Color(c).multiplyScalar(0.7);
    for (let k = 0; k < 12; k++) for (const s of [1, -1]) b.box(0.12, 2.4, 0.06, d, { p: [-2.75 + k * 0.5, 1.3, s * 1.21] }, 0);
    b.box(0.06, 2.5, 2.3, d, { p: [3.01, 1.3, 0] }, 0);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('container', root, () => {});
}

function harborCrane() {
  const root = new THREE.Group();
  const C = 0xff8a1a;
  root.add(mesh(cached('ocean:crane', () => {
    const b = new Build();
    for (const [x, z] of [[-4, -5], [-4, 5], [4, -5], [4, 5]]) b.box(0.8, 22, 0.8, C, { p: [x, 11, z] }, 0.05);
    for (const y of [8, 15]) for (const z of [-5, 5]) b.box(8.8, 0.6, 0.6, C, { p: [0, y, z] }, 0.05);
    b.box(36, 1.6, 2.4, C, { p: [6, 22.5, 0] }, 0.1);
    b.box(6, 3, 4, 0xf4f4f4, { p: [-2, 25, 0] }, 0.2);
    b.box(1.6, 1.4, 0.1, GLASS, { p: [-2, 25, 2.06] }, 0);
    for (const [x, z] of [[-4, -5], [-4, 5], [4, -5], [4, 5]]) b.box(1.6, 0.8, 1.2, 0x3a3a44, { p: [x, 0.4, z] }, 0.1);
    return b.geometry();
  }), vcol(0.5), {}, true));
  const hook = joint([18, 21.5, 0]);
  hook.add(mesh(cached('ocean:cable', () => new Build().cyl(0.05, 0.05, 10, 0x2a2a30, { p: [0, -5, 0] }, 4).box(6, 0.3, 2.4, 0x3a3a44, { p: [0, -10.2, 0] }, 0.05).geometry()), vcol(0.5)));
  const cont = container({ color: 0xe8392d });
  cont.root.position.y = -13;
  hook.add(cont.root);
  root.add(hook);
  const clk = new Clock();
  return makeModel('harbor_crane', root, (dt) => { clk.tick(dt, 'idle'); hook.position.x = 10 + 8 * sin(clk.t * 0.25); hook.rotation.z = sin(clk.t * 0.9) * 0.02; });
}

function bollard() {
  const root = new THREE.Group();
  root.add(mesh(cached('ocean:bollard', () => new Build().cyl(0.3, 0.35, 0.8, 0x2a2a34, { p: [0, 0.4, 0] }, 12).cyl(0.42, 0.42, 0.15, 0x2a2a34, { p: [0, 0.85, 0] }, 12).torus(0.34, 0.07, 0xe8d8a0, { p: [0, 0.6, 0], r: [Math.PI / 2, 0, 0] }, 6, 14).geometry()), vcol(0.4), {}, true));
  return makeModel('bollard', root, () => {});
}

function seagull() {
  const root = new THREE.Group();
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('ocean:gull', () => new Build().sphere(1, (x, y) => (y > 0.3 && x < 0 ? 0xb8c0cc : 0xffffff), { s: [0.4, 0.16, 0.16] }, 12, 8)
    .sphere(0.13, 0xffffff, { p: [0.38, 0.08, 0] }, 10, 8).cone(0.04, 0.18, 0xffb21a, { p: [0.55, 0.06, 0], r: [0, 0, -Math.PI / 2] }, 6).geometry()), vcol(0.4)));
  const wG = cached('ocean:gullwing', () => new Build().box(0.32, 0.03, 0.9, 0xd8dee8, { p: [0, 0, 0.45] }, 0.01).box(0.18, 0.032, 0.25, 0x2a2a34, { p: [-0.05, 0, 0.82] }, 0.01).geometry());
  const wings = [1, -1].map((s) => { const j = joint([0, 0.05, s * 0.1], mesh(wG, vcol(0.4), { r: [0, s > 0 ? 0 : Math.PI, 0] })); body.add(j); return [j, s]; });
  root.add(body);
  const clk = new Clock();
  return makeModel('seagull', root, (dt) => { clk.tick(dt, 'fly'); for (const [j, s] of wings) j.rotation.x = s * (0.25 + sin(clk.t * 3) * 0.35); });
}

export const MODELS = {
  ferry, shipwreck, rock_arch: rockArch, coral_branch: coralBranch, coral_brain: coralBrain, coral_fan: coralFan, kelp,
  anemone, sea_star: seaStar, giant_clam: giantClam, treasure_chest: treasureChest, jellyfish, pufferfish,
  fish_school: fishSchool, sea_turtle: seaTurtle, manta, light_rays: lightRays, bubble_vent: bubbleVent, submarine,
  container, harbor_crane: harborCrane, bollard, seagull,
};

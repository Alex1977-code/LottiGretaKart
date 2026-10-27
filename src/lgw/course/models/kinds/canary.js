// Kanaren-Modelle für die Strecke „Teneriffa“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt, Front nach +X.
//
// canary_house   Kanarisches Haus: bunte Fassade, Ecken aus dunklem Basalt, grüne Fensterläden, Holzbalkon,
//                Ziegel- oder Flachdach.  opts { color, w (8), d (8), floors (2), roof ('tile'|'flat'), balcony (true) }
// canary_church  Weiße Kirche mit Basaltkanten und Glockenturm (≈ 18 m).
// mall           Einkaufszentrum zum Durchfahren: Ladenzeilen links und rechts, Glasdach, Lampen, Schild über den
//                Eingängen.  opts { length (60), width (26), text }
// drago          Drachenbaum (Drago milenario): dicker Stamm, verzweigte Äste mit Blattschöpfen (≈ 9 m).
// banana_plant   Bananenstaude mit großen Blättern und Fruchtstand (≈ 4 m).
// teide_peak     Gipfelkegel des Teide mit Schneehaube und Krater.  opts { h (40), r (55) }
// cafe_set       Strandcafé: Sonnenschirm, Tisch, vier Stühle.  opts { color }
// strelitzia     Paradiesvogelblumen im Beet.
// teleferico     Seilbahn-Kabine an einem Mast, schaukelt.
// guagua         Kanarischer Linienbus (grün-weiß, ≈ 10 m), Front nach +X.
// cabra          Ziege (läuft über die Serpentinen).  state 'walk'|'idle'|'squashed'

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, makeModel, Clock, TAU, canvasTexture, glowSprite } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;
const BASALT = 0x4a4448, WHITE = 0xfaf6ee, WOOD = 0x5a3a22, SHUTTER = 0x2e6a3a, TILE = 0xb5532a;

function canaryHouse(opts = {}) {
  const c = opts.color ?? 0xf2c14e, W = opts.w ?? 8, D = opts.d ?? 8, F = opts.floors ?? 2, H = F * 3.2;
  const roof = opts.roof ?? 'tile', balcony = opts.balcony ?? true;
  const root = new THREE.Group();
  root.add(mesh(cached(`can:house:${c}:${W}:${D}:${F}:${roof}:${balcony}`, () => {
    const b = new Build();
    b.box(D, H, W, c, { p: [0, H / 2, 0] }, 0.1, 1);
    b.box(D + 0.1, 0.7, W + 0.1, BASALT, { p: [0, 0.35, 0] }, 0.05, 1);   // Sockel
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(0.55, H, 0.55, BASALT, { p: [x * (D / 2 - 0.2), H / 2, z * (W / 2 - 0.2)] }, 0.04, 1);
    // Fenster mit Läden auf allen Seiten, Tür vorn
    for (let f = 0; f < F; f++) {
      const y = 1.9 + f * 3.2;
      const nW = Math.max(1, Math.round(W / 3.2)), nD = Math.max(1, Math.round(D / 3.2));
      for (let k = 0; k < nW; k++) {
        const z = -W / 2 + (k + 0.5) * (W / nW);
        for (const s of [1, -1]) {
          if (f === 0 && s === 1 && k === Math.floor(nW / 2)) continue;   // Tür
          const x = s * (D / 2 + 0.02);
          b.box(0.06, 1.3, 0.9, 0x2a3a4a, { p: [x, y, z] }, 0);
          b.box(0.1, 1.5, 0.12, WHITE, { p: [x, y, z - 0.52] }, 0);
          b.box(0.1, 1.5, 0.12, WHITE, { p: [x, y, z + 0.52] }, 0);
          b.box(0.14, 1.36, 0.42, SHUTTER, { p: [x + s * 0.03, y, z - 0.72] }, 0.02);
          b.box(0.14, 1.36, 0.42, SHUTTER, { p: [x + s * 0.03, y, z + 0.72] }, 0.02);
        }
      }
      for (let k = 0; k < nD; k++) {
        const x = -D / 2 + (k + 0.5) * (D / nD);
        for (const s of [1, -1]) b.box(0.9, 1.3, 0.06, 0x2a3a4a, { p: [x, y, s * (W / 2 + 0.02)] }, 0);
      }
    }
    b.box(0.1, 2.3, 1.3, WOOD, { p: [D / 2 + 0.03, 1.15, 0] }, 0.02);
    b.box(0.14, 0.3, 1.6, BASALT, { p: [D / 2 + 0.05, 2.45, 0] }, 0.02);
    // Holzbalkon (typisch kanarisch) im ersten Stock
    if (balcony && F > 1) {
      const y = 3.2 + 0.1, L = Math.min(W - 1.5, 5);
      b.box(1.1, 0.18, L, WOOD, { p: [D / 2 + 0.55, y, 0] }, 0.02);
      b.box(0.08, 1.0, L, WOOD, { p: [D / 2 + 1.07, y + 0.6, 0] }, 0.01);
      for (let k = 0; k <= Math.round(L / 0.4); k++) b.box(0.05, 1.0, 0.05, 0x6a4a2a, { p: [D / 2 + 1.05, y + 0.5, -L / 2 + k * 0.4] }, 0);
      b.box(1.25, 0.12, L + 0.3, WOOD, { p: [D / 2 + 0.6, y + 2.5, 0] }, 0.02);
      for (const z of [-L / 2, L / 2]) b.box(0.1, 2.5, 0.1, WOOD, { p: [D / 2 + 1.07, y + 1.25, z] }, 0);
    }
    if (roof === 'tile') {
      // Walmdach: vierseitige Pyramide, achsparallel (thetaStart 45°), dann auf das Haus gestreckt
      b.add(new THREE.ConeGeometry(1, 2.2, 4, 1, false, Math.PI / 4), TILE, { p: [0, H + 1.1, 0], s: [(D / 2 + 0.35) * Math.SQRT2, 1, (W / 2 + 0.35) * Math.SQRT2] });
    } else {
      b.box(D + 0.2, 0.5, W + 0.2, WHITE, { p: [0, H + 0.25, 0] }, 0.05, 1);
      b.box(1.2, 0.8, 1.2, WHITE, { p: [-D / 4, H + 0.6, W / 4] }, 0.05);   // Wassertank
    }
    return b.geometry();
  }), vcol(0.75), {}, true));
  return makeModel('canary_house', root, () => {});
}

function canaryChurch() {
  const root = new THREE.Group();
  root.add(mesh(cached('can:church', () => {
    const b = new Build();
    b.box(16, 8, 10, WHITE, { p: [0, 4, 0] }, 0.1, 1);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(0.7, 8, 0.7, BASALT, { p: [x * 7.7, 4, z * 4.7] }, 0.04, 1);
    b.add(new THREE.ConeGeometry(1, 3.4, 4, 1, false, Math.PI / 4), TILE, { p: [0, 9.7, 0], s: [8.4 * Math.SQRT2, 1, 5.4 * Math.SQRT2] });
    // Glockenturm vorn
    b.box(4.4, 16, 4.4, WHITE, { p: [8.6, 8, 0] }, 0.1, 1);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(0.5, 16, 0.5, BASALT, { p: [8.6 + x * 2.05, 8, z * 2.05] }, 0.03, 1);
    for (const s of [1, -1]) { b.box(0.2, 2.4, 1.4, 0x2a2a30, { p: [8.6 + s * 2.2, 13.4, 0] }, 0); b.box(1.4, 2.4, 0.2, 0x2a2a30, { p: [8.6, 13.4, s * 2.2] }, 0); }
    b.cone(3.3, 3.2, BASALT, { p: [8.6, 17.6, 0], r: [0, Math.PI / 4, 0] }, 4);
    b.box(0.15, 1.6, 0.15, 0xf2c14e, { p: [8.6, 19.9, 0] }, 0);
    b.box(0.15, 0.15, 0.9, 0xf2c14e, { p: [8.6, 20.2, 0] }, 0);
    // Portal aus Basalt
    b.box(0.3, 4.4, 2.8, BASALT, { p: [10.85, 2.2, 0] }, 0.05);
    b.box(0.2, 3.6, 2.0, WOOD, { p: [10.95, 1.8, 0] }, 0.02);
    return b.geometry();
  }), vcol(0.8), {}, true));
  return makeModel('canary_church', root, () => {});
}

const SHOPS = [['HELADOS', '#ff5a8a', '#fff4f8'], ['SURF', '#2a8ae8', '#e8f6ff'], ['MODA', '#b06aff', '#f8f0ff'], ['PIZZA', '#e8392d', '#fff4e8'], ['JUGUETES', '#ffb21a', '#fffaf0'],
  ['FARMACIA', '#2aa84a', '#effff2'], ['CAFÉ', '#8a5a3a', '#fff6ea'], ['ZAPATOS', '#3a4a8a', '#f0f4ff'], ['DEPORTES', '#ff7a1a', '#fff6ee'], ['MÚSICA', '#e83a9a', '#fff0f8']];

function mall(opts = {}) {
  const L = opts.length ?? 60, W = (opts.width ?? 26) / 2, H = 9, text = opts.text ?? 'CENTRO COMERCIAL';
  const root = new THREE.Group();
  root.add(mesh(cached(`can:mall:${L}:${W}`, () => {
    const b = new Build();
    // Außenwände (hinter den Läden), Dachrand, Glasdach-Träger
    for (const s of [1, -1]) {
      b.box(L, H + 2, 6, 0xeae4da, { p: [0, (H + 2) / 2, s * (W + 3)] }, 0.1, 1);
      b.box(L, 0.4, 1.2, 0xc8c2b8, { p: [0, 3.9, s * (W - 0.5)] }, 0.05, 1);   // Galerie
      b.box(L, 1.0, 0.1, 0xb8d8e8, { p: [0, 4.6, s * (W - 1.05)] }, 0);        // Glasgeländer
      // Säulen
      for (let x = -L / 2 + 4; x <= L / 2 - 4; x += 8) b.box(0.6, H, 0.6, WHITE, { p: [x, H / 2, s * (W - 0.4)] }, 0.05);
    }
    for (let x = -L / 2; x <= L / 2; x += 5) b.box(0.3, 0.4, W * 2 + 2, 0xd8d8e0, { p: [x, H + 0.2, 0] }, 0.03);
    b.box(L, 0.3, 0.3, 0xd8d8e0, { p: [0, H + 1.2, 0] }, 0.03);
    // Fassaden an den Eingängen: Rahmen um die Öffnung
    for (const xe of [-L / 2, L / 2]) {
      for (const s of [1, -1]) b.box(1.6, H + 5, 7, 0xf2c14e, { p: [xe, (H + 5) / 2, s * (W + 3.5)] }, 0.15, 1);
      b.box(1.6, 4.5, W * 2 + 14, 0xf2c14e, { p: [xe, H + 2.75, 0] }, 0.15, 1);
    }
    // Pflanzkübel mit kleinen Palmen auf der Galerie-Seite
    for (let x = -L / 2 + 8; x <= L / 2 - 8; x += 16) for (const s of [1, -1]) {
      b.cyl(0.7, 0.55, 0.8, 0xd8762a, { p: [x, 4.5, s * (W - 0.5)] }, 10);
      b.cyl(0.08, 0.1, 2.2, 0x8a6a42, { p: [x, 5.9, s * (W - 0.5)] }, 6);
      for (let k = 0; k < 6; k++) b.box(1.4, 0.06, 0.35, 0x3a9a3a, { p: [x + cos(k) * 0.6, 7.0, s * (W - 0.5) + sin(k) * 0.6], r: [0, -k, -0.4] }, 0.02);
    }
    return b.geometry();
  }), vcol(0.6), {}, true));
  // Glasdach
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(L, W * 2 + 2).rotateX(Math.PI / 2), std('can:glass', { color: 0x9ad0ea, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = H + 0.05;
  glass.userData.noShadow = true;
  root.add(glass);
  // Ladenfronten (bunte Schilder und helle Schaufenster) auf beiden Seiten, unten und auf der Galerie
  const n = Math.max(2, Math.floor(L / 9));
  for (let k = 0; k < n; k++) for (const s of [1, -1]) for (const fl of [0, 1]) {
    const [name, col, bg] = SHOPS[(k * 2 + (s > 0 ? 0 : 1) + fl * 3) % SHOPS.length];
    const tex = canvasTexture(`can:shop:${name}`, 512, 384, (x, w, h) => {
      x.fillStyle = bg; x.fillRect(0, 0, w, h);
      x.fillStyle = col; x.fillRect(0, 0, w, 110);
      x.fillStyle = '#ffffff'; x.font = 'bold 76px "Lilita One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, w / 2, 58);
      // Schaufenster mit Auslage
      x.fillStyle = '#cfe8f4'; x.fillRect(24, 140, w - 48, h - 160);
      for (let i = 0; i < 6; i++) { x.fillStyle = ['#ff8a3a', '#3a9ae8', '#ffd23a', '#e83a6a', '#4ab83a', '#b06aff'][(i + k) % 6]; x.fillRect(50 + i * 72, h - 120 - (i % 3) * 30, 50, 90 + (i % 3) * 30); }
      x.strokeStyle = col; x.lineWidth = 14; x.strokeRect(24, 140, w - 48, h - 160);
    });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(L / n - 1.2, 3.4), std(`can:shop:${name}`, { map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }));
    pl.position.set(-L / 2 + (k + 0.5) * (L / n), fl ? 6.3 : 1.9, s * (W - 0.02));
    pl.rotation.y = s > 0 ? Math.PI : 0;
    root.add(pl);
  }
  // Deckenlampen
  const glows = [];
  for (let x = -L / 2 + 5; x < L / 2; x += 10) { const g = glowSprite(0xfff0d0, 3.5, 0.55); g.position.set(x, H - 0.8, 0); root.add(g); glows.push(g); }
  // Schild über den Eingängen
  const tex = canvasTexture(`can:malltext:${text}`, 1024, 160, (x) => {
    x.fillStyle = '#1a6ab8'; x.fillRect(0, 0, 1024, 160);
    x.font = 'bold 100px "Lilita One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText(text, 512, 84);
  });
  for (const s of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(22, W * 2 - 2), 2.6), basic(`can:malltext:${text}`, { map: tex }));
    pl.position.set(s * (L / 2 + 0.82), H + 2.6, 0);
    pl.rotation.y = s * Math.PI / 2;
    root.add(pl);
  }
  return makeModel('mall', root, () => {});
}

function drago() {
  const root = new THREE.Group();
  root.add(mesh(cached('can:drago', () => {
    const b = new Build();
    b.cyl(0.9, 1.5, 4.2, 0xa8a090, { p: [0, 2.1, 0] }, 12);
    b.sphere(1.6, 0xa8a090, { p: [0, 0.3, 0], s: [1, 0.4, 1] }, 12, 6);
    const tips = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU + 0.3, l = 2.4 + (k % 3) * 0.5, tilt = 0.75;
      const ex = cos(a) * sin(tilt) * l, ey = 4.2 + cos(tilt) * l, ez = sin(a) * sin(tilt) * l;
      b.cyl(0.32, 0.5, l, 0xb0a898, { p: [ex / 2, 4.2 + (ey - 4.2) / 2, ez / 2], r: [sin(a) * tilt, 0, -cos(a) * tilt] }, 8);
      tips.push([ex, ey, ez]);
      // zweite Gabelung
      for (const d of [-0.5, 0.5]) {
        const a2 = a + d, l2 = 1.4, fx = ex + cos(a2) * 0.7 * l2, fy = ey + 0.75 * l2, fz = ez + sin(a2) * 0.7 * l2;
        b.cyl(0.18, 0.28, l2, 0xb0a898, { p: [(ex + fx) / 2, (ey + fy) / 2, (ez + fz) / 2], r: [sin(a2) * 0.75, 0, -cos(a2) * 0.75] }, 6);
        tips.push([fx, fy, fz]);
      }
    }
    // Blattschöpfe: Büschel spitzer Blätter
    for (const [x, y, z] of tips) {
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * TAU;
        b.cone(0.12, 1.5, k % 2 ? 0x4a7a3a : 0x5a8a42, { p: [x + cos(a) * 0.4, y + 0.35, z + sin(a) * 0.4], r: [sin(a) * 1.1, 0, -cos(a) * 1.1] }, 4);
      }
      b.sphere(0.45, 0x4a7a3a, { p: [x, y + 0.3, z], s: [1, 0.6, 1] }, 8, 5);
    }
    return b.geometry();
  }), vcol(0.8), {}, true));
  return makeModel('drago', root, () => {});
}

function bananaPlant() {
  const root = new THREE.Group();
  const leaves = joint([0, 2.6, 0]);
  root.add(mesh(cached('can:banana:stem', () => new Build()
    .cyl(0.16, 0.24, 2.7, 0x7a8a3a, { p: [0, 1.35, 0] }, 8)
    .cyl(0.05, 0.05, 0.8, 0x6a7a2a, { p: [0.35, 1.9, 0], r: [0, 0, 0.9] }, 5)
    .capsule(0.16, 0.5, 0x9ac83a, { p: [0.62, 1.5, 0] }, 3, 6)
    .cone(0.13, 0.4, 0x8a2a4a, { p: [0.66, 1.0, 0], r: [Math.PI, 0, 0] }, 6)
    .geometry()), vcol(0.7), {}, true));
  leaves.add(mesh(cached('can:banana:leaves', () => {
    const b = new Build();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU;
      b.box(2.2, 0.04, 0.6, k % 2 ? 0x4aa83a : 0x5ab842, { p: [cos(a) * 1.0, 0.3 - (k % 3) * 0.1, sin(a) * 1.0], r: [0, -a, -0.35 - (k % 2) * 0.2] }, 0.02);
    }
    return b.geometry();
  }), vcol(0.7), {}, true));
  root.add(leaves);
  const clk = new Clock();
  return makeModel('banana_plant', root, (dt) => { clk.tick(dt, 'idle'); leaves.rotation.y = sin(clk.t * 0.6) * 0.06; leaves.rotation.z = sin(clk.t * 0.9) * 0.03; });
}

function teidePeak(opts = {}) {
  const H = opts.h ?? 40, R = opts.r ?? 55;
  const root = new THREE.Group();
  root.add(mesh(cached(`can:teide:${H}:${R}`, () => {
    const b = new Build();
    // Kegel mit Krater oben; Farbe nach Höhe: rotbraune Lava, oben Schnee
    const pts = [[R * 1.35, -18], [R * 1.12, -6], [R, 0], [R * 0.78, H * 0.18], [R * 0.5, H * 0.5], [R * 0.3, H * 0.78], [R * 0.16, H * 0.97], [R * 0.11, H], [R * 0.07, H * 0.9], [0.01, H * 0.9]];
    b.lathe(pts, (x, y, z) => {
      if (y > H * 0.72 + sin(Math.atan2(z, x) * 7) * H * 0.05) return 0xf4f6fa;
      if (y > H * 0.55) return 0x8a6a5a;
      return (Math.floor(Math.atan2(z, x) * 5 + y * 0.3) % 2) ? 0x7a4a3a : 0x6a3e32;
    }, {}, 28);
    // Lavazungen am Fuß
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.4; b.sphere(R * 0.18, 0x3a3034, { p: [cos(a) * R * 0.85, H * 0.03, sin(a) * R * 0.85], s: [1.6, 0.25, 0.8], r: [0, -a, 0] }, 10, 6); }
    return b.geometry();
  }), vcol(0.9), {}, true));
  return makeModel('teide_peak', root, () => {});
}

function cafeSet(opts = {}) {
  const c = opts.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`can:cafe:${c}`, () => {
    const b = new Build();
    b.cyl(0.05, 0.05, 2.5, 0xe8e8e8, { p: [0, 1.25, 0] }, 6);
    b.cone(1.6, 0.6, (x, y, z) => (Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 4)) % 2 ? c : 0xffffff), { p: [0, 2.6, 0] }, 16);
    b.cyl(0.5, 0.5, 0.06, 0xffffff, { p: [0, 0.75, 0] }, 14);
    b.cyl(0.06, 0.08, 0.75, 0x9a9aa0, { p: [0, 0.37, 0] }, 6);
    for (let k = 0; k < 4; k++) {
      const a = k * TAU / 4 + 0.4, x = cos(a) * 0.95, z = sin(a) * 0.95;
      b.box(0.42, 0.06, 0.42, 0x8a5a3a, { p: [x, 0.45, z], r: [0, -a, 0] }, 0.02);
      b.box(0.06, 0.45, 0.42, 0x8a5a3a, { p: [x + cos(a) * 0.2, 0.68, z + sin(a) * 0.2], r: [0, -a, 0] }, 0.02);
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.cyl(0.02, 0.02, 0.45, 0x6a6a70, { p: [x + dx * 0.17, 0.22, z + dz * 0.17] }, 4);
    }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('cafe_set', root, () => {});
}

function strelitzia() {
  const root = new THREE.Group();
  root.add(mesh(cached('can:strelitzia', () => {
    const b = new Build();
    b.box(2.4, 0.4, 1.2, 0x8a6a4a, { p: [0, 0.2, 0] }, 0.1);
    for (let k = 0; k < 7; k++) {
      const x = -0.9 + k * 0.3, z = (k % 2 ? 0.25 : -0.25);
      b.cyl(0.02, 0.025, 0.9, 0x4a8a3a, { p: [x, 0.85, z] }, 4);
      b.box(0.08, 0.5, 0.25, 0x3a7a32, { p: [x + 0.1, 0.7, z], r: [0, 0, 0.4] }, 0.02);
      b.cone(0.05, 0.4, 0xff8a1a, { p: [x + 0.12, 1.32, z], r: [0, 0, -1.2] }, 4);
      b.cone(0.035, 0.28, 0x3a5ae8, { p: [x + 0.1, 1.38, z], r: [0, 0, -1.0] }, 4);
      b.box(0.3, 0.05, 0.06, 0x6a7a3a, { p: [x + 0.05, 1.28, z] }, 0.01);
    }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('strelitzia', root, () => {});
}

function teleferico() {
  const root = new THREE.Group();
  root.add(mesh(cached('can:teleferico:mast', () => {
    const b = new Build();
    for (const z of [-32, 32]) {
      b.box(0.8, 22, 0.8, 0xd8dce4, { p: [0, 11, z] }, 0.05);
      b.box(0.6, 0.6, 6, 0xd8dce4, { p: [0, 22, z] }, 0.05);
      b.box(2.4, 1.2, 2.4, 0x8a8e9a, { p: [0, 0.6, z] }, 0.1);
    }
    for (const x of [-2.5, 2.5]) b.cyl(0.04, 0.04, 64, 0x3a3a44, { p: [x, 22.3, 0], r: [Math.PI / 2, 0, 0] }, 4);
    return b.geometry();
  }), vcol(0.5), {}, true));
  // zwei Kabinen, die sich auf den Seilen begegnen
  const cabins = [];
  for (const side of [-1, 1]) {
    const cabin = joint([side * 2.5, 22.3, 0]);
    cabin.add(mesh(cached('can:teleferico:cabin', () => new Build()
      .cyl(0.05, 0.05, 2.6, 0x3a3a44, { p: [0, -1.3, 0] }, 4)
      .box(2.2, 2.2, 2.8, 0xe8392d, { p: [0, -3.6, 0] }, 0.3)
      .box(2.25, 0.9, 2.85, 0x9ad0ea, { p: [0, -3.2, 0] }, 0.1)
      .geometry()), vcol(0.5), {}, true));
    root.add(cabin);
    cabins.push(cabin);
  }
  const clk = new Clock();
  return makeModel('teleferico', root, (dt) => {
    clk.tick(dt, 'idle');
    const f = sin(clk.t * 0.12) * 27;
    cabins[0].position.z = f; cabins[1].position.z = -f;
    for (const c of cabins) c.rotation.x = sin(clk.t * 1.3) * 0.05;
  });
}

function guagua() {
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('can:guagua', () => {
    const b = new Build();
    b.box(10, 2.6, 2.5, (x, y) => (y > 2.1 ? 0x2aa84a : y > 1.3 ? 0xfaf8f4 : 0x2aa84a), { p: [0, 1.75, 0] }, 0.25, 1);
    b.box(9.4, 0.85, 2.54, 0x2a3a4a, { p: [-0.2, 2.25, 0] }, 0.05);         // Fensterband
    b.box(0.08, 1.4, 2.2, 0x2a3a4a, { p: [5.0, 2.0, 0] }, 0.05);            // Frontscheibe
    b.box(0.1, 0.4, 2.0, 0x1a1a22, { p: [5.02, 3.0, 0] }, 0.02);            // Zielanzeige
    for (const [x, z] of [[3.4, 1.1], [3.4, -1.1], [-3.2, 1.1], [-3.2, -1.1]]) b.cyl(0.5, 0.5, 0.35, 0x1a1a22, { p: [x, 0.5, z], r: [Math.PI / 2, 0, 0] }, 14);
    b.box(0.6, 0.3, 2.3, 0xc8ccd4, { p: [-4.9, 3.15, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const tex = canvasTexture('can:guagua:text', 512, 64, (x) => { x.fillStyle = '#1a1a22'; x.fillRect(0, 0, 512, 64); x.font = 'bold 50px "Lilita One", sans-serif'; x.fillStyle = '#ffb21a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GUAGUA · TEIDE', 256, 34); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.3), basic('can:guagua:text', { map: tex }));
  sign.position.set(5.08, 3.0, 0); sign.rotation.y = Math.PI / 2;
  body.add(sign);
  root.add(body);
  return makeModel('guagua', root, (dt, st) => { if (st.anim === 'squashed') body.scale.set(1.05, 0.5, 1.05); else body.scale.setScalar(1); });
}

function cabra() {
  const root = new THREE.Group();
  const body = joint([0, 0.75, 0]);
  body.add(mesh(cached('can:cabra', () => {
    const b = new Build();
    b.capsule(0.28, 0.7, 0x8a6a4a, { r: [0, 0, Math.PI / 2] }, 3, 8);
    b.sphere(0.2, 0x8a6a4a, { p: [0.62, 0.25, 0], s: [1.3, 0.9, 0.8] }, 10, 8);
    b.sphere(0.1, 0x3a2a22, { p: [0.84, 0.18, 0] }, 8, 6);
    for (const s of [1, -1]) {
      b.cone(0.04, 0.32, 0xd8c8a8, { p: [0.55, 0.5, s * 0.1], r: [s * -0.3, 0, 0.6] }, 5);
      b.box(0.14, 0.05, 0.08, 0x6a4a32, { p: [0.55, 0.32, s * 0.2], r: [s * 0.4, 0, 0] }, 0.01);
    }
    b.cone(0.04, 0.16, 0xf0e8d8, { p: [0.78, 0.0, 0], r: [Math.PI, 0, 0] }, 5);   // Bart
    b.cone(0.06, 0.18, 0x6a4a32, { p: [-0.6, 0.15, 0], r: [0, 0, 1.0] }, 5);       // Schwanz
    return b.geometry();
  }), vcol(0.8), {}, true));
  const legs = [];
  for (const [x, z] of [[0.35, 0.14], [0.35, -0.14], [-0.35, 0.14], [-0.35, -0.14]]) {
    const leg = joint([x, -0.12, z], mesh(cached('can:cabra:leg', () => new Build().cyl(0.05, 0.04, 0.62, 0x6a4a32, { p: [0, -0.31, 0] }, 6).geometry()), vcol(0.8)));
    body.add(leg); legs.push(leg);
  }
  root.add(body);
  const clk = new Clock();
  return makeModel('cabra', root, (dt, st) => {
    clk.tick(dt, st.anim ?? 'idle');
    if (st.anim === 'squashed') { body.scale.set(1.1, 0.35, 1.1); return; }
    body.scale.setScalar(1);
    const w = st.anim === 'walk' ? 1 : 0.15;
    legs.forEach((l, k) => { l.rotation.z = sin(clk.t * 9 + (k % 2 ? 0 : Math.PI) + (k > 1 ? Math.PI / 2 : 0)) * 0.5 * w; });
    body.position.y = 0.75 + Math.abs(sin(clk.t * 9)) * 0.04 * w;
  });
}

export const MODELS = {
  canary_house: canaryHouse, canary_church: canaryChurch, mall, drago, banana_plant: bananaPlant,
  teide_peak: teidePeak, cafe_set: cafeSet, strelitzia, teleferico, guagua, cabra,
};

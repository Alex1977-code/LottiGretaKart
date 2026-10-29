// Modelle für die Strecken nach dem Vorbild von Mario Kart 8 Deluxe (eigene Gestaltung):
// tram          Straßenbahn der Hafenstadt (gelb-rot, Stromabnehmer), fährt im Verkehr mit
// grandstand    Tribüne mit bunten Sitzreihen und Dach (Buckelpisten-Arena), opts { length, rows }
// waterfall     hoher Wasserfall mit fließenden Streifen, Gischt und Becken, opts { h, w }
// palace        Schloss mit hellen Mauern, runden Türmen und roten Spitzdächern, opts { scale }
// mine_cart     Lore auf Schienen (Wasserfall-Schlucht)

import * as THREE from 'three';
import { Build, mesh, vcol, basic, cached, joint, makeModel, canvasTexture } from '../lib/kit.js';

function tram() {
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('rw:tram', () => {
    const b = new Build();
    b.box(11, 2.7, 2.6, (x, y) => (y > 2.3 ? 0xe8392d : y > 1.2 ? 0xffd23a : 0xe8392d), { p: [0, 1.85, 0] }, 0.3, 1);
    b.box(10.4, 0.95, 2.64, 0x2a3a4a, { p: [0, 2.3, 0] }, 0.05);            // Fensterband
    for (const s of [1, -1]) b.box(0.08, 1.4, 2.3, 0x2a3a4a, { p: [s * 5.52, 2.15, 0] }, 0.05);   // Front- und Heckscheibe
    b.box(11.2, 0.25, 2.8, 0xfaf6ee, { p: [0, 3.3, 0] }, 0.08);             // Dach
    b.box(1.6, 0.3, 1.2, 0x3a3a44, { p: [0, 3.55, 0] }, 0.05);              // Stromabnehmer-Sockel
    b.box(0.08, 1.6, 0.08, 0x2a2a30, { p: [0, 4.4, 0], r: [0, 0, 0.5] }, 0.01);
    for (const x of [3.6, -3.6]) for (const z of [1.15, -1.15]) b.cyl(0.42, 0.42, 0.3, 0x1a1a22, { p: [x, 0.45, z], r: [Math.PI / 2, 0, 0] }, 14);
    for (const s of [1, -1]) b.sphere(0.18, 0xfff6dc, { p: [s * 5.58, 1.1, 0] }, 8, 6);
    return b.geometry();
  }), vcol(0.45), {}, true));
  const tex = canvasTexture('rw:tram:text', 512, 64, (x) => { x.fillStyle = '#1a1a22'; x.fillRect(0, 0, 512, 64); x.font = 'bold 48px "Lilita One", sans-serif'; x.fillStyle = '#ffd23a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LINIE 8 · HAFEN', 256, 34); });
  for (const s of [1, -1]) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.3), basic('rw:tram:text', { map: tex }));
    sign.position.set(s * 5.6, 3.0, 0); sign.rotation.y = s * Math.PI / 2;
    body.add(sign);
  }
  root.add(body);
  return makeModel('tram', root, (dt, st) => { if (st.anim === 'squashed') body.scale.set(1.05, 0.5, 1.05); else body.scale.setScalar(1); });
}

/** Tribüne: Stufen ansteigend nach hinten, Zuschauer als bunte Klötzchen, Dach auf Stützen; blickt nach +X. */
function grandstand(o = {}) {
  const L = o.length ?? 40, R = o.rows ?? 6;
  const root = new THREE.Group();
  // gebaut mit Länge entlang X und Reihen nach +Z – gedreht, damit die Tribüne nach +X (zur Strecke) blickt
  const stand = new THREE.Group();
  stand.rotation.y = -Math.PI / 2;
  root.add(stand);
  stand.add(mesh(cached(`rw:stand:${L}:${R}`, () => {
    const b = new Build();
    const fans = [0xe8392d, 0x2a6ab8, 0xffc21a, 0x4fb833, 0xff6aa8, 0xfaf6ee, 0xb47fe6, 0xff8a2a];
    let k = 0;
    for (let r = 0; r < R; r++) {
      const y = 0.6 + r * 0.9, z = 1 + r * 1.3;
      b.box(L, 0.9, 1.3, r % 2 ? 0xd8d4e0 : 0xc8c4d4, { p: [0, y - 0.45, z] }, 0);
      b.box(L, y - 0.9 > 0 ? y - 0.9 : 0.01, 1.3, 0x8a8698, { p: [0, (y - 0.9) / 2, z] }, 0);
      for (let x = -L / 2 + 0.8; x < L / 2 - 0.5; x += 1.1) {
        k++;
        if ((k * 7) % 5 === 0) continue;
        const c = fans[(k * 13 + r * 3) % fans.length];
        b.box(0.5, 0.55, 0.4, c, { p: [x + ((k * 17) % 5) * 0.06, y + 0.28, z - 0.1] }, 0.08, 1);
        b.sphere(0.2, 0xf2c8a0, { p: [x + ((k * 17) % 5) * 0.06, y + 0.72, z - 0.1] }, 6, 4);
      }
    }
    const top = 0.6 + R * 0.9 + 3, back = 1 + R * 1.3;
    for (let x = -L / 2; x <= L / 2 + 0.01; x += L / 4) b.box(0.35, top, 0.35, 0xfaf6ee, { p: [x, top / 2, back] }, 0.05);
    b.box(L + 2, 0.3, back + 1.5, 0xe8392d, { p: [0, top, back / 2 + 0.3], r: [-0.08, 0, 0] }, 0.08);
    b.box(L, 1.2, 0.3, 0x2a6ab8, { p: [0, 0.6, 0.2] }, 0.05);      // Bande vorn
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('grandstand', root, () => {});
}

/** Märchenschloss: helle Mauern, runde Ecktürme und hoher Mittelturm mit roten Spitzdächern, Tor nach +X. */
function palace() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:palace', () => {
    const b = new Build();
    const wall = 0xf6efe4, trim = 0xe8d8c0, roof = 0xd8303a, win = 0x3a4a7a, gold = 0xffc21a;
    b.box(26, 14, 22, wall, { p: [0, 7, 0] }, 0.3);                       // Hauptbau
    b.box(27, 1, 23, trim, { p: [0, 14.2, 0] }, 0.2);
    for (let x = -11; x <= 11; x += 2.2) b.box(1.1, 1.4, 23.4, wall, { p: [x, 15.3, 0] }, 0.1);   // Zinnen
    b.box(4, 6, 0.6, 0x5a3a2a, { p: [13.1, 3, 0] }, 0.2);                 // Tor
    b.cyl(2, 2, 0.6, 0x5a3a2a, { p: [13.1, 6, 0], r: [0, 0, Math.PI / 2] }, 16);
    for (const y of [5, 10]) for (let z = -8; z <= 8; z += 4) if (Math.abs(z) > 2 || y > 6) b.box(0.3, 2, 1.2, win, { p: [13.05, y, z] }, 0.1);
    for (const [x, z] of [[13, 11], [13, -11], [-13, 11], [-13, -11]]) {   // Ecktürme
      b.cyl(3.2, 3.4, 20, wall, { p: [x, 10, z] }, 20);
      b.cyl(3.6, 3.6, 0.8, trim, { p: [x, 20.2, z] }, 20);
      b.cone(4, 8, roof, { p: [x, 24.6, z] }, 20);
      b.sphere(0.4, gold, { p: [x, 28.8, z] }, 8, 6);
      for (const y of [8, 14]) b.box(0.3, 1.8, 1, win, { p: [x + Math.sign(x) * 3.3, y, z] }, 0.1);
    }
    b.cyl(5, 5.4, 30, wall, { p: [0, 15, 0] }, 24);                       // Mittelturm
    b.cyl(5.6, 5.6, 1, trim, { p: [0, 30.4, 0] }, 24);
    b.cone(6.4, 13, roof, { p: [0, 37.5, 0] }, 24);
    b.sphere(0.7, gold, { p: [0, 44.4, 0] }, 10, 8);
    b.cyl(2.4, 2.4, 0.3, 0xffffff, { p: [5.3, 22, 0], r: [0, 0, Math.PI / 2] }, 24);   // Rundfenster
    b.cyl(1.9, 1.9, 0.35, 0xff6aa8, { p: [5.35, 22, 0], r: [0, 0, Math.PI / 2] }, 24);
    for (const z of [-3, 3]) { b.cyl(1.6, 1.8, 18, wall, { p: [6, 9, z * 2.6] }, 16); b.cone(2, 5, roof, { p: [6, 20.5, z * 2.6] }, 16); }
    return b.geometry();
  }), vcol(0.55), {}, true));
  return makeModel('palace', root, () => {});
}

/** Wasserfall: fließender Vorhang (bewegte Streifen) von oben bis zum Fuß, Gischt unten; blickt nach +X.
 *  opts { h: Länge, w: Breite, tilt: Neigung nach hinten (rad) }. */
function waterfall(o = {}) {
  const H = o.h ?? 28, Wd = o.w ?? 18;
  const root = new THREE.Group();
  const tex = canvasTexture('rw:waterfall', 128, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#7fd4f4'); g.addColorStop(0.5, '#b8ecfc'); g.addColorStop(1, '#7fd4f4');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) {
      x.fillStyle = `rgba(255,255,255,${0.25 + (k % 5) * 0.12})`;
      const sx = (k * 37) % w, sy = (k * 91) % h;
      x.fillRect(sx, sy, 2 + (k % 3) * 2, 30 + (k % 7) * 14);
    }
  }, { repeat: true });
  const geo = cached(`rw:waterfall:${Wd}:${H}`, () => {
    // leicht gewölbter Vorhang (Teil eines Zylinders), unten etwas nach vorn
    const g = new THREE.CylinderGeometry(Wd * 1.2, Wd * 1.2, H, 16, 6, true, Math.PI / 2 - 0.45, 0.9);   // Bogen um +X
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * H / 10);
    g.translate(-Wd * 1.2, H / 2, 0);
    return g;
  });
  const mat = basic('rw:waterfall', { map: tex, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false });
  const curtain = new THREE.Mesh(geo, mat);
  curtain.rotation.z = o.tilt ?? 0;   // oben nach hinten an die Felswand gelehnt
  curtain.renderOrder = 3;
  root.add(curtain);
  // Gischt am Fuß
  root.add(mesh(cached(`rw:foam:${Wd}`, () => {
    const b = new Build();
    for (let k = 0; k < 9; k++) b.sphere(1.6 + (k % 3) * 0.7, 0xffffff, { p: [0.5 + (k % 2), 0.4, -Wd * 0.4 + (k / 8) * Wd * 0.8], s: [1.3, 0.55, 1.2] }, 10, 6);
    return b.geometry();
  }), vcol(0.9, { transparent: true, opacity: 0.85 }, 'foam')));
  return makeModel('waterfall', root, (dt) => { tex.offset.y += dt * 0.9; });
}

/** Lore: Holzkasten auf Rädern, beladen mit bunten Kristallen. */
function mineCart() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:minecart', () => {
    const b = new Build();
    b.box(3.2, 1.4, 2.0, 0x8a5a32, { p: [0, 1.2, 0] }, 0.12);
    b.box(3.4, 0.2, 2.2, 0x5a3a22, { p: [0, 1.95, 0] }, 0.05);
    for (const x of [-1.6, 1.6]) b.box(0.15, 1.45, 2.2, 0x6a6a74, { p: [x, 1.2, 0] }, 0.02);
    for (const x of [-1, 1]) for (const z of [-1, 1]) b.cyl(0.42, 0.42, 0.22, 0x3a3a44, { p: [x, 0.42, z * 1.02], r: [Math.PI / 2, 0, 0] }, 12);
    const gems = [0xff6aa8, 0x58b8ff, 0xffd21f, 0x7ae85a, 0xb47fe6];
    for (let k = 0; k < 7; k++) b.cone(0.35, 0.9, gems[k % 5], { p: [-1 + (k % 4) * 0.65, 2.25, -0.5 + (k % 2) * 0.9], r: [0.2 * (k % 3), 0, 0.15 * (k % 2)] }, 5);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('mine_cart', root, () => {});
}

export const MODELS = { tram, grandstand, palace, waterfall, mine_cart: mineCart };

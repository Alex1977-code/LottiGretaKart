// Modelle für die Strecken nach dem Vorbild von Mario Kart 8 Deluxe (eigene Gestaltung):
// tram          Straßenbahn der Hafenstadt (gelb-rot, Stromabnehmer), fährt im Verkehr mit
// grandstand    Tribüne mit bunten Sitzreihen und Dach (Buckelpisten-Arena), opts { length, rows }
// waterfall     hoher Wasserfall mit fließenden Streifen, Gischt und Becken, opts { h, w }
// palace        Schloss mit hellen Mauern, runden Türmen und roten Spitzdächern, opts { scale }
// mine_cart     Lore auf Schienen (Wasserfall-Schlucht)
// jumbotron     Großbildschirm auf Stelzen mit laufender Anzeige (Kart-Stadion), opts { text }
// balloons      Traube bunter Luftballons, die sanft schaukeln
// ferris_wheel  Riesenrad mit bunten Gondeln, dreht sich (Seepark)
// carousel      Karussell mit Pferdchen und gestreiftem Dach, dreht sich
// water_slide   Wasserrutsche: Turm mit gewundener Rutsche ins Becken
// cake          Torte mit Sahnehäubchen und Kirschen (Zuckerschlucht), opts { tiers, color }
// temple_pillar Säule eines Dschungeltempels mit Moos, opts { h, broken }
// stone_face    riesiges Steingesicht (Tempelruinen)
// step_pyramid  Stufenpyramide mit Treppe und Tempelhaus, opts { h }
// temple_gate   Tempeltor zum Durchfahren (Breite opts.width)

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

/** Großbildschirm: Rahmen auf zwei Stelzen, Bild mit Schachbrett-Streifen und laufendem Schriftzug; blickt nach +X. */
function jumbotron(o = {}) {
  const text = o.text ?? 'LOTTI & GRETA KART';
  const root = new THREE.Group();
  root.add(mesh(cached('rw:jumbo', () => {
    const b = new Build();
    for (const z of [-5, 5]) b.box(0.6, 9, 0.6, 0x3a3a48, { p: [-0.4, 4.5, z] }, 0.05);
    b.box(0.8, 6.4, 13.4, 0x23232e, { p: [-0.3, 11.5, 0] }, 0.2);
    b.box(0.9, 0.5, 13.6, 0xffc21a, { p: [-0.25, 14.9, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.5), {}, true));
  const tex = canvasTexture(`rw:jumbo:${text}`, 1024, 448, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e6cff'); g.addColorStop(1, '#0a2a8a');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 32; k++) { x.fillStyle = k % 2 ? '#ffffff' : '#1a1a22'; x.fillRect(k * 32, 0, 32, 28); x.fillStyle = k % 2 ? '#1a1a22' : '#ffffff'; x.fillRect(k * 32, h - 28, 32, 28); }
    x.font = 'bold 96px "Lilita One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 14; x.strokeStyle = '#2a1e3e'; x.strokeText(text, w / 2, h / 2);
    x.fillStyle = '#ffd23a'; x.fillText(text, w / 2, h / 2);
  }, { repeat: true });
  const mat = basic(`rw:jumbo:${text}`, { map: tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 5.4), mat);
  screen.position.set(0.12, 11.5, 0); screen.rotation.y = Math.PI / 2;
  root.add(screen);
  return makeModel('jumbotron', root, (dt) => { tex.offset.x = (tex.offset.x + dt * 0.08) % 1; });
}

/** Luftballon-Traube: bunte Ballons an Schnüren, schaukeln im Wind. */
function balloons() {
  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);
  bob.add(mesh(cached('rw:balloons', () => {
    const b = new Build();
    const cols = [0xe8392d, 0xffc21a, 0x2a8cff, 0x4fb833, 0xff6aa8, 0xb47fe6, 0xff8a2a];
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9, r = k ? 0.7 : 0, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 4.2 + (k % 3) * 0.5;
      b.sphere(0.55, cols[k], { p: [x, y, z], s: [1, 1.2, 1] }, 14, 10);
      b.cone(0.08, 0.16, cols[k], { p: [x, y - 0.68, z], r: [Math.PI, 0, 0] }, 6);
      const L = y - 0.7;
      b.cyl(0.012, 0.012, L, 0xf4f4f4, { p: [x / 2, L / 2, z / 2], r: [z * 0.12, 0, -x * 0.12] }, 4);
    }
    return b.geometry();
  }), vcol(0.25), {}, false));
  let t = Math.random() * 10;
  return makeModel('balloons', root, (dt) => { t += dt; bob.rotation.set(Math.sin(t * 0.9) * 0.06, t * 0.1, Math.cos(t * 0.7) * 0.06); });
}

/** Riesenrad: zwei Speichenräder, bunte Gondeln (bleiben waagerecht), dreht sich langsam; Rad in der X-Y-Ebene. */
function ferrisWheel(o = {}) {
  const R = o.r ?? 16;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:ferris:base:${R}`, () => {
    const b = new Build();
    for (const z of [-2.4, 2.4]) for (const s of [-1, 1]) b.box(0.5, R + 4, 0.5, 0xfaf6ee, { p: [s * R * 0.32, (R + 4) / 2, z], r: [0, 0, -s * 0.3] }, 0.05);
    b.box(R * 0.9, 0.8, 6, 0xe8392d, { p: [0, 0.4, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.5), {}, true));
  const wheel = new THREE.Group();
  wheel.position.y = R + 3.4;
  root.add(wheel);
  wheel.add(mesh(cached(`rw:ferris:wheel:${R}`, () => {
    const b = new Build();
    for (const z of [-1.8, 1.8]) {
      b.add(new THREE.TorusGeometry(R, 0.28, 8, 48), 0xff6aa8, { p: [0, 0, z] });
      b.add(new THREE.TorusGeometry(R * 0.55, 0.18, 6, 32), 0xffc21a, { p: [0, 0, z] });
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; b.box(R, 0.16, 0.16, 0xfaf6ee, { p: [Math.cos(a) * R / 2, Math.sin(a) * R / 2, z], r: [0, 0, a] }, 0.02); }
    }
    b.cyl(1, 1, 4.4, 0x3a3a48, { r: [Math.PI / 2, 0, 0] }, 16);
    return b.geometry();
  }), vcol(0.4), {}, false));
  const cabins = [];
  const cols = [0xe8392d, 0x2a8cff, 0xffc21a, 0x4fb833, 0xb47fe6, 0xff8a2a, 0x3ac0d8, 0xff6aa8];
  for (let k = 0; k < 16; k++) {
    const g = mesh(cached(`rw:ferris:cab:${k % 8}`, () => {
      const b = new Build();
      b.box(1.8, 1.6, 2.4, cols[k % 8], { p: [0, -1.4, 0] }, 0.3);
      b.box(1.9, 0.25, 2.6, 0xfaf6ee, { p: [0, -0.5, 0] }, 0.1);
      b.cyl(0.06, 0.06, 0.6, 0x3a3a48, { p: [0, -0.2, 0] }, 6);
      return b.geometry();
    }), vcol(0.45), {}, false);
    root.add(g);
    cabins.push(g);
  }
  let a0 = Math.random() * 6;
  return makeModel('ferris_wheel', root, (dt) => {
    a0 += dt * 0.12;
    wheel.rotation.z = a0;
    cabins.forEach((c, k) => { const a = a0 + (k / 16) * Math.PI * 2; c.position.set(Math.cos(a) * R, wheel.position.y + Math.sin(a) * R, 0); });
  });
}

/** Karussell: rundes Podest, gestreiftes Kegeldach, Pferdchen auf Stangen, dreht sich und wippt. */
function carousel() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:carousel:base', () => {
    const b = new Build();
    b.cyl(7, 7.4, 0.8, 0xfaf6ee, { p: [0, 0.4, 0] }, 32);
    b.cyl(1.2, 1.2, 6, 0xffc21a, { p: [0, 3.4, 0] }, 16);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const top = new THREE.Group();
  root.add(top);
  top.add(mesh(cached('rw:carousel:top', () => {
    const b = new Build();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      b.add(new THREE.ConeGeometry(7.6, 3, 12, 1, false, a, Math.PI / 6), k % 2 ? 0xe8392d : 0xfaf6ee, { p: [0, 7.9, 0] });
    }
    b.cyl(7.7, 7.7, 0.8, 0xffc21a, { p: [0, 6.2, 0] }, 32, true);
    b.sphere(0.6, 0xffc21a, { p: [0, 9.6, 0] }, 10, 8);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, x = Math.cos(a) * 5, z = Math.sin(a) * 5;
      b.cyl(0.08, 0.08, 5.2, 0xffd23a, { p: [x, 3.6, z] }, 6);
      const c = [0xfaf6ee, 0x8a5a3a, 0xff6aa8, 0x58b8ff][k % 4];
      b.box(1.6, 0.7, 0.5, c, { p: [x, 2.4 + (k % 2) * 0.5, z], r: [0, -a + Math.PI / 2, 0] }, 0.2);
      b.sphere(0.32, c, { p: [x + Math.cos(a + Math.PI / 2) * 0.8, 2.9 + (k % 2) * 0.5, z + Math.sin(a + Math.PI / 2) * 0.8] }, 8, 6);
    }
    return b.geometry();
  }), vcol(0.4), {}, true));
  return makeModel('carousel', root, (dt) => { top.rotation.y += dt * 0.6; });
}

/** Wasserrutsche: Turm mit Plattform, gewundene Rutsche (Röhre) hinunter ins Becken. */
function waterSlide() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:slide', () => {
    const b = new Build();
    for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) b.box(0.4, 12, 0.4, 0xfaf6ee, { p: [x, 6, z] }, 0.05);
    b.box(5, 0.4, 5, 0x2a8cff, { p: [0, 12, 0] }, 0.1);
    b.cone(3.6, 2.4, 0xffc21a, { p: [0, 14, 0] }, 12);
    const pts = [];
    for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * Math.PI * 3.2; pts.push(new THREE.Vector3(Math.cos(a) * (4 + t * 3), 12 - t * 11, Math.sin(a) * (4 + t * 3))); }
    b.tube(pts, 0.9, 0xff6aa8, {}, 80, 10);
    b.cyl(6, 6, 0.5, 0x3ac0d8, { p: [Math.cos(Math.PI * 3.2) * 7, 0.3, Math.sin(Math.PI * 3.2) * 7] }, 24);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('water_slide', root, () => {});
}

/** Torte: Stockwerke mit Sahnerand, Glasur-Tropfen und Kirschen obenauf. */
function cake(o = {}) {
  const T = o.tiers ?? 3, C = o.color ?? 0xffb8d8;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:cake:${T}:${C}`, () => {
    const b = new Build();
    let y = 0;
    for (let t = 0; t < T; t++) {
      const r = 6 - t * 1.6, h = 3;
      b.cyl(r, r, h, t % 2 ? 0xfff2e0 : C, { p: [0, y + h / 2, 0] }, 28);
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.sphere(0.45, 0xffffff, { p: [Math.cos(a) * r, y + h, Math.sin(a) * r] }, 8, 6); }
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.3; b.capsule(0.22, 0.6 + (k % 3) * 0.4, 0x7a3a2a, { p: [Math.cos(a) * r, y + h - 0.6, Math.sin(a) * r] }, 3, 6); }
      y += h;
    }
    for (let k = 0; k < 3; k++) b.sphere(0.6, 0xe8102d, { p: [Math.cos(k * 2.1) * 0.9, y + 0.5, Math.sin(k * 2.1) * 0.9] }, 10, 8);
    return b.geometry();
  }), vcol(0.35), {}, true));
  return makeModel('cake', root, () => {});
}

/** Tempelsäule aus Sandstein mit Moosflecken; broken: abgebrochen und schief. */
function templePillar(o = {}) {
  const H = o.h ?? 10, broken = !!o.broken;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:pillar:${H}:${broken}`, () => {
    const b = new Build();
    b.box(2.6, 0.8, 2.6, 0xc8a46a, { p: [0, 0.4, 0] }, 0.1);
    const h = broken ? H * 0.6 : H;
    for (let k = 0; k < 4; k++) b.cyl(1, 1.05, h / 4 - 0.05, k % 2 ? 0xd8b47a : 0xccaa70, { p: [0, 0.8 + (k + 0.5) * h / 4, 0], r: [broken ? 0.04 * k : 0, 0, broken ? 0.05 * k : 0] }, 14);
    if (!broken) b.box(2.8, 0.8, 2.8, 0xc8a46a, { p: [0, h + 1.2, 0] }, 0.1);
    for (let k = 0; k < 5; k++) b.sphere(0.5 + (k % 2) * 0.3, 0x5a8a3a, { p: [Math.cos(k * 1.7) * 1, 1 + k * h / 6, Math.sin(k * 1.7) * 1], s: [1, 0.5, 1] }, 8, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('temple_pillar', root, () => {});
}

/** Riesiges Steingesicht (blickt nach +X): Stirnband, Augen mit Türkis, breiter Mund, Moos. */
function stoneFace() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:stoneface', () => {
    const b = new Build();
    b.box(6, 11, 9, 0xb89a6a, { p: [0, 5.5, 0] }, 0.6, 2);
    b.box(6.4, 1.2, 9.4, 0xd8b47a, { p: [0.1, 9.4, 0] }, 0.2);
    for (const z of [-2.2, 2.2]) { b.box(0.6, 1.6, 2, 0x8a7048, { p: [3.1, 7, z] }, 0.2); b.sphere(0.5, 0x3ac0d8, { p: [3.3, 7, z] }, 10, 8); }
    b.box(1.4, 2.6, 1.6, 0xa88a5a, { p: [3.4, 5, 0] }, 0.3);
    b.box(0.6, 1, 5.6, 0x5a4428, { p: [3.1, 2.4, 0] }, 0.2);
    for (let k = 0; k < 6; k++) b.sphere(0.8, 0x5a8a3a, { p: [2.6 - k * 0.8, 11, -3 + k * 1.2], s: [1, 0.5, 1] }, 8, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('stone_face', root, () => {});
}

/** Stufenpyramide mit Mitteltreppe und Tempelhaus oben, Treppe nach +X. */
function stepPyramid(o = {}) {
  const H = o.h ?? 18;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:pyramid:${H}`, () => {
    const b = new Build();
    const n = 6, step = H / n;
    for (let k = 0; k < n; k++) { const w = 30 - k * 4.4; b.box(w, step, w, k % 2 ? 0xccaa70 : 0xd8b47a, { p: [0, step * (k + 0.5), 0] }, 0.2); }
    for (let k = 0; k < n * 3; k++) b.box(2.2, step / 3, 5, 0xe0c08a, { p: [15 - k * 0.75, (k + 0.5) * step / 3, 0] }, 0.05);
    b.box(7, 5, 7, 0xb89a6a, { p: [0, H + 2.5, 0] }, 0.3);
    b.box(0.4, 3, 2.4, 0x2a2018, { p: [3.5, H + 1.6, 0] }, 0.1);
    b.box(8, 0.8, 8, 0xffc21a, { p: [0, H + 5.3, 0] }, 0.2);
    for (let k = 0; k < 10; k++) b.sphere(1.2, 0x4f8a3a, { p: [Math.cos(k * 2.3) * (12 - k), 1 + k * 1.4, Math.sin(k * 2.3) * (12 - k)], s: [1, 0.5, 1] }, 8, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('step_pyramid', root, () => {});
}

/** Tempeltor zum Durchfahren: zwei Pfeiler, Sturz mit Steinfries und goldener Sonne; Durchfahrt entlang X. */
function templeGate(o = {}) {
  const W = o.width ?? 20;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:tgate:${W}`, () => {
    const b = new Build();
    for (const s of [-1, 1]) { b.box(3, 10, 3, 0xccaa70, { p: [0, 5, s * (W / 2 + 1.5)] }, 0.2); b.box(3.6, 1, 3.6, 0xb89a6a, { p: [0, 10.4, s * (W / 2 + 1.5)] }, 0.1); }
    b.box(3.4, 2.6, W + 7, 0xd8b47a, { p: [0, 12.2, 0] }, 0.3);
    b.cyl(1.6, 1.6, 0.5, 0xffc21a, { p: [1.8, 12.2, 0], r: [0, 0, Math.PI / 2] }, 20);
    for (let k = -4; k <= 4; k++) b.box(0.4, 0.8, 1.2, 0x8a7048, { p: [1.75, 12.6, k * (W / 9)] }, 0.1);
    for (let k = 0; k < 8; k++) b.sphere(0.7, 0x4f8a3a, { p: [0, 13.6, -W / 2 + k * W / 7], s: [1.2, 0.5, 1] }, 8, 6);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('temple_gate', root, () => {});
}

export const MODELS = { tram, grandstand, palace, waterfall, mine_cart: mineCart, jumbotron, balloons, ferris_wheel: ferrisWheel, carousel, water_slide: waterSlide, cake, temple_pillar: templePillar, stone_face: stoneFace, step_pyramid: stepPyramid, temple_gate: templeGate };

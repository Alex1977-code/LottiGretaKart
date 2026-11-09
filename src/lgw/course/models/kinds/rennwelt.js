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
// mansion_hall  Festsaal der Spukvilla zum Durchfahren: Wände mit leuchtenden Fenstern, Kronleuchter, Tafeln,
//               Gemälde, Dach (Länge entlang X), opts { length, width }
// barrel_cannon Fass-Kanone über der Fahrbahn (Gipfelabfahrt): schießt die Karts zurück auf den Gipfel
// slalom_gate   Slalomtor aus zwei Fahnenstangen mit Banner (Breite opts.width)
// airplane      großes Passagierflugzeug (Ferienflughafen); opts { color }
// control_tower Kontrollturm mit verglaster Kanzel
// baggage_cart  Gepäckschlepper mit zwei Anhängern (fährt im Verkehr mit)
// dolphin       Delfin (springt in der Delfinlagune)
// speaker_tower Boxenturm mit pulsierenden Lautsprechern (Disco-Halle)
// disco_ball    Discokugel, dreht sich und glitzert
// light_beam    farbiger Scheinwerferkegel, schwenkt (opts.color)
// cloud_puff    große Wolke aus weichen Kugeln (opts { r, dark: Gewitterwolke mit Blitzen })
// airship       Luftschiff: Ballonhülle, Gondel, drehende Propeller
// ribcage       riesiger Brustkorb aus Knochen als Bogen über der Fahrbahn (Durchfahrt entlang X)
// skull         riesiger Schädel im Sand
// fort_tower    Turm der Lavafestung mit Zinnen und Fackeln
// fort_gate     Tor der Lavafestung zum Durchfahren (opts.width)
// dragon_statue steinerne Drachenstatue mit glühenden Augen
// planet        Planet mit Ring (opts { r, color, ring })
// space_station Raumstation: Ring mit Modulen und Solarflügeln, dreht sich

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

/** Festsaal zum Durchfahren (entlang X): hohe Wände mit Spitzbogenfenstern, Dach, Kronleuchter, lange Tafeln
 *  mit Kerzen an beiden Seiten, Gemälde. */
function mansionHall(o = {}) {
  const L = o.length ?? 80, Wd = o.width ?? 26, H = 14;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:hall:${L}:${Wd}`, () => {
    const b = new Build();
    const wall = 0x4a3a5e, trim = 0x2a1e3a, gold = 0xc89a3a, wood = 0x5a3a2a, cloth = 0xf2ece0;
    for (const s of [-1, 1]) {
      b.box(L, H, 1, wall, { p: [0, H / 2, s * Wd / 2] }, 0.1);
      b.box(L, 0.6, 1.4, gold, { p: [0, H - 0.3, s * Wd / 2] }, 0.05);
      for (let x = -L / 2 + 4; x < L / 2 - 2; x += 8) {
        b.box(0.6, H, 1.6, trim, { p: [x, H / 2, s * Wd / 2] }, 0.05);
        // Gemälde mit Goldrahmen
        b.box(4.2, 3.2, 0.2, gold, { p: [x + 4, 6, s * (Wd / 2 - 0.6)] }, 0.05);
        b.box(3.6, 2.6, 0.22, [0x2a4a6a, 0x5a2a3a, 0x3a5a2a][Math.abs(Math.round(x)) % 3], { p: [x + 4, 6, s * (Wd / 2 - 0.62)] }, 0.02);
      }
      // lange Tafel mit weißem Tuch und Kerzen
      b.box(L - 12, 1, 2.4, cloth, { p: [0, 1.1, s * (Wd / 2 - 2.6)] }, 0.1);
      for (let x = -L / 2 + 8; x < L / 2 - 6; x += 6) b.cyl(0.08, 0.08, 0.8, 0xfaf6ee, { p: [x, 2, s * (Wd / 2 - 2.6)] }, 6);
    }
    // Dach: Satteldach mit Gauben
    for (const s of [-1, 1]) b.box(L + 2, 0.6, Wd * 0.62, 0x2a2238, { p: [0, H + Wd * 0.2, s * Wd * 0.25], r: [s * 0.62, 0, 0] }, 0.1);
    for (const s of [-1, 1]) b.box(1, H, Wd + 2, wood, { p: [s * L / 2, H / 2, 0] }, 0.05);   // Rahmen an den Enden (Tor bleibt offen)
    return b.geometry();
  }), vcol(0.7), {}, true));
  // Öffnungen an den Enden: Tor im Rahmen ausschneiden geht nicht – die Rahmen sind nur Pfeiler, daher Torbogen oben
  const glowMat = basic('rw:hall:glow', { color: new THREE.Color(2.2, 1.7, 0.8) });
  for (let x = -L / 2 + 8; x < L / 2 - 4; x += 16) {
    const c = new THREE.Group();
    c.position.set(x, H - 3.5, 0);
    c.add(mesh(cached('rw:chandelier', () => {
      const b = new Build();
      b.add(new THREE.TorusGeometry(1.8, 0.12, 6, 24), 0xc89a3a, { r: [Math.PI / 2, 0, 0] });
      b.cyl(0.05, 0.05, 3.5, 0x3a3a48, { p: [0, 1.75, 0] }, 4);
      return b.geometry();
    }), vcol(0.4)));
    for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glowMat); f.position.set(Math.cos(k * 1.047) * 1.8, 0.3, Math.sin(k * 1.047) * 1.8); c.add(f); }
    root.add(c);
  }
  // Fenster leuchten von innen (Spitzbögen als helle Flächen außen)
  const winMat = basic('rw:hall:win', { color: new THREE.Color(1.6, 1.2, 0.5) });
  for (const s of [-1, 1]) for (let x = -L / 2 + 8; x < L / 2 - 2; x += 8) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), winMat);
    w.position.set(x, 9.6, s * (Wd / 2 + 0.52)); w.rotation.y = s > 0 ? 0 : Math.PI;
    root.add(w);
  }
  return makeModel('mansion_hall', root, () => {});
}

/** Fass-Kanone: großes Holzfass auf Gestell, Öffnung nach +X, schräg nach oben. */
function barrelCannon() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:bcannon', () => {
    const b = new Build();
    b.cyl(5.2, 5.2, 11, 0x8a5a32, { p: [0, 7, 0], r: [0, 0, Math.PI / 2 - 0.35] }, 24, true);
    for (const x of [-4, 0, 4]) b.add(new THREE.TorusGeometry(5.25, 0.3, 6, 32), 0x3a3a44, { p: [x * Math.cos(0.35), 7 + x * Math.sin(0.35), 0], r: [0, Math.PI / 2, 0.35] });
    b.box(2, 4, 9, 0x5a3a22, { p: [-1, 2, 0] }, 0.1);
    b.cone(1.2, 2.2, 0xffc21a, { p: [-3.5, 10.5, 0], r: [0, 0, 0.6] }, 5);
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('barrel_cannon', root, () => {});
}

/** Slalomtor: zwei rot-weiße Stangen, Banner oben; Durchfahrt entlang X. */
function slalomGate(o = {}) {
  const W = o.width ?? 14;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:slalom:${W}`, () => {
    const b = new Build();
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) b.cyl(0.18, 0.18, 1, k % 2 ? 0xffffff : 0xe8392d, { p: [0, 0.5 + k, s * W / 2] }, 8);
    b.box(0.2, 1.4, W, 0x1e6cff, { p: [0, 5.4, 0] }, 0.05);
    for (let k = 0; k < 5; k++) b.box(0.22, 0.4, 0.8, 0xffffff, { p: [0.02, 5.4, -W / 2 + (k + 0.5) * W / 5] }, 0.02);
    return b.geometry();
  }), vcol(0.5), {}, true));
  return makeModel('slalom_gate', root, () => {});
}

/** Passagierflugzeug: Rumpf entlang X, Flügel, Leitwerk, Triebwerke, Fensterband. */
function airplane(o = {}) {
  const C = o.color ?? 0x1e6cff;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:plane:${C}`, () => {
    const b = new Build();
    b.capsule(2.6, 30, 0xfaf8f4, { r: [0, 0, Math.PI / 2] }, 6, 16);
    b.cone(2.6, 6, 0xfaf8f4, { p: [-19.5, 0.6, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.9] }, 16);
    b.box(30, 0.5, 0.2, 0x2a3a4a, { p: [1, 0.9, 2.55] }, 0.1);
    b.box(30, 0.5, 0.2, 0x2a3a4a, { p: [1, 0.9, -2.55] }, 0.1);
    b.box(32, 0.9, 5.2, C, { p: [0, -1.6, 0] }, 0.3);   // Bauchstreifen
    for (const s of [-1, 1]) {
      b.box(9, 0.6, 18, 0xe8ecf2, { p: [0, -0.8, s * 11], r: [0, s * 0.45, s * 0.05] }, 0.2);
      b.cyl(1.4, 1.4, 5, 0xc8ccd4, { p: [1.5, -2.2, s * 8], r: [0, 0, Math.PI / 2] }, 16);
      b.box(4, 0.4, 6, 0xe8ecf2, { p: [-17, 1.4, s * 3.5], r: [0, s * 0.4, 0] }, 0.1);
    }
    b.box(6, 7, 0.5, C, { p: [-17.5, 4.5, 0], r: [0, 0, -0.45] }, 0.2);
    for (const [x, z] of [[10, 0], [-2, 2.5], [-2, -2.5]]) b.cyl(0.6, 0.6, 0.5, 0x1a1a22, { p: [x, -3.6, z], r: [Math.PI / 2, 0, 0] }, 12);
    return b.geometry();
  }), vcol(0.35), {}, true));
  return makeModel('airplane', root, () => {});
}

/** Kontrollturm: schlanker Schaft, verglaste Kanzel, rot-weiße Antenne. */
function controlTower() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:tower', () => {
    const b = new Build();
    b.cyl(2.4, 3, 24, 0xf2f0ea, { p: [0, 12, 0] }, 20);
    b.cyl(5.2, 3.6, 2, 0xf2f0ea, { p: [0, 25, 0] }, 20);
    b.cyl(5.4, 5.4, 3.2, 0x3a8ac8, { p: [0, 27.6, 0] }, 20);
    b.cyl(5.8, 5.8, 0.6, 0xf2f0ea, { p: [0, 29.5, 0] }, 20);
    for (let k = 0; k < 4; k++) b.cyl(0.15, 0.15, 1.2, k % 2 ? 0xffffff : 0xe8392d, { p: [0, 30.4 + k * 1.2, 0] }, 6);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('control_tower', root, () => {});
}

/** Gepäckschlepper (fährt entlang X) mit zwei Anhängern voller bunter Koffer. */
function baggageCart() {
  const root = new THREE.Group();
  const body = joint();
  body.add(mesh(cached('rw:baggage', () => {
    const b = new Build();
    b.box(2.6, 1.4, 1.8, 0xffc21a, { p: [3.4, 0.9, 0] }, 0.2);
    b.box(1, 0.9, 1.6, 0x2a3a4a, { p: [3.2, 1.9, 0] }, 0.1);
    const cols = [0xe8392d, 0x1e6cff, 0x4fb833, 0xff6aa8, 0xb47fe6, 0x2a2a30];
    for (const x of [0, -3.4]) {
      b.box(2.8, 0.3, 1.8, 0x6a6a74, { p: [x, 0.6, 0] }, 0.05);
      for (let k = 0; k < 4; k++) b.box(0.9, 0.6 + (k % 2) * 0.3, 0.7, cols[(k + (x ? 3 : 0)) % 6], { p: [x - 0.7 + (k % 2) * 1.2, 1.1 + (k > 1 ? 0.6 : 0), (k % 2 ? 0.35 : -0.35)] }, 0.1);
    }
    for (const x of [3.8, 2.8, 0.8, -0.8, -2.6, -4.2]) for (const z of [-0.85, 0.85]) b.cyl(0.32, 0.32, 0.2, 0x1a1a22, { p: [x, 0.32, z], r: [Math.PI / 2, 0, 0] }, 10);
    return b.geometry();
  }), vcol(0.45), {}, true));
  root.add(body);
  return makeModel('baggage_cart', root, (dt, st) => { if (st.anim === 'squashed') body.scale.set(1.05, 0.5, 1.05); else body.scale.setScalar(1); });
}

/** Delfin: grau-blauer Körper entlang X, Finne, Fluke. */
function dolphin() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:dolphin', () => {
    const b = new Build();
    b.sphere(1, 0x6a8ab0, { s: [2.6, 0.75, 0.75] }, 16, 10);
    b.sphere(0.8, 0xe8eef4, { p: [0.4, -0.25, 0], s: [2.2, 0.45, 0.6] }, 14, 8);
    b.cone(0.28, 1.1, 0x6a8ab0, { p: [2.9, -0.05, 0], r: [0, 0, -Math.PI / 2] }, 10);
    b.cone(0.4, 1, 0x5a7aa0, { p: [0, 0.9, 0], r: [0, 0, 0.5] }, 8);
    b.box(0.5, 0.12, 1.8, 0x5a7aa0, { p: [-2.7, 0, 0] }, 0.06);
    for (const z of [-0.45, 0.45]) b.sphere(0.1, 0x1a1a22, { p: [2, 0.2, z] }, 6, 4);
    return b.geometry();
  }), vcol(0.3), {}, true));
  return makeModel('dolphin', root, () => {});
}

/** Boxenturm: Stapel großer Lautsprecher, die im Takt pumpen (Membranen leuchten). */
function speakerTower(o = {}) {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:speaker', () => {
    const b = new Build();
    for (let k = 0; k < 3; k++) b.box(4, 3.6, 3.6, 0x1a1a24, { p: [0, 1.8 + k * 3.7, 0] }, 0.2);
    return b.geometry();
  }), vcol(0.4), {}, true));
  const col = new THREE.Color(o.color ?? 0xff3ab8).multiplyScalar(2.5);
  const mat = new THREE.MeshBasicMaterial({ color: col });
  const cones = [];
  for (let k = 0; k < 3; k++) for (const z of [-0.8, 0.8]) {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), mat);
    c.position.set(2.02, 1.8 + k * 3.7, z); c.rotation.y = Math.PI / 2;
    root.add(c); cones.push(c);
  }
  let t = Math.random() * 3;
  return makeModel('speaker_tower', root, (dt) => { t += dt; const s = 1 + 0.18 * Math.max(0, Math.sin(t * 2 * Math.PI * 2.1)); for (const c of cones) c.scale.setScalar(s); });
}

/** Discokugel: verspiegelte Facetten, dreht sich. */
function discoBall() {
  const root = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 2), new THREE.MeshStandardMaterial({ color: 0xe8ecf4, metalness: 0.9, roughness: 0.15, flatShading: true, emissive: 0x3a3a5a }));
  root.add(ball);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 20, 6), new THREE.MeshStandardMaterial({ color: 0x3a3a48 }));
  rod.position.y = 12.5;
  root.add(rod);
  return makeModel('disco_ball', root, (dt) => { ball.rotation.y += dt * 0.8; });
}

/** Farbiger Scheinwerferkegel (additiv), schwenkt hin und her. */
function lightBeam(o = {}) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  const col = new THREE.Color(o.color ?? 0x3ae0ff);
  const geo = new THREE.ConeGeometry(4, 60, 20, 1, true);
  geo.translate(0, -30, 0);
  const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.x = Math.PI;
  pivot.add(beam);
  root.add(mesh(cached('rw:beambase', () => new Build().cyl(1.2, 1.4, 1.2, 0x2a2a34, { p: [0, 0.6, 0] }, 12).geometry()), vcol(0.4)));
  let t = Math.random() * 10;
  return makeModel('light_beam', root, (dt) => { t += dt; pivot.rotation.set(Math.sin(t * 0.7) * 0.5, 0, Math.cos(t * 0.53) * 0.5); });
}

/** Große Wolke aus weichen Kugeln; dark: dunkle Gewitterwolke, in der es ab und zu blitzt. */
function cloudPuff(o = {}) {
  const R = o.r ?? 10, dark = !!o.dark;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:cloud:${R}:${dark}`, () => {
    const b = new Build();
    const c = dark ? 0x5a5a72 : 0xffffff, c2 = dark ? 0x4a4a62 : 0xf0f4fa;
    for (let k = 0; k < 9; k++) { const a = k * 0.7; b.sphere(R * (0.45 + (k % 3) * 0.15), k % 2 ? c : c2, { p: [Math.cos(a) * R * 0.7, (k % 3) * R * 0.15, Math.sin(a) * R * 0.5], s: [1.2, 0.75, 1] }, 14, 10); }
    return b.geometry();
  }), vcol(0.95, { emissive: dark ? 0x000000 : 0x3a3a44 }, dark ? 'cloud-dark' : 'cloud'), {}, false));
  // Blitz: die Gewitterwolke leuchtet kurz auf (Leuchtfarbe statt Licht – sonst müssten alle Shader neu übersetzt werden)
  const mat = root.children[0].material;
  let t = Math.random() * 5;
  return makeModel('cloud_puff', root, (dt) => { if (!dark) return; t += dt; const p = t % 4.3; mat.emissive.setHex(p < 0.08 || (p > 0.18 && p < 0.24) ? 0xb8c8ff : 0x000000); });
}

/** Luftschiff: Ballonhülle entlang X, Gondel, Leitwerk, Propeller drehen sich. */
function airship(o = {}) {
  const C = o.color ?? 0xe8392d;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:airship:${C}`, () => {
    const b = new Build();
    b.sphere(6, C, { p: [0, 10, 0], s: [3, 1, 1] }, 24, 14);
    for (let k = -2; k <= 2; k++) b.add(new THREE.TorusGeometry(6.05, 0.2, 6, 32), 0xffc21a, { p: [k * 4, 10, 0], r: [0, Math.PI / 2, 0], s: [1, 1, 1] });
    b.box(16, 3, 5, 0x8a5a32, { p: [0, 2.5, 0] }, 0.4);
    b.box(14, 0.4, 5.6, 0xc8a070, { p: [0, 4.2, 0] }, 0.1);
    for (const s of [-1, 1]) { b.box(3, 0.3, 4, C, { p: [-17, 10, s * 2.5] }, 0.1); b.box(0.3, 4, 0.3, 0x5a3a22, { p: [s * 5, 6, 0] }, 0.05); }
    b.box(3, 4, 0.3, C, { p: [-17, 12, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.55), {}, true));
  const props = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(-8.5, 2.5, s * 3.2);
    p.add(mesh(cached('rw:prop', () => new Build().box(0.2, 3.2, 0.5, 0x3a3a44, {}, 0.05).box(0.2, 0.5, 3.2, 0x3a3a44, {}, 0.05).geometry()), vcol(0.5)));
    root.add(p); props.push(p);
  }
  let t = Math.random() * 10;
  return makeModel('airship', root, (dt) => { t += dt; for (const p of props) p.rotation.x += dt * 12; root.children[0].position.y = Math.sin(t * 0.8) * 0.4; });
}

/** Brustkorb-Bogen aus Knochen (Durchfahrt entlang X). */
function ribcage(o = {}) {
  const W = o.width ?? 24;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:ribs:${W}`, () => {
    const b = new Build();
    const bone = 0xf2ead8;
    b.cyl(1, 1, 30, bone, { p: [0, W * 0.55, 0], r: [0, 0, Math.PI / 2] }, 10);   // Wirbelsäule oben
    for (let k = -3; k <= 3; k++) {
      const x = k * 4;
      for (const s of [-1, 1]) {
        const pts = [];
        for (let q = 0; q <= 10; q++) { const a = (q / 10) * Math.PI * 0.55; pts.push([x, W * 0.55 - Math.sin(a) * W * 0.55, s * Math.sin(a + 0.4) * (W / 2 + 1) * (q ? 1 : 0.1)]); }
        b.tube(pts, 0.7, bone, {}, 16, 8);
      }
    }
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('ribcage', root, () => {});
}

/** Riesiger Schädel (blickt nach +X). */
function skull() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:skull', () => {
    const b = new Build();
    const bone = 0xf2ead8;
    b.sphere(6, bone, { p: [0, 6, 0], s: [1.1, 0.95, 1] }, 20, 14);
    b.box(6, 3, 7, bone, { p: [3, 2, 0] }, 1);
    for (const z of [-2.2, 2.2]) b.sphere(1.6, 0x2a1e1a, { p: [5.4, 6.2, z], s: [0.5, 1, 1] }, 12, 8);
    b.cone(0.9, 1.4, 0x2a1e1a, { p: [6.4, 3.8, 0], r: [0, 0, -Math.PI / 2 - 0.2] }, 6);
    for (let k = -3; k <= 3; k++) b.box(0.7, 1.4, 0.8, 0xffffff, { p: [5.8, 1.2, k * 0.95] }, 0.1);
    return b.geometry();
  }), vcol(0.6), {}, true));
  return makeModel('skull', root, () => {});
}

/** Festungsturm aus dunklem Stein mit Zinnen, Spitzdach und Fackeln (leuchten). */
function fortTower(o = {}) {
  const H = o.h ?? 22;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:ftower:${H}`, () => {
    const b = new Build();
    b.cyl(4.2, 4.8, H, 0x3a3238, { p: [0, H / 2, 0] }, 12);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.box(1.4, 1.6, 1.2, 0x2a2428, { p: [Math.cos(a) * 4.2, H + 0.8, Math.sin(a) * 4.2], r: [0, -a, 0] }, 0.05); }
    b.cone(4.6, 7, 0x8a1a1a, { p: [0, H + 4.6, 0] }, 12);
    for (const y of [H * 0.4, H * 0.7]) b.box(0.4, 2, 1.2, 0xffa030, { p: [4.5, y, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.85), {}, true));
  const fire = basic('rw:fire', { color: new THREE.Color(3, 1.2, 0.3) });
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), fire); f.position.set(5, 4, s * 2.2); root.add(f); }
  return makeModel('fort_tower', root, () => {});
}

/** Festungstor zum Durchfahren: zwei Türme, Sturz mit Fallgitter, Feuerschalen (Durchfahrt entlang X). */
function fortGate(o = {}) {
  const W = o.width ?? 22;
  const root = new THREE.Group();
  root.add(mesh(cached(`rw:fgate:${W}`, () => {
    const b = new Build();
    for (const s of [-1, 1]) { b.box(6, 16, 6, 0x3a3238, { p: [0, 8, s * (W / 2 + 3)] }, 0.2); b.cone(4.4, 6, 0x8a1a1a, { p: [0, 19, s * (W / 2 + 3)] }, 4); }
    b.box(6, 5, W + 12, 0x2e282c, { p: [0, 14, 0] }, 0.2);
    for (let k = -5; k <= 5; k++) b.box(0.3, 3, 0.3, 0x1a1a1e, { p: [3.1, 10.6, k * (W / 11)] }, 0.02);
    b.box(0.6, 3, 4, 0x8a1a1a, { p: [3.2, 14, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.85), {}, true));
  return makeModel('fort_gate', root, () => {});
}

/** Steinerne Drachenstatue: Kopf mit Hörnern, glühende Augen und Maul (blickt nach +X). */
function dragonStatue() {
  const root = new THREE.Group();
  root.add(mesh(cached('rw:dstatue', () => {
    const b = new Build();
    const st = 0x5a5258;
    b.box(10, 6, 10, 0x3a3238, { p: [0, 3, 0] }, 0.3);
    b.sphere(6, st, { p: [0, 13, 0], s: [1.1, 1.3, 1] }, 16, 12);
    b.box(7, 4, 6, st, { p: [5, 13, 0] }, 1);
    for (const z of [-3, 3]) b.cone(1.2, 6, 0xd8c8a0, { p: [-2, 20, z], r: [z * 0.08, 0, 0.5] }, 8);
    b.box(1, 1, 6.2, 0x2a1e1a, { p: [8.6, 11.6, 0] }, 0.2);
    return b.geometry();
  }), vcol(0.8), {}, true));
  const glow = basic('rw:dragon:eye', { color: new THREE.Color(4, 1, 0.2) });
  for (const z of [-2.2, 2.2]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), glow); e.position.set(7.4, 15, z); root.add(e); }
  return makeModel('dragon_statue', root, () => {});
}

/** Planet mit Ring. */
function planet(o = {}) {
  const R = o.r ?? 40, C = o.color ?? 0xd8a060;
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.SphereGeometry(R, 32, 20), new THREE.MeshStandardMaterial({ color: C, roughness: 0.9, emissive: C, emissiveIntensity: 0.25 })));
  if (o.ring !== false) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R * 1.35, R * 2, 48), new THREE.MeshBasicMaterial({ color: 0xe8d8b8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
    ring.rotation.x = -Math.PI / 2 + 0.4;
    root.add(ring);
  }
  return makeModel('planet', root, () => {});
}

/** Raumstation: großer Ring mit Modulen und Solarflügeln, dreht sich langsam. */
function spaceStation() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  spin.add(mesh(cached('rw:station', () => {
    const b = new Build();
    b.add(new THREE.TorusGeometry(30, 2.4, 10, 48), 0xe8ecf4, { r: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.box(5, 4, 4, k % 2 ? 0xc8ccd8 : 0x8ac0ff, { p: [Math.cos(a) * 30, 0, Math.sin(a) * 30], r: [0, -a, 0] }, 0.3); b.box(28, 0.6, 0.6, 0xa8acb8, { p: [Math.cos(a) * 15, 0, Math.sin(a) * 15], r: [0, -a, 0] }, 0.05); }
    b.sphere(6, 0xe8ecf4, {}, 16, 12);
    for (const s of [-1, 1]) b.box(2, 0.3, 26, 0x2a4a9a, { p: [0, 0, s * 16], r: [Math.PI / 2, 0, 0] }, 0.05);
    return b.geometry();
  }), vcol(0.35, { emissive: 0x1a2a4a }), {}, false));
  return makeModel('space_station', root, (dt) => { spin.rotation.y += dt * 0.08; });
}

export const MODELS = { tram, grandstand, palace, waterfall, mine_cart: mineCart, jumbotron, balloons, ferris_wheel: ferrisWheel, carousel, water_slide: waterSlide, cake, temple_pillar: templePillar, stone_face: stoneFace, step_pyramid: stepPyramid, temple_gate: templeGate, mansion_hall: mansionHall,
  barrel_cannon: barrelCannon, slalom_gate: slalomGate, airplane, control_tower: controlTower, baggage_cart: baggageCart, dolphin,
  speaker_tower: speakerTower, disco_ball: discoBall, light_beam: lightBeam,
  cloud_puff: cloudPuff, airship, ribcage, skull, fort_tower: fortTower, fort_gate: fortGate, dragon_statue: dragonStatue, planet, space_station: spaceStation };

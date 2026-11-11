// Kart-Modell im Spielzeug-Look der Lotti-&-Greta-Welt (weiche runde Formen, kräftige Farben, keine Texturen).
// Maßstab Meter, Ursprung = Mitte der Bodenfläche, Blick nach +X (wie alle Modelle der Welt).
//
// buildKart(style) → { root, body, seat (Object3D am Sitzpunkt), wheels[4], steering, flames, update(dt, k) }
//   style  { main, accent, trim, rim, flag }  (Hex-Farben)
//   k      { speed (m/s), steer (-1..1, + = links), boost (0..1), drift (0 | ±1), sparkLevel (0..3), t }
// Ein verschmolzenes Mesh für Chassis/Sitz/Motor, je ein Mesh für die vier Räder und das Lenkrad;
// Auspuff-Flammen und Drift-Funken sind additive Sprites (keine Schatten).

import { THREE, Build, vcol, mesh, glowTexture, metal } from '../lgw/course/models/lib/kit.js';
import { SURF } from '../world/surfaces.js';

const TIRE = 0x2a2834, TIRE_SIDE = 0x3a3846;
export const KART = {
  length: 1.7, width: 1.15,
  seatY: 0.42,       // Sitzfläche (Becken der Figur)
  seatX: -0.22,
  wheelFront: { x: 0.58, z: 0.5, r: 0.21 },
  wheelRear: { x: -0.55, z: 0.52, r: 0.26 },
};

const geoCache = new Map();
function cachedGeo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}

function bodyGeo(st) {
  return cachedGeo(`kart:body:${st.main}:${st.accent}:${st.trim}:${st.flag}`, () => {
    const b = new Build();
    // Bodenwanne und Seitenkästen
    b.box(1.5, 0.16, 0.86, st.trim, { p: [-0.02, 0.2, 0] }, 0.07);
    b.box(1.2, 0.26, 0.3, st.main, { p: [-0.12, 0.33, 0.36] }, 0.11);
    b.box(1.2, 0.26, 0.3, st.main, { p: [-0.12, 0.33, -0.36] }, 0.11);
    // Nase (abgerundet, nach vorn flacher) und Frontstoßstange
    b.sphere(1, st.main, { p: [0.38, 0.36, 0], s: [0.52, 0.2, 0.36] }, 22, 12);
    b.box(0.34, 0.12, 0.98, st.accent, { p: [0.78, 0.22, 0] }, 0.06);
    // Zierstreifen auf der Nase
    b.sphere(1, st.accent, { p: [0.42, 0.42, 0], s: [0.42, 0.15, 0.1] }, 16, 8);
    // Sitzschale und Lehne
    b.box(0.42, 0.12, 0.52, st.seat ?? 0x34304a, { p: [KART.seatX, 0.36, 0] }, 0.05);
    b.box(0.14, 0.4, 0.56, st.seat ?? 0x34304a, { p: [KART.seatX - 0.25, 0.55, 0] , r: [0, 0, 0.18] }, 0.07);
    // Heck: Motorblock, Kühlrippen, Auspuff
    b.box(0.34, 0.3, 0.6, 0x8d8aa0, { p: [-0.7, 0.36, 0] }, 0.07);
    for (const z of [-0.18, 0, 0.18]) b.box(0.3, 0.05, 0.08, 0xb9b6c8, { p: [-0.7, 0.53, z] }, 0.02);
    for (const z of [-0.2, 0.2]) b.cyl(0.055, 0.07, 0.34, 0xd6d9e4, { p: [-0.92, 0.36, z], r: [0, 0, Math.PI / 2] }, 12);
    // Heckflügel mit zwei Stützen
    b.box(0.2, 0.05, 1.0, st.accent, { p: [-0.86, 0.78, 0], r: [0, 0, -0.12] }, 0.025);
    for (const z of [-0.3, 0.3]) b.box(0.06, 0.24, 0.05, st.trim, { p: [-0.84, 0.64, z] }, 0.02);
    // Lenksäule
    b.cyl(0.025, 0.03, 0.42, 0x44405a, { p: [0.12, 0.52, 0], r: [0, 0, 0.95] }, 8);
    // Wimpel-Stab mit Fähnchen
    b.cyl(0.012, 0.012, 0.75, 0xeeeeee, { p: [-0.84, 1.15, -0.42] }, 6);
    b.box(0.26, 0.17, 0.02, st.flag ?? st.accent, { p: [-0.98, 1.43, -0.42] }, 0.01, 1);
    // Startnummern-Plakette vorn
    b.cyl(0.13, 0.13, 0.04, 0xfff8ee, { p: [0.86, 0.3, 0], r: [0, 0, Math.PI / 2] }, 18);
    b.cyl(0.085, 0.085, 0.05, st.main, { p: [0.87, 0.3, 0], r: [0, 0, Math.PI / 2] }, 16);
    // Scheinwerfer (Glas mit Fassung) und Rücklichter
    for (const z of [-0.24, 0.24]) {
      b.sphere(0.085, st.trim, { p: [0.66, 0.4, z], s: [0.7, 1, 1] }, 14, 10);
      b.sphere(0.07, 0xfffbe0, { p: [0.7, 0.405, z], s: [0.55, 1, 1] }, 14, 10);
      b.box(0.05, 0.07, 0.14, 0xff2a2a, { p: [-0.89, 0.46, z * 1.15] }, 0.02, 1);
    }
    // Abzeichen auf den Seitenkästen: weiße Scheibe mit farbigem Stern-Kern
    for (const s of [-1, 1]) {
      b.cyl(0.11, 0.11, 0.02, 0xfff8ee, { p: [-0.12, 0.35, s * 0.515], r: [Math.PI / 2, 0, 0] }, 18);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        b.cone(0.03, 0.08, st.accent, { p: [-0.12 + Math.cos(a) * 0.04, 0.35 + Math.sin(a) * 0.04, s * 0.53], r: [0, 0, a - Math.PI / 2] }, 4);
      }
      b.cyl(0.03, 0.03, 0.025, st.accent, { p: [-0.12, 0.35, s * 0.528], r: [Math.PI / 2, 0, 0] }, 10);
      // Zierstreifen entlang des Seitenkastens
      b.box(1.0, 0.04, 0.02, st.accent, { p: [-0.12, 0.43, s * 0.51] }, 0.01, 1);
    }
    // Trittbretter und Kotflügel über den Vorderrädern
    for (const s of [-1, 1]) {
      b.box(0.3, 0.05, 0.22, st.accent, { p: [KART.wheelFront.x, KART.wheelFront.r * 2 + 0.06, s * KART.wheelFront.z] , r: [0, 0, 0.12] }, 0.03);
    }
    // ---- Details (wie ein echtes Renn-Kart aus der Nähe) ----
    const DARK = 0x22202c, STEEL = 0x5a566e, ALU = 0xd8dce8, seatC = st.seat ?? 0x34304a;
    // Frontflügel mit Endplatten und zwei Streben zur Nase
    b.box(0.2, 0.035, 1.14, st.accent, { p: [1.0, 0.13, 0] }, 0);
    for (const s of [-1, 1]) {
      b.box(0.26, 0.15, 0.03, st.trim, { p: [0.99, 0.185, s * 0.57] }, 0);
      b.box(0.2, 0.045, 0.05, st.trim, { p: [0.9, 0.155, s * 0.2] }, 0);
    }
    // Lufteinlässe vorn an den Seitenkästen (dunkel, mit Lamellen) und Entlüftungsschlitze obenauf
    for (const s of [-1, 1]) {
      b.box(0.05, 0.17, 0.2, DARK, { p: [0.485, 0.335, s * 0.36] }, 0);
      for (const y of [0.29, 0.335, 0.38]) b.box(0.055, 0.012, 0.19, ALU, { p: [0.49, y, s * 0.36] }, 0);
      for (let k = 0; k < 3; k++) b.box(0.1, 0.012, 0.16, DARK, { p: [-0.42 + k * 0.15, 0.462, s * 0.36] }, 0);
      // Schweller (dunkle Leiste) und Schrauben am Seitenkasten
      b.box(1.3, 0.05, 0.03, DARK, { p: [-0.05, 0.145, s * 0.44] }, 0);
      for (const x of [-0.6, -0.3, 0.3]) b.sphere(0.016, ALU, { p: [x, 0.25, s * 0.512], s: [1, 1, 0.5] }, 6, 4);
      // Querlenker der Vorderachse (zwei Stäbe als V) und Spurstange
      b.cyl(0.015, 0.015, 0.28, STEEL, { p: [0.66, 0.2, s * 0.29], r: [Math.PI / 2, 0, 0.25 * s] }, 6);
      b.cyl(0.015, 0.015, 0.28, STEEL, { p: [0.5, 0.2, s * 0.29], r: [Math.PI / 2, 0, -0.25 * s] }, 6);
      b.cyl(0.011, 0.011, 0.3, ALU, { p: [0.58, 0.29, s * 0.28], r: [Math.PI / 2, 0, 0] }, 5);
      // Außenspiegel auf dünnem Arm
      b.cyl(0.012, 0.012, 0.17, STEEL, { p: [0.2, 0.53, s * 0.45], r: [0.25 * s, 0, 0.3] }, 5);
      b.box(0.035, 0.075, 0.12, st.main, { p: [0.235, 0.625, s * 0.475] }, 0);
      b.box(0.012, 0.055, 0.095, 0xcfe6f4, { p: [0.213, 0.625, s * 0.475] }, 0);
      // Sitzwangen
      b.box(0.4, 0.15, 0.07, seatC, { p: [KART.seatX, 0.45, s * 0.27] }, 0);
      // Auspuff-Mündung (dunkles Innenrohr)
      b.cyl(0.046, 0.046, 0.02, 0x15131c, { p: [-1.136, 0.36, s * 0.2], r: [0, 0, Math.PI / 2] }, 10);
      // Haubenstifte auf der Nase
      b.cyl(0.014, 0.014, 0.03, ALU, { p: [0.6, 0.545, s * 0.16] }, 6);
    }
    // (keine Kopfstütze und kein hoher Bügel: von hinten – der Fahrsicht – soll man die Figur sehen)
    b.torus(0.27, 0.022, ALU, { p: [-0.56, 0.42, 0], r: [0, Math.PI / 2, 0] }, 6, 20);
    // Motor: Zylinderkopf mit Kühlrippen, Luftfilter mit Deckel, Zündkabel-Stutzen
    b.box(0.22, 0.12, 0.36, 0x6a677e, { p: [-0.72, 0.56, 0] }, 0);
    for (let k = 0; k < 5; k++) b.box(0.24, 0.012, 0.4, 0xa8a5ba, { p: [-0.72, 0.515 + k * 0.024, 0] }, 0);
    b.cyl(0.1, 0.1, 0.1, st.accent, { p: [-0.72, 0.69, 0] }, 14);
    b.cyl(0.105, 0.105, 0.02, ALU, { p: [-0.72, 0.745, 0] }, 14);
    b.sphere(0.03, ALU, { p: [-0.72, 0.765, 0], s: [1, 0.6, 1] }, 8, 5);
    for (const z of [-0.12, 0.12]) b.cyl(0.018, 0.018, 0.06, 0xffc21a, { p: [-0.62, 0.64, z] }, 6);
    // Hinterachse, Kettenschutz und Heckstoßstange
    b.cyl(0.028, 0.028, 1.0, STEEL, { p: [KART.wheelRear.x, KART.wheelRear.r, 0], r: [Math.PI / 2, 0, 0] }, 8);
    b.box(0.3, 0.16, 0.05, DARK, { p: [-0.6, 0.3, 0.33] }, 0);
    b.cyl(0.024, 0.024, 0.92, ALU, { p: [-1.04, 0.22, 0], r: [Math.PI / 2, 0, 0] }, 8);
    for (const z of [-0.3, 0.3]) b.box(0.2, 0.03, 0.03, STEEL, { p: [-0.95, 0.22, z] }, 0);
    // Endplatten am Heckflügel und zweites Flügelblatt
    for (const z of [-0.5, 0.5]) b.box(0.24, 0.16, 0.025, st.trim, { p: [-0.86, 0.76, z], r: [0, 0, -0.12] }, 0);
    b.box(0.12, 0.03, 0.96, st.trim, { p: [-0.93, 0.7, 0], r: [0, 0, -0.25] }, 0);
    // Rücklicht-Gehäuse (die Lichter selbst leuchten als eigenes Teil)
    for (const z of [-0.276, 0.276]) b.box(0.05, 0.1, 0.17, DARK, { p: [-0.885, 0.46, z] }, 0);
    return b.geometry();
  });
}

function wheelGeo(r, rim) {
  return cachedGeo(`kart:wheel:${r}:${rim}`, () => {
    const b = new Build();
    const w = r * 0.95;
    // Reifen mit runden Schultern (Drehkörper statt Walze)
    b.lathe([[r * 0.6, -w / 2], [r * 0.9, -w / 2], [r * 0.985, -w * 0.38], [r, -w * 0.22], [r, w * 0.22], [r * 0.985, w * 0.38], [r * 0.9, w / 2], [r * 0.6, w / 2]], TIRE, { r: [Math.PI / 2, 0, 0] }, 22);
    // Profil: zwei versetzte Stollenreihen (man sieht das Drehen), dazwischen eine Rille
    for (let i = 0; i < 14; i++) for (const row of [-1, 1]) {
      const a = ((i + (row > 0 ? 0.5 : 0)) / 14) * Math.PI * 2;
      b.box(r * 0.22, r * 0.07, w * 0.36, TIRE_SIDE, { p: [Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, row * w * 0.22], r: [0, 0, a + Math.PI / 2] }, 0);
    }
    for (const s of [1, -1]) {
      const z = s * w / 2;
      // helle Linie auf der Reifenflanke, Felgenhorn, dunkles Felgenbett
      b.torus(r * 0.8, r * 0.028, 0x9a98aa, { p: [0, 0, z + s * 0.004] }, 4, 22);
      b.torus(r * 0.6, r * 0.06, rim, { p: [0, 0, z + s * 0.004] }, 6, 20);
      b.cyl(r * 0.58, r * 0.58, 0.02, 0x2c2a38, { p: [0, 0, z - s * 0.03], r: [Math.PI / 2, 0, 0] }, 16);
      // fünf Speichen, Nabenkappe und Radmuttern
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        b.box(r * 0.56, r * 0.15, 0.03, rim, { p: [Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, z - s * 0.008], r: [0, 0, a] }, 0);
        b.sphere(r * 0.045, 0xd8dce8, { p: [Math.cos(a + 0.63) * r * 0.2, Math.sin(a + 0.63) * r * 0.2, z + s * 0.012], s: [1, 1, 0.6] }, 6, 4);
      }
      b.sphere(r * 0.17, 0xfff8ee, { p: [0, 0, z + s * 0.012], s: [1, 1, 0.45] }, 10, 6);
    }
    return b.geometry();
  });
}

function steeringGeo(color) {
  return cachedGeo(`kart:steer:${color}`, () => {
    const b = new Build();
    b.torus(0.13, 0.025, 0x34304a, { r: [0, Math.PI / 2, 0] }, 8, 22);
    b.box(0.03, 0.22, 0.03, 0x34304a, {}, 0.01, 1);
    b.cyl(0.045, 0.045, 0.04, color, { r: [0, 0, Math.PI / 2] }, 12);
    return b.geometry();
  });
}

let flameTex = null;
function flameTexture() {
  if (flameTex) return flameTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,240,200,0.9)');
  grad.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  flameTex = new THREE.CanvasTexture(c);
  flameTex.colorSpace = THREE.SRGBColorSpace;
  return flameTex;
}

let CHROME = null, TAIL = null, PAINT = null, BLOB_GEO = null, BLOB_MAT = null, blobTex = null;
function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}
/** Lack der Karts: Klarlack über der Farbe (spiegelt Himmel und Sonne) auf Stufe 3, sonst Kunststoff. */
function kartPaint() {
  if (PAINT) return PAINT;
  PAINT = SURF.quality >= 3   // (Klarlack: zweiter Glanz je Bildpunkt – nur auf dem Rechner)
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.14 })
    : vcol(0.38);
  PAINT.userData.shared = true;
  return PAINT;
}
export const SPARK_COLORS = [0xffffff, 0x58b8ff, 0xffa030, 0xff5ad0];

export function buildKart(style) {
  const root = new THREE.Group();
  root.name = 'kart';
  const body = new THREE.Group();     // neigt sich (Federung, Drift), Räder bleiben am Boden
  root.add(body);
  const shell = mesh(bodyGeo(style), kartPaint(), {}, true);
  body.add(shell);
  // Rücklichter: leuchten (im Bloom mit kleinem Schein) – man sieht die Karts ja meist von hinten
  const tail = mesh(cachedGeo('kart:tail', () => {
    const t = new Build();
    for (const z of [-0.276, 0.276]) t.box(0.02, 0.07, 0.14, 0xffffff, { p: [-0.912, 0.46, z] }, 0);
    return t.geometry();
  }), (TAIL ??= Object.assign(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.22, 0.16) }), { userData: { shared: true } })), {}, false);
  body.add(tail);

  // Chromteile (spiegeln die Umgebung): Auspuffrohre, Motordeckel, Federbeine vorn
  const chrome = new Build();
  for (const z of [-0.2, 0.2]) {
    chrome.cyl(0.06, 0.075, 0.3, 0xe8ecf4, { p: [-0.98, 0.36, z], r: [0, 0, Math.PI / 2] }, 14);
    chrome.torus(0.062, 0.014, 0xe8ecf4, { p: [-1.13, 0.36, z], r: [0, Math.PI / 2, 0] }, 6, 14);
  }
  chrome.box(0.3, 0.04, 0.5, 0xd8dce8, { p: [-0.7, 0.53, 0] }, 0.02, 1);
  for (const s of [-1, 1]) chrome.cyl(0.018, 0.018, 0.36, 0xd8dce8, { p: [KART.wheelFront.x - 0.05, 0.27, s * (KART.wheelFront.z - 0.17)], r: [Math.PI / 2, 0, 0] }, 8);
  const chromeMesh = mesh(cachedGeo('kart:chrome', () => chrome.geometry()), (CHROME ??= new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.9, roughness: 0.18 })), {}, true);
  body.add(chromeMesh);

  const seat = new THREE.Object3D();
  seat.position.set(KART.seatX, KART.seatY, 0);
  body.add(seat);

  const steering = new THREE.Group();
  steering.position.set(0.2, 0.64, 0);
  steering.rotation.z = 0.95 - Math.PI / 2;
  const wheelMesh = mesh(steeringGeo(style.accent), vcol(0.4), {}, false);
  steering.add(wheelMesh);
  body.add(steering);

  const wheels = [];
  const rimMat = vcol(0.35);
  for (const [def, front] of [[KART.wheelFront, true], [KART.wheelRear, false]]) {
    for (const s of [1, -1]) {
      const hub = new THREE.Group();       // Lenkdrehung (vorn)
      hub.position.set(def.x, def.r, s * def.z);
      const spin = mesh(wheelGeo(def.r, style.rim ?? 0xffc21a), rimMat, {}, true);
      hub.add(spin);
      root.add(hub);
      wheels.push({ hub, spin, front, r: def.r, side: s });
    }
  }

  // Auspuff-Flammen (Turbo) – additiv, wachsen mit boost
  const flames = [];
  for (const z of [-0.2, 0.2]) {
    const m = new THREE.SpriteMaterial({ map: flameTexture(), color: 0xff8a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(m);
    sp.position.set(-1.12, 0.36, z);
    sp.scale.setScalar(0.01);
    body.add(sp);
    flames.push(sp);
  }
  // Drift-Funken an den Hinterrädern
  const sparks = [];
  for (const s of [1, -1]) {
    const m = new THREE.SpriteMaterial({ map: flameTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(m);
    sp.position.set(KART.wheelRear.x - 0.18, 0.1, s * (KART.wheelRear.z + 0.05));
    sp.scale.setScalar(0.01);
    root.add(sp);
    sparks.push(sp);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glow.scale.setScalar(1.4);
  glow.position.set(-1.0, 0.4, 0);
  body.add(glow);

  // Anti-Gravitation: blaues Leuchten unter dem Kart (die Räder klappen dabei waagerecht)
  const hoverGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x58c8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  hoverGlow.scale.set(2.6, 1.2, 1);
  hoverGlow.position.set(0, 0.12, 0);
  root.add(hoverGlow);

  // Kontaktschatten: weicher dunkler Fleck unter dem Kart – es „steht“ auf der Fahrbahn (auch ohne Umgebungsverdeckung)
  const blob = new THREE.Mesh((BLOB_GEO ??= new THREE.PlaneGeometry(2.5, 1.75).rotateX(-Math.PI / 2)),
    (BLOB_MAT ??= Object.assign(new THREE.MeshBasicMaterial({ map: blobTexture(), color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), { userData: { shared: true } })));
  blob.position.y = 0.035;
  blob.userData.noShadow = true;
  blob.name = 'kontaktschatten';
  root.add(blob);

  let roll = 0;
  return {
    root, body, seat, wheels, steering, flames, sparks,
    update(dt, k) {
      const speed = k.speed ?? 0;
      const hover = k.hover ?? 0;
      blob.visible = !k.air;
      for (const w of wheels) {
        w.spin.rotation.z -= (speed / w.r) * dt;
        if (w.front) w.hub.rotation.y = (k.steer ?? 0) * 0.42;
        w.hub.rotation.x = w.side * hover * Math.PI / 2;   // Anti-Gravitation: Räder waagerecht
      }
      hoverGlow.material.opacity = hover * (0.55 + 0.15 * Math.sin((k.t ?? 0) * 9));
      hoverGlow.visible = hover > 0.01;   // (Sprites mit Deckkraft 0 gar nicht erst zeichnen)
      steering.rotation.x = -(k.steer ?? 0) * 0.9;
      // Federung: leichtes Rütteln mit dem Tempo, Neigung in der Kurve/beim Driften
      const t = k.t ?? 0;
      const targetRoll = -(k.steer ?? 0) * 0.05 * Math.min(1, speed / 15) - (k.drift ?? 0) * 0.07;
      roll += (targetRoll - roll) * (1 - Math.exp(-8 * dt));
      body.rotation.x = roll;
      body.position.y = 0.012 * Math.sin(t * 37) * Math.min(1, speed / 10) * (k.offroad ? 3 : 1);
      // Turbo-Flammen
      const b = k.boost ?? 0;
      for (const f of flames) {
        const s = b > 0 ? 0.35 + 0.35 * b + 0.12 * Math.sin(t * 60 + f.position.z * 10) : 0.01;
        f.scale.set(s * 1.4, s, 1);
        f.material.color.setHex(k.boostColor ?? 0xff8a2a);
        f.material.opacity = b > 0 ? 1 : 0;
        f.visible = b > 0;
      }
      glow.material.opacity = b > 0 ? 0.5 * b : 0;
      glow.visible = b > 0;
      // Drift-Funken: Farbe je Ladestufe
      const lv = k.sparkLevel ?? 0;
      for (const sp of sparks) {
        const on = (k.drift ?? 0) !== 0;
        const s = on ? (lv > 0 ? 0.32 + 0.12 * Math.sin(t * 70 + sp.position.z * 7) : 0.16 + 0.05 * Math.sin(t * 50)) : 0.01;
        sp.scale.setScalar(s);
        sp.material.color.setHex(SPARK_COLORS[lv] ?? 0xffffff);
        sp.material.opacity = on ? 1 : 0;
        sp.visible = on;
      }
    },
  };
}

export { metal };

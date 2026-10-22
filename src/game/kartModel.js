// Kart-Modell im Spielzeug-Look der Lotti-&-Greta-Welt (weiche runde Formen, kräftige Farben, keine Texturen).
// Maßstab Meter, Ursprung = Mitte der Bodenfläche, Blick nach +X (wie alle Modelle der Welt).
//
// buildKart(style) → { root, body, seat (Object3D am Sitzpunkt), wheels[4], steering, flames, update(dt, k) }
//   style  { main, accent, trim, rim, flag }  (Hex-Farben)
//   k      { speed (m/s), steer (-1..1, + = links), boost (0..1), drift (0 | ±1), sparkLevel (0..3), t }
// Ein verschmolzenes Mesh für Chassis/Sitz/Motor, je ein Mesh für die vier Räder und das Lenkrad;
// Auspuff-Flammen und Drift-Funken sind additive Sprites (keine Schatten).

import { THREE, Build, vcol, mesh, glowTexture, metal } from '../lgw/course/models/lib/kit.js';

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
    b.box(0.14, 0.5, 0.56, st.seat ?? 0x34304a, { p: [KART.seatX - 0.26, 0.6, 0] , r: [0, 0, 0.18] }, 0.07);
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
    return b.geometry();
  });
}

function wheelGeo(r, rim) {
  return cachedGeo(`kart:wheel:${r}:${rim}`, () => {
    const b = new Build();
    const w = r * 0.95;
    b.cyl(r, r, w, TIRE, { r: [Math.PI / 2, 0, 0] }, 20);
    b.torus(r * 0.86, r * 0.16, TIRE_SIDE, { p: [0, 0, w / 2] }, 8, 20);
    b.torus(r * 0.86, r * 0.16, TIRE_SIDE, { p: [0, 0, -w / 2] }, 8, 20);
    // Felge mit Nabe und Speichen-Noppen (Drehung sichtbar)
    for (const s of [1, -1]) {
      b.cyl(r * 0.58, r * 0.58, 0.03, rim, { p: [0, 0, s * (w / 2 + 0.005)], r: [Math.PI / 2, 0, 0] }, 16);
      b.sphere(r * 0.2, 0xfff8ee, { p: [0, 0, s * (w / 2 + 0.02)], s: [1, 1, 0.5] }, 10, 6);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        b.sphere(r * 0.1, 0xfff8ee, { p: [Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38, s * (w / 2 + 0.02)], s: [1, 1, 0.5] }, 8, 5);
      }
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

export const SPARK_COLORS = [0xffffff, 0x58b8ff, 0xffa030, 0xff5ad0];

export function buildKart(style) {
  const root = new THREE.Group();
  root.name = 'kart';
  const body = new THREE.Group();     // neigt sich (Federung, Drift), Räder bleiben am Boden
  root.add(body);
  const shell = mesh(bodyGeo(style), vcol(0.38), {}, true);
  body.add(shell);

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
      wheels.push({ hub, spin, front, r: def.r });
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

  let roll = 0;
  return {
    root, body, seat, wheels, steering, flames, sparks,
    update(dt, k) {
      const speed = k.speed ?? 0;
      for (const w of wheels) {
        w.spin.rotation.z -= (speed / w.r) * dt;
        if (w.front) w.hub.rotation.y = (k.steer ?? 0) * 0.42;
      }
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
      }
      glow.material.opacity = b > 0 ? 0.5 * b : 0;
      // Drift-Funken: Farbe je Ladestufe
      const lv = k.sparkLevel ?? 0;
      for (const sp of sparks) {
        const on = (k.drift ?? 0) !== 0;
        const s = on ? (lv > 0 ? 0.32 + 0.12 * Math.sin(t * 70 + sp.position.z * 7) : 0.16 + 0.05 * Math.sin(t * 50)) : 0.01;
        sp.scale.setScalar(s);
        sp.material.color.setHex(SPARK_COLORS[lv] ?? 0xffffff);
        sp.material.opacity = on ? 1 : 0;
      }
    },
  };
}

export { metal };

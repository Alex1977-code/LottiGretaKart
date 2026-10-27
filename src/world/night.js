// Nachtmodus für alle Strecken (wie die Nachtstrecken in Need for Speed und die Abendstimmung in Mario Kart 8):
// jedes Thema bekommt eine Nachtvariante (dunkelblauer Himmel, Mondlicht, dunkler Nebel), entlang aller Straßen
// stehen Laternen mit warmen Lichtkegeln auf dem Asphalt, die Karts fahren mit Scheinwerfern. Leuchtende Dinge
// (Fenster, Neon, Laternen, Münzen) strahlen über das Leuchten der Bildnachbearbeitung.

import * as THREE from 'three';

let night = false;
export const isNight = () => night;
export function setNight(v) { night = !!v; }

// Materialien, die nachts stärker leuchten (Fenster, Laternen …): [Material, Tag, Nacht]
const glows = [];
export function nightGlow(mat, day, nightK) { glows.push([mat, day, nightK]); mat.emissiveIntensity = night ? nightK : day; }
export function applyNightGlow(on) { for (const [m, d, n] of glows) m.emissiveIntensity = on ? n : d; }

const _a = new THREE.Color(), _b = new THREE.Color();
const mix = (c, n, k) => _a.setHex(c).lerp(_b.setHex(n), k).getHex();
const scale = (c, k) => _a.setHex(c).multiplyScalar(k).getHex();
const lum = (c) => { _a.setHex(c); return 0.3 * _a.r + 0.59 * _a.g + 0.11 * _a.b; };

/** Himmelsverlauf bei Nacht (Höhe → Farbe), Stadt-Themen mit Lichtglocke am Horizont. */
function nightSky(t, city) {
  const stops = city
    ? [[1, 0x05071a], [0.45, 0x0d1236], [0.15, 0x261c4e], [0.03, 0x5a2f62], [0, 0x6a3a64], [-0.1, 0x241a32], [-1, 0x0a0812]]
    : [[1, 0x040818], [0.45, 0x0a1430], [0.15, 0x16254e], [0.03, 0x2a3a66], [0, 0x33456e], [-0.1, 0x1a2238], [-1, 0x080b14]];
  let i = 0;
  while (i < stops.length - 2 && t < stops[i + 1][0]) i++;
  const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
  return mix(c0, c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
}

const cache = new WeakMap();
/** Nachtvariante eines Themas (zwischengespeichert). Ohnehin dunkle Themen (Höhle, Zelt) bleiben fast gleich. */
export function nightTheme(t) {
  let n = cache.get(t);
  if (n) return n;
  const dark = lum(t.background) < 0.2;
  const city = !!t.city;
  if (dark) n = { ...t, hemi: { ...t.hemi, intensity: t.hemi.intensity * 0.85 }, sun: { ...t.sun, intensity: t.sun.intensity * 0.8 } };
  else n = {
    ...t,
    sky: t.sky.map(([h, c]) => [h, mix(nightSky(h, city), scale(c, 0.25), 0.18)]),
    background: mix(nightSky(0.02, city), t.background, 0.06),
    fog: { color: mix(city ? 0x2a2048 : 0x18223e, t.fog.color, 0.08), near: t.fog.near * 0.75, far: t.fog.far * 0.85 },
    hemi: { sky: mix(0x5068b0, t.hemi.sky, 0.15), ground: mix(0x1c2034, t.hemi.ground, 0.2), intensity: t.hemi.intensity * 0.5 },
    sun: { ...t.sun, color: 0xa4b8ff, intensity: t.sun.intensity * 0.32 },
  };
  n.isNight = true;
  cache.set(t, n);
  return n;
}

function poolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let POOL = null;
export const lightPoolTexture = () => (POOL ??= poolTexture());

/** Ist u in der Nähe eines Bauwerks über der Fahrbahn? */
const nearOver = (tr, u, du) => (tr.overRoad ?? []).some((o) => { let d = Math.abs(o - u); d = Math.min(d, 1 - d); return d < du; });

/**
 * Laternen entlang aller Strecken und Verbindungsstraßen (nur nachts sichtbar): Mast mit Ausleger, leuchtender
 * Lampenkopf, warmer Lichtkegel auf der Fahrbahn (additiv, keine echten Lichter – schnell auch auf dem Handy).
 */
export function buildNightLamps(world, quality = 2) {
  const night = buildLampSet(world, quality, (tr) => !tr.def?.night, 'nachtlaternen');
  night.visible = false;
  // Nachtstrecken: Laternen immer an, auf nassem Asphalt mit Spiegelungen
  const always = buildLampSet(world, quality, (tr) => !!tr.def?.night, 'nachtstadt-laternen');
  return { night, always };
}

function buildLampSet(world, quality, want, name) {
  const group = new THREE.Group();
  group.name = name;
  const lamps = [], pools = [], streaks = [];
  const step = quality >= 3 ? 30 : quality >= 2 ? 36 : 48;
  for (const tr of world.roads) {
    if (!want(tr)) continue;
    const N = tr.N, len = tr.length ?? N * 2;
    const di = Math.max(4, Math.round((step / len) * N));
    let side = 1;
    for (let i = 0; i < N; i += di) {
      side = -side;
      if ((tr.hasLift && Math.abs(tr.lift[i]) > 0.3) || (tr.hasDive && tr.lift[i] < -0.3)) continue;
      if (nearOver(tr, i / N, 0.02) || tr.inGap?.(side, i)) continue;
      const W = (tr.wallAt?.(i) ?? tr.hw[i] + 1) + 0.8;
      const x = tr.px[i] - tr.tz[i] * side * W, z = tr.pz[i] + tr.tx[i] * side * W;
      const y = world.heightAt(x, z);
      if (y < 0.3 || world.underwaterAt?.(x, z)) continue;
      // Ausleger zeigt zur Fahrbahn
      const ax = tr.tz[i] * side, az = -tr.tx[i] * side;   // Richtung zur Fahrbahnmitte
      lamps.push([x, y, z, Math.atan2(-az, ax)]);
      const lat = side * Math.max(0, W - 3.4);
      const px = tr.px[i] - tr.tz[i] * lat, pz = tr.pz[i] + tr.tx[i] * lat;
      const py = tr.hasLift || tr.hasDive ? tr.roadY(i, px, pz) : world.heightAt(px, pz);
      pools.push([px, py + 0.06, pz]);
      if (tr.theme?.wetRoad) {
        // Spiegelung der Lampe und (gegenüber) eines Neon-Schilds auf dem nassen Asphalt
        const hl = side * Math.max(0, W - 2.4);
        streaks.push([tr.px[i] - tr.tz[i] * hl, py + 0.07, tr.pz[i] + tr.tx[i] * hl, 1.0, 0.72, 0.38, 1.0]);
        const ol = -side * (tr.hw[i] - 0.6), neon = (i / di) % 3;
        streaks.push([tr.px[i] - tr.tz[i] * ol, py + 0.07, tr.pz[i] + tr.tx[i] * ol, ...(neon === 0 ? [1.0, 0.25, 0.6] : neon === 1 ? [0.25, 0.85, 1.0] : [0.7, 0.4, 1.0]), 0.8]);
      }
    }
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  const inst = (geo, mat, list, set, name) => {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((v, k) => { set(v); im.setMatrixAt(k, m); });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.name = name;
    group.add(im);
    return im;
  };
  const setYaw = ([x, y, z, yaw]) => { e.set(0, yaw, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s); };
  // Mast + Ausleger (Ausleger entlang +x, wird zur Fahrbahn gedreht)
  const pole = new THREE.CylinderGeometry(0.11, 0.15, 6.4, 8).translate(0, 3.2, 0);
  const arm = new THREE.BoxGeometry(2.6, 0.12, 0.12).translate(1.2, 6.25, 0);
  const geo = mergeTwo(pole, arm);
  inst(geo, new THREE.MeshStandardMaterial({ color: 0x3a3f4c, roughness: 0.5, metalness: 0.5 }), lamps, setYaw, 'laternenmast');
  const head = new THREE.BoxGeometry(0.75, 0.16, 0.42).translate(2.4, 6.12, 0);
  inst(head, new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd890, emissiveIntensity: 3.2 }), lamps, setYaw, 'laternenkopf');
  const pool = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const pmat = new THREE.MeshBasicMaterial({ map: lightPoolTexture(), color: 0xffb860, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  s.set(13, 1, 13);
  inst(pool, pmat, pools, ([x, y, z]) => { m.compose(p.set(x, y, z), q.identity(), s); }, 'lichtkegel');
  if (streaks.length) group.add(wetStreaks(streaks));
  return group;
}

/**
 * Spiegelungen auf nassem Asphalt: lange, weiche Lichtstreifen, die vom Fußpunkt der Lichtquelle zur Kamera
 * zeigen (wie echte Spiegelungen auf nasser Straße). Ein Zeichenaufruf; Ausrichtung im Vertex-Shader.
 * list: [x, y, z, r, g, b, Stärke]
 */
function wetStreaks(list) {
  const base = new THREE.PlaneGeometry(1, 1, 1, 4).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.attributes.position);
  g.setAttribute('uv', base.attributes.uv);
  const P = new Float32Array(list.length * 3), C = new Float32Array(list.length * 4);
  list.forEach(([x, y, z, r, gg, b, k], i) => { P.set([x, y, z], i * 3); C.set([r, gg, b, k], i * 4); });
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(P, 3));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 4));
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aPos; attribute vec4 aCol;
      varying vec2 vUv; varying vec4 vCol; varying float vFade;
      void main() {
        vec2 d = cameraPosition.xz - aPos.xz;
        float dist = length(d);
        d /= max(dist, 0.001);
        vec2 sd = vec2(-d.y, d.x);
        float len = clamp(dist * 0.32, 4.0, 15.0);
        vec3 w = aPos + vec3(d.x, 0.0, d.y) * (position.y * len - 0.6) + vec3(sd.x, 0.0, sd.y) * position.x * 1.3;
        vUv = uv; vCol = aCol;
        vFade = 1.0 - smoothstep(60.0, 140.0, dist);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec4 vCol; varying float vFade;
      void main() {
        float a = pow(1.0 - vUv.y, 1.6) * pow(1.0 - abs(vUv.x * 2.0 - 1.0), 1.8);
        // leicht zerrissen wie auf echtem nassem Asphalt
        a *= 0.75 + 0.25 * sin(vUv.y * 38.0 + vUv.x * 7.0);
        gl_FragColor = vec4(vCol.rgb * a * vCol.a * 1.25 * vFade, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.name = 'nasse-spiegelungen';
  return mesh;
}

function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  const ai = a.index ? a.toNonIndexed() : a, bi = b.index ? b.toNonIndexed() : b;
  for (const name of ['position', 'normal', 'uv']) {
    const A = ai.attributes[name], B = bi.attributes[name];
    const arr = new Float32Array(A.array.length + B.array.length);
    arr.set(A.array, 0); arr.set(B.array, A.array.length);
    g.setAttribute(name, new THREE.BufferAttribute(arr, A.itemSize));
  }
  return g;
}

/** Scheinwerfer für ein Kart: zwei leuchtende Lampen vorn und ein Lichtkegel auf der Straße davor. */
export function addHeadlights(kart) {
  const g = new THREE.Group();
  g.name = 'scheinwerfer';
  const bulb = new THREE.MeshBasicMaterial({ color: 0xfff6dc });
  for (const z of [-0.32, 0.32]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), bulb);
    b.position.set(0.86, 0.36, z);
    b.userData.noShadow = true;
    g.add(b);
  }
  const cone = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: lightPoolTexture(), color: 0xd8e4ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  cone.scale.set(9, 1, 4.6);
  cone.position.set(5.6, 0.07, 0);
  cone.userData.noShadow = true;
  g.add(cone);
  kart.root.add(g);
  return g;
}

/** Licht für Autos im Stadtverkehr: Scheinwerfer, Rücklichter, Lichtkegel auf der Straße (Auto ≈ 4,4 m, vorn +X). */
export function addCarLights(holder) {
  const g = new THREE.Group();
  g.name = 'autolichter';
  const front = (CAR_FRONT ??= new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
  const back = (CAR_BACK ??= new THREE.MeshBasicMaterial({ color: 0xff2a3a }));
  const fb = (CAR_FB ??= new THREE.BoxGeometry(0.08, 0.2, 0.42));
  for (const z of [-0.62, 0.62]) {
    const a = new THREE.Mesh(fb, front); a.position.set(2.21, 0.82, z); g.add(a);
    const b = new THREE.Mesh(fb, back); b.position.set(-2.21, 0.86, z); g.add(b);
  }
  const cone = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    (CAR_CONE ??= new THREE.MeshBasicMaterial({ map: lightPoolTexture(), color: 0xe8eeff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
  cone.scale.set(12, 1, 6);
  cone.position.set(8.5, 0.08, 0);
  g.add(cone);
  g.traverse((o) => { o.userData.noShadow = true; o.castShadow = false; });
  holder.add(g);
  return g;
}
let CAR_FRONT = null, CAR_BACK = null, CAR_FB = null, CAR_CONE = null;

// Wetter für die Rennen: Sonne, Regen oder Calima (Saharastaub-Dunst wie auf den Kanaren).
//   Regen   grauer Himmel mit dunklen Wolken, dichter Nebel, schräg fallende Tropfen um die Kamera (ein
//           Zeichenaufruf, Bewegung im Shader), nasse Fahrbahn mit Pfützen und Gischt hinter den Karts, Rauschen.
//   Calima  ockerfarbener Dunst, die Sonne als blasse Scheibe, sehr kurze Sichtweite, treibende Staubkörner, Wind.
// Die Themen (Himmel, Licht, Nebel) werden je Wetter umgefärbt – auch zusammen mit der Nacht.

import * as THREE from 'three';
import { RAIN_WET } from './shaders.js';

export const WEATHERS = ['sun', 'rain', 'calima'];
let setting = 'sun';
export const getWeatherSetting = () => setting;
export function setWeatherSetting(v) { setting = ['sun', 'rain', 'calima', 'random'].includes(v) ? v : 'sun'; }

/** Wetter für ein Rennen: Einstellung, bei „Zufall“ meist Sonne (Strecken können eigene Chancen haben). */
export function resolveWeather(def, rnd = Math.random) {
  if (setting !== 'random') return setting;
  const [pr, pc] = def?.weatherOdds ?? [0.3, 0.15];
  const r = rnd();
  return r < pr ? 'rain' : r < pr + pc ? 'calima' : 'sun';
}

const _a = new THREE.Color(), _b = new THREE.Color();
const lum = (c) => { _a.setHex(c); return 0.3 * _a.r + 0.59 * _a.g + 0.11 * _a.b; };
const mix = (c, n, k) => _a.setHex(c).lerp(_b.setHex(n), k).getHex();
const scale = (c, k) => _a.setHex(c).multiplyScalar(k).getHex();
/** Farbe in Richtung einer Zielfarbe gleicher Helligkeit schieben (Grau bzw. Ocker), dann abdunkeln. */
const toward = (c, target, k, dim = 1) => {
  const l = lum(c), tl = Math.max(0.05, lum(target));
  _b.setHex(target).multiplyScalar(Math.min(3, l / tl));
  return _a.setHex(c).lerp(_b, k).multiplyScalar(dim).getHex();
};

const caches = { rain: new WeakMap(), calima: new WeakMap() };
/** Thema im Wetter umfärben (zwischengespeichert). */
export function weatherTheme(t, kind) {
  if (kind !== 'rain' && kind !== 'calima') return t;
  const cache = caches[kind];
  let n = cache.get(t);
  if (n) return n;
  if (kind === 'rain') {
    const grey = 0x8f9aa6;
    n = {
      ...t,
      sky: t.sky.map(([h, c]) => [h, toward(c, h > 0.1 ? 0x7d8794 : grey, 0.82, 0.72)]),
      background: toward(t.background, grey, 0.85, 0.72),
      fog: { color: toward(t.fog.color, grey, 0.85, 0.7), near: t.fog.near * 0.4, far: t.fog.far * 0.55 },
      hemi: { sky: toward(t.hemi.sky, 0xc8d2dc, 0.7), ground: t.hemi.ground, intensity: t.hemi.intensity * 0.85 },
      sun: { ...t.sun, color: toward(t.sun.color, 0xdfe6ee, 0.8), intensity: t.sun.intensity * 0.3 },
      sunDisc: false, clouds: true,
    };
  } else {
    const ochre = 0xd8a060;
    n = {
      ...t,
      sky: t.sky.map(([h, c]) => [h, toward(c, h > 0.3 ? 0xc89a68 : ochre, 0.8)]),
      background: toward(t.background, ochre, 0.9),
      fog: { color: toward(t.fog.color, 0xd09858, 0.9, 0.95), near: t.fog.near * 0.25, far: t.fog.far * 0.42 },
      hemi: { sky: toward(t.hemi.sky, 0xf2c890, 0.65), ground: mix(t.hemi.ground, 0x9a6a3a, 0.3), intensity: t.hemi.intensity * 0.95 },
      sun: { ...t.sun, color: toward(t.sun.color, 0xffb870, 0.75), intensity: t.sun.intensity * 0.6 },
      clouds: false,
    };
  }
  n.weather = kind;
  cache.set(t, n);
  return n;
}

const RAIN_VS = /* glsl */ `
  attribute vec3 aOff;
  uniform float uTime, uFall, uLen, uWidth;
  uniform vec3 uCam, uBox;
  uniform vec2 uWind;
  varying float vA; varying float vX;
  void main() {
    // Tropfen in der Welt verankert (Kasten wandert mit der Kamera), fallen und kommen oben wieder herein
    vec3 o = uCam - uBox * vec3(0.5, 0.3, 0.5);
    vec3 p = aOff * uBox;
    p.y -= uTime * uFall * (0.85 + 0.3 * aOff.x);
    p.xz += uWind * (uTime * (0.85 + 0.3 * aOff.x));
    vec3 w = o + mod(p - o, uBox);
    vec3 d = normalize(vec3(uWind.x, -uFall, uWind.y));
    vec3 side = normalize(cross(d, w - cameraPosition));
    w += d * (position.y * uLen) + side * position.x * uWidth;
    float dist = length(w - cameraPosition);
    vA = (1.0 - smoothstep(6.0, 28.0, dist)) * smoothstep(0.8, 2.5, dist);
    vX = position.x;
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  }`;
const RAIN_FS = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha;
  varying float vA; varying float vX;
  void main() {
    float a = vA * uAlpha * (1.0 - abs(vX * 2.0));
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }`;

const DUST_VS = /* glsl */ `
  attribute vec3 aOff;
  uniform float uTime, uSize;
  uniform vec3 uCam, uBox;
  uniform vec2 uWind;
  varying float vA;
  void main() {
    vec3 o = uCam - uBox * vec3(0.5, 0.25, 0.5);
    vec3 p = aOff * uBox;
    p.xz += uWind * uTime * (0.7 + 0.6 * aOff.y);
    p.y += sin(uTime * 0.7 + aOff.x * 40.0) * 0.6;
    vec3 w = o + mod(p - o, uBox);
    vec4 mv = viewMatrix * vec4(w, 1.0);
    float dist = -mv.z;
    vA = (1.0 - smoothstep(10.0, 34.0, dist)) * smoothstep(0.5, 2.0, dist);
    gl_PointSize = uSize * (0.6 + aOff.z) * 300.0 / max(1.0, dist);
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_FS = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha;
  varying float vA;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float a = vA * uAlpha * max(0.0, 1.0 - dot(q, q));
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }`;

/** Regen- bzw. Staubteilchen um die Kamera (gehört zum Rennen, wird mit ihm entfernt). */
export class WeatherFx {
  constructor(scene, kind, quality = 2) {
    this.kind = kind;
    this.t = 0;
    if (kind !== 'rain' && kind !== 'calima') return;
    const n = kind === 'rain' ? (quality >= 3 ? 4200 : quality >= 2 ? 2800 : 1400) : (quality >= 3 ? 1600 : quality >= 2 ? 1100 : 600);
    const off = new Float32Array(n * 3);
    for (let i = 0; i < off.length; i++) off[i] = Math.random();
    const uniforms = {
      uTime: { value: 0 }, uCam: { value: new THREE.Vector3() },
      uBox: { value: kind === 'rain' ? new THREE.Vector3(56, 24, 56) : new THREE.Vector3(70, 16, 70) },
      uWind: { value: kind === 'rain' ? new THREE.Vector2(2.2, 1.2) : new THREE.Vector2(3.2, 1.6) },
      uFall: { value: 17 }, uLen: { value: 0.75 }, uWidth: { value: 0.022 }, uSize: { value: 0.09 },
      uColor: { value: new THREE.Color(kind === 'rain' ? 0xd8e4f0 : 0xe8c08a) },
      uAlpha: { value: kind === 'rain' ? 0.42 : 0.5 },
    };
    this.uniforms = uniforms;
    let obj;
    if (kind === 'rain') {
      const base = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
      const g = new THREE.InstancedBufferGeometry();
      g.index = base.index;
      g.setAttribute('position', base.attributes.position);
      g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
      g.instanceCount = n;
      obj = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RAIN_VS, fragmentShader: RAIN_FS, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    } else {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aOff', new THREE.BufferAttribute(off, 3));
      obj = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms, transparent: true, depthWrite: false }));
    }
    obj.frustumCulled = false;
    obj.renderOrder = 6;
    obj.name = kind === 'rain' ? 'regen' : 'calima-staub';
    this.obj = obj;
    scene.add(obj);
  }

  update(dt, camera) {
    this.t += dt;
    if (!this.obj) return;
    this.uniforms.uTime.value = this.t % 1000;
    this.uniforms.uCam.value.copy(camera.position);
  }

  dispose() {
    if (!this.obj) return;
    this.obj.removeFromParent();
    this.obj.geometry.dispose();
    this.obj.material.dispose();
  }
}

/** Nässe der Straßen für den Shader setzen (Regen: nass, sonst trocken). */
export function setRoadWetness(kind) { RAIN_WET.value = kind === 'rain' ? 1 : 0; }

export { lum as weatherLum, scale as weatherScale };

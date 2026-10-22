// Symbole für HUD und Menüs: die echten 3D-Modelle werden einmal in eine kleine Render-Fläche gezeichnet und
// als Bild (data-URL) abgelegt – Gegenstände im Glücksrad, Fahrer-Porträts in der Auswahl und Rangliste.

import * as THREE from 'three';
import { getModel } from '../lgw/course/models/index.js';
import { ITEMS } from '../game/items.js';
import { buildKart } from '../game/kartModel.js';
import { createDriver } from '../game/drivers.js';

const SIZE = 160;
const cache = new Map();

function lightScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x8a7a6a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.6);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  return scene;
}

/** Objekt mittig einpassen und rendern → data-URL (sRGB, transparenter Hintergrund). */
function snapshot(renderer, obj, { yaw = -0.6, pitch = 0.18, fill = 0.82, look = null } = {}) {
  const scene = lightScene();
  const holder = new THREE.Group();
  holder.add(obj);
  holder.rotation.y = yaw;
  scene.add(holder);
  holder.updateMatrixWorld(true);
  // nur sichtbare Meshes zählen (ausgeblendetes Kart beim Baron, Sprites, Effekte)
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  holder.traverseVisible((o) => {
    if (!o.isMesh || o.isSprite || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(tmp);
  });
  if (box.isEmpty()) box.setFromObject(holder);
  const c = look ?? box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z) * 0.5 / fill;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const dist = r / Math.tan(THREE.MathUtils.degToRad(15));
  cam.position.set(c.x + dist * Math.cos(pitch) * 0.0001, c.y + dist * Math.sin(pitch), c.z + dist * Math.cos(pitch));
  cam.lookAt(c);
  const rt = new THREE.WebGLRenderTarget(SIZE, SIZE, { samples: 4 });
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, cam);
  const px = new Uint8Array(SIZE * SIZE * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, px);
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  rt.dispose();
  // linear → sRGB, Zeilen umdrehen
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  const enc = (v) => {
    const l = v / 255;
    const s = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255);
  };
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) lut[i] = enc(i);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const si = ((SIZE - 1 - y) * SIZE + x) * 4, di = (y * SIZE + x) * 4;
      const a = px[si + 3];
      // vormultipliziertes Alpha auflösen
      const k = a > 0 ? 255 / a : 0;
      img.data[di] = lut[Math.min(255, Math.round(px[si] * k))];
      img.data[di + 1] = lut[Math.min(255, Math.round(px[si + 1] * k))];
      img.data[di + 2] = lut[Math.min(255, Math.round(px[si + 2] * k))];
      img.data[di + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

/** Symbol eines Gegenstands. */
export function itemIcon(renderer, id) {
  const key = `item:${id}`;
  if (cache.has(key)) return cache.get(key);
  const def = ITEMS[id];
  let url = '';
  try {
    const m = getModel(def.model, def.opts ?? {});
    m.update(0.5, 'idle');
    url = snapshot(renderer, m.root, { yaw: id === 'kaefer' ? -0.9 : -0.5, pitch: id.includes('panzer') ? 0.6 : 0.2 });
    m.dispose();
  } catch (err) { console.warn('Symbol', id, err); }
  cache.set(key, url);
  return url;
}

/** Porträt einer Fahrerin (im Kart, schräg von vorn). */
export function racerIcon(renderer, racer, { kart = true } = {}) {
  const key = `racer:${racer.id}:${kart}`;
  if (cache.has(key)) return cache.get(key);
  let url = '';
  try {
    const k = buildKart(racer.kart);
    const d = createDriver(null, racer, k);
    for (let i = 0; i < 4; i++) d.update(0.1, 1 + i * 0.1, { speed: 0, steer: 0, mood: 'drive' });
    k.update(0, { speed: 0, steer: 0 });
    url = snapshot(renderer, k.root, { yaw: -0.75, pitch: 0.22, fill: 0.95 });
    d.dispose();
  } catch (err) { console.warn('Porträt', racer.id, err); }
  cache.set(key, url);
  return url;
}

export function preloadIcons(renderer, racers) {
  for (const id of Object.keys(ITEMS)) itemIcon(renderer, id);
  for (const r of racers) racerIcon(renderer, r);
}

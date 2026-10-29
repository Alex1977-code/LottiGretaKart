// Fernsicht rund um eine Strecken-Welt (wie in Mario Kart 8 Deluxe): die Landschaft geht bis zum Horizont weiter
// und steigt hinter dem Streckenausschnitt zu einem Bergkranz an – über dem Meer bleibt der Blick frei, nur
// vereinzelt ragen Inseln auf. Ein Netz aus Ringen (nah fein, fern grob), Farben nach Höhe und Thema der Strecke;
// Wälder an den unteren Hängen. Der Nebel (Sky.js) setzt spät ein: am Horizont liegen die Berge im Dunst.

import * as THREE from 'three';
import { lin } from '../lgw/three/world/geometry.js';
import { Rnd } from '../lgw/three/world/geometry.js';
import { Decor } from './decor.js';

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Wertrauschen (0 … 1) mit glatter Interpolation. */
function hash(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
/** Bergrücken: gefaltetes Rauschen in drei Oktaven (spitze Grate, runde Täler). */
function ridges(x, z) {
  let v = 0, amp = 0.55, f = 1 / 210;
  for (let k = 0; k < 3; k++) { v += amp * (1 - Math.abs(2 * noise(x * f + k * 17.3, z * f - k * 9.1) - 1)); amp *= 0.5; f *= 2.1; }
  return v / 0.96;
}

// Themen ohne Schnee auf den Gipfeln
const NO_SNOW = new Set(['desert', 'volcano', 'beach', 'canyon', 'candy', 'halloween', 'nightcity', 'city', 'arena', 'pirate', 'reef', 'zoo', 'jungle', 'tenerife', 'harbor', 'cats']);

/**
 * Fernsicht bauen und in group hängen. world: Strecken-Welt (def.bounds, def.center, baseHeight), theme: Thema
 * der Strecke. Liefert { mesh, decor } (decor wird mit der Welt abgebaut).
 */
export function buildBackdrop(group, scene, world, theme, quality = 2) {
  const B = world.def.bounds, C = world.def.center, tid = world.courses[0].def.theme;
  const R = 1250;   // bis knapp vor die ferne Schnittebene der Kamera
  // Abstand zum Streckenausschnitt (außen positiv, innen negativ)
  const sd = (x, z) => {
    const dx = Math.max(B.minX - x, 0, x - B.maxX), dz = Math.max(B.minZ - z, 0, z - B.maxZ);
    if (dx > 0 || dz > 0) return Math.hypot(dx, dz);
    return -Math.min(x - B.minX, B.maxX - x, z - B.minZ, B.maxZ - z);
  };
  const height = (x, z) => {
    const d = sd(x, z), base = world.baseHeight(x, z);
    if (d < -30) return -40;          // unter dem Gelände der Strecken-Welt versteckt
    if (d <= 0) return base - 1.2;
    const n = ridges(x, z), k = smooth(40, 430, d);
    let m = k * (28 + 150 * n * n);
    if (base < 0) m *= smooth(0.62, 0.8, n);   // über dem Meer: nur einzelne Inseln
    return base + m;
  };
  // Ringe um die Mitte: innen dicht (der Übergang zum Gelände), außen grob
  const radii = [];
  for (let r = 0; r < R; r += r < 500 ? 14 : r < 900 ? 26 : 40) radii.push(r);
  radii.push(R);
  const nA = quality >= 2 ? 180 : 120;
  const pos = new Float32Array(radii.length * nA * 3), col = new Float32Array(radii.length * nA * 3);
  const cGrass = lin(theme.grassFar ?? theme.grass), cGrass2 = lin(theme.grass2 ?? theme.grass), cRock = lin(theme.rock ?? 0x8a8296);
  const cRock2 = lin(0x6e6878), cSnow = lin(0xf4f6fa), cSand = lin(0xe8d39a);
  const snowy = !NO_SNOW.has(tid);
  const tmp = [0, 0, 0];
  let k = 0;
  for (let ri = 0; ri < radii.length; ri++) {
    for (let ai = 0; ai < nA; ai++, k++) {
      const a = (ai / nA) * Math.PI * 2, r = radii[ri];
      const x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, y = height(x, z);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      // Farbe: Strand, Wiese, Fels, Schnee – mit feinen Flecken
      const f = 0.9 + 0.1 * noise(x * 0.05, z * 0.05);
      const g = noise(x * 0.012, z * 0.012) < 0.5 ? cGrass : cGrass2;
      for (let q = 0; q < 3; q++) tmp[q] = g[q];
      const rock = smooth(55, 105, y + (noise(x * 0.02, z * 0.02) - 0.5) * 30);
      for (let q = 0; q < 3; q++) tmp[q] += ((y > 95 ? cRock2[q] : cRock[q]) - tmp[q]) * rock;
      if (snowy) { const s = smooth(140, 158, y + noise(x * 0.03, z * 0.03) * 14); for (let q = 0; q < 3; q++) tmp[q] += (cSnow[q] - tmp[q]) * s; }
      if (y < 2.2 && y > -3) { const s = smooth(2.2, 0.8, y); for (let q = 0; q < 3; q++) tmp[q] += (cSand[q] - tmp[q]) * s; }
      col[k * 3] = tmp[0] * f; col[k * 3 + 1] = tmp[1] * f; col[k * 3 + 2] = tmp[2] * f;
    }
  }
  const idx = [];
  for (let ri = 0; ri < radii.length - 1; ri++) {
    for (let ai = 0; ai < nA; ai++) {
      const a0 = ri * nA + ai, a1 = ri * nA + ((ai + 1) % nA), b0 = a0 + nA, b1 = a1 + nA;
      // ganz verdeckte Vierecke (unter dem Gelände) weglassen
      if (pos[a0 * 3 + 1] < -35 && pos[a1 * 3 + 1] < -35 && pos[b0 * 3 + 1] < -35 && pos[b1 * 3 + 1] < -35) continue;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'fernsicht';
  mesh.receiveShadow = false;
  group.add(mesh);

  // Wälder an den unteren Hängen der Fernsicht (Bäume ohne Schatten, in Kacheln)
  const decor = new Decor(scene, world.courses[0].track, theme, 77, quality, world);
  decor.noShadow = true;
  decor.tile = 220;
  const rnd = new Rnd(31);
  const n = quality >= 3 ? 2600 : quality >= 2 ? 1800 : 700;
  const pine = new Set(['snow', 'castle', 'halloween', 'volcano', 'cave', 'canyon']).has(tid);
  const palm = new Set(['beach', 'pirate', 'tenerife', 'harbor', 'reef', 'zoo', 'city', 'jungle']).has(tid);
  const dry = new Set(['desert', 'arena']).has(tid);
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const a = rnd.frac() * Math.PI * 2, r = 120 + rnd.frac() * 760;
    const x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, d = sd(x, z);
    if (d < 25 || d > 640) continue;
    const y = height(x, z);
    if (y < 1.5 || y > 95) continue;
    const s = 1.3 + rnd.frac() * 1.4 + d / 400;
    if (dry) decor.add(rnd.frac() < 0.5 ? 'cactus' : 'rock', x, y, z, s, rnd.frac() < 0.5 ? 0x4f9a3a : 0xc8784a, rnd.frac() * 6);
    else if (palm && y < 20) decor.add('palm', x, y, z, s * 0.8, 0x3fa02a, rnd.frac() * 6);
    else if (pine || y > 50) decor.add('pineTree', x, y, z, s, [0x2f6a3a, 0x3a7a42, 0x2a5e34][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
    else decor.add(rnd.frac() < 0.7 ? 'roundTree' : 'pineTree', x, y, z, s, [0x4fae34, 0x5cbf3a, 0x3f9a2a, 0x2f7a3a][Math.floor(rnd.frac() * 4)], rnd.frac() * 6);
    i++;
  }
  decor.build();
  return { mesh, decor };
}

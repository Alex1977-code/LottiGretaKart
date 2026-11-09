// Organische Formen für die Kulisse (statt einfacher Kugeln, Kegel und Zylinder): verformte Blattbüschel, gezackte
// Tannenetagen, verwitterte Felsen, erodierte Tafelberge, gerippte Kakteen, gefiederte Palmwedel.
// Alle Teile sind weiß bis grau eingefärbt (Licht von oben hell, unten und innen dunkler = eingebackene
// Umgebungsverdeckung); die eigentliche Farbe kommt je Exemplar aus der Kulisse (Instanzfarbe).

import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Build } from '../lgw/course/models/lib/kit.js';

// ------------------------------------------------------------------ Rauschen (3D, wiederholbar)
function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  let v = 0;
  for (let c = 0; c < 8; c++) {
    const dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
    v += hash3(ix + dx, iy + dy, iz + dz) * (dx ? ux : 1 - ux) * (dy ? uy : 1 - uy) * (dz ? uz : 1 - uz);
  }
  return v;
}
const fbm3 = (x, y, z, o = 3) => { let v = 0, a = 0.5, f = 1, s = 0; for (let k = 0; k < o; k++) { v += noise3(x * f, y * f, z * f) * a; s += a; a *= 0.5; f *= 2.03; } return v / s; };
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const grey = (v) => new THREE.Color(v, v, v);

/** Kugel aus Dreiecken, mit Rauschen verformt (glatte Normalen). */
function blob(r, detail, amp, freq, seed, { squash = 1, flat = -Infinity } = {}) {
  let g = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const l = Math.hypot(x, y, z) || 1;
    const n = fbm3(x * freq + seed, y * freq + seed * 0.7, z * freq - seed, 3) - 0.5;
    const k = 1 + n * amp;
    x *= k; y *= k * squash; z *= k;
    if (y < flat) y = flat + (y - flat) * 0.15;
    P.setXYZ(i, x, y, z);
    void l;
  }
  g.computeVertexNormals();
  return g;
}

/** Laubbaum: Stamm mit Wurzelansatz, zwei Äste, Krone aus 7 unregelmäßigen Büscheln (Höhe ≈ 5,5 m). */
export function treeGeo() {
  const b = new Build();
  b.lathe([[0.55, 0], [0.42, 0.25], [0.32, 0.8], [0.28, 2.2], [0.22, 3.2]], { v: (x, y) => new THREE.Color(0x8a5a30).multiplyScalar(0.75 + 0.25 * smooth(0, 3, y)) }, {}, 9);
  for (const [a, h, l] of [[0.6, 2.2, 1.4], [2.7, 2.6, 1.2], [4.4, 2.4, 1.1]]) b.cyl(0.07, 0.14, l, 0x7a4e2a, { p: [Math.cos(a) * l * 0.35, h + 0.35, Math.sin(a) * l * 0.35], r: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9] }, 5);
  const clumps = [[0, 4.2, 0, 1.75], [1.1, 3.6, 0.5, 1.25], [-1.0, 3.7, -0.6, 1.3], [0.3, 3.4, -1.2, 1.15], [-0.4, 3.3, 1.15, 1.15], [0.6, 5.0, 0.2, 1.1], [-0.7, 4.8, 0.3, 0.95]];
  clumps.forEach(([x, y, z, r], k) => {
    const g = blob(r, 1, 0.45, 1.3, k * 3.1, { squash: 0.86 });
    g.translate(x, y, z);
    b.add(g, { v: (px, py, pz) => {
      // oben und außen hell, unten und innen dunkel (eingebackene Verdeckung), feine Fleckung
      const up = smooth(2.6, 5.6, py), out = Math.min(1, Math.hypot(px, pz) / 2.2);
      return grey(0.5 + 0.38 * up + 0.12 * out + (noise3(px * 2.1, py * 2.1, pz * 2.1) - 0.5) * 0.12);
    } });
  });
  return b.geometry();
}

/** Tanne: Stamm und fünf hängende, gezackte Zweigetagen (Höhe ≈ 6,2 m). */
export function pineGeo() {
  const b = new Build();
  b.cyl(0.16, 0.3, 2.2, 0x6a4424, { p: [0, 1.1, 0] }, 7);
  const layers = 5;
  for (let L = 0; L < layers; L++) {
    const R = 2.2 - L * 0.38, y0 = 1.3 + L * 0.95, h = 1.7 - L * 0.12, seg = 14;
    const pos = [], idx = [];
    pos.push(0, y0 + h, 0);
    for (let i = 0; i < seg * 2; i++) {
      const a = (i / (seg * 2)) * Math.PI * 2 + L * 0.4, rr = R * (i % 2 ? 0.78 : 1) * (0.92 + 0.16 * noise3(i * 0.7, L, 3));
      pos.push(Math.cos(a) * rr, y0 - (i % 2 ? 0.05 : 0.32), Math.sin(a) * rr);
    }
    // Unterseite leicht nach innen gewölbt
    pos.push(0, y0 + 0.35, 0);
    const n = seg * 2, under = n + 1;
    for (let i = 0; i < n; i++) { const a = 1 + i, c = 1 + ((i + 1) % n); idx.push(0, c, a, under, a, c); }
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    b.add(g, { v: (x, y) => grey(0.52 + 0.4 * smooth(y0 - 0.3, y0 + h, y) + L * 0.02) });
  }
  return b.geometry();
}

/** Busch: drei bis vier Blattbüschel (Höhe ≈ 1,4 m). */
export function bushGeo() {
  const b = new Build();
  for (const [x, y, z, r, s] of [[0, 0.65, 0, 0.95, 1], [0.75, 0.5, 0.25, 0.7, 2], [-0.65, 0.48, -0.3, 0.68, 3], [0.1, 0.45, 0.75, 0.6, 4]]) {
    const g = blob(r, 1, 0.5, 1.8, s * 2.3, { squash: 0.85, flat: -0.45 });
    g.translate(x, y, z);
    b.add(g, { v: (px, py) => grey(0.55 + 0.45 * smooth(0, 1.4, py)) });
  }
  return b.geometry();
}

/** Fels: kantig verwitterter Brocken mit Spalten (flache Unterseite). */
export function rockGeo() {
  const b = new Build();
  for (const [x, y, z, r, s] of [[0, 0.55, 0, 1.15, 1], [0.9, 0.35, 0.35, 0.75, 2]]) {
    let g = blob(r, 1, 0.55, 1.1, s * 5.7, { squash: 0.72, flat: -0.35 });
    g.translate(x, y, z);
    g = g.toNonIndexed(); g.computeVertexNormals();   // kantig: harte Kanten zwischen den Flächen
    b.add(g, (cx, cy, cz, nx, ny) => grey(0.6 + 0.3 * Math.max(0, ny) + (noise3(cx * 3, cy * 3, cz * 3) - 0.5) * 0.2));
  }
  return b.geometry();
}

/** Tafelberg: erodierte Gesteinsschichten mit Überhängen und Bändern (Höhe ≈ 18 m, Fuß ≈ 12 m). */
export function mesaGeo() {
  const prof = [[6.6, 0], [6.4, 2], [5.6, 4.5], [5.9, 6], [5.0, 8.5], [5.3, 10], [4.6, 13], [4.9, 14.5], [4.5, 17.2], [3.9, 17.8], [0, 18]];
  let g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = Math.hypot(x, z);
    if (r < 0.01) continue;
    const a = Math.atan2(z, x);
    const k = 1 + (fbm3(Math.cos(a) * 1.6, y * 0.18, Math.sin(a) * 1.6, 3) - 0.5) * 0.55 + Math.sin(a * 5 + y * 0.3) * 0.04;
    P.setX(i, x * k); P.setZ(i, z * k);
  }
  g.computeVertexNormals();
  g = g.toNonIndexed(); g.computeVertexNormals();
  const b = new Build();
  b.add(g, (cx, cy, cz, nx, ny) => {
    const band = Math.sin(cy * 1.15 + noise3(cx * 0.2, 0, cz * 0.2) * 2) * 0.5 + 0.5;
    return grey(0.62 + band * 0.22 + (ny > 0.7 ? 0.12 : 0) - smooth(4, 0, cy) * 0.12);
  });
  return b.geometry();
}

/** Kaktus: gerippter Stamm, zwei Arme, Blüte. */
export function cactusGeo() {
  const b = new Build();
  const ribbed = (r, h, color) => {
    const g = new THREE.CylinderGeometry(r, r * 1.08, h, 12, 3);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), a = Math.atan2(z, x), k = 1 + Math.cos(a * 8) * 0.12; P.setX(i, x * k); P.setZ(i, z * k); }
    g.computeVertexNormals();
    return [g, { v: (x, y, z) => { const a = Math.atan2(z, x); return grey(0.72 + Math.cos(a * 8) * 0.18); } }, color];
  };
  const [g0, c0] = ribbed(0.34, 3.2); g0.translate(0, 1.6, 0); b.add(g0, c0);
  b.sphere(0.34, 0xffffff, { p: [0, 3.2, 0], s: [1, 0.7, 1] }, 12, 6);
  for (const [s, y, l] of [[1, 1.5, 1.0], [-1, 2.1, 0.8]]) {
    b.add(new THREE.TorusGeometry(0.42, 0.2, 8, 10, Math.PI / 2), 0xeeeeee, { p: [s * 0.42, y + 0.42, 0], r: [0, s > 0 ? Math.PI : 0, Math.PI] });
    const [g1, c1] = ribbed(0.2, l); g1.translate(s * 0.84, y + 0.42 + l / 2, 0); b.add(g1, c1);
    b.sphere(0.2, 0xffffff, { p: [s * 0.84, y + 0.42 + l, 0], s: [1, 0.7, 1] }, 8, 5);
  }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.sphere(0.09, 0xff6aa8, { p: [Math.cos(a) * 0.1, 3.42, Math.sin(a) * 0.1], s: [1, 0.5, 1] }, 6, 4); }
  return b.geometry();
}

/** Palme: geschwungener Ringstamm, acht gefiederte, hängende Wedel, Kokosnüsse (Höhe ≈ 6 m). */
export function palmGeo() {
  const b = new Build();
  const pts = [];
  for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push(new THREE.Vector3(f * f * 1.6, f * 5.6, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  for (let k = 0; k < 14; k++) {
    const t0 = k / 14, p = curve.getPoint(t0 + 0.035), tng = curve.getTangent(t0 + 0.035);
    const g = new THREE.CylinderGeometry(0.25 - t0 * 0.08, 0.3 - t0 * 0.08, 0.42, 9);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tng));
    g.translate(p.x, p.y, p.z);
    b.add(g, k % 2 ? 0xa8845a : 0x94744c);
  }
  const top = curve.getPoint(1);
  // Wedel: Mittelrippe, die nach außen durchhängt, beiderseits gezackte Fiederkämme (beidseitig sichtbar)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (i % 2) * 0.2, droop = 0.32 + (i % 3) * 0.1, L = 2.9 - (i % 2) * 0.4;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), side = new THREE.Vector3(-dir.z, 0, dir.x);
    const rib = [];
    const n = 10;
    for (let k = 0; k <= n; k++) { const t = k / n, x = t * L; const c = top.clone().addScaledVector(dir, x); c.y += 0.25 * (1 - t) - x * x * droop * 0.3; rib.push(c); }
    const pos = [], col = [];
    const push = (v, c) => { pos.push(v.x, v.y, v.z); col.push(c, c, c); };
    for (const sg of [-1, 1]) {
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, w = 0.85 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08)) + 0.1;
        const tip = rib[k].clone().lerp(rib[k + 1], 0.8).addScaledVector(side, sg * w); tip.y -= 0.32 * w;
        const shade = 0.62 + 0.3 * (1 - t);
        // Oberseite und Unterseite (umgekehrte Reihenfolge)
        const tri = sg > 0 ? [rib[k], rib[k + 1], tip] : [rib[k], tip, rib[k + 1]];
        for (const v of tri) push(v, shade);
        for (const v of [tri[0], tri[2], tri[1]]) push(v, shade * 0.8);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    b.add(g, { v: (x, y) => grey(0.62 + 0.3 * Math.min(1, Math.max(0, (y - 4.2) / 1.6))) });
  }
  for (let i = 0; i < 4; i++) { const a = i * 1.6; b.sphere(0.24, 0x6a4024, { p: [top.x + Math.cos(a) * 0.32, top.y - 0.4, top.z + Math.sin(a) * 0.32] }, 8, 6); }
  return b.geometry();
}

/** Wolkenbausch: weich verformte Kugel mit flacherer Unterseite (für Himmelswolken). */
export function cloudPuffGeo() {
  const g = blob(1, 2, 0.32, 1.6, 7.7, { flat: -0.35 });
  return g;
}

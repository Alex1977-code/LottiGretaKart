// Oberflächen-Werkstatt: erzeugt beim Laden kachelbare PBR-Texturen (ohne Bilddateien – das Spiel bleibt klein und
// offline), im stilisierten Look von Mario Kart 8: Asphalt mit Splitt und Rissen, Wiese aus Halmen, Sand mit Rippeln,
// Schnee, Fels mit Schichten und Spalten, Pflaster/Fliesen, Holzbohlen.
//
// Jede Textur packt vier Kanäle (linear, nicht sRGB):
//   R, G  Normale (x, y) aus dem Höhenrelief (z wird im Shader rekonstruiert)
//   B     Helligkeits-Detail (128 = neutral; Rillen/Spalten dunkler, Kanten heller)
//   A     Rauheit (0 … 255 → 0 … 1)
// Die Farbe selbst kommt weiter aus dem Thema der Strecke (Vertexfarben) – die Texturen geben Relief, Struktur und
// Glanz. Der Shader-Teil dazu steht in shaders.js (applySurface).

import * as THREE from 'three';

const cache = new Map();

/** Grafikstufe (main.js): 1 = keine Oberflächen-Texturen, 2 = 512er, 3 = 1024er Texturen. */
export const SURF = { quality: 2 };
export function setSurfaceQuality(q) { SURF.quality = q; }
/** Oberflächen-Optionen für addGroundDetail (oder null, wenn die Grafikstufe sie nicht vorsieht). */
export function surfOpts(o) { return SURF.quality >= 2 ? { size: SURF.quality >= 3 ? 1024 : 512, ...o } : null; }

/** Zufallszahlen (wiederholbar). */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Kachelbares Wertrauschen: Gitter mit Periode p (Zellen), N Pixel. */
function tileNoise(N, p, seed) {
  const r = rng(seed), g = new Float32Array(p * p);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(N * N), s = p / N;
  for (let y = 0; y < N; y++) {
    const fy = y * s, iy = Math.floor(fy), ty = fy - iy, uy = ty * ty * (3 - 2 * ty);
    const y0 = iy % p, y1 = (iy + 1) % p;
    for (let x = 0; x < N; x++) {
      const fx = x * s, ix = Math.floor(fx), tx = fx - ix, ux = tx * tx * (3 - 2 * tx);
      const x0 = ix % p, x1 = (ix + 1) % p;
      const a = g[y0 * p + x0], b = g[y0 * p + x1], c = g[y1 * p + x0], d = g[y1 * p + x1];
      out[y * N + x] = a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }
  }
  return out;
}
/** Mehrere Oktaven (fbm), kachelbar. */
function fbm(N, p0, oct, seed, gain = 0.5) {
  const out = new Float32Array(N * N);
  let amp = 1, p = p0, sum = 0;
  for (let o = 0; o < oct; o++) {
    const n = tileNoise(N, p, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    sum += amp; amp *= gain; p *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}
/** Zellen (Worley, kachelbar): F1 und F2-F1 je Pixel. */
function cells(N, count, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < count; i++) pts.push([r() * N, r() * N, r()]);
  const f1 = new Float32Array(N * N), edge = new Float32Array(N * N), id = new Float32Array(N * N);
  const cell = Math.ceil(N / Math.sqrt(count)) * 2;
  // grobe Beschleunigung: Punkte in Eimer
  const B = Math.max(1, Math.floor(N / cell)), buckets = Array.from({ length: B * B }, () => []);
  for (const q of pts) buckets[Math.min(B - 1, Math.floor(q[1] / N * B)) * B + Math.min(B - 1, Math.floor(q[0] / N * B))].push(q);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let d1 = 1e9, d2 = 1e9, best = 0;
    const bx = Math.floor(x / N * B), by = Math.floor(y / N * B);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const cx = (bx + ox + B) % B, cy = (by + oy + B) % B;
      for (const q of buckets[cy * B + cx]) {
        let dx = Math.abs(q[0] - x), dy = Math.abs(q[1] - y);
        if (dx > N / 2) dx = N - dx;
        if (dy > N / 2) dy = N - dy;
        const d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; best = q[2]; } else if (d < d2) d2 = d;
      }
    }
    const i = y * N + x;
    f1[i] = Math.sqrt(d1); edge[i] = Math.sqrt(d2) - Math.sqrt(d1); id[i] = best;
  }
  return { f1, edge, id };
}
/** Weicher Strich (Halm, Riss) in ein Höhenfeld stempeln, kachelbar. */
function stroke(H, N, x0, y0, ang, len, w, h, A = null, a = 0) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  for (let t = 0; t <= len; t += 0.5) {
    const k = 1 - t / len * 0.6;
    const px = x0 + dx * t, py = y0 + dy * t;
    const R = Math.ceil(w);
    for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) {
      const d = Math.hypot(ox, oy) / w;
      if (d > 1) continue;
      const ix = ((Math.round(px) + ox) % N + N) % N, iy = ((Math.round(py) + oy) % N + N) % N, i = iy * N + ix;
      const v = h * k * (1 - d * d);
      if (Math.abs(v) > Math.abs(H[i]) || Math.sign(v) !== Math.sign(H[i])) H[i] = Math.sign(h) > 0 ? Math.max(H[i], v) : Math.min(H[i], v);
      if (A) A[i] += a * (1 - d) * k;
    }
  }
}

/** Höhe → Normalen, dazu Detail und Rauheit in eine RGBA-Textur packen. */
function pack(N, H, A, Rgh, strength) {
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    const hx = H[y * N + ((x + 1) % N)] - H[y * N + ((x - 1 + N) % N)];
    const hy = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x];
    let nx = -hx * strength, ny = -hy * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l;
    data[i * 4] = Math.round((nx * 0.5 + 0.5) * 255);
    data[i * 4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
    data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(128 + A[i] * 127)));
    data[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(Rgh[i] * 255)));
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const MAKERS = {
  /** Asphalt: feiner Splitt, einzelne größere Steinchen, flache Flicken und haarfeine Risse. */
  asphalt(N) {
    const H = fbm(N, 64, 3, 11, 0.55), A = new Float32Array(N * N), R = new Float32Array(N * N);
    for (let i = 0; i < H.length; i++) { H[i] = (H[i] - 0.5) * 0.35; A[i] = (H[i]) * 0.5; R[i] = 0.82; }
    const r = rng(5);
    const stones = N * N / 60;
    for (let k = 0; k < stones; k++) {
      const x = r() * N, y = r() * N, s = 0.8 + r() * 1.8, l = r() * 0.5 + 0.2;
      stroke(H, N, x, y, r() * 6.3, 0.5, s, 0.6 + r() * 0.4, A, (r() - 0.45) * 0.5 * l);
      const i = (Math.floor(y) % N) * N + (Math.floor(x) % N); R[i] = 0.6;
    }
    // Flicken (etwas dunkler und glatter)
    const patch = fbm(N, 4, 2, 77);
    for (let i = 0; i < H.length; i++) { const p = patch[i] > 0.62 ? 1 : 0; A[i] -= p * 0.08; R[i] -= p * 0.1; }
    for (let k = 0; k < 7; k++) {
      let x = r() * N, y = r() * N, a = r() * 6.3;
      for (let s = 0; s < 30; s++) { const len = 4 + r() * 8; stroke(H, N, x, y, a, len, 0.7, -1.2, A, -0.25); x += Math.cos(a) * len; y += Math.sin(a) * len; a += (r() - 0.5) * 1.2; }
    }
    return pack(N, H, A, R, 2.2);
  },
  /** Wiese: dichte Halme in allen Richtungen, Kleeflecken, kleine Erdlücken. */
  grass(N) {
    const H = fbm(N, 16, 3, 21), A = new Float32Array(N * N), R = new Float32Array(N * N).fill(0.92);
    for (let i = 0; i < H.length; i++) { H[i] = (H[i] - 0.5) * 0.4; A[i] = (H[i]) * 0.6; }
    const r = rng(9);
    const blades = N * N / 9;
    for (let k = 0; k < blades; k++) {
      const len = 4 + r() * 9;
      stroke(H, N, r() * N, r() * N, r() * 6.3, len, 0.9 + r() * 0.5, 0.8 + r() * 0.6, A, (r() - 0.35) * 0.35);
    }
    const gaps = fbm(N, 8, 2, 33);
    for (let i = 0; i < H.length; i++) if (gaps[i] < 0.22) { A[i] -= 0.25; H[i] *= 0.3; R[i] = 0.98; }
    return pack(N, H, A, R, 2.6);
  },
  /** Erde und Kies am Fahrbahnrand: Steinchen, Reifenspuren-Rillen, kleine Risse. */
  dirt(N) {
    const H = fbm(N, 24, 4, 91), A = new Float32Array(N * N), R = new Float32Array(N * N).fill(0.93);
    for (let i = 0; i < H.length; i++) { H[i] = (H[i] - 0.5) * 0.7; A[i] = H[i] * 0.4; }
    const r = rng(93);
    for (let k = 0; k < N * N / 90; k++) stroke(H, N, r() * N, r() * N, r() * 6.3, 0.5, 0.8 + r() * 2.2, 0.7 + r() * 0.5, A, (r() - 0.4) * 0.6);
    for (let k = 0; k < 4; k++) { const y0 = r() * N; for (let x = 0; x < N; x += 1) { const y = y0 + Math.sin(x / N * Math.PI * 2 * 2 + k) * 6; stroke(H, N, x, y, 0, 1, 2.2, -0.5, A, -0.05); } }
    return pack(N, H, A, R, 2.4);
  },
  /** Sand: Windrippeln (verzerrte Wellen) und feines Korn. */
  sand(N) {
    const warp = fbm(N, 4, 2, 41), grain = fbm(N, 128, 2, 42);
    const H = new Float32Array(N * N), A = new Float32Array(N * N), R = new Float32Array(N * N).fill(0.95);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const ph = ((x + y * 0.35) / N) * Math.PI * 2 * 9 + warp[i] * 9;
      H[i] = Math.pow(Math.sin(ph) * 0.5 + 0.5, 1.6) * 0.9 + (grain[i] - 0.5) * 0.35;
      A[i] = (H[i] - 0.45) * 0.25 + (grain[i] - 0.5) * 0.25;
    }
    return pack(N, H, A, R, 1.5);
  },
  /** Schnee: weiche Wehen, Fußstapfen-artige Mulden, Glitzerkörner (glatter). */
  snow(N) {
    const H = fbm(N, 6, 4, 51, 0.55), A = new Float32Array(N * N), R = new Float32Array(N * N);
    const sp = fbm(N, 256, 1, 52);
    for (let i = 0; i < H.length; i++) { H[i] = (H[i] - 0.5) * 1.2; A[i] = (H[i]) * 0.12 + (sp[i] > 0.9 ? 0.25 : 0); R[i] = sp[i] > 0.9 ? 0.25 : 0.62; }
    return pack(N, H, A, R, 1.4);
  },
  /** Fels: Schichtbänder, Spalten (Zellkanten), raue Körnung. */
  rock(N) {
    const { f1, edge, id } = cells(N, 90, 61);
    const n = fbm(N, 16, 4, 62), H = new Float32Array(N * N), A = new Float32Array(N * N), R = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const crack = Math.min(1, edge[i] / 5);
      const band = Math.sin((y / N) * Math.PI * 2 * 7 + n[i] * 5) * 0.5 + 0.5;
      H[i] = crack * 0.9 + (n[i] - 0.5) * 0.9 + band * 0.25 + id[i] * 0.3 - f1[i] * 0.004;
      A[i] = (crack - 0.7) * 0.6 + (id[i] - 0.5) * 0.35 + (band - 0.5) * 0.18;
      R[i] = 0.88 - crack * 0.05;
    }
    return pack(N, H, A, R, 3.2);
  },
  /** Pflaster/Fliesen: gerundete Steine mit Fugen (Altstadt, Innenräume). */
  cobble(N) {
    const { edge, id } = cells(N, 64, 71);
    const n = fbm(N, 32, 3, 72), H = new Float32Array(N * N), A = new Float32Array(N * N), R = new Float32Array(N * N);
    for (let i = 0; i < H.length; i++) {
      const e = Math.min(1, edge[i] / 4);
      H[i] = Math.sqrt(e) + (n[i] - 0.5) * 0.25;
      A[i] = (e - 0.8) * 0.7 + (id[i] - 0.5) * 0.3;
      R[i] = 0.7 + (1 - e) * 0.2;
    }
    return pack(N, H, A, R, 3);
  },
  /** Holzbohlen: Bretter mit Fugen und Maserung (Stege, Brücken). */
  wood(N) {
    const g = fbm(N, 8, 3, 81), H = new Float32Array(N * N), A = new Float32Array(N * N), R = new Float32Array(N * N);
    const boards = 8;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, b = Math.floor((y / N) * boards), fy = ((y / N) * boards) % 1;
      const gap = fy < 0.06 ? 1 : 0;
      const grain = Math.sin((x / N) * Math.PI * 2 * 3 + g[i] * 14 + b * 2.1) * 0.5 + 0.5;
      H[i] = gap ? -0.8 : grain * 0.25 + (g[i] - 0.5) * 0.2;
      A[i] = gap ? -0.6 : (grain - 0.5) * 0.3 + ((b * 0.37) % 1 - 0.5) * 0.25;
      R[i] = 0.7;
    }
    return pack(N, H, A, R, 2.4);
  },
};

/** Textur einer Oberfläche (einmal je Art und Größe erzeugt, dann geteilt). */
export function surfaceTexture(kind, size = 512) {
  const key = `${kind}:${size}`;
  let t = cache.get(key);
  if (!t) { t = (MAKERS[kind] ?? MAKERS.grass)(size); cache.set(key, t); }
  return t;
}

/** Bodenart des Geländes je Thema der Strecke. */
export function groundKind(themeId) {
  if (['snow', 'frozen', 'icesheet'].includes(themeId)) return 'snow';
  if (['desert', 'dunes', 'western', 'beach', 'savanna', 'pirate', 'tenerife', 'ancient'].includes(themeId)) return 'sand';
  if (['cave', 'mine', 'volcano', 'lavafort', 'canyon', 'choco', 'clockwork', 'subway'].includes(themeId)) return 'rock';
  if (['bathroom', 'playroom', 'mall', 'pinball', 'nightcity', 'future', 'city', 'town', 'templecity', 'canal', 'harbor', 'airport', 'stadium'].includes(themeId)) return 'cobble';
  return 'grass';
}

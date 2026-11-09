// Leveldesign-Bausteine (G5) für die Strecken-Welten:
//   cliffs     Felswände als Rahmen neben der Strecke – das Gelände steigt steil an (Fels-Textur an den Hängen),
//              oben bleibt eine Kante mit Wiese. { c: [von, bis] (Kontrollpunkt-Stellen), side: −1|1|0 (0 = beide),
//              h: Höhe (m), dist: Abstand hinter der Bande (m), w: Breite der Krone (m) }
//   tunnels    Tunnel durch den Berg: Röhre mit Lampenband über der Fahrbahn, beidseits Felswände, Portale.
//              { c: [von, bis], h: lichte Höhe (m), color }
//   shortcuts  Abkürzungen und Abzweigungen: schmaler Weg durch das Gelände, Lücken in den Banden an beiden Enden.
//              { pts: [[x, z], …] (Strecken-Koordinaten, erster/letzter Punkt am Fahrbahnrand), w: halbe Breite,
//                kind: 'road' (befestigt) | 'dirt' (Schotter: bremst wie Gelände – mit Turbo lohnt es sich) }

import * as THREE from 'three';
import { addGroundDetail } from './shaders.js';
import { surfOpts } from './surfaces.js';

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const HCELL = 16;

/** Abtastpunkte einer Strecke zwischen zwei Kontrollpunkt-Stellen (über das Rundenende hinweg, wenn c0 > c1). */
export function spanIdx(tr, c0, c1) {
  const out = [];
  for (let i = 0; i < tr.N; i++) {
    const c = tr.ctrlT[i];
    if (c0 <= c1 ? c >= c0 && c <= c1 : c >= c0 || c <= c1) out.push(i);
  }
  return out;
}

/** Wertrauschen (glatt) für Felskanten. */
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return (h(ix, iz) * (1 - u) + h(ix + 1, iz) * u) * (1 - v) + (h(ix, iz + 1) * (1 - u) + h(ix + 1, iz + 1) * u) * v;
}
const rockNoise = (x, z) => vnoise(x * 0.045, z * 0.045) * 0.55 + vnoise(x * 0.13 + 7, z * 0.13) * 0.3 + vnoise(x * 0.4, z * 0.4 + 3) * 0.15;

/**
 * Vorbereitung (im World-Konstruktor, vor dem Höhenfeld): Felswand- und Tunnel-Abschnitte sammeln, Abkürzungs-
 * wege abtasten und an ihren Enden Lücken in die Banden schneiden.
 */
export function prepareLevel(world) {
  world.cliffSpans = [];
  world.tunnelSpans = [];
  world.paths = [];
  for (const c of world.courses) {
    const tr = c.track, def = c.def;
    for (const cl of def.cliffs ?? []) {
      const idx = spanIdx(tr, cl.c[0], cl.c[1]);
      for (const side of cl.side ? [cl.side] : [-1, 1]) world.cliffSpans.push({ tr, idx, side, h: cl.h ?? 18, dist: cl.dist ?? 3, w: cl.w ?? 22, ramp: cl.ramp ?? Math.max(4, (cl.h ?? 18) * 0.35) });
    }
    for (const tu of def.tunnels ?? []) {
      const idx = spanIdx(tr, tu.c[0], tu.c[1]);
      const H = tu.h ?? 8.5;
      world.tunnelSpans.push({ tr, idx, h: H, color: tu.color, lamp: tu.lamp });
      // der Berg darüber: beidseits hohe Felsen, an den Portalen etwas länger
      const ext = spanIdx(tr, tu.c[0] - 0.25, tu.c[1] + 0.25);
      for (const side of [-1, 1]) world.cliffSpans.push({ tr, idx: ext, side, h: H + 9, dist: 1.2, w: 30, ramp: 5, tunnel: true });
    }
    for (const sc of def.shortcuts ?? []) world.paths.push(makePath(world, c, sc));
  }
  // Suchtabelle der Wege (für Oberfläche und freie Plätze)
  world.pathIndex = new Map();
  world.paths.forEach((p, pi) => {
    for (let k = 0; k < p.n; k++) {
      const key = `${Math.floor(p.px[k] / HCELL)},${Math.floor(p.pz[k] / HCELL)}`;
      let l = world.pathIndex.get(key);
      if (!l) world.pathIndex.set(key, (l = []));
      l.push(pi, k);
    }
  });
}

function makePath(world, c, sc) {
  const tr = c.track;
  const pts = sc.pts.map(([x, z]) => new THREE.Vector3(x + c.ox, 0, z + c.oz));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const L = curve.getLength(), n = Math.max(8, Math.round(L / 1.5));
  const px = new Float32Array(n + 1), pz = new Float32Array(n + 1), tx = new Float32Array(n + 1), tz = new Float32Array(n + 1);
  for (let k = 0; k <= n; k++) {
    const p = curve.getPointAt(k / n), t = curve.getTangentAt(k / n);
    px[k] = p.x; pz[k] = p.z;
    const l = Math.hypot(t.x, t.z) || 1; tx[k] = t.x / l; tz[k] = t.z / l;
  }
  const near = (x, z) => { let b = 0, bd = Infinity; for (let i = 0; i < tr.N; i++) { const d = (tr.px[i] - x) ** 2 + (tr.pz[i] - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  const i0 = near(px[0], pz[0]), i1 = near(px[n], pz[n]);
  const w = sc.w ?? 4;
  // Seite der Abzweigung: wohin der Weg (ein Stück weiter) von der Strecke weg führt
  const sideAt = (i, k) => Math.sign((px[k] - tr.px[i]) * -tr.tz[i] + (pz[k] - tr.pz[i]) * tr.tx[i]) || 1;
  const k0 = Math.min(n, 6), k1 = Math.max(0, n - 6);
  tr.gaps.push({ side: sideAt(i0, k0), s: i0 * tr.ds + w * 0.6, half: w + 2.5 });
  tr.gaps.push({ side: sideAt(i1, k1), s: i1 * tr.ds - w * 0.6, half: w + 2.5 });
  return { tr, n: n + 1, px, pz, tx, tz, py: new Float32Array(n + 1), w, kind: sc.kind ?? 'road', i0, i1 };
}

/** Liegt (x, z) auf einem Abkürzungsweg? Liefert den Weg oder null. */
export function pathAt(world, x, z) {
  if (!world.paths?.length) return null;
  const l = world.pathIndex.get(`${Math.floor(x / HCELL)},${Math.floor(z / HCELL)}`);
  if (!l) {
    // (Rand einer Zelle: Nachbarzellen)
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const m = world.pathIndex.get(`${Math.floor(x / HCELL) + a},${Math.floor(z / HCELL) + b}`);
      if (m) for (let q = 0; q < m.length; q += 2) { const p = world.paths[m[q]], k = m[q + 1]; if ((x - p.px[k]) ** 2 + (z - p.pz[k]) ** 2 < (p.w + 0.6) ** 2) return p; }
    }
    return null;
  }
  for (let q = 0; q < l.length; q += 2) { const p = world.paths[l[q]], k = l[q + 1]; if ((x - p.px[k]) ** 2 + (z - p.pz[k]) ** 2 < (p.w + 0.6) ** 2) return p; }
  return null;
}

/** Abstand zum nächsten Weg (für freie Plätze der Kulisse); Infinity ohne Weg in der Nähe. */
export function pathDist(world, x, z) {
  if (!world.paths?.length) return Infinity;
  let bd = Infinity;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const l = world.pathIndex.get(`${Math.floor(x / HCELL) + a},${Math.floor(z / HCELL) + b}`);
    if (!l) continue;
    for (let q = 0; q < l.length; q += 2) { const p = world.paths[l[q]], k = l[q + 1]; bd = Math.min(bd, Math.hypot(x - p.px[k], z - p.pz[k]) - p.w); }
  }
  return bd;
}

/**
 * Höhenfeld anpassen (nach dem Einebnen der Straßen): Wege an das Gelände legen (Höhe von Abzweig zu Einmündung),
 * Felswände hochziehen. Unter Straßen (Gewicht rw) bleibt alles, wie es ist. Liefert die Felsmaske (0 … 1).
 */
export function applyLevelHeights(world, hf) {
  const { x0, z0, nx, nz, h, rw, cell: C } = hf;
  const cl = new Float32Array(nx * nz);
  // Wege: Damm/Einschnitt zwischen den Straßenhöhen an beiden Enden
  for (const p of world.paths) {
    const tr = p.tr, ya = tr.profile?.[p.i0] ?? h[0], yb = tr.profile?.[p.i1] ?? ya;
    const w = new Float32Array(nx * nz), t = new Float32Array(nx * nz);
    for (let k = 0; k < p.n; k++) {
      const f = k / (p.n - 1), y = ya + (yb - ya) * (f * f * (3 - 2 * f));
      p.py[k] = y;
      const inner = p.w + 1.5, R = inner + 9, cx = (p.px[k] - x0) / C, cz = (p.pz[k] - z0) / C, rr = Math.ceil(R / C);
      for (let jz = Math.max(0, Math.floor(cz - rr)); jz <= Math.min(nz - 1, Math.ceil(cz + rr)); jz++) {
        for (let jx = Math.max(0, Math.floor(cx - rr)); jx <= Math.min(nx - 1, Math.ceil(cx + rr)); jx++) {
          const d = Math.hypot(jx - cx, jz - cz) * C;
          if (d > R) continue;
          const kk = jz * nx + jx, ww = d <= inner ? 1 : smooth(R, inner, d);
          if (ww > w[kk]) { w[kk] = ww; t[kk] = y; }
        }
      }
    }
    for (let k = 0; k < h.length; k++) if (w[k] > 0) {
      const ww = w[k] * (1 - rw[k]);   // die Strecke selbst behält ihre Höhe
      h[k] += (t[k] - h[k]) * ww;
      rw[k] = Math.max(rw[k], w[k] * 0.8);   // (Randstreifen-Färbung und keine Felsen auf dem Weg)
    }
  }
  // Felswände
  for (const sp of world.cliffSpans) {
    const tr = sp.tr, step = 2;
    const reach = sp.dist + sp.ramp + sp.w + 18;
    for (let n = 0; n < sp.idx.length; n += step) {
      const i = sp.idx[n], prof = tr.profile?.[i] ?? tr.py[i];
      const wall = tr.wallAt(i), rx = -tr.tz[i] * sp.side, rz = tr.tx[i] * sp.side;
      // Ein- und Auslauf am Anfang und Ende des Abschnitts (keine senkrechte Stirnseite)
      const along = Math.min(n, sp.idx.length - 1 - n) * tr.ds;
      const endK = sp.tunnel ? 1 : smooth(0, 24, along);
      const cxm = tr.px[i] + rx * (wall + reach / 2), czm = tr.pz[i] + rz * (wall + reach / 2);
      const cx = (cxm - x0) / C, cz = (czm - z0) / C, rr = Math.ceil((reach / 2 + 4) / C);
      for (let jz = Math.max(0, Math.floor(cz - rr)); jz <= Math.min(nz - 1, Math.ceil(cz + rr)); jz++) {
        for (let jx = Math.max(0, Math.floor(cx - rr)); jx <= Math.min(nx - 1, Math.ceil(cx + rr)); jx++) {
          const X = x0 + jx * C, Z = z0 + jz * C, dx = X - tr.px[i], dz = Z - tr.pz[i];
          const lat = dx * rx + dz * rz - wall, al = dx * tr.tx[i] + dz * tr.tz[i];
          if (lat < sp.dist - 2 || lat > reach || Math.abs(al) > Math.max(tr.ds * step, C) * 1.6) continue;
          const k = jz * nx + jx;
          if (rw[k] > 0.85) continue;
          // nie neben einem anderen Teil der Strecke (Haarnadel, Gegengerade) – nur am eigenen Abschnitt
          const nr = tr.nearestIndex(X, Z, 3, false), di = Math.abs(nr.i - i), cyc = Math.min(di, tr.N - di);
          if (cyc > 60 && nr.d < tr.wallAt(nr.i) + 10) continue;
          const n0 = rockNoise(X, Z);
          // Fuß (steil, mit zerklüfteter Kante), Krone, sanfter Abfall nach hinten
          const foot = sp.dist + (n0 - 0.5) * 3;
          const rise = smooth(foot, foot + sp.ramp, lat), fall = smooth(reach, reach - 16, lat);
          const H = sp.h * endK * rise * fall * (0.78 + 0.32 * n0) + (rise > 0.9 ? (vnoise(X * 0.25, Z * 0.25) - 0.5) * 2.4 : 0);
          if (H < 0.3) continue;
          const y = prof + H;
          if (y > h[k]) h[k] = y;
          // Felsmaske: steile Wand 1, Krone 0.2 (dort Wiese/Moos)
          cl[k] = Math.max(cl[k], rise > 0.015 && rise < 0.985 ? 1 : 0.2);
        }
      }
    }
  }
  // die Wand selbst: Zellen an einem großen Höhensprung neben Felsen gehören zur Felswand (auch die untere Kante)
  const face = new Uint8Array(nx * nz);
  for (let jz = 1; jz < nz - 1; jz++) for (let jx = 1; jx < nx - 1; jx++) {
    const k = jz * nx + jx;
    for (const n of [k + 1, k - 1, k + nx, k - nx]) if ((cl[k] > 0 || cl[n] > 0) && Math.abs(h[k] - h[n]) > 2.5) { face[k] = 1; break; }
  }
  for (let k = 0; k < cl.length; k++) if (face[k]) cl[k] = 1;
  return cl;
}

// ------------------------------------------------------------------ Darstellung
/** Meshes: Abkürzungswege und Tunnelröhren mit Portalen und Lampen. */
export function buildLevelMeshes(view) {
  const w = view.world, group = new THREE.Group();
  group.name = 'leveldesign';
  for (const p of w.paths) group.add(pathMesh(w, p));
  for (const t of w.tunnelSpans) group.add(tunnelMesh(w, t, view.quality));
  return group;
}

function pathMesh(world, p) {
  const th = p.tr.theme, dirt = p.kind === 'dirt';
  const cA = lin(dirt ? th.offroad ?? 0x9a7a52 : th.road), cB = lin(dirt ? th.offroad2 ?? 0x8a6a46 : th.road2 ?? th.road);
  const cE = lin(dirt ? 0x7a5a3a : th.curbA ?? 0xffffff), cE2 = lin(dirt ? 0x6a4a2e : th.curbB ?? 0xe8392d);
  const pos = [], col = [];
  const P = (k, lat, yo) => { const x = p.px[k] - p.tz[k] * lat, z = p.pz[k] + p.tx[k] * lat; return [x, world.heightAt(x, z) + yo, z]; };
  const quad = (k, a, b, ya, yb, c) => {
    const a0 = P(k, a, ya), b0 = P(k, b, yb), a1 = P(k + 1, a, ya), b1 = P(k + 1, b, yb);
    pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
    for (let q = 0; q < 6; q++) col.push(...c);
  };
  for (let k = 0; k < p.n - 1; k++) {
    // an den Enden flach auslaufen (die Strecke liegt darüber)
    quad(k, -p.w, p.w, 0.07, 0.07, Math.floor(k / 3) % 2 ? cA : cB);
    quad(k, -p.w - 0.7, -p.w, 0.05, 0.08, k % 2 ? cE : cE2);
    quad(k, p.w, p.w + 0.7, 0.08, 0.05, k % 2 ? cE : cE2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mat = addGroundDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: dirt ? 0.95 : 0.8, polygonOffset: true, polygonOffsetFactor: -1, side: THREE.DoubleSide }),
    { grain: 0.1, scale: 1.6, key: dirt ? 'pathdirt' : 'pathroad', rain: 1, surf: surfOpts({ top: dirt ? 'dirt' : 'asphalt', slope: false, topScale: 1 / 3, strength: 1.3, detail: 0.4 }) });
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true; m.name = 'abkuerzung';
  return m;
}

/** Tunnelröhre: Gewölbe innen (Fliesen/Beton, Lampenband), außen Fels; Portale als Felsrahmen. */
function tunnelMesh(world, t, quality) {
  const tr = t.tr, H = t.h, idx = t.idx, SEG = 14, T = 2.2;
  const pos = [], col = [], lampPos = [];
  const cIn = lin(t.color ?? 0xb4ac9c), cIn2 = lin(0x9c9486), cBand = lin(0x3a3a44), cRock = lin(0x8a8090), cRock2 = lin(0x6e6678);
  // Profil: Korbbogen von links (Wand) über die Decke nach rechts; a = 0 … 1
  const prof = (i, a, out) => {
    const W = tr.wallAt(i) + 0.6, th = Math.PI * a;
    return out.set(-Math.cos(th) * W, Math.sin(th) * H);
  };
  const v2 = new THREE.Vector2();
  const P = (i, lat, up) => { const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat; return [x, tr.py[i] + up, z]; };
  const strip = (inner) => {
    for (let n = 0; n < idx.length - 1; n++) {
      const i = idx[n], j = idx[n + 1];
      if (Math.abs(j - i) > 2) continue;   // (über das Rundenende)
      for (let s = 0; s < SEG; s++) {
        const a0 = s / SEG, a1 = (s + 1) / SEG;
        const off = inner ? 0 : T;
        const q = (ii, a) => { prof(ii, a, v2); const th = Math.PI * a; return P(ii, v2.x - Math.cos(th) * off, v2.y + Math.sin(th) * off); };
        const A = q(i, a0), B = q(i, a1), Cc = q(j, a0), D = q(j, a1);
        if (inner) pos.push(...A, ...Cc, ...B, ...B, ...Cc, ...D); else pos.push(...A, ...B, ...Cc, ...Cc, ...B, ...D);
        const c = inner ? (s === Math.floor(SEG / 2) || s === Math.floor(SEG / 2) - 1 ? cBand : s < 2 || s >= SEG - 2 ? cIn2 : (Math.floor(n / 5) % 2 ? cIn : cIn2))
          : (Math.sin(n * 0.7 + s * 1.3) > 0 ? cRock : cRock2);
        for (let k = 0; k < 6; k++) col.push(...c);
      }
      if (inner && n % 10 === 0) { const m = P(i, 0, H - 0.25); lampPos.push(m); }
    }
  };
  strip(true);
  const nInner = pos.length / 3;
  strip(false);
  // Portale: Felsrahmen an beiden Enden (Ring zwischen Gewölbe und einer breiteren, unregelmäßigen Kante)
  for (const end of [idx[0], idx[idx.length - 1]]) {
    for (let s = 0; s < SEG; s++) {
      const a0 = s / SEG, a1 = (s + 1) / SEG;
      const ring = (a, k) => { prof(end, a, v2); const th = Math.PI * a, g = k * (3.5 + 1.5 * Math.sin(a * 9 + end)); return P(end, v2.x - Math.cos(th) * g, v2.y + Math.sin(th) * g); };
      const A = ring(a0, 0), B = ring(a1, 0), Cc = ring(a0, 1), D = ring(a1, 1);
      pos.push(...A, ...B, ...Cc, ...Cc, ...B, ...D);
      for (let k = 0; k < 6; k++) col.push(...(s % 2 ? cRock : cRock2));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // Innenschale: Normalen nach oben kippen – sonst bekommt die Decke das (grüne) Bodenlicht der Wiese draußen
  {
    const Nn = g.attributes.normal, v = new THREE.Vector3();
    for (let i = 0; i < nInner; i++) { v.fromBufferAttribute(Nn, i).multiplyScalar(0.25); v.y += 1; v.normalize(); Nn.setXYZ(i, v.x, v.y, v.z); }
  }
  g.addGroup(0, nInner, 0);
  g.addGroup(nInner, pos.length / 3 - nInner, 1);
  const rockMat = addGroundDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), { grain: 0.1, key: 'tunnel', surf: surfOpts({ top: 'rock', side: 'rock', topScale: 1 / 4, sideScale: 1 / 6, strength: 1.2, detail: 0.45 }) });
  // innen: kaum Himmels-/Bodenlicht (sonst färbt die Wiese draußen die Decke grün), dafür warmer Lampenschein
  const innerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, envMapIntensity: 0.15, emissive: 0x3a2e1c, emissiveIntensity: 1 });
  const m = new THREE.Mesh(g, [innerMat, rockMat]);
  m.castShadow = true; m.receiveShadow = true; m.name = 'tunnel';
  const grp = new THREE.Group();
  grp.add(m);
  // Lampen: helle Leuchtfelder an der Decke (leuchten im Bloom), dazu ein paar echte Lichter ab Stufe 2
  if (lampPos.length) {
    const lg = new THREE.BoxGeometry(2.4, 0.12, 0.6);
    const lm = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(2.2) }), lampPos.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
    lampPos.forEach((p, k) => {
      const i = idx[Math.min(idx.length - 1, k * 10)], yaw = Math.atan2(-tr.tz[i], tr.tx[i]);
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      M.compose(V.set(p[0], p[1], p[2]), Q, S);
      lm.setMatrixAt(k, M);
    });
    lm.name = 'tunnel-lampen';
    grp.add(lm);
  }
  grp.userData.tunnel = t;
  return grp;
}

/** Ist der Abtastpunkt i der Strecke tr in einem Tunnel? (für Licht und Kamera) */
export function tunnelMask(world, tr) {
  const m = new Uint8Array(tr.N);
  for (const t of world.tunnelSpans ?? []) if (t.tr === tr) for (const i of t.idx) m[i] = 1;
  return m;
}

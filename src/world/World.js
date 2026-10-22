// Die Insel-Welt (Logik): Strecken an ihren Weltplätzen, Verbindungsstraßen, Höhenfeld (3-m-Raster, Straßen
// eingeebnet, See und Küste), Oberflächen (Straße / Gelände / Wasser / offenes Meer), Kollisionen (Banden mit
// Toren, Höhlenberg- und Zeltwand mit Eingängen, Häuser, Bäume) und die Stimmung je Region.
// Die Darstellung baut WorldView.js; hier entsteht nichts Sichtbares.

import { Track } from './Track.js';
import { getTheme } from './themes.js';
import { WORLD } from './worldDef.js';

const CELL = 3;            // Höhenfeld-Raster (m)
const HCELL = 16;          // Suchtabelle für Straßen und Kollisionen (m)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class World {
  constructor(def = WORLD) {
    this.def = def;
    this.base = (x, z) => this.baseHeight(x, z);
    this.heightAt = this.heightAt.bind(this);
    // 1. Strecken und Verbindungsstraßen abtasten (noch auf dem Grundgelände)
    this.courses = def.courses.map((c) => {
      const theme = getTheme(c.def.theme);
      const track = new Track(c.def, theme, { ox: c.ox, oz: c.oz, heightFn: this.base });
      return { id: c.def.id, def: c.def, theme, track, ox: c.ox, oz: c.oz };
    });
    this.courseById = Object.fromEntries(this.courses.map((c) => [c.id, c]));
    this.connectors = def.connectors.map((c) => this.makeConnector(c));
    // 2. Höhenfeld mit eingeebneten Straßen
    this.buildHeightfield();
    for (const c of this.courses) c.track.heightFn = this.heightAt;
    for (const c of this.connectors) c.track.heightFn = this.heightAt;
    for (const c of this.courses) for (let i = 0; i < c.track.N; i++) c.track.py[i] = this.heightAt(c.track.px[i], c.track.pz[i]);
    // 3. Suchtabellen: Straßen-Abtastpunkte und Kollisionen
    this.buildRoadIndex();
    this.segs = []; this.circles = []; this.colIndex = new Map();
    this.buildColliders();
  }

  // ------------------------------------------------------------------ Gelände
  /** Grundgelände ohne Straßen: Insel mit welliger Küste, sanfte Wellen, Hügel/Berge, ebene Flächen, Seen. */
  baseHeight(x, z) {
    const d = this.def, is = d.island;
    const ex = (x - is.cx) / is.rx, ez = (z - is.cz) / is.rz;
    const th = Math.atan2(ez, ex);
    const rEff = 1 + 0.05 * Math.sin(3 * th + 0.4) + 0.035 * Math.sin(7 * th + 1.3) + 0.02 * Math.sin(13 * th);
    const dd = Math.sqrt(ex * ex + ez * ez) / rEff;
    let land = 3 + 2.2 * Math.sin(x * 0.013) * Math.cos(z * 0.011) + 1.2 * Math.sin(x * 0.031 + z * 0.017);
    for (const [hx, hz, r, hh] of d.hills) {
      const dx = x - hx, dz = z - hz;
      land += hh * Math.exp(-(dx * dx + dz * dz) / (r * r));
    }
    for (const f of d.flats) {
      const w = smooth(f.r + 60, f.r, Math.hypot(x - f.x, z - f.z));
      land += (f.h - land) * w;
    }
    for (const l of d.lakes) {
      const w = smooth(l.r + 30, l.r - 15, Math.hypot(x - l.x, z - l.z));
      land += (-l.depth - land) * w;
    }
    const L = smooth(1.07, 0.95, dd);
    return -9 + (land + 9) * L;
  }

  /** Höhe an (x, z) aus dem Höhenfeld (bilinear). */
  heightAt(x, z) {
    const g = this.hf;
    if (!g) return this.baseHeight(x, z);
    const fx = (x - g.x0) / CELL, fz = (z - g.z0) / CELL;
    if (fx < 0 || fz < 0 || fx >= g.nx - 1 || fz >= g.nz - 1) return -9;
    const ix = fx | 0, iz = fz | 0, ax = fx - ix, az = fz - iz;
    const k = iz * g.nx + ix, H = g.h;
    const a = H[k] + (H[k + 1] - H[k]) * ax, b = H[k + g.nx] + (H[k + g.nx + 1] - H[k + g.nx]) * ax;
    return a + (b - a) * az;
  }

  buildHeightfield() {
    const b = this.def.bounds;
    const nx = Math.ceil((b.maxX - b.minX) / CELL) + 1, nz = Math.ceil((b.maxZ - b.minZ) / CELL) + 1;
    const h = new Float32Array(nx * nz), w = new Float32Array(nx * nz), t = new Float32Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) h[iz * nx + ix] = this.baseHeight(b.minX + ix * CELL, b.minZ + iz * CELL);
    // Straßen: Höhenverlauf entlang der Straße glätten, dann das Gelände ringsum angleichen
    const roads = [...this.courses.map((c) => ({ tr: c.track, pad: c.track.margin + 2 })), ...this.connectors.map((c) => ({ tr: c.track, pad: 7, conn: c }))];
    for (const { tr, pad, conn } of roads) {
      const N = tr.N, raw = new Float32Array(N), prof = new Float32Array(N);
      for (let i = 0; i < N; i++) raw[i] = this.baseHeight(tr.px[i], tr.pz[i]);
      const win = 28;
      for (let i = 0; i < N; i++) {
        let sum = 0, n = 0;
        for (let k = -win; k <= win; k++) { const j = tr.wrap(i + k); sum += raw[j]; n++; }
        prof[i] = sum / n;
      }
      tr.water = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        // Verbindungsstraßen über den See: dort bleibt Wasser (man fährt auf dem See)
        if (conn && raw[i] < 0.4) { tr.water[i] = 1; continue; }
        prof[i] = Math.max(prof[i], 0.8);
      }
      tr.profile = prof;
      for (let i = 0; i < N; i++) {
        if (tr.water[i]) continue;
        const inner = tr.hw[i] + pad, R = inner + 14;
        const cx = (tr.px[i] - b.minX) / CELL, cz = (tr.pz[i] - b.minZ) / CELL, rr = Math.ceil(R / CELL);
        for (let jz = Math.max(0, Math.floor(cz - rr)); jz <= Math.min(nz - 1, Math.ceil(cz + rr)); jz++) {
          for (let jx = Math.max(0, Math.floor(cx - rr)); jx <= Math.min(nx - 1, Math.ceil(cx + rr)); jx++) {
            const d = Math.hypot(jx - cx, jz - cz) * CELL;
            if (d > R) continue;
            const ww = d <= inner ? 1 : smooth(R, inner, d);
            const k = jz * nx + jx;
            if (ww > w[k]) { w[k] = ww; t[k] = prof[i]; }
          }
        }
      }
    }
    for (let k = 0; k < h.length; k++) if (w[k] > 0) h[k] += (t[k] - h[k]) * w[k];
    this.hf = { x0: b.minX, z0: b.minZ, nx, nz, h, rw: w, cell: CELL };
  }

  // ------------------------------------------------------------------ Verbindungsstraßen
  makeConnector(c) {
    const A = this.courseById[c.a[0]], B = this.courseById[c.b[0]];
    const gate = (course, u, side) => {
      const tr = course.track, p = tr.pointAt(u, 0);
      const rx = -p.tz, rz = p.tx;
      const out = tr.wallAt(p.i) + 10;
      return { course, u, side, i: p.i, s: p.i * tr.ds, center: [p.x, p.z], outer: [p.x + rx * side * out, p.z + rz * side * out], mid: [p.x + rx * side * (tr.hw[p.i] + 3), p.z + rz * side * (tr.hw[p.i] + 3)] };
    };
    const ga = gate(A, c.a[1], c.a[2]), gb = gate(B, c.b[1], c.b[2]);
    const hw = c.hw ?? 6.5;
    const ctrl = [[...ga.center, hw], [...ga.mid, hw], [...ga.outer, hw], ...c.via.map(([x, z]) => [x, z, hw]), [...gb.outer, hw], [...gb.mid, hw], [...gb.center, hw]];
    const theme = getTheme('grass');
    const track = new Track({ id: c.id, ctrl, hw, margin: 3 }, { ...theme, road: 0x9a96a8, road2: 0x948fa3 }, { closed: false, heightFn: this.base });
    // Banden-Lücken an beiden Toren
    for (const g of [ga, gb]) g.course.track.gaps.push({ side: g.side, s: g.s, half: hw + 5 });
    return { id: c.id, def: c, a: ga, b: gb, hw, track };
  }

  /** Verbindungsstraße zwischen zwei Strecken (in beliebiger Richtung) oder null. */
  connectorBetween(a, b) {
    for (const c of this.connectors) {
      if (c.a.course.id === a && c.b.course.id === b) return { conn: c, reverse: false };
      if (c.a.course.id === b && c.b.course.id === a) return { conn: c, reverse: true };
    }
    return null;
  }

  // ------------------------------------------------------------------ Straßen-Suchtabelle und Oberflächen
  buildRoadIndex() {
    this.roads = [...this.courses.map((c) => c.track), ...this.connectors.map((c) => c.track)];
    const map = new Map();
    this.roads.forEach((tr, ri) => {
      for (let i = 0; i < tr.N; i++) {
        const k = `${Math.floor(tr.px[i] / HCELL)},${Math.floor(tr.pz[i] / HCELL)}`;
        let l = map.get(k);
        if (!l) { l = []; map.set(k, l); }
        l.push(ri, i);
      }
    });
    this.roadIndex = map;
  }

  /** Nächster Straßenpunkt (beliebige Straße) im Umkreis von maxCells Rasterzellen. */
  nearestRoad(x, z, maxCells = 2, out = {}) {
    const cx = Math.floor(x / HCELL), cz = Math.floor(z / HCELL);
    let bd = Infinity, br = -1, bi = -1;
    for (let a = -maxCells; a <= maxCells; a++) for (let b = -maxCells; b <= maxCells; b++) {
      const l = this.roadIndex.get(`${cx + a},${cz + b}`);
      if (!l) continue;
      for (let k = 0; k < l.length; k += 2) {
        const tr = this.roads[l[k]], i = l[k + 1];
        const dx = x - tr.px[i], dz = z - tr.pz[i], d = dx * dx + dz * dz;
        if (d < bd) { bd = d; br = l[k]; bi = i; }
      }
    }
    out.d = Math.sqrt(bd); out.road = br >= 0 ? this.roads[br] : null; out.i = bi;
    out.hw = br >= 0 ? this.roads[br].hw[bi] : 0;
    out.water = br >= 0 && this.roads[br].water ? !!this.roads[br].water[bi] : false;
    return out;
  }

  /** Oberfläche: 'road' | 'off' (Wiese, Sand …) | 'water' (befahrbar, schwimmt) | 'sea' (offenes Meer, außerhalb). */
  surfaceAt(x, z) {
    const is = this.def.island;
    const ex = (x - is.cx) / is.rx, ez = (z - is.cz) / is.rz;
    if (ex * ex + ez * ez > 1.3 * 1.3) return 'sea';
    const h = this.heightAt(x, z);
    if (h < -0.05) return 'water';
    const r = this.nearestRoad(x, z, 1, this._nr ?? (this._nr = {}));
    if (r.road && !r.water && r.d <= r.hw + 1.0) return 'road';
    return 'off';
  }

  /** Freier Platz für Kulisse: weit genug von allen Straßen und nicht im Wasser. */
  isFree(x, z, clearance = 4) {
    if (this.heightAt(x, z) < 0.3) return false;
    const r = this.nearestRoad(x, z, 2, this._nr2 ?? (this._nr2 = {}));
    if (!r.road) return true;
    const wall = r.road.closed ? r.road.wallAt(r.i) : r.hw + 1;
    return r.d > wall + clearance;
  }

  // ------------------------------------------------------------------ Kollisionen
  addSeg(x1, z1, x2, z2) {
    const id = this.segs.length;
    this.segs.push([x1, z1, x2, z2]);
    const minX = Math.floor(Math.min(x1, x2) / HCELL), maxX = Math.floor(Math.max(x1, x2) / HCELL);
    const minZ = Math.floor(Math.min(z1, z2) / HCELL), maxZ = Math.floor(Math.max(z1, z2) / HCELL);
    for (let a = minX; a <= maxX; a++) for (let b = minZ; b <= maxZ; b++) this.indexAdd(a, b, id);
  }

  addCircle(x, z, r) {
    const id = -1 - this.circles.length;
    this.circles.push([x, z, r]);
    for (let a = Math.floor((x - r) / HCELL); a <= Math.floor((x + r) / HCELL); a++) for (let b = Math.floor((z - r) / HCELL); b <= Math.floor((z + r) / HCELL); b++) this.indexAdd(a, b, id);
  }

  indexAdd(a, b, id) {
    const k = `${a},${b}`;
    let l = this.colIndex.get(k);
    if (!l) { l = []; this.colIndex.set(k, l); }
    l.push(id);
  }

  buildColliders() {
    // Banden der Strecken (ohne Tor-Lücken)
    for (const c of this.courses) {
      const tr = c.track;
      for (const side of [-1, 1]) {
        for (let i = 0; i < tr.N; i += 2) {
          const j = tr.wrap(i + 2);
          if (tr.inGap(side, i) || tr.inGap(side, j)) continue;
          const la = side * tr.wallAt(i), lb = side * tr.wallAt(j);
          this.addSeg(tr.px[i] - tr.tz[i] * la, tr.pz[i] + tr.tx[i] * la, tr.px[j] - tr.tz[j] * lb, tr.pz[j] + tr.tx[j] * lb);
        }
      }
    }
    // Höhlenberg und Zeltwand: Ring mit Eingängen dort, wo Verbindungsstraßen hindurchführen
    for (const st of this.def.structures) {
      st.doors = this.doorsOf(st);
      const n = 96;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
        if (st.doors.some((d) => angDist(a0, d.a) < d.half || angDist(a1, d.a) < d.half)) continue;
        this.addSeg(st.x + Math.cos(a0) * st.r, st.z + Math.sin(a0) * st.r, st.x + Math.cos(a1) * st.r, st.z + Math.sin(a1) * st.r);
      }
    }
  }

  /** Eingänge eines Rundbaus: Winkel, an denen eine Verbindungsstraße den Ring kreuzt. */
  doorsOf(st) {
    const doors = [];
    for (const c of this.connectors) {
      const tr = c.track;
      for (let i = 1; i < tr.N; i++) {
        const d0 = Math.hypot(tr.px[i - 1] - st.x, tr.pz[i - 1] - st.z), d1 = Math.hypot(tr.px[i] - st.x, tr.pz[i] - st.z);
        if ((d0 - st.r) * (d1 - st.r) <= 0) {
          doors.push({ a: Math.atan2(tr.pz[i] - st.z, tr.px[i] - st.x), half: (c.hw + 3.5) / st.r, x: tr.px[i], z: tr.pz[i], conn: c.id });
        }
      }
    }
    return doors;
  }

  /**
   * Kreis (x, z, r) gegen Banden, Wände und Hindernisse. Liefert die summierte Hinausschiebung
   * { px, pz } und die gemittelte Normale { nx, nz } oder null, wenn nichts berührt wird.
   */
  collide(x, z, r, out = {}) {
    const cx = Math.floor(x / HCELL), cz = Math.floor(z / HCELL);
    let px = 0, pz = 0, hit = false;
    const seen = this._seen ?? (this._seen = new Set());
    seen.clear();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const l = this.colIndex.get(`${cx + a},${cz + b}`);
      if (!l) continue;
      for (const id of l) {
        if (seen.has(id)) continue;
        seen.add(id);
        let qx, qz;
        if (id >= 0) {
          const [x1, z1, x2, z2] = this.segs[id];
          const dx = x2 - x1, dz = z2 - z1, L2 = dx * dx + dz * dz || 1;
          const t = clamp(((x + px - x1) * dx + (z + pz - z1) * dz) / L2, 0, 1);
          qx = x1 + dx * t; qz = z1 + dz * t;
          const ex = x + px - qx, ez = z + pz - qz, d = Math.hypot(ex, ez);
          if (d < r && d > 1e-6) { px += (ex / d) * (r - d); pz += (ez / d) * (r - d); hit = true; }
        } else {
          const [ox, oz, orr] = this.circles[-1 - id];
          const ex = x + px - ox, ez = z + pz - oz, d = Math.hypot(ex, ez), R = r + orr;
          if (d < R && d > 1e-6) { px += (ex / d) * (R - d); pz += (ez / d) * (R - d); hit = true; }
        }
      }
    }
    if (!hit) return null;
    const l = Math.hypot(px, pz) || 1;
    out.px = px; out.pz = pz; out.nx = px / l; out.nz = pz / l; out.pen = l;
    return out;
  }

  // ------------------------------------------------------------------ Stimmung
  /** Gewichte der Regionen an (x, z) – für Himmel, Licht und Nebel. */
  ambienceAt(x, z) {
    const ws = [];
    let sum = 0;
    for (const r of this.def.regions) {
      const d = Math.hypot(x - r.x, z - r.z);
      let w = 1 - smooth(r.r, r.r + (r.fade ?? 160), d);
      if (r.base) w = Math.max(w, 0.15);
      ws.push(w); sum += w;
    }
    return this.def.regions.map((r, k) => ({ theme: r.theme, w: ws[k] / (sum || 1) }));
  }
}

function angDist(a, b) {
  let d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

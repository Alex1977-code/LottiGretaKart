// Rennstrecke: geschlossene Mittellinie (Catmull-Rom durch Kontrollpunkte), in 1-m-Schritten abgetastet.
// Liefert Abfragen für Physik/KI (nächster Abtastpunkt, Seitenabstand, Streckenposition, Geländehöhe) und baut
// die sichtbare Strecke: Gelände (Raster mit Hügeln), Fahrbahn mit Rand-Curbs und Mittelstreifen, Start-Ziel-
// Schachbrett und durchgehende Banden. Alles vertexgefärbt, ein Mesh je Teil (wenige Zeichenaufrufe).
//
// Koordinaten: Meter, Y oben. Vorwärts entlang der Strecke = Index steigt. Rechts der Fahrtrichtung = (-tz, tx).
// Ein Kart mit Gier yaw blickt nach (cos yaw, 0, -sin yaw) – wie alle Modelle (Blick +X, Drehung um Y).

import * as THREE from 'three';
import { lin } from '../lgw/three/world/geometry.js';

const STEP = 1;              // Abtastabstand (m)
const CELL = 16;             // Raster der Suchtabelle (m)

export class Track {
  /**
   * @param {object} def    Streckendefinition (ctrl = [[x, z, halbe Breite?, Brückenhöhe?], …]) – mit Brückenhöhe
   *                         (m über dem Gelände) führt die Strecke über eine Brücke, z. B. über sich selbst (Acht).
   * @param {object} theme  Farben
   * @param {object} opts   { ox, oz (Verschiebung in die Welt), closed (Rundkurs, Standard true),
   *                          heightFn (x, z) → Höhe (Welt-Gelände statt eigener Hügel) }
   */
  constructor(def, theme, opts = {}) {
    this.def = def;
    this.theme = theme;
    this.closed = opts.closed ?? true;
    this.ox = opts.ox ?? 0; this.oz = opts.oz ?? 0;
    this.heightFn = opts.heightFn ?? null;
    this.hwDefault = def.hw ?? 7;
    this.margin = def.margin ?? 6;
    this.hills = def.hills ?? [];
    this.base = def.baseHeight ?? 0;
    this.gaps = [];   // Lücken in den Banden: { side (−1/+1), s0, s1 } in Metern entlang der Strecke
    this.sample();
    this.buildIndex();
    this.group = new THREE.Group();
    this.group.name = `strecke:${def.id}`;
    this.lights = [];
  }

  // ------------------------------------------------------------------ Abtastung
  sample() {
    const def = this.def;
    const pts = def.ctrl.map(([x, z]) => new THREE.Vector3(x + this.ox, 0, z + this.oz));
    const curve = new THREE.CatmullRomCurve3(pts, this.closed, 'centripetal');
    this.curve = curve;
    const L = curve.getLength();
    const N = Math.max(64, Math.round(L / STEP));
    this.N = N; this.length = L; this.ds = L / N;
    this.px = new Float32Array(N); this.pz = new Float32Array(N); this.py = new Float32Array(N);
    this.tx = new Float32Array(N); this.tz = new Float32Array(N);
    this.hw = new Float32Array(N); this.curv = new Float32Array(N);
    this.lift = new Float32Array(N);
    const nC = def.ctrl.length;
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const u = this.closed ? i / N : i / (N - 1);
      curve.getPointAt(u, p);
      curve.getTangentAt(u, t);
      this.px[i] = p.x; this.pz[i] = p.z;
      const l = Math.hypot(t.x, t.z) || 1;
      this.tx[i] = t.x / l; this.tz[i] = t.z / l;
      // Breite: zwischen den Kontrollpunkten weich übergeblendet
      const ct = curve.getUtoTmapping(u) * (this.closed ? nC : nC - 1);
      const i0 = Math.min(nC - 1, Math.floor(ct)) % nC, i1 = this.closed ? (i0 + 1) % nC : Math.min(nC - 1, i0 + 1), f = ct - Math.floor(ct);
      const w0 = def.ctrl[i0][2] ?? this.hwDefault, w1 = def.ctrl[i1][2] ?? this.hwDefault;
      const sf = f * f * (3 - 2 * f);
      this.hw[i] = w0 + (w1 - w0) * sf;
      const l0 = def.ctrl[i0][3] ?? 0, l1 = def.ctrl[i1][3] ?? 0;
      this.lift[i] = l0 + (l1 - l0) * sf;
    }
    this.hasLift = this.lift.some((v) => v > 0.05);
    for (let i = 0; i < N; i++) {
      this.py[i] = this.roadY(i, this.px[i], this.pz[i]);
      const a = this.wrap(i - 4), b = this.wrap(i + 4);
      const ang = Math.atan2(this.tx[a] * this.tz[b] - this.tz[a] * this.tx[b], this.tx[a] * this.tx[b] + this.tz[a] * this.tz[b]);
      this.curv[i] = ang / (8 * this.ds); // rad/m, + = Rechtskurve
    }
  }

  wrap(i) { const N = this.N; if (!this.closed) return i < 0 ? 0 : i >= N ? N - 1 : i; return ((i % N) + N) % N; }

  /** Geländehöhe: Welt-Gelände, sonst eigene Hügel (Gauß-Glocken). */
  heightAt(x, z) {
    if (this.heightFn) return this.heightFn(x, z);
    let h = this.base;
    for (const [hx, hz, r, hh] of this.hills) {
      const dx = x - hx, dz = z - hz;
      h += hh * Math.exp(-(dx * dx + dz * dz) / (r * r));
    }
    return h;
  }

  /**
   * Höhe der Fahrbahn an Abtastpunkt k (Querlage x, z): Gelände, auf Brücken das Deck. Das Deck liegt
   * `lift` über dem geglätteten Straßenprofil (von der Welt gesetzt) – unabhängig vom Gelände darunter
   * (Wasser, andere Straße); an den Rampen weich ins Gelände übergeblendet.
   */
  roadY(k, x, z) {
    const h = this.heightAt(x, z);
    const L = this.hasLift ? this.lift[k] : 0;
    if (!(L > 0.001)) return h;
    const base = this.profile ? this.profile[k] : h;
    const a = Math.min(1, L / 0.6), w = a * a * (3 - 2 * a);
    return h + (base + L - h) * w;
  }

  /** Nächster Brücken-Abtastpunkt (lift > 0) in der Umgebung von (x, z) oder −1. */
  nearestLifted(x, z) {
    if (!this.hasLift) return -1;
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    let best = -1, bd = Infinity;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const list = this.cells.get(`${cx + a},${cz + b}`);
      if (!list) continue;
      for (const i of list) {
        if (!(this.lift[i] > 0.05)) continue;
        const dx = x - this.px[i], dz = z - this.pz[i], d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = i; }
      }
    }
    if (best < 0 || Math.sqrt(bd) > this.wallAt(best) + 0.8) return -1;
    return best;
  }

  buildIndex() {
    const map = new Map();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < this.N; i++) {
      const x = this.px[i], z = this.pz[i];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      const k = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
      let list = map.get(k);
      if (!list) { list = []; map.set(k, list); }
      list.push(i);
    }
    this.cells = map;
    this.bounds = { minX, maxX, minZ, maxZ };
  }

  /** Nächster Abtastpunkt über die Suchtabelle (für Gelände, Neustarts). */
  nearestIndex(x, z, maxCells = 3, exact = true) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    let best = -1, bd = Infinity;
    for (let r = 0; r <= maxCells; r++) {
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
        if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue;
        const list = this.cells.get(`${cx + a},${cz + b}`);
        if (!list) continue;
        for (const i of list) {
          const dx = x - this.px[i], dz = z - this.pz[i], d = dx * dx + dz * dz;
          if (d < bd) { bd = d; best = i; }
        }
      }
      if (best >= 0 && Math.sqrt(bd) < r * CELL) break;
    }
    if (best < 0 && !exact) return { i: 0, d: (maxCells + 1) * CELL };
    if (best < 0) {
      for (let i = 0; i < this.N; i++) {
        const dx = x - this.px[i], dz = z - this.pz[i], d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = i; }
      }
    }
    return { i: best, d: Math.sqrt(bd) };
  }

  /**
   * Lage relativ zur Strecke. hint = letzter Index (Fenstersuche), sonst Volltabelle.
   * out { i, lat (m, + = rechts), s (m entlang), hw } – wird wiederverwendet.
   */
  locate(x, z, hint = -1, out = {}) {
    let i;
    if (hint < 0) i = this.nearestIndex(x, z).i;
    else {
      i = hint;
      let bd = Infinity;
      for (let k = -24; k <= 24; k++) {
        const j = this.wrap(hint + k);
        const dx = x - this.px[j], dz = z - this.pz[j], d = dx * dx + dz * dz;
        if (d < bd) { bd = d; i = j; }
      }
    }
    const dx = x - this.px[i], dz = z - this.pz[i];
    const tx = this.tx[i], tz = this.tz[i];
    out.i = i;
    out.lat = -dx * tz + dz * tx;
    let s = i * this.ds + dx * tx + dz * tz;
    if (s < 0) s += this.length; else if (s >= this.length) s -= this.length;
    out.s = s;
    out.hw = this.hw[i];
    return out;
  }

  /** Punkt auf der Strecke: u (0..1 Rundenanteil) bzw. s (m), lat (m nach rechts). */
  pointAt(u, lat = 0, out = {}) {
    let f, i0, i1;
    if (this.closed) { f = (((u % 1) + 1) % 1) * this.N; i0 = Math.floor(f) % this.N; i1 = (i0 + 1) % this.N; }
    else { f = Math.min(1, Math.max(0, u)) * (this.N - 1); i0 = Math.min(this.N - 2, Math.floor(f)); i1 = i0 + 1; }
    f -= Math.floor(f);
    if (!this.closed && u >= 1) f = 1;
    const x = this.px[i0] + (this.px[i1] - this.px[i0]) * f, z = this.pz[i0] + (this.pz[i1] - this.pz[i0]) * f;
    let tx = this.tx[i0] + (this.tx[i1] - this.tx[i0]) * f, tz = this.tz[i0] + (this.tz[i1] - this.tz[i0]) * f;
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    out.x = x - tz * lat; out.z = z + tx * lat;
    // auf Brücken: Deckhöhe (innerhalb der Banden), sonst Gelände
    out.y = this.hasLift && Math.abs(lat) <= this.wallAt(i0) + 0.5 ? this.roadY(f < 0.5 ? i0 : i1, out.x, out.z) : this.heightAt(out.x, out.z);
    out.yaw = Math.atan2(-tz, tx);
    out.i = i0; out.tx = tx; out.tz = tz;
    out.hw = this.hw[i0] + (this.hw[i1] - this.hw[i0]) * f;
    return out;
  }

  /** Abstand der Bande von der Mitte an Index i. */
  wallAt(i) { return this.hw[i] + this.margin; }

  // ------------------------------------------------------------------ Bauen
  build() {
    this.buildTerrain();
    this.buildRoad();
    this.buildWalls();
    this.buildBridge();
    this.buildStartLine();
    return this.group;
  }

  /** Gelände: Raster mit Hügeln; Wiese, Randstreifen (Rasenmäher-Streifen) und ferne Wiese. */
  buildTerrain() {
    const th = this.theme, b = this.bounds;
    const pad = this.def.terrainPad ?? 260;
    const cell = this.cell ?? 3;
    const x0 = Math.floor((b.minX - pad) / cell) * cell, x1 = Math.ceil((b.maxX + pad) / cell) * cell;
    const z0 = Math.floor((b.minZ - pad) / cell) * cell, z1 = Math.ceil((b.maxZ + pad) / cell) * cell;
    const nx = Math.round((x1 - x0) / cell), nz = Math.round((z1 - z0) / cell);
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3);
    const cG = lin(th.grass), cG2 = lin(th.grass2), cF = lin(th.grassFar), cO = lin(th.offroad), cO2 = lin(th.offroad2);
    const tmp = [0, 0, 0];
    let k = 0;
    for (let iz = 0; iz <= nz; iz++) {
      for (let ix = 0; ix <= nx; ix++, k++) {
        const x = x0 + ix * cell, z = z0 + iz * cell;
        const { i, d } = this.nearestIndex(x, z, 6, false);
        let y = this.heightAt(x, z) - 0.04;
        const wall = this.wallAt(i);
        let c;
        if (d < wall + 1.5) {
          // Randstreifen: Streifen quer zur Fahrtrichtung
          c = Math.floor(i / 5) % 2 ? cO : cO2;
        } else {
          const stripe = (Math.floor((x + z) / 14) + Math.floor((x - z) / 14)) % 2 === 0;
          const g = stripe ? cG : cG2;
          const far = Math.min(1, Math.max(0, (d - 60) / 140));
          tmp[0] = g[0] + (cF[0] - g[0]) * far; tmp[1] = g[1] + (cF[1] - g[1]) * far; tmp[2] = g[2] + (cF[2] - g[2]) * far;
          c = tmp;
          // Höhlen/Zelt: außerhalb der Bande steigt der Boden zur Wand an (geschlossener Raum)
          if (this.def.enclosed) y += Math.max(0, d - wall - 4) * this.def.enclosed;
        }
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
        col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      }
    }
    const idx = [];
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
      const a = iz * (nx + 1) + ix, b2 = a + 1, c2 = a + nx + 1, d2 = c2 + 1;
      idx.push(a, c2, b2, b2, c2, d2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    m.receiveShadow = true;
    m.name = 'gelaende';
    this.group.add(m);
  }

  /** Bandförmige Fläche entlang der Strecke von lat a bis b (je Abtastpunkt), Farbe je Segment. */
  ribbon(aFn, bFn, yOff, colorFn, every = 1, skipFn = null) {
    const N = this.N;
    const pos = [], col = [];
    for (let i = 0; i < N; i += every) {
      const j = (i + every) % N;
      if (!this.closed && i + every > N - 1) break;
      if (skipFn && skipFn(i)) continue;
      const c = colorFn(i);
      if (!c) continue;
      const P = (k, lat, yo) => {
        const x = this.px[k] - this.tz[k] * lat, z = this.pz[k] + this.tx[k] * lat;
        return [x, this.roadY(k, x, z) + yo, z];
      };
      const a0 = P(i, aFn(i), yOff(i, 0)), b0 = P(i, bFn(i), yOff(i, 1)), a1 = P(j, aFn(j), yOff(j, 0)), b1 = P(j, bFn(j), yOff(j, 1));
      // a liegt links (kleineres lat) → Dreiecke gegen den Uhrzeigersinn von oben
      pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
      for (let q = 0; q < 6; q++) col.push(c[0], c[1], c[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  buildRoad() {
    const th = this.theme;
    const cR = lin(th.road), cR2 = lin(th.road2), cL = lin(th.line), cA = lin(th.curbA), cB = lin(th.curbB);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
    const add = (g, name, shadow = true) => {
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = shadow; m.name = name;
      this.group.add(m);
      return m;
    };
    const hw = (i) => this.hw[i];
    // Fahrbahn (leichte Querbänder für das Tempogefühl)
    add(this.ribbon((i) => -hw(i), (i) => hw(i), () => 0.06, (i) => (Math.floor(i / 6) % 2 ? cR : cR2)), 'fahrbahn');
    // Curbs: rot-weiß, außen abgeschrägt
    add(this.ribbon((i) => -hw(i) - 1.0, (i) => -hw(i), (i, s) => (s ? 0.1 : 0.04), (i) => (Math.floor(i / 2) % 2 ? cA : cB)), 'curb-l');
    add(this.ribbon((i) => hw(i), (i) => hw(i) + 1.0, (i, s) => (s ? 0.04 : 0.1), (i) => (Math.floor(i / 2) % 2 ? cA : cB)), 'curb-r');
    // Markierungen
    const lanes = this.def.lanes ?? 1;
    if (lanes > 1) {
      for (let l = 1; l < lanes; l++) {
        const f = -1 + (2 * l) / lanes;
        add(this.ribbon((i) => f * hw(i) - 0.12, (i) => f * hw(i) + 0.12, () => 0.075, (i) => (Math.floor(i / 4) % 2 ? null : cL)), 'spur');
      }
      const cY = lin(th.lineYellow ?? th.line);
      add(this.ribbon((i) => -hw(i) + 0.35, (i) => -hw(i) + 0.6, () => 0.075, () => cY), 'rand-l');
      add(this.ribbon((i) => hw(i) - 0.6, (i) => hw(i) - 0.35, () => 0.075, () => cY), 'rand-r');
    } else {
      add(this.ribbon(() => -0.15, () => 0.15, () => 0.075, (i) => (Math.floor(i / 3) % 2 ? null : cL)), 'mittelstreifen');
    }
  }

  /** Banden: durchgehende Leisten an beiden Seiten (abwechselnd gefärbt, Oberkante in Akzentfarbe). */
  buildWalls() {
    const th = this.theme;
    const H = th.wallH ?? 0.75, T = 0.45;
    const cA = lin(th.wallA), cB = lin(th.wallB), cT = lin(th.wallTop);
    const parts = [];
    for (const side of [-1, 1]) {
      const inner = (i) => side * this.wallAt(i), outer = (i) => side * (this.wallAt(i) + T);
      const L = side < 0 ? outer : inner, R = side < 0 ? inner : outer;
      // Oberseite
      const skip = (i) => this.inGap(side, i);
      parts.push(this.ribbon(L, R, () => H, () => cT, 1, skip));
      // Innen- und Außenflächen als senkrechte Bänder (gleiche lat, unterschiedliche Höhe)
      parts.push(this.wallFace(inner, H, (i) => (Math.floor(i / 4) % 2 ? cA : cB), skip));
      parts.push(this.wallFace(outer, H, () => cA, skip));
    }
    const geo = mergeAll(parts);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }));
    m.castShadow = true; m.receiveShadow = true; m.name = 'banden';
    this.group.add(m);
  }

  /**
   * Brückenkörper unter angehobenen Abschnitten: Deckplatte (Unterseite und Seiten) und Pfeiler. Pfeiler stehen
   * nicht auf anderen Straßen (isRoad(x, z) → true = dort keinen Pfeiler). Höhere Banden als Geländer.
   */
  buildBridge(isRoad = null) {
    if (!this.hasLift) return;
    const th = this.theme;
    const cDeck = lin(th.bridge ?? 0x8a6a4a), cPillar = lin(th.bridgePillar ?? 0x6a5a4e), cRail = lin(th.wallTop);
    const cTop = lin(th.bridgeTop ?? th.offroad), cTop2 = lin(th.bridgeTop2 ?? th.offroad2);
    const flat = (i) => !(this.lift[i] > 0.4 || this.lift[this.wrap(i + 1)] > 0.4);   // hier keine Brücke
    const W = (i) => this.wallAt(i) + 0.45;
    const parts = [
      // Deck-Oberseite zwischen Fahrbahn und Bande (dort gibt es kein Gelände), Unterseite (0,8 m dick), Seiten
      this.ribbon((i) => -W(i), (i) => W(i), () => -0.02, (i) => (Math.floor(i / 3) % 2 ? cTop : cTop2), 1, flat),
      this.ribbon((i) => -W(i), (i) => W(i), () => -0.8, () => cDeck, 1, flat),
      this.wallFace((i) => -W(i), 0.0, () => cDeck, flat),
      this.wallFace((i) => W(i), 0.0, () => cDeck, flat),
    ];
    // Seitenblenden reichen von −0,3 bis 0 – darunter bis −0,8 verlängern
    const skirt = (side) => {
      const pos = [], col = [];
      for (let i = 0; i < this.N; i++) {
        const j = this.wrap(i + 1);
        if (!this.closed && i >= this.N - 1) break;
        if (flat(i)) continue;
        const P = (k, y) => { const lat = side * W(k), x = this.px[k] - this.tz[k] * lat, z = this.pz[k] + this.tx[k] * lat; return [x, this.roadY(k, x, z) + y, z]; };
        const a0 = P(i, -0.8), a1 = P(j, -0.8), b0 = P(i, -0.25), b1 = P(j, -0.25);
        pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
        for (let q = 0; q < 6; q++) col.push(cDeck[0] * 0.8, cDeck[1] * 0.8, cDeck[2] * 0.8);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    };
    parts.push(skirt(-1), skirt(1));
    // Geländer: Pfosten und Handlauf auf beiden Seiten
    const rails = new THREE.BoxGeometry(1, 1, 1);
    const posts = [];
    for (let i = 0; i < this.N; i += 4) {
      if (!(this.lift[i] > 1)) continue;
      for (const side of [-1, 1]) {
        const lat = side * (this.wallAt(i) + 0.2), x = this.px[i] - this.tz[i] * lat, z = this.pz[i] + this.tx[i] * lat;
        posts.push([x, this.roadY(i, x, z), z]);
      }
    }
    // Pfeiler (alle ~12 m, je Seite einer), nicht auf anderen Straßen
    const pillars = [];
    for (let i = 0; i < this.N; i += 12) {
      if (!(this.lift[i] > 1.2)) continue;
      for (const side of [-1, 1]) {
        const lat = side * (this.hw[i] * 0.7), x = this.px[i] - this.tz[i] * lat, z = this.pz[i] + this.tx[i] * lat;
        if (isRoad?.(x, z, this, i)) continue;
        const top = this.roadY(i, x, z) - 0.8, bottom = Math.min(this.heightAt(x, z), top) - 2;
        pillars.push([x, (top + bottom) / 2, z, top - bottom]);
      }
    }
    const geo = mergeAll(parts);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
    const deck = new THREE.Mesh(geo, mat);
    deck.castShadow = true; deck.receiveShadow = true; deck.name = 'bruecke';
    this.group.add(deck);
    if (pillars.length) {
      const pg = new THREE.CylinderGeometry(0.9, 1.1, 1, 12);
      const im = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...cPillar), roughness: 0.8 }), pillars.length);
      pillars.forEach(([x, y, z, h], k) => im.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1))));
      im.castShadow = true; im.receiveShadow = true; im.name = 'brueckenpfeiler';
      this.group.add(im);
    }
    if (posts.length) {
      const im = new THREE.InstancedMesh(rails, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...cRail), roughness: 0.5 }), posts.length);
      posts.forEach(([x, y, z], k) => im.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(x, y + 1.2, z), new THREE.Quaternion(), new THREE.Vector3(0.18, 1.0, 0.18))));
      im.castShadow = true; im.name = 'gelaender';
      this.group.add(im);
    }
  }

  /** Liegt Abtastpunkt i auf Seite side in einer Banden-Lücke (Tor zu einer Verbindungsstraße)? */
  inGap(side, i) {
    const s = i * this.ds;
    for (const g of this.gaps) {
      if (g.side !== side) continue;
      let d = s - g.s;
      if (this.closed) { d = ((d % this.length) + this.length * 1.5) % this.length - this.length / 2; }
      if (Math.abs(d) < g.half) return true;
    }
    return false;
  }

  wallFace(latFn, H, colorFn, skipFn = null) {
    const N = this.N, pos = [], col = [];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, c = colorFn(i);
      if (!this.closed && i >= N - 1) break;
      if (skipFn && skipFn(i)) continue;
      const P = (k, y) => {
        const lat = latFn(k), x = this.px[k] - this.tz[k] * lat, z = this.pz[k] + this.tx[k] * lat;
        return [x, this.roadY(k, x, z) + y, z];
      };
      const a0 = P(i, -0.3), a1 = P(j, -0.3), b0 = P(i, H), b1 = P(j, H);
      pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
      for (let q = 0; q < 6; q++) col.push(c[0], c[1], c[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  /** Start-Ziel-Linie: Schachbrett über die ganze Breite (zwei Reihen). */
  buildStartLine() {
    const pos = [], col = [];
    const W = lin(0xfaf8f2), K = lin(0x2a2834);
    const hw = this.hw[0], n = Math.round((hw * 2) / 0.9);
    const w = (hw * 2) / n;
    for (let row = 0; row < 2; row++) {
      for (let c = 0; c < n; c++) {
        const la = -hw + c * w, lb = la + w;
        const s0 = -0.9 + row * 0.9, s1 = s0 + 0.9;
        const P = (s, lat) => {
          const x = this.px[0] + this.tx[0] * s - this.tz[0] * lat, z = this.pz[0] + this.tz[0] * s + this.tx[0] * lat;
          return [x, this.heightAt(x, z) + 0.085, z];
        };
        const a0 = P(s0, la), b0 = P(s0, lb), a1 = P(s1, la), b1 = P(s1, lb);
        pos.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1);
        const cc = (row + c) % 2 ? W : K;
        for (let q = 0; q < 6; q++) col.push(cc[0], cc[1], cc[2]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }));
    m.receiveShadow = true; m.name = 'startlinie';
    this.group.add(m);
  }

  /** Umriss für die Minikarte (normiert auf ein Rechteck w×h mit Rand). */
  mapTransform(w, h, padding = 8) {
    const b = this.bounds;
    const sx = (w - padding * 2) / (b.maxX - b.minX), sz = (h - padding * 2) / (b.maxZ - b.minZ);
    const s = Math.min(sx, sz);
    const ox = (w - (b.maxX - b.minX) * s) / 2, oz = (h - (b.maxZ - b.minZ) * s) / 2;
    return { s, map: (x, z) => [ox + (x - b.minX) * s, oz + (z - b.minZ) * s] };
  }

  dispose() {
    this.group.traverse((o) => { if (o.isMesh) { o.geometry?.dispose?.(); } });
    this.group.removeFromParent();
  }
}

function mergeAll(parts) {
  let n = 0;
  for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

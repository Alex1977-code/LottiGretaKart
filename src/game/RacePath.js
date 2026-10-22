// Rennpfad in der offenen Welt: eine abgewickelte, offene Linie, der das Rennen folgt – z. B. Startaufstellung
// an Strecke A → Teil von A bis zum Tor → Verbindungsstraße → Strecke B bis zur Ziellinie → weitere Runden von B
// (Grand Prix wie in Mario Kart World), nur Runden einer Strecke, oder eine Rallye über mehrere Strecken
// (K.-o.-Tour). Runden sind hintereinander abgelegt, Fortschritt = Meter entlang des Pfads.
//
// Gleiche Abfragen wie Track (locate, pointAt, curv, hw, tx/tz …), damit Fahrphysik, KI und Gegenstände
// unverändert darauf arbeiten. Banden kommen aus der Welt-Kollision (wallAt = ∞).

import * as THREE from 'three';

const STEP = 1;

export class RacePath {
  constructor(world, points, meta = {}) {
    this.world = world;
    this.closed = false;
    this.margin = 0;
    // Polylinie ausdünnen (alle ~4 m) und mit Catmull-Rom glätten → weiche Kurven an den Toren
    const thin = [];
    let acc = Infinity;
    for (let k = 0; k < points.length; k++) {
      const p = points[k];
      if (k > 0) acc += Math.hypot(p.x - points[k - 1].x, p.z - points[k - 1].z);
      if (acc >= 4 || k === points.length - 1) { thin.push(p); acc = 0; }
    }
    const curve = new THREE.CatmullRomCurve3(thin.map((p) => new THREE.Vector3(p.x, 0, p.z)), false, 'centripetal');
    const L = curve.getLength();
    const N = Math.max(16, Math.round(L / STEP));
    this.N = N; this.length = L; this.ds = L / (N - 1);
    this.px = new Float32Array(N); this.pz = new Float32Array(N); this.tx = new Float32Array(N); this.tz = new Float32Array(N);
    this.hw = new Float32Array(N); this.curv = new Float32Array(N); this.py = new Float32Array(N);
    const pts = curve.getSpacedPoints(N - 1);
    // Breite: vom nächsten Originalpunkt (gleicher Anteil entlang der Linie)
    const polyLen = points.reduce((a, p, k) => a + (k ? Math.hypot(p.x - points[k - 1].x, p.z - points[k - 1].z) : 0), 0);
    this.scale = L / (polyLen || 1);
    let j = 0, sAcc = 0;
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      this.px[i] = p.x; this.pz[i] = p.z;
      const target = (i / (N - 1)) * polyLen;
      while (j < points.length - 1 && sAcc + Math.hypot(points[j + 1].x - points[j].x, points[j + 1].z - points[j].z) < target) {
        sAcc += Math.hypot(points[j + 1].x - points[j].x, points[j + 1].z - points[j].z); j++;
      }
      this.hw[i] = points[j].hw;
      this.py[i] = world.heightAt(p.x, p.z);
    }
    for (let i = 0; i < N; i++) {
      const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
      let dx = this.px[b] - this.px[a], dz = this.pz[b] - this.pz[a];
      const l = Math.hypot(dx, dz) || 1;
      this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    for (let i = 0; i < N; i++) {
      const a = this.wrap(i - 4), b = this.wrap(i + 4);
      const ang = Math.atan2(this.tx[a] * this.tz[b] - this.tz[a] * this.tx[b], this.tx[a] * this.tx[b] + this.tz[a] * this.tz[b]);
      this.curv[i] = ang / (8 * this.ds);
    }
    // Markierungen (Meter auf dem Pfad): Ziellinien-Überfahrten, Checkpoints, Ziel, Startlinie
    const m = (s) => s * this.scale;
    this.lapMarks = (meta.lapMarks ?? []).map(m);
    this.checkpoints = (meta.checkpoints ?? []).map((c) => ({ ...c, s: m(c.s) }));
    this.startS = m(meta.startS ?? 0);
    this.finishS = meta.finishS !== undefined ? m(meta.finishS) : L - 1;
    this.laps = meta.laps ?? 1;
    this.courseId = meta.courseId ?? null;
    this.label = meta.label ?? '';
  }

  wrap(i) { return i < 0 ? 0 : i >= this.N ? this.N - 1 : i; }
  heightAt(x, z) { return this.world.heightAt(x, z); }
  wallAt() { return Infinity; }

  nearestIndex(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.N; i += 2) {
      const dx = x - this.px[i], dz = z - this.pz[i], d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return { i: best, d: Math.sqrt(bd) };
  }

  locate(x, z, hint = -1, out = {}) {
    let i;
    if (hint < 0) i = this.nearestIndex(x, z).i;
    else {
      i = hint;
      let bd = Infinity;
      for (let k = -24; k <= 24; k++) {
        const j = hint + k;
        if (j < 0 || j >= this.N) continue;
        const dx = x - this.px[j], dz = z - this.pz[j], d = dx * dx + dz * dz;
        if (d < bd) { bd = d; i = j; }
      }
    }
    const dx = x - this.px[i], dz = z - this.pz[i];
    const tx = this.tx[i], tz = this.tz[i];
    out.i = i;
    out.lat = -dx * tz + dz * tx;
    out.s = Math.max(0, i * this.ds + dx * tx + dz * tz);
    out.hw = this.hw[i];
    return out;
  }

  pointAt(u, lat = 0, out = {}) {
    let f = Math.min(1, Math.max(0, u)) * (this.N - 1);
    const i0 = Math.min(this.N - 2, Math.floor(f)), i1 = i0 + 1;
    f -= i0;
    const x = this.px[i0] + (this.px[i1] - this.px[i0]) * f, z = this.pz[i0] + (this.pz[i1] - this.pz[i0]) * f;
    let tx = this.tx[i0] + (this.tx[i1] - this.tx[i0]) * f, tz = this.tz[i0] + (this.tz[i1] - this.tz[i0]) * f;
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    out.x = x - tz * lat; out.z = z + tx * lat;
    out.y = this.world.heightAt(out.x, out.z);
    out.yaw = Math.atan2(-tz, tx);
    out.i = i0; out.tx = tx; out.tz = tz;
    out.hw = this.hw[i0];
    return out;
  }

  /** Punkt an Pfad-Meter s. */
  pointAtS(s, lat = 0, out = {}) { return this.pointAt(s / this.length, lat, out); }

  // ------------------------------------------------------------------ Bausteine
  /** Strecke vorwärts von Index a bis b (über die Ziellinie hinweg, falls b <= a); hängt Punkte an und meldet Ziellinien. */
  static coursePiece(pts, course, a, b, onFinishLine) {
    const tr = course.track, N = tr.N;
    let i = a, guard = 0;
    while (guard++ < N * 2) {
      pts.push({ x: tr.px[i], z: tr.pz[i], hw: tr.hw[i] });
      if (i === b) break;
      i = (i + 1) % N;
      if (i === 0) onFinishLine?.(pts);
    }
  }

  static connectorPiece(pts, conn, reverse) {
    const tr = conn.track;
    for (let k = 0; k < tr.N; k++) {
      const i = reverse ? tr.N - 1 - k : k;
      pts.push({ x: tr.px[i], z: tr.pz[i], hw: tr.hw[i] });
    }
  }

  static lengthOf(pts) { let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z); return L; }

  /** Nur Runden einer Strecke (Startaufstellung hinter der Linie). */
  static forCourse(world, courseId, laps = 3, back = 45) {
    const c = world.courseById[courseId], tr = c.track, N = tr.N;
    const pts = [], marks = [];
    const b0 = Math.round(back / tr.ds);
    RacePath.coursePiece(pts, c, N - b0, N - 1);
    const startS = RacePath.lengthOf(pts);
    for (let l = 0; l < laps; l++) {
      RacePath.coursePiece(pts, c, 0, N - 1);
      marks.push(RacePath.lengthOf(pts) + tr.ds);
    }
    pts.push({ x: tr.px[0], z: tr.pz[0], hw: tr.hw[0] });
    for (let k = 0; k < 4; k++) pts.push({ x: tr.px[k + 1], z: tr.pz[k + 1], hw: tr.hw[k + 1] }); // Auslauf
    const L = RacePath.lengthOf(pts);
    const finishS = marks[marks.length - 1];
    return new RacePath(world, pts, { lapMarks: marks, startS, finishS: Math.min(finishS, L - 4), laps, courseId, label: c.def.name, runout: L - finishS });
  }

  /**
   * Grand Prix mit Anfahrt: Start an Strecke A, über die Verbindungsstraße zu B, dann Runden auf B.
   * Die Anfahrt bis zur Ziellinie von B zählt als erste Runde.
   */
  static forRoute(world, fromId, toId, laps = 2, back = 45) {
    const link = world.connectorBetween(fromId, toId);
    if (!link) return RacePath.forCourse(world, toId, laps);
    const A = world.courseById[fromId], B = world.courseById[toId];
    const gateA = link.reverse ? link.conn.b : link.conn.a, gateB = link.reverse ? link.conn.a : link.conn.b;
    const pts = [], marks = [];
    const NA = A.track.N, b0 = Math.round(back / A.track.ds);
    RacePath.coursePiece(pts, A, NA - b0, NA - 1);
    const startS = RacePath.lengthOf(pts);
    RacePath.coursePiece(pts, A, 0, gateA.i);
    RacePath.connectorPiece(pts, link.conn, link.reverse);
    RacePath.coursePiece(pts, B, gateB.i, B.track.N - 1);
    marks.push(RacePath.lengthOf(pts) + B.track.ds);
    for (let l = 1; l < laps; l++) {
      RacePath.coursePiece(pts, B, 0, B.track.N - 1);
      marks.push(RacePath.lengthOf(pts) + B.track.ds);
    }
    const tr = B.track;
    for (let k = 0; k < 5; k++) pts.push({ x: tr.px[k], z: tr.pz[k], hw: tr.hw[k] });
    const L = RacePath.lengthOf(pts);
    return new RacePath(world, pts, { lapMarks: marks, startS, finishS: Math.min(marks[marks.length - 1], L - 4), laps, courseId: toId, fromId, label: `${A.def.short ?? A.def.name} → ${B.def.name}` });
  }

  /** Rallye über mehrere Strecken (K.-o.-Tour); Checkpoints an der Ankunft jeder Zwischenstation. */
  static forTour(world, stops, survivors = []) {
    const pts = [], checkpoints = [];
    const A = world.courseById[stops[0]];
    const NA = A.track.N, b0 = Math.round(45 / A.track.ds);
    RacePath.coursePiece(pts, A, NA - b0, NA - 1);
    const startS = RacePath.lengthOf(pts);
    let entry = 0; // Eintrittsindex in die aktuelle Strecke
    for (let k = 0; k < stops.length - 1; k++) {
      const cur = world.courseById[stops[k]];
      const link = world.connectorBetween(stops[k], stops[k + 1]);
      const gateOut = link.reverse ? link.conn.b : link.conn.a, gateIn = link.reverse ? link.conn.a : link.conn.b;
      RacePath.coursePiece(pts, cur, entry, gateOut.i);
      // Checkpoint an der Ausfahrt jeder Zwischenstation (nach der Durchfahrt)
      if (k >= 1) checkpoints.push({ s: RacePath.lengthOf(pts), survivors: survivors[k - 1] ?? 1, name: cur.def.name });
      RacePath.connectorPiece(pts, link.conn, link.reverse);
      entry = gateIn.i;
    }
    const last = world.courseById[stops[stops.length - 1]];
    RacePath.coursePiece(pts, last, entry, last.track.N - 1);
    const finishS = RacePath.lengthOf(pts) + last.track.ds;
    for (let k = 0; k < 5; k++) pts.push({ x: last.track.px[k], z: last.track.pz[k], hw: last.track.hw[k] });
    return new RacePath(world, pts, { checkpoints, startS, finishS, laps: 1, courseId: last.id, label: 'K.-o.-Tour' });
  }

  /** Endlos-Runden (Freie Fahrt: Computer-Fahrer kreisen auf ihrer Heimstrecke). */
  static loop(world, courseId, laps = 40) { return RacePath.forCourse(world, courseId, laps, 10); }
}

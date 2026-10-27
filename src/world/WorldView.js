// Darstellung der Insel-Welt: Gelände in Kacheln (Vertexfarben je Region, Strand, Fels, Randstreifen an Straßen),
// Meer und See, alle Strecken (Fahrbahn, Curbs, Banden, Start-Tor), Verbindungsstraßen, Höhlenberg und
// Zirkuszelt mit Eingängen, Kulisse je Strecke und Wälder über die ganze Insel. Einmal gebaut, für alle Rennen.

import * as THREE from 'three';
import { Decor } from './decor.js';
import { getTheme } from './themes.js';
import { lin } from '../lgw/three/world/geometry.js';
import { Rnd } from '../lgw/three/world/geometry.js';
import { addGroundDetail, makeWaterMaterial, SHADER_TIME } from './shaders.js';
import { IslandLife } from './life.js';
import { buildTrackDetails } from './trackDetail.js';
import { buildNightLamps } from './night.js';

const TILE = 60; // Kachelgröße in Höhenfeld-Zellen (3 m → 180 m)

export class WorldView {
  constructor(world, scene, { quality = 2 } = {}) {
    this.world = world;
    this.scene = scene;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'welt';
    scene.add(this.group);
    this.decors = [];
  }

  /** Schrittweise bauen (zwischendurch zeichnen lassen); progress(0..1, Text). */
  async build(progress = () => {}) {
    const steps = [
      ['Gelände', () => this.buildTerrain()],
      ['Wasser', () => this.buildWater()],
      ['Lava', () => this.buildLava()],
      ['Strecken', () => this.buildRoads()],
      ['Höhlenberg und Zirkuszelt', () => this.buildStructures()],
      ['Kulisse', () => this.buildDecor()],
      ['Kurvenschilder und Wimpel', () => buildTrackDetails(this.group, this.world, this.quality)],
      ['Laternen für die Nacht', () => { const l = buildNightLamps(this.world, this.quality); this.nightLamps = l.night; this.group.add(l.night, l.always); }],
      ['Wälder', () => this.buildForests()],
      ['Boote, Vögel und Schmetterlinge', () => { this.life = new IslandLife(this.group, this.world, this.quality); }],
    ];
    for (let k = 0; k < steps.length; k++) {
      progress(k / steps.length, steps[k][0]);
      await new Promise((r) => setTimeout(r, 0));
      steps[k][1]();
    }
    progress(1, 'fertig');
  }

  // ------------------------------------------------------------------ Gelände
  buildTerrain() {
    const w = this.world, hf = w.hf, C = hf.cell;
    const regions = w.def.regions.map((r) => ({ ...r, th: getTheme(r.theme) }));
    const cache = new Map();
    const col = (hex) => { let v = cache.get(hex); if (!v) { v = lin(hex); cache.set(hex, v); } return v; };
    const sand = col(0xe8d39a), sandWet = col(0xc9b27a), rock = col(0x9a92a0), rockDark = col(0x7a7284), snow = col(0xf4f2f8);
    const ash = col(0x3a3034), lavaRim = col(0xc8401a);
    const mat = addGroundDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { grain: 0.16, key: 'terrain', patches: true });
    const tmp = [0, 0, 0], acc = [0, 0, 0];
    for (let tz = 0; tz < hf.nz - 1; tz += TILE) {
      for (let tx = 0; tx < hf.nx - 1; tx += TILE) {
        const nx = Math.min(TILE, hf.nx - 1 - tx), nz = Math.min(TILE, hf.nz - 1 - tz);
        // ganz unter Wasser (Meer)? Dann reicht die Wasserfläche
        let maxH = -99, uw = false;
        for (let iz = 0; iz <= nz; iz += 4) for (let ix = 0; ix <= nx; ix += 4) { const gi = (tz + iz) * hf.nx + tx + ix; maxH = Math.max(maxH, hf.h[gi]); uw ||= hf.uw[gi] === 1; }
        if (maxH < -6 && !uw) continue;   // (außer in Unterwasser-Zonen: dort fährt man auf dem Grund)
        const pos = new Float32Array((nx + 1) * (nz + 1) * 3), cols = new Float32Array((nx + 1) * (nz + 1) * 3);
        let k = 0;
        for (let iz = 0; iz <= nz; iz++) {
          for (let ix = 0; ix <= nx; ix++, k++) {
            const gx = tx + ix, gz = tz + iz, gi = gz * hf.nx + gx;
            const x = hf.x0 + gx * C, z = hf.z0 + gz * C, y = hf.h[gi] - 0.04;
            pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
            // Region überblenden
            acc[0] = acc[1] = acc[2] = 0;
            let sum = 0;
            const stripe = (Math.floor((x + z) / 14) + Math.floor((x - z) / 14)) % 2 === 0;
            const roadW = hf.rw[gi];
            for (const r of regions) {
              const d = Math.hypot(x - r.x, z - r.z);
              let wgt = 1 - smooth(r.r * 0.8, r.r + (r.fade ?? 120), d);
              if (r.base) wgt = Math.max(wgt, 0.03);
              if (wgt <= 0) continue;
              const g = col(stripe ? r.th.grass : r.th.grass2), o = col(Math.floor((x * 0.7 + z) / 5) % 2 ? r.th.offroad : r.th.offroad2);
              const ow = Math.min(1, roadW * 1.4);
              for (let q = 0; q < 3; q++) acc[q] += (g[q] + (o[q] - g[q]) * ow) * wgt;
              sum += wgt;
            }
            for (let q = 0; q < 3; q++) tmp[q] = acc[q] / (sum || 1);
            // Höhe: Strand, Unterwasser, Fels, Gipfel
            const hh = hf.h[gi];
            if (hh < 1.4 && roadW < 0.5) { const f = smooth(1.4, 0.4, hh); for (let q = 0; q < 3; q++) tmp[q] += ((hh < 0 ? sandWet[q] : sand[q]) - tmp[q]) * f; }
            if (hh > 16) { const f = smooth(16, 32, hh); for (let q = 0; q < 3; q++) tmp[q] += ((hh > 34 ? rockDark[q] : rock[q]) - tmp[q]) * f; }
            const volc = regions.reduce((a, r) => (r.theme === 'volcano' ? Math.max(a, 1 - smooth(r.r, r.r + 260, Math.hypot(x - r.x, z - r.z))) : a), 0);
            if (hh > 40) { const f = smooth(40, 48, hh) * (1 - volc); for (let q = 0; q < 3; q++) tmp[q] += (snow[q] - tmp[q]) * f; }
            if (volc > 0 && hh > 20) { const f = smooth(20, 45, hh) * volc; for (let q = 0; q < 3; q++) tmp[q] += ((hh > 52 ? lavaRim[q] : ash[q]) - tmp[q]) * f; }
            // feine Helligkeits-Flecken, damit Wiesen nicht flach wirken
            const nz2 = 0.93 + 0.07 * Math.sin(x * 0.11 + Math.sin(z * 0.07) * 2) * Math.cos(z * 0.13 - x * 0.03) + 0.05 * Math.sin(x * 0.53 + z * 0.41);
            cols[k * 3] = tmp[0] * nz2; cols[k * 3 + 1] = tmp[1] * nz2; cols[k * 3 + 2] = tmp[2] * nz2;
          }
        }
        // zwei Detailstufen: volles Raster nah, jede dritte Zelle in der Ferne
        const makeGeo = (step) => {
          const idx = [];
          for (let iz = 0; iz < nz; iz += step) for (let ix = 0; ix < nx; ix += step) {
            const iz2 = Math.min(nz, iz + step), ix2 = Math.min(nx, ix + step);
            const a = iz * (nx + 1) + ix, b = iz * (nx + 1) + ix2, c = iz2 * (nx + 1) + ix, d = iz2 * (nx + 1) + ix2;
            idx.push(a, c, b, b, c, d);
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
          g.setIndex(idx);
          g.computeVertexNormals();
          g.computeBoundingSphere();
          return g;
        };
        const lod = new THREE.LOD();
        const hi = new THREE.Mesh(makeGeo(1), mat), lo = new THREE.Mesh(makeGeo(3), mat);
        hi.receiveShadow = true; lo.receiveShadow = true;
        // LOD-Abstand vom Kachel-Mittelpunkt messen
        const cx = hf.x0 + (tx + nx / 2) * C, cz = hf.z0 + (tz + nz / 2) * C;
        for (const m of [hi, lo]) { m.position.set(-cx, 0, -cz); }
        lod.position.set(cx, 0, cz);
        lod.addLevel(hi, 0);
        lod.addLevel(lo, 330);
        lod.name = 'gelaende';
        this.group.add(lod);
      }
    }
  }

  // ------------------------------------------------------------------ Wasser
  buildWater() {
    const b = this.world.def.bounds;
    const w = 4000, d = 4000;
    const g = new THREE.PlaneGeometry(w, d, 1, 1);
    g.rotateX(-Math.PI / 2);
    // Wellen, Tiefenfarbe und Ufer-Schaum im Shader; von unten (Unterwasser-Abschnitte) eine helle, flirrende Decke
    this.water = new THREE.Mesh(g, makeWaterMaterial(this.world.hf));
    this.water.position.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
    this.water.receiveShadow = true;
    this.water.renderOrder = 1;
    this.water.name = 'wasser';
    this.group.add(this.water);
    // Wellen-Glitzern: kleine helle Streifen, die über die Fläche ziehen (eine Instanz-Wolke)
    const rnd = new Rnd(5);
    const n = 500;
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 0.18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.55, depthWrite: false }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    let k = 0;
    for (let tries = 0; k < n && tries < n * 20; tries++) {
      const x = b.minX + rnd.frac() * (b.maxX - b.minX), z = b.minZ + rnd.frac() * (b.maxZ - b.minZ);
      if (this.world.heightAt(x, z) > -0.6) continue;
      q.setFromEuler(new THREE.Euler(0, rnd.frac() * 0.6, 0));
      p.set(x, 0.03, z);
      s.setScalar(0.6 + rnd.frac() * 1.4);
      m.compose(p, q, s);
      im.setMatrixAt(k++, m);
    }
    im.count = k;
    im.frustumCulled = false;
    this.sparkles = im;
    this.group.add(im);
  }

  // ------------------------------------------------------------------ Strecken und Straßen
  buildRoads() {
    const w = this.world;
    for (const c of w.courses) {
      const tr = c.track;
      tr.buildRoad();
      tr.buildWalls();
      tr.buildBridge((x, z, t) => w.roadBelow(x, z, t));
      tr.buildStartLine();
      this.group.add(tr.group);
    }
    const cLine = lin(0xf8f6f0);
    for (const c of w.connectors) {
      const tr = c.track, th = tr.theme;
      const cR = lin(0x9a96a8), cR2 = lin(0x948fa3);
      const mat = addGroundDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { grain: 0.1, scale: 1.8, key: 'conn', rain: 1 });
      const skip = (i) => tr.water[i] || tr.water[Math.min(tr.N - 1, i + 1)];
      const hw = (i) => tr.hw[i];
      const parts = [
        tr.ribbon((i) => -hw(i), (i) => hw(i), () => 0.05, (i) => (Math.floor(i / 6) % 2 ? cR : cR2), 1, skip),
        tr.ribbon((i) => -hw(i) + 0.3, (i) => -hw(i) + 0.55, () => 0.07, () => cLine, 1, skip),
        tr.ribbon((i) => hw(i) - 0.55, (i) => hw(i) - 0.3, () => 0.07, () => cLine, 1, skip),
        tr.ribbon(() => -0.12, () => 0.12, () => 0.07, (i) => (Math.floor(i / 4) % 2 ? null : cLine), 1, skip),
      ];
      for (const g of parts) {
        const m = new THREE.Mesh(g, mat);
        m.receiveShadow = true;
        m.name = `strasse:${c.id}`;
        this.group.add(m);
      }
      // Bojen-Reihe über den See (zeigt den Wasserweg)
      const buoys = [];
      for (let i = 0; i < tr.N; i += 9) if (tr.water[i]) for (const s of [-1, 1]) buoys.push([tr.px[i] - tr.tz[i] * s * (tr.hw[i] + 1.5), tr.pz[i] + tr.tx[i] * s * (tr.hw[i] + 1.5), s]);
      if (buoys.length) {
        const g = new THREE.SphereGeometry(0.55, 12, 8);
        const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.4 }), buoys.length);
        buoys.forEach(([x, z, s], k) => { im.setMatrixAt(k, new THREE.Matrix4().makeTranslation(x, 0.2, z)); im.setColorAt(k, new THREE.Color(s > 0 ? 0xe8392d : 0xfff8ee)); });
        im.castShadow = true;
        this.group.add(im);
      }
    }
    // Grind-Schienen
    this.buildRails();
  }

  buildRails() {
    this.rails = [];
    const mat = new THREE.MeshStandardMaterial({ color: 0xd8dce8, metalness: 0.6, roughness: 0.25 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3b7cf0, roughness: 0.5 });
    for (const r of this.world.def.rails) {
      const pts = r.pts.map(([x, z]) => new THREE.Vector3(x, Math.max(0, this.world.heightAt(x, z)) + r.h, z));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.ceil(curve.getLength() / 2), 0.16, 8, false), mat);
      tube.castShadow = true;
      this.group.add(tube);
      const L = curve.getLength(), n = Math.ceil(L / 6);
      const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.12, 1, 8), postMat, n + 1);
      const samples = [];
      for (let k = 0; k <= n; k++) {
        const p = curve.getPointAt(k / n);
        const gy = Math.max(-2, this.world.heightAt(p.x, p.z));
        const hgt = p.y - gy;
        posts.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(p.x, gy + hgt / 2, p.z), new THREE.Quaternion(), new THREE.Vector3(1, hgt, 1)));
      }
      for (let k = 0, m = Math.ceil(L); k <= m; k++) { const p = curve.getPointAt(k / m); samples.push([p.x, p.y, p.z]); }
      this.group.add(posts);
      this.rails.push({ curve, L, samples });
    }
  }

  // ------------------------------------------------------------------ Lava
  /** Glühende Lava-Seen: leuchtende Scheiben mit wanderndem Muster (Vertexfarben) und aufsteigender Glut. */
  buildLava() {
    this.lavaPools = [];
    for (const l of this.world.lava) {
      const g = new THREE.CircleGeometry(l.r, 40, 0, Math.PI * 2);
      g.rotateX(-Math.PI / 2);
      const P = g.attributes.position, cols = new Float32Array(P.count * 3);
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
      const m = new THREE.Mesh(g, mat);
      const y = this.world.heightAt(l.x, l.z) + 0.12;
      m.position.set(l.x, y, l.z);
      m.name = 'lava';
      // Rand aus dunklem Basalt
      const rim = new THREE.Mesh(new THREE.TorusGeometry(l.r, 0.9, 6, 40).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a2226, roughness: 1, flatShading: true }));
      rim.position.set(l.x, y + 0.1, l.z);
      this.group.add(m, rim);
      this.lavaPools.push({ m, l, cols, P });
    }
    this.lavaLight = this.world.lava.length ? 1 : 0;
  }

  updateLava(t) {
    if (!this.lavaPools?.length) return;
    this.lavaT = (this.lavaT ?? 0) + 1;
    if (this.lavaT % 3) return;   // alle drei Bilder reicht
    for (const { cols, P, l } of this.lavaPools) {
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), z = P.getZ(i);
        const n = 0.5 + 0.5 * Math.sin(x * 0.35 + t * 1.3) * Math.cos(z * 0.3 - t * 0.9) + 0.25 * Math.sin((x + z) * 0.8 + t * 2.2);
        const edge = Math.min(1, Math.hypot(x, z) / l.r);
        const k = Math.max(0, Math.min(1, n * 0.8 + 0.2 - edge * 0.3));
        cols[i * 3] = 1.0; cols[i * 3 + 1] = 0.25 + 0.55 * k; cols[i * 3 + 2] = 0.02 + 0.2 * k * k;
      }
    }
    for (const p of this.lavaPools) p.m.geometry.attributes.color.needsUpdate = true;
  }

  // ------------------------------------------------------------------ Bauwerke
  buildStructures() {
    const w = this.world;
    this.structureDecor = new Decor(this.scene, w.courses[0].track, getTheme('circus'), 7, this.quality, w);
    for (const st of w.def.structures) {
      const y = w.heightAt(st.x, st.z);
      if (st.kind === 'tent') this.structureDecor.buildTent({ x: st.x, z: st.z, r: st.r, h: st.h, roof: st.roof, doors: st.doors, y: y - 1 });
      if (st.kind === 'cave') this.buildCaveMountain(st, y);
    }
    this.structureDecor.build();
  }

  /** Höhlenberg: zerklüftete Felskuppel über der Grotte, mit Torbögen an den Eingängen; innen Tropfsteine. */
  buildCaveMountain(st, y0) {
    const g = new THREE.SphereGeometry(st.r, 72, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const P = g.attributes.position;
    const rnd = new Rnd(11);
    const noise = (a, e) => Math.sin(a * 7 + 1.3) * 0.5 + Math.sin(a * 13 + e * 5) * 0.35 + Math.sin(a * 23 - e * 9) * 0.2;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), yy = P.getY(i), z = P.getZ(i);
      const a = Math.atan2(z, x), e = Math.asin(Math.min(1, yy / st.r));
      const k = 1 + 0.07 * noise(a, e);
      P.setXYZ(i, x * k, (yy / st.r) * st.h * (1 + 0.12 * noise(a + 2, e)), z * k);
    }
    // Eingänge ausschneiden (Wandteile unten an den Toren)
    const idx = g.index.array, keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      let ax = 0, ay = 0, az = 0;
      for (let q = 0; q < 3; q++) { ax += P.getX(idx[t + q]); ay += P.getY(idx[t + q]); az += P.getZ(idx[t + q]); }
      const a = Math.atan2(az / 3, ax / 3);
      const door = st.doors.some((d) => { let dd = Math.abs(a - d.a) % (Math.PI * 2); if (dd > Math.PI) dd = Math.PI * 2 - dd; return dd < d.half * 1.15; });
      if (door && ay / 3 < 13) continue;
      keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
    g.computeVertexNormals();
    const cols = new Float32Array(P.count * 3);
    const c1 = new THREE.Color(0x8a8296), c2 = new THREE.Color(0x6e6680), moss = new THREE.Color(0x5cbf3a), c = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const yy = P.getY(i) / st.h;
      c.copy(c1).lerp(c2, 0.5 + 0.5 * Math.sin(P.getX(i) * 0.08 + P.getZ(i) * 0.05));
      if (yy > 0.82) c.lerp(moss, Math.min(1, (yy - 0.82) * 6));
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const dome = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, flatShading: true }));
    dome.position.set(st.x, y0 - 1, st.z);
    dome.castShadow = true; dome.receiveShadow = true;
    dome.name = 'hoehlenberg';
    this.group.add(dome);
    // Torbögen an den Eingängen (Holzbalken mit Laternen)
    for (const d of st.doors) {
      const ang = d.a, x = st.x + Math.cos(ang) * st.r, z = st.z + Math.sin(ang) * st.r, gy = this.world.heightAt(x, z);
      const arch = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.8 });
      const span = d.half * st.r;
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), wood);
        post.position.set(0, 4.5, s * span);
        post.castShadow = true;
        arch.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, span * 2 + 2), wood);
      beam.position.y = 9.2;
      arch.add(beam);
      arch.position.set(x, gy, z);
      arch.rotation.y = -ang;
      this.group.add(arch);
    }
    // Tropfsteine an der Kuppel innen
    const stal = new THREE.ConeGeometry(1, 6, 7).rotateX(Math.PI).translate(0, -3, 0);
    const n = 90;
    const im = new THREE.InstancedMesh(stal, new THREE.MeshStandardMaterial({ color: 0x6a6278, roughness: 1, flatShading: true }), n);
    const rnd2 = new Rnd(21);
    for (let k = 0; k < n; k++) {
      const a = rnd2.frac() * Math.PI * 2, rr = Math.sqrt(rnd2.frac()) * st.r * 0.85;
      const x = st.x + Math.cos(a) * rr, z = st.z + Math.sin(a) * rr;
      const top = y0 - 1 + st.h * Math.sqrt(Math.max(0, 1 - (rr / st.r) ** 2)) * 0.97;
      const s = 0.8 + rnd2.frac() * 1.6;
      im.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(x, top, z), new THREE.Quaternion(), new THREE.Vector3(s, s * (1 + rnd2.frac()), s)));
    }
    this.group.add(im);
  }

  // ------------------------------------------------------------------ Kulisse
  buildDecor() {
    const w = this.world;
    for (const c of w.courses) {
      const d = new Decor(this.scene, c.track, c.theme, c.def.seed ?? 3, this.quality, w);
      c.def.scenery?.(d, null);
      d.startGate(c.def.banner ?? c.def.name.toUpperCase());
      d.build();
      this.decors.push(d);
    }
  }

  /** Wälder, Büsche, Blumen und Felsen über die ganze Insel – Baumart nach Region. */
  buildForests() {
    const w = this.world, b = w.def.bounds;
    const d = new Decor(this.scene, w.courses[0].track, getTheme('grass'), 99, this.quality, w);
    d.noShadow = true; // Wälder werfen keine Schatten (Leistung); Bäume an den Strecken schon
    d.tile = 160;
    const rnd = new Rnd(1234);
    const n = Math.round(this.quality >= 3 ? 1700 : this.quality >= 2 ? 1150 : 550);
    const green = [0x5cbf3a, 0x4fae34, 0x6fd04a, 0x3f9a2a], autumn = [0xe8702a, 0xf0a020, 0xd84a2a, 0xffc040, 0x9cc83a];
    for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
      const x = b.minX + rnd.frac() * (b.maxX - b.minX), z = b.minZ + rnd.frac() * (b.maxZ - b.minZ);
      const h = w.heightAt(x, z);
      if (h < 1.5) continue;
      // nicht in Höhle/Zelt
      if (w.def.structures.some((st) => Math.hypot(x - st.x, z - st.z) < st.r + 8)) continue;
      if (!w.isFree(x, z, 5)) continue;
      const amb = w.ambienceAt(x, z);
      const top = amb.reduce((a, r) => (r.w > a.w ? r : a), amb[0]).theme;
      const s = 0.9 + rnd.frac() * 0.8;
      const pick = rnd.frac();
      if (h > 22) d.add(pick < 0.6 ? 'pineTree' : 'rock', x, h, z, s * (pick < 0.6 ? 1.2 : 1.6), pick < 0.6 ? 0x2f6a3a : 0x8a8296, rnd.frac() * 6);
      else if (top === 'autumn') d.add(pick < 0.75 ? 'roundTree' : 'pineTree', x, h, z, s * 1.2, pick < 0.75 ? autumn[Math.floor(rnd.frac() * autumn.length)] : 0x2f7a3a, rnd.frac() * 6);
      else if (top === 'highway') d.add(pick < 0.5 ? 'pineTree' : 'bush', x, h, z, s, pick < 0.5 ? 0x2f6a50 : 0x4a7a4a, rnd.frac() * 6);
      else if (top === 'snow') d.add(pick < 0.7 ? 'pineTree' : pick < 0.85 ? 'snowman' : 'rock', x, h, z, s * (pick < 0.7 ? 1.2 : 1), pick < 0.7 ? [0xe8f0f6, 0xd4e4ee, 0x2f6a4a][Math.floor(rnd.frac() * 3)] : pick < 0.85 ? 0xffffff : 0x9aa4b8, rnd.frac() * 6);
      else if (top === 'beach') d.add(pick < 0.6 ? 'palm' : pick < 0.8 ? 'bush' : 'umbrella', x, h, z, s, pick < 0.6 ? green[Math.floor(rnd.frac() * green.length)] : pick < 0.8 ? 0x7ccf5a : [0xe8392d, 0x2fb8c8, 0xffc21a][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
      else if (top === 'desert') d.add(pick < 0.45 ? 'cactus' : pick < 0.6 ? 'mesa' : 'rock', x, h, z, pick < 0.45 ? s * 1.2 : pick < 0.6 ? s * 0.9 : s * 1.4, pick < 0.45 ? 0x4f9a3a : 0xd9733a, rnd.frac() * 6);
      else if (top === 'volcano') d.add(pick < 0.35 ? 'pineTree' : 'rock', x, h, z, s * (pick < 0.35 ? 1.1 : 1.8), pick < 0.35 ? 0x2a2420 : 0x2e2830, rnd.frac() * 6);
      else if (top === 'candy') d.add(pick < 0.35 ? 'lollipop' : pick < 0.55 ? 'candycane' : pick < 0.7 ? 'donut' : 'gumdrop', x, h, z, s * (pick < 0.55 ? 1.3 : 1.2), pick < 0.35 ? [0xff5aa8, 0x5ab8ff, 0xffd21f, 0x8fe060][Math.floor(rnd.frac() * 4)] : pick < 0.55 ? 0xffffff : pick < 0.7 ? [0xff8ac8, 0x8a5a3a, 0xfff0f8][Math.floor(rnd.frac() * 3)] : [0xff5a5a, 0xffd21f, 0x5ad86a, 0xb47fe6][Math.floor(rnd.frac() * 4)], rnd.frac() * 6);
      else if (top === 'halloween') d.add(pick < 0.7 ? 'pineTree' : 'rock', x, h, z, s * 1.2, pick < 0.7 ? [0x1e3a2a, 0x24402e, 0x2a3a30][Math.floor(rnd.frac() * 3)] : 0x4a4656, rnd.frac() * 6);
      else if (top === 'cats') d.add(pick < 0.6 ? 'roundTree' : 'bush', x, h, z, s, [0xff9ac8, 0xb88ad8, 0x8ad86a, 0xffb8d8][Math.floor(rnd.frac() * 4)], rnd.frac() * 6);
      else if (top === 'city') d.add(pick < 0.6 ? 'palm' : 'bush', x, h, z, s, pick < 0.6 ? 0x3fa02a : 0x4a8a40, rnd.frac() * 6);
      else if (top === 'castle') d.add(pick < 0.7 ? 'pineTree' : 'rock', x, h, z, s * 1.2, pick < 0.7 ? [0x2a4a3a, 0x324e40][Math.floor(rnd.frac() * 2)] : 0x6a6478, rnd.frac() * 6);
      else if (pick < 0.55) {
        d.add('roundTree', x, h, z, s * 1.1, green[Math.floor(rnd.frac() * green.length)], rnd.frac() * 6);
        // Farne und Büschel am Stamm
        if (this.quality >= 2) for (let f = 0; f < 2; f++) {
          const a = rnd.frac() * 6.28, r = 1.4 + rnd.frac() * 1.6, fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r;
          d.add('fern', fx, w.heightAt(fx, fz), fz, 0.8 + rnd.frac() * 0.6, [0x3f9a2a, 0x4aa83a, 0x2f8a2a][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
        }
      }
      else if (pick < 0.8) d.add('bush', x, h, z, s, green[Math.floor(rnd.frac() * green.length)], rnd.frac() * 6);
      else if (pick < 0.9) d.add('mushroom', x, h, z, s * 0.9, [0xe8392d, 0xff8a1a, 0x3b7cf0][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
      else d.add('block', x, h, z, s * 1.6, [0xffc21a, 0x3b7cf0, 0xe8392d, 0x4fb833][Math.floor(rnd.frac() * 4)], rnd.frac() * 6);
      k++;
    }
    // Blumenwiesen (ohne Hindernis)
    for (let k = 0, tries = 0; k < (this.quality >= 2 ? 1500 : 350) && tries < 18000; tries++) {
      const x = b.minX + rnd.frac() * (b.maxX - b.minX), z = b.minZ + rnd.frac() * (b.maxZ - b.minZ);
      const h = w.heightAt(x, z);
      if (h < 1.5 || h > 18 || !w.isFree(x, z, 1)) continue;
      const amb = w.ambienceAt(x, z);
      if (amb.some((r) => ['snow', 'castle', 'desert', 'volcano'].includes(r.theme) && r.w > 0.4)) continue;
      d.add('flower', x, h, z, 1 + rnd.frac() * 0.5, [0xff6fa8, 0xffffff, 0xffd21f, 0xb47fe6, 0xff8a2a][Math.floor(rnd.frac() * 5)], rnd.frac() * 6);
      k++;
    }
    // Grasbüschel und Kiesel nah an den Straßen (dort schaut man hin) – Farbe nach Region
    const nT = this.quality >= 3 ? 22000 : this.quality >= 2 ? 12000 : 3000;
    const roads = w.roads;
    for (let k = 0, tries = 0; k < nT && tries < nT * 4; tries++) {
      const tr = roads[Math.floor(rnd.frac() * roads.length)];
      const i = Math.floor(rnd.frac() * tr.N);
      const side = rnd.frac() < 0.5 ? -1 : 1;
      const lat = side * (tr.hw[i] + (tr.closed ? tr.margin : 1.5) + 0.8 + rnd.frac() ** 1.6 * 45);
      const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat;
      const h = w.heightAt(x, z);
      if (h < 0.6 || !w.isFree(x, z, 0.5)) continue;
      const amb = w.ambienceAt(x, z);
      const top = amb.reduce((a, r) => (r.w > a.w ? r : a), amb[0]).theme;
      const peb = ['cave', 'castle', 'highway', 'volcano', 'desert'].includes(top) ? rnd.frac() < 0.6 : rnd.frac() < 0.08;
      if (!peb && this.quality >= 2 && rnd.frac() < 0.12 && !['snow', 'desert', 'volcano', 'cave', 'candy'].includes(top)) d.add('daisy', x, h, z, 0.8 + rnd.frac() * 0.6, 0xffffff, rnd.frac() * 6);
      else if (peb) d.add('pebble', x, h, z, 0.8 + rnd.frac() * 1.4, [0x9a92a0, 0xb0a8b4, 0x8a8296][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
      else {
        const th = getTheme(top);
        const c = new THREE.Color(rnd.frac() < 0.5 ? th.grass : th.grass2).multiplyScalar(0.78 + rnd.frac() * 0.3);
        d.add('tuft', x, h - 0.05, z, 0.8 + rnd.frac() * 0.9, c.getHex(), rnd.frac() * 6);
      }
      k++;
    }
    this.buildReeds(d, rnd);
    this.buildFences(d);
    d.build();
    this.decors.push(d);
  }

  /** Schilf an Seeufern und an der Küste (flaches Wasser gleich daneben). */
  buildReeds(d, rnd) {
    const w = this.world, b = w.def.bounds;
    const n = this.quality >= 3 ? 1400 : this.quality >= 2 ? 900 : 250;
    for (let k = 0, tries = 0; k < n && tries < n * 60; tries++) {
      const x = b.minX + rnd.frac() * (b.maxX - b.minX), z = b.minZ + rnd.frac() * (b.maxZ - b.minZ);
      const h = w.heightAt(x, z);
      if (h < -0.3 || h > 0.9) continue;
      // Wasser in der Nähe?
      let wet = false;
      for (let a = 0; a < 6 && !wet; a++) wet = w.heightAt(x + Math.cos(a) * 5, z + Math.sin(a) * 5) < -0.2;
      if (!wet || !w.isFree(x, z, 1.5) && h > 0.3) continue;
      if (w.underwaterAt(x, z) || w.surfaceAt(x, z) === 'lava') continue;
      const amb = w.ambienceAt(x, z);
      if (amb.some((r) => ['snow', 'desert', 'volcano', 'candy', 'cave'].includes(r.theme) && r.w > 0.4)) continue;
      // kleine Gruppe
      const m = 2 + Math.floor(rnd.frac() * 4);
      for (let j = 0; j < m; j++) {
        const rx = x + (rnd.frac() - 0.5) * 3, rz = z + (rnd.frac() - 0.5) * 3;
        d.add('reed', rx, Math.max(-0.4, w.heightAt(rx, rz)), rz, 0.8 + rnd.frac() * 0.6, [0x6a9a3a, 0x7aa848, 0x5a8a32][Math.floor(rnd.frac() * 3)], rnd.frac() * 6);
      }
      k += m;
    }
  }

  /** Holzzäune abschnittsweise entlang der Landstraßen (nicht an Toren, nicht über Wasser). */
  buildFences(d) {
    if (this.quality < 1) return;
    const w = this.world;
    for (const c of w.connectors) {
      const tr = c.track, step = 3;
      for (const side of [-1, 1]) {
        let prev = null;
        for (let i = 28; i < tr.N - 28; i += step) {
          const on = Math.floor((i + (side > 0 ? 40 : 0)) / 70) % 3 !== 2;   // Lücken zwischen den Abschnitten
          const lat = side * (tr.hw[i] + 3.4);
          const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat;
          const h = w.heightAt(x, z);
          const ok = on && !tr.water[i] && h > 0.7 && w.isFree(x, z, 0.3) && !w.def.structures.some((st) => Math.abs(Math.hypot(x - st.x, z - st.z) - st.r) < 14);
          if (!ok) { prev = null; continue; }
          d.add('fencePost', x, h, z, 1, 0x9a6a3a, 0);
          if (prev) d.add('fenceRail', prev.x, (prev.h + h) / 2, prev.z, 1, 0xb07a44, Math.atan2(-(z - prev.z), x - prev.x));
          prev = { x, z, h };
        }
      }
    }
  }

  update(dt, t, cam) {
    for (const d of this.decors) d.update(dt, t, cam);
    this.structureDecor?.update(dt, t, cam);
    if (this.sparkles) this.sparkles.position.x = Math.sin(t * 0.3) * 1.5;
    SHADER_TIME.value = t;
    this.life?.update(dt, t, Array.isArray(cam) ? cam[0] : cam);
    this.updateLava(t);
  }
}

function smooth(a, b, v) { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

// Himmel und Licht einer Strecke: Kuppel mit Farbverlauf (folgt der Kamera), Sonne mit Glühen, treibende
// Wolken (InstancedMesh aus Puff-Kugeln), Sonnenlicht mit Schattenkamera, die dem Spieler folgt.
// Aufbau wie src/course/view/Sky.js der Lotti-&-Greta-Welt, aber für eine frei befahrbare Strecke.

import * as THREE from 'three';
import { colorize, lin, mixc, smooth, Rnd } from '../lgw/three/world/geometry.js';

const SKY_R = 900;
const _c = new THREE.Color();

/** Farbe des Himmelsverlaufs auf Höhe t (−1 … 1) aus den Stützstellen (linear). */
function skyColor(stops, t, o) {
  let i = 0;
  while (i < stops.length - 2 && t < stops[i + 1][0]) i++;
  const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
  return mixc(c0, c1, smooth(t0, t1, t), o);
}

export class Sky {
  constructor(scene, theme, { quality = 1, sunDisc = null } = {}) {
    this.scene = scene;
    this.theme = theme;
    this.group = new THREE.Group();
    this.group.name = 'himmel';
    scene.add(this.group);
    scene.background = new THREE.Color(theme.background);
    scene.fog = new THREE.Fog(theme.fog.color, theme.fog.near, theme.fog.far);
    this.forceSun = !!sunDisc;
    this.buildDome();
    if (theme.clouds || sunDisc) this.buildClouds();
    // Licht
    this.hemi = new THREE.HemisphereLight(theme.hemi.sky, theme.hemi.ground, theme.hemi.intensity);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(theme.sun.color, theme.sun.intensity);
    this.sunDir = new THREE.Vector3(...theme.sun.dir).normalize();
    this.sun.castShadow = !!theme.shadows && quality > 0;
    const sc = this.sun.shadow.camera;
    const R = quality >= 3 ? 48 : 34;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 180;
    const ms = quality >= 3 ? 4096 : quality > 1 ? 2048 : 1024;
    this.sun.shadow.mapSize.set(ms, ms);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);
  }

  buildDome() {
    const stops = this.theme.sky.map(([t, c]) => [t, lin(c)]);
    const dome = colorize(new THREE.SphereGeometry(SKY_R, 32, 16), (p, n, o) => skyColor(stops, p.y / SKY_R, o));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
    this.dome = new THREE.Mesh(dome, mat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    this.domeGroup = new THREE.Group();
    this.domeGroup.add(this.dome);
    if (this.theme.sunDisc || this.forceSun) {
      const d = new THREE.Vector3(...this.theme.sun.dir).normalize();
      const sunPos = new THREE.Vector3(d.x, Math.max(0.12, d.y * 0.35), d.z).normalize().multiplyScalar(SKY_R * 0.9);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: 0xfff7d2, fog: false, depthWrite: false }));
      disc.position.copy(sunPos);
      disc.lookAt(0, 0, 0);
      disc.renderOrder = -9;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const c2 = canvas.getContext('2d');
      const grad = c2.createRadialGradient(64, 64, 2, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 250, 225, 0.95)');
      grad.addColorStop(0.25, 'rgba(255, 236, 180, 0.45)');
      grad.addColorStop(0.6, 'rgba(255, 220, 150, 0.12)');
      grad.addColorStop(1, 'rgba(255, 210, 140, 0)');
      c2.fillStyle = grad; c2.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false, transparent: true }));
      glow.position.copy(sunPos).multiplyScalar(0.99);
      glow.scale.setScalar(190);
      glow.renderOrder = -8;
      this.domeGroup.add(disc, glow);
      this.sunParts = [disc, glow];
    }
    this.group.add(this.domeGroup);
  }

  buildClouds() {
    const rnd = new Rnd(77);
    const puff = new THREE.SphereGeometry(1, 14, 10);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9fb8d0, emissiveIntensity: 0.35, fog: false });
    const n = 28, per = 5;
    const im = new THREE.InstancedMesh(puff, mat, n * per);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    let k = 0;
    this.cloudData = [];
    for (let i = 0; i < n; i++) {
      const a = rnd.frac() * Math.PI * 2, r = 380 + rnd.frac() * 300, y = 90 + rnd.frac() * 110;
      const size = 12 + rnd.frac() * 14;
      for (let j = 0; j < per; j++) {
        p.set(Math.cos(a) * r + (j - 2) * size * 0.9, y + Math.sin(j * 1.7) * size * 0.25, Math.sin(a) * r + rnd.frac() * size * 0.5);
        const ss = size * (j === 2 ? 1.3 : 0.75 + rnd.frac() * 0.3);
        s.set(ss, ss * 0.62, ss * 0.8);
        m.compose(p, q, s);
        im.setMatrixAt(k++, m);
      }
    }
    im.frustumCulled = false;
    this.clouds = im;
    this.domeGroup.add(im);
  }

  /**
   * Stimmung mehrerer Themen überblenden (offene Welt): weights = [{ theme (Objekt), w }]. Färbt die Kuppel neu
   * (nur wenn sich die Gewichte merklich ändern) und mischt Nebel, Hintergrund, Himmels-/Bodenlicht und Sonne.
   */
  blend(weights) {
    const key = weights.map((x) => x.w.toFixed(2)).join(',');
    const C = (hex) => _c.setHex(hex);
    const mixHex = (get) => {
      const out = new THREE.Color(0, 0, 0);
      for (const { theme, w } of weights) if (w > 0) out.add(C(get(theme)).multiplyScalar(w));
      return out;
    };
    const mixNum = (get) => weights.reduce((a, { theme, w }) => a + get(theme) * w, 0);
    this.scene.background.copy(mixHex((t) => t.background));
    this.scene.fog.color.copy(mixHex((t) => t.fog.color));
    this.scene.fog.near = mixNum((t) => t.fog.near);
    this.scene.fog.far = mixNum((t) => t.fog.far);
    this.hemi.color.copy(mixHex((t) => t.hemi.sky));
    this.hemi.groundColor.copy(mixHex((t) => t.hemi.ground));
    this.hemi.intensity = mixNum((t) => t.hemi.intensity);
    this.sun.color.copy(mixHex((t) => t.sun.color));
    this.sun.intensity = mixNum((t) => t.sun.intensity);
    const disc = mixNum((t) => (t.sunDisc ? 1 : 0));
    if (this.sunParts) for (const m of this.sunParts) m.visible = disc > 0.5;
    if (this.clouds) this.clouds.visible = mixNum((t) => (t.clouds ? 1 : 0)) > 0.4;
    if (key === this.blendKey) return;
    this.blendKey = key;
    const P = this.dome.geometry.attributes.position, Col = this.dome.geometry.attributes.color;
    const lists = weights.filter((x) => x.w > 0.01).map(({ theme, w }) => [theme.sky.map(([t, c]) => [t, lin(c)]), w]);
    const o = [0, 0, 0];
    for (let i = 0; i < P.count; i++) {
      const t = P.getY(i) / SKY_R;
      let r = 0, g = 0, b = 0, sum = 0;
      for (const [stops, w] of lists) { skyColor(stops, t, o); r += o[0] * w; g += o[1] * w; b += o[2] * w; sum += w; }
      Col.setXYZ(i, r / sum, g / sum, b / sum);
    }
    Col.needsUpdate = true;
  }

  /** Kuppel und Schattenkamera folgen dem Fokus (Spieler). */
  update(dt, camera, focus) {
    this.domeGroup.position.copy(camera.position);
    if (this.clouds) this.clouds.rotation.y += dt * 0.004;
    if (focus) {
      this.sun.target.position.copy(focus);
      this.sun.position.copy(focus).addScaledVector(this.sunDir, 70);
    }
  }

  dispose() {
    this.group.removeFromParent();
    this.hemi.removeFromParent();
    this.sun.removeFromParent();
    this.sun.target.removeFromParent();
    this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    this.sun.shadow.map?.dispose?.();
  }
}

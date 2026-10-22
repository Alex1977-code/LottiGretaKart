// Himmel und Licht einer Strecke: Kuppel mit Farbverlauf (folgt der Kamera), Sonne mit Glühen, treibende
// Wolken (InstancedMesh aus Puff-Kugeln), Sonnenlicht mit Schattenkamera, die dem Spieler folgt.
// Aufbau wie src/course/view/Sky.js der Lotti-&-Greta-Welt, aber für eine frei befahrbare Strecke.

import * as THREE from 'three';
import { colorize, lin, mixc, smooth, Rnd } from '../lgw/three/world/geometry.js';

const SKY_R = 900;

export class Sky {
  constructor(scene, theme, { quality = 1 } = {}) {
    this.scene = scene;
    this.theme = theme;
    this.group = new THREE.Group();
    this.group.name = 'himmel';
    scene.add(this.group);
    scene.background = new THREE.Color(theme.background);
    scene.fog = new THREE.Fog(theme.fog.color, theme.fog.near, theme.fog.far);
    this.buildDome();
    if (theme.clouds) this.buildClouds();
    // Licht
    this.hemi = new THREE.HemisphereLight(theme.hemi.sky, theme.hemi.ground, theme.hemi.intensity);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(theme.sun.color, theme.sun.intensity);
    this.sunDir = new THREE.Vector3(...theme.sun.dir).normalize();
    this.sun.castShadow = !!theme.shadows && quality > 0;
    const sc = this.sun.shadow.camera;
    const R = 34;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 160;
    this.sun.shadow.mapSize.set(quality > 1 ? 2048 : 1024, quality > 1 ? 2048 : 1024);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);
  }

  buildDome() {
    const stops = this.theme.sky.map(([t, c]) => [t, lin(c)]);
    const dome = colorize(new THREE.SphereGeometry(SKY_R, 32, 16), (p, n, o) => {
      const t = p.y / SKY_R;
      let i = 0;
      while (i < stops.length - 2 && t < stops[i + 1][0]) i++;
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      mixc(c0, c1, smooth(t0, t1, t), o);
    });
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
    this.dome = new THREE.Mesh(dome, mat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    this.domeGroup = new THREE.Group();
    this.domeGroup.add(this.dome);
    if (this.theme.sunDisc) {
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

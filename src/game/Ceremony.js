// Siegerehrung nach dem Grand Prix: Podest mit den drei Besten (in ihren Karts, jubelnd), Konfetti,
// Pokal über dem Sieger, langsam kreisende Kamera. Läuft wie ein Rennen in der Hauptschleife (update/render).

import * as THREE from 'three';
import { Sky } from '../world/Sky.js';
import { getTheme } from '../world/themes.js';
import { Effects } from './effects.js';
import { buildKart } from './kartModel.js';
import { createDriver } from './drivers.js';
import { Build, vcol, gold } from '../lgw/course/models/lib/kit.js';
import { getModel } from '../lgw/course/models/index.js';

const STEPS = [
  { x: 0, h: 1.6, color: 0xffc21a, label: '1' },
  { x: -3.1, h: 1.1, color: 0xd6dbe8, label: '2' },
  { x: 3.1, h: 0.75, color: 0xe0905a, label: '3' },
];

export class Ceremony {
  constructor(app, top3) {
    this.app = app;
    this.demo = true;
    this.state = 'ceremony';
    this.camera = app.camera;
    this.scene = new THREE.Scene();
    if (app.scene?.environment) { this.scene.environment = app.scene.environment; this.scene.environmentIntensity = app.envIntensity ?? 0.42; }
    this.theme = getTheme('grass');
    this.sky = new Sky(this.scene, this.theme, { quality: app.quality ?? 1 });
    this.effects = new Effects(this.scene);
    this.t = 0;
    // Boden und Podest
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: 0x72dd47, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 7.2, 48), new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.6 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01;
    this.scene.add(ring);
    const b = new Build();
    for (const s of STEPS) {
      b.box(2.9, s.h, 2.6, s.color, { p: [s.x, s.h / 2, 0] }, 0.18);
      b.box(2.95, 0.12, 2.65, 0xfff8ee, { p: [s.x, s.h - 0.02, 0] }, 0.05);
    }
    const podium = new THREE.Mesh(b.geometry(), vcol(0.4));
    podium.castShadow = true; podium.receiveShadow = true;
    this.scene.add(podium);
    // Ziffern vorn auf den Stufen
    for (const s of STEPS) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      x.font = 'bold 110px "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 12; x.strokeStyle = '#2a1e3e'; x.strokeText(s.label, 64, 70);
      x.fillStyle = '#fff8ee'; x.fillText(s.label, 64, 70);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.position.set(s.x, s.h * 0.5, 1.32);
      this.scene.add(pl);
    }
    // Die drei Besten im Kart, Blick zur Kamera (+Z)
    this.drivers = [];
    top3.forEach((def, i) => {
      if (!def) return;
      const s = STEPS[i];
      const kart = buildKart(def.kart);
      kart.root.position.set(s.x, s.h, 0.1);
      kart.root.rotation.y = -Math.PI / 2 + (i === 1 ? 0.35 : i === 2 ? -0.35 : 0);
      kart.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(kart.root);
      const driver = createDriver(null, def, kart);
      kart.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.drivers.push({ kart, driver, i });
    });
    // Goldener Pokal über dem Sieger
    const tb = new Build();
    tb.lathe([[0, 0], [0.42, 0], [0.42, 0.08], [0.16, 0.14], [0.1, 0.32], [0.08, 0.5], [0.16, 0.6], [0.42, 0.72], [0.55, 1.0], [0.6, 1.32], [0.56, 1.34], [0.5, 1.05], [0.38, 0.8], [0, 0.74]], 0xffc21a, {}, 28, 2);
    for (const sx of [-1, 1]) tb.torus(0.2, 0.045, 0xffc21a, { p: [sx * 0.6, 1.0, 0], r: [0, 0, 0] }, 8, 18);
    tb.cyl(0.46, 0.5, 0.18, 0x7a1a20, { p: [0, -0.09, 0] }, 24);
    const cup = new THREE.Mesh(tb.geometry(), gold());
    cup.castShadow = true;
    this.trophy = { root: new THREE.Group(), update() {}, dispose() {} };
    this.trophy.root.add(cup);
    const star = getModel('star');
    star.root.scale.setScalar(0.45);
    star.root.position.set(0, 1.25, 0);
    this.trophy.root.add(star.root);
    this.trophyStar = star;
    this.trophy.root.position.set(0, STEPS[0].h + 2.2, 0);
    this.trophy.root.scale.setScalar(1.2);
    this.scene.add(this.trophy.root);
    // Zuschauer
    this.crowd = [];
    const names = ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter', 'bunny_small', 'krabbelkaefer', 'fairy_spotter', 'pilzling', 'bunny_small'];
    names.forEach((n, k) => {
      const m = getModel(n);
      // Halbkreis hinter dem Podest, alle blicken zur Mitte
      const a = -Math.PI + 0.45 + (k / (names.length - 1)) * (Math.PI - 0.9);
      const x = Math.cos(a) * 7.5, z = Math.sin(a) * 5.5 - 1;
      m.root.position.set(x, 0, z);
      m.root.rotation.y = Math.atan2(z, -x);
      m.root.scale.setScalar(1.4);
      this.scene.add(m.root);
      this.crowd.push({ m, anim: n === 'fairy_spotter' ? 'cheer' : n === 'bunny_small' ? 'hop' : 'idle' });
    });
    app.audio.play('course_clear');
    this.confettiT = 0;
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    for (const d of this.drivers) {
      d.driver.update(dt, t, { speed: 0, steer: 0.25 * Math.sin(t * 2 + d.i), mood: 'cheer' });
      d.kart.update(dt, { speed: 0, steer: 0, t });
      d.kart.root.position.y = STEPS[d.i].h + Math.max(0, Math.sin(t * 5 + d.i * 1.3)) * (d.i === 0 ? 0.25 : 0.12);
    }
    this.trophyStar.update(dt, 'idle');
    this.trophy.root.rotation.y = t * 1.2;
    for (const c of this.crowd) c.m.update(dt, c.anim);
    this.confettiT -= dt;
    if (this.confettiT <= 0) { this.confettiT = 0.6; this.effects.confetti(new THREE.Vector3(0, 0, 0), 30, 5); }
    this.effects.update(dt, this.app.viewH ?? 800);
    // Kamera kreist langsam vor dem Podest
    // Podest links im Bild (rechts steht die Wertung)
    const a = Math.PI / 2 + 0.4 * Math.sin(t * 0.25);
    this.camera.position.set(Math.cos(a) * 11 + 2.2, 3.6 + 0.4 * Math.sin(t * 0.4), Math.sin(a) * 11);
    this.camera.lookAt(2.6, 2.0, 0);
    if (this.camera.fov !== 50) { this.camera.fov = 50; this.camera.updateProjectionMatrix(); }
    this.sky.update(dt, this.camera, new THREE.Vector3(0, 0, 0));
  }

  render(renderer) { renderer.render(this.scene, this.camera); }

  dispose() {
    for (const d of this.drivers) d.driver.dispose();
    this.trophyStar.dispose();
    for (const c of this.crowd) c.m.dispose();
    this.effects.dispose();
    this.sky.dispose();
  }
}

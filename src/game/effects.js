// Partikel-Effekte mit zwei Punktwolken (je ein Zeichenaufruf): additiv (Funken, Glühen, Turbo, Sterne) und
// normal gemischt (Staub, Rauch, Konfetti). Eigener kleiner Shader: Größe, Farbe und Deckkraft je Partikel.

import * as THREE from 'three';
import { glowTexture } from '../lgw/course/models/lib/kit.js';

const VS = `
attribute float size;
attribute vec4 rgba;
varying vec4 vC;
uniform float scale;
void main() {
  vC = rgba;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FS = `
uniform sampler2D map;
varying vec4 vC;
void main() {
  vec4 t = texture2D(map, gl_PointCoord);
  gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a);
  if (gl_FragColor.a < 0.01) discard;
}`;

let softTex = null;
function softTexture() {
  if (softTex) return softTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  softTex = new THREE.CanvasTexture(c);
  return softTex;
}

class Cloud {
  constructor(scene, max, additive) {
    this.max = max;
    this.n = 0;          // lebende Teilchen (vorn in p)
    this.oldest = 0;
    this.drawn = 0;
    this.p = []; // { x,y,z, vx,vy,vz, life, age, size, size1, r,g,b, a, drag, grav, floor, fadeIn }
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.siz = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('rgba', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.siz, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS,
      uniforms: { map: { value: additive ? glowTexture() : softTexture() }, scale: { value: 400 } },
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 5 : 4;
    scene.add(this.points);
  }

  /**
   * Partikel ausstoßen. Teilchen liegen in einem festen Vorrat (gleiche Objekte werden wiederverwendet – erzeugt
   * keinen Speichermüll); ist er voll, ersetzt das neue das älteste.
   */
  emit(x, y, z, vx, vy, vz, life, size, size1, grav, drag, a, col, floor = NaN, fadeIn = false) {
    let q;
    if (this.n < this.max) {
      q = this.p[this.n] ?? (this.p[this.n] = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, age: 0, size: 1, size1: 1, r: 1, g: 1, b: 1, a: 1, drag: 0, grav: 0, floor: NaN, fadeIn: false });
      this.n++;
    } else {
      q = this.p[this.oldest];
      this.oldest = (this.oldest + 1) % this.max;
    }
    q.x = x; q.y = y; q.z = z; q.vx = vx; q.vy = vy; q.vz = vz; q.life = life; q.age = 0;
    q.size = size; q.size1 = size1; q.grav = grav; q.drag = drag; q.a = a;
    q.r = col.r; q.g = col.g; q.b = col.b; q.floor = floor; q.fadeIn = fadeIn;
  }

  update(dt, viewH) {
    this.mat.uniforms.scale.value = viewH * 0.9;
    const list = this.p;
    let w = 0;
    // lebende Teilchen nach vorn sortieren (Tausch statt neuer Liste)
    for (let r = 0; r < this.n; r++) {
      const q = list[r];
      q.age += dt;
      if (q.age >= q.life) continue;
      q.vy -= q.grav * dt;
      const dr = Math.exp(-q.drag * dt);
      q.vx *= dr; q.vy *= dr; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < q.floor) { q.y = q.floor; q.vy *= -0.3; q.vx *= 0.6; q.vz *= 0.6; }
      if (w !== r) { list[r] = list[w]; list[w] = q; }
      w++;
    }
    this.n = w;
    if (this.oldest >= w) this.oldest = 0;
    for (let i = 0; i < w; i++) {
      const q = list[i], k = q.age / q.life;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      const fade = q.fadeIn ? Math.min(1, k * 6) * (1 - k) : 1 - k * k;
      this.col[i * 4] = q.r; this.col[i * 4 + 1] = q.g; this.col[i * 4 + 2] = q.b; this.col[i * 4 + 3] = q.a * fade;
      this.siz[i] = q.size + (q.size1 - q.size) * k;
    }
    this.geo.setDrawRange(0, w);
    if (w > 0 || this.drawn > 0) {
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.rgba.needsUpdate = true;
      this.geo.attributes.size.needsUpdate = true;
    }
    this.drawn = w;
  }

  dispose() { this.points.removeFromParent(); this.geo.dispose(); this.mat.dispose(); }
}

const C = new THREE.Color();
const COLS = new Map();
/** Farbe als { r, g, b } (zwischengespeichert je Farbwert). */
const rgb = (hex) => { let c = COLS.get(hex); if (!c) { C.setHex(hex); c = { r: C.r, g: C.g, b: C.b }; COLS.set(hex, c); } return c; };
const HSL = { r: 1, g: 1, b: 1 }, BUBBLE = { r: 0.85, g: 0.95, b: 1 }, SPRAY = { r: 0.86, g: 0.9, b: 0.95 };
const R = (a, b) => a + Math.random() * (b - a);

export class Effects {
  constructor(scene) {
    this.glow = new Cloud(scene, 700, true);
    this.soft = new Cloud(scene, 600, false);
  }

  /** Funken an der Bande (Normale nx,nz zeigt zur Strecke). */
  sparks(pos, nx = 0, nz = 0, color = 0xffd060, n = 10) {
    const c = rgb(color);
    for (let i = 0; i < n; i++) {
      this.glow.emit(pos.x, pos.y + 0.4, pos.z, nx * R(2, 6) + R(-3, 3), R(1.5, 5), nz * R(2, 6) + R(-3, 3), R(0.25, 0.5), R(0.25, 0.45), 0.05, 14, 0, 1, c);
    }
  }

  /** Drift-Funken / Turbo-Glut hinter dem Kart. */
  trail(x, y, z, color, size = 0.5) {
    const c = rgb(color);
    this.glow.emit(x + R(-0.1, 0.1), y + R(0, 0.1), z + R(-0.1, 0.1), R(-1, 1), R(0.5, 2.5), R(-1, 1), R(0.15, 0.3), size, 0.05, 6, 0, 1, c);
  }

  /** Staub auf der Wiese / beim Bremsen. */
  dust(x, y, z, color = 0xe8d8b0, size = 0.9) {
    const c = rgb(color);
    this.soft.emit(x + R(-0.2, 0.2), y + 0.1, z + R(-0.2, 0.2), R(-0.6, 0.6), R(0.4, 1.4), R(-0.6, 0.6), R(0.4, 0.8), size * 0.5, size * 1.6, 0, 1.5, 0.55, c);
  }

  /** Gischt hinter den Rädern bei Regen (zart, verweht schnell). */
  spray(x, y, z, size = 0.6) {
    this.soft.emit(x + R(-0.2, 0.2), y + 0.1, z + R(-0.2, 0.2), R(-0.5, 0.5), R(0.6, 1.6), R(-0.5, 0.5), R(0.25, 0.45), size * 0.5, size * 1.4, 2, 2, 0.32, SPRAY);
  }

  /** Luftblasen unter Wasser: steigen auf und wackeln. */
  bubble(x, y, z, size = 0.35) {
    this.soft.emit(x + R(-0.3, 0.3), y + 0.2, z + R(-0.3, 0.3), R(-0.3, 0.3), R(1.6, 3.2), R(-0.3, 0.3), R(0.9, 1.6), size * 0.6, size * 1.2, 0, 0.6, 0.7, BUBBLE);
  }

  /** Bitcoins fliegen davon (Treffer). */
  coinBurst(pos, n = 2) {
    const c = rgb(0xf7931a);
    for (let i = 0; i < n * 4; i++) {
      this.glow.emit(pos.x, pos.y + 0.8, pos.z, R(-4, 4), R(4, 8), R(-4, 4), 0.8, 0.6, 0.3, 18, 0, 1, c, pos.y + 0.1);
    }
  }

  /** Funkeln (Kiste zerplatzt, Münze gesammelt). */
  sparkle(pos, color = 0xfff2a0, n = 14, spread = 4) {
    const c = rgb(color);
    for (let i = 0; i < n; i++) {
      this.glow.emit(pos.x, pos.y, pos.z, R(-spread, spread), R(1, spread + 2), R(-spread, spread), R(0.35, 0.7), R(0.35, 0.7), 0.05, 5, 2.5, 1, c);
    }
  }

  /** Explosion (Kickbombe, Zauberkugel): Blitz, Feuerball, Rauch. */
  explosion(pos, radius = 5) {
    const flash = rgb(0xfff4c0), fire = rgb(0xff8a2a), smoke = rgb(0xc8c0d4);
    this.glow.emit(pos.x, pos.y + 1, pos.z, 0, 0, 0, 0.3, radius * 1.2, radius * 3, 0, 0, 1, flash);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, s = R(2, radius * 1.6);
      this.glow.emit(pos.x, pos.y + 0.6, pos.z, Math.cos(a) * s, R(1, 7), Math.sin(a) * s, R(0.35, 0.7), R(1.2, 2.2), 0.3, 0, 3, 1, fire);
    }
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, s = R(0.5, radius * 0.6);
      this.soft.emit(pos.x + Math.cos(a) * s * 0.4, pos.y + R(0.3, 1.2), pos.z + Math.sin(a) * s * 0.4, Math.cos(a) * s, R(0.5, 2), Math.sin(a) * s, R(0.8, 1.4), R(1.0, 1.8), R(2.2, 3.2), 0, 2.2, 0.45, smoke);
    }
  }

  /** Wasserwelle: Tropfen und Gischt fliegen in Richtung (dx, dz) und fallen herab (Orca-Show). */
  splash(pos, dx = 0, dz = 0, n = 70, reach = 14) {
    const drop = rgb(0x9ad8ff), foam = rgb(0xeaf8ff), deep = rgb(0x3a9ae8);
    for (let i = 0; i < n; i++) {
      const s = R(0.3, 1) * reach, a = R(-0.5, 0.5);
      const vx = (dx * Math.cos(a) - dz * Math.sin(a)) * s * 0.75, vz = (dz * Math.cos(a) + dx * Math.sin(a)) * s * 0.75;
      const c = i % 4 === 0 ? foam : i % 4 === 1 ? drop : deep;
      this.soft.emit(pos.x + R(-1.5, 1.5), pos.y + R(0, 2), pos.z + R(-1.5, 1.5), vx, R(6, 13), vz, R(1.0, 1.6), R(0.5, 1.2), R(0.2, 0.6), 16, 0, 0.85, c, pos.y - 1.2);
    }
    // aufsteigende Gischtwolke
    for (let i = 0; i < 14; i++) this.soft.emit(pos.x + R(-2, 2), pos.y + R(0.5, 3), pos.z + R(-2, 2), dx * R(1, 4), R(1, 3), dz * R(1, 4), R(0.8, 1.3), R(1.2, 2), R(2.5, 3.5), 0, 1.8, 0.3, foam);
  }

  /** Tropfen von einem nassen Kart. */
  drip(x, y, z) {
    const c = rgb(0xaee0ff);
    this.soft.emit(x + R(-0.5, 0.5), y + R(0.3, 1), z + R(-0.5, 0.5), R(-0.4, 0.4), R(-0.5, 0.8), R(-0.4, 0.4), R(0.3, 0.5), R(0.15, 0.3), 0.08, 12, 0, 0.8, c);
  }

  /** Konfetti (Zieleinlauf, Siegerehrung). */
  confetti(pos, n = 60, spread = 6) {
    const cols = [0xe83a30, 0x3b7cf0, 0x4fb833, 0xffc21a, 0xf0609f, 0xb47fe6];
    for (let i = 0; i < n; i++) {
      const c = rgb(cols[i % cols.length]);
      this.soft.emit(pos.x + R(-spread, spread), pos.y + R(4, 9), pos.z + R(-spread, spread), R(-1.5, 1.5), R(-1, 2), R(-1.5, 1.5), R(2.5, 4), R(0.18, 0.3), 0.18, 2.2, 1.2, 1, c);
    }
  }

  /** Regenbogen-Glitzern (Funkelstern). */
  rainbow(pos) {
    C.setHSL(Math.random(), 1, 0.6);
    HSL.r = C.r; HSL.g = C.g; HSL.b = C.b;
    this.glow.emit(pos.x + R(-0.8, 0.8), pos.y + R(0.2, 1.4), pos.z + R(-0.8, 0.8), R(-0.5, 0.5), R(0.5, 1.5), R(-0.5, 0.5), 0.5, 0.5, 0.05, 0, 0, 1, HSL);
  }

  update(dt, viewH) {
    this.glow.update(dt, viewH);
    this.soft.update(dt, viewH);
  }

  dispose() { this.glow.dispose(); this.soft.dispose(); }
}

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
    this.n = 0;
    this.p = []; // { x,y,z, vx,vy,vz, life, age, size, size1, r,g,b, a, drag, grav }
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

  spawn(o) {
    if (this.p.length >= this.max) this.p.shift();
    this.p.push({ age: 0, drag: 0, grav: 0, a: 1, size1: o.size, ...o });
  }

  update(dt, viewH) {
    this.mat.uniforms.scale.value = viewH * 0.9;
    const list = this.p;
    let w = 0;
    for (let r = 0; r < list.length; r++) {
      const q = list[r];
      q.age += dt;
      if (q.age >= q.life) continue;
      q.vy -= q.grav * dt;
      const dr = Math.exp(-q.drag * dt);
      q.vx *= dr; q.vy *= dr; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.floor !== undefined && q.y < q.floor) { q.y = q.floor; q.vy *= -0.3; q.vx *= 0.6; q.vz *= 0.6; }
      list[w++] = q;
    }
    list.length = w;
    for (let i = 0; i < w; i++) {
      const q = list[i], k = q.age / q.life;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      const fade = q.fadeIn ? Math.min(1, k * 6) * (1 - k) : 1 - k * k;
      this.col[i * 4] = q.r; this.col[i * 4 + 1] = q.g; this.col[i * 4 + 2] = q.b; this.col[i * 4 + 3] = q.a * fade;
      this.siz[i] = q.size + (q.size1 - q.size) * k;
    }
    this.geo.setDrawRange(0, w);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.rgba.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }

  dispose() { this.points.removeFromParent(); this.geo.dispose(); this.mat.dispose(); }
}

const C = new THREE.Color();
const rgb = (hex) => { C.setHex(hex); return { r: C.r, g: C.g, b: C.b }; };
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
      this.glow.spawn({ x: pos.x, y: pos.y + 0.4, z: pos.z, vx: nx * R(2, 6) + R(-3, 3), vy: R(1.5, 5), vz: nz * R(2, 6) + R(-3, 3), life: R(0.25, 0.5), size: R(0.25, 0.45), size1: 0.05, grav: 14, ...c });
    }
  }

  /** Drift-Funken / Turbo-Glut hinter dem Kart. */
  trail(x, y, z, color, size = 0.5) {
    const c = rgb(color);
    this.glow.spawn({ x: x + R(-0.1, 0.1), y: y + R(0, 0.1), z: z + R(-0.1, 0.1), vx: R(-1, 1), vy: R(0.5, 2.5), vz: R(-1, 1), life: R(0.15, 0.3), size, size1: 0.05, grav: 6, ...c });
  }

  /** Staub auf der Wiese / beim Bremsen. */
  dust(x, y, z, color = 0xe8d8b0, size = 0.9) {
    const c = rgb(color);
    this.soft.spawn({ x: x + R(-0.2, 0.2), y: y + 0.1, z: z + R(-0.2, 0.2), vx: R(-0.6, 0.6), vy: R(0.4, 1.4), vz: R(-0.6, 0.6), life: R(0.4, 0.8), size: size * 0.5, size1: size * 1.6, drag: 1.5, a: 0.55, ...c });
  }

  /** Bitcoins fliegen davon (Treffer). */
  coinBurst(pos, n = 2) {
    const c = rgb(0xf7931a);
    for (let i = 0; i < n * 4; i++) {
      this.glow.spawn({ x: pos.x, y: pos.y + 0.8, z: pos.z, vx: R(-4, 4), vy: R(4, 8), vz: R(-4, 4), life: 0.8, size: 0.6, size1: 0.3, grav: 18, floor: pos.y + 0.1, ...c });
    }
  }

  /** Funkeln (Kiste zerplatzt, Münze gesammelt). */
  sparkle(pos, color = 0xfff2a0, n = 14, spread = 4) {
    const c = rgb(color);
    for (let i = 0; i < n; i++) {
      this.glow.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: R(-spread, spread), vy: R(1, spread + 2), vz: R(-spread, spread), life: R(0.35, 0.7), size: R(0.35, 0.7), size1: 0.05, drag: 2.5, grav: 5, ...c });
    }
  }

  /** Explosion (Kickbombe, Zauberkugel): Blitz, Feuerball, Rauch. */
  explosion(pos, radius = 5) {
    const flash = rgb(0xfff4c0), fire = rgb(0xff8a2a), smoke = rgb(0x6a6478);
    this.glow.spawn({ x: pos.x, y: pos.y + 1, z: pos.z, vx: 0, vy: 0, vz: 0, life: 0.3, size: radius * 1.2, size1: radius * 3, ...flash });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, s = R(2, radius * 1.6);
      this.glow.spawn({ x: pos.x, y: pos.y + 0.6, z: pos.z, vx: Math.cos(a) * s, vy: R(1, 7), vz: Math.sin(a) * s, life: R(0.35, 0.7), size: R(1.2, 2.2), size1: 0.3, drag: 3, ...fire });
    }
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, s = R(0.5, radius * 0.6);
      this.soft.spawn({ x: pos.x + Math.cos(a) * s * 0.4, y: pos.y + R(0.5, 2), z: pos.z + Math.sin(a) * s * 0.4, vx: Math.cos(a) * s, vy: R(1, 3), vz: Math.sin(a) * s, life: R(1, 1.8), size: R(1.5, 2.5), size1: R(3.5, 5), drag: 1.8, a: 0.6, ...smoke });
    }
  }

  /** Konfetti (Zieleinlauf, Siegerehrung). */
  confetti(pos, n = 60, spread = 6) {
    const cols = [0xe83a30, 0x3b7cf0, 0x4fb833, 0xffc21a, 0xf0609f, 0xb47fe6];
    for (let i = 0; i < n; i++) {
      const c = rgb(cols[i % cols.length]);
      this.soft.spawn({ x: pos.x + R(-spread, spread), y: pos.y + R(4, 9), z: pos.z + R(-spread, spread), vx: R(-1.5, 1.5), vy: R(-1, 2), vz: R(-1.5, 1.5), life: R(2.5, 4), size: R(0.18, 0.3), size1: 0.18, grav: 2.2, drag: 1.2, ...c });
    }
  }

  /** Regenbogen-Glitzern (Funkelstern). */
  rainbow(pos) {
    C.setHSL(Math.random(), 1, 0.6);
    this.glow.spawn({ x: pos.x + R(-0.8, 0.8), y: pos.y + R(0.2, 1.4), z: pos.z + R(-0.8, 0.8), vx: R(-0.5, 0.5), vy: R(0.5, 1.5), vz: R(-0.5, 0.5), life: 0.5, size: 0.5, size1: 0.05, r: C.r, g: C.g, b: C.b });
  }

  update(dt, viewH) {
    this.glow.update(dt, viewH);
    this.soft.update(dt, viewH);
  }

  dispose() { this.glow.dispose(); this.soft.dispose(); }
}

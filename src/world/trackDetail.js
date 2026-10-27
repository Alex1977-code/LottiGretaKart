// Strecken-Details im Stil von Mario Kart: Pfeilschilder außen an engen Kurven, Reifenspuren auf der Ideallinie
// in Kurven, bunte Wimpelketten über den Geraden. Alles als Instanzen (wenige Zeichenaufrufe) für alle Strecken.
// Dazu Randlicht (Fresnel) für senkrechte Flächen – Figuren, Karts, Bäume und Bauten heben sich ab wie in MK8.

import * as THREE from 'three';
import { canvasTexture } from '../lgw/course/models/lib/kit.js';

/** Randlicht in alle Standard-/Lambert-Materialien einbauen (einmal beim Start, vor dem ersten Übersetzen). */
export function installRimLight() {
  if (THREE.ShaderChunk.emissivemap_fragment.includes('lgkRim')) return;
  // Glanzpunkte begrenzen (und ungültige Werte abfangen): einzelne überhelle Pixel würden im Leuchten (Bloom)
  // als blinkende Flecken erscheinen
  THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace('#ifdef OPAQUE',
    'outgoingLight = any(isnan(outgoingLight)) ? vec3(0.0) : min(outgoingLight, vec3(6.0));\n#ifdef OPAQUE');
  THREE.ShaderChunk.emissivemap_fragment += /* glsl */ `
  {
    // lgkRim: helle Kante an senkrechten Flächen (nicht am Boden und nicht an Dächern)
    vec3 lgkV = normalize(vViewPosition);
    float lgkF = pow(1.0 - clamp(dot(normal, lgkV), 0.0, 1.0), 3.0);
    vec3 lgkWN = (vec4(normal, 0.0) * viewMatrix).xyz;
    float lgkSide = 1.0 - smoothstep(0.35, 0.85, abs(lgkWN.y));
    float lgkAmb = 1.0;
    #if NUM_HEMI_LIGHTS > 0
      lgkAmb = clamp(dot(hemisphereLights[0].skyColor, vec3(0.3, 0.59, 0.11)) / 0.75, 0.2, 1.0);   // nachts schwächer
    #endif
    totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0, 0.97, 0.92), 0.55) * lgkF * 0.3 * lgkSide * lgkAmb;
  }
`;
}

function chevronTexture(dir) {
  return canvasTexture(`lgk:chevron:${dir}`, 256, 96, (x, w, h) => {
    x.fillStyle = '#e8202a'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, w, 7); x.fillRect(0, h - 7, w, 7);
    for (let k = 0; k < 3; k++) {
      const cx = 52 + k * 76;
      x.beginPath();
      if (dir > 0) { x.moveTo(cx - 22, 16); x.lineTo(cx + 2, 16); x.lineTo(cx + 28, 48); x.lineTo(cx + 2, 80); x.lineTo(cx - 22, 80); x.lineTo(cx + 4, 48); }
      else { x.moveTo(cx + 22, 16); x.lineTo(cx - 2, 16); x.lineTo(cx - 28, 48); x.lineTo(cx - 2, 80); x.lineTo(cx + 22, 80); x.lineTo(cx - 4, 48); }
      x.closePath(); x.fill();
    }
  });
}

/** Ist u in der Nähe eines Bauwerks über der Fahrbahn (Tunnel, Fähre, Spukhaus …)? */
const nearOver = (tr, u, du) => (tr.overRoad ?? []).some((o) => { let d = Math.abs(o - u); d = Math.min(d, 1 - d); return d < du; });

export function buildTrackDetails(group, world, quality = 2) {
  const boardsR = [], boardsL = [], posts = [], skids = [], poles = [], flags = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const flagCols = [0xe8392d, 0xffc21a, 0x3b7cf0, 0x4fb833, 0xff6aa8, 0xffffff].map((c) => new THREE.Color(c));
  for (const c of world.courses) {
    const tr = c.track, N = tr.N;
    const lifted = (i) => (tr.hasLift && Math.abs(tr.lift[i]) > 0.3) || (tr.hasDive && tr.lift[i] < -0.3);
    // ---- Pfeilschilder außen an engen Kurven
    let lastSign = -1e9;
    for (let i = 0; i < N; i += 3) {
      const cv = tr.curv[i];
      if (Math.abs(cv) < 0.032 || lifted(i) || nearOver(tr, i / N, 0.03)) continue;
      if (i - lastSign < 10) continue;
      const side = -Math.sign(cv);   // außen
      if (tr.inGap(side, i)) continue;
      const lat = side * (tr.wallAt(i) + 1.3);
      const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat, y = world.heightAt(x, z);
      if (y < 0.2) continue;
      lastSign = i;
      // Tafel schaut zur Fahrbahn; Pfeile zeigen in Fahrtrichtung
      const nx = tr.tz[i] * side, nz = -tr.tx[i] * side;
      const yaw = Math.atan2(nx, nz);
      const xAxisX = Math.cos(yaw), xAxisZ = -Math.sin(yaw);
      const dir = xAxisX * tr.tx[i] + xAxisZ * tr.tz[i] > 0 ? 1 : -1;
      (dir > 0 ? boardsR : boardsL).push([x, y + 1.85, z, yaw]);
      for (const o of [-1.35, 1.35]) posts.push([x + xAxisX * o, y, z + xAxisZ * o]);
    }
    // ---- Reifenspuren innen in Kurven (zwei Spuren)
    if (quality >= 2) for (let i = 0; i < N; i += 2) {
      const cv = tr.curv[i];
      if (Math.abs(cv) < 0.022 || nearOver(tr, i / N, 0.01)) continue;
      if ((i * 7) % 11 < 3) continue;   // nicht durchgehend
      const inner = Math.sign(cv);
      for (const off of [-0.65, 0.65]) {
        const lat = inner * tr.hw[i] * 0.42 + off;
        const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat;
        const y = tr.hasLift || tr.hasDive ? tr.roadY(i, x, z) : world.heightAt(x, z);
        skids.push([x, y + 0.035, z, Math.atan2(-tr.tz[i], tr.tx[i])]);
      }
    }
    // ---- Wimpelketten über drei Geraden
    const cand = [];
    for (let i = 0; i < N; i += 10) if (Math.abs(tr.curv[i]) < 0.006 && !lifted(i) && !nearOver(tr, i / N, 0.04) && i / N > 0.05) cand.push(i);
    const picks = [];
    for (const i of cand) if (picks.every((j) => Math.min(Math.abs(i - j), N - Math.abs(i - j)) > N / 5)) picks.push(i);
    for (const i of picks.slice(0, 3)) {
      const W = tr.wallAt(i) + 1.0, ends = [];
      for (const side of [-1, 1]) {
        const x = tr.px[i] - tr.tz[i] * side * W, z = tr.pz[i] + tr.tx[i] * side * W;
        const y = world.heightAt(x, z);
        ends.push([x, y, z]);
        poles.push([x, y, z]);
      }
      const [a, b] = ends, H = 7.2, n = Math.round((W * 2) / 1.1);
      for (let k = 0; k <= n; k++) {
        const f = k / n, sag = Math.sin(f * Math.PI) * 1.3;
        flags.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + H - sag, a[2] + (b[2] - a[2]) * f, Math.atan2(-tr.tz[i], tr.tx[i]), k]);
      }
    }
  }
  const inst = (geo, mat, list, set, name, shadow = false) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((v, k) => set(im, v, k));
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = shadow; im.receiveShadow = true; im.name = name;
    im.computeBoundingSphere();
    group.add(im);
    return im;
  };
  const board = new THREE.PlaneGeometry(3.3, 1.2);
  for (const [list, dir] of [[boardsR, 1], [boardsL, -1]]) {
    const mat = new THREE.MeshStandardMaterial({ map: chevronTexture(dir), roughness: 0.6, side: THREE.DoubleSide, emissive: 0x401010, emissiveIntensity: 0.4 });
    mat.map.colorSpace = THREE.SRGBColorSpace;
    inst(board, mat, list, (im, [x, y, z, yaw], k) => { e.set(0, yaw, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'kurvenschilder', true);
  }
  inst(new THREE.CylinderGeometry(0.08, 0.08, 1.9, 6).translate(0, 0.95, 0), new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.5 }), posts,
    (im, [x, y, z], k) => { m.compose(p.set(x, y, z), q.identity(), s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'schilderpfosten');
  const skidMat = new THREE.MeshBasicMaterial({ color: 0x1a1820, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  inst(new THREE.PlaneGeometry(2.3, 0.22).rotateX(-Math.PI / 2), skidMat, skids,
    (im, [x, y, z, yaw], k) => { e.set(0, yaw, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'reifenspuren');
  inst(new THREE.CylinderGeometry(0.1, 0.13, 7.6, 8).translate(0, 3.8, 0), new THREE.MeshStandardMaterial({ color: 0xf4f4f8, roughness: 0.4, metalness: 0.2 }), poles,
    (im, [x, y, z], k) => { m.compose(p.set(x, y, z), q.identity(), s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'wimpelmasten', true);
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.38, 0, 0, 0.38, 0, 0, 0, -0.75, 0], 3));
  tri.computeVertexNormals();
  const fl = inst(tri, new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }), flags,
    (im, [x, y, z, yaw, k2], k) => { e.set(0, yaw + Math.PI / 2, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.set(1, 1, 1)); im.setMatrixAt(k, m); im.setColorAt(k, flagCols[k2 % flagCols.length]); }, 'wimpel');
  if (fl) fl.instanceColor.needsUpdate = true;
}

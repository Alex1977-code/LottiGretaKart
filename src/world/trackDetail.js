// Strecken-Details im Stil von Mario Kart: Pfeilschilder außen an engen Kurven, Reifenspuren auf der Ideallinie
// in Kurven, bunte Wimpelketten über den Geraden. Alles als Instanzen (wenige Zeichenaufrufe) für alle Strecken.
// Dazu Randlicht (Fresnel) für senkrechte Flächen – Figuren, Karts, Bäume und Bauten heben sich ab wie in MK8.

import * as THREE from 'three';
import { canvasTexture, Build } from '../lgw/course/models/lib/kit.js';

/** Randlicht in alle Standard-/Lambert-Materialien einbauen (einmal beim Start, vor dem ersten Übersetzen). */
export function installRimLight() {
  if (THREE.ShaderChunk.emissivemap_fragment.includes('lgkRim')) return;
  // Glanzpunkte begrenzen (und ungültige Werte abfangen): einzelne überhelle Pixel würden im Leuchten (Bloom)
  // als blinkende Flecken erscheinen
  THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace('#ifdef OPAQUE',
    // (Erkennung über die Bits: isnan() entfällt auf dem iPhone durch die Optimierung des Shader-Übersetzers)
    'outgoingLight = any(equal(floatBitsToUint(outgoingLight) & 0x7f800000u, uvec3(0x7f800000u))) ? vec3(0.0) : clamp(outgoingLight, 0.0, 6.0);\n#ifdef OPAQUE');
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

/** Werbetafeln am Streckenrand (eigene Marken der Lotti-&-Greta-Welt): [Text, Grund, Schrift, Zeichen]. */
const ADS = [
  ['LOTTI', '#e83a30', '#ffffff', '★'], ['GRETA', '#4fb833', '#ffffff', '♥'], ['FUNKEL-KISTE', '#ffc21a', '#3a2a10', '✦'],
  ['TURBO-BEERE', '#7a3ad8', '#ffffff', '●'], ['KART-CUP', '#2a6ae8', '#ffe23a', '⚑'], ['PFLAUME', '#f4f1f8', '#7a3ad8', '♦'],
];
function adTexture(k) {
  const [text, bg, fg, sign] = ADS[k];
  return canvasTexture(`lgk:ad:${k}`, 512, 128, (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    // schräge Zierbalken an beiden Enden und ein Rahmen
    x.fillStyle = fg; x.globalAlpha = 0.22;
    for (const ox of [-10, 30, w - 90, w - 50]) { x.beginPath(); x.moveTo(ox, h); x.lineTo(ox + 40, 0); x.lineTo(ox + 62, 0); x.lineTo(ox + 22, h); x.closePath(); x.fill(); }
    x.globalAlpha = 1;
    x.lineWidth = 8; x.strokeStyle = fg; x.strokeRect(4, 4, w - 8, h - 8);
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 66px "Lilita One", "Trebuchet MS", sans-serif';
    x.fillText(`${sign} ${text} ${sign}`, w / 2, h / 2 + 4, w - 150);
  });
}

/** Ist u in der Nähe eines Bauwerks über der Fahrbahn (Tunnel, Fähre, Spukhaus …)? */
const nearOver = (tr, u, du) => (tr.overRoad ?? []).some((o) => { let d = Math.abs(o - u); d = Math.min(d, 1 - d); return d < du; });

export function buildTrackDetails(group, world, quality = 2) {
  const boardsR = [], boardsL = [], posts = [], skids = [], poles = [], flags = [], tyres = [], adPosts = [];
  const ads = ADS.map(() => []);
  // Felswände und Tunnel (Leveldesign): dort stehen keine Reifenstapel und Tafeln
  const inRock = (x, z) => { const g = world.hf; if (!g?.cl) return false; const ix = Math.round((x - g.x0) / g.cell), iz = Math.round((z - g.z0) / g.cell); return ix >= 0 && iz >= 0 && ix < g.nx && iz < g.nz && g.cl[iz * g.nx + ix] > 0.15; };
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const flagCols = [0xe8392d, 0xffc21a, 0x3b7cf0, 0x4fb833, 0xff6aa8, 0xffffff].map((c) => new THREE.Color(c));
  for (const c of world.courses) {
    const tr = c.track, N = tr.N;
    const lifted = (i) => (tr.hasLift && Math.abs(tr.lift[i]) > 0.3) || (tr.hasDive && tr.lift[i] < -0.3) || !!tr.flight?.[i] || tr.elev?.[i] < -0.3;   // (auch keine Schilder über Flugstrecken und unter Wasser)
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
    // ---- Reifenstapel außen hinter der Bande in engen Kurven (rot-weiß, wie an der Kartbahn)
    if (quality >= 2 && !c.def.noWalls && !c.theme?.indoor) {
      let n = 0;
      for (let i = 0; i < N && n < 150; i++) {
        const cv = tr.curv[i];
        if (Math.abs(cv) < 0.03 || lifted(i) || nearOver(tr, i / N, 0.02)) continue;
        const side = -Math.sign(cv);
        if (tr.inGap(side, i)) continue;
        const lat = side * (tr.wallAt(i) + 1.0);
        const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat, y = world.heightAt(x, z);
        if (y < 0.2 || inRock(x, z) || Math.abs(y - tr.py[i]) > 1.2) continue;
        tyres.push([x, y, z, (i * 2.4) % 6.28, i % 2]);
        n++;
      }
    }
    // ---- Werbetafeln hinter der Bande an den Geraden (abwechselnd links und rechts)
    if (!c.def.noWalls && !c.def.rainbow && !c.theme?.indoor) {
      let last = -1e9, n = 0;
      for (let i = Math.round(N * 0.04); i < N * 0.96 && n < 16; i += 2) {
        if (Math.abs(tr.curv[i]) > 0.01 || lifted(i) || nearOver(tr, i / N, 0.03) || i - last < 22) continue;
        const side = n % 2 ? 1 : -1;
        if (tr.inGap(side, i) || tr.inGap(side, tr.wrap(i + 4)) || tr.inGap(side, tr.wrap(i - 4))) continue;
        const lat = side * (tr.wallAt(i) + 1.7);
        const x = tr.px[i] - tr.tz[i] * lat, z = tr.pz[i] + tr.tx[i] * lat, y = world.heightAt(x, z);
        if (y < 0.3 || inRock(x, z) || Math.abs(y - tr.py[i]) > 1.0 || !world.isFree(x, z, 0.6)) continue;
        last = i;
        // Tafel schaut zur Fahrbahn (Normale zeigt nach innen)
        const nx = tr.tz[i] * side, nz = -tr.tx[i] * side, yaw = Math.atan2(nx, nz);
        ads[(n + (c.def.seed ?? 0)) % ADS.length].push([x, y + 1.45, z, yaw]);
        const ax = Math.cos(yaw), az = -Math.sin(yaw);
        for (const o of [-2.7, 2.7]) adPosts.push([x + ax * o, y, z + az * o]);
        n++;
      }
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
  // Reifenstapel: vier Reifen, abwechselnd rot und weiß (zwei Muster, damit die Reihe nicht gleichförmig wirkt)
  if (tyres.length) {
    const stack = (flip) => { const b = new Build(); for (let k = 0; k < 4; k++) b.torus(0.34, 0.15, (k + flip) % 2 ? 0xfaf8f2 : 0xe8392d, { p: [0, 0.15 + k * 0.29, 0], r: [Math.PI / 2, 0, 0] }, 6, 12); return b.geometry(); };
    const tm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    for (const f of [0, 1]) inst(stack(f), tm, tyres.filter((v) => v[4] === f), (im, [x, y, z, a], k) => { e.set(0, a, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'reifenstapel');
  }
  // Werbetafeln: je Motiv ein Instanzen-Mesh, Rückseite grau; Pfosten gemeinsam
  {
    const ag = new THREE.BoxGeometry(6.4, 1.6, 0.1);
    const back = new THREE.MeshStandardMaterial({ color: 0x8a8e9a, roughness: 0.7 });
    ads.forEach((list, k) => {
      if (!list.length) return;
      const tex = adTexture(k); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
      // Box-Seiten: +x, −x, +y, −y, +z (vorn), −z (hinten)
      inst(ag, [back, back, back, back, front, back], list, (im, [x, y, z, yaw], kk) => { e.set(0, yaw, 0); q.setFromEuler(e); m.compose(p.set(x, y, z), q, s.set(1, 1, 1)); im.setMatrixAt(kk, m); }, 'werbetafeln');
    });
    inst(new THREE.CylinderGeometry(0.07, 0.07, 2.3, 6).translate(0, 1.15, -0.1), new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.5, metalness: 0.3 }), adPosts,
      (im, [x, y, z], k) => { m.compose(p.set(x, y, z), q.identity(), s.set(1, 1, 1)); im.setMatrixAt(k, m); }, 'tafelpfosten');
  }
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

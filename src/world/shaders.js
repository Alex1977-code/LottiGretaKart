// Shader-Zusätze für mehr Detail (in die Standard-Materialien von three.js eingehängt, kein eigenes Licht-Modell):
//  • Gelände und Fahrbahn: feines Korn aus Welt-Rauschen (Gras, Erde, Asphalt) – nur nah, verblasst in der Ferne,
//    unter Wasser blaugrün getönt mit wandernden Lichtmustern (Kaustik) wie am Meeresgrund in Mario Kart 8.
//  • Wasser: bewegte Wellen (Normalen aus überlagerten Wellenzügen), Farbe nach Wassertiefe (türkis am Ufer,
//    tiefblau draußen), Schaum-Säume am Strand, Glanz am Horizont; von unten gesehen eine helle, flirrende Decke.
// Alle teilen sich eine Zeit (SHADER_TIME.value, von WorldView.update gesetzt).

import * as THREE from 'three';
import { surfaceTexture } from './surfaces.js';

export const SHADER_TIME = { value: 0 };
// Richtung zur Sonne (Sky.update) – für das Glitzern auf dem Wasser
export const SUN_DIR = { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() };
/** Nässe durch Regen (0 … 1, vom Wetter gesetzt): Fahrbahn dunkler und spiegelnd mit Pfützen, Gelände dunkler. */
export const RAIN_WET = { value: 0 };
/** Wolkenschatten (0 … 1, vom Himmel gesetzt: nur wenn Wolken am Himmel stehen): ziehen langsam über Gelände und Fahrbahn. */
export const CLOUD_SHADE = { value: 0 };

const NOISE = /* glsl */ `
float lgkHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lgkNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(lgkHash(i), lgkHash(i + vec2(1.0, 0.0)), u.x), mix(lgkHash(i + vec2(0.0, 1.0)), lgkHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float lgkCaustic(vec2 p, float t) {
  vec2 q = p * 0.42;
  float c = 0.0;
  for (int k = 0; k < 3; k++) {
    q += vec2(sin(q.y * 1.7 + t * 0.9 + float(k)), cos(q.x * 1.4 - t * 0.75 + float(k) * 1.7)) * 0.55;
    c += abs(sin(q.x * 1.3 + q.y * 0.9));
  }
  c = 1.0 - c / 3.0;
  return pow(clamp(c, 0.0, 1.0), 3.0);
}
`;

function addVarying(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLgkW;\nvarying float vLgkD;')
    .replace('#include <project_vertex>', '#include <project_vertex>\n  vLgkW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vLgkD = -mvPosition.z;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vLgkW;\nvarying float vLgkD;\nuniform float uLgkTime;\nuniform float uLgkRain;\nuniform float uLgkCloud;\n${NOISE}`);
  shader.uniforms.uLgkTime = SHADER_TIME;
  shader.uniforms.uLgkRain = RAIN_WET;
  shader.uniforms.uLgkCloud = CLOUD_SHADE;
}

/**
 * Detail-Korn und Unterwasser-Look für Gelände/Fahrbahn. grain = Stärke des Korns (0,1 … 0,3), scale = Körnung.
 */
export function addGroundDetail(mat, { grain = 0.2, scale = 1, key = 'g', patches = false, wet = false, rain = 0.35, surf = null, wear = null } = {}) {
  const S = surf ? { topScale: 1 / 3, sideScale: 1 / 9, strength: 1, detail: 0.32, side: 'rock', slope: true, ...surf } : null;
  const size = S?.size ?? 512;
  // Texturen gleich beim Anlegen des Materials rechnen (im Ladebildschirm), nicht erst beim Übersetzen des Shaders
  const T = S ? { off: S.off ? surfaceTexture(S.off, size) : null, top: surfaceTexture(S.top, size), side: S.slope ? surfaceTexture(S.side, size) : null } : null;
  mat.onBeforeCompile = (shader) => {
    addVarying(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float fade = 1.0 - smoothstep(18.0, 80.0, vLgkD);
    float n = lgkNoise(vLgkW.xz * ${(0.9 * scale).toFixed(3)}) * 0.55 + lgkNoise(vLgkW.xz * ${(3.3 * scale).toFixed(3)}) * 0.3 + lgkNoise(vLgkW.xz * ${(9.0 * scale).toFixed(3)}) * 0.15;
    diffuseColor.rgb *= 1.0 + (n - 0.5) * ${grain.toFixed(3)} * 2.0 * fade;
    ${patches ? `// Wiesenflecken: großflächig sattere und sonnig-hellere Stellen, dazu kleine Kleeinseln (nur über Wasser)
    if (vLgkW.y > 0.3) {
      float m = lgkNoise(vLgkW.xz * 0.035) * 0.65 + lgkNoise(vLgkW.xz * 0.11 + 7.0) * 0.35;
      diffuseColor.rgb *= mix(vec3(0.86, 0.97, 0.9), vec3(1.08, 1.05, 0.9), smoothstep(0.3, 0.75, m));
      float c = smoothstep(0.72, 0.8, lgkNoise(vLgkW.xz * 0.6 + 3.0)) * fade;
      diffuseColor.rgb *= 1.0 - c * 0.12;
    }` : ''}
    ${wet ? `// nasser Asphalt: Pfützen dunkler (und unten glatter = spiegelnd)
    float lgkPud = smoothstep(0.48, 0.66, lgkNoise(vLgkW.xz * 0.07) * 0.6 + lgkNoise(vLgkW.xz * 0.29 + 5.0) * 0.4);
    diffuseColor.rgb *= mix(0.92, 0.62, lgkPud);` : `// Regen: nass und dunkler, auf der Fahrbahn Pfützen
    if (uLgkRain > 0.0) {
      float lgkPud = smoothstep(0.48, 0.66, lgkNoise(vLgkW.xz * 0.07) * 0.6 + lgkNoise(vLgkW.xz * 0.29 + 5.0) * 0.4);
      diffuseColor.rgb *= 1.0 - uLgkRain * ${rain.toFixed(2)} * (0.3 + 0.35 * lgkPud);
    }`}
    if (vLgkW.y < -0.15) {
      float dep = clamp(-vLgkW.y / 8.0, 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.82, 0.95), 0.4 + 0.5 * dep);
    }
    // Wolkenschatten: große weiche Flecken, die langsam über die Landschaft ziehen
    if (uLgkCloud > 0.0) {
      vec2 cp = vLgkW.xz * 0.0042 + vec2(uLgkTime * 0.011, uLgkTime * 0.006);
      float cs = smoothstep(0.5, 0.74, lgkNoise(cp) * 0.7 + lgkNoise(cp * 2.3 + 4.0) * 0.3);
      diffuseColor.rgb *= 1.0 - 0.17 * cs * uLgkCloud;
    }
  }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  ${wet ? 'roughnessFactor = mix(0.4, 0.05, smoothstep(0.48, 0.66, lgkNoise(vLgkW.xz * 0.07) * 0.6 + lgkNoise(vLgkW.xz * 0.29 + 5.0) * 0.4));'
    : `if (uLgkRain > 0.0) roughnessFactor = mix(roughnessFactor, mix(0.45, 0.06, smoothstep(0.48, 0.66, lgkNoise(vLgkW.xz * 0.07) * 0.6 + lgkNoise(vLgkW.xz * 0.29 + 5.0) * 0.4)), uLgkRain * ${rain.toFixed(2)});`}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (vLgkW.y < -0.3) {
    float dep = clamp(-vLgkW.y / 3.0, 0.0, 1.0) * (1.0 - smoothstep(30.0, 90.0, vLgkD));
    totalEmissiveRadiance += vec3(0.42, 0.7, 0.75) * lgkCaustic(vLgkW.xz, uLgkTime) * 0.55 * dep;
  }`);
    if (wear) {
      // Abnutzung der Fahrbahn (Geometrie-Attribut lgkRoad: quer −1 … +1, längs in Metern):
      // dunkles, glatteres Band der Ideallinie mit Gummiabrieb, Schmutz an den Rändern, feine Walzstreifen längs,
      // bei Asphalt dazu ausgebesserte Flicken und Quernähte
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 lgkRoad;\nvarying vec2 vLgkRoad;')
        .replace('#include <project_vertex>', '#include <project_vertex>\n  vLgkRoad = lgkRoad;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vLgkRoad;\nfloat lgkLine = 0.0;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float e = abs(vLgkRoad.x), far = 1.0 - smoothstep(70.0, 190.0, vLgkD);
    // Ideallinie: pendelt leicht, Abrieb in Längsschlieren
    float mid = vLgkRoad.x - 0.22 * sin(vLgkRoad.y * 0.045);
    float streak = lgkNoise(vec2(vLgkRoad.x * 11.0, vLgkRoad.y * 0.07));
    lgkLine = (1.0 - smoothstep(0.16, 0.62, abs(mid))) * (0.4 + 0.6 * streak) * far;
    diffuseColor.rgb *= 1.0 - lgkLine * 0.27;
    // Rand: Staub und Schmutz, unregelmäßig
    diffuseColor.rgb *= 1.0 - smoothstep(0.7, 1.0, e + (lgkNoise(vec2(vLgkRoad.y * 0.3, vLgkRoad.x * 3.0)) - 0.5) * 0.16) * 0.3 * far;
    // Walzstreifen längs (fein)
    diffuseColor.rgb *= 0.94 + 0.12 * lgkNoise(vec2(vLgkRoad.x * 34.0, vLgkRoad.y * 0.025));
    ${wear === 'asphalt' ? `// ausgebesserte Flicken (dunkler, leicht anderer Ton) und Quernähte alle 24 m
    vec2 pc = vec2(vLgkRoad.x * 1.6 + 5.0, vLgkRoad.y / 11.0), pi = floor(pc), pf = fract(pc);
    float ph = lgkHash(pi);
    if (ph > 0.86) {
      vec2 lo = vec2(0.12 + 0.2 * lgkHash(pi + 3.1), 0.15 + 0.25 * lgkHash(pi + 7.7)), hi = lo + vec2(0.5, 0.42);
      float inP = step(lo.x, pf.x) * step(pf.x, hi.x) * step(lo.y, pf.y) * step(pf.y, hi.y);
      diffuseColor.rgb *= 1.0 - inP * 0.17 * far;
    }
    float seam = 1.0 - smoothstep(0.0, 0.006, abs(fract(vLgkRoad.y / 24.0) - 0.5));
    diffuseColor.rgb *= 1.0 - seam * 0.32 * far;` : ''}
  }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor *= 1.0 - lgkLine * 0.3;   // die Ideallinie ist glatt gefahren`);
    }
    if (S) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vLgkN;${S.off ? '\nattribute float lgkOff;\nvarying float vLgkOff;' : ''}`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n  vLgkN = normalize(mat3(modelMatrix) * objectNormal);${S.off ? '\n  vLgkOff = lgkOff;' : ''}`);
      if (S.off) shader.uniforms.uSurfOff = { value: T.off };
      shader.uniforms.uSurfTop = { value: T.top };
      if (S.slope) shader.uniforms.uSurfSide = { value: T.side };
      shader.uniforms.uSurfP = { value: new THREE.Vector4(S.topScale, S.sideScale, S.strength, S.detail) };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\nvarying vec3 vLgkN;${S.off ? '\nvarying float vLgkOff;\nuniform sampler2D uSurfOff;' : ''}\nuniform sampler2D uSurfTop;${S.slope ? '\nuniform sampler2D uSurfSide;' : ''}\nuniform vec4 uSurfP;\nvec3 lgkSurfN;\nfloat lgkSurfRough;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  {
    // Oberflächen-Textur: oben Boden (zwei Maßstäbe gegen sichtbare Wiederholung), an Hängen Fels (triplanar)
    vec3 Nw = normalize(vLgkN);
    float fadeS = 1.0 - smoothstep(45.0, 160.0, vLgkD);
    vec4 tT = texture2D(uSurfTop, vLgkW.xz * uSurfP.x);
    vec4 tT2 = texture2D(uSurfTop, vLgkW.xz * uSurfP.x * 0.29 + vec2(0.37, 0.71));
    ${S.off ? `float ko = smoothstep(0.25, 0.75, vLgkOff);
    vec4 tO = texture2D(uSurfOff, vLgkW.xz * uSurfP.x * 0.8);
    tT = mix(tT, tO, ko); tT2 = mix(tT2, tO, ko);` : ''}
    float k = ${S.slope ? '1.0 - smoothstep(0.6, 0.86, Nw.y)' : '0.0'};
    vec3 bw = pow(abs(Nw), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    ${S.slope ? `vec4 sx = texture2D(uSurfSide, vLgkW.zy * uSurfP.y);
    vec4 sy = texture2D(uSurfSide, vLgkW.xz * uSurfP.y);
    vec4 sz = texture2D(uSurfSide, vLgkW.xy * uSurfP.y);` : 'vec4 sx = vec4(0.5), sy = sx, sz = sx;   // ohne Hänge: keine Fels-Textur abtasten'}
    vec4 tS = sx * bw.x + sy * bw.y + sz * bw.z;
    float det = mix(mix(tT.b, tT2.b, 0.4), tS.b, k);
    diffuseColor.rgb *= 1.0 + (det - 0.5) * 2.0 * uSurfP.w * (0.45 + 0.55 * fadeS);
    lgkSurfRough = mix(tT.a, tS.a, k);
    vec2 nT = tT.rg * 2.0 - 1.0;
    vec2 nx_ = sx.rg * 2.0 - 1.0, ny_ = sy.rg * 2.0 - 1.0, nz_ = sz.rg * 2.0 - 1.0;
    vec3 pS = vec3(0.0, nx_.y, nx_.x) * bw.x + vec3(ny_.x, 0.0, ny_.y) * bw.y + vec3(nz_.x, nz_.y, 0.0) * bw.z;
    vec3 pert = mix(vec3(nT.x, 0.0, nT.y), pS, k);
    lgkSurfN = normalize(Nw + pert * uSurfP.z * (0.25 + 0.75 * fadeS));
  }`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  normal = normalize((viewMatrix * vec4(lgkSurfN, 0.0)).xyz) * faceDirection;`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, lgkSurfRough, 0.75);`);
    }
  };
  mat.customProgramCacheKey = () => `lgk-ground-${key}-${grain}-${scale}-${patches}-${wet}-${rain}-${S ? `${S.top}-${S.side}-${S.off}-${S.slope}-${size}` : ''}-${wear ?? ''}`;
  return mat;
}

/**
 * Wasser mit Wellen, Tiefenfarbe und Ufer-Schaum. hf = Höhenfeld der Welt ({ x0, z0, nx, nz, h, cell }).
 */
export function makeWaterMaterial(hf) {
  // Höhenfeld als Textur (R: −10 … +2 m auf 0 … 255, G: Unterwasser-Zone): daraus Wassertiefe, Uferlinie und
  // wo das Wasser klarer ist (über der Unterwasser-Strecke sieht man von oben die Fahrbahn)
  const n = hf.nx * hf.nz, data = new Uint8Array(n * 2);
  for (let k = 0; k < n; k++) {
    data[k * 2] = Math.max(0, Math.min(255, Math.round(((hf.h[k] + 10) / 12) * 255)));
    data[k * 2 + 1] = hf.uw?.[k] ? 255 : 0;
  }
  const tex = new THREE.DataTexture(data, hf.nx, hf.nz, THREE.RGFormat, THREE.UnsignedByteType);
  tex.unpackAlignment = 2;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  // (glatter als früher: der Himmel spiegelt sich klarer, die Sonne gibt einen kleinen, hellen Glanzpunkt)
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f9be8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.84, emissive: 0x0a3a6a, emissiveIntensity: 0.35, side: THREE.DoubleSide });
  // die Höhenfeld-Textur hängt nur als Uniform im Shader – beim Abbau des Materials mit freigeben
  const baseDispose = mat.dispose.bind(mat);
  mat.dispose = () => { tex.dispose(); baseDispose(); };
  mat.onBeforeCompile = (shader) => {
    addVarying(shader);
    shader.uniforms.uLgkDepth = { value: tex };
    shader.uniforms.uLgkSun = SUN_DIR;
    shader.uniforms.uLgkHf = { value: new THREE.Vector4(hf.x0, hf.z0, (hf.nx - 1) * hf.cell, (hf.nz - 1) * hf.cell) };
    shader.fragmentShader = shader.fragmentShader
      .replace('uniform float uLgkTime;', 'uniform float uLgkTime;\nuniform sampler2D uLgkDepth;\nuniform vec4 uLgkHf;\nuniform vec3 uLgkSun;\nfloat lgkGround;\nvec3 lgkNW = vec3(0.0, 1.0, 0.0);\nvec2 lgkWave(vec2 p, float t) {\n  vec2 g = vec2(0.0);\n  g += vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 0.35 + t * 1.3) * 0.35;\n  g += vec2(-0.5, 0.86) * cos(dot(p, vec2(-0.5, 0.86)) * 0.62 + t * 1.9) * 0.22;\n  g += vec2(0.2, -0.98) * cos(dot(p, vec2(0.2, -0.98)) * 1.3 + t * 2.6) * 0.12;\n  g += vec2(0.95, -0.3) * cos(dot(p, vec2(0.95, -0.3)) * 2.7 + t * 3.4) * 0.07;\n  return g;\n}')
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 uv = (vLgkW.xz - uLgkHf.xy) / uLgkHf.zw;
    vec2 dz = texture2D(uLgkDepth, uv).rg;
    lgkGround = dz.r * 12.0 - 10.0;
    float shallow = smoothstep(-5.0, -0.2, lgkGround);
    vec3 deep = vec3(0.07, 0.36, 0.72), mid = vec3(0.13, 0.58, 0.9), shore = vec3(0.36, 0.86, 0.88);
    vec3 c = mix(deep, mid, smoothstep(-9.5, -4.0, lgkGround));
    c = mix(c, shore, shallow);
    // Schaum-Säume, die zum Strand laufen
    float band = sin(lgkGround * 9.0 - uLgkTime * 2.2 + lgkNoise(vLgkW.xz * 0.15) * 5.0);
    float foam = smoothstep(-1.1, -0.15, lgkGround) * smoothstep(0.55, 0.95, band) * (0.6 + 0.4 * lgkNoise(vLgkW.xz * 0.8 + uLgkTime * 0.3));
    foam += smoothstep(-0.35, -0.05, lgkGround) * 0.6;
    c = mix(c, vec3(0.95, 0.99, 1.0), clamp(foam, 0.0, 1.0) * (1.0 - smoothstep(60.0, 160.0, vLgkD)));
    if (!gl_FrontFacing) c = vec3(0.45, 0.85, 0.95);   // von unten: helle Wasseroberfläche
    diffuseColor.rgb = c;
    diffuseColor.a = mix(mix(0.9, 0.62, shallow * shallow), 0.5, dz.g) + clamp(foam, 0.0, 1.0) * 0.3;
    if (!gl_FrontFacing) diffuseColor.a = 0.7;
  }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    float fadeN = 1.0 - smoothstep(80.0, 260.0, vLgkD);
    vec2 g = lgkWave(vLgkW.xz, uLgkTime) * fadeN + (vec2(lgkNoise(vLgkW.xz * 0.9 + uLgkTime * 0.6), lgkNoise(vLgkW.zx * 0.9 - uLgkTime * 0.5)) - 0.5) * 0.25 * fadeN;
    vec3 nW = normalize(vec3(-g.x, 1.0, -g.y));
    // feine, schnelle Kräuselwellen nah an der Kamera (für das Glitzern)
    float fadeR = 1.0 - smoothstep(20.0, 90.0, vLgkD);
    nW = normalize(nW + vec3(lgkNoise(vLgkW.xz * 3.1 + uLgkTime * 1.7) - 0.5, 0.0, lgkNoise(vLgkW.zx * 3.3 - uLgkTime * 1.4) - 0.5) * 0.35 * fadeR);
    lgkNW = nW;
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
    if (!gl_FrontFacing) normal = -normal;
  }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (!gl_FrontFacing) totalEmissiveRadiance += vec3(0.25, 0.55, 0.65) * (0.4 + 0.6 * lgkCaustic(vLgkW.xz * 1.5, uLgkTime * 1.3));
  else {
    // Sonnenglitzern: einzelne Wellenflanken spiegeln die Sonne genau zur Kamera (hell, leuchtet im Bloom)
    vec3 V = normalize(cameraPosition - vLgkW);
    float s = max(dot(reflect(-V, lgkNW), normalize(uLgkSun)), 0.0);
    float spark = pow(s, 380.0) * smoothstep(0.55, 0.8, lgkNoise(vLgkW.xz * 2.4 + uLgkTime * 1.1));
    totalEmissiveRadiance += vec3(1.0, 0.94, 0.78) * spark * 7.0 * (1.0 - smoothstep(60.0, 220.0, vLgkD)) * step(0.05, uLgkSun.y);
  }`);
  };
  mat.customProgramCacheKey = () => 'lgk-water';
  return mat;
}

/**
 * Wind: Halme, Blumen, Schilf und Baumkronen wiegen sich (Ausschlag wächst mit der Höhe über dem Fuß).
 * amp = Ausschlag je Meter Höhe. Für InstancedMesh: jede Instanz schwingt mit eigener Phase (nach ihrem Ort).
 */
export function addSway(mat, amp = 0.1, key = 's') {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLgkTime = SHADER_TIME;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uLgkTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  {
  #ifdef USE_INSTANCING
    vec3 lgkP = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #else
    vec3 lgkP = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #endif
    float lgkW = sin(uLgkTime * 1.6 + lgkP.x * 0.21 + lgkP.z * 0.17) + 0.45 * sin(uLgkTime * 2.9 + lgkP.x * 0.53 - lgkP.z * 0.31);
    float lgkH = max(transformed.y, 0.0);
    transformed.x += lgkW * ${amp.toFixed(4)} * lgkH;
    transformed.z += lgkW * ${(amp * 0.6).toFixed(4)} * lgkH;
  }`);
  };
  mat.customProgramCacheKey = () => `lgk-sway-${key}-${amp}`;
  return mat;
}

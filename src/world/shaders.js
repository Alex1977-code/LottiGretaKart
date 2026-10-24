// Shader-Zusätze für mehr Detail (in die Standard-Materialien von three.js eingehängt, kein eigenes Licht-Modell):
//  • Gelände und Fahrbahn: feines Korn aus Welt-Rauschen (Gras, Erde, Asphalt) – nur nah, verblasst in der Ferne,
//    unter Wasser blaugrün getönt mit wandernden Lichtmustern (Kaustik) wie am Meeresgrund in Mario Kart 8.
//  • Wasser: bewegte Wellen (Normalen aus überlagerten Wellenzügen), Farbe nach Wassertiefe (türkis am Ufer,
//    tiefblau draußen), Schaum-Säume am Strand, Glanz am Horizont; von unten gesehen eine helle, flirrende Decke.
// Alle teilen sich eine Zeit (SHADER_TIME.value, von WorldView.update gesetzt).

import * as THREE from 'three';

export const SHADER_TIME = { value: 0 };

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
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vLgkW;\nvarying float vLgkD;\nuniform float uLgkTime;\n${NOISE}`);
  shader.uniforms.uLgkTime = SHADER_TIME;
}

/**
 * Detail-Korn und Unterwasser-Look für Gelände/Fahrbahn. grain = Stärke des Korns (0,1 … 0,3), scale = Körnung.
 */
export function addGroundDetail(mat, { grain = 0.2, scale = 1, key = 'g' } = {}) {
  mat.onBeforeCompile = (shader) => {
    addVarying(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    float fade = 1.0 - smoothstep(18.0, 80.0, vLgkD);
    float n = lgkNoise(vLgkW.xz * ${(0.9 * scale).toFixed(3)}) * 0.55 + lgkNoise(vLgkW.xz * ${(3.3 * scale).toFixed(3)}) * 0.3 + lgkNoise(vLgkW.xz * ${(9.0 * scale).toFixed(3)}) * 0.15;
    diffuseColor.rgb *= 1.0 + (n - 0.5) * ${grain.toFixed(3)} * 2.0 * fade;
    if (vLgkW.y < -0.15) {
      float dep = clamp(-vLgkW.y / 8.0, 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.82, 0.95), 0.4 + 0.5 * dep);
    }
  }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (vLgkW.y < -0.3) {
    float dep = clamp(-vLgkW.y / 3.0, 0.0, 1.0) * (1.0 - smoothstep(30.0, 90.0, vLgkD));
    totalEmissiveRadiance += vec3(0.42, 0.7, 0.75) * lgkCaustic(vLgkW.xz, uLgkTime) * 0.55 * dep;
  }`);
  };
  mat.customProgramCacheKey = () => `lgk-ground-${key}-${grain}-${scale}`;
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f9be8, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.84, emissive: 0x0a3a6a, emissiveIntensity: 0.35, side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    addVarying(shader);
    shader.uniforms.uLgkDepth = { value: tex };
    shader.uniforms.uLgkHf = { value: new THREE.Vector4(hf.x0, hf.z0, (hf.nx - 1) * hf.cell, (hf.nz - 1) * hf.cell) };
    shader.fragmentShader = shader.fragmentShader
      .replace('uniform float uLgkTime;', 'uniform float uLgkTime;\nuniform sampler2D uLgkDepth;\nuniform vec4 uLgkHf;\nfloat lgkGround;\nvec2 lgkWave(vec2 p, float t) {\n  vec2 g = vec2(0.0);\n  g += vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 0.35 + t * 1.3) * 0.35;\n  g += vec2(-0.5, 0.86) * cos(dot(p, vec2(-0.5, 0.86)) * 0.62 + t * 1.9) * 0.22;\n  g += vec2(0.2, -0.98) * cos(dot(p, vec2(0.2, -0.98)) * 1.3 + t * 2.6) * 0.12;\n  g += vec2(0.95, -0.3) * cos(dot(p, vec2(0.95, -0.3)) * 2.7 + t * 3.4) * 0.07;\n  return g;\n}')
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
    normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
    if (!gl_FrontFacing) normal = -normal;
  }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (!gl_FrontFacing) totalEmissiveRadiance += vec3(0.25, 0.55, 0.65) * (0.4 + 0.6 * lgkCaustic(vLgkW.xz * 1.5, uLgkTime * 1.3));`);
  };
  mat.customProgramCacheKey = () => 'lgk-water';
  return mat;
}

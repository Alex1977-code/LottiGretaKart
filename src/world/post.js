// Bild-Nachbearbeitung im Stil von Mario Kart 8: weiches Leuchten (Bloom) für helle und leuchtende Dinge (Neon,
// Lampen, Münzen, Turbo, Himmel am Horizont), kräftigere Farben und Kontraste, leicht warme Lichter und kühle
// Schatten, sanfte Vignette. Mit Kantenglättung (MSAA im Zwischenbild). Nachts stärkeres Leuchten.
// Nur ab Grafikstufe „Hoch“ und nur im Einzelbild (geteilter Bildschirm zeichnet direkt).

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Ungültige Werte (NaN/unendlich) über die Bits erkennen: isnan() streicht der Shader-Übersetzer auf dem iPhone
// (Metal, „fast math“) einfach weg. Ein einziges solches Pixel würde vom Leuchten über den ganzen Bildschirm
// verschmiert – das Bild blitzt schwarz auf.
const SAFE = /* glsl */ `
  vec4 lgkSafe(vec4 c, float hi) {
    uvec4 e = floatBitsToUint(c) & 0x7f800000u;
    return any(equal(e, uvec4(0x7f800000u))) ? vec4(0.0, 0.0, 0.0, 1.0) : clamp(c, 0.0, hi);
  }`;

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    sat: { value: 1.16 }, contrast: { value: 1.07 }, bright: { value: 0.0 }, vig: { value: 0.22 },
    warm: { value: 1.0 }, tint: { value: new THREE.Color(1, 1, 1) },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float sat, contrast, bright, vig, warm; uniform vec3 tint; varying vec2 vUv;
    ${SAFE}
    void main() {
      vec3 c = lgkSafe(texture2D(tDiffuse, vUv), 1.0).rgb * tint;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, sat);
      c = (c - 0.5) * contrast + 0.5 + bright;
      // warme Lichter, kühle Schatten
      c += warm * (vec3(0.022, 0.01, -0.012) * smoothstep(0.5, 1.0, l) + vec3(-0.012, 0.0, 0.022) * (1.0 - smoothstep(0.0, 0.35, l)));
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.82);
      c *= mix(1.0 - vig, 1.0, smoothstep(0.78, 0.25, length(d)));
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export class Post {
  constructor(renderer, quality = 2) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality >= 3 ? 4 : 2 });
    this.composer = new EffectComposer(renderer, rt);
    this.renderPass = new RenderPass(null, null);
    this.composer.addPass(this.renderPass);
    // Bloom in halber Auflösung (spart Leistung, weicher)
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.3, 0.35, 1.7);
    // weiche Schwelle: sonst springen Glanzpunkte an der Grenze von Bild zu Bild an und aus (Flackern)
    this.bloom.highPassUniforms.smoothWidth.value = 0.8;
    // Eingang des Leuchtens säubern und begrenzen (siehe SAFE)
    const hp = this.bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader
      .replace('void main() {', `${SAFE}\nvoid main() {`)
      .replace('vec4 texel = texture2D( tDiffuse, vUv );', 'vec4 texel = lgkSafe( texture2D( tDiffuse, vUv ), 16.0 );');
    if (!hp.fragmentShader.includes('lgkSafe( texture2D')) console.warn('Bloom-Schutz nicht eingebaut');
    hp.needsUpdate = true;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.night = 0;
  }

  setSize(w, h, ratio) {
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(w, h);
  }

  /** Nacht (0 … 1): stärkeres Leuchten, dunklere Ränder. */
  setNight(k) {
    this.night = k;
    this.apply();
  }

  /** Wetter: Regen kühler und etwas blasser, Calima warm-ocker mit weichem Kontrast. */
  setWeather(kind) {
    this.weather = kind;
    this.apply();
  }

  apply() {
    const k = this.night ?? 0, w = this.weather, u = this.grade.uniforms;
    this.bloom.strength = 0.3 + 0.45 * k + (w === 'calima' ? 0.12 : 0);
    this.bloom.threshold = 1.7 - 0.95 * k - (w === 'calima' ? 0.2 : 0);
    u.vig.value = 0.22 + 0.16 * k + (w === 'rain' ? 0.06 : 0);
    u.sat.value = 1.16 + 0.08 * k + (w === 'rain' ? -0.18 : w === 'calima' ? -0.08 : 0);
    u.contrast.value = 1.07 + (w === 'rain' ? -0.02 : w === 'calima' ? -0.07 : 0);
    u.warm.value = w === 'rain' ? -0.6 : w === 'calima' ? 2.2 : 1.0;
    u.tint.value.setRGB(...(w === 'rain' ? [0.95, 0.98, 1.03] : w === 'calima' ? [1.06, 0.98, 0.86] : [1, 1, 1]));
  }

  render(scene, camera) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    this.composer.render();
  }
}

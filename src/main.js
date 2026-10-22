// Lotti & Greta Kart – Einstieg: Renderer, Kamera, Hauptschleife und Menü-Ablauf.
// URL-Parameter (Tests/Fehlersuche): ?race=<strecke> startet sofort ein Rennen, ?racer=<id> wählt die Fahrerin,
// ?cc=50|100|150, ?laps=n, ?demo=1 nur Computer-Fahrer, ?quality=0|1|2.

import * as THREE from 'three';
import { getRenderer } from './lgw/three/renderer.js';
import { audio } from './game/audio.js';
import { Hud } from './ui/hud.js';
import { Menus } from './ui/menus.js';
import { TouchControls } from './ui/touch.js';
import { readMeta, isTouch } from './ui/input.js';
import { Race } from './game/Race.js';
import { RACERS, RACER_BY_ID } from './game/racers.js';
import { TRACK_BY_ID } from './tracks/index.js';
import { registerSW } from './pwa.js';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
const { renderer, canvas } = getRenderer();
canvas.id = 'gl3d';
app.prepend(canvas);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const quality = params.has('quality') ? Number(params.get('quality')) : (isTouch() ? 1 : 2);
const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1400);

const ctx = {
  renderer, camera, audio, quality,
  hud: new Hud(document.getElementById('ui'), renderer),
  touch: new TouchControls(document.getElementById('touch')),
  viewH: 800,
  race: null,
  paused: false,
};
window.__kart = ctx; // Tests/Fehlersuche
// Tests: Rennen deterministisch um n Schritte vorspulen (ohne Bildaufbau dazwischen)
ctx.step = (n = 60, dt = 1 / 60, draw = true) => { for (let i = 0; i < n; i++) ctx.race?.update(dt); if (draw) ctx.race?.render(renderer); };

// ------------------------------------------------------------------ Größe
let pixelScale = 1;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const maxPx = quality >= 2 ? 2.6e6 : 1.4e6;
  let ratio = Math.min(window.devicePixelRatio || 1, 2);
  ratio = Math.min(ratio, Math.sqrt(maxPx / (w * h))) * pixelScale;
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h, false);
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  ctx.viewH = h * ratio;
  document.getElementById('rotate-hint').classList.toggle('visible', isTouch() && h > w * 1.05);
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ Rennen starten/beenden
ctx.startRace = (o) => {
  ctx.endRace();
  const race = new Race(ctx, o);
  ctx.race = race;
  ctx.paused = false;
  ctx.hud.show(!o.demo);
  ctx.touch.show(!o.demo && isTouch());
  ctx.touch.onStartTap = () => race.startTap();
  return race;
};
ctx.endRace = () => {
  if (!ctx.race) return;
  ctx.race.dispose();
  ctx.race = null;
  ctx.hud.show(false);
  ctx.touch.show(false);
};

const menus = new Menus(ctx);
ctx.menus = menus;

// Direktstart über die URL
if (params.has('race')) {
  const trackDef = TRACK_BY_ID[params.get('race')] ?? Object.values(TRACK_BY_ID)[0];
  const playerId = params.get('racer') ?? 'lotti';
  const roster = [...RACERS].sort((a, b) => (a.id === playerId ? 1 : 0) - (b.id === playerId ? 1 : 0));
  ctx.startRace({
    trackDef, roster, playerId, cc: Number(params.get('cc') ?? 100), laps: Number(params.get('laps') ?? 3),
    demo: params.get('demo') === '1', seed: 7,
    onDone: (res) => menus.showResults(res, { trackDef, single: true }),
    onEvent: (e, v) => menus.onRaceEvent(e, v),
  });
  menus.hideAll();
} else {
  menus.showTitle();
}

// ------------------------------------------------------------------ Hauptschleife
let last = performance.now();
let slow = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const meta = readMeta();
  if (meta.mute) menus.toggleMute();
  menus.input(meta);
  if (ctx.race && !ctx.paused) ctx.race.update(dt);
  if (ctx.race) ctx.race.render(renderer);
  else menus.render(renderer, dt);
  // Bildrate schwach? Auflösung stufenweise senken
  if (dt > 1 / 40) slow++; else slow = Math.max(0, slow - 1);
  if (slow > 90 && pixelScale > 0.6) { pixelScale -= 0.15; slow = 0; resize(); }
}
requestAnimationFrame(frame);

registerSW();

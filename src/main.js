// Lotti & Greta Kart – Einstieg: Renderer, Kamera, Hauptschleife und Menü-Ablauf.
// Beim Start wird einmal die ganze Insel-Welt gebaut (Ladebalken), danach laufen alle Rennen darin.
// URL-Parameter (Tests/Fehlersuche): ?race=<strecke> startet sofort ein Rennen, ?from=<strecke> mit Anfahrt,
// ?mode=race|gp|ko|free|trial|demo, ?racer=<id>, ?cc=50|100|150, ?laps=n, ?quality=0|1|2, ?assist=1.

import * as THREE from 'three';
import { getRenderer } from './lgw/three/renderer.js';
import { audio } from './game/audio.js';
import { Hud } from './ui/hud.js';
import { Menus } from './ui/menus.js';
import { TouchControls } from './ui/touch.js';
import { readMeta, isTouch } from './ui/input.js';
import { Race } from './game/Race.js';
import { aiInput, initAI } from './game/ai.js';
import { RACERS, RACER_BY_ID } from './game/racers.js';
import { TRACK_BY_ID } from './tracks/index.js';
import { registerSW } from './pwa.js';
import { World } from './world/World.js';
import { WorldView } from './world/WorldView.js';
import { Sky } from './world/Sky.js';
import { getTheme } from './world/themes.js';
import { KO_TOURS } from './world/worldDef.js';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
const { renderer, canvas } = getRenderer();
canvas.id = 'gl3d';
app.prepend(canvas);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const quality = params.has('quality') ? Number(params.get('quality')) : (isTouch() ? 1 : 2);
const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1600);

const ctx = {
  renderer, camera, audio, quality,
  hud: new Hud(document.getElementById('ui'), renderer),
  touch: new TouchControls(document.getElementById('touch')),
  viewH: 800,
  race: null,
  paused: false,
};
window.__kart = ctx; // Tests/Fehlersuche
ctx.ai = { aiInput, initAI }; // Tests: Spielerin von der KI fahren lassen
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
  const demo = o.mode === 'demo';
  ctx.hud.show(!demo);
  ctx.touch.show(!demo && isTouch());
  document.body.classList.toggle('touch-on', !demo && isTouch());
  ctx.touch.onStartTap = () => race.startTap();
  return race;
};
/** Beliebige Szene mit update/render/dispose (Siegerehrung) statt eines Rennens zeigen. */
ctx.setScene = (scene) => {
  ctx.endRace();
  ctx.race = scene;
  ctx.paused = false;
  ctx.hud.show(false);
  ctx.touch.show(false);
  document.body.classList.remove('touch-on');
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
// App im Hintergrund (Tab gewechselt, Handy gesperrt): Rennen anhalten
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ctx.race && !ctx.race.demo && !ctx.paused && ctx.race.state !== 'done') menus.pause();
});

// ------------------------------------------------------------------ Welt bauen (einmal), dann Menü oder Direktstart
const loading = document.createElement('div');
loading.id = 'loading';
loading.innerHTML = `<div class="logo"><span class="l1">Lotti</span><span class="amp">&amp;</span><span class="l2">Greta</span><span class="kart">KART</span></div>
  <div class="bar"><i></i></div><p>Die Insel wird gebaut …</p>`;
document.body.appendChild(loading);
const setProgress = (k, text) => { loading.querySelector('i').style.width = `${Math.round(k * 100)}%`; loading.querySelector('p').textContent = text; };
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot() {
  setProgress(0.05, 'Gelände und Straßen …');
  await nextFrame();
  ctx.world = new World();
  ctx.scene = new THREE.Scene();
  ctx.sky = new Sky(ctx.scene, getTheme('grass'), { quality, sunDisc: true });
  ctx.worldView = new WorldView(ctx.world, ctx.scene, { quality });
  await ctx.worldView.build((k, text) => setProgress(0.2 + 0.75 * k, `${text} …`));
  // Shader vorab übersetzen (kein Ruckeln beim ersten Bild)
  renderer.compile(ctx.scene, camera);
  setProgress(1, 'Los geht\'s!');
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 600);

  if (params.has('race') || params.get('mode') === 'free' || params.get('mode') === 'ko') {
    const mode = params.get('mode') ?? (params.get('demo') === '1' ? 'demo' : 'race');
    const trackDef = TRACK_BY_ID[params.get('race')] ?? Object.values(TRACK_BY_ID)[0];
    const playerId = params.get('racer') ?? 'lotti';
    const n = Number(params.get('n') ?? 12);
    const roster = mode === 'trial' ? [RACER_BY_ID[playerId]] : [...RACERS].slice(0, n).sort((a, b) => (a.id === playerId ? 1 : 0) - (b.id === playerId ? 1 : 0));
    if (!roster.some((r) => r.id === playerId) && mode !== 'demo') roster.push(RACER_BY_ID[playerId]);
    const tour = KO_TOURS.find((t) => t.id === params.get('tour')) ?? KO_TOURS[0];
    ctx.startRace({
      mode, courseId: trackDef.id, fromId: params.get('from'), tour, roster, playerId, cc: Number(params.get('cc') ?? 100), laps: Number(params.get('laps') ?? 3),
      seed: 7, assist: params.get('assist') === '1',
      onDone: (res) => menus.showResults(res, { trackDef, single: mode !== 'ko', ko: mode === 'ko', title: mode === 'ko' ? tour.name : '' }),
      onEvent: (e, v) => menus.onRaceEvent(e, v),
    });
    menus.hideAll();
  } else {
    menus.showTitle();
  }
  requestAnimationFrame(frame);
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
  // immer noch zu langsam: Schatten abschalten (einmalig)
  else if (slow > 150 && ctx.sky?.sun.castShadow) { ctx.sky.sun.castShadow = false; slow = 0; }
}
boot();

registerSW();

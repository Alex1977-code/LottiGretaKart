// Headless-Test (Chromium): je Strecke ein Rennen über eine Runde, die Spielerin fährt mit KI-Eingaben.
// Prüft: keine Konsolenfehler, Rennen endet, Ergebnisliste erscheint, alle acht Platzierungen, Gegenstände
// wurden benutzt, Spielerin hat die Runde in vernünftiger Zeit geschafft. Screenshots → tests/out/race-*.png
//   node tests/race.mjs            (nutzt den Build in dist/ über einen eigenen Vorschau-Server)
//   BASE=http://localhost:5173/ node tests/race.mjs   (gegen den Dev-Server)

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

mkdirSync('tests/out', { recursive: true });
let server = null;
let base = process.env.BASE;
if (!base) {
  server = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore' });
  base = 'http://localhost:4179/';
  await new Promise((r) => setTimeout(r, 2500));
}
const only = process.argv[2];
const TRACKS = ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege', 'autobahn'].filter((t) => !only || t === only);
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? '  ok  ' : '  FEHLER'} ${msg}`); if (!ok) failed++; };

for (const id of TRACKS) {
  console.log(`Strecke ${id}`);
  const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`${e.message}\n${e.stack}`));
  await page.goto(`${base}?race=${id}&laps=1&racer=greta`);
  await page.waitForFunction(() => window.__kart?.race, null, { timeout: 60000 });
  const res = await page.evaluate(async () => {
    const k = window.__kart; k.paused = true;
    const r = k.race, p = r.player;
    const ai = k.ai;
    let used = 0, items = 0, maxSpeed = 0, drifts = 0, boosts = 0;
    const origUse = r.items.use.bind(r.items);
    r.items.use = (x) => { if (x.item) used++; return origUse(x); };
    const origGive = r.items.giveItem.bind(r.items);
    r.items.giveItem = (x) => { items++; return origGive(x); };
    // Die Spielerin fährt mit derselben KI wie die Gegner (Eingaben über window.__testInput)
    ai.initAI(p, 0.8, Math.random);
    let steps = 0;
    while (r.state !== 'done' && steps < 60 * 240) {
      window.__testInput = ai.aiInput(p, r, 1 / 60);
      k.step(1, 1 / 60, false);
      steps++;
      maxSpeed = Math.max(maxSpeed, p.speed);
      if (p.drift.on) drifts++;
      if (p.boostT > 0) boosts++;
    }
    k.step(0);
    return { state: r.state, time: r.time, steps, used, items, maxSpeed, drifts, boosts, place: p.place, finished: r.racers.filter((x) => x.finished).length, lapTime: p.finishTime };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `tests/out/race-${id}.png` });
  const rows = await page.evaluate(() => document.querySelectorAll('.results tr').length);
  check(res.state === 'done', `Rennen beendet (Zustand ${res.state}, ${(res.steps / 60).toFixed(0)} s)`);
  check(res.finished === 8, `alle acht im Ziel (${res.finished})`);
  check(rows === 8, `Ergebnisliste mit 8 Zeilen (${rows})`);
  check(res.lapTime > 15 && res.lapTime < 90, `Rundenzeit der Spielerin ${res.lapTime?.toFixed(1)} s, Platz ${res.place}`);
  check(res.items > 0, `Kisten eingesammelt: ${res.items}, Gegenstände benutzt: ${res.used}`);
  check(res.maxSpeed > 18, `Höchsttempo ${res.maxSpeed.toFixed(1)} m/s, Turbo-Bilder ${res.boosts}, Drift-Bilder ${res.drifts}`);
  check(errors.length === 0, `keine Konsolenfehler${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await page.close();
}
await browser.close();
server?.kill();
console.log(failed ? `${failed} Prüfung(en) fehlgeschlagen` : 'Alle Prüfungen bestanden');
process.exit(failed ? 1 : 0);

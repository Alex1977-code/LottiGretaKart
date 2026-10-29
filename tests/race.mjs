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
// Fälle: Runden auf jeder Strecke (jede in ihrer eigenen Welt), Grand Prix, Mehrspieler, Nacht und Wetter
const CASES = [
  ...['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege', 'autobahn', 'strand', 'gipfel', 'burg', 'wueste', 'vulkan', 'bonbon', 'loroparque', 'piratenbucht', 'dinodschungel', 'wrackriff', 'spukinsel', 'katzeninsel', 'hasenhuegel', 'palmencity', 'mitternacht', 'teneriffa', 'hafenstadt', 'arena', 'schlossring', 'schlucht'].map((t) => ({ id: t, q: `race=${t}&laps=1&racer=greta`, rows: 12 })),
  { id: 'mp-2', q: 'race=strand&laps=1&players=lotti:kb1,greta:kb2', rows: 12 },
  { id: 'gp-gleiter', q: 'mode=gp&race=schlucht&laps=1&racer=lotti', rows: 12 },
  { id: 'mp-4-gp', q: 'mode=gp&race=gipfel&laps=1&players=pflaume:pad0,bulle:pad1,kobold:kb1,baron:kb2', rows: 12 },
  { id: 'nacht-kraxelwiese', q: 'race=kraxelwiese&laps=1&racer=greta&night=1', rows: 12 },
  { id: 'regen-strand', q: 'race=strand&laps=1&racer=lotti&weather=rain', rows: 12 },
  { id: 'calima-wueste', q: 'race=wueste&laps=1&racer=greta&weather=calima&night=1', rows: 12 },
].filter((c) => !only || c.id === only);
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? '  ok  ' : '  FEHLER'} ${msg}`); if (!ok) failed++; };

for (const c of CASES) {
  const id = c.id;
  console.log(`Fall ${id}`);
  const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`${e.message}\n${e.stack}`));
  await page.goto(`${base}?${c.q}&quality=2`);   // Grafikstufe Hoch: Ultra ist im Software-Renderer zu langsam
  await page.waitForFunction(() => window.__kart?.race, null, { timeout: 120000 });
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
    // weitere Menschen (geteilter Bildschirm) fahren per Autopilot
    for (const h of r.humans ?? []) if (h !== p) { ai.initAI(h, 0.8, Math.random); h.autopilot = true; }
    let steps = 0;
    while (r.state !== 'done' && steps < 60 * 400) {
      window.__testInput = ai.aiInput(p, r, 1 / 60);
      k.step(1, 1 / 60, false);
      steps++;
      maxSpeed = Math.max(maxSpeed, p.speed);
      if (p.drift.on) drifts++;
      if (p.boostT > 0) boosts++;
    }
    k.step(0);
    return { state: r.state, time: r.time, steps, used, items, maxSpeed, drifts, boosts, place: p.place, finished: r.racers.filter((x) => x.finished).length, lapTime: p.finishTime, rescues: r.rescues ?? 0, length: r.track.finishS };
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__kart.freeze = true; });
  await page.screenshot({ path: `tests/out/race-${id}.png`, timeout: 120000 });
  const rows = await page.evaluate(() => document.querySelectorAll('.results tr').length);
  check(res.state === 'done', `Rennen beendet (Zustand ${res.state}, ${(res.steps / 60).toFixed(0)} s)`);
  check(res.finished === 12, `alle zwölf gewertet (${res.finished})`);
  check(rows === c.rows, `Ergebnisliste mit ${c.rows} Zeilen (${rows})`);
  check(res.lapTime > 15 && res.lapTime < 300, `Zeit der Spielerin ${res.lapTime?.toFixed(1)} s für ${res.length.toFixed(0)} m, Platz ${res.place}`);
  check(res.rescues <= 3, `Rettungen (Festgefahren/Meer): ${res.rescues}`);
  check(res.items > 0, `Kisten eingesammelt: ${res.items}, Gegenstände benutzt: ${res.used}`);
  check(res.maxSpeed > 18, `Höchsttempo ${res.maxSpeed.toFixed(1)} m/s, Turbo-Bilder ${res.boosts}, Drift-Bilder ${res.drifts}`);
  check(errors.length === 0, `keine Konsolenfehler${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await page.close();
}
// Grand Prix über das Menü: zwei Rennen nacheinander, dazwischen wird die nächste Strecken-Welt geladen
// (die alte abgebaut) – wie in Mario Kart 8 Deluxe
if (!only || only === 'menue-gp') {
  console.log('Fall menue-gp');
  const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`${e.message}\n${e.stack}`));
  await page.goto(`${base}?quality=2`);
  await page.waitForFunction(() => window.__kart?.race?.demo && document.querySelector('#loading.done'), null, { timeout: 120000 });
  const courses = [];
  for (let k = 0; k < 2; k++) {
    await page.evaluate((k) => {
      const m = window.__kart.menus;
      m.settings.laps = 1;
      if (k === 0) { m.mode = 'gp'; m.startGP(m.constructor.CUPS?.[0] ?? { id: 'gleiter', name: 'Gleiter-Cup', tracks: ['schlucht', 'hafenstadt', 'arena', 'schlossring'] }); }
      else document.querySelector('[data-next]').click();
    }, k);
    await page.waitForFunction(() => { const r = window.__kart?.race; return r && !r.demo && r.state !== 'done' && document.querySelector('#loading.done'); }, null, { timeout: 120000 });
    const res = await page.evaluate(() => {
      const k = window.__kart, r = k.race, p = r.player;
      k.paused = true;
      k.ai.initAI(p, 0.8, Math.random);
      let steps = 0;
      while (r.state !== 'done' && steps < 60 * 400) { window.__testInput = k.ai.aiInput(p, r, 1 / 60); k.step(1, 1 / 60, false); steps++; }
      k.paused = false;
      return { state: r.state, course: k.courseId, roads: k.world.roads.length, groups: k.scene.children.filter((c) => c.name === 'welt').length };
    });
    courses.push(res.course);
    check(res.state === 'done', `Rennen ${k + 1} (${res.course}) beendet`);
    check(res.roads === 1 && res.groups === 1, `nur die eine Strecke geladen (Straßen ${res.roads}, Welten ${res.groups})`);
    await page.waitForSelector('[data-next]', { timeout: 30000 });
  }
  check(courses[0] !== courses[1], `zweites Rennen auf neuer Strecke (${courses.join(' → ')})`);
  check(errors.length === 0, `keine Konsolenfehler${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await page.close();
}
await browser.close();
server?.kill();
console.log(failed ? `${failed} Prüfung(en) fehlgeschlagen` : 'Alle Prüfungen bestanden');
process.exit(failed ? 1 : 0);

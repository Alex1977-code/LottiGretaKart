// Schnelltest: Seite laden, Konsolenfehler sammeln, Screenshots zu Zeitpunkten.
// node tests/shot.mjs "<query>" name t1,t2,... [keys]   (keys z. B. "ArrowUp:hold")
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const [query = '', name = 'shot', times = '2', hold = ''] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}\n${e.stack}`));
await page.goto(base + query);
let tPrev = 0;
for (const k of hold.split(',').filter(Boolean)) await page.keyboard.down(k);
for (const t of times.split(',').map(Number)) {
  await page.waitForTimeout((t - tPrev) * 1000);
  tPrev = t;
  await page.screenshot({ path: `tests/out/${name}-${t}.png` });
  const info = await page.evaluate(() => {
    const r = window.__kart?.race;
    if (!r) return null;
    const p = r.player ?? r.racers[0];
    return { state: r.state, time: r.time?.toFixed(1), lap: p.lap, place: p.place, speed: p.speed.toFixed(1), pos: [p.pos.x.toFixed(1), p.pos.z.toFixed(1)], item: p.item?.id, coins: p.coins, places: r.racers.map((x) => `${x.id}:${x.place}:${x.lap}:${x.progress.toFixed(0)}`).join(' ') };
  });
  console.log(t, JSON.stringify(info));
}
console.log(errors.slice(0, 15).join('\n') || 'keine Fehler');
await browser.close();

// Sichtprüfung mit fester Kamera und vorgespultem Rennen.
// node tests/look.mjs "<query>" name '<js vor dem Screenshot>' ...
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const [query = '', name = 'look', ...scripts] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 720) } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`${m.type()}: ${m.text()}`); if (m.type() === 'log') console.log('log:', m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}\n${e.stack}`));
await page.goto(base + query);
await page.waitForFunction(() => window.__kart?.race || document.querySelector('.menus.visible'), null, { timeout: 60000 });
let k = 0;
for (const js of scripts) {
  const out = await page.evaluate(js);
  if (out !== undefined && out !== null) console.log(k, typeof out === 'string' ? out : JSON.stringify(out));
  await page.waitForTimeout(100);
  await page.screenshot({ path: `tests/out/${name}-${k}.png` });
  k++;
}
console.log(errors.slice(0, 15).join('\n') || 'keine Fehler');
await browser.close();

// Draufsicht einer Strecken-Welt als Bild (tests/out/world-<strecke>.ppm → per PIL in PNG): Gelände, Wasser,
// Straße, Banden, Schienen. Aufruf: node tools/draw-world.mjs <strecke>
import { World } from '../src/world/World.js';
import { courseWorldDef } from '../src/world/worldDef.js';
import { writeFileSync, mkdirSync } from 'node:fs';
const t0 = Date.now();
const id = process.argv[2] ?? 'kraxelwiese';
const w = new World(courseWorldDef(id));
console.log('Welt gebaut in', Date.now() - t0, 'ms; Höhenfeld', w.hf.nx, 'x', w.hf.nz, '; Banden-Segmente', w.segs.length);
const b = w.def.bounds, S = 0.6; // Pixel je Meter
const W = Math.round((b.maxX - b.minX) * S), H = Math.round((b.maxZ - b.minZ) * S);
const img = new Uint8Array(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const wx = b.minX + x / S, wz = b.minZ + y / S, h = w.heightAt(wx, wz);
  let c;
  if (h < 0) c = [40 + 8 * h, 120 + 8 * h, 220 + 3 * h];
  else if (h < 1.2) c = [230, 215, 160];
  else { const k = Math.min(1, h / 45); c = [90 + 110 * k, 190 - 40 * k, 70 + 60 * k]; }
  const i = (y * W + x) * 3; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
}
const dot = (wx, wz, col, r = 1) => {
  const cx = Math.round((wx - b.minX) * S), cy = Math.round((wz - b.minZ) * S);
  for (let a = -r; a <= r; a++) for (let c = -r; c <= r; c++) {
    const x = cx + a, y = cy + c; if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = (y * W + x) * 3; img[i] = col[0]; img[i + 1] = col[1]; img[i + 2] = col[2];
  }
};
for (const tr of w.roads) for (let i = 0; i < tr.N; i++) {
  const water = tr.water && tr.water[i];
  for (let l = -tr.hw[i]; l <= tr.hw[i]; l += 1.5) dot(tr.px[i] - tr.tz[i] * l, tr.pz[i] + tr.tx[i] * l, water ? [120, 200, 255] : [150, 145, 165], 0);
}
for (const [x1, z1, x2, z2] of w.segs) for (let k = 0; k <= 4; k++) dot(x1 + (x2 - x1) * k / 4, z1 + (z2 - z1) * k / 4, [220, 30, 30], 0);
for (const c of w.courses) dot(c.track.px[0], c.track.pz[0], [0, 0, 0], 3);
for (const r of w.def.rails) for (let k = 1; k < r.pts.length; k++) { const [a, c] = [r.pts[k - 1], r.pts[k]]; for (let q = 0; q <= 40; q++) dot(a[0] + (c[0] - a[0]) * q / 40, a[1] + (c[1] - a[1]) * q / 40, [255, 255, 255], 0); }
mkdirSync('tests/out', { recursive: true });
writeFileSync(`tests/out/world-${id}.ppm`, Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), Buffer.from(img)]));

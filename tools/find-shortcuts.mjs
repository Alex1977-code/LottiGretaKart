// Sucht je Strecke mögliche Abkürzungen: zwei Fahrbahnstellen, die über Land viel näher beieinander liegen als
// entlang der Strecke, ohne andere Fahrbahnteile, Wasser, Lava, Flugstrecken, Brücken oder steile Hänge zu kreuzen.
// Aufruf: node tools/find-shortcuts.mjs [id] → Vorschläge als shortcuts-Einträge (Strecken-Koordinaten)
import { World } from '../src/world/World.js';
import { courseWorldDef } from '../src/world/worldDef.js';
import { TRACKS } from '../src/tracks/index.js';

const only = process.argv[2];
for (const def of TRACKS) {
  if (only && def.id !== only) continue;
  if (def.noWalls) continue;
  let w;
  try { w = new World(courseWorldDef(def.id)); } catch (e) { console.log(def.id, 'Fehler', e.message); continue; }
  const c = w.courses[0], tr = c.track, N = tr.N;
  const bad = (i) => (tr.flight?.[i]) || (tr.hasLift && tr.lift[i] > 0.3) || (tr.ag?.[i]);
  let best = null;
  for (let i = Math.round(N * 0.05); i < N; i += 6) {
    if (bad(i)) continue;
    for (let gap = Math.round(N * 0.05); gap <= Math.round(N * 0.22); gap += 6) {
      const j = i + gap;
      if (j > N * 0.95 || bad(j)) continue;   // (nie über Start und Ziel)
      const d = Math.hypot(tr.px[j] - tr.px[i], tr.pz[j] - tr.pz[i]);
      const along = gap * tr.ds;
      const save = along - d;
      if (d < 25 || d > 130 || save < 22 || save > 110 || d / along > 0.8) continue;
      // Ränder: von der Fahrbahnkante aus (zur anderen Stelle hin)
      const dir = [(tr.px[j] - tr.px[i]) / d, (tr.pz[j] - tr.pz[i]) / d];
      const sideI = Math.sign(dir[0] * -tr.tz[i] + dir[1] * tr.tx[i]), sideJ = Math.sign(-dir[0] * -tr.tz[j] + -dir[1] * tr.tx[j]);
      const ax = tr.px[i] - tr.tz[i] * sideI * (tr.hw[i] - 0.5), az = tr.pz[i] + tr.tx[i] * sideI * (tr.hw[i] - 0.5);
      const bx = tr.px[j] - tr.tz[j] * sideJ * (tr.hw[j] - 0.5), bz = tr.pz[j] + tr.tx[j] * sideJ * (tr.hw[j] - 0.5);
      // Linie prüfen
      let ok = true, maxSlope = 0, ya = tr.profile[i], yb = tr.profile[j];
      const L = Math.hypot(bx - ax, bz - az);
      if (Math.abs(yb - ya) / L > 0.12) continue;
      for (let s = 0.12; s <= 0.88 && ok; s += 0.04) {
        const x = ax + (bx - ax) * s, z = az + (bz - az) * s;
        const h = w.heightAt(x, z);
        if (h < 0.6) { ok = false; break; }
        if (w.lava.some((l) => (x - l.x) ** 2 + (z - l.z) ** 2 < (l.r + 6) ** 2)) { ok = false; break; }
        const nr = tr.nearestIndex(x, z, 3, false);
        if (nr.d < tr.wallAt(nr.i) + 3) { ok = false; break; }
        const yLine = ya + (yb - ya) * s;
        maxSlope = Math.max(maxSlope, Math.abs(h - yLine));
      }
      if (!ok || maxSlope > 12) continue;
      const score = save - maxSlope * 3;
      if (!best || score > best.score) best = { score, i, j, d, save, along, ax, az, bx, bz, ya, yb, maxSlope };
    }
  }
  if (!best) { console.log(def.id.padEnd(16), '—'); continue; }
  const r = (v) => Math.round(v);
  const mx = (best.ax + best.bx) / 2, mz = (best.az + best.bz) / 2;
  console.log(def.id.padEnd(16), `spart ${r(best.save)} m (Weg ${r(best.d)} m statt ${r(best.along)} m), Höhen ${best.ya.toFixed(1)}→${best.yb.toFixed(1)}, Gelände ±${best.maxSlope.toFixed(1)}`,
    `\n   { pts: [[${r(best.ax - c.ox)}, ${r(best.az - c.oz)}], [${r(mx - c.ox)}, ${r(mz - c.oz)}], [${r(best.bx - c.ox)}, ${r(best.bz - c.oz)}]], c: [${tr.ctrlT[best.i].toFixed(2)}, ${tr.ctrlT[best.j].toFixed(2)}] }`);
}

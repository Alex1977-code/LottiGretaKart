// Prüft die Streckengeometrie: Abstand nicht benachbarter Abschnitte (Banden dürfen sich nicht schneiden),
// engster Kurvenradius gegen die Bandenbreite, Länge. Aufruf: node tools/check-tracks.mjs [id]
import { Track } from '../src/world/Track.js';
import { TRACKS } from '../src/tracks/index.js';
import { writeFileSync, mkdirSync } from 'node:fs';

const only = process.argv[2];
let bad = 0;
for (const def of TRACKS) {
  if (only && def.id !== only) continue;
  const tr = new Track(def, {});
  const N = tr.N;
  let worst = Infinity, wi = -1, wj = -1;
  for (let i = 0; i < N; i += 2) {
    for (let j = 0; j < N; j += 2) {
      const di = Math.min(Math.abs(i - j), N - Math.abs(i - j)) * tr.ds;
      if (di < 70) continue;
      const d = Math.hypot(tr.px[i] - tr.px[j], tr.pz[i] - tr.pz[j]);
      const need = tr.wallAt(i) + tr.wallAt(j) + 3;
      if (d - need < worst) { worst = d - need; wi = i; wj = j; }
    }
  }
  let minR = Infinity, ri = -1;
  for (let i = 0; i < N; i++) {
    const r = 1 / Math.max(1e-6, Math.abs(tr.curv[i]));
    const need = tr.wallAt(i) + 1;
    if (r - need < minR) { minR = r - need; ri = i; }
  }
  const ok = worst > 0 && minR > 0;
  // Umriss für die Sichtprüfung (tools/draw-tracks.py)
  mkdirSync('tests/out', { recursive: true });
  const pts = [];
  for (let i = 0; i < N; i++) pts.push([tr.px[i], tr.pz[i], tr.hw[i], tr.wallAt(i), tr.py[i]]);
  writeFileSync(`tests/out/track-${def.id}.json`, JSON.stringify({ pts, items: def.items ?? [], worst: [wi, wj], ri }));
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'XX '} ${def.id.padEnd(14)} Länge ${tr.length.toFixed(0)} m  Abstand-Reserve ${worst.toFixed(1)} m (bei u=${(wi / N).toFixed(2)}/${(wj / N).toFixed(2)})  Radius-Reserve ${minR.toFixed(1)} m (u=${(ri / N).toFixed(2)})`);
}
process.exit(bad ? 1 : 0);

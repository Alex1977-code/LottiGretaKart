// Übersicht je Kontrollpunkt-Abschnitt einer Strecke: Kurve, Höhe, Besonderheiten (für Tunnel/Felswände)
import { Track } from '../src/world/Track.js';
import { TRACKS } from '../src/tracks/index.js';
const id = process.argv[2];
const def = TRACKS.find((t) => t.id === id);
const tr = new Track(def, {});
const u2c = (u) => tr.ctrlT[Math.min(tr.N - 1, Math.round(u * tr.N))];
const marks = {};
const add = (c, s) => { const k = Math.floor(c); (marks[k] ??= new Set()).add(s); };
for (const r of def.ramps ?? []) add(u2c(r.u ?? r[0] ?? r), 'ramp');
for (const g of def.glides ?? []) add(g.c, 'glide');
for (const [a, b] of def.flights ?? []) for (let c = Math.floor(a); c <= b; c++) add(c, 'flight');
for (const [a, b] of def.bumps ?? []) for (let c = Math.floor(a); c <= b; c++) add(c, 'bump');
for (const [a, b] of def.antigrav ?? []) for (let c = Math.floor(a); c <= b; c++) add(c, 'ag');
for (const h of def.hazards ?? []) add(u2c(h.u ?? 0), h.kind);
for (const b of def.bouncers ?? []) add(u2c(b.u ?? b[0]), 'bouncer');
def.ctrl.forEach((p, c) => { if (p[3]) add(c, 'lift'); });
const n = def.ctrl.length;
for (let c = 0; c < n; c++) {
  let maxK = 0, len = 0;
  for (let i = 0; i < tr.N; i++) if (Math.floor(tr.ctrlT[i]) === c) { maxK = Math.max(maxK, Math.abs(tr.curv[i])); len += tr.ds; }
  console.log(`${String(c).padStart(2)}  ${def.ctrl[c].slice(0, 2).join(',').padEnd(10)} len ${len.toFixed(0).padStart(4)} m  R ${(1 / Math.max(maxK, 1e-4)).toFixed(0).padStart(5)} m  h ${def.heights?.[c] ?? '-'}  ${[...(marks[c] ?? [])].join(' ')}`);
}

// Rennen über mehrere Handys. Der Gastgeber rechnet das Rennen (Computer-Fahrer, Gegenstände, Treffer, Wertung)
// und schickt ~20-mal pro Sekunde einen Schnappschuss. Jeder Gast fährt sein eigenes Kart selbst (sofortige
// Steuerung, keine Verzögerung) und meldet Lage und Tasten an den Gastgeber; alle anderen Karts zeigt der Gast so,
// wie der Schnappschuss sie beschreibt (weich nachgeführt).
//
// Wirkungen vom Gastgeber auf das Kart des Gasts (Treffer, Turbo durch Gegenstände, Stern, Riesentrank, Bitcoins,
// Gegenstand im Kasten) werden aus dem Schnappschuss übernommen.

import * as THREE from 'three';
import { ITEM_IDS } from '../game/items.js';

const r2 = (v) => Math.round(v * 100) / 100;
const TIMERS = ['boostT', 'starT', 'giantT', 'spinT', 'tumbleT', 'squishT', 'throwT'];
const PROJ_KINDS = ['panzer', 'goldpanzer', 'kaefer', 'kickbombe', 'funkenball', 'zauberkugel'];
const PROJ_MODEL = { panzer: ['panzer', {}, 1], goldpanzer: ['panzer', { gold: true }, 1], kaefer: ['krabbelkaefer', { color: 'red' }, 1.25], kickbombe: ['kickbombe', {}, 1.2], funkenball: ['funkenball', {}, 1.4], zauberkugel: ['zauberkugel', {}, 2.2] };

// ------------------------------------------------------------------ Gastgeber
/** Schnappschuss des ganzen Rennens (kompakt). */
export function hostSnapshot(race) {
  const R = race.racers.map((r) => {
    const flags = (r.air ? 1 : 0) | (r.finished ? 2 : 0) | (r.out ? 4 : 0) | (r.grind ? 8 : 0) | (r.trick?.done ? 16 : 0) | (r.parked ? 32 : 0);
    return [
      r2(r.pos.x), r2(r.pos.y), r2(r.pos.z), r2(r.yaw), r2(r.speed), r2(r.steer), r.drift.on ? r.drift.dir : 0, r.drift.level, flags,
      ...TIMERS.map((k) => r2(r[k] ?? 0)),
      r.coins, r.item ? ITEM_IDS.indexOf(r.item.id) : -1, r.item?.charges ?? 0, r.roulette > 0 ? 1 : 0,
      r.place, r.lap, r2(r.progress), r.finished ? r2(r.finishTime ?? 0) : 0, r.cp ?? 0, r2(r.vy ?? 0),
    ];
  });
  const P = race.items.projectiles.filter((p) => !p.dead).map((p) => [p.nid, PROJ_KINDS.indexOf(p.kind), r2(p.pos.x), r2(p.pos.y), r2(p.pos.z), r2(p.yaw ?? 0)]);
  const B = [], C = [];
  race.items.boxes.forEach((b, k) => { if (!b.active) B.push(k); });
  race.items.coins.forEach((c, k) => { if (!c.active) C.push(k); });
  const ev = race.netEvents.splice(0);
  return { t: 's', st: race.state, tm: r2(race.time), R, P, B, C, ev };
}

/** Lage eines Gast-Karts auf der Kopie beim Gastgeber übernehmen (mit kleiner Vorausschau), Fortschritt rechnen. */
export function applyRemote(race, r, dt) {
  const s = r.netState;
  if (!s) return;
  const age = Math.min(0.25, (performance.now() - s.at) / 1000);
  const fx = Math.cos(s.yaw), fz = -Math.sin(s.yaw);
  const tx = s.x + fx * s.speed * age, tz = s.z + fz * s.speed * age;
  const k = 1 - Math.exp(-18 * dt);
  if ((r.pos.x - tx) ** 2 + (r.pos.z - tz) ** 2 > 36) r.pos.set(tx, s.y, tz);
  else { r.pos.x += (tx - r.pos.x) * k; r.pos.z += (tz - r.pos.z) * k; r.pos.y += (s.y - r.pos.y) * k; }
  r.yaw = s.yaw; r.speed = s.speed; r.vy = s.vy; r.air = s.air; r.steer = s.steer;
  r.drift.on = !!s.dOn; r.drift.dir = s.dDir; r.drift.level = s.dLv;
  if (r.path) {
    r.path.locate(r.pos.x, r.pos.z, r.loc.i ?? -1, r.loc);
    r.updateProgress(r.loc);
  }
  // Gegenstand: Tastendruck (Flanke) des Gasts
  if (s.item && !r.netItemPrev && !r.disabled) race.items.use(r);
  r.netItemPrev = s.item;
}

// ------------------------------------------------------------------ Gast
/** Eigene Lage und Tasten für den Gastgeber. */
export function guestState(r, inp) {
  return {
    t: 'u', x: r2(r.pos.x), y: r2(r.pos.y), z: r2(r.pos.z), yaw: r2(r.yaw), speed: r2(r.speed), vy: r2(r.vy ?? 0), air: !!r.air,
    steer: r2(r.steer), dOn: r.drift.on ? 1 : 0, dDir: r.drift.dir, dLv: r.drift.level, item: !!inp.item,
  };
}

/** Schnappschuss des Gastgebers auf das Rennen des Gasts anwenden. */
export function guestApply(race, snap) {
  const now = performance.now();
  race.netHostState = snap.st;
  race.netHostTime = snap.tm;
  snap.R.forEach((a, k) => {
    const r = race.racers[k];
    if (!r) return;
    const [x, y, z, yaw, speed, steer, dDir, dLv, flags] = a;
    const tim = a.slice(9, 9 + TIMERS.length);
    const [coins, itemIdx, charges, roul, place, lap, progress, fin, cp, vy] = a.slice(9 + TIMERS.length);
    r.place = place;
    if (r.puppet) {
      r.netTarget = { x, y, z, yaw, speed, at: now };
      r.steer = steer; r.drift.on = dDir !== 0; r.drift.dir = dDir; r.drift.level = dLv;
      r.air = !!(flags & 1); r.vy = vy; r.grind = flags & 8 ? r.grind ?? {} : null;
      r.trick.done = !!(flags & 16);
      TIMERS.forEach((key, i) => { r[key] = tim[i]; });
      r.coins = coins; r.lap = lap; r.progress = progress;
      r.item = itemIdx >= 0 ? { id: ITEM_IDS[itemIdx], charges } : null; r.roulette = roul ? 1 : 0;
    } else {
      // eigenes Kart: Wirkungen übernehmen, die der Gastgeber ausgelöst hat
      TIMERS.forEach((key, i) => { if (tim[i] > (r[key] ?? 0) + 0.15) r[key] = tim[i]; });
      if (tim[3] > 0.3 || tim[4] > 0.3) r.cancelDrift?.();
      r.coins = coins;
      r.item = itemIdx >= 0 ? { id: ITEM_IDS[itemIdx], charges } : null;
      r.roulette = roul ? 0.5 : 0;
      if (fin && !r.finished && !(flags & 4)) { r.finishTimeHost = fin; race.finishRacer(r); }
    }
    if (flags & 4 && !r.out) race.eliminate(r);
    // Computer-Fahrer hat die Auslaufzone verlassen
    if (flags & 32 && !r.parked) { r.parked = true; r.root.visible = false; race.effects.sparkle(r.pos, 0xfff2a0, 18, 3); }
  });
  // Kisten und Bitcoins
  const B = new Set(snap.B), C = new Set(snap.C);
  race.items.boxes.forEach((b, k) => { const act = !B.has(k); if (act && !b.active) b.pop = 0; b.active = act; });
  race.items.coins.forEach((c, k) => { c.active = !C.has(k); });
  // Geschosse: anlegen, bewegen, entfernen
  const seen = new Set();
  for (const [id, kind, x, y, z, yaw] of snap.P) {
    seen.add(id);
    let p = race.netProj.get(id);
    if (!p) {
      const kk = PROJ_KINDS[kind] ?? 'panzer', [model, opts, scale] = PROJ_MODEL[kk];
      p = race.items.addProjectile({ kind: kk, modelName: model, opts, scale, pos: new THREE.Vector3(x, y, z), yaw, life: 1e9, puppet: true });
      race.netProj.set(id, p);
    }
    p.target = { x, y, z, yaw };
  }
  for (const [id, p] of race.netProj) if (!seen.has(id)) { race.items.remove(p); race.netProj.delete(id); }
  // Ereignisse (Explosionen)
  for (const e of snap.ev ?? []) if (e[0] === 'ex') race.effects.explosion(new THREE.Vector3(e[1], e[2], e[3]), e[4]);
}

/** Andere Karts (und Geschosse) beim Gast weich zur gemeldeten Lage führen. */
export function guestPuppets(race, dt) {
  const now = performance.now();
  const k = 1 - Math.exp(-14 * dt);
  for (const r of race.racers) {
    const tg = r.netTarget;
    if (!r.puppet || !tg || r.out || r.parked) continue;
    const age = Math.min(0.3, (now - tg.at) / 1000);
    const fx = Math.cos(tg.yaw), fz = -Math.sin(tg.yaw);
    const x = tg.x + fx * tg.speed * age, z = tg.z + fz * tg.speed * age;
    if ((r.pos.x - x) ** 2 + (r.pos.z - z) ** 2 > 64) r.pos.set(x, tg.y, z);
    else { r.pos.x += (x - r.pos.x) * k; r.pos.z += (z - r.pos.z) * k; r.pos.y += (tg.y - r.pos.y) * k; }
    let d = tg.yaw - r.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    r.yaw += d * k;
    r.speed = tg.speed;
  }
  for (const p of race.netProj.values()) {
    const tg = p.target;
    if (!tg) continue;
    p.pos.x += (tg.x - p.pos.x) * k; p.pos.y += (tg.y - p.pos.y) * k; p.pos.z += (tg.z - p.pos.z) * k;
    p.holder.position.copy(p.pos);
    p.holder.rotation.y = tg.yaw;
    p.model.update(dt, p.kind === 'kickbombe' ? { anim: 'lit', fuse: 0.5 } : 'idle');
  }
}

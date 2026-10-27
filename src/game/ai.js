// Computer-Fahrer: folgen der Ideallinie (innen in Kurven, sonst eigene Spur), driften in langen Kurven für
// den Mini-Turbo, weichen nicht aus, setzen Gegenstände nach einfachen Regeln ein und befreien sich, wenn sie
// an der Bande hängen. skill (0..1) wächst mit der Klasse.

const TAU = Math.PI * 2;
const wrapA = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; else if (a < -Math.PI) a += TAU; return a; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function initAI(racer, skill, rnd) {
  racer.ai = {
    skill,
    lane: (rnd() - 0.5) * 0.8,      // bevorzugte Spur (Anteil der halben Breite)
    laneT: 2 + rnd() * 4,
    stuck: 0, reverse: 0,
    itemWait: 1 + rnd() * 3,
    drifting: false,
    wobble: rnd() * 10,
    rnd,
  };
}

/** Eingabe für einen Computer-Fahrer (auch für die Spielerin nach dem Zieleinlauf). */
const STONES = [], NONE = [];   // wiederverwendet (keine neuen Listen je Bild)

export function aiInput(racer, race, dt) {
  const ai = racer.ai, track = racer.path, inp = { steer: 0, throttle: 1, brake: 0, drift: false, item: false };
  const N = track.N, i = racer.loc.i;
  ai.laneT -= dt;
  if (ai.laneT <= 0) { ai.lane = clamp(ai.lane + (ai.rnd() - 0.5) * 0.7, -0.7, 0.7); ai.laneT = 2 + ai.rnd() * 4; }
  // Ausweichen der Bitcoins/Kisten: nicht nötig – Kisten liegen über die ganze Breite
  const speed = Math.abs(racer.speed);
  // neben der Fahrbahn (oder an der Bande): kurz vorausschauen und zur Mitte zurück
  const offTrack = Math.abs(racer.loc.lat) > track.hw[i] + 0.5;
  const look = offTrack ? 4 + speed * 0.25 : 7 + speed * 0.55;
  const k = Math.round(look / track.ds);
  const j = track.wrap(i + k);
  // Kurve voraus: innen fahren (geschickte Fahrer stärker)
  let curv = 0;
  for (let q = 4; q <= 26; q += 4) curv += track.curv[track.wrap(i + q)];
  curv /= 6;
  const inside = clamp(Math.sign(curv) * Math.min(1, Math.abs(curv) * 22), -0.75, 0.75) * (0.4 + 0.5 * ai.skill);
  let laneF = offTrack ? clamp(racer.loc.lat / track.hw[i], -0.5, 0.5) : clamp(ai.lane * (1 - Math.abs(inside)) + inside, -0.78, 0.78);
  // Stampfsteine umfahren: freie Spur suchen, die der gewünschten am nächsten liegt
  const stones = STONES;
  stones.length = 0;
  const hl = race.hazards?.list ?? NONE;
  for (let hk = 0; hk < hl.length; hk++) {
    const h = hl[hk];
    // Stampfsteine immer, Schnappblumen und Schneebälle nur geschickte Fahrer
    const snap = h.kind === 'snapper' || h.kind === 'roller';
    if (h.kind !== 'stampfstein' && !(snap && ai.skill > 0.5) || !h.p) continue;
    if ((h.p.x - racer.pos.x) ** 2 + (h.p.z - racer.pos.z) ** 2 > 40 * 40) continue;
    const q = track.locate(h.p.x, h.p.z, i, ai._sl ?? (ai._sl = {}));
    if (Math.abs(q.lat) > q.hw + 3) continue; // liegt nicht an meinem Weg
    if (h.kind === 'snapper') stones.push({ ahead: (q.i - i) * track.ds, lat: q.lat - Math.sign(q.lat) * 1.8, size: 4 });
    else stones.push({ ahead: (q.i - i) * track.ds, lat: q.lat, size: h.size ?? h.R * 2 });
  }
  if (stones.length) {
    const hwHere = track.hw[i];
    const blocked = (lat) => stones.some((h) => h.ahead > -2 && h.ahead < 28 && Math.abs(lat - h.lat) < h.size * 0.5 + 1.5);
    if (blocked(laneF * hwHere)) {
      let best = laneF, bd = Infinity;
      for (let f = -0.85; f <= 0.851; f += 0.085) {
        if (blocked(f * hwHere)) continue;
        const d = Math.abs(f - laneF);
        if (d < bd) { bd = d; best = f; }
      }
      laneF = best;
    }
  }
  const tp = track.pointAt(j / N, laneF * track.hw[j]);
  const want = Math.atan2(-(tp.z - racer.pos.z), tp.x - racer.pos.x);
  let diff = wrapA(want - racer.yaw);
  // leichte Ungenauigkeit (schwächere Fahrer schlingern mehr)
  ai.wobble += dt;
  diff += Math.sin(ai.wobble * 1.3) * 0.05 * (1 - ai.skill);
  inp.steer = clamp(diff * 2.4, -1, 1);
  if (Math.abs(diff) > 1.1 && speed > 12) { inp.throttle = 0.4; inp.brake = 0.3; }

  // Driften in langen Kurven
  const sharp = Math.abs(curv);
  const d = racer.drift;
  if (ai.skill > 0.3 && !racer.air) {
    if (!d.on && !d.hop && sharp > 0.022 && speed > 13 && ai.rnd() < 0.08 * ai.skill) ai.drifting = true;
    if (d.on && (sharp < 0.008 || inp.steer * d.dir < -0.4 || d.level >= (ai.skill > 0.7 ? 2 : 1) && sharp < 0.015)) ai.drifting = false;
  }
  // nicht driften beim Grinden, in der Luft nach Schienen/Schanzen oder wenn das Kart quer zur Strecke steht
  if (racer.grind || Math.abs(diff) > 0.8) ai.drifting = false;
  if (ai.drifting) {
    inp.drift = true;
    if (!d.on && !d.hop) inp.steer = Math.sign(-curv) * Math.max(0.5, Math.abs(inp.steer));
    if (d.hop && racer.air) inp.steer = Math.sign(-curv || inp.steer);
  }
  if (!ai.drifting && (d.on || d.hop)) inp.drift = false;

  // Feststecken (kaum Fortschritt, z. B. an der Bande): kurz rückwärts mit Gegenlenkung
  const running = race.state === 'race' || race.state === 'finish' || race.state === 'demo';
  // (Wenden zählt nicht als Feststecken: nur wenn das Kart dabei auch langsam ist)
  if (ai.progRef === undefined || racer.progress > ai.progRef + 3 || !running || racer.disabled || speed > 5) { if (speed > 5 && racer.progress <= ai.progRef + 3) ai.stuck = Math.max(0, ai.stuck - dt); else { ai.progRef = racer.progress; ai.stuck = 0; } }
  else ai.stuck += dt;
  if (ai.stuck > 1.6 && ai.reverse <= 0) { ai.reverse = 1.0; ai.stuck = 0; ai.drifting = false; ai.progRef = racer.progress; }
  if (speed < 6 && !racer.drift.hop) ai.drifting = false;
  if (ai.reverse > 0) {
    ai.reverse -= dt;
    inp.throttle = 0; inp.brake = 1; inp.steer = -Math.sign(diff); inp.drift = false;
  }

  // Gegenstände
  if (racer.item && racer.roulette <= 0) {
    ai.itemWait -= dt;
    if (ai.itemWait <= 0 && shouldUse(racer, race)) { inp.item = true; ai.itemWait = 0.6 + ai.rnd() * 2.5; }
  }
  return inp;
}

function shouldUse(racer, race) {
  const id = racer.item.id;
  const ahead = race.racerAhead(racer), behind = race.racerBehind(racer);
  const dA = ahead ? ahead.progress - racer.progress : Infinity;
  const dB = behind ? racer.progress - behind.progress : Infinity;
  switch (id) {
    case 'beere': case 'beere3': return Math.abs(racer.path.curv[racer.loc.i]) < 0.02;
    case 'stern': case 'riese': case 'zauberkugel': return true;
    case 'panzer': case 'funken': return dA < 40 && aimed(racer, ahead) || racer.ai.rnd() < 0.01;
    case 'goldpanzer': return dA < 120 || racer.ai.rnd() < 0.01;
    case 'kickbombe': return dA < 35 || dB < 12 || racer.ai.rnd() < 0.008;
    case 'kaefer': return dB < 18 || racer.ai.rnd() < 0.006;
    default: return true;
  }
}

function aimed(r, o) {
  if (!o) return false;
  const dx = o.pos.x - r.pos.x, dz = o.pos.z - r.pos.z, l = Math.hypot(dx, dz) || 1;
  return (dx * Math.cos(r.yaw) - dz * Math.sin(r.yaw)) / l > 0.9;
}

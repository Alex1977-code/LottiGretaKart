// Strecke 22: Hafenstadt – nach dem Vorbild von Toad-Hafen aus Mario Kart 8 Deluxe: Start an der Hafenpromenade
// (Kaimauer, Leuchtturm, Fischkutter), dann steil den Stadthügel hinauf wie in San Francisco, oben über zwei
// Kuppen (das Kart hebt ab), auf der anderen Seite die Straßenbahnstraße hinunter zum Markt und zurück an den Kai.
// Bunte Häuser stehen dicht an den Hangstraßen, Straßenbahnen fahren mit. Höhenprofil: 4 m am Hafen, 24 m oben.

export default {
  id: 'hafenstadt',
  name: 'Hafenstadt',
  short: 'Hafen',
  theme: 'harbor',
  music: 'course_river',
  banner: 'HAFENSTADT',
  hw: 7.5,
  margin: 4,
  seed: 522,
  ctrl: [
    // Hafenpromenade ostwärts (rechts das Hafenbecken)
    [-180, 104], [-110, 104], [-40, 104], [40, 100], [100, 86],
    // um die Ecke und steil den Hügel hinauf
    [148, 56], [172, 14], [170, -28], [150, -64],
    // Platz oben, dann über die Kuppen nach Westen
    [112, -88, 8], [64, -96, 7.5], [26, -98, 7.5], [-12, -98, 7.5], [-48, -96, 7.5], [-86, -88],
    // Straßenbahnstraße hinab zum Markt
    [-124, -66, 7], [-150, -32, 7], [-162, 6, 7], [-182, 40, 7.5], [-214, 58], [-238, 80], [-230, 102],
  ],
  heights: [
    4, 4, 4, 4.5, 5.5,
    8, 12.5, 17, 20.5,
    22.5, 21, 25, 20.5, 24, 21.5,
    18.5, 15, 11.5, 8, 5.5, 4.4, 4.1,
  ],
  // zwei scharfe Kuppen oben in der Stadt (wie die Hügelstraßen von San Francisco): hier hebt man ab
  bumps: [[10.75, 11.25, 1.6, 19], [12.75, 13.25, 1.6, 19]],
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.08, 0], [0.31, 0.3], [0.73, -0.3]],
  ramps: [[0.94, 0.35, 6]],
  coins: [[0.02, 0.06, -0.4, 0.4, 6], [0.24, 0.28, 0.3, -0.3, 5], [0.45, 0.5, 0, 0, 6], [0.66, 0.7, -0.3, 0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // Straßenbahnen auf der Hangstraße und am Kai
    { kind: 'traffic', u: 0.3, lane: -3, speed: 9, model: 'tram', length: 11 },
    { kind: 'traffic', u: 0.72, lane: 3, speed: 8, model: 'tram', length: 11 },
    { kind: 'traffic', u: 0.05, lane: 3.5, speed: 11, opts: { color: 0xe8392d } },
    { kind: 'traffic', u: 0.55, lane: -3, speed: 10, opts: { taxi: true } },
    // Krabben am Kai
    { kind: 'walker', u: 0.1, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.96, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3.2, scale: 1.6, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const uAt = (x, z) => {
      const X = tr.ox + x, Z = tr.oz + z;
      let best = 0, bd = Infinity;
      for (let i = 0; i < tr.N; i++) { const d = (tr.px[i] - X) ** 2 + (tr.pz[i] - Z) ** 2; if (d < bd) { bd = d; best = i; } }
      return best / tr.N;
    };
    const uKai1 = uAt(100, 86), uHill0 = uAt(148, 56), uTop0 = uAt(112, -88), uTop1 = uAt(-86, -88), uDown1 = uAt(-210, 62);

    // ---- Hafen: Kaimauer mit Pollern, Stege, Leuchtturm, Kräne, Fässer und Kisten
    for (const [u, len] of [[0.03, 16], [0.12, 14], [0.2, 18]]) D.model('dock', { u, side: 1, dist: 4 }, { opts: { length: len }, face: 'track' });
    D.model('lighthouse', W(60, 150), { scale: 1.3, always: true });
    for (let k = 0; k < 9; k++) D.model('barrel', { u: 0.015 + k * 0.022, side: 1, dist: 1.4 + (k % 2) * 1.2 }, { scale: 1.05, yaw: k });
    for (let k = 0; k < 6; k++) D.model('crate', { u: 0.04 + k * 0.03, side: 1, dist: 2.6 }, { scale: 1.2, yaw: k * 0.4 });
    for (let k = 0; k < 10; k++) D.model('street_lamp', { u: (k + 0.5) / 10 * uKai1, side: 1, dist: 0.6 }, { face: 'track' });
    D.scatter('palm', 14, { u0: 0, u1: uKai1, side: -1, dist0: 1, dist1: 5, s0: 1.1, s1: 1.5, colors: [0x3fa02a, 0x4fb833], size: 1.2 });

    // ---- bunte Häuser dicht an den Hangstraßen und am Kai (wie die Häuser von Toad-Hafen)
    const cols = [0xf2c14e, 0xe86a4a, 0x8ad0e8, 0x7ab85a, 0xf0a8c8, 0xfaf6ee, 0xd8762a, 0x6a8ae8, 0xb47fe6];
    const nr = {};
    const freeAt = (x, z) => {
      const r = D.world.nearestRoad(x, z, 2, nr);
      if (!r.road) return true;
      return r.d > (r.road.closed ? r.road.wallAt(r.i) : r.hw + 1) + 0.2;
    };
    let k = 0;
    for (let u = 0; u < 1; u += 0.0058) {
      for (const side of [-1, 1]) {
        if (side === 1 && u < uKai1) continue;   // Kaiseite bleibt offen
        const d = 7 + (k % 3), w = 6 + (k % 2) * 2, p0 = tr.pointAt(u, 0);
        const q = tr.pointAt(u, side * (tr.wallAt(p0.i) + 0.6 + d / 2));
        const tx = tr.tx[p0.i], tz = tr.tz[p0.i], nx = -tz * side, nz = tx * side;
        k++;
        if (k % 4 === 0) continue;   // Lücken zwischen den Häusern (Gassen, Blick auf den Hafen)
        let ok = freeAt(q.x, q.z);
        for (const a of [-1, 1]) for (const b of [-1, 1]) ok = ok && freeAt(q.x + nx * a * d / 2 + tx * b * w / 2, q.z + nz * a * d / 2 + tz * b * w / 2);
        if (!ok || D.world.heightAt(q.x, q.z) < 0.8) continue;
        D.model('canary_house', { u, side, dist: 0.6 + d / 2 }, { opts: { color: cols[k % cols.length], w, d, floors: 2 + (k % 3 === 0 ? 1 : 0), roof: k % 5 === 0 ? 'flat' : 'tile', balcony: k % 3 !== 1 } });
      }
    }
    // Häuser zwischen den Straßen am Hang (Stadt im Inneren der Runde)
    for (let k2 = 0; k2 < 30; k2++) {
      const p = W(-150 + (k2 % 6) * 52 + ((k2 * 37) % 17) - 8, -55 + Math.floor(k2 / 6) * 30 + ((k2 * 23) % 13) - 6);
      if (D.clear(p.x, p.z, 8) && freeAt(p.x, p.z)) D.model('canary_house', p, { yaw: (k2 % 4) * Math.PI / 2, opts: { color: cols[(k2 * 3) % cols.length], w: 9, d: 8, floors: 2 + (k2 % 3), roof: k2 % 3 ? 'tile' : 'flat', balcony: k2 % 2 === 0 } });
    }
    // Uhrturm (Kirche) oben am Platz, Markt mit Sonnenschirmen unten
    D.model('canary_church', W(120, -125), { yaw: Math.PI, always: true });
    for (let k3 = 0; k3 < 6; k3++) D.model('cafe_set', { u: uDown1 - 0.012 * k3, side: -1, dist: 3.5 }, { opts: { color: [0xe8392d, 0x2a6ab8, 0xf2c14e][k3 % 3] } });
    D.scatter('umbrella', 12, { u0: uDown1 - 0.08, u1: uDown1, side: 1, dist0: 2, dist1: 8, s0: 1, s1: 1.2, colors: [0xe8392d, 0x2a8ae8, 0xffc21a, 0x4fb833], size: 2 });
    // Laternen an der Hangstraße, Blumen in den Gassen
    for (let k4 = 0; k4 < 8; k4++) D.model('street_lamp', { u: uHill0 + (uTop0 - uHill0) * (k4 + 0.5) / 8, side: k4 % 2 ? 1 : -1, dist: 0.6 }, { face: 'track' });
    for (let k5 = 0; k5 < 10; k5++) D.model('street_lamp', { u: uTop0 + (uTop1 - uTop0) * (k5 + 0.5) / 10, side: k5 % 2 ? 1 : -1, dist: 0.6 }, { face: 'track' });
    D.scatter('flower', 80, { dist0: 0.5, dist1: 14, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xb47fe6, 0xffffff], size: 0.3 });
    D.scatter('bush', 30, { dist0: 1, dist1: 16, s0: 0.6, s1: 1, colors: [0x6ab83a, 0x7ac84a], size: 1.2 });

    for (const [u, side] of [[0.06, -1], [0.5, 1], [0.8, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['fairy_spotter', 'bunny_small', 'pilzling', 'krabbelkaefer']);
  },
};

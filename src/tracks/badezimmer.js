// Strecke: Badezimmer – Archetyp Miniatur-Welt aus Mario Kart 8 Deluxe (eigene Gestaltung): die Karts sind winzig
// im riesigen Bad – über die Fliesen an der Badewanne mit Schaumbergen vorbei, zwischen Seifenstücken hindurch, die
// Rampe (ein Handtuch) hinauf auf den Waschtisch an der Zahnbürste vorbei und mit dem Gleiter hinunter auf den Boden.
// Gummienten watscheln über die Bahn. Hell und sauber. Farben: Fliesenweiß, Hellblau, Entengelb, Chrom.

export default {
  id: 'badezimmer',
  name: 'Badezimmer',
  short: 'Bad',
  theme: 'bathroom',
  music: 'course_diorama',
  banner: 'BADEZIMMER',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1259,
  ctrl: [
    // Fliesenboden an der Badewanne entlang
    [-150, 80], [-60, 90], [30, 85], [110, 60],
    // die Handtuch-Rampe hinauf auf den Waschtisch
    [150, 10], [150, -50], [100, -95], [30, -110],
    // Gleitflug hinunter, zurück über den Boden
    [-40, -95], [-100, -60], [-160, -60], [-200, -10], [-190, 45],
  ],
  heights: [3, 3, 3, 3, 6, 12, 17, 17, 4, 3, 3, 3, 3],
  glides: [{ c: 7.2, w: 13 }],
  flights: [[7.4, 8.05]],
  land: {
    flats: [{ x: -20, z: 0, r: 700, h: 3 }],
    backdrop: false,
  },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.18, 0], [0.4, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0.3, -0.3, 5], [0.48, 0.52, 0, 0, 5], [0.74, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.12, model: 'rubber_duck', speed: 2, scale: 1.8, radius: 1.3 },
    { kind: 'walker', u: 0.75, model: 'rubber_duck', speed: 2.4, scale: 1.8, radius: 1.3 },
    { kind: 'pillar', u: 0.2, lat: 0.4, model: 'soap', r: 3, opts: { color: 0xff9ac8 } },
    { kind: 'pillar', u: 0.22, lat: -0.4, model: 'soap', r: 3, opts: { color: 0x8ad4f4 } },
    { kind: 'roller', u: 0.88, style: 'model', model: 'beach_ball', size: 1.6, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.model('room_walls', W(-20, 0), { opts: { size: 640, h: 180 }, always: true });
    D.model('bathtub', W(-40, 165), { yaw: 0, scale: 1.8, always: true });
    D.model('toothbrush', W(70, -150), { scale: 2.6, always: true });
    D.model('toothbrush', W(20, -160), { scale: 2.2, always: true });
    for (const [x, z, c] of [[-120, 20, 0xff9ac8], [40, 20, 0x8ad4f4], [180, 80, 0xffd21f], [-230, -90, 0x9af4b8]]) D.model('soap', W(x, z), { yaw: x, opts: { color: c }, scale: 3 });
    for (let k = 0; k < 10; k++) D.model('rubber_duck', { u: k / 10 + 0.04, side: k % 2 ? 1 : -1, dist: 8 + (k % 3) * 6 }, { yaw: k * 1.7, scale: 2.4 + (k % 3) * 0.6 });
    D.model('rubber_duck', W(-40, 165), { y: 30, scale: 9, always: true, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.2; e.model.update(dt, 'idle'); } });
    // Waschtisch: große Platte unter dem erhöhten Abschnitt
    D.model('soap', W(110, -90), { scale: 1.2, y: 14 });
    for (let k = 0; k < 12; k++) D.model('beach_ball', { u: k / 12 + 0.03, side: k % 2 ? -1 : 1, dist: 30 }, { y: 1, scale: 2 });
    for (const [uu, side] of [[0.14, -1], [0.5, 1], [0.82, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['rubber_duck', 'bunny_small', 'fairy_spotter']);
  },
};

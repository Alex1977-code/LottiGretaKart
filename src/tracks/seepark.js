// Strecke: Seepark – Archetyp Freizeitpark am See aus Mario Kart 8 Deluxe (eigene Gestaltung): Start auf der
// Promenade zwischen Karussells, Wasserrutschen und Buden, dann hinunter in den See: ein langer Abschnitt unter
// Wasser (Seegras, Fischschwärme, Riesenmuscheln, Quallen als Hindernis), auf der anderen Seite die Rampe hinauf
// und in der Anti-Gravitations-Kurve um das große Riesenrad (Spin-Pfosten), zurück zur Promenade.
// Heller, freundlicher Tag. Farben: kräftiges Blau, Pink, Gelb, Weiß – Kirmes-Optik.

export default {
  id: 'seepark',
  name: 'Seepark',
  short: 'Seepark',
  theme: 'park',
  music: 'course_river',
  banner: 'SEEPARK',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 912,
  ctrl: [
    // Promenade ostwärts durch den Park (rechts die Fahrgeschäfte, links das Seeufer)
    [-150, 110], [-60, 116], [30, 112], [110, 96],
    // um die Ecke und hinunter in den See
    [158, 52], [152, 0], [112, -42],
    // unter Wasser quer durch den See
    [52, -72], [-12, -82], [-64, -58],
    // Auffahrt am Westufer, Anti-Gravitations-Kurve um das Riesenrad
    [-96, -14], [-150, -34], [-205, -6], [-214, 48], [-188, 92],
  ],
  heights: [
    3, 3, 3, 3,
    3, 0.5, -5,
    -9, -10, -6.5,
    1.5, 5, 7, 6, 3.5,
  ],
  antigrav: [[10.6, 14.2, 40]],
  land: {
    lakes: [{ x: 20, z: -60, r: 125, depth: 11 }],
    flats: [{ x: -20, z: 120, r: 110, h: 3 }],
    hills: [[-160, 20, 70, 6], [-260, -120, 110, 32], [230, -140, 110, 36], [40, -280, 160, 44], [260, 160, 110, 26], [-240, 220, 110, 24]],
  },
  items: [0.1, 0.37, 0.58, 0.86],
  boosts: [[0.18, 0], [0.47, 0.3], [0.62, -0.3], [0.95, 0]],
  ramps: [{ c: 9.75, w: 7 }],   // Sprung aus dem Wasser an der Auffahrt
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.43, 0.5, 0, 0, 7], [0.74, 0.8, 0.4, 0.4, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // Quallen unter Wasser
    { kind: 'walker', u: 0.44, model: 'jellyfish', speed: 1.3, scale: 1.5, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.5, model: 'jellyfish', opts: { color: 'pink' }, speed: 1.1, scale: 1.3, radius: 0.9, anim: 'swim' },
    // Spin-Pfosten in der Kurve um das Riesenrad
    { kind: 'spinpost', u: 0.75, lat: -0.35 },
    { kind: 'spinpost', u: 0.82, lat: 0.35 },
    { kind: 'walker', u: 0.13, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Fahrgeschäfte rechts der Promenade, Riesenrad im Inneren der Anti-Gravitations-Kurve
    D.model('ferris_wheel', W(-160, 28), { yaw: 0.4, scale: 1.1, always: true });
    D.model('carousel', W(-90, 150), { always: true });
    D.model('carousel', W(70, 145), { scale: 0.9 });
    D.model('water_slide', W(-20, 155), { yaw: 1.2, always: true });
    D.model('water_slide', W(150, 120), { yaw: 2.4, scale: 0.9 });
    for (const [x, z] of [[-130, 140], [-40, 142], [20, 140], [110, 128], [-170, 150]]) D.model('balloons', W(x, z), { scale: 1.4 });
    for (let k = 0; k < 6; k++) D.model('cafe_set', { u: 0.02 + k * 0.04, side: 1, dist: 3.5 }, { opts: { color: [0xff4a9a, 0x1e8cff, 0xffd23a][k % 3] } });
    D.scatter('umbrella', 30, { u0: 0, u1: 0.25, side: 1, dist0: 3, dist1: 30, s0: 1, s1: 1.3, colors: [0xff4a9a, 0x1e8cff, 0xffd23a, 0xfaf6ee], size: 2 });
    for (let k = 0; k < 10; k++) D.model('street_lamp', { u: 0.01 + k * 0.024, side: -1, dist: 0.6 }, { face: 'track' });
    D.scatter('palm', 30, { u0: 0, u1: 0.3, dist0: 1, dist1: 14, s0: 1.1, s1: 1.5, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    // Bootsanleger und Tretboote am Ufer
    D.model('dock', { u: 0.08, side: -1, dist: 5 }, { opts: { length: 16 }, face: 'track' });
    D.model('dock', { u: 0.2, side: -1, dist: 5 }, { opts: { length: 14 }, face: 'track' });
    // unter Wasser: Seegras, Korallen, Riesenmuscheln, Fischschwärme, Lichtstrahlen
    const u0 = 0.36, u1 = 0.62;
    D.scatter('reed', 80, { u0, u1, dist0: 1, dist1: 26, s0: 1.2, s1: 2, colors: [0x2f8a5a, 0x3a9a62], size: 0.8 });
    for (let k = 0; k < 12; k++) {
      const u = u0 + (u1 - u0) * (k + 0.5) / 12, side = k % 2 ? 1 : -1;
      D.model(['coral_branch', 'coral_fan', 'giant_clam', 'kelp', 'coral_brain', 'anemone'][k % 6], { u, side, dist: 3 + (k % 3) * 4 }, { scale: 1.3 });
    }
    for (const u of [0.42, 0.5, 0.56]) D.model('fish_school', { u, side: 1, dist: 6 }, { y: 4, scale: 1.4 });
    D.model('light_rays', { u: 0.47, lat: 0 }, { y: -2 });
    for (const [u, side] of [[0.07, -1], [0.3, 1], [0.7, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};

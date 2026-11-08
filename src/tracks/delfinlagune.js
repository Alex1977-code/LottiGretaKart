// Strecke: Delfinlagune – Archetyp Ozean-Strecke aus Mario Kart 8 Deluxe (eigene Gestaltung): Start am Sandstrand,
// hinein ins Meer: ein langer Abschnitt unter Wasser durch das Korallenriff und unter dem Felsbogen hindurch
// (Riesenmuscheln, Schildkröten, Mantas, Fischschwärme, Quallen), auf der anderen Seite hinauf auf den Holzsteg
// mit Wellen (Anti-Gravitation, Spin-Pfosten), neben dem Delfine springen, zurück zum Strand.
// Sonnig, Lichtstrahlen unter Wasser. Farben: Türkis bis Tiefblau, Korallenrot, Sandbeige, Perlweiß.

export default {
  id: 'delfinlagune',
  name: 'Delfinlagune',
  short: 'Lagune',
  theme: 'reef',
  music: 'course_river',
  banner: 'DELFINLAGUNE',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 974,
  // [x, z, halbe Breite?, Steghöhe?]
  ctrl: [
    // Sandstrand ostwärts
    [-150, 92], [-60, 96], [30, 90], [100, 60],
    // ins Meer, durch das Riff und unter dem Felsbogen hindurch
    [140, 0], [120, -60], [60, -100], [-10, -110], [-70, -90],
    // hinauf auf den Holzsteg mit Wellen
    [-110, -60, 7.5, 2.5], [-160, -30, 7.5, 2.5], [-200, 10, 7.5, 2.5],
    // zurück an Land
    [-200, 55], [-180, 85],
  ],
  heights: [
    2, 2, 1.5, 0.5,
    -6, -10, -11, -9, -3,
    0.5, 0.5, 0.5,
    1.5, 2,
  ],
  antigrav: [[8.9, 11.7, 0]],
  bumps: [[9.3, 11.4, 1.1, 16]],
  land: {
    sea: true,
    island: { cx: -40, cz: 120, rx: 230, rz: 70 },
    hills: [[-120, 170, 90, 18], [120, 170, 80, 14]],
  },
  items: [0.1, 0.38, 0.6, 0.86],
  boosts: [[0.2, 0], [0.45, 0.3], [0.55, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.36, 0, 0, 6], [0.48, 0.52, 0.35, 0.35, 5], [0.7, 0.76, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.4, model: 'jellyfish', speed: 1.3, scale: 1.5, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.5, model: 'jellyfish', opts: { color: 'pink' }, speed: 1.1, scale: 1.3, radius: 0.9, anim: 'swim' },
    { kind: 'walker', u: 0.57, model: 'jellyfish', speed: 1.5, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'spinpost', u: 0.78, lat: 0.35 },
    { kind: 'spinpost', u: 0.84, lat: -0.35 },
    { kind: 'walker', u: 0.1, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // Felsbogen über der Unterwasser-Fahrbahn, Riff mit Korallen, Riesenmuscheln, Schildkröten, Mantas
    D.model('rock_arch', { u: u(6.2), lat: 0 }, { opts: { span: 34 }, face: 'along', always: true });
    const u0 = u(4.2), u1 = u(8.6);
    for (let k = 0; k < 22; k++) {
      const uu = u0 + (u1 - u0) * (k + 0.5) / 22, side = k % 2 ? 1 : -1;
      D.model(['coral_branch', 'coral_fan', 'giant_clam', 'kelp', 'coral_brain', 'anemone', 'sea_star'][k % 7], { u: uu, side, dist: 2 + (k % 4) * 3.5 }, { scale: 1.2 + (k % 3) * 0.3 });
    }
    D.scatter('reed', 90, { u0, u1, dist0: 1, dist1: 26, s0: 1.2, s1: 2.2, colors: [0x2f8a5a, 0x3a9a62], size: 0.8 });
    for (const [uu, name] of [[0.38, 'sea_turtle'], [0.46, 'manta'], [0.52, 'sea_turtle']]) D.model(name, { u: uu, side: 1, dist: 8 }, { y: 4, scale: 1.4 });
    for (const uu of [0.36, 0.44, 0.5, 0.56]) D.model('fish_school', { u: uu, side: -1, dist: 6 }, { y: 3, scale: 1.4 });
    for (const uu of [0.4, 0.5]) D.model('light_rays', { u: uu, lat: 0 }, { y: -2 });
    // Delfine springen neben dem Steg
    for (let k = 0; k < 3; k++) {
      const base = tr.pointAt(u(9.5 + k * 0.8), (k % 2 ? 1 : -1) * 24);
      const dlf = D.model('dolphin', { x: base.x, z: base.z }, { scale: 1.3 });
      const y0 = 0, dir = tr.pointAt(u(9.5 + k * 0.8), 0).yaw;
      dlf.tick = (e, dt, t) => {
        const ph = ((t * 0.35 + k * 0.33) % 1);
        const jump = ph < 0.4 ? Math.sin((ph / 0.4) * Math.PI) : 0;
        e.model.root.visible = ph < 0.45;
        e.model.root.position.set(base.x + Math.cos(dir) * (ph * 30 - 6), y0 - 1.5 + jump * 6, base.z - Math.sin(dir) * (ph * 30 - 6));
        e.model.root.rotation.set(0, dir, Math.cos((ph / 0.4) * Math.PI) * 0.8);
      };
    }
    // Strand: Palmen, Sonnenschirme, Seesterne
    D.scatter('palm', 40, { u0: 0, u1: 0.25, dist0: 2, dist1: 30, s0: 1.2, s1: 1.8, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('umbrella', 26, { u0: 0, u1: 0.25, dist0: 3, dist1: 30, s0: 1, s1: 1.3, colors: [0xe8392d, 0x1e8cff, 0xffd23a, 0xff6aa8], size: 2 });
    D.scatter('starfish', 40, { u0: 0, u1: 0.3, dist0: 1, dist1: 20, s0: 1, s1: 1.4, colors: [0xff8a5a, 0xffc21a], size: 0.4 });
    D.model('lighthouse', { u: 0.15, side: -1, dist: 20 }, { scale: 1.2, always: true });
    for (const [uu, side] of [[0.08, 1], [0.66, -1], [0.92, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['krabbelkaefer', 'fairy_spotter', 'bunny_small']);
  },
};

// Strecke 15: Wrack-Riff – an der Nordküste, halb an Land, halb unter Wasser (wie in Mario Kart 8). Start am
// Hafenkai, über die Rampe hinein in die große Fähre „Lotti & Greta“ und quer durch ihr Autodeck (Fässer rollen
// über das Deck), vorn aus der offenen Bugklappe hinaus – Sprung ins Meer! Unter Wasser geht es über den
// Meeresgrund: Korallengarten, Quallen schweben über die Fahrbahn, Kugelfische flitzen vorbei, mitten durch ein
// altes versunkenes Schiffswrack und einen Felsbogen, durch den Seetangwald und zuletzt den Strand wieder hinauf.
// Unter Wasser schwebt das Kart bei Sprüngen länger und zieht Luftblasen hinter sich her.

const HW = 7.5;

export default {
  id: 'wrackriff',
  name: 'Wrack-Riff',
  short: 'Riff',
  theme: 'reef',
  music: 'course_diorama',
  banner: 'WRACK-RIFF',
  hw: HW,
  margin: 4,
  seed: 171,
  // [x, z, hw, lift]: lift > 0 = Deck in der Fähre (über dem Wasser), lift < 0 = unter dem Meeresspiegel
  ctrl: [
    [-60, 32], [10, 33], [60, 28], [95, 5], [113, -25, HW, 0.2],
    [116, -50, HW, 2.6], [116, -80, HW, 3], [116, -120, HW, 3], [116, -160, HW, 3], [115, -183, HW, 3],
    [111, -206, HW, -6.5], [96, -238, HW, -9], [57, -261, HW, -10.5], [0, -268, HW, -12.5], [-55, -262, HW, -11],
    [-100, -240, HW, -9], [-134, -200, HW, -8], [-150, -152, HW, -6.5], [-150, -104, HW, -3.5],
    [-140, -58, HW, -0.6], [-120, -8], [-92, 24],
  ],
  items: [0.07, 0.36, 0.55, 0.8],
  boosts: [[0.13, 0], [0.48, 0.3], [0.68, -0.3], [0.93, 0]],
  // Sprung aus der Bugklappe ins Meer
  ramps: [[0.366, 0, 9]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.22, 0.27, 0, 0, 6], [0.42, 0.45, 0.4, -0.4, 5], [0.6, 0.63, 0, 0, 5], [0.76, 0.79, -0.3, 0.3, 5]],
  hazards: [
    // Fässer rollen quer über das Autodeck der Fähre
    { kind: 'roller', u: 0.25, style: 'barrel', size: 1.3, speed: 6 },
    { kind: 'roller', u: 0.3, style: 'barrel', size: 1.3, speed: 7 },
    // Quallen schweben über die Fahrbahn
    { kind: 'walker', u: 0.46, model: 'jellyfish', speed: 1.3, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.47, model: 'jellyfish', opts: { color: 'pink' }, speed: 1.0, scale: 1.2, radius: 0.9, anim: 'swim' },
    { kind: 'walker', u: 0.72, model: 'jellyfish', speed: 1.5, scale: 1.4, radius: 1.0, anim: 'swim' },
    // Kugelfische flitzen quer
    { kind: 'brummer', u: 0.52, model: 'pufferfish', speed: 5 },
    { kind: 'brummer', u: 0.64, model: 'pufferfish', speed: 4.5 },
    { kind: 'walker', u: 0.82, model: 'jellyfish', opts: { color: 'pink' }, speed: 1.2, scale: 1.3, radius: 0.9, anim: 'swim' },
  ],
  bridgePillars: false,   // die Brücke ist das Autodeck der Fähre (keine Pfeiler im Meer)
  scenery(D) {
    const tr = D.track;
    // An Land: Strandgras, Palmen und Felsen am Hafen
    D.scatter('palm', 26, { dist0: 3, dist1: 40, s0: 1.0, s1: 1.6, colors: [0x4fb833, 0x5cc23c], size: 1.2 });
    D.scatter('bush', 30, { dist0: 1.5, dist1: 25, s0: 0.6, s1: 1.1, colors: [0x5ab84a, 0x4aa83a], size: 1.2 });
    D.scatter('rock', 16, { dist0: 2, dist1: 30, s0: 0.6, s1: 1.4, colors: [0x8a8078, 0x7a7068], size: 1.3 });
    D.scatter('flower', 50, { dist0: 0.5, dist1: 10, s0: 0.9, s1: 1.3, colors: [0xff3a5a, 0xffc21a, 0xffffff], size: 0.3 });

    // ---------------------------------------------------------------- Hafen
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.model('harbor_crane', W(70, -40), { yaw: Math.PI / 2 });
    D.model('harbor_crane', W(20, -48), { yaw: Math.PI / 2 + 0.1 });
    const contCols = [0xe8392d, 0x2a7ad8, 0x3aa84a, 0xffb21a, 0xf4f4f4, 0x8a3ab8];
    for (let k = 0; k < 14; k++) {
      const row = k % 2, stack = Math.floor(k / 2) % 3;
      D.model('container', W(30 + Math.floor(k / 6) * 7, -8 - row * 2.6), { opts: { color: contCols[k % contCols.length] }, y: stack * 2.6, yaw: Math.PI / 2 });
    }
    for (let k = 0; k < 6; k++) D.model('container', W(-30 + k * 7, -20), { opts: { color: contCols[(k + 2) % contCols.length] }, yaw: Math.PI / 2 + (k % 2) * 0.05 });
    for (const [x, z] of [[-40, -48], [-20, -50], [0, -52], [40, -55], [96, -40]]) D.model('bollard', W(x, z));
    D.model('lighthouse', W(-70, -62), { scale: 1.0 });
    D.model('dock', W(-30, -64), { yaw: Math.PI / 2, opts: { length: 18 } });
    for (const [u, side] of [[0.02, 1], [0.06, -1], [0.1, 1]]) for (let k = 0; k < 3; k++) D.model('barrel', { u: u + k * 0.006, side, dist: 1.5 });
    for (let k = 0; k < 6; k++) {
      const g = D.model('seagull', W(0, -40), { scale: 1.6, state: 'fly' });
      g.tick = (e, dt, t) => {
        const a = t * (0.25 + k * 0.03) + k * 1.1, r = 24 + k * 9;
        e.model.root.position.set(tr.ox + 30 + Math.cos(a) * r, 14 + k * 2 + Math.sin(t * 0.6 + k) * 1.5, tr.oz - 60 + Math.sin(a) * r * 0.7);
        e.model.root.rotation.set(0.25, -a - Math.PI / 2, 0);
        e.model.update(dt, 'fly');
      };
    }
    D.model('zoo_sign', { u: 0.02, side: 1, dist: 2 }, { opts: { text: 'Wrack-Riff', color: '#1a7ab8' }, face: 'track' });
    D.crowd(0.975, 1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small']);
    D.crowd(0.985, -1, ['fairy_spotter', 'pilzling', 'bunny_small']);

    // ---------------------------------------------------------------- Die Fähre (das Autodeck ist die Strecke)
    {
      const i = Math.round(0.3 * (tr.N - 1));
      const deck = tr.roadY(i, tr.px[i], tr.pz[i]);
      const f = D.model('ferry', W(116, -116.5), { yaw: Math.PI / 2, opts: { length: 130, width: 26, deck } });
      f.model.root.position.y = 0;
      f.tick = (e, dt) => e.model.update(dt, 'idle');
    }

    // ---------------------------------------------------------------- Unter Wasser
    const sea = (u, side, dist, name, o = {}) => D.model(name, { u, side, dist }, o);
    // versunkenes Schiffswrack über der Fahrbahn
    D.model('shipwreck', { u: 0.545, lat: 0 }, { opts: { length: 44, width: 27 }, face: 'along' });
    D.model('treasure_chest', { u: 0.53, side: 1, dist: 4 }, { yaw: 0.4, scale: 1.4 });
    D.model('treasure_pile', { u: 0.56, side: -1, dist: 5 }, { scale: 1.2 });
    // Felsbogen
    D.model('rock_arch', { u: 0.66, lat: 0 }, { opts: { span: 34 }, face: 'along' });
    // Korallengarten, Seetangwald, Anemonen, Seesterne, Muscheln
    const colors = ['pink', 'orange', 'purple', 'yellow', 'red', 'teal'];
    for (let k = 0; k < 70; k++) {
      const u = 0.41 + D.r() * 0.45, side = D.r() < 0.5 ? -1 : 1, dist = 1.5 + D.r() ** 1.4 * 26;
      const kelpy = u > 0.74;
      const pick = kelpy ? (D.r() < 0.6 ? 'kelp' : 'coral_fan') : ['coral_branch', 'coral_brain', 'coral_fan', 'coral_branch', 'anemone', 'sea_star', 'kelp'][Math.floor(D.r() * 7)];
      const s = 0.8 + D.r() * 0.9;
      D.model(pick, { u, side, dist }, { opts: { color: colors[Math.floor(D.r() * colors.length)], height: 6 + D.r() * 5 }, yaw: D.r() * Math.PI * 2, scale: pick === 'kelp' ? 1 : s });
    }
    for (const [u, side] of [[0.45, -1], [0.62, 1], [0.8, -1]]) sea(u, side, 3, 'giant_clam', { scale: 1.3 });
    for (const [u, side] of [[0.43, 1], [0.58, -1], [0.7, 1], [0.84, 1]]) sea(u, side, 6, 'bubble_vent');
    // Lichtstrahlen von oben (reichen bis zur Wasseroberfläche)
    for (const u of [0.43, 0.5, 0.6, 0.7, 0.77]) {
      const p = tr.pointAt(u, 0);
      const e = D.model('light_rays', { x: p.x, z: p.z }, { opts: { h: -p.y - 0.4 } });
      e.model.root.position.y = p.y;
    }
    // Fischschwärme, Schildkröte, Mantarochen, U-Boot
    for (const [u, side, cols] of [[0.44, 1, null], [0.52, -1, [0xff8a3a, 0xffffff]], [0.63, 1, null], [0.72, -1, [0xffd23a, 0x3a6aff]], [0.8, 1, null]]) {
      sea(u, side, 4, 'fish_school', { opts: { n: 32, r: 7, colors: cols ?? undefined } });
    }
    const swim = (name, cx, cz, r, y, w, scale = 1) => {
      const e = D.model(name, W(cx, cz), { scale });
      e.tick = (en, dt, t) => {
        const a = t * w + en.t;
        en.model.root.position.set(tr.ox + cx + Math.cos(a) * r, y + Math.sin(t * 0.5 + en.t) * 0.6, tr.oz + cz + Math.sin(a) * r);
        en.model.root.rotation.y = -a - Math.PI / 2 * Math.sign(w);
        en.model.update(dt, 'idle');
      };
    };
    swim('sea_turtle', 40, -230, 26, -5.5, 0.12, 1.4);
    swim('manta', -60, -230, 30, -4.5, -0.1, 1.6);
    swim('submarine', -20, -170, 30, -5, 0.06, 1.2);
    swim('sea_turtle', -120, -150, 18, -4, -0.15, 1.1);
    for (const [u, side] of [[0.47, 1], [0.6, -1], [0.75, 1]]) sea(u, side, 2.5, 'question_block', { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};

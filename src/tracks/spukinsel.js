// Strecke 16: Spukinsel – Halloween auf der kleinen Insel im Nordwesten, bei Vollmond. Start am Kürbisfeld, vorbei
// an Vogelscheuchen und Hexenkessel, quer am Friedhof entlang (Gespenster schweben über die Fahrbahn), mitten durch
// das Spukhaus (Kronleuchter, Ahnenbilder, die Hexe fliegt durch die Halle) und zurück durch den kahlen Wald.
// Kürbisse rollen über die Straße, Fledermäuse flattern tief.

export default {
  id: 'spukinsel',
  name: 'Spukinsel',
  short: 'Spuk',
  theme: 'halloween',
  music: 'course_diorama',
  banner: 'SPUKINSEL',
  hw: 7.5,
  margin: 4,
  seed: 191,
  // gegen den Uhrzeigersinn (von oben): rechts = außen, links = Friedhof im Innenfeld
  ctrl: [
    [-60, 95], [10, 100], [70, 90], [115, 60], [140, 15], [125, -30], [95, -55], [60, -60], [35, -85], [-10, -100],
    [-70, -100], [-115, -80], [-140, -40], [-135, 10], [-105, 40], [-110, 75],
  ],
  items: [0.07, 0.32, 0.53, 0.8],
  boosts: [[0.12, 0], [0.38, 0.3], [0.7, -0.3], [0.9, 0]],
  ramps: [[0.2, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.25, 0.28, 0.4, -0.4, 5], [0.45, 0.48, 0, 0, 5], [0.6, 0.63, 0, 0, 5], [0.84, 0.87, -0.3, 0.3, 4]],
  hazards: [
    // Gespenster schweben quer über die Fahrbahn
    { kind: 'walker', u: 0.22, model: 'ghost', speed: 1.6, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.47, model: 'ghost', speed: 1.2, scale: 1.3, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.75, model: 'ghost', speed: 1.8, scale: 1.4, radius: 1.0, anim: 'swim' },
    // Fledermäuse und die Hexe auf dem Besen
    { kind: 'brummer', u: 0.1, model: 'bat', speed: 6 },
    { kind: 'brummer', u: 0.35, model: 'bat', speed: 5 },
    { kind: 'brummer', u: 0.61, model: 'witch', speed: 5.5 },
    { kind: 'brummer', u: 0.86, model: 'bat', speed: 6.5 },
    // rollende Kürbisse
    { kind: 'roller', u: 0.28, style: 'model', model: 'pumpkin_ball', size: 1.4, speed: 5 },
    { kind: 'roller', u: 0.8, style: 'model', model: 'pumpkin_ball', size: 1.5, speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // dunkler Wald, Felsen, lila Pilze
    D.scatter('pineTree', 40, { dist0: 6, dist1: 50, s0: 1.0, s1: 1.7, colors: [0x1e3a2a, 0x24402e, 0x2a3a30], size: 2 });
    D.scatter('rock', 24, { dist0: 2, dist1: 35, s0: 0.6, s1: 1.4, colors: [0x5a5466, 0x4a4656], size: 1.3 });
    D.scatter('mushroom', 14, { dist0: 3, dist1: 30, s0: 0.4, s1: 0.8, colors: [0x8a3aff, 0x6a2ad8, 0xff6a1a], size: 1.5 });
    D.scatter('bush', 30, { dist0: 1.5, dist1: 20, s0: 0.6, s1: 1.1, colors: [0x2a4a2a, 0x344e30], size: 1.2 });
    for (let k = 0; k < 22; k++) D.model('dead_tree', { u: (k + 0.3) / 22, side: k % 3 ? 1 : -1, dist: 4 + (k % 4) * 5 }, { yaw: k * 1.3, scale: 1 + (k % 3) * 0.25 });

    // Vollmond über dem Meer (weit weg, leuchtet immer)
    {
      const m = D.model('moon', W(-260, -380), { opts: { r: 34 } });
      m.model.root.position.y = 130;
      m.model.root.lookAt(tr.ox, 30, tr.oz);
    }
    // Kürbislaternen an der Strecke, Laternenpfähle
    for (let k = 0; k < 34; k++) D.model('jack_o_lantern', { u: (k + 0.5) / 34, side: k % 2 ? 1 : -1, dist: 1.2 }, { opts: { size: 0.8 + (k % 3) * 0.25, face: k % 3 }, face: 'track' });
    for (let k = 0; k < 14; k++) D.model('lantern_post', { u: (k + 0.25) / 14, side: k % 2 ? -1 : 1, dist: 0.8 }, { face: 'track' });
    // Kürbisfeld mit Vogelscheuchen außen an der Startgeraden
    for (let k = 0; k < 40; k++) {
      const x = -90 + (k % 10) * 15 + ((k * 7) % 5), z = 122 + Math.floor(k / 10) * 9;
      D.model('jack_o_lantern', W(x, z), { opts: { size: 0.7 + ((k * 13) % 9) / 8, face: k % 3 }, yaw: -Math.PI / 2 + ((k * 5) % 7 - 3) * 0.15 });
    }
    D.model('scarecrow', W(-40, 128), { yaw: -Math.PI / 2, scale: 1.3 });
    D.model('scarecrow', W(50, 132), { yaw: -Math.PI / 2 - 0.3, scale: 1.2 });
    // Friedhof im Innenfeld: Grabsteinreihen, Eisenzaun, Gespenster, Kessel
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
      if ((r * 9 + c) % 7 === 3) continue;
      D.model('tombstone', W(-55 + c * 12 + (r % 2) * 4, -40 + r * 11), { opts: { kind: (r + c) % 3 }, yaw: -Math.PI / 2 + ((r * 3 + c) % 5 - 2) * 0.08 });
    }
    for (let k = 0; k < 6; k++) D.model('iron_fence', W(-66 + k * 6.2, -52), { yaw: 0 });
    for (let k = 0; k < 6; k++) D.model('iron_fence', W(-66 + k * 6.2, 18), { yaw: 0 });
    for (const [x, z] of [[-30, -15], [20, 5], [45, -30]]) {
      const g = D.model('ghost', W(x, z), { scale: 1.5, state: 'swim' });
      g.tick = (e, dt, t) => { const a = t * 0.3 + e.t; e.model.root.position.set(tr.ox + x + Math.cos(a) * 8, e.model.root.position.y, tr.oz + z + Math.sin(a) * 6); e.model.root.rotation.y = -a - Math.PI / 2; e.model.update(dt, 'swim'); };
    }
    D.model('cauldron', W(70, 30), { scale: 1.5 });
    D.model('cauldron', W(-80, 55), { scale: 1.2 });
    D.model('dead_tree', W(-10, -25), { scale: 1.8 });
    D.model('dead_tree', W(60, -5), { scale: 1.5, yaw: 2 });
    // Spinnennetze am Rand
    for (const [u, side] of [[0.17, 1], [0.42, -1], [0.7, 1], [0.95, -1]]) D.model('spider_web', { u, side, dist: 2.5 }, { face: 'along', scale: 1.3 });
    // das Spukhaus über der Fahrbahn (Nordgerade)
    D.model('haunted_mansion', { u: 0.604, lat: 0 }, { opts: { length: 50, width: 28 }, face: 'along' });
    // Fledermäuse kreisen ums Spukhaus
    for (let k = 0; k < 6; k++) {
      const b = D.model('bat', W(-40, -100), { scale: 1.6, state: 'fly' });
      b.tick = (e, dt, t) => { const a = t * (0.6 + k * 0.07) + k; e.model.root.position.set(tr.ox - 40 + Math.cos(a) * (18 + k * 3), 16 + Math.sin(t + k) * 2, tr.oz - 100 + Math.sin(a) * (14 + k * 2)); e.model.root.rotation.y = -a - Math.PI / 2; e.model.update(dt, 'fly'); };
    }
    for (const [u, side] of [[0.15, -1], [0.5, 1], [0.88, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small', 'pilzling']);
  },
};

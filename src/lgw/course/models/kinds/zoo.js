// Tierpark-Modelle für die Strecke „Loro Parque“ (eigene Gestaltung im Stil der Lotti-&-Greta-Welt).
// Maßstab Meter, Ursprung = Fußpunkt, Blick/Laufrichtung +X. state darf ein String sein ('swim' ≙ { anim: 'swim' }).
//
// Tiere
// orca            Schwertwal ≈ 5,5 m, schwarz-weiß.            state { anim: 'swim'|'idle' }  Schwanz schlägt.
// dolphin         Delfin ≈ 2,4 m, grau.                         state { anim: 'swim'|'idle' }
// shark           Hai ≈ 3 m, grau mit weißem Bauch.             state { anim: 'swim' }
// sea_lion        Seelöwe ≈ 1,5 m hoch, sitzt aufrecht.         state { anim: 'idle'|'clap' }  klatscht mit den Flossen.
// penguin         Pinguin ≈ 0,9 m.                              state { anim: 'idle'|'walk', speed }  watschelt.
// parrot          Papagei (Ara) ≈ 0,8 m.  opts { color: 'scarlet'|'blue'|'green' }
//                 state { anim: 'perch'|'fly' }  fly: Körper waagerecht, Flügel schlagen.
// flamingo        Flamingo ≈ 1,5 m, steht auf einem Bein.       state { anim: 'idle' }  Hals wiegt sich.
// gorilla         Gorilla ≈ 1,7 m, auf den Knöcheln.            state { anim: 'idle'|'beat' }  trommelt auf die Brust.
// tiger           Tiger ≈ 2,3 m lang.                           state { anim: 'idle'|'walk', speed }
//
// Bauten
// thai_pavilion   Thai-Pavillon (Eingang des Parks) ≈ 8 m breit, 10 m hoch, mit goldenen Dachspitzen.
// orca_pool       Show-Becken mit Tribüne.  opts { r (Beckenradius, 20) }  Ursprung = Beckenmitte, Tribüne auf −X,
//                 Glasscheibe auf +X (zur Strecke).  Wasserspiegel y = 0,9.
// lagoon          Rundes Becken mit Felsrand.  opts { r (12), color }  Wasserspiegel y = 0,35.
// shark_tunnel    Gläserner Halbröhren-Tunnel mit Aquarium darüber.  opts { length (36), width (18) }
//                 Ursprung = Mitte der Röhre am Boden, Achse entlang +X.  Haie kreisen über der Fahrbahn.
// penguin_house   Eis-Kuppel „Planet Penguin“ mit Schnee und Eisschollen.
// enclosure       Gehege: Steinmauer mit Holzzaun, Felsen und Büschen.  opts { r (10), ground }
// aviary          Vogelvoliere: goldene Kuppel aus Stäben mit Sitzstangen.  opts { r (5) }
// zoo_sign        Schild mit Aufschrift.  opts { text, color }

import * as THREE from 'three';
import { Build, mesh, vcol, std, basic, cached, joint, eyes, makeModel, Clock, TAU, clamp, canvasTexture } from '../lib/kit.js';

const sin = Math.sin, cos = Math.cos;

// ------------------------------------------------------------------ Hilfen
/** Farbverlauf für Meerestiere: oben dunkel, unten hell (yCut = Grenze in Objekt-Koordinaten). */
const topBelly = (top, belly, yCut, soft = 0.12) => ({ v: (x, y) => { const k = clamp((y - yCut) / soft + 0.5, 0, 1); return new THREE.Color(belly).lerp(new THREE.Color(top), k); } });

const TEX = new Map();
function signTexture(key, text, { bg = '#1554d0', fg = '#ffffff', stroke = '#0a2a6a', w = 1024, h = 192 } = {}) {
  if (TEX.has(key)) return TEX.get(key);
  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const r = h * 0.28;
    x.fillStyle = bg;
    x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 10; x.stroke();
    x.font = `bold ${Math.round(h * 0.56)}px "Lilita One", "Trebuchet MS", "Arial Rounded MT Bold", sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 14; x.strokeStyle = stroke; x.strokeText(text, w / 2, h * 0.54);
    x.fillStyle = fg; x.fillText(text, w / 2, h * 0.54);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  })();
  TEX.set(key, tex);
  return tex;
}

const water = (key = 'zoo:water', color = 0x1a90dc) => std(key, { color, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.9, emissive: 0x062a4a, emissiveIntensity: 0.35 });
const glass = () => std('zoo:glass', { color: 0xbfeaff, roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });

/** Schwanzflosse (waagerecht, zwei nach hinten gezogene Lappen). */
function flukes(b, len, span, color, x0 = 0) {
  for (const s of [1, -1]) b.sphere(1, color, { p: [x0 - len * 0.3, 0, s * span * 0.28], r: [0, s * 0.75, 0], s: [len * 0.42, len * 0.05, span * 0.2] }, 12, 6);
  return b;
}

// =============================================================================================
// Meerestiere
// =============================================================================================
function buildSwimmer(name, cfg) {
  const root = new THREE.Group();
  const bodyJ = joint([0, cfg.y, 0]);
  bodyJ.add(mesh(cached(`zoo:${name}:body`, cfg.body), vcol(cfg.rough ?? 0.25), {}, true));
  const tail = joint([-cfg.len * 0.48, 0, 0], mesh(cached(`zoo:${name}:tail`, cfg.tail), vcol(cfg.rough ?? 0.25), {}, true));
  bodyJ.add(tail);
  if (cfg.eyes) bodyJ.add(eyes(cfg.eyes, { key: `zoo:${name}`, iris: cfg.iris ?? 0x2a1a10, pupil: 0.62, depth: 0.5 }));
  root.add(bodyJ);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'swim';
    clk.tick(dt, anim);
    const f = anim === 'swim' ? cfg.hz ?? 2.2 : 0.8;
    const a = anim === 'swim' ? cfg.amp ?? 0.35 : 0.12;
    if (cfg.vertical) tail.rotation.y = sin(clk.t * f * TAU) * a;   // Haie schlagen seitlich
    else tail.rotation.z = sin(clk.t * f * TAU) * a;                // Wale und Delfine auf und ab
    bodyJ.rotation.z = cfg.vertical ? 0 : -sin(clk.t * f * TAU) * a * 0.12;
    bodyJ.rotation.y = cfg.vertical ? -sin(clk.t * f * TAU) * a * 0.15 : 0;
  };
  return makeModel(name, root, update);
}

function orca() {
  const L = 5.6;
  return buildSwimmer('orca', {
    len: L, y: 1.05, hz: 1.4, amp: 0.4, rough: 0.18,
    body: () => {
      const b = new Build();
      // Färbung in Koordinaten der Einheitskugel → auf Meter umrechnen
      const paintOrca = (ux, y, z) => {
        const x = ux * L * 0.5;
        if (y < -0.25 + 0.15 * Math.max(0, 1 - Math.abs(x - 0.6) / 2.4)) return 0xffffff;        // Bauch
        return 0x15161c;
      };
      b.sphere(1, paintOrca, { s: [L * 0.5, 1.0, 1.02] }, 34, 20);
      // weiße Augenflecken (leicht erhaben aufgesetzt)
      for (const s of [1, -1]) b.sphere(1, 0xffffff, { p: [1.72, 0.32, s * 0.7], r: [0, s * 0.35, -0.12], s: [0.45, 0.15, 0.1] }, 14, 8);
      // Rückenflosse (hoch, leicht nach hinten geneigt)
      b.cone(0.55, 1.7, 0x15161c, { p: [-0.2, 1.6, 0], r: [0, 0, 0.28], s: [1, 1, 0.2] }, 14);
      // Brustflossen (groß, rundlich)
      for (const s of [1, -1]) b.sphere(1, 0x15161c, { p: [1.0, -0.55, s * 0.95], r: [s * 0.6, 0, -0.4], s: [0.55, 0.09, 0.32] }, 12, 6);
      return b.geometry();
    },
    tail: () => flukes(new Build().sphere(1, 0x15161c, { p: [-0.25, 0, 0], s: [0.95, 0.4, 0.33] }, 14, 8), 1.4, 2.0, 0x15161c, -0.9).geometry(),
    eyes: [{ p: [2.02, 0.33, 0.66], r: 0.12, dir: [0.5, 0.1, 1] }, { p: [2.02, 0.33, -0.66], r: 0.12, dir: [0.5, 0.1, -1] }],
  });
}

function dolphin() {
  const L = 2.4;
  return buildSwimmer('dolphin', {
    len: L, y: 0.45, hz: 2.4, amp: 0.45, rough: 0.2,
    body: () => {
      const b = new Build();
      b.sphere(1, topBelly(0x6a86a8, 0xe8eef6, -0.05), { s: [L * 0.48, 0.4, 0.4] }, 28, 16);
      b.capsule(0.085, 0.2, 0xb8c8da, { p: [1.15, -0.06, 0], r: [0, 0, Math.PI / 2 - 0.1] }, 4, 10);   // Schnauze
      b.cone(0.2, 0.55, 0x5a7698, { p: [-0.1, 0.5, 0], r: [0, 0, 0.45], s: [1, 1, 0.25] }, 10);
      for (const s of [1, -1]) b.sphere(1, 0x5a7698, { p: [0.45, -0.25, s * 0.38], r: [s * 0.6, 0, -0.5], s: [0.26, 0.04, 0.12] }, 10, 5);
      return b.geometry();
    },
    tail: () => flukes(new Build().sphere(1, 0x6a86a8, { p: [-0.2, 0, 0], s: [0.4, 0.17, 0.15] }, 12, 6), 0.6, 0.9, 0x5a7698, -0.25).geometry(),
    eyes: [{ p: [0.82, 0.1, 0.26], r: 0.065, dir: [0.5, 0.2, 1] }, { p: [0.82, 0.1, -0.26], r: 0.065, dir: [0.5, 0.2, -1] }],
  });
}

function shark() {
  const L = 3.0;
  return buildSwimmer('shark', {
    len: L, y: 0.5, hz: 1.1, amp: 0.4, vertical: true, rough: 0.3,
    body: () => {
      const b = new Build();
      b.sphere(1, topBelly(0x5a6a7c, 0xf0f2f6, -0.12, 0.1), { s: [L * 0.48, 0.42, 0.44] }, 28, 16);
      b.cone(0.3, 0.75, 0x4a5a6c, { p: [0.05, 0.6, 0], r: [0, 0, 0.5], s: [1, 1, 0.18] }, 10);     // Rückenflosse
      for (const s of [1, -1]) b.sphere(1, 0x4a5a6c, { p: [0.45, -0.28, s * 0.45], r: [s * 0.4, 0, -0.6], s: [0.4, 0.05, 0.16] }, 10, 5);
      return b.geometry();
    },
    tail: () => {
      const b = new Build().sphere(1, 0x5a6a7c, { p: [-0.3, 0, 0], s: [0.55, 0.2, 0.18] }, 12, 6);
      b.cone(0.16, 0.9, 0x4a5a6c, { p: [-0.85, 0.32, 0], r: [0, 0, 0.7], s: [1, 1, 0.3] }, 8);
      b.cone(0.13, 0.6, 0x4a5a6c, { p: [-0.8, -0.22, 0], r: [0, 0, Math.PI - 0.7], s: [1, 1, 0.3] }, 8);
      return b.geometry();
    },
    eyes: [{ p: [1.02, 0.12, 0.3], r: 0.06, dir: [0.4, 0.1, 1] }, { p: [1.02, 0.12, -0.3], r: 0.06, dir: [0.4, 0.1, -1] }],
  });
}

function seaLion() {
  const root = new THREE.Group();
  const C = 0x6a4a32, C2 = 0x8a6a4a;
  const body = mesh(cached('zoo:sealion:body', () => {
    const b = new Build();
    b.sphere(1, { v: (x, y) => new THREE.Color(C).lerp(new THREE.Color(C2), clamp(0.5 - x * 0.8, 0, 1)) }, { p: [0, 0.6, 0], r: [0, 0, -0.35], s: [0.5, 0.72, 0.42] }, 22, 14);
    b.sphere(1, C, { p: [-0.55, 0.12, 0], s: [0.45, 0.16, 0.3] }, 14, 8);                    // Hinterleib
    for (const s of [1, -1]) b.sphere(1, 0x4a3222, { p: [-0.95, 0.06, s * 0.22], r: [0, s * 0.6, 0], s: [0.25, 0.04, 0.16] }, 10, 5);
    b.capsule(0.2, 0.3, C, { p: [0.18, 1.2, 0], r: [0, 0, -0.35] }, 4, 12);                  // Hals
    b.sphere(0.24, C, { p: [0.3, 1.5, 0] }, 18, 12);                                          // Kopf
    b.sphere(1, C2, { p: [0.5, 1.45, 0], s: [0.15, 0.11, 0.14] }, 12, 8);                     // Schnauze
    b.sphere(0.04, 0x1a1210, { p: [0.65, 1.49, 0] }, 8, 6);                                   // Nase
    for (const s of [1, -1]) for (let k = 0; k < 3; k++) b.cyl(0.004, 0.004, 0.18, 0xf0e8d8, { p: [0.6, 1.43 - k * 0.025, s * 0.13], r: [s * (1.35 + k * 0.12), 0, 0] }, 3);
    return b.geometry();
  }), vcol(0.15), {}, true);
  const flips = [1, -1].map((s) => {
    const j = joint([0.22, 0.75, s * 0.33]);
    j.add(mesh(cached('zoo:sealion:flip', () => new Build().sphere(1, 0x4a3222, { p: [0.05, -0.25, 0], s: [0.1, 0.28, 0.06] }, 10, 6).geometry()), vcol(0.2), {}, true));
    return j;
  });
  const eye = eyes([{ p: [0.46, 1.56, 0.13], r: 0.06, dir: [1, 0.1, 0.5] }, { p: [0.46, 1.56, -0.13], r: 0.06, dir: [1, 0.1, -0.5] }], { key: 'zoo:sealion', iris: 0x1a1008, pupil: 0.7 });
  const head = joint([0, 0, 0], body, eye);
  root.add(head, ...flips);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t;
    const clap = anim === 'clap' || (anim === 'idle' && sin(t * 0.7) > 0.6);
    flips.forEach((f, i) => {
      const s = i ? -1 : 1;
      f.rotation.x = clap ? s * (0.9 + 0.5 * sin(t * 14)) : s * 0.25;
      f.rotation.z = clap ? -0.9 : -0.1;
    });
    head.rotation.z = clap ? 0.12 + 0.05 * sin(t * 14) : 0.03 * sin(t * 1.3);
  };
  return makeModel('sea_lion', root, update);
}

// =============================================================================================
// Pinguin, Papagei, Flamingo
// =============================================================================================
function penguin() {
  const root = new THREE.Group();
  const waddle = joint();
  const body = mesh(cached('zoo:penguin:body', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (x > 0.42 && y < 0.75 ? 0xfaf8f2 : 0x1c1e28), { p: [0, 0.45, 0], s: [0.3, 0.44, 0.28] }, 22, 14);
    b.sphere(0.19, (x, y) => (x > 0.06 && y < 0.0 ? 0xfaf8f2 : 0x1c1e28), { p: [0.03, 0.92, 0] }, 18, 12);
    for (const s of [1, -1]) b.sphere(1, 0xffa21a, { p: [0.05, 0.98, s * 0.155], s: [0.06, 0.03, 0.02] }, 8, 5);   // Ohrflecken
    b.cone(0.05, 0.16, 0xff8a1a, { p: [0.24, 0.9, 0], r: [0, 0, -Math.PI / 2 - 0.15] }, 8);
    b.sphere(1, 0xffe0a0, { p: [0.17, 0.62, 0], s: [0.04, 0.12, 0.12] }, 10, 6);                                   // gelber Brustfleck
    return b.geometry();
  }), vcol(0.35), {}, true);
  const eye = eyes([{ p: [0.15, 0.97, 0.08], r: 0.045, dir: [1, 0.1, 0.4] }, { p: [0.15, 0.97, -0.08], r: 0.045, dir: [1, 0.1, -0.4] }], { key: 'zoo:penguin', iris: 0x2a1a10, pupil: 0.7 });
  const flips = [1, -1].map((s) => joint([0, 0.66, s * 0.27], mesh(cached('zoo:penguin:flip', () => new Build().sphere(1, 0x1c1e28, { p: [-0.02, -0.2, 0], s: [0.07, 0.24, 0.03] }, 10, 6).geometry()), vcol(0.35), {}, true)));
  const feet = [1, -1].map((s) => joint([0.05, 0.02, s * 0.1], mesh(cached('zoo:penguin:foot', () => new Build().sphere(1, 0xff8a1a, { p: [0.06, 0, 0], s: [0.1, 0.025, 0.07] }, 10, 5).geometry()), vcol(0.4))));
  waddle.add(body, eye, ...flips);
  root.add(waddle, ...feet);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t, sp = st.speed ?? 1.5;
    if (anim === 'walk') {
      const ph = t * (4 + sp * 1.5);
      waddle.rotation.x = sin(ph) * 0.22;
      waddle.position.y = Math.abs(sin(ph)) * 0.04;
      feet.forEach((f, i) => { f.position.x = 0.05 + sin(ph + i * Math.PI) * 0.08; f.position.y = 0.02 + Math.max(0, sin(ph + i * Math.PI)) * 0.04; });
      flips.forEach((f, i) => { f.rotation.x = (i ? -1 : 1) * (0.35 + 0.25 * sin(ph * 2)); });
    } else {
      waddle.rotation.x = sin(t * 1.2) * 0.04;
      waddle.position.y = 0;
      flips.forEach((f, i) => { f.rotation.x = (i ? -1 : 1) * (0.15 + 0.1 * Math.max(0, sin(t * 2.3)) ** 8 * 6); });
    }
  };
  return makeModel('penguin', root, update);
}

const PARROT = {
  scarlet: { body: 0xe8241e, wing: [0xe8241e, 0xffd21a, 0x2a6adf], tail: [0xe8241e, 0x2a6adf], face: 0xfff6ee },
  blue: { body: 0x2a8ae8, wing: [0x2a8ae8, 0x2a8ae8, 0x1a4ab0], tail: [0x2a8ae8, 0x1a4ab0], belly: 0xffc21a, face: 0xfff6ee },
  green: { body: 0x3ab83a, wing: [0x3ab83a, 0xe8241e, 0x2a6adf], tail: [0xe8241e, 0x2a6adf], face: 0xfff6ee },
};
function parrot(opts = {}) {
  const key = PARROT[opts.color] ? opts.color : 'scarlet', P = PARROT[key];
  const root = new THREE.Group();
  const pose = joint([0, 0.08, 0]);
  const body = mesh(cached(`zoo:parrot:${key}`, () => {
    const b = new Build();
    b.sphere(1, (x, y) => (P.belly && x > 0.3 && y < 0.2 ? P.belly : P.body), { p: [0, 0.28, 0], r: [0, 0, -0.35], s: [0.15, 0.25, 0.14] }, 18, 12);
    b.sphere(0.12, (x, y, z) => (x > 0.03 && Math.abs(z) > 0.04 && y < 0.03 ? P.face : P.body), { p: [0.08, 0.53, 0] }, 16, 12);
    b.cone(0.055, 0.15, 0xf0e8d8, { p: [0.21, 0.5, 0], r: [0, 0, -Math.PI / 2 - 0.9] }, 8);                     // Hakenschnabel
    b.sphere(1, 0x2a2228, { p: [0.19, 0.46, 0], s: [0.04, 0.03, 0.04] }, 8, 5);
    // Schwanz (lang, zweifarbig)
    b.cone(0.07, 0.55, { v: (x, y) => (y < -0.1 ? P.tail[1] : P.tail[0]) }, { p: [-0.2, 0.0, 0], r: [0, 0, Math.PI - 0.55], s: [1, 1, 0.35] }, 8);
    for (const s of [1, -1]) b.cyl(0.012, 0.012, 0.1, 0x5a5a62, { p: [0.02, 0.05, s * 0.05] }, 5);
    return b.geometry();
  }), vcol(0.35), {}, true);
  const wings = [1, -1].map((s) => joint([-0.02, 0.38, s * 0.12], mesh(cached(`zoo:parrot:wing:${key}`, () => {
    const b = new Build();
    b.sphere(1, { v: (x) => (x > 0.3 ? P.wing[0] : x > -0.35 ? P.wing[1] : P.wing[2]) }, { p: [-0.08, -0.03, 0], r: [0, 0, -0.3], s: [0.2, 0.05, 0.12] }, 14, 8);
    return b.geometry();
  }), vcol(0.4), {}, true)));
  const eye = eyes([{ p: [0.14, 0.57, 0.08], r: 0.035, dir: [0.6, 0.1, 1] }, { p: [0.14, 0.57, -0.08], r: 0.035, dir: [0.6, 0.1, -1] }], { key: 'zoo:parrot', iris: 0xffe066, pupil: 0.5 });
  pose.add(body, eye, ...wings);
  root.add(pose);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'perch';
    clk.tick(dt, anim);
    const t = clk.t;
    if (anim === 'fly') {
      pose.rotation.z = -1.05;
      pose.position.y = 0.3;
      wings.forEach((w, i) => { const s = i ? -1 : 1; w.rotation.x = s * (0.3 + 1.0 * sin(t * 18)); w.rotation.y = 0; });
    } else {
      pose.rotation.z = 0.05 * sin(t * 2) + (sin(t * 0.9) > 0.85 ? 0.25 : 0);   // Kopfnicken
      pose.position.y = 0.08;
      wings.forEach((w, i) => { const s = i ? -1 : 1; w.rotation.x = s * (sin(t * 0.5) > 0.95 ? 0.8 + 0.5 * sin(t * 20) : 0.05); });
    }
  };
  return makeModel('parrot', root, update);
}

function flamingo() {
  const root = new THREE.Group();
  const PINK = 0xff7aa8, PINK2 = 0xff9ac0;
  const legs = mesh(cached('zoo:flamingo:legs', () => {
    const b = new Build();
    b.cyl(0.02, 0.02, 0.9, 0xff6a98, { p: [0, 0.45, 0.03] }, 6);
    b.cyl(0.018, 0.018, 0.4, 0xff6a98, { p: [0.02, 0.75, -0.05], r: [0.2, 0, 0.6] }, 6);   // angewinkeltes Bein
    b.cyl(0.018, 0.018, 0.3, 0xff6a98, { p: [-0.1, 0.62, -0.08], r: [0.2, 0, -0.9] }, 6);
    b.sphere(1, 0xff6a98, { p: [0.05, 0.01, 0.03], s: [0.08, 0.015, 0.06] }, 8, 4);
    return b.geometry();
  }), vcol(0.4), {}, true);
  const body = mesh(cached('zoo:flamingo:body', () => {
    const b = new Build();
    b.sphere(1, { v: (x, y) => new THREE.Color(PINK).lerp(new THREE.Color(PINK2), clamp((y + 0.2) * 1.5, 0, 1)) }, { p: [0, 1.0, 0], r: [0, 0, 0.1], s: [0.34, 0.2, 0.2] }, 18, 12);
    b.cone(0.12, 0.3, 0x2a1a22, { p: [-0.36, 1.04, 0], r: [0, 0, Math.PI / 2 + 0.3], s: [1, 1, 0.5] }, 8);   // schwarze Schwungfedern
    return b.geometry();
  }), vcol(0.45), {}, true);
  const neck = joint([0.25, 1.05, 0]);
  neck.add(mesh(cached('zoo:flamingo:neck', () => {
    const b = new Build();
    b.tube([[0, 0, 0], [0.12, 0.25, 0], [0.0, 0.5, 0], [0.08, 0.72, 0]], 0.035, PINK, {}, 20, 8);
    b.sphere(0.075, PINK2, { p: [0.1, 0.76, 0] }, 12, 8);
    b.cone(0.035, 0.16, 0xfff0e0, { p: [0.2, 0.71, 0], r: [0, 0, -Math.PI / 2 - 0.9] }, 8);
    b.cone(0.03, 0.06, 0x1a1218, { p: [0.25, 0.63, 0], r: [0, 0, -Math.PI + 0.4] }, 6);
    return b.geometry();
  }), vcol(0.4), {}, true));
  neck.add(eyes([{ p: [0.13, 0.79, 0.05], r: 0.022, dir: [0.4, 0.1, 1] }, { p: [0.13, 0.79, -0.05], r: 0.022, dir: [0.4, 0.1, -1] }], { key: 'zoo:flamingo', iris: 0xffd040, pupil: 0.5 }));
  root.add(legs, body, neck);
  const clk = new Clock();
  const update = (dt, st) => {
    clk.tick(dt, st.anim ?? 'idle');
    const t = clk.t;
    const dip = Math.max(0, sin(t * 0.35)) ** 6;   // ab und zu den Kopf ins Wasser
    neck.rotation.z = 0.08 * sin(t * 0.9) - dip * 1.6;
    neck.rotation.y = 0.2 * sin(t * 0.5);
  };
  return makeModel('flamingo', root, update);
}

// =============================================================================================
// Gorilla, Tiger
// =============================================================================================
function gorilla() {
  const root = new THREE.Group();
  const FUR = 0x2a262c, SILVER = 0x9a9aa2, SKIN = 0x3e3236;
  const torso = joint([0, 0, 0]);
  torso.add(mesh(cached('zoo:gorilla:body', () => {
    const b = new Build();
    b.sphere(1, (x, y) => (x < -0.3 && y > 0.0 ? SILVER : FUR), { p: [0, 1.0, 0], r: [0, 0, -0.35], s: [0.55, 0.62, 0.55] }, 22, 14);
    b.sphere(1, SKIN, { p: [0.38, 1.05, 0], s: [0.15, 0.3, 0.32] }, 14, 8);                          // Brust
    b.sphere(0.3, FUR, { p: [0.38, 1.58, 0] }, 18, 12);                                              // Kopf
    b.sphere(1, SKIN, { p: [0.6, 1.5, 0], s: [0.14, 0.15, 0.2] }, 14, 10);                           // Gesicht/Schnauze
    b.box(0.12, 0.08, 0.42, FUR, { p: [0.58, 1.68, 0] }, 0.04);                                      // Augenbrauen-Wulst
    for (const s of [1, -1]) b.sphere(0.035, 0x1a1214, { p: [0.73, 1.52, s * 0.05] }, 8, 6);         // Nasenlöcher
    b.sphere(0.2, FUR, { p: [0.28, 1.85, 0], s: [1, 0.6, 1] }, 12, 8);                               // Scheitel
    for (const s of [1, -1]) b.capsule(0.13, 0.35, FUR, { p: [-0.15, 0.25, s * 0.3], r: [0, 0, 0.5] }, 4, 10);   // Beine
    return b.geometry();
  }), vcol(0.7), {}, true));
  torso.add(eyes([{ p: [0.66, 1.62, 0.09], r: 0.04, dir: [1, 0, 0.3] }, { p: [0.66, 1.62, -0.09], r: 0.04, dir: [1, 0, -0.3] }], { key: 'zoo:gorilla', iris: 0x4a2a10, pupil: 0.6 }));
  const arms = [1, -1].map((s) => {
    const j = joint([0.25, 1.35, s * 0.48]);
    j.add(mesh(cached('zoo:gorilla:arm', () => new Build().capsule(0.13, 0.85, FUR, { p: [0.12, -0.55, 0], r: [0, 0, 0.2] }, 4, 10).sphere(0.14, SKIN, { p: [0.25, -1.15, 0] }, 10, 8).geometry()), vcol(0.7), {}, true));
    return j;
  });
  root.add(torso, ...arms);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t;
    const beat = anim === 'beat' || (anim === 'idle' && (t % 7) > 5.4);
    torso.rotation.z = beat ? -0.35 : 0.02 * sin(t * 1.5);
    torso.position.y = beat ? 0.15 : 0;
    arms.forEach((a, i) => {
      if (beat) { a.rotation.z = 1.9 + 0.35 * sin(t * 16 + i * Math.PI); a.rotation.x = (i ? -1 : 1) * 0.5; a.position.y = 1.45; }
      else { a.rotation.z = 0.05 * sin(t * 1.5 + i); a.rotation.x = (i ? -1 : 1) * 0.08; a.position.y = 1.35; }
    });
  };
  return makeModel('gorilla', root, update);
}

function tiger() {
  const root = new THREE.Group();
  const OR = 0xf08a24, BL = 0x1a1414, WH = 0xfff4e6;
  // Färbung auf der Einheitskugel (Körper = gestreckte Kugel): Bauch weiß, quer liegende Streifen
  const stripes = (x, y, z) => {
    if (y < -0.45) return WH;
    return sin(x * 15 + Math.abs(z) * 2.5 + y * 1.5) > 0.5 ? BL : OR;
  };
  const body = joint([0, 0, 0]);
  body.add(mesh(cached('zoo:tiger:body', () => {
    const b = new Build();
    b.sphere(1, stripes, { p: [0, 0.85, 0], s: [0.88, 0.36, 0.34] }, 40, 18);
    return b.geometry();
  }), vcol(0.6), {}, true));
  const head = joint([0.85, 1.05, 0]);
  head.add(mesh(cached('zoo:tiger:head', () => {
    const b = new Build();
    b.sphere(0.3, (x, y, z) => (x > 0.12 && y < 0.02 ? WH : Math.abs(z) > 0.2 && y < 0.05 ? WH : sin(y * 30) > 0.7 && x < 0.1 ? BL : OR), { p: [0, 0, 0], s: [1, 0.92, 1.05] }, 20, 14);
    b.sphere(1, WH, { p: [0.24, -0.08, 0], s: [0.12, 0.1, 0.16] }, 12, 8);
    b.sphere(1, 0xff8a9a, { p: [0.34, -0.02, 0], s: [0.04, 0.03, 0.05] }, 8, 6);
    for (const s of [1, -1]) { b.sphere(0.09, OR, { p: [-0.05, 0.25, s * 0.2] }, 10, 8); b.sphere(0.05, WH, { p: [-0.02, 0.25, s * 0.2] }, 8, 6); }
    return b.geometry();
  }), vcol(0.6), {}, true));
  head.add(eyes([{ p: [0.24, 0.08, 0.11], r: 0.05, dir: [1, 0.1, 0.4] }, { p: [0.24, 0.08, -0.11], r: 0.05, dir: [1, 0.1, -0.4] }], { key: 'zoo:tiger', iris: 0xe8b020, pupil: 0.45 }));
  const legGeo = () => cached('zoo:tiger:leg', () => new Build().capsule(0.09, 0.5, OR, { p: [0, -0.3, 0] }, 4, 8).sphere(1, WH, { p: [0.03, -0.62, 0], s: [0.12, 0.06, 0.1] }, 8, 5).geometry());
  const legs = [[0.5, 1], [0.5, -1], [-0.5, 1], [-0.5, -1]].map(([x, s]) => joint([x, 0.68, s * 0.2], mesh(legGeo(), vcol(0.6), {}, true)));
  const tail = joint([-0.82, 0.92, 0], mesh(cached('zoo:tiger:tail', () => new Build().tube([[0, 0, 0], [-0.35, 0.05, 0], [-0.6, 0.25, 0], [-0.7, 0.5, 0]], 0.05, { v: (x) => (sin(x * 25) > 0.4 ? BL : OR) }, {}, 16, 6).geometry()), vcol(0.6), {}, true));
  body.add(head, ...legs, tail);
  root.add(body);
  const clk = new Clock();
  const update = (dt, st) => {
    const anim = st.anim ?? 'idle';
    clk.tick(dt, anim);
    const t = clk.t, sp = st.speed ?? 1.5;
    if (anim === 'walk') {
      const ph = t * (3 + sp * 1.4);
      legs.forEach((l, i) => { l.rotation.z = sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45; });
      body.position.y = Math.abs(sin(ph)) * 0.03;
      head.rotation.z = sin(ph * 2) * 0.04;
    } else {
      legs.forEach((l) => { l.rotation.z = 0; });
      body.position.y = 0;
      head.rotation.y = 0.35 * sin(t * 0.4);
      head.rotation.z = (t % 9) > 8 ? 0.25 : 0;    // Gähnen/Kopfheben
    }
    tail.rotation.y = 0.5 * sin(t * 1.6);
    tail.rotation.z = 0.15 * sin(t * 1.1);
  };
  return makeModel('tiger', root, update);
}

// =============================================================================================
// Bauten
// =============================================================================================
function thaiPavilion() {
  const root = new THREE.Group();
  root.add(mesh(cached('zoo:thai', () => {
    const b = new Build();
    const RED = 0xc8282a, GOLD = 0xffc21a, ROOF = 0xd8541e, ROOF2 = 0x2a7a4a, WHITE = 0xfaf4ea;
    b.box(8.4, 0.6, 6.4, WHITE, { p: [0, 0.3, 0] }, 0.1);
    b.box(7.6, 0.3, 5.6, 0xe8dcc8, { p: [0, 0.75, 0] }, 0.05);
    for (const x of [-3.2, -1.1, 1.1, 3.2]) for (const z of [-2.3, 2.3]) {
      b.cyl(0.22, 0.26, 4.2, RED, { p: [x, 2.9, z] }, 12);
      b.cyl(0.32, 0.32, 0.25, GOLD, { p: [x, 5.0, z] }, 12);
    }
    b.box(7.8, 0.4, 5.4, GOLD, { p: [0, 5.2, 0] }, 0.08);
    // gestufte Dächer (Walmdach als vierseitige Pyramide), abwechselnd orange und grün
    const tiers = [[9.2, 2.2, 6.8, 6.4, ROOF], [7.0, 1.9, 5.2, 7.7, ROOF2], [4.8, 1.8, 3.6, 8.9, ROOF]];
    for (const [w, h, d, y, c] of tiers) {
      b.cone(Math.SQRT1_2, 1, c, { p: [0, y, 0], r: [0, Math.PI / 4, 0], s: [w, h, d] }, 4);
      b.box(w * 0.98, 0.12, d * 0.98, GOLD, { p: [0, y - h / 2 + 0.05, 0] }, 0.04);
      // Chofa (goldene Hörner an den Giebelenden)
      for (const s of [1, -1]) b.cone(0.12, 0.9, GOLD, { p: [s * w * 0.5, y - h / 2 + 0.4, 0], r: [0, 0, -s * 0.9] }, 6);
    }
    b.cone(0.35, 2.6, GOLD, { p: [0, 11.2, 0] }, 10);
    b.sphere(0.32, GOLD, { p: [0, 9.95, 0] }, 12, 8);
    return b.geometry();
  }), vcol(0.4, { metalness: 0.1 }), {}, true));
  return makeModel('thai_pavilion', root, () => {});
}

/** Tribüne als Ring-Ausschnitt: Stufen mit bunten Sitzen und Zuschauer-Tupfen. */
function stands(b, R0, a0, a1, rows, rowW = 1.5, rowH = 0.75, seat = [0x1e6cff, 0xffffff]) {
  const n = Math.max(6, Math.round((a1 - a0) * R0 / 1.1));
  for (let r = 0; r < rows; r++) {
    const R = R0 + r * rowW, y = 0.4 + r * rowH;
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * (k + 0.5) / n;
      const x = cos(a) * R, z = sin(a) * R;
      const L = ((a1 - a0) * R) / n * 1.02;
      b.box(rowW, y, L, 0xd8dce6, { p: [x, y / 2, z], r: [0, -a, 0] }, 0.02, 1);
      b.box(rowW * 0.5, 0.18, L * 0.92, seat[(k + r) % seat.length], { p: [x - cos(a) * 0.2, y + 0.1, z - sin(a) * 0.2], r: [0, -a, 0] }, 0.03, 1);
      // Zuschauer (bunte Köpfe)
      if ((k * 7 + r * 3) % 5 < 3) {
        const pc = [0xff5a5a, 0xffd21a, 0x5ad25a, 0x5aa8ff, 0xff8ad8, 0xffffff][(k + r * 2) % 6];
        b.capsule(0.18, 0.25, pc, { p: [x + cos(a) * 0.1, y + 0.55, z + sin(a) * 0.1] }, 3, 8);
        b.sphere(0.17, 0xffd2b0, { p: [x + cos(a) * 0.1, y + 0.98, z + sin(a) * 0.1] }, 8, 6);
      }
    }
  }
}

function orcaPool(opts = {}) {
  const R = opts.r ?? 20;
  const root = new THREE.Group();
  root.add(mesh(cached(`zoo:orcapool:${R}`, () => {
    const b = new Build();
    b.lathe([[R, 0], [R + 1.4, 0], [R + 1.3, 1.2], [R, 1.2]], 0xf4f6fa, {}, 64);   // Beckenrand (Ring)
    b.cyl(R, R, 0.1, 0x0a4a8a, { p: [0, 0.05, 0] }, 56);                            // dunkler Grund unter dem Wasser
    b.torus(R + 0.6, 0.35, 0x2a8ae8, { p: [0, 1.22, 0], r: [Math.PI / 2, 0, 0] }, 8, 64);
    stands(b, R + 3, Math.PI * 0.55, Math.PI * 1.45, 6);
    // Showbühne und Video-Rahmen hinter dem Becken
    b.box(4, 6, 0.6, 0x1e2a4a, { p: [-(R + 13), 5.5, 0] }, 0.1);
    return b.geometry();
  }), vcol(0.45), {}, true));
  const wat = new THREE.Mesh(new THREE.CircleGeometry(R, 56), water('zoo:poolwater', 0x1f9ae6));
  wat.rotation.x = -Math.PI / 2; wat.position.y = 0.95; wat.receiveShadow = true;
  root.add(wat);
  // Glasscheibe zur Strecke (+X) hin
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.25, R + 1.25, 2.2, 40, 1, true, -Math.PI * 0.3, Math.PI * 0.6), glass());
  gl.position.y = 2.3; root.add(gl);
  // Schild „ORCA OCEAN“ über der Tribüne
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.6), new THREE.MeshBasicMaterial({ map: signTexture('orca', 'ORCA OCEAN', { bg: '#0a3a8a' }), transparent: true, side: THREE.DoubleSide }));
  sign.position.set(-(R + 11), 10.5, 0); sign.rotation.y = Math.PI / 2;
  root.add(sign);
  // Wellenringe auf dem Wasser
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), basic('zoo:ripple', { color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.93; root.add(m); return m; });
  const clk = new Clock();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    rings.forEach((m, i) => {
      const k = ((clk.t * 0.35 + i / 3) % 1);
      const a = i * 2.1 + Math.floor(clk.t * 0.35 + i / 3) * 1.7;
      m.position.x = cos(a) * R * 0.45; m.position.z = sin(a) * R * 0.45;
      m.scale.setScalar(1 + k * 4); m.material.opacity = 0.5 * (1 - k);
    });
  };
  return makeModel('orca_pool', root, update, [wat.geometry, gl.geometry]);
}

function lagoon(opts = {}) {
  const R = opts.r ?? 12;
  const root = new THREE.Group();
  root.add(mesh(cached(`zoo:lagoon:${R}`, () => {
    const b = new Build();
    const n = Math.round(R * 1.6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, rr = R + 0.4 + 0.4 * sin(i * 2.7);
      b.sphere(1, [0xb8aa98, 0xa89a88, 0xc8bca8][i % 3], { p: [cos(a) * rr, 0.25, sin(a) * rr], s: [1.1 + 0.4 * sin(i * 1.3), 0.6 + 0.25 * cos(i), 0.9] }, 9, 6);
    }
    b.cyl(R, R, 0.3, 0x2a9ad0, { p: [0, 0.1, 0] }, 40);
    b.cyl(R * 0.6, R * 0.6, 0.31, 0x3ab8e0, { p: [0, 0.11, 0] }, 32);   // hellere Mitte (flach)
    return b.geometry();
  }), vcol(0.6), {}, true));
  const wat = new THREE.Mesh(new THREE.CircleGeometry(R + 0.2, 40), water(`zoo:lagoonwater:${opts.color ?? 0}`, opts.color ?? 0x2ab0e8));
  wat.rotation.x = -Math.PI / 2; wat.position.y = 0.35; wat.receiveShadow = true;
  root.add(wat);
  return makeModel('lagoon', root, () => {}, [wat.geometry]);
}

function sharkTunnel(opts = {}) {
  const L = opts.length ?? 36, W = opts.width ?? 18, R = W / 2, H = R + 4;
  const root = new THREE.Group();
  // Bögen (Stahl) und Sockel
  root.add(mesh(cached(`zoo:tunnel:${L}:${W}`, () => {
    const b = new Build();
    for (let x = -L / 2; x <= L / 2 + 0.01; x += 4) b.torus(R, 0.22, 0xe8eef6, { p: [x, 0, 0], r: [0, Math.PI / 2, 0] }, 8, 32, Math.PI);
    for (const s of [1, -1]) b.box(L, 0.6, 1.2, 0x2a4a6a, { p: [0, 0.3, s * (R + 0.4)] }, 0.1);
    // Aquarium-Becken über der Röhre: Rahmen und Korallen auf den Seitenböden
    for (const s of [1, -1]) {
      b.box(L + 2, H + 1, 0.8, 0x3a86c0, { p: [0, (H + 1) / 2, s * (R + 4)] }, 0.1);
      for (let k = 0; k < 7; k++) {
        const x = -L / 2 + 2 + k * (L - 4) / 6;
        b.cone(0.5, 1.6 + (k % 3) * 0.6, [0xff7a5a, 0xffc21a, 0xff6ab8, 0x8a5aff][k % 4], { p: [x, 1.4, s * (R + 2.2)] }, 7);
        b.sphere(0.7, [0x5ad25a, 0xff9a5a][k % 2], { p: [x + 1.2, 1.0, s * (R + 2.6)], s: [1, 0.6, 1] }, 9, 6);
      }
    }
    // Stirnseiten: Rahmen um die Röhre (unten offen für die Fahrbahn)
    for (const s of [1, -1]) {
      b.box(1.2, H + 1.6 - R, W + 9, 0x2a6a9a, { p: [s * (L / 2 + 0.6), R + (H + 1.6 - R) / 2, 0] }, 0.1);
      for (const z of [1, -1]) b.box(1.2, R, 4.4, 0x2a6a9a, { p: [s * (L / 2 + 0.6), R / 2, z * (R + 2.3)] }, 0.1);
    }
    return b.geometry();
  }), vcol(0.4), {}, true));
  // Glasröhre (halber Zylinder, Achse entlang X)
  const tubeG = new THREE.CylinderGeometry(R - 0.05, R - 0.05, L, 36, 1, true, 0, Math.PI);
  tubeG.rotateZ(Math.PI / 2); tubeG.rotateX(-Math.PI / 2);
  const tube = new THREE.Mesh(tubeG, glass());
  root.add(tube);
  // Wasser um die Röhre: durchscheinender Block (nur Deckel und Längsseiten – Stirnseiten und Boden offen)
  const wmat = std('zoo:aquawater', { color: 0x2a8ad8, roughness: 0.1, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, emissive: 0x0a3a6a, emissiveIntensity: 0.6 });
  const none = basic('zoo:none', { visible: false });
  const top = new THREE.Mesh(new THREE.BoxGeometry(L, H, W + 8), [none, none, wmat, none, wmat, wmat]);
  top.position.y = H / 2 + 0.02; root.add(top);
  const fishes = [];
  const sharks = [];
  for (let k = 0; k < (opts.sharks ?? 3); k++) {
    const s = shark();
    s.root.scale.setScalar(1.2);
    root.add(s.root);
    sharks.push({ m: s, ph: (k / 3) * TAU, lane: k % 2 ? 1 : -1, sp: 0.25 + k * 0.05 });
  }
  // Fischschwarm (bunte Tupfen)
  const fg = cached('zoo:fish', () => new Build().sphere(1, 0xffffff, { s: [0.22, 0.12, 0.06] }, 8, 5).cone(0.08, 0.14, 0xffffff, { p: [-0.25, 0, 0], r: [0, 0, Math.PI / 2] }, 4).geometry());
  const fishMesh = new THREE.InstancedMesh(fg, vcol(0.3), 40);
  const fc = [0xffc21a, 0xff6a2a, 0x2ad0ff, 0xffffff, 0xff5ab8];
  for (let i = 0; i < 40; i++) { fishMesh.setColorAt(i, new THREE.Color(fc[i % fc.length])); fishes.push({ ph: Math.random() * TAU, r: R + 0.8 + Math.random() * 2.5, x0: (Math.random() - 0.5) * L * 0.9, sp: 0.6 + Math.random() * 0.6 }); }
  root.add(fishMesh);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.9), new THREE.MeshBasicMaterial({ map: signTexture('aqua', 'AQUARIUM', { bg: '#0a6aa8' }), transparent: true, side: THREE.DoubleSide }));
  sign.position.set(L / 2 + 1.3, H + 0.2, 0); sign.rotation.y = Math.PI / 2;
  root.add(sign);
  const clk = new Clock();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  const update = (dt) => {
    clk.tick(dt, 'idle');
    const t = clk.t;
    for (const s of sharks) {
      // Haie ziehen in Bahnen über die Röhre hinweg (hin und zurück entlang der Achse)
      const u = sin(t * s.sp + s.ph);
      const ang = s.lane * (0.5 + 0.35 * sin(t * 0.3 + s.ph));
      const rr = R + 1.6;
      s.m.root.position.set(u * L * 0.42, Math.cos(ang) * rr - 0.5, Math.sin(ang) * rr);
      s.m.root.rotation.set(0, cos(t * s.sp + s.ph) >= 0 ? 0 : Math.PI, -ang * 0.4);
      s.m.update(dt, 'swim');
    }
    fishes.forEach((f, i) => {
      const a = f.ph + t * f.sp * 0.5;
      V.set(f.x0 + sin(t * f.sp + f.ph) * 3, Math.abs(cos(a)) * f.r + 0.6, sin(a) * f.r);
      Q.setFromEuler(E.set(0, cos(t * f.sp + f.ph) > 0 ? 0 : Math.PI, 0));
      fishMesh.setMatrixAt(i, M.compose(V, Q, SC));
    });
    fishMesh.instanceMatrix.needsUpdate = true;
  };
  return makeModel('shark_tunnel', root, update, [tubeG, top.geometry, fishMesh, ...sharks.map((s) => s.m)]);
}

function penguinHouse() {
  const root = new THREE.Group();
  root.add(mesh(cached('zoo:penguinhouse', () => {
    const b = new Build();
    b.cyl(16, 17, 0.25, 0xf4f8ff, { p: [0, 0.1, 0] }, 40);                                        // Schneefläche
    b.dome(9, { v: (x, y, z) => new THREE.Color(0xbfe4ff).lerp(new THREE.Color(0xffffff), clamp(y / 9, 0, 1)) }, { p: [0, 0.2, 0] }, Math.PI / 2, 32, 12);
    b.cyl(2.4, 2.4, 3.6, 0x1a3a6a, { p: [7.6, 1.8, 0], r: [0, 0, Math.PI / 2] }, 20);             // Eingang
    b.torus(2.4, 0.35, 0xffffff, { p: [9.3, 1.8, 0], r: [0, Math.PI / 2, 0] }, 8, 24, Math.PI);
    // Eisschollen und Eisblöcke
    for (let k = 0; k < 9; k++) {
      const a = k * 0.8 + 0.3, r = 11 + (k % 3) * 1.6;
      b.box(1.6 + (k % 2), 0.6 + (k % 3) * 0.4, 1.4, 0xd8f0ff, { p: [cos(a) * r, 0.4, sin(a) * r], r: [0, a, 0.05 * k] }, 0.2);
    }
    return b.geometry();
  }), vcol(0.25), {}, true));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), new THREE.MeshBasicMaterial({ map: signTexture('penguin', 'PLANET PENGUIN', { bg: '#2a7ad8' }), transparent: true, side: THREE.DoubleSide }));
  sign.position.set(9.6, 4.8, 0); sign.rotation.y = Math.PI / 2;
  root.add(sign);
  return makeModel('penguin_house', root, () => {});
}

function enclosure(opts = {}) {
  const R = opts.r ?? 10;
  const root = new THREE.Group();
  root.add(mesh(cached(`zoo:encl:${R}:${opts.ground ?? 'grass'}`, () => {
    const b = new Build();
    const ground = opts.ground === 'sand' ? 0xe8d09a : 0x6ac24a;
    b.cyl(R, R, 0.15, ground, { p: [0, 0.07, 0] }, 36);
    const n = Math.round(R * 2.2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      b.box(1.0, 0.9, (TAU * R) / n * 1.02, 0xb8a890, { p: [cos(a) * R, 0.45, sin(a) * R], r: [0, -a, 0] }, 0.08, 1);
      b.cyl(0.07, 0.07, 1.3, 0x8a5a2e, { p: [cos(a) * R, 1.5, sin(a) * R] }, 6);
    }
    for (const y of [1.4, 2.0]) b.torus(R, 0.04, 0x8a5a2e, { p: [0, y, 0], r: [Math.PI / 2, 0, 0] }, 4, 64);
    // Felsen, Baumstamm, Büsche
    b.sphere(1, 0x9a8e80, { p: [-R * 0.35, 0.8, R * 0.25], s: [2.4, 1.6, 2] }, 10, 7);
    b.sphere(1, 0xa89c8c, { p: [-R * 0.2, 0.6, -R * 0.4], s: [1.6, 1.1, 1.4] }, 9, 6);
    b.cyl(0.25, 0.3, R * 0.9, 0x8a5a2e, { p: [R * 0.2, 0.35, R * 0.1], r: [Math.PI / 2, 0.4, 0] }, 8);
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.5; b.sphere(1, [0x4aa83a, 0x5ab84a][k % 2], { p: [cos(a) * R * 0.75, 0.6, sin(a) * R * 0.75], s: [1.2, 0.9, 1.2] }, 9, 6); }
    return b.geometry();
  }), vcol(0.7), {}, true));
  return makeModel('enclosure', root, () => {});
}

function aviary(opts = {}) {
  const R = opts.r ?? 5;
  const root = new THREE.Group();
  root.add(mesh(cached(`zoo:aviary:${R}`, () => {
    const b = new Build();
    const GOLD = 0xe8b830;
    b.cyl(R + 0.3, R + 0.4, 0.4, 0xf4ecdc, { p: [0, 0.2, 0] }, 28);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      b.tube([[cos(a) * R, 0.4, sin(a) * R], [cos(a) * R, R * 0.9, sin(a) * R], [cos(a) * R * 0.6, R * 1.55, sin(a) * R * 0.6], [0, R * 1.75, 0]], 0.05, GOLD, {}, 12, 4);
    }
    for (const y of [1.2, R * 0.9]) b.torus(R, 0.06, GOLD, { p: [0, y, 0], r: [Math.PI / 2, 0, 0] }, 4, 40);
    b.sphere(0.35, GOLD, { p: [0, R * 1.8, 0] }, 10, 8);
    // Sitzstangen und ein Baum in der Mitte
    b.cyl(0.18, 0.25, R * 1.2, 0x8a5a2e, { p: [0, R * 0.6, 0] }, 8);
    b.sphere(1, 0x4ab83a, { p: [0, R * 1.2, 0], s: [R * 0.45, R * 0.3, R * 0.45] }, 12, 8);
    for (const [y, a] of [[1.6, 0], [2.4, 1.6], [3.0, 3.4]]) b.cyl(0.05, 0.05, R * 1.4, 0x8a5a2e, { p: [0, y, 0], r: [Math.PI / 2, a, 0] }, 5);
    return b.geometry();
  }), vcol(0.35, { metalness: 0.2 }), {}, true));
  return makeModel('aviary', root, () => {});
}

function zooSign(opts = {}) {
  const text = opts.text ?? 'ZOO';
  const root = new THREE.Group();
  root.add(mesh(cached('zoo:signpost', () => new Build().cyl(0.12, 0.14, 3, 0x8a5a2e, { p: [0, 1.5, -1.6] }, 8).cyl(0.12, 0.14, 3, 0x8a5a2e, { p: [0, 1.5, 1.6] }, 8).geometry()), vcol(0.6), {}, true));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.0), new THREE.MeshBasicMaterial({ map: signTexture(`txt:${text}`, text, { bg: opts.color ?? '#2a9a3a', stroke: '#0a3a10' }), transparent: true, side: THREE.DoubleSide }));
  board.position.set(0.15, 2.6, 0); board.rotation.y = Math.PI / 2;
  root.add(board);
  return makeModel('zoo_sign', root, () => {}, [board.geometry]);
}

export const MODELS = {
  orca, dolphin, shark, sea_lion: seaLion, penguin, parrot, flamingo, gorilla, tiger,
  thai_pavilion: thaiPavilion, orca_pool: orcaPool, lagoon, shark_tunnel: sharkTunnel, penguin_house: penguinHouse,
  enclosure, aviary, zoo_sign: zooSign,
};

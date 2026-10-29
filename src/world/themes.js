// Strecken-Themen: Himmel, Nebel, Licht und Gelände-Farben. Die Grundwerte stammen aus den Kurs-Themen der
// Lotti-&-Greta-Welt (src/course/view/themes*.js) und sind um Fahrbahn-, Rand- und Banden-Farben ergänzt.

const GRASS = {
  label: 'Wiese',
  sky: [[1, 0x2b8de8], [0.45, 0x47aefb], [0.15, 0x8cd3ff], [0.03, 0xcbeeff], [0, 0xe6f7ff], [-0.1, 0xc6e0f2], [-1, 0xa6c6dc]],
  background: 0xcbe9fb,
  fog: { color: 0xd3ecfb, near: 90, far: 420 },
  hemi: { sky: 0xc4e6ff, ground: 0x7fae58, intensity: 1.3 },
  sun: { color: 0xfff0d2, intensity: 2.7, dir: [-0.42, 1, 0.5] },
  shadows: true, sunDisc: true, clouds: true, hills: 0x6cc24a, hills2: 0x8fd468,
  // Gelände
  grass: 0x72dd47, grass2: 0x66d13f, grassFar: 0x5cc23c, offroad: 0x8fe060, offroad2: 0x7fd552,
  // Fahrbahn
  road: 0x8d8aa0, road2: 0x86839a, line: 0xf8f6f0, curbA: 0xe8392d, curbB: 0xf8f6f0,
  wallA: 0xf8f6f0, wallB: 0x3b7cf0, wallTop: 0xffc21a, wallH: 0.75,
  lights: [],
};

const AUTUMN = {
  ...GRASS,
  label: 'Herbstwald',
  sky: [[1, 0x3a7fd8], [0.45, 0x6ab2f0], [0.15, 0xb3dcf5], [0.03, 0xffe7c4], [0, 0xfff1dc], [-0.1, 0xe6d2b8], [-1, 0xb89a7a]],
  background: 0xf3dcc0,
  fog: { color: 0xf1d7b8, near: 80, far: 380 },
  hemi: { sky: 0xffe2c0, ground: 0x9a6a3a, intensity: 1.35 },
  sun: { color: 0xffd8a8, intensity: 2.8, dir: [-0.6, 0.9, 0.35] },
  hills: 0x8a9a3a, hills2: 0xb0823a,
  grass: 0x9cc83a, grass2: 0x8eb934, grassFar: 0xb9a040, offroad: 0xd8a24a, offroad2: 0xcc9640,
  road: 0x9a8a84, road2: 0x92837e, curbA: 0xff8a1a, curbB: 0xfff3df,
  wallA: 0x8a5a32, wallB: 0xc9863e, wallTop: 0x5cbf3a,
};

const CIRCUS = {
  ...GRASS,
  label: 'Zirkus',
  sky: [[1, 0x120a24], [0.4, 0x1c0f34], [0.1, 0x2c1238], [0, 0x381430], [-0.2, 0x26101e], [-1, 0x12080e]],
  background: 0x1e0e26,
  fog: { color: 0x2a1230, near: 70, far: 260 },
  hemi: { sky: 0xffe6c8, ground: 0x6a2a4e, intensity: 1.35 },
  sun: { color: 0xfff1dc, intensity: 2.6, dir: [0.18, 1, 0.42] },
  sunDisc: false, clouds: false, hills: null,
  grass: 0x7a2a4a, grass2: 0x6e2442, grassFar: 0x4a1830, offroad: 0xf0c27a, offroad2: 0xe4b46a,  // Manegenboden / Sägespäne
  road: 0x5a3a8a, road2: 0x52347e, line: 0xffc94a, curbA: 0xffc94a, curbB: 0xd23440,
  wallA: 0xfff4e0, wallB: 0xd23440, wallTop: 0xffc94a, wallH: 0.9,
};

const HIGHWAY = {
  ...GRASS,
  label: 'Autobahn',
  sky: [[1, 0x1f1a46], [0.55, 0x3b2f73], [0.28, 0x7a4a8e], [0.12, 0xd9707a], [0.04, 0xff9f5e], [0, 0xffc47a], [-0.08, 0xc77a6e], [-1, 0x3a2a48]],
  background: 0xe0906e,
  fog: { color: 0xc98a86, near: 110, far: 460 },
  hemi: { sky: 0xffdcc0, ground: 0x6a5e88, intensity: 1.65 },
  sun: { color: 0xffc890, intensity: 2.9, dir: [-0.55, 0.95, -0.45] },
  hills: null, city: [0x2c2448, 0x3a2f5c, 0x47386a, 0x332a52], cityWindow: 0xffd88a,
  grass: 0x5f9f48, grass2: 0x579642, grassFar: 0x4a3f62, offroad: 0xa7a3b0, offroad2: 0x9c98a8,
  road: 0x5a586c, road2: 0x55536a, line: 0xf5f3ee, lineYellow: 0xffcf3a, curbA: 0xe6e2ea, curbB: 0xff3a2a,
  wallA: 0xdfe4ee, wallB: 0xdfe4ee, wallTop: 0x6a7080, wallH: 0.85,
};

const CAVE = {
  ...GRASS,
  label: 'Höhle',
  sky: [[1, 0x0d0a12], [0, 0x1a1420], [-1, 0x0a080d]],
  background: 0x140f18,
  fog: { color: 0x160f1c, near: 25, far: 130 },
  hemi: { sky: 0x8a7ab2, ground: 0x3a2a22, intensity: 0.85 },
  sun: { color: 0xffd8a0, intensity: 0.9, dir: [-0.3, 1, 0.4] },
  shadows: false, sunDisc: false, clouds: false, hills: null,
  grass: 0x5d4a44, grass2: 0x54423c, grassFar: 0x3a2c28, offroad: 0x7d5d4c, offroad2: 0x735446,
  road: 0x8a7ea0, road2: 0x80759a, line: 0xffd88a, curbA: 0xffb44a, curbB: 0x3a2f5c,
  wallA: 0x6e6680, wallB: 0x5a5470, wallTop: 0x86a96e, wallH: 1.2,
  playerLight: { color: 0xffc27a, intensity: 30, distance: 22 },
  lanternLight: { color: 0xffb44a, intensity: 40, distance: 26 },
};

const BEACH = {
  ...GRASS,
  label: 'Strand',
  sky: [[1, 0x1f8fe0], [0.45, 0x3fb4f5], [0.15, 0x86dcff], [0.03, 0xd2f6ff], [0, 0xf0fcff], [-0.1, 0xb8e6f0], [-1, 0x7cc8dc]],
  background: 0xc4ecfa,
  fog: { color: 0xcdf0fb, near: 100, far: 460 },
  hemi: { sky: 0xd4f2ff, ground: 0xd8c48a, intensity: 1.4 },
  sun: { color: 0xfff4dc, intensity: 2.9, dir: [-0.3, 1, 0.55] },
  hills: 0x7ccf5a, hills2: 0xe8d39a,
  grass: 0x9ad65a, grass2: 0x8ecb50, grassFar: 0x86c24c, offroad: 0xf0dca0, offroad2: 0xe8d294,   // Sand
  road: 0x9a96a6, road2: 0x938fa0, line: 0xfffaf0, curbA: 0x2fc4d0, curbB: 0xfffaf0,
  wallA: 0xfff6e4, wallB: 0x2fb8c8, wallTop: 0xff8a5a, wallH: 0.7,
};

const SNOW = {
  ...GRASS,
  label: 'Schneegipfel',
  sky: [[1, 0x2a6fd0], [0.45, 0x5ea2ec], [0.15, 0xa8d4f8], [0.03, 0xe4f2ff], [0, 0xf6fbff], [-0.1, 0xdce8f4], [-1, 0xb4c8dc]],
  background: 0xdcecfa,
  fog: { color: 0xe4f0fb, near: 80, far: 400 },
  hemi: { sky: 0xe6f2ff, ground: 0xa8b8d0, intensity: 1.35 },
  sun: { color: 0xfffaf0, intensity: 2.6, dir: [0.35, 1, 0.45] },
  hills: 0xf4f6fb, hills2: 0xdfe8f4,
  grass: 0xf2f6fc, grass2: 0xe8eff8, grassFar: 0xdde6f2, offroad: 0xdfe9f6, offroad2: 0xd4e0f0,   // Schnee
  road: 0x7a8098, road2: 0x737990, line: 0xffffff, curbA: 0xe8392d, curbB: 0xffffff,
  wallA: 0xcfe8ff, wallB: 0x8fc4f0, wallTop: 0xffffff, wallH: 0.9,
};

const CASTLE = {
  ...GRASS,
  label: 'Burg',
  sky: [[1, 0x0e0a26], [0.45, 0x231a4a], [0.15, 0x4a2c66], [0.04, 0x8a3c5e], [0, 0xb8506a], [-0.1, 0x4a2a44], [-1, 0x1a1024]],
  background: 0x3a2448,
  fog: { color: 0x3a2850, near: 70, far: 330 },
  hemi: { sky: 0xb8a8e8, ground: 0x4a3040, intensity: 1.1 },
  sun: { color: 0xc8b8ff, intensity: 1.5, dir: [0.4, 0.9, -0.5] },
  sunDisc: false, clouds: false, hills: 0x3a3450, hills2: 0x4a3e5c,
  grass: 0x4a6a3e, grass2: 0x426238, grassFar: 0x3a4a3a, offroad: 0x6a5e66, offroad2: 0x62565e,   // Burghof-Pflaster
  road: 0x6e6a7c, road2: 0x666274, line: 0xffd36a, curbA: 0xd8262e, curbB: 0x2a2434,
  wallA: 0x9a94a8, wallB: 0x7e788e, wallTop: 0xd8262e, wallH: 1.1,
};

const DESERT = {
  ...GRASS,
  label: 'Wüste',
  sky: [[1, 0x2f7fd0], [0.45, 0x6aa8e0], [0.15, 0xb8d4e8], [0.03, 0xf4dcb4], [0, 0xffe8c8], [-0.1, 0xe8c8a0], [-1, 0xc89a6a]],
  background: 0xf0d8b0,
  fog: { color: 0xf0d6ae, near: 110, far: 480 },
  hemi: { sky: 0xfff0d8, ground: 0xc8904a, intensity: 1.45 },
  sun: { color: 0xfff0d0, intensity: 3.0, dir: [-0.2, 1, 0.3] },
  hills: 0xd9733a, hills2: 0xc8602e,
  grass: 0xe8c27a, grass2: 0xe0b870, grassFar: 0xd8aa60, offroad: 0xd9a85a, offroad2: 0xcf9c50,
  road: 0x8a7a72, road2: 0x84746c, line: 0xfff8e8, curbA: 0xe8392d, curbB: 0xfff8e8,
  wallA: 0xe0a868, wallB: 0xc8864a, wallTop: 0x2fb8b0, wallH: 0.85,
};

const VOLCANO = {
  ...GRASS,
  label: 'Vulkan',
  sky: [[1, 0x1a0e14], [0.45, 0x3a1a1e], [0.15, 0x7a2a1e], [0.04, 0xc8501e], [0, 0xe86a2a], [-0.1, 0x6a2418], [-1, 0x1a0a08]],
  background: 0x5a2418,
  fog: { color: 0x5a2a1e, near: 70, far: 330 },
  hemi: { sky: 0xffb08a, ground: 0x3a1a14, intensity: 1.1 },
  sun: { color: 0xffa070, intensity: 2.0, dir: [0.4, 0.8, 0.3] },
  sunDisc: false, clouds: false, hills: 0x2e2228, hills2: 0x3a2a2a,
  grass: 0x3e3438, grass2: 0x383034, grassFar: 0x2e2628, offroad: 0x5a4442, offroad2: 0x524040,   // Basalt und Asche
  road: 0x4c4856, road2: 0x46424e, line: 0xffb040, curbA: 0xff7a1a, curbB: 0x2a2228,
  wallA: 0x3a3238, wallB: 0x2e282e, wallTop: 0xff6a1a, wallH: 1.0,
};

const CANDY = {
  ...GRASS,
  label: 'Bonbonland',
  sky: [[1, 0x7a8af0], [0.45, 0xa8b0ff], [0.15, 0xe0c8ff], [0.03, 0xffd8f0], [0, 0xffe8f6], [-0.1, 0xf0c8e8], [-1, 0xd0a0d8]],
  background: 0xffd8f0,
  fog: { color: 0xffdcf2, near: 100, far: 440 },
  hemi: { sky: 0xfff0ff, ground: 0xd890c8, intensity: 1.4 },
  sun: { color: 0xfff4fa, intensity: 2.6, dir: [-0.3, 1, 0.4] },
  hills: 0xffb8e0, hills2: 0xb8f0d8,
  grass: 0xa8f0d0, grass2: 0x9ce8c6, grassFar: 0x90dcbc, offroad: 0xffc8e4, offroad2: 0xffbadc,   // Minzwiese, Zuckerguss
  road: 0x7a4a3a, road2: 0x744636, line: 0xfff4fa, curbA: 0xff3a6a, curbB: 0xfff4fa,
  wallA: 0xfff4fa, wallB: 0xff3a6a, wallTop: 0x8fe0c0, wallH: 0.8,
};

// Tierpark: sonnig-tropisch (Kanaren), sattes Grün, Fahrbahn warmgrau, Ränder in Papageien-Farben
const ZOO = {
  ...GRASS,
  label: 'Tierpark',
  sky: [[1, 0x1f8fe8], [0.45, 0x3fb2f8], [0.15, 0x8ad6ff], [0.03, 0xd6f4ff], [0, 0xf2fcff], [-0.1, 0xbfe6f2], [-1, 0x8ac8dc]],
  background: 0xc8ecfa,
  fog: { color: 0xd0eefa, near: 100, far: 460 },
  hemi: { sky: 0xd8f2ff, ground: 0x6aa84a, intensity: 1.4 },
  sun: { color: 0xfff2d6, intensity: 2.9, dir: [-0.35, 1, 0.45] },
  hills: 0x5cb83a, hills2: 0x7ccf5a,
  grass: 0x5cc83a, grass2: 0x52bc34, grassFar: 0x4aa830, offroad: 0xc8b48a, offroad2: 0xbca87e,
  road: 0x9c948e, road2: 0x958d88, line: 0xfffaf0, curbA: 0xe8241e, curbB: 0xffd21a,
  wallA: 0x2fa84a, wallB: 0xffd21a, wallTop: 0xe8241e, wallH: 0.75,
};

// Piratenbucht: goldene Abendsonne über dem Meer, sandige Plankenstraße, Holzbanden mit Tau
const PIRATE = {
  ...GRASS,
  label: 'Piratenbucht',
  sky: [[1, 0x2a6ad0], [0.45, 0x4a9ae8], [0.15, 0x9ad0f0], [0.03, 0xffe0b0], [0, 0xfff0d8], [-0.1, 0xb8d8e0], [-1, 0x6aa8c8]],
  background: 0xe8d8b8,
  fog: { color: 0xe6dcc4, near: 100, far: 440 },
  hemi: { sky: 0xffe8c8, ground: 0xc8a870, intensity: 1.4 },
  sun: { color: 0xffe0b0, intensity: 2.9, dir: [-0.5, 0.85, 0.4] },
  hills: 0x6ab84a, hills2: 0xd8c08a,
  grass: 0x8cc84a, grass2: 0x80bc44, grassFar: 0x78b040, offroad: 0xf0d8a0, offroad2: 0xe6cc92,   // Sand
  road: 0xa08a6e, road2: 0x988268, line: 0xfff4e0, curbA: 0xd8282a, curbB: 0xfff4e0,
  wallA: 0x8a5a2e, wallB: 0x6a4020, wallTop: 0xd8b878, wallH: 0.85,
  bridge: 0x6a4424, bridgePillar: 0x5a3a20, bridgeTop: 0xb08a5a, bridgeTop2: 0xa07c4e,
};

// Spukinsel (Halloween): Vollmondnacht, lila Nebel, orange Kürbislicht, Kopfsteinpflaster, Banden orange-schwarz
const HALLOWEEN = {
  ...GRASS,
  label: 'Spukinsel',
  sky: [[1, 0x07061a], [0.45, 0x17123a], [0.15, 0x3a1e5a], [0.04, 0x6a2a6a], [0, 0x8a3a5a], [-0.1, 0x2a1a3a], [-1, 0x0e0a18]],
  background: 0x2a1a40,
  fog: { color: 0x2e2048, near: 55, far: 300 },
  hemi: { sky: 0x9a8ad8, ground: 0x3a2a3a, intensity: 1.0 },
  sun: { color: 0xb8c0ff, intensity: 1.35, dir: [0.35, 0.9, -0.45] },
  sunDisc: false, clouds: false, hills: 0x2a3a2a, hills2: 0x3a3048,
  grass: 0x3a5a32, grass2: 0x34522e, grassFar: 0x2a3a2a, offroad: 0x4a3a34, offroad2: 0x42342e,   // Erde und Laub
  road: 0x5a5466, road2: 0x544e60, line: 0xff9a2a, curbA: 0xff7a1a, curbB: 0x1a1420,
  wallA: 0xff7a1a, wallB: 0x2a1a30, wallTop: 0x9a5aff, wallH: 0.95,
  bridge: 0x3a2a22, bridgePillar: 0x2a2028, bridgeTop: 0x5a4434, bridgeTop2: 0x52402e,
};

// Katzeninsel: zuckerwattig-warmer Nachmittag, rosa und lila, Fahrbahn wie ein Teppich mit Pfoten-Tupfern
const CATS = {
  ...GRASS,
  label: 'Katzeninsel',
  sky: [[1, 0x5a7af0], [0.45, 0x8aa8f8], [0.15, 0xd0c8ff], [0.03, 0xffd8f0], [0, 0xffe8f4], [-0.1, 0xf0c8e0], [-1, 0xc8a0d0]],
  background: 0xf8dcf0,
  fog: { color: 0xf4d8ee, near: 95, far: 420 },
  hemi: { sky: 0xffe8f8, ground: 0xc890b0, intensity: 1.45 },
  sun: { color: 0xfff0e8, intensity: 2.8, dir: [-0.4, 1, 0.35] },
  grass: 0x8ad86a, grass2: 0x80ce62, grassFar: 0x74c05a, offroad: 0xf4c8e0, offroad2: 0xeabcd6,   // rosa Kissenboden
  road: 0x9a8ab8, road2: 0x9282b0, line: 0xffffff, curbA: 0xff6aa8, curbB: 0xffffff,
  wallA: 0xff8ac0, wallB: 0xfff0f8, wallTop: 0xffd23a, wallH: 0.8,
};

// Hasenhügel: Frühlingswiese, Erdweg, Banden wie Möhren (orange mit grünem Kraut)
const BUNNY = {
  ...GRASS,
  label: 'Hasenhügel',
  sky: [[1, 0x2a8ae8], [0.45, 0x52b0fa], [0.15, 0x9ad8ff], [0.03, 0xd8f4ff], [0, 0xeefaff], [-0.1, 0xd0ecd0], [-1, 0xa8d0a0]],
  background: 0xd8f0f8,
  fog: { color: 0xdaf0f6, near: 100, far: 440 },
  hemi: { sky: 0xd0f0ff, ground: 0x80b850, intensity: 1.35 },
  sun: { color: 0xfff4d8, intensity: 2.8, dir: [-0.3, 1, 0.45] },
  grass: 0x7ad84a, grass2: 0x70cc44, grassFar: 0x62bc3c, offroad: 0x9a7048, offroad2: 0x8e6640,   // Erde
  road: 0xb08a5e, road2: 0xa88258, line: 0xfff4d8, curbA: 0xff8a1a, curbB: 0x4fb833,
  wallA: 0xff8a1a, wallB: 0xffa83a, wallTop: 0x4fb833, wallH: 0.8,
  bridge: 0x8a5a32, bridgePillar: 0x6a4428, bridgeTop: 0xb08a5e, bridgeTop2: 0xa88258,
};

// Palmen-City: Sonnenuntergang über der Großstadt, Neonlicht, breite Asphaltstraßen, Betonbanden
const CITY = {
  ...GRASS,
  label: 'Palmen-City',
  sky: [[1, 0x2a1a5a], [0.55, 0x5a2a8a], [0.28, 0xc04a9a], [0.12, 0xff6a7a], [0.04, 0xffa05a], [0, 0xffc870], [-0.08, 0xd86a7a], [-1, 0x3a2050]],
  background: 0xf08a7a,
  fog: { color: 0xe08a8a, near: 120, far: 500 },
  hemi: { sky: 0xffd0d8, ground: 0x6a4a7a, intensity: 1.6 },
  sun: { color: 0xffb880, intensity: 2.8, dir: [0.6, 0.6, 0.5] },
  hills: null, city: [0x2c2448, 0x3a2f5c, 0x47386a, 0x332a52], cityWindow: 0xffd88a,
  grass: 0x5aa84a, grass2: 0x52a044, grassFar: 0x4a8a40, offroad: 0xb8b0c0, offroad2: 0xaea6b8,   // Gehweg
  road: 0x4a4858, road2: 0x46445a, line: 0xffffff, lineYellow: 0xffcf3a, curbA: 0xffd23a, curbB: 0x1a1a22,
  wallA: 0xd8dce4, wallB: 0xd8dce4, wallTop: 0xff3a8a, wallH: 0.9,
  bridge: 0x8a8a96, bridgePillar: 0x7a7a86, bridgeTop: 0x6a6878, bridgeTop2: 0x646272,
};

// Teneriffa: kräftig blauer Kanaren-Himmel, warmes Licht, trockenes Grün, dunkler Vulkansand am Wegrand,
// weiße Banden mit Kanaren-Blau und Gelb.
const TENERIFE = {
  ...GRASS,
  label: 'Teneriffa',
  sky: [[1, 0x1a6ae0], [0.45, 0x3a92f4], [0.15, 0x86c8fa], [0.03, 0xd2eefc], [0, 0xeaf8ff], [-0.1, 0xbfe2f2], [-1, 0x7ab8d8]],
  background: 0xd4eefa,
  fog: { color: 0xd8eef8, near: 120, far: 540 },
  hemi: { sky: 0xd8eeff, ground: 0x9a7a52, intensity: 1.4 },
  sun: { color: 0xfff2d8, intensity: 3.0, dir: [-0.3, 1, 0.45] },
  hills: 0x8a8a52, hills2: 0x9a8a5a,
  grass: 0x8eaa4c, grass2: 0x86a246, grassFar: 0x7e9842, offroad: 0x5e4e46, offroad2: 0x564640,   // Vulkansand
  road: 0x8c8894, road2: 0x86828e, line: 0xf8f6f0, curbA: 0xe8392d, curbB: 0xf8f6f0,
  wallA: 0xfaf6ee, wallB: 0x2a6ab8, wallTop: 0xf2c14e, wallH: 0.8,
};

// Hafenstadt (nach dem Vorbild von Toad-Hafen): helle Mittelmeerstadt am Meer, grüne Hänge, Pflaster in warmem Grau.
const HARBOR = {
  ...GRASS,
  label: 'Hafenstadt',
  sky: [[1, 0x1a72e8], [0.45, 0x3a9af6], [0.15, 0x8ccffb], [0.03, 0xd4f0fd], [0, 0xecf9ff], [-0.1, 0xc2e4f4], [-1, 0x7cbad8]],
  background: 0xd6effb,
  fog: { color: 0xd8eff9, near: 120, far: 520 },
  hemi: { sky: 0xd8eeff, ground: 0x8a8a6a, intensity: 1.4 },
  sun: { color: 0xfff2d8, intensity: 3.0, dir: [-0.35, 1, 0.5] },
  grass: 0x7cc84a, grass2: 0x72bc44, grassFar: 0x6aae40, offroad: 0xb8a88e, offroad2: 0xae9e84,   // Pflaster und Sand
  road: 0x9a92a0, road2: 0x948c9a, line: 0xf8f6f0, curbA: 0x2a6ab8, curbB: 0xf8f6f0,
  wallA: 0xfaf6ee, wallB: 0x2a6ab8, wallTop: 0xf2c14e, wallH: 0.8,
};

// Buckelpisten-Arena (nach dem Vorbild der Excitebike-Arena): Stadion mit Lehmpiste, grünem Innenfeld und
// Reifenstapeln als Banden.
const ARENA = {
  ...GRASS,
  label: 'Arena',
  fog: { color: 0xdcecf6, near: 120, far: 520 },
  grass: 0x6cc84a, grass2: 0x62bc44, grassFar: 0x5aae3e, offroad: 0xa8784a, offroad2: 0x9c6e42,
  road: 0xb88250, road2: 0xae7a4a, line: 0xfaf6ee, curbA: 0xe8392d, curbB: 0xfaf6ee,
  wallA: 0x2a2a30, wallB: 0xffc21a, wallTop: 0x2a2a30, wallH: 0.9,
};

// Schlossring (nach dem Vorbild von Royal Raceway): sattgrüne Hügel, Schloss auf dem Berg, See im Tal.
const ROYAL = {
  ...GRASS,
  label: 'Schlossring',
  grass: 0x6ad848, grass2: 0x5ecc40, grassFar: 0x58c03c,
  road: 0x8e8aa4, road2: 0x88849e, curbA: 0xe8392d, curbB: 0xfaf6ee,
  wallA: 0xfaf6ee, wallB: 0xff6aa8, wallTop: 0xffc21a, wallH: 0.8,
};

// Wasserfall-Schlucht (nach dem Vorbild von Shy Guy Falls): rote Felswände, grüne Ränder, Fluss in der Schlucht.
const CANYON = {
  ...GRASS,
  label: 'Schlucht',
  sky: [[1, 0x2a86e8], [0.45, 0x52aaf6], [0.15, 0x9ad6fb], [0.03, 0xd8f0fc], [0, 0xf2f8ff], [-0.1, 0xc8dcea], [-1, 0x8aaac4]],
  hemi: { sky: 0xd4ecff, ground: 0x9a5a3a, intensity: 1.4 },
  grass: 0x6ab84a, grass2: 0x62ac44, grassFar: 0xb07050, offroad: 0xc0784e, offroad2: 0xb46e46,   // roter Fels
  road: 0x9c8a84, road2: 0x94827e, curbA: 0xffc21a, curbB: 0x5a3a2a,
  wallA: 0x8a5a32, wallB: 0x6a4224, wallTop: 0xffc21a, wallH: 0.9,
  rock: 0xc06a44,   // Felswände und Plateau
};

// Mitternachts-Highway: Großstadt bei Nacht wie in Need for Speed – nasser, spiegelnder Asphalt, Neon in Pink und
// Türkis, Natriumlicht im Tunnel, Lichtglocke der Stadt am Horizont. Immer Nacht.
const NIGHTCITY = {
  ...CITY,
  label: 'Mitternachts-Highway',
  sky: [[1, 0x04051a], [0.45, 0x0b0f30], [0.15, 0x1e1648], [0.03, 0x4a2462], [0, 0x5a2a68], [-0.1, 0x221634], [-1, 0x08060f]],
  background: 0x2a1a44,
  fog: { color: 0x241a40, near: 70, far: 360 },
  hemi: { sky: 0x5a64b8, ground: 0x2a1e3a, intensity: 0.75 },
  sun: { color: 0x9fb2ff, intensity: 0.85, dir: [-0.4, 0.8, -0.5] },
  sunDisc: true, clouds: false, isNight: true,
  city: [0x1a1830, 0x22203c, 0x2a2446, 0x1e1a34, 0x302a4e], cityWindow: 0xffd88a,
  grass: 0x2e4a3a, grass2: 0x2a4436, grassFar: 0x24382e, offroad: 0x4a4858, offroad2: 0x44425a,   // Gehweg
  road: 0x33323e, road2: 0x302f3c, line: 0xf2f2f6, lineYellow: 0xffcf3a, curbA: 0xff3a8a, curbB: 0x1a1a22,
  wallA: 0x8a8e9a, wallB: 0x8a8e9a, wallTop: 0x3ad8ff, wallH: 1.0,
  bridge: 0x6a6a76, bridgePillar: 0x5a5a66, bridgeTop: 0x4a4858, bridgeTop2: 0x46445a,
  wetRoad: true,
};

// Wrack-Riff: strahlender Hafen an der Nordküste, Kai aus Beton, Bojen-Banden rot-weiß; das Deck der Fähre aus Stahl
const REEF = {
  ...GRASS,
  label: 'Wrack-Riff',
  sky: [[1, 0x1a62d8], [0.45, 0x3a96ee], [0.15, 0x8ad4f6], [0.03, 0xd8f4ff], [0, 0xeefaff], [-0.1, 0xa8e0f0], [-1, 0x3a9ad0]],
  background: 0xd8eef8,
  fog: { color: 0xd4ecf6, near: 110, far: 470 },
  hemi: { sky: 0xe0f4ff, ground: 0x7ab8c8, intensity: 1.45 },
  sun: { color: 0xfff4dc, intensity: 3.0, dir: [-0.35, 0.9, 0.3] },
  hills: 0x5ab84a, hills2: 0xe8d8a8,
  grass: 0x7cc44a, grass2: 0x72ba44, grassFar: 0x6aae40, offroad: 0xf2e2b0, offroad2: 0xe8d6a0,   // Sand
  road: 0x8e98a6, road2: 0x8892a0, line: 0xffffff, curbA: 0xe8392d, curbB: 0xffffff,
  wallA: 0xe8392d, wallB: 0xf8f8f8, wallTop: 0xffd23a, wallH: 0.85,
  bridge: 0x1e3a6a, bridgePillar: 0x2a3a5a, bridgeTop: 0x7a828e, bridgeTop2: 0x727a86,
};

// Dino-Dschungel: feucht-grüner Urwald, leichter Dunst, rote Lehmstraße, Bambusbanden
const JUNGLE = {
  ...GRASS,
  label: 'Dschungel',
  sky: [[1, 0x2a7ad0], [0.45, 0x5aa8e0], [0.15, 0xa8dce8], [0.03, 0xd8f0e0], [0, 0xe8f6e8], [-0.1, 0xb8d8c0], [-1, 0x8ab898]],
  background: 0xc8e4d0,
  fog: { color: 0xc4e0cc, near: 70, far: 380 },
  hemi: { sky: 0xd8f2e0, ground: 0x4a7a3a, intensity: 1.35 },
  sun: { color: 0xfff2d0, intensity: 2.6, dir: [-0.3, 1, 0.35] },
  hills: 0x3a8a2e, hills2: 0x4a9a3a,
  grass: 0x4aa83a, grass2: 0x42a034, grassFar: 0x3a8a2e, offroad: 0x8a6a3a, offroad2: 0x7e6034,
  road: 0xb07a52, road2: 0xa8724c, line: 0xfff4e0, curbA: 0xffc21a, curbB: 0x2f8a2a,
  wallA: 0xc8c45a, wallB: 0xa8a440, wallTop: 0x3a9a2e, wallH: 0.8,
  bridge: 0x7a5a32, bridgePillar: 0x6a4a2a, bridgeTop: 0x9a7a4a, bridgeTop2: 0x8e6e42,
};

export const THEMES = { canyon: CANYON, royal: ROYAL, arena: ARENA, harbor: HARBOR, tenerife: TENERIFE, nightcity: NIGHTCITY, halloween: HALLOWEEN, cats: CATS, bunny: BUNNY, city: CITY, reef: REEF, jungle: JUNGLE, pirate: PIRATE, zoo: ZOO, grass: GRASS, autumn: AUTUMN, circus: CIRCUS, highway: HIGHWAY, cave: CAVE, beach: BEACH, snow: SNOW, castle: CASTLE, desert: DESERT, volcano: VOLCANO, candy: CANDY };
export const getTheme = (n) => THEMES[n] ?? GRASS;

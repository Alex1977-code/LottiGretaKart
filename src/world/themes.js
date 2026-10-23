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

export const THEMES = { zoo: ZOO, grass: GRASS, autumn: AUTUMN, circus: CIRCUS, highway: HIGHWAY, cave: CAVE, beach: BEACH, snow: SNOW, castle: CASTLE, desert: DESERT, volcano: VOLCANO, candy: CANDY };
export const getTheme = (n) => THEMES[n] ?? GRASS;

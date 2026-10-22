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
  hills: 0xc9702a, hills2: 0xe0a040,
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

export const THEMES = { grass: GRASS, autumn: AUTUMN, circus: CIRCUS, highway: HIGHWAY, cave: CAVE };
export const getTheme = (n) => THEMES[n] ?? GRASS;

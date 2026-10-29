// Inselplan: alle Strecken an festen Plätzen in einer gemeinsamen Landschaft (Grüne Blockinsel und Nachbarinseln).
// Gefahren wird wie in Mario Kart 8 Deluxe immer nur auf einer Strecke: courseWorldDef schneidet aus dem Plan die
// Welt einer Strecke aus (Gelände ringsum, Seen, Berge, Höhle/Zelt, Schienen) – ohne die anderen Strecken.
// Koordinaten in Metern, x = Osten, z = Süden, Meeresspiegel y = 0.
//
// courses     Strecke (Definition aus src/tracks) + Verschiebung in die Landschaft.
// regions     Stimmung (Himmel, Licht, Bodenfarben) mit Mittelpunkt und Radius – wird beim Fahren übergeblendet.
// flats       ebene Flächen (Stadion, Zelt, Höhle, Stadt), damit Bauten und Strecken nicht auf Hügeln stehen.
// rails       Grind-Schienen (Polylinie, Höhe über Boden bzw. über dem Wasser).

import kraxelwiese from '../tracks/kraxelwiese.js';
import herbstwald from '../tracks/herbstwald.js';
import laternengrotte from '../tracks/laternengrotte.js';
import manege from '../tracks/manege.js';
import autobahn from '../tracks/autobahn.js';
import strand from '../tracks/strand.js';
import gipfel from '../tracks/gipfel.js';
import burg from '../tracks/burg.js';
import wueste from '../tracks/wueste.js';
import vulkan from '../tracks/vulkan.js';
import bonbon from '../tracks/bonbon.js';
import loroparque from '../tracks/loroparque.js';
import piratenbucht from '../tracks/piratenbucht.js';
import dinodschungel from '../tracks/dinodschungel.js';
import wrackriff from '../tracks/wrackriff.js';
import spukinsel from '../tracks/spukinsel.js';
import katzeninsel from '../tracks/katzeninsel.js';
import hasenhuegel from '../tracks/hasenhuegel.js';
import palmencity from '../tracks/palmencity.js';
import mitternacht from '../tracks/mitternacht.js';
import teneriffa from '../tracks/teneriffa.js';
import hafenstadt from '../tracks/hafenstadt.js';
import arena from '../tracks/arena.js';
import schlossring from '../tracks/schlossring.js';
import schlucht from '../tracks/schlucht.js';

export const WORLD = {
  name: 'Grüne Blockinsel',
  // Insel als Ellipse mit welliger Küste
  island: { cx: 70, cz: -10, rx: 1100, rz: 800 },
  bounds: { minX: -1300, maxX: 1740, minZ: -1300, maxZ: 1300 },
  // Nachbarinseln vor der Küste (über Straßen auf dem Wasser erreichbar)
  islets: [
    { name: 'Spukinsel', x: -900, z: -730, rx: 200, rz: 165 },
    { name: 'Katzeninsel', x: -1040, z: 720, rx: 195, rz: 165 },
    { name: 'Palmen-City', x: 1470, z: 300, rx: 235, rz: 195 },
    { name: 'Neon-Insel', x: 1300, z: -430, rx: 240, rz: 190 },
    { name: 'Teneriffa', x: 1180, z: 820, rx: 300, rz: 250 },
    { name: 'Hafenstadt', x: -480, z: 1035, rx: 265, rz: 150 },
    { name: 'Arena', x: 60, z: 1015, rx: 215, rz: 130 },
    { name: 'Schlossberg', x: 560, z: 1040, rx: 270, rz: 170 },
    { name: 'Schluchtinsel', x: -490, z: -1090, rx: 270, rz: 160 },
  ],
  courses: [
    { def: kraxelwiese, ox: -20, oz: -60 },
    { def: herbstwald, ox: 0, oz: -278 },
    { def: laternengrotte, ox: -414, oz: 18 },
    { def: manege, ox: -335, oz: 280 },
    { def: autobahn, ox: 430, oz: 120 },
    { def: strand, ox: 140, oz: 445 },
    { def: gipfel, ox: 620, oz: -190 },
    { def: burg, ox: -200, oz: -515 },
    { def: wueste, ox: 880, oz: 60 },
    { def: vulkan, ox: -700, oz: 380 },
    { def: bonbon, ox: -690, oz: -340 },
    { def: loroparque, ox: 600, oz: 410 },
    { def: piratenbucht, ox: -320, oz: 590 },
    { def: dinodschungel, ox: 350, oz: -610 },
    { def: wrackriff, ox: 40, oz: -770 },
    { def: spukinsel, ox: -900, oz: -730 },
    { def: katzeninsel, ox: -1040, oz: 720 },
    { def: hasenhuegel, ox: -870, oz: 40 },
    { def: palmencity, ox: 1470, oz: 300 },
    { def: mitternacht, ox: 1300, oz: -430 },
    { def: teneriffa, ox: 1180, oz: 820 },
    { def: hafenstadt, ox: -480, oz: 1060 },
    { def: arena, ox: 70, oz: 1050 },
    { def: schlossring, ox: 560, oz: 1060 },
    { def: schlucht, ox: -480, oz: -1090 },
  ],
  lakes: [
    { x: -40, z: 205, r: 95, depth: 4 },
    { x: 60, z: 260, r: 70, depth: 3 },
    { x: 100, z: 497, r: 12, depth: 1.5 },   // Lagune im Funkelstrand
    { x: 200, z: 728, r: 140, depth: 6 },    // Bucht südlich vom Funkelstrand (offen zum Meer)
    { x: 380, z: 700, r: 110, depth: 6 },
    { x: -212, z: 590, r: 22, depth: 3 },    // Piratenlagune (Schiff)
    { x: 498, z: 985, r: 34, depth: 3 },     // See unter dem Gleitflug am Schlossring
    { x: -500, z: -1110, r: 22, depth: 2.5 }, // Becken unter dem Wasserfall
    { x: -600, z: -1112, r: 18, depth: 2 },   // Becken unter dem zweiten Wasserfall
  ],
  flats: [
    { x: 0, z: 0, r: 175, h: 3 },            // Kraxelwiese-Stadion
    { x: -420, z: -40, r: 175, h: 4 },       // Höhlenberg innen
    { x: -320, z: 330, r: 165, h: 2.5 },     // Zirkuszelt
    { x: 455, z: 192, r: 290, h: 3 },        // Stadt und Autobahn
    { x: 0, z: -330, r: 175, h: 6 },         // Herbstwald (leicht erhöht)
    { x: 182, z: 490, r: 130, h: 2 },        // Funkelstrand
    { x: 620, z: -215, r: 150, h: 20 },      // Glitzergipfel (Hochplateau)
    { x: -200, z: -500, r: 135, h: 10 },     // Brummbär-Burg auf der Nordklippe
    { x: 925, z: 0, r: 190, h: 3 },          // Sonnenschlucht
    { x: -700, z: 428, r: 145, h: 5 },       // Feuerberg
    { x: -690, z: -398, r: 150, h: 8 },      // Zuckerwatten-Allee
    { x: 645, z: 488, r: 200, h: 3 },        // Loro Parque
    { x: -320, z: 590, r: 190, h: 2 },       // Piratenbucht
    { x: 455, z: -610, r: 200, h: 4 },       // Dino-Dschungel
    { x: 10, z: -742, r: 70, h: 3 },         // Hafen am Wrack-Riff
    { x: -900, z: -730, r: 150, h: 4 },      // Spukinsel
    { x: -1040, z: 720, r: 145, h: 3 },      // Katzeninsel
    { x: -870, z: -100, r: 115, h: 4 },      // Hasenhügel (Nord)
    { x: -870, z: 160, r: 115, h: 3 },       // Hasenhügel (Süd)
    { x: 1470, z: 300, r: 175, h: 3 },       // Palmen-City
    { x: 1300, z: -430, r: 200, h: 3 },      // Mitternachts-Highway
    { x: 1005, z: 885, r: 55, h: 3 },        // Teneriffa: Altstadt
    { x: 1395, z: 850, r: 45, h: 3 },        // Teneriffa: Einkaufszentrum
    { x: 1161, z: 932, r: 55, h: 3.8 },      // Teneriffa: Hotel Bahía Príncipe San Felipe (Auffahrt vorn, Pool hinten)
    { x: 1265, z: 950, r: 55, h: 3.5 },      // Teneriffa: Loro Parque neben dem Hotel
    { x: 1244, z: 1035, r: 28, h: 2.2 },     // Teneriffa: Lago Martiánez
    { x: 55, z: 1015, r: 150, h: 3 },        // Buckelpisten-Arena (Stadionboden)
    { x: 670, z: 975, r: 70, h: 27 },        // Schlossring: Schlossberg
    { x: -420, z: -1180, r: 75, h: 32 },     // Wasserfall-Schlucht: Hochplateau (Ost)
    { x: -560, z: -1168, r: 55, h: 32 },     // Hochplateau (West, Gleiter-Kante)
    { x: -500, z: -1010, r: 95, h: 3 },      // Schluchtgrund am Fluss
  ],
  hills: [
    [180, -120, 70, 14], [-200, -200, 80, 18], [330, -540, 80, 22], [-460, -580, 70, 30], [-650, -300, 120, 45],
    [-640, 120, 110, 30], [620, -260, 120, 38], [780, 80, 90, 20], [160, 420, 80, 12], [-560, 470, 90, 16],
    [400, -560, 90, 26], [120, -620, 90, 24], [-760, -60, 90, 40],
    [860, -300, 70, 55], [520, -390, 70, 50], [740, -360, 70, 40],   // Schneeberge um den Glitzergipfel
    [-880, 330, 70, 62], [-560, 560, 60, 30],   // Vulkankegel und Aschehügel
    [1080, 220, 80, 28], [1000, -260, 70, 26],  // Tafelland der Wüste
    [1220, 760, 115, 42],                       // Teide auf Teneriffa
    [-480, 990, 130, 19],                       // Stadthügel der Hafenstadt
  ],
  // Höhle im Berg und Zirkuszelt als Bauwerke über den Strecken (Eingänge entstehen an den Verbindungsstraßen)
  structures: [
    { kind: 'cave', x: -420, z: -40, r: 168, h: 46 },
    { kind: 'tent', x: -320, z: 330, r: 150, h: 18, roof: 34 },
  ],
  regions: [
    { theme: 'grass', x: 0, z: 0, r: 260, base: true },
    { theme: 'autumn', x: 0, z: -330, r: 220 },
    { theme: 'cave', x: -420, z: -40, r: 150, fade: 30 },
    { theme: 'circus', x: -320, z: 330, r: 135, fade: 30 },
    { theme: 'highway', x: 455, z: 192, r: 300 },
    { theme: 'beach', x: 182, z: 500, r: 170, fade: 90 },
    { theme: 'snow', x: 620, z: -215, r: 160, fade: 90 },
    { theme: 'castle', x: -200, z: -500, r: 130, fade: 70 },
    { theme: 'desert', x: 950, z: 0, r: 200, fade: 90 },
    { theme: 'volcano', x: -700, z: 428, r: 150, fade: 80 },
    { theme: 'candy', x: -690, z: -398, r: 150, fade: 80 },
    { theme: 'zoo', x: 645, z: 488, r: 190, fade: 80 },
    { theme: 'pirate', x: -320, z: 590, r: 180, fade: 80 },
    { theme: 'jungle', x: 455, z: -610, r: 190, fade: 80 },
    { theme: 'reef', x: 30, z: -880, r: 170, fade: 90 },
    { theme: 'halloween', x: -900, z: -730, r: 200, fade: 90 },
    { theme: 'cats', x: -1040, z: 720, r: 190, fade: 90 },
    { theme: 'bunny', x: -870, z: 40, r: 170, fade: 90 },
    { theme: 'city', x: 1470, z: 300, r: 230, fade: 90 },
    { theme: 'nightcity', x: 1300, z: -430, r: 230, fade: 90 },
    { theme: 'tenerife', x: 1180, z: 820, r: 290, fade: 90 },
    { theme: 'harbor', x: -480, z: 1040, r: 270, fade: 90 },
    { theme: 'arena', x: 60, z: 1015, r: 200, fade: 60 },
    { theme: 'royal', x: 560, z: 1040, r: 260, fade: 80 },
    { theme: 'canyon', x: -490, z: -1090, r: 260, fade: 80 },
  ],
  // Grind-Schienen: über den See (Abkürzung) und neben der Waldstraße
  rails: [
    { pts: [[-150, 300], [-110, 250], [-60, 200], [-20, 160]], h: 1.6 },
    { pts: [[52, -128], [22, -168], [8, -205]], h: 0.9 },
    { pts: [[300, -270], [380, -190], [440, -110]], h: 0.9 },
    { pts: [[180, 190], [178, 250], [174, 300]], h: 0.9 },
  ],
};

/** Cups im Grand Prix: je vier Strecken nacheinander, Punkte nach Platz. */
export const WORLD_CUPS = [
  { id: 'beeren', name: 'Beeren-Cup', tracks: ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege'] },
  { id: 'brummbaer', name: 'Brummbär-Cup', tracks: ['manege', 'kraxelwiese', 'autobahn', 'herbstwald'] },
  { id: 'muschel', name: 'Muschel-Cup', tracks: ['manege', 'kraxelwiese', 'strand', 'autobahn'] },
  { id: 'kronen', name: 'Kronen-Cup', tracks: ['autobahn', 'gipfel', 'herbstwald', 'burg'] },
  { id: 'bonbon', name: 'Bonbon-Cup', tracks: ['burg', 'bonbon', 'laternengrotte', 'vulkan'] },
  { id: 'wuesten', name: 'Wüsten-Cup', tracks: ['gipfel', 'wueste', 'autobahn', 'strand'] },
  { id: 'tierpark', name: 'Tierpark-Cup', tracks: ['strand', 'loroparque', 'autobahn', 'wueste'] },
  { id: 'piraten', name: 'Piraten-Cup', tracks: ['manege', 'piratenbucht', 'vulkan', 'laternengrotte'] },
  { id: 'dino', name: 'Dino-Cup', tracks: ['herbstwald', 'dinodschungel', 'gipfel', 'wueste'] },
  { id: 'ozean', name: 'Ozean-Cup', tracks: ['burg', 'wrackriff', 'dinodschungel', 'herbstwald'] },
  { id: 'grusel', name: 'Grusel-Cup', tracks: ['herbstwald', 'burg', 'bonbon', 'spukinsel'] },
  { id: 'kuschel', name: 'Kuschel-Cup', tracks: ['katzeninsel', 'vulkan', 'hasenhuegel', 'laternengrotte'] },
  { id: 'neon', name: 'Neon-Cup', tracks: ['strand', 'autobahn', 'wueste', 'palmencity'] },
  { id: 'nacht', name: 'Mitternachts-Cup', tracks: ['autobahn', 'wueste', 'mitternacht', 'palmencity'] },
  { id: 'kanaren', name: 'Kanaren-Cup', tracks: ['strand', 'loroparque', 'teneriffa', 'palmencity'] },
  // Strecken nach dem Vorbild von Mario Kart 8 Deluxe: Höhenprofile, Kuppensprünge, Gleitflüge
  { id: 'gleiter', name: 'Gleiter-Cup', tracks: ['schlucht', 'hafenstadt', 'arena', 'schlossring'] },
];

/** Rand rund um eine Strecke, der zur Strecken-Welt gehört (Gelände, Kulisse); dahinter beginnt die Fernsicht. */
const PAD = 190;

/**
 * Welt einer einzelnen Strecke: derselbe Landschaftsplan (Küsten, Hügel, Seen bleiben, wie sie sind), aber nur
 * diese Strecke, ihr Ausschnitt und die Bauten darin.
 */
export function courseWorldDef(id) {
  const c = WORLD.courses.find((k) => k.def.id === id) ?? WORLD.courses[0];
  const xs = c.def.ctrl.map((p) => p[0] + c.ox), zs = c.def.ctrl.map((p) => p[1] + c.oz);
  const bounds = { minX: Math.min(...xs) - PAD, maxX: Math.max(...xs) + PAD, minZ: Math.min(...zs) - PAD, maxZ: Math.max(...zs) + PAD };
  const inside = (x, z, r = 0) => x + r > bounds.minX && x - r < bounds.maxX && z + r > bounds.minZ && z - r < bounds.maxZ;
  const cx = (bounds.minX + bounds.maxX) / 2, cz = (bounds.minZ + bounds.maxZ) / 2;
  return {
    ...WORLD,
    name: c.def.name,
    bounds,
    center: { x: cx, z: cz, r: Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2 },
    courses: [c],
    // Höhle/Zelt nur, wenn die Strecke darin liegt (dann geschlossen: keine Eingänge)
    structures: WORLD.structures.filter((st) => Math.hypot(st.x - (Math.min(...xs) + Math.max(...xs)) / 2, st.z - (Math.min(...zs) + Math.max(...zs)) / 2) < st.r).map((st) => ({ ...st, doors: [] })),
    rails: WORLD.rails.filter((r) => r.pts.every(([x, z]) => inside(x, z, -20))),
    regions: WORLD.regions.filter((r) => inside(r.x, r.z, r.r + (r.fade ?? 120)) || r.base),
  };
}

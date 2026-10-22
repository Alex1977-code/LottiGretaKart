// Alle Strecken und Cups.
import kraxelwiese from './kraxelwiese.js';
import herbstwald from './herbstwald.js';
import laternengrotte from './laternengrotte.js';
import manege from './manege.js';
import autobahn from './autobahn.js';

export const TRACKS = [kraxelwiese, herbstwald, laternengrotte, manege, autobahn];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
export const CUPS = [
  { id: 'beeren', name: 'Beeren-Cup', tracks: ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege'] },
  { id: 'brummbaer', name: 'Brummbär-Cup', tracks: ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege', 'autobahn'] },
];

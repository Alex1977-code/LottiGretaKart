// Alle Strecken.
import kraxelwiese from './kraxelwiese.js';
import herbstwald from './herbstwald.js';
import laternengrotte from './laternengrotte.js';
import manege from './manege.js';
import autobahn from './autobahn.js';
import strand from './strand.js';
import gipfel from './gipfel.js';
import burg from './burg.js';

export const TRACKS = [kraxelwiese, herbstwald, laternengrotte, manege, autobahn, strand, gipfel, burg];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

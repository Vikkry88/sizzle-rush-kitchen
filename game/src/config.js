// Every tuning number and colour in one place. The kitchen floor is a fixed
// 17 by 11 metre rectangle; the camera and the rules both work in that space,
// so nothing below depends on the size of the browser window.

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. */
export const SHIFT_SECONDS = 180;

/** Seconds between new orders, and how many orders may wait at once. */
export const ORDER_INTERVAL = 13;
export const MAX_ORDERS = 4;

/** How long an order stays on the board before it expires, in seconds. */
export const ORDER_LIFETIME = 55;

/** How far the chef must stand from a station to use it, in metres. */
export const USE_RADIUS = 1.9;

/** Chef movement speed, in metres per second. */
export const CHEF_SPEED = 5.2;

/** Seconds a chop takes on the board, and a cook takes on the stove. */
export const CHOP_SECONDS = 1.6;
export const COOK_SECONDS = 2.6;

/** Points for a served dish: base plus per-ingredient, times the combo multiplier. */
export const SERVE_BASE = 100;
export const SERVE_PER_INGREDIENT = 25;

/** Combo multiplier grows 0.25 per dish in a row, capped here. */
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 3;

/** The kitchen floor, in metres, centred on the origin. */
export const FLOOR = { width: 17, depth: 11 };

/** Where the best score of this visit is kept (this browser only). */
export const BEST_KEY = 'sizzle-rush.best';

export const PALETTE = {
  floorLight: '#e8b06a',
  floorDark: '#c98d4e',
  wall: '#8a4b2d',
  wallTop: '#5d2f1c',
  counterTop: '#f2e3c6',
  counterSide: '#7a4a26',
  steel: '#9aa5ad',
  steelDark: '#5c6670',
  stoveGlow: '#ff7a2f',
  boardWood: '#d9a05b',
  passShelf: '#ffd166',
  text: '#fff7ea',
  accent: '#ffb63d',
};

/** Stations the chef can walk up to and use with E. */
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', ingredient: 'bun', label: 'Bun Crate', x: -7.2, z: -4.2 },
  { id: 'bin-patty', kind: 'bin', ingredient: 'patty', label: 'Patty Fridge', x: -5.4, z: -4.2 },
  { id: 'bin-lettuce', kind: 'bin', ingredient: 'lettuce', label: 'Lettuce Crate', x: -3.6, z: -4.2 },
  { id: 'bin-tomato', kind: 'bin', ingredient: 'tomato', label: 'Tomato Crate', x: -1.8, z: -4.2 },
  { id: 'bin-noodle', kind: 'bin', ingredient: 'noodle', label: 'Noodle Box', x: 0.0, z: -4.2 },
  { id: 'bin-broth', kind: 'bin', ingredient: 'broth', label: 'Broth Pot', x: 1.8, z: -4.2 },
  { id: 'bin-satay', kind: 'bin', ingredient: 'satay', label: 'Satay Grill', x: 3.6, z: -4.2 },
  { id: 'bin-cheese', kind: 'bin', ingredient: 'cheese', label: 'Cheese Board', x: 5.4, z: -4.2 },
  { id: 'board', kind: 'board', label: 'Chopping Board', x: -7.6, z: 0.2 },
  { id: 'stove', kind: 'stove', label: 'Stove', x: 7.6, z: 0.2 },
  { id: 'plate', kind: 'plate', label: 'Assembly Plate', x: 0.0, z: 0.6 },
  { id: 'pass', kind: 'pass', label: 'Serve Pass', x: 0.0, z: 4.4 },
  { id: 'trash', kind: 'trash', label: 'Trash Bin', x: 7.2, z: 4.4 },
];

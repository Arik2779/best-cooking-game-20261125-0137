// Simmer & Serve — Warung Rush: every tuning number and colour in one place.
// The kitchen is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One dinner shift: seconds on the clock, coins to earn, hearts to lose. */
export const SHIFT = {
  seconds: 150,
  targetCoins: 120,
  hearts: 3,
  /** Rush hour begins when this many seconds are left: faster tickets, less patience. */
  rushAtSecondsLeft: 60,
};

/** Order tickets: how often they arrive and how long a customer waits. */
export const ORDERS = {
  firstAfterSeconds: 2,
  spawnInterval: 14,
  spawnIntervalRush: 8,
  maxOpen: 4,
  patienceSeconds: 50,
  patienceSecondsRush: 34,
};

/** Processing time per station, in seconds. The grill is slow on purpose: start it first. */
export const STATION_TIME = { chop: 2, wok: 3, grill: 4, pot: 3 };

/** The four stations, in the order they sit along the back counter. */
export const STATIONS = [
  { id: 'chop', name: 'Chop Board', key: 'Q', verb: 'chop', colour: '#e8b04b' },
  { id: 'wok', name: 'Wok', key: 'W', verb: 'fry', colour: '#e2603f' },
  { id: 'grill', name: 'Grill', key: 'E', verb: 'grill', colour: '#c94f6d' },
  { id: 'pot', name: 'Pot', key: 'R', verb: 'boil', colour: '#4f9ec9' },
];

/** Two plating spots, so one dish can finish while another is still being built. */
export const PLATES = [
  { id: 0, name: 'Plate 1', key: 'A' },
  { id: 1, name: 'Plate 2', key: 'B' },
];

export const PALETTE = {
  wall: '#3a2b26',
  wallTop: '#4a362e',
  floor: '#6b4a35',
  floorTile: '#7d5840',
  counterTop: '#b98a5a',
  counterFront: '#8a5f3c',
  counterEdge: '#e0b47e',
  board: '#2e2620',
  boardFrame: '#d9a45b',
  paper: '#f7ead0',
  paperInk: '#3d2b1f',
  plate: '#f4f1e8',
  plateRim: '#c9b98a',
  hud: '#241a14',
  hudText: '#ffe9b8',
  text: '#fff6e3',
  muted: '#cbb59a',
  good: '#7fc96b',
  warn: '#f2c94c',
  bad: '#e5534b',
  accent: '#ffb347',
  serve: '#58c96b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift result is kept between visits (this browser only). */
export const BEST_KEY = 'simmer-and-serve.best-coins';

// ============================================
// Level 01 — 15 rooms (教学关简化版)
// ============================================

const TILE = CONFIG.screen.tileSize;
const ROWS = 15;
const COLS = 20;
const FLOOR = ROWS - 1;

const TILE_EMPTY = 0;
const TILE_SOLID = 1;
const TILE_ONEWAY = 2;
const TILE_ICE = 3;

const floorY = CONFIG.screen.height - TILE;
const entryY = floorY - CONFIG.player.height;

const makeGrid = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(TILE_EMPTY));

const addFloor = (grid) => {
  for (let c = 0; c < COLS; c += 1) {
    grid[FLOOR][c] = TILE_SOLID;
  }
};

const addPlatforms = (grid, platforms) => {
  for (const p of platforms) {
    for (let c = 0; c < p.w; c += 1) {
      grid[p.y][p.x + c] = p.type || TILE_SOLID;
    }
  }
};

const addGaps = (grid, gaps) => {
  for (const gap of gaps) {
    for (let c = gap.start; c <= gap.end; c += 1) {
      grid[FLOOR][c] = TILE_EMPTY;
    }
  }
};

const addIce = (grid, iceRanges) => {
  for (const range of iceRanges) {
    for (let c = range.start; c <= range.end; c += 1) {
      grid[FLOOR][c] = TILE_ICE;
    }
  }
};

const createExit = () => ({
  x: CONFIG.screen.width - 20,
  y: floorY - 32,
  w: 16,
  h: 32,
});

const createEntry = () => ({ x: 16, y: entryY });

const createRoom = ({
  platforms = [],
  gaps = [],
  iceRanges = [],
  spikes = [],
  dots = [],
  crystals = [],
  movingPlatforms = [],
  crumblingPlatforms = [],
}) => {
  const tiles = makeGrid();
  addFloor(tiles);
  addGaps(tiles, gaps);
  addPlatforms(tiles, platforms);
  addIce(tiles, iceRanges);

  return {
    tiles,
    spikes,
    dots,
    crystals,
    movingPlatforms,
    crumblingPlatforms,
    entry: createEntry(),
    exit: createExit(),
  };
};

const LEVEL_01 = [
  createRoom({
    dots: [{ x: 120, y: 180 }],
  }),
  createRoom({
    platforms: [{ x: 4, y: 11, w: 4 }],
    dots: [{ x: 90, y: 140 }],
  }),
  createRoom({
    gaps: [{ start: 8, end: 10 }],
    spikes: [{ x: 12 * TILE, y: floorY - 8, w: 16, h: 8 }],
    dots: [{ x: 200, y: 180 }],
  }),
  createRoom({
    platforms: [{ x: 8, y: 9, w: 4, type: TILE_ONEWAY }],
    crystals: [{ x: 200, y: 120 }],
    dots: [{ x: 140, y: 90 }],
  }),
  createRoom({
    platforms: [{ x: 2, y: 12, w: 3 }],
    movingPlatforms: [
      { x: 80, y: 160, path: [{ x: 80, y: 160 }, { x: 200, y: 160 }], speed: 1.2 },
    ],
    dots: [{ x: 240, y: 150 }],
  }),
  createRoom({
    crumblingPlatforms: [{ x: 120, y: 176, delay: 0.3, respawn: 3.0 }],
    dots: [{ x: 140, y: 150 }],
  }),
  createRoom({
    platforms: [
      { x: 6, y: 10, w: 3 },
      { x: 12, y: 8, w: 3 },
    ],
    dots: [{ x: 220, y: 120 }],
  }),
  createRoom({
    gaps: [{ start: 4, end: 6 }, { start: 12, end: 14 }],
    dots: [{ x: 160, y: 180 }],
  }),
  createRoom({
    platforms: [{ x: 8, y: 11, w: 4 }],
    spikes: [{ x: 13 * TILE, y: floorY - 8, w: 16, h: 8 }],
    dots: [{ x: 180, y: 150 }],
  }),
  createRoom({
    movingPlatforms: [
      { x: 140, y: 180, path: [{ x: 140, y: 180 }, { x: 140, y: 120 }], speed: 1.0 },
    ],
    dots: [{ x: 140, y: 100 }],
  }),
  createRoom({
    platforms: [{ x: 3, y: 9, w: 4, type: TILE_ONEWAY }],
    spikes: [{ x: 4 * TILE, y: floorY - 8, w: 32, h: 8 }],
    dots: [{ x: 80, y: 120 }],
  }),
  createRoom({
    gaps: [{ start: 6, end: 9 }],
    platforms: [{ x: 12, y: 10, w: 4 }],
    dots: [{ x: 210, y: 130 }],
  }),
  createRoom({
    iceRanges: [{ start: 5, end: 14 }],
    dots: [{ x: 200, y: 180 }],
  }),
  createRoom({
    platforms: [{ x: 8, y: 10, w: 4 }],
    dots: [{ x: 160, y: 120 }],
  }),
  createRoom({
    crystals: [{ x: 260, y: 150 }],
    dots: [{ x: 260, y: 120 }],
  }),
];

window.LEVEL_01 = LEVEL_01;

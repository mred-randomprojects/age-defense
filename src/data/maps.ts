import { GridCoord, MapDefinition, TileType } from '../types/game';

function createEmptyGrid(cols: number, rows: number, defaultTile: TileType = 'grass'): TileType[][] {
  const grid: TileType[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowArr: TileType[] = [];
    for (let c = 0; c < cols; c++) {
      rowArr.push(defaultTile);
    }
    grid.push(rowArr);
  }
  return grid;
}

// Generates line segments between key waypoints to fill in path tiles
function interpolatePath(waypoints: GridCoord[]): GridCoord[] {
  const fullPath: GridCoord[] = [];
  if (waypoints.length === 0) return fullPath;

  fullPath.push(waypoints[0]);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    let currCol = start.col;
    let currRow = start.row;

    while (currCol !== end.col || currRow !== end.row) {
      if (currCol < end.col) currCol++;
      else if (currCol > end.col) currCol--;
      else if (currRow < end.row) currRow++;
      else if (currRow > end.row) currRow--;

      fullPath.push({ col: currCol, row: currRow });
    }
  }

  return fullPath;
}

// Map 1: The Winding River Valley
const MAP1_WAYPOINTS: GridCoord[] = [
  { col: 0, row: 2 },
  { col: 4, row: 2 },
  { col: 4, row: 6 },
  { col: 8, row: 6 },
  { col: 8, row: 2 },
  { col: 12, row: 2 },
  { col: 12, row: 8 },
  { col: 6, row: 8 },
  { col: 6, row: 10 },
  { col: 17, row: 10 },
];
const map1Path = interpolatePath(MAP1_WAYPOINTS);
const map1Tiles = createEmptyGrid(18, 11, 'grass');
for (const p of map1Path) {
  if (p.row >= 0 && p.row < 11 && p.col >= 0 && p.col < 18) {
    map1Tiles[p.row][p.col] = 'path';
  }
}
// Rocks / water decorative obstacles
map1Tiles[0][2] = 'rock';
map1Tiles[1][2] = 'rock';
map1Tiles[4][1] = 'water';
map1Tiles[4][2] = 'water';
map1Tiles[4][6] = 'rock';
map1Tiles[5][10] = 'water';
map1Tiles[5][11] = 'water';
map1Tiles[7][3] = 'rock';
map1Tiles[0][15] = 'rock';
map1Tiles[1][15] = 'rock';
map1Tiles[map1Path[0].row][map1Path[0].col] = 'spawner';
map1Tiles[map1Path[map1Path.length - 1].row][map1Path[map1Path.length - 1].col] = 'base';

// Map 2: The Twin Canyons
const MAP2_PATH_A_WAYPOINTS: GridCoord[] = [
  { col: 0, row: 1 },
  { col: 5, row: 1 },
  { col: 7, row: 4 },
  { col: 11, row: 4 },
  { col: 13, row: 5 },
  { col: 17, row: 5 },
];
const MAP2_PATH_B_WAYPOINTS: GridCoord[] = [
  { col: 0, row: 9 },
  { col: 5, row: 9 },
  { col: 7, row: 6 },
  { col: 11, row: 6 },
  { col: 13, row: 5 },
  { col: 17, row: 5 },
];
const map2PathA = interpolatePath(MAP2_PATH_A_WAYPOINTS);
const map2PathB = interpolatePath(MAP2_PATH_B_WAYPOINTS);
const map2Tiles = createEmptyGrid(18, 11, 'grass');
for (const p of map2PathA) {
  map2Tiles[p.row][p.col] = 'path';
}
for (const p of map2PathB) {
  map2Tiles[p.row][p.col] = 'path';
}
map2Tiles[map2PathA[0].row][map2PathA[0].col] = 'spawner';
map2Tiles[map2PathB[0].row][map2PathB[0].col] = 'spawner';
map2Tiles[5][17] = 'base';
// Rocks in middle canyon divider
for (let c = 2; c <= 8; c++) {
  map2Tiles[5][c] = 'rock';
}
map2Tiles[0][8] = 'water';
map2Tiles[1][8] = 'water';
map2Tiles[9][8] = 'water';
map2Tiles[10][8] = 'water';

// Map 3: The Chrono Spiral
const MAP3_WAYPOINTS: GridCoord[] = [
  { col: 0, row: 0 },
  { col: 16, row: 0 },
  { col: 16, row: 9 },
  { col: 2, row: 9 },
  { col: 2, row: 2 },
  { col: 13, row: 2 },
  { col: 13, row: 7 },
  { col: 5, row: 7 },
  { col: 5, row: 4 },
  { col: 9, row: 4 },
  { col: 9, row: 5 },
];
const map3Path = interpolatePath(MAP3_WAYPOINTS);
const map3Tiles = createEmptyGrid(18, 11, 'grass');
for (const p of map3Path) {
  map3Tiles[p.row][p.col] = 'path';
}
map3Tiles[map3Path[0].row][map3Path[0].col] = 'spawner';
map3Tiles[map3Path[map3Path.length - 1].row][map3Path[map3Path.length - 1].col] = 'base';
map3Tiles[10][0] = 'rock';
map3Tiles[10][1] = 'rock';
map3Tiles[10][16] = 'rock';
map3Tiles[10][17] = 'rock';
map3Tiles[0][17] = 'rock';

export const MAPS: MapDefinition[] = [
  {
    id: 'verdant_valley',
    name: 'Verdant Valley',
    description: 'Winding serpentine riverbed with choke pockets perfect for splash catapults and ballistas.',
    cols: 18,
    rows: 11,
    tiles: map1Tiles,
    paths: [map1Path],
  },
  {
    id: 'twin_canyons',
    name: 'Twin Canyons',
    description: 'Two separate invasion corridors converging into a fortified central gate.',
    cols: 18,
    rows: 11,
    tiles: map2Tiles,
    paths: [map2PathA, map2PathB],
  },
  {
    id: 'chrono_spiral',
    name: 'The Chrono Spiral',
    description: 'Concentric winding spiral maze granting central towers maximum time-on-target.',
    cols: 18,
    rows: 11,
    tiles: map3Tiles,
    paths: [map3Path],
  },
];

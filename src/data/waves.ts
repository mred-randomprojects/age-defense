import { WaveDefinition } from '../types/game';

export const WAVES: WaveDefinition[] = [
  // === STONE AGE (Waves 1 - 5) ===
  {
    waveNumber: 1,
    age: 'stone',
    bonusGold: 50,
    bonusScience: 25,
    spawns: [{ enemyId: 'cave_crawler', count: 8, intervalMs: 1400, pathIndex: 0 }],
  },
  {
    waveNumber: 2,
    age: 'stone',
    bonusGold: 60,
    bonusScience: 30,
    spawns: [
      { enemyId: 'cave_crawler', count: 8, intervalMs: 1100, pathIndex: 0 },
      { enemyId: 'clubber', count: 4, intervalMs: 1800, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 3,
    age: 'stone',
    bonusGold: 75,
    bonusScience: 35,
    spawns: [
      { enemyId: 'clubber', count: 8, intervalMs: 1400, pathIndex: 0 },
      { enemyId: 'saber_cat', count: 5, intervalMs: 1200, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 4,
    age: 'stone',
    bonusGold: 90,
    bonusScience: 45,
    spawns: [
      { enemyId: 'cave_crawler', count: 12, intervalMs: 800, pathIndex: 0 },
      { enemyId: 'saber_cat', count: 8, intervalMs: 1000, pathIndex: 0 },
      { enemyId: 'clubber', count: 6, intervalMs: 1400, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 5,
    age: 'stone',
    bonusGold: 180,
    bonusScience: 80,
    bossWave: true,
    spawns: [
      { enemyId: 'cave_crawler', count: 6, intervalMs: 1000, pathIndex: 0 },
      { enemyId: 'mammoth_boss', count: 1, intervalMs: 2500, pathIndex: 0 },
      { enemyId: 'clubber', count: 8, intervalMs: 1200, pathIndex: 0 },
    ],
  },

  // === MEDIEVAL AGE (Waves 6 - 11) ===
  {
    waveNumber: 6,
    age: 'medieval',
    bonusGold: 110,
    bonusScience: 55,
    spawns: [{ enemyId: 'peasant_mob', count: 14, intervalMs: 900, pathIndex: 0 }],
  },
  {
    waveNumber: 7,
    age: 'medieval',
    bonusGold: 130,
    bonusScience: 65,
    spawns: [
      { enemyId: 'peasant_mob', count: 10, intervalMs: 800, pathIndex: 0 },
      { enemyId: 'armored_knight', count: 6, intervalMs: 1600, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 8,
    age: 'medieval',
    bonusGold: 150,
    bonusScience: 75,
    spawns: [
      { enemyId: 'mounted_lancer', count: 8, intervalMs: 1100, pathIndex: 0 },
      { enemyId: 'armored_knight', count: 8, intervalMs: 1400, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 9,
    age: 'medieval',
    bonusGold: 175,
    bonusScience: 90,
    spawns: [
      { enemyId: 'peasant_mob', count: 18, intervalMs: 650, pathIndex: 0 },
      { enemyId: 'mounted_lancer', count: 10, intervalMs: 950, pathIndex: 0 },
      { enemyId: 'armored_knight', count: 8, intervalMs: 1300, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 10,
    age: 'medieval',
    bonusGold: 320,
    bonusScience: 160,
    bossWave: true,
    spawns: [
      { enemyId: 'mounted_lancer', count: 6, intervalMs: 1000, pathIndex: 0 },
      { enemyId: 'dragon_boss', count: 1, intervalMs: 3000, pathIndex: 0 },
      { enemyId: 'armored_knight', count: 10, intervalMs: 1200, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 11,
    age: 'medieval',
    bonusGold: 220,
    bonusScience: 110,
    spawns: [
      { enemyId: 'armored_knight', count: 14, intervalMs: 1100, pathIndex: 0 },
      { enemyId: 'mounted_lancer', count: 12, intervalMs: 850, pathIndex: 0 },
    ],
  },

  // === MODERN AGE (Waves 12 - 18) ===
  {
    waveNumber: 12,
    age: 'modern',
    bonusGold: 250,
    bonusScience: 125,
    spawns: [{ enemyId: 'commando', count: 16, intervalMs: 850, pathIndex: 0 }],
  },
  {
    waveNumber: 13,
    age: 'modern',
    bonusGold: 280,
    bonusScience: 140,
    spawns: [
      { enemyId: 'commando', count: 12, intervalMs: 750, pathIndex: 0 },
      { enemyId: 'humvee_scout', count: 8, intervalMs: 1200, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 14,
    age: 'modern',
    bonusGold: 320,
    bonusScience: 160,
    spawns: [
      { enemyId: 'humvee_scout', count: 10, intervalMs: 1000, pathIndex: 0 },
      { enemyId: 'heavy_panzer', count: 6, intervalMs: 2000, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 15,
    age: 'modern',
    bonusGold: 550,
    bonusScience: 280,
    bossWave: true,
    spawns: [
      { enemyId: 'commando', count: 10, intervalMs: 800, pathIndex: 0 },
      { enemyId: 'apocalypse_tank_boss', count: 1, intervalMs: 3500, pathIndex: 0 },
      { enemyId: 'heavy_panzer', count: 5, intervalMs: 1800, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 16,
    age: 'modern',
    bonusGold: 380,
    bonusScience: 190,
    spawns: [
      { enemyId: 'humvee_scout', count: 14, intervalMs: 850, pathIndex: 0 },
      { enemyId: 'heavy_panzer', count: 8, intervalMs: 1600, pathIndex: 0 },
      { enemyId: 'commando', count: 14, intervalMs: 650, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 17,
    age: 'modern',
    bonusGold: 440,
    bonusScience: 220,
    spawns: [
      { enemyId: 'heavy_panzer', count: 12, intervalMs: 1400, pathIndex: 0 },
      { enemyId: 'humvee_scout', count: 16, intervalMs: 750, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 18,
    age: 'modern',
    bonusGold: 500,
    bonusScience: 250,
    spawns: [
      { enemyId: 'commando', count: 20, intervalMs: 500, pathIndex: 0 },
      { enemyId: 'heavy_panzer', count: 10, intervalMs: 1300, pathIndex: 0 },
    ],
  },

  // === CYBER FUTURE (Waves 19 - 25) ===
  {
    waveNumber: 19,
    age: 'cyber',
    bonusGold: 550,
    bonusScience: 275,
    spawns: [{ enemyId: 'recon_drone', count: 18, intervalMs: 700, pathIndex: 0 }],
  },
  {
    waveNumber: 20,
    age: 'cyber',
    bonusGold: 620,
    bonusScience: 310,
    spawns: [
      { enemyId: 'recon_drone', count: 12, intervalMs: 600, pathIndex: 0 },
      { enemyId: 'plasma_cyborg', count: 10, intervalMs: 1200, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 21,
    age: 'cyber',
    bonusGold: 700,
    bonusScience: 350,
    spawns: [
      { enemyId: 'plasma_cyborg', count: 14, intervalMs: 1000, pathIndex: 0 },
      { enemyId: 'quad_mech', count: 6, intervalMs: 2200, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 22,
    age: 'cyber',
    bonusGold: 800,
    bonusScience: 400,
    spawns: [
      { enemyId: 'recon_drone', count: 20, intervalMs: 500, pathIndex: 0 },
      { enemyId: 'quad_mech', count: 8, intervalMs: 1800, pathIndex: 0 },
      { enemyId: 'plasma_cyborg', count: 14, intervalMs: 900, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 23,
    age: 'cyber',
    bonusGold: 920,
    bonusScience: 460,
    spawns: [
      { enemyId: 'quad_mech', count: 12, intervalMs: 1500, pathIndex: 0 },
      { enemyId: 'recon_drone', count: 16, intervalMs: 550, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 24,
    age: 'cyber',
    bonusGold: 1100,
    bonusScience: 550,
    spawns: [
      { enemyId: 'plasma_cyborg', count: 22, intervalMs: 700, pathIndex: 0 },
      { enemyId: 'quad_mech', count: 14, intervalMs: 1300, pathIndex: 0 },
    ],
  },
  {
    waveNumber: 25,
    age: 'cyber',
    bonusGold: 2500,
    bonusScience: 1000,
    bossWave: true,
    spawns: [
      { enemyId: 'recon_drone', count: 15, intervalMs: 600, pathIndex: 0 },
      { enemyId: 'leviathan_dreadnought', count: 1, intervalMs: 4000, pathIndex: 0 },
      { enemyId: 'quad_mech', count: 10, intervalMs: 1500, pathIndex: 0 },
    ],
  },
];

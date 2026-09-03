export type AgeId = 'stone' | 'medieval' | 'modern' | 'cyber';

export interface AgeDefinition {
  id: AgeId;
  name: string;
  themeColor: string;
  accentColor: string;
  borderColor: string;
  description: string;
  eraYear: string;
  costGold: number;
  costScience: number;
  abilityName: string;
  abilityDescription: string;
  abilityCooldownSec: number;
}

export type TileType = 'grass' | 'path' | 'water' | 'rock' | 'spawner' | 'base';

export interface GridCoord {
  col: number;
  row: number;
}

export interface Point {
  x: number;
  y: number;
}

export type TargetPriority = 'first' | 'last' | 'strongest' | 'weakest' | 'closest';

export type ProjectileType =
  | 'rock'
  | 'spear'
  | 'boulder'
  | 'fire_burst'
  | 'bolt'
  | 'ballista'
  | 'cannonball'
  | 'magic_spark'
  | 'bullet'
  | 'sniper_round'
  | 'missile'
  | 'tesla_bolt'
  | 'plasma_bolt'
  | 'railgun_slug'
  | 'singularity_core'
  | 'chrono_shock';

export interface TowerDefinition {
  id: string;
  name: string;
  age: AgeId;
  cost: number;
  baseDamage: number;
  baseRange: number; // in pixels
  baseFireRate: number; // attacks per second
  projectileSpeed: number; // pixels per second
  projectileType: ProjectileType;
  splashRadius: number; // 0 for single target
  slowDurationSec: number;
  slowMultiplier: number; // 0.7 = 30% slow
  pierceCount: number; // how many enemies it can hit
  criticalChance: number; // 0 to 1
  criticalMultiplier: number;
  color: string;
  accentColor: string;
  description: string;
  iconName: string;
  nextAgeEquivalentId?: string;
}

export interface TowerInstance {
  id: string;
  typeId: string;
  age: AgeId;
  col: number;
  row: number;
  x: number;
  y: number;
  level: number;
  damageLevel: number;
  rangeLevel: number;
  speedLevel: number;
  totalDamageDealt: number;
  totalKills: number;
  targetPriority: TargetPriority;
  lastShotTime: number; // timestamp ms
  angle: number; // radians
  totalInvested: number;
  beamActiveUntil?: number;
  beamTargetEnemyId?: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  age: AgeId;
  maxHealth: number;
  baseSpeed: number; // pixels per second
  armor: number; // flat damage reduction
  goldReward: number;
  scienceReward: number;
  radius: number;
  color: string;
  outlineColor: string;
  isBoss: boolean;
  shape: 'circle' | 'square' | 'triangle' | 'rhombus' | 'star';
  description: string;
}

export interface EnemyInstance {
  id: string;
  defId: string;
  name: string;
  x: number;
  y: number;
  currentHealth: number;
  maxHealth: number;
  baseSpeed: number;
  currentSpeed: number;
  armor: number;
  goldReward: number;
  scienceReward: number;
  radius: number;
  color: string;
  outlineColor: string;
  isBoss: boolean;
  shape: 'circle' | 'square' | 'triangle' | 'rhombus' | 'star';
  pathCoords: Point[];
  pathIndex: number;
  distanceTraveled: number;
  slowTimeRemaining: number;
  slowMultiplier: number;
  burnTimeRemaining: number;
  burnDps: number;
}

export interface ProjectileInstance {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetEnemyId: string | null;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  projectileType: ProjectileType;
  splashRadius: number;
  slowDurationSec: number;
  slowMultiplier: number;
  color: string;
  radius: number;
  pierceRemaining: number;
  piercedEnemyIds: string[];
  maxRange: number;
  distanceTraveled: number;
  critical: boolean;
}

export interface ParticleInstance {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  decay: number;
  color: string;
  size: number;
  shape: 'circle' | 'spark' | 'smoke' | 'ring' | 'shockwave';
}

export interface FloatingTextInstance {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  isCritical?: boolean;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  cols: number;
  rows: number;
  tiles: TileType[][];
  paths: GridCoord[][];
}

export interface WaveSpawnItem {
  enemyId: string;
  count: number;
  intervalMs: number;
  pathIndex: number;
}

export interface WaveDefinition {
  waveNumber: number;
  age: AgeId;
  spawns: WaveSpawnItem[];
  bonusGold: number;
  bonusScience: number;
  bossWave?: boolean;
}

export interface TechUpgrade {
  id: string;
  name: string;
  description: string;
  currentRank: number;
  maxRank: number;
  costScience: number;
  statMultiplier: number;
}

export interface GameStats {
  gold: number;
  science: number;
  lives: number;
  maxLives: number;
  score: number;
  currentWave: number;
  totalWaves: number;
  currentAge: AgeId;
  enemiesKilled: number;
  towersBuilt: number;
}

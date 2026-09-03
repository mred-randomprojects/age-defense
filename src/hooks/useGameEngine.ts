import { useRef, useCallback, useState } from 'react';
import {
  AgeId, EnemyInstance, FloatingTextInstance, GameStats,
  MapDefinition, ParticleInstance, Point, ProjectileInstance,
  TargetPriority, TechUpgrade, TowerInstance,
} from '../types/game';
import { AGES, getNextAge } from '../data/ages';
import { TOWERS } from '../data/towers';
import { ENEMIES } from '../data/enemies';
import { MAPS } from '../data/maps';
import { WAVES } from '../data/waves';
import { INITIAL_TECHS } from '../data/tech';
import { distXY, gridToPixel, pathToPixels, TILE_SIZE } from '../utils/gameMath';
import { sounds } from '../utils/audio';

let _idCounter = 0;
function uid(): string { return (++_idCounter).toString(36) + Math.random().toString(36).slice(2, 6); }

export interface UIState {
  gold: number;
  science: number;
  lives: number;
  maxLives: number;
  score: number;
  currentWave: number;
  totalWaves: number;
  currentAge: AgeId;
  selectedTowerId: string | null;
  isWaveActive: boolean;
  canAdvanceAge: boolean;
  advanceCostGold: number;
  advanceCostScience: number;
  enemiesRemaining: number;
  techs: TechUpgrade[];
  gameOver: boolean;
  won: boolean;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  abilityReady: boolean;
  mapName: string;
  towers: TowerInstance[];
}

interface SpawnTask {
  enemyId: string;
  countTotal: number;
  countSpawned: number;
  intervalMs: number;
  timer: number;
  pathIndex: number;
}

interface EngineState {
  map: MapDefinition;
  stats: GameStats;
  towers: TowerInstance[];
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  particles: ParticleInstance[];
  floatingTexts: FloatingTextInstance[];
  techs: TechUpgrade[];
  waveIndex: number;
  waveActive: boolean;
  waveCompleteTimer: number;
  spawnTasks: SpawnTask[];
  selectedTowerId: string | null;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  pathPixels: Point[][];
}

function initState(mapId: string): EngineState {
  const map = MAPS.find((m) => m.id === mapId) ?? MAPS[0];
  return {
    map,
    stats: {
      gold: 400,
      science: 0,
      lives: 20,
      maxLives: 20,
      score: 0,
      currentWave: 0,
      totalWaves: WAVES.length,
      currentAge: 'stone',
      enemiesKilled: 0,
      towersBuilt: 0,
    },
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    techs: INITIAL_TECHS.map((t) => ({ ...t })),
    waveIndex: -1,
    waveActive: false,
    waveCompleteTimer: 0,
    spawnTasks: [],
    selectedTowerId: null,
    abilityCooldown: 0,
    abilityMaxCooldown: AGES.stone.abilityCooldownSec,
    pathPixels: map.paths.map((p) => pathToPixels(p)),
  };
}

function createEnemy(defId: string, pathPixels: Point[][]): EnemyInstance | null {
  const def = ENEMIES[defId];
  if (!def) return null;
  const path = pathPixels[0];
  if (!path || path.length === 0) return null;
  const start = path[0];
  return {
    id: uid(),
    defId: def.id,
    name: def.name,
    x: start.x, y: start.y,
    currentHealth: def.maxHealth,
    maxHealth: def.maxHealth,
    baseSpeed: def.baseSpeed,
    currentSpeed: def.baseSpeed,
    armor: def.armor,
    goldReward: def.goldReward,
    scienceReward: def.scienceReward,
    radius: def.radius,
    color: def.color,
    outlineColor: def.outlineColor,
    isBoss: def.isBoss,
    shape: def.shape,
    pathCoords: path,
    pathIndex: 0,
    distanceTraveled: 0,
    slowTimeRemaining: 0,
    slowMultiplier: 1,
    burnTimeRemaining: 0,
    burnDps: 0,
  };
}

function spawnEnemy(state: EngineState, defId: string, pathIndex: number) {
  const path = state.pathPixels[pathIndex];
  if (!path || path.length === 0) return;
  const enemy = createEnemy(defId, [path]);
  if (enemy) state.enemies.push(enemy);
}

function getTechMultiplier(techs: TechUpgrade[], id: string): number {
  const t = techs.find((x) => x.id === id);
  if (!t) return 1;
  return 1 + t.currentRank * t.statMultiplier;
}

function getTowerDamage(t: TowerInstance, techs: TechUpgrade[]): number {
  const def = TOWERS[t.typeId];
  if (!def) return 0;
  const base = def.baseDamage * (1 + 0.25 * t.damageLevel);
  return base * getTechMultiplier(techs, 'tech_damage');
}
function getTowerRange(t: TowerInstance, techs: TechUpgrade[]): number {
  const def = TOWERS[t.typeId];
  if (!def) return 0;
  const base = def.baseRange * (1 + 0.25 * t.rangeLevel);
  return base * getTechMultiplier(techs, 'tech_range');
}
function getTowerFireRate(t: TowerInstance, techs: TechUpgrade[]): number {
  const def = TOWERS[t.typeId];
  if (!def) return 0;
  const base = def.baseFireRate * (1 + 0.25 * t.speedLevel);
  return base * getTechMultiplier(techs, 'tech_speed');
}

function findTarget(tower: TowerInstance, enemies: EnemyInstance[], range: number): EnemyInstance | null {
  const inRange = enemies.filter((e) => distXY(tower.x, tower.y, e.x, e.y) <= range);
  if (inRange.length === 0) return null;
  switch (tower.targetPriority) {
    case 'first': return inRange.sort((a, b) => b.distanceTraveled - a.distanceTraveled)[0];
    case 'last': return inRange.sort((a, b) => a.distanceTraveled - b.distanceTraveled)[0];
    case 'strongest': return inRange.sort((a, b) => b.maxHealth - a.maxHealth)[0];
    case 'weakest': return inRange.sort((a, b) => a.maxHealth - b.maxHealth)[0];
    case 'closest': default: return inRange.sort((a, b) => distXY(tower.x, tower.y, a.x, a.y) - distXY(tower.x, tower.y, b.x, b.y))[0];
  }
}

function addParticle(state: EngineState, x: number, y: number, color: string, count: number = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 1.5 + Math.random() * 2,
      color,
      size: 2 + Math.random() * 3,
      shape: Math.random() > 0.5 ? 'circle' : 'spark',
    });
  }
}

function addFloatingText(state: EngineState, text: string, x: number, y: number, color: string, isCrit?: boolean) {
  state.floatingTexts.push({ id: uid(), text, x, y, color, life: 1, maxLife: 1, isCritical: isCrit });
}

function getTileAt(state: EngineState, col: number, row: number): string {
  if (row < 0 || row >= state.map.rows || col < 0 || col >= state.map.cols) return 'void';
  return state.map.tiles[row][col];
}

function towerAt(state: EngineState, col: number, row: number): TowerInstance | null {
  return state.towers.find((t) => t.col === col && t.row === row) ?? null;
}

export function useGameEngine(mapId: string) {
  const stateRef = useRef<EngineState>(initState(mapId));
  const [ui, setUi] = useState<UIState>(buildUI(stateRef.current));
  const uiTimerRef = useRef<number>(0);

  const notifyUI = useCallback(() => {
    setUi(buildUI(stateRef.current));
  }, []);

  // Exposed actions
  const startNextWave = useCallback(() => {
    const s = stateRef.current;
    if (s.waveActive || s.waveIndex >= WAVES.length - 1 || s.stats.lives <= 0) return;
    s.waveIndex++;
    const wave = WAVES[s.waveIndex];
    s.stats.currentWave = wave.waveNumber;
    s.waveActive = true;
    s.spawnTasks = wave.spawns.map((sp) => ({
      enemyId: sp.enemyId,
      countTotal: sp.count,
      countSpawned: 0,
      intervalMs: sp.intervalMs,
      timer: 0,
      pathIndex: sp.pathIndex,
    }));
    sounds.playWaveStart();
    notifyUI();
  }, [notifyUI]);

  const buildTower = useCallback((typeId: string, col: number, row: number) => {
    const s = stateRef.current;
    const def = TOWERS[typeId];
    if (!def) return false;
    if (def.age !== s.stats.currentAge) return false;
    if (towerAt(s, col, row)) return false;
    const tile = getTileAt(s, col, row);
    if (tile !== 'grass') return false;
    if (s.stats.gold < def.cost) return false;
    s.stats.gold -= def.cost;
    const pos = gridToPixel(col, row);
    const t: TowerInstance = {
      id: uid(), typeId, age: def.age, col, row, x: pos.x, y: pos.y,
      level: 1, damageLevel: 0, rangeLevel: 0, speedLevel: 0,
      totalDamageDealt: 0, totalKills: 0,
      targetPriority: 'first', lastShotTime: 0, angle: 0,
      totalInvested: def.cost,
    };
    s.towers.push(t);
    s.stats.towersBuilt++;
    sounds.playUpgrade();
    addParticle(s, pos.x, pos.y, def.accentColor, 12);
    notifyUI();
    return true;
  }, [notifyUI]);

  const sellTower = useCallback((towerId: string) => {
    const s = stateRef.current;
    const idx = s.towers.findIndex((t) => t.id === towerId);
    if (idx === -1) return;
    const t = s.towers[idx];
    const refund = Math.floor(t.totalInvested * 0.7);
    s.stats.gold += refund;
    s.towers.splice(idx, 1);
    addParticle(s, t.x, t.y, '#fbbf24', 10);
    if (s.selectedTowerId === towerId) s.selectedTowerId = null;
    notifyUI();
  }, [notifyUI]);

  const upgradeTower = useCallback((towerId: string, stat: 'damage' | 'range' | 'speed') => {
    const s = stateRef.current;
    const t = s.towers.find((x) => x.id === towerId);
    if (!t) return false;
    const level = stat === 'damage' ? t.damageLevel : stat === 'range' ? t.rangeLevel : t.speedLevel;
    if (level >= 3) return false;
    const def = TOWERS[t.typeId];
    const cost = Math.floor(def.cost * (0.6 + level * 0.4));
    if (s.stats.gold < cost) return false;
    s.stats.gold -= cost;
    t.totalInvested += cost;
    if (stat === 'damage') t.damageLevel++;
    else if (stat === 'range') t.rangeLevel++;
    else t.speedLevel++;
    t.level++;
    sounds.playUpgrade();
    addParticle(s, t.x, t.y, '#22c55e', 10);
    notifyUI();
    return true;
  }, [notifyUI]);

  const advanceAge = useCallback(() => {
    const s = stateRef.current;
    const next = getNextAge(s.stats.currentAge);
    if (!next) return false;
    const ageDef = AGES[next];
    if (s.stats.gold < ageDef.costGold || s.stats.science < ageDef.costScience) return false;
    s.stats.gold -= ageDef.costGold;
    s.stats.science -= ageDef.costScience;
    s.stats.currentAge = next;
    s.abilityMaxCooldown = ageDef.abilityCooldownSec;
    s.abilityCooldown = 0;
    sounds.playAgeAdvance();
    addParticle(s, s.map.cols * TILE_SIZE / 2, s.map.rows * TILE_SIZE / 2, ageDef.accentColor, 40);
    notifyUI();
    return true;
  }, [notifyUI]);

  const useAbility = useCallback(() => {
    const s = stateRef.current;
    if (s.abilityCooldown > 0 || s.stats.lives <= 0) return;
    const age = s.stats.currentAge;
    const def = AGES[age];
    s.abilityCooldown = def.abilityCooldownSec;
    if (age === 'stone') {
      for (const e of s.enemies) {
        applyDamageToEnemy(s, e, 200, false, 'physical');
      }
      sounds.playExplosion();
      addParticle(s, s.map.cols * TILE_SIZE / 2, s.map.rows * TILE_SIZE / 2, '#a8a29e', 30);
    } else if (age === 'medieval') {
      for (const e of s.enemies) {
        applyDamageToEnemy(s, e, 380, false, 'magic');
        e.burnTimeRemaining = 5;
        e.burnDps = 35;
      }
      sounds.playExplosion();
      addParticle(s, s.map.cols * TILE_SIZE / 2, s.map.rows * TILE_SIZE / 2, '#f59e0b', 30);
    } else if (age === 'modern') {
      for (const e of s.enemies) {
        applyDamageToEnemy(s, e, 750, false, 'explosive');
        e.slowTimeRemaining = 3;
        e.slowMultiplier = 0.01; // effectively stun
      }
      sounds.playExplosion();
      addParticle(s, s.map.cols * TILE_SIZE / 2, s.map.rows * TILE_SIZE / 2, '#38bdf8', 30);
    } else if (age === 'cyber') {
      const target = s.enemies.sort((a, b) => b.maxHealth - a.maxHealth)[0];
      if (target) {
        applyDamageToEnemy(s, target, 1600, false, 'pure');
        sounds.playShoot('railgun_slug');
        addParticle(s, target.x, target.y, '#a855f7', 40);
      }
    }
    notifyUI();
  }, [notifyUI]);

  const selectTower = useCallback((towerId: string | null) => {
    stateRef.current.selectedTowerId = towerId;
    notifyUI();
  }, [notifyUI]);

  const buyTech = useCallback((techId: string) => {
    const s = stateRef.current;
    const tech = s.techs.find((t) => t.id === techId);
    if (!tech || tech.currentRank >= tech.maxRank) return false;
    const cost = tech.costScience * (tech.currentRank + 1);
    if (s.stats.science < cost) return false;
    s.stats.science -= cost;
    tech.currentRank++;
    sounds.playUpgrade();
    notifyUI();
    return true;
  }, [notifyUI]);

  const setTargetPriority = useCallback((towerId: string, priority: TargetPriority) => {
    const s = stateRef.current;
    const t = s.towers.find((x) => x.id === towerId);
    if (t) t.targetPriority = priority;
    notifyUI();
  }, [notifyUI]);

  const restart = useCallback(() => {
    stateRef.current = initState(mapId);
    _idCounter = 0;
    notifyUI();
  }, [mapId, notifyUI]);

  // Main update loop
  const update = useCallback((dt: number) => {
    const s = stateRef.current;
    if (s.stats.lives <= 0) return;

    // Wave spawning
    if (s.waveActive) {
      for (const task of s.spawnTasks) {
        task.timer -= dt;
        while (task.timer <= 0 && task.countSpawned < task.countTotal) {
          task.countSpawned++;
          spawnEnemy(s, task.enemyId, task.pathIndex);
          task.timer += task.intervalMs / 1000;
        }
      }
      s.spawnTasks = s.spawnTasks.filter((t) => t.countSpawned < t.countTotal);
      if (s.spawnTasks.length === 0 && s.enemies.length === 0) {
        s.waveActive = false;
        s.waveCompleteTimer = 2;
        const wave = WAVES[s.waveIndex];
        if (wave) {
          const bountyMult = getTechMultiplier(s.techs, 'tech_bounty');
          const interestMult = getTechMultiplier(s.techs, 'tech_interest');
          const bonus = Math.floor(wave.bonusGold * bountyMult);
          const interest = Math.floor(s.stats.gold * (interestMult - 1));
          s.stats.gold += bonus + interest;
          s.stats.science += wave.bonusScience;
          if (bonus > 0) sounds.playCoin();
        }
        if (s.waveIndex >= WAVES.length - 1) {
          s.stats.lives = s.stats.lives; // trigger win check below
        }
        notifyUI();
      }
    } else if (s.waveCompleteTimer > 0) {
      s.waveCompleteTimer -= dt;
    }

    // Win check
    if (!s.waveActive && s.waveIndex >= WAVES.length - 1 && s.enemies.length === 0 && s.stats.lives > 0) {
      // already won, keep state
    }

    // Ability cooldown
    if (s.abilityCooldown > 0) {
      s.abilityCooldown -= dt;
      uiTimerRef.current -= dt;
      if (uiTimerRef.current <= 0) {
        uiTimerRef.current = 0.2;
        notifyUI();
      }
    }

    // Update enemies
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];

      // Status effects
      if (e.slowTimeRemaining > 0) {
        e.slowTimeRemaining -= dt;
        if (e.slowTimeRemaining <= 0) { e.slowMultiplier = 1; e.currentSpeed = e.baseSpeed; }
        else e.currentSpeed = e.baseSpeed * e.slowMultiplier;
      }
      if (e.burnTimeRemaining > 0) {
        e.burnTimeRemaining -= dt;
        const burnDmg = e.burnDps * dt;
        e.currentHealth -= burnDmg;
        if (Math.random() < 0.15) addFloatingText(s, Math.floor(burnDmg).toString(), e.x, e.y - e.radius - 4, '#f97316');
      }

      // Movement
      if (e.pathIndex < e.pathCoords.length - 1) {
        const target = e.pathCoords[e.pathIndex + 1];
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const step = e.currentSpeed * dt;
        if (step >= d) {
          e.x = target.x;
          e.y = target.y;
          e.pathIndex++;
        } else {
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;
        }
        e.distanceTraveled += step;
      } else {
        // Reached base
        s.stats.lives -= e.isBoss ? 5 : 1;
        s.stats.lives = Math.max(0, s.stats.lives);
        s.enemies.splice(i, 1);
        sounds.playLifeLost();
        addParticle(s, e.x, e.y, '#ef4444', 8);
        if (s.stats.lives <= 0) {
          notifyUI();
          return;
        }
        continue;
      }

      if (e.currentHealth <= 0) {
        s.stats.gold += Math.floor(e.goldReward * getTechMultiplier(s.techs, 'tech_bounty'));
        s.stats.science += e.scienceReward;
        s.stats.score += e.isBoss ? e.goldReward * 10 : e.goldReward * 2;
        s.stats.enemiesKilled++;
        sounds.playEnemyDeath(e.isBoss);
        addParticle(s, e.x, e.y, e.color, e.isBoss ? 20 : 10);
        s.enemies.splice(i, 1);
        notifyUI();
        continue;
      }
    }

    // Tower targeting & firing
    const now = performance.now();
    for (const t of s.towers) {
      const def = TOWERS[t.typeId];
      if (!def) continue;
      const fireRate = getTowerFireRate(t, s.techs);
      const cooldownMs = 1000 / fireRate;
      if (now - t.lastShotTime < cooldownMs) continue;

      const range = getTowerRange(t, s.techs);
      const target = findTarget(t, s.enemies, range);
      if (target) {
        t.lastShotTime = now;
        const dx = target.x - t.x;
        const dy = target.y - t.y;
        t.angle = Math.atan2(dy, dx);
        const dmg = getTowerDamage(t, s.techs);
        const isCrit = Math.random() < def.criticalChance;
        const finalDmg = isCrit ? dmg * def.criticalMultiplier : dmg;

        const proj: ProjectileInstance = {
          id: uid(),
          x: t.x, y: t.y,
          startX: t.x, startY: t.y,
          targetEnemyId: target.id,
          targetX: target.x, targetY: target.y,
          speed: def.projectileSpeed,
          damage: finalDmg,
          projectileType: def.projectileType,
          splashRadius: def.splashRadius,
          slowDurationSec: def.slowDurationSec,
          slowMultiplier: def.slowMultiplier,
          color: def.accentColor,
          radius: def.splashRadius > 0 ? 5 : 3,
          pierceRemaining: def.pierceCount,
          piercedEnemyIds: [],
          maxRange: range * 1.5,
          distanceTraveled: 0,
          critical: isCrit,
        };
        s.projectiles.push(proj);
        sounds.playShoot(def.projectileType);
      }
    }

    // Update projectiles
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i];
      let tx = p.targetX;
      let ty = p.targetY;
      const targetEnemy = p.targetEnemyId ? s.enemies.find((e) => e.id === p.targetEnemyId) : null;
      if (targetEnemy) { tx = targetEnemy.x; ty = targetEnemy.y; }

      const dx = tx - p.x;
      const dy = ty - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * dt;

      if (step >= d || d < 8) {
        // Hit or reached destination
        if (targetEnemy && distXY(p.x, p.y, targetEnemy.x, targetEnemy.y) < 16) {
          applyProjectileHit(s, p, targetEnemy);
        } else {
          // Splash at destination anyway if splash radius > 0
          if (p.splashRadius > 0) {
            for (const e of s.enemies) {
              if (distXY(p.x, p.y, e.x, e.y) <= p.splashRadius) {
                applyDamageToEnemy(s, e, p.damage, p.critical, 'explosive');
                applySlow(e, p.slowDurationSec, p.slowMultiplier);
              }
            }
            addParticle(s, p.x, p.y, p.color, 12);
          }
        }
        s.projectiles.splice(i, 1);
        continue;
      }

      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      p.distanceTraveled += step;
      if (p.distanceTraveled >= p.maxRange) {
        s.projectiles.splice(i, 1);
        continue;
      }

      // Piercing collision check along trajectory
      for (const e of s.enemies) {
        if (p.piercedEnemyIds.includes(e.id)) continue;
        if (distXY(p.x, p.y, e.x, e.y) <= e.radius + 6) {
          applyProjectileHit(s, p, e);
          if (p.pierceRemaining <= 0) {
            s.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const pt = s.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= pt.decay * dt;
      if (pt.life <= 0) s.particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      const ft = s.floatingTexts[i];
      ft.y -= 30 * dt;
      ft.life -= dt * 1.5;
      if (ft.life <= 0) s.floatingTexts.splice(i, 1);
    }

    // Periodic UI sync for non-critical data
    uiTimerRef.current -= dt;
    if (uiTimerRef.current <= 0) {
      uiTimerRef.current = 0.25;
      notifyUI();
    }
  }, [notifyUI]);

  return {
    stateRef,
    ui,
    update,
    startNextWave,
    buildTower,
    sellTower,
    upgradeTower,
    advanceAge,
    useAbility,
    selectTower,
    buyTech,
    setTargetPriority,
    restart,
  };
}

function applyProjectileHit(s: EngineState, p: ProjectileInstance, e: EnemyInstance) {
  applyDamageToEnemy(s, e, p.damage, p.critical, 'physical');
  applySlow(e, p.slowDurationSec, p.slowMultiplier);
  p.piercedEnemyIds.push(e.id);
  p.pierceRemaining--;
  if (p.splashRadius > 0) {
    for (const other of s.enemies) {
      if (other.id === e.id) continue;
      if (distXY(e.x, e.y, other.x, other.y) <= p.splashRadius) {
        applyDamageToEnemy(s, other, p.damage * 0.5, false, 'explosive');
        applySlow(other, p.slowDurationSec, p.slowMultiplier);
      }
    }
    addParticle(s, e.x, e.y, p.color, 8);
  }
}

function applySlow(e: EnemyInstance, duration: number, multiplier: number) {
  if (duration <= 0) return;
  if (multiplier < e.slowMultiplier) {
    e.slowMultiplier = multiplier;
    e.slowTimeRemaining = duration;
  }
}

function applyDamageToEnemy(s: EngineState, e: EnemyInstance, rawDmg: number, isCrit: boolean, _type: string) {
  const dmg = Math.max(1, rawDmg - e.armor);
  e.currentHealth -= dmg;
  addFloatingText(s, Math.floor(dmg).toString(), e.x + (Math.random() - 0.5) * 10, e.y - e.radius - 6, isCrit ? '#f43f5e' : '#ffffff', isCrit);
  if (e.currentHealth <= 0) {
    // Enemy death handled in main loop
  }
}

function buildUI(s: EngineState): UIState {
  const next = getNextAge(s.stats.currentAge);
  const ageDef = next ? AGES[next] : null;
  return {
    gold: Math.floor(s.stats.gold),
    science: s.stats.science,
    lives: s.stats.lives,
    maxLives: s.stats.maxLives,
    score: s.stats.score,
    currentWave: s.stats.currentWave,
    totalWaves: s.stats.totalWaves,
    currentAge: s.stats.currentAge,
    selectedTowerId: s.selectedTowerId,
    isWaveActive: s.waveActive,
    canAdvanceAge: !!next && s.stats.gold >= (ageDef?.costGold ?? Infinity) && s.stats.science >= (ageDef?.costScience ?? Infinity),
    advanceCostGold: ageDef?.costGold ?? 0,
    advanceCostScience: ageDef?.costScience ?? 0,
    enemiesRemaining: s.enemies.length,
    techs: s.techs,
    gameOver: s.stats.lives <= 0,
    won: s.stats.lives > 0 && !s.waveActive && s.waveIndex >= WAVES.length - 1 && s.enemies.length === 0,
    abilityCooldown: Math.max(0, s.abilityCooldown),
    abilityMaxCooldown: s.abilityMaxCooldown,
    abilityReady: s.abilityCooldown <= 0 && s.stats.lives > 0,
    mapName: s.map.name,
    towers: s.towers,
  };
}

import { describe, expect, it } from 'vitest';
import { AGE_ORDER, AGES, getNextAge } from './ages';
import { ENEMIES } from './enemies';
import { MAPS } from './maps';
import { INITIAL_TECHS } from './tech';
import { TOWERS } from './towers';
import { WAVES } from './waves';

describe('waves', () => {
  it('are numbered 1..N in order', () => {
    expect(WAVES.length).toBeGreaterThan(0);
    WAVES.forEach((wave, i) => expect(wave.waveNumber).toBe(i + 1));
  });

  it('only spawn enemies that exist, in positive counts and intervals', () => {
    for (const wave of WAVES) {
      expect(wave.spawns.length, `wave ${wave.waveNumber}`).toBeGreaterThan(0);
      for (const spawn of wave.spawns) {
        expect(ENEMIES[spawn.enemyId], `wave ${wave.waveNumber}: ${spawn.enemyId}`).toBeDefined();
        expect(spawn.count).toBeGreaterThan(0);
        expect(spawn.intervalMs).toBeGreaterThan(0);
        expect(spawn.pathIndex).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('enemies', () => {
  it('are keyed by their own id and can be killed and can move', () => {
    for (const [key, enemy] of Object.entries(ENEMIES)) {
      expect(enemy.id).toBe(key);
      expect(enemy.maxHealth, key).toBeGreaterThan(0);
      expect(enemy.baseSpeed, key).toBeGreaterThan(0);
      expect(enemy.armor, key).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('towers', () => {
  it('are keyed by their own id and have usable stats', () => {
    for (const [key, tower] of Object.entries(TOWERS)) {
      expect(tower.id).toBe(key);
      expect(AGES[tower.age], key).toBeDefined();
      expect(tower.cost, key).toBeGreaterThan(0);
      expect(tower.baseDamage, key).toBeGreaterThan(0);
      expect(tower.baseRange, key).toBeGreaterThan(0);
      expect(tower.baseFireRate, key).toBeGreaterThan(0);
      expect(tower.projectileSpeed, key).toBeGreaterThan(0);
      expect(tower.pierceCount, key).toBeGreaterThanOrEqual(1);
      expect(tower.criticalChance, key).toBeGreaterThanOrEqual(0);
      expect(tower.criticalChance, key).toBeLessThanOrEqual(1);
    }
  });

  it('modernize into a tower of the next age', () => {
    for (const tower of Object.values(TOWERS)) {
      if (!tower.nextAgeEquivalentId) continue;
      const next = TOWERS[tower.nextAgeEquivalentId];
      expect(next, `${tower.id} → ${tower.nextAgeEquivalentId}`).toBeDefined();
      expect(next.age).toBe(getNextAge(tower.age));
    }
  });

  it('can be built in every age', () => {
    for (const age of AGE_ORDER) {
      expect(Object.values(TOWERS).some((t) => t.age === age), age).toBe(true);
    }
  });
});

describe('maps', () => {
  it('have unique ids', () => {
    const ids = MAPS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('are 18×11, the size GameCanvas draws', () => {
    for (const map of MAPS) {
      expect([map.cols, map.rows], map.id).toEqual([18, 11]);
      expect(map.tiles.length, map.id).toBe(map.rows);
      for (const row of map.tiles) expect(row.length, map.id).toBe(map.cols);
    }
  });

  it('have paths that run over path tiles from a spawner to the base', () => {
    for (const map of MAPS) {
      expect(map.paths.length, map.id).toBeGreaterThan(0);
      for (const path of map.paths) {
        expect(path.length, map.id).toBeGreaterThan(1);
        expect(map.tiles[path[0].row][path[0].col], map.id).toBe('spawner');
        const end = path[path.length - 1];
        expect(map.tiles[end.row][end.col], map.id).toBe('base');
        for (const step of path) {
          expect(['path', 'spawner', 'base'], `${map.id} (${step.col},${step.row})`).toContain(
            map.tiles[step.row]?.[step.col],
          );
        }
      }
    }
  });
});

describe('techs and ages', () => {
  it('include every tech the engine looks up by id', () => {
    const ids = INITIAL_TECHS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['tech_damage', 'tech_range', 'tech_speed', 'tech_bounty', 'tech_interest']) {
      expect(ids).toContain(id);
    }
  });

  it('chain stone → medieval → modern → cyber', () => {
    expect(AGE_ORDER).toEqual(['stone', 'medieval', 'modern', 'cyber']);
    for (const age of AGE_ORDER) {
      expect(AGES[age].id).toBe(age);
      expect(AGES[age].abilityCooldownSec, age).toBeGreaterThan(0);
    }
  });
});

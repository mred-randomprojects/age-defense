import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock, installTestEnvironment, mountEngine, placeDummy, runFrames } from '../test/engineHarness';
import { AGES } from '../data/ages';
import { TOWERS } from '../data/towers';
import { WAVES } from '../data/waves';
import { AgeId } from '../types/game';

vi.mock('react', () => import('../test/fakeReact'));

// A grass tile on Verdant Valley whose range covers the first stretch of path.
const SLING_SPOT = { col: 2, row: 3 };

beforeEach(() => {
  installTestEnvironment();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('a new run', () => {
  it('starts on the chosen map with the difficulty’s gold and lives', () => {
    const engine = mountEngine('chrono_spiral', 'easy');
    const s = engine.stateRef.current;
    expect(s.map.id).toBe('chrono_spiral');
    expect(s.stats.gold).toBe(500);
    expect(s.stats.lives).toBe(25);
    expect(s.waveIndex).toBe(-1);
  });

  it('kills the first enemies with a tower placed by the path', () => {
    const engine = mountEngine();
    expect(engine.buildTower('stone_sling', SLING_SPOT.col, SLING_SPOT.row)).toBe(true);
    engine.startNextWave();
    runFrames(engine, 8);
    expect(engine.stateRef.current.stats.enemiesKilled).toBeGreaterThan(0);
  });
});

describe('advancing an era', () => {
  it('charges each advance the price listed on the era being left, Stone through Cyber', () => {
    const engine = mountEngine();
    const s = engine.stateRef.current;
    const paid: [AgeId, number, number][] = [];
    for (let i = 0; i < 3; i++) {
      s.stats.gold = 1e5;
      s.stats.science = 1e5;
      const from = s.stats.currentAge;
      expect(engine.advanceAge()).toBe(true);
      paid.push([from, 1e5 - s.stats.gold, 1e5 - s.stats.science]);
    }
    expect(s.stats.currentAge).toBe('cyber');
    expect(paid).toEqual(
      (['stone', 'medieval', 'modern'] as const).map((age) => [age, AGES[age].costGold, AGES[age].costScience]),
    );
    for (const [age, gold, science] of paid) {
      expect(gold, age).toBeGreaterThan(0);
      expect(science, age).toBeGreaterThan(0);
    }
    expect(engine.advanceAge()).toBe(false); // the final era
  });

  it('does not give the Cyber Future away', () => {
    const engine = mountEngine();
    const s = engine.stateRef.current;
    s.stats.currentAge = 'modern';
    s.stats.gold = 0;
    s.stats.science = 0;
    expect(engine.advanceAge()).toBe(false);
    s.stats.gold = AGES.modern.costGold - 1;
    s.stats.science = 1e5;
    expect(engine.advanceAge()).toBe(false);
    s.stats.gold = 1e5;
    s.stats.science = AGES.modern.costScience - 1;
    expect(engine.advanceAge()).toBe(false);
    expect(s.stats.currentAge).toBe('modern');
  });

  it('shows the price it will charge', () => {
    const { ui } = mountEngine();
    expect([ui.advanceCostGold, ui.advanceCostScience]).toEqual([AGES.stone.costGold, AGES.stone.costScience]);
  });
});

describe('save and resume', () => {
  it('brings back the map, difficulty, towers and resources', () => {
    const before = mountEngine();
    before.restart('hard', 'twin_canyons');
    expect(before.buildTower('stone_sling', 3, 2)).toBe(true);
    const saved = before.stateRef.current;
    before.save();

    const after = mountEngine();
    expect(after.hasSave()).toBe(true);
    expect(after.loadSave()).toBe(true);
    const s = after.stateRef.current;
    expect(s.map.id).toBe('twin_canyons');
    expect(s.difficulty).toBe('hard');
    expect(s.towers.map((t) => [t.typeId, t.col, t.row])).toEqual([['stone_sling', 3, 2]]);
    expect(s.stats.gold).toBe(saved.stats.gold);
  });

  it('restored towers fire within 1 s, even when the run was saved late in a long session', () => {
    // The first page has been open for 20 minutes when the run is saved.
    clock.now = 20 * 60 * 1000;
    const before = mountEngine();
    expect(before.buildTower('stone_sling', SLING_SPOT.col, SLING_SPOT.row)).toBe(true);
    before.startNextWave();
    runFrames(before, 3);
    expect(before.stateRef.current.enemies.length).toBeGreaterThan(0);
    before.save();

    // Reload: the new page's clock starts near zero.
    clock.now = 3000;
    const after = mountEngine();
    expect(after.loadSave()).toBe(true);
    const shots = vi.spyOn(after.stateRef.current.projectiles, 'push');
    runFrames(after, 1);
    expect(shots).toHaveBeenCalled();
  });

  it('Retry after resuming restarts the resumed map, not the first one', () => {
    const before = mountEngine();
    before.restart('normal', 'twin_canyons');
    before.save();

    // App mounts the engine with the first map selected.
    const after = mountEngine('verdant_valley');
    expect(after.loadSave()).toBe(true);
    after.restart();
    expect(after.stateRef.current.map.id).toBe('twin_canyons');
  });

  it('summarises the saved run, for the question before a new run replaces it', () => {
    const engine = mountEngine();
    expect(engine.getSaveSummary()).toBeNull();
    engine.restart('hard', 'twin_canyons');
    engine.startNextWave(); // saves the run
    expect(engine.getSaveSummary()).toEqual({
      mapName: 'Twin Canyons',
      difficulty: 'hard',
      wave: 1,
      totalWaves: WAVES.length,
    });
  });

  it('has no summary for a save it cannot read, which still counts as a save', () => {
    localStorage.setItem('age-defense-save-v1', '{"mapId":');
    const engine = mountEngine();
    expect(engine.hasSave()).toBe(true);
    expect(engine.getSaveSummary()).toBeNull();
  });

  it('auto-start keeps starting waves after resuming between waves', () => {
    const before = mountEngine();
    before.toggleAutoStart(); // saves the run
    expect(before.stateRef.current.autoStart).toBe(true);

    const after = mountEngine();
    expect(after.loadSave()).toBe(true);
    runFrames(after, 5);
    expect(after.stateRef.current.waveIndex).toBe(0);
  });
});

describe('saving', () => {
  const SAVE_KEY = 'age-defense-save-v1';
  const SCORES_KEY = 'age-defense-scores-v1';

  it('reports whether the write landed', () => {
    const engine = mountEngine();
    expect(engine.save()).toBe(true);
    expect(engine.hasSave()).toBe(true);

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    expect(engine.save()).toBe(false);
  });

  it('a won run records its score once, drops the save and stops saving', () => {
    const engine = mountEngine('twin_canyons');
    engine.save();
    // Every wave fought and nothing left on the field.
    const s = engine.stateRef.current;
    s.waveIndex = WAVES.length - 1;
    s.stats.currentWave = WAVES.length;
    s.stats.score = 1234;
    const writes = vi.spyOn(localStorage, 'setItem');

    runFrames(engine, 2);

    const keysWritten = writes.mock.calls.map(([key]) => key);
    expect(keysWritten.filter((k) => k === SCORES_KEY)).toHaveLength(1);
    expect(keysWritten.filter((k) => k === SAVE_KEY)).toHaveLength(0);
    expect(engine.hasSave()).toBe(false);
    expect(engine.getScores().twin_canyons).toEqual({ bestWave: WAVES.length, bestScore: 1234, difficulty: 'normal' });

    // ⌘S on the Victory panel does not bring the finished run back.
    engine.save();
    expect(engine.hasSave()).toBe(false);
  });

  it('a lost run records its score and drops the save', () => {
    const engine = mountEngine();
    engine.startNextWave(); // saves the run
    runFrames(engine, 0.1);
    const s = engine.stateRef.current;
    expect(s.enemies.length).toBeGreaterThan(0);
    s.stats.lives = 1;
    s.stats.score = 99;
    const intruder = s.enemies[0];
    intruder.pathIndex = intruder.pathCoords.length - 1; // at the gate

    runFrames(engine, 0.1);

    expect(s.stats.lives).toBe(0);
    expect(engine.hasSave()).toBe(false);
    expect(engine.getScores().verdant_valley?.bestScore).toBe(99);
  });
});

describe('an enemy at the base', () => {
  /** The first enemy of wave 1, put on the base tile with `health` left. */
  function enemyAtTheBase(health: number) {
    const engine = mountEngine();
    engine.startNextWave();
    runFrames(engine, 0.1);
    const s = engine.stateRef.current;
    const enemy = s.enemies[0];
    enemy.pathIndex = enemy.pathCoords.length - 1;
    enemy.currentHealth = health;
    const before = { lives: s.stats.lives, gold: s.stats.gold, kills: s.stats.enemiesKilled };
    return { engine, s, enemy, before };
  }

  it('killed on the frame it stepped onto the base counts as a kill, not a leak', () => {
    // A shot landed later in the frame in which it reached the last waypoint.
    const { engine, s, enemy, before } = enemyAtTheBase(0);
    engine.update(1 / 60);
    expect(s.enemies).not.toContain(enemy);
    expect(s.stats.lives).toBe(before.lives);
    expect(s.stats.enemiesKilled).toBe(before.kills + 1);
    expect(s.stats.gold).toBe(before.gold + enemy.goldReward);
  });

  it('burned to death there counts as a kill too', () => {
    const { engine, s, enemy, before } = enemyAtTheBase(1);
    enemy.burnTimeRemaining = 1;
    enemy.burnDps = 1000;
    engine.update(1 / 60);
    expect(s.enemies).not.toContain(enemy);
    expect(s.stats.lives).toBe(before.lives);
    expect(s.stats.enemiesKilled).toBe(before.kills + 1);
  });

  it('still alive there costs a life and pays nothing', () => {
    const { engine, s, enemy, before } = enemyAtTheBase(10);
    engine.update(1 / 60);
    expect(s.enemies).not.toContain(enemy);
    expect(s.stats.lives).toBe(before.lives - 1);
    expect(s.stats.enemiesKilled).toBe(before.kills);
    expect(s.stats.gold).toBe(before.gold);
  });
});

describe('game speed', () => {
  // A grass tile on Verdant Valley with open ground to its right.
  const SPOT = { col: 10, row: 4 };

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no critical hits
  });

  /** One tower against one stationary target for `simSeconds` of game time. */
  function duel(typeId: string, distance: number, speed: number, simSeconds: number, fps = 60) {
    const engine = mountEngine();
    const s = engine.stateRef.current;
    s.stats.gold = 1e9;
    s.stats.currentAge = TOWERS[typeId].age;
    expect(engine.buildTower(typeId, SPOT.col, SPOT.row)).toBe(true);
    const tower = s.towers[0];
    const target = placeDummy(engine, tower.x + distance, tower.y);
    const shots = vi.spyOn(s.projectiles, 'push');
    engine.setSpeed(speed);
    runFrames(engine, simSeconds / speed, fps);
    return { damage: target.maxHealth - target.currentHealth, shots: shots.mock.calls.length };
  }

  // Single-target towers only: piercing shots hit their target twice at 1×
  // (an open balance question), which no speed fix should hide.
  const cases: [typeId: string, distance: number][] = [
    ['stone_sling', 30],
    ['stone_sling', 60],
    ['stone_sling', 100],
    ['stone_catapult', 90],
    ['gatling_bunker', 40],
    ['gatling_bunker', 120],
  ];

  it.each(cases)('%s at %i px deals the same damage at 10× as at 1×', (typeId, distance) => {
    // Long enough for 50 shots, so a shot still in flight at the end is noise.
    const simSeconds = Math.max(10, 50 / TOWERS[typeId].baseFireRate);
    const normal = duel(typeId, distance, 1, simSeconds).damage;
    const fast = duel(typeId, distance, 10, simSeconds).damage;
    expect(normal).toBeGreaterThan(0);
    expect(Math.abs(fast - normal) / normal).toBeLessThan(0.05);
  });

  it('a slow frame rate does not cost damage either', () => {
    const smooth = duel('gatling_bunker', 40, 1, 10, 60).damage;
    const choppy = duel('gatling_bunker', 40, 1, 10, 20).damage; // the canvas caps dt at 0.05 s
    expect(Math.abs(choppy - smooth) / smooth).toBeLessThan(0.05);
  });

  it('towers fire the same number of shots per simulated second at every speed', () => {
    const simSeconds = 30;
    const expected = simSeconds * TOWERS.stone_sling.baseFireRate;
    for (const speed of [1, 2, 3, 5, 10]) {
      const { shots } = duel('stone_sling', 60, speed, simSeconds);
      expect(Math.abs(shots - expected), `${speed}×: ${shots} shots`).toBeLessThanOrEqual(1.5);
    }
  });

  it('enemies walk the path in the same simulated time at every speed', () => {
    function secondsToReachTheBase(speed: number): number {
      const engine = mountEngine('chrono_spiral');
      const s = engine.stateRef.current;
      engine.setSpeed(speed);
      engine.startNextWave();
      let simSeconds = 0;
      while (s.stats.lives === s.stats.maxLives) {
        runFrames(engine, 1 / 60);
        simSeconds += speed / 60;
        if (simSeconds > 600) throw new Error('nobody reached the base');
      }
      return simSeconds;
    }
    const normal = secondsToReachTheBase(1);
    const fast = secondsToReachTheBase(10);
    expect(Math.abs(fast - normal)).toBeLessThan(0.5);
  });
});

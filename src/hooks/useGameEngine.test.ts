import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clock, installTestEnvironment, mountEngine, runFrames } from '../test/engineHarness';

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

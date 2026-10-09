import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTestEnvironment, mountEngine, runFrames } from '../test/engineHarness';

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
});

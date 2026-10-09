import { vi } from 'vitest';
import { useGameEngine } from '../hooks/useGameEngine';
import { sounds } from '../utils/audio';
import { Difficulty, EnemyInstance } from '../types/game';

// Runs the real game engine headless. A test file using it must first replace
// React, since the engine is a hook:
//
//   vi.mock('react', () => import('../test/fakeReact'));

export type Engine = ReturnType<typeof useGameEngine>;

/** The page's clock, in ms since it loaded, as `performance.now()` reports it. */
export const clock = { now: 0 };

/** A localStorage that lives in a Map. */
export function createMemoryStorage() {
  const data = new Map<string, string>();
  return {
    get length(): number {
      return data.size;
    },
    key: (index: number): string | null => [...data.keys()][index] ?? null,
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      data.set(key, String(value));
    },
    removeItem: (key: string): void => {
      data.delete(key);
    },
    clear: (): void => {
      data.clear();
    },
  };
}

export type MemoryStorage = ReturnType<typeof createMemoryStorage>;

/**
 * Empty storage, a fake clock at 0 and no sound. Undo it in `afterEach` with
 * `vi.restoreAllMocks()` and `vi.unstubAllGlobals()`.
 */
export function installTestEnvironment(): MemoryStorage {
  const storage = createMemoryStorage();
  vi.stubGlobal('localStorage', storage);
  clock.now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock.now);
  sounds.setMuted(true);
  return storage;
}

/** A freshly loaded page: the hook called once, as App's first render does. */
export function mountEngine(mapId = 'verdant_valley', difficulty: Difficulty = 'normal'): Engine {
  return useGameEngine(mapId, difficulty);
}

/**
 * Drive the engine the way the canvas loop does for `seconds` of real time:
 * one `update(dt)` per frame, with the clock moving along. The game speed set
 * through `engine.setSpeed` multiplies it into simulated time.
 */
export function runFrames(engine: Engine, seconds: number, fps = 60): void {
  const frames = Math.round(seconds * fps);
  const dt = 1 / fps;
  for (let i = 0; i < frames; i++) {
    clock.now += dt * 1000;
    engine.update(dt);
  }
}

/** A target that stands still at (x, y), has no armor and never dies. */
export function placeDummy(engine: Engine, x: number, y: number): EnemyInstance {
  const dummy: EnemyInstance = {
    id: 'dummy',
    defId: 'cave_crawler',
    name: 'Training dummy',
    x,
    y,
    currentHealth: 1e9,
    maxHealth: 1e9,
    baseSpeed: 0,
    currentSpeed: 0,
    armor: 0,
    goldReward: 0,
    scienceReward: 0,
    radius: 12,
    color: '#ffffff',
    outlineColor: '#000000',
    isBoss: false,
    shape: 'circle',
    // Two points, so it never counts as having reached the base.
    pathCoords: [{ x, y }, { x: x + 1, y }],
    pathIndex: 0,
    distanceTraveled: 0,
    slowTimeRemaining: 0,
    slowMultiplier: 1,
    burnTimeRemaining: 0,
    burnDps: 0,
  };
  engine.stateRef.current.enemies.push(dummy);
  return dummy;
}

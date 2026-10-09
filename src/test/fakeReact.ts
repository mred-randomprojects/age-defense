/**
 * Just enough of React to call `useGameEngine` once, outside a component:
 *
 *   vi.mock('react', () => import('../test/fakeReact'));
 *
 * A ref is a plain box and a callback is the function itself, so everything
 * the hook returns keeps working for the whole test. State updates are
 * dropped: tests read the engine through `stateRef`, not through `ui`.
 */

export function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

export function useState<T>(initial: T): [T, (next: T) => void] {
  return [initial, () => {}];
}

export function useCallback<T>(fn: T): T {
  return fn;
}

export function useMemo<T>(factory: () => T): T {
  return factory();
}

export function useEffect(): void {}

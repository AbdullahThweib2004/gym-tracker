import { theme } from './tokens';

export * from './tokens';
export { useReduceMotion } from './useReduceMotion';

/**
 * The app ships a single dark theme. Components read tokens through this hook so a light theme
 * can be added later without touching call sites.
 */
export function useTheme() {
  return theme;
}

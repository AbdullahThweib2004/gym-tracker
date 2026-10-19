import { Platform } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';

import { motion } from './tokens';
import { useReduceMotion } from './useReduceMotion';

/**
 * Smoothly moves items when a list changes. Off with Reduce Motion, and off on web, where
 * Reanimated animates layout by scaling the content (stretched text) instead of resizing it.
 */
export function useLayoutTransition() {
  const reduceMotion = useReduceMotion();
  if (reduceMotion || Platform.OS === 'web') return undefined;
  return LinearTransition.duration(motion.normal);
}

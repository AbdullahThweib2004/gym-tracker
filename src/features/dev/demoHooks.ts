import { Platform } from 'react-native';

import { loadDemoProgram } from './devService';

export type DemoHooks = { load: () => number };

/**
 * Dev web builds only: exposes `globalThis.gymTrackerDemo` so the demo capture script
 * (scripts/demo) can load demo data before recording.
 */
export function registerDemoHooks(): void {
  if (Platform.OS !== 'web') return;
  (globalThis as { gymTrackerDemo?: DemoHooks }).gymTrackerDemo = { load: loadDemoProgram };
}

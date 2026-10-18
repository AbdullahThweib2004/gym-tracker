import { hasCompleteActiveProgram } from '@/db/repositories/userPrograms';
import { ensureExerciseKeys, seedDatabase } from '@/db/seed';
import { initLanguage, reloadApp } from '@/i18n/language';
import { configureRestNotifications } from '@/features/restTimer/restNotifications';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import { useAppStore } from '@/store/appStore';

/**
 * Runs after migrations succeed: seeds the exercise library (once), resolves the language
 * and text direction, then marks the app as ready.
 */
export async function bootstrapApp(): Promise<void> {
  seedDatabase();
  ensureExerciseKeys();
  const { language, needsReload } = await initLanguage();
  if (needsReload) {
    await reloadApp();
    return;
  }
  useRestTimerStore.getState().hydrate();
  // Not awaited: notification setup must never hold up the app.
  configureRestNotifications().catch((error: unknown) =>
    console.warn('Notification setup failed', error),
  );
  useAppStore.getState().setReady({ language, isSetupComplete: hasCompleteActiveProgram() });
}

import { hasActiveProgram } from '@/db/repositories/userPrograms';
import { seedDatabase } from '@/db/seed';
import { initLanguage, reloadApp } from '@/i18n/language';
import { useAppStore } from '@/store/appStore';

/**
 * Runs after migrations succeed: seeds the exercise library (once), resolves the language
 * and text direction, then marks the app as ready.
 */
export async function bootstrapApp(): Promise<void> {
  seedDatabase();
  const { language, needsReload } = await initLanguage();
  if (needsReload) {
    await reloadApp();
    return;
  }
  useAppStore.getState().setReady({ language, hasActiveProgram: hasActiveProgram() });
}

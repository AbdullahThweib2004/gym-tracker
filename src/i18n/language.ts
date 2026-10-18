import { DevSettings, I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

import type { Language } from '@/constants/settings';
import { deleteMeta, getMeta, META_KEYS, setMeta } from '@/db/repositories/appMeta';

import i18n, { detectDeviceLanguage, isLanguage, isRtlLanguage } from './index';

/** Reloads the JS bundle so a direction change is applied to the native layout. */
export async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch {
    // reloadAsync is unavailable in Expo Go and in development; fall back to a dev reload.
    if (Platform.OS === 'web') {
      globalThis.location?.reload();
    } else {
      DevSettings.reload();
    }
  }
}

function directionMatches(language: Language): boolean {
  return I18nManager.isRTL === isRtlLanguage(language);
}

function applyDirection(language: Language): void {
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}

/**
 * Called once after migrations. Resolves the persisted language (or picks one on first
 * launch), applies it to i18next, and returns whether the app must reload to fix direction.
 */
export async function initLanguage(): Promise<{ language: Language; needsReload: boolean }> {
  const stored = getMeta(META_KEYS.language);
  const language: Language = isLanguage(stored) ? stored : detectDeviceLanguage();
  if (!isLanguage(stored)) setMeta(META_KEYS.language, language);

  await i18n.changeLanguage(language);

  if (directionMatches(language) || Platform.OS === 'web') {
    deleteMeta(META_KEYS.directionReloadPending);
    return { language, needsReload: false };
  }

  // Guard against a reload loop if the platform ignores forceRTL.
  if (getMeta(META_KEYS.directionReloadPending) === language) {
    deleteMeta(META_KEYS.directionReloadPending);
    return { language, needsReload: false };
  }

  applyDirection(language);
  setMeta(META_KEYS.directionReloadPending, language);
  return { language, needsReload: true };
}

/** Persists a new language, flips the layout direction, and reloads the app. */
export async function switchLanguage(language: Language): Promise<void> {
  setMeta(META_KEYS.language, language);
  await i18n.changeLanguage(language);
  if (directionMatches(language)) return;
  applyDirection(language);
  setMeta(META_KEYS.directionReloadPending, language);
  await reloadApp();
}

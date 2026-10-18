import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import { LANGUAGES, RTL_LANGUAGES, type Language } from '@/constants/settings';

import ar from './locales/ar.json';
import en from './locales/en.json';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function isRtlLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

/** First-launch default: Arabic if the device prefers Arabic, otherwise English. */
export function detectDeviceLanguage(): Language {
  const primary = getLocales()[0]?.languageCode?.toLowerCase();
  return primary === 'ar' ? 'ar' : 'en';
}

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented API
void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

import { Alert, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { LANGUAGES, type Language } from '@/constants/settings';
import { switchLanguage } from '@/i18n/language';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const version = Constants.expoConfig?.version ?? '—';

  const confirmLanguage = (next: Language) => {
    if (next === language) return;
    // Show the prompt in the target language so the user can read it either way.
    Alert.alert(
      t('settings.changeLanguageTitle', { lng: next }),
      t('settings.changeLanguageMessage', { lng: next, language: t(`languages.${next}`) }),
      [
        { text: t('common.cancel', { lng: next }), style: 'cancel' },
        {
          text: t('settings.restart', { lng: next }),
          onPress: () => {
            setLanguage(next);
            void switchLanguage(next);
          },
        },
      ],
    );
  };

  return (
    <Screen scroll edges={[]}>
      <Card>
        <AppText variant="subheading">{t('settings.language')}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('settings.languageHint')}
        </AppText>
        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
          {LANGUAGES.map((code) => {
            const selected = code === language;
            return (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => confirmLanguage(code)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor:
                    pressed || selected ? theme.colors.surfaceElevated : theme.colors.transparent,
                })}
              >
                <AppText variant="bodyStrong">{t(`languages.${code}`)}</AppText>
                {selected ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <AppText variant="subheading">{t('settings.about')}</AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText color="textSecondary">{t('settings.version')}</AppText>
          <AppText>{version}</AppText>
        </View>
      </Card>
    </Screen>
  );
}

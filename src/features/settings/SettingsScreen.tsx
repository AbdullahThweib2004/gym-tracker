import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { ToggleRow } from '@/components/ToggleRow';
import { LANGUAGES, type Language } from '@/constants/settings';
import { exerciseLibraryHref } from '@/features/exercises/routes';
import { getActiveProgramSummary } from '@/features/program/programService';
import {
  REST_ADJUST_SECONDS,
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
} from '@/features/restTimer/restMath';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import { dayLabel, formatRestSeconds, splitLabel } from '@/i18n/format';
import { switchLanguage } from '@/i18n/language';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

// Type-only (erased at build time), so it doesn't pull the dev module into production.
import type * as DevToolsModule from '@/features/dev/DevToolsSection';

// Dev tools are required only in development, so production bundles don't include them.
const DevToolsSection: typeof DevToolsModule.DevToolsSection | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional so it's stripped from production
    (require('@/features/dev/DevToolsSection') as typeof DevToolsModule).DevToolsSection
  : null;

const EXERCISE_IMAGES_CREDIT_URL = 'https://github.com/yuhonas/free-exercise-db';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const version = Constants.expoConfig?.version ?? '—';
  const restSettings = useRestTimerStore((s) => s.settings);
  const updateRestSettings = useRestTimerStore((s) => s.updateSettings);
  const [summary, setSummary] = useState(() => getActiveProgramSummary());

  useFocusEffect(
    useCallback(() => {
      setSummary(getActiveProgramSummary());
    }, []),
  );

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

  const confirmChangeSplit = () =>
    Alert.alert(t('settings.changeSplitTitle'), t('settings.changeSplitMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.changeSplitConfirm'), onPress: () => router.push('/onboarding') },
    ]);

  const editDay = (dayId: number) =>
    router.push({
      pathname: '/onboarding/day/[dayId]',
      params: { dayId: String(dayId), mode: 'edit' },
    });

  return (
    <Screen scroll edges={[]}>
      {summary ? (
        <Card>
          <AppText variant="subheading">{t('settings.myProgram')}</AppText>
          <AppText color="textSecondary">{splitLabel(summary.program.splitType)}</AppText>
          <View style={{ marginTop: theme.spacing.xs }}>
            {summary.days.map(({ day, exerciseCount }) => {
              const name = dayLabel(summary.program.splitType, day.dayKey);
              return (
                <Pressable
                  key={day.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.editDay', { day: name })}
                  onPress={() => editDay(day.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                    backgroundColor: pressed
                      ? theme.colors.surfaceElevated
                      : theme.colors.transparent,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{name}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {t('home.exerciseCount', { count: exerciseCount })}
                    </AppText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.textSecondary}
                    style={mirrorInRtl()}
                  />
                </Pressable>
              );
            })}
          </View>
          <Button
            label={t('settings.changeSplit')}
            variant="secondary"
            icon="swap-horizontal"
            onPress={confirmChangeSplit}
          />
        </Card>
      ) : null}

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
        <AppText variant="subheading">{t('settings.data')}</AppText>
        <Button
          label={t('exercises.title')}
          variant="secondary"
          icon="barbell-outline"
          onPress={() => router.push(exerciseLibraryHref)}
          fullWidth
        />
        <Button
          label={t('backup.title')}
          variant="secondary"
          icon="cloud-upload-outline"
          onPress={() => router.push('/backup')}
          fullWidth
        />
      </Card>

      <Card>
        <AppText variant="subheading">{t('restTimer.settingsTitle')}</AppText>
        <Stepper
          label={t('restTimer.defaultRest')}
          value={restSettings.defaultRestSeconds}
          min={REST_MIN_SECONDS}
          max={REST_MAX_SECONDS}
          step={REST_ADJUST_SECONDS}
          formatValue={formatRestSeconds}
          onChange={(defaultRestSeconds) => updateRestSettings({ defaultRestSeconds })}
          decrementLabel={t('common.decrease')}
          incrementLabel={t('common.increase')}
        />
        <ToggleRow
          label={t('restTimer.autoStart')}
          hint={t('restTimer.autoStartHint')}
          value={restSettings.autoStart}
          onValueChange={(autoStart) => updateRestSettings({ autoStart })}
        />
        <ToggleRow
          label={t('restTimer.alerts')}
          hint={t('restTimer.alertsHint')}
          value={restSettings.alerts}
          onValueChange={(alerts) => updateRestSettings({ alerts })}
        />
      </Card>

      <Card>
        <AppText variant="subheading">{t('settings.about')}</AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText color="textSecondary">{t('settings.version')}</AppText>
          <AppText>{version}</AppText>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityHint={t('settings.openLinkHint')}
          onPress={() => void Linking.openURL(EXERCISE_IMAGES_CREDIT_URL)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            minHeight: 44,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.sm,
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.transparent,
          })}
        >
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText color="textSecondary">{t('settings.credits')}</AppText>
            <AppText variant="caption">{t('settings.creditsImages')}</AppText>
          </View>
          <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
        </Pressable>
      </Card>
      {DevToolsSection ? <DevToolsSection /> : null}
    </Screen>
  );
}

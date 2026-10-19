import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ActionSheet } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SettingsRow, SettingsSection } from '@/components/SettingsGroup';
import { LANGUAGES, type Language } from '@/constants/settings';
import { getLastBackupAt } from '@/features/backup/backupService';
import { exerciseLibraryHref } from '@/features/exercises/routes';
import { getActiveProgramSummary } from '@/features/program/programService';
import {
  REST_ADJUST_SECONDS,
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
} from '@/features/restTimer/restMath';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import { dayLabel, formatDate, formatRestSeconds, splitLabel } from '@/i18n/format';
import { switchLanguage } from '@/i18n/language';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

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
  const version = Constants.expoConfig?.version ?? '';
  const restSettings = useRestTimerStore((s) => s.settings);
  const updateRestSettings = useRestTimerStore((s) => s.updateSettings);
  const [summary, setSummary] = useState(() => getActiveProgramSummary());
  const [lastBackupAt, setLastBackupAt] = useState(() => getLastBackupAt());
  const [sheet, setSheet] = useState<'language' | 'split' | null>(null);
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSummary(getActiveProgramSummary());
      setLastBackupAt(getLastBackupAt());
    }, []),
  );

  const editDay = (dayId: number) =>
    router.push({
      pathname: '/onboarding/day/[dayId]',
      params: { dayId: String(dayId), mode: 'edit' },
    });

  const rest = restSettings.defaultRestSeconds;

  return (
    <Screen
      scroll
      edges={[]}
      contentStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.xxxl }}
    >
      {summary ? (
        <SettingsSection title={t('settings.myProgram')}>
          <SettingsRow
            icon="albums-outline"
            label={t('settings.split')}
            value={splitLabel(summary.program.splitType)}
          />
          {summary.days.map(({ day, exerciseCount }) => {
            const name = dayLabel(summary.program.splitType, day.dayKey);
            return (
              <SettingsRow
                key={day.id}
                icon="calendar-outline"
                label={name}
                value={t('home.exerciseCount', { count: exerciseCount })}
                accessibilityHint={t('settings.editDay', { day: name })}
                onPress={() => editDay(day.id)}
              />
            );
          })}
          <SettingsRow
            icon="swap-horizontal"
            iconColor="warning"
            label={t('settings.changeSplit')}
            onPress={() => setSheet('split')}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title={t('settings.data')} footer={t('backup.photosNotIncluded')}>
        <SettingsRow
          icon="barbell-outline"
          label={t('exercises.title')}
          onPress={() => router.push(exerciseLibraryHref)}
        />
        <SettingsRow
          icon="cloud-upload-outline"
          label={t('backup.title')}
          value={lastBackupAt ? formatDate(lastBackupAt, 'short') : t('settings.never')}
          onPress={() => router.push('/backup')}
        />
      </SettingsSection>

      <SettingsSection title={t('restTimer.settingsTitle')}>
        <SettingsRow
          icon="hourglass-outline"
          label={t('restTimer.defaultRest')}
          trailing={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <IconButton
                icon="remove"
                size={18}
                variant="tonal"
                haptic="selection"
                disabled={rest <= REST_MIN_SECONDS}
                onPress={() =>
                  updateRestSettings({
                    defaultRestSeconds: Math.max(REST_MIN_SECONDS, rest - REST_ADJUST_SECONDS),
                  })
                }
                accessibilityLabel={`${t('common.decrease')} ${t('restTimer.defaultRest')}`}
              />
              <AppText
                variant="bodyStrong"
                align="center"
                style={{ minWidth: 48 }}
                accessibilityLiveRegion="polite"
              >
                {formatRestSeconds(rest)}
              </AppText>
              <IconButton
                icon="add"
                size={18}
                variant="tonal"
                haptic="selection"
                disabled={rest >= REST_MAX_SECONDS}
                onPress={() =>
                  updateRestSettings({
                    defaultRestSeconds: Math.min(REST_MAX_SECONDS, rest + REST_ADJUST_SECONDS),
                  })
                }
                accessibilityLabel={`${t('common.increase')} ${t('restTimer.defaultRest')}`}
              />
            </View>
          }
        />
        <SettingsRow
          icon="play-circle-outline"
          label={t('restTimer.autoStart')}
          subtitle={t('restTimer.autoStartHint')}
          toggle={{
            value: restSettings.autoStart,
            onChange: (autoStart) => updateRestSettings({ autoStart }),
          }}
        />
        <SettingsRow
          icon="notifications-outline"
          label={t('restTimer.alerts')}
          subtitle={t('restTimer.alertsHint')}
          toggle={{
            value: restSettings.alerts,
            onChange: (alerts) => updateRestSettings({ alerts }),
          }}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.language')} footer={t('settings.languageHint')}>
        <SettingsRow
          icon="language-outline"
          label={t('settings.language')}
          value={t(`languages.${language}`)}
          onPress={() => setSheet('language')}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.about')}>
        <SettingsRow
          icon="information-circle-outline"
          label={t('settings.version')}
          value={version}
        />
        <SettingsRow
          icon="images-outline"
          label={t('settings.credits')}
          subtitle={t('settings.creditsImages')}
          external
          accessibilityHint={t('settings.openLinkHint')}
          onPress={() => void Linking.openURL(EXERCISE_IMAGES_CREDIT_URL)}
        />
      </SettingsSection>

      {DevToolsSection ? <DevToolsSection /> : null}

      <ActionSheet
        visible={sheet === 'language'}
        onClose={() => setSheet(null)}
        title={t('settings.language')}
        actions={LANGUAGES.filter((code) => code !== language).map((code) => ({
          label: t(`languages.${code}`),
          icon: 'language-outline',
          onPress: () => setPendingLanguage(code),
        }))}
      />
      {/* The confirmation is shown in the target language so it can be read either way. */}
      <ConfirmSheet
        visible={pendingLanguage !== null}
        title={pendingLanguage ? t('settings.changeLanguageTitle', { lng: pendingLanguage }) : ''}
        message={
          pendingLanguage
            ? t('settings.changeLanguageMessage', {
                lng: pendingLanguage,
                language: t(`languages.${pendingLanguage}`),
              })
            : undefined
        }
        confirmLabel={pendingLanguage ? t('settings.restart', { lng: pendingLanguage }) : ''}
        cancelLabel={pendingLanguage ? t('common.cancel', { lng: pendingLanguage }) : ''}
        onClose={() => setPendingLanguage(null)}
        onConfirm={() => {
          if (!pendingLanguage) return;
          setLanguage(pendingLanguage);
          void switchLanguage(pendingLanguage);
        }}
      />
      <ConfirmSheet
        visible={sheet === 'split'}
        title={t('settings.changeSplitTitle')}
        message={t('settings.changeSplitMessage')}
        confirmLabel={t('settings.changeSplitConfirm')}
        cancelLabel={t('common.cancel')}
        onClose={() => setSheet(null)}
        onConfirm={() => router.push('/onboarding')}
      />
    </Screen>
  );
}

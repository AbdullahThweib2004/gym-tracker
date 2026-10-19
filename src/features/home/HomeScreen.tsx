import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ActionSheet } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { WEEK_STARTS_ON } from '@/constants/settings';
import type { ProgramDay } from '@/db/schema';
import { dayLabel, splitLabel } from '@/i18n/format';
import { formatDaysAgo } from '@/i18n/relative';
import { useAppStore } from '@/store/appStore';
import { useReduceMotion, useTheme } from '@/theme';

import { workoutHref } from '../workout/routes';
import { discardWorkout, finishWorkout, startWorkout } from '../workout/workoutService';

import { DayCard } from './components/DayCard';
import { ResumeBanner } from './components/ResumeBanner';
import { WeekStrip } from './components/WeekStrip';
import { dismissBackupReminder, loadHomeData, type HomeData } from './homeService';

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const language = useAppStore((s) => s.language);
  const weekStartsOn = WEEK_STARTS_ON[language];
  const [data, setData] = useState<HomeData | null>(() => loadHomeData(weekStartsOn));
  const [confirmDiscard, setConfirmDiscard] = useState<{
    sessionId: number;
    then?: () => void;
  } | null>(null);
  const [conflictDay, setConflictDay] = useState<ProgramDay | null>(null);

  const reload = useCallback(() => setData(loadHomeData(weekStartsOn)), [weekStartsOn]);
  useFocusEffect(reload);

  if (!data) {
    return (
      <Screen edges={[]}>
        <EmptyState title={t('home.noProgram')} />
      </Screen>
    );
  }

  const { program, days, unfinished, showBackupReminder, week } = data;
  const unfinishedName = unfinished
    ? unfinished.splitType
      ? dayLabel(unfinished.splitType, unfinished.session.dayKey)
      : unfinished.session.dayKey
    : '';
  const layout = reduceMotion ? undefined : LinearTransition.duration(theme.motion.normal);

  const begin = (day: ProgramDay) => {
    const session = startWorkout(program, day);
    router.push(workoutHref(session.id));
  };

  const openDay = (day: ProgramDay) => {
    if (!unfinished) return begin(day);
    if (unfinished.session.programDayId === day.id)
      return router.push(workoutHref(unfinished.session.id));
    setConflictDay(day);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Sticky: the workout in progress stays visible while scrolling. */}
      {unfinished ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn}
          style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}
        >
          <ResumeBanner
            dayName={unfinishedName}
            startedAt={unfinished.session.startedAt}
            onResume={() => router.push(workoutHref(unfinished.session.id))}
            onDiscard={() => setConfirmDiscard({ sessionId: unfinished.session.id })}
          />
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <AppText variant="label" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
              {splitLabel(program.splitType)}
            </AppText>
            <PressableScale
              accessibilityRole="link"
              onPress={() => router.navigate('/settings')}
              hitSlop={theme.spacing.sm}
              style={{ minHeight: theme.touchTarget, justifyContent: 'center' }}
            >
              <AppText variant="caption" color="primary">
                {t('home.editProgram')}
              </AppText>
            </PressableScale>
          </View>
          <AppText variant="title" accessibilityRole="header">
            {t('home.chooseDayTitle')}
          </AppText>
        </View>

        <Animated.View layout={layout} style={{ gap: theme.spacing.md }}>
          {days.map(({ day, exerciseCount, previewExercises, lastDoneDate }) => (
            <DayCard
              key={day.id}
              name={dayLabel(program.splitType, day.dayKey)}
              exercises={previewExercises}
              exerciseCount={exerciseCount}
              lastDone={lastDoneDate ? formatDaysAgo(lastDoneDate) : null}
              isInProgress={unfinished?.session.programDayId === day.id}
              onPress={() => openDay(day)}
            />
          ))}
        </Animated.View>

        <WeekStrip days={week} goal={days.length} />

        {showBackupReminder ? (
          <Animated.View exiting={reduceMotion ? undefined : FadeOut} layout={layout}>
            <Card tone="warning">
              <View
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}
              >
                <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.warning} />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText variant="bodyStrong">{t('backup.reminderTitle')}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {t('backup.reminderMessage')}
                  </AppText>
                </View>
                <IconButton
                  icon="close"
                  size={18}
                  color="textSecondary"
                  accessibilityLabel={t('backup.reminderDismiss')}
                  onPress={() => {
                    dismissBackupReminder();
                    reload();
                  }}
                />
              </View>
              <Button
                label={t('backup.backUpNow')}
                variant="secondary"
                size="sm"
                icon="share-outline"
                onPress={() => router.push('/backup')}
                style={{ alignSelf: 'flex-start' }}
              />
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={confirmDiscard !== null}
        title={t('home.discardTitle')}
        message={t('home.discardMessage')}
        confirmLabel={t('home.discard')}
        cancelLabel={t('common.cancel')}
        destructive
        onClose={() => setConfirmDiscard(null)}
        onConfirm={() => {
          if (!confirmDiscard) return;
          discardWorkout(confirmDiscard.sessionId);
          if (confirmDiscard.then) confirmDiscard.then();
          else reload();
        }}
      />

      <ActionSheet
        visible={conflictDay !== null}
        onClose={() => setConflictDay(null)}
        title={t('home.otherInProgressTitle')}
        message={t('home.otherInProgressMessage', { day: unfinishedName })}
        actions={
          unfinished && conflictDay
            ? [
                {
                  label: t('home.finishIt'),
                  icon: 'flag-outline',
                  onPress: () => {
                    finishWorkout(unfinished.session.id);
                    begin(conflictDay);
                  },
                },
                {
                  label: t('home.discardIt'),
                  icon: 'trash-outline',
                  destructive: true,
                  onPress: () =>
                    setConfirmDiscard({
                      sessionId: unfinished.session.id,
                      then: () => begin(conflictDay),
                    }),
                },
              ]
            : []
        }
      />
    </SafeAreaView>
  );
}

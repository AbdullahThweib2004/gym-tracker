import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import type { ProgramDay } from '@/db/schema';
import { dayLabel, exerciseName, splitLabel } from '@/i18n/format';
import { formatDaysAgo, formatTimeAgo } from '@/i18n/relative';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { discardWorkout, finishWorkout, startWorkout } from '../workout/workoutService';

import { DayCard } from './components/DayCard';
import { ResumeBanner } from './components/ResumeBanner';
import { loadHomeData, type HomeData } from './homeService';

const workoutHref = (sessionId: number) => ({
  pathname: '/workout/[sessionId]' as const,
  params: { sessionId: String(sessionId) },
});

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const [data, setData] = useState<HomeData | null>(() => loadHomeData());

  const reload = useCallback(() => setData(loadHomeData()), []);
  useFocusEffect(reload);

  if (!data) {
    return (
      <Screen edges={[]}>
        <EmptyState title={t('home.noProgram')} />
      </Screen>
    );
  }

  const { program, days, suggestedDayId, unfinished } = data;
  const unfinishedName = unfinished
    ? unfinished.splitType
      ? dayLabel(unfinished.splitType, unfinished.session.dayKey)
      : unfinished.session.dayKey
    : '';

  const confirmDiscard = (sessionId: number, onDone?: () => void) => {
    Alert.alert(t('home.discardTitle'), t('home.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.discard'),
        style: 'destructive',
        onPress: () => {
          discardWorkout(sessionId);
          if (onDone) onDone();
          else reload();
        },
      },
    ]);
  };

  const begin = (day: ProgramDay) => {
    const session = startWorkout(program, day);
    router.push(workoutHref(session.id));
  };

  const openDay = (day: ProgramDay) => {
    if (!unfinished) {
      begin(day);
      return;
    }
    if (unfinished.session.programDayId === day.id) {
      router.push(workoutHref(unfinished.session.id));
      return;
    }
    Alert.alert(
      t('home.otherInProgressTitle'),
      t('home.otherInProgressMessage', { day: unfinishedName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.finishIt'),
          onPress: () => {
            finishWorkout(unfinished.session.id);
            begin(day);
          },
        },
        {
          text: t('home.discardIt'),
          style: 'destructive',
          onPress: () => confirmDiscard(unfinished.session.id, () => begin(day)),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <AppText variant="label" color="textSecondary">
            {t('home.activeProgram')}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {splitLabel(program.splitType)}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate('/settings')}
          hitSlop={theme.spacing.sm}
        >
          <AppText variant="caption" color="primary">
            {t('home.editProgram')}
          </AppText>
        </Pressable>
      </View>

      {unfinished ? (
        <ResumeBanner
          dayName={unfinishedName}
          startedAgo={formatTimeAgo(unfinished.session.startedAt)}
          onResume={() => router.push(workoutHref(unfinished.session.id))}
          onDiscard={() => confirmDiscard(unfinished.session.id)}
        />
      ) : null}

      <AppText variant="subheading" style={{ marginTop: theme.spacing.sm }}>
        {t('home.whatToday')}
      </AppText>
      {days.map(({ day, exerciseCount, previewExercises, lastDoneDate }) => (
        <DayCard
          key={day.id}
          name={dayLabel(program.splitType, day.dayKey)}
          exerciseCount={exerciseCount}
          previewNames={previewExercises.map((e) => exerciseName(e, language))}
          lastDone={lastDoneDate ? formatDaysAgo(lastDoneDate) : null}
          isSuggested={day.id === suggestedDayId}
          onPress={() => openDay(day)}
        />
      ))}
    </Screen>
  );
}

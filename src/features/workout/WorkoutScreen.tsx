import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { dayLabel, exerciseName, formatTime } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { discardWorkout, finishWorkout, loadWorkout } from './workoutService';

/** Placeholder workout screen: set logging is built in the next step. */
export function WorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [workout] = useState(() => loadWorkout(Number(sessionId)));

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!workout) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('workout.notFound')}
          actionLabel={t('common.back')}
          onAction={leave}
        />
      </Screen>
    );
  }

  const { session, splitType, exercises } = workout;
  const title = splitType ? dayLabel(splitType, session.dayKey) : session.dayKey;

  const confirmFinish = () =>
    Alert.alert(t('workout.finishTitle'), t('workout.finishMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workout.finish'),
        onPress: () => {
          finishWorkout(session.id);
          leave();
        },
      },
    ]);

  const confirmDiscard = () =>
    Alert.alert(t('home.discardTitle'), t('home.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.discard'),
        style: 'destructive',
        onPress: () => {
          discardWorkout(session.id);
          leave();
        },
      },
    ]);

  return (
    <Screen scroll>
      <ScreenHeader
        title={title}
        subtitle={t('workout.startedAt', { time: formatTime(session.startedAt) })}
        onBack={leave}
        backLabel={t('common.back')}
      />
      <Card>
        <AppText color="textSecondary">{t('workout.placeholder')}</AppText>
      </Card>
      {exercises.map((exercise) => (
        <View
          key={exercise.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
        >
          <ExerciseThumb muscleGroup={exercise.muscleGroup} size={36} />
          <AppText style={{ flex: 1 }}>{exerciseName(exercise, language)}</AppText>
        </View>
      ))}
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <Button label={t('workout.finish')} icon="checkmark" onPress={confirmFinish} fullWidth />
        <Button label={t('home.discard')} variant="ghost" onPress={confirmDiscard} fullWidth />
      </View>
    </Screen>
  );
}

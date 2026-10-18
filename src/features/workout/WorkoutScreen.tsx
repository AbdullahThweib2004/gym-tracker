import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { dayLabel, exerciseName, formatTarget } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useWorkoutDraftStore } from '@/store/workoutDraftStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { addExerciseHref, exerciseLogHref, summaryHref } from './routes';
import {
  countUnloggedExercises,
  discardWorkout,
  finishWorkout,
  loadWorkout,
  type WorkoutData,
} from './workoutService';

export function WorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const clearDrafts = useWorkoutDraftStore((s) => s.clearSession);
  const { sessionId: sessionParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(sessionParam);
  const [data, setData] = useState<WorkoutData | null>(() => loadWorkout(sessionId));

  useFocusEffect(useCallback(() => setData(loadWorkout(sessionId)), [sessionId]));

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!data) {
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

  const { session, splitType, items } = data;
  const title = splitType ? dayLabel(splitType, session.dayKey) : session.dayKey;

  const finish = () => {
    finishWorkout(session.id);
    clearDrafts(session.id);
    router.replace(summaryHref(session.id));
  };

  const confirmFinish = () => {
    const unlogged = countUnloggedExercises(session.id);
    if (unlogged === 0) {
      finish();
      return;
    }
    Alert.alert(t('workout.unloggedTitle'), t('workout.unloggedMessage', { count: unlogged }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('workout.finishAnyway'), onPress: finish },
    ]);
  };

  const confirmDiscard = () =>
    Alert.alert(t('home.discardTitle'), t('home.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.discard'),
        style: 'destructive',
        onPress: () => {
          discardWorkout(session.id);
          clearDrafts(session.id);
          leave();
        },
      },
    ]);

  return (
    <Screen scroll>
      <ScreenHeader
        title={title}
        onBack={leave}
        backLabel={t('common.back')}
        trailing={<Button label={t('workout.finishShort')} onPress={confirmFinish} icon="flag" />}
      />
      {session.finishedAt ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Ionicons name="timer-outline" size={18} color={theme.colors.primary} />
          <ElapsedTimer since={session.startedAt} accessibilityLabel={t('workout.elapsed')} />
        </View>
      )}

      {items.map((item) => {
        const name = exerciseName(item.exercise, language);
        const progress = t('workout.progress', { done: item.workingSets, target: item.targetSets });
        return (
          <Card
            key={item.exerciseId}
            onPress={() => router.push(exerciseLogHref(session.id, item.exerciseId))}
            accessibilityLabel={`${name}, ${progress}`}
            style={item.isComplete ? { borderColor: theme.colors.success } : undefined}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <ExerciseThumb muscleGroup={item.exercise.muscleGroup} />
              <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                <AppText variant="bodyStrong" numberOfLines={2}>
                  {name}
                </AppText>
                <AppText variant="caption" color={item.isComplete ? 'success' : 'textSecondary'}>
                  {progress} ·{' '}
                  {formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax)}
                </AppText>
              </View>
              {item.isComplete ? (
                <Ionicons name="checkmark-circle" size={26} color={theme.colors.success} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={mirrorInRtl()}
                />
              )}
            </View>
          </Card>
        );
      })}

      <Button
        label={t('workout.addExercise')}
        variant="secondary"
        icon="add"
        onPress={() => router.push(addExerciseHref(session.id))}
        fullWidth
      />
      <Button
        label={t('workout.discardWorkout')}
        variant="ghost"
        onPress={confirmDiscard}
        fullWidth
      />
    </Screen>
  );
}

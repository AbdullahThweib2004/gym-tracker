import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { RestTimerDock } from '@/features/restTimer/RestTimerDock';
import { dayLabel, exerciseName, formatTarget } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useLayoutTransition, useReduceMotion, useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { addExerciseHref, exerciseLogHref, summaryHref } from './routes';
import {
  countUnloggedExercises,
  discardWorkout,
  finishWorkout,
  loadWorkout,
  type WorkoutData,
} from './workoutService';

/** Workout overview: progress, "continue" to the next exercise, and the full exercise list. */
export function WorkoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const layout = useLayoutTransition();
  const language = useAppStore((s) => s.language);
  const { sessionId: sessionParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(sessionParam);
  const [data, setData] = useState<WorkoutData | null>(() => loadWorkout(sessionId));
  const [sheet, setSheet] = useState<'finish' | 'discard' | null>(null);
  const [unlogged, setUnlogged] = useState(0);

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
  const done = items.filter((i) => i.isComplete).length;
  const next = items.find((i) => !i.isComplete);

  const finish = () => {
    finishWorkout(session.id);
    router.replace(summaryHref(session.id));
  };

  const requestFinish = () => {
    const count = countUnloggedExercises(session.id);
    if (count === 0) return finish();
    setUnlogged(count);
    setSheet('finish');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <IconButton
            icon="arrow-back"
            variant="tonal"
            directional
            onPress={leave}
            accessibilityLabel={t('common.back')}
          />
          <AppText
            variant="heading"
            style={{ flex: 1 }}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </AppText>
          <Button
            label={t('workout.finishShort')}
            icon="flag"
            size="sm"
            haptic="medium"
            onPress={requestFinish}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText variant="bodyStrong" color="textSecondary">
              {t('workout.exercisesDone', { done, total: items.length })}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <Ionicons name="timer-outline" size={18} color={theme.colors.primary} />
              <ElapsedTimer
                since={session.startedAt}
                variant="numberSmall"
                accessibilityLabel={t('workout.elapsed')}
              />
            </View>
          </View>
          <ProgressBar value={items.length ? done / items.length : 0} height={8} />
        </View>

        {next ? (
          <Card
            tone="accent"
            onPress={() => router.push(exerciseLogHref(session.id, next.exerciseId))}
            haptic="light"
          >
            <AppText variant="label" color="primary">
              {done === 0 ? t('workout.startHere') : t('workout.upNext')}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <ExerciseThumb exercise={next.exercise} size={64} />
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <AppText variant="subheading" numberOfLines={2}>
                  {exerciseName(next.exercise, language)}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {t('workout.progress', { done: next.workingSets, target: next.targetSets })}
                </AppText>
              </View>
              <Ionicons
                name="arrow-forward-circle"
                size={40}
                color={theme.colors.primary}
                style={mirrorInRtl()}
              />
            </View>
          </Card>
        ) : items.length > 0 ? (
          <Card tone="success">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Ionicons name="checkmark-done-circle" size={32} color={theme.colors.success} />
              <AppText variant="subheading" style={{ flex: 1 }}>
                {t('workout.allDone')}
              </AppText>
            </View>
            <Button
              label={t('workout.finish')}
              icon="flag"
              haptic="success"
              onPress={finish}
              fullWidth
            />
          </Card>
        ) : (
          <EmptyState
            icon="barbell-outline"
            title={t('workout.noExercisesTitle')}
            message={t('workout.noExercisesMessage')}
          />
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {items.map((item) => {
            const name = exerciseName(item.exercise, language);
            const progress = t('workout.progress', {
              done: item.workingSets,
              target: item.targetSets,
            });
            return (
              <Animated.View
                key={item.exerciseId}
                layout={layout}
                entering={reduceMotion ? undefined : FadeIn.duration(theme.motion.normal)}
              >
                <Card
                  onPress={() => router.push(exerciseLogHref(session.id, item.exerciseId))}
                  accessibilityLabel={`${name}, ${progress}`}
                  style={{ paddingVertical: theme.spacing.md }}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
                  >
                    <ExerciseThumb exercise={item.exercise} size={52} />
                    <View style={{ flex: 1, gap: theme.spacing.xs }}>
                      <AppText variant="bodyStrong" numberOfLines={2}>
                        {name}
                      </AppText>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <ProgressBar
                            value={
                              item.targetSets ? Math.min(1, item.workingSets / item.targetSets) : 0
                            }
                            height={4}
                            color={item.isComplete ? 'primary' : 'textSecondary'}
                          />
                        </View>
                        <AppText
                          variant="label"
                          color={item.isComplete ? 'primary' : 'textSecondary'}
                        >
                          {item.workingSets}/{item.targetSets}
                        </AppText>
                      </View>
                      <AppText variant="label" color="textMuted">
                        {formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax)}
                      </AppText>
                    </View>
                    {item.isComplete ? (
                      <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.textMuted}
                        style={mirrorInRtl()}
                      />
                    )}
                  </View>
                </Card>
              </Animated.View>
            );
          })}
        </View>

        <Button
          label={t('workout.addExercise')}
          variant="secondary"
          icon="add"
          onPress={() => router.push(addExerciseHref(session.id))}
          fullWidth
        />
        <Button
          label={t('workout.discardWorkout')}
          variant="danger"
          icon="trash-outline"
          onPress={() => setSheet('discard')}
          fullWidth
        />
      </ScrollView>

      <RestTimerDock />

      <ConfirmSheet
        visible={sheet === 'finish'}
        title={t('workout.unloggedTitle')}
        message={t('workout.unloggedMessage', { count: unlogged })}
        confirmLabel={t('workout.finishAnyway')}
        cancelLabel={t('common.cancel')}
        onClose={() => setSheet(null)}
        onConfirm={finish}
      />
      <ConfirmSheet
        visible={sheet === 'discard'}
        title={t('home.discardTitle')}
        message={t('home.discardMessage')}
        confirmLabel={t('home.discard')}
        cancelLabel={t('common.cancel')}
        destructive
        onClose={() => setSheet(null)}
        onConfirm={() => {
          discardWorkout(session.id);
          leave();
        }}
      />
    </SafeAreaView>
  );
}

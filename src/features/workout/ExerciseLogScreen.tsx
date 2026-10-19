import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { EmptyState } from '@/components/EmptyState';
import { haptic } from '@/components/haptics';
import { IconButton } from '@/components/IconButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { RestTimerDock } from '@/features/restTimer/RestTimerDock';
import { useReduceMotion, useTheme } from '@/theme';
import { isRtl } from '@/utils/direction';

import { ExerciseLogPanel } from './ExerciseLogPanel';
import { loadWorkout, type WorkoutData } from './workoutService';

/** Horizontal distance (pt) a swipe needs to change exercise. */
const SWIPE_DISTANCE = 60;

/**
 * The workout pager: one exercise at a time, front and center. Swipe (mirrored in RTL) or use
 * the buttons to move between exercises; a progress bar shows the whole workout.
 */
export function ExerciseLogScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const params = useLocalSearchParams<{ sessionId: string; exerciseId: string }>();
  const sessionId = Number(params.sessionId);
  const [workout, setWorkout] = useState<WorkoutData | null>(() => loadWorkout(sessionId));
  const items = workout?.items ?? [];
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.exerciseId === Number(params.exerciseId)),
    ),
  );
  const [direction, setDirection] = useState<1 | -1>(1);

  const refresh = useCallback(() => setWorkout(loadWorkout(sessionId)), [sessionId]);

  const go = (delta: 1 | -1) => {
    const next = index + delta;
    const target = items[next];
    if (!target) return;
    haptic('selection');
    setDirection(delta);
    setIndex(next);
    router.setParams({ exerciseId: String(target.exerciseId) });
  };

  // Swiping towards the reading direction's start goes forward (left in LTR, right in RTL).
  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .runOnJS(true)
    .onEnd((event) => {
      const dx = isRtl() ? -event.translationX : event.translationX;
      if (dx < -SWIPE_DISTANCE) go(1);
      else if (dx > SWIPE_DISTANCE) go(-1);
    });

  const current = items[index];
  if (!workout || !current) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('workout.notFound')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const done = items.filter((i) => i.isComplete).length;
  const forwardFromEnd = (direction === 1) !== isRtl();
  const entering = reduceMotion ? FadeIn : forwardFromEnd ? SlideInRight : SlideInLeft;
  const exiting = reduceMotion ? FadeOut : forwardFromEnd ? SlideOutLeft : SlideOutRight;
  const isLast = index === items.length - 1;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <IconButton
            icon="arrow-back"
            variant="tonal"
            directional
            onPress={() => router.back()}
            accessibilityLabel={t('workout.backToWorkout')}
          />
          <AppText variant="bodyStrong" style={{ flex: 1 }} align="center">
            {t('workout.exerciseOf', { current: index + 1, total: items.length })}
          </AppText>
          <View
            style={{
              minWidth: theme.touchTarget,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceElevated,
            }}
          >
            <ElapsedTimer
              since={workout.session.startedAt}
              variant="bodyStrong"
              color="textPrimary"
              accessibilityLabel={t('workout.elapsed')}
            />
          </View>
        </View>
        <ProgressBar
          value={items.length ? done / items.length : 0}
          accessibilityLabel={t('workout.exercisesDone', { done, total: items.length })}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GestureDetector gesture={swipe}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
          >
            <Animated.View key={current.exerciseId} entering={entering} exiting={exiting}>
              <ExerciseLogPanel
                sessionId={sessionId}
                exerciseId={current.exerciseId}
                onSetsChanged={refresh}
              />
            </Animated.View>
          </ScrollView>
        </GestureDetector>

        <RestTimerDock
          trailing={
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <IconButton
                icon="chevron-back"
                variant="tonal"
                directional
                disabled={index === 0}
                onPress={() => go(-1)}
                accessibilityLabel={t('workout.previousExercise')}
                style={{ width: 52, height: 52 }}
              />
              <Button
                label={isLast ? t('workout.backToWorkout') : t('workout.nextExercise')}
                icon={isLast ? 'list' : 'arrow-forward'}
                variant={isLast ? 'secondary' : 'primary'}
                onPress={() => (isLast ? router.back() : go(1))}
                style={{ flex: 1 }}
              />
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

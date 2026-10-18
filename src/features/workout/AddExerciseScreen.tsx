import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { listExercises } from '@/db/repositories/exercises';
import type { Exercise } from '@/db/schema';
import { ExercisePicker } from '@/features/program/components/ExercisePicker';
import { useTheme } from '@/theme';

import { addExercisesToSession, loadWorkout } from './workoutService';

/** Adds exercises to this session only; the program is not changed. */
export function AddExerciseScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { sessionId: sessionParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(sessionParam);
  const [workout] = useState(() => loadWorkout(sessionId));
  const [all] = useState(() => listExercises());
  const [selected, setSelected] = useState<number[]>([]);

  const available = useMemo(() => {
    const inSession = new Set(workout?.items.map((item) => item.exerciseId) ?? []);
    return all.filter((exercise) => !inSession.has(exercise.id));
  }, [all, workout]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);

  const toggle = (exercise: Exercise) =>
    setSelected((prev) =>
      prev.includes(exercise.id) ? prev.filter((id) => id !== exercise.id) : [...prev, exercise.id],
    );

  const add = () => {
    addExercisesToSession(sessionId, selected);
    router.back();
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <ScreenHeader
          title={t('workout.addExerciseTitle')}
          subtitle={t('workout.addExerciseHint')}
          onBack={() => router.back()}
          backLabel={t('common.back')}
        />
      </View>
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <ExercisePicker
          exercises={available}
          suggestedMuscleGroups={workout?.suggestedMuscleGroups ?? []}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
      </View>
      <View
        style={{
          padding: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Button
          label={t('workout.addSelected', { count: selected.length })}
          onPress={add}
          disabled={selected.length === 0}
          icon="add"
          fullWidth
        />
      </View>
    </Screen>
  );
}

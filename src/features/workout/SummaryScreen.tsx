import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { getSessionSummary } from '@/db/repositories/workoutSessions';
import { getProgramById } from '@/db/repositories/userPrograms';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import {
  dayLabel,
  exerciseName,
  formatDate,
  formatDuration,
  formatSet,
  formatVolume,
} from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { exerciseHistoryHref } from './routes';

export function SummaryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [summary] = useState(() => getSessionSummary(Number(sessionId)));
  const done = () => router.dismissTo('/');

  if (!summary) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('workout.notFound')}
          actionLabel={t('common.done')}
          onAction={done}
        />
      </Screen>
    );
  }

  const { session } = summary;
  const splitType =
    session.userProgramId === null ? null : getProgramById(session.userProgramId)?.splitType;
  const title = splitType ? dayLabel(splitType, session.dayKey) : session.dayKey;

  return (
    <Screen scroll>
      <View
        style={{ alignItems: 'center', gap: theme.spacing.xs, marginVertical: theme.spacing.lg }}
      >
        <Ionicons name="trophy" size={48} color={theme.colors.warning} />
        <AppText variant="title" align="center" accessibilityRole="header">
          {t('summary.title')}
        </AppText>
        <AppText color="textSecondary" align="center">
          {title} · {formatDate(session.date, 'long')}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <StatTile label={t('summary.duration')} value={formatDuration(summary.durationMs)} />
        <StatTile label={t('summary.exercises')} value={String(summary.exerciseCount)} />
        <StatTile label={t('summary.workingSets')} value={String(summary.workingSets)} />
        <StatTile label={t('summary.volume')} value={formatVolume(summary.volumeKg)} />
      </View>

      {summary.exercises.length > 0 ? (
        <AppText variant="subheading" style={{ marginTop: theme.spacing.sm }}>
          {t('summary.bestSets')}
        </AppText>
      ) : (
        <AppText color="textSecondary" align="center">
          {t('summary.noSets')}
        </AppText>
      )}
      {summary.exercises.map(({ exercise, sets, best }) => (
        <Card key={exercise.id}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(exerciseHistoryHref(exercise.id))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
          >
            <ExerciseThumb muscleGroup={exercise.muscleGroup} size={36} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{exerciseName(exercise, language)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {t('summary.setsLogged', { count: sets.length })}
              </AppText>
            </View>
            <AppText variant="bodyStrong" color="success">
              {best ? formatSet(best.weightKg, best.reps) : t('workout.warmup')}
            </AppText>
          </Pressable>
        </Card>
      ))}

      <Button
        label={t('common.done')}
        icon="checkmark"
        onPress={done}
        fullWidth
        style={{ marginTop: theme.spacing.md }}
      />
    </Screen>
  );
}

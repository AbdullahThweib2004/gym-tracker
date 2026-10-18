import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatTile } from '@/components/StatTile';
import { deleteSet, updateSet } from '@/db/repositories/sessionSets';
import { getProgramById } from '@/db/repositories/userPrograms';
import { getSessionSummary, type SessionSummary } from '@/db/repositories/workoutSessions';
import type { SessionSet } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { exerciseHistoryHref } from '@/features/workout/routes';
import { workingOrdinals } from '@/features/workout/setRows';
import { discardWorkout } from '@/features/workout/workoutService';
import {
  dayLabel,
  exerciseName,
  formatDate,
  formatDuration,
  formatSet,
  formatTime,
  formatVolume,
} from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

import { SetEditModal } from './components/SetEditModal';

export function SessionDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const { sessionId: param } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(param);
  const [summary, setSummary] = useState<SessionSummary | null>(() => getSessionSummary(sessionId));
  const [editing, setEditing] = useState<{ set: SessionSet; title: string } | null>(null);

  const reload = useCallback(() => setSummary(getSessionSummary(sessionId)), [sessionId]);
  useFocusEffect(reload);

  if (!summary) {
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

  const { session } = summary;
  const splitType =
    session.userProgramId === null ? null : getProgramById(session.userProgramId)?.splitType;
  const title = splitType ? dayLabel(splitType, session.dayKey) : session.dayKey;

  const confirmDeleteSession = () =>
    Alert.alert(t('history.deleteSessionTitle'), t('history.deleteSessionMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          discardWorkout(session.id);
          router.back();
        },
      },
    ]);

  const confirmDeleteSet = (set: SessionSet) =>
    Alert.alert(t('history.deleteSetTitle'), t('history.deleteSetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSet(set.id);
          setEditing(null);
          reload();
        },
      },
    ]);

  return (
    <Screen scroll>
      <ScreenHeader
        title={title}
        subtitle={`${formatDate(session.date, 'long')} · ${formatTime(session.startedAt)}`}
        onBack={() => router.back()}
        backLabel={t('common.back')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <StatTile label={t('summary.duration')} value={formatDuration(summary.durationMs)} />
        <StatTile label={t('summary.exercises')} value={String(summary.exerciseCount)} />
        <StatTile label={t('summary.workingSets')} value={String(summary.workingSets)} />
        <StatTile label={t('summary.volume')} value={formatVolume(summary.volumeKg)} />
      </View>

      {summary.exercises.length === 0 ? (
        <AppText color="textSecondary" align="center">
          {t('summary.noSets')}
        </AppText>
      ) : null}

      {summary.exercises.map(({ exercise, sets }) => {
        const name = exerciseName(exercise, language);
        const ordinals = workingOrdinals(sets);
        return (
          <Card key={exercise.id}>
            <Pressable
              accessibilityRole="link"
              accessibilityHint={t('history.openExerciseHistory')}
              onPress={() => router.push(exerciseHistoryHref(exercise.id))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
            >
              <ExerciseThumb exercise={exercise} size={36} />
              <AppText variant="bodyStrong" color="primary" style={{ flex: 1 }}>
                {name}
              </AppText>
            </Pressable>
            {sets.map((set, index) => {
              const ordinal = ordinals[index] ?? null;
              const label =
                ordinal === null ? t('workout.warmup') : t('workout.set', { number: ordinal });
              return (
                <Pressable
                  key={set.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}, ${formatSet(set.weightKg, set.reps)}`}
                  accessibilityHint={t('history.editSetHint')}
                  onPress={() => setEditing({ set, title: `${name} · ${label}` })}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    backgroundColor: pressed
                      ? theme.colors.surfaceElevated
                      : theme.colors.transparent,
                  })}
                >
                  <AppText
                    variant="caption"
                    color={ordinal === null ? 'warning' : 'textMuted'}
                    style={{ minWidth: 24 }}
                  >
                    {ordinal ?? t('workout.warmupShort')}
                  </AppText>
                  <AppText style={{ flex: 1 }}>{formatSet(set.weightKg, set.reps)}</AppText>
                </Pressable>
              );
            })}
          </Card>
        );
      })}

      <Button
        label={t('history.deleteSession')}
        variant="ghost"
        icon="trash-outline"
        onPress={confirmDeleteSession}
        fullWidth
      />

      {editing ? (
        <SetEditModal
          title={editing.title}
          initial={editing.set}
          onClose={() => setEditing(null)}
          onDelete={() => confirmDeleteSet(editing.set)}
          onSave={(values) => {
            updateSet(editing.set.id, values);
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </Screen>
  );
}

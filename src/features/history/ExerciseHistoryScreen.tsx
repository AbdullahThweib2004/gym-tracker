import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getExerciseById } from '@/db/repositories/exercises';
import { listExerciseHistory, type ExerciseHistoryEntry } from '@/db/repositories/sessionSets';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { sessionDetailHref } from '@/features/workout/routes';
import { exerciseName, formatDate, formatSetCompact } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

type SessionGroup = { sessionId: number; date: string; sets: ExerciseHistoryEntry[] };

/** Groups history rows (newest first) by session, keeping set order. */
function groupBySession(entries: readonly ExerciseHistoryEntry[]): SessionGroup[] {
  const groups: SessionGroup[] = [];
  for (const entry of entries) {
    const current = groups[groups.length - 1];
    if (current?.sessionId === entry.sessionId) current.sets.push(entry);
    else groups.push({ sessionId: entry.sessionId, date: entry.date, sets: [entry] });
  }
  return groups;
}

export function ExerciseHistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const [exercise] = useState(() => getExerciseById(exerciseId));
  const [entries, setEntries] = useState(() => listExerciseHistory(exerciseId, { limit: 1000 }));
  useFocusEffect(
    useCallback(() => setEntries(listExerciseHistory(exerciseId, { limit: 1000 })), [exerciseId]),
  );
  const groups = useMemo(() => groupBySession(entries), [entries]);

  if (!exercise) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('exercises.notFound')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <ScreenHeader
          title={exerciseName(exercise, language)}
          subtitle={`${t(`muscleGroups.${exercise.muscleGroup}`)} · ${t(`equipment.${exercise.equipment}`)}`}
          onBack={() => router.back()}
          backLabel={t('common.back')}
          trailing={<ExerciseThumb muscleGroup={exercise.muscleGroup} />}
        />
      </View>
      <FlatList
        data={groups}
        keyExtractor={(group) => String(group.sessionId)}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.sm,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title={t('exercises.noHistoryTitle')}
            message={t('exercises.noHistoryMessage')}
          />
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push(sessionDetailHref(item.sessionId))}
            accessibilityLabel={formatDate(item.date, 'long')}
          >
            <AppText variant="caption" color="textSecondary">
              {formatDate(item.date, 'long')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {item.sets.map((set) => (
                <AppText
                  key={set.id}
                  variant="bodyStrong"
                  color={set.isWarmup ? 'textMuted' : 'textPrimary'}
                >
                  {set.isWarmup ? `${t('workout.warmupShort')} ` : ''}
                  {formatSetCompact(set.weightKg, set.reps)}
                </AppText>
              ))}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

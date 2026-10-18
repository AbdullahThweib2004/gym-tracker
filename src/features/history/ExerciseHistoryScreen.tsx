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
import { ExerciseMotion } from '@/features/exercises/components/ExerciseMotion';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { sessionDetailHref } from '@/features/workout/routes';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTile } from '@/components/StatTile';
import { ProgressChart } from '@/features/progress/components/ProgressChart';
import {
  buildSessionPoints,
  computeProgressStats,
  filterByRange,
  type ProgressMetric,
  type ProgressRange,
} from '@/features/progress/progressSeries';
import {
  exerciseName,
  formatDate,
  formatSetCompact,
  formatVolume,
  formatWeight,
  formatWeightChange,
} from '@/i18n/format';
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
  const [metric, setMetric] = useState<ProgressMetric>('bestWeight');
  const [range, setRange] = useState<ProgressRange>('3M');
  const allPoints = useMemo(() => buildSessionPoints(entries), [entries]);
  const points = useMemo(() => filterByRange(allPoints, range, new Date()), [allPoints, range]);
  const stats = useMemo(() => computeProgressStats(allPoints, points), [allPoints, points]);

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
          trailing={<ExerciseThumb exercise={exercise} />}
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
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <ExerciseMotion
              exercise={exercise}
              height={220}
              accessibilityLabel={t('exercises.motion.label', {
                name: exerciseName(exercise, language),
              })}
            />
            {allPoints.length === 0 ? null : (
              <>
                <SegmentedControl
                  accessibilityLabel={t('progress.metricLabel')}
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: 'bestWeight', label: t('progress.metric.bestWeight') },
                    { value: 'estimated1RM', label: t('progress.metric.estimated1RM') },
                    { value: 'volume', label: t('progress.metric.volume') },
                  ]}
                />
                <SegmentedControl
                  accessibilityLabel={t('progress.rangeLabel')}
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '1M', label: t('progress.range.1M') },
                    { value: '3M', label: t('progress.range.3M') },
                    { value: '6M', label: t('progress.range.6M') },
                    { value: 'all', label: t('progress.range.all') },
                  ]}
                />
                <Card>
                  {allPoints.length < 2 ? (
                    <EmptyState
                      icon="trending-up-outline"
                      title={t('progress.notEnoughTitle')}
                      message={t('progress.notEnoughMessage')}
                    />
                  ) : points.length < 2 ? (
                    <EmptyState icon="calendar-outline" title={t('progress.notEnoughInRange')} />
                  ) : (
                    <ProgressChart
                      points={points}
                      metric={metric}
                      accessibilityLabel={t('progress.chartLabel', {
                        metric: t(`progress.metric.${metric}`),
                        count: points.length,
                      })}
                    />
                  )}
                </Card>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                  <StatTile
                    label={t('progress.stats.heaviest')}
                    value={stats.heaviest ? formatWeight(stats.heaviest.weightKg) : '—'}
                    caption={stats.heaviest ? formatDate(stats.heaviest.date, 'medium') : undefined}
                  />
                  <StatTile
                    label={t('progress.stats.best1RM')}
                    value={
                      stats.best1RM === null ? '—' : formatWeight(Math.round(stats.best1RM * 2) / 2)
                    }
                  />
                  <StatTile
                    label={t('progress.stats.sessions')}
                    value={String(stats.totalSessions)}
                  />
                  <StatTile
                    label={t('progress.stats.change')}
                    value={
                      stats.bestWeightChange === null
                        ? '—'
                        : formatWeightChange(stats.bestWeightChange)
                    }
                    valueColor={
                      stats.bestWeightChange === null || stats.bestWeightChange === 0
                        ? 'textPrimary'
                        : stats.bestWeightChange > 0
                          ? 'success'
                          : 'danger'
                    }
                    caption={t(`progress.range.${range}`)}
                  />
                </View>
                {metric === 'volume' && points.length > 0 ? (
                  <AppText variant="caption" color="textMuted">
                    {t('progress.lastVolume', {
                      volume: formatVolume(points[points.length - 1]!.volume),
                    })}
                  </AppText>
                ) : null}
                <AppText variant="subheading">{t('progress.sessionsTitle')}</AppText>
              </>
            )}
          </View>
        }
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

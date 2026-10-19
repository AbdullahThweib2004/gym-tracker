import { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { WEEK_STARTS_ON } from '@/constants/settings';
import { listPrograms } from '@/db/repositories/userPrograms';
import {
  listFinishedSessionsWithStats,
  listSessionExercisePreviews,
  type SessionListItem,
} from '@/db/repositories/workoutSessions';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { sessionDetailHref } from '@/features/workout/routes';
import { dayLabel, formatDate, formatDateRange, formatDuration, formatVolume } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';
import { sessionDurationMs } from '@/utils/workoutStats';

import { groupByWeek, type WeekGroup } from './weekGroups';

type HistoryData = {
  sessions: SessionListItem[];
  splitByProgram: Map<number, string>;
  previews: Map<number, Exercise[]>;
};

type Row =
  | { type: 'header'; key: string; title: string; count: number }
  | { type: 'session'; key: string; session: SessionListItem; isLast: boolean };

const load = (): HistoryData => {
  const sessions = listFinishedSessionsWithStats();
  return {
    sessions,
    splitByProgram: new Map(listPrograms().map((p) => [p.id, p.splitType])),
    previews: listSessionExercisePreviews(sessions.map((s) => s.id)),
  };
};

type TimelineCardProps = {
  name: string;
  date: string;
  duration: string;
  volume: string;
  exercises: readonly Exercise[];
  exerciseCount: number;
  isLast: boolean;
  onPress: () => void;
};

/** One workout on the timeline: rail + card with day, date, duration, volume and thumbnails. */
const TimelineCard = memo(function TimelineCard({
  name,
  date,
  duration,
  volume,
  exercises,
  exerciseCount,
  isLast,
  onPress,
}: TimelineCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const more = exerciseCount - exercises.length;
  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
      <View style={{ width: 16, alignItems: 'center' }}>
        <View
          style={{
            marginTop: theme.spacing.xl,
            width: 12,
            height: 12,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primary,
            borderWidth: 3,
            borderColor: theme.colors.primaryMuted,
          }}
        />
        {!isLast ? (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: theme.colors.border,
              marginTop: theme.spacing.xs,
            }}
          />
        ) : null}
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${date}, ${duration}, ${volume}`}
        onPress={onPress}
        scaleTo={0.985}
        style={({ pressed }) => ({
          flex: 1,
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText variant="label" color="textSecondary">
              {date}
            </AppText>
            <AppText variant="subheading" numberOfLines={1}>
              {name}
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
            style={mirrorInRtl()}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <AppText variant="bodyStrong">{duration}</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <Ionicons name="barbell-outline" size={16} color={theme.colors.textSecondary} />
            <AppText variant="bodyStrong">{volume}</AppText>
          </View>
        </View>
        {exercises.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            {exercises.map((exercise) => (
              <ExerciseThumb
                key={exercise.id}
                exercise={exercise}
                size={36}
                radius={theme.radius.sm}
              />
            ))}
            {more > 0 ? (
              <AppText
                variant="label"
                color="textSecondary"
                style={{ marginStart: theme.spacing.xs }}
              >
                {t('home.andMore', { count: more })}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </PressableScale>
    </View>
  );
});

export function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const [data, setData] = useState<HistoryData>(load);

  useFocusEffect(useCallback(() => setData(load()), []));

  const rows = useMemo((): Row[] => {
    const weekTitle = (group: WeekGroup<SessionListItem>) =>
      group.kind === 'thisWeek'
        ? t('history.thisWeek')
        : group.kind === 'lastWeek'
          ? t('history.lastWeek')
          : formatDateRange(group.start, group.end);
    return groupByWeek(data.sessions, (s) => s.date, new Date(), WEEK_STARTS_ON[language]).flatMap(
      (group) => [
        {
          type: 'header' as const,
          key: `h-${group.key}`,
          title: weekTitle(group),
          count: group.items.length,
        },
        ...group.items.map((session, i) => ({
          type: 'session' as const,
          key: `s-${session.id}`,
          session,
          isLast: i === group.items.length - 1,
        })),
      ],
    );
  }, [data, language, t]);

  if (data.sessions.length === 0) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon="calendar-outline"
          title={t('history.emptyTitle')}
          message={t('history.emptyMessage')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={[]} padded={false}>
      <FlashList
        data={rows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.type}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <AppText variant="subheading" accessibilityRole="header">
                  {row.title}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {t('history.workoutCount', { count: row.count })}
                </AppText>
              </View>
            );
          }
          const { session } = row;
          const split =
            session.userProgramId === null
              ? undefined
              : data.splitByProgram.get(session.userProgramId);
          return (
            <TimelineCard
              name={split ? dayLabel(split, session.dayKey) : session.dayKey}
              date={formatDate(session.date, 'weekday')}
              duration={formatDuration(sessionDurationMs(session.startedAt, session.finishedAt))}
              volume={formatVolume(session.volumeKg)}
              exercises={data.previews.get(session.id) ?? []}
              exerciseCount={session.exerciseCount}
              isLast={row.isLast}
              onPress={() => router.push(sessionDetailHref(session.id))}
            />
          );
        }}
      />
    </Screen>
  );
}

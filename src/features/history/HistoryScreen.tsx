import { useCallback, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { WEEK_STARTS_ON } from '@/constants/settings';
import {
  listFinishedSessionsWithStats,
  type SessionListItem,
} from '@/db/repositories/workoutSessions';
import { listPrograms } from '@/db/repositories/userPrograms';
import { sessionDetailHref } from '@/features/workout/routes';
import { dayLabel, formatDate, formatDateRange, formatDuration, formatVolume } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';
import { sessionDurationMs } from '@/utils/workoutStats';

import { groupByWeek, type WeekGroup } from './weekGroups';

type HistoryData = { sessions: SessionListItem[]; splitByProgram: Map<number, string> };

const load = (): HistoryData => ({
  sessions: listFinishedSessionsWithStats(),
  splitByProgram: new Map(listPrograms().map((p) => [p.id, p.splitType])),
});

export function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);
  const [data, setData] = useState<HistoryData>(load);

  useFocusEffect(useCallback(() => setData(load()), []));

  const sections = useMemo(
    () =>
      groupByWeek(data.sessions, (s) => s.date, new Date(), WEEK_STARTS_ON[language]).map(
        (group: WeekGroup<SessionListItem>) => ({ ...group, data: group.items }),
      ),
    [data, language],
  );

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

  const weekTitle = (group: WeekGroup<SessionListItem>) =>
    group.kind === 'thisWeek'
      ? t('history.thisWeek')
      : group.kind === 'lastWeek'
        ? t('history.lastWeek')
        : formatDateRange(group.start, group.end);

  return (
    <Screen edges={[]} padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        renderSectionHeader={({ section }) => (
          <AppText variant="label" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
            {weekTitle(section)}
          </AppText>
        )}
        renderItem={({ item }) => {
          const split =
            item.userProgramId === null ? undefined : data.splitByProgram.get(item.userProgramId);
          const name = split ? dayLabel(split, item.dayKey) : item.dayKey;
          const details = [
            formatDuration(sessionDurationMs(item.startedAt, item.finishedAt)),
            t('home.exerciseCount', { count: item.exerciseCount }),
            formatVolume(item.volumeKg),
          ].join(' · ');
          return (
            <Card
              onPress={() => router.push(sessionDetailHref(item.id))}
              accessibilityLabel={`${name}, ${details}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                  <AppText variant="caption" color="textSecondary">
                    {formatDate(item.date, 'weekday')}
                  </AppText>
                  <AppText variant="bodyStrong">{name}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {details}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={mirrorInRtl()}
                />
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

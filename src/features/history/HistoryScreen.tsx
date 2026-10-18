import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import type { WorkoutSession } from '@/db/schema';
import { getProgramById } from '@/db/repositories/userPrograms';
import { listFinishedSessions } from '@/db/repositories/workoutSessions';
import { dayLabel, formatDate } from '@/i18n/format';

export function HistoryScreen() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      setSessions(listFinishedSessions({ limit: 50 }));
    }, []),
  );

  if (sessions.length === 0) {
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
    <Screen scroll edges={[]}>
      {sessions.map((session) => {
        const splitType = session.userProgramId
          ? getProgramById(session.userProgramId)?.splitType
          : undefined;
        return (
          <Card key={session.id}>
            <AppText variant="bodyStrong">
              {splitType ? dayLabel(splitType, session.dayKey) : session.dayKey}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {formatDate(session.date, 'long')}
            </AppText>
          </Card>
        );
      })}
    </Screen>
  );
}

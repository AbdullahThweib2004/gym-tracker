import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { listProgramDays } from '@/db/repositories/programDays';
import { getActiveProgram } from '@/db/repositories/userPrograms';
import { dayLabel, splitLabel } from '@/i18n/format';
import { useTheme } from '@/theme';

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [program] = useState(() => getActiveProgram());
  const [days] = useState(() => (program ? listProgramDays(program.id) : []));

  if (!program) {
    return (
      <Screen edges={[]}>
        <EmptyState title={t('home.noProgram')} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]}>
      <Card>
        <AppText variant="label" color="textSecondary">
          {t('home.activeProgram')}
        </AppText>
        <AppText variant="heading">{splitLabel(program.splitType)}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('splits.daysCount', { count: days.length })}
        </AppText>
      </Card>
      <View style={{ gap: theme.spacing.sm }}>
        {days.map((day) => (
          <Card key={day.id}>
            <AppText variant="bodyStrong">{dayLabel(program.splitType, day.dayKey)}</AppText>
          </Card>
        ))}
      </View>
      <AppText color="textSecondary" align="center">
        {t('home.comingSoon')}
      </AppText>
    </Screen>
  );
}

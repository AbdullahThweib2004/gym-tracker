import { memo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { formatDate } from '@/i18n/format';
import { useTheme } from '@/theme';

import type { WeekDayActivity } from '../weekActivity';

type WeekStripProps = { days: readonly WeekDayActivity[]; goal: number };

/** This week at a glance: one dot per day (filled when trained) and "2 of 3 workouts". */
export const WeekStrip = memo(function WeekStrip({ days, goal }: WeekStripProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const done = days.filter((d) => d.trained).length;
  const reached = goal > 0 && done >= goal;

  return (
    <View
      accessible
      accessibilityLabel={t('home.weekProgress', { done, goal })}
      style={{
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Ionicons
          name={reached ? 'flame' : 'flame-outline'}
          size={18}
          color={reached ? theme.colors.primary : theme.colors.textSecondary}
        />
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {t('home.weekTitle')}
        </AppText>
        <AppText variant="bodyStrong" color={reached ? 'primary' : 'textSecondary'}>
          {t('home.weekProgress', { done, goal })}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((day) => (
          <View key={day.date} style={{ alignItems: 'center', gap: theme.spacing.xs, flex: 1 }}>
            <AppText variant="label" color={day.isToday ? 'textPrimary' : 'textMuted'}>
              {formatDate(day.date, 'weekdayNarrow')}
            </AppText>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: day.trained ? theme.colors.primary : theme.colors.surfaceElevated,
                borderWidth: day.isToday && !day.trained ? 1.5 : 0,
                borderColor: theme.colors.primary,
                opacity: day.isFuture ? 0.5 : 1,
              }}
            >
              {day.trained ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

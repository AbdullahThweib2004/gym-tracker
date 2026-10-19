import { memo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { useTheme } from '@/theme';

type TodayCardProps = {
  dayName: string;
  exercises: readonly Exercise[];
  exerciseCount: number;
  lastDone: string | null;
  isInProgress: boolean;
  onStart: () => void;
};

const STRIP_SIZE = 56;
const STRIP_MAX = 5;

/** The hero card: today's suggested day with its exercises and one big Start button. */
export const TodayCard = memo(function TodayCard({
  dayName,
  exercises,
  exerciseCount,
  lastDone,
  isInProgress,
  onStart,
}: TodayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shown = exercises.slice(0, STRIP_MAX);
  const more = exerciseCount - shown.length;

  return (
    <View
      style={{
        gap: theme.spacing.lg,
        padding: theme.spacing.xl,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primarySoft,
      }}
    >
      <View style={{ gap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Ionicons name="flash" size={14} color={theme.colors.primary} />
          <AppText variant="label" color="primary">
            {t('home.upNext')}
          </AppText>
        </View>
        <AppText variant="display" accessibilityRole="header" numberOfLines={2}>
          {t('home.todayDay', { day: dayName })}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {t('home.exerciseCount', { count: exerciseCount })} ·{' '}
          {lastDone ? t('home.lastDone', { when: lastDone }) : t('home.notDoneYet')}
        </AppText>
      </View>

      {/* Fixed-size tiles: images fade in without moving anything. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {shown.map((exercise) => (
          <ExerciseThumb key={exercise.id} exercise={exercise} size={STRIP_SIZE} />
        ))}
        {more > 0 ? <Chip label={t('home.andMore', { count: more })} /> : null}
      </View>

      <Button
        label={isInProgress ? t('home.resume') : t('home.startWorkout')}
        icon={isInProgress ? 'play' : 'barbell'}
        size="lg"
        haptic="medium"
        onPress={onStart}
        fullWidth
      />
    </View>
  );
});

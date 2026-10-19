import { memo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

type DayCardProps = {
  name: string;
  exercises: readonly Exercise[];
  exerciseCount: number;
  lastDone: string | null;
  isInProgress: boolean;
  onPress: () => void;
};

const STRIP_SIZE = 52;
const STRIP_MAX = 5;

/** One program day. Every day gets the same card; tapping it starts (or resumes) that day. */
export const DayCard = memo(function DayCard({
  name,
  exercises,
  exerciseCount,
  lastDone,
  isInProgress,
  onPress,
}: DayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shown = exercises.slice(0, STRIP_MAX);
  const more = exerciseCount - shown.length;
  const count = t('home.exerciseCount', { count: exerciseCount });
  const last = lastDone ? t('home.lastDone', { when: lastDone }) : t('home.notDoneYet');
  const action = isInProgress ? t('home.resume') : t('home.startWorkout');

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${name}, ${count}, ${last}`}
      accessibilityHint={action}
      haptic="medium"
      style={{ gap: theme.spacing.lg, padding: theme.spacing.xl }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="heading" numberOfLines={2}>
            {name}
          </AppText>
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {count}
          </AppText>
        </View>
        <View
          style={{
            width: theme.touchTarget,
            height: theme.touchTarget,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primarySoft,
          }}
        >
          <Ionicons
            name={isInProgress ? 'play' : 'chevron-forward'}
            size={22}
            color={theme.colors.primary}
            style={isInProgress ? undefined : mirrorInRtl()}
          />
        </View>
      </View>

      {/* Fixed-size tiles: images fade in without moving anything. */}
      {shown.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {shown.map((exercise) => (
            <ExerciseThumb key={exercise.id} exercise={exercise} size={STRIP_SIZE} />
          ))}
          {more > 0 ? <Chip label={t('home.andMore', { count: more })} /> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <Ionicons
          name={isInProgress ? 'radio-button-on' : 'time-outline'}
          size={16}
          color={isInProgress ? theme.colors.primary : theme.colors.textSecondary}
        />
        <AppText
          variant="caption"
          color={isInProgress ? 'primary' : 'textSecondary'}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {isInProgress ? t('home.inProgress') : last}
        </AppText>
      </View>
    </Card>
  );
});

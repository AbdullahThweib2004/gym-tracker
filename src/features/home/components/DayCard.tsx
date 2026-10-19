import { memo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { useTheme } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

type DayCardProps = {
  name: string;
  exercises: readonly Exercise[];
  exerciseCount: number;
  lastDone: string | null;
  onPress: () => void;
};

/** Compact card for the other program days. */
export const DayCard = memo(function DayCard({
  name,
  exercises,
  exerciseCount,
  lastDone,
  onPress,
}: DayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const subtitle = `${t('home.exerciseCount', { count: exerciseCount })} · ${
    lastDone ? t('home.lastDone', { when: lastDone }) : t('home.notDoneYet')
  }`;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${name}, ${subtitle}`}
      style={{ paddingVertical: theme.spacing.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        {exercises[0] ? (
          <ExerciseThumb exercise={exercises[0]} size={48} />
        ) : (
          <View style={{ width: 48, height: 48 }} />
        )}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="subheading" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textMuted}
          style={mirrorInRtl()}
        />
      </View>
    </Card>
  );
});

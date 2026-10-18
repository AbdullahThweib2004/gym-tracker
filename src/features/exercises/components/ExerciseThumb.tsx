import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { MuscleGroup } from '@/constants/muscles';
import { useTheme } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const MUSCLE_GROUP_ICONS: Record<MuscleGroup, IconName> = {
  chest: 'weight-lifter',
  back: 'rowing',
  shoulders: 'human-handsup',
  biceps: 'arm-flex',
  triceps: 'arm-flex-outline',
  legs: 'run',
  glutes: 'human-male',
  calves: 'shoe-sneaker',
  abs: 'yoga',
  forearms: 'hand-back-left',
};

type ExerciseThumbProps = {
  muscleGroup: MuscleGroup;
  size?: number;
};

/** Placeholder thumbnail until exercise images exist: a muscle-group icon on a tile. */
export function ExerciseThumb({ muscleGroup, size = 44 }: ExerciseThumbProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(`muscleGroups.${muscleGroup}`)}
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons
        name={MUSCLE_GROUP_ICONS[muscleGroup]}
        size={size * 0.55}
        color={theme.colors.primary}
      />
    </View>
  );
}

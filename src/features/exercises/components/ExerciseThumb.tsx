import { useState } from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { MuscleGroup } from '@/constants/muscles';
import { useTheme } from '@/theme';

import { exerciseImageFor, type ExerciseImageInput } from '../useExerciseImage';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const MUSCLE_GROUP_ICONS: Record<MuscleGroup, IconName> = {
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
  exercise: ExerciseImageInput;
  size?: number;
};

/** The user's photo, else the bundled start image, else a muscle-group icon on a tile. */
export function ExerciseThumb({ exercise, size = 44 }: ExerciseThumbProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const image = exerciseImageFor(exercise);
  const source =
    image.kind === 'photo' ? { uri: image.uri } : image.kind === 'bundled' ? image.start : null;
  // A deleted or unreadable photo falls back to the icon instead of a blank tile.
  const [failed, setFailed] = useState<unknown>(null);
  const showImage = source !== null && failed !== source;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(`muscleGroups.${exercise.muscleGroup}`)}
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <Image
          source={source}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory"
          onError={() => setFailed(source)}
        />
      ) : (
        <MaterialCommunityIcons
          name={MUSCLE_GROUP_ICONS[exercise.muscleGroup]}
          size={size * 0.55}
          color={theme.colors.primary}
        />
      )}
    </View>
  );
}

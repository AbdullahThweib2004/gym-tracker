import { useState } from 'react';
import { Image, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { MuscleGroup } from '@/constants/muscles';
import type { Exercise } from '@/db/schema';
import { useTheme } from '@/theme';

import { resolvePhotoUri } from '../photoStorage';

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
  exercise: Pick<Exercise, 'muscleGroup' | 'imageUri'>;
  size?: number;
};

/** The exercise's photo when it has one, otherwise a muscle-group icon on a tile. */
export function ExerciseThumb({ exercise, size = 44 }: ExerciseThumbProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const uri = resolvePhotoUri(exercise.imageUri);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPhoto = uri !== null && uri !== failedUri;

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
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          // A deleted or moved file falls back to the icon instead of a blank tile.
          onError={() => setFailedUri(uri)}
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

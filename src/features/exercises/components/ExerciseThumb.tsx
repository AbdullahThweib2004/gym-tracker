import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
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
  /** Fixed size in pt. Ignored with `fill`. */
  size?: number;
  /** Fill the parent's width as a square (grid cards). */
  fill?: boolean;
  /** Show a subtle "Add photo" hint on the icon tile (large tiles only). */
  showAddPhotoHint?: boolean;
  radius?: number;
};

export function muscleGroupIcon(muscleGroup: MuscleGroup): IconName {
  return MUSCLE_GROUP_ICONS[muscleGroup];
}

/**
 * The user's photo, else the bundled start image, else a designed muscle-icon tile. The box
 * always has its final size (fixed or square aspect ratio), so images fade in without any
 * layout jump.
 */
export function ExerciseThumb({
  exercise,
  size = 44,
  fill = false,
  showAddPhotoHint = false,
  radius,
}: ExerciseThumbProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const image = exerciseImageFor(exercise);
  const source =
    image.kind === 'photo' ? { uri: image.uri } : image.kind === 'bundled' ? image.start : null;
  // A deleted or unreadable photo falls back to the icon instead of a blank tile.
  const [failed, setFailed] = useState<unknown>(null);
  const showImage = source !== null && failed !== source;
  const box = fill ? { width: '100%' as const, aspectRatio: 1 } : { width: size, height: size };
  const iconSize = fill ? 40 : size * 0.5;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(`muscleGroups.${exercise.muscleGroup}`)}
      style={[
        box,
        {
          borderRadius: radius ?? (fill || size >= 64 ? theme.radius.lg : theme.radius.md),
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: showImage ? 0 : 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
      ]}
    >
      {showImage ? (
        <Image
          source={source}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory"
          onError={() => setFailed(source)}
        />
      ) : (
        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <View
            style={{
              width: iconSize * 1.6,
              height: iconSize * 1.6,
              borderRadius: theme.radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primaryMuted,
            }}
          >
            <MaterialCommunityIcons
              name={MUSCLE_GROUP_ICONS[exercise.muscleGroup]}
              size={iconSize}
              color={theme.colors.primary}
            />
          </View>
          {showAddPhotoHint ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <Ionicons name="camera-outline" size={12} color={theme.colors.textMuted} />
              <AppText variant="label" color="textMuted">
                {t('exercises.addPhotoHint')}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

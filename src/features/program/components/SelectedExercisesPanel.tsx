import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeOut } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { Sheet } from '@/components/Sheet';
import type { Exercise } from '@/db/schema';
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import type { DraftEntry } from '@/store/programDraftStore';
import { useLayoutTransition, useReduceMotion, useTheme } from '@/theme';

type SelectedSummaryButtonProps = {
  entries: readonly DraftEntry[];
  exercisesById: ReadonlyMap<number, Exercise>;
  onPress: () => void;
};

/** Footer button: "5 selected" with a stack of thumbnails; opens the selected list. */
export function SelectedSummaryButton({
  entries,
  exercisesById,
  onPress,
}: SelectedSummaryButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const thumbs = entries.slice(0, 3).flatMap((e) => {
    const exercise = exercisesById.get(e.exerciseId);
    return exercise ? [exercise] : [];
  });
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('onboarding.wizard.selectedCount', { count: entries.length })}
      accessibilityHint={t('onboarding.wizard.openSelectedHint')}
      disabled={entries.length === 0}
      onPress={onPress}
      haptic="light"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: 52,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        opacity: entries.length === 0 ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {thumbs.map((exercise, i) => (
          <View
            key={exercise.id}
            style={{
              marginStart: i === 0 ? 0 : -12,
              borderRadius: theme.radius.sm,
              borderWidth: 2,
              borderColor: theme.colors.surfaceElevated,
            }}
          >
            <ExerciseThumb exercise={exercise} size={32} radius={theme.radius.sm} />
          </View>
        ))}
      </View>
      <AppText variant="bodyStrong">
        {t('onboarding.wizard.selectedCount', { count: entries.length })}
      </AppText>
    </PressableScale>
  );
}

type SelectedExercisesSheetProps = {
  visible: boolean;
  onClose: () => void;
  entries: readonly DraftEntry[];
  exercisesById: ReadonlyMap<number, Exercise>;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

/** The day's selected exercises in order: reorder, edit sets/reps/rest, or remove. */
export function SelectedExercisesSheet({
  visible,
  onClose,
  entries,
  exercisesById,
  onMove,
  onEdit,
  onRemove,
}: SelectedExercisesSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const layout = useLayoutTransition();
  const language = useAppStore((s) => s.language);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('onboarding.wizard.selectedCount', { count: entries.length })}
      scrollable
    >
      <AppText variant="caption" color="textSecondary">
        {t('onboarding.wizard.selectedHint')}
      </AppText>
      <View style={{ gap: theme.spacing.sm }}>
        {entries.map((entry, index) => {
          const exercise = exercisesById.get(entry.exerciseId);
          const name = exercise ? exerciseName(exercise, language) : '';
          return (
            <Animated.View
              key={entry.exerciseId}
              layout={layout}
              exiting={reduceMotion ? undefined : FadeOut.duration(theme.motion.fast)}
              style={{
                gap: theme.spacing.xs,
                padding: theme.spacing.sm,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.wizard.editTargetsFor', { name })}
                onPress={() => onEdit(index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  minHeight: 48,
                }}
              >
                {exercise ? <ExerciseThumb exercise={exercise} size={44} /> : null}
                <AppText variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
                  {index + 1}. {name}
                </AppText>
              </PressableScale>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <AppText
                  variant="caption"
                  color="primary"
                  style={{ flex: 1, paddingStart: theme.spacing.xs }}
                >
                  {t('onboarding.wizard.targetSummary', {
                    sets: entry.targetSets,
                    min: entry.targetRepsMin,
                    max: entry.targetRepsMax,
                  })}
                </AppText>
                <IconButton
                  icon="chevron-up"
                  size={18}
                  variant="tonal"
                  onPress={() => onMove(index, -1)}
                  disabled={index === 0}
                  accessibilityLabel={t('onboarding.wizard.moveUp', { name })}
                />
                <IconButton
                  icon="chevron-down"
                  size={18}
                  variant="tonal"
                  onPress={() => onMove(index, 1)}
                  disabled={index === entries.length - 1}
                  accessibilityLabel={t('onboarding.wizard.moveDown', { name })}
                />
                <IconButton
                  icon="close"
                  size={18}
                  color="danger"
                  onPress={() => onRemove(index)}
                  accessibilityLabel={t('onboarding.wizard.removeNamed', { name })}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Sheet>
  );
}

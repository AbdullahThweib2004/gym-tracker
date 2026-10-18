import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import type { Exercise } from '@/db/schema';
import { exerciseName } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import type { DraftEntry } from '@/store/programDraftStore';
import { useTheme } from '@/theme';

type SelectedExercisesPanelProps = {
  entries: readonly DraftEntry[];
  exercisesById: ReadonlyMap<number, Exercise>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

export function SelectedExercisesPanel({
  entries,
  exercisesById,
  expanded,
  onToggleExpanded,
  onMove,
  onEdit,
  onRemove,
}: SelectedExercisesPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useAppStore((s) => s.language);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('onboarding.wizard.selectedCount', { count: entries.length })}
        onPress={onToggleExpanded}
        disabled={entries.length === 0}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
      >
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {t('onboarding.wizard.selectedCount', { count: entries.length })}
        </AppText>
        {entries.length > 0 ? (
          <>
            <AppText variant="caption" color="primary">
              {expanded ? t('onboarding.wizard.hideSelected') : t('onboarding.wizard.showSelected')}
            </AppText>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={theme.colors.primary}
            />
          </>
        ) : null}
      </Pressable>

      {expanded && entries.length > 0 ? (
        <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: theme.spacing.xs }}>
          {entries.map((entry, index) => {
            const exercise = exercisesById.get(entry.exerciseId);
            const name = exercise ? exerciseName(exercise, language) : '';
            return (
              <View
                key={entry.exerciseId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  paddingStart: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceElevated,
                }}
              >
                <AppText variant="caption" color="textMuted" style={{ minWidth: 18 }}>
                  {index + 1}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.wizard.editTargetsFor', { name })}
                  onPress={() => onEdit(index)}
                  style={{ flex: 1, paddingVertical: theme.spacing.sm }}
                >
                  <AppText variant="body" numberOfLines={1}>
                    {name}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {t('onboarding.wizard.targetSummary', {
                      sets: entry.targetSets,
                      min: entry.targetRepsMin,
                      max: entry.targetRepsMax,
                    })}
                  </AppText>
                </Pressable>
                <IconButton
                  icon="chevron-up"
                  size={18}
                  onPress={() => onMove(index, -1)}
                  disabled={index === 0}
                  accessibilityLabel={t('onboarding.wizard.moveUp', { name })}
                />
                <IconButton
                  icon="chevron-down"
                  size={18}
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
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

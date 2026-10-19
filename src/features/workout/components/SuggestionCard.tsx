import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import type { OverloadSuggestion } from '@/features/progress/overload';
import { formatWeight } from '@/i18n/format';
import { useTheme } from '@/theme';

type SuggestionCardProps = {
  suggestion: OverloadSuggestion;
  targetRepsMin: number;
  targetRepsMax: number;
  canApply: boolean;
  onApply: () => void;
};

/** Today's target. An increase gets the accent treatment: it is the reward for last session. */
export function SuggestionCard({
  suggestion,
  targetRepsMin,
  targetRepsMax,
  canApply,
  onApply,
}: SuggestionCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const increase = suggestion.reasonKey === 'increase';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: increase ? theme.colors.primary : theme.colors.border,
        backgroundColor: increase ? theme.colors.primarySoft : theme.colors.surface,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: increase ? theme.colors.primary : theme.colors.surfaceElevated,
        }}
      >
        <Ionicons
          name={increase ? 'trending-up' : 'repeat'}
          size={22}
          color={increase ? theme.colors.onPrimary : theme.colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <AppText variant="label" color={increase ? 'primary' : 'textSecondary'}>
          {t('progress.suggestionTitle')}
        </AppText>
        <AppText variant="caption">
          {t(`progress.suggestion.${suggestion.reasonKey}`, {
            weight: formatWeight(suggestion.weightKg),
            reps: targetRepsMax,
            min: targetRepsMin,
            max: targetRepsMax,
          })}
        </AppText>
      </View>
      {canApply ? (
        <Button
          label={t('progress.apply')}
          size="sm"
          variant={increase ? 'primary' : 'secondary'}
          haptic="light"
          onPress={onApply}
        />
      ) : null}
    </View>
  );
}

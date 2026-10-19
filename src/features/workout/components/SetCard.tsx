import { memo } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { NumberInput } from '@/components/NumberInput';
import { PressableScale } from '@/components/PressableScale';
import { MAX_REPS, MAX_WEIGHT_KG, WEIGHT_STEP_KG } from '@/constants/settings';
import { Confetti } from '@/features/progress/components/Confetti';
import { PrBadge } from '@/features/progress/components/PrBadge';
import type { RecordKind } from '@/features/progress/records';
import { formatSetCompact } from '@/i18n/format';
import { useTheme } from '@/theme';

import type { SetRow } from '../setRows';

export type SetCardMode = 'active' | 'pending' | 'done';

type SetCardProps = {
  /** Working-set number; null for warm-ups. */
  ordinal: number | null;
  row: SetRow;
  mode: SetCardMode;
  invalid?: { weight: boolean; reps: boolean };
  records?: readonly RecordKind[];
  onChangeWeight: (value: number | null) => void;
  onChangeReps: (value: number | null) => void;
  onConfirm: () => void;
  /** Make this the active set (pending), or start editing it (done). */
  onActivate: () => void;
  /** Options: warm-up / delete. */
  onOptions: () => void;
  onBlur?: () => void;
};

/**
 * One set. The active set is a large card with big numbers and one big "Log set" button, so
 * logging with the pre-filled values is a single tap. Others are compact rows.
 */
export const SetCard = memo(function SetCard({
  ordinal,
  row,
  mode,
  invalid,
  records,
  onChangeWeight,
  onChangeReps,
  onConfirm,
  onActivate,
  onOptions,
  onBlur,
}: SetCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const setName = ordinal === null ? t('workout.warmup') : t('workout.set', { number: ordinal });
  const values =
    row.weightKg !== null && row.reps !== null
      ? formatSetCompact(row.weightKg, row.reps)
      : t('workout.noValues');

  if (mode !== 'active') {
    const done = mode === 'done';
    const hasPR = done && records && records.length > 0;
    return (
      <View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${setName}, ${values}${done ? `, ${t('workout.logged')}` : ''}`}
          accessibilityHint={done ? t('workout.savedRowHint') : t('workout.pendingRowHint')}
          accessibilityActions={[{ name: 'longpress', label: t('workout.rowOptions') }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && onOptions()}
          onPress={onActivate}
          onLongPress={onOptions}
          delayLongPress={350}
          scaleTo={0.98}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            minHeight: 56,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: done ? theme.colors.successSoft : theme.colors.border,
            backgroundColor: done ? theme.colors.successSoft : theme.colors.background,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: theme.radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: done ? theme.colors.success : theme.colors.transparent,
              borderWidth: done ? 0 : 1.5,
              borderColor: theme.colors.borderStrong,
            }}
          >
            {done ? (
              <Ionicons name="checkmark" size={18} color={theme.colors.onSemantic} />
            ) : (
              <AppText variant="label" color="textMuted">
                {ordinal ?? t('workout.warmupShort')}
              </AppText>
            )}
          </View>
          <AppText variant="caption" color="textSecondary" style={{ minWidth: 64 }}>
            {setName}
          </AppText>
          <AppText
            variant="subheading"
            color={done ? 'textPrimary' : 'textMuted'}
            style={{ flex: 1 }}
          >
            {values}
          </AppText>
          {done && hasPR ? (
            <Ionicons
              name="trophy"
              size={18}
              color={theme.colors.primary}
              accessibilityLabel={t('records.newPR')}
            />
          ) : null}
        </PressableScale>
        {hasPR ? (
          <View style={{ paddingTop: theme.spacing.xs, paddingStart: theme.spacing.lg }}>
            <PrBadge records={records} />
            <Confetti />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <AppText variant="subheading" style={{ flex: 1 }} accessibilityRole="header">
          {setName}
        </AppText>
        {row.state === 'suggested' && row.weightKg !== null ? (
          <AppText variant="label" color="textMuted">
            {t('workout.prefilled')}
          </AppText>
        ) : null}
        <IconButton
          icon="ellipsis-horizontal"
          size={20}
          color="textSecondary"
          onPress={onOptions}
          accessibilityLabel={t('workout.rowOptions')}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <NumberInput
            size="big"
            label={t('workout.weightKg')}
            value={row.weightKg}
            onChange={onChangeWeight}
            onBlur={onBlur}
            allowDecimal
            step={WEIGHT_STEP_KG}
            max={MAX_WEIGHT_KG}
            compact
            muted={row.state === 'suggested'}
            invalid={invalid?.weight}
            placeholder="0"
            accessibilityLabel={`${setName}, ${t('workout.weight')}`}
            decrementLabel={t('workout.decreaseWeight')}
            incrementLabel={t('workout.increaseWeight')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumberInput
            size="big"
            label={t('workout.reps')}
            value={row.reps}
            onChange={onChangeReps}
            onBlur={onBlur}
            step={1}
            max={MAX_REPS}
            compact
            muted={row.state === 'suggested'}
            invalid={invalid?.reps}
            placeholder="0"
            accessibilityLabel={`${setName}, ${t('workout.reps')}`}
            decrementLabel={t('workout.decreaseReps')}
            incrementLabel={t('workout.increaseReps')}
          />
        </View>
      </View>
      {invalid ? (
        <AppText variant="caption" color="danger">
          {t('workout.invalidSet')}
        </AppText>
      ) : null}
      <Button
        label={row.setId === null ? t('workout.logSet') : t('workout.updateSet')}
        icon="checkmark-circle"
        size="lg"
        onPress={onConfirm}
        accessibilityHint={t('workout.logSetHint')}
        fullWidth
      />
    </View>
  );
});

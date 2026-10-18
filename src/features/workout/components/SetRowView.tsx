import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { NumberInput } from '@/components/NumberInput';
import { MAX_REPS, MAX_WEIGHT_KG, WEIGHT_STEP_KG } from '@/constants/settings';
import { useTheme } from '@/theme';

import { PrBadge } from '@/features/progress/components/PrBadge';
import type { RecordKind } from '@/features/progress/records';

import type { SetRow } from '../setRows';

type SetRowViewProps = {
  /** Working-set number shown in the row; null for warm-ups. */
  ordinal: number | null;
  row: SetRow;
  invalid?: { weight: boolean; reps: boolean };
  onChangeWeight: (value: number | null) => void;
  onChangeReps: (value: number | null) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onLongPress: () => void;
  /** Records this set broke when it was confirmed (shows the PR badge). */
  records?: readonly RecordKind[];
};

export function SetRowView({
  ordinal,
  row,
  invalid,
  onChangeWeight,
  onChangeReps,
  onConfirm,
  onEdit,
  onLongPress,
  records,
}: SetRowViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const saved = row.state === 'saved';
  const muted = row.state === 'suggested';
  const setLabel = ordinal === null ? t('workout.warmupShort') : String(ordinal);
  const a11ySet = ordinal === null ? t('workout.warmup') : t('workout.set', { number: ordinal });

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Pressable
        onPress={saved ? onEdit : undefined}
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityLabel={a11ySet}
        accessibilityHint={saved ? t('workout.savedRowHint') : t('workout.rowHint')}
        accessibilityActions={[
          { name: 'activate', label: t('common.edit') },
          { name: 'longpress', label: t('workout.rowOptions') },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'longpress') onLongPress();
          else if (saved) onEdit();
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: saved ? theme.colors.success : theme.colors.transparent,
          backgroundColor: saved ? theme.colors.successSoft : theme.colors.transparent,
        }}
      >
        <AppText
          variant="bodyStrong"
          color={row.isWarmup ? 'warning' : 'textSecondary'}
          align="center"
          style={{ width: 24 }}
        >
          {setLabel}
        </AppText>
        {/* While saved the row itself takes taps (to start editing), not the inputs. */}
        <View style={{ flex: 1.15 }} pointerEvents={saved ? 'none' : 'auto'}>
          <NumberInput
            value={row.weightKg}
            onChange={onChangeWeight}
            allowDecimal
            step={WEIGHT_STEP_KG}
            max={MAX_WEIGHT_KG}
            compact
            muted={muted}
            editable={!saved}
            invalid={invalid?.weight}
            placeholder={t('common.units.kg')}
            accessibilityLabel={`${a11ySet}, ${t('workout.weight')}`}
            decrementLabel={t('workout.decreaseWeight')}
            incrementLabel={t('workout.increaseWeight')}
          />
        </View>
        <View style={{ flex: 1 }} pointerEvents={saved ? 'none' : 'auto'}>
          <NumberInput
            value={row.reps}
            onChange={onChangeReps}
            step={1}
            max={MAX_REPS}
            compact
            muted={muted}
            editable={!saved}
            invalid={invalid?.reps}
            placeholder={t('common.units.reps')}
            accessibilityLabel={`${a11ySet}, ${t('workout.reps')}`}
            decrementLabel={t('workout.decreaseReps')}
            incrementLabel={t('workout.increaseReps')}
          />
        </View>
        <IconButton
          icon={saved ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={30}
          color={saved ? 'success' : row.state === 'edited' ? 'primary' : 'textSecondary'}
          onPress={saved ? onEdit : onConfirm}
          accessibilityLabel={
            saved
              ? t('workout.editSet', { set: a11ySet })
              : t('workout.confirmSet', { set: a11ySet })
          }
        />
      </Pressable>
      {records && records.length > 0 && row.state === 'saved' ? (
        <PrBadge records={records} />
      ) : null}
    </View>
  );
}

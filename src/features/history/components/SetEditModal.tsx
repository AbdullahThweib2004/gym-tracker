import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { NumberInput } from '@/components/NumberInput';
import { MAX_REPS, MAX_WEIGHT_KG, WEIGHT_STEP_KG } from '@/constants/settings';
import { validateRow } from '@/features/workout/setRows';
import { useTheme } from '@/theme';

type SetEditModalProps = {
  title: string;
  initial: { weightKg: number; reps: number };
  onSave: (values: { weightKg: number; reps: number }) => void;
  onDelete: () => void;
  onClose: () => void;
};

/** Edit or delete one logged set. Mount it only while editing so it starts from `initial`. */
export function SetEditModal({ title, initial, onSave, onDelete, onClose }: SetEditModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [weightKg, setWeight] = useState<number | null>(initial.weightKg);
  const [reps, setReps] = useState<number | null>(initial.reps);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const validation = validateRow({ weightKg, reps });

  return (
    <Sheet visible onClose={onClose} title={title}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <NumberInput
            size="big"
            label={t('workout.weightKg')}
            value={weightKg}
            onChange={setWeight}
            allowDecimal
            step={WEIGHT_STEP_KG}
            max={MAX_WEIGHT_KG}
            compact
            invalid={!validation.ok && validation.weight}
            accessibilityLabel={t('workout.weight')}
            decrementLabel={t('workout.decreaseWeight')}
            incrementLabel={t('workout.increaseWeight')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumberInput
            size="big"
            label={t('workout.reps')}
            value={reps}
            onChange={setReps}
            step={1}
            max={MAX_REPS}
            compact
            invalid={!validation.ok && validation.reps}
            accessibilityLabel={t('workout.reps')}
            decrementLabel={t('workout.decreaseReps')}
            incrementLabel={t('workout.increaseReps')}
          />
        </View>
      </View>
      <Button
        label={t('common.save')}
        icon="checkmark"
        size="lg"
        haptic="success"
        onPress={() =>
          validation.ok && onSave({ weightKg: validation.weightKg, reps: validation.reps })
        }
        disabled={!validation.ok}
        fullWidth
      />
      {/* Deleting asks for a second tap here instead of stacking another dialog. */}
      {confirmingDelete ? (
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="caption" color="danger" align="center">
            {t('history.deleteSetMessage')}
          </AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={() => setConfirmingDelete(false)}
              style={{ flex: 1 }}
            />
            <Button
              label={t('common.delete')}
              variant="danger"
              icon="trash"
              haptic="warning"
              onPress={onDelete}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <Button
          label={t('workout.deleteSet')}
          variant="ghost"
          icon="trash-outline"
          onPress={() => setConfirmingDelete(true)}
          fullWidth
        />
      )}
    </Sheet>
  );
}

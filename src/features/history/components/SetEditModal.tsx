import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
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
  const validation = validateRow({ weightKg, reps });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Bottom sheet with inputs: lift it above the keyboard on both platforms. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => undefined}
            accessible={false}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopStartRadius: theme.radius.xl,
              borderTopEndRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              paddingBottom: theme.spacing.xxl,
              gap: theme.spacing.lg,
            }}
          >
            <AppText variant="subheading">{title}</AppText>
            <NumberInput
              label={t('workout.weightKg')}
              value={weightKg}
              onChange={setWeight}
              allowDecimal
              step={WEIGHT_STEP_KG}
              max={MAX_WEIGHT_KG}
              invalid={!validation.ok && validation.weight}
              accessibilityLabel={t('workout.weight')}
              decrementLabel={t('workout.decreaseWeight')}
              incrementLabel={t('workout.increaseWeight')}
            />
            <NumberInput
              label={t('workout.reps')}
              value={reps}
              onChange={setReps}
              step={1}
              max={MAX_REPS}
              invalid={!validation.ok && validation.reps}
              accessibilityLabel={t('workout.reps')}
              decrementLabel={t('workout.decreaseReps')}
              incrementLabel={t('workout.increaseReps')}
            />
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                label={t('workout.deleteSet')}
                variant="ghost"
                icon="trash-outline"
                onPress={onDelete}
                style={{ flex: 1 }}
              />
              <Button
                label={t('common.save')}
                onPress={() =>
                  validation.ok && onSave({ weightKg: validation.weightKg, reps: validation.reps })
                }
                disabled={!validation.ok}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

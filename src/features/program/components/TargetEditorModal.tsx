import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';
import {
  TARGET_REPS_MAX,
  TARGET_REPS_MIN,
  TARGET_SETS_MAX,
  TARGET_SETS_MIN,
} from '@/constants/settings';
import { useTheme } from '@/theme';

import { formatRestSeconds } from '@/i18n/format';
import {
  REST_ADJUST_SECONDS,
  REST_MAX_SECONDS,
  snapRestSeconds,
} from '@/features/restTimer/restMath';

import { normalizeTargets, type ExerciseTargets } from '../targets';

type TargetEditorModalProps = {
  visible: boolean;
  title: string;
  targets: ExerciseTargets;
  onChange: (targets: ExerciseTargets) => void;
  /** Rest after each set; null means "use the default from Settings". */
  restSeconds: number | null;
  onChangeRest: (restSeconds: number | null) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function TargetEditorModal({
  visible,
  title,
  targets,
  onChange,
  restSeconds,
  onChangeRest,
  onRemove,
  onClose,
}: TargetEditorModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const stepLabels = { decrementLabel: t('common.decrease'), incrementLabel: t('common.increase') };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.done')}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
      >
        {/* Inner Pressable swallows taps so they don't close the sheet. */}
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
          <AppText variant="subheading" numberOfLines={2}>
            {title}
          </AppText>
          <Stepper
            label={t('onboarding.wizard.targetSets')}
            value={targets.targetSets}
            min={TARGET_SETS_MIN}
            max={TARGET_SETS_MAX}
            onChange={(targetSets) => onChange(normalizeTargets({ ...targets, targetSets }))}
            {...stepLabels}
          />
          <Stepper
            label={t('onboarding.wizard.repsMin')}
            value={targets.targetRepsMin}
            min={TARGET_REPS_MIN}
            max={TARGET_REPS_MAX}
            onChange={(targetRepsMin) =>
              onChange(normalizeTargets({ ...targets, targetRepsMin }, 'min'))
            }
            {...stepLabels}
          />
          <Stepper
            label={t('onboarding.wizard.repsMax')}
            value={targets.targetRepsMax}
            min={TARGET_REPS_MIN}
            max={TARGET_REPS_MAX}
            onChange={(targetRepsMax) =>
              onChange(normalizeTargets({ ...targets, targetRepsMax }, 'max'))
            }
            {...stepLabels}
          />
          <Stepper
            label={t('restTimer.restPerSet')}
            value={restSeconds ?? 0}
            min={0}
            max={REST_MAX_SECONDS}
            step={REST_ADJUST_SECONDS}
            formatValue={(seconds) =>
              seconds === 0 ? t('restTimer.useDefault') : formatRestSeconds(seconds)
            }
            onChange={(next) => onChangeRest(snapRestSeconds(restSeconds ?? 0, next))}
            {...stepLabels}
          />
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              label={t('onboarding.wizard.remove')}
              variant="ghost"
              icon="trash-outline"
              onPress={onRemove}
              style={{ flex: 1 }}
            />
            <Button label={t('common.done')} onPress={onClose} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

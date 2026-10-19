import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Sheet } from './Sheet';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirmation in a bottom sheet (thumb-reachable; replaces Alert dialogs). */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {message ? <AppText color="textSecondary">{message}</AppText> : null}
      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          size="lg"
          haptic={destructive ? 'warning' : 'medium'}
          onPress={() => {
            onClose();
            onConfirm();
          }}
          fullWidth
        />
        <Button label={cancelLabel} variant="secondary" onPress={onClose} fullWidth />
      </View>
    </Sheet>
  );
}

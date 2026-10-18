import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { HapticKind } from './haptics';
import { PressableScale } from './PressableScale';

type CardTone = 'default' | 'accent' | 'warning' | 'success';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  tone?: CardTone;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  haptic?: HapticKind;
};

/** Surface container (radius 20). Pressable when `onPress` is set. */
export function Card({
  children,
  onPress,
  onLongPress,
  style,
  tone = 'default',
  accessibilityLabel,
  accessibilityHint,
  haptic,
}: CardProps) {
  const theme = useTheme();
  const tones: Record<CardTone, { bg: string; border: string }> = {
    default: { bg: theme.colors.surface, border: theme.colors.border },
    accent: { bg: theme.colors.primarySoft, border: theme.colors.primary },
    warning: { bg: theme.colors.warningSoft, border: theme.colors.warning },
    success: { bg: theme.colors.successSoft, border: theme.colors.success },
  };
  const base: ViewStyle = {
    backgroundColor: tones[tone].bg,
    borderColor: tones[tone].border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  };

  if (!onPress && !onLongPress) return <View style={[base, style]}>{children}</View>;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onLongPress={onLongPress}
      haptic={haptic}
      scaleTo={0.985}
      style={({ pressed }) => [
        base,
        pressed && tone === 'default' && { backgroundColor: theme.colors.surfaceElevated },
        style,
      ]}
    >
      {children}
    </PressableScale>
  );
}

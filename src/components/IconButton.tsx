import type { ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, type ColorToken } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import type { HapticKind } from './haptics';
import { PressableScale } from './PressableScale';

type IconButtonVariant = 'plain' | 'tonal' | 'filled';

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: ColorToken;
  /** Mirror the icon in RTL. Use for arrows, chevrons and other directional glyphs. */
  directional?: boolean;
  disabled?: boolean;
  /** @deprecated use variant="tonal" */
  filled?: boolean;
  variant?: IconButtonVariant;
  haptic?: HapticKind;
  style?: ViewStyle;
};

/** Icon-only button with a touch target of at least 44 pt. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 22,
  color = 'textPrimary',
  directional = false,
  disabled = false,
  filled = false,
  variant = filled ? 'tonal' : 'plain',
  haptic,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const box = Math.max(theme.touchTarget, size + theme.spacing.lg);
  const background = (pressed: boolean): string => {
    if (variant === 'filled') return pressed ? theme.colors.primaryPressed : theme.colors.primary;
    if (variant === 'tonal')
      return pressed ? theme.colors.surfaceHighlight : theme.colors.surfaceElevated;
    return pressed ? theme.colors.surfaceElevated : theme.colors.transparent;
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={theme.spacing.xs}
      onPress={onPress}
      haptic={haptic}
      scaleTo={0.92}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background(pressed),
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={size}
        color={variant === 'filled' ? theme.colors.onPrimary : theme.colors[color]}
        style={directional ? mirrorInRtl() : undefined}
      />
    </PressableScale>
  );
}

import { Pressable, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, type ColorToken } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: ColorToken;
  /** Mirror the icon in RTL. Use for arrows, chevrons and other directional glyphs. */
  directional?: boolean;
  disabled?: boolean;
  filled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 22,
  color = 'textPrimary',
  directional = false,
  disabled = false,
  filled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const box = size + theme.spacing.lg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={theme.spacing.sm}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            pressed || filled ? theme.colors.surfaceElevated : theme.colors.transparent,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={size}
        color={theme.colors[color]}
        style={directional ? mirrorInRtl() : undefined}
      />
    </Pressable>
  );
}

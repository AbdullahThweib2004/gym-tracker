import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, type ColorToken } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { AppText } from './AppText';
import type { HapticKind } from './haptics';
import { PressableScale } from './PressableScale';

const DIRECTIONAL_ICON = /^(arrow|chevron)-(forward|back)|^arrow-(undo|redo)/;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  haptic?: HapticKind;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 52, lg: 60 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityHint,
  haptic,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<
    ButtonVariant,
    { bg: ColorToken; pressed: ColorToken; fg: ColorToken; border?: ColorToken }
  > = {
    primary: { bg: 'primary', pressed: 'primaryPressed', fg: 'onPrimary' },
    secondary: {
      bg: 'surfaceElevated',
      pressed: 'surfaceHighlight',
      fg: 'textPrimary',
      border: 'border',
    },
    ghost: { bg: 'transparent', pressed: 'surfaceElevated', fg: 'primary' },
    danger: { bg: 'dangerSoft', pressed: 'surfaceHighlight', fg: 'danger' },
  };
  const { bg, pressed, fg, border } = palette[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      haptic={haptic}
      style={({ pressed: isPressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          backgroundColor: theme.colors[isPressed ? pressed : bg],
          borderRadius: theme.radius.md,
          paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.lg,
          opacity: isDisabled ? 0.45 : 1,
          borderWidth: border ? 1 : 0,
          borderColor: border ? theme.colors[border] : undefined,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[fg]} />
      ) : (
        <View style={[styles.content, { gap: theme.spacing.sm }]}>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 22 : 18}
              color={theme.colors[fg]}
              style={DIRECTIONAL_ICON.test(icon) ? mirrorInRtl() : undefined}
            />
          ) : null}
          <AppText
            variant={size === 'lg' ? 'subheading' : 'bodyStrong'}
            color={fg}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center' },
  fullWidth: { alignSelf: 'stretch' },
});

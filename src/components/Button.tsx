import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, type ColorToken } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { AppText } from './AppText';

const DIRECTIONAL_ICON = /^(arrow|chevron)-(forward|back)|^arrow-(undo|redo)/;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: ColorToken; pressed: ColorToken; fg: ColorToken }> = {
    primary: { bg: 'primary', pressed: 'primaryPressed', fg: 'onPrimary' },
    secondary: { bg: 'surfaceElevated', pressed: 'border', fg: 'textPrimary' },
    ghost: { bg: 'transparent', pressed: 'surface', fg: 'primary' },
    danger: { bg: 'danger', pressed: 'danger', fg: 'onPrimary' },
  };
  const { bg, pressed, fg } = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors[isPressed ? pressed : bg],
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === 'secondary' && { borderColor: theme.colors.border, borderWidth: 1 },
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
              size={18}
              color={theme.colors[fg]}
              style={DIRECTIONAL_ICON.test(icon) ? mirrorInRtl() : undefined}
            />
          ) : null}
          <AppText variant="bodyStrong" color={fg}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center' },
  fullWidth: { alignSelf: 'stretch' },
});

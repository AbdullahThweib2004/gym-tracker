import type { ReactNode } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Custom leading element (e.g. a small image), replaces `icon`. */
  leading?: ReactNode;
};

/** A pill. Interactive (toggle) when `onPress` is set, otherwise a static tag. */
export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
  icon,
  leading,
}: ChipProps) {
  const theme = useTheme();
  const fg = selected ? theme.colors.onPrimary : theme.colors.textSecondary;
  const style = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    minHeight: onPress ? 36 : 26,
    paddingHorizontal: onPress ? theme.spacing.md : theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
  };
  const content = (
    <>
      {leading ?? (icon ? <Ionicons name={icon} size={14} color={fg} /> : null)}
      <AppText variant="label" color={selected ? 'onPrimary' : 'textSecondary'} numberOfLines={1}>
        {label}
      </AppText>
    </>
  );

  // A static tag is a plain View: on web a pressable is a <button>, and chips often sit inside
  // pressable cards, where nested buttons are invalid.
  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      haptic="selection"
      // Visual pill stays compact; the hit area still reaches 44 pt.
      hitSlop={{ top: 4, bottom: 4 }}
      style={style}
    >
      {content}
    </PressableScale>
  );
}

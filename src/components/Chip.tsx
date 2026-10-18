import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A small pill. Interactive (toggle) when `onPress` is set, otherwise a static tag. */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const theme = useTheme();
  const style = {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
  };
  const text = (
    <AppText variant="label" color={selected ? 'onPrimary' : 'textSecondary'}>
      {label}
    </AppText>
  );

  // A static tag is a plain View: on web a Pressable is a <button>, and chips often sit inside
  // pressable cards, where nested buttons are invalid.
  if (!onPress) return <View style={style}>{text}</View>;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={theme.spacing.xs}
      style={({ pressed }) => [
        style,
        pressed && !selected && { backgroundColor: theme.colors.border },
      ]}
    >
      {text}
    </Pressable>
  );
}

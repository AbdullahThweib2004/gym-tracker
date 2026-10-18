import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decrementLabel: string;
  incrementLabel: string;
  step?: number;
  /** Display text for the value (defaults to the number). */
  formatValue?: (value: number) => string;
};

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
  step = 1,
  formatValue = String,
}: StepperProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
      }}
    >
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.xs,
        }}
      >
        <IconButton
          icon="remove"
          size={20}
          variant="tonal"
          haptic="selection"
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          accessibilityLabel={`${decrementLabel} ${label}`}
        />
        <AppText
          variant="numberSmall"
          align="center"
          accessibilityLiveRegion="polite"
          style={{ minWidth: 48 }}
        >
          {formatValue(value)}
        </AppText>
        <IconButton
          icon="add"
          size={20}
          variant="tonal"
          haptic="selection"
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          accessibilityLabel={`${incrementLabel} ${label}`}
        />
      </View>
    </View>
  );
}

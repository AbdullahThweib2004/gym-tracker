import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type StepDotsProps = {
  /** Zero-based index of the current step. */
  current: number;
  total: number;
  label: string;
};

export function StepDots({ current, total, label }: StepDotsProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={{
              width: index === current ? 20 : 8,
              height: 8,
              borderRadius: theme.radius.pill,
              backgroundColor: index <= current ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

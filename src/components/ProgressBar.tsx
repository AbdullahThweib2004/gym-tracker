import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReduceMotion, useTheme, type ColorToken } from '@/theme';

type ProgressBarProps = {
  /** 0 → 1 */
  value: number;
  height?: number;
  color?: ColorToken;
  accessibilityLabel?: string;
};

/** Thin rounded bar that animates to its value. Fills from the start edge in both directions. */
export function ProgressBar({
  value,
  height = 6,
  color = 'primary',
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const clamped = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    progress.set(reduceMotion ? clamped : withTiming(clamped, { duration: theme.motion.normal }));
  }, [clamped, reduceMotion, progress, theme.motion.normal]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceHighlight,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { height, borderRadius: theme.radius.pill, backgroundColor: theme.colors[color] },
          fill,
        ]}
      />
    </View>
  );
}

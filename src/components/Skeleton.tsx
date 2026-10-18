import { useEffect, useState } from 'react';
import { Animated, type DimensionValue } from 'react-native';

import { useTheme } from '@/theme';

type SkeletonProps = { width?: DimensionValue; height?: number };

/** A softly pulsing placeholder block shown while content loads. */
export function Skeleton({ width = '100%', height = 16 }: SkeletonProps) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height,
        opacity,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    />
  );
}

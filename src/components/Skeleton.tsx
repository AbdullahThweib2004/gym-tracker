import { useEffect, useState } from 'react';
import { View, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion, useTheme } from '@/theme';

type SkeletonProps = { width?: DimensionValue; height?: number; radius?: number };

/** Placeholder block with a soft shimmer sweep while content loads (static with Reduce Motion). */
export function Skeleton({ width = '100%', height = 16, radius }: SkeletonProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [boxWidth, setBoxWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || boxWidth === 0) return;
    progress.set(
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
  }, [reduceMotion, boxWidth, progress]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: -boxWidth + progress.get() * boxWidth * 2 }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setBoxWidth(event.nativeEvent.layout.width)}
      style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: radius ?? theme.radius.sm,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      {!reduceMotion && boxWidth > 0 ? (
        <Animated.View
          style={[{ position: 'absolute', top: 0, bottom: 0, width: boxWidth }, sweep]}
        >
          <LinearGradient
            colors={[theme.colors.transparent, theme.colors.shimmer, theme.colors.transparent]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

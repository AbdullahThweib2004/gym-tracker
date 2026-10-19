import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion, useTheme } from '@/theme';

const PARTICLES = 12;

function Particle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / PARTICLES) * Math.PI * 2;
  const distance = 36 + (index % 3) * 14;

  useEffect(() => {
    progress.set(
      withDelay(
        (index % 4) * 20,
        withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: 1 - p,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p - 12 * p },
        { scale: 1 - 0.4 * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 7,
          height: 7,
          borderRadius: index % 2 ? 2 : 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** A small one-time burst for personal records. Nothing with Reduce Motion. */
export function Confetti() {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  if (reduceMotion) return null;
  const colors = [theme.colors.primary, theme.colors.warning, theme.colors.success];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        start: 0,
        end: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: PARTICLES }, (_, i) => (
        <Particle key={i} index={i} color={colors[i % colors.length]!} />
      ))}
    </View>
  );
}

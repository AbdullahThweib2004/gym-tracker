import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion, useReduceMotion } from '@/theme';

import { haptic as fireHaptic, type HapticKind } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children?: ReactNode;
  /** Scale while pressed (1 disables the effect). */
  scaleTo?: number;
  /** Haptic fired on press, for important actions. */
  haptic?: HapticKind;
};

/**
 * The base of every tappable: a slight scale-down while pressed (skipped with Reduce Motion)
 * and optional haptic feedback.
 */
export function PressableScale({
  style,
  scaleTo = motion.pressScale,
  haptic,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        if (!reduceMotion && scaleTo !== 1) scale.set(withTiming(scaleTo, { duration: 90 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        scale.set(withSpring(1, motion.spring));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) fireHaptic(haptic);
        onPress?.(event);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

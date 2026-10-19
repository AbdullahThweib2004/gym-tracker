import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useReduceMotion, useTheme } from '@/theme';

import { AppText } from './AppText';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Use for long content; the sheet then scrolls within 85% of the screen height. */
  scrollable?: boolean;
  /** Called after the closing animation, once the sheet is gone (safe to open another one). */
  onClosed?: () => void;
};

/** Distance (pt) or speed that dismisses the sheet when dragged down. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

/**
 * Themed bottom sheet: slides up over a dimmed backdrop; drag the handle area down, tap the
 * backdrop or use Back (Android) to close. Built on Modal + Reanimated + Gesture Handler, so
 * it works in Expo Go on iOS, Android and web. Fades instead of sliding with Reduce Motion.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  scrollable = false,
  onClosed,
}: SheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // Stay mounted while the closing animation runs.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  // An effect event: always calls the latest onClosed without restarting the animation.
  const finishClose = useEffectEvent(() => {
    setMounted(false);
    onClosed?.();
  });
  const translateY = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdrop.set(withTiming(1, { duration: theme.motion.normal }));
      translateY.set(
        reduceMotion
          ? withTiming(0, { duration: theme.motion.fast })
          : withSpring(0, theme.motion.spring),
      );
    } else if (mounted) {
      backdrop.set(withTiming(0, { duration: theme.motion.fast }));
      translateY.set(
        withTiming(
          reduceMotion ? 0 : screenHeight,
          { duration: theme.motion.normal, easing: Easing.in(Easing.cubic) },
          () => runOnJS(finishClose)(),
        ),
      );
    }
  }, [visible, mounted, reduceMotion, screenHeight, translateY, backdrop, theme.motion]);

  const drag = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((event) => {
      translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
      } else {
        translateY.set(withSpring(0, theme.motion.spring));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
    opacity: reduceMotion ? backdrop.get() : 1,
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  const content = (
    <View
      style={{
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: insets.bottom + theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      {title ? (
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/* A Modal is a separate native window, so it needs its own gesture root. */}
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay },
            backdropStyle,
          ]}
        >
          <Pressable
            style={styles.fill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <KeyboardAvoidingView
          style={styles.bottom}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              {
                maxHeight: screenHeight * 0.85,
                backgroundColor: theme.colors.surface,
                borderTopStartRadius: theme.radius.xl,
                borderTopEndRadius: theme.radius.xl,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: theme.colors.border,
              },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={drag}>
              <View
                style={{
                  alignItems: 'center',
                  paddingTop: theme.spacing.md,
                  paddingBottom: theme.spacing.lg,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 5,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.borderStrong,
                  }}
                />
              </View>
            </GestureDetector>
            {scrollable ? (
              <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView>
            ) : (
              content
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bottom: { flex: 1, justifyContent: 'flex-end' },
});

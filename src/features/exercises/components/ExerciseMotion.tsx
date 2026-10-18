import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { useTheme } from '@/theme';

import { exerciseImageFor, type ExerciseImageInput } from '../useExerciseImage';

/** Each position is shown for ~1.2 s: a 300 ms cross-fade plus 900 ms hold. */
const FADE_MS = 300;
const HOLD_MS = 900;

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => mounted && setReduce(value));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

type ExerciseMotionProps = {
  exercise: ExerciseImageInput;
  height?: number;
  accessibilityLabel: string;
};

/**
 * A larger exercise image. Bundled images cross-fade between the start and end position to
 * show the movement (paused when the screen isn't focused, static with Reduce Motion).
 * Tap to open a full-screen view of both positions. Renders nothing without an image.
 */
export function ExerciseMotion({
  exercise,
  height = 200,
  accessibilityLabel,
}: ExerciseMotionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const image = exerciseImageFor(exercise);
  const reduceMotion = useReduceMotion();
  const [focused, setFocused] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [endOpacity] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const animate = image.kind === 'bundled' && focused && !reduceMotion && !viewerOpen;
  useEffect(() => {
    if (!animate) {
      endOpacity.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(HOLD_MS),
        Animated.timing(endOpacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
        Animated.delay(HOLD_MS),
        Animated.timing(endOpacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, endOpacity]);

  if (image.kind === 'icon') return null;

  const frame = {
    height,
    borderRadius: theme.radius.lg,
    overflow: 'hidden' as const,
    backgroundColor: theme.colors.surfaceElevated,
  };
  const fill = { position: 'absolute' as const, top: 0, bottom: 0, start: 0, end: 0 };

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={t('exercises.motion.openHint')}
        onPress={() => setViewerOpen(true)}
        style={frame}
      >
        {image.kind === 'photo' ? (
          <Image
            source={{ uri: image.uri }}
            style={fill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory"
          />
        ) : (
          <>
            <Image
              source={image.start}
              style={fill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory"
            />
            <Animated.View style={[fill, { opacity: endOpacity }]}>
              <Image
                source={image.end}
                style={{ flex: 1 }}
                contentFit="cover"
                cachePolicy="memory"
              />
            </Animated.View>
          </>
        )}
      </Pressable>

      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            paddingTop: theme.spacing.xxxl,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <IconButton
              icon="close"
              onPress={() => setViewerOpen(false)}
              accessibilityLabel={t('common.close')}
            />
          </View>
          <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
            {(image.kind === 'photo'
              ? [{ source: { uri: image.uri }, label: null }]
              : [
                  { source: image.start, label: t('exercises.motion.start') },
                  { source: image.end, label: t('exercises.motion.end') },
                ]
            ).map(({ source, label }, index) => (
              <View key={index} style={{ gap: theme.spacing.xs }}>
                {label ? (
                  <AppText variant="label" color="textSecondary">
                    {label}
                  </AppText>
                ) : null}
                <Image
                  source={source}
                  style={{ width: '100%', aspectRatio: 3 / 2, borderRadius: theme.radius.lg }}
                  contentFit="contain"
                  cachePolicy="memory"
                  accessibilityLabel={label ?? accessibilityLabel}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

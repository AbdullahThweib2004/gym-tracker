import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { formatClock, ltr } from '@/i18n/format';
import { useLayoutTransition, useReduceMotion, useTheme } from '@/theme';

import { REST_ADJUST_SECONDS, remainingFraction, remainingMs } from './restMath';
import { useRestTimerStore } from './restTimerStore';
import { useNow } from './useNow';

const RING = 34;
const STROKE = 3;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Countdown pill with a progress ring. It is the only part that re-renders while ticking. */
function RestPill({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const timer = useRestTimerStore((s) => s.timer);
  const now = useNow(timer !== null);
  if (!timer || now >= timer.endAt) return null;

  const fraction = remainingFraction(timer.endAt, timer.totalMs, now);
  const clock = ltr(formatClock(Math.ceil(remainingMs(timer.endAt, now) / 1000) * 1000));

  return (
    <PressableScale
      accessibilityRole="timer"
      accessibilityLabel={t('restTimer.remaining', { time: clock })}
      accessibilityHint={expanded ? t('restTimer.collapseHint') : t('restTimer.expandHint')}
      accessibilityState={{ expanded }}
      onPress={onToggle}
      haptic="selection"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: 52,
        paddingStart: theme.spacing.sm,
        paddingEnd: theme.spacing.md,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryMuted,
      }}
    >
      <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          stroke={theme.colors.surfaceHighlight}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          stroke={theme.colors.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </Svg>
      <AppText variant="numberSmall" color="primary">
        {clock}
      </AppText>
    </PressableScale>
  );
}

type RestTimerDockProps = {
  /** Footer content next to the pill (e.g. the "Next exercise" button). */
  trailing?: ReactNode;
};

/**
 * Bottom dock: the rest pill (when resting) beside the footer action. Tapping the pill reveals
 * −15 s / +15 s / Skip above it, so it never covers the inputs.
 */
export function RestTimerDock({ trailing }: RestTimerDockProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const layout = useLayoutTransition();
  const active = useRestTimerStore((s) => s.timer !== null);
  const adjust = useRestTimerStore((s) => s.adjust);
  const stop = useRestTimerStore((s) => s.stop);
  const [expanded, setExpanded] = useState(false);
  const showControls = active && expanded;

  if (!active && !trailing) return null;

  return (
    <Animated.View
      layout={layout}
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      {showControls ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(theme.motion.fast)}
          exiting={reduceMotion ? undefined : FadeOut.duration(theme.motion.fast)}
          style={{ flexDirection: 'row', gap: theme.spacing.sm }}
        >
          <Button
            label={ltr(t('restTimer.minus', { s: REST_ADJUST_SECONDS }))}
            variant="secondary"
            size="sm"
            onPress={() => void adjust(-REST_ADJUST_SECONDS)}
            style={{ flex: 1 }}
          />
          <Button
            label={ltr(t('restTimer.plus', { s: REST_ADJUST_SECONDS }))}
            variant="secondary"
            size="sm"
            onPress={() => void adjust(REST_ADJUST_SECONDS)}
            style={{ flex: 1 }}
          />
          <Button
            label={t('restTimer.skip')}
            variant="ghost"
            size="sm"
            onPress={() => {
              setExpanded(false);
              void stop();
            }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <RestPill expanded={showControls} onToggle={() => setExpanded((v) => !v)} />
        {trailing ? <View style={{ flex: 1 }}>{trailing}</View> : null}
      </View>
    </Animated.View>
  );
}

import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { formatClock, ltr } from '@/i18n/format';
import { useTheme } from '@/theme';

import { REST_ADJUST_SECONDS, remainingFraction, remainingMs } from './restMath';
import { useRestTimerStore } from './restTimerStore';
import { useNow } from './useNow';

/** Floating rest countdown; renders nothing while no rest is running. */
export function RestTimerBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const timer = useRestTimerStore((s) => s.timer);
  const adjust = useRestTimerStore((s) => s.adjust);
  const stop = useRestTimerStore((s) => s.stop);
  const now = useNow(timer !== null);

  if (!timer || now >= timer.endAt) return null;
  const left = remainingMs(timer.endAt, now);
  const fraction = remainingFraction(timer.endAt, timer.totalMs, now);
  // Round up so "0:00" is never shown while time is left.
  const clock = ltr(formatClock(Math.ceil(left / 1000) * 1000));

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={t('restTimer.remaining', { time: clock })}
      style={{
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Ionicons name="hourglass-outline" size={18} color={theme.colors.primary} />
        <AppText variant="label" color="textSecondary" style={{ flex: 1 }}>
          {t('restTimer.title')}
        </AppText>
        <AppText variant="heading" color="primary" style={{ fontVariant: ['tabular-nums'] }}>
          {clock}
        </AppText>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(fraction * 100)}%`,
            height: '100%',
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primary,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Button
          label={ltr(t('restTimer.minus', { s: REST_ADJUST_SECONDS }))}
          variant="secondary"
          onPress={() => void adjust(-REST_ADJUST_SECONDS)}
          style={{ flex: 1 }}
        />
        <Button
          label={ltr(t('restTimer.plus', { s: REST_ADJUST_SECONDS }))}
          variant="secondary"
          onPress={() => void adjust(REST_ADJUST_SECONDS)}
          style={{ flex: 1 }}
        />
        <Button
          label={t('restTimer.skip')}
          variant="ghost"
          onPress={() => void stop()}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

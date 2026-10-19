import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { useReduceMotion, useTheme } from '@/theme';

import type { RecordKind } from '../records';

type PrBadgeProps = { records: readonly RecordKind[] };

/** "New PR 🏆" that pops in, with the records it broke. */
export function PrBadge({ records }: PrBadgeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(0.4));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, reduceMotion]);

  const kinds = records.map((kind) => t(`records.${kind}`)).join(' · ');
  return (
    <Animated.View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${t('records.newPR')}: ${kinds}`}
      style={{ transform: [{ scale }], opacity, alignSelf: 'flex-start' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primary,
          // Orange glow.
          shadowColor: theme.colors.primary,
          shadowOpacity: 0.6,
          shadowRadius: theme.spacing.md,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      >
        <AppText variant="label" color="onPrimary">
          {t('records.newPR')}
        </AppText>
        <AppText variant="label" color="onPrimary">
          {kinds}
        </AppText>
      </View>
    </Animated.View>
  );
}

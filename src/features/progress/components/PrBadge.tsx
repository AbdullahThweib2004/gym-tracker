import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme';

import type { RecordKind } from '../records';

type PrBadgeProps = { records: readonly RecordKind[] };

/** "New PR 🏆" that pops in, with the records it broke. */
export function PrBadge({ records }: PrBadgeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(0.4));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

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
          backgroundColor: theme.colors.warning,
        }}
      >
        <AppText variant="label" color="background">
          {t('records.newPR')}
        </AppText>
        <AppText variant="label" color="background">
          {kinds}
        </AppText>
      </View>
    </Animated.View>
  );
}

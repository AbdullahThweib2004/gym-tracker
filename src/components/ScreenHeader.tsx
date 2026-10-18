import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, backLabel, trailing }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      {onBack ? (
        <IconButton
          icon="arrow-back"
          directional
          onPress={onBack}
          accessibilityLabel={backLabel ?? ''}
        />
      ) : null}
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="heading" accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

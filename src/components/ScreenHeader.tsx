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
  /** Larger title for top-level screens. */
  large?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  trailing,
  large = false,
}: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: theme.touchTarget,
      }}
    >
      {onBack ? (
        <IconButton
          icon="arrow-back"
          variant="tonal"
          directional
          onPress={onBack}
          accessibilityLabel={backLabel ?? ''}
        />
      ) : null}
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <AppText variant={large ? 'title' : 'heading'} accessibilityRole="header" numberOfLines={2}>
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

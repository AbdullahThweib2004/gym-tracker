import { View } from 'react-native';

import { useTheme, type ColorToken } from '@/theme';

import { AppText } from './AppText';

type StatTileProps = {
  label: string;
  value: string;
  caption?: string;
  valueColor?: ColorToken;
};

export function StatTile({ label, value, caption, valueColor = 'textPrimary' }: StatTileProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={caption ? `${label}: ${value}, ${caption}` : `${label}: ${value}`}
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        gap: theme.spacing.xxs,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="subheading" color={valueColor}>
        {value}
      </AppText>
      {caption ? (
        <AppText variant="caption" color="textMuted">
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

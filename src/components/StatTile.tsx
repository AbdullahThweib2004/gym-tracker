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
        gap: theme.spacing.xs,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="numberSmall" color={valueColor} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {caption ? (
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

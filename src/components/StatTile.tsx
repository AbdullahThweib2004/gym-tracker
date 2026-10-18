import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type StatTileProps = {
  label: string;
  value: string;
};

export function StatTile({ label, value }: StatTileProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
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
      <AppText variant="subheading">{value}</AppText>
    </View>
  );
}

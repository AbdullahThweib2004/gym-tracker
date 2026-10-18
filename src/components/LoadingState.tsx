import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message ? (
        <AppText variant="caption" color="textSecondary">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

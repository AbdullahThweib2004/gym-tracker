import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Skeleton } from './Skeleton';

type LoadingStateProps = {
  message?: string;
};

/** Full-screen loading placeholder: shimmering skeleton cards instead of a spinner. */
export function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={{
        flex: 1,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxxl * 1.5,
        gap: theme.spacing.lg,
        backgroundColor: theme.colors.background,
      }}
    >
      <Skeleton width="45%" height={20} />
      <Skeleton height={168} radius={theme.radius.lg} />
      <Skeleton height={88} radius={theme.radius.lg} />
      <Skeleton height={88} radius={theme.radius.lg} />
      {message ? (
        <AppText variant="caption" color="textMuted" align="center">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { IconButton } from '@/components/IconButton';
import { useTheme } from '@/theme';

type ResumeBannerProps = {
  dayName: string;
  startedAt: string;
  onResume: () => void;
  onDiscard: () => void;
};

/** Sticky "workout in progress" card with a live timer. Only the timer re-renders each second. */
export function ResumeBanner({ dayName, startedAt, onResume, onDiscard }: ResumeBannerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        paddingStart: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        backgroundColor: theme.colors.warningSoft,
      }}
    >
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <AppText variant="label" color="warning">
          {t('home.inProgress')}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm }}>
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {dayName}
          </AppText>
          <ElapsedTimer
            since={startedAt}
            variant="bodyStrong"
            color="warning"
            accessibilityLabel={t('workout.elapsed')}
          />
        </View>
      </View>
      <IconButton
        icon="trash-outline"
        color="textSecondary"
        onPress={onDiscard}
        accessibilityLabel={t('home.discard')}
      />
      <Button label={t('home.resume')} icon="play" haptic="medium" onPress={onResume} />
    </View>
  );
}

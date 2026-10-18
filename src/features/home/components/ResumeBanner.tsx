import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme';

type ResumeBannerProps = {
  dayName: string;
  startedAgo: string;
  onResume: () => void;
  onDiscard: () => void;
};

export function ResumeBanner({ dayName, startedAgo, onResume, onDiscard }: ResumeBannerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card style={{ borderColor: theme.colors.primary, borderWidth: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Ionicons name="timer-outline" size={22} color={theme.colors.primary} />
        <AppText variant="label" color="primary">
          {t('home.inProgress')}
        </AppText>
      </View>
      <AppText variant="subheading">{dayName}</AppText>
      <AppText variant="caption" color="textSecondary">
        {t('home.startedAgo', { when: startedAgo })}
      </AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
        <Button label={t('home.resume')} icon="play" onPress={onResume} style={{ flex: 1 }} />
        <Button
          label={t('home.discard')}
          variant="secondary"
          onPress={onDiscard}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

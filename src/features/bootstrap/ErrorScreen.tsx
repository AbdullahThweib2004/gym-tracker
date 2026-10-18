import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { reloadApp } from '@/i18n/language';
import { useTheme } from '@/theme';

type ErrorScreenProps = {
  title: string;
  message: string;
  error?: Error;
};

export function ErrorScreen({ title, message, error }: ErrorScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Screen>
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}
      >
        <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
        <AppText variant="heading" align="center">
          {title}
        </AppText>
        <AppText color="textSecondary" align="center">
          {message}
        </AppText>
        {error ? (
          <AppText variant="caption" color="textMuted" align="center">
            {t('common.errors.details', { message: error.message })}
          </AppText>
        ) : null}
        <Button label={t('common.retry')} onPress={() => void reloadApp()} variant="secondary" />
      </View>
    </Screen>
  );
}

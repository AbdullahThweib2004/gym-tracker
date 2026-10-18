import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

import { clearWorkoutHistory, generateDemoHistory } from './devService';

/**
 * Developer tools. Only loaded when __DEV__ is true (see SettingsScreen), so this module is
 * not part of production bundles.
 */
export function DevToolsSection() {
  const { t } = useTranslation();

  const generate = () => {
    const count = generateDemoHistory();
    Alert.alert(t('settings.dev.title'), t('settings.dev.generated', { count }));
  };

  const clear = () =>
    Alert.alert(t('settings.dev.clearTitle'), t('settings.dev.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.dev.clearConfirm'),
        style: 'destructive',
        onPress: () => {
          clearWorkoutHistory();
          Alert.alert(t('settings.dev.title'), t('settings.dev.cleared'));
        },
      },
    ]);

  return (
    <Card>
      <AppText variant="subheading">{t('settings.dev.title')}</AppText>
      <AppText variant="caption" color="textSecondary">
        {t('settings.dev.hint')}
      </AppText>
      <Button
        label={t('settings.dev.generate')}
        variant="secondary"
        icon="flask-outline"
        onPress={generate}
      />
      <Button
        label={t('settings.dev.clear')}
        variant="ghost"
        icon="trash-outline"
        onPress={clear}
      />
    </Card>
  );
}

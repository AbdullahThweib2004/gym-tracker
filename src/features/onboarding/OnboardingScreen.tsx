import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { SPLIT_KEYS, SPLITS, type SplitKey } from '@/constants/splits';
import { createProgramWithDays } from '@/db/repositories/userPrograms';
import { splitLabel } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';

/**
 * Placeholder onboarding: picking a split creates the program and its days.
 * Exercise selection per day is added in the full onboarding flow.
 */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const setHasActiveProgram = useAppStore((s) => s.setHasActiveProgram);

  const choose = (key: SplitKey) => {
    createProgramWithDays(
      key,
      SPLITS[key].days.map((day) => day.key),
    );
    setHasActiveProgram(true);
  };

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        <AppText variant="title">{t('onboarding.title')}</AppText>
        <AppText color="textSecondary">{t('onboarding.subtitle')}</AppText>
      </View>
      <AppText variant="label" color="textSecondary">
        {t('splits.chooseSplit')}
      </AppText>
      {SPLIT_KEYS.map((key) => (
        <Card key={key} onPress={() => choose(key)} accessibilityLabel={splitLabel(key)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <View style={{ flex: 1, gap: theme.spacing.xxs }}>
              <AppText variant="bodyStrong">{splitLabel(key)}</AppText>
              <AppText variant="caption" color="textSecondary">
                {t('splits.daysCount', { count: SPLITS[key].days.length })}
              </AppText>
            </View>
            <IconButton
              icon="chevron-forward"
              directional
              color="textSecondary"
              onPress={() => choose(key)}
              accessibilityLabel={splitLabel(key)}
            />
          </View>
        </Card>
      ))}
      <AppText variant="caption" color="textMuted" align="center">
        {t('onboarding.placeholder')}
      </AppText>
    </Screen>
  );
}

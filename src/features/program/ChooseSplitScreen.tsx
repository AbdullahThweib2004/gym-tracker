import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SPLIT_KEYS, SPLITS, type SplitKey } from '@/constants/splits';
import { splitLabel } from '@/i18n/format';
import { useAppStore } from '@/store/appStore';
import { useProgramDraftStore } from '@/store/programDraftStore';
import { useTheme } from '@/theme';

import { SplitCard } from './components/SplitCard';
import { chooseSplit, getIncompleteActiveProgram } from './programService';

export function ChooseSplitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSetupComplete = useAppStore((s) => s.isSetupComplete);
  const setSetupComplete = useAppStore((s) => s.setSetupComplete);
  const clearDrafts = useProgramDraftStore((s) => s.clearAll);
  const [incomplete, setIncomplete] = useState(() => getIncompleteActiveProgram());

  useFocusEffect(
    useCallback(() => {
      setIncomplete(getIncompleteActiveProgram());
    }, []),
  );

  const openDay = (dayId: number) =>
    router.push({ pathname: '/onboarding/day/[dayId]', params: { dayId: String(dayId) } });

  const start = (key: SplitKey) => {
    const { firstDayId } = chooseSplit(key);
    clearDrafts();
    setSetupComplete(false);
    openDay(firstDayId);
  };

  const [pending, setPending] = useState<SplitKey | null>(null);
  const confirm = (key: SplitKey) => setPending(key);

  return (
    <Screen scroll>
      <ScreenHeader
        title={isSetupComplete ? t('onboarding.changeTitle') : t('onboarding.title')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
        backLabel={t('common.back')}
      />
      <AppText color="textSecondary">{t('onboarding.splitExplainer')}</AppText>

      {incomplete ? (
        <Card style={{ borderColor: theme.colors.primary }}>
          <AppText variant="bodyStrong">
            {t('onboarding.continueSetup', { split: splitLabel(incomplete.program.splitType) })}
          </AppText>
          <Button
            label={t('onboarding.continue')}
            onPress={() => openDay(incomplete.nextDayId)}
            icon="play"
          />
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
        <AppText variant="label" color="textSecondary">
          {t('splits.chooseSplit')}
        </AppText>
        {SPLIT_KEYS.map((key) => (
          <SplitCard key={key} split={SPLITS[key]} onSelect={() => confirm(key)} />
        ))}
      </View>
      <ConfirmSheet
        visible={pending !== null}
        title={pending ? t('onboarding.confirmTitle', { split: splitLabel(pending) }) : ''}
        message={
          isSetupComplete ? t('onboarding.confirmChangeMessage') : t('onboarding.confirmMessage')
        }
        confirmLabel={t('onboarding.start')}
        cancelLabel={t('common.cancel')}
        onClose={() => setPending(null)}
        onConfirm={() => pending && start(pending)}
      />
    </Screen>
  );
}

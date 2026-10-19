import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { SettingsRow, SettingsSection } from '@/components/SettingsGroup';

import { clearWorkoutHistory, generateDemoHistory } from './devService';

/**
 * Developer tools, visually separated from the real settings. Only loaded when __DEV__ is true
 * (see SettingsScreen), so this module is not part of production bundles.
 */
export function DevToolsSection() {
  const { t } = useTranslation();
  const [confirmClear, setConfirmClear] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <>
      <SettingsSection
        title={t('settings.dev.title')}
        footer={result ?? t('settings.dev.hint')}
        tone="warning"
      >
        <SettingsRow
          icon="flask-outline"
          iconColor="warning"
          label={t('settings.dev.generate')}
          onPress={() => setResult(t('settings.dev.generated', { count: generateDemoHistory() }))}
        />
        <SettingsRow
          icon="trash-outline"
          label={t('settings.dev.clear')}
          destructive
          onPress={() => setConfirmClear(true)}
        />
      </SettingsSection>
      <ConfirmSheet
        visible={confirmClear}
        title={t('settings.dev.clearTitle')}
        message={t('settings.dev.clearMessage')}
        confirmLabel={t('settings.dev.clearConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearWorkoutHistory();
          setResult(t('settings.dev.cleared'));
        }}
      />
    </>
  );
}

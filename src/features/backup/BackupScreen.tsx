import { useState } from 'react';
import { Alert, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { formatDate, formatDateRange } from '@/i18n/format';
import { useTheme } from '@/theme';

import { previewBackup, type BackupError, type BackupFile } from './backupFormat';
import { exportBackup, getLastBackupAt, pickBackup, restoreBackup } from './backupService';

export function BackupScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [lastBackupAt, setLastBackupAt] = useState(() => getLastBackupAt());
  const [busy, setBusy] = useState<'export' | 'read' | 'restore' | null>(null);
  const [selected, setSelected] = useState<BackupFile | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const errorMessage = (error: BackupError) => {
    switch (error.code) {
      case 'newerSchema':
        return t('backup.errors.newerSchema', { file: error.fileVersion, app: error.appVersion });
      case 'invalidData':
        return t('backup.errors.invalidData', { path: error.path });
      default:
        return t(`backup.errors.${error.code}`);
    }
  };

  const doExport = async () => {
    setBusy('export');
    try {
      const shared = await exportBackup();
      if (shared) setLastBackupAt(getLastBackupAt());
      else Alert.alert(t('backup.exportTitle'), t('backup.sharingUnavailable'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('backup.exportTitle'), t('backup.exportFailed'));
    } finally {
      setBusy(null);
    }
  };

  const chooseFile = async () => {
    setBusy('read');
    setSelected(null);
    try {
      const result = await pickBackup();
      if (!result) return;
      if (result.ok) setSelected(result.backup);
      else Alert.alert(t('backup.invalidTitle'), errorMessage(result.error));
    } catch (error) {
      console.error(error);
      Alert.alert(t('backup.invalidTitle'), t('backup.errors.unreadable'));
    } finally {
      setBusy(null);
    }
  };

  const restore = async (backup: BackupFile) => {
    setBusy('restore');
    try {
      await restoreBackup(backup);
    } catch (error) {
      console.error(error);
      setBusy(null);
      Alert.alert(t('backup.restoreFailedTitle'), t('backup.restoreFailedMessage'));
    }
  };

  const preview = selected ? previewBackup(selected) : null;

  return (
    <Screen scroll>
      <ScreenHeader
        title={t('backup.title')}
        onBack={() => router.back()}
        backLabel={t('common.back')}
      />

      <Card>
        <AppText variant="subheading">{t('backup.exportTitle')}</AppText>
        <AppText color="textSecondary">
          {lastBackupAt
            ? t('backup.lastBackup', { date: formatDate(lastBackupAt, 'long') })
            : t('backup.neverBackedUp')}
        </AppText>
        <Button
          label={t('backup.export')}
          icon="share-outline"
          onPress={() => void doExport()}
          loading={busy === 'export'}
          disabled={busy !== null}
          fullWidth
        />
      </Card>

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceElevated,
        }}
      >
        <Ionicons name="image-outline" size={20} color={theme.colors.warning} />
        <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
          {t('backup.photosNotIncluded')}
        </AppText>
      </View>

      <Card>
        <AppText variant="subheading">{t('backup.importTitle')}</AppText>
        <AppText color="textSecondary">{t('backup.importHint')}</AppText>
        <Button
          label={t('backup.chooseFile')}
          icon="document-outline"
          variant="secondary"
          onPress={() => void chooseFile()}
          disabled={busy !== null}
          fullWidth
        />
        {busy === 'read' ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={56} />
          </View>
        ) : null}
        {selected && preview ? (
          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="label" color="textSecondary">
              {t('backup.previewTitle', { date: formatDate(preview.exportedAt, 'long') })}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <StatTile label={t('backup.preview.sessions')} value={String(preview.sessions)} />
              <StatTile label={t('backup.preview.sets')} value={String(preview.sets)} />
              <StatTile
                label={t('backup.preview.customExercises')}
                value={String(preview.customExercises)}
              />
              <StatTile
                label={t('backup.preview.range')}
                value={
                  preview.firstDate && preview.lastDate
                    ? formatDateRange(preview.firstDate, preview.lastDate)
                    : t('backup.preview.noSessions')
                }
              />
            </View>
            <Button
              label={t('backup.restore')}
              variant="danger"
              icon="refresh"
              onPress={() => setConfirmRestore(true)}
              loading={busy === 'restore'}
              disabled={busy !== null}
              fullWidth
            />
          </View>
        ) : null}
      </Card>
      <ConfirmSheet
        visible={confirmRestore}
        title={t('backup.confirmTitle')}
        message={t('backup.confirmMessage')}
        confirmLabel={t('backup.restore')}
        cancelLabel={t('common.cancel')}
        destructive
        onClose={() => setConfirmRestore(false)}
        onConfirm={() => selected && void restore(selected)}
      />
    </Screen>
  );
}

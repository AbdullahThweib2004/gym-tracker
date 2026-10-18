import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { EXCLUDED_META_KEYS } from '@/db/backupTables';
import { getMeta, META_KEYS, setMeta } from '@/db/repositories/appMeta';
import { readBackupTables, replaceAllData } from '@/db/repositories/backup';
import { useRestTimerStore } from '@/features/restTimer/restTimerStore';
import { reloadApp } from '@/i18n/language';

import {
  backupFileName,
  buildBackupFile,
  parseBackup,
  prepareImportData,
  type BackupFile,
  type ParsedBackup,
} from './backupFormat';

const appVersion = () => Constants.expoConfig?.version ?? '0.0.0';

/** Writes a backup file and opens the share sheet. Resolves to false if sharing isn't available. */
export async function exportBackup(now = new Date()): Promise<boolean> {
  const backup = buildBackupFile(readBackupTables(), appVersion(), now);
  const json = JSON.stringify(backup, null, 2);
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) return false;

  const file = new File(Paths.cache, backupFileName(now));
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: backupFileName(now),
  });
  setMeta(META_KEYS.lastBackupAt, now.toISOString());
  return true;
}

/** Lets the user choose a backup file and validates it. Null when cancelled. */
export async function pickBackup(): Promise<ParsedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  const text = await new File(asset.uri).text();
  return parseBackup(text);
}

/**
 * Replaces all data with the backup (one transaction, rolled back on any error), clears the
 * rest timer and its scheduled notifications, then reloads the app.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  replaceAllData(prepareImportData(backup, EXCLUDED_META_KEYS));
  await useRestTimerStore.getState().stop();
  if (Platform.OS !== 'web')
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  await reloadApp();
}

export function getLastBackupAt(): string | null {
  return getMeta(META_KEYS.lastBackupAt);
}

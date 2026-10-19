import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getMeta, META_KEYS, setMeta } from '@/db/repositories/appMeta';
import i18n from '@/i18n';
import { colors } from '@/theme';

const CHANNEL_ID = 'rest-timer';
const supported = Platform.OS !== 'web';

/** Call once at startup: foreground behaviour and the Android channel. */
export async function configureRestNotifications(): Promise<void> {
  if (!supported) return;
  // In the foreground the timer bar vibrates itself, so the system alert stays quiet.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: i18n.t('restTimer.channelName'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
      lightColor: colors.primary,
    });
  }
}

/**
 * Whether we may notify. The first time, explains why before the system prompt, and only
 * asks once; later calls just read the current permission.
 */
export async function ensureRestNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (getMeta(META_KEYS.restNotificationsAsked) === 'true' || !current.canAskAgain) return false;
  setMeta(META_KEYS.restNotificationsAsked, 'true');

  const wantsIt = await new Promise<boolean>((resolve) =>
    Alert.alert(i18n.t('restTimer.permissionTitle'), i18n.t('restTimer.permissionMessage'), [
      { text: i18n.t('restTimer.notNow'), style: 'cancel', onPress: () => resolve(false) },
      { text: i18n.t('restTimer.allow'), onPress: () => resolve(true) },
    ]),
  );
  if (!wantsIt) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

/** Schedules the "rest is over" notification at `endAt`; returns its id. */
export async function scheduleRestEnd(endAt: number, withSound: boolean): Promise<string | null> {
  if (!supported || endAt <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('restTimer.doneTitle'),
        body: i18n.t('restTimer.doneBody'),
        sound: withSound ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAt),
        channelId: CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('Could not schedule the rest notification', error);
    return null;
  }
}

export async function cancelRestEnd(id: string | null): Promise<void> {
  if (!supported || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

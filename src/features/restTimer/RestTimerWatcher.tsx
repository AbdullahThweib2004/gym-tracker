import { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useNow } from './useNow';
import { useRestTimerStore } from './restTimerStore';

/** How late an end may be noticed and still buzz (otherwise the notification already did). */
const ALERT_WINDOW_MS = 3000;

/**
 * Mounted once at the root: ends the timer wherever the user is, buzzing if it ends while the
 * app is open. Renders nothing.
 */
export function RestTimerWatcher() {
  const timer = useRestTimerStore((s) => s.timer);
  const alerts = useRestTimerStore((s) => s.settings.alerts);
  const stop = useRestTimerStore((s) => s.stop);
  const now = useNow(timer !== null, 500);
  const handledEnd = useRef<number | null>(null);

  useEffect(() => {
    if (!timer || now < timer.endAt || handledEnd.current === timer.endAt) return;
    handledEnd.current = timer.endAt;
    if (alerts && now - timer.endAt < ALERT_WINDOW_MS) {
      Vibration.vibrate([0, 400, 200, 400]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    void stop();
  }, [now, timer, alerts, stop]);

  return null;
}

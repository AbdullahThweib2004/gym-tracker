import { z } from 'zod';
import { create } from 'zustand';

import { getMeta, META_KEYS, setMeta } from '@/db/repositories/appMeta';
import { DEFAULT_REST_SECONDS } from '@/constants/settings';

import { adjustTimer, REST_MAX_SECONDS, REST_MIN_SECONDS } from './restMath';
import {
  cancelRestEnd,
  ensureRestNotificationPermission,
  scheduleRestEnd,
} from './restNotifications';

export type RestSettings = {
  defaultRestSeconds: number;
  autoStart: boolean;
  /** Vibration + sound when rest ends. */
  alerts: boolean;
};

type RestTimer = {
  /** Epoch ms when rest ends. Remaining time is always computed from this. */
  endAt: number;
  totalMs: number;
  notificationId: string | null;
};

type RestTimerState = {
  timer: RestTimer | null;
  settings: RestSettings;
  hydrate: () => void;
  start: (seconds: number) => Promise<void>;
  adjust: (deltaSeconds: number) => Promise<void>;
  /** Stops the timer (skip, or after it has ended). */
  stop: () => Promise<void>;
  updateSettings: (patch: Partial<RestSettings>) => void;
};

const timerSchema = z.object({
  endAt: z.number(),
  totalMs: z.number(),
  notificationId: z.string().nullable(),
});

const persistTimer = (timer: RestTimer | null) =>
  setMeta(META_KEYS.restTimer, JSON.stringify(timer));

function readTimer(): RestTimer | null {
  try {
    const parsed = timerSchema.safeParse(JSON.parse(getMeta(META_KEYS.restTimer) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function readSettings(): RestSettings {
  const rest = Number(getMeta(META_KEYS.defaultRestSeconds));
  return {
    defaultRestSeconds:
      Number.isFinite(rest) && rest >= REST_MIN_SECONDS && rest <= REST_MAX_SECONDS
        ? rest
        : DEFAULT_REST_SECONDS,
    autoStart: getMeta(META_KEYS.autoStartRest) !== 'false',
    alerts: getMeta(META_KEYS.restAlerts) !== 'false',
  };
}

export const useRestTimerStore = create<RestTimerState>()((set, get) => ({
  timer: null,
  settings: { defaultRestSeconds: DEFAULT_REST_SECONDS, autoStart: true, alerts: true },

  hydrate: () => set({ timer: readTimer(), settings: readSettings() }),

  start: async (seconds) => {
    const previous = get().timer;
    const endAt = Date.now() + seconds * 1000;
    const timer: RestTimer = { endAt, totalMs: seconds * 1000, notificationId: null };
    set({ timer });
    persistTimer(timer);
    await cancelRestEnd(previous?.notificationId ?? null);
    if (!(await ensureRestNotificationPermission())) return;
    const notificationId = await scheduleRestEnd(endAt, get().settings.alerts);
    // Only attach the id if this timer is still the current one.
    if (get().timer?.endAt === endAt) {
      const withId = { ...timer, notificationId };
      set({ timer: withId });
      persistTimer(withId);
    } else {
      await cancelRestEnd(notificationId);
    }
  },

  adjust: async (deltaSeconds) => {
    const current = get().timer;
    if (!current) return;
    const next = adjustTimer(current, deltaSeconds, Date.now());
    const timer: RestTimer = { ...next, notificationId: null };
    set({ timer });
    persistTimer(timer);
    await cancelRestEnd(current.notificationId);
    const notificationId = await scheduleRestEnd(timer.endAt, get().settings.alerts);
    if (get().timer?.endAt === timer.endAt) {
      const withId = { ...timer, notificationId };
      set({ timer: withId });
      persistTimer(withId);
    } else {
      await cancelRestEnd(notificationId);
    }
  },

  stop: async () => {
    const current = get().timer;
    set({ timer: null });
    persistTimer(null);
    await cancelRestEnd(current?.notificationId ?? null);
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    setMeta(META_KEYS.defaultRestSeconds, String(settings.defaultRestSeconds));
    setMeta(META_KEYS.autoStartRest, String(settings.autoStart));
    setMeta(META_KEYS.restAlerts, String(settings.alerts));
  },
}));

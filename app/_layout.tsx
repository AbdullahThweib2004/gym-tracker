import '@/i18n';

import { useEffect, useRef, useState } from 'react';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/LoadingState';
import { db, openDatabase } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { bootstrapApp } from '@/features/bootstrap/bootstrap';
import { ErrorScreen } from '@/features/bootstrap/ErrorScreen';
import { RestTimerWatcher } from '@/features/restTimer/RestTimerWatcher';
import { useAppStore } from '@/store/appStore';
import { colors } from '@/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <AppGate />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const toError = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

/** Opens the database before anything (migrations included) can query it. */
function AppGate() {
  const { t } = useTranslation();
  const [isDbOpen, setDbOpen] = useState(false);
  const [openError, setOpenError] = useState<Error | null>(null);

  useEffect(() => {
    openDatabase()
      .then(() => setDbOpen(true))
      .catch((err: unknown) => setOpenError(toError(err)));
  }, []);

  if (openError) {
    return (
      <ErrorScreen
        title={t('common.errors.migrationTitle')}
        message={t('common.errors.migrationMessage')}
        error={openError}
      />
    );
  }
  if (!isDbOpen) return <LoadingState message={t('common.loading')} />;
  return <MigratedApp />;
}

function MigratedApp() {
  const { t } = useTranslation();
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [bootError, setBootError] = useState<Error | null>(null);
  const isReady = useAppStore((s) => s.isReady);
  const isSetupComplete = useAppStore((s) => s.isSetupComplete);
  // null until the app is ready, so the initial value from bootstrap isn't seen as a change.
  const wasSetupComplete = useRef<boolean | null>(null);

  useEffect(() => {
    if (!success) return;
    bootstrapApp().catch((err: unknown) => setBootError(toError(err)));
  }, [success]);

  // When setup finishes, go home. This runs after the Stack below has re-rendered with the new
  // guard, so the tabs route is already reachable (navigating from the wizard would race it).
  useEffect(() => {
    if (!isReady) return;
    if (wasSetupComplete.current === false && isSetupComplete) router.replace('/');
    wasSetupComplete.current = isSetupComplete;
  }, [isReady, isSetupComplete]);

  const error = migrationError ?? bootError;
  if (error) {
    return (
      <ErrorScreen
        title={t('common.errors.migrationTitle')}
        message={t('common.errors.migrationMessage')}
        error={error}
      />
    );
  }

  if (!success || !isReady) return <LoadingState message={t('common.loading')} />;

  return (
    <>
      <RestTimerWatcher />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        {/* Until a program is fully set up, only onboarding is reachable (and is the initial route). */}
        <Stack.Protected guard={isSetupComplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout" />
          <Stack.Screen name="session/[sessionId]" />
          <Stack.Screen name="exercise/[id]" />
        </Stack.Protected>
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}

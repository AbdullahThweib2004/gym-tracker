import '@/i18n';

import { useEffect, useState } from 'react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingState } from '@/components/LoadingState';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { bootstrapApp } from '@/features/bootstrap/bootstrap';
import { ErrorScreen } from '@/features/bootstrap/ErrorScreen';
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

function AppGate() {
  const { t } = useTranslation();
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [bootError, setBootError] = useState<Error | null>(null);
  const isReady = useAppStore((s) => s.isReady);
  const hasActiveProgram = useAppStore((s) => s.hasActiveProgram);

  useEffect(() => {
    if (!success) return;
    bootstrapApp().catch((err: unknown) => {
      setBootError(err instanceof Error ? err : new Error(String(err)));
    });
  }, [success]);

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
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={hasActiveProgram}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!hasActiveProgram}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}

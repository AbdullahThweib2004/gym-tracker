import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? theme.spacing.lg : 0;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[{ padding, gap: theme.spacing.md }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { padding, gap: theme.spacing.md }, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

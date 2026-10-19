import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';

export type SheetAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: readonly SheetAction[];
};

/** A list of options in a bottom sheet (replaces Alert-based menus). */
export function ActionSheet({ visible, onClose, title, message, actions }: ActionSheetProps) {
  const theme = useTheme();
  // Run the chosen action only after this sheet has closed, so it can safely open another one.
  const [chosen, setChosen] = useState<SheetAction | null>(null);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      onClosed={() => {
        chosen?.onPress();
        setChosen(null);
      }}
    >
      {message ? <AppText color="textSecondary">{message}</AppText> : null}
      <View style={{ gap: theme.spacing.sm }}>
        {actions.map((action) => {
          const color = action.destructive ? theme.colors.danger : theme.colors.textPrimary;
          return (
            <PressableScale
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              haptic="selection"
              onPress={() => {
                setChosen(action);
                onClose();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.md,
                minHeight: 56,
                paddingHorizontal: theme.spacing.lg,
                borderRadius: theme.radius.md,
                backgroundColor: pressed
                  ? theme.colors.surfaceHighlight
                  : theme.colors.surfaceElevated,
              })}
            >
              <Ionicons name={action.icon} size={22} color={color} />
              <AppText variant="bodyStrong" style={{ color, flex: 1 }}>
                {action.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}

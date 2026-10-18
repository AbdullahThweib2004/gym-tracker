import { Switch, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type ToggleRowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ label, hint, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="body">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color="textSecondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.textPrimary}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

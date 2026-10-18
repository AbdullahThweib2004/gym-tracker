import { TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme';

import { IconButton } from './IconButton';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  clearLabel: string;
};

export function SearchBar({ value, onChangeText, placeholder, clearLabel }: SearchBarProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingStart: theme.spacing.md,
        paddingEnd: theme.spacing.xs,
        minHeight: 44,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[
          theme.typography.body,
          { flex: 1, color: theme.colors.textPrimary, textAlign: 'auto' },
        ]}
      />
      {value.length > 0 ? (
        <IconButton
          icon="close-circle"
          size={18}
          color="textMuted"
          onPress={() => onChangeText('')}
          accessibilityLabel={clearLabel}
        />
      ) : null}
    </View>
  );
}

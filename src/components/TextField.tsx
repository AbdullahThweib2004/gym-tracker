import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  hint?: string;
  error?: string;
};

// textAlign 'auto' follows the typed text's own direction, so an Arabic name aligns to the
// right even in the English UI and vice versa.
export function TextField({ label, hint, error, ...input }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="label" color="textSecondary">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          theme.typography.body,
          {
            minHeight: 48,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            color: theme.colors.textPrimary,
            textAlign: 'auto',
          },
        ]}
        {...input}
      />
      {error || hint ? (
        <AppText variant="caption" color={error ? 'danger' : 'textMuted'}>
          {error ?? hint}
        </AppText>
      ) : null}
    </View>
  );
}

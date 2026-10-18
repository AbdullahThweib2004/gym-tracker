import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';
import {
  clamp,
  formatNumber,
  parseNumericInput,
  roundToStep,
  sanitizeNumericInput,
} from '@/utils/number';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type NumberInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Allow a decimal separator (weights). Reps should pass false. */
  allowDecimal?: boolean;
  /** Increment used by the − / + steppers. Omit to hide the steppers. */
  step?: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  placeholder?: string;
  accessibilityLabel: string;
  decrementLabel?: string;
  incrementLabel?: string;
  /** Show the value in a muted color (e.g. a suggestion that isn't the user's entry yet). */
  muted?: boolean;
  /** Highlight as invalid. */
  invalid?: boolean;
  editable?: boolean;
  /** Tighter layout for rows with several inputs. */
  compact?: boolean;
  onFocus?: () => void;
};

const toText = (value: number | null) => (value === null ? '' : formatNumber(value));

export function NumberInput({
  value,
  onChange,
  allowDecimal = false,
  step,
  min = 0,
  max = 9999,
  label,
  unit,
  placeholder,
  accessibilityLabel,
  decrementLabel = '−',
  incrementLabel = '+',
  muted = false,
  invalid = false,
  editable = true,
  compact = false,
  onFocus,
}: NumberInputProps) {
  const theme = useTheme();
  const [text, setText] = useState(() => toText(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Keep local text in sync when the parent changes the value (e.g. pre-fill from last session),
  // without clobbering in-progress input like "62." that parses to the same number.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (parseNumericInput(text, allowDecimal) !== value) setText(toText(value));
  }

  const handleChangeText = (raw: string) => {
    const sanitized = sanitizeNumericInput(raw, allowDecimal);
    setText(sanitized);
    const parsed = parseNumericInput(sanitized, allowDecimal);
    const next = parsed === null ? null : clamp(parsed, min, max);
    setSyncedValue(next);
    onChange(next);
  };

  const handleBlur = () => {
    const parsed = parseNumericInput(text, allowDecimal);
    setText(toText(parsed === null ? null : clamp(parsed, min, max)));
  };

  const bump = (direction: 1 | -1) => {
    if (step === undefined) return;
    const base = value ?? 0;
    const next = clamp(roundToStep(base + direction * step, step), min, max);
    setText(toText(next));
    setSyncedValue(next);
    onChange(next);
  };

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: invalid ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: compact ? 0 : theme.spacing.xs,
          },
        ]}
      >
        {step !== undefined && editable ? (
          <IconButton
            icon="remove"
            size={18}
            onPress={() => bump(-1)}
            accessibilityLabel={decrementLabel}
            disabled={value !== null && value <= min}
          />
        ) : null}
        <TextInput
          value={text}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={onFocus}
          editable={editable}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.input,
            compact && styles.compactInput,
            theme.typography.subheading,
            {
              color: muted ? theme.colors.textMuted : theme.colors.textPrimary,
              paddingVertical: theme.spacing.sm,
              // Digits are always left-to-right, also inside an RTL layout.
              writingDirection: 'ltr',
            },
          ]}
        />
        {unit ? (
          <AppText variant="caption" color="textSecondary" style={{ marginEnd: theme.spacing.xs }}>
            {unit}
          </AppText>
        ) : null}
        {step !== undefined && editable ? (
          <IconButton
            icon="add"
            size={18}
            onPress={() => bump(1)}
            accessibilityLabel={incrementLabel}
            disabled={value !== null && value >= max}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 48 },
  input: { flex: 1, textAlign: 'center', minWidth: 48 },
  compactInput: { minWidth: 36, paddingHorizontal: 0 },
});

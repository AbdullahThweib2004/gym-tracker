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
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.xs,
          },
        ]}
      >
        {step !== undefined ? (
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
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.input,
            theme.typography.subheading,
            { color: theme.colors.textPrimary, paddingVertical: theme.spacing.sm },
          ]}
        />
        {unit ? (
          <AppText variant="caption" color="textSecondary" style={{ marginEnd: theme.spacing.xs }}>
            {unit}
          </AppText>
        ) : null}
        {step !== undefined ? (
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
});

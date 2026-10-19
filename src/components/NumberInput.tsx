import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';
import {
  clamp,
  fitFontSize,
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
  /** `big`: large tabular number with 48 pt steppers (set cards). */
  size?: 'default' | 'big';
  onFocus?: () => void;
  onBlur?: () => void;
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
  size = 'default',
  onFocus,
  onBlur,
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
    onBlur?.();
  };

  const bump = (direction: 1 | -1) => {
    if (step === undefined) return;
    const base = value ?? 0;
    const next = clamp(roundToStep(base + direction * step, step), min, max);
    setText(toText(next));
    setSyncedValue(next);
    onChange(next);
  };

  const big = size === 'big';
  const stepperSize = big ? 24 : 18;
  // Big numbers shrink to fit the space between the steppers instead of being cut off.
  const [inputWidth, setInputWidth] = useState(0);
  const bigFontSize = fitFontSize(
    inputWidth,
    (text || placeholder || '').length,
    theme.typography.numberLarge.fontSize,
    theme.typography.numberSmall.fontSize,
  );

  return (
    <View style={{ gap: theme.spacing.xs, alignItems: big ? 'stretch' : undefined }}>
      {label ? (
        <AppText variant="label" color="textSecondary" align={big ? 'center' : 'auto'}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.row,
          {
            backgroundColor: big ? theme.colors.surface : theme.colors.surfaceElevated,
            borderColor: invalid ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: compact ? 0 : theme.spacing.xs,
            minHeight: big ? 72 : 48,
          },
        ]}
      >
        {step !== undefined && editable ? (
          <IconButton
            icon="remove"
            size={stepperSize}
            variant={big ? 'tonal' : 'plain'}
            haptic={big ? 'selection' : undefined}
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
          onLayout={big ? (e) => setInputWidth(e.nativeEvent.layout.width) : undefined}
          style={[
            styles.input,
            compact && styles.compactInput,
            big ? theme.typography.numberLarge : theme.typography.subheading,
            big && { fontSize: bigFontSize },
            {
              color: muted ? theme.colors.textMuted : theme.colors.textPrimary,
              paddingVertical: big ? 0 : theme.spacing.sm,
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
            size={stepperSize}
            variant={big ? 'tonal' : 'plain'}
            haptic={big ? 'selection' : undefined}
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
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, textAlign: 'center', minWidth: 48 },
  compactInput: { minWidth: 36, paddingHorizontal: 0 },
});

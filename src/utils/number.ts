const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/** Converts Arabic-Indic / Persian digits and locale decimal separators to plain ASCII. */
export function normalizeNumericText(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO))
    .replace(/[٫,]/g, '.')
    .replace(/\s/g, '');
}

/**
 * Sanitizes raw keyboard input while the user types. Keeps at most one decimal separator
 * (when allowed) and strips anything that is not a digit.
 */
export function sanitizeNumericInput(text: string, allowDecimal: boolean): string {
  const normalized = normalizeNumericText(text);
  let seenDot = false;
  let out = '';
  for (const ch of normalized) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '.' && allowDecimal && !seenDot) {
      seenDot = true;
      out += out.length === 0 ? '0.' : '.';
    }
  }
  return out;
}

/** Parses sanitized input into a number, or null when empty/incomplete. */
export function parseNumericInput(text: string, allowDecimal: boolean): number | null {
  const sanitized = sanitizeNumericInput(text, allowDecimal);
  if (sanitized === '' || sanitized === '0.') return sanitized === '0.' ? 0 : null;
  const value = allowDecimal ? Number.parseFloat(sanitized) : Number.parseInt(sanitized, 10);
  return Number.isFinite(value) ? value : null;
}

/** Rounds to the nearest multiple of `step`, avoiding floating point noise. */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const rounded = Math.round(value / step) * step;
  return Number.parseFloat(rounded.toFixed(4));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a number without trailing zeros (62.5 → "62.5", 60 → "60"). */
export function formatNumber(value: number, maxFractionDigits = 2): string {
  return Number.parseFloat(value.toFixed(maxFractionDigits)).toString();
}

/** Width of one tabular digit as a fraction of the font size (IBM Plex Sans Arabic: 600/1000). */
const DIGIT_WIDTH_EM = 0.6;

/**
 * Largest font size (between min and max) at which `chars` tabular characters fit in `width`,
 * so long values like "102.5" shrink instead of being cut off.
 */
export function fitFontSize(width: number, chars: number, max: number, min: number): number {
  if (width <= 0 || chars <= 0) return max;
  return clamp(Math.floor(width / (chars * DIGIT_WIDTH_EM)), min, max);
}

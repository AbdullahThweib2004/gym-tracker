export const colors = {
  background: '#0E0F12',
  surface: '#17191E',
  surfaceElevated: '#20232A',
  primary: '#4F8CFF',
  primaryPressed: '#3B74E0',
  onPrimary: '#FFFFFF',
  success: '#34C77B',
  danger: '#F2545B',
  warning: '#F5A524',
  textPrimary: '#F2F3F5',
  textSecondary: '#9AA0AB',
  textMuted: '#6B7280',
  border: '#2A2E36',
  overlay: 'rgba(0, 0, 0, 0.6)',
  transparent: 'transparent',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  display: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, lineHeight: 42 },
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, lineHeight: 34 },
  heading: { fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, lineHeight: 28 },
  subheading: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, lineHeight: 24 },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, lineHeight: 22 },
  bodyStrong: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, lineHeight: 22 },
  caption: { fontSize: fontSizes.sm, fontWeight: fontWeights.regular, lineHeight: 18 },
  label: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium, lineHeight: 16 },
} as const;

export const theme = { colors, spacing, radius, fontSizes, fontWeights, typography } as const;

export type Theme = typeof theme;
export type ColorToken = keyof typeof colors;
export type TypographyVariant = keyof typeof typography;

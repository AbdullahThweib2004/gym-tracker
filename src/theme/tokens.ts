/**
 * Design tokens. See ./README.md for how to use them. Never hard-code colors, sizes or fonts in
 * components; add a token here instead.
 */

export const colors = {
  // Surfaces: near-black, elevation from progressively lighter greys plus hairline borders.
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1C1C1C',
  surfaceHighlight: '#262626',
  border: '#2A2A2A',
  borderStrong: '#3A3A3A',

  // The one brand accent (orange): primary actions, selection, progress and records.
  primary: '#FF6B00',
  primaryPressed: '#E05E00',
  /** Orange tint for selected states and accent backgrounds. */
  primaryMuted: 'rgba(255, 107, 0, 0.15)',
  onPrimary: '#0A0A0A',

  // Semantic colors, each clearly distinct from the orange.
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.12)',
  warning: '#FACC15',
  warningSoft: 'rgba(250, 204, 21, 0.12)',
  danger: '#F56565',
  dangerSoft: 'rgba(245, 101, 101, 0.15)',
  onSemantic: '#0A0A0A',

  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#959595',

  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: 'rgba(255, 255, 255, 0.07)',
  transparent: 'transparent',
} as const;

/** 8 pt grid with 4 pt half-steps. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  /** Buttons, inputs, steppers. */
  md: 14,
  /** Cards. */
  lg: 20,
  /** Bottom sheets, hero cards. */
  xl: 28,
  /** Chips, pills, round buttons. */
  pill: 999,
} as const;

/** Minimum touch target (iOS HIG / WCAG). */
export const touchTarget = 44;

/**
 * IBM Plex Sans Arabic: one family designed for both Arabic and Latin, with tabular (equal
 * width) digits built in, so timers and weights never jump. Custom fonts need one family per
 * weight (fontWeight is ignored by Android for custom fonts).
 */
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
  number: 32,
  numberLarge: 44,
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: fontSizes.display, lineHeight: 44 },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, lineHeight: 38 },
  heading: { fontFamily: fonts.bold, fontSize: fontSizes.xl, lineHeight: 30 },
  subheading: { fontFamily: fonts.semibold, fontSize: fontSizes.lg, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: fontSizes.md, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSizes.md, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: fontSizes.sm, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.xs, lineHeight: 18 },
  /** Big weights and reps. */
  number: { fontFamily: fonts.bold, fontSize: fontSizes.number, lineHeight: 40 },
  numberLarge: { fontFamily: fonts.bold, fontSize: fontSizes.numberLarge, lineHeight: 52 },
  numberSmall: { fontFamily: fonts.semibold, fontSize: fontSizes.xl, lineHeight: 28 },
} as const;

export const motion = {
  /** Press feedback scale. */
  pressScale: 0.97,
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  fontSizes,
  typography,
  motion,
  touchTarget,
} as const;

export type Theme = typeof theme;
export type ColorToken = keyof typeof colors;
export type TypographyVariant = keyof typeof typography;

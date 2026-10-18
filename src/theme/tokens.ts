/**
 * Design tokens. See ./README.md for how to use them. Never hard-code colors, sizes or fonts in
 * components; add a token here instead.
 */

export const colors = {
  // Surfaces: elevation comes from progressively lighter surfaces plus hairline borders.
  background: '#0B0D10',
  surface: '#14171C',
  surfaceElevated: '#1C2027',
  surfaceHighlight: '#252A33',
  border: '#2A2F38',
  borderStrong: '#3A404B',

  // The one accent: primary actions, progress and "done".
  primary: '#C6F432',
  primaryPressed: '#AEDB1F',
  primarySoft: '#1C2410',
  onPrimary: '#0B0D10',

  // Semantic colors.
  success: '#34D399',
  successSoft: '#0E2A20',
  warning: '#FFB547',
  warningSoft: '#2C2111',
  danger: '#FF6363',
  dangerSoft: '#2E1517',
  onSemantic: '#0B0D10',

  textPrimary: '#F4F6F8',
  textSecondary: '#A9B0BB',
  textMuted: '#8E959F',

  overlay: 'rgba(0, 0, 0, 0.65)',
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

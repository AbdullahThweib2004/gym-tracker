# Design system

Dark, high-contrast and energetic, built for one-handed use between sets. All values live in
`tokens.ts`; components read them through `useTheme()`. Never hard-code a color, size or font.

## Color

| Token                                              | Use                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `background` `#0B0D10`                             | Screen background                                                                                            |
| `surface` → `surfaceElevated` → `surfaceHighlight` | Cards, inputs, pressed/selected states. Elevation = a lighter surface + a 1 px `border`, never heavy shadows |
| `primary` `#C6F432` (electric lime)                | The **only** accent: primary actions, progress, confirmed sets, selection. Text on it uses `onPrimary`       |
| `primarySoft`                                      | Tinted background for highlighted cards (e.g. "Today", suggestions)                                          |
| `success` / `warning` / `danger` (+ `…Soft`)       | Semantic states only (saved, PRs and warnings, destructive actions)                                          |
| `textPrimary` / `textSecondary` / `textMuted`      | Text hierarchy; muted is still ≥ 4.5:1 on every surface                                                      |

All text/background pairs meet WCAG AA (4.5:1); most exceed 7:1.

## Typography

**IBM Plex Sans Arabic** for both scripts: Arabic and Latin designed as one family, with
tabular (equal-width) digits by default, so timers and weights don't jump as they change. One
font family per weight (`fonts.regular|medium|semibold|bold`); don't use `fontWeight`.

| Variant               | Size / line      | Use                         |
| --------------------- | ---------------- | --------------------------- |
| `display`             | 34 / 44 bold     | Hero titles                 |
| `title`               | 28 / 38 bold     | Screen titles               |
| `heading`             | 22 / 30 bold     | Section / card titles       |
| `subheading`          | 18 / 26 semibold | Card titles                 |
| `body` / `bodyStrong` | 16 / 24          | Text                        |
| `caption`             | 14 / 20          | Secondary text              |
| `label`               | 12 / 18 medium   | Compact labels, chips       |
| `numberLarge`         | 44 / 52 bold     | Weight and reps in set rows |
| `number`              | 32 / 40 bold     | Timers, big stats           |
| `numberSmall`         | 22 / 28 semibold | Stat tiles, steppers        |

## Spacing, radius, touch

- 8 pt grid with 4 pt half-steps: `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48`.
- Radius: cards `lg` 20, buttons and inputs `md` 14, sheets `xl` 28, chips `pill`.
- Every tappable is at least `touchTarget` (44 pt) via size or `hitSlop`.

## Motion

- `PressableScale` is the base of every tappable: scale to 0.97 on press, optional haptic
  (`haptic="selection" | "light" | "success" …`) on important actions.
- Durations `fast 150 · normal 250 · slow 400`; springs use `motion.spring`.
- Layout animations (Reanimated) for items added, removed or reordered.
- Respect **Reduce Motion** with `useReduceMotion()`: drop scale, shimmer, cross-fades and
  confetti; keep only state changes.

## Components

`Button` (primary / secondary / ghost / danger, sizes sm 44 · md 52 · lg 60), `Card` (tones:
default / accent / warning / success), `IconButton` (plain / tonal / filled), `Chip`, `Sheet`, `ActionSheet` and
`ConfirmSheet` (bottom sheets), `Skeleton` (shimmer), `ProgressBar`, `StatTile`,
`SegmentedControl`, `Stepper`, `SearchBar`, `TextField`, `NumberInput`, `ToggleRow`,
`EmptyState`, `LoadingState`, `ScreenHeader`.

## RTL

Use logical properties only (`marginStart/End`, `paddingStart/End`, `start/end`), mirror
directional icons with `mirrorInRtl()` or `directional`, and wrap numbers in Arabic text with
`ltr()` from `@/i18n/format`. Horizontal swipe gestures are mirrored in Arabic.

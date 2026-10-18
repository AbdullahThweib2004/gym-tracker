import { Text, type TextProps } from 'react-native';

import { useTheme, type ColorToken, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  /** 'auto' follows the layout direction (start-aligned in both LTR and RTL). */
  align?: 'auto' | 'center';
};

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  align = 'auto',
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

import { Children, Fragment, type ReactNode } from 'react';
import { Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme, type ColorToken } from '@/theme';
import { mirrorInRtl } from '@/utils/direction';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type SettingsSectionProps = {
  title?: string;
  footer?: string;
  /** Visually separate (e.g. developer tools). */
  tone?: 'default' | 'warning';
  children: ReactNode;
};

/** iOS-style grouped section: a title, rows in one rounded container, an optional footer. */
export function SettingsSection({
  title,
  footer,
  tone = 'default',
  children,
}: SettingsSectionProps) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {title ? (
        <AppText
          variant="label"
          color={tone === 'warning' ? 'warning' : 'textSecondary'}
          style={{ paddingHorizontal: theme.spacing.lg }}
        >
          {title}
        </AppText>
      ) : null}
      <View
        style={{
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: tone === 'warning' ? theme.colors.warning : theme.colors.border,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        }}
      >
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={{ height: 1, marginStart: 60, backgroundColor: theme.colors.border }} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText
          variant="caption"
          color="textMuted"
          style={{ paddingHorizontal: theme.spacing.lg }}
        >
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: ColorToken;
  label: string;
  subtitle?: string;
  /** Text on the trailing side (e.g. current value). */
  value?: string;
  onPress?: () => void;
  /** Custom trailing element (stepper, etc.); replaces value and chevron. */
  trailing?: ReactNode;
  /** Renders a switch. */
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  destructive?: boolean;
  /** External link icon instead of a chevron. */
  external?: boolean;
  accessibilityHint?: string;
};

/** A settings row: tinted icon tile, label (+ subtitle), and a value, chevron, switch or custom control. */
export function SettingsRow({
  icon,
  iconColor = 'primary',
  label,
  subtitle,
  value,
  onPress,
  trailing,
  toggle,
  destructive = false,
  external = false,
  accessibilityHint,
}: SettingsRowProps) {
  const theme = useTheme();
  const color = destructive ? 'danger' : iconColor;
  const content = (
    <>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceHighlight,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors[color]} />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.none }}>
        <AppText variant="body" color={destructive ? 'danger' : 'textPrimary'} numberOfLines={1}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (toggle ? (
          <Switch
            accessibilityLabel={label}
            value={toggle.value}
            onValueChange={toggle.onChange}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.textPrimary}
            ios_backgroundColor={theme.colors.border}
          />
        ) : (
          <>
            {value ? (
              <AppText
                variant="body"
                color="textSecondary"
                numberOfLines={1}
                style={{ maxWidth: '45%' }}
              >
                {value}
              </AppText>
            ) : null}
            {onPress ? (
              <Ionicons
                name={external ? 'open-outline' : 'chevron-forward'}
                size={18}
                color={theme.colors.textMuted}
                style={external ? undefined : mirrorInRtl()}
              />
            ) : null}
          </>
        ))}
    </>
  );

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.md,
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  };

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <PressableScale
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      scaleTo={0.99}
      style={({ pressed }) => [
        rowStyle,
        pressed && { backgroundColor: theme.colors.surfaceElevated },
      ]}
    >
      {content}
    </PressableScale>
  );
}

import { I18nManager } from 'react-native';

export function isRtl(): boolean {
  return I18nManager.isRTL;
}

/** Style that mirrors a directional glyph (arrow, chevron) in RTL layouts. */
export function mirrorInRtl() {
  return I18nManager.isRTL ? { transform: [{ scaleX: -1 as const }] } : undefined;
}

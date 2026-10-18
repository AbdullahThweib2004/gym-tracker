import { useEffect, useState } from 'react';

import { formatClock, ltr } from '@/i18n/format';
import type { TypographyVariant, ColorToken } from '@/theme';

import { AppText } from './AppText';

type ElapsedTimerProps = {
  since: string;
  variant?: TypographyVariant;
  color?: ColorToken;
  accessibilityLabel?: string;
};

/** Live stopwatch since an ISO timestamp. Only this text re-renders every second. */
export function ElapsedTimer({
  since,
  variant = 'bodyStrong',
  color = 'primary',
  accessibilityLabel,
}: ElapsedTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppText
      variant={variant}
      color={color}
      accessibilityLabel={accessibilityLabel}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {ltr(formatClock(now - new Date(since).getTime()))}
    </AppText>
  );
}

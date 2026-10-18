import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Current time, refreshed every `intervalMs` while `active`, and right away on returning to the app. */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [active, intervalMs]);
  return now;
}

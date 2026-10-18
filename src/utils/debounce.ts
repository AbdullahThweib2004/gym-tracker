export type Debouncer<T> = {
  /** Remembers `value` and saves it after `delayMs` without further calls. */
  schedule: (value: T) => void;
  /** Saves the pending value now (if any). */
  flush: () => void;
  /** Drops the pending value without saving. */
  cancel: () => void;
};

/** Trailing-edge debounce for saving values, with an explicit flush. */
export function createDebouncer<T>(save: (value: T) => void, delayMs: number): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const flush = () => {
    clear();
    if (!pending) return;
    const { value } = pending;
    pending = null;
    save(value);
  };
  return {
    schedule: (value) => {
      pending = { value };
      clear();
      timer = setTimeout(flush, delayMs);
    },
    flush,
    cancel: () => {
      clear();
      pending = null;
    },
  };
}

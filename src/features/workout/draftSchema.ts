import { z } from 'zod';

import type { SetRow } from './setRows';

const setRowSchema = z.object({
  key: z.string(),
  setId: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  isWarmup: z.boolean(),
  state: z.enum(['suggested', 'edited', 'saved']),
});

/** Validates a persisted draft; anything malformed is treated as "no draft". */
export function parseDraftRows(value: unknown): SetRow[] | null {
  const result = z.array(setRowSchema).safeParse(value);
  return result.success ? result.data : null;
}

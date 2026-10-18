import { listPriorWorkingSets, listWorkingSetValues } from '@/db/repositories/sessionSets';
import { getSessionSummary } from '@/db/repositories/workoutSessions';
import type { Exercise, SessionSet } from '@/db/schema';

import { detectPRs, sessionRecords, type RecordKind } from './records';

/**
 * Records a just-saved working set breaks, compared with every other working set of the
 * exercise. Needs history from another session, so a first session isn't full of "PRs".
 */
export function recordsForSet(
  set: Pick<SessionSet, 'id' | 'sessionId' | 'exerciseId' | 'weightKg' | 'reps' | 'isWarmup'>,
): RecordKind[] {
  if (set.isWarmup) return [];
  const history = listWorkingSetValues(set.exerciseId, { excludeSetId: set.id });
  if (!history.some((h) => h.sessionId !== set.sessionId)) return [];
  return detectPRs(set, history);
}

export type SessionPR = { exercise: Exercise; set: SessionSet; records: RecordKind[] };

/** PRs achieved in a session, in the order the sets were logged. */
export function getSessionPRs(sessionId: number): SessionPR[] {
  const summary = getSessionSummary(sessionId);
  if (!summary) return [];
  const exercises = new Map(summary.exercises.map((e) => [e.exercise.id, e.exercise]));
  const sets = summary.exercises
    .flatMap((e) => e.sets)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  const prior = listPriorWorkingSets([...exercises.keys()], summary.session.startedAt);
  return sessionRecords(sets, prior).flatMap(({ set, records }) => {
    const exercise = exercises.get(set.exerciseId);
    return exercise ? [{ exercise, set, records }] : [];
  });
}

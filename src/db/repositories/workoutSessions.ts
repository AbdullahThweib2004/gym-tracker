import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { toIsoDate } from '@/utils/date';
import { bestSet, computeVolume, sessionDurationMs, workingSets } from '@/utils/workoutStats';

import { db, type DbExecutor } from '../client';
import {
  exercises,
  sessionSets,
  workoutSessions,
  type Exercise,
  type SessionSet,
  type WorkoutSession,
} from '../schema';

export type StartSessionInput = {
  userProgramId: number | null;
  programDayId: number | null;
  dayKey: string;
  startedAt?: Date;
};

export function startSession(input: StartSessionInput, executor: DbExecutor = db): WorkoutSession {
  const startedAt = input.startedAt ?? new Date();
  return executor
    .insert(workoutSessions)
    .values({
      userProgramId: input.userProgramId,
      programDayId: input.programDayId,
      dayKey: input.dayKey,
      date: toIsoDate(startedAt),
      startedAt: startedAt.toISOString(),
    })
    .returning()
    .get();
}

export function getSessionById(id: number, executor: DbExecutor = db): WorkoutSession | undefined {
  return executor.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
}

/** The most recent session that was started but never finished, if any. */
export function getUnfinishedSession(executor: DbExecutor = db): WorkoutSession | undefined {
  return executor
    .select()
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .get();
}

export function finishSession(
  id: number,
  finishedAt: Date = new Date(),
  executor: DbExecutor = db,
): void {
  executor
    .update(workoutSessions)
    .set({ finishedAt: finishedAt.toISOString() })
    .where(eq(workoutSessions.id, id))
    .run();
}

/** Deletes a session; its sets are removed by the cascade. */
export function deleteSession(id: number, executor: DbExecutor = db): void {
  executor.delete(workoutSessions).where(eq(workoutSessions.id, id)).run();
}

export function getLastSessionForDay(
  programDayId: number,
  executor: DbExecutor = db,
): WorkoutSession | undefined {
  return executor
    .select()
    .from(workoutSessions)
    .where(
      and(eq(workoutSessions.programDayId, programDayId), isNotNull(workoutSessions.finishedAt)),
    )
    .orderBy(desc(workoutSessions.finishedAt))
    .get();
}

export function countFinishedSessions(executor: DbExecutor = db): number {
  const row = executor
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(isNotNull(workoutSessions.finishedAt))
    .get();
  return row?.count ?? 0;
}

export function countSessionsForProgram(userProgramId: number, executor: DbExecutor = db): number {
  const row = executor
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(eq(workoutSessions.userProgramId, userProgramId))
    .get();
  return row?.count ?? 0;
}

export type SessionWithSets = { session: WorkoutSession; sets: SessionSet[] };

/** A session and all its sets, ordered by exercise appearance and set number. */
export function getSessionWithSets(id: number, executor: DbExecutor = db): SessionWithSets | null {
  const session = getSessionById(id, executor);
  if (!session) return null;
  const sets = executor
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, id))
    .orderBy(asc(sessionSets.createdAt), asc(sessionSets.id))
    .all();
  return { session, sets };
}

export type ExerciseSummary = {
  exercise: Exercise;
  /** All sets for the exercise, by set number. */
  sets: SessionSet[];
  best: SessionSet | null;
};

export type SessionSummary = {
  session: WorkoutSession;
  durationMs: number;
  exerciseCount: number;
  workingSets: number;
  /** Σ weight × reps over working sets, kg. */
  volumeKg: number;
  /** In the order exercises were first logged. */
  exercises: ExerciseSummary[];
};

export function getSessionSummary(id: number, executor: DbExecutor = db): SessionSummary | null {
  const session = getSessionById(id, executor);
  if (!session) return null;
  const rows = executor
    .select({ set: sessionSets, exercise: exercises })
    .from(sessionSets)
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(eq(sessionSets.sessionId, id))
    .orderBy(asc(sessionSets.createdAt), asc(sessionSets.id))
    .all();

  const byExercise = new Map<number, { exercise: Exercise; sets: SessionSet[] }>();
  for (const { set, exercise } of rows) {
    const entry = byExercise.get(exercise.id) ?? { exercise, sets: [] };
    entry.sets.push(set);
    byExercise.set(exercise.id, entry);
  }
  const allSets = rows.map((row) => row.set);
  return {
    session,
    durationMs: sessionDurationMs(session.startedAt, session.finishedAt),
    exerciseCount: byExercise.size,
    workingSets: workingSets(allSets).length,
    volumeKg: computeVolume(allSets),
    exercises: [...byExercise.values()].map(({ exercise, sets }) => {
      const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
      return { exercise, sets: ordered, best: bestSet(ordered) };
    }),
  };
}

export type SessionListItem = WorkoutSession & {
  exerciseCount: number;
  workingSets: number;
  volumeKg: number;
};

/** Finished sessions with their totals, newest first. */
export function listFinishedSessionsWithStats(
  { limit = 500, offset = 0 }: { limit?: number; offset?: number } = {},
  executor: DbExecutor = db,
): SessionListItem[] {
  const rows = executor
    .select({
      session: workoutSessions,
      exerciseCount: sql<number>`count(distinct ${sessionSets.exerciseId})`,
      workingSets: sql<number>`coalesce(sum(case when ${sessionSets.isWarmup} = 0 then 1 else 0 end), 0)`,
      volumeKg: sql<number>`coalesce(sum(case when ${sessionSets.isWarmup} = 0 then ${sessionSets.weightKg} * ${sessionSets.reps} else 0 end), 0)`,
    })
    .from(workoutSessions)
    .leftJoin(sessionSets, eq(sessionSets.sessionId, workoutSessions.id))
    .where(isNotNull(workoutSessions.finishedAt))
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt), desc(workoutSessions.id))
    .limit(limit)
    .offset(offset)
    .all();
  return rows.map(({ session, exerciseCount, workingSets: working, volumeKg }) => ({
    ...session,
    exerciseCount,
    workingSets: working,
    volumeKg: Number.parseFloat(Number(volumeKg).toFixed(2)),
  }));
}

export type FinishedSessionInput = {
  userProgramId: number | null;
  programDayId: number | null;
  dayKey: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  sets: readonly {
    exerciseId: number;
    setNumber: number;
    weightKg: number;
    reps: number;
    isWarmup: boolean;
    createdAt: string;
  }[];
};

/** Inserts already-finished sessions with their sets in one transaction (used for demo data). */
export function insertFinishedSessions(sessions: readonly FinishedSessionInput[]): number {
  return db.transaction((tx) => {
    for (const { sets, ...values } of sessions) {
      const session = tx
        .insert(workoutSessions)
        .values(values)
        .returning({ id: workoutSessions.id })
        .get();
      if (sets.length > 0) {
        tx.insert(sessionSets)
          .values(sets.map((set) => ({ ...set, sessionId: session.id })))
          .run();
      }
    }
    return sessions.length;
  });
}

/** Deletes every workout session; sets, extras and drafts go with them (cascade). */
export function deleteAllSessions(executor: DbExecutor = db): void {
  executor.delete(workoutSessions).run();
}

/** Dates (YYYY-MM-DD) of finished sessions on or after `fromDate`. */
export function listFinishedSessionDatesSince(
  fromDate: string,
  executor: DbExecutor = db,
): string[] {
  return executor
    .select({ date: workoutSessions.date })
    .from(workoutSessions)
    .where(and(isNotNull(workoutSessions.finishedAt), gte(workoutSessions.date, fromDate)))
    .all()
    .map((row) => row.date);
}

/**
 * For each session, its distinct exercises in the order they were first logged (at most
 * `perSession`). One query for the whole history list.
 */
export function listSessionExercisePreviews(
  sessionIds: readonly number[],
  perSession = 4,
  executor: DbExecutor = db,
): Map<number, Exercise[]> {
  const result = new Map<number, Exercise[]>();
  if (sessionIds.length === 0) return result;
  const rows = executor
    .select({ sessionId: sessionSets.sessionId, exercise: exercises })
    .from(sessionSets)
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(inArray(sessionSets.sessionId, [...sessionIds]))
    .orderBy(asc(sessionSets.sessionId), asc(sessionSets.createdAt), asc(sessionSets.id))
    .all();
  for (const { sessionId, exercise } of rows) {
    const list = result.get(sessionId) ?? [];
    if (list.length < perSession && !list.some((e) => e.id === exercise.id)) list.push(exercise);
    result.set(sessionId, list);
  }
  return result;
}

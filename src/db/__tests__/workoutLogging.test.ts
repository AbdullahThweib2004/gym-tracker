import { chooseSplit, saveDayEntries } from '@/features/program/programService';
import { DEFAULT_TARGETS } from '@/features/program/targets';
import { loadHomeData } from '@/features/home/homeService';
import { buildInitialRows } from '@/features/workout/setRows';
import {
  addExercisesToSession,
  countUnloggedExercises,
  finishWorkout,
  loadExerciseLog,
  loadWorkout,
  removeSet,
  saveSet,
  startWorkout,
} from '@/features/workout/workoutService';
import type * as ShimModule from '@/test/expoSqliteShim';

import { openDatabase } from '../client';
import { listExercises } from '../repositories/exercises';
import { listProgramDays } from '../repositories/programDays';
import {
  deleteSet,
  getLastPerformance,
  listSetsForSessionExercise,
  updateSet,
} from '../repositories/sessionSets';
import {
  getSessionSummary,
  getSessionWithSets,
  listFinishedSessionsWithStats,
  listSessionExercisePreviews,
} from '../repositories/workoutSessions';
import { seedDatabase } from '../seed';

// Real in-memory SQLite with the real migrations (babel-jest hoists jest.mock above imports).
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof ShimModule>('@/test/expoSqliteShim').openTestDatabase(),
}));

function setUp() {
  const { program } = chooseSplit('ppl');
  const days = listProgramDays(program.id);
  const ids = listExercises().map((e) => e.id);
  days.forEach((day, i) =>
    saveDayEntries(
      day.id,
      [ids[i * 3]!, ids[i * 3 + 1]!].map((exerciseId) => ({
        exerciseId,
        ...DEFAULT_TARGETS,
        restSeconds: null,
      })),
    ),
  );
  const pull = days[1]!;
  const [rowId, curlId] = [ids[3]!, ids[4]!];
  return { program, days, pull, rowId, curlId, ids };
}

function logSet(
  sessionId: number,
  exerciseId: number,
  setNumber: number,
  weightKg: number,
  reps: number,
  isWarmup = false,
) {
  return saveSet({ sessionId, exerciseId, setNumber, weightKg, reps, isWarmup });
}

beforeAll(async () => {
  await openDatabase();
  seedDatabase();
});

describe('week over week', () => {
  it("shows and pre-fills last week's working sets the next week", () => {
    const { program, pull, rowId } = setUp();
    const week1 = startWorkout(program, pull);
    logSet(week1.id, rowId, 1, 20, 15, true);
    logSet(week1.id, rowId, 2, 60, 10);
    logSet(week1.id, rowId, 3, 60, 8);
    logSet(week1.id, rowId, 4, 55, 10);
    finishWorkout(week1.id);

    const week2 = startWorkout(program, pull);
    const log = loadExerciseLog(week2.id, rowId);
    expect(log?.last?.date).toBe(week1.date);
    expect(log?.last?.sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [60, 10],
      [60, 8],
      [55, 10],
    ]);
    const rows = buildInitialRows(log!.savedSets, log!.last!.sets, log!.item.targetSets);
    expect(rows.map((r) => [r.weightKg, r.reps, r.state])).toEqual([
      [60, 10, 'suggested'],
      [60, 8, 'suggested'],
      [55, 10, 'suggested'],
    ]);
  });

  it('ignores unfinished sessions, the current session and warm-up-only sessions', () => {
    const { program, pull, curlId } = setUp();
    const done = startWorkout(program, pull);
    logSet(done.id, curlId, 1, 12.5, 12);
    finishWorkout(done.id);

    const warmupsOnly = startWorkout(program, pull);
    logSet(warmupsOnly.id, curlId, 1, 5, 20, true);
    finishWorkout(warmupsOnly.id);

    const current = startWorkout(program, pull);
    logSet(current.id, curlId, 1, 15, 10);
    expect(getLastPerformance(curlId, current.id)?.sessionId).toBe(done.id);
  });
});

describe('crash safety', () => {
  it('restores every confirmed set from the database and offers to resume', () => {
    const { program, pull, rowId } = setUp();
    const session = startWorkout(program, pull);
    logSet(session.id, rowId, 1, 70, 8);
    logSet(session.id, rowId, 2, 70, 7);

    // A cold start: nothing in memory, everything comes from SQLite.
    const home = loadHomeData();
    expect(home?.unfinished?.session.id).toBe(session.id);
    const log = loadExerciseLog(session.id, rowId);
    const rows = buildInitialRows(log!.savedSets, log!.last?.sets ?? [], log!.item.targetSets);
    expect(rows.filter((r) => r.state === 'saved').map((r) => [r.weightKg, r.reps])).toEqual([
      [70, 8],
      [70, 7],
    ]);
    expect(rows).toHaveLength(3);
    expect(loadWorkout(session.id)?.items.find((i) => i.exerciseId === rowId)?.workingSets).toBe(2);
  });

  it('keeps exercises added to the session even before a set is logged', () => {
    const { program, pull, ids } = setUp();
    const session = startWorkout(program, pull);
    addExercisesToSession(session.id, [ids[60]!, ids[61]!]);
    addExercisesToSession(session.id, [ids[60]!]);
    const items = loadWorkout(session.id)!.items;
    expect(items.map((i) => i.source)).toEqual(['program', 'program', 'extra', 'extra']);
    expect(countUnloggedExercises(session.id)).toBe(4);
    expect(loadExerciseLog(session.id, ids[61]!)?.nextExerciseId).toBeNull();
  });
});

describe('editing sets', () => {
  it('updates a saved set in place instead of adding another', () => {
    const { program, pull, rowId } = setUp();
    const session = startWorkout(program, pull);
    const first = logSet(session.id, rowId, 1, 60, 10);
    const again = saveSet({
      id: first.id,
      sessionId: session.id,
      exerciseId: rowId,
      setNumber: 1,
      weightKg: 62.5,
      reps: 9,
      isWarmup: false,
    });
    expect(again.id).toBe(first.id);
    expect(listSetsForSessionExercise(session.id, rowId).map((s) => [s.weightKg, s.reps])).toEqual([
      [62.5, 9],
    ]);
  });

  it('renumbers the remaining sets to their on-screen positions after a delete', () => {
    const { program, pull, rowId } = setUp();
    const session = startWorkout(program, pull);
    const a = logSet(session.id, rowId, 1, 60, 10);
    const c = logSet(session.id, rowId, 3, 60, 8);
    // Rows on screen after deleting `a`: [unsaved, c] → c is now at position 2.
    removeSet(a.id, [{ id: c.id, setNumber: 2 }]);
    expect(listSetsForSessionExercise(session.id, rowId).map((s) => [s.id, s.setNumber])).toEqual([
      [c.id, 2],
    ]);
    // Confirming the unsaved row at position 1 doesn't collide.
    logSet(session.id, rowId, 1, 60, 9);
    expect(listSetsForSessionExercise(session.id, rowId).map((s) => s.setNumber)).toEqual([1, 2]);
  });
});

describe('summary and history totals', () => {
  it('computes duration, sets, volume and best set, and follows edits and deletes', () => {
    const { program, pull, rowId, curlId } = setUp();
    const session = startWorkout(program, pull);
    logSet(session.id, rowId, 1, 20, 15, true);
    const heavy = logSet(session.id, rowId, 2, 60, 10);
    logSet(session.id, rowId, 3, 62.5, 8);
    const curl = logSet(session.id, curlId, 1, 12.5, 12);
    finishWorkout(session.id);

    const summary = getSessionSummary(session.id)!;
    expect(summary.exerciseCount).toBe(2);
    expect(summary.workingSets).toBe(3);
    expect(summary.volumeKg).toBe(600 + 500 + 150);
    expect(summary.exercises[0]?.best).toMatchObject({ weightKg: 62.5, reps: 8 });
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);

    const listed = () => listFinishedSessionsWithStats().find((s) => s.id === session.id)!;
    expect(listed()).toMatchObject({ exerciseCount: 2, workingSets: 3, volumeKg: 1250 });

    updateSet(heavy.id, { weightKg: 65, reps: 10 });
    expect(listed().volumeKg).toBe(650 + 500 + 150);
    expect(getSessionSummary(session.id)!.exercises[0]?.best).toMatchObject({
      weightKg: 65,
      reps: 10,
    });

    deleteSet(curl.id);
    expect(listed()).toMatchObject({ exerciseCount: 1, workingSets: 2, volumeKg: 1150 });
    expect(getSessionWithSets(session.id)?.sets).toHaveLength(3);
  });

  it('lists finished sessions newest first with zero totals for empty ones', () => {
    const { program, pull } = setUp();
    const older = startWorkout(program, pull);
    finishWorkout(older.id);
    const newer = startWorkout(program, pull);
    finishWorkout(newer.id);
    const ids = listFinishedSessionsWithStats().map((s) => s.id);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    expect(listFinishedSessionsWithStats().find((s) => s.id === newer.id)).toMatchObject({
      exerciseCount: 0,
      workingSets: 0,
      volumeKg: 0,
    });
  });
});

describe('history previews', () => {
  it('lists each session’s distinct exercises in logged order, capped', () => {
    const { program, pull, rowId, curlId } = setUp();
    const session = startWorkout(program, pull);
    logSet(session.id, curlId, 1, 12.5, 12);
    logSet(session.id, rowId, 1, 60, 10);
    logSet(session.id, curlId, 2, 12.5, 10);
    finishWorkout(session.id);
    const previews = listSessionExercisePreviews([session.id], 4);
    expect(previews.get(session.id)?.map((e) => e.id)).toEqual([curlId, rowId]);
    expect(listSessionExercisePreviews([session.id], 1).get(session.id)).toHaveLength(1);
    expect(listSessionExercisePreviews([]).size).toBe(0);
  });
});

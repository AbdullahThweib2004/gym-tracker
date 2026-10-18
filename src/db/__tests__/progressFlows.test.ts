import { clearWorkoutHistory, generateDemoHistory } from '@/features/dev/devService';
import { chooseSplit, saveDayEntries } from '@/features/program/programService';
import { suggestNextWeight } from '@/features/progress/overload';
import { getSessionPRs, recordsForSet } from '@/features/progress/progressService';
import { buildSessionPoints } from '@/features/progress/progressSeries';
import { buildInitialRows, restoreRows } from '@/features/workout/setRows';
import {
  discardWorkout,
  finishWorkout,
  loadDraftRows,
  loadExerciseLog,
  persistDraftRows,
  saveSet,
  startWorkout,
} from '@/features/workout/workoutService';
import type * as ShimModule from '@/test/expoSqliteShim';

import { openDatabase } from '../client';
import { listExercises } from '../repositories/exercises';
import { listProgramDays } from '../repositories/programDays';
import { listExerciseHistory } from '../repositories/sessionSets';
import { getDraft, saveDraft } from '../repositories/setDrafts';
import { listFinishedSessionsWithStats } from '../repositories/workoutSessions';
import { seedDatabase } from '../seed';

// Real in-memory SQLite with the real migrations (babel-jest hoists jest.mock above imports).
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof ShimModule>('@/test/expoSqliteShim').openTestDatabase(),
}));

function setUp() {
  const { program } = chooseSplit('ppl');
  const days = listProgramDays(program.id);
  const exercises = listExercises();
  const bench = exercises.find((e) => e.nameEn === 'Barbell Bench Press')!;
  const squat = exercises.find((e) => e.nameEn === 'Back Squat')!;
  const curl = exercises.find((e) => e.nameEn === 'Dumbbell Curl')!;
  const targets = { targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: null };
  saveDayEntries(days[0]!.id, [{ exerciseId: bench.id, ...targets }]);
  saveDayEntries(days[1]!.id, [{ exerciseId: curl.id, ...targets }]);
  saveDayEntries(days[2]!.id, [{ exerciseId: squat.id, ...targets }]);
  return { program, days, bench, squat, curl };
}

const log = (sessionId: number, exerciseId: number, sets: [number, number][]) =>
  sets.map(([weightKg, reps], i) =>
    saveSet({ sessionId, exerciseId, setNumber: i + 1, weightKg, reps, isWarmup: false }),
  );

beforeAll(async () => {
  await openDatabase();
  seedDatabase();
});

beforeEach(() => clearWorkoutHistory());

describe('overload suggestion across sessions', () => {
  it.each([
    ['bench', 62.5],
    ['squat', 65],
    ['curl', 61],
  ] as const)(
    'suggests the right increase for %s after hitting max reps on all sets',
    (key, expected) => {
      const ctx = setUp();
      const exercise = ctx[key];
      const day = ctx.days[key === 'bench' ? 0 : key === 'curl' ? 1 : 2]!;
      const first = startWorkout(ctx.program, day);
      log(first.id, exercise.id, [
        [60, 12],
        [60, 12],
        [60, 12],
      ]);
      finishWorkout(first.id);

      const next = startWorkout(ctx.program, day);
      const data = loadExerciseLog(next.id, exercise.id)!;
      expect(suggestNextWeight(data.last!.sets, data.item, data.item.exercise)).toMatchObject({
        weightKg: expected,
        reasonKey: 'increase',
      });
    },
  );

  it('keeps the weight when a set fell below the minimum', () => {
    const { program, days, bench } = setUp();
    const first = startWorkout(program, days[0]!);
    log(first.id, bench.id, [
      [60, 12],
      [60, 9],
      [60, 7],
    ]);
    finishWorkout(first.id);
    const data = loadExerciseLog(startWorkout(program, days[0]!).id, bench.id)!;
    expect(suggestNextWeight(data.last!.sets, data.item, data.item.exercise)).toMatchObject({
      weightKg: 60,
      reasonKey: 'buildReps',
    });
  });
});

describe('persisted drafts', () => {
  it('restores unconfirmed edits after a restart and clears them when nothing is pending', () => {
    const { program, days, bench } = setUp();
    const session = startWorkout(program, days[0]!);
    const [saved] = log(session.id, bench.id, [[60, 10]]);
    const initial = buildInitialRows([saved!], [], 3);
    const edited = initial.map((row, i) =>
      i === 1 ? { ...row, weightKg: 62.5, reps: 8, state: 'edited' as const } : row,
    );
    persistDraftRows(session.id, bench.id, edited);

    // "Kill" the app: rebuild purely from SQLite.
    const data = loadExerciseLog(session.id, bench.id)!;
    const restored = restoreRows(loadDraftRows(session.id, bench.id), data.savedSets, [], 3);
    expect(restored.map((r) => [r.weightKg, r.reps, r.state])).toEqual([
      [60, 10, 'saved'],
      [62.5, 8, 'edited'],
      [null, null, 'suggested'],
    ]);

    // Confirming the edit leaves nothing pending, so the draft is removed.
    persistDraftRows(
      session.id,
      bench.id,
      restored.map((r) =>
        r.state === 'edited' ? { ...r, state: 'saved' as const, setId: 999 } : r,
      ),
    );
    expect(getDraft(session.id, bench.id)).toBeNull();
  });

  it('removes drafts when the session is finished or discarded', () => {
    const { program, days, bench } = setUp();
    const edited = buildInitialRows([], [], 1).map((r) => ({
      ...r,
      weightKg: 50,
      reps: 5,
      state: 'edited' as const,
    }));

    const a = startWorkout(program, days[0]!);
    persistDraftRows(a.id, bench.id, edited);
    finishWorkout(a.id);
    expect(getDraft(a.id, bench.id)).toBeNull();

    const b = startWorkout(program, days[0]!);
    persistDraftRows(b.id, bench.id, edited);
    discardWorkout(b.id);
    expect(getDraft(b.id, bench.id)).toBeNull();
  });

  it('ignores a malformed draft', () => {
    const { program, days, bench } = setUp();
    const session = startWorkout(program, days[0]!);
    persistDraftRows(session.id, bench.id, [
      { key: 'x', setId: null, weightKg: 1, reps: 1, isWarmup: false, state: 'edited' },
    ]);
    expect(loadDraftRows(session.id, bench.id)).toHaveLength(1);
    // Simulate a corrupted row shape written by an older version.
    saveDraft(session.id, bench.id, [{ nope: true }]);
    expect(loadDraftRows(session.id, bench.id)).toBeNull();
  });
});

describe('personal records', () => {
  it('flags PRs live and lists them in the summary, but not in a first session', () => {
    const { program, days, bench } = setUp();
    const first = startWorkout(program, days[0]!);
    const firstSets = log(first.id, bench.id, [
      [60, 10],
      [62.5, 8],
    ]);
    expect(recordsForSet(firstSets[1]!)).toEqual([]);
    finishWorkout(first.id);
    expect(getSessionPRs(first.id)).toEqual([]);

    const second = startWorkout(program, days[0]!);
    // Checked right after each confirm, as the logging screen does.
    const [heavier] = log(second.id, bench.id, [[65, 8]]);
    expect(recordsForSet(heavier!)).toEqual(expect.arrayContaining(['heaviestWeight', 'best1RM']));
    const sameAgain = saveSet({
      sessionId: second.id,
      exerciseId: bench.id,
      setNumber: 2,
      weightKg: 65,
      reps: 8,
      isWarmup: false,
    });
    expect(recordsForSet(sameAgain)).toEqual([]);
    finishWorkout(second.id);
    expect(getSessionPRs(second.id).map((p) => p.set.id)).toEqual([heavier!.id]);
  });
});

describe('demo history (dev)', () => {
  it('creates 8 weeks of finished, progressing history and can be cleared', () => {
    const { days, bench } = setUp();
    const added = generateDemoHistory();
    expect(added).toBe(8 * days.length);
    const sessions = listFinishedSessionsWithStats();
    expect(sessions).toHaveLength(added);
    expect(
      sessions.every((s) => s.finishedAt !== null && new Date(s.finishedAt) < new Date()),
    ).toBe(true);

    const points = buildSessionPoints(listExerciseHistory(bench.id, { limit: 1000 }));
    expect(points).toHaveLength(8);
    expect(points[points.length - 1]!.bestWeight).toBeGreaterThan(points[0]!.bestWeight);

    clearWorkoutHistory();
    expect(listFinishedSessionsWithStats()).toEqual([]);
    expect(listProgramDays(days[0]!.userProgramId)).toHaveLength(3);
  });
});

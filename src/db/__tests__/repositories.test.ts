import { SPLITS } from '@/constants/splits';
import { loadHomeData } from '@/features/home/homeService';
import {
  chooseSplit,
  getIncompleteActiveProgram,
  loadDayEntries,
  saveDayEntries,
} from '@/features/program/programService';
import { DEFAULT_TARGETS } from '@/features/program/targets';
import { discardWorkout, finishWorkout, startWorkout } from '@/features/workout/workoutService';
import type { DraftEntry } from '@/store/programDraftStore';
import type * as ShimModule from '@/test/expoSqliteShim';

import { getMeta, META_KEYS } from '../repositories/appMeta';
import { countExercises, listExercises } from '../repositories/exercises';
import { listDayExercises } from '../repositories/programDayExercises';
import { listProgramDays } from '../repositories/programDays';
import { addSet, getPreviousPerformance, listSetsForSession } from '../repositories/sessionSets';
import {
  getActiveProgram,
  getProgramById,
  isProgramSetupComplete,
  listPrograms,
} from '../repositories/userPrograms';
import { getSessionById, getUnfinishedSession } from '../repositories/workoutSessions';
import { seedDatabase } from '../seed';
import { SEED_EXERCISES } from '../seedData';

// Repositories run against a real in-memory SQLite database with the real migrations.
// (babel-jest hoists jest.mock above the imports.)
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof ShimModule>('@/test/expoSqliteShim').openTestDatabase(),
}));

const entry = (exerciseId: number, targetSets = DEFAULT_TARGETS.targetSets): DraftEntry => ({
  exerciseId,
  ...DEFAULT_TARGETS,
  targetSets,
  restSeconds: null,
});

function setUpPpl() {
  const { program } = chooseSplit('ppl');
  const days = listProgramDays(program.id);
  const ids = listExercises().map((e) => e.id);
  days.forEach((day, i) =>
    saveDayEntries(day.id, [entry(ids[i * 3]!), entry(ids[i * 3 + 1]!), entry(ids[i * 3 + 2]!)]),
  );
  return { program, days, ids };
}

beforeAll(() => {
  expect(seedDatabase()).toBe(true);
});

describe('seed', () => {
  it('inserts the library once and sets the flag', () => {
    expect(countExercises()).toBe(SEED_EXERCISES.length);
    expect(getMeta(META_KEYS.seeded)).toBe('true');
    expect(seedDatabase()).toBe(false);
    expect(countExercises()).toBe(SEED_EXERCISES.length);
  });
});

describe('program setup', () => {
  it('creates the program days in split order and walks setup to completion', () => {
    const { program, firstDayId } = chooseSplit('ppl');
    const days = listProgramDays(program.id);
    expect(days.map((d) => d.dayKey)).toEqual(SPLITS.ppl.days.map((d) => d.key));
    expect(firstDayId).toBe(days[0]!.id);
    expect(getActiveProgram()?.id).toBe(program.id);
    expect(isProgramSetupComplete(program.id)).toBe(false);
    expect(getIncompleteActiveProgram()?.nextDayId).toBe(days[0]!.id);

    saveDayEntries(days[0]!.id, [entry(1), entry(2)]);
    expect(getIncompleteActiveProgram()?.nextDayId).toBe(days[1]!.id);
    saveDayEntries(days[1]!.id, [entry(3)]);
    saveDayEntries(days[2]!.id, [entry(4)]);
    expect(isProgramSetupComplete(program.id)).toBe(true);
    expect(getIncompleteActiveProgram()).toBeNull();
  });

  it('refuses to save an empty day', () => {
    const { firstDayId } = chooseSplit('full_body');
    expect(() => saveDayEntries(firstDayId, [])).toThrow();
  });

  it('keeps exactly one active program and deletes abandoned, unused setups', () => {
    const { program: complete } = setUpPpl();
    const { program: abandoned } = chooseSplit('upper_lower');
    expect(getProgramById(complete.id)?.isActive).toBe(false);
    expect(getProgramById(complete.id)).toBeDefined();

    const { program: next } = chooseSplit('bro_split');
    expect(getProgramById(abandoned.id)).toBeUndefined();
    expect(
      listPrograms()
        .filter((p) => p.isActive)
        .map((p) => p.id),
    ).toEqual([next.id]);
  });
});

describe('editing a single day', () => {
  it('replaces only that day, in the given order, and keeps history', () => {
    const { program, days, ids } = setUpPpl();
    const [push, pull, legs] = days;
    const session = startWorkout(program, push!);
    addSet({ sessionId: session.id, exerciseId: ids[0]!, weightKg: 60, reps: 8 });
    finishWorkout(session.id);

    const pullBefore = loadDayEntries(pull!.id);
    const legsBefore = loadDayEntries(legs!.id);

    saveDayEntries(push!.id, [entry(ids[50]!, 5), entry(ids[0]!)]);

    expect(
      listDayExercises(push!.id).map((r) => [r.exerciseId, r.targetSets, r.orderIndex]),
    ).toEqual([
      [ids[50], 5, 0],
      [ids[0], 3, 1],
    ]);
    expect(loadDayEntries(pull!.id)).toEqual(pullBefore);
    expect(loadDayEntries(legs!.id)).toEqual(legsBefore);
    expect(listSetsForSession(session.id)).toHaveLength(1);
    expect(getPreviousPerformance(ids[0]!)?.sets[0]?.weightKg).toBe(60);
  });
});

describe('home data', () => {
  it('suggests the first day, then the day after the last finished one, wrapping around', () => {
    const { program, days } = setUpPpl();
    const [push, pull, legs] = days;
    expect(loadHomeData()?.suggestedDayId).toBe(push!.id);

    finishWorkout(startWorkout(program, push!).id);
    expect(loadHomeData()?.suggestedDayId).toBe(pull!.id);

    finishWorkout(startWorkout(program, legs!).id);
    expect(loadHomeData()?.suggestedDayId).toBe(push!.id);
  });

  it('ignores unfinished sessions for the suggestion and reports them as resumable', () => {
    const { program, days } = setUpPpl();
    const [push, pull] = days;
    finishWorkout(startWorkout(program, push!).id);
    const open = startWorkout(program, pull!);

    const data = loadHomeData();
    expect(data?.suggestedDayId).toBe(pull!.id);
    expect(data?.unfinished?.session.id).toBe(open.id);
    expect(data?.unfinished?.splitType).toBe('ppl');
    expect(data?.days.find((d) => d.day.id === push!.id)?.lastDoneDate).not.toBeNull();
    expect(data?.days.find((d) => d.day.id === pull!.id)?.lastDoneDate).toBeNull();
    expect(data?.days[0]?.previewExercises).toHaveLength(3);
  });

  it('discarding a workout deletes it and its sets', () => {
    const { program, days, ids } = setUpPpl();
    const session = startWorkout(program, days[0]!);
    addSet({ sessionId: session.id, exerciseId: ids[0]!, weightKg: 20, reps: 10 });
    discardWorkout(session.id);
    expect(getSessionById(session.id)).toBeUndefined();
    expect(listSetsForSession(session.id)).toEqual([]);
    expect(getUnfinishedSession()?.id).not.toBe(session.id);
  });

  it('suggests the first day when the last finished session belongs to an old program', () => {
    const { program: old, days: oldDays } = setUpPpl();
    finishWorkout(startWorkout(old, oldDays[0]!).id);
    const { days } = setUpPpl();
    expect(loadHomeData()?.suggestedDayId).toBe(days[0]!.id);
  });
});

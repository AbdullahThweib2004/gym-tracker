import type { MuscleGroup } from '@/constants/muscles';
import { getSplitDay, SPLITS, type SplitKey } from '@/constants/splits';
import {
  countExercisesPerDay,
  listDayExercises,
  replaceDayExercises,
} from '@/db/repositories/programDayExercises';
import { getProgramDayById, listProgramDays } from '@/db/repositories/programDays';
import {
  createProgramWithDays,
  getActiveProgram,
  getProgramById,
  isProgramSetupComplete,
} from '@/db/repositories/userPrograms';
import { countSessionsForProgram } from '@/db/repositories/workoutSessions';
import type { ProgramDay, UserProgram } from '@/db/schema';
import type { DraftEntry } from '@/store/programDraftStore';

/**
 * Starts a new program for the split. Any existing program is deactivated (its history is
 * kept); an active program that was never completed or used is deleted instead of piling up.
 * Returns the first day to configure.
 */
export function chooseSplit(splitKey: SplitKey): { program: UserProgram; firstDayId: number } {
  const previous = getActiveProgram();
  const discardPrevious =
    previous !== undefined &&
    !isProgramSetupComplete(previous.id) &&
    countSessionsForProgram(previous.id) === 0;

  const { program, days } = createProgramWithDays(
    splitKey,
    SPLITS[splitKey].days.map((day) => day.key),
    discardPrevious ? { deleteProgramId: previous.id } : {},
  );
  const firstDayId = days[0]?.id;
  if (firstDayId === undefined) throw new Error(`Split ${splitKey} has no days`);
  return { program, firstDayId };
}

/** The active program when its setup was started but not finished. */
export function getIncompleteActiveProgram(): { program: UserProgram; nextDayId: number } | null {
  const program = getActiveProgram();
  if (!program) return null;
  const days = listProgramDays(program.id);
  const counts = countExercisesPerDay(program.id);
  const next = days.find((day) => (counts.get(day.id) ?? 0) === 0);
  return next ? { program, nextDayId: next.id } : null;
}

export type WizardContext = {
  program: UserProgram;
  day: ProgramDay;
  days: ProgramDay[];
  index: number;
  suggestedMuscleGroups: readonly MuscleGroup[];
};

export function getWizardContext(dayId: number): WizardContext | null {
  const day = getProgramDayById(dayId);
  if (!day) return null;
  const program = getProgramById(day.userProgramId);
  if (!program) return null;
  const days = listProgramDays(program.id);
  return {
    program,
    day,
    days,
    index: days.findIndex((d) => d.id === day.id),
    suggestedMuscleGroups: getSplitDay(program.splitType, day.dayKey)?.suggestedMuscleGroups ?? [],
  };
}

export function loadDayEntries(dayId: number): DraftEntry[] {
  return listDayExercises(dayId).map((row) => ({
    exerciseId: row.exerciseId,
    targetSets: row.targetSets,
    targetRepsMin: row.targetRepsMin,
    targetRepsMax: row.targetRepsMax,
    restSeconds: row.restSeconds,
  }));
}

export function saveDayEntries(dayId: number, entries: readonly DraftEntry[]): void {
  if (entries.length === 0) throw new Error('A day needs at least one exercise');
  replaceDayExercises(dayId, entries);
}

export type ProgramDaySummary = { day: ProgramDay; exerciseCount: number };

export function getActiveProgramSummary(): {
  program: UserProgram;
  days: ProgramDaySummary[];
} | null {
  const program = getActiveProgram();
  if (!program) return null;
  const counts = countExercisesPerDay(program.id);
  return {
    program,
    days: listProgramDays(program.id).map((day) => ({
      day,
      exerciseCount: counts.get(day.id) ?? 0,
    })),
  };
}

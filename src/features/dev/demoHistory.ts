import type { Equipment, MuscleGroup } from '@/constants/muscles';
import { suggestNextWeight } from '@/features/progress/overload';
import { toIsoDate } from '@/utils/date';
import { clamp, roundToStep } from '@/utils/number';

export type DemoExercise = {
  exerciseId: number;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
};

export type DemoDay = { programDayId: number; dayKey: string; exercises: readonly DemoExercise[] };

export type DemoSet = {
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  createdAt: string;
};

export type DemoSession = {
  programDayId: number;
  dayKey: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  sets: DemoSet[];
};

/** Small seeded PRNG so demo data (and its tests) are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOWER: readonly MuscleGroup[] = ['legs', 'glutes'];

/** A plausible intermediate starting weight. */
export function startingWeight(exercise: Pick<DemoExercise, 'muscleGroup' | 'equipment'>): number {
  const lower = LOWER.includes(exercise.muscleGroup);
  switch (exercise.equipment) {
    case 'barbell':
      return lower ? 70 : exercise.muscleGroup === 'back' ? 60 : 40;
    case 'machine':
      return lower ? 80 : 40;
    case 'dumbbell':
      return lower ? 16 : 12;
    case 'cable':
      return 25;
    case 'bodyweight':
      return 0;
    default:
      return 10;
  }
}

type ExerciseState = { weightKg: number; repGoal: number };

const MINUTE = 60_000;

/**
 * `weeks` weeks of finished sessions for every program day, oldest first, all in the past.
 * Weights go up the way the app's own overload suggestion would move them: reps climb until
 * every set reaches the top of the range, then the weight increases. Some days are bad
 * (missing the bottom of the range), some are good, and some sessions start with a warm-up.
 */
export function buildDemoHistory(
  days: readonly DemoDay[],
  { weeks = 8, now = new Date(), seed = 42 }: { weeks?: number; now?: Date; seed?: number } = {},
): DemoSession[] {
  const random = mulberry32(seed);
  const state = new Map<number, ExerciseState>();
  const sessions: DemoSession[] = [];
  const firstDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weeks * 7, 18, 0);

  for (let week = 0; week < weeks; week++) {
    days.forEach((day, dayIndex) => {
      // Spread the split across the week: every other day, 18:00–18:40.
      const start = new Date(firstDay);
      start.setDate(firstDay.getDate() + week * 7 + Math.min(dayIndex * 2, 6));
      start.setMinutes(Math.floor(random() * 40));
      let clock = start.getTime() + 5 * MINUTE;
      const sets: DemoSet[] = [];

      day.exercises.forEach((exercise, exerciseIndex) => {
        const current = state.get(exercise.exerciseId) ?? {
          weightKg: startingWeight(exercise),
          repGoal: exercise.targetRepsMin,
        };
        const roll = random();
        const quality = roll < 0.15 ? -3 : roll > 0.85 ? 1 : 0;
        let setNumber = 1;
        const tick = () => {
          clock += (2 + Math.floor(random() * 2)) * MINUTE;
          return new Date(clock).toISOString();
        };

        if (exerciseIndex === 0 && current.weightKg >= 20 && random() < 0.6) {
          sets.push({
            exerciseId: exercise.exerciseId,
            setNumber: setNumber++,
            weightKg: roundToStep(current.weightKg * 0.5, 2.5),
            reps: 12,
            isWarmup: true,
            createdAt: tick(),
          });
        }

        const working: { weightKg: number; reps: number }[] = [];
        for (let i = 0; i < exercise.targetSets; i++) {
          const fatigue = Math.floor(i * 0.6);
          const reps = clamp(current.repGoal + quality - fatigue, 1, exercise.targetRepsMax + 2);
          working.push({ weightKg: current.weightKg, reps });
          sets.push({
            exerciseId: exercise.exerciseId,
            setNumber: setNumber++,
            weightKg: current.weightKg,
            reps,
            isWarmup: false,
            createdAt: tick(),
          });
        }

        state.set(exercise.exerciseId, nextState(current, working, exercise));
      });

      sessions.push({
        programDayId: day.programDayId,
        dayKey: day.dayKey,
        date: toIsoDate(start),
        startedAt: start.toISOString(),
        finishedAt: new Date(clock + 4 * MINUTE).toISOString(),
        sets,
      });
    });
  }
  return sessions;
}

function nextState(
  current: ExerciseState,
  working: { weightKg: number; reps: number }[],
  exercise: DemoExercise,
): ExerciseState {
  if (exercise.equipment === 'bodyweight') {
    return { weightKg: 0, repGoal: Math.min(current.repGoal + 1, exercise.targetRepsMax + 2) };
  }
  const suggestion = suggestNextWeight(working, exercise, exercise);
  if (suggestion?.reasonKey === 'increase') {
    return { weightKg: suggestion.weightKg, repGoal: exercise.targetRepsMin };
  }
  // Fatigue keeps later sets 1–2 reps lower, so aim a bit above the top to eventually clear it.
  return {
    weightKg: current.weightKg,
    repGoal: Math.min(current.repGoal + 1, exercise.targetRepsMax + 2),
  };
}

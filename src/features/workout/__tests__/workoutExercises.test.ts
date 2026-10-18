import { buildWorkoutExercises } from '../workoutExercises';

const day = [
  { exerciseId: 1, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
  { exerciseId: 2, targetSets: 2, targetRepsMin: 5, targetRepsMax: 5 },
];

describe('buildWorkoutExercises', () => {
  it('orders program, then extras, then other logged exercises without duplicates', () => {
    const sets = [
      { exerciseId: 9, isWarmup: false },
      { exerciseId: 1, isWarmup: false },
    ];
    const items = buildWorkoutExercises(day, [5, 1], sets);
    expect(items.map((i) => [i.exerciseId, i.source])).toEqual([
      [1, 'program'],
      [2, 'program'],
      [5, 'extra'],
      [9, 'logged'],
    ]);
  });

  it('tracks progress against the target with working sets only', () => {
    const sets = [
      { exerciseId: 2, isWarmup: true },
      { exerciseId: 2, isWarmup: false },
      { exerciseId: 2, isWarmup: false },
      { exerciseId: 1, isWarmup: false },
    ];
    const [first, second] = buildWorkoutExercises(day, [], sets);
    expect(first).toMatchObject({ loggedSets: 1, workingSets: 1, isComplete: false });
    expect(second).toMatchObject({ loggedSets: 3, workingSets: 2, isComplete: true });
  });
});

describe('rest per exercise', () => {
  it('carries the program rest time and leaves extras on the default', () => {
    const items = buildWorkoutExercises(
      [{ exerciseId: 1, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 }],
      [2],
      [],
    );
    expect(items.map((i) => i.restSeconds)).toEqual([120, null]);
  });
});

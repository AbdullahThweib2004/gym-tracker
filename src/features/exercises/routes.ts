export const exerciseLibraryHref = '/exercises' as const;
export const newExerciseHref = '/exercises/new' as const;
export const editExerciseHref = (id: number) => ({
  pathname: '/exercises/[id]' as const,
  params: { id: String(id) },
});

export const workoutHref = (sessionId: number) => ({
  pathname: '/workout/[sessionId]' as const,
  params: { sessionId: String(sessionId) },
});

export const exerciseLogHref = (sessionId: number, exerciseId: number) => ({
  pathname: '/workout/[sessionId]/[exerciseId]' as const,
  params: { sessionId: String(sessionId), exerciseId: String(exerciseId) },
});

export const addExerciseHref = (sessionId: number) => ({
  pathname: '/workout/[sessionId]/add' as const,
  params: { sessionId: String(sessionId) },
});

export const summaryHref = (sessionId: number) => ({
  pathname: '/workout/[sessionId]/summary' as const,
  params: { sessionId: String(sessionId) },
});

export const sessionDetailHref = (sessionId: number) => ({
  pathname: '/session/[sessionId]' as const,
  params: { sessionId: String(sessionId) },
});

export const exerciseHistoryHref = (exerciseId: number) => ({
  pathname: '/exercise/[id]' as const,
  params: { id: String(exerciseId) },
});

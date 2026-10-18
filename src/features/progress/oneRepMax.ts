/** Estimated one-rep max (Epley): weight × (1 + reps / 30); a single is the weight itself. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Number.parseFloat((weightKg * (1 + reps / 30)).toFixed(2));
}

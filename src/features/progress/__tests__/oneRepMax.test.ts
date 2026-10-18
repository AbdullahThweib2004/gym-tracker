import { estimate1RM } from '../oneRepMax';

describe('estimate1RM', () => {
  it('uses Epley', () => {
    expect(estimate1RM(100, 10)).toBe(133.33);
    expect(estimate1RM(60, 5)).toBe(70);
  });

  it('returns the weight for a single', () => {
    expect(estimate1RM(140, 1)).toBe(140);
  });

  it('is 0 without reps or weight', () => {
    expect(estimate1RM(100, 0)).toBe(0);
    expect(estimate1RM(0, 12)).toBe(0);
  });
});

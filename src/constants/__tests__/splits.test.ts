import { MUSCLE_GROUPS } from '../muscles';
import { getSplitDay, isSplitKey, SPLIT_KEYS, SPLITS } from '../splits';

describe('splits config', () => {
  it('has an entry for every split key', () => {
    for (const key of SPLIT_KEYS) {
      expect(SPLITS[key].key).toBe(key);
      expect(SPLITS[key].days.length).toBeGreaterThan(0);
    }
  });

  it('has unique day keys and labels in both languages', () => {
    for (const split of Object.values(SPLITS)) {
      const keys = split.days.map((d) => d.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const day of split.days) {
        expect(day.labelEn).toBeTruthy();
        expect(day.labelAr).toBeTruthy();
        expect(day.suggestedMuscleGroups.length).toBeGreaterThan(0);
        for (const group of day.suggestedMuscleGroups) expect(MUSCLE_GROUPS).toContain(group);
      }
    }
  });

  it('matches the specified day layouts', () => {
    expect(SPLITS.ppl.days.map((d) => d.key)).toEqual(['push', 'pull', 'legs']);
    expect(SPLITS.upper_lower.days.map((d) => d.key)).toEqual([
      'upperA',
      'lowerA',
      'upperB',
      'lowerB',
    ]);
    expect(SPLITS.bro_split.days.map((d) => d.key)).toEqual([
      'chestTriceps',
      'backBiceps',
      'legsShoulders',
    ]);
    expect(SPLITS.full_body.days.map((d) => d.key)).toEqual(['fullA', 'fullB', 'fullC']);
    expect(SPLITS.ppl_upper.days.map((d) => d.key)).toEqual(['push', 'pull', 'legs', 'upper']);
    expect(SPLITS.full_body.days[0]?.suggestedMuscleGroups).toEqual(MUSCLE_GROUPS);
  });

  it('looks up days safely', () => {
    expect(getSplitDay('ppl', 'push')?.labelEn).toBe('Push');
    expect(getSplitDay('ppl', 'nope')).toBeUndefined();
    expect(getSplitDay('unknown', 'push')).toBeUndefined();
    expect(isSplitKey('ppl')).toBe(true);
    expect(isSplitKey('nope')).toBe(false);
  });
});

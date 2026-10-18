import { normalizeExerciseNames } from '../exerciseNames';

describe('normalizeExerciseNames', () => {
  it('keeps both names, trimmed', () => {
    expect(
      normalizeExerciseNames({ nameEn: '  Hammer  Strength Row ', nameAr: ' تجديف هامر ' }),
    ).toEqual({
      nameEn: 'Hammer Strength Row',
      nameAr: 'تجديف هامر',
    });
  });

  it('falls back to the other language', () => {
    expect(normalizeExerciseNames({ nameEn: 'Sled Push', nameAr: '' })).toEqual({
      nameEn: 'Sled Push',
      nameAr: 'Sled Push',
    });
    expect(normalizeExerciseNames({ nameEn: ' ', nameAr: 'دفع الزلاجة' })).toEqual({
      nameEn: 'دفع الزلاجة',
      nameAr: 'دفع الزلاجة',
    });
  });

  it('requires at least one name', () => {
    expect(normalizeExerciseNames({ nameEn: '', nameAr: '   ' })).toBeNull();
  });
});

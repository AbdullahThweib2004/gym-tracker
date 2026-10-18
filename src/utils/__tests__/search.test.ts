import { matchesSearch, normalizeSearchText } from '../search';

describe('normalizeSearchText', () => {
  it('folds case, accents and punctuation', () => {
    expect(normalizeSearchText('  Café T-Bar  ROW ')).toBe('cafe t bar row');
  });

  it('removes Arabic diacritics and tatweel and unifies letter variants', () => {
    expect(normalizeSearchText('بَنْشْ')).toBe('بنش');
    expect(normalizeSearchText('ســكوات')).toBe('سكوات');
    expect(normalizeSearchText('أرجل')).toBe(normalizeSearchText('ارجل'));
    expect(normalizeSearchText('إحماء')).toBe('احماء');
    expect(normalizeSearchText('معلّق')).toBe('معلق');
    expect(normalizeSearchText('ساعدة')).toBe('ساعده');
  });
});

describe('matchesSearch', () => {
  const names = ['Incline Dumbbell Press', 'بنش عالي دمبل'];

  it('matches English and Arabic names', () => {
    expect(matchesSearch('incline', names)).toBe(true);
    expect(matchesSearch('دمبل', names)).toBe(true);
    expect(matchesSearch('دَمْبِل', names)).toBe(true);
  });

  it('requires every word to match', () => {
    expect(matchesSearch('dumbbell press', names)).toBe(true);
    expect(matchesSearch('barbell press', names)).toBe(false);
  });

  it('treats an empty query as a match', () => {
    expect(matchesSearch('   ', names)).toBe(true);
  });
});

const LATIN_COMBINING_MARKS = /[̀-ͯ]/g;
// Arabic harakat/tanween/shadda/sukun, hamza above/below, superscript alef, and tatweel.
const ARABIC_DIACRITICS = /[ً-ٰٟـ]/g;

function stripCombiningMarks(text: string): string {
  try {
    return text.normalize('NFD').replace(LATIN_COMBINING_MARKS, '');
  } catch {
    return text;
  }
}

/**
 * Folds text for search: case-insensitive, Latin accents removed, Arabic diacritics removed,
 * and common Arabic letter variants unified (أ/إ/آ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي).
 */
export function normalizeSearchText(text: string): string {
  return stripCombiningMarks(text)
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/[-_'’.()/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when every word of the query appears in at least one of the haystacks. */
export function matchesSearch(query: string, haystacks: readonly string[]): boolean {
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const text = haystacks.map(normalizeSearchText).join(' ');
  return tokens.every((token) => text.includes(token));
}

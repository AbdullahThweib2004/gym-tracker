/** Stable lowercase slug: "Farmer's Walk" → "farmers-walk", "T-Bar Row" → "t-bar-row". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

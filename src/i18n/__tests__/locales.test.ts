import ar from '../locales/ar.json';
import en from '../locales/en.json';

type Tree = { [key: string]: string | Tree };

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function flattenKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path.replace(PLURAL_SUFFIX, '')] : flattenKeys(value, path);
  });
}

describe('locales', () => {
  it('en and ar define the same keys', () => {
    const enKeys = new Set(flattenKeys(en));
    const arKeys = new Set(flattenKeys(ar));
    expect([...enKeys].filter((k) => !arKeys.has(k))).toEqual([]);
    expect([...arKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it('has the required top-level sections', () => {
    for (const section of [
      'common',
      'home',
      'workout',
      'history',
      'settings',
      'onboarding',
      'exercises',
      'muscleGroups',
      'equipment',
      'splits',
    ]) {
      expect(en).toHaveProperty(section);
      expect(ar).toHaveProperty(section);
    }
  });
});

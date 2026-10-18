import { backupFileName, prepareImportData } from '../backupFormat';

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(new Date(2026, 0, 5, 23, 59))).toBe('gym-tracker-backup-2026-01-05.json');
  });
});

describe('prepareImportData', () => {
  const base = {
    app: 'gym-tracker' as const,
    schemaVersion: 1,
    exportedAt: '',
    appVersion: '1.0.0',
  };

  it('drops device-only meta and keeps settings', () => {
    const data = prepareImportData(
      {
        ...base,
        data: {
          app_meta: [
            { key: 'restTimer', value: '{}' },
            { key: 'language', value: 'ar' },
            { key: 'seeded', value: 'true' },
          ],
        },
      },
      ['restTimer'],
    );
    expect(data.app_meta).toEqual([
      { key: 'language', value: 'ar' },
      { key: 'seeded', value: 'true' },
    ]);
  });

  it('marks a restored exercise library as seeded so it is not duplicated', () => {
    const data = prepareImportData({ ...base, data: { exercises: [{ id: 1 }], app_meta: [] } }, []);
    expect(data.app_meta).toEqual([{ key: 'seeded', value: 'true' }]);
  });
});

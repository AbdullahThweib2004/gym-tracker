import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

export const ROOT = path.resolve(import.meta.dirname, '../..');
/** Everything generated goes here (ignored by git). */
export const OUT_DIR = path.join(ROOT, 'media-out');
export const RAW_DIR = path.join(OUT_DIR, 'raw');

const run = promisify(execFile);

/** Runs ffmpeg with argument groups, quietly; throws with its log on failure. */
export async function ffmpeg(groups) {
  await run('ffmpeg', ['-y', '-v', 'error', ...groups.flat()], { maxBuffer: 1 << 26 });
}

// Records the demo flow from the web build at an iPhone-like size and saves two screenshots.
//
//   npm run demo:capture        (then: npm run demo:compose)
//
// Starts its own Expo web dev server, loads the dev-only demo data (globalThis.gymTrackerDemo),
// and records with Chromium's screencast at full 3x resolution. Every frame is saved with its
// timestamp, so the assembled video plays at the real pace. Output goes to media-out/raw/.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

import { ffmpeg, RAW_DIR, ROOT } from './paths.mjs';

const PORT = Number(process.env.DEMO_PORT ?? 19006);
const BASE_URL = `http://localhost:${PORT}`;
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 3;
/** Space at the bottom taken by the tab bar or the workout footer. */
const BOTTOM_RESERVED = 120;

const FRAMES_DIR = path.join(RAW_DIR, 'frames');

/** Tap circles and the swipe dot, drawn into the page so they are part of the recording. */
function installTouchIndicators() {
  const style = document.createElement('style');
  style.textContent = `
    .demo-touch { position: fixed; width: 56px; height: 56px; margin: -28px 0 0 -28px;
      border-radius: 50%; background: rgba(255, 255, 255, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.75); pointer-events: none; z-index: 2147483647; }
    .demo-tap { animation: demo-tap 650ms ease-out forwards; }
    @keyframes demo-tap { 0% { transform: scale(0.5); opacity: 1; }
      55% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.15); opacity: 0; } }`;
  const add = (x, y, className) => {
    const dot = document.createElement('div');
    dot.className = `demo-touch ${className}`;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    document.body.appendChild(dot);
    return dot;
  };
  window.__demoTap = (x, y) => {
    const dot = add(x, y, 'demo-tap');
    setTimeout(() => dot.remove(), 700);
  };
  window.__demoDrag = (x0, y0, x1, y1, ms) => {
    const dot = add(x0, y0, '');
    dot.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out, opacity 250ms ${ms}ms`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        dot.style.left = `${x1}px`;
        dot.style.top = `${y1}px`;
        dot.style.opacity = '0';
      }),
    );
    setTimeout(() => dot.remove(), ms + 400);
  };
  document.head.appendChild(style);
}

async function startServer() {
  const server = spawn('npx', ['expo', 'start', '--web', '--port', String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, CI: '1', BROWSER: 'none' },
    stdio: 'ignore',
    detached: true,
  });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(BASE_URL)).ok) return server;
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Expo web server did not start');
}

async function main() {
  await fs.rm(RAW_DIR, { recursive: true, force: true });
  await fs.mkdir(FRAMES_DIR, { recursive: true });

  const server = process.env.DEMO_URL ? null : await startServer();
  const browser = await chromium.launch();
  let page;
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      hasTouch: true,
      isMobile: true,
      colorScheme: 'dark',
      locale: 'en-US',
      timezoneId: 'UTC',
    });
    page = await context.newPage();
    page.on('pageerror', (error) => console.error('Page error:', error.message));
    const cdp = await context.newCDPSession(page);
    const url = process.env.DEMO_URL ?? BASE_URL;

    // Clean state (a fresh browser context has an empty database), then the demo data.
    await page.goto(url, { timeout: 300_000 });
    await page.waitForFunction(() => globalThis.gymTrackerDemo, null, { timeout: 300_000 });
    const sessions = await page.evaluate(() => globalThis.gymTrackerDemo.load());
    console.log(`Loaded demo program with ${sessions} past workouts`);
    await page.goto(url); // Home, not the onboarding route the empty app started on.
    await page.getByText('What are you training today?').waitFor({ timeout: 120_000 });
    await page.evaluate(installTouchIndicators);
    await page.waitForTimeout(2500); // Fonts and images settle.

    const pause = (ms) => page.waitForTimeout(ms);
    const tapAt = async (x, y) => {
      await page.evaluate(([x, y]) => window.__demoTap(x, y), [x, y]);
      await pause(150);
      await page.touchscreen.tap(x, y);
    };
    /** Smoothly scrolls the scroll view that contains `locator` by `dy` (or to `top: 0`). */
    const scrollWithin = async (locator, dy) => {
      await locator.first().evaluate((el, dy) => {
        let scroller = el.parentElement;
        const scrollable = (node) =>
          node.scrollHeight > node.clientHeight + 1 &&
          /(auto|scroll)/.test(getComputedStyle(node).overflowY);
        while (scroller && !scrollable(scroller)) scroller = scroller.parentElement;
        if (!scroller) return;
        if (dy === null) scroller.scrollTo({ top: 0, behavior: 'smooth' });
        else scroller.scrollBy({ top: dy, behavior: 'smooth' });
      }, dy);
      await pause(700);
    };
    /** Scrolls the element into the comfortable middle of the screen (like a person would). */
    const reveal = async (locator) => {
      const bottom = VIEWPORT.height - BOTTOM_RESERVED;
      let box = await locator.boundingBox();
      if (!box) throw new Error(`Not on screen: ${locator}`);
      if (box.y + box.height > bottom)
        await scrollWithin(locator, box.y + box.height - bottom + 60);
      else if (box.y < 90) await scrollWithin(locator, box.y - 140);
      box = await locator.boundingBox();
      if (!box || box.y < 0 || box.y + box.height > bottom + 20)
        throw new Error(`Could not scroll into view: ${locator}`);
      return box;
    };
    /** Taps an element; `fixed` ones (headers, footers) are tapped without scrolling. */
    const tap = async (locator, { fixed = false } = {}) => {
      const target = locator.filter({ visible: true }).first();
      await target.waitFor({ timeout: 15_000 });
      const box = fixed ? await target.boundingBox() : await reveal(target);
      await tapAt(box.x + box.width / 2, box.y + box.height / 2);
    };
    const text = (value) => page.getByText(value, { exact: true });
    /** Waits until the element is on screen (screens further back in the stack stay mounted). */
    const see = (locator) => locator.filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    const label = (value) => page.locator(`[aria-label="${value}"]`);
    const swipeLeft = async () => {
      const y = 330;
      const [x0, x1, steps, ms] = [330, 50, 12, 320];
      await page.evaluate(
        ([a, b, c, d, e]) => window.__demoDrag(a, b, c, d, e),
        [x0, y, x1, y, ms],
      );
      const point = (x) => [{ x, y }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x0) });
      for (let i = 1; i <= steps; i++) {
        await pause(ms / steps);
        const x = x0 + ((x1 - x0) * i) / steps;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x) });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };

    // Screenshot 1: Home, before recording starts.
    await page.screenshot({ path: path.join(RAW_DIR, 'home.png') });

    // Record every repaint with its timestamp.
    const frames = [];
    let writes = Promise.resolve();
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const file = `f${String(frames.length).padStart(5, '0')}.jpg`;
      frames.push({ file, t: metadata.timestamp });
      writes = writes.then(() => fs.writeFile(path.join(FRAMES_DIR, file), data, 'base64'));
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 95,
      maxWidth: VIEWPORT.width * SCALE,
      maxHeight: VIEWPORT.height * SCALE,
    });
    await pause(300);

    // 1. Home with the day cards.
    await pause(3000);
    // 2. Start Legs.
    await tap(text('Legs'));
    await see(text('Back Squat'));
    await pause(1800);
    // 3. First exercise: animated image and "Last time".
    await tap(text('Back Squat'));
    await see(text('Log set'));
    await pause(3000);
    // 4. Confirm set 1 with the pre-filled values: the row turns green, rest starts.
    await tap(text('Log set'));
    await pause(2000);
    await page.screenshot({ path: path.join(RAW_DIR, 'workout.png') });
    await pause(600);
    // 5. Skip the rest, add 2.5 kg on set 2 and confirm: new PR.
    await tap(page.locator('[aria-label^="Rest, "]'), { fixed: true });
    await pause(1100);
    await tap(text('Skip'), { fixed: true });
    await pause(1200);
    await tap(label('Increase weight by 2.5 kg'));
    await pause(1000);
    await tap(text('Log set'));
    await see(page.getByText('New PR', { exact: false }));
    await pause(3000);
    // 6. Swipe to the next exercise and confirm one set.
    await scrollWithin(text('Log set'), null);
    await swipeLeft();
    await see(text('Romanian Deadlift'));
    await pause(1600);
    await tap(text('Log set'));
    await pause(1600);
    // 7. Its progress screen: the chart animates in, then 3M → All.
    await tap(text('View history'));
    await see(page.locator('[aria-label="Time range"]'));
    await pause(500);
    await scrollWithin(page.locator('[aria-label="Time range"]'), 330);
    await pause(2000);
    await tap(text('All'));
    await pause(3000);
    // 8. Back to Home.
    await tap(label('Back'), { fixed: true });
    await pause(1000);
    await tap(label('Back to workout'), { fixed: true });
    await pause(1000);
    await tap(label('Back'), { fixed: true });
    await see(text('What are you training today?'));
    await pause(2500);

    await cdp.send('Page.stopScreencast');
    const end = Date.now() / 1000;
    await writes;
    if (frames.length < 2) throw new Error('No frames were recorded');

    // Constant 30 fps video from the timestamped frames.
    const list = frames
      .map((f, i) => `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? end) - f.t).toFixed(4)}`)
      .join('\n');
    const last = frames[frames.length - 1].file;
    await fs.writeFile(
      path.join(FRAMES_DIR, 'frames.txt'),
      `ffconcat version 1.0\n${list}\nfile '${last}'\n`,
    );
    await ffmpeg([
      ['-f', 'concat', '-safe', '0', '-i', path.join(FRAMES_DIR, 'frames.txt')],
      ['-vf', `fps=30,scale=${VIEWPORT.width * SCALE}:${VIEWPORT.height * SCALE}:flags=lanczos`],
      ['-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p'],
      [path.join(RAW_DIR, 'screen.mp4')],
    ]);
    console.log(
      `Recorded ${frames.length} frames, ${(end - frames[0].t).toFixed(1)} s → ${path.relative(ROOT, RAW_DIR)}`,
    );
  } catch (error) {
    await page?.screenshot({ path: path.join(RAW_DIR, 'error.png') }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
    if (server) process.kill(-server.pid);
  }
}

await main();

// Turns the raw capture (media-out/raw) into the final demo videos and README screenshots.
//
//   npm run demo:compose
//
// Draws an original, unbranded phone frame (black body, thin dark-grey bezel, rounded screen,
// camera pill), places the recording inside it over a soft orange glow and ends on a title card.
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { ffmpeg, OUT_DIR, RAW_DIR, ROOT } from './paths.mjs';

const run = promisify(execFile);

const ORANGE = '#FF6B00';
const BACKGROUND = '#000000';
const APP_BACKGROUND = '#0A0A0A';
const FPS = 30;
const END_CARD_SECONDS = 3;
const FADE_SECONDS = 0.5;
const REPO_URL = 'github.com/AbdullahThweib2004/gym-tracker';

/** The capture, in CSS pixels, and the empty status-bar strip added above it for the pill. */
const CAPTURE = { width: 390, height: 844, scale: 3 };
const STATUS_BAR = 48;
const SCREEN_ASPECT = CAPTURE.width / (CAPTURE.height + STATUS_BAR);

const WORK_DIR = path.join(RAW_DIR, 'compose');
const FONT_DIR = path.join(ROOT, 'node_modules/@expo-google-fonts/ibm-plex-sans-arabic');
const SCREENSHOT_DIR = path.join(ROOT, 'docs/screenshots');

const even = (n) => 2 * Math.round(n / 2);

/** Phone geometry for a screen of the given height (all in output pixels). */
function phone(screenHeight) {
  const screenWidth = even(screenHeight * SCREEN_ASPECT);
  const k = screenWidth / CAPTURE.width; // Output pixels per CSS pixel.
  const body = Math.round(12 * k); // Black body around the screen.
  const rim = Math.max(2, Math.round(1.6 * k)); // Thin dark-grey bezel line.
  const screenRadius = Math.round(44 * k);
  return {
    k,
    screenWidth,
    screenHeight: even(screenHeight),
    body,
    rim,
    screenRadius,
    width: screenWidth + 2 * body,
    height: even(screenHeight) + 2 * body,
    bodyRadius: screenRadius + body,
    pill: { width: Math.round(96 * k), height: Math.round(28 * k), top: Math.round(10 * k) },
  };
}

async function svgToPng(svg, file, width) {
  const svgFile = file.replace(/\.png$/, '.svg');
  await fs.writeFile(svgFile, svg);
  await run('rsvg-convert', ['-w', String(width), svgFile, '-o', file], {
    env: { ...process.env, FONTCONFIG_FILE: path.join(WORK_DIR, 'fonts.conf') },
  });
}

/** Black background with a soft orange glow behind where the phone sits. */
const backgroundSvg = (w, h, p) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.42"/>
    <stop offset="0.45" stop-color="${ORANGE}" stop-opacity="0.16"/>
    <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="${w}" height="${h}" fill="${BACKGROUND}"/>
  <ellipse cx="${w / 2}" cy="${h / 2}" rx="${p.width * 0.95}" ry="${p.height * 0.62}" fill="url(#glow)"/>
</svg>`;

/** The phone body (drawn under the screen). */
const bodySvg = (p) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}">
  <rect x="${p.rim / 2}" y="${p.rim / 2}" width="${p.width - p.rim}" height="${p.height - p.rim}"
    rx="${p.bodyRadius}" fill="#050505" stroke="#3A3A3A" stroke-width="${p.rim}"/>
  <rect x="${p.body}" y="${p.body}" width="${p.screenWidth}" height="${p.screenHeight}"
    rx="${p.screenRadius}" fill="${APP_BACKGROUND}"/>
</svg>`;

/** White rounded rectangle: the alpha mask for the screen. */
const maskSvg = (p) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${p.screenWidth}" height="${p.screenHeight}">
  <rect width="${p.screenWidth}" height="${p.screenHeight}" fill="#000"/>
  <rect width="${p.screenWidth}" height="${p.screenHeight}" rx="${p.screenRadius}" fill="#fff"/>
</svg>`;

/** Camera pill, drawn on top of the screen in the status-bar strip. */
const pillSvg = (p) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${p.screenWidth}" height="${p.screenHeight}">
  <rect x="${(p.screenWidth - p.pill.width) / 2}" y="${p.pill.top}" width="${p.pill.width}"
    height="${p.pill.height}" rx="${p.pill.height / 2}" fill="#000"/>
</svg>`;

const endCardSvg = (w, h) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.28"/>
    <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="${w}" height="${h}" fill="${BACKGROUND}"/>
  <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.55}" ry="${w * 0.4}" fill="url(#glow)"/>
  <text x="${w / 2}" y="${h / 2 - 10}" text-anchor="middle" fill="#FFFFFF"
    font-family="IBM Plex Sans Arabic" font-weight="700" font-size="104">Gym Tracker</text>
  <text x="${w / 2}" y="${h / 2 + 70}" text-anchor="middle" fill="${ORANGE}"
    font-family="IBM Plex Sans Arabic" font-weight="500" font-size="38">${REPO_URL}</text>
</svg>`;

/** A framed screenshot on a transparent background (the screenshot is embedded). */
async function framedScreenshotSvg(p, screenshot) {
  const data = (await fs.readFile(screenshot)).toString('base64');
  const strip = Math.round(STATUS_BAR * p.k);
  const x = p.body;
  const y = p.body;
  return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${p.width}" height="${p.height}" viewBox="0 0 ${p.width} ${p.height}">
  <defs><clipPath id="screen"><rect x="${x}" y="${y}" width="${p.screenWidth}" height="${p.screenHeight}" rx="${p.screenRadius}"/></clipPath></defs>
  <rect x="${p.rim / 2}" y="${p.rim / 2}" width="${p.width - p.rim}" height="${p.height - p.rim}"
    rx="${p.bodyRadius}" fill="#050505" stroke="#3A3A3A" stroke-width="${p.rim}"/>
  <g clip-path="url(#screen)">
    <rect x="${x}" y="${y}" width="${p.screenWidth}" height="${p.screenHeight}" fill="${APP_BACKGROUND}"/>
    <image x="${x}" y="${y + strip}" width="${p.screenWidth}" height="${p.screenHeight - strip}"
      preserveAspectRatio="none" xlink:href="data:image/png;base64,${data}"/>
  </g>
  <rect x="${x + (p.screenWidth - p.pill.width) / 2}" y="${y + p.pill.top}" width="${p.pill.width}"
    height="${p.pill.height}" rx="${p.pill.height / 2}" fill="#000"/>
</svg>`;
}

async function duration(file) {
  const { stdout } = await run('ffprobe', [
    ...['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
  ]);
  return Number(stdout.trim());
}

/** Renders one output size: the phone video, then a crossfade into the end card. */
async function renderVideo({ name, width, height, screenHeight }) {
  const p = phone(screenHeight);
  const dir = path.join(WORK_DIR, name);
  await fs.mkdir(dir, { recursive: true });
  const file = (base) => path.join(dir, base);
  await svgToPng(backgroundSvg(width, height, p), file('background.png'), width);
  await svgToPng(bodySvg(p), file('body.png'), p.width);
  await svgToPng(maskSvg(p), file('mask.png'), p.screenWidth);
  await svgToPng(pillSvg(p), file('pill.png'), p.screenWidth);
  await svgToPng(endCardSvg(width, height), file('end.png'), width);

  const screen = path.join(RAW_DIR, 'screen.mp4');
  const length = await duration(screen);
  const total = length + END_CARD_SECONDS - FADE_SECONDS;
  const phoneX = (width - p.width) / 2;
  const phoneY = (height - p.height) / 2;
  const strip = CAPTURE.scale * STATUS_BAR;
  const output = path.join(OUT_DIR, `${name}.mp4`);

  await ffmpeg([
    ['-loop', '1', '-framerate', String(FPS), '-t', String(length), '-i', file('background.png')],
    ['-loop', '1', '-framerate', String(FPS), '-t', String(length), '-i', file('body.png')],
    ['-i', screen],
    ['-loop', '1', '-framerate', String(FPS), '-t', String(length), '-i', file('mask.png')],
    ['-loop', '1', '-framerate', String(FPS), '-t', String(length), '-i', file('pill.png')],
    [
      '-loop',
      '1',
      '-framerate',
      String(FPS),
      '-t',
      String(END_CARD_SECONDS),
      '-i',
      file('end.png'),
    ],
    [
      '-filter_complex',
      [
        // Status-bar strip above the app, then scale into the screen and round the corners.
        `[2:v]pad=iw:ih+${strip}:0:${strip}:color=${APP_BACKGROUND},` +
          `scale=${p.screenWidth}:${p.screenHeight}:flags=lanczos,format=rgba[app]`,
        `[3:v]format=gray,scale=${p.screenWidth}:${p.screenHeight}[mask]`,
        `[app][mask]alphamerge[screen]`,
        `[0:v][1:v]overlay=${phoneX}:${phoneY}[framed]`,
        `[framed][screen]overlay=${phoneX + p.body}:${phoneY + p.body}[withscreen]`,
        `[withscreen][4:v]overlay=${phoneX + p.body}:${phoneY + p.body},fps=${FPS},scale=out_range=tv,format=yuv420p,setsar=1[demo]`,
        `[5:v]fps=${FPS},scale=out_range=tv,format=yuv420p,setsar=1[end]`,
        `[demo][end]xfade=transition=fade:duration=${FADE_SECONDS}:offset=${(length - FADE_SECONDS).toFixed(3)}[out]`,
      ].join(';'),
    ],
    ['-map', '[out]', '-an', '-r', String(FPS), '-t', total.toFixed(3)],
    ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high'],
    ['-pix_fmt', 'yuv420p', '-movflags', '+faststart', output],
  ]);
  const { size } = await fs.stat(output);
  console.log(
    `${path.relative(ROOT, output)}: ${width}×${height}, ${total.toFixed(1)} s, ${(size / 1e6).toFixed(1)} MB`,
  );
  return output;
}

/** One frame every ~5 s, to check the result by eye. */
async function extractFrames(video) {
  const dir = path.join(OUT_DIR, 'frames');
  await fs.mkdir(dir, { recursive: true });
  const name = path.basename(video, '.mp4');
  await ffmpeg([['-i', video, '-vf', 'fps=1/5', path.join(dir, `${name}-%02d.png`)]]);
}

async function renderScreenshot(name) {
  const p = phone(1400);
  const svg = await framedScreenshotSvg(p, path.join(RAW_DIR, `${name}.png`));
  const png = path.join(WORK_DIR, `${name}.png`);
  await svgToPng(svg, png, 640);
  // 256-colour palette with alpha keeps it sharp and well under 300 KB.
  const output = path.join(SCREENSHOT_DIR, `${name}.png`);
  await run('magick', [png, '-strip', '-colors', '256', `PNG8:${output}`]);
  const { size } = await fs.stat(output);
  console.log(`${path.relative(ROOT, output)}: ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await fs.rm(WORK_DIR, { recursive: true, force: true });
  await fs.rm(path.join(OUT_DIR, 'frames'), { recursive: true, force: true });
  await fs.mkdir(WORK_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  // Use the app's own font (IBM Plex Sans Arabic) for the end card, without installing it.
  await fs.writeFile(
    path.join(WORK_DIR, 'fonts.conf'),
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>
      <include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${FONT_DIR}</dir>
      <cachedir>${path.join(WORK_DIR, 'fontcache')}</cachedir></fontconfig>`,
  );

  const videos = [
    await renderVideo({ name: 'gym-tracker-demo', width: 1080, height: 1920, screenHeight: 1660 }),
    await renderVideo({
      name: 'gym-tracker-demo-square',
      width: 1080,
      height: 1080,
      screenHeight: 960,
    }),
  ];
  for (const video of videos) await extractFrames(video);
  await renderScreenshot('home');
  await renderScreenshot('workout');
}

await main();

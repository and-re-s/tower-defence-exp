// Browser smoke test: serves dist/ on port 4174, plays level 1 at high speed, fails on runtime errors or a blank screen.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, '../harness/smoke');
mkdirSync(outDir, { recursive: true });
if (!existsSync(resolve(root, 'dist/index.html'))) {
  console.error('dist/ missing: run npm run build first');
  process.exit(1);
}

const server = await preview({ root, preview: { port: 4174, strictPort: true, host: '127.0.0.1' } });
const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find((p) => p && existsSync(p));
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
let failed = null;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1:4174')) requests.push(r.url()); });
  await page.goto('http://127.0.0.1:4174/?test=1');
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(outDir, 'menu.png') });

  await page.evaluate(() => window.__game.start({ level: 1, seed: 1 }));
  await page.evaluate(() => window.__game.setTimeScale(8));
  await page.waitForFunction(() => window.__game.state().time >= 20 || window.__game.state().screen !== 'playing', null, { timeout: 90000 });
  await page.evaluate(() => window.__game.pause());
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(outDir, 'latest.png') });
  const mid = await page.evaluate(() => window.__game.state());

  await page.evaluate(() => { window.__game.resume(); window.__game.setTimeScale(16); });
  await page.waitForFunction(() => window.__game.state().time >= 60 || window.__game.state().screen !== 'playing', null, { timeout: 120000 });
  await page.waitForTimeout(300);
  const end = await page.evaluate(() => window.__game.state());
  await page.screenshot({ path: resolve(outDir, 'end.png') });

  // Blank check: sample the canvas screenshot for colour variety.
  const shot = await page.screenshot();
  const variety = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, 64, 36);
    const d = g.getImageData(0, 0, 64, 36).data;
    const set = new Set();
    for (let i = 0; i < d.length; i += 4) set.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
    return set.size;
  }, shot.toString('base64'));

  const errs = await page.evaluate(() => window.__game.errors());
  console.log(JSON.stringify({ midTime: mid.time, midEnemies: mid.enemies.length, endScreen: end.screen, endTime: end.time, light: end.light, colours: variety, errors: errs, external: requests, fps: end.fps }));
  if (errs.length) failed = `runtime errors: ${JSON.stringify(errs)}`;
  else if (variety < 12) failed = `screen looks blank (${variety} colours)`;
  else if (requests.length) failed = `network requests: ${requests.join(', ')}`;
  else if (mid.enemies.length === 0) failed = 'no enemies on screen at 20s';
} catch (e) {
  failed = e.message;
} finally {
  await browser.close();
  server.httpServer.close();
}
if (failed) { console.error(`SMOKE FAILED: ${failed}`); process.exit(1); }
console.log('smoke ok');
process.exit(0);

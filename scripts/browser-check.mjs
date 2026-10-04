import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createDemo, encodeWav } from '../src/audio.js';

const url = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch();
const errors = [];
await mkdir('.impeccable/review', { recursive: true });
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#convert-button').isDisabled(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} overflow`);
    await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true });
    await page.locator('#demo-button').click();
    await page.locator('#results').waitFor({ state: 'visible', timeout: 30000 });
    assert.match(await page.locator('#meow-count').innerText(), /\d+ meows/);
    assert.match(await page.locator('#download-button').getAttribute('href'), /^blob:/);
    const downloadWait = page.waitForEvent('download');
    await page.locator('#download-button').click();
    const download = await downloadWait;
    assert.match(download.suggestedFilename(), /-miau\.wav$/);
    await download.saveAs('.impeccable/review/demo-result.wav');
    await page.locator('#cat-audio').evaluate((audio) => audio.play());
    assert.equal(await page.locator('#cat-audio').evaluate((audio) => audio.paused), false);
    await page.locator('#source-audio').evaluate((audio) => audio.play());
    assert.equal(await page.locator('#cat-audio').evaluate((audio) => audio.paused), true);
    await page.screenshot({ path: `.impeccable/review/${name}-result.png`, fullPage: true });
    // Exercise genuine file decoding and replacement, rather than only the demo path.
    const demo = createDemo();
    await page.locator('#file-input').setInputFiles({ name: 'uploaded-vocal.wav', mimeType: 'audio/wav', buffer: Buffer.from(encodeWav(demo.samples, demo.sampleRate)) });
    await page.locator('#file-title').filter({ hasText: 'uploaded-vocal.wav' }).waitFor();
    await page.locator('#convert-button').click();
    await page.locator('#results').waitFor({ state: 'visible' });
    assert.match(await page.locator('#download-button').getAttribute('download'), /uploaded-vocal-miau/);
    // Silence reports a recoverable error, then the demo works again.
    await page.locator('#file-input').setInputFiles({ name: 'silence.wav', mimeType: 'audio/wav', buffer: Buffer.from(encodeWav(new Float32Array(24000), 24000)) });
    await page.locator('#file-title').filter({ hasText: 'silence.wav' }).waitFor();
    await page.locator('#convert-button').click();
    await page.locator('#status.error').waitFor();
    assert.match(await page.locator('#status').innerText(), /silent/);
    await page.locator('#demo-button').click();
    await page.locator('#results').waitFor({ state: 'visible' });
    // An unsupported file must clear the previous downloadable result.
    await page.locator('#file-input').setInputFiles({ name: 'broken.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('not audio') });
    await page.locator('#status.error').waitFor();
    assert.equal(await page.locator('#results').isVisible(), false);
    assert.equal(await page.locator('#convert-button').isDisabled(), true);
    await page.close();
    console.log(`${name}: conversion, upload, WAV download, playback, errors and recovery passed`);
  }
  assert.deepEqual(errors, []);
  await writeFile('.impeccable/review/browser-check.json', JSON.stringify({ url, passed: true, errors }, null, 2));
} finally { await browser.close(); }

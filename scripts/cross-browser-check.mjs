import { chromium, firefox, webkit } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createDemo, encodeWav } from '../src/audio.js';
import { MEOW_SAMPLES } from '../src/meow-bank.js';

const url = process.env.TEST_URL || 'http://localhost:5173';
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    const fetchedSamples = new Set();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      for (const { file } of MEOW_SAMPLES) if (new URL(response.url()).pathname.endsWith(`/${file}`) && response.ok()) fetchedSamples.add(file);
    });
    await page.goto(url);
    const missingSample = '**/audio/meow-pleading-1.wav';
    await page.route(missingSample, (route) => route.abort());
    await page.locator('#demo-button').click();
    await page.locator('#status.error').waitFor();
    assert.equal(await page.locator('#results').isVisible(), false);
    await page.unroute(missingSample);
    await page.locator('#demo-button').click();
    await page.locator('#results').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(fetchedSamples.size, MEOW_SAMPLES.length, 'the full meow bank must load');
    const variants = Number((await page.locator('#status').innerText()).match(/(\d+) different meows/)?.[1]);
    assert.ok(variants >= 4, 'the demo must use several different recordings');
    await page.locator('#cat-audio').evaluate((audio) => audio.play());
    assert.equal(await page.locator('#cat-audio').evaluate((audio) => audio.paused), false);
    const demo = createDemo();
    const uploaded = process.env.VOCAL_FIXTURE ? await readFile(process.env.VOCAL_FIXTURE) : Buffer.from(encodeWav(demo.samples, demo.sampleRate));
    await page.locator('#file-input').setInputFiles({ name: 'voice.wav', mimeType: 'audio/wav', buffer: uploaded });
    await page.locator('#file-title').filter({ hasText: 'voice.wav' }).waitFor();
    await page.locator('#convert-button').click();
    await page.locator('#results').waitFor({ state: 'visible' });
    const downloading = page.waitForEvent('download');
    await page.locator('#download-button').click();
    const download = await downloading;
    assert.equal(download.suggestedFilename(), 'voice-miau.wav');
    assert.equal(await download.failure(), null);
    // Reject long clips before rendering and leave the page ready to retry.
    await page.locator('#file-input').setInputFiles({ name: 'too-long.wav', mimeType: 'audio/wav', buffer: Buffer.from(encodeWav(new Float32Array(24000 * 61), 24000)) });
    await page.locator('#status.error').waitFor();
    assert.match(await page.locator('#status').innerText(), /longer than 60/);
    assert.equal(await page.locator('#convert-button').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log(`${name}: ${fetchedSamples.size}-sample bank, ${variants} demo variants, WAV upload${process.env.VOCAL_FIXTURE ? ' (spoken voice fixture)' : ''}, worker rendering, playback, download, and clip limit passed`);
  } finally { await browser.close(); }
}

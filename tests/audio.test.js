import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { detectPitch, analyze, renderCat as renderFromBank, createDemo, encodeWav, resample, prepareSample, OUTPUT_RATE } from '../src/audio.js';
import { MEOW_SAMPLES } from '../src/meow-bank.js';
import { readWav } from './helpers.js';

const cat = readWav(new URL('../public/audio/meow.wav', import.meta.url));
const bank = MEOW_SAMPLES.map(({ id, file }) => ({ id, ...readWav(new URL(`../public/${file}`, import.meta.url)) }));
// Single-source fixtures isolate rendering fidelity inside the same bank pipeline.
const renderCat = (input, rate, samples, sampleRate) => renderFromBank(input, rate, [{ samples, sampleRate }]);
const energy = (samples) => samples.reduce((sum, value) => sum + value * value, 0);

function toneResidual(samples, frequency, start, end) {
  let ss = 0, cc = 0, sc = 0, ys = 0, yc = 0, total = 0;
  for (let i = start; i < end; i++) {
    const phase = 2 * Math.PI * frequency * i / OUTPUT_RATE;
    const s = Math.sin(phase), c = Math.cos(phase), y = samples[i];
    ss += s * s; cc += c * c; sc += s * c;
    ys += y * s; yc += y * c; total += y * y;
  }
  const determinant = ss * cc - sc * sc;
  const a = (ys * cc - yc * sc) / determinant;
  const b = (yc * ss - ys * sc) / determinant;
  let residual = 0;
  for (let i = start; i < end; i++) {
    const phase = 2 * Math.PI * frequency * i / OUTPUT_RATE;
    residual += (samples[i] - a * Math.sin(phase) - b * Math.cos(phase)) ** 2;
  }
  return residual / total;
}

test('compressing a meow preserves coherent voiced audio instead of adding grain-rate modulation', () => {
  // A pure voiced source exposes phase-reset sidebands that a raspy real
  // meow can mask. Exercise the full renderer, with genuine duration compression.
  const voice = Float32Array.from({ length: OUTPUT_RATE }, (_, i) =>
    i >= OUTPUT_RATE * 0.1 && i < OUTPUT_RATE * 0.55 ? 0.35 * Math.sin(2 * Math.PI * 220 * i / OUTPUT_RATE) : 0);
  for (const frequency of [220, 330, 440]) {
    const source = Float32Array.from({ length: OUTPUT_RATE * 1.5 }, (_, i) =>
      0.5 * Math.sin(2 * Math.PI * frequency * i / OUTPUT_RATE));
    const result = renderCat(voice, OUTPUT_RATE, source, OUTPUT_RATE);
    const expectedPitch = 220 * 2 ** Math.round(Math.log2(frequency / 220));
    // Allow the pitch estimator's sub-percent tuning error, but reject
    // sidebands, flutter, or phase breaks across the full voiced region.
    const residual = Math.min(...Array.from({ length: 41 }, (_, i) => toneResidual(
      result.samples, expectedPitch * (1 + (i - 20) / 4000),
      Math.round(OUTPUT_RATE * 0.16), Math.round(OUTPUT_RATE * 0.59))));
    assert.ok(residual < 0.025, `${frequency} Hz source: unwanted modulation is ${(residual * 100).toFixed(1)}% of voiced energy`);
  }
});

test('tracks fundamental pitch rather than a dominant second harmonic', () => {
  for (const frequency of [85, 110, 220, 440, 780]) {
    const samples = Float32Array.from({ length: 1600 }, (_, i) =>
      0.15 * Math.sin(2 * Math.PI * frequency * i / 8000) + 0.25 * Math.sin(4 * Math.PI * frequency * i / 8000));
    assert.ok(Math.abs(detectPitch(samples) - frequency) / frequency < 0.025, `pitch ${frequency}`);
  }
});

test('silent input never becomes random meowing', () => {
  assert.throws(() => renderCat(new Float32Array(OUTPUT_RATE), OUTPUT_RATE, cat.samples, cat.sampleRate), /silent/);
});

test('rejects a non-tonal noise clip instead of pretending it found a melody', () => {
  let seed = 12345;
  const noise = Float32Array.from({ length: OUTPUT_RATE }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed / 2 ** 32 - 0.5) * 0.3;
  });
  assert.throws(() => analyze(noise, OUTPUT_RATE), /clear voice/);
});

test('real cat sample has a usable voiced pitch', () => {
  const sample = prepareSample(cat.samples, cat.sampleRate);
  assert.ok(sample.pitch >= 75 && sample.pitch <= 1000);
  assert.ok(sample.samples.length > OUTPUT_RATE * 0.2);
  console.log(`Cat sample reference pitch: ${sample.pitch.toFixed(1)} Hz`);
});

test('the shipped bank contains distinct voiced recordings and rotates them without consecutive repeats', () => {
  assert.equal(bank.length, 6);
  const unique = new Set(bank.map((sample) => Buffer.from(sample.samples.buffer).toString('base64')));
  assert.equal(unique.size, bank.length, 'these must be distinct recordings, not copies of one meow');
  for (const sample of bank) {
    const prepared = prepareSample(sample.samples, sample.sampleRate);
    assert.ok(prepared.pitch >= 75 && prepared.pitch <= 1000);
    assert.ok(prepared.samples.length > OUTPUT_RATE * 0.2);
  }
  const demo = createDemo();
  const result = renderFromBank(demo.samples, demo.sampleRate, bank);
  assert.equal(result.sampleIds.length, result.meows);
  assert.ok(new Set(result.sampleIds).size >= 4, 'a melody should audibly use several different meows');
  for (let i = 1; i < result.sampleIds.length; i++) assert.notEqual(result.sampleIds[i], result.sampleIds[i - 1]);
  assert.equal(result.samples.length, demo.samples.length);
  assert.equal(energy(result.samples.subarray(0, 0.2 * OUTPUT_RATE)), 0);
  assert.ok(result.samples.every((value) => Number.isFinite(value) && Math.abs(value) <= 0.901));
  const inputEvents = analyze(demo.samples, demo.sampleRate).events;
  const outputPitches = inputEvents.map((event, i) => analyze(result.samples.slice(
    Math.round(event.start * OUTPUT_RATE), Math.round((inputEvents[i + 1]?.start ?? 5) * OUTPUT_RATE)), OUTPUT_RATE).medianPitch);
  assert.ok(outputPitches[2] > outputPitches[0] * 1.3, 'switching recordings must preserve the rising melody');
  assert.ok(outputPitches[5] < outputPitches[2] * 0.8, 'switching recordings must preserve the falling melody');
  assert.deepEqual(renderFromBank(demo.samples, demo.sampleRate, bank).sampleIds, result.sampleIds, 'retries should be deterministic');
});

test('an unavailable sample bank produces a recoverable error', () => {
  const demo = createDemo();
  assert.throws(() => renderFromBank(demo.samples, demo.sampleRate, []), /cat sounds could not be loaded/);
});

test('renders timed cat events from a melody, retaining silence and avoiding clipping', () => {
  const demo = createDemo();
  const result = renderCat(demo.samples, demo.sampleRate, cat.samples, cat.sampleRate);
  assert.ok(result.meows >= 7 && result.meows <= 14);
  assert.equal(result.samples.length, demo.samples.length);
  assert.ok(energy(result.samples) > 50);
  assert.equal(energy(result.samples.subarray(0, 0.2 * OUTPUT_RATE)), 0);
  for (const value of result.samples) assert.ok(Number.isFinite(value) && Math.abs(value) <= 0.901);
  const analysis = analyze(demo.samples, demo.sampleRate);
  assert.ok(analysis.events[2].pitch > analysis.events[0].pitch * 1.4);
  // A natural meow bends pitch within a single note. Compare each known
  // input-note interval, not the number of pitch regions in the cat itself.
  const catPitches = analysis.events.map((event, index) => {
    const end = analysis.events[index + 1]?.start ?? result.samples.length / OUTPUT_RATE;
    return analyze(result.samples.slice(Math.round(event.start * OUTPUT_RATE), Math.round(end * OUTPUT_RATE)), OUTPUT_RATE).medianPitch;
  });
  assert.ok(catPitches[2] > catPitches[0] * 1.3, 'cat melody should rise with the input');
  assert.ok(catPitches[5] < catPitches[2] * 0.8, 'cat melody should descend with the input');
});

test('exports an interoperable mono PCM WAV with accurate size and duration', () => {
  const samples = new Float32Array([0, 1, -1, 0.5]);
  const data = new DataView(encodeWav(samples, OUTPUT_RATE));
  assert.equal(data.byteLength, 52);
  assert.equal(data.getUint32(24, true), OUTPUT_RATE);
  assert.equal(data.getUint32(40, true), 8);
  assert.equal(data.getInt16(46, true), 32767);
  assert.equal(data.getInt16(48, true), -32768);
});

test('processes a maximum-length clip within an interactive budget', () => {
  const demo = createDemo();
  const input = new Float32Array(OUTPUT_RATE * 60);
  for (let i = 0; i < 12; i++) input.set(demo.samples, i * demo.samples.length);
  const start = performance.now();
  const result = renderFromBank(input, OUTPUT_RATE, bank);
  assert.equal(result.samples.length, input.length);
  assert.ok(result.meows >= 84);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 15000, `${elapsed}ms exceeds interactive budget`);
  console.log(`60 seconds of audio processed in ${elapsed.toFixed(0)} ms on this machine`);
});

test('resampling preserves duration and a constant signal', () => {
  const result = resample(new Float32Array(44100).fill(0.25), 44100, 8000);
  assert.equal(result.length, 8000);
  assert.ok(result.every((value) => Math.abs(value - 0.25) < 0.001));
});

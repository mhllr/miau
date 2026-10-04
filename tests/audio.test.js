import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { detectPitch, analyze, renderCat, createDemo, encodeWav, resample, prepareSample, OUTPUT_RATE } from '../src/audio.js';
import { readWav } from './helpers.js';

const cat = readWav(new URL('../public/audio/meow.wav', import.meta.url));
const energy = (samples) => samples.reduce((sum, value) => sum + value * value, 0);

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
  const catAnalysis = analyze(result.samples, result.sampleRate);
  assert.ok(catAnalysis.events[2].pitch > catAnalysis.events[0].pitch * 1.3, 'cat melody should rise with the input');
  assert.ok(catAnalysis.events[5].pitch < catAnalysis.events[2].pitch * 0.8, 'cat melody should descend with the input');
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
  const result = renderCat(input, OUTPUT_RATE, cat.samples, cat.sampleRate);
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

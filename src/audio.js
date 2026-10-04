export const ANALYSIS_RATE = 8000;
export const OUTPUT_RATE = 24000;
export const MAX_SECONDS = 60;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

export function resample(input, fromRate, toRate) {
  const output = new Float32Array(Math.round(input.length * toRate / fromRate));
  const ratio = fromRate / toRate;
  // Average each source interval when reducing rate to limit aliasing.
  for (let i = 0; i < output.length; i++) {
    const position = i * ratio;
    if (ratio > 1) {
      let total = 0, weight = 0;
      for (let j = Math.floor(position); j < Math.ceil(position + ratio); j++) {
        const w = Math.max(0, Math.min(j + 1, position + ratio) - Math.max(j, position));
        total += (input[j] || 0) * w;
        weight += w;
      }
      output[i] = total / weight;
    } else {
      const index = Math.floor(position), fraction = position - index;
      output[i] = (input[index] || 0) * (1 - fraction) + (input[index + 1] || 0) * fraction;
    }
  }
  return output;
}

// YIN difference function: prefer the first convincing periodic minimum,
// rather than a high autocorrelation peak at an octave below the real pitch.
export function detectPitch(samples, offset = 0, rate = ANALYSIS_RATE) {
  const minLag = Math.floor(rate / 1000);
  const maxLag = Math.ceil(rate / 75);
  const window = 256;
  if (offset + window + maxLag >= samples.length) return 0;
  const difference = new Float32Array(maxLag + 1);
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = samples[offset + i] - samples[offset + i + lag];
      sum += delta * delta;
    }
    running += sum;
    difference[lag] = running > 1e-12 ? sum * lag / running : 1;
  }
  for (let lag = minLag; lag < maxLag - 1; lag++) {
    if (difference[lag] < 0.18) {
      while (lag < maxLag - 1 && difference[lag + 1] < difference[lag]) lag++;
      const left = difference[lag - 1], right = difference[lag + 1];
      const denominator = left - 2 * difference[lag] + right;
      const refined = lag + (Math.abs(denominator) > 1e-9 ? (left - right) / (2 * denominator) : 0);
      return rate / refined;
    }
  }
  return 0;
}

export function analyze(input, rate, onProgress = () => {}) {
  const signal = resample(input, rate, ANALYSIS_RATE);
  const hop = 160;
  const frames = [];
  let maxRms = 0;
  for (let offset = 0; offset < signal.length; offset += hop) {
    let energy = 0;
    const end = Math.min(signal.length, offset + hop);
    for (let j = offset; j < end; j++) energy += signal[j] ** 2;
    const rms = Math.sqrt(energy / (end - offset));
    maxRms = Math.max(maxRms, rms);
    frames.push({ time: offset / ANALYSIS_RATE, rms, pitch: 0 });
  }
  if (maxRms < 0.0001) throw new Error('This clip is silent. Try a recording with a clear voice.');
  const sorted = frames.map((f) => f.rms).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.15)] || 0;
  const threshold = Math.max(0.00005, maxRms * 0.055, Math.min(floor * 2, maxRms * 0.18));
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (frame.rms >= threshold) frame.pitch = detectPitch(signal, i * hop);
    if (i % 100 === 0) onProgress(0.1 + i / frames.length * 0.55);
  }
  const voiced = frames.filter((f) => f.pitch > 0 && f.rms >= threshold);
  if (voiced.length < 3) throw new Error('We couldn’t find a clear voice. Try a short solo vocal without background music.');
  const events = [];
  let current = null, gap = 0;
  function finish() {
    if (current && current.end - current.start >= 0.06) {
      current.pitch = median(current.pitches) || median(voiced.map((f) => f.pitch));
      events.push(current);
    }
    current = null;
  }
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const active = frame.rms >= threshold;
    if (!active) {
      gap++;
      if (gap >= 4) finish();
      continue;
    }
    const previous = frames[i - 1];
    const age = current ? frame.time - current.start : 0;
    const changedNote = current && frame.pitch && current.pitches.length &&
      Math.abs(Math.log2(frame.pitch / median(current.pitches.slice(-5)))) > 0.17;
    const newSyllable = age > 0.16 && previous && frame.rms > previous.rms * 1.9 && previous.rms < maxRms * 0.35;
    if (current && (age >= 0.7 || (age > 0.16 && changedNote) || newSyllable || gap >= 2)) finish();
    if (!current) current = { start: Math.max(0, frame.time - 0.01), end: frame.time, pitches: [], level: 0 };
    current.end = frame.time + 0.02;
    current.level = Math.max(current.level, frame.rms);
    if (frame.pitch) current.pitches.push(frame.pitch);
    gap = 0;
  }
  finish();
  return { events, frames, maxRms, medianPitch: median(voiced.map((f) => f.pitch)) };
}

export function prepareSample(sample, rate) {
  const input = resample(sample, rate, OUTPUT_RATE);
  let peak = 0;
  for (const value of input) peak = Math.max(peak, Math.abs(value));
  if (peak < 0.001) throw new Error('The cat sound could not be loaded. Refresh the page and try again.');
  let start = 0, end = input.length;
  while (start < end && Math.abs(input[start]) < peak * 0.02) start++;
  while (end > start && Math.abs(input[end - 1]) < peak * 0.02) end--;
  start = Math.max(0, start - 240);
  end = Math.min(input.length, end + 240);
  const trimmed = input.slice(start, end);
  for (let i = 0; i < trimmed.length; i++) trimmed[i] /= peak;
  const analysis = resample(trimmed, OUTPUT_RATE, ANALYSIS_RATE);
  const pitches = [];
  for (let i = 0; i < analysis.length - 400; i += 160) {
    const pitch = detectPitch(analysis, i);
    if (pitch) pitches.push(pitch);
  }
  return { samples: trimmed, pitch: median(pitches) || 550 };
}

// Waveform-similarity overlap-add (WSOLA). Match each incoming frame to
// the outgoing waveform, rather than snapping to one assumed pitch period.
// A real meow's pitch and formants change throughout the recording.
function stretchSmooth(source, count) {
  if (source.length === count) return source.slice();
  const output = new Float32Array(count);
  const weights = new Float32Array(count);
  const frameSize = Math.max(16, Math.floor(Math.min(1536, count / 3, source.length / 3) / 2) * 2);
  const hop = frameSize / 2;
  const maxSourceStart = Math.max(0, source.length - frameSize);
  const lastOutputStart = Math.max(0, count - frameSize);
  const positions = [];
  for (let position = 0; position < lastOutputStart; position += hop) positions.push(position);
  positions.push(lastOutputStart);
  const searchRadius = 480; // 20 ms accommodates low voiced pitches.
  let previous = 0, previousPosition = 0;
  for (const position of positions) {
    const expected = Math.round(clamp(position / Math.max(1, count - frameSize), 0, 1) * maxSourceStart);
    let selected = expected;
    if (position > 0) {
      const advance = position - previousPosition;
      const overlap = frameSize - advance;
      const reference = previous + advance;
      const low = Math.max(0, expected - searchRadius);
      const high = Math.min(maxSourceStart, expected + searchRadius);
      let referenceEnergy = 0;
      for (let j = 0; j < overlap; j += 4) referenceEnergy += (source[reference + j] || 0) ** 2;
      if (referenceEnergy > 1e-8) {
        const score = (candidate) => {
          let dot = 0, energy = 0;
          for (let j = 0; j < overlap; j += 4) {
            const value = source[candidate + j] || 0;
            dot += value * (source[reference + j] || 0);
            energy += value * value;
          }
          return energy > 1e-8 ? dot / Math.sqrt(referenceEnergy * energy) -
            0.01 * Math.abs(candidate - expected) / searchRadius : -Infinity;
        };
        let best = score(expected);
        for (let candidate = low; candidate <= high; candidate += 4) {
          const match = score(candidate);
          if (match > best) { best = match; selected = candidate; }
        }
        const coarse = selected;
        for (let candidate = Math.max(low, coarse - 3); candidate <= Math.min(high, coarse + 3); candidate++) {
          const match = score(candidate);
          if (match > best) { best = match; selected = candidate; }
        }
      }
    }
    for (let j = 0; j < frameSize && position + j < count; j++) {
      const weight = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / frameSize);
      output[position + j] += (source[selected + j] || 0) * weight;
      weights[position + j] += weight;
    }
    previous = selected;
    previousPosition = position;
  }
  for (let i = 0; i < count; i++) if (weights[i] > 1e-6) output[i] /= weights[i];
  return output;
}

export function renderCat(input, rate, rawSample, sampleRate, onProgress = () => {}) {
  const analysis = analyze(input, rate, onProgress);
  const sample = prepareSample(rawSample, sampleRate);
  const output = new Float32Array(Math.ceil(input.length / rate * OUTPUT_RATE));
  // Keep relative melody, shifting its register by whole octaves toward the cat.
  const octave = 2 ** Math.round(Math.log2(sample.pitch / analysis.medianPitch));
  analysis.events.forEach((event, index) => {
    const next = analysis.events[index + 1];
    const length = clamp(event.end - event.start + 0.06, 0.14, 0.85);
    const end = Math.min(event.start + length, next ? next.start : Infinity, output.length / OUTPUT_RATE);
    const count = Math.max(1, Math.floor((end - event.start) * OUTPUT_RATE));
    const start = Math.round(event.start * OUTPUT_RATE);
    const pitchRatio = clamp(event.pitch * octave / sample.pitch, 0.5, 2);
    const gain = 0.8 * Math.sqrt(event.level / analysis.maxRms);
    // Pitch first with continuous sample playback, then independently fit
    // duration using waveform-matched overlaps. No periodic phase resets.
    const pitched = resample(sample.samples, OUTPUT_RATE * pitchRatio, OUTPUT_RATE);
    const eventBuffer = stretchSmooth(pitched, count);
    const fade = Math.min(240, count / 4);
    for (let j = 0; j < count && start + j < output.length; j++) {
      const envelope = Math.min(1, j / fade, (count - 1 - j) / fade);
      output[start + j] += eventBuffer[j] * gain * envelope;
    }
    onProgress(0.65 + (index + 1) / analysis.events.length * 0.3);
  });
  let peak = 0;
  for (const value of output) peak = Math.max(peak, Math.abs(value));
  if (peak > 0.001) for (let i = 0; i < output.length; i++) output[i] *= 0.9 / peak;
  return { samples: output, sampleRate: OUTPUT_RATE, meows: analysis.events.length };
}

export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true);
  text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const value = clamp(samples[i], -1, 1);
    view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  return buffer;
}

export function createDemo(rate = OUTPUT_RATE) {
  const samples = new Float32Array(rate * 5);
  const notes = [220, 261.63, 329.63, 293.66, 261.63, 220, 329.63];
  notes.forEach((frequency, n) => {
    const start = Math.round((0.25 + n * 0.62) * rate);
    for (let j = 0; j < rate * 0.42; j++) {
      const t = j / rate;
      const envelope = Math.min(1, t / 0.025, (0.42 - t) / 0.06);
      samples[start + j] = envelope * (0.3 * Math.sin(2 * Math.PI * frequency * t) +
        0.12 * Math.sin(4 * Math.PI * frequency * t) + 0.06 * Math.sin(6 * Math.PI * frequency * t));
    }
  });
  return { samples, sampleRate: rate };
}

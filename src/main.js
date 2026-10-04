import { MAX_SECONDS, encodeWav, createDemo } from './audio.js';

const $ = (id) => document.getElementById(id);
let input = null, audioContext = null, worker = null, samplePromise = null;
let sourceUrl = null, resultUrl = null, busy = false, generation = 0;

function context() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error('This browser can’t process audio. Open this page in a recent Safari, Chrome, Firefox, or Edge.');
  if (!audioContext || audioContext.state === 'closed') audioContext = new Context();
  return audioContext;
}

function mono(buffer) {
  const output = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < samples.length; i++) output[i] += samples[i] / buffer.numberOfChannels;
  }
  return output;
}

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

function setBusy(value) {
  busy = value;
  $('file-input').disabled = value;
  $('demo-button').disabled = value;
  $('convert-button').disabled = value || !input;
  $('convert-button').firstChild.textContent = value ? 'Teaching the cat your tune… ' : 'Make it meow ';
  $('progress').hidden = !value;
  $('workbench-title').textContent = value ? 'One cat moment…' : input ? 'Ready for the remix.' : 'Let’s hear you.';
}

function clearResult() {
  $('cat-audio').pause();
  $('source-audio').pause();
  $('results').hidden = true;
  $('cat-audio').removeAttribute('src');
  $('cat-audio').load();
  $('download-button').removeAttribute('href');
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = null;
}

function installInput(samples, sampleRate, name, isDemo = false) {
  clearResult();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  input = { samples, sampleRate, name };
  sourceUrl = URL.createObjectURL(new Blob([encodeWav(samples, sampleRate)], { type: 'audio/wav' }));
  $('source-audio').src = sourceUrl;
  $('file-title').textContent = name;
  $('file-description').textContent = `${(samples.length / sampleRate).toFixed(1)} seconds · ready to become a cat`;
  $('drop-zone').classList.add('has-file');
  $('demo-explanation').hidden = !isDemo;
  $('progress').value = 0;
  status('Your vocal is ready. Let’s make it meow.');
  setBusy(false);
}

async function loadFile(file) {
  if (!file || busy) return;
  const token = ++generation;
  input = null;
  clearResult();
  setBusy(true);
  status('Opening your audio…');
  try {
    if (file.size > 30 * 1024 * 1024) throw new Error('That file is over 30 MB. Choose a smaller vocal clip.');
    let decoded;
    try { decoded = await context().decodeAudioData(await file.arrayBuffer()); }
    catch { throw new Error('This browser couldn’t open that audio. Try a WAV or MP3 file.'); }
    if (token !== generation) return;
    if (decoded.duration > MAX_SECONDS + 0.01) throw new Error('That clip is longer than 60 seconds. Trim it to your favorite part and try again.');
    if (decoded.duration < 0.15) throw new Error('That clip is too short. Try at least a second of singing.');
    installInput(mono(decoded), decoded.sampleRate, file.name);
  } catch (error) {
    if (token !== generation) return;
    $('file-title').textContent = 'Try another vocal';
    $('file-description').textContent = 'Choose a short audio recording.';
    $('drop-zone').classList.remove('has-file');
    $('demo-explanation').hidden = true;
    status(error.message, true);
  } finally { if (token === generation) setBusy(false); }
}

async function catSample() {
  if (!samplePromise) {
    samplePromise = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/meow.wav`);
      if (!response.ok) throw new Error('The cat sound couldn’t load. Check your connection and try again.');
      const decoded = await context().decodeAudioData(await response.arrayBuffer());
      return { samples: mono(decoded), sampleRate: decoded.sampleRate };
    })().catch((error) => { samplePromise = null; throw error; });
  }
  return samplePromise;
}

function drawWave(canvas, samples, color) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  const bars = 150, stride = samples.length / bars;
  for (let bar = 0; bar < bars; bar++) {
    let peak = 0;
    for (let j = Math.floor(bar * stride); j < (bar + 1) * stride; j++) peak = Math.max(peak, Math.abs(samples[j] || 0));
    const height = Math.max(2, peak * canvas.height * 0.92);
    ctx.fillRect(bar * 6, (canvas.height - height) / 2, 3, height);
  }
}

async function convert() {
  if (!input || busy) return;
  clearResult();
  setBusy(true);
  $('progress').value = 0.02;
  status('Finding the melody. Preparing the meows.');
  try {
    const sample = await catSample();
    worker = new Worker(new URL('./audio-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        $('progress').value = data.progress;
        status(data.progress < 0.65 ? 'Finding your melody…' : 'Putting the cat on vocals…');
      } else if (data.type === 'error') {
        status(data.message, true);
        finishWorker();
      } else if (data.type === 'complete') {
        resultUrl = URL.createObjectURL(new Blob([data.wav], { type: 'audio/wav' }));
        $('cat-audio').src = resultUrl;
        $('download-button').href = resultUrl;
        const basename = input.name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}\-_ ]/gu, '').slice(0, 70) || 'vocal';
        $('download-button').download = `${basename}-miau.wav`;
        $('meow-count').textContent = `${data.meows} meows`;
        $('duration').textContent = `${(input.samples.length / input.sampleRate).toFixed(1)} sec`;
        drawWave($('input-wave'), input.samples, '#637342');
        drawWave($('output-wave'), data.samples, '#233bea');
        $('results').hidden = false;
        $('progress').value = 1;
        status('Done. Your cat cover is ready to play and download.');
        finishWorker();
      }
    };
    worker.onerror = () => {
      status('The audio processing stopped. Refresh the page or try a shorter clip.', true);
      finishWorker();
    };
    // Copies allow retrying without detaching input or the cached cat sample.
    const inputCopy = input.samples.slice(), sampleCopy = sample.samples.slice();
    worker.postMessage({ input: inputCopy, rate: input.sampleRate, sample: sampleCopy, sampleRate: sample.sampleRate },
      [inputCopy.buffer, sampleCopy.buffer]);
  } catch (error) {
    status(error.message || 'Couldn’t make the cat version. Try again.', true);
    finishWorker();
  }
}

function finishWorker() {
  worker?.terminate();
  worker = null;
  setBusy(false);
}

$('file-input').addEventListener('change', (event) => { loadFile(event.target.files[0]); event.target.value = ''; });
$('demo-button').addEventListener('click', () => {
  if (busy) return;
  const demo = createDemo();
  installInput(demo.samples, demo.sampleRate, 'A little demo melody', true);
  convert();
});
$('convert-button').addEventListener('click', convert);
['dragenter', 'dragover'].forEach((event) => $('drop-zone').addEventListener(event, (e) => {
  e.preventDefault(); if (!busy) $('drop-zone').classList.add('dragging');
}));
['dragleave', 'drop'].forEach((event) => $('drop-zone').addEventListener(event, (e) => {
  e.preventDefault(); $('drop-zone').classList.remove('dragging');
  if (event === 'drop') loadFile(e.dataTransfer.files[0]);
}));
// Dropping outside the target should not navigate away from an in-progress remix.
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', (event) => event.preventDefault());
[$('source-audio'), $('cat-audio')].forEach((audio) => audio.addEventListener('play', () => {
  [$('source-audio'), $('cat-audio')].forEach((other) => { if (other !== audio) other.pause(); });
}));
window.addEventListener('pagehide', () => {
  if (worker) {
    finishWorker();
    status('Processing was paused when you left. Press Make it meow to try again.');
  }
});

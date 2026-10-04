import { renderCat, encodeWav } from './audio.js';

self.onmessage = ({ data }) => {
  try {
    const result = renderCat(data.input, data.rate, data.sampleBank,
      (progress) => self.postMessage({ type: 'progress', progress }));
    const wav = encodeWav(result.samples, result.sampleRate);
    self.postMessage({ type: 'complete', ...result, wav }, [result.samples.buffer, wav]);
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'Something went wrong. Try another vocal clip.' });
  }
};

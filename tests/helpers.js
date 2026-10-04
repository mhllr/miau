import { readFileSync } from 'node:fs';

export function readWav(path) {
  const file = readFileSync(path);
  let offset = 12, format = null, audio = null;
  while (offset + 8 <= file.length) {
    const id = file.toString('ascii', offset, offset + 4);
    const size = file.readUInt32LE(offset + 4);
    if (id === 'fmt ') format = {
      encoding: file.readUInt16LE(offset + 8), channels: file.readUInt16LE(offset + 10),
      sampleRate: file.readUInt32LE(offset + 12), bits: file.readUInt16LE(offset + 22),
    };
    if (id === 'data') audio = file.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  if (!format || !audio || format.encoding !== 1 || format.bits !== 16) throw new Error('Expected 16-bit PCM fixture');
  const samples = new Float32Array(audio.length / 2 / format.channels);
  for (let i = 0; i < samples.length; i++) {
    for (let channel = 0; channel < format.channels; channel++) {
      samples[i] += audio.readInt16LE((i * format.channels + channel) * 2) / 32768 / format.channels;
    }
  }
  return { samples, sampleRate: format.sampleRate };
}

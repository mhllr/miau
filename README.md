# Miau

Your voice, but cat. A static browser demo that turns an uploaded vocal into real recorded cat meows, with preview and WAV download.

**Live demo: https://mhllr.github.io/miau/**

## Run locally

Requires Node.js 22.12+ or a current supported Node release.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Choose a vocal recording, press **Make it meow**, listen, and download. **Try a demo melody** runs an immediate example with a clearly labeled synthetic input.

## Build and publish

```sh
npm run build
```

`dist/` is a complete static site. Upload it to any static host. Relative production paths support a subdirectory such as GitHub Pages. The included GitHub Actions workflow tests, builds, and publishes `main` once GitHub Pages is enabled with **GitHub Actions** as its source.

## Audio approach

- Web Audio decodes files locally and mixes channels to mono.
- A worker measures loudness, estimates pitch using YIN, and identifies phrases, note changes, and syllable-like onsets.
- Continuous sample resampling sets each meow's pitch. Waveform-similarity overlap-add (WSOLA) fits its duration using correlated, phase-coherent overlaps, following the input melody and relative loudness without fixed-rate grain resets.
- The melody shifts by whole octaves toward the sample’s natural register where needed.
- Output is mono, 24 kHz, 16-bit PCM WAV, with the input’s duration and a normalized peak below clipping.
- There are no recording uploads, analytics, external runtime assets, API keys, or backend services. The page fetches its bundled static assets only.

## Limits

Clips must be at most 60 seconds and 30 MB. Input format support follows the browser’s audio decoder; WAV and MP3 are the safest choices. Clean solo singing and humming work best. Speech is approximate. Background music and multiple voices may confuse tracking. This is a fun sampler demo, not a trained voice-conversion model.

## Checks

```sh
npm test
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:browser
```

The DSP checks cover phase-coherent time compression at multiple pitches, harmonic pitch detection, silence and noise rejection, timing, melody direction in the cat output, safe levels, WAV headers, and a full-length processing budget. The browser check exercises desktop/mobile file decoding, conversion, playback, download, and error recovery. Set `TEST_URL` to check a production deployment instead.

For Chromium, Firefox, and WebKit engine checks, run `npx playwright install chromium firefox webkit`, then `npm run test:engines`. Set `VOCAL_FIXTURE` to the path of a 16-bit PCM WAV voice recording to exercise a real vocal fixture instead of the synthetic melody.

Asset sources and licenses are in [`public/credits.txt`](public/credits.txt). Product vocabulary is in [`CONTEXT.md`](CONTEXT.md), with scope in [`docs/MVP.md`](docs/MVP.md).

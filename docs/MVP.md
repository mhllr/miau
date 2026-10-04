# Miau browser demo

Status: implemented and published at https://mhllr.github.io/miau/.

## Goal

A fun, shareable browser demo that turns an uploaded vocal recording into downloadable cat meowing. Prioritize a quick first useful version and a clearly recognizable cat sound.

## Confirmed decisions

- Deliver a browser demo for the first version.
- Visitors supply a vocal recording and download the resulting cat audio.
- Use real recorded cat meows as the sound source.
- Follow the vocal's pitch, timing, and loudness approximately; do not preserve words.
- This is an entertainment demo, not a production music tool.
- A Mac VST3 is no longer required for the first version.

## Recommended implementation scope

- A single page: select an audio file, generate cat audio, preview, and download.
- Process audio on the visitor's device; deploy the page to static hosting.
- Decode browser-supported audio files and export WAV.
- Estimate vocal activity, pitch, and loudness, then render a sample-based cat performance.
- Bundle a genuine cat recording with reuse and redistribution rights, including attribution if required.
- Show progress and useful messages for unsupported files or clips with no detectable vocal activity.
- Keep the interface usable on desktop and mobile browsers.

## Assumptions to confirm with the scope

- Start with short clips, capped at 60 seconds.
- A single exposed voice works best; full songs and overlapping voices are outside the initial quality target.
- Recognizable, amusing meows matter more than perfect melody transcription or studio-quality audio.
- Waiting for processing is acceptable; live microphone processing is unnecessary.

## Parked risks

- Pitch and phrase tracking will be less reliable for speech, noisy clips, and full mixes.
- Repeated samples may sound repetitive; the first version can use a small sample set.
- Browser decoding support and processing speed vary, especially on mobile; verify common browsers with real audio.
- Future VST3 delivery would require native integration work.

## First useful validation

Use a short, clean sung phrase. The demo should produce unmistakable cat meows that roughly follow its tune and rhythm, support playback, and download a playable WAV. Silence should not produce unintended meows.

## Recommended next action

After scope confirmation, build the smallest end-to-end audio path first: select a vocal clip, render real meows, preview, and download. Validate the sound before polishing the shareable page, then deploy it to a public URL.

## Delivery verification

- All eight DSP checks pass, including melody direction in the rendered cat output, silence/noise rejection, timing, peak levels, WAV encoding, and a 60-second processing budget.
- Desktop and mobile Chromium checks pass for decoding, conversion, playback, download, invalid files, silence, and recovery.
- Chromium, Firefox, and WebKit checks pass locally and on the deployed site, including a spoken-voice WAV fixture and the 60-second limit.
- GitHub Actions builds and deploys the static site after changes to main.
- The actual meow is freemaster2's CC0 Siamese cat recording; its source and all bundled asset credits are included in public/credits.txt.

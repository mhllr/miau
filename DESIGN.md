---
version: alpha
name: Miau
description: A flat, electric karaoke duet song sheet with blunt lettering and an immediately usable audio workbench.
colors:
  blue: "#233bea"
  yellow: "#edff80"
  white: "#f7f8ff"
  ink: "#18216a"
  muted: "#424c34"
  line: "#b5c35f"
  drop-border: "#758137"
  blue-hover: "#1429c2"
  disabled-bg: "#c3d173"
  disabled-text: "#4d5834"
  error: "#92262c"
  progress-track: "#cedb83"
  audio-panel: "#e3eeaf"
  footer-rule: "#7081f3"
  source-wave: "#637342"
typography:
  display:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "88px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  wordmark:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  upload-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "19px"
    fontWeight: 700
  action:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 700
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
  status:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  surface: "14px"
  drop-zone: "10px"
  action: "8px"
  chooser: "7px"
  caption: "5px"
  progress: "3px"
spacing:
  inline: "8px"
  compact: "10px"
  control: "12px"
  support: "14px"
  group: "16px"
  inset: "20px"
  space: "24px"
  intermediate-inset: "25px"
  section: "32px"
  intermediate-gutter: "36px"
  desktop-gutter: "64px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "17px 20px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-text}"
  button-download:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "17px 20px"
    width: "100%"
  button-download-hover:
    backgroundColor: "{colors.blue-hover}"
  button-choose:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.chooser}"
    padding: "12px 20px"
  button-choose-hover:
    backgroundColor: "{colors.blue}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "5px 3px"
  button-text-hover:
    textColor: "{colors.blue}"
  workbench:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "32px"
  upload-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.drop-zone}"
    padding: "27px 18px 22px"
  upload-field-dragging:
    backgroundColor: "{colors.white}"
  wordmark:
    textColor: "{colors.white}"
    typography: "{typography.wordmark}"
  progress:
    backgroundColor: "{colors.progress-track}"
    rounded: "{rounded.progress}"
    height: "6px"
    width: "100%"
---

# Design System: Miau

## Overview

**Creative North Star: "The Karaoke Duet Song Sheet"**

Miau is loud, friendly, and deliberately unserious. Blunt, tightly set display lettering and broad electric color fields give a small audio tool the immediacy of a lyric sheet. A real cat photograph supplies the personality; the interface stays practical, with clear file selection, understated supporting text, and native playback controls.

The world is flat and spacious outside the workbench, compact and orderly inside it. Personality comes from scale, color contrast, a lightly tilted photo caption, and the actual sound comparison rather than extra interface chrome. The same workbench carries input, progress, and output, so a playful promise resolves into something visitors can hear and keep.

**Key Characteristics:**
- Electric cobalt ground and an acid-yellow working surface.
- Self-hosted, heavy Bricolage Grotesque display lettering with neutral system text.
- Rounded rectangles, thin rules, and flat surfaces without shadows.
- Real cat photography and signal-derived rectangular waveform bars.
- Direct, visible controls with restrained color-only transitions.

Recorded from `index.html`, `src/style.css`, and `src/main.js`, checked against the four reviewed desktop/mobile captures in `.impeccable/review/`. The finish review records **ship**, with no material fixes. Frontmatter follows the [official DESIGN.md schema](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md); `.impeccable/design.json` holds extension metadata and scoped component previews. Its synthesized tonal strips are preview aids, not additional shipped color tokens. The display size token records the implemented desktop upper bound; the responsive CSS below governs actual headline sizing.

## Colors

The palette pairs a saturated electric field with a sharp yellow-green working surface; deep blue and olive supporting tones keep the controls legible.

### Primary
- **Electric Cobalt** (`blue`): page ground, enabled conversion/download actions, output waveform, caption star, and the wordmark's surrounding field.
- **Deep Cobalt** (`blue-hover`): the darker hover state for conversion and download.

### Secondary
- **Acid Yellow** (`yellow`): workbench background, the emphasized display phrase, wordmark dot, scrollbar thumb, and selected text background.
- **Olive Rule** (`line`) and **Upload Olive** (`drop-border`): result divider and upload boundary respectively.
- **Quiet Olive** (`muted`): format guidance, status, demo disclosure, and result notes on yellow.
- **Paused Lime** (`disabled-bg`) and **Paused Olive** (`disabled-text`): disabled conversion state; these do not replace enabled action colors.
- **Progress Lime** (`progress-track`) and **Playback Lime** (`audio-panel`): progress track and the WebKit native audio-control panel.
- **Source Olive** (`source-wave`): original-audio waveform, distinct from the cobalt cat output.

### Tertiary
- **Error Red** (`error`): semibold error status only, preserving a textual explanation as well as a color change.

### Neutral
- **Cool White** (`white`): text on cobalt or deep ink, photo-caption surface, and drag-over upload feedback.
- **Midnight Ink** (`ink`): headings and primary text on yellow, plus the file-chooser background.
- **Periwinkle Rule** (`footer-rule`): the quiet footer separator against cobalt.

**The Two Fields Rule.** Use cobalt as the surrounding ground and acid yellow as the working surface; reserve their supporting tones for control states, guidance, and separators.

## Typography

**Display Font:** Bricolage Grotesque, registered in CSS as `Bricolage`, with `sans-serif` fallback. The self-hosted font face supplies weight (800), loaded from `/fonts/bricolage-800.ttf` with `font-display: swap`.

**Body Font:** the platform-native stack declared in the frontmatter. There is no separate mono face; durations and counts use tabular numerals.

**Character:** display lettering is heavy, tightly tracked, and balanced; text and controls use a familiar, matter-of-fact system voice. Labels remain sentence case rather than becoming ornamental uppercase headings.

### Hierarchy
- **Display:** the main promise uses weight (800), line height (1), and tracking (-0.04em). Source sizing is `clamp(54px, 6.3vw, 88px)` above the intermediate breakpoint; the frontmatter stores its upper desktop dimension for schema portability.
- **Wordmark:** weight (800), size (44px), line height (1), tracking (-0.04em); reduced to (36px) on mobile.
- **Headline:** workbench heading at (30px), line height (1.1), tracking (-0.025em); mobile size (28px).
- **Title:** result heading at (24px), weight (800), tracking (-0.025em). No explicit line height is assigned in the source.
- **Body:** introductory copy at (18px), line height (1.6); mobile size (16px). Upload explanatory copy uses (14px) and line height (1.5).
- **Upload title:** (19px), weight (700), with arbitrary filename wrapping.
- **Action / label:** primary actions at (17px/700), chooser and photo caption at (14px/600), track labels at (13px/600).
- **Status / metadata:** status at (13px), line height (1.5); limits, duration, formats, result note, and privacy note at (12px). Native control typography remains browser-owned.

**The Two Voices Rule.** Keep expressive Bricolage lettering for the wordmark and headings; use neutral system text for instructions, controls, and measurements.

## Layout

The shared page container is centered with maximum width (1400px). Header, main, and footer share desktop side padding (64px). The main region uses two top-aligned columns (`1.06fr 1fr`) with a (64px) gap, top padding (36px), and bottom padding (64px). The header uses (34px) vertical padding and opposing wordmark/note alignment. The workbench starts with (32px) internal padding.

Spacing is contextual, not a strict mathematical scale. Repeated groups use (24px): workbench heading separation, track spacing, privacy separation, and footer gap. Supporting gaps recur at (8px), (12px), and (16px); larger regions use (32px), (36px), and (64px). The root `--space` declaration is (24px), but the shipped stylesheet uses literal spacing values rather than `var(--space)`.

### Responsive rules

| Condition | Actual source behavior |
| --- | --- |
| Above (1050px) | Two columns; (64px) side padding/gap; headline `clamp(54px, 6.3vw, 88px)`; workbench padding (32px). |
| At or below (1050px) | Side padding and grid gap become (36px); workbench padding becomes (25px); heading row wraps with (10px) gap; display size becomes (64px). |
| At or below (760px) | Single column; side padding (22px); main top/bottom padding (20px/36px) and gap (32px); headline `clamp(49px, 11.8vw, 78px)`; workbench padding (24px 20px); upload horizontal padding (14px). |

Mobile header padding is (24px) top and (20px) bottom. Its note uses (12px) text, maximum width (140px), right alignment, and line height (1.5). The footer becomes a column with (14px) gap and left-aligned credits disclosure. The document's minimum width is (320px).

The cat image is at most (380px) wide and (230px) high on desktop, with `object-fit: cover` and position `center 42%`. Mobile removes the figure's width cap, reduces the image to (130px) high, and changes the crop to `center 39%`. Its caption shifts from a (-14px) bottom/right offset to bottom (-10px), right (12px).

Results expand within the existing workbench. They begin after (30px) with a one-pixel divider and (26px) top padding; waveform canvases are full-width and (46px) high, followed by full-width native audio controls at (38px). Conversion and download remain full-width at every breakpoint.

## Elevation & Depth

There are **no box shadows**. Depth comes from the contrast between cobalt ground and yellow workbench, the cool-white caption overlapping the photograph, and thin upload/result/footer boundaries. The caption's rotation (-4deg) is a native part of this playful world, not a raised-card shadow treatment.

**The Flat Signal Rule.** Separate regions with broad color fields and thin rules; keep signal bars and controls flat rather than adding dimensional decoration.

Motion is limited to upload background/border-color changes and primary-action background changes, each (180ms ease-out). The chooser and text action change color without an explicit transition. There is no custom hover movement or active transform. `prefers-reduced-motion: reduce` disables all transitions and restores automatic scroll behavior.

## Shapes

The main shape is a softly rounded rectangle: photo and workbench share the surface radius; upload boundaries are slightly tighter, and actions tighter again. The frontmatter owns the exact radius values. A small rectangular caption tilts across the photo; it is not a pill or a generic tag family.

The upload boundary is a one-pixel dashed olive line when empty, solid after file installation, and cobalt during drag-over. Result and footer separators are one-pixel solid rules. Drawn inline SVG supplies icons: standard action icons are (22px), the upload icon (43px), caption star (24px), and privacy lock (15px).

Waveforms use rectangular geometry, not smoothed curves: the drawing routine samples (150) peak groups, places bars every (6) backing-canvas units, and draws them (3) units wide. Their height is derived from signal amplitude with a minimum (2) and a maximum factor (0.92) of backing-canvas height. The actual canvases are (900 × 100), displayed at the layout dimensions above.

## Components

### Buttons

Confident, direct actions with little chrome.

- **Conversion / download:** cool-white text on cobalt, full-width, shared action radius, padding (17px 20px), icon gap (13px). Darker cobalt on enabled hover. Download is an anchor with a generated WAV URL and download filename, not a second processing command.
- **Chooser:** deep-ink surface and cool-white text, inline-flex, padding (12px 20px), icon gap (18px), tighter chooser radius; cobalt on hover. It is a label for the visually hidden native file input.
- **Text action:** underlined ink with padding (5px 3px), no border or filled background; cobalt on hover. It inherits the surrounding demo row's (13px) size and uses weight (600); disabled opacity is (0.55).
- **Focus:** keyboard focus uses a (3px) current-color outline with offset (5px). File-input focus is reflected on its visible chooser using a cobalt outline with the same dimensions.
- **Disabled / busy:** conversion uses the dedicated paused colors and a not-allowed cursor. Busy work disables file input, demo, and conversion; progress and honest status text carry the state. No separate custom pressed styling is implemented.

### Upload field

A single obvious boundary for file selection and drag/drop. Use the documented padding and radius, centered contents, the drawn upload icon, filename/title, explanatory line, native chooser, and format/size guidance. The underlying file input is clipped to a one-pixel box, not removed from the accessibility tree. Long filenames wrap anywhere.

Empty uses a dashed boundary; installed input switches it to solid. Drag-over adds cool white and a cobalt boundary. Errors update the title and explanatory text and put a semibold red message in the live status area; the field does not invent an independent error-colored outline.

### Workbench / result container

A warm-looking but electric working field, without elevation. Use acid yellow, ink text, the surface radius, and responsive padding. The heading and clip-limit row can wrap; preserve that behavior when status wording grows.

Input, processing, and results share this container. The progress bar is (6px) high with the progress radius, lime track, and cobalt fill. It is hidden when idle. The live status region uses polite announcements. Results remain hidden until processing completes, and changing input clears the prior result.

### Wordmark / credits navigation

The Bricolage wordmark is the home link, with an acid-yellow dot. Header text is a plain supporting note, not a navigation menu. Credits use native `details`/`summary`, maximum width (390px), right aligned on desktop and left aligned on mobile; links inherit color with underline offset (4px). Keep the browser's disclosure affordance.

### Photo caption

A cool-white, ink-text label with padding (10px 16px), weight (600), icon gap (8px), and a drawn cobalt star. The rotated rectangle overlays real cat photography. This is a photo-caption treatment, not a general purpose decorative badge.

### Duet playback

Two ordered track rows compare original vocal and cat output. Each has a left label, right-aligned duration or percentage, signal-derived canvas, and native audio controls. Original bars use source olive; generated bars use cobalt. Counts and durations use tabular numerals. Playing one audio element pauses the other.

Do not promise a custom player skin across browsers: only the WebKit controls-panel background is customized. The sidecar's playback preview intentionally leaves the canvas undrawn; the shipped runtime fills it from actual samples rather than decorative placeholder data.

## Do's and Don'ts

### Do:
- **Do** preserve the cobalt ground, acid-yellow working field, and legible ink/white text assignments.
- **Do** pair Bricolage headings with neutral system instructions and native controls.
- **Do** retain the actual responsive reflow, full-width actions, and wrapping workbench heading.
- **Do** keep visible keyboard focus, textual status/error feedback, and reduced-motion behavior.
- **Do** use actual audio samples for waveform geometry and clearly label the synthetic demo input.

### Don't:
- **Don't** add shadows or dimensional control effects to the flat fields and thin-rule vocabulary.
- **Don't** turn the tilted photo caption into a repeated decorative badge or eyebrow pattern.
- **Don't** replace real signal bars with invented waveform decoration.
- **Don't** use disabled olive tones for enabled actions or omit the textual explanation of an error.
- **Don't** assume the browser-owned audio controls have identical appearance across engines.

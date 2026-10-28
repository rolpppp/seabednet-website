# 004 — Home

**Status:** Ready for planning · **Phase:** 1 (static) → 2 (live samples) · **Depends on:** 001, 002; 003 for
precomputed samples · **Design:** DS §10.1, §9.11, §8

## Summary

The homepage lets a visitor understand and experience SeaBed-Net immediately. The interactive comparison is the hero:
one serif line, the image with its model output under a swipe divider, one primary action and the sample images. Below,
three honest examples (clear, typical, fails), one short paragraph with the headline numbers and footnotes, and links
onward. It is not a startup landing page.

## User scenarios

### US1 — A first-time visitor sees what the model does within seconds (P1)

**Acceptance scenarios**
1. **Given** the homepage, **When** it loads, **Then** the first viewport shows the statement "Explore underwater life
   with SeaBed-Net.", a one-line subline, and the comparison image, which occupies most of the hero.
2. **Given** the comparison, **When** the visitor drags the divider (pointer, touch) or presses arrow keys on it,
   **Then** the left side shows the image and the right side the model output, updating continuously.
3. **Given** the sample images row, **When** the visitor picks another sample (click, tap, Enter or Space), **Then**
   the hero crossfades to it in 220 ms (opacity only) and the selected circle shows a teal ring and
   `aria-current="true"`.

### US2 — The visitor moves on to the right next step (P1)

**Acceptance scenarios**
1. **Given** the hero, **When** the visitor activates "Try your own image", **Then** they go to `/try`.
2. **Given** the lower section, **When** the visitor activates "Read the results →" or "About the thesis →", **Then**
   they go to `/results` or `/about`.

### US3 — The visitor sees where the model fails as well as where it works (P2)

**Acceptance scenarios**
1. **Given** the "Where it works, and where it doesn't" section, **When** it renders, **Then** it shows three images
   labelled Clear, Typical and Fails, each with a one-line caption; the Fails example is a real failure.

### US4 — Numbers are honest and traceable (P1)

**Acceptance scenarios**
1. **Given** the summary paragraph, **When** it renders, **Then** "0.645 box AP", "0.638 mask AP" and the RUOD
   comparison come from `site_data.json`, each with a footnote marker whose popover states run, split and n
   (C-Art. I).

### US5 — Before Rolf confirms the JODD licence terms (P1)

**Acceptance scenarios**
1. **Given** `SAMPLES_ENABLED=false`, **When** Home loads, **Then** the hero shows the upload-first fallback: the same
   layout with an empty neutral well inviting a drop or "Try your own image", and the examples section uses the approved
   placeholder imagery or is hidden. [NEEDS CLARIFICATION: hide the examples section, or show labelled painted
   placeholders, while the licence is pending?]

## Edge cases

- Precomputed outputs missing for a sample → that sample is omitted from the row; if none remain, the fallback applies.
- Narrow screens → hero stacks: statement, image full width, button, sample circles (44 px targets).
- Reduced motion → crossfade ≤ 120 ms, no other motion.
- Overlay labels → only the top 3 detections are labelled (DS §8).

## Functional requirements

- **FR-001** Hero on the dark workspace surface; content below on the light reading surface (DS §10.1).
- **FR-002** Statement in `display` serif; subline in `small` `--text-2`; no other hero copy, statistics or gradients.
- **FR-003** Swipe comparison per DS §9.11 using the shared component, showing B0 output in "Both" mode at threshold
  0.30 with captions "Image" and "Model output".
- **FR-004** Sample images: up to 5 circular thumbnails (36 px, 44 px on touch) with accessible names; selection
  crossfades the hero.
- **FR-005** A caption under the hero states variant, threshold and (while applicable) that imagery is a placeholder.
- **FR-006** Examples section: three image wells with masks only, captions per DS §10.1.
- **FR-007** Summary paragraph (≤ 3 sentences) with two footnotes and a short notes list; numbers from `site_data.json`.
- **FR-008** Text buttons to Results and About; footer with credits.
- **FR-009** Each image well has a text alternative ("Sample 1: 8 boxes and 9 masks found, including 2 starfish …").
- **FR-010** The page is statically generated; sample overlays load from precomputed results (003) or from bundled
  static JSON produced by the precompute script.
- **FR-011** When JODD images are shown, the footer and the hero caption carry the dataset citation and
  "CC BY-NC-SA 4.0" with a link to the licence (C-Art. VIII.3).

## Success criteria

- **SC-001** LCP ≤ 2.5 s on a mid-range phone over 4G for the hero image.
- **SC-002** The comparison responds to drag at 60 fps on a mid-range laptop (no layout thrash; clip-path only).
- **SC-003** axe: 0 serious/critical; full keyboard path from load to "Try your own image".
- **SC-004** The page passes the design test (DS §2) in review: no tiles, cards, gradients or marketing copy.

## Out of scope

Live uploads on Home (they happen in Try it), the architecture diagram (moved to About), statistics tiles.

## Open questions

- See US5.

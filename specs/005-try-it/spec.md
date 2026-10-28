# 005 — Try it

**Status:** Ready for planning · **Phase:** 2 · **Depends on:** 001, 003 · **Design:** DS §10.2, §8, §9, §11, §12

## Summary

The instrument: a visitor picks a sample or uploads their own image, the full model runs, and the result appears on a
large canvas with a quiet inspector beside it. The visitor can switch between detection and segmentation, adjust the
threshold, isolate classes, compare with ground truth, see the thesis-figure layout, and download the results.

## User scenarios

### US1 — Run the model on my own image (P1)

**Acceptance scenarios**
1. **Given** the page, **When** the visitor chooses Upload or drops a JPEG/PNG anywhere on the page, **Then** a
   full-frame overlay reads "Drop to run on the full model" while dragging, and on drop the job starts.
2. **Given** a running job, **When** it is in progress, **Then** the previous result stays dimmed to 30 %, and a status
   reads "Running on {device} · {elapsed} s · usually about {estimate} s", announced via `role="status"`; it fades in
   over 160 ms and out over 120 ms.
3. **Given** the job finishes, **When** the result arrives, **Then** the overlay fades in over 220 ms and the inspector
   updates counts, classes and instances.
4. **Given** an invalid or too-large file, **When** dropped, **Then** the visitor sees the API's plain-language message
   and nothing else changes.

### US2 — Read the result (P1)

**Acceptance scenarios**
1. **Given** a result, **When** the visitor selects Detection, Segmentation or Both (tabs), **Then** the canvas shows
   boxes, masks or both, and the count line reads "{n} boxes · {m} masks" with the note that the heads are separate.
2. **Given** the threshold slider, **When** moved, **Then** boxes, masks, counts and class list update in < 100 ms with
   no animation and no new request.
3. **Given** the class list, **When** it renders, **Then** it shows the top 3 classes by count (dot, name, count for the
   active view) and "Show all N classes"; clicking a class hides it (dimmed, struck through, hollow dot,
   `aria-pressed="false"`); hovering or focusing isolates it on the canvas.
4. **Given** the canvas, **When** the visitor hovers a mask or box, **Then** it highlights and the matching instance row
   is highlighted and scrolled into view; and the reverse from the row.
5. **Given** labels, **When** nothing is hovered, **Then** only the top 3 objects are labelled; hovered or isolated
   objects are always labelled; labels stay inside the image.

### US3 — Compare with ground truth and the thesis figures (P2)

**Acceptance scenarios**
1. **Given** a sample with ground truth, **When** the visitor holds "Hold to show ground truth" (pointer, or Space/Enter
   held), **Then** the canvas shows the ground truth instantly and returns instantly on release (no fade).
2. **Given** "Thesis figure layout", **When** activated, **Then** a 2 × 2 grid shows Image, Ground truth, Detection,
   Segmentation, with "← Single view" to return.

### US4 — Take the results away (P2)

**Acceptance scenarios**
1. **Given** a result, **When** the visitor uses the Download links, **Then** they get the overlay PNG, COCO JSON and
   CSV from the API, and "API call" copies a working `curl` command for the same request.

### US5 — Adjust the display and options (P3)

**Acceptance scenarios**
1. **Given** More options, **When** opened (collapsible), **Then** it offers mask opacity (10–90 %, default 30 %), flip
   test-time augmentation (re-runs with two passes, about 2× the time) and the colour-blind palette.

### US6 — Use it on a phone (P1)

**Acceptance scenarios**
1. **Given** a viewport ≤ 640 px, **When** the page loads, **Then** the image runs edge to edge with nothing on it,
   sample circles sit under it, and a bottom sheet (Drawer, 360 ms) holds view tabs, count, threshold, "Show N classes"
   and a full-width "Upload a photo" primary button; all targets ≥ 44 px.

## Edge cases

- Zero results above threshold → canvas shows the image only; inspector reads "Nothing above 0.30. Try a lower
  threshold."
- A class with boxes but no masks (or the reverse) → its count is 0 in the view where it has none; never hidden.
- Ground truth unavailable (uploads) → the hold button is absent, not disabled.
- TTA toggled while a job runs → queued after the current job; the switch reflects the pending state.
- API unreachable → a calm error line in the inspector with "Try again"; the samples still work if precomputed results
  are bundled statically.
- Retention: the hint under the strip states the retention period from configuration.

## Functional requirements

- **FR-001** Layout per DS §10.2 on the workspace surface: canvas column + 300 px inspector; stacks below 880 px; phone
  sheet ≤ 640 px.
- **FR-002** Nothing floats on the image except the run status. Hold-for-ground-truth and Thesis figure layout are text
  buttons on the line beneath the image.
- **FR-003** Inspector order: view tabs → count + note → threshold → class list (top 3 + show all) → Instances
  (collapsible, with count) → More options (collapsible) → Download links → "Compare with other model variants →"
  (links to `/lab` with the current image).
- **FR-004** Instances list follows the active view: Detection lists detections (class #n, score); Segmentation lists
  masks (class #n, score, area px); Both shows two labelled groups. Boxes and masks are never paired (C-Art. IV.5).
- **FR-005** Overlay rendering per DS §8 (fill 30 %, outlines, halo, labels top 3, dimming, colour order by class
  frequency from `site_data.json`).
- **FR-006** Client-side filtering by threshold, class visibility and view; no request until the image, variant or TTA
  changes.
- **FR-007** Upload: file picker, drag-and-drop anywhere on the page, paste from clipboard; client-side check of type
  and size before sending.
- **FR-008** Polling per the API contract; status text shows step, elapsed and estimate; cancel on navigation.
- **FR-009** The sample strip shows precomputed samples (or none when `SAMPLES_ENABLED=false`) plus an Upload tile.
- **FR-010** Keyboard: all controls reachable in visual order; hold works with Space/Enter held; tabs follow the ARIA
  tabs pattern; class buttons expose `aria-pressed`.
- **FR-011** Motion only as listed in DS §12 for this page; sliders, hold and hover are instant.
- **FR-012** The URL reflects the sample (`/try?sample=s01`) so results are linkable; uploads are not.
- **FR-013** Downloads made from JODD samples (overlay PNG, COCO JSON) state the dataset citation and CC BY-NC-SA 4.0
  in their metadata or a README line (share-alike, C-Art. VIII.3). Uploads by visitors carry no such notice.

## Key entities

`PredictionResult`, `Detection`, `Mask` (from 003), `ViewState` (view, threshold, hidden classes, isolated class,
hovered instance, opacity, palette, tta).

## Success criteria

- **SC-001** Threshold and class changes re-render in < 100 ms with 100 objects on a mid-range laptop.
- **SC-002** A visitor can go from landing to a result on their own image in ≤ 3 actions.
- **SC-003** axe: 0 serious/critical in all states (idle, running, result, error, figure layout, phone sheet).
- **SC-004** Usability check with 5 people (panel-like and non-technical): ≥ 4 understand that box and mask counts can
  differ, from the page alone.

## Out of scope

Variant comparison (008), video, saving results to an account.

## Open questions

- [NEEDS CLARIFICATION: allow paste-from-clipboard upload in the MVP?]
- [NEEDS CLARIFICATION: should "API call" be shown publicly, or only once the API is hosted publicly?]

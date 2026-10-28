# 008 — Component Lab (internal)

**Status:** Draft · **Phase:** 3 (4 for ablation variants) · **Depends on:** 003, 005 · **Design:** DS §10.6 ·
**Rules:** C-Art. I.6, IV.6

## Summary

Run the same image through 2–4 trained model variants and compare them in one place: swipe (default), side by side
with synced hover, or a difference view. Each variant is its own trained checkpoint with its own measured test AP.
Reached from Try it and Results; not in the public nav.

## User scenarios

### US1 — See what a component contributes (P1)

**Acceptance scenarios**
1. **Given** `/lab?sample=s01`, **When** it loads, **Then** B0 and the first other trained variant are compared in
   Swipe mode on the same image.
2. **Given** "Add variant", **When** opened, **Then** a menu (scales in from its trigger, 150 ms) lists trained variants
   and, disabled, pending ablations with what they test; at 4 variants, adding is disabled with a note.
3. **Given** Side by side, **When** the visitor hovers an organism in one view, **Then** the same location is
   highlighted in every view.
4. **Given** Difference, **When** shown, **Then** each non-B0 variant's view marks objects B0 found and it missed
   (dashed white), objects only it found (solid white), and objects both found (neutral grey), matched by IoU ≥ 0.5.

### US2 — Numbers stay honest (P1)

**Acceptance scenarios**
1. **Given** the table under the comparison, **When** it renders, **Then** each variant shows what changed, its test
   box and mask AP from `site_data.json` (placeholder if not exported) and its counts on this image; pending variants
   show "Pending ablation".

## Functional requirements

- **FR-001** Variants from `GET /variants`; B0 always present and not removable; 2–4 variants.
- **FR-002** Results from precomputed outputs when available; otherwise one job per variant via `POST /compare`, with
  rows filling as jobs finish.
- **FR-003** Compare modes as understated tabs (Swipe · Side by side · Difference); mode switches are instant.
- **FR-004** Difference matching is computed client-side from masks (IoU ≥ 0.5, same class), documented in the legend.
- **FR-005** A hint states that each variant is its own trained checkpoint and why disabling a branch inside B0 would
  not measure its value.
- **FR-006** The page is `noindex` and excluded from the nav and sitemap.

## Success criteria

- **SC-001** With precomputed outputs, switching modes and variants renders in < 100 ms.
- **SC-002** Every variant shown has passed the parity check (003 SC-001).

## Out of scope

Disabling branches inside B0; recipe-only ablations (mosaic, SimpleAug) — those belong on Results.

## Open questions

- [NEEDS CLARIFICATION: which ablation checkpoints will exist by the defence — order ViT-only and CNN-only first?]

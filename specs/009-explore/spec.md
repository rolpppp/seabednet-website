# 009 — Explore (gallery and dataset)

**Status:** Draft · **Phase:** 5 · **Depends on:** 002, 003 (precompute) · **Design:** DS §10.5 · **Licence:** JODD is
CC BY-NC-SA 4.0 (C-Art. VIII.3)

## Summary

A browsable view of curated test images with the model's output — best, typical and failure cases, failures included on
purpose — beside a description of the JODD-Seg dataset: its 20 classes, instance counts, review coverage and how the
masks were made.

## User scenarios

### US1 — Browse the model's behaviour across many images (P1)

**Acceptance scenarios**
1. **Given** Explore, **When** it loads, **Then** a serif lead sentence, filter tabs (All · Clear · Typical · Fails)
   and a grid of images with masks are shown; each failure has one line explaining why.
2. **Given** an image, **When** activated, **Then** it opens in Try it with the same image (`/try?sample=…`).
3. **Given** a class filter [NEEDS CLARIFICATION: include a class filter in the first version?], **When** a class is
   chosen, **Then** only images containing it are shown.

### US2 — Understand the dataset (P2)

**Acceptance scenarios**
1. **Given** the dataset section, **When** read, **Then** a table lists each class with an example crop, instance count
   and reviewed fraction from `site_data.json`, followed by how the masks were made (SAM 3 pseudo-masks, then three
   human reviewers) and the JODD citation.

## Functional requirements

- **FR-001** Gallery items and their category (clear / typical / fails) and caption come from a curated list file
  reviewed by Rolf; outputs from precompute.
- **FR-002** Grid of 4:3 wells (7 px radius) with masks only and top-3 labels; lazy-loaded images.
- **FR-003** Hidden entirely while `SAMPLES_ENABLED=false`, and removed from the nav until it ships.

## Success criteria

- **SC-001** ≥ 30 % of gallery items are typical or failure cases (honesty of selection).
- **SC-002** axe: 0 serious/critical.

## Open questions

- [NEEDS CLARIFICATION: gallery and dataset on one page, or the gallery alone first?]
- [NEEDS CLARIFICATION: until Explore ships, keep "Explore" in the nav pointing to a short page, or hide it?]

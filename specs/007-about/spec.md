# 007 — About

**Status:** Ready for planning · **Phase:** 1 · **Depends on:** 001 · **Design:** DS §10.4 ·
**Facts:** Handoff §1–2

## Summary

The thesis's first page, on the web: title, byline, links to the paper, code and dataset, the abstract, how the model
works with the architecture diagram, a copyable citation, and acknowledgements. The nav's "Thesis" link points here.

## User scenarios

### US1 — A visitor learns what the thesis is and who wrote it (P1)

**Acceptance scenarios**
1. **Given** the About page, **When** it loads, **Then** it shows "SeaBed-Net" (h1 serif), the subtitle "Multicolor
   Hybrid CNN-ViT for Dual-Task Underwater Object Detection and Instance Segmentation", the author "Rolf Genree L.
   Garces", "BS Computer Science · University of the Philippines Tacloban · 2026", and "Adviser: John Paul T.
   Yusiong, PhD".
2. **Given** the links row, **When** activated, **Then** Paper (PDF), Code and Dataset open their targets.

### US2 — A reader understands how the model works (P2)

**Acceptance scenarios**
1. **Given** "How it works", **When** read, **Then** one paragraph and the architecture diagram describe the deployed
   model B0 (colour stems RGB · RedComp · Shades-of-Gray, ConvNeXt-T ‖ DINOv2 ViT-L/14, convex fusion per pyramid
   level, FPN, TOOD detection head ‖ SOLOv2 mask head), not the proposal-era design.

### US3 — A researcher cites the thesis (P1)

**Acceptance scenarios**
1. **Given** the Citation section, **When** "Copy BibTeX" is activated, **Then** the exact BibTeX from Handoff §1 is on
   the clipboard and the button reads "Copied" for ~1.8 s; if the clipboard API is unavailable, the text is selected
   and the button says to press Ctrl/⌘+C.

## Edge cases

- Abstract not yet updated by Rolf → a visible placeholder stating it is pending; never the proposal-era abstract.
- PDF not yet public → the Paper link is omitted, not dead.

## Functional requirements

- **FR-001** Single editorial column, max 720 px, per DS §10.4; no cards.
- **FR-002** Exact title, author, course, institution and year from Handoff §1.
- **FR-003** Architecture diagram as accessible inline SVG with hairline boxes (no filled blocks), a full text
  alternative, and a caption; each block links to the ablation that tests it when 008 exists.
- **FR-004** BibTeX in a mono block on `--subtle`, with the copy text button.
- **FR-005** Acknowledgements as a paragraph with the credit lines: the JODD dataset citation "Takaki Nishio, Yuki Kawae (2025). J-EDI Organism Detection Dataset (JODD). JAMSTEC. https://doi.org/10.17596/0004035", its
  licence (CC BY-NC-SA 4.0, linked) and the data paper (Nishio & Kawae, *Data in Brief* 65, 112462, 2026,
  doi:10.1016/j.dib.2026.112462); JODD-Seg (SAM 3 pseudo-masks reviewed by three people, released under the same
  licence); ConvNeXt-T; DINOv2.
- **FR-006** Statically generated; structured data (`ScholarlyArticle` JSON-LD) for search engines.

## Success criteria

- **SC-001** Title and BibTeX match Handoff §1 character for character (test).
- **SC-002** axe: 0 serious/critical.

## Open questions

- [NEEDS CLARIFICATION: final abstract text (describing B0)]
- [NEEDS CLARIFICATION: public URLs for the PDF, code repository and JODD-Seg dataset — and whether each is public]

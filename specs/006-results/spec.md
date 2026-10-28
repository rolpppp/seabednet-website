# 006 — Results (including Benchmarks)

**Status:** Ready for planning · **Phase:** 1 · **Depends on:** 001, 002 · **Design:** DS §10.3, §9.5–9.8, §9.12 ·
**Rules:** C-Art. I

## Summary

A research article, not a dashboard. Each section opens with a serif sentence stating the finding, then the evidence: a
table or a dot plot, a one-line source, and a margin note for caveats. Every number comes from `site_data.json`. This is
the page the thesis panel will check most closely.

## User scenarios

### US1 — A panel member verifies the headline claim (P1)

**Acceptance scenarios**
1. **Given** the Results page, **When** it loads, **Then** the first section's headline reads "SeaBed-Net reaches 0.645
   box AP and 0.638 mask AP on the held-out JODD test split." with values from `site_data.json`.
2. **Given** the headline table, **When** read, **Then** it shows Box and Mask rows × AP, AP50, AP_S, AP_M, AP_L under a
   "JODD test · mean of 3 seeds" group, and AP, AP50 under a separate "With flip TTA" group whose values are in
   secondary text.
3. **Given** the source line under the table, **When** "Sources & data →" is activated, **Then** the visitor sees the
   run names, files, split, n, export date and per-seed values (and can download the table as CSV).

### US2 — A reader understands where the model is weaker (P1)

**Acceptance scenarios**
1. **Given** the object-size section, **When** it renders, **Then** the headline states the finding ("Masks trail boxes
   on small objects and lead on large ones."), and a dot plot shows box (circle) and mask (diamond) AP for small,
   medium and large on one shared axis with direct labels, with Chart / Table / Sources tabs.

### US3 — An ML reader compares with published work fairly (P1)

**Acceptance scenarios**
1. **Given** the benchmarks section, **When** it renders, **Then** each row shows benchmark, protocol, our value (bold
   when higher), best published value with model name, and both parameter counts; a margin note states these are single
   runs.

### US4 — A reader sees which changes mattered, including the ones that didn't (P1)

**Acceptance scenarios**
1. **Given** the config-changes section, **When** it renders, **Then** the baseline row is first, each change shows
   split (written "test" or "val"), n, Δ box AP and Δ mask AP; rows below the noise threshold show the "No detectable
   difference" badge; DAPFT shows as dropped with its evidence IDs; values not yet exported show as placeholders.
2. **Given** the margin note, **When** read, **Then** it explains the 0.03 rule once.

## Edge cases

- Narrow screens → contents list hides, margin notes move under their section, tables scroll inside their container.
- Dark reading theme → chart and tables use dark tokens; captions describe series by shape.
- A metric missing from `site_data.json` → the build fails (never renders a blank or a typed fallback).

## Functional requirements

- **FR-001** Three-column layout (contents 150 px sticky, content, notes 190 px) per DS §10.3, with responsive collapse.
- **FR-002** Section order: Headline · Object size · Benchmarks · Config changes · (Per class, DAPFT when data exists).
- **FR-003** Lead headline uses `h2` serif; section headlines use `h3` serif; headlines are full sentences that state
  the finding.
- **FR-004** Tables follow DS §9.5 (no card, hairlines, header rule, group rules, tabular numbers, bold only winners).
- **FR-005** Every table and figure has a source line (DS §9.6) with a "Sources & data" disclosure listing provenance
  and a CSV download generated from `site_data.json`.
- **FR-006** The dot plot is SVG, accessible (`role="img"` with a full text description) and has an equivalent Table
  tab; axis starts at 0.50 and says so in the caption.
- **FR-007** Formatting: fractions to 3 or 4 decimals as in the source; percents to 2 decimals; Δ with a true minus
  sign; units never mixed in one column.
- **FR-008** Page is statically generated from `site_data.json`; the build validates it (002 FR-007).
- **FR-009** Contents list links to section anchors and marks the current section while scrolling (no animation).
- **FR-010** A link "Compare variants in the Lab →" appears in the config-changes section (Lab is not in the nav).

## Success criteria

- **SC-001** 100 % of numbers on the page trace to `site_data.json` (002 SC-001 test).
- **SC-002** A reviewer can find run, split and n for any number in ≤ 2 interactions.
- **SC-003** axe: 0 serious/critical, light and dark.

## Out of scope

Per-class AP and training progression (until exported), interactive sorting beyond the Table tab.

## Open questions

- [NEEDS CLARIFICATION: include the model progression (C2F_MDUAL → C2F_VITB_CVXMOS → VITL_ACC) in the MVP?]

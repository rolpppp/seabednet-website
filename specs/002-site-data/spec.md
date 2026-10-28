# 002 — Site data export

**Status:** Ready for planning · **Phase:** 1 · **Depends on:** — · **Rules:** C-Art. I, IV

## Summary

A script reads the thesis result files (read-only, from `SEABEDNET_REPO`) and writes `data/site_data.json`: every number
the site shows, each with its provenance. Pages read only this file. The panel will check numbers against runs, so the
export is the single source of truth.

## User scenarios

### US1 — Rolf regenerates the site's numbers after a new run (P1)

**Acceptance scenarios**
1. **Given** `SEABEDNET_REPO` points at the thesis repo, **When** Rolf runs `scripts/export_site_data.py`, **Then**
   `data/site_data.json` is written and validates against `contracts/site-data.schema.json`.
2. **Given** a required source file is missing or malformed, **When** the export runs, **Then** it exits non-zero and
   names the file; it never writes a partial file.
3. **Given** an unchanged thesis repo, **When** the export runs twice, **Then** the outputs are identical except
   `generated_at` (deterministic ordering and rounding).

### US2 — A panel member checks where a number came from (P1)

**Acceptance scenarios**
1. **Given** any metric in `site_data.json`, **When** it is inspected, **Then** it has run name(s), split, n, source
   file path (relative to the thesis repo) and the source file's modification date.
2. **Given** the headline B0 numbers, **When** exported, **Then** they equal the mean over the three seed files
   `ab_vitl_acc{,_seed1,_seed2}_s3.pth.test_eval_verified.json`, and the per-seed values and sample standard deviation
   are included.

### US3 — Pages get typed data (P2)

**Acceptance scenarios**
1. **Given** the schema, **When** the frontend builds, **Then** it uses generated or hand-written types that match the
   schema, and the build fails if `site_data.json` doesn't validate.

## Edge cases

- A seed file is missing → the export fails for that table rather than silently reporting n = 2. An explicit
  `--allow-partial` flag may record the smaller n, never by default.
- Values reported as percentages in one source (RUOD 65.22) and fractions in another (0.6453) → each metric records its
  `unit` (`fraction` or `percent`); the UI formats per unit. No silent conversion.
- A comparison row with n = 1 and |Δ| < 0.03 → `reading: "no_detectable_difference"` (C-Art. I.5).
- DAPFT rows → `reading: "dropped"` with evidence IDs (F29, F33, F116, F121).
- Variant without checkpoint → `status: "pending"`, no metrics.

## Functional requirements

- **FR-001** `scripts/export_site_data.py` takes `--repo` (default `$SEABEDNET_REPO`) and `--out` (default
  `data/site_data.json`); it only reads from the thesis repo.
- **FR-002** Tables exported (see schema): `headline` (B0 box and mask: AP, AP50, AP_S, AP_M, AP_L, mean ± sd over 3
  seeds), `tta` (flip TTA box and mask AP, AP50 from `tta_flip_test_results.json`), `object_size` (derived from
  headline), `benchmarks` (RUOD under UDINO and EDB-Net protocols, UIIS10K box and mask; best published value, its model
  and parameter count; ours with 352 M), `config_changes` (rows from `RUNS_2026-09-28_TO_2026-10-09.md` comparison
  tables: change, split, n, Δ box AP, Δ mask AP, reading), `variants` (from `backend/variants.yaml`: id, name, what
  changed, component, status, test box/mask AP when trained), `classes` (20 names and ids from the annotation file
  `categories`), `dataset` (counts and review coverage from `JODD_DATASET_ANN.md`, when available).
- **FR-003** Every metric object follows the schema's `Metric` definition: `value`, `unit`, `split`, `n`, `runs[]`,
  `source`, `source_mtime`, optional `sd`, `per_seed[]`, `tta` flag.
- **FR-004** Markdown sources (`SOTA_COMPARISON_*.md`, `RUNS_*.md`) are parsed by explicit table locators that fail
  loudly if the table shape changes; no fuzzy scraping.
- **FR-005** The output includes `generated_at`, `generator_version`, and `thesis_repo_commit` when the thesis repo has
  readable git metadata (`null` otherwise; its git store is known to be corrupt).
- **FR-006** pytest tests cover: B0 mean/sd against known values (0.6453 / 0.6380 box/mask AP), TTA values, benchmark
  rows, the no-detectable-difference rule, missing-file failure, determinism.
- **FR-007** A `--check` mode validates an existing `site_data.json` against the schema without regenerating it; CI
  runs it.

## Key entities

`SiteData`, `Metric`, `Table`, `Variant`, `ClassInfo` — see `contracts/site-data.schema.json`.

## Success criteria

- **SC-001** Every number rendered by features 004–009 is traceable to one `Metric` in `site_data.json` (verified by a
  test that greps built pages for metric-looking numbers not present in the file).
- **SC-002** Export completes in < 10 s on the lab machine and needs no GPU.
- **SC-003** Headline values match Handoff §2 exactly at the published precision.

## Out of scope

Per-class AP and the training-progression table (later); precomputed predictions (003).

## Open questions

- [NEEDS CLARIFICATION: is `JODD_DATASET_ANN.md` final enough to publish counts and review coverage?]
- [NEEDS CLARIFICATION: for config-change rows, which comparison tables in `RUNS_2026-09-28_TO_2026-10-09.md` are in
  scope for the MVP?]

# 006 — Results: tasks

**Feature:** 006 Results (including Benchmarks) · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)
(approved by Rolf 2026-10-29; its final "Reconciliation with 001" section overrides earlier sections)

**Inputs:** `specs/002-site-data/contracts/site-data.schema.json` (read-only, never copied), `specs/001-foundation/plan.md`
(§4, §6, §7, §10), `docs/design-system.md` (cited as DS §n), constitution (cited as C-Art. n).

**Prerequisites:** feature 001 implemented and merged (Phase 0 checks this). Feature 002 (real export) is deferred, so
every task runs against the fixture `frontend/tests/fixtures/site_data.fixture.json`. A plain `pnpm build` fails by
design until `data/site_data.json` exists (plan R1).

**Paths:** all relative to the repo root. Code lives under `frontend/` (no `src/`). Test IDs (`U-`, `B-`, `E-`, `A-`,
`L-`) are those of plan §11.

**How to tick:** change `- [ ]` to `- [x]` only after the task's own test passes and `pnpm check` has not regressed.
A task that names a test is "tests first": the test is written and seen failing before the implementation task that
follows it. `[P]` means the task touches no file used by another task in the same phase and has no ordering dependency
inside the phase. Never mark the feature done while any test fails.

**Git:** agents never write to git (CLAUDE.md §1). Rolf receives one hand-over block at the end (T080).

**Open questions held in one place.** These are not decided; the tasks make each a one-line change.
Progression in MVP (`SHOW_PROGRESSION=false`), decimal policy (`TABLE_DP=4`, `PROSE_DP=3`), `NOISE_THRESHOLD` source,
finding-sentence wording, TTA footnote text, single-run note wording. All constants in `frontend/lib/results/config.ts`;
all text templates in `frontend/lib/results/findings.ts`; all number policies in `frontend/lib/results/format.ts`.
See "Blocked on Rolf" at the end.

---

## Phase 0 — Prerequisites

- [ ] T001 Verify 001 is merged: confirm these exist and note any difference from plan §6/§7 in the report to the orchestrator: `frontend/components/layout/reading-layout.tsx`, `page-title.tsx`; `frontend/components/ui/{tabs,badge,table,collapsible,button}.tsx` (Table has `group`, `muted`, `strong`, labelled scroll region; Badge has `null` variant; Tabs is Radix with `forceMount`); `frontend/components/research/{source-line,footnote,pending}.tsx`; `frontend/lib/cn.ts`; `frontend/next.config.ts` reads `NEXT_DIST_DIR`; `frontend/scripts/{check-tokens,check-static}.mjs`; `frontend/vitest.config.ts`; `frontend/playwright.config.ts` (webServer reads `NEXT_DIST_DIR`); `frontend/app/(reading)/results/page.tsx` placeholder; `.env.example` — files: none (read-only check) — satisfies: plan §6, 001 §10
- [ ] T002 Run `pnpm check` on the untouched 001 tree and record that it is green; run `git status` to confirm a clean baseline — files: none — satisfies: plan §11 CI order

## Phase 1 — Data layer

- [ ] T003 Add dependencies `ajv`, `ajv-formats` (runtime, server only) and `json-schema-to-typescript` (dev); add scripts `gen:site-data-types`, `check:site-data`, `build:e2e`, `test:e2e` (script bodies filled in later tasks); keep `save-exact` — files: `frontend/package.json`, `pnpm-lock.yaml` — satisfies: plan §2 (new dependencies), FR-008
- [ ] T004 [P] Create `frontend/lib/site-data/paths.ts` exporting the single constants `SCHEMA_PATH` (to `specs/002-site-data/contracts/site-data.schema.json`) and `DEFAULT_DATA_PATH` (`data/site_data.json`), plus `resolveDataPath()` honouring `SITE_DATA_PATH` — files: `frontend/lib/site-data/paths.ts` — satisfies: plan §4, FR-008
- [ ] T005 Create `frontend/scripts/gen-site-data-types.mjs` (options `additionalProperties: false`, `unreachableDefinitions: true`) and run it to produce `frontend/lib/site-data/types.generated.ts`; confirm `tsc --noEmit` passes and `Metric` and `CocoMetrics` are named types — files: `frontend/scripts/gen-site-data-types.mjs`, `frontend/lib/site-data/types.generated.ts` — satisfies: plan §4 typing, C-Art. I.1
- [ ] T006 [P] Create `frontend/lib/results/config.ts` with every open decision as a named, commented constant: `SHOW_PROGRESSION = false`, `PROGRESSION_IDS`, `AXIS_MIN`, `NOISE_THRESHOLD` (with a comment pointing to plan §8 / Q2), the `SECTIONS` list (id, label, order) and the Lab link target. File must stay outside `app/` and `components/` (001 check-tokens decimal grep) — files: `frontend/lib/results/config.ts` — satisfies: FR-002, FR-006, FR-010, plan §6 progression toggle, 001 §10 token grep
- [ ] T007 Write failing unit test `U-10` (fixture validates against the schema with Ajv 2020 strict, and passes `assertResultsData`) plus a marker test: fixture has `generator_version: "FIXTURE-DO-NOT-SHIP"`, every run name starts `FIXTURE_`, every `source.file` starts `fixture/` — files: `frontend/tests/unit/fixture-valid.test.ts` — satisfies: plan §5 honesty of the fixture, R7
- [ ] T008 Create the fixture covering every branch: headline box/mask with five metrics each (`n`=3, `per_seed` length 3, split `test`); `tta` AP and AP50 for box and mask (`tta: true`); `object_size.bins` (small, medium, large) with all six values ≥ 0.50 and `mask.AP_S < box.AP_S`, `mask.AP_L > box.AP_L`; benchmarks for RUOD (percent unit) beside UIIS10K (fraction) with params, one row ours-higher and one best-published-higher, `n: 1`; config_changes with baseline first, one `no_detectable_difference`, one `dropped` (evidence F29, F33, F116, F121), one `pending_export`, one `val` row, one `n: 1` row, one `improved`; variants including a pending one and a three-step progression; classes as the schema requires. Values plausible but deliberately different from the thesis — files: `frontend/tests/fixtures/site_data.fixture.json` — satisfies: plan §5 coverage, SC-001 (test input)
- [ ] T009 Write failing loader tests `B-01` (file missing), `B-02` (invalid JSON), `B-03` (wrong `schema_version`), `B-08` (fixture marker without `SITE_DATA_ALLOW_FIXTURE=1`), each using a temp copy of the fixture and asserting the message names the path or JSON pointer — files: `frontend/tests/unit/loader-failure.test.ts` — satisfies: edge case "metric missing fails the build", FR-008, plan §5 loader refusal
- [ ] T010 Implement `validate.ts` (Ajv 2020, `ajv-formats` for `date-time`, `strict: true`, `allErrors: true`, errors as `<instancePath>: <message>`) and `load.ts` (`import "server-only"`; resolve path, read, parse, validate, refuse fixture unless allowed, call `assertResultsData`, freeze, memoise) — files: `frontend/lib/site-data/validate.ts`, `frontend/lib/site-data/load.ts` — satisfies: FR-008, edge case "metric missing", plan §4 loading
- [ ] T011 Write failing guard tests `B-04` (headline AP_S deleted; object-size value < `AXIS_MIN`), `B-05` (headline `split: "val"`, wrong `tta` flag, mismatched `n`, `per_seed` length ≠ `n`), `B-06` (benchmark params missing or ≤ 0, `best_published.unit` missing), `B-07` (first config row not baseline; `dropped` without evidence; non-null-delta rule), `B-11` (progression flag on with a pending variant, via injected config), plus a missing `object_size.bins` case — files: `frontend/tests/unit/guards.test.ts` — satisfies: edge case "metric missing", FR-006, US3-1, US4-1, C-Art. I.3, I.4, I.5, I.7
- [ ] T012 Implement `guards.ts` (`assertResultsData`) and `frontend/lib/results/types.ts` (branded `ModelMetric` / `TtaMetric` produced by the guards); every failure throws with the JSON path. Finding-predicate checks are added in T041 — files: `frontend/lib/site-data/guards.ts`, `frontend/lib/results/types.ts` — satisfies: plan §4 page-specific checks, C-Art. I.3, I.4, I.7
- [ ] T013 [P] Write failing format tests `U-01` (fractions 4 dp / 3 dp, percents 2 dp, params "352 M" integer or 1 dp, Δ signed, known values 0.6453 to "0.645" and 0.6380 to "0.638", half-up decimal-string rounding), `U-02` (no ASCII hyphen before a digit in Δ; U+2212 used), `U-03` (percent values never rescaled for display), and ISO-date formatting from `generated_at` / `mtime` — files: `frontend/tests/unit/format.test.ts` — satisfies: FR-007, SC-001
- [ ] T014 Implement `frontend/lib/results/format.ts` with named policy constants `TABLE_DP = 4`, `PROSE_DP = 3`, `PERCENT_DP = 2`, `DELTA_DP = 4` at the top (Q1 is a one-line change) and a decimal-string half-up helper (no raw `toFixed`); export `formatMetric(value, unit, fmt)` where `fmt` is `"table4" | "prose3" | "percent2" | "params" | "delta" | "date"` — files: `frontend/lib/results/format.ts` — satisfies: FR-007, plan §9 formatting
- [ ] T015 Extend `frontend/next.config.ts` (small isolated edit): when `phase === PHASE_PRODUCTION_BUILD`, call `loadSiteData()` first so a bad or missing file stops `next build` before compile; leave 001's `distDir` handling intact — files: `frontend/next.config.ts` — satisfies: FR-008, edge case "metric missing fails the build", plan §4 hooks, R9
- [ ] T016 Create `scripts/check-site-data.mjs`-style wiring as the package script `check:site-data` (validates the file at `SITE_DATA_PATH` or `data/site_data.json` using the same loader, exits non-zero with messages) and add `B-09` as a script-level check: `SITE_DATA_PATH=/nonexistent` build exits non-zero and creates no `.next` — files: `frontend/scripts/check-site-data.mjs`, `frontend/package.json` — satisfies: FR-008, edge case "metric missing", B-09
- [ ] T017 Add scripts `build:e2e` (sets `SITE_DATA_PATH` to the fixture, `SITE_DATA_ALLOW_FIXTURE=1`, `NEXT_DIST_DIR=.next-e2e`, then `next build`) and `test:e2e` (Playwright against `.next-e2e`); add the three variables to `.env.example` with comments (no real values); `.next-e2e` is already git-ignored by 001 T003 (`frontend/.next-e2e/`); check it, don't edit `.gitignore` — files: `frontend/package.json`, `.env.example` — satisfies: plan §5 separate build, R1
- [ ] T018 Write failing test for `check-no-fixture.mjs`: scans a temp dir tree and fails on `FIXTURE-DO-NOT-SHIP` or `FIXTURE_` in build output, and fails when `app/**`, `components/**` or `lib/**` mention `tests/fixtures`; passes on a clean tree — files: `frontend/tests/unit/check-no-fixture.test.ts` — satisfies: plan §5 CI leak check, C-Art. I.1
- [ ] T019 Implement `frontend/scripts/check-no-fixture.mjs` (greps `.next/`, `public/`, `out/` if present, plus the source-folder reference check; prints each hit) and add package script `check:no-fixture` — files: `frontend/scripts/check-no-fixture.mjs`, `frontend/package.json` — satisfies: plan §5 CI leak check, L-02
- [ ] T020 Change the check chain: in `frontend/package.json` `check:frontend` runs `tsc` → `eslint` → `check-tokens` → `gen:site-data-types` drift check → `vitest run` → `build:e2e` → `check-static` and Playwright (both reading `NEXT_DIST_DIR=.next-e2e`) → `check-no-fixture` against `.next-e2e`. Add a comment/README note that real `pnpm build` + `check-no-fixture` joins `pnpm check` once 002 delivers data. Confirm `pnpm check` is still green on the placeholder route — files: `frontend/package.json`, `frontend/playwright.config.ts` (only if its webServer does not already read `NEXT_DIST_DIR`) — satisfies: plan "Reconciliation" build chain, R1, L-03
- [ ] T021 Confirm `scripts/check-tokens.mjs` (001) does not flag `frontend/lib/results/**`; run it and record the result. If it scans `lib/`, report to the orchestrator rather than editing — files: none (read-only check) — satisfies: plan "Reconciliation" token grep

## Phase 2 — Shared results primitives

- [ ] T022 [P] Write failing provenance tests `U-06`: `collectProvenance(metrics)` de-duplicates and sorts runs, splits, ns, sources, per-seed values; every field present for every metric in the fixture; "+N more" after two runs; the config-changes variant (no run names) yields a defined "run not exported" marker rather than a blank — files: `frontend/tests/unit/provenance.test.ts` — satisfies: FR-005, SC-002, C-Art. I.2, schema conflict S1, S5
- [ ] T023 Implement `frontend/lib/results/provenance.ts` (`collectProvenance`, source-line text builder `Source: {runs} · {n} seeds · JODD {split} split`, export date from `generated_at`) — files: `frontend/lib/results/provenance.ts` — satisfies: FR-005, SC-002, C-Art. I.2
- [ ] T024 [P] Write failing CSV tests `U-09`: RFC 4180 quoting (commas, quotes, newlines in citations), `\n` endings, no BOM, header row, columns value / unit / split / n / runs / source file / file date / `generated_at`, round trip equals the JSON values — files: `frontend/tests/unit/csv.test.ts` — satisfies: FR-005, US1-3, SC-001
- [ ] T025 Implement `frontend/lib/results/csv.ts` (writer about 30 lines plus per-table row builders for headline, object-size, benchmarks, config-changes, progression) — files: `frontend/lib/results/csv.ts` — satisfies: FR-005, US1-3
- [ ] T026 [P] Write failing view-model tests `U-05` (headline table shape and TTA grouping; a TTA metric in a model column throws) and `U-08` (benchmark winner across fraction and percent compared as fractions for comparison only; ties bold nothing; table split by unit; display value unchanged) — files: `frontend/tests/unit/view-models.test.ts` — satisfies: US1-2, US3-1, FR-004, FR-007, C-Art. I.4, R5
- [ ] T027 Implement `frontend/lib/results/view-models.ts` for headline, object size, benchmarks and config changes. Each view model keeps a `metrics` array next to its rows so provenance is built from exactly what is rendered. Progression view model added in T052 — files: `frontend/lib/results/view-models.ts` — satisfies: US1-2, US3-1, US4-1, FR-005, FR-007
- [ ] T028 [P] Write failing component test for `Num` (renders `<span data-metric="<path>" data-fmt="<fmt>">` with text from `format.ts`; accepts `Metric` or a named field path; typed `MetricPath`; derived `rule` variant for `NOISE_THRESHOLD`) — files: `frontend/tests/unit/num.test.tsx` — satisfies: SC-001, C-Art. I.1, plan §10
- [ ] T029 Implement `frontend/components/results/Num.tsx` (the only number renderer on the page) — files: `frontend/components/results/Num.tsx` — satisfies: SC-001, C-Art. I.1
- [ ] T030 Write failing component test for `DataTable`: renders `<caption>`, `<colgroup>`, `scope="col" | "colgroup" | "row"`, scroll region with `role="region"`, `aria-labelledby` the caption, `tabindex="0"`; group header rule; `muted` and `strong` cells delegated to 001's Table; winner cell has `sr-only` "(higher)" — files: `frontend/tests/unit/data-table.test.tsx` — satisfies: FR-004, DS §9.5, SC-003, C-Art. III
- [ ] T031 Implement `frontend/components/results/DataTable.tsx` over 001's Table family; if 001's Table lacks column-group rules or row headers, add the minimal class in this file's styles using tokens only and tell the orchestrator (R2) — files: `frontend/components/results/DataTable.tsx` — satisfies: FR-004, DS §9.5, C-Art. III
- [ ] T032 [P] Implement `frontend/components/results/MarginNote.tsx` (`<div role="note">`, not `<aside>`; sits in the notes column at wide widths, under its section when narrow) — files: `frontend/components/results/MarginNote.tsx` — satisfies: FR-001, edge case narrow screens, plan §9 a11y
- [ ] T033 Implement `frontend/components/results/ProvenancePanel.tsx` (wraps 001 `Collapsible`; table of run, split, n, source file mono, file date, locator; per-seed values labelled "seed values" and sample SD when present; export date; "Download CSV" link via `Button` text variant) and `ResultsSourceLine.tsx` (builds the DS §9.6 sentence from a `Provenance`, wraps 001 `SourceLine`, "Sources & data →" activates the panel directly below). One activation must reveal every field — files: `frontend/components/results/ProvenancePanel.tsx`, `frontend/components/results/ResultsSourceLine.tsx` — satisfies: US1-3, FR-005, SC-002, C-Art. I.2
- [ ] T034 Implement `frontend/components/results/FigureViews.tsx` (client island: Chart / Table / Sources tabs on 001 Tabs; every `TabsContent` uses `forceMount` so content exists in HTML without JS; receives `ReactNode` children only; the source-line link switches to Sources and moves focus to the panel) — files: `frontend/components/results/FigureViews.tsx` — satisfies: US2-1, FR-006, plan §2 client islands, C-Art. III
- [ ] T035 Implement `frontend/components/results/ResultSection.tsx` (`<section id aria-labelledby>`, heading `h2` for the lead section and `h3` for others, serif finding sentence from props, body, notes slot, optional footer link) — files: `frontend/components/results/ResultSection.tsx` — satisfies: FR-002, FR-003, C-Art. III

## Phase 3 — Sections

### 3a Finding sentences

- [ ] T036 Write failing tests `U-04` and `B-10` for `findings.ts`: headline sentence rebuilt from fixture equals "SeaBed-Net reaches {box.AP 3dp} box AP and {mask.AP 3dp} mask AP on the held-out JODD test split."; size sentence predicate (`mask.AP_S < box.AP_S` and `mask.AP_L > box.AP_L`) true on fixture and false on a mutated copy, failing with the sentence's name; benchmark and config predicates (drafts) behave per plan §8 table — files: `frontend/tests/unit/findings.test.ts` — satisfies: US1-1, US2-1, FR-003, plan §8, R4
- [ ] T037 Implement `frontend/lib/results/findings.ts` with the sentences as templates and predicates in one file, wording marked `// DRAFT, Q3` for the benchmark and config-changes sentences; wire the predicates into `assertResultsData` — files: `frontend/lib/results/findings.ts`, `frontend/lib/site-data/guards.ts` — satisfies: US1-1, US2-1, FR-003, C-Art. I.1, I.8

### 3b Headline

- [ ] T038 Write failing Playwright specs `E-01` (lead `h2` text equals the sentence rebuilt from the fixture; 3 dp) and `E-02` (headers; two row headers Box and Mask; five AP columns under the "JODD test · mean of {n} seeds" group, label text built from metric `split` and `n`; TTA group last with AP and AP50 and the secondary-text class; group label "With flip TTA (test-time augmentation)") — files: `frontend/tests/e2e/results/headline.spec.ts` — satisfies: US1-1, US1-2, FR-003, FR-004, C-Art. I.3, I.4
- [ ] T039 Implement `frontend/components/results/HeadlineTable.tsx`: AP_S/M/L headers show "AP" with subscript plus `sr-only` expansion ("AP, small objects"); TTA header carries a `Footnote` whose text comes from one constant `TTA_DEFINITION` in `findings.ts` (Q4, render "Pending definition" via `Pending` until Rolf supplies text); no bold (no winner) — files: `frontend/components/results/HeadlineTable.tsx`, `frontend/lib/results/findings.ts` — satisfies: US1-2, FR-004, C-Art. I.4, I.8

### 3c Object size

- [ ] T040 [P] Write failing geometry tests `U-07` for `dotplot-geometry.ts`: scale from `AXIS_MIN` to the next 0.05 above the max, ticks every 0.05, label offsets (box above, mask below when marks within 0.01), text description lists all six values and shapes (circle, diamond) — files: `frontend/tests/unit/dotplot-geometry.test.ts` — satisfies: FR-006, US2-1, SC-001
- [ ] T041 Implement `frontend/lib/results/dotplot-geometry.ts` (pure functions; viewBox 360 wide, 14 px text) — files: `frontend/lib/results/dotplot-geometry.ts` — satisfies: FR-006, plan §9 phone width
- [ ] T042 Write failing Playwright specs `E-05` (size sentence; one `svg[role="img"]` with non-empty `<title>` and `<desc>`; six marks: three circles, three diamonds; caption says the axis starts at the value of `AXIS_MIN`, not 0), `E-06` (Chart / Table / Sources tabs by arrow keys; Table values equal the description values; source link switches to Sources tab and moves focus) and `E-12` (caption describes series by shape and names no colour) — files: `frontend/tests/e2e/results/object-size.spec.ts` — satisfies: US2-1, FR-006, edge case dark theme, C-Art. III
- [ ] T043 Implement `frontend/components/results/SizeDotPlot.tsx` (server-rendered SVG; box circle in `--ocean`, mask diamond in `--text`; direct value labels `aria-hidden`; series names written once beside the first row; no legend; `<figcaption>` per plan §8; tokens only) and the Object size section composition (FigureViews: Chart, Table with a `DataTable` of the six values, Sources with `ProvenancePanel`) — files: `frontend/components/results/SizeDotPlot.tsx`, `frontend/components/results/ObjectSizeSection.tsx` — satisfies: US2-1, FR-006, FR-005, DS §9.12

### 3d Benchmarks

- [ ] T044 Write failing Playwright spec `E-07` (each row shows benchmark, protocol, ours, best-published value and model, two params cells in the same row; bold only on the higher with `sr-only` "(higher)"; a margin note states single runs; no table mixes units in one column) — files: `frontend/tests/e2e/results/benchmarks.spec.ts` — satisfies: US3-1, FR-004, FR-007, C-Art. I.7
- [ ] T045 Implement `frontend/components/results/BenchmarksTables.tsx` (one `DataTable` per benchmark, split further by unit; best-published citation as a `Footnote` on the model name; params "{n} M" beside each value) and the Benchmarks section composition with the single-run `MarginNote` text built from `ours.n` in `findings.ts` (marked `// DRAFT, Q5`) — files: `frontend/components/results/BenchmarksTables.tsx`, `frontend/components/results/BenchmarksSection.tsx`, `frontend/lib/results/findings.ts` — satisfies: US3-1, FR-004, FR-005, FR-007, C-Art. I.2, I.7, I.8

### 3e Config changes

- [ ] T046 Write failing Playwright specs `E-08` (baseline first; each row has split text "test" or "val", n, two deltas; at least one badge reads "No detectable difference"), `E-09` (the DAPFT row reads "Dropped" with F29, F33, F116, F121 in mono; a `pending_export` row shows the `Pending` placeholder, never a blank), `E-10` (the noise rule explanation appears in exactly one margin note), `E-15` (Δ cells use U+2212, never ASCII hyphen) and `E-18` ("Compare variants in the Lab →" link points to `/lab`) — files: `frontend/tests/e2e/results/config-changes.spec.ts` — satisfies: US4-1, US4-2, FR-007, FR-010, C-Art. I.3, I.5, I.6
- [ ] T047 Implement `frontend/components/results/ConfigChangesTable.tsx`: columns Change | Split | n | Δ box AP | Δ mask AP | Reading; baseline first with em-dash deltas and "Baseline"; reading cell by `reading` (Badge `null` variant for no detectable difference; plain "Dropped" plus evidence IDs; `Pending` for `pending_export`; plain "Improved" / "Worse"); note that val rows are not test results; margin note renders the rule once via `<Num derived="rule">` from `NOISE_THRESHOLD`; section footer link to `/lab` per FR-010. Source line text for this table has no run names (conflict S1): show file and "splits as labelled per row" — files: `frontend/components/results/ConfigChangesTable.tsx`, `frontend/components/results/ConfigChangesSection.tsx` — satisfies: US4-1, US4-2, FR-004, FR-005, FR-007, FR-010, C-Art. I.3, I.5, I.6

### 3f Progression (toggle, off by default)

- [ ] T048 [P] Write tests for the progression toggle: with `SHOW_PROGRESSION=false` (default) the section, its contents entry and its CSV route do not exist (`E-21` and `B-11` skipped via `test.skip(!SHOW_PROGRESSION)`); with it injected `true` in a unit test, `view-models` returns rows in `PROGRESSION_IDS` order and fails the build on a missing or pending variant; pending variants never render as data rows — files: `frontend/tests/unit/progression.test.ts`, `frontend/tests/e2e/results/progression.spec.ts` — satisfies: spec open question, C-Art. I.6, plan §6 toggle
- [ ] T049 Implement `frontend/components/results/ProgressionTable.tsx`, the progression view model, and its guard, all gated by `SHOW_PROGRESSION` (placement after Config changes; columns model, what changed, test box AP, test mask AP, each with provenance; disabled "Pending ablation" via `Pending` if the variant is untrained, only when the owner chooses placeholders) — files: `frontend/components/results/ProgressionTable.tsx`, `frontend/lib/results/view-models.ts`, `frontend/lib/site-data/guards.ts` — satisfies: spec open question, C-Art. I.6, plan §6 toggle

## Phase 4 — CSV routes

- [ ] T050 Write failing Playwright spec `E-04`: for each of headline, object-size, benchmarks, config-changes, the CSV downloaded from the "Sources & data" panel parses and every value equals the fixture JSON; unknown table name returns 404; progression route returns 404 while the flag is off — files: `frontend/tests/e2e/results/csv.spec.ts` — satisfies: US1-3, FR-005, SC-001
- [ ] T051 Implement `frontend/app/(reading)/results/csv/[table]/route.ts` (`export const dynamic = "force-static"`, `generateStaticParams` from the section list in `config.ts`, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition` filename) using `csv.ts` and the loader — files: `frontend/app/(reading)/results/csv/[table]/route.ts` — satisfies: FR-005, FR-008, US1-3

## Phase 5 — Page composition and section nav

- [ ] T052 Write failing Playwright specs `E-11` (viewports 1280: three columns with 150 px contents and 190 px notes; 900: notes under their sections; 600: contents list `display:none`; 320: `document.documentElement.scrollWidth <= innerWidth`, tables scroll inside their region), `E-13` (one `h1`, lead `h2`, `h3` sections in FR-002 order, no skipped level) and `E-17` (contents link marks the current section on scroll, also with `reducedMotion: "reduce"`, `aria-current="location"`; tab order is contents then content) — files: `frontend/tests/e2e/results/layout.spec.ts` — satisfies: FR-001, FR-002, FR-003, FR-009, edge case narrow screens
- [ ] T053 [P] Implement `frontend/components/results/ResultsShell.tsx` (three columns via container queries; contents 150 px sticky, content, notes 190 px; collapse rules; tokens only) — files: `frontend/components/results/ResultsShell.tsx` — satisfies: FR-001, edge case narrow screens
- [ ] T054 [P] Implement `frontend/components/results/SectionNav.tsx` (client island; `<nav aria-label="On this page">`; IntersectionObserver marking; colour/underline change only, no transition; hidden with `display:none` under 700 px container width) — files: `frontend/components/results/SectionNav.tsx` — satisfies: FR-009, C-Art. III
- [ ] T055 Replace 001's placeholder `frontend/app/(reading)/results/page.tsx`: `export const dynamic = "error"`, load data once, build view models, render `PageTitle` "Results" (the only `h1`), `ResultsShell`, sections in `config.ts` order (progression only if flagged); no client fetch of data — files: `frontend/app/(reading)/results/page.tsx` — satisfies: FR-002, FR-008, SC-001
- [ ] T056 Run `pnpm build:e2e` and the Phase 3 and Phase 5 Playwright specs together; fix integration issues without changing specs; record any 001 component difference found — files: none unless fixes are needed in files already listed — satisfies: FR-001 to FR-010

## Phase 6 — Accessibility, number tracing, leak checks

- [ ] T057 Write Playwright spec `E-14`: every `<table>` and `<figure>` is followed by a source line and a provenance panel; spec `E-16`: the page requests no `site_data.json` or any JSON at runtime and makes zero third-party requests — files: `frontend/tests/e2e/results/provenance-static.spec.ts` — satisfies: FR-005, FR-008, SC-002
- [ ] T058 Write the trace spec `E-19` (every `[data-metric]` path resolves in the fixture and its text equals `formatMetric(value, data-fmt)`) and `E-20` (extract every numeric token from visible text; each is inside a `[data-metric]` or in the allowlist; failures list the token and nearest heading; the same scan runs on each CSV). Put the allowlist in one commented file `frontend/tests/e2e/results/trace-allowlist.ts` (dates from `generated_at` / `mtime`, citation and bin label strings, `NOISE_THRESHOLD`, `AXIS_MIN`, ISO years), each entry with its reason — files: `frontend/tests/e2e/results/trace.spec.ts`, `frontend/tests/e2e/results/trace-allowlist.ts` — satisfies: SC-001, C-Art. I.1, R6
- [ ] T059 Write spec `E-03` (SC-002): one activation of "Sources & data →" reveals run, split, n, file, file date, export date and per-seed values; the test counts interactions and fails above 2; for config changes it asserts the documented "run not exported" marker — files: `frontend/tests/e2e/results/provenance.spec.ts` — satisfies: US1-3, SC-002, C-Art. I.2
- [ ] T060 [P] Add axe specs `A-01` (light, at 1280 and 320) and `A-02` (dark) for `/results` using 001's helper (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa; fail on serious or critical); also tab-panel and footnote states opened — files: `frontend/tests/e2e/results/a11y.spec.ts` — satisfies: SC-003, C-Art. III
- [ ] T061 [P] Implement lint `L-01`: add a check (ESLint `no-restricted-syntax` rule scoped to `frontend/components/results/**` or a short script `frontend/scripts/check-results-numbers.mjs` added to `check:frontend`) that fails on numeric literals in JSX text and string literals there, excluding the allowlist file; with a unit test of the checker on a bad sample — files: `frontend/scripts/check-results-numbers.mjs`, `frontend/tests/unit/check-results-numbers.test.ts`, `frontend/package.json` — satisfies: SC-001, C-Art. I.1, L-01
- [ ] T062 Verify the fixture can't ship, end to end: (a) `check:no-fixture` against `.next-e2e` after `build:e2e` reports hits (the e2e build deliberately contains the fixture); (b) a plain `next build` with `SITE_DATA_PATH` at the fixture and **without** `SITE_DATA_ALLOW_FIXTURE` fails with the loader's refusal message; (c) a plain `next build` with no `data/site_data.json` fails naming the missing file. Never create a copy of the fixture with its markers removed (C-Art. I.1). `check-no-fixture` passing on clean output is covered by its unit test, not by a real build, until 002 delivers data (B-08) — files: none (verification only) — satisfies: plan §5, C-Art. I.1
- [ ] T063 Add the small-viewport screenshot check at 320 px for the dot plot (smallest rendered text ≥ about 11 px via computed size of the scaled SVG text) as a Playwright assertion — files: `frontend/tests/e2e/results/a11y.spec.ts` — satisfies: FR-006, edge case narrow screens, R8

## Phase 7 — Verification and hand-over

- [ ] T064 Run `pnpm check` from the repo root; everything green, no skipped test other than the progression tests while `SHOW_PROGRESSION=false` — files: none — satisfies: all
- [ ] T065 Confirm bundle budget (001 `budget.spec.ts`) still passes with the two client islands (`FigureViews`, `SectionNav`) — files: none — satisfies: plan §2 client JS, 001 SC-003
- [ ] T066 Request Rolf's manual keyboard pass (`A-03`): tab through contents, figure tabs (arrow keys), disclosures, footnotes (Enter opens, Escape closes), CSV links; VoiceOver read of one table and the plot description; visual spot-check of table style against DS §9.5 and the dot plot against DS §9.12 in light and dark — files: none (manual, performed by Rolf) — satisfies: A-03, SC-003, FR-004
- [ ] T067 Compile the list of created and modified files for the orchestrator's single hand-over block (agents do not run git write commands); list also edits to 001-owned files: `frontend/next.config.ts`, `frontend/package.json`, `frontend/playwright.config.ts` (if changed), `.env.example`, `frontend/app/(reading)/results/page.tsx` — files: none — satisfies: CLAUDE.md §1
- [ ] T068 Update CLAUDE.md §4 command list only if Rolf asks (001 owns it); otherwise report the new commands (`gen:site-data-types`, `check:site-data`, `build:e2e`, `check:no-fixture`) to the orchestrator — files: none — satisfies: CLAUDE.md §4

---

## Blocked on Rolf (decisions needed; each is a one-line change once answered)

| ID | Decision | Default used meanwhile | Where it lives | Tasks affected |
|---|---|---|---|---|
| Q1 | Decimal policy (tables vs prose) | 4 dp tables, 3 dp prose | `format.ts` constants | T013, T014, T038 |
| Q2 | Source and export of the noise threshold (0.03) | Named constant `NOISE_THRESHOLD`, allowlisted in the trace test | `config.ts` | T006, T047, T058 |
| Q3 | Wording of Benchmarks and Config-changes finding sentences | Plan §8 drafts, marked DRAFT | `findings.ts` | T036, T037, T045, T047 |
| Q4 | TTA definition footnote text | `Pending` placeholder until supplied | `findings.ts` (`TTA_DEFINITION`) | T039 |
| Q5 | Single-run margin note wording | Draft built from `ours.n`, marked DRAFT | `findings.ts` | T045 |
| Q6 | Include model progression in the MVP | `SHOW_PROGRESSION = false` | `config.ts` | T006, T048, T049, T051 |
| Q7 | Progression placement | After Config changes | `config.ts` section list | T049, T055 |
| S-ids | Schema/spec conflicts below | Page works around them | see below | see below |

---

## Coverage table

| Requirement | Tasks |
|---|---|
| FR-001 layout and collapse | T052, T053, T056 |
| FR-002 section order | T006, T035, T052, T055 |
| FR-003 headings and sentences | T035, T036, T037, T038, T052 |
| FR-004 table style | T030, T031, T038, T039, T044, T045, T047, T066 |
| FR-005 source line, panel, CSV | T022 to T025, T033, T043, T045, T047, T050, T051, T057 |
| FR-006 SVG dot plot, accessible, Table tab, axis 0.50 | T006, T011, T040 to T043, T063 |
| FR-007 formatting | T013, T014, T027, T044, T046 |
| FR-008 static generation and build validation | T009, T010, T015, T016, T055, T057 |
| FR-009 contents list marking | T052, T054 |
| FR-010 Lab link | T006, T046, T047 |
| US1 AS1 headline sentence | T036, T037, T038 |
| US1 AS2 headline table and TTA group | T026, T027, T038, T039 |
| US1 AS3 sources and CSV | T022 to T025, T033, T050, T051, T059 |
| US2 AS1 size sentence and plot | T036, T040 to T043 |
| US3 AS1 benchmarks | T011, T026, T027, T044, T045 |
| US4 AS1 config rows | T011, T027, T046, T047 |
| US4 AS2 0.03 rule once | T046, T047 |
| Edge: narrow screens | T052, T053, T054, T063 |
| Edge: dark theme and shape captions | T042, T043, T060 |
| Edge: missing metric fails build | T009 to T012, T015, T016, T062 |
| SC-001 numbers trace | T028, T029, T058, T061 |
| SC-002 run, split, n in ≤ 2 interactions | T022, T023, T033, T059 |
| SC-003 axe | T030, T060, T066 |
| C-Art. I.1 to I.8 | T018, T019, T028, T029, T037, T045, T047, T058, T061, T062 |
| C-Art. III accessibility | T030, T034, T035, T054, T060, T066 |

**Gaps:** none uncovered by a task. Limits and dependencies:

- US1 AS3 asks for per-seed values; the schema has no seed labels (S5), so T033 shows them as ordered "seed values". Partially met.
- FR-002 lists "Per class, DAPFT when data exists"; the schema has no per-class AP and spec "Out of scope" defers it (S7). No task builds those sections; DAPFT appears as a dropped config row (T047). Spec text should be amended by Rolf.
- SC-002 for config changes cannot show run names (S1). T022, T047, T059 use a "run not exported" marker.
- Playwright `E-21` and `B-11` run only when `SHOW_PROGRESSION` is true.

## Schema and spec conflicts affecting tasks

| ID | Conflict | Effect | Tasks affected |
|---|---|---|---|
| S1 | `config_changes` rows carry no run names (only `source`) | Art. I.2 cannot be fully met for that table; marker used | T022, T033, T047, T059 |
| S2 | No `unit` on deltas and no noise threshold in the schema | Δ assumed fraction; `NOISE_THRESHOLD` is a constant | T006, T014, T047, T058 |
| S3 | `best_published.unit` optional; no split, n or file | Guard requires unit (build fails if absent); winner logic and FR-007 depend on it | T011, T012, T026, T045 |
| S4 | Published values have no run or file | Citation footnote only; Rolf must confirm acceptable | T045 |
| S5 | `per_seed` has no seed labels | Shown in order, unlabelled | T033, T059 |
| S6 | `object_size` optional in schema, but the plot needs it | Guard fails the build if absent | T011, T012, T043 |
| S7 | FR-002 vs out-of-scope for Per class / DAPFT sections | Not built | T055 |
| S8 | 002 spec lists a `dataset` table the schema lacks | Not used by 006; no effect | none |
| S9 | DS §9.4 badge set has no "Dropped", "Improved", "Worse", "Pending export" | Plain text and `Pending` used | T046, T047 |
| S10 | Spec hard-codes "mean of 3 seeds" and 0.645 / 0.638 | Derived from data (`n`, values); the label changes if `n` changes | T036, T038, T039 |
| S11 | `tta.*` lacks `additionalProperties: false` | Extra keys would pass the schema; guard checks required fields only | T012 |
| R1 | Plain `pnpm build` fails until 002 delivers data | `check:frontend` uses `build:e2e` | T016, T017, T020 |

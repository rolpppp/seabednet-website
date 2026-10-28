# 006 — Results: implementation plan

**Status:** Draft for review · **Spec:** [spec.md](spec.md) · **Depends on:** 001 (shell, tokens, base components), 002
(schema now, real data later) · **Rules:** C-Art. I (core), III, VII.3

## 1. Summary

`/results` is one statically generated page. At build time a server-only loader reads `site_data.json`, validates it
against the 002 JSON Schema, runs a short list of page-specific checks, and builds typed view models. Server components
render four sections (Headline, Object size, Benchmarks, Config changes), each a serif finding sentence, a table or SVG
dot plot, a source line, a "Sources & data" provenance panel, and a margin note. CSV downloads are static files built
from the same data.

Three rules shape the design:

1. **No number is typed.** Every number goes through one `<Num>` component that takes a `Metric` (or a named derived
   field) and writes `data-metric="<json path>"`. A test resolves each path against the JSON and re-formats it.
2. **The build fails loudly.** Missing file, invalid JSON, schema violation, a missing metric, a finding sentence the
   data does not support, or a fixture marker in a production build all stop `next build` with a message naming the
   path.
3. **The fixture never ships.** It lives outside `data/` and the app source folders, is only reachable through an env var that only the
   e2e build sets, and is refused by the loader otherwise (section 5).

No chart library. The dot plot is about 120 lines of server-rendered SVG (section 9).

## 2. Technical context

| Item | Choice |
|---|---|
| Language / framework | TypeScript (strict), Next.js App Router, React Server Components. Versions as recorded by 001's plan. `next.config.ts` form assumes Next 15+. |
| Styling | Tailwind v4 with 001's tokens only. No hex, radius or duration literals (001 SC-002). |
| Rendering | `export const dynamic = "error"` on the page and `force-static` on the CSV routes. A dynamic API creeping in fails the build. |
| Client JS | Two small islands: `FigureViews` (Chart/Table/Sources tabs, from 001 Tabs) and `SectionNav` (scroll marking). Tables, plot, source lines and disclosures are server HTML. Budget: well inside 001 SC-003 (150 KB gzip). |
| Data | `data/site_data.json` at the repo root. Override with `SITE_DATA_PATH` (tests only). |
| Schema | Read-only from `specs/002-site-data/contracts/site-data.schema.json` (single constant in `lib/site-data/paths.ts`). Never copied. |
| New dependencies | `ajv` + `ajv-formats` (runtime validation, server only, never in a client bundle). `json-schema-to-typescript` (dev only, types). Nothing else. Reasons in sections 4 and 9. |
| Tests | Playwright + `@axe-core/playwright` (from 001). Pure-function tests use whatever unit runner 001 sets up. This plan assumes Vitest; if 001 chooses otherwise the test bodies do not change. |
| Target | Modern evergreen browsers; works with JS off for everything except tab switching and section marking. |

## 3. Constitution check

| Article | Result |
|---|---|
| I.1 No typed or shipped metric | Pass by design. `<Num>` is the only number renderer; a lint grep (section 11, T-LINT) fails on numeric literals in `components/results/**` JSX text. Fixture is blocked from production (section 5). |
| I.2 Provenance on every number | Pass for run, split, n, file, mtime, export date where the schema carries them. **Gap:** `config_changes` rows carry no run names, benchmark `best_published` carries only a citation (section 13, S1, S4). |
| I.3 Test labelled "test"; val only if labelled | Split is read from each `Metric.split` and written out. Loader asserts headline, tta, benchmarks and object size are `test`. Config rows show their own split in a column. |
| I.4 TTA labelled and apart | Own column group headed "With flip TTA (test-time augmentation)", values in secondary text. A `TtaMetric` / `ModelMetric` type split plus a loader assertion stops a TTA metric landing in a model column or the reverse. |
| I.5 Null results shown; dropped shown | `no_detectable_difference` renders the DS badge; `dropped` renders text plus evidence IDs. Neither is ever filtered. |
| I.6 No fake variants | Not-yet-trained variants (progression section, if enabled) render disabled "Pending ablation". `pending_export` config values render as `.ph` placeholders. |
| I.7 Params beside external benchmarks | Benchmarks table has two always-present params cells per row; loader fails if either is missing or not positive. |
| I.8 No invented facts | Citations come from `best_published.citation`. Any copy that asserts a fact not in the data is listed in section 13 for Rolf. |
| II DS binding | Tokens only. Table per DS 9.5, source line 9.6, footnotes 9.7, nulls 9.8, charts 9.12, layout 10.3. No cards, no metric tiles. |
| III Accessible | Section 10. axe in light and dark, keyboard pass, no state by colour alone. |
| IV Model fidelity | Not applicable. This page reads exported numbers and runs no model. |
| V Humans own git | No git commands. Hand-over is the orchestrator's job. |
| VI Spec first | Every FR and scenario maps to a test (section 7). Spec defects are in section 13, not patched here. |
| VII Simplicity | No chart library, state manager or CSV library. Static generation per VII.3. Two small client islands. |
| VIII Uploads | Not applicable. |

## 4. Data loading and typing

### Loading (build time)

`lib/site-data/load.ts` (`import "server-only"`):

1. Resolve the path: `process.env.SITE_DATA_PATH ?? <repo>/data/site_data.json`.
2. Read and `JSON.parse`. Missing file or parse error throws: `site_data.json not found at <path>. Run
   scripts/export_site_data.py (feature 002).`
3. Validate with Ajv 2020 (`ajv/dist/2020`, `ajv-formats` for `date-time`, `strict: true`, `allErrors: true`). On
   failure throw with every error as `<instancePath>: <message>`.
4. Refuse fixture data unless allowed (section 5).
5. Run `assertResultsData(data)` (`guards.ts`): the page-specific checks that a schema cannot express (below).
6. Return a frozen `SiteData`, memoised in module scope so the page and the CSV routes read the file once per build.

Two build-time hooks make the failure early and obvious:

- `next.config.ts` calls `loadSiteData()` when `phase === PHASE_PRODUCTION_BUILD` (before any compile). This is a small
  edit to 001's file (section 6, "touches 001").
- The page and the CSV routes also call it, so `pnpm dev` shows the same error overlay.

The loader is the only code that touches the file. Client components never import it and never receive the whole
object: they get ids, labels and server-rendered `ReactNode` children.

### Page-specific checks (`guards.ts`)

Each throws with the JSON path. These turn "required by the page" into build failures:

- `headline.box/mask` each have all five of AP, AP50, AP_S, AP_M, AP_L; `split === "test"`; `tta !== true`;
  `per_seed.length === n`; same `n` across the ten metrics (the "mean of N seeds" label depends on it).
- `tta.*` metrics: `tta === true`, `split === "test"`.
- Object-size plot: the six AP_S/M/L values share one `unit`; `unit === "fraction"`; every value ≥ 0.50 (axis start,
  FR-006). If a value falls below 0.50 the build fails and Rolf decides whether to move the axis.
- `object_size.bins` exists (the schema leaves it optional, section 13 S6).
- Benchmarks: at least one row per task; `ours_params_m` and `best_published.params_m` finite and > 0;
  `ours.split === "test"`; `best_published.unit` present (section 13 S3).
- Config changes: first row has `is_baseline: true` and `reading: "baseline"`; `reading` of `improved` / `worse` /
  `no_detectable_difference` requires non-null `delta_box_ap`, `delta_mask_ap`, `n`; `dropped` requires non-empty
  `evidence`; only `dropped`, `pending_export` and `baseline` may have null deltas.
- Claims guard: each hard-coded finding sentence has a predicate over the data (section 8). A false predicate fails the
  build rather than printing a sentence the data contradicts.
- If the progression flag is on (section 6), every variant in the progression list exists, is `trained`, and has
  non-null `test_box_ap` and `test_mask_ap`.

### Typing: generate types from the schema (chosen)

`json-schema-to-typescript` reads the schema and writes `lib/site-data/types.generated.ts`, committed to the repo.
Command: `pnpm gen:site-data-types` (script `scripts/gen-site-data-types.mjs`, options `additionalProperties: false`,
`unreachableDefinitions: true` so `Metric` and `CocoMetrics` get names). CI runs the generator and fails if the file
differs (`git diff --exit-code`, read-only).

Why generate rather than hand-write or add Zod:

- The schema is already the contract; a second hand-written description (Zod or interfaces) can drift from it.
- Ajv already enforces the schema at runtime, so Zod would be a second validator for the same rules.
- One dev-only dependency, zero runtime cost, and a schema change shows up as a type error in `tsc` (001's check
  command), which points at the exact component to update.

`lib/results/types.ts` adds only narrow aliases on top: `ModelMetric` (`tta` falsy) and `TtaMetric` (`tta: true`)
as branded types produced by the guards, so a TTA metric cannot be passed to a model-column cell by accident.

## 5. Keeping fixtures out of production

Feature 002 is deferred, so development and tests run on a fixture that validates against the schema.

| Layer | Mechanism |
|---|---|
| Location | `frontend/tests/fixtures/site_data.fixture.json`. Not in `data/`, not under `app/`, `components/` or `lib/`, not under `public/`. No file under `app/`, `components/` or `lib/` may reference `tests/`. |
| Self-identification | `generator_version: "FIXTURE-DO-NOT-SHIP"`; every run name starts `FIXTURE_`; every `source.file` starts `fixture/`. Values are plausible but deliberately different from the thesis numbers, so a leak cannot be mistaken for the real result. |
| Loader refusal | If `generator_version` starts with `FIXTURE` and `SITE_DATA_ALLOW_FIXTURE !== "1"`, `loadSiteData()` throws. The normal `pnpm build` and `pnpm dev` never set that flag. |
| Separate build | `pnpm build:e2e` sets `SITE_DATA_PATH`, `SITE_DATA_ALLOW_FIXTURE=1` and `NEXT_DIST_DIR=.next-e2e` (read by `next.config.ts`). The fixture build therefore never writes into `.next`, which is what gets deployed. Playwright's `webServer` runs `.next-e2e`. |
| CI leak check | After any production build, `scripts/check-no-fixture.mjs` greps `.next/`, `public/` and `out/` (if present) for `FIXTURE-DO-NOT-SHIP` and `FIXTURE_`. A hit fails CI. A second grep fails if `app/**`, `components/**` or `lib/**` mention `tests/fixtures`. |
| Honesty of the fixture | A unit test validates the fixture against the schema and runs `assertResultsData` on it, so it can never drift from the contract. |
| Coverage | The fixture is built to exercise every branch: one `no_detectable_difference` row, one `dropped` row with evidence IDs (F29, F33, F116, F121), one `pending_export` row, one `val`-split row, an `n: 1` row, a percent-unit RUOD row beside a fraction one, a pending variant, and a progression set. |

Consequence for 001: until 002 delivers a real `data/site_data.json`, a plain `pnpm build` fails by design (spec edge
case: missing data fails the build). 001's single check command and CI must therefore run `build:e2e` (fixture), or not
build at all, until 002 lands. See section 13 R1.

## 6. Files and ownership

### Expected from 001 (not created here)

If any of these differ in 001's plan, tell me and I will adapt. Names are descriptive.

| Needed | Used for |
|---|---|
| Tokens, type scale utilities (h2/h3 serif, body, small, caption, data), fonts | Everything |
| `Nav`, `Footer`, `ReadingLayout` (page container, light/dark reading theme, skip link, `<main>`) | Page shell. 006 renders the `h1` "Results" into it. |
| `Table` styles / primitives (editorial: hairlines, header rule, tabular numbers, `.num` right-align) | `DataTable` builds on these. Needs a column-group header rule class. |
| `Tabs` (underline, arrow keys, panels can stay mounted with `hidden`) | `FigureViews` |
| `Badge` with the `null` variant ("No detectable difference") | Config table |
| `SourceLine` (13 px, mono run IDs, trailing action slot) | Under every table and figure |
| `Footnote` (popover, bottom dock < 560 px, `display:none` when closed) | TTA header, best-published citations |
| `Collapsible` (native `<details>`) | "Sources & data" panel |
| `Button` text/secondary variants | CSV download link |
| Placeholder style `.ph` (dashed underline) as a class or tiny component | `pending_export` cells |
| Playwright config, `webServer`, axe helper, unit runner, the single check command, `.env.example` | Tests; I add `SITE_DATA_PATH`, `SITE_DATA_ALLOW_FIXTURE`, `NEXT_DIST_DIR` entries |

### Touches 001-owned files (small, reviewed edits)

- `frontend/next.config.ts`: build-phase data check; `distDir` from `NEXT_DIST_DIR`.
- `frontend/package.json`: scripts `gen:site-data-types`, `check:site-data`, `build:e2e`, `test:e2e`; the three
  dependencies above.
- `frontend/app/(reading)/results/page.tsx`: replaces 001's placeholder route (FR-007 of 001).
- `.env.example`: three variables.

### Created by 006

```
frontend/
  scripts/
    gen-site-data-types.mjs        runs json-schema-to-typescript
    check-no-fixture.mjs           greps build output for fixture markers
  app/(reading)/results/
    page.tsx                     static page: loads data, builds view models, composes sections
    csv/[table]/route.ts         force-static CSV: headline | object-size | benchmarks | config-changes | progression
  components/results/
    ResultsShell.tsx             3-column layout, container-query collapse (FR-001)
    SectionNav.tsx               "On this page" list; client island (FR-009)
    ResultSection.tsx            <section id> + serif finding heading + body + notes slot
    MarginNote.tsx               role="note" block, beside or under its section
    FigureViews.tsx              client island: Chart / Table / Sources tabs
    DataTable.tsx                caption, scroll region, colgroups, row headers, a11y wiring
    Num.tsx                      the only number renderer (data-metric attribute)
    Placeholder.tsx              "Pending export" (only if 001 gives no .ph)
    ProvenancePanel.tsx          run, split, n, file, mtime, locator, per-seed, export date; CSV link
    ResultsSourceLine.tsx        builds the DS 9.6 sentence from a Provenance and wraps 001 SourceLine
    HeadlineTable.tsx
    SizeDotPlot.tsx              hand-rolled SVG
    BenchmarksTables.tsx
    ConfigChangesTable.tsx
    ProgressionTable.tsx         optional section (section 6, flag)
  lib/site-data/
    paths.ts  load.ts  validate.ts  guards.ts  types.generated.ts
  lib/results/
    config.ts                    SHOW_PROGRESSION flag, PROGRESSION_IDS, AXIS_MIN, section list
    format.ts                    all number and date formatting (policies named in one place)
    provenance.ts                collectProvenance(), summaries, footnote text
    findings.ts                  finding sentences + the predicates that guard them
    view-models.ts               data -> table/plot view models, grouping, winner logic
    csv.ts                       RFC 4180 writer (about 30 lines) and per-table row builders
    dotplot-geometry.ts          scales, ticks, label offsets, text description
    types.ts                     ModelMetric / TtaMetric aliases
  tests/
    fixtures/site_data.fixture.json
    unit/                        format, csv, guards, findings, geometry, provenance, fixture-valid, loader-failure
    e2e/results/                 Playwright specs (section 11)
```

### Model progression section: toggle (open question, not decided)

The section is **off by default** and gated by **both** a reviewed code constant and data presence:

- `SHOW_PROGRESSION` in `lib/results/config.ts` (default `false`). A constant, not an env var, so enabling it is a
  visible diff Rolf commits, and static output cannot differ between machines.
- `PROGRESSION_IDS = ["c2f_mdual", "c2f_vitb_cvxmos", "b0"]` (variant ids in display order; confirm ids with 002).
- When the flag is `false`, the section, its contents entry, its CSV route and its tests do not render or run.
- When the flag is `true`, the data must be present and trained (guard in section 4). Missing data fails the build.
  It never silently hides the section and never shows a placeholder row.

If Rolf prefers "show whenever the data exists", the change is one line in `config.ts`
(`SHOW_PROGRESSION = hasProgressionData(data)`); that choice makes the page's contents depend on the exporter, which is
why the default is explicit. Placement if enabled: after Config changes. Columns: model, what changed, test box AP, test
mask AP, each with provenance.

## 7. Requirement and scenario mapping

Test IDs: `U-` unit, `E-` Playwright, `A-` axe, `B-` build-failure, `L-` lint/grep. Details in section 11.

| Item | Where it is met | Tests |
|---|---|---|
| **US1 AS1** headline sentence with data values | `findings.ts#headlineSentence` -> `ResultSection` h2; `Num` with 3 dp | E-01 (text equals sentence rebuilt from fixture), U-04 |
| **US1 AS2** Box/Mask x AP, AP50, AP_S/M/L under "JODD test · mean of 3 seeds"; separate "With flip TTA" group, AP and AP50, secondary text | `HeadlineTable.tsx`, `DataTable.tsx`; group labels from `Metric.split` and `n` | E-02 (headers, row/col count, TTA group position, secondary-text class), U-05 |
| **US1 AS3** "Sources & data →" shows runs, files, split, n, export date, per-seed values; CSV | `ProvenancePanel.tsx`, `provenance.ts`, `csv/[table]/route.ts` | E-03 (one activation reveals all fields), E-04 (CSV equals JSON), U-06 |
| **US2 AS1** size sentence; dot plot with circles and diamonds, shared axis, direct labels, Chart/Table/Sources tabs | `SizeDotPlot.tsx`, `dotplot-geometry.ts`, `FigureViews.tsx`, `findings.ts#sizeSentence` | E-05, E-06 (tabs by keyboard), U-07, A-01 |
| **US3 AS1** benchmark rows: benchmark, protocol, ours (bold if higher), best published + model, both params; single-run note | `BenchmarksTables.tsx`, `view-models.ts#winner`, `MarginNote` | E-07, U-08 (winner across units), B-06 (params missing) |
| **US4 AS1** baseline first; split, n, deltas; badge; DAPFT dropped with IDs; placeholders | `ConfigChangesTable.tsx` | E-08, E-09, B-07 |
| **US4 AS2** margin note explains the 0.03 rule once | `ConfigChangesTable.tsx` + `MarginNote` | E-10 (exactly one occurrence) |
| Edge: narrow screens | `ResultsShell` container queries, `DataTable` scroll region | E-11 (viewports 1280, 900, 600, 320) |
| Edge: dark theme | tokens only; caption describes series by shape | A-02, E-12 (caption text mentions circles and diamonds) |
| Edge: missing metric fails the build | `load.ts`, `guards.ts`, `next.config.ts` hook | B-01..B-09 |
| FR-001 layout 150 / content / 190 with collapse | `ResultsShell.tsx` | E-11 |
| FR-002 section order | `page.tsx` assembles from a section list in `config.ts` | E-13 (heading order) |
| FR-003 h2 lead, h3 sections, full-sentence headlines | `ResultSection.tsx` | E-13, A-01 (heading-order rule) |
| FR-004 table style | `DataTable.tsx` over 001 table styles | E-02, visual spot check in tasks |
| FR-005 source line + panel + CSV on every table and figure | `ResultsSourceLine`, `ProvenancePanel`, CSV routes | E-14 (every `table` and `figure` has a source line and a panel) |
| FR-006 SVG, `role="img"` + full description, Table tab, axis from 0.50 stated in caption | `SizeDotPlot.tsx` | E-05, U-07 (description lists all six values), B-04 (value < 0.50) |
| FR-007 formatting (3 or 4 dp fractions, 2 dp percents, true minus, no mixed units in a column) | `format.ts`; benchmark tables split by unit | U-01..U-03, E-15 (no `-` hyphen before a digit in Δ cells) |
| FR-008 static generation + build validation | `dynamic = "error"`, `load.ts`, config hook | B-01..B-09, E-16 (response has no client data fetch) |
| FR-009 contents list, current marked while scrolling, no animation | `SectionNav.tsx` (IntersectionObserver, `aria-current="location"`) | E-17 (also under reduced motion) |
| FR-010 "Compare variants in the Lab →" | link in `ConfigChangesTable` section footer | E-18 |
| SC-001 every number traces | `Num` + trace test | E-19, E-20, L-01 |
| SC-002 run, split, n in ≤ 2 interactions | disclosure link directly under each source line | E-03 (counts interactions) |
| SC-003 axe 0 serious/critical, light and dark | section 10 | A-01, A-02 |

## 8. Section design

### Page frame

`h1` "Results" (small, in 001's `ReadingLayout`), then `ResultsShell`: contents list (sticky, `nav aria-label="On this
page"`), content column, notes column. Section order from `config.ts`: `headline`, `object-size`, `benchmarks`,
`config-changes`, then `progression` only if enabled. "Per class" and "DAPFT" sections are **not** built: the schema has
no per-class AP, and DAPFT already appears as a dropped row in Config changes (section 13 S7).

### Finding sentences (`findings.ts`)

Pure functions of the data. Each has a predicate; `assertResultsData` runs them all.

| Section | Sentence | Predicate (build fails if false) |
|---|---|---|
| Headline | "SeaBed-Net reaches {box.AP 3dp} box AP and {mask.AP 3dp} mask AP on the held-out JODD test split." | `split === "test"` for both |
| Object size | "Masks trail boxes on small objects and lead on large ones." (spec wording) | `mask.AP_S < box.AP_S` and `mask.AP_L > box.AP_L` |
| Benchmarks | Draft: "SeaBed-Net {leads / trails / is mixed against} the best published results on {benchmark names}, with {Num} M parameters against {Num} M." Words chosen by sign of the comparison. | Needs Rolf's wording (section 13 Q3) |
| Config changes | Draft: "Most single changes made no detectable difference; DAPFT was dropped." | At least one `no_detectable_difference`; "Most" means more than half of non-baseline rows. Needs Rolf's wording. |

Failing a predicate stops the build so the sentence is reviewed, not silently rewritten.

### Headline

Table via `HeadlineTable`. Columns: row header (Box, Mask) | group "JODD test · mean of {n} seeds": AP, AP50, AP_S,
AP_M, AP_L | group "With flip TTA (test-time augmentation)": AP, AP50 (secondary text). AP_S/M/L headers show "AP" with a
subscript plus an `sr-only` expansion ("AP, small objects"). The group label's "test" and "{n}" come from the metrics,
not from the string. A footnote on the TTA group header gives the one-line definition (copy to confirm, Q4). Bold: none
(no winner in this table). Source line: `Source: <runs> · {n} seeds · JODD test split · TTA from <tta source file>`
followed by the disclosure.

### Object size

`FigureViews` with tabs Chart | Table | Sources.

- Chart: `SizeDotPlot`. Rows small, medium, large (labels from `object_size.bins`). One horizontal axis, AP from 0.50 to
  the next 0.05 above the max value, ticks every 0.05, gridlines in `--border`. Box = circle in `--ocean`, mask =
  diamond in `--text`. Direct labels: value beside each mark; series names ("box", "mask") written once beside the first
  row's marks, no legend. When two marks are within 0.01 the box label goes above and the mask label below. Caption (a
  `<figcaption>`): "Box AP (circles) and mask AP (diamonds) by COCO size bin. The axis starts at 0.50, not 0."
- Table tab: the same six values in a `DataTable`.
- Sources tab: provenance of the six metrics (the same `ProvenancePanel`).
- The source line's link switches `FigureViews` to the Sources tab and moves focus to the panel.

### Benchmarks

One `DataTable` per benchmark (RUOD, UIIS10K), split further by `unit` if a benchmark mixes fractions and percents, so
a column never mixes units (FR-007). Columns: Task and protocol | Ours | Best published (value, model) | Params (ours,
best published). Rows keep data order. Winner logic: compare after converting both to fractions **for comparison
only**; display stays in each value's own unit; the higher value is bold and gets an `sr-only` "(higher)"; ties bold
nothing. Params are shown as "{n} M" next to each value in the same row, never behind a tooltip. Best-published
citation is a footnote on the model name (one marker per row). Margin note: "Single runs. Published figures are taken
from the cited papers" built from `ours.n` (if every row has `n === 1`; otherwise it states the n range) (Q5).

### Config changes

One `DataTable`: Change | Split | n | Δ box AP | Δ mask AP | Reading. Baseline row first, with Δ cells showing an em
dash and Reading "Baseline". Deltas use a true minus (U+2212) and an explicit plus. Reading cell by `reading`:

- `no_detectable_difference`: 001's Badge `null` variant ("No detectable difference"). Deltas still shown.
- `dropped`: plain text "Dropped" and evidence IDs in mono (e.g. F29, F33, F116, F121); Δ cells show an em dash.
- `pending_export`: `.ph` placeholder "Pending export" in the Δ cells.
- `improved` / `worse`: plain words "Improved" / "Worse"; the signed Δ already carries direction.

Split is plain text "test" or "val" in its own column; the section note states that val rows are not test results
(Art. I.3). Margin note explains the 0.03 rule once. Section footer link: "Compare variants in the Lab →" (`/lab`).

### Margin note and the 0.03 rule

The threshold appears in prose, so it is a number on the page that is not a metric. Until the schema carries it
(Q2/S2), it is a named constant `NOISE_THRESHOLD = 0.03` in `config.ts`, rendered through `<Num derived="rule">`, and
listed in the trace test's allowlist with a comment pointing to this plan.

## 9. Provenance, formatting, accessibility mechanics

### Provenance (Art. I.2)

`collectProvenance(metrics: Metric[])` returns `{ runs[], splits[], ns[], sources[{file, mtime, locator}], perSeed[],
generatedAt }`, de-duplicated and sorted. Every table and figure builds one from the exact metrics it renders (the view
model keeps a `metrics` array next to its rows), so the panel cannot list a source the table did not use.

- **Source line** (DS 9.6): `Source: {runs} · {n} seeds · JODD {split} split`. Runs in mono; more than two runs show the
  first two plus "+N more". Config changes: "Source: {file} · splits as labelled per row".
- **Sources & data panel**: a table of run, split, n, source file (mono), file date, locator; per-seed values and sample
  standard deviation where present; the export date from `generated_at`; and a "Download CSV" link. Per-seed values
  carry no seed labels in the schema (S5), so they are shown in order as "seed values".
- **Footnotes**: only for claims, not numbers: the TTA definition and each best-published citation.
- **CSV**: static routes `/results/csv/<table>.csv`. Each row has value, unit, split, n, runs, source file, file date
  and `generated_at`. `csv.ts` writes RFC 4180 quoting with a UTF-8 BOM omitted and `\n` newlines.

### Formatting (`format.ts`, one place, named policies)

- Fractions: 4 dp in tables and the Sources panel, 3 dp in the headline sentence and plot labels.
- Percents: 2 dp. Parameters: "352 M" (integer if integer, else 1 dp).
- Δ: signed, U+2212 for negatives, 4 dp (Δ has no unit field; fraction assumed, S2).
- Rounding uses a decimal-string half-up helper, not raw `toFixed`, with tests on the known values 0.6453 -> "0.645"
  and 0.6380 -> "0.638".
- Dates: ISO date (`2026-10-29`) from `generated_at` and `mtime`; no time zone surprises.

Open choice (Q1): spec FR-007 says "3 or 4 decimals as in the source". The schema has no precision field, so this plan
uses 4 dp in tables, 3 dp in prose. One constant per policy, easy to change.

### Why hand-rolled SVG, no chart library

Six data points, one shared axis, two shapes, direct labels, no interaction. A library (Recharts, Chart.js, visx) adds
tens of KB of client JS against 001's 150 KB budget, ships its own colour and legend defaults that DS 9.12 tells us to
remove, and makes the accessible description harder to control. The hand-rolled component is server-rendered, has no JS
cost, and its geometry is a pure function covered by unit tests. Reconsider only if a later feature needs zoom or hover.

### Accessibility (Art. III)

- **Tables**: real `<table>` with `<caption>`, `<colgroup>`, `scope="col"` / `scope="colgroup"` / `scope="row"`.
  Wrapped in a scroll region with `role="region"`, `aria-labelledby` the caption and `tabindex="0"` so keyboard users
  can scroll it (axe `scrollable-region-focusable`). Numeric cells `font-variant-numeric: tabular-nums`, right-aligned.
- **State not by colour alone**: badge has a word; dropped has the word "Dropped"; bold winner also has `sr-only`
  "(higher)"; pending has text "Pending export" plus the dashed underline; plot series differ by shape and are named
  by direct labels and the caption.
- **Plot**: `<svg role="img" aria-labelledby="{title} {desc}">` with `<title>` and `<desc>` listing every value in
  words; labels inside the SVG are `aria-hidden`. The Table tab is the equivalent text view.
- **Margin notes**: `<div role="note">`, not `<aside>`, so axe's top-level complementary-landmark rule is not triggered
  by notes nested in `<section>`.
- **Contents list**: `<nav aria-label="On this page">`, `aria-current="location"` on the active link; hidden under 700
  px container width with `display:none` (not just visually).
- **Tabs**: 001's Tabs (arrow keys, focus ring). Inactive panels stay in the DOM with `hidden` so the content exists
  without JS in the HTML.
- **Targets**: disclosure summaries and tab buttons are 40 px high (44 on coarse pointers), per DS.
- **Headings**: one `h1`, lead `h2`, section `h3`, no skipped levels.
- **Motion**: scroll marking changes colour/underline only, no transition; reduced motion is global (001).
- **Phone width**: plot viewBox is 360 wide with 14 px text, so the smallest scale at 288 px content width is still
  about 11 px; verified by a screenshot check at 320 px.

## 10. How a number is traced (SC-001, Art. I.1)

- `<Num>` signature: `<Num m={metric} path="headline.box.AP" fmt="table4" />`. `path` is a typed
  `MetricPath` (from the generated types) used by the view-model builders, so a typo is a compile error. Output:
  `<span data-metric="headline.box.AP" data-fmt="table4">0.6453</span>`.
- Non-`Metric` numbers (params, deltas, `n`, plot labels) use the same component with `field` paths
  (`benchmarks[2].ours_params_m`, `config_changes[4].delta_box_ap`).
- The page contains no other numerals in JSX text. Lint check L-01 fails on `[0-9]` inside JSX text and string
  literals under `components/results/**` except an allowlist file (`section ids`, `h1`/`h2` level digits are not text).

## 11. Test plan

Run against the **fixture build** (`build:e2e`). Playwright projects: `desktop-light` (1280), `desktop-dark`
(`colorScheme: "dark"`), `tablet` (900), `phone` (600), `narrow` (320). axe uses 001's helper and fails on serious or
critical.

### Unit (no browser)

- U-01 `format`: fractions, percents, params, Δ sign, true minus, rounding at known values.
- U-02 `format` never emits an ASCII `-` before a digit in Δ.
- U-03 `format` units: percent values are never rescaled for display.
- U-04 `findings`: headline sentence from fixture; predicates true on fixture, false on mutated copies.
- U-05 `view-models`: headline table shape and TTA grouping; a TTA metric in a model column throws.
- U-06 `provenance`: dedupe, ordering, "+N more", fields present for every metric.
- U-07 `dotplot-geometry`: scale, ticks, label offsets near overlap, description lists all six values.
- U-08 `view-models`: benchmark winner across fraction and percent; ties; table split by unit.
- U-09 `csv`: quoting, commas and quotes in citations, round trip against JSON.
- U-10 fixture validates against the schema and passes `assertResultsData`.

### Build-failure (B-)

Each calls `loadSiteData()` with a temp copy of the fixture and asserts the thrown message names the path.

- B-01 file missing. B-02 invalid JSON. B-03 schema violation (wrong `schema_version`).
- B-04 `headline.box.AP_S` deleted; plot value < 0.50.
- B-05 headline `split: "val"`; `tta` flag wrong; mismatched `n`.
- B-06 benchmark params missing. B-07 first config row not baseline; `dropped` without evidence.
- B-08 fixture marker without `SITE_DATA_ALLOW_FIXTURE`.
- B-09 once in CI: `SITE_DATA_PATH=/nonexistent pnpm build` exits non-zero and creates no `.next`.
- B-10 finding predicate false (swap mask and box S) fails with the sentence's name.
- B-11 progression flag on with a variant pending fails.

### Playwright (E-)

| ID | Scenario |
|---|---|
| E-01 | US1.1 lead `h2` equals the sentence rebuilt from the fixture; 3 dp. |
| E-02 | US1.2 headline table headers, two row headers, five + two data columns, TTA group last and in secondary-text class, group label full text. |
| E-03 | US1.3 / SC-002: one click on "Sources & data →" shows run, split, n, file, file date, export date, per-seed values. Counts interactions, fails above 2. |
| E-04 | Downloaded CSV parses and every value equals the JSON. |
| E-05 | US2.1 sentence; SVG `role="img"` with non-empty title/desc; six marks (3 circles, 3 diamonds); caption says the axis starts at 0.50. |
| E-06 | Tabs Chart/Table/Sources by arrow keys; Table tab values equal plot description values; source link switches to Sources. |
| E-07 | US3.1 each row: benchmark, protocol, ours, best-published value and model, two params cells; bold on the higher; note says single runs. |
| E-08 | US4.1 baseline first; each row has split text, n, two deltas; at least one badge reads "No detectable difference". |
| E-09 | DAPFT row reads "Dropped" with F29, F33, F116, F121; `pending_export` row shows a placeholder, not a blank. |
| E-10 | US4.2 the 0.03 rule appears in exactly one margin note. |
| E-11 | Viewports: 1280 three columns; 900 notes under their sections; 600 contents hidden; 320 `scrollWidth <= innerWidth`, tables scroll inside their region. |
| E-12 | Dark theme: captions describe by shape, no mention of colour names. |
| E-13 | Heading order: one `h1`, `h2` lead, `h3` sections in FR-002 order, no skipped level. |
| E-14 | Every `<table>` and `<figure>` is followed by a source line and a provenance panel. |
| E-15 | Δ cells use U+2212, never ASCII hyphen. |
| E-16 | Page makes no request for `site_data.json` or any JSON at runtime; zero third-party requests. |
| E-17 | Contents link marks the current section on scroll, also with `reducedMotion: "reduce"`; keyboard focus order is contents, then content. |
| E-18 | "Compare variants in the Lab" link present and points to `/lab`. |
| E-19 | **Trace by attribute**: every `[data-metric]` path resolves in the fixture and its text equals `format(value, data-fmt)`. |
| E-20 | **Trace by scan**: extract every numeric token from visible text; each must be (a) inside a `[data-metric]`, or (b) in the allowlist (dates formed from `generated_at`/`mtime`, strings inside `citation`/`bins`, `NOISE_THRESHOLD`, `AXIS_MIN`, ISO years). Failures list the token and its nearest heading. The same scan runs on each CSV. |
| E-21 | Progression (only when flag on): rows in `PROGRESSION_IDS` order, pending variants disabled with "Pending ablation". |

### Accessibility

- A-01 axe on `/results`, light, at 1280 and 320: zero serious/critical.
- A-02 same in dark.
- A-03 manual keyboard pass before the feature is marked done: tab through contents, tabs, disclosures, footnotes
  (open with Enter, close with Escape), CSV links; VoiceOver read of one table and the plot description.

### Lint and CI

- L-01 grep: numeric literals in `components/results/**` JSX text.
- L-02 `check-no-fixture.mjs` after production build.
- L-03 generated types are up to date.
- CI order: type-check, lint, unit, `gen:site-data-types` drift, `build:e2e`, Playwright (all projects), axe.

## 12. Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | A plain `pnpm build` fails until 002 delivers real data. 001's CI or check command may call it. | Say so in 001's plan; use `build:e2e` for CI until 002 lands. |
| R2 | 001 differs from the components I assume (Tabs panels unmounted when inactive, Table lacks group rules, no `.ph`). | Section 6 lists exact needs; 006 owns fallbacks (`Placeholder`, group-rule CSS) and will say so in tasks. |
| R3 | Schema gaps (section 13) force a schema revision after the page is written. | The view-model layer isolates the schema; guards fail loudly, so a revised schema surfaces immediately. |
| R4 | Finding sentences go stale when real numbers arrive and a predicate fails. | Intended: the build fails and Rolf reviews the sentence. |
| R5 | Percent vs fraction in benchmark comparison. | Compare in fraction only for the "higher" mark; display unchanged; unit tests cover it. |
| R6 | Trace scan false positives from citations, dates, IDs. | Explicit, commented allowlist in one file; each entry has a reason. |
| R7 | ajv strict mode rejects a schema keyword. | Run validation in a unit test early; fall back to `strict: "log"` only with Rolf's say-so, since 002 owns the schema. |
| R8 | Plot text too small at 320 px. | 360-wide viewBox, 14 px text, screenshot check. |
| R9 | `distDir` override or `next.config.ts` hook conflicts with 001's config. | Small, isolated edit; flagged to the orchestrator. |
| R10 | Footnote popover and scroll region inside tables clip each other. | Footnotes live in header/row-header cells; popover is positioned against the viewport (001) not the scroll region; covered by a manual check. |

## 13. Open questions and spec/schema problems (for Rolf; spec and schema are not edited here)

**Questions**

- Q1 Decimal policy: confirm 4 dp for tables and 3 dp for prose (spec says "3 or 4 as in the source").
- Q2 The 0.03 noise threshold: where does it come from, and can 002 export it with provenance? Until then it is a
  named constant (section 8).
- Q3 Wording of the Benchmarks and Config-changes finding sentences (drafts in section 8).
- Q4 Definition text for the TTA footnote (a fact about the method; I will not write it without sign-off).
- Q5 Margin-note wording for "single runs" and for published figures' source.
- Q6 **Model progression in the MVP?** (spec open question). The plan supports either; default is off, controlled by
  `SHOW_PROGRESSION` plus data presence (section 6).
- Q7 Does the progression sit after Config changes (my default) or between Object size and Benchmarks?

**Spec and schema conflicts found**

- S1 **Provenance gap, `config_changes`.** Art. I.2 and the spec require run names; rows carry only `source` (file,
  mtime, locator). Suggest adding `runs: string[]` per row.
- S2 **No unit or threshold for deltas.** `delta_box_ap` / `delta_mask_ap` have no `unit`, and the 0.03 noise rule is not
  in the schema. Suggest `delta_unit` (or state "fraction") and a top-level `config_changes_rule` object.
- S3 **`best_published.unit` is optional** but needed for FR-007 and the winner comparison; suggest making it required.
  Also `best_published` has no `split`, `n` or source file, only `citation`; the "single runs" note relies on `ours.n`.
- S4 **Published values cannot meet Art. I.2 fully.** There is no run or file for a published number; the plan shows the
  citation and the SOTA file of `ours`. Confirm that is acceptable.
- S5 **`per_seed` has no seed labels** (which seed file each value came from); US1.3 asks for per-seed values.
- S6 **`object_size` is optional** in the schema but the plot's bin labels come from it; suggest listing it in
  `required`, or the page uses a constant string (a typed text).
- S7 **FR-002 vs "Out of scope".** FR-002 lists "Per class, DAPFT when data exists", the out-of-scope list defers per-class
  AP, and the schema has no per-class AP. This plan builds neither section; DAPFT appears as a dropped config row.
- S8 **002 FR-002 lists a `dataset` table that the schema lacks** (`additionalProperties: false` at the top level would
  reject it). Not used by 006, but the contract and spec disagree.
- S9 **Badge set (DS 9.4)** allows "No detectable difference" but not "Dropped", "Improved", "Worse" or "Pending
  export". This plan uses plain text for those; confirm that matches the intent.
- S10 **Spec scenario text hard-codes "mean of 3 seeds" and "0.645 / 0.638".** The plan derives them from the data
  (n and values), so a different n changes the label. Confirm that is wanted.
- S11 `tta.*` in the schema omits `additionalProperties: false`, so extra TTA keys would pass validation. Minor.

## Reconciliation with 001 (orchestrator, 2026-10-29)

Written after 001's plan was available. These override earlier sections of this plan where they differ.

- **Paths** follow 001: `frontend/app/(reading)/results/`, `frontend/components/results/`, `frontend/lib/…`,
  `frontend/tests/unit/` and `frontend/tests/e2e/results/`. No `src/` folder (paths above are already updated).
- **Placeholder:** use 001's `Pending` component for "Pending export". Do not create `components/results/Placeholder.tsx`.
- **Unit runner** is Vitest (001 §2). **Table** gives `group` headers and `muted` cells (TTA); **Tabs** is Radix and
  keeps inactive panels in the DOM only with `forceMount`. Pass `forceMount` where this plan needs that.
- **Build chain (R1):** 001 reads `NEXT_DIST_DIR` in `next.config.ts`, `check-static.mjs` and Playwright. 006 changes
  `check:frontend` to run `build:e2e` instead of `next build`, then `check-static` and Playwright against
  `.next-e2e`. A production `pnpm build` (real data) plus `check-no-fixture.mjs` is required before any deploy, and
  joins `pnpm check` once 002 delivers `data/site_data.json`.
- **Token grep:** 001's `check-tokens.mjs` fails on decimals like `0.50` inside `app/` and `components/`. `AXIS_MIN`
  and `NOISE_THRESHOLD` live in `lib/results/config.ts`, which is outside the scanned folders. Keep it that way.

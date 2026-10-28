# 007 — About: tasks

**Feature:** 007 About · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) (approved by Rolf 2026-10-29; its
final "Reconciliation with 001" section overrides earlier sections) · **Status:** Draft for review

## Inputs

- `specs/007-about/spec.md`, `specs/007-about/plan.md` (including §10 and the Reconciliation section)
- `specs/001-foundation/plan.md` §4 (tree), §6 (tests), §7 (shared components), §10 (reconciliation)
- `WEBSITE_HANDOFF_SEABED_LENS.md` §1 (title, BibTeX, credits) and §2 (the deployed model B0)
- `docs/design-system.md` §10.4 (About page) and §14 (copy). DS section numbers are cited as "DS §n".
- `.specify/memory/constitution.md`. Articles are cited as "C-Art. n".

## Prerequisites

- Feature 001 is implemented and `pnpm check` is green on the working tree (T001 verifies this and stops if not).
- `pnpm install` has been run and `pnpm setup:browsers` (Chromium) has been run once on this machine.
- No new dependency is added by 007 (plan §2). Do not install anything. If a task seems to need a package, stop and ask.

## How to work these tasks

- Do tasks in order. Phase 2 tests are written first and must **fail** (red) for the right reason before Phases 3 to 6
  make them pass. A task marked `[P]` has no file overlap and no ordering dependency inside its phase and may run in
  parallel with the other `[P]` tasks of that phase.
- Tick a task (`- [x]`) only when its check passes. Never tick a task while a test it owns fails.
- Edit only the files a task names. If a file owned by 001 needs a change that is not listed here, stop and ask Rolf
  (plan §3.1, R8).
- Rules that apply to every task (from the plan's Reconciliation section):
  - Use 001's Tailwind token utilities only (`bg-background`, `bg-subtle`, `text-foreground`, `text-muted-foreground`,
    `text-ocean`, `rounded-control`, type utilities `text-h1` to `text-code`). No hex or `rgb(`, no `rounded-[…]`, no
    `duration-[…]`, no `\d+ms` literal in `app/` or `components/` (001's `scripts/check-tokens.mjs` fails on these).
    In the SVG use `currentColor` or token variables, never hex.
  - Credits and `GITHUB_URL` come from `frontend/lib/site.ts`. `thesis.ts` imports them and keeps no copy.
  - The pending abstract uses 001's `Pending` component. Do not add a local `Placeholder`.
  - Accessibility checks use `AxeBuilder` from `@axe-core/playwright` directly (tags `wcag2a, wcag2aa, wcag21a,
    wcag21aa, wcag22aa`; fail on `serious` or `critical`). The 320 px viewport is set inside `about.spec.ts`, not as a
    new Playwright project.
  - No number from the thesis results appears on the page (C-Art. I). No image appears on the page (plan §6.8).
  - Never run a git write command. The hand-over at the end is produced by the orchestrator, not by this file.
- Paths are relative to the repo root. `frontend/…` paths are inside the pnpm workspace package.

---

## Phase 0 — Prerequisites check

- [ ] T001 Run `pnpm check` at the repo root on the current working tree and record the result in the task notes. If it is not green, stop: 007 starts only on top of a green 001. — files: none changed — satisfies: plan Prerequisites; C-Art. VI.1
- [ ] T002 Verify that 001's pieces 007 depends on exist with the names the plan uses, and list any difference. Check: `frontend/lib/site.ts` exports `credits` (parts `jodd`, `joddPaper`, `joddSeg`, `backbones`), the JODD licence line and `GITHUB_URL`; `frontend/components/research/pending.tsx` (`Pending`); `frontend/components/ui/button.tsx` supports `variant="text"`, `arrow`, `size="sm"` and `asChild`; `frontend/app/globals.css` has the `text-h1`, `text-h3`, `text-h4`, `text-body`, `text-caption`, `text-code` utilities, `bg-subtle`, `rounded-control`; `frontend/app/(reading)/about/page.tsx` exists as the placeholder; `ReadingLayout` accepts `width="prose"`; the Nav "Thesis" link has `href="/about"`. Report any gap to Rolf; do not create a stand-in. — files: read only — satisfies: plan §3.1; Reconciliation (credits, `Pending`, tokens)
- [ ] T003 Confirm the Handoff §1 ```` ```bibtex ```` fence exists exactly once as the first such fence in `WEBSITE_HANDOFF_SEABED_LENS.md` and note its line range, so the helper in T004 can extract it. If the fence is missing or reformatted, stop and ask Rolf. — files: read only — satisfies: SC-001; plan R7

## Phase 1 — Content module (thesis.ts, BibTeX builder)

- [ ] T004 [P] Write `helpers/handoff.ts`: read `WEBSITE_HANDOFF_SEABED_LENS.md` (path resolved from the repo root, not hard-coded absolute), return the first ```` ```bibtex ```` fence body and the BibTeX `title` field. It throws a clear error if the fence is missing. — files: `frontend/tests/e2e/helpers/handoff.ts` — satisfies: SC-001; plan §3 decision 3
- [ ] T005 Write the content module with the typed states: `Pending`, `Withheld`, `Public<T>` (rename the local type names so they do not clash with the `Pending` React component), `thesis` (title "SeaBed-Net", subtitle, author given and family, programme, institution, place, year 2026, adviser, `bibtexKey`, `bibtexType` as in Handoff §1), `links.paper|code|dataset` and `abstract`. Ship `abstract` and `links.paper` and `links.dataset` as `{ status: "pending" }`. Derive `links.code` from `GITHUB_URL` imported from `frontend/lib/site.ts` (`public` with that `href` when non-null, else `pending`). Export `fullTitle` = `${title}: ${subtitle}`. Copy every fixed fact from Handoff §1 and spec US1-1; add none. Do not paste the manuscript abstract. — files: `frontend/content/thesis.ts` — satisfies: FR-002; US1-1; edge case (abstract pending); edge case (PDF not public); C-Art. I.8
- [ ] T006 Add `buildBibtex(t = thesis)` to `thesis.ts`. It must reproduce the Handoff §1 block byte for byte (field alignment, one-line title, `\n` line ends, no trailing newline), from the `thesis` fields. Then write a Node-side check in `about.spec.ts` (placeholder `describe` created in T008, or a temporary scratch run in the scratchpad) comparing `buildBibtex()` with the fence from T004 and make it pass. — files: `frontend/content/thesis.ts` — satisfies: SC-001; FR-004
- [ ] T007 Re-export the credit parts needed by the page from `thesis.ts` as `credits` by importing from `frontend/lib/site.ts` (no new strings). If a part the Acknowledgements need (DOI URL, licence name and URL, data-paper reference) is missing from `site.ts`, stop and ask Rolf rather than adding a second copy. — files: `frontend/content/thesis.ts` — satisfies: FR-005; Reconciliation (credits single source)

## Phase 2 — Tests for the scenarios (written first, must fail)

Same file for all of these; they run one after another. Run `pnpm --filter frontend exec playwright test about.spec.ts`
after each task and record that it fails against the 001 placeholder page for the expected reason.

- [ ] T008 Create `about.spec.ts` scaffold: base URL, a small local `expectNoSeriousViolations(page)` using `AxeBuilder` directly with the five WCAG tags, imports of `thesis`, `buildBibtex`, `fullTitle` and the T004 helper, and a first test that `buildBibtex()` equals the Handoff fence and `fullTitle` equals the fence `title` field. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: SC-001; plan §7.1
- [ ] T009 Add test "header facts": `h1` is "SeaBed-Net" with a serif computed font-family (Source Serif 4); subtitle text; author "Rolf Genree L. Garces"; line "BS Computer Science · University of the Philippines Tacloban · 2026"; "Adviser: John Paul T. Yusiong, PhD"; exactly one `h1` on the page. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: US1-1; FR-002
- [ ] T010 Add test "links row": for each of paper, code, dataset, if `thesis.links.x.status === "public"` then an `<a>` with the exact text "Paper (PDF)" / "Code" / "Dataset" and the exact `href` exists, otherwise no link with that text exists (not dead, not disabled). Add: the Code link, when present, has the same `href` as `GITHUB_URL`. No network click-through. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: US1-2; edge case (PDF not public); Reconciliation (GITHUB_URL)
- [ ] T011 Add test "abstract states": branch on `thesis.abstract.status`. Pending: exactly one `[data-placeholder="abstract"]` is visible with the text "Abstract pending. The final text, describing the deployed model, has not been added yet." and the page has no other abstract prose. Public: no placeholder and the paragraphs are present. In both cases the page text contains none of `HSV`, `CIELAB`, `DAPFT`. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: edge case (abstract pending); C-Art. I.8; C-Art. IV
- [ ] T012 Add test "how it works": the section has the heading "How it works", one paragraph before the figure that includes the decoupled-heads sentence (the number of boxes and masks for one image can differ), and a link "Read the results →" with `href="/results"`. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: US2-1; C-Art. IV.5; C-Art. I
- [ ] T013 Add tests "figure": a `<figure>` with a `<figcaption>` starting "Figure 1. The deployed model (B0)."; an `ol` text alternative with 6 `li` in order naming RGB, RedComp, Shades-of-Gray, ConvNeXt-T, DINOv2 ViT-L/14, convex, FPN, TOOD, SOLOv2; the labels "CNN branch" and "ViT branch" are in the SVG and the strings "texture and edges" and "scene context" are not on the page; the `svg` is `aria-hidden="true"`; the SVG has no `fill` other than `none`/`currentColor`/token variables; the scroll container has `tabindex="0"`, `role="group"` and an `aria-label` containing "Figure 1". — files: `frontend/tests/e2e/about.spec.ts` — satisfies: FR-003; US2-1; plan §6.4 (R2, S6)
- [ ] T014 Add test "copy (clipboard)": grant `clipboard-read` and `clipboard-write`; click "Copy BibTeX"; clipboard text equals the Handoff fence; button text is "Copied"; `role="status"` region says "BibTeX copied to the clipboard."; with `page.clock` advance 1700 ms and expect "Copied", advance to 1900 ms and expect "Copy BibTeX" and an empty status region; a second click inside the window restarts the timer; DOM `<code>` text equals the fence. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: US3-1; SC-001; FR-004
- [ ] T015 Add tests "copy (manual fallback)": (a) `addInitScript` sets `navigator.clipboard` to `undefined`; (b) `writeText` rejects. In both, click the button; label contains "Ctrl" and "⌘"; `window.getSelection().toString()` equals the fence; the status region has "BibTeX selected. Press Control or Command plus C to copy."; focus stays on the button; the hint resets on the next click and after 8 s (`page.clock`). — files: `frontend/tests/e2e/about.spec.ts` — satisfies: US3-1; plan §6.5 (R3)
- [ ] T016 Add test "credits": Acknowledgements text contains the exact JODD citation "Takaki Nishio, Yuki Kawae (2025). J-EDI Organism Detection Dataset (JODD). JAMSTEC."; a link with `href="https://doi.org/10.17596/0004035"`; a link with text "CC BY-NC-SA 4.0"; the data-paper reference "Data in Brief" 65, 112462, 2026 with a link to `https://doi.org/10.1016/j.dib.2026.112462`; the JODD-Seg statement mentions SAM 3, three reviewers and the same licence; ConvNeXt-T and DINOv2 are named. Assert the strings equal what `frontend/lib/site.ts` exports (no second copy). — files: `frontend/tests/e2e/about.spec.ts` — satisfies: FR-005; C-Art. VIII.3; Reconciliation (credits)
- [ ] T017 Add test "json-ld": parse the single `script[type="application/ld+json"]`; `@type` is `ScholarlyArticle`; `headline` equals `fullTitle`; author name; no `abstract` while `thesis.abstract.status` is pending; no `url` key; the raw script text contains no unescaped `<`. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: FR-006; plan §6.6
- [ ] T018 Add tests "shape": the `article` box is at most 720 px wide at 1280 px; no element inside `main` has a computed `box-shadow` other than `none`, and the only element with a background and rounded corners is the BibTeX `pre` (FR-001 "no cards"); the `pre` has `font-family` mono and background equal to the `--subtle` token read back from the page (FR-004); `img` count is 0; `main` text matches none of `/\b0\.\d{3,4}\b|\b\d+(\.\d+)?\s*(AP|AP50|%)\b/`; the document has one `h1` and four `h2` (Abstract, How it works, Citation, Acknowledgements). — files: `frontend/tests/e2e/about.spec.ts` — satisfies: FR-001; FR-004; C-Art. I; plan §6.8
- [ ] T019 Add test "nav": the nav link "Thesis" has `href="/about"` and on `/about` the current-page link has `aria-current="page"`. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: spec Summary (nav "Thesis" points here); plan §7.3

## Phase 3 — Page sections

All in one file; sequential. After each task run the matching tests from Phase 2.

- [ ] T020 Replace the 001 placeholder with the page shell: server component, `export const metadata` (title "About", description built from `thesis` author, institution and year, never the abstract), a `<article>` with `max-w-[720px]` mx-auto inside `ReadingLayout`, section gap 48 to 64 px using spacing utilities, no cards, no dynamic APIs. Render the header: `h1` (serif, `text-h1`), subtitle (`text-h3`, `text-muted-foreground`), the three byline lines from `thesis`. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: FR-001; FR-002; US1-1; FR-006 (static)
- [ ] T021 Add the links row: a plain `<ul>` of 001 `Button variant="text" arrow asChild` links, rendered only for entries with `status === "public"`; render nothing if none are public; same-tab links. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: US1-2; edge case (PDF not public); S2
- [ ] T022 Add the Abstract section (`section` with `aria-labelledby`, `h2` styled `text-h4`). Public: paragraphs in body type. Pending: `<p data-placeholder="abstract">` containing 001's `Pending` with the plan text "Abstract pending. The final text, describing the deployed model, has not been added yet." If `Pending` cannot take the wrapper attribute, put `data-placeholder` on the `<p>`. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: edge case (abstract pending); C-Art. I.8
- [ ] T023 Add the "How it works" section: the wireframe paragraph from plan §6.3, the decoupled-heads sentence, then the "Read the results →" text link to `/results`; leave a clearly marked slot where the figure goes (filled in T033). Check wording against DS §14 (sentence case, no "AI-powered"). — files: `frontend/app/(reading)/about/page.tsx` — satisfies: US2-1; C-Art. IV.5; DS §14
- [ ] T024 Add the Acknowledgements section as one paragraph assembled from `credits` (JODD citation, DOI link, licence link "CC BY-NC-SA 4.0", data paper with DOI link, JODD-Seg statement, ConvNeXt-T, DINOv2), links styled as 001 text links. Add no URL the repo does not state. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: FR-005; C-Art. VIII.3
- [ ] T025 Run the Phase 2 tests for header, links, abstract, how-it-works (excluding the figure), credits, shape and nav; fix the page (not the tests) until they pass, except tests that depend on later phases. Record which remain red. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: US1-1; US1-2; US2-1; FR-001; FR-002; FR-005

## Phase 4 — Citation block with copy

- [ ] T026 Create `CitationBlock.tsx` (`"use client"`), props `{ bibtex: string }`. Server-rendered markup: `section aria-labelledby="citation"`, `h2#citation` "Citation", `<pre>` (`font-mono text-code bg-subtle text-foreground rounded-control p-4 whitespace-pre-wrap` with `[overflow-wrap:anywhere]`) holding `<code>{bibtex}</code>`, a `role="status"` `sr-only` span always in the DOM, and the "Copy BibTeX" button (`Button variant="text" size="sm"`) rendered `hidden` until mounted so it is absent without JavaScript. Show and copy the `bibtex` prop, never `textContent`. — files: `frontend/components/about/CitationBlock.tsx` — satisfies: FR-004; US3-1; C-Art. III.3
- [ ] T027 Add the copy behaviour (state `idle | copied | manual`): `navigator.clipboard?.writeText(bibtex)`; on success label "Copied", status "BibTeX copied to the clipboard.", reset after 1800 ms with the timer restarted by a second click and cleared on unmount. Define the 1800 and 8000 values as named numeric constants without a trailing `ms` in the identifier text so `check-tokens.mjs` does not flag them (read 001's regex first). — files: `frontend/components/about/CitationBlock.tsx` — satisfies: US3-1
- [ ] T028 Add the fallback path: when the API is missing or the promise rejects, `window.getSelection().selectAllChildren(codeEl)`, label "Press Ctrl/⌘+C to copy", status "BibTeX selected. Press Control or Command plus C to copy."; reset after 8 s, on the next click, or on `selectionchange` clearing the selection. Focus never leaves the button. Do not add `document.execCommand("copy")` unless Rolf answers Q5 with yes. — files: `frontend/components/about/CitationBlock.tsx` — satisfies: US3-1; plan §6.5 (R3, Q5)
- [ ] T029 Mount `<CitationBlock bibtex={buildBibtex()} />` in the page as the Citation section (between "How it works" and Acknowledgements). Run the T014, T015, T018 (pre, h2 count) tests until green. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: US3-1; FR-004; SC-001

## Phase 5 — Architecture figure

- [ ] T030 [P] Create `ArchitectureFigure.tsx` text parts first: `<figure>` with `<figcaption>` "Figure 1. The deployed model (B0)." plus a short note that the figure is redrawn from the model definition (no claim that it is a manuscript figure), `aria-labelledby` on the figure pointing at the caption, and the `sr-only` ordered list `aria-label="Figure 1 as text"` with six `li` in the plan §6.4 wording (input 640 by 480 RGB; colour stems on RGB, RedComp, Shades-of-Gray merged at stride 4; two parallel branches ConvNeXt-T and DINOv2 ViT-L/14 with no exchange; convex gated late fusion once per pyramid level; FPN; two decoupled heads: TOOD detection and SOLOv2 instance masks without boxes). Each phrase must come from Handoff §2. — files: `frontend/components/about/ArchitectureFigure.tsx` — satisfies: FR-003; US2-1; C-Art. IV.5
- [ ] T031 Draw the inline SVG in the same file: `viewBox` 720 wide, hairline 1 px boxes with `fill="none"`, strokes and arrows in `currentColor` from a `text-muted-foreground` wrapper (check DS §6.4 contrast in T044), small open arrowheads via `<marker>`, labels 13 px and sub-labels 12 px, blocks: Input, Colour stems, CNN branch, ViT branch, Fusion ("convex gated, per pyramid level"), FPN, Detection head, Mask head. `aria-hidden="true"`. No sub-labels "texture and edges" / "scene context". Optional `href` prop per block is accepted but unused in v1. — files: `frontend/components/about/ArchitectureFigure.tsx` — satisfies: FR-003; plan §6.4 (S1, S6); DS §2 (no filled blocks)
- [ ] T032 Wrap the SVG in a scroll container: `overflow-x-auto`, `tabindex="0"`, `role="group"`, `aria-label="Figure 1, scrolls sideways"`, SVG `min-width` 720 px so the scale is never below 1; no horizontal page scroll at 320 px. — files: `frontend/components/about/ArchitectureFigure.tsx` — satisfies: FR-003; C-Art. III.1; plan §6.4
- [ ] T033 Place `<ArchitectureFigure />` in the "How it works" slot from T023 and run the T013 tests until green. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: FR-003; US2-1

## Phase 6 — JSON-LD

- [ ] T034 Create the builder: pure function returning `{"@context":"https://schema.org","@type":"ScholarlyArticle", headline, name, author (Person), publisher/sourceOrganization (CollegeOrUniversity), datePublished "2026", inLanguage "en"}` from `thesis`; omit `url`, `abstract` while pending, adviser, any PDF link and any date finer than the year; serialise with `JSON.stringify` and replace `<` with `<`. Keep the type as `ScholarlyArticle` (spec) until Rolf answers Q3. — files: `frontend/lib/about-jsonld.ts` — satisfies: FR-006; S3; plan §6.6
- [ ] T035 Add `<script type="application/ld+json" dangerouslySetInnerHTML=…>` to the page using the builder, then run T017 until green. — files: `frontend/app/(reading)/about/page.tsx` — satisfies: FR-006
- [ ] T036 Verify the page is statically generated: run `pnpm --filter frontend build` and confirm `/about` is listed as static and 001's `check-static.mjs` finds `about.html`. Fix any dynamic API usage in `page.tsx`. — files: none changed unless a fix is needed (`frontend/app/(reading)/about/page.tsx`) — satisfies: FR-006; C-Art. VII.3

## Phase 7 — Release gate

- [ ] T037 Write the opt-in release gate: `describe.skip` unless `process.env.RELEASE === "1"`; asserts (1) `[data-placeholder]` count is 0, (2) `thesis.abstract.status === "public"` with at least one non-empty paragraph, (3) each of `paper`, `code`, `dataset` is `public` with an `https://` `href` or explicitly `withheld`, none `pending`. — files: `frontend/tests/e2e/about.release.spec.ts` — satisfies: C-Art. I.8; plan §6.7; edge cases (abstract pending, PDF not public)
- [ ] T038 Add the script `"test:release": "RELEASE=1 playwright test about.release"` to the frontend `package.json`. Do not add it to `check` or `check:frontend`. Make sure `pnpm check` still skips the release spec (no failure). — files: `frontend/package.json` — satisfies: plan §6.7; 001 FR-010
- [ ] T039 Run `pnpm test:release` once and record that it **fails today** for the expected reasons (pending abstract and links). That failure is correct and is reported to Rolf as a to-do, not fixed. — files: none changed — satisfies: plan §8 item 6; Q6

## Phase 8 — Accessibility, keyboard, 320 px, no-metrics checks

- [ ] T040 Add axe tests: `/about` at 1280 px and at 320 px, each in light and dark (`colorScheme` emulation), 0 serious or critical; plus once with the copy button in the `manual` state. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: SC-002; C-Art. III.2
- [ ] T041 Add the 320 px test: `document.documentElement.scrollWidth <= window.innerWidth`; the BibTeX block wraps without horizontal scroll; the figure scrolls inside its own container (container `scrollWidth` greater than `clientWidth`, page does not). — files: `frontend/tests/e2e/about.spec.ts` — satisfies: edge case (320 px, 001 SC-005); R4
- [ ] T042 Add the keyboard test: Tab from the top reaches, in order, the 001 skip link and nav, the public links in the links row, the figure scroll container, "Copy BibTeX", the Acknowledgement links, the footer. On the button, Enter and Space each copy and focus does not move; computed `outline-width` is 2 px with `outline-offset` 2 px; the button box is at least 32 px high with a fine pointer and at least 44 px under `hasTouch` emulation. — files: `frontend/tests/e2e/about.spec.ts` — satisfies: C-Art. III.1; US3-1; plan §8 item 5
- [ ] T043 Add the remaining shape tests: with `reducedMotion: "reduce"`, `document.getAnimations().length === 0`; with `javaScriptEnabled: false` the BibTeX is visible, there is no "Copy BibTeX" button and all four `h2` sections exist; every request origin is the site's own (no third-party requests). — files: `frontend/tests/e2e/about.spec.ts` — satisfies: C-Art. III.1; C-Art. III.3; plan §7.3
- [ ] T044 Measure non-text contrast for the figure strokes and arrowheads against the page background in light and dark (3:1, DS §6.4) with the token values read from the page. If `text-muted-foreground` fails in either theme, report the numbers to Rolf and propose a token; do not use a hex value. Record the measured ratios in the task notes. — files: `frontend/components/about/ArchitectureFigure.tsx` (only if the stroke class must change) — satisfies: C-Art. III.1; DS §6.4; plan R5
- [ ] T045 Run the 001 static checks and the page budget: `node frontend/scripts/check-tokens.mjs` (no colour literals, no `rounded-[`, no `\d+ms`, no metric decimals in the new files) and 001's `budget.spec.ts` (the JS budget with `/about` still under 150 KB gzip). Fix 007 files only. — files: none changed unless a fix is needed — satisfies: C-Art. I; C-Art. II.1; 001 SC-002; 001 SC-003

## Phase 9 — Verification and hand-over

- [ ] T046 Run the full `pnpm check` from the repo root and confirm green, including `about.spec.ts` in Chromium. Do not mark 007 done while any test fails. — files: none changed — satisfies: all tests; C-Art. VI.5
- [ ] T047 Prepare the manual-pass checklist for Rolf (no file edit by the agent): keyboard-only walk-through with focus visible at 200% zoom; VoiceOver in Safari (heading list shows one h1 and four h2, the figure reads with its caption and step list, "Copy BibTeX" announces its status); phone width with the manual-copy path on iOS Safari over the real network address (plain http); page with the stylesheet removed keeps its order (DS §2 test 6). — files: none changed — satisfies: C-Art. III.2; plan §8 manual list
- [ ] T048 Report to the orchestrator the final list of files for the hand-over: `frontend/content/thesis.ts`, `frontend/lib/about-jsonld.ts`, `frontend/components/about/ArchitectureFigure.tsx`, `frontend/components/about/CitationBlock.tsx`, `frontend/app/(reading)/about/page.tsx` (changed), `frontend/tests/e2e/about.spec.ts`, `frontend/tests/e2e/about.release.spec.ts`, `frontend/tests/e2e/helpers/handoff.ts`, `frontend/package.json` (changed), `specs/007-about/tasks.md` (ticked). Note that `pnpm test:release` is red by design until Rolf fills the content. Produce no git block (the orchestrator does). — files: none changed — satisfies: CLAUDE.md §1; C-Art. V

---

## Blocked on Rolf (plan Q1 to Q7)

Nothing above waits on these; the plan defaults are built. Each answer causes one small change.

| Q | Default built | If Rolf answers | One-line change |
|---|---|---|---|
| Q1 abstract text | `abstract: { status: "pending" }`, visible placeholder | Gives final B0 text | In `thesis.ts` set `abstract` to `{ status: "public", paragraphs: [...] }`; placeholder disappears, JSON-LD gains `abstract` (add one line in the builder) |
| Q2 Paper, Code, Dataset URLs | all three pending, links omitted; Code follows `GITHUB_URL` | Gives URLs, or says one is not public | Set `GITHUB_URL` in `lib/site.ts`; set `links.paper` / `links.dataset` to `public` with `href`, or `withheld` in `thesis.ts` |
| Q3 JSON-LD type | `ScholarlyArticle` | Chooses `Thesis` | Change the `@type` string in `lib/about-jsonld.ts` and the expected value in the T017 test |
| Q4 figure sub-labels | "CNN branch" / "ViT branch", no role sub-labels | Supplies thesis wording | Add the sub-label text in `ArchitectureFigure.tsx` and update the T013 expectation |
| Q5 `execCommand("copy")` second try | Not added; straight to manual hint | Says yes | Add one `document.execCommand("copy")` attempt before the manual state in `CitationBlock.tsx` and one test in T015 |
| Q6 who wires `test:release` | Rolf runs `pnpm test:release` by hand before the defence | Names a deployment step | Add the script call to that step (outside 007) |
| Q7 stacked mobile figure | Single 720 px SVG scrolling in its container | Wants a stacked layout | New task: second SVG below 640 px in `ArchitectureFigure.tsx` plus a 320 px test |

Also awaiting Rolf: a glance at the CC BY-NC-SA 4.0 licence URL taken from `lib/site.ts` (plan, invented-fact risks), and
any naming difference that T002 finds between 001 and the plan.

---

## Coverage table

| Item | Tasks |
|---|---|
| FR-001 single column, max 720 px, no cards | T018, T020, T025 |
| FR-002 exact title, author, course, institution, year | T005, T009, T020, T025 |
| FR-003 accessible inline SVG, text alternative, caption, ablation links when 008 exists | T013, T030, T031, T032, T033, T044 (links deferred to 008, see gap G1) |
| FR-004 BibTeX mono on `--subtle`, copy button | T006, T014, T018, T026, T027, T029 |
| FR-005 acknowledgements and credits | T007, T016, T024, T025 |
| FR-006 static + ScholarlyArticle JSON-LD | T017, T020, T034, T035, T036 |
| US1-1 header | T005, T009, T020, T025 |
| US1-2 links row | T010, T021, T025 |
| US2-1 how it works and diagram | T012, T013, T023, T030, T033 |
| US3-1 copy, "Copied" ~1.8 s, manual fallback | T014, T015, T026, T027, T028, T029, T042 |
| Edge: abstract not yet updated | T011, T022, T037, T039 |
| Edge: PDF not public (link omitted) | T010, T021, T037 |
| SC-001 title and BibTeX match Handoff §1 | T003, T004, T006, T008, T014, T029 |
| SC-002 axe 0 serious/critical | T040 (also T041, T043) |
| Nav "Thesis" link (Summary) | T002, T019 |
| C-Art. I (no numbers, placeholders) | T011, T018, T022, T045 |
| C-Art. III (a11y, no third party) | T040 to T044, T047 |
| C-Art. VIII.3 (JODD credit/licence, no image) | T016, T018, T024 |

**Gaps**

- **G1.** FR-003's "each block links to the ablation that tests it when 008 exists" has no task. By plan decision (S1) v1
  ships no links; T031 only keeps an optional `href` prop. Needs Rolf's confirmation (plan S1) and a task in 008.
- **G2.** The spec's US1-2 says the links "open their targets"; tasks verify the `href` only, not a network click-through
  (plan §7.2). No test can follow an external URL offline.
- **G3.** Manual-only items (VoiceOver, iOS Safari fallback, 200% zoom) are listed in T047 and cannot be ticked by an
  agent; Rolf ticks them.
- **G4.** Plan §10 R6/S5 (shared credit data and `GITHUB_URL`) is resolved by the Reconciliation section; T002 and T007
  stop and ask if `lib/site.ts` lacks a needed part, which would require a 001-owned file change.

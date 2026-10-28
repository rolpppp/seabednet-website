# 001 — Foundation and design system: tasks

**Feature:** 001-foundation · **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) (approved 2026-10-29; §10
"Reconciliation" is binding) · **Written:** 2026-10-29

## Inputs

- `.specify/memory/constitution.md` (overrides everything), `docs/design-system.md` (cited as "DS §n"), spec, plan.
- Decisions already made: plan approved as written; the `CLAUDE.md` §4 edit is approved (that section only); the plan's
  defaults for its open risks stand: prefixed `--ds-*` tokens with no DS edit (R1), footer shows both JODD citations
  (R3), no typeface line in the footer (R4), `GitHub (link pending)` placeholder (R2), Lighthouse is a manual run (R8).
- Later features rely on 001 delivering: `NEXT_DIST_DIR` support (`next.config.ts`, `check-static.mjs`, Playwright
  `prod` webServer), `lib/site.ts` with `credits.jodd`, `credits.joddPaper`, `credits.joddSeg`, `credits.backbones`, the
  JODD licence line and `GITHUB_URL`, the `Pending` component (text from `children`), `Table` with `group` headers and
  `muted` cells, and `Tabs` (Radix, `forceMount` passes through).

## Conventions

- Format: `- [ ] Tnnn [P] <imperative description> — files: <paths> — satisfies: <ids>`.
- `[P]` means the task touches no file that another unfinished task in its phase touches and has no ordering
  dependency inside the phase. Tasks without `[P]` run in the listed order.
- Paths are relative to the repo root. `frontend/` is the Next app, `backend/` is the FastAPI app.
- Test-first: a task named "Write failing test" comes before the task that makes it pass. Run the test, see it fail for
  the right reason, then implement.
- Tags in the description: **(network)** needs internet (installs, downloads, version lookups). **(Rolf)** needs Rolf in
  person. **(conditional)** only runs if the preceding check fails.
- Never type a colour, radius, duration or metric outside `frontend/app/globals.css` (Constitution Art. I, II). Read
  values from `docs/design-system.md`; do not invent them.
- No git write commands (CLAUDE.md §1). Leave all changes in the working tree.
- If a task shows the spec or plan is wrong, stop and tell the orchestrator. Do not change the spec or plan.

## How to tick

Change `- [ ]` to `- [x]` only when the task's own check passes (the named test is green, or the stated command exits
0). Write a short note after the task line if the result matters later (for example the pnpm setting name found in
T002). Never tick a task whose test is red.

## Phase 1 — Workspace and tooling

- [x] T001 Confirm the local toolchain: `node -v` (≥ 24), `pnpm -v` (12.14.0), `uv --version`, and that `uv` can fetch
  Python 3.12. Note the results below this line. **(network for the Python fetch)** — files: none — satisfies: FR-001
  (prerequisite), plan §2
  Result (2026-10-29): node v26.5.0 (>= 24), pnpm 12.14.0, uv 0.10.4; `uv python find 3.12` resolves to a uv-managed
  CPython 3.12.12 already on disk (no fetch needed; `uv sync` in T009 used it).
- [x] T002 Open check: find the exact pnpm 12 setting name for approving dependency build scripts (the plan expects
  approvals for `@tailwindcss/oxide`, `sharp`, `unrs-resolver`). Read `pnpm help` / pnpm docs and note the setting name
  and file below this line. **(network)** — files: none — satisfies: plan R6
  Result (2026-10-29): the setting is `allowBuilds`, a map of package name to `true` in `pnpm-workspace.yaml`
  (`pnpm help install` documents `--allow-build` as appending to `allowBuilds`; `pnpm approve-builds` writes it).
  Only `unrs-resolver` actually ran an install script here; `@tailwindcss/oxide` and `sharp` are approved as the plan
  expects but needed no script on this platform.
- [x] T003 [P] `.gitignore` **already exists and is committed**: do not recreate or reorder it. Append only the missing
  line `frontend/.next-e2e/` under "Node / Next.js" (006's fixture build output; the other rules are already there).
  Create `.npmrc` (`save-exact=true`) — files: `.gitignore` (one-line append), `.npmrc` — satisfies: FR-011 (real
  `.env` git-ignored), plan §2, plan §10 (NEXT_DIST_DIR)
- [x] T004 Create the root `package.json` (private, `packageManager: pnpm@12.14.0`, `engines.node >=24`, scripts
  `check`, `check:frontend`, `check:backend`, `setup`, `setup:browsers`, `setup:browsers:ci`) and
  `pnpm-workspace.yaml` (`packages: [frontend]` plus the build-script approval from T002). `check` is
  `pnpm check:frontend && pnpm check:backend`; the sub-scripts are filled in T016 and T068 —
  files: `package.json`, `pnpm-workspace.yaml` — satisfies: FR-010, FR-001, plan R6
- [x] T005 Create the frontend manifest and config with the exact versions from plan §2: `frontend/package.json`
  (scripts `dev`, `build`, `start`, `typecheck`), `tsconfig.json` (strict, `noUncheckedIndexedAccess`, `@/*` alias),
  `postcss.config.mjs` (only `@tailwindcss/postcss`), `next.config.ts` (loads `../.env` via `@next/env`; `distDir` from
  `NEXT_DIST_DIR`, default `.next`; maps `API_BASE_URL` and `SAMPLES_ENABLED` for client use; `pageExtensions` adds
  `dev.tsx` when `NODE_ENV !== "production"`) — files: `frontend/package.json`, `frontend/tsconfig.json`,
  `frontend/postcss.config.mjs`, `frontend/next.config.ts` — satisfies: FR-001, FR-011, FR-012, US4-1, plan §10
  (NEXT_DIST_DIR)
- [x] T006 Run `pnpm install` at the root; apply the approvals from T002 so build scripts run; confirm
  `pnpm-lock.yaml` is created and a second `pnpm install --frozen-lockfile` is clean. **(network)** — files:
  `pnpm-lock.yaml`, `pnpm-workspace.yaml` — satisfies: FR-001, FR-010
- [x] T007 [P] Create the backend project: `backend/pyproject.toml` (python `>=3.12,<3.14`; fastapi 0.162.0, uvicorn
  0.54.0; dev group pytest 9.2.0, httpx 0.28.1, ruff 0.17.3; `[tool.ruff]`, `[tool.pytest]`), `backend/.python-version`
  (3.12), empty `backend/app/__init__.py` — files: `backend/pyproject.toml`, `backend/.python-version`,
  `backend/app/__init__.py` — satisfies: FR-001
- [x] T008 Write failing test `backend/tests/test_health.py`: `GET /health` returns 200 and `{"status": "ok"}`; the
  OpenAPI route list contains only `/health` (plus FastAPI's own docs routes if enabled; assert no application route
  besides `/health`) — files: `backend/tests/test_health.py` — satisfies: FR-001, plan §6.6
- [x] T009 Implement `backend/app/main.py` (`FastAPI()`, `GET /health` only). Run `uv sync --directory backend`
  **(network)**, then `uv run --directory backend pytest` and `ruff check .` and `ruff format --check .` all pass —
  files: `backend/app/main.py`, `backend/uv.lock` — satisfies: FR-001
- [x] T010 Add ESLint, Vitest and a trivial passing unit test: `frontend/eslint.config.mjs`
  (`eslint-config-next/core-web-vitals` + typescript), `frontend/vitest.config.ts` (jsdom, plugin-react, include
  `tests/unit`), `frontend/tests/unit/sanity.test.ts` (`expect(1).toBe(1)`; deleted in T068). `pnpm --filter frontend
  exec vitest run` and `eslint .` pass — files: `frontend/eslint.config.mjs`, `frontend/vitest.config.ts`,
  `frontend/tests/unit/sanity.test.ts` — satisfies: US3-1, FR-010
- [x] T011 Add Playwright: `frontend/playwright.config.ts` with project `prod` (webServer `next start` on :3000, build
  folder from `NEXT_DIST_DIR`, `reuseExistingServer` off in CI) and project `dev` (`next dev --port 3100`, matches only
  `design.spec.ts`); `frontend/tests/e2e/routes.ts` exporting `["/", "/try", "/results", "/about", "/explore", "/lab",
  "/this-does-not-exist"]`. Add root scripts `setup:browsers` (`playwright install chromium`) and `setup:browsers:ci`
  (`--with-deps`); run `pnpm setup:browsers` **(network)** — files: `frontend/playwright.config.ts`,
  `frontend/tests/e2e/routes.ts`, `package.json` — satisfies: US3-1, plan §6.4, plan §10 (NEXT_DIST_DIR in Playwright)
- [x] T012 [P] Create `frontend/lib/cn.ts` (clsx + tailwind-merge) and `frontend/lib/env.ts` (typed reads of
  `SEABEDNET_REPO`, `API_BASE_URL`, `SAMPLES_ENABLED` as boolean default `false`, `UPLOAD_RETENTION_HOURS`; reads
  `process.env` only, never a file) — files: `frontend/lib/cn.ts`, `frontend/lib/env.ts` — satisfies: FR-011
- [x] T013 [P] Write failing test `frontend/tests/unit/env-example.test.ts`: `.env.example` at the repo root lists exactly
  the four names, `SAMPLES_ENABLED=false`, `UPLOAD_RETENTION_HOURS` blank with a comment, and the test never opens any
  other `.env*` file — files: `frontend/tests/unit/env-example.test.ts` — satisfies: FR-011, plan R5
- [x] T014 Create `.env.example` so T013 passes (comment above `SEABEDNET_REPO` that it is read-only thesis repo path
  and never hard-coded; comment that retention is undecided) — files: `.env.example` — satisfies: FR-011, plan R5
- [x] T015 Add the minimum app so `next build` succeeds: `frontend/app/layout.tsx` (bare `<html lang="en"><body>`; fonts
  come in T024) and `frontend/app/(reading)/page.tsx` (one `<h1>`; replaced in T039) — files:
  `frontend/app/layout.tsx`, `frontend/app/(reading)/page.tsx` — satisfies: FR-001, FR-012 (prerequisite)
- [x] T016 Wire the interim checks and prove the pipe works: `frontend/package.json` scripts `check:frontend`
  (`tsc --noEmit && eslint . && vitest run && next build && playwright test --pass-with-no-tests`) and root
  `check:backend` (`uv run --directory backend ruff check . && ... ruff format --check . && ... pytest`). Run `pnpm
  check`; it exits 0 — files: `frontend/package.json`, `package.json` — satisfies: US3-1, FR-010

## Phase 2 — Tokens, type scale and fonts

All of `globals.css` is one file, so T018 to T022 run in order. Values come from `docs/design-system.md` §5.1, §6, §7,
§12 and §15, transcribed exactly.

- [x] T017 Write failing test `frontend/tests/unit/tokens.test.ts`: every `--ds-*` appears once as a declaration; the
  shadcn semantic names listed in DS §15 exist; the `.ws` block and the `prefers-color-scheme: dark` block contain only
  `var()` references and no hex literals; the eleven type utilities exist (`text-display`, `text-h1`, `text-h2`,
  `text-h3`, `text-h4`, `text-body`, `text-body-long`, `text-small`, `text-caption`, `text-data`, `text-code`) —
  files: `frontend/tests/unit/tokens.test.ts` — satisfies: US2-1, FR-002, FR-004
- [x] T018 Create `frontend/app/globals.css` with `@import "tailwindcss";` and the raw palette in `:root` using the
  `--ds-` prefix (all names in plan §4.1 step 2: light, workspace, `--ds-well`, on-ocean pair, radii, shadows,
  easing, durations). Each value written once — files: `frontend/app/globals.css` — satisfies: FR-002, US2-1,
  plan R1
- [x] T019 In `globals.css` add the semantic layer with shadcn names from DS §15 as `var(--ds-…)` references (light in
  `:root`), the `.ws` remap, and the `@media (prefers-color-scheme: dark) { :root { … } }` remap; `color-scheme: light
  dark` on `:root`, `dark` on `.ws` — files: `frontend/app/globals.css` — satisfies: FR-002, US1-3, US2-1
- [x] T020 In `globals.css` add `@theme inline` mappings: semantic colours and DS-only roles (`text-ocean`,
  `bg-ocean-soft`, `bg-amber-soft`, `bg-well`, `text-success`, …), radii `rounded-tag/control/card/well`, 4 px spacing
  base, easing and duration tokens, font families `--font-sans/serif/mono`, and `--container-nav: 47.5rem` (gives
  `@nav:`) — files: `frontend/app/globals.css` — satisfies: FR-002, FR-004, US1-2 (760 px)
- [x] T021 In `globals.css` add the eleven `@utility` type classes per DS §5.1 with `--text-*` theme values and the
  < 640 px container-width reductions (`display` 36/44, `h1` 28/36); `text-data` uses tabular figures — files:
  `frontend/app/globals.css` — satisfies: FR-004
- [x] T022 In `globals.css` add the base layer: `body` Inter with `font-feature-settings: "cv11", "ss01"`; global
  `:focus-visible` (2 px `--ring` outline, 2 px offset, never `outline: none`); hover rules only under `(hover:hover)
  and (pointer:fine)`; `(pointer: coarse)` raises control heights to 44 px; `.ph` dashed-underline style; the
  `prefers-reduced-motion: reduce` block (transforms off, transitions and animations ≤ 120 ms, `scroll-behavior:
  auto`) — files: `frontend/app/globals.css` — satisfies: FR-008, FR-009, edge: reduced motion, Art. III
- [x] T023 Run `tokens.test.ts` (green) and `next build` (compiles the stylesheet). Fix any token that appears twice or
  any hex inside `.ws` or the dark block — files: `frontend/app/globals.css` — satisfies: US2-1, FR-002, FR-004
- [x] T024 Load the fonts in `frontend/app/layout.tsx`: `Inter`, `Source_Serif_4` (variable, `axes: ["opsz"]`),
  `JetBrains_Mono` (400, 500) from `next/font/google`, `display: "swap"`, `variable:` names, the three classes on
  `<html lang="en">`; add the skip link (`<a href="#main">`) and metadata. `@theme` font vars already point at them
  (T020). **(network: build downloads fonts)** — files: `frontend/app/layout.tsx` — satisfies: FR-003, US1-4, edge: font
  failure
- [x] T025 Open check: confirm the served Inter file keeps `cv11` and `ss01`. After `next build`, find the Inter woff2
  in `<distDir>/static/media/` and inspect its GSUB features (for example `uv run --with fonttools python -I -c ...`
  into a scratch folder; write nothing into the repo). Note the result below this line. **(network for the
  fonttools fetch)** — files: none — satisfies: FR-003, plan R11
  **Result (2026-10-29):** Inter as served by `next/font/google` (Google Fonts subsets) does NOT keep `cv11` or `ss01`.
  The latin Inter woff2 (`ba63f6a0…woff2`, 879 glyphs, axis `wght` only) has GSUB features `ccmp, locl, pnum, tnum`
  only; no other Inter subset has them either. T026 is therefore needed.
- [x] T026 **(conditional: only if T025 shows the features are missing)** Switch Inter to `next/font/local`: add the
  OFL files from rsms/inter and the licence text under `frontend/app/fonts/`, update `layout.tsx`, re-run T025's check.
  **(network)** — files: `frontend/app/fonts/` (new), `frontend/app/layout.tsx` — satisfies: FR-003, plan §4.2
  **Result (2026-10-29):** Done with the official rsms/inter release v4.1 (`Inter-4.1.zip`, `web/InterVariable.woff2`);
  its GSUB has `cv11` and `ss01` (axes `opsz` 14–32, `wght` 100–900). Copied files:
  `frontend/app/fonts/InterVariable.woff2` 352240 bytes, SHA-256
  `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`; `frontend/app/fonts/Inter-LICENSE.txt` 4380
  bytes, SHA-256 `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a`. No italic (DS and plan use none).
  After `next build` the Inter file in `.next/static/media/` is byte-identical (same SHA-256) and keeps both features.
  Size is larger than the plan's ~100 KB estimate (full variable font with the opsz axis).

## Phase 3 — Site shell and placeholder routes

Tests first (T027 to T030), then the code (T031 to T039), then the run (T040).

- [x] T027 [P] Write failing test `frontend/tests/unit/nav.test.ts`: `isActive("/", "/")` true; `isActive("/results/x",
  "/results")` true; `isActive("/results", "/")` false; `/` never matches other paths — files:
  `frontend/tests/unit/nav.test.ts` — satisfies: US1-1
- [x] T028 [P] Write failing test `frontend/tests/e2e/shell.spec.ts` (project `prod`): for each of `/`, `/try`,
  `/results`, `/about`, `/explore` and the 404 route — exactly one `<h1>`; nav shows wordmark, Explore, Try it, Results,
  About, GitHub, Thesis; current item has `aria-current="page"` and a 2 px underline; no `/lab` link in nav; the
  placeholder line "coming in feature NNN" on the five pages; `/lab` returns 200; GitHub renders as "GitHub (link
  pending)" with no `href`; Thesis links to `/about`; footer shows the credit lines, JODD licence line and both
  citations; at 759 px "Menu" is visible, inline links hidden, opening it shows the same links; at 761 px inline links
  show and Menu is hidden; with `javaScriptEnabled: false` all links exist and the menu opens; at 320 px
  `scrollWidth <= innerWidth` on every route — files: `frontend/tests/e2e/shell.spec.ts` — satisfies: US1-1, US1-2,
  FR-006, FR-007, edge: JS off, edge: 320 px, SC-005
- [x] T029 [P] Write failing test `frontend/tests/e2e/theme.spec.ts`: with dark colour scheme emulated, `/results`
  background equals the workspace background token read from the page (`--ds-ws-bg`); with light emulated, `/` uses
  the light token; `/try` and `/lab` use the workspace token in both OS modes. No literal colours in the test —
  files: `frontend/tests/e2e/theme.spec.ts` — satisfies: US1-3, FR-002
- [x] T030 [P] Write failing test `frontend/tests/e2e/fonts-network.spec.ts`: on every route, record all requests and
  assert each origin is the app origin (zero third-party, including Google); woff2 requests come from
  `/_next/static/media/`; computed families resolve to Inter, Source Serif 4 and JetBrains Mono and `document.fonts`
  reports them loaded; with the woff2 route blocked, `document.body.scrollWidth` does not change and the `<h1>` height
  changes by no more than a few px — files: `frontend/tests/e2e/fonts-network.spec.ts` — satisfies: US1-4, SC-004, edge:
  font failure, FR-003
- [x] T031 Create `frontend/lib/nav.ts` with `isActive(pathname, href)` (exact for `/`, prefix for others) so T027
  passes — files: `frontend/lib/nav.ts` — satisfies: US1-1
- [x] T032 Create `frontend/lib/site.ts`: nav items (Explore, Try it, Results, About; no `/lab`), right-hand items,
  `GITHUB_URL: string | null = null`, and the credit text exported in parts `credits.jodd`, `credits.joddPaper`,
  `credits.joddSeg`, `credits.backbones`, plus `joddLicenceLine` ("CC BY-NC-SA 4.0, JAMSTEC, scientific and educational
  use") and both citations (Handoff §1 DOI `10.1016/j.dib.2026.112462`; DS §16 dataset DOI `10.17596/0004035`, 2025).
  Copy wording from Handoff §1 and DS §16 verbatim; do not invent facts. Text only, no metrics — files:
  `frontend/lib/site.ts` — satisfies: FR-006, US1-1, plan §10 (credits in parts, GITHUB_URL), plan R2, plan R3,
  Art. VIII.3
- [x] T033 [P] Create `frontend/components/icons.tsx` (chevron, arrow, handle chevrons; inline SVG, `aria-hidden`,
  `currentColor`) and `frontend/components/layout/lens-mark.tsx` (small amber dot glyph using token colours) — files:
  `frontend/components/icons.tsx`, `frontend/components/layout/lens-mark.tsx` — satisfies: FR-006, FR-005
- [x] T034 Create `frontend/components/layout/nav-links.tsx` (`"use client"`): `usePathname` + `isActive` set
  `aria-current="page"` and the 2 px `--primary` underline; closes the `<details>` menu on route change and on Esc and
  returns focus to the summary — files: `frontend/components/layout/nav-links.tsx` — satisfies: US1-1, US1-2, FR-008
- [x] T035 Create `frontend/components/layout/site-nav.tsx` (server component): `<header>` with `container-type:
  inline-size`; wordmark link "SeaBed Lens" with `lens-mark`; inline link list and right-hand list shown from `@nav:`;
  below that a native `<details><summary>Menu</summary>` with the same links; only one link set displayed at a time;
  GitHub renders as `<span class="ph">GitHub (link pending)</span>` while `GITHUB_URL` is null; Thesis → `/about` —
  files: `frontend/components/layout/site-nav.tsx` — satisfies: US1-1, US1-2, FR-006, edge: JS off, plan R2
- [x] T036 [P] Create `frontend/components/layout/site-footer.tsx` (credit lines, licence line and both citations from
  `lib/site.ts`; `text-caption`, `text-muted-foreground`) and `frontend/components/layout/page-title.tsx` (the one serif
  `<h1>` at the h1 scale, optional `note` line) — files: `frontend/components/layout/site-footer.tsx`,
  `frontend/components/layout/page-title.tsx` — satisfies: FR-006, Art. VIII.3
- [x] T037 Create `frontend/components/layout/shell.tsx` (shared internal Shell: flex-column body, `SiteNav`,
  `<main id="main">` flex-1 with 16 px minimum gutter, `SiteFooter`), `reading-layout.tsx` (`width?: "prose" | "wide"`,
  720 px prose) and `workspace-layout.tsx` (same shell inside `<div class="ws">`). `shell.tsx` is an addition to the
  plan's tree (the plan names "one internal Shell component" but no file) — files:
  `frontend/components/layout/shell.tsx`, `frontend/components/layout/reading-layout.tsx`,
  `frontend/components/layout/workspace-layout.tsx` — satisfies: FR-006, US1-3
- [x] T038 [P] Create the route-group layouts and 404: `frontend/app/(reading)/layout.tsx` (`ReadingLayout`),
  `frontend/app/(workspace)/layout.tsx` (`WorkspaceLayout`), `frontend/app/not-found.tsx` (inside `ReadingLayout`) —
  files: `frontend/app/(reading)/layout.tsx`, `frontend/app/(workspace)/layout.tsx`, `frontend/app/not-found.tsx` —
  satisfies: FR-006, FR-007, US1-3
- [x] T039 Create the placeholder pages with `PageTitle` and the one-line "coming in feature NNN" note: replace
  `(reading)/page.tsx` (`/`, feature 004), add `(reading)/results/page.tsx` (006), `(reading)/about/page.tsx` (007),
  `(reading)/explore/page.tsx` (009), `(workspace)/try/page.tsx` (005), `(workspace)/lab/page.tsx` (008). No dynamic
  APIs on the reading pages; no `"use client"` data fetching — files: `frontend/app/(reading)/page.tsx`,
  `frontend/app/(reading)/results/page.tsx`, `frontend/app/(reading)/about/page.tsx`,
  `frontend/app/(reading)/explore/page.tsx`, `frontend/app/(workspace)/try/page.tsx`,
  `frontend/app/(workspace)/lab/page.tsx` — satisfies: FR-007, FR-012, US1-1
- [x] T040 Run `nav.test.ts`, then `next build` and `shell.spec.ts`, `theme.spec.ts`, `fonts-network.spec.ts` on the
  `prod` project; fix until green. If a spec fails because of the spec or plan (not the code), stop and report —
  files: whichever of T031 to T039 failed — satisfies: US1-1, US1-2, US1-3, US1-4, SC-004, SC-005 (partial), edge: JS
  off, edge: font failure

## Phase 4 — Base components and `/design`

Tests first (T041 to T045), then components (T046 to T058), then the style page (T059), then the run (T060).
`components.json` is created by the shadcn CLI in T048; the CLI must not overwrite `globals.css` (see T048).

- [ ] T041 [P] Write failing test `frontend/tests/unit/footnote.test.tsx`: closed popover is not in the accessibility
  tree and has `display:none`; opens on click, on keyboard focus plus Enter, and on hover; Esc closes and returns focus
  to the marker — files: `frontend/tests/unit/footnote.test.tsx` — satisfies: FR-005 (Footnote), Art. III
- [ ] T042 [P] Write failing test `frontend/tests/unit/swipe-compare.test.tsx`: renders a range input with an accessible
  name; ArrowRight changes the value and the `--pos` variable — files: `frontend/tests/unit/swipe-compare.test.tsx` —
  satisfies: FR-005 (SwipeCompare)
- [ ] T043 [P] Write failing test `frontend/tests/unit/badge-table.test.tsx`: Badge without children is a type error
  (`@ts-expect-error` case) and renders its word for all five statuses; Table requires `label` and renders a
  `role="region"` scroll container with `tabindex=0` and that `aria-label`; `TableHead group` and `TableCell muted`
  render their variants; Tabs arrow keys move between triggers — files: `frontend/tests/unit/badge-table.test.tsx` —
  satisfies: FR-005 (Badge, Table, Tabs), plan §10 (Table group/muted)
- [ ] T044 [P] Write failing test `frontend/tests/unit/research.test.tsx` (addition to plan §6.3): `SourceLine` renders
  "Source: <runs> · <n> seeds · JODD <split> split" with runs in mono and the "Sources & data →" link defaulting to
  `/results#sources`; `Pending` renders its `children` text in the `.ph` span and sets `aria-disabled` when `disabled`;
  `Collapsible` toggles open and closed — files: `frontend/tests/unit/research.test.tsx` — satisfies: FR-005
  (SourceLine, Collapsible), plan §10 (Pending)
- [ ] T045 [P] Write failing test `frontend/tests/e2e/design.spec.ts`. Project `dev`: `/design` renders every component
  in its states; computed-style checks: no `box-shadow` on button and card-like surfaces, tablist and trigger radius 0
  (no pills), focused input shadow has 0 blur, table wrapper has no border; the type utilities' size and line-height
  match DS §5.1 (read from tokens) and the < 640 px reductions at 320 px; the footnote popover docks to the bottom under
  560 px and is absent from layout when closed; the `/design` table scrolls inside its own region at 320 px. Project
  `prod`: `/design` returns 404 and no nav link points to it — files: `frontend/tests/e2e/design.spec.ts` — satisfies:
  US2-2, US2-3, US4-1, FR-004, FR-005, edge: 320 px
- [ ] T046 [P] Create `frontend/components/ui/button.tsx`: `cva` variants primary / secondary / text, sizes default (40) /
  sm (32), 44 on coarse pointers, press `scale(.97)` over `--ds-d-press`, `arrow` variant (`::after` arrow, 2 px
  hover nudge), `asChild`; no shadow, no ring glow — files: `frontend/components/ui/button.tsx` — satisfies: FR-005,
  US2-3
- [ ] T047 [P] Create `frontend/components/ui/input.tsx`: 40 px, 7 px radius (via token), 1 px `--input` border, focus =
  border `--ring` plus 1 px `--ring` box-shadow, no glow — files: `frontend/components/ui/input.tsx` — satisfies:
  FR-005, US2-3
- [ ] T048 Run `pnpm dlx shadcn@4.23.0` to seed Tabs **(network)**; keep `components.json` (css file =
  `app/globals.css`, record the shadcn version in its notes); if the CLI touched `globals.css`, revert that change by
  hand and re-run `tokens.test.ts`. Restyle `frontend/components/ui/tabs.tsx` to underline only (1 px baseline, 2 px
  `--primary` active underline, no pills, no `rounded-full`); `forceMount` passes through `TabsContent` — files:
  `frontend/components.json`, `frontend/components/ui/tabs.tsx`, `frontend/package.json` (only if the CLI changed it) —
  satisfies: FR-005 (Tabs), US2-3, plan §10 (Tabs forceMount)
- [ ] T049 [P] Create `frontend/components/ui/badge.tsx`: `status` prop required (`ready`, `processing`, `failed`,
  `neutral`, `null`), `children: string` required, 6 px dot, 5 px radius — files: `frontend/components/ui/badge.tsx` —
  satisfies: FR-005 (Badge)
- [ ] T050 [P] Create `frontend/components/ui/table.tsx`: `Table` (needs `label`; `role="region"` scroll container with
  `tabIndex=0`), `TableHeader/Body/Row/Head/Cell`; header rule `--foreground`, hairline rows, `numeric` right-aligned in
  tabular figures, `TableHead group` with colSpan and its own rule, `TableCell muted` and `strong`; no card, no bordered
  wrapper — files: `frontend/components/ui/table.tsx` — satisfies: FR-005 (Table), US2-3, plan §10 (Table group/muted),
  edge: 320 px
- [ ] T051 [P] Create `frontend/components/ui/collapsible.tsx`: native `<details>`, 40 px summary, chevron rotates,
  `::details-content` height and opacity over 220 ms (token) where supported; props `summary`, `count?`, `defaultOpen?` —
  files: `frontend/components/ui/collapsible.tsx` — satisfies: FR-005 (Collapsible)
- [ ] T052 [P] Create `frontend/components/ui/slider.tsx`: native `<input type=range>` with `accent-color`; props
  `label`, `value`, `onChange(value)`, `min`, `max`, `step`, `format?`; value shown in tabular figures — files:
  `frontend/components/ui/slider.tsx` — satisfies: FR-005 (Slider)
- [ ] T053 [P] Create `frontend/components/ui/switch.tsx`: native checkbox with `role="switch"` styled 32 × 18; props
  `label`, `checked`, `onCheckedChange` — files: `frontend/components/ui/switch.tsx` — satisfies: FR-005 (Switch)
- [ ] T054 [P] Create `frontend/components/research/pending.tsx`: `children: string`, `disabled?`; dashed-underline
  `.ph` span per DS §9.8; text comes from `children` (not fixed to "Pending ablation") — files:
  `frontend/components/research/pending.tsx` — satisfies: plan §10 (Pending), FR-005, Art. I.8
- [ ] T055 [P] Create `frontend/components/research/source-line.tsx`: props `runs`, `split`, `seeds?`, `dataset?`
  (default "JODD"), `href?` (default `/results#sources`); runs in mono; "Sources & data →" link — files:
  `frontend/components/research/source-line.tsx` — satisfies: FR-005 (SourceLine)
- [ ] T056 Seed Popover with the shadcn CLI **(network)** and create `frontend/components/research/footnote.tsx`
  (`"use client"`): props `marker`, `summary`, `runs?`; popover opens on hover, focus and tap; Esc closes and returns
  focus to the marker; closed state is `display:none` (removed from layout); docks to the bottom under 560 px. Check
  `globals.css` is untouched (T048 rule) — files: `frontend/components/ui/popover.tsx`,
  `frontend/components/research/footnote.tsx` — satisfies: FR-005 (Footnote), Art. III, plan R9
- [ ] T057 [P] Create `frontend/components/media/image-well.tsx`: neutral `--well`, 4:3, `isolation:isolate`; props
  `description` (required, applied as `role="img" aria-label`), `children?` (canvas layer), `overlay?` (SVG layer),
  `running?` (dims overlay via a utility, no decimal literal), `radius?: "well" | "compact" | "thumb" | "dot"`; no teal
  inside — files: `frontend/components/media/image-well.tsx` — satisfies: FR-005 (ImageWell), Art. II
- [ ] T058 Create `frontend/components/media/swipe-compare.tsx`: transparent range input over the image, 2 px divider,
  34 px handle using the handle icons, `--pos` variable; props `before`, `after`, `beforeLabel?` ("Image"),
  `afterLabel?` ("Model output"), `label`, `defaultValue?` (50); uses `ImageWell` — files:
  `frontend/components/media/swipe-compare.tsx` — satisfies: FR-005 (SwipeCompare)
- [ ] T059 Create `frontend/app/(reading)/design/page.dev.tsx`: the style reference showing every base component in its
  states, every type utility, the token swatches (read from variables, no literals), and a `.ws` sample; exists only
  when `NODE_ENV !== "production"`; not linked from nav — files: `frontend/app/(reading)/design/page.dev.tsx` —
  satisfies: US4-1, US2-2, FR-005
- [ ] T060 Run all unit tests and `design.spec.ts` on both projects; fix until green — files: whichever of T046 to T059
  failed — satisfies: US2-2, US2-3, US4-1, FR-005, FR-004

## Phase 5 — Accessibility, budget, motion and static checks

- [ ] T061 [P] Write `frontend/tests/e2e/a11y.spec.ts`: for every route in `routes.ts` x {light OS, dark OS} (`/try` and
  `/lab` are always dark) run `AxeBuilder` with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`; fail on any
  `serious` or `critical` violation; also check `scrollWidth <= innerWidth` at 320 px per route; include the negative
  control: run the same helper against an inline page with an `<img>` lacking alt and assert it reports a violation —
  files: `frontend/tests/e2e/a11y.spec.ts` — satisfies: SC-001, US3-2, SC-005, edge: 320 px, Art. III.2
- [ ] T062 [P] Write `frontend/tests/e2e/budget.spec.ts`: sum the gzip size of JS responses on `/`, `/results`, `/about`
  (excluding fonts) and fail above 150 KB — files: `frontend/tests/e2e/budget.spec.ts` — satisfies: SC-003, plan R9
- [ ] T063 [P] Write `frontend/tests/e2e/motion-focus.spec.ts`: Tab through the nav and assert computed
  `outline-width: 2px` and `outline-offset: 2px` on each focused element; with `emulateMedia({reducedMotion:
  "reduce"})` computed transition durations are ≤ 120 ms and a pressed button has no transform — files:
  `frontend/tests/e2e/motion-focus.spec.ts` — satisfies: FR-008, FR-009, edge: reduced motion
- [ ] T064 Write failing test `frontend/tests/unit/check-tokens.test.ts` (addition): `check-tokens.mjs` exports
  `scan(text, filename)`; it flags colour literals (`#abc`, `rgb(`, `rgba(`, `hsl(`, `oklch(`), `[#`, `rounded-[`,
  `duration-[`, `ease-[`, `cubic-bezier(`, `\b\d+ms\b`, and metric-looking decimals (`\b0\.\d{2,}\b`); it passes clean
  text — files: `frontend/tests/unit/check-tokens.test.ts` — satisfies: SC-002, Art. I.1, Art. II
- [ ] T065 Create `frontend/scripts/check-tokens.mjs`: exports `scan`; CLI scans `frontend/app` and
  `frontend/components` only (not `globals.css`, not tests), prints file:line, exits 1 on any hit. Run it on the repo;
  fix real hits in components (use tokens or utilities, no `0.30`-style literals) — files:
  `frontend/scripts/check-tokens.mjs` — satisfies: SC-002, Art. I.1, Art. II
- [ ] T066 [P] Create `frontend/scripts/check-static.mjs`: reads `NEXT_DIST_DIR` (default `.next`) and asserts
  `<distDir>/server/app/results.html`, `about.html`, `explore.html` exist (adjust to the folder layout the build
  actually produces; note it below this line) — files: `frontend/scripts/check-static.mjs` — satisfies: FR-012,
  plan §10 (NEXT_DIST_DIR)
- [ ] T067 Add ESLint rules to `frontend/eslint.config.mjs`: `no-restricted-syntax` banning inline-style colour
  properties and any `outline-none` / `outline: none` class or string. Verify with a throwaway file that the rule
  fires, then delete it — files: `frontend/eslint.config.mjs` — satisfies: FR-008, SC-002
- [ ] T068 Wire the final scripts and remove the stub: `frontend/package.json` `check:frontend` = `tsc --noEmit` ->
  `eslint .` -> `node scripts/check-tokens.mjs` -> `vitest run` -> `next build` -> `node scripts/check-static.mjs` ->
  `playwright test` (both projects); add `typecheck`, `lint`, `check:tokens`, `check:static`, `test:unit`, `test:e2e`;
  delete `tests/unit/sanity.test.ts` — files: `frontend/package.json`, `frontend/tests/unit/sanity.test.ts` (delete) —
  satisfies: FR-010, US3-1
- [ ] T069 Run `pnpm check`; fix failures from T061 to T067. If `budget.spec.ts` fails and the cause is the framework
  floor (not our code), stop and report to the orchestrator: the fix may be a spec change (plan R9). Do not raise the
  limit — files: whichever file failed — satisfies: SC-001, SC-002, SC-003, SC-004, SC-005, US3-1, US3-2, FR-008, FR-009

## Phase 6 — CI and docs

- [ ] T070 Open check: look up the current major version tags of `actions/checkout`, `pnpm/action-setup`,
  `actions/setup-node`, `astral-sh/setup-uv` and `actions/upload-artifact` from their GitHub release pages. Note them
  below this line. **(network)** — files: none — satisfies: plan R15, FR-010
- [ ] T071 Write failing test `frontend/tests/unit/ci-config.test.ts`: `.github/workflows/ci.yml` exists, contains
  `permissions:` with `contents: read` only, no `contents: write`, no `git push`, `git tag`, `gh `, or comment step,
  `persist-credentials: false`, triggers `push` and `pull_request`, and runs `pnpm check` — files:
  `frontend/tests/unit/ci-config.test.ts` — satisfies: US3-3, FR-010, Art. V
- [ ] T072 Create `.github/workflows/ci.yml`: triggers `push` and `pull_request`; `permissions: contents: read`;
  `concurrency` cancels superseded runs; `timeout-minutes: 20`; steps: checkout (`persist-credentials: false`) -> pnpm
  setup (version from `packageManager`) -> setup-node (Node 24, pnpm cache) -> setup-uv -> `pnpm install
  --frozen-lockfile` -> `pnpm setup:browsers:ci` -> `pnpm check`; on failure upload `frontend/playwright-report`.
  Use the majors from T070 — files: `.github/workflows/ci.yml` — satisfies: US3-3, FR-010
- [ ] T073 [P] Edit `README.md`: add a "Run it" section (prerequisites, `pnpm install`, `pnpm setup:browsers`, `pnpm dev`
  for frontend, the uv command for the backend, `pnpm check`, `NEXT_DIST_DIR`, `.env.example` copy step). Do not
  touch other sections — files: `README.md` — satisfies: FR-001
- [ ] T074 [P] Edit `CLAUDE.md` §4 **only** (approved by Rolf): replace "Filled in by feature 001..." with the real
  commands (install, dev, check, backend run, browser setup). No other section changes — files: `CLAUDE.md` —
  satisfies: FR-001, plan R7

## Phase 7 — Verification and hand-over

- [ ] T075 Prove a clean run: remove `node_modules`, `frontend/.next`, `backend/.venv` and test output folders in the
  working tree (these are git-ignored build artefacts), then `pnpm install --frozen-lockfile`, `pnpm setup:browsers`,
  `pnpm check`. All green. **(network)** — files: none — satisfies: US3-1, FR-010, all SC
- [ ] T076 Read-only repo review: `git status` and `git ls-files` show no real `.env*` file tracked or staged-eligible,
  no `node_modules`/`.next` content, and `pnpm-lock.yaml` and `backend/uv.lock` present — files: none — satisfies:
  FR-011
- [ ] T077 **(Rolf)** Manual keyboard pass on `pnpm dev` and on the production build, light and dark OS: Tab order on
  every route, visible 2 px focus ring on every control, Menu opens and closes with keyboard and Esc, Tabs use arrow
  keys, Footnote opens with keyboard, SwipeCompare moves with arrows, skip link works. Record issues below this line —
  files: none — satisfies: Art. III, FR-008, US1-2
- [ ] T078 **(Rolf)** Short VoiceOver pass on `/` and `/design` (nav landmark, current page announced, Badge words,
  Table region name, SwipeCompare name). Record issues below this line — files: none — satisfies: Art. III
- [ ] T079 **(Rolf, or run in Chrome DevTools)** One Lighthouse accessibility run on each placeholder route, light and
  dark; every score ≥ 95. Record the scores below this line and in the hand-over notes — files: none — satisfies:
  SC-001, plan R8
- [ ] T080 Open item for Rolf (not blocking): supply the GitHub repository URL; then set `GITHUB_URL` in
  `frontend/lib/site.ts` and update `shell.spec.ts` and T028's placeholder assertion. Spec question stays open until
  then — files: `frontend/lib/site.ts`, `frontend/tests/e2e/shell.spec.ts` (after URL is known) — satisfies:
  FR-006, plan R2
- [ ] T081 Final bookkeeping: confirm every task above is ticked or has a stated reason; list every file created or
  edited (from `git status`, read-only) for the orchestrator's single hand-over, one line per file saying what changed.
  Do not output a git block — files: none — satisfies: CLAUDE.md §1

## Coverage

| Requirement | Task IDs |
|---|---|
| FR-001 | T001, T004, T005, T007, T008, T009, T015, T073, T074 |
| FR-002 | T017, T018, T019, T020, T023, T029 |
| FR-003 | T024, T025, T026, T030 |
| FR-004 | T017, T020, T021, T023, T045 |
| FR-005 | T033, T041-T044, T046-T060 |
| FR-006 | T028, T032, T033, T035-T038, T080 |
| FR-007 | T028, T038, T039 |
| FR-008 | T022, T034, T063, T067, T077 |
| FR-009 | T022, T063 |
| FR-010 | T004, T006, T010, T016, T068, T069, T071, T072, T075 |
| FR-011 | T003, T005, T012, T013, T014, T076 |
| FR-012 | T005, T015, T039, T066 |
| US1-1 | T027, T028, T031, T032, T034, T035, T039, T040 |
| US1-2 | T020, T028, T034, T035, T040, T077 |
| US1-3 | T019, T029, T037, T038, T040 |
| US1-4 | T024, T030, T040 |
| US2-1 | T017, T018, T019, T023 |
| US2-2 | T045, T059, T060 |
| US2-3 | T045, T046, T047, T048, T050, T060 |
| US3-1 | T010, T011, T016, T068, T069, T075 |
| US3-2 | T061, T069 |
| US3-3 | T071, T072 |
| US4-1 | T005, T045, T059, T060 |
| Edge: font failure | T024, T030 |
| Edge: JavaScript off | T028, T035, T040 |
| Edge: 320 px | T028, T045, T050, T061 |
| Edge: reduced motion | T022, T063 |
| SC-001 | T061, T069, T079 |
| SC-002 | T064, T065, T067, T069 |
| SC-003 | T062, T069 |
| SC-004 | T030, T040, T069 |
| SC-005 | T028, T061, T069 |

Plan items outside the spec's ID list: plan §10 reconciliation (NEXT_DIST_DIR T005, T011, T066; credits in parts and
`GITHUB_URL` T032; `Pending` T054; Table group/muted T043, T050; Tabs `forceMount` T048); open checks (pnpm setting T002,
Inter features T025, action majors T070); risks R2 (T035, T080), R3 (T032, T036), R7 (T074), R8 (T079), R9 (T062,
T069), R11 (T025, T026), R15 (T070).

**Gaps:** none in the FR, US, edge-case or SC lists. Items needing a human decision are T077 to T080.

## Network and Rolf summary

- Needs network: T001 (Python fetch), T002, T006, T009, T011 (Chromium download), T024 (font download at build), T025,
  T026, T048, T056, T070, T075. Every `next build` after T024 also needs network for the font download.
- Needs Rolf: T077, T078, T079 (or Chrome DevTools), T080 (GitHub URL).

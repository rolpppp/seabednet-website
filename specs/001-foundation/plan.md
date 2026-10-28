# 001 — Foundation and design system: implementation plan

**Spec:** [spec.md](spec.md) · **Status:** draft for Rolf's review · **Planned:** 2026-10-29
**Design:** DS §5–9, §11–13, §15 · **Constitution:** v1.1.0

## 1. Summary

Create the monorepo skeleton and the shared UI layer. In order of dependence:

1. A pnpm workspace with a Next.js app in `frontend/` and a uv-managed FastAPI shell in `backend/`.
2. One stylesheet, `frontend/app/globals.css`, holds every design token once and maps them to Tailwind v4 and to the
   shadcn variable names (DS §15). Light, dark-reading and the `.ws` workspace are three views of the same raw values.
3. Three typefaces through `next/font/google`, which downloads them at build time and serves them from our own origin.
4. Site shell (Nav, Footer, ReadingLayout, WorkspaceLayout), base components, and placeholder routes.
5. One command, `pnpm check`, that runs every frontend and backend check. GitHub Actions runs exactly that command with
   `contents: read` only.

No feature content, no inference code, no data. Anything the later features need from this layer is listed in §6.

## 2. Technical context

Versions were looked up on npm and PyPI on 2026-10-29 and are pinned **exactly** (`.npmrc` has `save-exact=true`;
`uv.lock` and `pnpm-lock.yaml` are committed). The agent does not install them in this planning step.

### Frontend

| Package | Version | Why it is here (one line) |
|---|---|---|
| Node (CI, `engines`) | **24 LTS** (`engines.node ">=24"`); local Node 26 satisfies it | Oldest LTS that every dependency below supports; CI uses the LTS, not the newest release. Rolf can move CI to 26 once he is content it is LTS. |
| pnpm | **12.14.0** via `packageManager` | Resolved decision; version is what is installed on Rolf's machine. |
| next | **16.4.3** (App Router, Turbopack default) | Constitution Art. VII.1. Needs Node ≥ 20.9. |
| react, react-dom | **19.3.1** | Required by Next 16. |
| typescript | **6.0.3** (not 7.0.2) | 7.x is the newest `latest`, but `typescript-eslint` 8.72 declares support only for `<6.1.0`. Strict mode on. Revisit when tooling catches up. |
| @types/node | **24.19.2**; @types/react **19.3.0**; @types/react-dom matching | Types for the CI Node line. |
| tailwindcss, @tailwindcss/postcss | **4.3.3** | Tailwind v4, CSS-first config (`@theme`), no `tailwind.config.js`. |
| shadcn (CLI) | **4.23.0**, run once with `pnpm dlx` | Code generator only, not a runtime dependency. Seeds Tabs and Popover, which we then restyle. Version recorded in `components.json` notes. |
| radix-ui | **1.8.1** | Primitives shadcn v4 imports: Tabs (arrow-key behaviour), Popover (focus handling), Slot (`asChild`). Tree-shaken. |
| class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.7.0 | as listed | The shadcn `cn()` helper and Button variants. |
| eslint | **9.39.5** (not 10.13.0) | `eslint-config-next` 16.4.3 peers `>=9`; 10 is too new to trust for the first lint setup. |
| eslint-config-next | **16.4.3** | Brings `typescript-eslint`, `jsx-a11y`, `react-hooks`. `next lint` no longer exists in 16, so ESLint is run directly. |
| vitest | **5.0.5** + jsdom **30.1.3** + @testing-library/react **16.3.3** | Unit and component tests for logic Playwright would test slowly: footnote open/close, swipe keyboard, nav active state, token file shape. Needs vite. |
| vite | **8.3.5**; @vitejs/plugin-react **6.1.2** | Peer requirements of Vitest 5 and the plugin (plugin needs vite ^8). |
| @playwright/test | **1.64.1** (Chromium only) | Acceptance scenarios (Art. VI.5). One browser keeps CI short; a second can be added later. |
| @axe-core/playwright | **4.14.0** | Art. III.2: axe on every route. |

Deliberately **not** added: lucide-react (the few icons are inline SVG in `components/icons.tsx`), tw-animate-css,
Prettier, TanStack Table, Sonner, vaul/Drawer, DropdownMenu, Lighthouse CI. Each is either not needed by FR-005 or belongs
to a later feature (006 tables, 005 drawer, 008 menu). Their DS §15 entries are listed as "used" for the app as a whole,
not for 001.

### Backend

| Item | Version | Why |
|---|---|---|
| Python | **3.12** (`.python-version`, `requires-python ">=3.12,<3.14"`) | The machine has 3.14.6, but PyTorch wheel support for 3.14 is unverified and 003 needs PyTorch. uv downloads 3.12 itself. |
| uv | already installed (0.10.4) | Resolves, locks and runs; no `pip` on this machine. |
| fastapi | **0.162.0** | Constitution Art. VII.1. |
| uvicorn | **0.54.0** | ASGI server for `/health`. |
| pytest | **9.2.0**; httpx **0.28.1** | Smoke test through FastAPI's `TestClient` (which needs httpx). |
| ruff | **0.17.3** | Lint and format check in one tool; no black, flake8 or isort. |

### Targets and constraints

- Platforms: modern evergreen browsers; static output for Results, About, Explore (FR-012).
- Budgets from the spec: ≤ 150 KB gzip JS on a reading page (SC-003), zero third-party requests (SC-004), no horizontal
  scroll at 320 px (SC-005), 0 serious/critical axe violations (SC-001).

## 3. Constitution check

| Article | How this plan complies | Waiver |
|---|---|---|
| I — Every number is traceable | 001 contains no metric. A grep check (§5.4) fails the build if a metric-looking decimal appears in `app/` or `components/`. Unknown facts (GitHub URL) render as a visible placeholder (I.8). | None |
| II — Design system binding | All values live once in `globals.css` as `--ds-*` raw tokens; components consume semantic variables only; `check-tokens` forbids literal colours, radii and durations elsewhere. Image well is neutral (`--ds-well`); no teal inside it. | None. One naming conflict is flagged in §9 (R1). |
| III — Accessible by default | axe on every route in light and dark, fail on serious/critical; global focus ring; 44 px touch targets via `pointer: coarse`; reduced motion global; no third-party fonts or analytics (checked by a request-origin test). Manual keyboard pass is a task before the feature closes. | None |
| IV — Model fidelity | Not touched. Backend is `/health` only; `SEABEDNET_REPO` is documented in `.env.example` and never read. No GPU. | N/A |
| V — Humans own version control | Plan writes files only. CI has `permissions: contents: read`, `persist-credentials: false`, no push, tag or comment steps. Hand-over block at the end of each step. | None |
| VI — Spec first | Plan follows the accepted spec; every FR and scenario is mapped in §4; scenarios become Playwright or Vitest tests (§5). | None |
| VII — Simplicity | Stack as listed in VII.1. New dependencies are justified one line each in §2 and none is a framework, state manager or database. Native `<details>`, `<input type=range>` and a checkbox switch replace Radix Collapsible, Slider and Switch. | None |
| VIII — Privacy and safety | No uploads and no cookies in 001. Footer carries the JODD attribution and licence line because every page may later show JODD images. | None |

## 4. Project structure

Files 001 creates (everything below is new; the repo currently holds docs, specs and setup only).

```
.github/workflows/ci.yml          one job: install, install Chromium, `pnpm check`; read-only
.gitignore                        node_modules, .next, .venv, __pycache__, playwright-report, test-results, .env*, !.env.example
.env.example                      SEABEDNET_REPO, API_BASE_URL, SAMPLES_ENABLED=false, UPLOAD_RETENTION_HOURS (blank, see R5)
.npmrc                            save-exact=true
package.json                      private; packageManager; engines; scripts: check, check:frontend, check:backend, setup
pnpm-workspace.yaml               packages: [frontend]; approved build scripts (see R6)
pnpm-lock.yaml
README.md                         (edit) "Run it" section with the commands
CLAUDE.md                         (edit §4 only, with Rolf's OK, see R7)

backend/
  pyproject.toml                  deps, dev deps, [tool.ruff], [tool.pytest]
  .python-version                 3.12
  uv.lock
  app/__init__.py
  app/main.py                     FastAPI(); GET /health -> {"status": "ok"}; nothing else
  tests/test_health.py            200, JSON body, no other routes exposed

frontend/
  package.json                    scripts: dev, build, start, typecheck, lint, check:tokens, check:static, test:unit,
                                  test:e2e, check
  tsconfig.json                   strict, noUncheckedIndexedAccess, path alias @/*
  next.config.ts                  loads ../.env via @next/env; maps API_BASE_URL and SAMPLES_ENABLED for client use;
                                  pageExtensions adds "dev.tsx" outside production (the /design page)
  postcss.config.mjs              @tailwindcss/postcss only
  eslint.config.mjs               eslint-config-next/core-web-vitals + typescript; no-restricted-syntax for inline style colours
  components.json                 shadcn config (style, aliases, css file = app/globals.css)
  vitest.config.ts                jsdom, plugin-react, include tests/unit
  playwright.config.ts            projects "prod" (next start :3000) and "dev" (next dev :3100, design.spec only)
  scripts/check-tokens.mjs        SC-002 and metric-decimal grep (§5.4)
  scripts/check-static.mjs        asserts .next/server/app/{results,about,explore}.html exist (FR-012)

  app/
    layout.tsx                    <html lang="en">, font variables, skip link, metadata. No Nav here (see below)
    globals.css                   THE token file (§4.1) + type utilities + base styles + reduced motion
    not-found.tsx                 404 inside ReadingLayout
    (reading)/layout.tsx          <ReadingLayout>
    (reading)/page.tsx            "/"      placeholder (004 will take over; it may use a .ws section for its dark hero)
    (reading)/results/page.tsx    static placeholder
    (reading)/about/page.tsx      static placeholder
    (reading)/explore/page.tsx    static placeholder
    (reading)/design/page.dev.tsx style reference; exists only when NODE_ENV != production (US4)
    (workspace)/layout.tsx        <WorkspaceLayout>
    (workspace)/try/page.tsx      placeholder shell; client-rendered content arrives in 005
    (workspace)/lab/page.tsx      placeholder shell; not linked from nav

  components/
    layout/
      reading-layout.tsx          nav + <main id="main"> + footer on the reading surface
      workspace-layout.tsx        same shell wrapped in `.ws`
      site-nav.tsx                server component: wordmark, link lists, <details> menu
      nav-links.tsx               "use client": usePathname -> aria-current; closes menu on route change and Esc
      lens-mark.tsx               wordmark glyph, small amber dot
      site-footer.tsx             credit lines from lib/site.ts
      page-title.tsx              the one <h1> per page (serif h1 scale) + optional one-line note
    ui/
      button.tsx  input.tsx  tabs.tsx  badge.tsx  table.tsx  collapsible.tsx  slider.tsx  switch.tsx
    research/
      source-line.tsx  footnote.tsx  pending.tsx
    media/
      image-well.tsx  swipe-compare.tsx
    icons.tsx                     chevron, arrow, handle chevrons (inline SVG, aria-hidden)
  lib/
    site.ts                       nav items, GITHUB_URL = null, credit-line strings (text, not metrics)
    env.ts                        typed reads of the four FR-011 variables
    cn.ts                         clsx + tailwind-merge
    nav.ts                        isActive(pathname, href) pure function (unit-tested)
  tests/
    unit/  tokens.test.ts  nav.test.ts  footnote.test.tsx  swipe-compare.test.tsx  badge-table.test.tsx
    e2e/   shell.spec.ts  theme.spec.ts  fonts-network.spec.ts  a11y.spec.ts  budget.spec.ts
           motion-focus.spec.ts  design.spec.ts  routes.ts (route list shared by specs)
```

**Why the layouts hold the nav.** The workspace routes need the nav itself to be dark (DS §10.1, wireframes). A nav in
the root layout would stay light on `/try`. So the root layout is only `<html>`, fonts and the skip link, and each route
group's layout includes the shell. `ReadingLayout` and `WorkspaceLayout` share one internal `Shell` component.

### 4.1 Tokens (`frontend/app/globals.css`)

One file, in this order:

1. `@import "tailwindcss";`
2. **Raw palette in `:root`**, named exactly like the DS with a `--ds-` prefix: `--ds-bg`, `--ds-surface`, `--ds-subtle`,
   `--ds-border`, `--ds-text`, `--ds-text-2`, `--ds-muted`, `--ds-ocean`, `--ds-ocean-hover`, `--ds-ocean-soft`,
   `--ds-amber`, `--ds-amber-soft`, `--ds-success`, `--ds-error`, `--ds-info`, then `--ds-ws-bg`, `--ds-ws-surface`,
   `--ds-ws-subtle`, `--ds-ws-border`, `--ds-ws-text`, `--ds-ws-text-2`, `--ds-ws-muted`, `--ds-ws-ocean`,
   `--ds-ws-ocean-soft`, `--ds-ws-amber`, `--ds-well`; `--ds-on-ocean` (white) and `--ds-ws-on-ocean` (`#0B1516`);
   shape (`--ds-radius-tag/control/card/well`), shadow (`--ds-pop-shadow`, `--ds-pop-shadow-ws`), motion
   (`--ds-ease-out`, `--ds-ease-drawer`, `--ds-d-press/micro/ui/sheet`). Each raw value is written **once**.
3. **Semantic layer using the shadcn names** from DS §15 (`--background`, `--foreground`, `--card`, `--popover`,
   `--primary`, `--primary-foreground`, `--ring`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`,
   `--border`, `--input`, `--destructive`, `--radius`, `--warning`, `--success`, `--info`, `--chart-1/2`, `--well`),
   defined as `var(--ds-…)` references. Light in `:root`.
4. **Workspace remap**: `.ws { … }` and `@media (prefers-color-scheme: dark) { :root { … } }` set the same semantic
   names to the `--ds-ws-*` references. Because both blocks contain only `var()` references, the dark palette is not
   duplicated; the dark-reading theme and `.ws` literally share one set of values (DS §6.2). `.ws` also sets
   `color-scheme: dark`; `:root` sets `color-scheme: light dark`.
5. `@theme inline { … }` maps the semantic variables to Tailwind colours (`bg-background`, `text-foreground`,
   `text-muted-foreground`, `border-border`, `bg-primary`…) plus the DS-only roles (`text-ocean`, `bg-ocean-soft`,
   `bg-amber-soft`, `bg-well`, `text-success`…), radii (`rounded-tag/control/card/well`), the spacing base (4 px, so
   `p-1…p-24` give exactly the DS scale 4·8·12·16·24·32·48·64·96), `--ease-out`, `--ease-drawer`, durations, the three
   font families, and a container breakpoint `--container-nav: 47.5rem` (760 px), which gives the `@nav:` container
   variant used by the Nav.
6. **Type scale** (DS §5.1) as `@utility` classes: `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-h4`,
   `text-body`, `text-body-long` (17/28), `text-small`, `text-caption`, `text-data` (tabular), `text-code`. Sizes live
   as `--text-*` theme values; below 640 px container width `display` is 36/44 and `h1` is 28/36 (container query).
7. **Base layer**: `body` uses Inter with `font-feature-settings: "cv11", "ss01"`; global `:focus-visible` rule
   (2 px `--ring` outline, 2 px offset, never `outline: none`); hover rules only under `(hover:hover) and
   (pointer:fine)`; `@media (pointer: coarse)` raises control heights to 44 px; `.ph` placeholder style (dashed
   underline); `@media (prefers-reduced-motion: reduce)` zeroes transforms, caps transitions and animations at 120 ms
   and sets `scroll-behavior: auto`.

The spec's "exactly once" (US2-1) is enforced by `tokens.test.ts` (§5.3).

### 4.2 Fonts

- `app/layout.tsx` calls `Inter`, `Source_Serif_4` (variable, `axes: ["opsz"]`) and `JetBrains_Mono` (weights 400, 500)
  from `next/font/google` with `display: "swap"` and `variable:` names, then puts the three variable classes on `<html>`.
  `@theme` points `--font-sans`, `--font-serif`, `--font-mono` at them. Next also generates a size-adjusted fallback
  face for each, which satisfies the "layout stays stable" edge case.
- **How the files are obtained:** Next downloads the woff2 files from Google Fonts **during `next build`/`next dev`**,
  stores them in `.next`, and serves them from `/_next/static/media/…` on our origin. The browser never contacts Google
  (SC-004, C-Art. III.3). Nothing is committed to git. CI therefore needs outbound internet at build time, which GitHub
  runners have.
- **Licences:** Inter (SIL OFL 1.1, Rasmus Andersson), Source Serif 4 (SIL OFL 1.1, Adobe), JetBrains Mono (SIL OFL 1.1,
  JetBrains). OFL permits web embedding and self-hosting. The About page (007) lists them under credits; 001 adds one
  line to the footer's "Typefaces" credit only if Rolf wants it (R4).
- **Open check (task 1 of the font work):** confirm the served Inter file keeps the `cv11` and `ss01` features. If it
  does not, switch Inter to `next/font/local` with the OFL files from rsms/inter, committed under `frontend/app/fonts/`
  with the licence text. That is the only fallback and costs ~100 KB of binary in git.

### 4.3 Nav, footer and surfaces

- **Nav** (`site-nav.tsx`): a `<header>` with `container-type: inline-size`. Left: wordmark link `SeaBed Lens` (Inter 600,
  15 px) with `lens-mark`. Inline link list (`Explore · Try it · Results · About`) and right-hand `GitHub · Thesis`
  show from `@nav:` (container ≥ 760 px). Below that, a native `<details><summary>Menu</summary>` holds the same links.
  Using `<details>` means the menu works with JavaScript off (edge case) and gives keyboard and screen-reader behaviour
  for free; `nav-links.tsx` adds closing on navigation and on Esc. Only one of the two link sets is displayed at a time
  (the other is `display:none`, so there are no duplicate landmarks or links for assistive tech).
- Current page: `aria-current="page"`, `--text` colour, 2 px `--primary` underline (`isActive()` in `lib/nav.ts`: exact
  match for `/`, prefix match for the rest).
- **GitHub link:** `lib/site.ts` has `GITHUB_URL: string | null = null`. While null, the nav renders
  `GitHub (link pending)` as a `<span class="ph">` with no `href`, so it is visibly unfinished and not a dead link.
  **Thesis** links to `/about` (spec: "Thesis" is the About page).
- **Footer:** the three credit lines from Handoff §1 (JODD images with the Nishio and Kawae paper; JODD-Seg masks made
  with SAM 3 pseudo-masks reviewed by three human reviewers; pretrained backbones ConvNeXt-T (ImageNet) and DINOv2
  (Meta)), plus the JODD licence line "CC BY-NC-SA 4.0, JAMSTEC, scientific and educational use" (C-Art. VIII.3) and the
  dataset citation from DS §16. Text 12/17 `caption`, `--muted-foreground` on `--background` (4.75:1 on light).
  The licence line is an addition to FR-006; see R3.
- **ReadingLayout / WorkspaceLayout:** `<body>` is a flex column: skip link, `SiteNav`, `<main id="main">` (flex-1,
  16 px minimum gutter, `max-width` prose 720 px or wide), `SiteFooter`. `WorkspaceLayout` is the same shell inside
  `<div class="ws">`. A `.ws` wrapper can also be used on a section inside a reading page, which is how 004's dark hero
  works.

### 4.4 Base components (what DS §9 and §15 strip is simply never written)

| Component | Notes on DS fidelity |
|---|---|
| `Button` | `cva` variants primary / secondary / text, sizes default (40) / sm (32), 44 on coarse pointers; press `scale(.97)` over `--ds-d-press`; arrow variant uses `::after { content: "→" / "" }` and nudges 2 px on hover. No shadow, no ring glow. `asChild` for links. |
| `Input` | 40 px, 7 px radius, 1 px `--input` border; focus = border `--ring` + 1 px `--ring` box-shadow. No glow. |
| `Tabs` | shadcn/Radix Tabs; underline style only (1 px baseline, 2 px `--primary` active underline); no pill, no `rounded-full`. |
| `Badge` | `status` prop only (`ready`, `processing`, `failed`, `neutral`, `null`); children (a word) required; 6 px dot; 5 px radius. |
| `Table` family | No card, no bordered wrapper. The scroll container is a `role="region"` with `tabIndex=0` and an `aria-label` (needed for axe `scrollable-region-focusable`). Header rule `--foreground`, hairline rows, numeric cells right-aligned in tabular figures, column-group header with its own rule, `muted` cell style for TTA. |
| `SourceLine`, `Footnote`, `Pending` | See §6. Footnote closed state is `display:none`; popover docks to the bottom under 560 px. |
| `Collapsible` | Native `<details>`; 40 px summary; chevron rotates; `::details-content` height and opacity over 220 ms where supported. |
| `Slider`, `Switch` | Native `<input type=range>` with `accent-color`; native checkbox with `role="switch"` styled 32 × 18. Label row shows the value in tabular figures. |
| `ImageWell`, `SwipeCompare` | Neutral `--well`, 4:3, 12 px, `isolation:isolate`; SwipeCompare is a transparent range input over the image with a 2 px divider and 34 px handle. |

## 5. FR-by-FR mapping

### 5.1 Functional requirements

| FR | Satisfied by | Verified by |
|---|---|---|
| FR-001 | Repo tree in §4; `backend/app/main.py` (`/health` only); README "Run it" section; CLAUDE.md §4 | `backend/tests/test_health.py` (200 and no other routes); checklist task for README and §4 |
| FR-002 | `app/globals.css` (§4.1); `components.json` | `tokens.test.ts` (each `--ds-*` declared once; semantic names from DS §15 present; `.ws` and dark blocks contain only `var()`); `theme.spec.ts` |
| FR-003 | `app/layout.tsx` (`next/font/google`), `@theme` font families, `font-feature-settings` in base layer | `fonts-network.spec.ts` (woff2 requests come from `/_next/static/media/`; computed families; `document.fonts` loaded) |
| FR-004 | `@utility` type classes in `globals.css` (§4.1 step 6) | `tokens.test.ts` (all eleven utilities exist); `design.spec.ts` computes size and line height of each on `/design`; 320 px width check for the < 640 px reductions |
| FR-005 | `components/ui/*`, `components/research/*`, `components/media/*` | Vitest component tests (Footnote, SwipeCompare, Badge, Table); `design.spec.ts` shows every state |
| FR-006 | `components/layout/*`, `lib/site.ts` | `shell.spec.ts`, `a11y.spec.ts` |
| FR-007 | Seven page files in §4; `/lab` absent from `lib/site.ts` nav list | `shell.spec.ts` (each route 200, one `<h1>`, "coming in feature NNN" text; nav has no `/lab` link) |
| FR-008 | Global `:focus-visible` rule in base layer; component CSS never sets `outline: none` | `motion-focus.spec.ts` (Tab through nav; computed `outline-width: 2px`, `outline-offset: 2px`); ESLint rule banning `outline-none` classes |
| FR-009 | Reduced-motion block in base layer, plus all motion expressed through the `--ds-d-*` tokens | `motion-focus.spec.ts` (`emulateMedia({reducedMotion})`: computed transition durations ≤ 120 ms, no transform on pressed button) |
| FR-010 | Root `package.json` `check`; `.github/workflows/ci.yml` | CI runs the same script; local run before hand-over |
| FR-011 | `.env.example`; `lib/env.ts`; `next.config.ts`; `.gitignore` | Unit test: `.env.example` lists exactly the four names, `SAMPLES_ENABLED=false`; `git ls-files` review that no real `.env` is tracked |
| FR-012 | The four reading pages have no dynamic APIs; `try` and `lab` are shells | `scripts/check-static.mjs` after `next build` |

### 5.2 Acceptance scenarios and edge cases

| Scenario | File(s) | Test |
|---|---|---|
| US1-1 Nav items, current page, `aria-current` | `site-nav.tsx`, `nav-links.tsx`, `lib/nav.ts` | `shell.spec.ts` for each of the six public routes; `nav.test.ts` for `isActive` |
| US1-2 Menu below 760 px | `site-nav.tsx` (`@nav:` variant, `<details>`) | `shell.spec.ts` at 759 px (Menu visible, inline links hidden, opening shows same links) and 761 px |
| US1-3 Dark reading in dark OS; workspace always dark | `globals.css` §4.1 step 4; `WorkspaceLayout` | `theme.spec.ts`: emulate dark on `/results`, light on `/try`; compare computed background with `--ds-ws-bg` read from the page |
| US1-4 Fonts self-hosted | `app/layout.tsx` | `fonts-network.spec.ts` |
| US2-1 Every token once; `.ws` remaps | `globals.css` | `tokens.test.ts` |
| US2-2 Pages use shared components | `components/*`; `no-restricted-syntax` ESLint rule against raw `<button>` styled with colour classes is **not** added (too blunt) | `design.spec.ts` renders each; code review |
| US2-3 shadcn defaults absent | Components written without them | `design.spec.ts` computed styles: no `box-shadow` on button/card-like surfaces, tablist and trigger radius 0 (no pills), focused input shadow has 0 blur, table wrapper has no border |
| US3-1 One command runs all checks | Root `package.json` | Running `pnpm check` is the acceptance step |
| US3-2 Axe violation fails the check | `a11y.spec.ts` | A negative test in `a11y.spec.ts` runs axe against an inline page with a known violation (image without alt) and asserts the helper reports it, proving the gate can fail |
| US3-3 CI read-only | `ci.yml` | Review of the file: `permissions: contents: read`, no write steps; test greps the file for `contents: write` |
| US4-1 `/design` dev only, not in nav | `(reading)/design/page.dev.tsx`, `next.config.ts` `pageExtensions` | `design.spec.ts`, `dev` project: renders; `prod` project: `/design` returns 404 and no nav link |
| Edge: font failure keeps layout | Next's size-adjusted fallback | `fonts-network.spec.ts` blocks the woff2 route and checks `document.body.scrollWidth` and the h1 height change ≤ a few px |
| Edge: JavaScript off | `<details>` menu, server-rendered links | `shell.spec.ts` with `javaScriptEnabled: false`: all links present and the menu opens |
| Edge: 320 px | Layout CSS; table scroll container | `shell.spec.ts`, `a11y.spec.ts`: `scrollWidth <= innerWidth` on each route (SC-005); `/design` table scrolls inside its region |
| Edge: reduced motion | See FR-009 | `motion-focus.spec.ts` |

### 5.3 Success criteria

| SC | How |
|---|---|
| SC-001 | axe in `a11y.spec.ts`, every route, light and dark (see §5.4). The Lighthouse score is a **manual** run, recorded in the hand-over notes once per milestone (R8). |
| SC-002 | `scripts/check-tokens.mjs` (§5.4) |
| SC-003 | `budget.spec.ts`: sums gzip size of JS responses on `/`, `/results`, `/about` and fails above 150 KB |
| SC-004 | `fonts-network.spec.ts` records every request on every route; any origin other than `localhost:3000` fails |
| SC-005 | See edge case 320 px |

## 6. Test plan

### 6.1 The single check command

**`pnpm check`, run at the repo root.** It runs `pnpm check:frontend && pnpm check:backend`.

- `check:frontend` (in `frontend/`): `tsc --noEmit` → `eslint .` → `node scripts/check-tokens.mjs` → `vitest run` →
  `next build` → `node scripts/check-static.mjs` → `playwright test` (both projects).
- `check:backend`: `uv run --directory backend ruff check .` → `ruff format --check .` → `pytest`.
- One-time per machine: `pnpm setup:browsers` (= `playwright install chromium`). CI runs it with `--with-deps`.

**Why pnpm scripts and not a Makefile:** pnpm is already a hard requirement, the same command runs on Rolf's Mac and
on a GitHub runner without installing `make`, and the script lines are readable in `package.json`. The root has no
dependencies of its own; `pnpm-workspace.yaml` points at `frontend` so there is one lockfile and one install.

### 6.2 CI (`.github/workflows/ci.yml`)

- Triggers: `push` and `pull_request`. `permissions: contents: read`. `concurrency` cancels superseded runs.
  `timeout-minutes: 20`.
- Steps: `actions/checkout` (`persist-credentials: false`) → `pnpm/action-setup` (version from `packageManager`) →
  `actions/setup-node` (Node 24, pnpm cache) → `astral-sh/setup-uv` → `pnpm install --frozen-lockfile` → `pnpm
  setup:browsers:ci` → `pnpm check`. On failure, upload `frontend/playwright-report` with `actions/upload-artifact`
  (an artifact upload is not a repository write).
- Action versions are pinned to a major tag in the plan; Rolf may pin to commit SHAs at review. The implementer must
  look up the current major of each action at implementation time (not checkable from npm).

### 6.3 Unit tests (Vitest, `tests/unit`)

- `tokens.test.ts`: reads `globals.css`; every `--ds-*` appears once as a declaration; the semantic names listed in
  DS §15 exist; `.ws` and the dark media block contain no hex literals; the eleven type utilities exist.
- `nav.test.ts`: `isActive("/", "/")`, `isActive("/results/x", "/results")`, `/` never matches other paths.
- `footnote.test.tsx`: closed popover is not in the accessibility tree and has `display:none`; opens on click, on
  keyboard focus plus Enter, and on hover; Esc closes and returns focus to the marker.
- `swipe-compare.test.tsx`: renders a range input with an accessible name; ArrowRight changes the value and `--pos`.
- `badge-table.test.tsx`: Badge without children is a TypeScript error (type test) and renders its word; Table
  renders a labelled scroll region.

### 6.4 Playwright (`tests/e2e`)

Config: Chromium, base URL `http://localhost:3000` (`next start` after the shared build), `reuseExistingServer` off in
CI. A second project `dev` starts `next dev --port 3100` and runs only `design.spec.ts`. Next 16 writes dev output to
`.next/dev`, so it does not clobber the production build.

- `routes.ts`: `["/", "/try", "/results", "/about", "/explore", "/lab", "/this-does-not-exist"]`.
- `a11y.spec.ts`: for every route × {light, dark OS} (and `/try`, `/lab`, which are always dark), run `AxeBuilder`
  with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`; fail if any violation has impact `serious` or `critical`.
  Also runs the negative control from US3-2.
- `shell.spec.ts`, `theme.spec.ts`, `fonts-network.spec.ts`, `budget.spec.ts`, `motion-focus.spec.ts`,
  `design.spec.ts` as mapped in §5.2.
- Tests never hard-code colours: they read tokens back from the page (`getComputedStyle(document.documentElement)`).

### 6.5 Static greps (`scripts/check-tokens.mjs`)

Scans `frontend/app` and `frontend/components` (not `globals.css`, not `tests`) and fails on:
1. colour literals: `#[0-9a-fA-F]{3,8}\b`, `rgb(`, `rgba(`, `hsl(`, `oklch(`;
2. Tailwind arbitrary colour/radius/duration values: `\[#`, `rounded-\[`, `duration-\[`, `ease-\[`;
3. raw `cubic-bezier(` and `\b\d+ms\b`;
4. **metric-looking decimals** (`\b0\.\d{2,}\b`) in `app/` and `components/`, so a typed AP value cannot slip into
   a page (C-Art. I.1). The spec does not ask for this check; it is added because the constitution makes it
   non-negotiable and it costs ten lines. Rolf can remove it.

Allow-list: the overlay palette will live in `frontend/lib/overlay-palette.ts` in feature 005 and is outside the scanned
folders. 001 adds no such file.

### 6.6 Backend

`backend/tests/test_health.py`: `GET /health` returns 200 and `{"status": "ok"}`; the OpenAPI route list contains only
`/health` (guards the "shell only" rule in FR-001).

## 7. Shared components for later features

Names are final. Props are the minimum others can rely on; they will not be renamed without telling the dependent
planners. All are in `frontend/components/` and typed with TypeScript.

| Component | Props (brief) | Used by |
|---|---|---|
| `ReadingLayout` | `children`, `width?: "prose" \| "wide"` (720 px or full content width) | 004, 006, 007, 009 |
| `WorkspaceLayout` | `children` | 005, 008 |
| `PageTitle` | `children` (the h1 text), `note?: string`, `serif` always | all pages |
| `Button` | `variant?: "primary" \| "secondary" \| "text"`, `size?: "default" \| "sm"`, `arrow?: boolean`, `asChild?: boolean`, native button props | all |
| `Input` | native input props | 005 |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | shadcn API: `value`, `defaultValue`, `onValueChange`, trigger `value` | 005, 006, 008, 009 |
| `Badge` | `status: "ready" \| "processing" \| "failed" \| "neutral" \| "null"`, `children: string` (required word) | 005, 006, 009 |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `Table` needs `label: string`; `TableHead`: `numeric?`, `group?: boolean` plus `colSpan`; `TableCell`: `numeric?`, `muted?` (TTA), `strong?` (winner) | 006, 008, 009 |
| `SourceLine` | `runs: string[]`, `split: "test" \| "val"`, `seeds?: number`, `dataset?: string` (default "JODD"), `href?: string` (default "/results#sources"). Composes `Source: ab_vitl_acc_s3 · 3 seeds · JODD test split` + `Sources & data →`; runs rendered in mono | 004, 006 |
| `Footnote` | `marker: string \| number`, `summary: string`, `runs?: string[]`. Client component, dynamic-imported by pages that use it | 004, 006 |
| `Pending` | `children: string` (what is missing), `disabled?: boolean`. Renders the dashed-underline `.ph` span, text "Pending ablation" style per DS §9.8 | 006, 007, 008 |
| `Collapsible` | `summary: ReactNode`, `count?: number`, `defaultOpen?: boolean`, `children` | 005 |
| `Slider` | `label`, `value`, `onChange(value)`, `min`, `max`, `step`, `format?: (v) => string` | 005 |
| `Switch` | `label`, `checked`, `onCheckedChange(checked)` | 005 |
| `ImageWell` | `description: string` (required alt text, applied as `role="img" aria-label`), `children?` (canvas layer), `overlay?` (SVG layer), `running?: boolean` (dims overlay to 30 %), `radius?: "well" \| "compact" \| "thumb" \| "dot"` | 004, 005, 008, 009 |
| `SwipeCompare` | `before: ReactNode`, `after: ReactNode`, `beforeLabel?` ("Image"), `afterLabel?` ("Model output"), `label: string` (accessible name), `defaultValue?: number` (50) | 004, 008 |
| `cn()` | from `lib/cn` | all |

Rule for dependants: use `.ws` classes and token utilities (`bg-background`, `text-muted-foreground`, `text-ocean`…); do
not add colours, radii or durations in feature code. If a token is missing, propose a change to `docs/design-system.md`
first (C-Art. II.4).

Not provided by 001 and left to the owning feature: Drawer, DropdownMenu, TanStack Table, Sonner, charts, the overlay
palette, drop-zone, nav entries beyond the six, BibTeX block (007).

## 8. Implementation order (input for tasks.md)

1. Workspace and tooling: root `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, `.env.example`; frontend
   scaffold with versions in §2; backend scaffold. Confirm `pnpm check` runs with only a trivial test.
2. `globals.css` tokens and `tokens.test.ts` first (test-first), fonts, type utilities, base layer.
3. Layouts, nav, footer, placeholder routes, with `shell.spec.ts`, `theme.spec.ts`, `fonts-network.spec.ts`.
4. Base components and `/design`, with the unit and `design.spec.ts` tests.
5. axe, budget, motion and focus specs; `check-tokens.mjs`, `check-static.mjs`.
6. `ci.yml`; README and CLAUDE.md §4; manual keyboard and VoiceOver pass; one Lighthouse run.

## 9. Risks and open questions for Rolf

- **R1. Token name collision (DS issue).** DS §6.1 defines `--muted` as `#8A9591` (control boundary, never text), while
  DS §15 maps shadcn's `--muted` to `#EEF1F0`. Same name, two values. The plan keeps raw palette names with a `--ds-`
  prefix and gives the shadcn names only to the §15 mapping. No change to the DS is needed unless Rolf prefers one.
- **R2. GitHub repository URL** is still unknown. The nav shows `GitHub (link pending)` with no link until Rolf supplies
  it (one-line change in `lib/site.ts`). Open spec question stays open.
- **R3. Footer wording.** FR-006 says "credit lines from Handoff §1". Art. VIII.3 also requires the JODD licence and
  dataset citation on every page that shows the images. I added the licence line and the DS §16 citation to the footer.
  The Handoff cites a Data in Brief paper (doi:10.1016/j.dib.2026.112462) while DS §16 cites the dataset (doi
  10.17596/0004035, 2025). Both are real, different things; confirm that showing both is what you want.
- **R4. Typeface credit** in the footer is not in the spec. Default: not shown in the footer, listed on About by 007.
- **R5. `UPLOAD_RETENTION_HOURS`** has no agreed value (retention is still `[NEEDS CLARIFICATION]`, README open question
  4). `.env.example` leaves it blank with a comment; nothing reads it in 001.
- **R6. pnpm build-script approvals.** pnpm blocks dependency install scripts by default. The first install will need an
  approved list (expected: `@tailwindcss/oxide`, `sharp`, `unrs-resolver`). The exact setting name in pnpm 12 should
  be confirmed during task 1; it goes in `pnpm-workspace.yaml`.
- **R7. CLAUDE.md §4.** FR-001 requires the run commands to be written into `CLAUDE.md` §4, which is the agents'
  charter. I will edit only that section, and only with Rolf's approval of this plan.
- **R8. Lighthouse ≥ 95 (SC-001)** is not in US3's check command. Adding Lighthouse CI is a heavy dependency for little
  gain beyond axe, so I propose a manual run per milestone. Say if you want it automated.
- **R9. JS budget (SC-003).** Next 16 plus React 19 is roughly 100–130 KB gzip for an empty page, so 150 KB is tight
  once Footnote (Radix Popover) and Tabs ship. Mitigation: Footnote and Tabs are client islands, dynamically imported
  where used. The test runs per route so 006 and 004 find out early. If the budget fails, the fix may be a spec change.
- **R10. TypeScript 6 not 7.** Pinned for tooling compatibility (§2). Expect to revisit.
- **R11. Font features.** Whether Google's served Inter keeps `cv11`/`ss01` is unverified; fallback is local OFL files
  (§4.2). Build also needs internet access (fonts download at build time).
- **R12. Backend Python 3.12 vs the machine's 3.14.** Chosen for PyTorch compatibility in 003; 003's plan may change it.
- **R13. Home is two surfaces** (dark hero, light below, DS §10.1). 001 puts `/` in the reading group; 004 decides whether
  to wrap the hero in a `.ws` section (supported) or move the route.
- **R14. API access from the browser** (`API_BASE_URL` is not `NEXT_PUBLIC_`). 001 maps it to client code via
  `next.config.ts`. A same-origin rewrite proxy was considered and rejected for now: the proxy body limit (10 MB by
  default) equals the upload cap. 003/005 should decide.
- **R15. Action versions.** Marketplace action majors (`checkout`, `setup-node`, `pnpm/action-setup`, `setup-uv`,
  `upload-artifact`) must be looked up at implementation time; npm cannot confirm them.

## 10. Reconciliation with 006 and 007 (orchestrator, 2026-10-29)

The 006 and 007 plans were written in parallel with this one. These points make them fit; they bind 001's tasks.

- **Layout is authoritative.** 006 and 007 use this plan's tree: `frontend/app/(reading)/…`, `frontend/components/`,
  `frontend/lib/`, `frontend/tests/{unit,e2e}/`. There is no `src/` folder.
- **Build output folder is configurable from day one.** `next.config.ts` reads `distDir` from `NEXT_DIST_DIR`
  (default `.next`), and `scripts/check-static.mjs` and the Playwright `prod` project's `webServer` read the same
  variable. 006 will make `check:frontend` build with its fixture into `.next-e2e` (006 plan, R1). With this in place
  that is a one-line script change, not a rewrite of 001's files.
- **`frontend/lib/site.ts` is the single source** of the credit lines (Handoff §1), the JODD licence line and
  `GITHUB_URL`. Export the credit lines in parts (`credits.jodd`, `credits.joddPaper`, `credits.joddSeg`,
  `credits.backbones`) so 007's Acknowledgements can place links on the DOI and licence name. 007 imports them; it
  does not keep a copy.
- **`Pending` is the placeholder component** for every feature (006 "Pending export" cells, 007 pending abstract).
  Its text comes from `children`, so it is not limited to "Pending ablation".
- **CLAUDE.md §4 (R7)** is edited only after Rolf approves this plan, and only that section.

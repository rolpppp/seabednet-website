# 001 — Foundation and design system

**Status:** Ready for planning · **Phase:** 1 · **Depends on:** — · **Design:** DS §5–9, §11–13, §15

## Summary

Create the repository skeleton and the shared UI layer every page uses: the frontend app, the backend app shell, the
design tokens from `docs/design-system.md`, the three typefaces, the site navigation and footer, the reading and
workspace surfaces, the base components, and CI that enforces types, lint, tests and accessibility. No feature pages
beyond placeholders.

## User scenarios

### US1 — A visitor sees a consistent, calm shell on every page (P1)

**Acceptance scenarios**
1. **Given** any page, **When** it loads, **Then** the nav shows the wordmark, Explore, Try it, Results, About and, on
   the right, GitHub and Thesis; the current page is marked with a 2 px teal underline and `aria-current="page"`.
2. **Given** a container narrower than 760 px, **When** the page renders, **Then** the nav links collapse into a "Menu"
   text button that opens an accessible menu with the same links.
3. **Given** a reading page with the OS in dark mode, **When** it loads, **Then** it uses the dark palette (DS §6.2);
   **given** the Try it or Lab layout, **Then** it is dark regardless of OS theme.
4. **Given** any page, **When** fonts load, **Then** text uses Inter, display headings Source Serif 4 and IDs JetBrains
   Mono, served from the site's own origin with no request to Google at runtime.

### US2 — A developer builds pages only from shared tokens and components (P1)

**Acceptance scenarios**
1. **Given** the design tokens in DS §6, §7 and §15, **When** the theme is inspected, **Then** every colour, radius,
   spacing, shadow, duration and easing value exists exactly once as a CSS variable, and the `.ws` scope remaps them for
   the workspace.
2. **Given** the base components, **When** a page needs a button, input, tab set, badge, table, source line, footnote,
   collapsible, slider, switch or image well, **Then** it uses the shared component, which matches DS §9.
3. **Given** a component library default that DS §15 says to strip (card shadows, pill toggle groups, focus glow,
   bordered table wrapper), **When** the component renders, **Then** that default is absent.

### US3 — Quality gates catch regressions before Rolf commits (P1)

**Acceptance scenarios**
1. **Given** a change, **When** the check command runs locally, **Then** type checking, linting, unit tests, Playwright
   smoke tests and axe-core checks run for the frontend, and lint plus pytest for the backend.
2. **Given** a page with a serious or critical axe violation, **When** checks run, **Then** they fail.
3. **Given** the repository, **When** CI is configured, **Then** it runs the same checks on pull requests and never
   pushes, tags or comments (read-only CI).

### US4 — A style reference exists for development (P3)

**Acceptance scenarios**
1. **Given** development mode, **When** `/design` is opened, **Then** it shows each base component in its states. It is
   excluded from production builds and from the nav.

## Edge cases

- Fonts fail to load → fallback stacks from DS §15 keep layout stable (use `font-display: swap` / size-adjusted
  fallbacks).
- JavaScript disabled → nav, footer and reading pages still render and links work.
- 320 px viewport → no horizontal page scroll; tables scroll inside their own container.
- `prefers-reduced-motion` → transforms removed, fades ≤ 120 ms (DS §12).

## Functional requirements

- **FR-001** The repository has `frontend/` (Next.js App Router, TypeScript strict), `backend/` (FastAPI app with a
  `/health` endpoint only), `scripts/` and `data/`, with a root README section listing run commands, filled into
  `CLAUDE.md` §4.
- **FR-002** All tokens in DS §6–7 and §12 are defined as CSS variables in one global stylesheet, mapped to shadcn
  variable names per DS §15; the light, dark-reading and `.ws` workspace scopes are implemented.
- **FR-003** Fonts are loaded with the framework's build-time font loader (self-hosted): Inter (400/500/600, `cv11`,
  `ss01`), Source Serif 4 (400–600, `opsz`), JetBrains Mono (400/500).
- **FR-004** A type scale utility set implements DS §5.1 (display, h1–h4, body, small, caption, data, code), including
  the < 640 px reductions.
- **FR-005** Base components per DS §9: Button (primary, secondary, text; default and small; arrow variant), Input,
  Tabs (underline), Badge (status only: ready, processing, failed, neutral, null), Table styles (editorial), SourceLine,
  Footnote (popover on hover, focus and tap; docks to bottom < 560 px; removed from layout when closed), Collapsible,
  Slider, Switch, ImageWell (neutral, 4:3, canvas + SVG overlay slots), SwipeCompare (range-input based).
- **FR-006** Site layout components: Nav (DS §9.13), Footer with the credit lines from Handoff §1, ReadingLayout and
  WorkspaceLayout (`.ws`).
- **FR-007** Placeholder routes `/`, `/try`, `/results`, `/about`, `/explore` render the shell and a one-line "coming in
  feature NNN" note; `/lab` exists but is not linked from the nav.
- **FR-008** Focus styles: 2 px teal outline with 2 px offset on every interactive element; never removed.
- **FR-009** Reduced-motion handling per DS §12 is global.
- **FR-010** A single check command runs all frontend and backend checks; CI runs it on pull requests with read-only
  permissions.
- **FR-011** Environment configuration: `.env.example` documents `SEABEDNET_REPO`, `API_BASE_URL`, `SAMPLES_ENABLED`
  (default `false`), `UPLOAD_RETENTION_HOURS`. Real `.env` files are git-ignored.
- **FR-012** The Results/About/Explore pages are statically generated; Try it and Lab are client-rendered against the
  API (C-Art. VII.3).

## Key entities

- **Design token** — name, light value, dark value, workspace value, DS reference.
- **Base component** — name, variants, states, DS reference.

## Success criteria

- **SC-001** Lighthouse accessibility ≥ 95 and axe: 0 serious/critical on every placeholder route, light and dark.
- **SC-002** No hard-coded colour, radius or duration values outside the token stylesheet (enforced by a lint rule or
  a grep check in CI).
- **SC-003** First load of a reading page transfers ≤ 150 KB of JS (gzip) excluding fonts.
- **SC-004** Zero network requests to third-party origins on any page.
- **SC-005** No horizontal scroll at 320 px on any route.

## Out of scope

Page content (features 004–009), the inference API (003), data export (002), deployment.

## Open questions

- ~~Package manager~~ — resolved 2026-10-29: **pnpm**.
- ~~Where CI runs~~ — resolved 2026-10-29: **GitHub Actions** on push and pull requests, read-only permissions, running
  the same single check command that runs locally (FR-010).
- [NEEDS CLARIFICATION: GitHub repository URL for the nav's GitHub link]

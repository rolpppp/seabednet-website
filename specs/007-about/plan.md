# 007 — About: implementation plan

**Status:** Draft for review · **Spec:** [spec.md](spec.md) · **Depends on:** 001 (plan not yet seen; see "What 007 expects from 001") ·
**Design:** DS §10.4, §5, §6.4, §9.8, §13, §14 · **Facts:** Handoff §1–2

## 1. Summary

Replace 001's placeholder `/about` route with the real page: a single 720 px editorial column holding the exact title,
subtitle and byline, a links row, the abstract, "How it works" with an inline SVG architecture figure, a citation block
with a "Copy BibTeX" button, and acknowledgements. The page is statically generated. The only client-side code is the
copy button. The page shows no numbers, no JODD images and no cards.

Three decisions shape everything else:

1. **One typed content module** (`frontend/content/thesis.ts`) holds every fixed fact. The byline, `<title>`, BibTeX,
   JSON-LD and credits are all produced from it, so they cannot drift.
2. **Unknown facts are explicit states, not empty strings.** The abstract and the three links carry a `status` of
   `pending`, `public` or (links only) `withheld`. A pending abstract renders a visible placeholder. A pending link is
   omitted (spec edge case). A separate release test fails if anything is still pending.
3. **The BibTeX test reads Handoff §1 itself**, so SC-001 compares against the source and not against a second copy
   typed into a test.

## 2. Technical context

| Item | Value |
|---|---|
| Language / framework | TypeScript (strict), Next.js App Router, React Server Components. Versions are recorded by 001's plan; 007 adds none. |
| Styling | Tailwind v4 utilities over the DS tokens from 001's `globals.css`. No new tokens, no hard-coded colour, radius or duration (001 SC-002). |
| New dependencies | **None.** Clipboard uses the browser API. No icon or diagram library. |
| Rendering | Static (C-Art. VII.3, 001 FR-012). `page.tsx` is a server component with no dynamic APIs. The only `"use client"` file is `CitationBlock.tsx`. |
| Data | None from `site_data.json`. See §4 (Article I). |
| Tests | Playwright + `@axe-core/playwright` only. Every test here runs in the browser runner, so 007 does not depend on whether 001 installs a unit-test runner. |
| Package manager | pnpm (resolved). |
| Environment | None needed. `SAMPLES_ENABLED` is not read, because the page shows no JODD image. |
| Performance | The page adds about 1 KB of client JS (copy button). It must stay inside 001's 150 KB budget (001 SC-003). |

## 3. What 007 expects from 001, and what 007 creates

### 3.1 Expected from 001 (reconcile with 001's plan)

| Expected | Used for | If 001 names it differently |
|---|---|---|
| Tokens and Tailwind mapping: `--bg`, `--text`, `--text-2`, `--subtle`, `--border`, `--ocean`, focus ring; type scale utilities `h1`, `h3` (serif), `h4`, `body`, `small`, `caption`, `code` | All text and the figure | 007 only uses names from DS §5.1 and §6 |
| Fonts: Source Serif 4, Inter, JetBrains Mono as `font-serif`, `font-sans`, `font-mono` | Title (serif), BibTeX (mono) | — |
| `ReadingLayout` (page padding, light/dark reading theme, nav and footer around it) | Page shell | 007 adds only a `max-w-[720px]` column inside it |
| `Nav` with a "Thesis" link whose `href` is `/about`, and `aria-current="page"` on About | US1 context, nav test | If 001 hard-codes another target, 007 raises it with 001 |
| `Footer` with the Handoff §1 credit lines | Shared credits | See risk R6: whichever of 001 or 007 lands first creates the credit data; the other imports it |
| `Button` text variant with the optional trailing arrow (DS §9.1), usable on an `<a>` (`asChild` or a `TextLink` wrapper) | Links row; "Copy BibTeX" (small size) | If only `<button>` exists, 007 asks 001 for the link form; it does not restyle one locally |
| A `.ph` placeholder style (dashed underline, DS §9.8), preferably a `<Placeholder>` component | Pending abstract | If absent, 007 adds a three-line `Placeholder` in `components/ui/` and tells 001 |
| Visually-hidden utility (`sr-only`, Tailwind built-in) | Figure text alternative, copy status | Built in |
| Global focus style (2 px `--ocean`, 2 px offset) and reduced-motion handling | All interactive elements | — |
| A Playwright config (base URL, projects incl. a 320 px viewport) and an axe helper, for example `expectNoSeriousViolations(page)` | All e2e tests | If 001 has no helper, 007 uses `AxeBuilder` directly in a small local function |
| The `/about` placeholder route, `frontend/app/(reading)/about/page.tsx` | Overwritten by 007 | 007 edits one 001-owned file; this is intended |

### 3.2 Created by 007

| Piece | File | Notes |
|---|---|---|
| Content module (all fixed facts, link and abstract states, BibTeX builder, credits) | `frontend/content/thesis.ts` | Single source |
| Page | `frontend/app/(reading)/about/page.tsx` | Server component; `metadata`; JSON-LD script |
| Citation block with copy button | `frontend/components/about/CitationBlock.tsx` | Client component. Not a general component yet; promote to `components/` only if a second page needs it |
| Architecture figure (inline SVG, caption, text alternative) | `frontend/components/about/ArchitectureFigure.tsx` | Server component; no JS |
| JSON-LD builder | `frontend/lib/about-jsonld.ts` | Pure function from `thesis.ts`; escapes `<` |
| Tests | see §8 | |

007 creates **no** shared base component. Everything it needs from DS §9 comes from 001.

## 4. Constitution check

| Article | Verdict |
|---|---|
| I. Every number is traceable | **Pass.** About shows no metric. "How it works" is prose, and the headline AP is not shown; the page links to Results ("Read the results →") so the number lives where it has provenance. The figure contains two architecture constants (input 640 × 480, ViT-L/14), which are model definition, not results; the test list in §8 asserts that no text on the page matches a decimal metric pattern. Fixed thesis facts (adviser, URLs, abstract) use visible placeholders (I.8). |
| II. Design system binding | **Pass, with two corrections to the wireframe** (R4, R5): figure text below the DS 12 px floor, and stroke colours that fail non-text contrast. No cards, no filled blocks, no teal inside any image (there is no image). |
| III. Accessible by default | **Pass by test.** axe 0 serious/critical in light and dark, manual keyboard pass, 44 px targets, status announced by live region, no third-party requests. |
| IV. Model fidelity | **Not applicable** (no inference). Text describes B0 as in Handoff §2, with decoupled heads; no DAPFT, no RGB/HSV/CIELAB. |
| V. Humans own version control | **Pass.** Plan and implementation leave files in the working tree; Rolf commits. |
| VI. Spec first | **Pass.** Every FR and scenario maps to a file and a test (§6). Spec issues are listed in §10 and not worked around in code. |
| VII. Simplicity | **Pass.** No new dependency, framework or state manager. One client component. Static page. |
| VIII. Privacy and uploads | **Pass.** No upload, no cookies, no analytics. **No JODD image is shown**, so `SAMPLES_ENABLED` is irrelevant here. The JODD citation and CC BY-NC-SA 4.0 licence are still credited in Acknowledgements (Handoff §1, FR-005). |

## 5. Files 007 adds or changes

```
frontend/
  content/
    thesis.ts                         NEW  fixed facts, states, buildBibtex(), credits
  lib/
    about-jsonld.ts                   NEW  ScholarlyArticle JSON-LD from thesis.ts
  components/about/
    ArchitectureFigure.tsx            NEW  inline SVG + caption + text alternative
    CitationBlock.tsx                 NEW  "use client": BibTeX block + copy button + status
  app/(reading)/about/
    page.tsx                          CHANGED (001 placeholder replaced)
  tests/e2e/
    about.spec.ts                     NEW  scenarios, FRs, axe, keyboard, 320 px
    about.release.spec.ts             NEW  release gate; skipped unless RELEASE=1
    helpers/handoff.ts                NEW  extracts the BibTeX fence and title from Handoff §1
  package.json                        CHANGED  one script: "test:release" (RELEASE=1 playwright test about.release)
specs/007-about/
  plan.md                             this file
  tasks.md                            later
```

Nothing under `backend/`, `scripts/`, `data/` or `docs/` changes.

## 6. Design in detail

### 6.1 Content module: `frontend/content/thesis.ts`

Why a module and not MDX or inline JSX: the same values feed five outputs (visible byline, `<title>`, BibTeX, JSON-LD,
credits), and TypeScript can force the pending states to be handled. MDX would hide the BibTeX inside prose.

Shape (illustrative, not final code):

```ts
type Pending = { status: "pending" };
type Withheld = { status: "withheld" };            // Rolf decided not to publish it
type Public<T> = { status: "public" } & T;

export const thesis = {
  title: "SeaBed-Net",
  subtitle: "Multicolor Hybrid CNN-ViT for Dual-Task Underwater Object Detection and Instance Segmentation",
  author: { given: "Rolf Genree L.", family: "Garces" },
  programme: "BS Computer Science",
  institution: "University of the Philippines Tacloban",
  place: "Tacloban City, Philippines",
  year: 2026,
  adviser: "John Paul T. Yusiong, PhD",
  bibtexKey: "garces2026seabednet",
  bibtexType: "Undergraduate thesis (BS Computer Science)",
  links: {
    paper:   Pending | Withheld | Public<{ href: string }>,
    code:    ...,
    dataset: ...,
  },
  abstract: Pending | Public<{ paragraphs: string[] }>,   // starts as Pending
} as const;

export const fullTitle = `${thesis.title}: ${thesis.subtitle}`;
export function buildBibtex(t = thesis): string { /* template that reproduces Handoff §1 exactly */ }
export const credits = { jodd: {...}, joddPaper: {...}, joddSeg: "...", backbones: [...] };
```

Rules:

- The visible byline, the `<title>`, `buildBibtex()` and the JSON-LD all read `thesis`. The visible h1 plus subtitle
  concatenate to `fullTitle`, which is also the BibTeX `title`. A reviewer who changes the title edits one line.
- `buildBibtex()` emits the Handoff §1 block byte for byte (field alignment, one-line title, `\n` line ends, no trailing
  newline). The test compares it with the Handoff fence (§8).
- `abstract` ships as `{ status: "pending" }`. Rolf's final text goes in as `paragraphs`. It is not taken from the
  manuscript (Handoff §2 warns it describes the proposal-era design).
- `links.*` ship as `{ status: "pending" }`. Rolf sets `public` with an `href`, or `withheld` if he decides to leave a link
  out for good (for example, no public PDF).
- `credits` holds the strings FR-005 specifies, in parts, so links can be placed on the DOI and the licence name:
  - JODD: "Takaki Nishio, Yuki Kawae (2025). J-EDI Organism Detection Dataset (JODD). JAMSTEC." + `https://doi.org/10.17596/0004035`
  - Licence: "CC BY-NC-SA 4.0", linked to the Creative Commons licence page (the canonical licence URL; a fact about the licence,
    not about the thesis)
  - Data paper: Nishio & Kawae, *Data in Brief* 65, 112462, 2026, `doi:10.1016/j.dib.2026.112462`, linked to
    `https://doi.org/10.1016/j.dib.2026.112462`
  - JODD-Seg: SAM 3 pseudo-masks reviewed by three people, released under the same licence
  - ConvNeXt-T (ImageNet), DINOv2 (Meta) as plain text. No URLs are given in the repo for these, so none are added.
- No metric, no date other than the year, and no URL that the repo does not state.

### 6.2 Page: `frontend/app/(reading)/about/page.tsx`

Server component inside 001's `ReadingLayout`. One `<article>` with `max-w-[720px]`, centred, section gap 48–64 px
(DS §7 rhythm), no cards (FR-001). Order and semantics:

1. `<header>`: `<h1>` "SeaBed-Net" (serif, DS `h1`), `<p>` subtitle (serif, DS `h3`, `--text-2`), byline as three lines
   (author; `programme · institution · year`; `Adviser: …`), then a links row.
2. Links row: a `<nav aria-label="Thesis links">` is not needed; use a plain `<ul>` of text links with arrows. Render only
   links whose `status === "public"` (spec edge case: omitted, never dead). If none are public, render nothing.
   Links open in the same tab (no `target=_blank`), so no extra "opens in new tab" text is needed.
3. `<section aria-labelledby>` **Abstract** (`<h2>` styled as DS `h4`):
   - `public`: paragraphs in body type.
   - `pending`: a `<p data-placeholder="abstract">` using the `.ph` style with this text: "Abstract pending. The final text,
     describing the deployed model, has not been added yet." This is the visible placeholder required by Art. I.8.
     The proposal-era abstract is never used.
4. `<section>` **How it works**: one paragraph (§6.3) and `<ArchitectureFigure />`.
5. `<section>` **Citation**: `<CitationBlock bibtex={buildBibtex()} />`.
6. `<section>` **Acknowledgements**: a single paragraph assembled from `credits` (FR-005). Links are real `<a>` with
   underline in `--muted` (DS §9.1 text-link style).
7. `<script type="application/ld+json">` with the output of `about-jsonld.ts`.

Headings: one `<h1>`, four `<h2>`. Landmarks come from 001's layout (`header`, `nav`, `main`, `footer`).

`export const metadata`: `title` is "About" (001's title template adds the site name; confirm in 001's plan), and
`description` is built from `thesis` (author, institution, year). It does not include the abstract while that is
pending.

### 6.3 "How it works" copy

Use the wireframe paragraph. It agrees with Handoff §2 and contains no number:

> Each image is processed three ways for colour, then read by a ConvNeXt and a DINOv2 vision transformer side by side.
> Their features are blended at every scale, and two separate heads predict boxes and masks.

Add one sentence required by C-Art. IV.5 and DS §14: the two heads are decoupled, so the number of boxes and masks for one
image can differ. (This is Handoff §2 wording, not new fact.) Close with a text link "Read the results →" to `/results`,
which is where the numbers live (Art. I). The link is a route inside the site, so it can never be dead.

Copy is reviewed against DS §14: sentence case, no "AI-powered".

### 6.4 Architecture figure: `ArchitectureFigure.tsx`

**Source.** The only source in this repo is the inline SVG in `docs/design/wireframes-v4.html` (the `.archfig` block), with
the pipeline text in Handoff §2 and `WEBSITE_PLAN_2026-10-27.md` row 4. **There is no thesis figure or Mermaid source in
the repo**, and the thesis repo is unavailable. The plan ports the wireframe SVG to JSX. It is a hand-redrawn figure, not
a copy of a manuscript figure; the caption must not claim otherwise.

**Changes from the wireframe**, each needed to meet the DS or avoid an unsupported claim:

| Wireframe | Plan | Reason |
|---|---|---|
| Sub-labels "texture and edges" (ConvNeXt-T) and "scene context" (DINOv2) | **Omit**; use "CNN branch" and "ViT branch" | Neither phrase is in Handoff §2 or the plan. They claim what each branch learns. This is an invented-fact risk (Art. I.8). Rolf may add them back if the thesis supports them (R2). |
| "Pyramid" node between fusion and heads | Rename "FPN" | Handoff §2 says FPN. |
| Fusion sub-label "per level, then FPN" | "convex gated, per pyramid level" | Matches Handoff §2 "convex gated late fusion, once per pyramid level". Then FPN is its own block. |
| `viewBox` 760 wide, `min-width:540px`, 11 px labels | Redraw at `viewBox` 720 wide; labels 13 px, sub-labels 12 px; `min-width:720px` so scale is never below 1 | At 540/760 the 11 px label renders near 8 px, below the DS 12 px caption floor. The figure scrolls inside its own container below 720 px. |
| Box stroke `--border`, connector `--muted` | Both `--text-2` at 1 px | DS §6.4: `--border` is structure only, and `--muted` is 2.90 on `--bg`. `--text-2` is 4.75 on `--bg`, so boundaries and arrows pass 3:1 in light; verify in dark (T-A11Y). |
| No arrowheads | Add small open arrowheads (SVG `marker`) | The flow direction is otherwise carried by position alone. |
| Boxes link to ablations | **No links in v1.** | FR-003 says "when 008 exists". The component takes an optional `href` per block so 008 can fill them without a redesign. |

**Accessibility (FR-003).**

- `<figure>` with `<figcaption>`: "Figure 1. The deployed model (B0)." plus a note that it is redrawn from the model
  definition. Caption in DS `caption` type.
- The `<svg>` is `aria-hidden="true"` (it is decorative once a text equivalent exists, and v1 has no links inside it).
- The text alternative is an ordered list inside the figure: `<ol class="sr-only" aria-label="Figure 1 as text">`, one
  `<li>` per step in reading order, for example: "Input: RGB image, 640 by 480." / "Colour stems: three shallow ConvNeXt
  stems on RGB, RedComp and Shades-of-Gray, merged at stride 4." / "Two branches in parallel with no exchange between them:
  ConvNeXt-T and DINOv2 ViT-L/14." / "Convex gated late fusion, once per pyramid level." / "FPN." / "Two decoupled heads
  from the FPN: TOOD for detection, class and box; SOLOv2 for instance masks, without boxes." Every phrase is Handoff §2.
  The figure has `aria-labelledby` pointing at the caption.
- It is `sr-only`, not a visible `<details>`, to follow DS §2 (no extra chrome). The "How it works" paragraph already
  gives sighted users the same content.
- The scroll container is `overflow-x:auto` with `tabindex="0"`, `role="group"` and an `aria-label` ("Figure 1, scrolls
  sideways"), so keyboard users can scroll it and axe's `scrollable-region-focusable` passes. Focus ring comes from 001.
- Dark mode: all colours via tokens (`currentColor`, `fill`/`stroke` set by class to token variables), so no separate
  asset.

Once 008 exists, the ablation links go into the `<ol>` (real, focusable links) and may be mirrored in the SVG using
`<a>` elements; at that point `aria-hidden` on the SVG has to be removed or the links kept only in the list. That is 008's
task.

### 6.5 Citation block and copy behaviour: `CitationBlock.tsx`

Markup (server-rendered, so it works without JavaScript):

```
<section aria-labelledby="citation">
  <div class="flex items-baseline justify-between gap-4 flex-wrap">
    <h2 id="citation">Citation</h2>
    <button type="button" hidden>Copy BibTeX</button>      // unhidden after mount
  </div>
  <pre class="font-mono bg-subtle text-foreground p-4 rounded-control whitespace-pre-wrap [overflow-wrap:anywhere]">
    <code>{bibtex}</code>
  </pre>
  <span role="status" class="sr-only">{statusMessage}</span>     // always in the DOM
</section>
```

- **Same string shown and copied.** The `<pre>` shows `bibtex` and the button copies `bibtex` (the prop, not
  `textContent`), so there is no whitespace rewriting like the wireframe's regex. `white-space: pre-wrap` wraps the long
  `title` line visually without changing the text.
- **Colours.** `--text` on `--subtle` (not `--text-2`, which fails AA there, DS §6.4). 13 px mono per DS `code`. No
  horizontal scroll, so no scrollable-region problem.
- **Without JavaScript** the button stays hidden (a button that does nothing is worse than none) and the BibTeX is still
  visible and selectable.

Behaviour (a small state machine: `idle | copied | manual`):

1. **Click, Clipboard API available** (`navigator.clipboard?.writeText` exists and the promise resolves): state `copied`.
   Button label becomes "Copied". The live region text becomes "BibTeX copied to the clipboard." After **1800 ms** (spec
   "~1.8 s") the label returns to "Copy BibTeX" and the live region is cleared. A second click during the window restarts
   the timer. The timer is cleared on unmount.
2. **Click, API missing or the promise rejects** (insecure context, permission denied): select the `<pre>` contents with
   `window.getSelection().selectAllChildren(codeEl)` and set state `manual`. Button label becomes "Press Ctrl/⌘+C to
   copy". Live region: "BibTeX selected. Press Control or Command plus C to copy." The state resets after **8 s**, or on
   the next click, or when the selection is cleared (`selectionchange`) so a stale hint does not stay.
3. **Focus** stays on the button in every state. Nothing steals focus; no toast, no dialog.
4. **Accessible feedback.** The button's own label change is not reliably announced, so the persistent `role="status"`
   region (polite) carries the message. It is in the DOM from first render and its text is changed, because live
   regions inserted with their content already inside are often skipped.
5. **Visual feedback** is the label text only. No colour change as the sole signal, no motion (so nothing for
   `prefers-reduced-motion` to remove). The button is DS small text button: 32 px, 44 px on touch.
6. **Layout stability.** The label alternates between three strings of different lengths; the button sits in a flex row
   with `justify-between` and may wrap under the heading on 320 px. `min-width` is not forced, to avoid a large gap.

Important deployment risk (R3): `navigator.clipboard` exists **only in secure contexts** (https or localhost). The site is
to run on the lab PC. If it is served over plain `http://<lan-address>`, the Clipboard API is undefined and the fallback
in step 2 becomes the normal path. The fallback is therefore a first-class path and has its own test. See open question
Q5 about adding `document.execCommand("copy")` as a second attempt before showing the manual hint.

### 6.6 JSON-LD (FR-006): `lib/about-jsonld.ts`

A pure function returning `{"@context":"https://schema.org","@type":"ScholarlyArticle", headline, name, author: Person,
publisher/sourceOrganization: CollegeOrUniversity, datePublished: "2026", inLanguage: "en"}` built from `thesis`.
Rules:

- Serialised with `JSON.stringify` and `<` replaced by `<` before it goes into the script tag.
- **Omitted until known:** `url` (domain is open, README Q5), `abstract` (pending), any PDF `encoding`/`sameAs`,
  `datePublished` finer than the year (the manuscript says September 2026, but the repo does not say that is the
  publication date).
- The adviser is not included (smallest output that meets FR-006).
- Spec conflict S3: schema.org has a `Thesis` type, which fits an undergraduate thesis better than `ScholarlyArticle`.
  The plan follows the spec as written and asks Rolf.

### 6.7 Placeholders and the release gate

How they look (Art. I.8, DS §9.8):

- **Abstract pending:** dashed-underline `.ph` text on the page, as in §6.2. It carries `data-placeholder="abstract"`.
  It is visible to everyone, including screen readers, and reads as a plain sentence, not as `[TODO]`.
- **Link pending:** omitted, per the spec edge case. There is no visible placeholder for a link, so a pending link is
  invisible to a reviewer. This is why the release gate must check the content module and not only the DOM.
- **Withheld link:** omitted by choice; the gate allows it.

How the build fails on release (answering "or explain why that is left to Rolf"): ordinary CI must still pass while
placeholders exist, because 007 would otherwise block every other feature until the abstract is written. So the gate is
a separate, opt-in test, run by Rolf (or by the deployment step) before the defence:

- `frontend/tests/e2e/about.release.spec.ts` is skipped unless `RELEASE=1`. It asserts, against the running page:
  1. `page.locator("[data-placeholder]")` count is 0;
  2. `thesis.abstract.status === "public"` and the abstract has at least one non-empty paragraph;
  3. each of `paper`, `code` and `dataset` is `public` with an `https://` `href`, or explicitly `withheld`; none is
     `pending`.
- `pnpm test:release` runs it. It is **not** part of the single check command (001 FR-010).
- The gate lives in a test, so it cannot be forgotten silently, but it only fires if somebody runs it. Wiring it into the
  deployment script is out of 007's scope (deployment is not in the roadmap yet). **That wiring is left to Rolf**, and the
  plan records it as open question Q6.

### 6.8 JODD images, licence and `SAMPLES_ENABLED`

The About page shows **no JODD image** (and no image at all). Therefore:

- Art. VIII.3's "behind `SAMPLES_ENABLED`" does not apply to this page and the flag is not read.
- A test asserts `page.locator("img").count() === 0`, so adding an image later is a conscious change that must also
  address attribution and the flag.
- The Acknowledgements still carry the JODD citation, CC BY-NC-SA 4.0 and the JODD-Seg same-licence statement, which is
  also what Art. VIII.3 requires of any page that does show them.

## 7. Requirement mapping

### 7.1 Functional requirements

| FR | Delivered by | Verified by |
|---|---|---|
| FR-001 single column, max 720 px, no cards | `page.tsx` wrapper `max-w-[720px]`; no card component used | `about.spec.ts` "column": article `boundingBox().width <= 720`; "no cards": no element in `main` has a box-shadow or a `rounded` + border combination other than the BibTeX block (query computed style) |
| FR-002 exact title, author, course, institution, year | `thesis.ts` → `page.tsx` header | "header facts" test (US1-1) |
| FR-003 accessible inline SVG, hairline boxes, text alternative, caption; links when 008 exists | `ArchitectureFigure.tsx` | "figure" tests: figure has caption; `<ol>` text alternative exists and lists 6 steps in order; SVG has no `fill` other than `none`; scroll container is focusable; axe. Links deferred to 008 |
| FR-004 BibTeX mono on `--subtle`, copy button | `CitationBlock.tsx` | US3 tests; computed style of `<pre>` background = `--subtle`, font-family mono |
| FR-005 acknowledgements with credit lines | `credits` in `thesis.ts`, rendered in `page.tsx` | "credits" test: text contains the exact JODD citation string, the DOI links resolve to the right `href`, licence link text "CC BY-NC-SA 4.0", data-paper reference, "SAM 3", "three", ConvNeXt-T, DINOv2 |
| FR-006 static + ScholarlyArticle JSON-LD | `page.tsx` (no dynamic APIs), `about-jsonld.ts` | "json-ld" test: parse the script, `@type === "ScholarlyArticle"`, `headline === fullTitle`, no `abstract` while pending. Static: the production build lists `/about` as static (checked in 001's build step; noted in tasks) |

| SC | Verified by |
|---|---|
| SC-001 title and BibTeX match Handoff §1 character for character | `helpers/handoff.ts` reads `WEBSITE_HANDOFF_SEABED_LENS.md` (path from repo root), extracts the first ```` ```bibtex ```` fence and the title. Asserts: `buildBibtex()` equals the fence; the DOM `<code>` text equals the fence; the clipboard text equals the fence; `h1 + ": " + subtitle` equals the BibTeX `title` field |
| SC-002 axe 0 serious/critical | `about.spec.ts` "axe", light and dark (`colorScheme` emulation), plus with the copy button in the `manual` state |

### 7.2 Acceptance scenarios

| Scenario | Test (file `about.spec.ts`) |
|---|---|
| US1-1 header | Load `/about`. Expect `h1` text "SeaBed-Net"; subtitle text; author; `BS Computer Science · University of the Philippines Tacloban · 2026`; `Adviser: John Paul T. Yusiong, PhD`. h1 computed font-family starts with Source Serif 4 |
| US1-2 links row | For each of paper, code, dataset in `thesis.ts`: if `public`, a link with that exact text ("Paper (PDF)", "Code", "Dataset") and `href` exists and is an `<a>`; else no link with that text exists (not dead, not disabled). Click-through is not tested against the network |
| US2-1 how it works | Section "How it works" has exactly one paragraph before the figure plus the decoupled-heads sentence in it; the text alternative names RGB, RedComp, Shades-of-Gray, ConvNeXt-T, DINOv2 ViT-L/14, convex, FPN, TOOD, SOLOv2. Page text contains none of `HSV`, `CIELAB`, `gated fusion` as an input design, `DAPFT` (guards against the proposal-era abstract leaking in) |
| US3-1 copy | Grant `clipboard-read`/`clipboard-write`. Click "Copy BibTeX". Read clipboard: equals Handoff fence. Button text "Copied". `role=status` region says copied. With Playwright's `page.clock`, advance 1700 ms: still "Copied"; advance to 1900 ms: "Copy BibTeX" |
| US3-1 fallback | `addInitScript` sets `navigator.clipboard` to `undefined`. Click. Button text contains "Ctrl" and "⌘"; `window.getSelection().toString()` equals the fence; status region has the manual message. Repeat with `writeText` that rejects |
| Edge: abstract pending | Branches on `thesis.abstract.status`. Pending: one `[data-placeholder="abstract"]` is visible and the page contains no abstract prose. Public: no placeholder, paragraphs present |
| Edge: PDF not public | Covered by US1-2: no Paper link when `paper.status !== "public"` |

### 7.3 Other tests

| Test | What it checks |
|---|---|
| Nav: Thesis link | The nav link "Thesis" has `href="/about"`, and on `/about` the "About" link has `aria-current="page"`. (Depends on 001's Nav.) |
| No images | `img` count is 0 (§6.8) |
| No numbers | `main` text matches no `/\b0\.\d{3,4}\b|\b\d+(\.\d+)?\s*(AP|AP50|%)\b/`. Allowed constants "640 × 480", "ViT-L/14", "SAM 3", "CC BY-NC-SA 4.0", "Data in Brief 65" do not match |
| No third-party requests | Collect `page.on("request")` origins; all are the site's own (001 SC-004) |
| JS disabled | `javaScriptEnabled: false` context: BibTeX visible, no "Copy BibTeX" button, all other sections present |

## 8. Test plan

Files: `about.spec.ts`, `about.release.spec.ts`, `helpers/handoff.ts`. Runner: Playwright, with 001's config and axe
helper. Browsers: Chromium for the full set; the clipboard tests also run in WebKit where permissions allow (Safari's
clipboard rules differ), and are marked as Chromium-only if the permission API is unavailable.

**Automated**

1. Scenario and FR tests from §7.
2. axe (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` tags): 0 serious and critical. Run at 1280 px and 320 px, in light and
   dark, and again with the copy button in the `manual` state.
3. Viewport: at 320 px, `document.documentElement.scrollWidth <= innerWidth` (001 SC-005); the figure scrolls inside its
   own container.
4. Reduced motion: with `reducedMotion: "reduce"` the page has no transform animations (there are none; test asserts
   no running animations via `document.getAnimations().length === 0`).
5. Keyboard pass (scripted): press Tab from the top. Expect order: skip link and nav (001), the public links in the links
   row, the scrollable figure, "Copy BibTeX", the Acknowledgement links, footer. On "Copy BibTeX": Enter and Space each
   copy; focus does not move; the focus outline is 2 px `--ocean` (computed `outline-width`, `outline-offset`); the
   button's box is at least 32 px high on fine pointers and 44 px under `hasTouch` emulation.
6. `about.release.spec.ts` (opt-in, §6.7). Expected to **fail today** and to pass only after Rolf fills the content.

**Manual (before marking 007 done; Art. III.2)**

- Keyboard-only walk-through with focus visible at 200% zoom.
- VoiceOver (Safari, macOS): heading list shows h1 and four h2; the figure reads as a figure with its caption and the
  step list; "Copy BibTeX" announces the status message.
- Phone width: copy fallback path on iOS Safari over the real network address.
- Read the page with the stylesheet removed; the hierarchy still holds (DS §2 test 6).

## 9. Task shape (for tasks.md later)

Order: (1) `thesis.ts` + `handoff.ts` helper + BibTeX equality test (red then green); (2) `page.tsx` header, abstract,
links, acknowledgements + their tests; (3) `ArchitectureFigure.tsx` + tests; (4) `CitationBlock.tsx` + copy tests;
(5) JSON-LD; (6) axe, 320 px, keyboard, JS-disabled; (7) release spec and `test:release` script; (8) manual pass. Tasks
(2), (3) and (4) are parallel after (1).

## 10. Risks and open questions

### Spec conflicts and issues (report to Rolf; spec.md is not edited by this plan)

- **S1. FR-003 vs this milestone.** "Each block links to the ablation that tests it when 008 exists." The plan ships no links
  and keeps an optional `href` per block. Please confirm that is acceptable.
- **S2. US1-2 vs edge case.** US1-2 says the three links "open their targets"; the edge case says a non-public PDF is
  omitted. The plan reads US1-2 as applying to the links that exist, and uses the `pending/public/withheld` states.
- **S3. FR-006 type.** `ScholarlyArticle` is specified; `Thesis` is the closer schema.org type. Plan follows the spec.
- **S4. "Dataset" is ambiguous.** The Dataset link should be the JODD-Seg dataset (spec open question). The known URL in the
  repo is the JODD DOI, which is JAMSTEC's dataset, not JODD-Seg. The plan does **not** reuse the JODD DOI for the
  Dataset link; the DOI appears only in Acknowledgements.
- **S5. Code link and nav GitHub link.** 001's open question (GitHub repo URL for the nav) is the same fact as 007's Code
  link. They should read one value. Proposal: `links.code` in `thesis.ts` is the source and 001's Nav imports it, or both
  use one constant in `frontend/lib/site.ts`. Needs agreement with 001's plan.
- **S6. Wireframe figure text.** The wireframe's "texture and edges" and "scene context" labels are not in Handoff §2 or
  the plan. Treated as invented-fact risk and omitted (see §6.4).

### Invented-fact risks found

- The two sub-labels above (S6).
- Any abstract text: none is written here. The placeholder is the only text.
- Page `<title>` and meta description are generated from known facts only.
- The CC BY-NC-SA 4.0 licence page URL is general knowledge, not from the repo. It is the canonical licence URL and is
  low risk, but Rolf should glance at it.
- "Figure 1 ... redrawn from the model definition" in the caption is an accurate statement about this site's figure; it is
  not a claim about the manuscript.

### Risks

- **R1. Token naming.** The wireframe CSS uses `--muted` as a stroke; DS §15 maps shadcn `--muted` to `#EEF1F0` while DS
  §6.1 says `--muted` is `#8A9591`. 007 uses only DS §6 names (`--text`, `--text-2`, `--subtle`, `--ocean`). Whatever 001
  decides to expose, 007 follows. (Possible DS inconsistency to raise with Rolf.)
- **R2. Figure labels.** If Rolf wants the role sub-labels back, he must confirm them from the thesis.
- **R3. Clipboard on plain http.** See §6.5. Mitigated by the fallback and its test.
- **R4. Figure on phones.** Scrolling a 720 px figure inside a 320 px screen is poor but compliant. A stacked vertical
  layout below 640 px would be better and costs a second SVG; not done unless Rolf asks.
- **R5. Non-text contrast** of the figure is verified by measurement in light and dark during implementation; if
  `--text-2` strokes look heavy, a lighter token must still hit 3:1 against the page background (DS §6.4 decides).
- **R6. Credit data shared with the footer.** Handoff §1 requires the credits on About and in the footer. Two copies would
  drift. Proposal: the credit strings live in `thesis.ts` (or a `credits.ts` beside it) and 001's Footer imports them. If
  001 lands first with its own strings, 007 refactors the Footer to import them, which touches a 001 file and needs
  Rolf's nod. Orchestrator to decide ownership.
- **R7. Test reads the Handoff file.** SC-001 compares against `WEBSITE_HANDOFF_SEABED_LENS.md`, a "background only"
  document. If that file is moved or its fence reformatted, the test fails loudly (intended). Alternative: copy the
  fence to `frontend/tests/fixtures/bibtex.txt`, which is a second source and can drift. The plan prefers reading the
  Handoff.
- **R8. Sharing the one 001 file.** `app/(reading)/about/page.tsx` is created by 001 (FR-007) and replaced by 007. Merge order:
  001 first.
- **R9. Indexing before the defence.** JSON-LD helps search engines, but whether the site is public at all is README Q5. If
  it stays on campus, JSON-LD is harmless.

### Open questions for Rolf

- **Q1.** Final abstract text describing B0 (B0 / spec open question). Until then the page shows the placeholder.
- **Q2.** Public URLs for Paper (PDF), Code and Dataset (JODD-Seg), and whether each is public. Until then the links are
  omitted.
- **Q3.** S3: `ScholarlyArticle` or `Thesis` for the JSON-LD type?
- **Q4.** May the figure omit the role sub-labels (S6), or can Rolf supply wording from the thesis?
- **Q5.** For the copy button on plain http: add `document.execCommand("copy")` as a second try before the manual hint?
  (Better on the lab PC, deviates slightly from the spec text, which goes straight to "press Ctrl/⌘+C".)
- **Q6.** Who wires `pnpm test:release` into the pre-defence or deployment step? Plan assumes Rolf.
- **Q7.** Is a stacked mobile layout for the figure wanted (R4)?

## Reconciliation with 001 (orchestrator, 2026-10-29)

Written after 001's plan was available. These override earlier sections of this plan where they differ.

- **Paths** follow 001: the page is `frontend/app/(reading)/about/page.tsx` (already updated above).
- **Credits and GitHub URL (R6, Q2):** 001's `frontend/lib/site.ts` is the single source of the credit lines, the JODD
  licence line and `GITHUB_URL`. `thesis.ts` imports `credits` from there and does not define its own copy. The "Code"
  link uses `GITHUB_URL`, so the nav and About can never disagree.
- **Tokens:** use 001's Tailwind utilities (`bg-background`, `bg-subtle`, `text-foreground`, `text-muted-foreground`,
  `text-ocean`, `rounded-control`, type utilities `text-h1` … `text-code`), not raw `--bg` / `--text` names or
  arbitrary values. 001's `check-tokens.mjs` fails on `rounded-[…]` and colour literals. In the figure SVG, use
  `currentColor` or `stroke="var(--muted-foreground)"`-style references, never hex.
- **Placeholder:** use 001's `Pending` component for the pending abstract. Don't add a local `Placeholder`.
- **Axe:** 001 ships no named axe helper; use `AxeBuilder` directly as this plan's fallback says. The 320 px viewport
  is set inside `about.spec.ts`, not as a new Playwright project.

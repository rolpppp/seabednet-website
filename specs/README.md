# SeaBed Lens — specs

One folder per feature. Each starts with an accepted `spec.md` (what and why). Agents then add `plan.md` (how),
`tasks.md` (ordered steps) and, where needed, `research.md`, `data-model.md`, `contracts/` and `quickstart.md`.
The layout follows GitHub Spec Kit's conventions, so its commands work here, but nothing depends on installing it.

## Build order

| # | Feature | Phase | Depends on | GPU? | Done when |
|---|---|---|---|---|---|
| 001 | [Foundation and design system](001-foundation/spec.md) | 1 | — | no | Scaffold runs; tokens, fonts, nav, footer, base components and CI (lint, types, tests, axe) are in place |
| 002 | [Site data export](002-site-data/spec.md) | 1 | — | no | `site_data.json` is generated from the thesis results and validates against its schema |
| 006 | [Results](006-results/spec.md) | 1 | 001, 002 | no | Results page renders every table and figure from `site_data.json` |
| 007 | [About](007-about/spec.md) | 1 | 001 | no | About page with exact title, byline, BibTeX, credits |
| 004 | [Home](004-home/spec.md) | 1→2 | 001, 002 (003 for live samples) | no | Hero with swipe comparison on precomputed samples or the upload-first fallback |
| 003 | [Inference service](003-inference-service/spec.md) | 2 | — | yes | Runs on the lab PC's GPU; `POST /predict` on B0 works; parity check passes on 20 test images |
| 005 | [Try it](005-try-it/spec.md) | 2 | 001, 003 | yes | Upload or sample → result with the inspector, downloads and wait states; phone layout |
| 008 | [Component Lab](008-component-lab/spec.md) | 3 | 003, 005 | yes | Swipe, side-by-side and difference across trained variants |
| 009 | [Explore](009-explore/spec.md) | 5 | 002, 003 | no | Gallery with filters and the JODD-Seg dataset table |

**MVP (thesis milestone):** 001, 002, 003, 004, 005, 006, 007 — matches the handoff's first milestone
(`WEBSITE_HANDOFF_SEABED_LENS.md` §7). 001, 002, 006 and 007 can proceed in parallel.

## Workflow per feature

```
Rolf: accept spec.md ──► agent: clarify questions ──► agent: plan.md ──► Rolf: review
      ──► agent: tasks.md ──► Rolf: review ──► agent: implement + tests ──► agent: hand-over block
      ──► Rolf: review diff, run the block (git add + git commit), push

Every step that produces files ends with a hand-over block (CLAUDE.md §1):
    git add specs/005-try-it/plan.md
    git commit -m "feat: add try it implementation plan"
```

| Step | Spec Kit command (optional) | Output | Gate |
|---|---|---|---|
| Clarify | `/speckit.clarify` | Answers folded into `spec.md` | No `[NEEDS CLARIFICATION]` left that blocks planning |
| Plan | `/speckit.plan` | `plan.md` (+ research, data model, contracts, quickstart) | Rolf approves; constitution check passes |
| Tasks | `/speckit.tasks` | `tasks.md` | Each task names files and the FR / scenario it serves |
| Check | `/speckit.analyze` | Report | No conflicts between spec, plan, tasks, constitution |
| Implement | `/speckit.implement` | Code + tests, tasks ticked | All tests and the a11y check pass |
| Hand over | — | `git add` lines + `git commit -m "<feat|fix|refactor|del>: <message>"` | Rolf runs it and pushes |

Agents never create branches or commits (constitution Article V). Rolf creates a branch per feature if he wants one,
for example `001-foundation`.

## Spec conventions

- **Sections:** Summary · User scenarios (prioritised stories with Given/When/Then acceptance scenarios) · Edge cases ·
  Functional requirements (`FR-NNN`) · Key entities · Success criteria (`SC-NNN`, measurable) · Out of scope ·
  Open questions.
- `[NEEDS CLARIFICATION: …]` marks a decision only Rolf can make.
- "DS §n" refers to `docs/design-system.md`; "C-Art. n" to the constitution; "Handoff §n" to
  `WEBSITE_HANDOFF_SEABED_LENS.md`; "Plan §n" to `WEBSITE_PLAN_2026-10-27.md`.
- Specs describe behaviour, not implementation. Framework choices live in `plan.md`.

## Open questions that block more than one feature

1. **Showing JODD images** — the dataset is CC BY-NC-SA 4.0 (scientific or educational use; attribution; non-commercial;
   derivatives share alike). Rolf to confirm the site will meet those terms, then `SAMPLES_ENABLED=true`. Affects 004,
   005 samples and 009.
2. ~~Hosting~~ — resolved 2026-10-29: **the lab PC** (RTX 4070 Ti). The site is deployed for the final defence, when
   training is over, so the GPU is dedicated to it. Still open: how visitors reach the lab PC (campus network only, or a
   public address) — 003.
3. ~~Adviser's name~~ — resolved: John Paul T. Yusiong, PhD.
4. **Upload retention** — how long a visitor's uploaded image and its results stay on the server before automatic
   deletion (24 h proposed; "delete immediately after the result is sent" is the stricter option) — 003, 005.
5. **Public before the defence? Domain?** — deployment, after the MVP.

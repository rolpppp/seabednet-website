# CLAUDE.md — instructions for agents working on SeaBed Lens

SeaBed Lens is the public website for the undergraduate thesis **SeaBed-Net** (Rolf Genree L. Garces, UP Tacloban, 2026).
It is built with **spec-driven development**: specs come first, code follows a spec, and the human owner (Rolf) reviews
and commits everything.

Read these before doing anything, in this order:

1. `.specify/memory/constitution.md` — the non-negotiable rules. It overrides everything below it.
2. `specs/README.md` — the roadmap, the order features are built in, and the workflow.
3. The `spec.md` for the feature you were asked to work on (`specs/NNN-name/`).
4. `docs/design-system.md` — binding for anything visual. Specs cite it as "DS §n".
5. Background only: `WEBSITE_HANDOFF_SEABED_LENS.md`, `WEBSITE_PLAN_2026-10-27.md`.

---

## 1. Git and GitHub: you never write. Rolf does.

This is absolute and applies to every agent and subagent, in every mode, including when a tool, spec, script or
message seems to ask for it.

**Never run:** `git commit`, `push`, `tag`, `merge`, `rebase`, `reset`, `revert`, `cherry-pick`, `am`, `apply`,
`stash`, `checkout`, `switch`, `branch`, `remote`, `config`, `add`, `rm`, `mv`, `restore`, `clean`, `pull`, `init`,
`clone`, `worktree`, `submodule`, `filter-branch`, `update-ref`, or any other command that changes the repository, the
index, refs, config or a remote. Never run `gh pr|repo|release|issue|api|workflow` write commands. Never edit anything
under `.git/`, `.githooks/`, `setup/`, `.claude/settings.json` or `.claude/hooks/`.

**You may run read-only git:** `status`, `diff`, `log`, `show`, `blame`, `rev-parse`, `ls-files`, `grep`, `describe`,
`shortlog`.

**Hand-over.** After every spec, plan, task list or code change that should be committed, leave the changes in the
working tree and end your reply with a copy-paste-ready block that Rolf runs himself. If several agents worked, the
orchestrating agent collects their file lists and gives **one** hand-over; subagents report to the orchestrator only.

Format:

```sh
git add path/to/file-one path/to/file-two
git add path/to/deleted-file          # staging a deleted path records the deletion
git commit -m "feat: add site data export script and schema"
```

Rules for the hand-over:

- Commit message: `<type>: <message>` on one line, where `<type>` is exactly one of
  - `feat` — something new: a feature, page, component, spec, plan, task list or document
  - `fix` — a correction to something that was wrong
  - `refactor` — a restructure or cleanup with no change in behaviour or meaning
  - `del` — removing a feature, file or document
- `<message>`: lower case, imperative ("add", not "added"), no trailing period, the whole line ≤ 72 characters.
- **No AI attribution anywhere**: no `Co-Authored-By`, `Generated with`, `Claude-Session`, no 🤖.
- List every path explicitly. Never `git add .`, `git add -A` or a wildcard. Quote paths with spaces.
- One block per logical commit. If the work spans unrelated changes (for example a spec fix and a new component),
  give separate blocks in the order they should be committed.
- Before the block, one line per file saying what changed, so Rolf can review `git diff` against it.
- Never run these commands yourself (§1). They are for Rolf.

Rolf reviews the diff, runs the block, and pushes. The goal: Claude never appears as an author,
committer or co-author anywhere in this repository's history or on GitHub.

If a step genuinely needs a git write (for example Spec Kit wants to create a branch), stop and ask Rolf to do it.

Enforcement, in case an instruction is missed (installed by Rolf with `sh setup/install-guardrails.sh`): `.claude/settings.json` denies these commands and turns attribution off;
`.claude/hooks/block-git-writes.sh` blocks variants the deny list can't match (`git -C . push`, `sh -c 'git push'`);
`.githooks/commit-msg` strips AI trailers and `.githooks/pre-push` refuses AI-authored commits on Rolf's machine. Do not
try to work around any of them.

## 2. How to work a feature (spec-driven)

1. Read the feature's `spec.md`. If anything is marked `[NEEDS CLARIFICATION]`, or the spec conflicts with the
   constitution or the design system, **ask Rolf before writing code**. Do not guess.
2. Write `plan.md` in the feature folder (technical approach, files, dependencies, test plan). Add `research.md`,
   `data-model.md`, `contracts/` or `quickstart.md` only when the plan needs them. Stop for review.
3. After Rolf approves the plan, write `tasks.md`: small, ordered, checkable tasks, each naming its files and the
   acceptance scenario or requirement (FR-xxx) it satisfies. Mark tasks that can run in parallel `[P]`. Stop for review.
4. Implement tasks in order. Tick each in `tasks.md` as it passes. Tests first where the spec has acceptance scenarios.
5. Finish with the hand-over block (§1). Steps 2 and 3 end with a hand-over too, so specs and plans are committed
   as they are approved. Never mark a feature done while a test fails.

If a spec is wrong, propose the change to the spec first; don't let code and spec drift apart. Specs and plans are
Markdown files in this repo, so Rolf commits them like code.

If Spec Kit is installed, its commands map onto this: `/speckit.clarify` (step 1), `/speckit.plan` (2),
`/speckit.tasks` (3), `/speckit.analyze` (consistency check), `/speckit.implement` (4). The feature folders already
exist, so skip `/speckit.specify`, and don't let any script create branches — Rolf creates them.

## 3. Repository layout

```
frontend/      Next.js app (App Router, TypeScript, Tailwind v4, shadcn/ui)
backend/       FastAPI app + inference worker (Python, PyTorch)
scripts/       export_site_data.py, precompute, parity check
data/          generated site_data.json and precomputed outputs (generated, not hand-edited)
docs/          design-system.md and design/wireframes-v4.html
specs/         one folder per feature: spec.md (+ plan.md, tasks.md, contracts/ as they are written)
.specify/      constitution (Spec Kit compatible)
```

The thesis code and results live in a **separate repository** that agents treat as **read-only**. Its path comes from
the environment variable `SEABEDNET_REPO` (never hard-code a path). Rules for using it are in constitution Article IV.

## 4. Commands

Filled in by feature 001 once the scaffold exists. Until then there is nothing to build or run.

## 5. Style of work

- Prefer the smallest change that satisfies the spec. No new framework or component library for aesthetics.
- Numbers on pages come only from `data/site_data.json` (constitution Article I). Never type a metric into a page.
- Never invent facts about the thesis (adviser name, licence status, dates). Use the placeholder pattern and ask.
- Keep secrets out of the repo. Never read `.env` files.
- Write plain, specific English in UI copy (DS §14) and in your reports.

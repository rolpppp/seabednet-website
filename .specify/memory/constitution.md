# SeaBed Lens Constitution

**Version:** 1.1.0 · **Ratified:** 2026-10-29 · **Amended:** 2026-10-29 (hand-over format; JODD licence) · **Owner:** Rolf Genree L. Garces

This constitution governs every spec, plan, task and line of code in this repository. When a spec, plan, agent
instruction or convenience conflicts with it, the constitution wins. Only Rolf amends it (see Governance).

SeaBed Lens deploys the thesis model as a web application. That is the thesis's specific objective 7, so the site is a
graded deliverable that the thesis panel will inspect. Honesty and correctness outrank polish and speed.

---

## Article I — Every number is traceable

1. Every metric shown on the site comes from a generated `data/site_data.json`, produced by
   `scripts/export_site_data.py` from the thesis result files. No metric is typed into a page, a component or a test
   fixture that ships.
2. Every number carries its provenance: run name(s), split (`test` or `val`), n (seeds), source file, and the export
   date. The UI shows it through a source line or a footnote (DS §9.6–9.7).
3. Test numbers are labelled "test". The only val numbers anywhere are explicitly labelled "val".
4. Test-time-augmentation numbers are always labelled "with flip TTA (test-time augmentation)" and sit apart from model
   numbers (own column group).
5. Ablations that changed nothing are shown as "No detectable difference", never hidden. Dropped components (DAPFT) are
   shown as dropped, with the evidence IDs.
6. A variant without a trained checkpoint is shown disabled as "Pending ablation", never faked or approximated.
7. Parameter counts are always shown next to external benchmark comparisons.
8. Facts not in the sources (adviser name, licence status, hosting) are never invented. Use a visible placeholder and
   ask Rolf.

## Article II — The design system is binding

1. `docs/design-system.md` ("Quiet Scientific", v4) defines tokens, components, layouts, motion and copy. Code uses its
   tokens; values are never forked into components.
2. Every page passes the design test (DS §2) and avoids the anti-patterns (DS §3).
3. The image well stays neutral grey; the teal UI colour never appears inside an image (DS §4).
4. Changing the design system means editing `docs/design-system.md` first, in its own reviewed commit.

## Article III — Accessible by default

1. WCAG 2.2 AA is the floor: contrast per DS §6.4, visible focus, keyboard operability, 44 px touch targets, no state by
   colour alone, semantic HTML, reduced-motion support.
2. Automated accessibility checks (axe-core) run on every page in CI and must report zero serious or critical
   violations. Each page also gets a manual keyboard pass before its feature is marked done.
3. The site works without an account and without tracking. No third-party analytics or fonts at runtime.

## Article IV — Model fidelity

1. The thesis repository (path in `SEABEDNET_REPO`) is **read-only**. Never edit, move or delete anything in it,
   including notebooks, `patch_*.py`, `qa_*.py`, `run_*.py`, `queue.jsonl`, checkpoints, histories and result JSONs.
2. Checkpoints are rebuilt exactly as `eval_test_verified.py` / `eval_tta_flip.py` do: namespace from
   `qa_full_smoke.load_ns("seabednet_v5_run.ipynb")`, `Config(**saved["cfg"])` with the `fusion_mode` guard,
   `build_branches(pretrained=False, …)`, `SeaBedNetV2`, `transfer_weights`, and an **assertion of zero skipped
   tensors**. Never rebuild from a hand-written config.
3. Decoding uses the namespace's own `decode_detections` / `decode_masks`, unmodified.
4. Inference uses bf16 autocast; the DINOv2 hub offline fallback is copied from `eval_test_verified.py`.
5. Detection and segmentation are decoupled heads. Boxes and masks are separate predictions; their counts may differ;
   the UI says so and never pairs them into one "instance".
6. Each Component Lab variant is its own trained checkpoint. Never disable a branch inside B0 at inference time.
7. Before the inference API is trusted, a parity script runs 20 JODD test images through it and matches the reference
   evaluation output for the same checkpoint. It must pass before any feature that shows live predictions ships.
8. No GPU work (precompute, parity, live inference) while the training queue runs. Check `nvidia-smi` and the queue's
   ETA first, and tell Rolf before starting. This applies during development. The site is deployed on the same lab PC
   for the final defence, when training is over, and then has the GPU to itself.
9. Class names are read from the annotation file's `categories`, never hard-coded.

## Article V — Humans own version control

1. Agents never change git state or write to GitHub: no commit, push, tag, merge, rebase, reset, checkout, branch,
   stash, add, config, remote, or PR/release/repo/API writes. Read-only git is allowed.
2. Agents leave changes in the working tree. After every spec or change that should be committed, the orchestrating
   agent hands Rolf copy-paste-ready `git add <paths>` lines and a `git commit -m "<type>: <message>"` line, with
   `<type>` one of `feat`, `fix`, `refactor`, `del` (format in `CLAUDE.md` §1). Messages contain no AI attribution
   (no `Co-Authored-By`, `Generated with`, `Claude-Session`).
3. Rolf reviews, commits under his own identity and pushes. No AI identity may appear as author, committer or co-author.
4. This is enforced by `.claude/settings.json` (deny rules, attribution off), `.claude/hooks/block-git-writes.sh`, and
   `.githooks/commit-msg` + `.githooks/pre-push`. Agents never edit or bypass these.

## Article VI — Spec first

1. No feature code without a `spec.md` that Rolf has accepted. Plans (`plan.md`) and tasks (`tasks.md`) are reviewed
   before implementation.
2. Specs say *what* and *why*; plans say *how*. A spec contains no framework-specific code.
3. Anything ambiguous is marked `[NEEDS CLARIFICATION: question]` and resolved by Rolf before planning.
4. When implementation shows a spec is wrong, the spec is corrected first, then the code.
5. Each acceptance scenario becomes an automated test where practical (Playwright for UI, pytest for backend and
   scripts).

## Article VII — Simplicity

1. Stack: Next.js (App Router, TypeScript, Tailwind v4, shadcn/ui) for the frontend, FastAPI + a PyTorch worker for the
   backend, Python scripts for data export and precompute. Exact versions are recorded in the first plan that uses them.
2. No new framework, component library, state manager or database without a written reason in a plan and Rolf's
   approval. Start with an in-process job queue; add Redis only if measured load needs it.
3. Most of the site is static. Pages that only read `site_data.json` are statically generated.
4. Prefer precomputed outputs for samples, gallery and the Lab so most visits need no GPU.

## Article VIII — Privacy and safety of uploads

1. Uploads: JPEG/PNG only, ≤ 10 MB, resized to 640 × 480 for inference, deleted after the stated retention period
   (proposal: 24 h — `[NEEDS CLARIFICATION]` until Rolf confirms). The page states the retention period.
2. No accounts, no cookies beyond what the framework strictly needs, no logging of image contents.
3. JODD images are licensed **CC BY-NC-SA 4.0** by JAMSTEC, for scientific or educational use. The site may show them
   only under those terms: attribution with the dataset citation and licence on every page that shows them, no
   commercial use (no ads, no paid access), and anything derived from them that we distribute (overlay images,
   downloaded predictions, JODD-Seg masks) carries the same licence. Showing them stays behind `SAMPLES_ENABLED` until
   Rolf confirms.

---

## Governance

- Rolf is the only person who amends this constitution. An amendment bumps the version (MAJOR for removing or
  redefining a principle, MINOR for adding one, PATCH for wording) and records the date.
- `/speckit.analyze` (or a manual review) checks each feature's spec, plan and tasks against this document before
  implementation. A violation blocks the feature until fixed or explicitly waived by Rolf in the plan.

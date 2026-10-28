# SeaBed Lens

**SeaBed Lens** is the web application for the undergraduate thesis **SeaBed-Net: Multicolor Hybrid CNN-ViT for
Dual-Task Underwater Object Detection and Instance Segmentation**. Upload a deep-sea ROV image and the thesis model
finds the organisms in it: boxes with a class and a score, and an instance mask for each organism. The site also
compares the full model with its ablated variants and presents the thesis results with their sources.

Deploying the model as a web application is the thesis's specific objective 7, so the site is a graded deliverable
that the thesis panel will inspect. Every number on it is traceable to a thesis run.

- **Author:** Rolf Genree L. Garces
- **Adviser:** John Paul T. Yusiong, PhD
- **Institution:** Department of Computer Science and Mathematics, College of Science, University of the Philippines
  Tacloban, Tacloban City
- **Course:** CMSC 199.2, Research in Computer Science II, BS Computer Science, 2026

## Status

Feature 001 (foundation) is being built. Nothing is deployed yet. The work is specified feature by feature in
[`specs/`](specs/README.md), and features ship in this order: 001 foundation, 002 site data, 006 results, 007 about,
004 home, 003 inference service, 005 try it, then 008 component lab and 009 explore.

## What the site does

| Page | What a visitor gets |
|---|---|
| **Home** | The model's output on a sample image under a swipe divider, three honest examples (clear, typical, fails) and the headline results with footnotes. |
| **Try it** | Pick a sample or upload a JPEG/PNG. See detections and masks on a large canvas, adjust the score threshold, isolate classes, compare with ground truth and download the results. |
| **Results** | The thesis results as a short research article: headline table, object-size breakdown, external benchmarks and configuration changes, each with its source run, split and seed count. |
| **About** | Title, byline, abstract, how the model works, a copyable BibTeX citation and acknowledgements. |
| **Explore** | Curated test images with the model's output, failures included, and a description of the JODD-Seg dataset. |
| **Component Lab** | Internal. The same image through 2–4 trained variants, compared by swipe, side by side or difference. |

The model the site runs is the thesis's B0 configuration: three colour stems feeding a ConvNeXt-T branch and a
DINOv2 ViT-L/14 branch in parallel, convex gated late fusion per pyramid level, an FPN, then a TOOD detection head
and a SOLOv2 mask head. The two heads are decoupled, so the number of boxes and the number of masks for one image can
differ, and the site says so instead of pairing them.

## Stack

| Part | Technology |
|---|---|
| Frontend (`frontend/`) | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui. Pages that only read results are statically generated. |
| Backend (`backend/`) | FastAPI with an in-process PyTorch inference worker. Runs on the lab PC's GPU (RTX 4070 Ti). |
| Data (`data/`, `scripts/`) | `scripts/export_site_data.py` reads the thesis result files and writes `data/site_data.json`, the only source of numbers on the site. |
| Checks | Vitest, Playwright with axe-core (WCAG 2.2 AA, zero serious or critical violations), ESLint, `tsc`, ruff, pytest. GitHub Actions runs the same single command as local. |

Exact versions are pinned in [`specs/001-foundation/plan.md`](specs/001-foundation/plan.md). The site uses no
accounts, no tracking and no third-party fonts or scripts at runtime.

## Repository layout

```
frontend/   Next.js app
backend/    FastAPI app and inference worker
scripts/    site data export, precompute, parity check
data/       generated site_data.json and precomputed outputs (generated, never hand-edited)
docs/       design system ("Quiet Scientific") and wireframes
specs/      one folder per feature: spec.md, plan.md, tasks.md
.specify/   the project constitution
```

The thesis code, checkpoints and results live in a separate repository that this project only ever reads. Its path
comes from the `SEABEDNET_REPO` environment variable.

## Running it

Requirements: Node 24 or later, pnpm 12, [uv](https://docs.astral.sh/uv/) (it fetches Python 3.12 for the backend).
These commands become available as feature 001 lands. Its last task fills in this section with the final commands.

```sh
pnpm install            # frontend dependencies (one workspace, one lockfile)
pnpm setup:browsers     # once per machine: Playwright's Chromium
cp .env.example .env    # then set SEABEDNET_REPO and the other values
pnpm check              # everything: types, lint, token checks, unit tests, build, Playwright + axe, backend tests
```

`next build` downloads the three typefaces at build time and serves them from the site itself, so the build needs
internet access.

## Citation

```bibtex
@thesis{garces2026seabednet,
  author      = {Garces, Rolf Genree L.},
  title       = {SeaBed-Net: Multicolor Hybrid CNN-ViT for Dual-Task Underwater Object Detection and Instance Segmentation},
  type        = {Undergraduate thesis (BS Computer Science)},
  institution = {University of the Philippines Tacloban},
  address     = {Tacloban City, Philippines},
  year        = {2026}
}
```

## Credits and licences

- **Images:** J-EDI Organism Detection Dataset (JODD), JAMSTEC J-EDI. Takaki Nishio, Yuki Kawae (2025),
  https://doi.org/10.17596/0004035. Paper: T. Nishio and Y. Kawae, "Deep-sea image dataset for organism detection,"
  *Data in Brief*, vol. 65, p. 112462, 2026, doi:10.1016/j.dib.2026.112462. JODD is licensed
  **CC BY-NC-SA 4.0** for scientific and educational use. Anything this site derives from it (overlays, downloaded
  predictions, JODD-Seg masks) carries the same licence, and the site has no ads or paid access.
- **Instance masks:** JODD-Seg, made for this thesis with SAM 3 pseudo-masks reviewed and corrected by three human
  reviewers.
- **Pretrained backbones:** ConvNeXt-T (ImageNet), DINOv2 (Meta).
- **Typefaces:** Inter, Source Serif 4 and JetBrains Mono, all under the SIL Open Font License 1.1.
- **Code licence:** _[not yet decided — Rolf to choose]_

# SeaBed Lens — handoff for the website build

**For:** the agent building the website. **Written:** 2026-10-27. **Read with:** `WEBSITE_PLAN_2026-10-27.md` (pages,
features, flows, API sketch). This file gives the context and the rules that plan assumes.

---

## 0. In one paragraph

**SeaBed Lens** is the public web application for an undergraduate CS thesis. It lets a visitor upload a deep-sea ROV
image and get organism detections (boxes + class + score) and instance masks from the thesis model, **SeaBed-Net**. It
also lets them compare the full model against ablated variants (CNN-only, ViT-only, ...), and it presents the thesis
results. Deploying the model as a web application is the thesis's **specific objective 7**, so this is a graded
deliverable, not a side project.

---

## 1. Name, thesis and citation

- **Site name:** **SeaBed Lens** (final).
- **Suggested tagline:** "See what's on the seabed. Detection and instance segmentation for deep-sea ROV imagery."
- **Thesis title (exact, from the manuscript title page):**
  **SeaBed-Net: Multicolor Hybrid CNN-ViT for Dual-Task Underwater Object Detection and Instance Segmentation**
- **Author:** Rolf Genree L. Garces
- **Course:** CMSC 199.2 — Research in Computer Science II, Bachelor of Science in Computer Science
- **Institution:** Department of Computer Science and Mathematics, College of Science, University of the Philippines
  Tacloban, Tacloban City
- **Date on the manuscript:** September 2026 (source: `Requirements/Manuscript/Thesis_Manuscript_2026-09-24.tex`)
- **Adviser:** not in the manuscript source. **Ask the user**; do not invent a name.

Citation block for the About page (BibTeX):

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

Credit lines the site must carry (About page and footer):
- Images: **J-EDI Organism Detection Dataset (JODD)**, JAMSTEC J-EDI. Paper: T. Nishio and Y. Kawae, "Deep-sea image
  dataset for organism detection," *Data in Brief*, vol. 65, p. 112462, 2026, doi:10.1016/j.dib.2026.112462.
- Instance masks: **JODD-Seg**, made for this thesis with SAM 3 pseudo-masks reviewed and corrected by three human
  reviewers.
- Pretrained backbones: ConvNeXt-T (ImageNet), DINOv2 (Meta).

---

## 2. What the model actually is (use this, not the abstract)

⚠️ **The manuscript abstract (September 2026) describes the proposal-era design**: an RGB/HSV/CIELAB multicolor input,
gated fusion, and DAPFT pre-fine-tuning. **The model the site deploys differs on all three.** Describe the model as
built. The user will update the manuscript; do not copy the abstract's architecture onto the site.

**Deployed model = B0, "VITL_ACC"** (the current semi-final model, chosen by the user on 2026-10-21):

```
RGB image (640×480)
 → C2 colour stems: three shallow ConvNeXt stems on RGB ‖ RedComp ‖ Shades-of-Gray, merged at stride 4
 → ConvNeXt-T (CNN branch) ‖ DINOv2 ViT-L/14 (ViT branch), run in parallel, no mid-network exchange
 → convex gated late fusion, once per pyramid level
 → FPN
 ├→ TOOD head: detection (class + box)            [decoupled]
 └→ SOLOv2 head: instance masks (box-free)        [decoupled]
```

- ImageNet → JODD-Seg directly. **No DAPFT** (the user is dropping that component).
- 352 M parameters. Checkpoint `ab_vitl_acc_s3.pth`, 1.4 GB (fp32). Trained 50 epochs, mosaic augmentation, batch 3 × 2.
- **The heads are decoupled, by a panel requirement**: neither uses the other's output. So the number of boxes and the
  number of masks for one image can differ. Show this in the UI with a one-line note; never "fix" it by matching them.
- 20 classes. Read the names from the annotation file (`data/jodd/annotations/test_merged_2026-09-14.json`,
  `categories`); never hard-code them.

**Headline numbers** (held-out JODD test split, n=3 seeds, mean). Source files are `ab_vitl_acc{,_seed1,_seed2}_s3.pth.test_eval_verified.json`:

| | AP | AP50 | AP_S | AP_M | AP_L |
|---|---|---|---|---|---|
| bbox | 0.6453 | 0.8428 | 0.616 | 0.669 | 0.677 |
| mask | 0.6380 | 0.8357 | 0.544 | 0.668 | 0.723 |

With flip TTA (test-time augmentation, report separately): bbox 0.6504 / AP50 0.8458, mask 0.6439 / AP50 0.8473
(`tta_flip_test_results.json`).

**External benchmarks** (n=1, official test splits; `SOTA_COMPARISON_2026-09-22.md`):

| Benchmark | Ours | Best published |
|---|---|---|
| RUOD box AP (UDINO protocol) | 65.22 | UDINO 62.0 |
| RUOD box AP (EDB-Net protocol) | 62.68 | EDB-Net 58.3 |
| UIIS10K box AP | 49.91 | UWSAM-Teacher 45.8 |
| UIIS10K mask AP | 47.66 | UWSAM-Teacher 44.6 |

Always show parameter counts next to these: ours 352 M, EDB-Net 80.67 M, UDINO 69.5 M, UWSAM-Teacher 632 M.

---

## 3. Decisions already made

| Decision | Choice | By |
|---|---|---|
| Name | SeaBed Lens | user, 2026-10-27 |
| Stack | **Next.js frontend + FastAPI backend** (Python worker running PyTorch) | user, 2026-10-27 |
| Deployed model | B0 = VITL_ACC | user, 2026-10-21 |
| DAPFT | dropped; no toggle; explained on Results | user, 2026-10-27 |
| Variants | each variant = its own trained checkpoint; never disable a branch inside B0 at inference | thesis evidence (TODO.md F80) |

The manuscript's Deployment section still says Streamlit. That is a manuscript fix for the user, not a reason to use
Streamlit.

---

## 4. Rules (non-negotiable)

**Repository safety.** This repo has no working version control (the git store is corrupt and abandoned), so a
destructive edit cannot be undone.

1. Build everything under a new **`website/`** folder (`website/frontend`, `website/backend`, `website/scripts`).
2. **Read-only outside `website/`.** Never edit notebooks (`*.ipynb`), `patch_*.py`, `qa_*.py`, `run_*.py`,
   `queue.jsonl`, any `*.pth`, `*_history.jsonl` or `*.test_eval_verified.json`, `CLAUDE.md`, `TODO.md`.
3. **No training and no GPU jobs while the queue runs.** The RTX 4070 Ti (12 GB) is shared with `queue_runner.py`.
   Check `nvidia-smi` and `python3 eta.py` before any GPU use. Precomputing outputs is a GPU job: run it only when the
   card is idle, and tell the user first.

**Model loading.**

4. Rebuild a checkpoint the way `eval_test_verified.py` / `eval_tta_flip.py` do: load the namespace with
   `qa_full_smoke.load_ns("seabednet_v5_run.ipynb")`, then `saved = torch.load(...)`,
   `sc = dict(saved["cfg"]); sc.setdefault("fusion_mode", "fcu_residual")`, `cfg = Config(**sc)`,
   `build_branches(pretrained=False, cnn_arch=cfg.cnn_arch, vit_arch=cfg.vit_arch)`, `SeaBedNetV2(cfg, cnn, vit)`,
   `transfer_weights(...)`, and **assert 0 skipped tensors**. `transfer_weights` never raises; a silent skip gives a
   wrong-but-plausible model.
5. Never rebuild from a hand-written config dict (`build_marketnet_cfg` style). It has produced wrong models twice.
6. Decode with the namespace's own `decode_detections` / `decode_masks`. Do not reimplement or "tidy" them. The decode
   order matters and has had real bugs (CLAUDE.md §5.6, §6).
7. `torch.hub` contacts GitHub to resolve DINOv2 even when cached; copy `_hub_offline_fallback()` from
   `eval_test_verified.py` into the worker.
8. Inference runs in bf16 autocast (fp16 overflows in DINOv2 attention, CLAUDE.md §5.3).
9. **Before trusting the API:** run 20 JODD test images through it and confirm the predictions match
   `eval_test_verified.py` / `dump_predictions.py` for the same checkpoint. Put this check in a script under
   `website/scripts/`.

**Honesty of what is shown** (the thesis panel will check the site):

10. Every number on the site comes from a generated `site_data.json` (export script reads the result JSONs), never
    typed into a page. Each number carries: run name, split (val/test), n (seeds), date.
11. Test numbers are labelled "test". The only val numbers anywhere are explicitly labelled "val".
12. TTA numbers are always labelled "with flip TTA (test-time)" and sit apart from model numbers.
13. Ablations that changed nothing are shown as "no detectable difference", not hidden.
14. A variant without a trained checkpoint is shown greyed out as "pending ablation", never faked.

---

## 5. Variants for the Component Lab

| Variant | Checkpoint | Status |
|---|---|---|
| Full model (B0, ConvNeXt-T + ViT-L) | `ab_vitl_acc_s3.pth` (+ `_seed1`, `_seed2`) | ✅ |
| Smaller ViT (ViT-B) | `ab_vitb_acc_s3.pth` | ✅ |
| Earlier model: C2F_VITB_CVXMOS | `ab_c2f_vitb_cvxmos_s3.pth` | ✅ |
| Earlier model: C2F_MDUAL | `ab_c2f_mdual_s3.pth` | ✅ |
| ViT-only (`backbone_mode="vit_only"`) | — | ⏳ pending B0 ablation run |
| CNN-only (`backbone_mode="cnn_only"`) | — | ⏳ pending |
| No colour stems (`cnn_branch_spaces=()`) | — | ⏳ pending |
| RGB-only stems (`("rgb","rgb","rgb")`) | — | ⏳ pending |
| Gated instead of convex fusion (`marketnet_fuse="gated"`) | — | ⏳ pending |

Read the variant list from a config file (`website/backend/variants.yaml`), so a newly trained checkpoint becomes
available by adding one entry. Show each variant's test AP from `site_data.json` next to its output.

---

## 6. Where to find things

| Need | File |
|---|---|
| Pages, features, flows, API sketch | `WEBSITE_PLAN_2026-10-27.md` |
| Model code (do not edit) | `seabednet_v5_run.ipynb` via `qa_full_smoke.load_ns` |
| Reference inference + 4-panel figure | `eval_test_verified.py` (`evaluate_checkpoint`, `_draw_row`, `_instance_names`) |
| Flip TTA implementation | `eval_tta_flip.py` |
| Raw prediction dumps | `dump_predictions.py` |
| Test results per checkpoint | `<run>.pth.test_eval_verified.json` |
| Comparison tables by config change | `RUNS_2026-09-28_TO_2026-10-09.md`; doc "SeaBed-Net Runs Since 09-28" (https://claude.ai/artifact/QtUbJwSL6LiuGfTrhbQ61V) |
| SOTA comparison + caveats | `SOTA_COMPARISON_2026-09-22.md` |
| Dataset facts (classes, counts, review coverage) | `JODD_DATASET_ANN.md` |
| Diagrams to adapt for the Architecture page | `MARKETNET_DUAL_DIAGRAM.md`, `PIPELINE_CURRENT_DIAGRAM.md`, `SOLOV2_HEAD_GRAPH.md` |
| Existing review site (style reference only) | `code_map/` → https://claude.ai/artifact/VJVfgx527xjVQgnvyEVeeC |
| Images | `data/jodd/images` (8,151 files) |

---

## 7. First milestone (definition of done)

1. `website/` scaffold: Next.js app + FastAPI app + README with run commands.
2. `website/scripts/export_site_data.py` → `site_data.json` with B0's test numbers, the comparison tables and the
   benchmarks, each with run / split / n / date.
3. Pages: Home, Try it, Results, About (with the exact thesis title and BibTeX above).
4. `POST /predict` on B0 returns boxes, labels, scores, RLE masks, an overlay PNG and per-class counts. The rule-9 parity
   check passes on 20 test images.
5. Runs on CPU if no GPU is free (slow is fine for the milestone; show a "may take a while" notice).

---

## 8. Open questions for the user (ask, do not assume)

1. **Adviser's name** for the About page and citation.
2. **Image licence:** can JODD (JAMSTEC J-EDI) images be shown publicly in samples and the gallery? Until answered,
   build with samples behind a flag that defaults to off.
3. **Hosting** during the defence: lab machine (GPU shared with training), or a separate GPU host.
4. **Domain / URL**, and whether the site should be public before the defence.
5. **Uploads:** retention period (suggest delete after 24 h, stated on the page).

# 003 — Inference service

**Status:** Ready for planning · **Host:** lab PC (RTX 4070 Ti, dedicated to the site once deployed) · **Phase:** 2 · **Depends on:** — · **Rules:** C-Art. IV, VII, VIII ·
**Contract:** [`contracts/api.md`](contracts/api.md)

## Summary

A FastAPI service and a PyTorch worker that run SeaBed-Net variants on an uploaded or sample image and return boxes,
masks, counts and downloadable files. It runs on the lab PC's GPU, must reproduce the thesis evaluation exactly
(parity check), and serves precomputed results for samples so they are instant. Deployment happens for the final
defence, when training has finished, so the GPU belongs to the site.

## User scenarios

### US1 — A visitor's upload is analysed by the full model (P1)

**Acceptance scenarios**
1. **Given** a JPEG or PNG ≤ 10 MB, **When** the client calls `POST /predict` with `variant=b0`, **Then** it receives a
   `job_id` immediately and `GET /jobs/{id}` reports `queued` → `running` (with `step` and `elapsed_ms`) → `done`.
2. **Given** a finished job, **When** the result is fetched, **Then** it contains detections (class, score, box) and
   masks (class, score, RLE, polygon, area) as **separate lists**, per-class counts for each, image size, timing, and
   URLs for the overlay PNG, COCO JSON and CSV.
3. **Given** a file that is not JPEG/PNG, larger than 10 MB, or undecodable, **When** posted, **Then** the API returns
   a 4xx with a plain-language message and no job is created.

### US2 — Rolf can trust the API's predictions (P1)

**Acceptance scenarios**
1. **Given** 20 fixed JODD test images and the B0 checkpoint, **When** `scripts/parity_check.py` runs them through the
   API, **Then** every box, label, score and mask matches the reference output of `eval_test_verified.py` /
   `dump_predictions.py` for the same checkpoint within the tolerances in FR-011, and the script exits 0.
2. **Given** a checkpoint whose weights don't load completely, **When** the worker loads it, **Then** loading fails
   with the count of skipped tensors (never a silent partial load).

### US3 — Samples and the Lab are instant (P1)

**Acceptance scenarios**
1. **Given** precomputed outputs exist for a sample image and variant, **When** the client asks for that pair, **Then**
   the API returns the stored result without running the model.
2. **Given** `scripts/precompute.py` is run while the GPU is idle, **When** it finishes, **Then** every sample × trained
   variant × {TTA off, TTA on} has a stored result.

### US4 — Several visitors at once (P2)

**Acceptance scenarios**
1. **Given** jobs already queued, **When** another upload arrives, **Then** it waits its turn and its `estimate_ms`
   accounts for the jobs ahead of it.
2. **Given** more than the configured number of queued jobs, **When** another arrives, **Then** the API returns 429 with
   a retry hint.

## Edge cases

- Image of a different size or aspect ratio → resized to 640 × 480 for inference exactly as the evaluation pipeline does;
  results are reported in the 640 × 480 frame with the original size recorded.
- Zero detections or zero masks → valid result with empty lists and zero counts.
- Box and mask counts differ → valid; never reconciled (C-Art. IV.5).
- Flip TTA requested → two passes, merged exactly as `eval_tta_flip.py` does; flagged `tta: true` in the result.
- Variant requested that is pending → 409 with `status: "pending"`.
- Worker crash mid-job → job becomes `failed` with a message; the next job reloads the model.
- Uploaded file retention → deleted after `UPLOAD_RETENTION_HOURS` along with its outputs.

## Functional requirements

- **FR-001** Endpoints per `contracts/api.md`: `GET /health`, `GET /variants`, `GET /samples`, `POST /predict`,
  `GET /jobs/{id}`, `GET /jobs/{id}/files/{name}`, `POST /compare`.
- **FR-002** Variants come from `backend/variants.yaml` (id, name, what changed, component, checkpoint path relative to
  `SEABEDNET_REPO` or a checkpoints directory, status). Adding a trained checkpoint is a one-entry change.
- **FR-003** Model loading follows C-Art. IV.2 exactly and asserts zero skipped tensors; config is never hand-written.
- **FR-004** Decoding uses the namespace's `decode_detections` / `decode_masks` unchanged (C-Art. IV.3).
- **FR-005** Inference in bf16 autocast on the GPU. The DINOv2 hub offline fallback is included (C-Art. IV.4). A CPU
  path exists for development on machines without CUDA only; it is never used in deployment.
- **FR-006** An in-process job queue with a single worker; an LRU cache holds at most 2–3 loaded variants (configurable).
- **FR-007** Masks are returned as COCO RLE and as simplified polygons (for the SVG overlay); boxes as `[x, y, w, h]` in
  the 640 × 480 frame. Class ids and names come from the annotation file's `categories`.
- **FR-008** Files per job: `overlay.png` (drawn like the thesis figures), `coco.json` (detections and segmentations as
  COCO results), `counts.csv` (class, boxes, masks).
- **FR-009** Uploads are validated by content (magic bytes and decode), not only by extension; EXIF is stripped; files
  live under `data/uploads/` and are purged on schedule.
- **FR-010** Device is set by configuration (`DEVICE=cuda|cpu`, default `cuda`). With `cuda`, the service refuses to
  start if CUDA is unavailable, rather than silently falling back to CPU.
- **FR-011** `scripts/parity_check.py`: 20 fixed test image IDs; compares per image the sorted detections (label exact,
  score |Δ| ≤ 1e-3, box IoU ≥ 0.99) and masks (label exact, score |Δ| ≤ 1e-3, mask IoU ≥ 0.98) against the reference
  dump; prints a table and exits non-zero on any mismatch. It runs on the deployment device and precision (CUDA, bf16),
  the same as the reference evaluation.
- **FR-012** `scripts/precompute.py` writes results for samples × trained variants × TTA to `data/precomputed/`
  (git-ignored) and is resumable. During development, while training may still be running, it refuses to start when
  the GPU is busy (C-Art. IV.8).
- **FR-013** CORS allows only the configured frontend origin. No authentication; rate limiting per client IP.
- **FR-014** Structured logs record job ids, timings and errors, never image contents.
- **FR-015** Hosting is the lab PC: the API, the worker and the static frontend run there as services that start on
  boot and restart on failure. Checkpoints are read from local disk. B0 stays loaded and is warmed with one inference at
  start-up, so the first visitor gets full GPU speed.
- **FR-016** `quickstart.md` (written with the plan) includes a deployment checklist: confirm no training is running
  (`nvidia-smi`), start the services, run the parity check, and open the site from a second device.

## Key entities

`Variant`, `Job` (id, status, step, elapsed_ms, estimate_ms, variant, tta, error), `PredictionResult`
(detections[], masks[], counts, image, timing, files), `Detection`, `Mask`, `Sample` — shapes in the contract.

## Success criteria

- **SC-001** Parity check passes on 20/20 images for B0 (and for each variant before it is exposed in the Lab).
- **SC-002** B0 single image ≤ 1 s end to end at p95 on the RTX 4070 Ti (evaluation ran at about 0.1 s per image);
  with flip TTA ≤ 2 s.
- **SC-003** Precomputed sample results return in ≤ 100 ms p95.
- **SC-004** Uploads are absent from disk within retention + 1 h.

## Out of scope

Video input, accounts, persistent galleries of user uploads, horizontal scaling, Redis.

## Open questions

- [NEEDS CLARIFICATION: how visitors reach the lab PC — campus network only, or a public address (for example a
  tunnel or a university-provided domain)? This decides HTTPS, CORS origins and rate limits.]
- [NEEDS CLARIFICATION: should the site stay up after the defence, and on the same machine?]
- [NEEDS CLARIFICATION: upload retention period (24 h proposed)]
- [NEEDS CLARIFICATION: where checkpoints live for the service — read in place from `SEABEDNET_REPO`, or copied to a
  checkpoints directory?]
- [NEEDS CLARIFICATION: the 20 parity image IDs — choose now so they never change]

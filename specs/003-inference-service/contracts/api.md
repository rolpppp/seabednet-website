# Inference API contract (v1)

Base path `/api/v1`. JSON over HTTPS. Times in milliseconds. Coordinates in the 640 × 480 inference frame, origin top
left, `[x, y, w, h]`. Errors use `{ "error": { "code": string, "message": string } }` with a plain-language message
the UI can show as-is.

## `GET /health`

`200 { "status": "ok", "device": "cuda" | "cpu", "loaded_variants": ["b0"], "queue_depth": 0 }`

## `GET /variants`

```json
[
  { "id": "b0", "name": "Full model (B0)", "what_changed": "Reference", "component": "all",
    "status": "trained", "default": true },
  { "id": "vitb", "name": "Smaller ViT (ViT-B)", "what_changed": "DINOv2 ViT-L → ViT-B",
    "component": "backbone scale", "status": "trained" },
  { "id": "vit_only", "name": "ViT-only", "what_changed": "ConvNeXt branch and fusion removed",
    "component": "hybrid backbone", "status": "pending" }
]
```
Metrics for each variant come from `site_data.json`, not from this endpoint.

## `GET /samples`

`200 [ { "id": "s01", "title": string, "has_ground_truth": true, "thumb_url": string, "image_url": string } ]`
Returns `[]` when `SAMPLES_ENABLED=false`.

## `POST /predict`

`multipart/form-data`: `image` (file) **or** `sample_id`; `variant` (default `b0`); `tta` (`true|false`, default
`false`).

- `202 { "job_id": "j_…", "status": "queued", "estimate_ms": 9000 }`
- `200 { "job_id": "j_…", "status": "done", "result": PredictionResult }` when served from precomputed results
- `400 invalid_image` · `413 too_large` (> 10 MB) · `409 variant_pending` · `429 busy` (with `Retry-After`)

## `GET /jobs/{job_id}`

```json
{
  "job_id": "j_…",
  "status": "queued" | "running" | "done" | "failed",
  "step": "Loading model" | "Running detection and segmentation" | "Drawing overlay" | null,
  "elapsed_ms": 3200,
  "estimate_ms": 9000,
  "device": "cpu",
  "variant": "b0",
  "tta": false,
  "result": PredictionResult | null,
  "error": { "code": "...", "message": "..." } | null
}
```
Clients poll every 500 ms (or use `GET /jobs/{id}/events` as Server-Sent Events, optional).

## `PredictionResult`

```json
{
  "variant": "b0",
  "tta": false,
  "image": { "width": 640, "height": 480, "original_width": 1920, "original_height": 1080, "source": "upload" | "sample" },
  "detections": [
    { "id": "d1", "class_id": 3, "class_name": "starfish", "score": 0.94, "box": [110.2, 340.0, 96.5, 88.1] }
  ],
  "masks": [
    { "id": "m1", "class_id": 3, "class_name": "starfish", "score": 0.93,
      "rle": { "size": [480, 640], "counts": "…" },
      "polygon": [[x, y], …], "area": 2455 }
  ],
  "counts": { "starfish": { "boxes": 2, "masks": 2 }, "shrimp": { "boxes": 1, "masks": 0 } },
  "timing_ms": { "preprocess": 12, "model": 104, "postprocess": 30, "total": 146 },
  "files": { "overlay_png": "/api/v1/jobs/j_…/files/overlay.png",
             "coco_json":  "/api/v1/jobs/j_…/files/coco.json",
             "counts_csv": "/api/v1/jobs/j_…/files/counts.csv" },
  "ground_truth": null | { "annotations": [ { "class_id": 3, "box": [...], "polygon": [...] } ] }
}
```

Rules:
- `detections` and `masks` are independent lists from decoupled heads. There is no field linking a detection to a mask,
  and clients must not infer one.
- Scores are returned unthresholded down to the evaluation threshold (0.05); the client filters by the visitor's
  threshold (default 0.30) without a new request.
- `ground_truth` is present only for samples with annotations.

## `POST /compare`

Body: `sample_id` or `image`, `variants: ["b0", "vitb", …]` (2–4, trained only), `tta`.
`202 { "jobs": { "b0": "j_…", "vitb": "j_…" } }` — one job per variant; poll each.

## `GET /jobs/{job_id}/files/{name}`

`overlay.png` (image/png), `coco.json` (application/json), `counts.csv` (text/csv). `404` after retention expiry.

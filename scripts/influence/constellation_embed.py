#!/usr/bin/env python3
"""
Embedding helper for scripts/influence/build-constellation.mjs (docs/reach/CONSTELLATION-MAP.md).

The Node builder owns every count and every selection rule; this helper only does the two
steps that need Python: sentence embeddings (all-MiniLM-L6-v2) and the UMAP projection.
It reads one JSON request on stdin and writes one JSON reply on stdout.

  {"op": "embed", "model": "...", "texts": ["...", ...]}
      -> {"model": "...", "dim": 384, "vectors": [[...], ...]}      (L2-normalised)
         One text per batch, so a text's vector never depends on which other texts are
         embedded with it (batch padding changes float rounding, and UMAP amplifies that).

  {"op": "cluster", "vectors": [[...]], "k": [4, 7], "seed": 7}
      -> {"runs": [{"k": 4, "labels": [...], "silhouette": 0.31}, ...]}
         k-means on the unit vectors (n_init 50), silhouette with the cosine metric.

  {"op": "umap", "vectors": [[...]], "n_neighbors": 15, "min_dist": 0.3,
   "metric": "cosine", "seed": 20261010, "init": [[x, y], ...] | null}
      -> {"coords": [[x, y], ...], "umap": "<version>"}
         init: start from the previous layout (month-to-month stability); null = spectral.

Rows come back in the order they were sent; the builder sorts its inputs by slug first, so
the same cache always gives the same output.

Setup (once):  uv venv .venv-constellation --python 3.12
               VIRTUAL_ENV=.venv-constellation uv pip install -r scripts/influence/requirements-constellation.txt
"""

import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")


def embed(req):
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(req["model"], device="cpu")
    vectors = model.encode(req["texts"], normalize_embeddings=True, batch_size=1, show_progress_bar=False)
    return {"model": req["model"], "dim": int(vectors.shape[1]), "vectors": [[round(float(v), 6) for v in row] for row in vectors]}


def cluster(req):
    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score

    X = np.asarray(req["vectors"], dtype=np.float64)
    X = X / np.linalg.norm(X, axis=1, keepdims=True)
    lo, hi = req["k"]
    runs = []
    for k in range(lo, hi + 1):
        km = KMeans(n_clusters=k, n_init=50, random_state=req.get("seed", 7)).fit(X)
        runs.append({"k": k, "labels": [int(v) for v in km.labels_], "silhouette": float(silhouette_score(X, km.labels_, metric="cosine"))})
    return {"runs": runs}


def project(req):
    import numpy as np
    import umap

    X = np.asarray(req["vectors"], dtype=np.float32)
    init = req.get("init")
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=req.get("n_neighbors", 15),
        min_dist=req.get("min_dist", 0.3),
        metric=req.get("metric", "cosine"),
        random_state=req.get("seed", 20261010),
        init=np.asarray(init, dtype=np.float32) if init else "spectral",
    )
    Y = reducer.fit_transform(X)
    return {"coords": [[round(float(x), 6), round(float(y), 6)] for x, y in Y], "umap": getattr(umap, "__version__", "unknown")}


def main():
    req = json.load(sys.stdin)
    op = req.get("op")
    if op == "embed":
        out = embed(req)
    elif op == "cluster":
        out = cluster(req)
    elif op == "umap":
        out = project(req)
    else:
        raise SystemExit(f"unknown op {op!r}")
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()

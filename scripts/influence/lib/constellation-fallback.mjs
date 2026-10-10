/**
 * Fallback "meaning" for the Constellation builder when the Python helper (MiniLM + UMAP)
 * is unavailable: TF-IDF vectors over each keyword's label and the titles of the citing
 * works that carry it, spherical k-means for regions, classical MDS on cosine distance for
 * positions. No npm dependencies, no Math.random: the same input gives the same output.
 * Selected with --engine=tfidf, or automatically if the helper fails (the builder warns).
 */

const STOP = new Set(
  "a an and are as at be by for from has have in into is it its of on or that the their this to was were with within using use based via between among under over toward towards new study analysis case evidence".split(" ")
);

const singular = (t) => (t.length > 4 && t.endsWith("ies") ? t.slice(0, -3) + "y" : t.length > 3 && t.endsWith("s") && !/(ss|us|is)$/.test(t) ? t.slice(0, -1) : t);
export const tokens = (text) =>
  (text ?? "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length >= 3 && !STOP.has(t))
    .map(singular);

/**
 * docs: [{label, titles: [string]}] → unit TF-IDF vectors (dense, shared vocabulary), plus
 * embedQuery(text) for scoring a paper's own title / keyword against the same vocabulary.
 */
export function tfidfVectors(docs, { labelWeight = 3 } = {}) {
  const counts = docs.map((d) => {
    const m = new Map();
    for (const t of tokens(d.label)) m.set(t, (m.get(t) ?? 0) + labelWeight);
    for (const title of d.titles) for (const t of tokens(title)) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  });
  const df = new Map();
  for (const m of counts) for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const vocab = [...df.keys()].filter((t) => df.get(t) >= 2).sort();
  const col = new Map(vocab.map((t, i) => [t, i]));
  const idf = vocab.map((t) => Math.log(1 + docs.length / df.get(t)));
  const unit = (v) => {
    const n = Math.hypot(...v) || 1;
    return v.map((x) => x / n);
  };
  const vec = (m) => {
    const v = new Array(vocab.length).fill(0);
    for (const [t, c] of m) {
      const i = col.get(t);
      if (i !== undefined) v[i] = (1 + Math.log(c)) * idf[i];
    }
    return unit(v);
  };
  return {
    vectors: counts.map(vec),
    embedQuery: (text) => {
      const m = new Map();
      for (const t of tokens(text)) m.set(t, (m.get(t) ?? 0) + 1);
      return vec(m);
    },
  };
}

function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

/** Spherical k-means (k-means++ starts, best of `restarts`), k in [kMin, kMax], cosine silhouette each. */
export function kmeansRuns(X, { kMin, kMax, seed = 7, restarts = 20, iterations = 100 }) {
  const n = X.length;
  const dim = X[0].length;
  const rand = prng(seed);
  const D = X.map((a) => X.map((b) => 1 - dot(a, b)));
  const silhouette = (labels, k) => {
    let total = 0;
    for (let i = 0; i < n; i++) {
      const acc = Array.from({ length: k }, () => [0, 0]);
      for (let j = 0; j < n; j++) if (j !== i) {
        acc[labels[j]][0] += D[i][j];
        acc[labels[j]][1]++;
      }
      const own = labels[i];
      if (!acc[own][1]) continue;
      const a = acc[own][0] / acc[own][1];
      const b = Math.min(...acc.map((x, c) => (c === own || !x[1] ? Infinity : x[0] / x[1])));
      total += (b - a) / Math.max(a, b);
    }
    return total / n;
  };
  const runs = [];
  for (let k = kMin; k <= kMax; k++) {
    let best = null;
    for (let r = 0; r < restarts; r++) {
      const centers = [X[Math.floor(rand() * n)]];
      while (centers.length < k) {
        const d2 = X.map((x) => Math.min(...centers.map((c) => 1 - dot(x, c))) ** 2);
        let pick = rand() * d2.reduce((s, v) => s + v, 0);
        let i = 0;
        while (i < n - 1 && (pick -= d2[i]) > 0) i++;
        centers.push(X[i]);
      }
      let labels = new Array(n).fill(0);
      for (let it = 0; it < iterations; it++) {
        const next = X.map((x) => {
          let bi = 0;
          let bs = -Infinity;
          centers.forEach((c, ci) => {
            const s = dot(x, c);
            if (s > bs) {
              bs = s;
              bi = ci;
            }
          });
          return bi;
        });
        const same = next.every((l, i) => l === labels[i]);
        labels = next;
        for (let c = 0; c < k; c++) {
          const m = new Array(dim).fill(0);
          let cnt = 0;
          X.forEach((x, i) => {
            if (labels[i] !== c) return;
            cnt++;
            for (let d = 0; d < dim; d++) m[d] += x[d];
          });
          if (cnt) {
            const nrm = Math.hypot(...m) || 1;
            centers[c] = m.map((v) => v / nrm);
          }
        }
        if (same && it > 0) break;
      }
      const inertia = X.reduce((s, x, i) => s + (1 - dot(x, centers[labels[i]])), 0);
      if (!best || inertia < best.inertia - 1e-12) best = { labels, inertia };
    }
    runs.push({ k, labels: best.labels, silhouette: silhouette(best.labels, k) });
  }
  return runs;
}

/** Classical (Torgerson) MDS of unit vectors on cosine distance → 2D, by power iteration. */
export function classicalMds(X) {
  const n = X.length;
  const D2 = X.map((a) => X.map((b) => (1 - dot(a, b)) ** 2));
  const rowMean = D2.map((r) => r.reduce((s, v) => s + v, 0) / n);
  const all = rowMean.reduce((s, v) => s + v, 0) / n;
  const B = D2.map((r, i) => r.map((v, j) => -0.5 * (v - rowMean[i] - rowMean[j] + all)));
  const mul = (M, v) => M.map((r) => dot(r, v));
  const eig = [];
  let M = B.map((r) => [...r]);
  for (let e = 0; e < 2; e++) {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1 + e));
    let lambda = 0;
    for (let it = 0; it < 500; it++) {
      const w = mul(M, v);
      const nrm = Math.hypot(...w) || 1;
      v = w.map((x) => x / nrm);
      lambda = dot(v, mul(M, v));
    }
    eig.push({ v, lambda });
    M = M.map((r, i) => r.map((x, j) => x - lambda * v[i] * v[j]));
  }
  return Array.from({ length: n }, (_, i) => eig.map(({ v, lambda }) => v[i] * Math.sqrt(Math.max(lambda, 0))));
}

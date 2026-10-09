#!/usr/bin/env node
/**
 * One-off generator for src/data/world-map.json — pre-projected country
 * outlines for the /reach "Where" map, so the page ships plain SVG paths with
 * no map library and no third-party tiles (works in mainland China).
 *
 * Source: Natural Earth 1:110m Admin 0 countries (public domain), v5.1.2:
 *   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson
 *
 * Usage:
 *   node scripts/influence/build-world-map.mjs /path/to/ne_110m_admin_0_countries.geojson
 *
 * Projection: Equal Earth (Šavrič, Patterson & Jenny 2018), equal-area, so
 * country fill area is not distorted toward the poles.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "src", "data", "world-map.json");

const src = process.argv[2];
if (!src) {
  console.error("Usage: build-world-map.mjs <ne_110m_admin_0_countries.geojson>");
  process.exit(1);
}

const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const rad = Math.PI / 180;

function equalEarth(lon, lat) {
  const l = lon * rad;
  const theta = Math.asin(M * Math.sin(lat * rad));
  const t2 = theta * theta, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

// Bounds of the projected world (lon ±180, lat ±90).
const [xMax] = equalEarth(180, 0);
const [, yMax] = equalEarth(0, 90);
const WIDTH = 960;
const scale = WIDTH / (2 * xMax);
const HEIGHT_FULL = 2 * yMax * scale;
const CROP_SOUTH = -58; // drop Antarctica / far south
const [, ySouth] = equalEarth(0, CROP_SOUTH);
const HEIGHT = Math.round(yMax * scale - ySouth * scale);

const r1 = (n) => Math.round(n * 10) / 10;
function toXY([lon, lat]) {
  const [x, y] = equalEarth(lon, Math.max(lat, CROP_SOUTH));
  return [r1(x * scale + WIDTH / 2), r1(yMax * scale - y * scale)];
}

function ringPath(ring) {
  let d = "";
  let prev = null;
  for (const pt of ring) {
    const [x, y] = toXY(pt);
    const key = `${x},${y}`;
    if (key === prev) continue;
    d += (d ? "L" : "M") + key;
    prev = key;
  }
  return d + "Z";
}

const geo = JSON.parse(readFileSync(src, "utf-8"));
const countries = [];
for (const f of geo.features) {
  const p = f.properties;
  if (p.ISO_A2_EH === "AQ") continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const d = polys.map((poly) => poly.map(ringPath).join("")).join("");
  countries.push({ iso2: p.ISO_A2_EH === "-99" ? null : p.ISO_A2_EH, name: p.NAME_EN ?? p.NAME, d });
}

writeFileSync(
  OUT,
  JSON.stringify({
    source: "Natural Earth 1:110m Admin 0 countries v5.1.2 (public domain)",
    projection: "Equal Earth",
    width: WIDTH,
    height: HEIGHT,
    countries,
  }) + "\n"
);
console.log(`Wrote ${countries.length} countries to ${OUT} (${WIDTH}×${HEIGHT}, full height ${HEIGHT_FULL.toFixed(0)})`);

// tools/build-admin1.js — per-country province/state outlines for the safety map.
//
// Source: Natural Earth 1:10m "admin 1 – states, provinces" (public domain, no
// attribution required; the 1:50m file only carries nine countries). Downloaded
// once to tools/cache/, then split per country, simplified and written as
// TopoJSON to data/admin1/<ISO2>.json plus
// data/admin1/index.json (the name list the advisory parser matches against).
//
//   cd tools && npm ci && node build-admin1.js
//
// Re-run only when Natural Earth publishes a new release; the output is
// committed, so the daily cron and the site never need this tool.

const fs = require("fs");
const path = require("path");
const https = require("https");
const mapshaper = require("mapshaper");

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(__dirname, "cache");
const OUT = path.join(ROOT, "data", "admin1");
const URL = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip";
const ZIP = path.join(CACHE, "ne_10m_admin_1_states_provinces.zip");
const SHP = path.join(CACHE, "ne_10m_admin_1_states_provinces.shp");
// Natural Earth ships ISO 3166-2 codes as "TR-63"; a few rows have "-99".
const BAD = /^-?99$/;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve(dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "travelnow.info build" } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
    }).on("error", reject);
  });
}

async function main() {
  await download(URL, ZIP);
  fs.mkdirSync(OUT, { recursive: true });

  // One pass to GeoJSON with only the fields we need.
  const cmd = [
    `-i ${JSON.stringify(SHP)} encoding=utf8`,
    "-filter-fields iso_a2,iso_3166_2,name,name_alt,admin",
    "-o format=geojson precision=0.001 out.json",
  ].join(" ");
  const out = await mapshaper.applyCommands(cmd, {});
  const all = JSON.parse(Buffer.from(out["out.json"]).toString("utf8"));
  console.log(`Natural Earth: ${all.features.length} admin-1 units`);

  // Group by country.
  const byCountry = new Map();
  for (const f of all.features) {
    const p = f.properties || {};
    const iso2 = (p.iso_a2 || "").toUpperCase();
    if (!iso2 || BAD.test(iso2) || iso2.length !== 2) continue;
    if (!byCountry.has(iso2)) byCountry.set(iso2, []);
    byCountry.get(iso2).push(f);
  }

  const index = {};
  let written = 0, bytes = 0;
  for (const [iso2, features] of [...byCountry.entries()].sort()) {
    // Stable ids: ISO 3166-2 where Natural Earth has it, else country + running number.
    features.forEach((f, i) => {
      const p = f.properties;
      const code = (p.iso_3166_2 || "").toUpperCase();
      p.id = code && !BAD.test(code.split("-")[1] || "") ? code : `${iso2}-x${i}`;
      p.nm = p.name || p.name_alt || p.id;
      p.alt = p.name_alt && p.name_alt !== p.name ? p.name_alt : undefined;
      delete p.iso_a2; delete p.iso_3166_2; delete p.name; delete p.name_alt;
      delete p.admin;
    });
    const fc = { type: "FeatureCollection", features };
    const res = await mapshaper.applyCommands(
      "-i in.json -simplify 12% keep-shapes -clean -o format=topojson precision=0.005 out.json",
      { "in.json": Buffer.from(JSON.stringify(fc)) });
    const buf = Buffer.from(res["out.json"]);
    fs.writeFileSync(path.join(OUT, `${iso2}.json`), buf);
    bytes += buf.length; written++;
    index[iso2] = features.map(f => ({ id: f.properties.id, nm: f.properties.nm, alt: f.properties.alt }))
      .map(r => (r.alt ? r : { id: r.id, nm: r.nm }));
  }
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
  console.log(`Wrote ${written} country files (${(bytes / 1024 / 1024).toFixed(1)} MB) + index.json (${(fs.statSync(path.join(OUT, "index.json")).size / 1024).toFixed(0)} KB)`);
  const biggest = fs.readdirSync(OUT).filter(f => f !== "index.json")
    .map(f => ({ f, kb: fs.statSync(path.join(OUT, f)).size / 1024 }))
    .sort((a, b) => b.kb - a.kb).slice(0, 5);
  console.log("Largest: " + biggest.map(b => `${b.f} ${b.kb.toFixed(0)} KB`).join(", "));
}

main().catch(e => { console.error(e); process.exit(1); });

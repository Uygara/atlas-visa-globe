// tools/build-admin1-world.js — one coarse file with every country's provinces,
// for the safety map's world view (data/admin1/world.json).
//
// The per-country files (tools/build-admin1.js) are detailed enough to zoom into
// one country. The world view needs all of them at once, so this merges them and
// simplifies much harder; the page then paints only the provinces an advisory
// names. Which provinces are warned changes daily, but the outlines do not, so
// this file is rebuilt only after build-admin1.js:
//
//   cd tools && npm ci && node build-admin1-world.js

const fs = require("fs");
const path = require("path");
const mapshaper = require("mapshaper");

const DIR = path.resolve(__dirname, "..", "data", "admin1");
const OUT = path.join(DIR, "world.json");
const KEEP = process.argv[2] || "4%";

async function toGeo(file) {
  const res = await mapshaper.applyCommands("-i in.json -o format=geojson out.json",
    { "in.json": fs.readFileSync(file) });
  return JSON.parse(Buffer.from(res["out.json"]).toString("utf8"));
}

async function main() {
  const files = fs.readdirSync(DIR).filter(f => /^[A-Z]{2}\.json$/.test(f)).sort();
  const features = [];
  for (const f of files) {
    const iso2 = f.slice(0, 2);
    const fc = await toGeo(path.join(DIR, f));
    for (const ft of fc.features || []) {
      // Keep only what the page needs: the province id and its country.
      ft.properties = { id: ft.properties.id, c: iso2 };
      features.push(ft);
    }
  }
  const res = await mapshaper.applyCommands(
    `-i in.json -dissolve id copy-fields=c -simplify ${KEEP} keep-shapes -filter-islands min-area=10km2 -o format=topojson quantization=10000 out.json`,
    { "in.json": Buffer.from(JSON.stringify({ type: "FeatureCollection", features })) });
  // One object per country (objects.TR, objects.NG…), so the page can decode
  // just the countries an advisory splits, and the country code is not repeated.
  const topo = JSON.parse(Buffer.from(res["out.json"]).toString("utf8"));
  const layer = topo.objects[Object.keys(topo.objects)[0]];
  const objects = {};
  for (const g of layer.geometries) {
    if (!g.type) continue;
    const c = g.properties.c;
    (objects[c] = objects[c] || { type: "GeometryCollection", geometries: [] }).geometries
      .push({ type: g.type, arcs: g.arcs, id: g.properties.id });
  }
  topo.objects = objects;
  const buf = Buffer.from(JSON.stringify(topo));
  fs.writeFileSync(OUT, buf);
  console.log(`world.json: ${features.length} provinces from ${files.length} countries, ${(buf.length / 1024).toFixed(0)} KB (simplify ${KEEP})`);
}

main().catch(e => { console.error(e); process.exit(1); });

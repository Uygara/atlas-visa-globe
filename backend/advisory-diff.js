// advisory-diff.js: compare two advisory snapshots from data/advisory-history/.
//
//   node backend/advisory-diff.js [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--issuer uk]
//
// Default: newest snapshot against the one 7 days earlier (or the oldest available).
// diffSnapshots(a, b) returns [{ issuer, iso, type, ... }] for reuse by digests.
// Types: level (country level changed), region_added, region_removed, region_level.

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "advisory-history");

function diffSnapshots(a, b, issuerFilter) {
  const out = [];
  const issuers = new Set([...Object.keys(a.issuers || {}), ...Object.keys(b.issuers || {})]);
  for (const issuer of issuers) {
    if (issuerFilter && issuer !== issuerFilter) continue;
    const A = (a.issuers && a.issuers[issuer]) || {};
    const B = (b.issuers && b.issuers[issuer]) || {};
    for (const iso of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const x = A[iso] || { level: 0, regions: [] };
      const y = B[iso] || { level: 0, regions: [] };
      if ((x.level || 0) !== (y.level || 0)) out.push({ issuer, iso, type: "level", from: x.level || 0, to: y.level || 0 });
      const rx = new Map((x.regions || []).map(r => [r.name, r.level]));
      const ry = new Map((y.regions || []).map(r => [r.name, r.level]));
      for (const [name, lv] of ry) {
        if (!rx.has(name)) out.push({ issuer, iso, type: "region_added", region: name, to: lv });
        else if (rx.get(name) !== lv) out.push({ issuer, iso, type: "region_level", region: name, from: rx.get(name), to: lv });
      }
      for (const [name, lv] of rx) if (!ry.has(name)) out.push({ issuer, iso, type: "region_removed", region: name, from: lv });
    }
  }
  return out;
}

function listDates() {
  try { return fs.readdirSync(DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort(); }
  catch (e) { return []; }
}
function load(date) { return JSON.parse(fs.readFileSync(path.join(DIR, date + ".json"), "utf8")); }

function pickDates(dates, from, to) {
  if (!dates.length) return null;
  const hi = to || dates[dates.length - 1];
  if (from) return { from, to: hi };
  const target = new Date(hi + "T00:00:00Z").getTime() - 7 * 864e5;
  const older = dates.filter(d => d < hi);
  if (!older.length) return null;
  // Latest snapshot on or before the 7-day target, else the oldest one available.
  const atOrBefore = older.filter(d => new Date(d + "T00:00:00Z").getTime() <= target);
  return { from: atOrBefore.length ? atOrBefore[atOrBefore.length - 1] : older[0], to: hi };
}

function describe(c) {
  const where = `${c.issuer.toUpperCase()} ${c.iso}`;
  if (c.type === "level") return `${where}: level ${c.from} -> ${c.to}`;
  if (c.type === "region_added") return `${where}: region ${c.region} added at level ${c.to}`;
  if (c.type === "region_removed") return `${where}: region ${c.region} removed (was level ${c.from})`;
  return `${where}: region ${c.region} level ${c.from} -> ${c.to}`;
}

module.exports = { diffSnapshots, pickDates };

if (require.main === module) {
  const arg = (n) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : undefined; };
  const dates = listDates();
  const p = pickDates(dates, arg("from"), arg("to"));
  if (!p) { console.log("Not enough snapshots in data/advisory-history/ (need two)."); process.exit(0); }
  for (const d of [p.from, p.to]) if (!fs.existsSync(path.join(DIR, d + ".json"))) { console.error("No snapshot for " + d); process.exit(1); }
  const changes = diffSnapshots(load(p.from), load(p.to), arg("issuer"));
  console.log(`Advisory changes ${p.from} -> ${p.to}: ${changes.length}`);
  for (const c of changes) console.log("  " + describe(c));
}

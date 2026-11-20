// changelog.js — read / clean / write data/changelog.js.
//
// The daily scrape diffs today's Wikipedia tables against yesterday's. Editors
// sometimes flip a cell and flip it back a day or two later (UA → ZA went
// vr → ev on Sep 12 and ev → vr on Sep 14), which produced "gained 1 / lost 1"
// noise for a policy that never changed. collapseFlipFlops() merges chained
// changes to the same passport → destination pair that land within
// FLIP_WINDOW_DAYS of each other into one net change, and drops the ones whose
// net effect is nothing.
//
// Usage from the CLI (one-off clean of the existing file):
//   node backend/changelog.js --clean

const fs = require("fs");
const path = require("path");

const CHANGELOG_PATH = path.join(__dirname, "..", "data", "changelog.js");
const FLIP_WINDOW_DAYS = 14;
const DAY_MS = 86400_000;

function readChangelog(file = CHANGELOG_PATH) {
  const text = fs.readFileSync(file, "utf8");
  const w = {};
  new Function("window", text)(w);
  const header = text.slice(0, text.indexOf("window.CHANGELOG = ["));
  return { header, entries: w.CHANGELOG || [] };
}

const pairKey = (c) => `${(c.affects.passports || [])[0]}>${c.affects.dest}`;
const dayMs = (d) => new Date(d + "T00:00:00Z").getTime();

function collapseFlipFlops(entries, windowDays = FLIP_WINDOW_DAYS) {
  const groups = new Map();
  for (const c of entries) {
    const k = pairKey(c);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  const out = [];
  for (const list of groups.values()) {
    // Chronological; entries written the same day keep file order (newest first
    // in the file, so reverse to get the order they were applied in).
    const chrono = list.slice().reverse().sort((a, b) => a.date.localeCompare(b.date));
    let run = null;
    const flush = () => { if (run && run.statusFrom !== run.statusTo) out.push(run); };
    for (const c of chrono) {
      const chained = run
        && c.statusFrom === run.statusTo
        && dayMs(c.date) - dayMs(run.date) <= windowDays * DAY_MS;
      if (chained) {
        run = { ...run, date: c.date, statusTo: c.statusTo };
      } else {
        flush();
        run = { ...c };
      }
    }
    flush();
  }
  for (const c of out) {
    const [p, d] = pairKey(c).split(">");
    c.title = `${p} → ${d}: ${c.statusFrom} → ${c.statusTo}`;
  }
  // File order: newest first.
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

// Status of a destination in a snapshot entry: the list it sits in, else the passport's
// own default (US is "vf" by default), else "vr".
function rawStatus(entry, dest) {
  for (const s of ["vf", "ev", "voa", "vr", "ban"]) {
    for (const e of entry[s] || []) if ((Array.isArray(e) ? e[0] : e) === dest) return s;
  }
  return entry.default || "vr";
}

// Drop every entry of a passport → destination pair whose newest entry no longer matches
// the current snapshot: the chain is broken (a change back was never logged, or the old
// default bug in computeChangelog logged a change that did not happen), so none of it
// can be trusted. Pairs whose passport is not in the snapshot are kept as they are.
// With `resolve` (the map's own resolveStatus, see loadResolver) the newest entry must also
// match what the map shows, so a sourced override wins over the raw scrape: India → UK
// "vr → ev" was Wikipedia relabelling UK visas as digital eVisas, not a policy change.
// ETA and ID-card travel are display relabels of ev and vf, so they count as equal.
const SAME = { eta: "ev", idc: "vf" };
function reconcile(entries, snapshot, resolve) {
  const newest = new Map();
  for (const c of entries) {
    const k = pairKey(c);
    const n = newest.get(k);
    if (!n || c.date > n.date) newest.set(k, c); // file is newest first: ties keep the first
  }
  const broken = new Set();
  for (const [k, c] of newest) {
    const [p, d] = k.split(">");
    if (!snapshot[p]) continue;
    if (rawStatus(snapshot[p], d) !== c.statusTo) { broken.add(k); continue; }
    if (resolve) {
      const shown = (resolve(p, d) || {}).status;
      if (shown && (SAME[shown] || shown) !== c.statusTo) broken.add(k);
    }
  }
  return entries.filter((c) => !broken.has(pairKey(c)));
}

// The browser data layer in a sandbox, so reconcile() can see what the map shows.
function loadResolver(dataDir = path.join(__dirname, "..", "data")) {
  const vm = require("vm");
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["countries.js", "passports.js", "visa-overrides.js"]) {
    vm.runInContext(fs.readFileSync(path.join(dataDir, f), "utf8"), ctx, { filename: f });
  }
  return (p, d) => ctx.resolveStatus(p, d);
}

function serializeEntry(c) {
  const passport = (c.affects.passports || [])[0];
  return `  {\n    date: "${c.date}",\n    title: "${c.title}",\n    affects: { dest: "${c.affects.dest}", passports: ["${passport}"] },\n    statusFrom: "${c.statusFrom}", statusTo: "${c.statusTo}",\n  },`;
}

function writeChangelog(header, entries, file = CHANGELOG_PATH) {
  const body = entries.map(serializeEntry).join("\n");
  fs.writeFileSync(file, `${header}window.CHANGELOG = [\n${body}\n];\n`);
}

module.exports = { readChangelog, collapseFlipFlops, reconcile, rawStatus, loadResolver, writeChangelog, FLIP_WINDOW_DAYS };

if (require.main === module && process.argv.includes("--clean")) {
  const { header, entries } = readChangelog();
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "passports-snapshot.json"), "utf8"));
  const cleaned = reconcile(collapseFlipFlops(entries), snapshot, loadResolver());
  writeChangelog(header, cleaned);
  console.log(`changelog: ${entries.length} → ${cleaned.length} entries (flip-flops within ${FLIP_WINDOW_DAYS} days collapsed, broken chains dropped)`);
}

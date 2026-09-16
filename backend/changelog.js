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

function serializeEntry(c) {
  const passport = (c.affects.passports || [])[0];
  return `  {\n    date: "${c.date}",\n    title: "${c.title}",\n    affects: { dest: "${c.affects.dest}", passports: ["${passport}"] },\n    statusFrom: "${c.statusFrom}", statusTo: "${c.statusTo}",\n  },`;
}

function writeChangelog(header, entries, file = CHANGELOG_PATH) {
  const body = entries.map(serializeEntry).join("\n");
  fs.writeFileSync(file, `${header}window.CHANGELOG = [\n${body}\n];\n`);
}

module.exports = { readChangelog, collapseFlipFlops, writeChangelog, FLIP_WINDOW_DAYS };

if (require.main === module && process.argv.includes("--clean")) {
  const { header, entries } = readChangelog();
  const cleaned = collapseFlipFlops(entries);
  writeChangelog(header, cleaned);
  console.log(`changelog: ${entries.length} → ${cleaned.length} entries (flip-flops within ${FLIP_WINDOW_DAYS} days collapsed)`);
}

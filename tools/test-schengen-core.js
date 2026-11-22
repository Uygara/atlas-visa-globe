// Tests for assets/schengen-core.js (Schengen 90/180). Run: node tools/test-schengen-core.js
const assert = require("assert");
const C = require("../assets/schengen-core.js");
let n = 0;
function test(name, fn) { fn(); n++; console.log("  ✓ " + name); }

test("a 10-day stay counts 10 days, both ends included", () => {
  assert.strictEqual(C.daysUsedAt("2026-03-10", [{ entry: "2026-03-01", exit: "2026-03-10" }]), 10);
});

test("days older than the 180-day window drop out", () => {
  // Window ending 2026-07-01 starts 2026-01-03 (180 days inclusive).
  assert.strictEqual(C.daysUsedAt("2026-07-01", [{ entry: "2026-01-01", exit: "2026-01-05" }]), 3);
});

test("a full 90-day stay is allowed, 91 is not", () => {
  const start = C.parseDate("2026-01-01");
  assert.strictEqual(C.stayOk([], start, 90), true);
  assert.strictEqual(C.stayOk([], start, 91), false);
  assert.strictEqual(C.maxStayFrom([], start), 90);
});

test("after 90 days used, the next 90-day stay starts 180 days after the first entry", () => {
  const trips = [{ entry: "2026-01-01", exit: "2026-03-31" }]; // 90 days
  assert.strictEqual(C.fmt(C.nextAvailableDate(trips, 90, C.parseDate("2026-04-01"))), "2026-06-30");
});

test("touching and overlapping stops merge into one stay", () => {
  const m = C.mergeStays([
    { entry: "2026-05-01", exit: "2026-05-05" }, // France
    { entry: "2026-05-05", exit: "2026-05-10" }, // Italy, same changeover day
    { entry: "2026-05-11", exit: "2026-05-12" }, // Austria, next day: still one continuous stay
  ]);
  assert.deepStrictEqual(m, [{ entry: "2026-05-01", exit: "2026-05-12" }]);
});

test("a changeover day is counted once in a plan", () => {
  const r = C.checkPlan([{ entry: "2026-05-01", exit: "2026-05-05" }, { entry: "2026-05-05", exit: "2026-05-10" }]);
  assert.strictEqual(r.peak, 10);
  assert.strictEqual(r.ok, true);
});

test("a plan over 90 days reports the first breach day", () => {
  const r = C.checkPlan([{ entry: "2026-01-01", exit: "2026-02-28" }, { entry: "2026-03-01", exit: "2026-04-15" }]);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.firstBreach, "2026-04-01"); // day 91
});

test("membership: 29 states, Bulgaria and Romania in, Cyprus and Ireland out", () => {
  assert.strictEqual(C.MEMBERS.length, 29);
  assert.ok(C.isMember("bg") && C.isMember("RO"));
  assert.ok(!C.isMember("CY") && !C.isMember("IE"));
});

test("the list matches data/etias-rules.js and backend/fetch-news.js", () => {
  const fs = require("fs"), path = require("path");
  for (const f of ["data/etias-rules.js", "backend/fetch-news.js"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    for (const iso of C.MEMBERS) assert.ok(src.includes(`"${iso}"`), `${iso} missing in ${f}`);
  }
});

console.log(`${n} passed`);

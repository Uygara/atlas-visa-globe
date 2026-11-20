// Tests for the changelog diff and clean-up (roadmap D9). Run: node backend/test-changelog.js
const assert = require("assert");
const { computeChangelog } = require("./scraper.js");
const { reconcile, rawStatus, loadResolver, readChangelog } = require("./changelog.js");

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log("ok  " + name); };
const entry = (date, p, d, from, to) => ({ date, title: "", affects: { dest: d, passports: [p] }, statusFrom: from, statusTo: to });

t("unlisted destination uses the passport default, not vr", () => {
  const prev = { US: { default: "vf", vr: [["LV", null]] } };
  const next = { US: { default: "vf", vr: [] } };
  const c = computeChangelog(prev, next);
  assert.strictEqual(c.length, 1);
  assert.strictEqual(c[0].from, "vr");
  assert.strictEqual(c[0].to, "vf");
});

t("leaving the list for the same default is no change", () => {
  const prev = { US: { default: "vf", vf: [["LV", 90]] } };
  const next = { US: { default: "vf", vf: [] } };
  assert.strictEqual(computeChangelog(prev, next).length, 0);
});

t("rawStatus falls back to the default", () => {
  assert.strictEqual(rawStatus({ default: "vf", ev: ["GB"] }, "GB"), "ev");
  assert.strictEqual(rawStatus({ default: "vf" }, "LV"), "vf");
  assert.strictEqual(rawStatus({}, "LV"), "vr");
});

t("reconcile drops a pair whose newest entry no longer matches the snapshot", () => {
  const es = [entry("2026-10-09", "US", "LV", "vf", "vr"), entry("2026-10-01", "US", "PW", "vr", "vf")];
  const out = reconcile(es, { US: { default: "vf" } });
  assert.deepStrictEqual(out.map((e) => e.affects.dest), ["PW"]);
});

t("reconcile keeps history when the chain ends on the current status", () => {
  const es = [entry("2026-11-09", "IR", "PH", "ev", "vr"), entry("2026-10-24", "IR", "PH", "vr", "ev")];
  assert.strictEqual(reconcile(es, { IR: { default: "vr" } }).length, 2);
});

t("reconcile with resolver: map override wins, eta counts as ev", () => {
  const es = [entry("2026-10-18", "IN", "GB", "vr", "ev"), entry("2026-10-03", "MD", "NZ", "vr", "ev")];
  const snap = { IN: { default: "vr", ev: ["GB"] }, MD: { default: "vr", ev: ["NZ"] } };
  const resolve = (p, d) => ({ status: p === "IN" ? "vr" : "eta" });
  assert.deepStrictEqual(reconcile(es, snap, resolve).map((e) => e.affects.dest), ["NZ"]);
});

t("current data file is reconciled (no broken chains left)", () => {
  const snap = require("../data/passports-snapshot.json");
  const { entries } = readChangelog();
  assert.strictEqual(reconcile(entries, snap, loadResolver()).length, entries.length);
});

t("UK visa nationals are vr for GB, ETA countries stay eta", () => {
  const resolve = loadResolver();
  for (const p of ["IN", "UA", "MD", "AL", "LK", "BD", "TR"]) assert.strictEqual(resolve(p, "GB").status, "vr", p);
  for (const p of ["US", "TW", "JP"]) assert.strictEqual(resolve(p, "GB").status, "eta", p);
});

console.log(`${passed} passed`);

// Tests for assets/trips-core.js (travel planner trips). Run: node tools/test-trips-core.js
const assert = require("assert");
const T = require("../assets/trips-core.js");
let n = 0;
function test(name, fn) { fn(); n++; console.log("  ✓ " + name); }

test("the old single trip becomes the first trip", () => {
  const s = T.load(null, JSON.stringify({ passport: "TR", stops: ["JP", "KR"], departure: "2026-12-01" }));
  assert.strictEqual(s.trips.length, 1);
  assert.deepStrictEqual(s.trips[0].stops.map((x) => x.iso), ["JP", "KR"]);
  assert.strictEqual(s.trips[0].stops[0].arrive, "2026-12-01");
  assert.strictEqual(s.active, s.trips[0].id);
});

test("saved trips win over the old key", () => {
  const raw = JSON.stringify({ v: 1, active: "tabc1", trips: [{ id: "tabc1", name: "Japan", stops: [{ iso: "JP" }] }] });
  const s = T.load(raw, JSON.stringify({ stops: ["FR"] }));
  assert.strictEqual(s.trips[0].name, "Japan");
});

test("bad input is cleaned, not stored", () => {
  const t = T.cleanTrip({ name: "x".repeat(200), stops: [{ iso: "zz1" }, { iso: "fr", arrive: "2026-05-10", leave: "2026-05-01", via: "cdg" }, "<script>"], done: { "JP:visa": true, "bad key!": 1 } });
  assert.strictEqual(t.name.length, 60);
  assert.deepStrictEqual(t.stops, [{ iso: "FR", arrive: "2026-05-10", leave: "", via: "CDG" }]);
  assert.deepStrictEqual(t.done, { "JP:visa": 1 });
});

test("limits: 10 trips, 15 stops", () => {
  const many = { v: 1, trips: Array.from({ length: 14 }, () => ({ stops: Array.from({ length: 20 }, () => ({ iso: "JP" })) })) };
  const s = T.load(JSON.stringify(many), null);
  assert.strictEqual(s.trips.length, 10);
  assert.strictEqual(s.trips[0].stops.length, 15);
});

test("serialize mirrors the active trip to the old key for the notification jobs", () => {
  const s = T.load(JSON.stringify({ v: 1, active: "tb2222", trips: [{ id: "ta1111", stops: [{ iso: "IT" }] }, { id: "tb2222", stops: [{ iso: "JP", arrive: "2026-12-01" }, { iso: "KR" }] }] }), null);
  const out = T.serialize(s, "tr");
  assert.deepStrictEqual(JSON.parse(out.itinerary), { passport: "TR", stops: ["JP", "KR"], departure: "2026-12-01" });
  assert.strictEqual(JSON.parse(out.trips).active, "tb2222");
});

test("total days and date problems", () => {
  const t = T.cleanTrip({ stops: [{ iso: "FR", arrive: "2026-05-01", leave: "2026-05-05" }, { iso: "IT", arrive: "2026-05-04", leave: "2026-05-10" }, { iso: "AT" }] });
  assert.strictEqual(T.totalDays(t), 10);
  assert.deepStrictEqual(T.dateIssues(t).map((x) => x.kind + x.index), ["overlap1", "missing2"]);
});

test("reorder stops", () => {
  assert.deepStrictEqual(T.move(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
  assert.deepStrictEqual(T.move(["a", "b"], 0, 5), ["a", "b"]);
});

test("the passport expiry stays on the device (not in the sync list)", () => {
  const { SYNC_KEYS } = require("../assets/account-sync.js");
  assert.ok(SYNC_KEYS.includes("atlas.trips"));
  assert.ok(!SYNC_KEYS.includes("atlas.passport.expiry"));
});

console.log(`${n} passed`);

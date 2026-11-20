// node tools/test-account-sync.js — checks the account merge rules.
const assert = require("assert");
const { merge } = require("../assets/account-sync.js");

const e = (v, t) => ({ v, t });
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("  ✓ " + name); };

test("new device, empty cloud: local data goes up", () => {
  const r = merge({ "atlas.passport": e("TR", 0) }, {});
  assert.deepStrictEqual(r.toLocal, []);
  assert.strictEqual(r.toCloud, true);
  assert.strictEqual(r.merged["atlas.passport"].v, "TR");
});

test("second device with nothing saved: cloud data comes down", () => {
  const r = merge({}, { "atlas.passport": e("TR", 100), "atlas.watchlist": e('["JP"]', 100) });
  assert.deepStrictEqual(r.toLocal.sort(), ["atlas.passport", "atlas.watchlist"]);
  assert.strictEqual(r.toCloud, false);
});

test("newer write wins per key", () => {
  const r = merge(
    { "atlas.passport": e("DE", 200), "atlas.lang": e("en", 50) },
    { "atlas.passport": e("TR", 100), "atlas.lang": e("tr", 150) });
  assert.strictEqual(r.merged["atlas.passport"].v, "DE");
  assert.strictEqual(r.merged["atlas.lang"].v, "tr");
  assert.deepStrictEqual(r.toLocal, ["atlas.lang"]);
  assert.strictEqual(r.toCloud, true);
});

test("a deletion (null) propagates when it is newer", () => {
  const r = merge({ "atlas.itinerary": e('{"stops":["JP"]}', 100) }, { "atlas.itinerary": e(null, 300) });
  assert.strictEqual(r.merged["atlas.itinerary"].v, null);
  assert.deepStrictEqual(r.toLocal, ["atlas.itinerary"]);
});

test("pre-account watchlist is unioned with the cloud list, not dropped", () => {
  const r = merge({ "atlas.watchlist": e('["JP","TH"]', 0) }, { "atlas.watchlist": e('["GE","JP"]', 500) });
  assert.strictEqual(r.merged["atlas.watchlist"].v, '["GE","JP","TH"]');
  assert.deepStrictEqual(r.toLocal, ["atlas.watchlist"]);
  assert.strictEqual(r.toCloud, true);
});

test("once synced, removing a starred country is not undone by the union", () => {
  const r = merge({ "atlas.watchlist": e('["GE"]', 900) }, { "atlas.watchlist": e('["GE","JP"]', 500) });
  assert.strictEqual(r.merged["atlas.watchlist"].v, '["GE"]');
  assert.strictEqual(r.toCloud, true);
});

test("identical values need no writes", () => {
  const r = merge({ "atlas.passport": e("TR", 0) }, { "atlas.passport": e("TR", 100) });
  assert.deepStrictEqual(r.toLocal, []);
  assert.strictEqual(r.toCloud, false);
});

test("keys outside the sync list are ignored", () => {
  const r = merge({ "atlas.foryou.collapsed": e("1", 5) }, {});
  assert.deepStrictEqual(r.merged, {});
  assert.strictEqual(r.toCloud, false);
});

test("travel panel keys travel with the account", () => {
  const r = merge({}, { "atlas.passports": e('["DE"]', 100), "atlas.panel.seen": e("1763600000000", 100) });
  assert.deepStrictEqual(r.toLocal.sort(), ["atlas.panel.seen", "atlas.passports"]);
});

test("pre-account extra passports are unioned with the cloud list", () => {
  const r = merge({ "atlas.passports": e('["DE"]', 0) }, { "atlas.passports": e('["GB"]', 500) });
  assert.strictEqual(r.merged["atlas.passports"].v, '["GB","DE"]');
});

test("the cloud document stays within the rules' 20-key limit", () => {
  assert.ok(require("../assets/account-sync.js").SYNC_KEYS.length <= 20);
});

console.log(`${n} passed`);

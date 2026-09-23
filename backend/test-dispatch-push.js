// Tests for the decisions in dispatch-push.js (who gets which notification, when).
//   node backend/test-dispatch-push.js
const assert = require("assert");
const p = require("./dispatch-push.js");
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; } };

const stored = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { v: typeof v === "string" ? v : JSON.stringify(v), t: 1 }]));
const TODAY = "2026-09-23";
const LOG = [
  { date: "2026-09-23", title: "TR → JP", affects: { dest: "JP", passports: ["TR"] }, statusFrom: "vf", statusTo: "ev" },
  { date: "2026-09-23", title: "TR → TH", affects: { dest: "TH", passports: ["TR"] }, statusFrom: "vr", statusTo: "vf" },
  { date: "2026-09-22", title: "TR → DE", affects: { dest: "DE", passports: ["TR"] }, statusFrom: "vr", statusTo: "voa" },
  { date: "2026-09-19", title: "TR → FR (too old)", affects: { dest: "FR", passports: ["TR"] }, statusFrom: "vr", statusTo: "vf" },
  { date: "2026-09-23", title: "UA → PH", affects: { dest: "PH", passports: ["UA"] }, statusFrom: "vr", statusTo: "ev" },
  { date: "2026-09-23", title: "everyone", affects: { dest: "BR", passports: [] }, statusFrom: "vr", statusTo: "ev" },
];

console.log("profileOf");
t("reads passport, watchlist, itinerary stops and language from synced values", () => {
  const pr = p.profileOf(stored({ "atlas.passport": "tr", "atlas.watchlist": ["JP", "IT"], "atlas.itinerary": { passport: "TR", stops: ["FR", { iso2: "ES" }], departure: "2026-11-01" }, "atlas.lang": "tr" }));
  assert.strictEqual(pr.passport, "TR");
  assert.deepStrictEqual([...pr.watch].sort(), ["IT", "JP"]);
  assert.deepStrictEqual([...pr.stops].sort(), ["ES", "FR"]);
  assert.strictEqual(pr.lang, "tr");
});
t("accepts a JSON-quoted passport and survives missing data", () => {
  assert.strictEqual(p.profileOf(stored({ "atlas.passport": '"de"' })).passport, "DE");
  const e = p.profileOf({});
  assert.strictEqual(e.passport, null); assert.strictEqual(e.watch.size, 0);
});

console.log("pickVisaChanges");
t("only the person's own passport, within the 3-day window, no 'everyone' entries", () => {
  const c = p.pickVisaChanges(LOG, { passport: "TR", watch: new Set(), stops: new Set() }, new Set(), TODAY);
  assert.deepStrictEqual(c.map((x) => x.dest).sort(), ["DE", "JP", "TH"]);
});
t("watched and planned countries lead", () => {
  const c = p.pickVisaChanges(LOG, { passport: "TR", watch: new Set(), stops: new Set(["TH"]) }, new Set(), TODAY);
  assert.strictEqual(c[0].dest, "TH");
});
t("a change already sent is not sent again", () => {
  const all = p.pickVisaChanges(LOG, { passport: "TR", watch: new Set(), stops: new Set() }, new Set(), TODAY);
  const again = p.pickVisaChanges(LOG, { passport: "TR", watch: new Set(), stops: new Set() }, new Set(all.map((x) => x.key)), TODAY);
  assert.strictEqual(again.length, 0);
});
t("no passport, no notification", () => assert.strictEqual(p.pickVisaChanges(LOG, { passport: null, watch: new Set(), stops: new Set() }, new Set(), TODAY).length, 0));

console.log("pickSafetyChanges");
const adv = (l) => ({ uk: { level: l[0] }, us: { level: l[1] }, ca: { level: l[2] } });
t("the strictest of the three governments decides", () => {
  const prev = { MX: adv([2, 2, 2]), FR: adv([1, 1, 1]) }, cur = { MX: adv([2, 3, 2]), FR: adv([1, 1, 1]) };
  const prof = { passport: "TR", watch: new Set(), stops: new Set(["MX", "FR"]) };
  const c = p.pickSafetyChanges(prev, cur, prof, new Set(), TODAY);
  assert.strictEqual(c.length, 1); assert.deepStrictEqual([c[0].dest, c[0].from, c[0].to], ["MX", 2, 3]);
});
t("countries the person doesn't plan or watch never notify", () => {
  const c = p.pickSafetyChanges({ MX: adv([2, 2, 2]) }, { MX: adv([4, 4, 4]) }, { watch: new Set(), stops: new Set(["FR"]) }, new Set(), TODAY);
  assert.strictEqual(c.length, 0);
});
t("missing yesterday's data means no false alarm", () => {
  const c = p.pickSafetyChanges(null, { MX: adv([3, 3, 3]) }, { watch: new Set(["MX"]), stops: new Set() }, new Set(), TODAY);
  assert.strictEqual(c.length, 0);
});

console.log("isQuiet (21:00–08:00 on the phone's clock)");
const at = (h) => new Date(Date.UTC(2026, 8, 23, h, 0, 0));
t("Istanbul (UTC+3): 06:00 UTC is 09:00 → fine; 19:00 UTC is 22:00 → quiet", () => {
  assert.strictEqual(p.isQuiet("Europe/Istanbul", at(6)), false);
  assert.strictEqual(p.isQuiet("Europe/Istanbul", at(19)), true);
});
t("Los Angeles: 06:00 UTC is 23:00 the evening before → quiet", () => assert.strictEqual(p.isQuiet("America/Los_Angeles", at(6)), true));
t("unknown zone falls back to UTC instead of throwing", () => assert.strictEqual(p.isQuiet("Not/AZone", at(12)), false));

console.log("compose (real i18n + country names)");
const W = p.loadWindow();
t("one rule change: '<Country>: <old> → <new>' in the person's language", () => {
  const m = p.compose([{ kind: "visa", key: "k", dest: "JP", from: "vf", to: "ev", date: "2026-09-23" }], "en", W);
  assert.strictEqual(m.title, "Japan: Visa-free → eVisa");
  assert.strictEqual(m.path, "/");
  const tr = p.compose([{ kind: "visa", key: "k", dest: "JP", from: "vf", to: "ev", date: "2026-09-23" }], "tr", W);
  assert.strictEqual(tr.title, "Japonya: Vizesiz → e-Vize");
  assert.ok(/23 Eylül/.test(tr.body), tr.body);
});
t("several changes collapse into one notification, listing the top three", () => {
  const cs = ["JP", "TH", "DE", "FR"].map((d, i) => ({ kind: "visa", key: "k" + i, dest: d, from: "vr", to: "vf", date: "2026-09-23" }));
  const m = p.compose(cs, "en", W);
  assert.strictEqual(m.title, "4 visa rules changed for your passport");
  assert.strictEqual(m.body.split(" · ").length, 3);
  assert.strictEqual(m.keys.length, 4);
});
t("a safety change opens the safety map", () => {
  const m = p.compose([{ kind: "safety", key: "s", dest: "MX", from: 2, to: 3, date: TODAY }], "en", W);
  assert.strictEqual(m.title, "Mexico: safety advice 2 → 3");
  assert.strictEqual(m.path, "/safety-map/index.html");
});
t("every language has the same set of text keys", () => {
  const keys = Object.keys(p.TXT.en).sort().join();
  for (const l of Object.keys(p.TXT)) assert.strictEqual(Object.keys(p.TXT[l]).sort().join(), keys, l);
});

console.log(`\n${n} passed`);

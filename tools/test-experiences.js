// Client-side checks of assets/experiences.js, and that firestore.rules uses the same
// personal-data pattern.   node tools/test-experiences.js
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/experiences.js"), "utf8"), { window: win, localStorage: { getItem: () => null, setItem() {} }, Date, JSON, Number, String, RegExp, Promise, setTimeout });
const E = win.ATLAS_EXPERIENCES;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ✓ " + name); } catch (e) { console.error("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; } };
const ok = { passport: "TR", dest: "FR", route: "embassy", month: "2026-10", days: 14, text: "Applied at the consulate, the visa came after two weeks. They asked for bank statements." };
t("a normal post passes", () => assert.strictEqual(E.check(ok), null));
t("short, long, month in the future, bad days", () => {
  assert.strictEqual(E.check({ ...ok, text: "Easy." }), "short");
  assert.strictEqual(E.check({ ...ok, text: "x".repeat(1001) }), "long");
  assert.strictEqual(E.check({ ...ok, month: "2099-01" }), "month");
  assert.strictEqual(E.check({ ...ok, days: -1 }), "days");
  assert.strictEqual(E.check({ ...ok, route: "bribe" }), "route");
  assert.strictEqual(E.check({ ...ok, dest: "TR" }), "pair");
});
for (const x of ["see https://a.org for details and more", "agency.com did it", "mail me a@b.co", "@joe has the details", "call +90 532 123 45 67", "passport U12345678"])
  t("pii: " + x, () => assert.strictEqual(E.check({ ...ok, text: ok.text + " " + x }), "pii"));
t("dates and prices are not personal data", () => assert.strictEqual(E.check({ ...ok, text: ok.text + " Applied 2026-10-03, paid 80 EUR, issued 14.10.2026." }), null));
t("firestore.rules carries the same pattern", () => {
  const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  assert.ok(rules.includes("'(?is).*(" + E.PII.replace(/\\/g, "\\\\") + ").*'"));
});
console.log(`\n${n} passed`);

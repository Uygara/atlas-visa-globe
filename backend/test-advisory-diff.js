const { diffSnapshots, pickDates } = require("./advisory-diff");

const a = { date: "2026-11-10", issuers: { uk: {
  TR: { level: 2, regions: [{ name: "TR-30", level: 3 }, { name: "TR-73", level: 3 }] },
  FR: { level: 1 },
  XX: { level: 2 },
}, us: { TR: { level: 2 } } } };
const b = { date: "2026-11-17", issuers: { uk: {
  TR: { level: 2, regions: [{ name: "TR-30", level: 4 }, { name: "TR-21", level: 3 }] },
  FR: { level: 2 },
}, us: { TR: { level: 2 } } } };

let fails = 0;
const check = (name, ok) => { console.log((ok ? "ok   " : "FAIL ") + name); if (!ok) fails++; };

const d = diffSnapshots(a, b);
const has = (f) => d.some(f);
check("country level change", has(c => c.issuer === "uk" && c.iso === "FR" && c.type === "level" && c.from === 1 && c.to === 2));
check("region added", has(c => c.iso === "TR" && c.type === "region_added" && c.region === "TR-21"));
check("region removed", has(c => c.iso === "TR" && c.type === "region_removed" && c.region === "TR-73"));
check("region level change", has(c => c.iso === "TR" && c.type === "region_level" && c.region === "TR-30" && c.to === 4));
check("country dropped counts as level change", has(c => c.iso === "XX" && c.type === "level" && c.to === 0));
check("unchanged issuer is silent", !has(c => c.issuer === "us"));
check("issuer filter", diffSnapshots(a, b, "us").length === 0);
check("identical snapshots give no changes", diffSnapshots(a, a).length === 0);
const dates = ["2026-11-01", "2026-11-09", "2026-11-12", "2026-11-16"];
check("pickDates 7 days earlier", JSON.stringify(pickDates(dates, null, null)) === JSON.stringify({ from: "2026-11-09", to: "2026-11-16" }));
check("pickDates falls back to oldest", pickDates(["2026-11-14", "2026-11-16"]).from === "2026-11-14");
process.exit(fails ? 1 : 0);

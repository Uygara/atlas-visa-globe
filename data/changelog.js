// Recently-changed visa policies — populated daily by the GitHub Actions cron.
// Each entry is a real diff between yesterday's and today's Wikipedia snapshot.
//
// Reset on 2026-05-21 because earlier entries reflected our own scraper/data
// migrations (adding Kosovo, fixing the classifier, etc.) rather than real
// policy changes. From now on this file only accumulates genuine day-over-day
// differences detected by backend/scraper.js → computeChangelog().

window.CHANGELOG = [
  {
    date: "2026-06-07",
    title: "TW → LK: vr → voa",
    affects: { dest: "LK", passports: ["TW"] },
    statusFrom: "vr", statusTo: "voa",
  },
  {
    date: "2026-06-06",
    title: "CN → NI: vr → ev",
    affects: { dest: "NI", passports: ["CN"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-05",
    title: "CN → UY: vr → vf",
    affects: { dest: "UY", passports: ["CN"] },
    statusFrom: "vr", statusTo: "vf",
  },
  {
    date: "2026-06-05",
    title: "IR → SC: vr → ev",
    affects: { dest: "SC", passports: ["IR"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-05",
    title: "UZ → HK: vr → vf",
    affects: { dest: "HK", passports: ["UZ"] },
    statusFrom: "vr", statusTo: "vf",
  },
  {
    date: "2026-06-05",
    title: "UZ → MO: vr → voa",
    affects: { dest: "MO", passports: ["UZ"] },
    statusFrom: "vr", statusTo: "voa",
  },
  {
    date: "2026-06-04",
    title: "TW → CF: vr → vr",
    affects: { dest: "CF", passports: ["TW"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-06-02",
    title: "CN → KH: ev → vf",
    affects: { dest: "KH", passports: ["CN"] },
    statusFrom: "ev", statusTo: "vf",
  },
  {
    date: "2026-06-02",
    title: "IR → GH: vr → ev",
    affects: { dest: "GH", passports: ["IR"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-01",
    title: "LB → OM: vf → ev",
    affects: { dest: "OM", passports: ["LB"] },
    statusFrom: "vf", statusTo: "ev",
  },
  {
    date: "2026-06-01",
    title: "LB → SV: vr → ev",
    affects: { dest: "SV", passports: ["LB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-01",
    title: "LB → NI: vr → ev",
    affects: { dest: "NI", passports: ["LB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-01",
    title: "LB → SG: vr → ev",
    affects: { dest: "SG", passports: ["LB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-06-01",
    title: "LB → AE: vr → ev",
    affects: { dest: "AE", passports: ["LB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-31",
    title: "QA → ME: vr → vr",
    affects: { dest: "ME", passports: ["QA"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-05-30",
    title: "DE → SY: voa → ev",
    affects: { dest: "SY", passports: ["DE"] },
    statusFrom: "voa", statusTo: "ev",
  },
  {
    date: "2026-05-30",
    title: "DE → GH: vr → ev",
    affects: { dest: "GH", passports: ["DE"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-30",
    title: "GB → GH: vr → ev",
    affects: { dest: "GH", passports: ["GB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-30",
    title: "GB → LR: vr → ev",
    affects: { dest: "LR", passports: ["GB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-30",
    title: "RO → GH: vr → ev",
    affects: { dest: "GH", passports: ["RO"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-30",
    title: "TW → GH: vr → vr",
    affects: { dest: "GH", passports: ["TW"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-05-30",
    title: "TW → KZ: vr → vr",
    affects: { dest: "KZ", passports: ["TW"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-05-30",
    title: "IN → SV: vf → vr",
    affects: { dest: "SV", passports: ["IN"] },
    statusFrom: "vf", statusTo: "vr",
  },
  {
    date: "2026-05-30",
    title: "IN → OM: vf → vr",
    affects: { dest: "OM", passports: ["IN"] },
    statusFrom: "vf", statusTo: "vr",
  },
  {
    date: "2026-05-30",
    title: "LB → GH: vr → ev",
    affects: { dest: "GH", passports: ["LB"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-29",
    title: "IR → SR: vf → vr",
    affects: { dest: "SR", passports: ["IR"] },
    statusFrom: "vf", statusTo: "vr",
  },
  {
    date: "2026-05-28",
    title: "CN → GH: vr → ev",
    affects: { dest: "GH", passports: ["CN"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-27",
    title: "HK → SL: ev → voa",
    affects: { dest: "SL", passports: ["HK"] },
    statusFrom: "ev", statusTo: "voa",
  },
  {
    date: "2026-05-27",
    title: "HK → GH: vr → ev",
    affects: { dest: "GH", passports: ["HK"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-27",
    title: "KW → GH: vr → ev",
    affects: { dest: "GH", passports: ["KW"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-26",
    title: "BR → GH: vr → ev",
    affects: { dest: "GH", passports: ["BR"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-26",
    title: "UA → BS: ev → vr",
    affects: { dest: "BS", passports: ["UA"] },
    statusFrom: "ev", statusTo: "vr",
  },
  {
    date: "2026-05-26",
    title: "UA → SG: ev → vr",
    affects: { dest: "SG", passports: ["UA"] },
    statusFrom: "ev", statusTo: "vr",
  },
  {
    date: "2026-05-26",
    title: "UA → GM: vr → vr",
    affects: { dest: "GM", passports: ["UA"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-05-25",
    title: "HK → SN: vr → voa",
    affects: { dest: "SN", passports: ["HK"] },
    statusFrom: "vr", statusTo: "voa",
  },
  {
    date: "2026-05-25",
    title: "UA → GH: vr → ev",
    affects: { dest: "GH", passports: ["UA"] },
    statusFrom: "vr", statusTo: "ev",
  },
  {
    date: "2026-05-24",
    title: "EE → NI: vr → vr",
    affects: { dest: "NI", passports: ["EE"] },
    statusFrom: "vr", statusTo: "vr",
  },
  {
    date: "2026-05-24",
    title: "HK → SB: vr → vr",
    affects: { dest: "SB", passports: ["HK"] },
    statusFrom: "vr", statusTo: "vr",
  },];

// Recently-changed visa policies — populated daily by the GitHub Actions cron.
// Each entry is a real diff between yesterday's and today's Wikipedia snapshot.
//
// Reset on 2026-05-21 because earlier entries reflected our own scraper/data
// migrations (adding Kosovo, fixing the classifier, etc.) rather than real
// policy changes. From now on this file only accumulates genuine day-over-day
// differences detected by backend/scraper.js → computeChangelog().

window.CHANGELOG = [
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

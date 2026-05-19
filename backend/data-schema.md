# Data Schema

The scraper outputs `data/passports.js`, which is loaded directly by
`index.html`. The schema is designed to be **compact** (default + exceptions)
so daily refresh diffs are small and the file stays under ~50 KB.

## Top-level

```js
window.SNAPSHOT_DATE = "2026-05-19";   // YYYY-MM-DD, written by scraper
const RAW_PASSPORTS = { ... };          // see below
```

## Per-passport entry

```js
"US": {
  name: "United States",
  rank: 10,                  // Henley index rank (optional)
  default: "vf",             // status applied to all destinations unless overridden
  defaultDays: 90,           // days allowed under the default status
  vr: ["AF", "CN", "CU", "IR", ...],          // visa required
  ev: [["AU", 90], ["IN", 30], ...],          // eVisa (days optional)
  voa: [["BH", 14], ["KW", 30], ...],         // visa on arrival
  // vf is implicit (the default for strong passports)
},
```

For weak passports, `default: "vr"` and the explicit lists are vf/ev/voa.

## Templated passports

Some passports have no curated data and inherit the visa privileges of a
similar passport in the same bloc (e.g. EU member states share Schengen access):

```js
"AT": {
  name: "Austria",
  rank: 5,
  templated: true,
  template: "DE",            // use Germany's vf/ev/voa/vr lists
},
```

The scraper does NOT generate these — they're hand-curated. The scraper writes
ONLY explicit data. Templated entries live in a separate file
`data/passports-templates.js` that the scraper preserves.

## Changelog entries

```js
{
  date: "2026-05-19",
  passport: "US",            // affected passport
  dest: "BR",                // affected destination
  from: "vf",                // previous status
  to: "ev",                  // new status
  title: "Brazil now requires US visitors to apply for eVisa",
  summary: "..."             // optional human-readable summary
}
```

The scraper writes these as raw diffs; a human can edit titles/summaries for
the most-impactful changes before they go to production.

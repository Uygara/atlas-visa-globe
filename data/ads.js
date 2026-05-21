// Ad-network configuration. Once you're approved by AdSense / Ezoic / Media.net
// fill the IDs below and the slots will activate. While these are empty strings,
// the site does NOT render any ad markup at all (no fake placeholders).
//
// HOW TO ACTIVATE GOOGLE ADSENSE (the most common path):
//   1. Sign up at  https://www.google.com/adsense  with your Cloudflare URL
//      (https://travelnow.info). Approval: 1–14 days. Google likes original
//      content + ≥30 days of traffic, but submitting now starts the clock.
//   2. Once approved you get a Publisher ID like "ca-pub-1234567890123456".
//      Paste it into ADSENSE.clientId below.
//   3. Create one Ad Unit in the AdSense dashboard for each slot you want
//      (sidebar, in-article). Each unit gives you a `data-ad-slot` numeric
//      ID — paste those into ADSENSE.slots below.
//   4. git commit + git push  →  Cloudflare auto-deploys  →  ads live.
//
// HOW TO ACTIVATE EZOIC (often more lenient on new sites):
//   1. Sign up at  https://www.ezoic.com  — they accept sites with no traffic.
//   2. After they verify your domain, copy your numeric Site ID.
//   3. Paste it into EZOIC.siteId below. Ezoic handles slot placement itself.
//
// You can run BOTH at once or pick one. If both are configured, AdSense wins
// (cleaner, higher CPM in most cases).

window.ADSENSE = {
  // Publisher ID (travelnow.info — registered 2026-05-21)
  clientId: "ca-pub-2617798720306957",
  // Per-slot numeric IDs from your AdSense dashboard.
  // These stay empty until Google approves the account and you create Ad Units
  // inside the AdSense dashboard. The loader script above is enough for
  // Google's site-verification crawler to find your publisher ID.
  slots: {
    sidebar:    "", // shown under the detail card on the main map
    seoTop:     "", // top of every /passport/<iso>/ SEO page
    seoBottom:  "", // bottom of every /passport/<iso>/ SEO page
  },
};

window.EZOIC = {
  // Numeric site ID. e.g. "543210"
  siteId: "",
};

window.adsEnabled = function () {
  return !!(window.ADSENSE && window.ADSENSE.clientId) ||
         !!(window.EZOIC && window.EZOIC.siteId);
};

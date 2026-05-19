// Affiliate configuration. Fill in your referral codes here once you have them.
// While these are empty strings the UI hides the affiliate sections entirely —
// the site does NOT show any placeholder/fake links.
//
// Each entry has:
//   id       — internal key
//   label    — what the user sees on the button
//   blurb    — one line shown under the button
//   url      — the affiliate URL with your referral code embedded.
//              Use the literal token "{DEST}" where the destination ISO2 should be substituted.
//              Leave url as "" to disable that partner.
//   shownFor — array of visa statuses to show this partner for (vf, ev, voa, vr)
//              or ["*"] to show always.
//
// HOW TO ADD A REAL LINK:
//   1. Apply to the partner program (links below in `signup`).
//   2. Once approved, copy your affiliate URL template (most partners give you
//      something like https://ivisa.com/?affId=YOUR_ID&dest={DEST}).
//   3. Paste it into the `url` field. Save. Redeploy.

window.AFFILIATES = [
  {
    id: "ivisa",
    label: "Apply for your visa with iVisa",
    blurb: "Government-approved e-visas, $5–$30 typical fee.",
    url: "", // e.g. "https://www.ivisa.com/?affId=YOUR_ID&destination={DEST}"
    signup: "https://www.ivisa.com/affiliates",
    shownFor: ["ev", "voa", "vr"],
  },
  {
    id: "visahq",
    label: "Get visa help from VisaHQ",
    blurb: "Embassy-required visas — full-service application.",
    url: "", // e.g. "https://www.visahq.com/?ref=YOUR_ID"
    signup: "https://www.visahq.com/partners",
    shownFor: ["vr"],
  },
  {
    id: "safetywing",
    label: "Travel insurance from SafetyWing",
    blurb: "Nomad-friendly health cover, from $45/4 weeks.",
    url: "", // e.g. "https://safetywing.com/nomad-insurance/?referenceID=YOUR_ID"
    signup: "https://safetywing.com/affiliates",
    shownFor: ["*"],
  },
  {
    id: "airalo",
    label: "Get an eSIM with Airalo",
    blurb: "Data plans for 200+ countries, install in minutes.",
    url: "", // e.g. "https://airalo.pxf.io/YOUR_ID"
    signup: "https://www.airalo.com/partners",
    shownFor: ["*"],
  },
  {
    id: "wise",
    label: "Travel debit card from Wise",
    blurb: "Spend abroad with no FX markup.",
    url: "", // e.g. "https://wise.com/invite/dic/YOUR_ID"
    signup: "https://wise.com/refer",
    shownFor: ["*"],
  },
];

// Helper used by the panel
window.affiliatesFor = function(status, destIso2) {
  return (window.AFFILIATES || [])
    .filter(a => a.url && (a.shownFor.includes("*") || a.shownFor.includes(status)))
    .map(a => ({
      ...a,
      href: a.url.replace(/\{DEST\}/g, destIso2 || ""),
    }));
};

// Passport-validity rules — minimum months of validity past the intended
// stay date that each destination requires on entry.
//
// This is the "I bought my flight but my passport expires in 4 months
// and I got denied boarding" trap. Most travellers don't know the rule
// varies by destination; airlines check at check-in and refuse boarding
// if your passport doesn't have enough time left.
//
// Schema: window.PASSPORT_VALIDITY[destIso2] = months required.
//   - 6 = "6 months past intended stay" (typical for most of Asia, ME, Africa)
//   - 3 = "3 months past intended stay" (Schengen, some Caribbean)
//   - 0 = "valid for the duration of stay only" (US, Canada land, Mexico)
//   - special string values describe complex rules below.
//
// Data verified against IATA Timatic summaries + each country's
// immigration page where possible. Updated 2026-05-24.

window.PASSPORT_VALIDITY = {
  // ─── 6 months past intended stay ─────────────────────────────────────
  // Vast majority of Asia, Africa, Middle East, Latin America.
  AF:6, BD:6, BT:6, BN:6, BI:6, KH:6, CN:6, CD:6, EG:6, ER:6, ET:6,
  FJ:6, GH:6, ID:6, IN:6, IQ:6, IR:6, JO:6, KE:6, KW:6, LA:6, LB:6,
  MY:6, MV:6, MM:6, NA:6, NP:6, NZ:6, NG:6, KP:6, OM:6, PK:6, PG:6,
  PH:6, QA:6, RW:6, SA:6, SG:6, SO:6, ZA:6, LK:6, SD:6, SY:6, TZ:6,
  TH:6, TR:6, UG:6, AE:6, VN:6, YE:6, ZW:6, BR:6, AR:6, CO:6, BO:6,
  GT:6, HN:6, NI:6, PA:6, PY:6, PE:6, EC:6, VE:6, GY:6, SR:6, BS:6,
  BB:6, CU:6, DO:6, HT:6, JM:6, TT:6, GD:6, AG:6, KN:6, LC:6, VC:6,
  DM:6, GE:6, AZ:6, AM:6, KZ:6, KG:6, TJ:6, TM:6, UZ:6, MN:6, MO:6,
  HK:6, TW:6,

  // ─── 3 months past intended stay ─────────────────────────────────────
  // Schengen + EU treaty states.
  AT:3, BE:3, BG:3, HR:3, CY:3, CZ:3, DK:3, EE:3, FI:3, FR:3, DE:3,
  GR:3, HU:3, IS:3, IT:3, LV:3, LI:3, LT:3, LU:3, MT:3, NL:3, NO:3,
  PL:3, PT:3, RO:3, SK:3, SI:3, ES:3, SE:3, CH:3,
  // Plus a few non-Schengen Europeans + select others
  AL:3, BA:3, ME:3, MK:3, MD:3, RS:3, XK:3, AD:3, MC:3, SM:3, VA:3,
  TN:3, MA:3, DZ:3, KR:3,

  // ─── Valid for the intended stay only (no buffer beyond exit) ───────
  // Mostly land-border-friendly countries.
  US:0, CA:0, MX:0, IE:0, GB:0,
};

// ── Helpers ───────────────────────────────────────────────────────────
// Given the user's passport expiry date and an intended stay end date,
// compute whether the passport will satisfy a destination's rule.
// Returns:
//   { rule:        months required (number)
//     ruleLabel:   short human label
//     monthsLeftOnExit: months between exit date and passport expiry
//     ok:          bool — does it pass?
//     marginDays:  how many days of buffer (positive = safe, negative = short)
//     note:        human explainer for the UI
//   }
// Either argument can be null — in that case `ok` is null and the
// rule alone is returned so we can still show the destination's policy.
window.passportValidityCheck = function (destIso2, opts) {
  const rule = window.PASSPORT_VALIDITY[destIso2];
  if (rule == null) return null;
  const expiry  = opts?.expiry  ? new Date(opts.expiry + "T00:00:00Z") : null;
  const exitDay = opts?.exit    ? new Date(opts.exit   + "T00:00:00Z") : null;

  let monthsLeftOnExit = null, marginDays = null, ok = null;
  if (expiry && !isNaN(expiry.getTime())) {
    const ref = exitDay && !isNaN(exitDay.getTime()) ? exitDay : new Date();
    // Months between ref and expiry
    monthsLeftOnExit =
      (expiry.getFullYear() - ref.getFullYear()) * 12 +
      (expiry.getMonth()    - ref.getMonth()) +
      (expiry.getDate()   < ref.getDate() ? -1 : 0);
    marginDays = Math.round((expiry.getTime() - ref.getTime()) / 86400000) - rule * 30;
    ok = monthsLeftOnExit >= rule;
  }

  const labels = {
    6: "6 months past intended stay",
    3: "3 months past intended stay",
    0: "valid for the duration of stay only",
  };
  return {
    rule,
    ruleLabel:        labels[rule] || `${rule} months past intended stay`,
    monthsLeftOnExit,
    marginDays,
    ok,
  };
};

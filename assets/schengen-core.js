// schengen-core.js — the Schengen 90/180 arithmetic, shared by the calculator
// (/schengen-calculator/) and the travel planner (/itinerary/). Pure functions:
// no DOM, no storage, so it runs in Node for tests (tools/test-schengen-core.js)
// as well as in the browser (window.SCHENGEN_CORE).
//
// Dates are ISO strings "YYYY-MM-DD" handled in UTC. A stay is { entry, exit },
// both days inclusive. Rule: on any day, the days spent in the Schengen area in
// the 180-day window ending that day (inclusive) must not exceed 90.
(function (root) {
  var WINDOW_DAYS = 180, MAX_DAYS = 90, MS_PER_DAY = 86400000;

  // Schengen member states (29 since Bulgaria and Romania joined fully on 1 January 2025).
  // Same list as data/etias-rules.js and backend/fetch-news.js. Cyprus and Ireland are EU
  // members outside Schengen. Source: https://home-affairs.ec.europa.eu/policies/schengen/schengen-area_en
  var MEMBERS = [
    "AT", "BE", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IT", "LV",
    "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "CH",
  ];
  function isMember(iso2) { return MEMBERS.indexOf(String(iso2 || "").toUpperCase()) >= 0; }

  function parseDate(s) {
    var p = String(s || "").split("-").map(Number);
    if (!p[0]) return null;
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function fmt(d) { return d ? d.toISOString().slice(0, 10) : ""; }
  function daysBetween(a, b) { return Math.round((b - a) / MS_PER_DAY) + 1; } // inclusive of both ends

  // Days used within the 180-day window ending on refDate (inclusive). Stays are summed as
  // given, exactly as the calculator always did; pass merged stays (mergeStays) when the
  // input can overlap, e.g. a planner where one stop's exit day is the next stop's entry day.
  function daysUsedAt(refDate, trips) {
    var ref = parseDate(refDate);
    if (!ref) return 0;
    var windowStart = new Date(ref.getTime() - (WINDOW_DAYS - 1) * MS_PER_DAY);
    var total = 0;
    for (var i = 0; i < trips.length; i++) {
      var entry = parseDate(trips[i].entry), exit = parseDate(trips[i].exit);
      if (!entry || !exit) continue;
      var start = entry > windowStart ? entry : windowStart;
      var end = exit < ref ? exit : ref;
      if (end >= start) total += daysBetween(start, end);
    }
    return total;
  }

  // A stay of `length` days starting on `start` (a Date) is legal only if the 90-day cap
  // holds on every day of that stay, not just the last one.
  function stayOk(trips, start, length) {
    var all = trips.concat([{ entry: fmt(start), exit: fmt(new Date(start.getTime() + (length - 1) * MS_PER_DAY)) }]);
    for (var d = 0; d < length; d++) {
      if (daysUsedAt(fmt(new Date(start.getTime() + d * MS_PER_DAY)), all) > MAX_DAYS) return false;
    }
    return true;
  }

  // Longest stay (0..90) that can start on `start`.
  function maxStayFrom(trips, start) {
    var n = 0;
    while (n < MAX_DAYS && stayOk(trips, start, n + 1)) n++;
    return n;
  }

  // Earliest day on which a stay of `length` days can start.
  function nextAvailableDate(trips, length, fromDate) {
    fromDate = fromDate || new Date();
    if (length <= 0) return fromDate;
    for (var i = 0; i < 400; i++) {
      var probe = new Date(fromDate.getTime() + i * MS_PER_DAY);
      if (stayOk(trips, probe, length)) return probe;
    }
    return null;
  }

  // Merge overlapping or touching stays into one, so a day spent in two Schengen
  // countries (or a stop that ends the day the next begins) counts once.
  function mergeStays(trips) {
    var list = trips.map(function (t) { return { a: parseDate(t.entry), b: parseDate(t.exit) }; })
      .filter(function (t) { return t.a && t.b && t.b >= t.a; })
      .sort(function (x, y) { return x.a - y.a; });
    var out = [];
    list.forEach(function (t) {
      var last = out[out.length - 1];
      if (last && t.a.getTime() <= last.b.getTime() + MS_PER_DAY) { if (t.b > last.b) last.b = t.b; }
      else out.push({ a: t.a, b: t.b });
    });
    return out.map(function (t) { return { entry: fmt(t.a), exit: fmt(t.b) }; });
  }

  // For a planned itinerary: check every day of every Schengen stay against the rule.
  // stays: [{ entry, exit }] (Schengen stops only; earlier trips may be included).
  // Returns { ok, firstBreach: "YYYY-MM-DD"|null, peak: max days used on any day of the plan }.
  function checkPlan(stays) {
    var merged = mergeStays(stays), peak = 0, firstBreach = null;
    merged.forEach(function (t) {
      for (var d = parseDate(t.entry); d <= parseDate(t.exit); d = new Date(d.getTime() + MS_PER_DAY)) {
        var used = daysUsedAt(fmt(d), merged);
        if (used > peak) peak = used;
        if (used > MAX_DAYS && !firstBreach) firstBreach = fmt(d);
      }
    });
    return { ok: !firstBreach, firstBreach: firstBreach, peak: peak };
  }

  var api = {
    WINDOW_DAYS: WINDOW_DAYS, MAX_DAYS: MAX_DAYS, MS_PER_DAY: MS_PER_DAY, MEMBERS: MEMBERS, isMember: isMember,
    parseDate: parseDate, fmt: fmt, daysBetween: daysBetween, daysUsedAt: daysUsedAt, stayOk: stayOk,
    maxStayFrom: maxStayFrom, nextAvailableDate: nextAvailableDate, mergeStays: mergeStays, checkPlan: checkPlan,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SCHENGEN_CORE = api;
})(this);

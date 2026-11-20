// trips-core.js — the travel planner's saved trips: shape, limits, cleaning and the
// migration from the old single trip. Pure functions (no DOM, no storage access of
// its own), so it runs in Node for tests (tools/test-trips-core.js) and in the
// browser as window.TRIPS_CORE.
//
// Stored under localStorage "atlas.trips" (synced with the account, see
// assets/account-sync.js) as JSON:
//   { v: 1, active: "<trip id>", trips: [Trip] }
//   Trip = { id, name, from: { country, city } , stops: [Stop], done: { "<key>": 1 }, updated }
//   Stop = { iso: "JP", arrive: "YYYY-MM-DD" | "", leave: "YYYY-MM-DD" | "", via: "IST" | "" }
// The active trip is also mirrored to the old "atlas.itinerary" key
// ({ passport, stops: [iso], departure }) because the notification jobs
// (backend/dispatch-push.js, dispatch-reminders.js) read that one.
//
// Privacy: only what the person types for the trip. Never passport numbers.
// The passport expiry month used for the validity check is kept under its own
// key ("atlas.passport.expiry") that is NOT in the sync list, so it stays on the device.
(function (root) {
  var LIMITS = { trips: 10, stops: 15, name: 60, city: 60, done: 300 };
  var ISO2 = /^[A-Z]{2}$/, DATE = /^\d{4}-\d{2}-\d{2}$/, IATA = /^[A-Z]{3}$/;

  function str(v, max) { return typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : ""; }
  function iso(v) { var s = String(v || "").toUpperCase(); return ISO2.test(s) ? s : ""; }
  function date(v) { return typeof v === "string" && DATE.test(v) && !isNaN(Date.parse(v + "T00:00:00Z")) ? v : ""; }
  function newId() { return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function cleanStop(s) {
    s = s || {};
    var st = { iso: iso(s.iso || s.iso2 || s), arrive: date(s.arrive), leave: date(s.leave), via: "" };
    var via = String(s.via || "").toUpperCase();
    if (IATA.test(via)) st.via = via;
    if (st.arrive && st.leave && st.leave < st.arrive) st.leave = "";
    return st.iso ? st : null;
  }

  function cleanTrip(t) {
    t = t || {};
    var done = {}, n = 0;
    if (t.done && typeof t.done === "object") {
      for (var k in t.done) { if (n >= LIMITS.done) break; if (t.done[k] && /^[A-Za-z0-9:_.-]{1,40}$/.test(k)) { done[k] = 1; n++; } }
    }
    return {
      id: typeof t.id === "string" && /^[a-z0-9]{4,24}$/.test(t.id) ? t.id : newId(),
      name: str(t.name, LIMITS.name),
      from: { country: iso(t.from && t.from.country), city: str(t.from && t.from.city, LIMITS.city) },
      stops: (Array.isArray(t.stops) ? t.stops : []).map(cleanStop).filter(Boolean).slice(0, LIMITS.stops),
      done: done,
      updated: typeof t.updated === "number" ? t.updated : 0,
    };
  }

  // Read the stored value (raw strings from storage). Falls back to the old single trip.
  function load(rawTrips, rawItinerary) {
    var data = null;
    try { data = JSON.parse(rawTrips || "null"); } catch (e) { data = null; }
    var trips = data && Array.isArray(data.trips) ? data.trips.map(cleanTrip).slice(0, LIMITS.trips) : [];
    if (!trips.length) {
      var old = null;
      try { old = JSON.parse(rawItinerary || "null"); } catch (e) { old = null; }
      if (old && Array.isArray(old.stops) && old.stops.length) {
        var t = cleanTrip({ stops: old.stops.map(function (s) { return { iso: typeof s === "string" ? s : s && (s.iso2 || s.iso) }; }) });
        if (t.stops.length && date(old.departure)) t.stops[0].arrive = old.departure;
        trips = [t];
      }
    }
    var active = data && typeof data.active === "string" && trips.some(function (t) { return t.id === data.active; }) ? data.active : (trips[0] && trips[0].id) || "";
    return { v: 1, active: active, trips: trips };
  }

  // Values to write back: the trips JSON and the mirror for the old key.
  function serialize(state, passport) {
    var trips = (state.trips || []).map(cleanTrip).slice(0, LIMITS.trips);
    var active = trips.filter(function (t) { return t.id === state.active; })[0] || trips[0] || null;
    var itinerary = active ? JSON.stringify({ passport: iso(passport) || null, stops: active.stops.map(function (s) { return s.iso; }), departure: (active.stops[0] && active.stops[0].arrive) || "" }) : null;
    return { trips: JSON.stringify({ v: 1, active: active ? active.id : "", trips: trips }), itinerary: itinerary };
  }

  // Days of the whole trip: first arrival to last departure, inclusive. 0 when dates are missing.
  function totalDays(trip) {
    var a = null, b = null;
    (trip.stops || []).forEach(function (s) {
      if (s.arrive && (!a || s.arrive < a)) a = s.arrive;
      var end = s.leave || s.arrive;
      if (end && (!b || end > b)) b = end;
    });
    if (!a || !b) return 0;
    return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000) + 1;
  }

  // Problems a person should fix: missing dates, stops out of date order, overlaps.
  function dateIssues(trip) {
    var out = [], prev = null;
    (trip.stops || []).forEach(function (s, i) {
      if (!s.arrive || !s.leave) out.push({ kind: "missing", index: i });
      if (prev && prev.leave && s.arrive && s.arrive < prev.leave) out.push({ kind: "overlap", index: i });
      prev = s;
    });
    return out;
  }

  function move(list, from, to) {
    var a = list.slice();
    if (from < 0 || from >= a.length || to < 0 || to >= a.length) return a;
    var x = a.splice(from, 1)[0]; a.splice(to, 0, x); return a;
  }

  var api = { LIMITS: LIMITS, newId: newId, cleanTrip: cleanTrip, cleanStop: cleanStop, load: load, serialize: serialize, totalDays: totalDays, dateIssues: dateIssues, move: move };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TRIPS_CORE = api;
})(this);

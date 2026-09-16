// account-sync.js — the pure part of account sync: which browser-storage keys
// travel with an account, and how a device's copy and the cloud copy merge.
// No DOM, no Firebase, so it runs in Node for tests (tools/test-account-sync.js)
// as well as in the browser (window.ACCOUNT_SYNC).
//
// Stored shape, both locally (meta) and in the cloud document:
//   { "<key>": { v: "<raw localStorage string>" | null, t: <ms of last write> } }
// v === null means "deleted on some device" and wins like any other write.
(function (root) {
  // Everything a visitor would expect to find again on another device. UI
  // chrome (collapsed panels, one-time hints) deliberately stays per-device.
  var SYNC_KEYS = [
    "atlas.passport",        // chosen passport
    "atlas.variant",         // passport type (ordinary / diplomatic …)
    "atlas.permits",         // residence permits held
    "atlas.watchlist",       // starred destinations
    "atlas.itinerary",       // travel planner trip
    "atlas.schengen.trips",  // Schengen 90/180 calculator entries
    "atlas.lang",            // interface language
    "atlas.tweaks",          // theme + globe view
  ];
  // JSON arrays that are merged item-by-item the first time a device that
  // already had data joins an account, so nothing saved before signing in is lost.
  var LIST_KEYS = { "atlas.watchlist": true };

  function parseList(raw) {
    try { var a = JSON.parse(raw); return Array.isArray(a) ? a : null; } catch (e) { return null; }
  }

  // local, cloud: { key: { v, t } }. A local t of 0 means "written before this
  // device ever synced" (no timestamp known).
  // Returns { merged, toLocal: [keys whose value must be written locally],
  //           toCloud: bool (cloud copy is out of date) }.
  function merge(local, cloud) {
    local = local || {}; cloud = cloud || {};
    var merged = {}, toLocal = [], toCloud = false;
    SYNC_KEYS.forEach(function (k) {
      var l = local[k], c = cloud[k];
      if (!l && !c) return;
      if (l && !c) { merged[k] = l; if (l.v != null) toCloud = true; return; }
      if (!l && c) { merged[k] = c; if (c.v != null) toLocal.push(k); return; }
      if (l.v === c.v) { merged[k] = l.t >= c.t ? l : c; return; }
      // Unknown-age local list + cloud list: keep both sides' items.
      if (LIST_KEYS[k] && l.t === 0) {
        var a = parseList(c.v) || [], b = parseList(l.v) || [];
        var union = a.concat(b.filter(function (x) { return a.indexOf(x) < 0; }));
        var v = JSON.stringify(union);
        merged[k] = { v: v, t: Math.max(c.t, 1) };
        if (v !== l.v) toLocal.push(k);
        if (v !== c.v) toCloud = true;
        return;
      }
      if (l.t > c.t) { merged[k] = l; toCloud = true; }
      else { merged[k] = c; toLocal.push(k); }
    });
    return { merged: merged, toLocal: toLocal, toCloud: toCloud };
  }

  var api = { SYNC_KEYS: SYNC_KEYS, merge: merge };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ACCOUNT_SYNC = api;
})(this);

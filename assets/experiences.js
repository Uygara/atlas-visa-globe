// experiences.js — traveller experiences for one passport → destination pair (roadmap R5).
//
// What people write about applying: which route, when, how long it took, what they were
// asked. Shown under the country card as "traveller experience, not an official rule".
// Storage: Firestore experiences/{uid}_{PP-DD} (one post per person per pair) and
// posters/{uid} = { last } (at most one post every 10 minutes). The rules in
// firestore.rules repeat every check below, so a modified page cannot skip them:
// signed in, 40-1000 characters, no links, e-mail addresses, @handles, phone or passport
// numbers, hidden for everyone once 3 different accounts report it. The weekly review
// (tools/experiences-review.js) lists hidden and new posts. Nobody's name is shown.
// On localhost with ?account=mock the posts live in localStorage instead.
(function () {
  "use strict";
  var ROUTES = ["evisa", "embassy", "arrival", "eta", "free", "other"];
  var MIN = 40, MAX = 1000, HIDE_AT = 3, LIMIT = 50;
  // Same pattern as firestore.rules (tools/test-experiences.js checks they match).
  var PII = "https?:|www[.]|@[a-z0-9_.]{2,}|[a-z0-9-]+[.](com|net|org|io|info|co|ru|cn|me|ly|link|xyz|app)\\b|[0-9](?:[ ()-]?[0-9]){8,}|\\b[a-z]{1,2}[0-9]{7,8}\\b";
  var PII_RE = new RegExp(PII, "i");
  var REPORTED = "atlas.exp.reported";

  function acct() { return window.ATLAS_ACCOUNT || { enabled: false }; }
  function user() { var a = acct(); return a.state && a.state.user; }
  function pairOf(p, d) { return String(p || "").toUpperCase() + "-" + String(d || "").toUpperCase(); }
  function thisMonth() { var d = new Date(); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); }

  // null when fine, else an error key for the form.
  function check(x) {
    x = x || {};
    if (!/^[A-Z]{2}$/.test(x.passport || "") || !/^[A-Z]{2}$/.test(x.dest || "") || x.passport === x.dest) return "pair";
    if (ROUTES.indexOf(x.route) < 0) return "route";
    if (!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(x.month || "") || x.month > thisMonth() || x.month < "2015-01") return "month";
    if (x.days != null && x.days !== "" && !(Number.isInteger(x.days) && x.days >= 0 && x.days <= 365)) return "days";
    var t = String(x.text || "").trim();
    if (t.length < MIN) return "short";
    if (t.length > MAX) return "long";
    if (PII_RE.test(t)) return "pii";
    return null;
  }

  function reportedSet() { try { return JSON.parse(localStorage.getItem(REPORTED) || "[]"); } catch (e) { return []; } }
  function markReported(id) { var a = reportedSet(); if (a.indexOf(id) < 0) { a.push(id); try { localStorage.setItem(REPORTED, JSON.stringify(a.slice(-200))); } catch (e) {} } }

  function shape(id, d, me) {
    var ts = d.createdAt;
    var ms = ts && typeof ts.toMillis === "function" ? ts.toMillis() : (typeof ts === "number" ? ts : 0);
    return { id: id, route: d.route, month: d.month, days: d.days == null ? null : d.days, text: d.text, lang: d.lang || "", createdAt: ms,
      mine: !!(me && d.uid === me), hidden: d.visible === false, reports: d.reports || 0, reportedByMe: reportedSet().indexOf(id) >= 0 };
  }
  function sortNew(a, b) { return b.createdAt - a.createdAt; }

  // ── mock store (localhost ?account=mock) ─────────────────────────────────
  var MOCK = "atlas.account.mock.exp", POST = "atlas.account.mock.poster";
  function mget(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function mset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var later = function (v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 120); }); };
  var mock = {
    list: function (pair, me) {
      var all = mget(MOCK) || {};
      return later(Object.keys(all).filter(function (id) { var d = all[id]; return d.pair === pair && (d.visible || d.uid === me); })
        .map(function (id) { return shape(id, all[id], me); }).sort(sortNew));
    },
    add: function (me, id, doc) {
      var all = mget(MOCK) || {}, p = mget(POST) || {};
      if (all[id]) return Promise.reject({ code: "exists" });
      if (p[me] && Date.now() - p[me] < 600000) return Promise.reject({ code: "rate" });
      doc.createdAt = Date.now(); all[id] = doc; p[me] = doc.createdAt; mset(MOCK, all); mset(POST, p);
      return later();
    },
    report: function (me, id) {
      var all = mget(MOCK) || {}, d = all[id];
      if (!d || d.uid === me) return Promise.reject({ code: "denied" });
      d.reporters = d.reporters || [];
      if (d.reporters.indexOf(me) >= 0) return Promise.reject({ code: "denied" });
      d.reporters.push(me); d.reports = d.reporters.length; d.visible = d.visible && d.reports < HIDE_AT; mset(MOCK, all);
      return later();
    },
    remove: function (me, id) { var all = mget(MOCK) || {}; if (all[id] && all[id].uid === me) delete all[id]; mset(MOCK, all); return later(); },
  };

  // ── Firestore ────────────────────────────────────────────────────────────
  function fire(x) {
    var F = x.F, db = x.db;
    return {
      list: function (pair, me) {
        var q = F.query(F.collection(db, "experiences"), F.where("pair", "==", pair), F.where("visible", "==", true), F.limit(LIMIT));
        var own = me ? F.getDoc(F.doc(db, "experiences", me + "_" + pair)).catch(function () { return null; }) : Promise.resolve(null);
        return Promise.all([F.getDocs(q), own]).then(function (r) {
          var out = r[0].docs.map(function (s) { return shape(s.id, s.data(), me); });
          var mine = r[1];
          if (mine && mine.exists() && !out.some(function (e) { return e.id === mine.id; })) out.push(shape(mine.id, mine.data(), me));
          return out.sort(sortNew);
        });
      },
      add: function (me, id, doc) {
        var b = F.writeBatch(db);
        doc.createdAt = F.serverTimestamp();
        b.set(F.doc(db, "posters", me), { last: F.serverTimestamp() });
        b.set(F.doc(db, "experiences", id), doc);
        return b.commit();
      },
      report: function (me, id, cur) {
        var b = F.writeBatch(db), n = (cur || 0) + 1;
        b.update(F.doc(db, "experiences", id), { reports: n, visible: n < HIDE_AT });
        b.set(F.doc(db, "experiences", id, "reports", me), {});
        return b.commit();
      },
      remove: function (me, id) { return F.deleteDoc(F.doc(db, "experiences", id)); },
    };
  }
  function store() {
    var a = acct();
    if (!a.enabled) return Promise.reject({ code: "disabled" });
    if (a.mock) return Promise.resolve(mock);
    var h = a.firestore && a.firestore();
    return h ? h.then(fire) : Promise.reject({ code: "disabled" });
  }
  function me() { var u = user(); return u ? u.uid : null; }

  window.ATLAS_EXPERIENCES = {
    ROUTES: ROUTES, MIN: MIN, MAX: MAX, HIDE_AT: HIDE_AT, PII: PII,
    check: check,
    enabled: function () { return !!acct().enabled; },
    signedIn: function () { return !!user(); },
    list: function (passport, dest) {
      var pair = pairOf(passport, dest);
      return store().then(function (s) { return s.list(pair, me()); });
    },
    add: function (x) {
      var err = check(x);
      if (err) return Promise.reject({ code: err });
      var uid = me();
      if (!uid) return Promise.reject({ code: "signin" });
      var pair = pairOf(x.passport, x.dest);
      var doc = { uid: uid, passport: x.passport, dest: x.dest, pair: pair, route: x.route, month: x.month, text: String(x.text).trim(),
        lang: String(x.lang || "en").slice(0, 2), reports: 0, visible: true };
      if (x.days != null && x.days !== "") doc.days = x.days;
      return store().then(function (s) { return s.add(uid, uid + "_" + pair, doc); });
    },
    report: function (e) {
      var uid = me();
      if (!uid) return Promise.reject({ code: "signin" });
      return store().then(function (s) { return s.report(uid, e.id, e.reports); }).then(function () { markReported(e.id); });
    },
    remove: function (e) {
      var uid = me();
      if (!uid) return Promise.reject({ code: "signin" });
      return store().then(function (s) { return s.remove(uid, e.id); });
    },
  };
})();

// account.js — optional accounts: sign in with Google or an emailed link, and
// the things people save on the site follow them to every device.
//
// Loaded synchronously in <head> on every page (after account-config.js and
// account-sync.js) so it can timestamp writes to the synced localStorage keys
// before any page script runs. With no config it only exposes
// window.ATLAS_ACCOUNT = { enabled: false } and does nothing else.
//
// Storage model: the browser's localStorage stays the working copy (every page
// already reads and writes it); the account keeps one Firestore document per
// person, users/{uid} = { v: 1, updatedAt, data: { key: { v, t } } }, merged
// key-by-key with the newest write winning (assets/account-sync.js).
//
// Firebase is loaded from gstatic only when accounts are on. For local testing
// without a Firebase project, open any page on localhost with ?account=mock.
(function () {
  "use strict";

  var SDK = "https://www.gstatic.com/firebasejs/12.19.0/";
  var META_KEY = "atlas.sync.meta";
  var EMAIL_KEY = "atlas.account.email";
  // Keys whose change on another device should re-render the page right away.
  var RELOAD_KEYS = ["atlas.passport", "atlas.variant", "atlas.permits", "atlas.itinerary", "atlas.schengen.trips", "atlas.lang"];

  var cfg = window.ACCOUNT_CONFIG;
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var mock = false;
  try {
    if (isLocal && /[?&]account=mock\b/.test(location.search)) sessionStorage.setItem("atlas.account.mock", "1");
    mock = isLocal && sessionStorage.getItem("atlas.account.mock") === "1";
  } catch (e) {}
  var enabled = mock || !!(cfg && cfg.apiKey && cfg.projectId);

  var state = { ready: false, user: null, syncing: false, lastSync: null, error: null };
  var listeners = [];
  function emit() {
    listeners.slice().forEach(function (fn) { try { fn(state); } catch (e) {} });
    try { window.dispatchEvent(new CustomEvent("atlas:account", { detail: state })); } catch (e) {}
    paintLinks();
  }
  function set(patch) { for (var k in patch) state[k] = patch[k]; emit(); }

  var api = window.ATLAS_ACCOUNT = {
    enabled: enabled,
    mock: mock,
    get state() { return state; },
    onChange: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
    },
  };
  if (!enabled) return;

  var SYNC = window.ACCOUNT_SYNC;
  var ls;
  try { ls = window.localStorage; ls.getItem(META_KEY); } catch (e) { api.enabled = false; return; }
  // Written as a Function so browsers without dynamic import() still parse
  // this file (accounts just stay off there).
  var load = function (url) { return new Function("u", "return import(u)")(url); };

  // ── 1. Timestamp local writes to synced keys ────────────────────────────
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function readMeta() { try { return JSON.parse(ls.getItem(META_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeMeta(m) { try { rawSet.call(ls, META_KEY, JSON.stringify(m)); } catch (e) {} }
  function touched(key) {
    var m = readMeta(); m[key] = Date.now(); writeMeta(m);
    schedulePush();
  }
  Storage.prototype.setItem = function (k, v) {
    var before = this === ls && SYNC.SYNC_KEYS.indexOf(k) >= 0 ? this.getItem(k) : undefined;
    rawSet.call(this, k, v);
    if (before !== undefined && before !== String(v)) touched(k);
  };
  Storage.prototype.removeItem = function (k) {
    var had = this === ls && SYNC.SYNC_KEYS.indexOf(k) >= 0 && this.getItem(k) != null;
    rawRemove.call(this, k);
    if (had) touched(k);
  };

  function readLocal() {
    var m = readMeta(), out = {};
    SYNC.SYNC_KEYS.forEach(function (k) {
      var v = ls.getItem(k);
      if (v != null || m[k]) out[k] = { v: v, t: m[k] || 0 };
    });
    return out;
  }
  function applyLocal(merged, keys) {
    var m = readMeta();
    keys.forEach(function (k) {
      var e = merged[k];
      if (e.v == null) rawRemove.call(ls, k); else rawSet.call(ls, k, e.v);
      m[k] = e.t;
    });
    writeMeta(m);
  }

  // ── 2. Backends: Firebase, or an in-browser mock on localhost ───────────
  function firebaseBackend() {
    var ready = Promise.all([
      load(SDK + "firebase-app.js"),
      load(SDK + "firebase-auth.js"),
      load(SDK + "firebase-firestore-lite.js"),
    ]).then(function (mods) {
      var appMod = mods[0], A = mods[1], F = mods[2];
      var app = appMod.initializeApp(cfg);
      var auth = A.getAuth(app);
      var db = F.getFirestore(app);
      return { A: A, F: F, auth: auth, db: db };
    });
    var toUser = function (u) { return u && { uid: u.uid, email: u.email, name: u.displayName, photo: u.photoURL, provider: (u.providerData[0] || {}).providerId }; };
    return {
      watch: function (cb) {
        ready.then(function (x) {
          x.A.getRedirectResult(x.auth).catch(function (e) { set({ error: e.code || e.message }); });
          x.A.onAuthStateChanged(x.auth, function (u) { cb(toUser(u)); });
        }).catch(function (e) { set({ ready: true, error: "sdk-load-failed" }); });
      },
      google: function () {
        return ready.then(function (x) {
          var p = new x.A.GoogleAuthProvider();
          return x.A.signInWithPopup(x.auth, p).catch(function (e) {
            if (e && /popup-blocked|operation-not-supported/.test(e.code || "")) return x.A.signInWithRedirect(x.auth, p);
            throw e;
          });
        });
      },
      sendLink: function (email) {
        return ready.then(function (x) {
          return x.A.sendSignInLinkToEmail(x.auth, email, { url: location.origin + "/account/", handleCodeInApp: true });
        });
      },
      isLink: function (href) { return ready.then(function (x) { return x.A.isSignInWithEmailLink(x.auth, href); }); },
      finishLink: function (email, href) { return ready.then(function (x) { return x.A.signInWithEmailLink(x.auth, email, href); }); },
      signOut: function () { return ready.then(function (x) { return x.A.signOut(x.auth); }); },
      load: function (uid) {
        return ready.then(function (x) {
          return x.F.getDoc(x.F.doc(x.db, "users", uid)).then(function (s) { return s.exists() ? (s.data().data || {}) : {}; });
        });
      },
      save: function (uid, data) {
        return ready.then(function (x) {
          return x.F.setDoc(x.F.doc(x.db, "users", uid), { v: 1, updatedAt: x.F.serverTimestamp(), data: data });
        });
      },
      destroy: function (uid) {
        return ready.then(function (x) {
          var u = x.auth.currentUser;
          return x.F.deleteDoc(x.F.doc(x.db, "users", uid))
            .then(function () { return x.A.deleteUser(u); })
            .catch(function (e) {
              // Deleting a sign-in needs a recent login; Google users can redo it in place.
              if ((e.code || "") === "auth/requires-recent-login" && (u.providerData[0] || {}).providerId === "google.com") {
                return x.A.reauthenticateWithPopup(u, new x.A.GoogleAuthProvider()).then(function () { return x.A.deleteUser(u); });
              }
              throw e;
            });
        });
      },
    };
  }

  function mockBackend() {
    var USER = "atlas.account.mock.user", CLOUD = "atlas.account.mock.cloud";
    var cb = null;
    var get = function (k) { try { return JSON.parse(ls.getItem(k)); } catch (e) { return null; } };
    var later = function (v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 150); }); };
    var signIn = function (email) { rawSet.call(ls, USER, JSON.stringify({ uid: "mock-" + email.replace(/\W/g, ""), email: email, name: null, provider: "mock" })); cb && cb(get(USER)); };
    return {
      watch: function (fn) { cb = fn; later().then(function () { fn(get(USER)); }); },
      google: function () { return later().then(function () { signIn("tester@example.com"); }); },
      sendLink: function (email) { rawSet.call(ls, "atlas.account.mock.link", email); return later(); },
      isLink: function (href) { return Promise.resolve(/[?&]mockLink=1\b/.test(href)); },
      finishLink: function (email) { return later().then(function () { signIn(email); }); },
      signOut: function () { return later().then(function () { rawRemove.call(ls, USER); cb && cb(null); }); },
      load: function () { return later(get(CLOUD) || {}); },
      save: function (uid, data) { rawSet.call(ls, CLOUD, JSON.stringify(data)); return later(); },
      destroy: function () { return later().then(function () { rawRemove.call(ls, CLOUD); rawRemove.call(ls, USER); cb && cb(null); }); },
    };
  }

  var backend = mock ? mockBackend() : firebaseBackend();

  // ── 3. Sync ─────────────────────────────────────────────────────────────
  var pushTimer = null, inFlight = null;
  function schedulePush() {
    if (!state.user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { sync(false); }, 1500);
  }

  // Pull, merge, write back whatever side is behind. `initial` = right after
  // sign-in / page load, when the page may need to pick up the merged data.
  function sync(initial) {
    if (!state.user) return Promise.resolve();
    if (inFlight) return inFlight.then(function () { return sync(initial); });
    var uid = state.user.uid;
    set({ syncing: true, error: null });
    inFlight = backend.load(uid).then(function (cloud) {
      var r = SYNC.merge(readLocal(), cloud);
      if (r.toLocal.length) applyLocal(r.merged, r.toLocal);
      var up = r.toCloud ? backend.save(uid, r.merged) : Promise.resolve();
      return up.then(function () { return r.toLocal; });
    }).then(function (changed) {
      inFlight = null;
      set({ syncing: false, lastSync: Date.now() });
      if (initial && changed.length) refreshPage(changed);
    }).catch(function (e) {
      inFlight = null;
      set({ syncing: false, error: (e && (e.code || e.message)) || "sync-failed" });
    });
    return inFlight;
  }

  // Pages read storage when they start, so data that arrived from another
  // device needs a one-time reload (at most once per tab session); lighter keys
  // are announced as storage events, which the theme and watchlist listen for.
  function refreshPage(keys) {
    var needsReload = keys.some(function (k) { return RELOAD_KEYS.indexOf(k) >= 0; });
    var flag = "atlas.account.reloaded";
    if (needsReload && !sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      location.reload();
      return;
    }
    keys.forEach(function (k) {
      try { window.dispatchEvent(new StorageEvent("storage", { key: k, newValue: ls.getItem(k), storageArea: ls })); } catch (e) {}
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && pushTimer) { clearTimeout(pushTimer); pushTimer = null; sync(false); }
  });

  backend.watch(function (user) {
    var was = state.user && state.user.uid;
    set({ ready: true, user: user || null });
    if (user && user.uid !== was) sync(true);
  });

  // ── 4. Public actions (used by /account/) ───────────────────────────────
  api.signInWithGoogle = function () { return backend.google(); };
  api.sendEmailLink = function (email) {
    return backend.sendLink(email).then(function () { try { rawSet.call(ls, EMAIL_KEY, email); } catch (e) {} });
  };
  api.pendingEmail = function () { try { return ls.getItem(EMAIL_KEY); } catch (e) { return null; } };
  api.isEmailLink = function () { return backend.isLink(location.href); };
  api.finishEmailLink = function (email) {
    return backend.finishLink(email, location.href).then(function () {
      try { rawRemove.call(ls, EMAIL_KEY); } catch (e) {}
      history.replaceState(null, "", location.pathname);
    });
  };
  api.signOut = function () { return backend.signOut(); };
  api.syncNow = function () { return sync(false); };
  api.deleteAccount = function () {
    if (!state.user) return Promise.resolve();
    return backend.destroy(state.user.uid);
  };
  api.exportData = function () {
    var local = readLocal(), out = {};
    Object.keys(local).forEach(function (k) {
      var v = local[k].v;
      try { out[k] = v == null ? null : JSON.parse(v); } catch (e) { out[k] = v; }
    });
    return { exported: new Date().toISOString(), account: state.user && state.user.email, data: out };
  };

  // ── 5. Masthead account links (static pages + React masthead) ───────────
  function paintLinks() {
    if (!document.body) return;
    document.querySelectorAll("[data-account-link]").forEach(function (a) {
      a.hidden = false;
      var u = state.user;
      a.classList.toggle("is-signed-in", !!u);
      var initial = a.querySelector("[data-account-initial]");
      if (initial) initial.textContent = u && u.email ? u.email.charAt(0).toUpperCase() : "";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintLinks);
  else paintLinks();
})();

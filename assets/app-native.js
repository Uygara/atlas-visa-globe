// app-native.js — the bridge between the web pages and the iOS/Android app.
// Only the Capacitor build loads it (app/build-www.js injects it, after
// app-config.js); on the website window.ATLAS_APP is unset and nothing runs.
//
// It never assumes the native side exists: every plugin call is guarded, so the
// same file runs in a desktop browser for layout checks (python -m http.server in
// app/www) with the tab bar and strip but no splash, ads or push.
//
//   1. bottom tab bar (the site's four tools + account) and link routing
//   2. status bar colour, splash hide, Android back button
//   3. offline / stale-data strip
//   4. push: window.ATLAS_PUSH (permission asked only when the person taps the switch)
//   5. AdMob banner on the pages listed in app-config.js (consent first)
(function () {
  "use strict";
  if (!window.ATLAS_APP) return;

  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var platform = native && cap.getPlatform ? cap.getPlatform() : "web";
  var plugin = function (name) { try { return native && cap.registerPlugin ? cap.registerPlugin(name) : null; } catch (e) { return null; } };
  var CFG = window.ATLAS_APP_CONFIG || {};
  var SITE = CFG.site || "https://travelnow.info";
  var noop = function () {};
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  var lang = function () { return window.ATLAS_LANG || ls("atlas.lang") || "en"; };

  // Short strings live in assets/push-text.js (shared with the website).
  function tr(key, vars) { return window.atlasPushText ? window.atlasPushText(key, vars) : key; }
  var bundled = ["/"];
  var pagePath = location.pathname;

  // ── 1. tab bar + links ──────────────────────────────────────────────────
  var TABS = [
    { href: "/", key: "nav.visa_map", en: "Visa map", d: "M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20" },
    { href: "/transit-map/index.html", key: "nav.transit_map", en: "Transit map", d: "M3 12l18-8-7 17-3-7z" },
    { href: "/safety-map/index.html", key: "nav.safety_map", en: "Safety map", d: "M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" },
    { href: "/itinerary/index.html", key: "nav.itinerary", en: "Travel planner", d: "M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 17c6 0 2-10 8-10h2" },
    { href: "/account/index.html", key: "nav.account", en: "Account", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" },
  ];
  function tabLabel(t) { return (window.t && window.t(t.key) !== t.key) ? window.t(t.key) : t.en; }
  var tabbar = null;
  function isCurrent(href) { var p = pagePath === "/index.html" ? "/" : pagePath; return p === href; }
  function drawTabs() {
    if (!tabbar) { tabbar = document.createElement("nav"); tabbar.className = "app-tabbar"; tabbar.setAttribute("data-no-i18n", ""); tabbar.setAttribute("aria-label", "App"); document.body.appendChild(tabbar); }
    tabbar.innerHTML = "";
    TABS.forEach(function (t) {
      var a = document.createElement("a");
      a.className = "app-tab"; a.href = t.href;
      if (isCurrent(t.href)) a.setAttribute("aria-current", "page");
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + t.d + '"/></svg>';
      var s = document.createElement("span"); s.textContent = tabLabel(t); a.appendChild(s);
      tabbar.appendChild(a);
    });
  }

  // Pages that are not in the app open on the website, in the system browser.
  fetch("/bundled-pages.json").then(function (r) { return r.json(); }).then(function (l) { bundled = l; }).catch(noop);
  function isBundled(path) {
    if (path === "/" || path === "/index.html") return true;
    return bundled.some(function (b) { return b !== "/" && path.indexOf(b) === 0; });
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || e.defaultPrevented) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto|tel|sms):/.test(href)) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    var mine = u.origin === location.origin;
    if (mine && isBundled(u.pathname)) return;                       // stays in the app
    e.preventDefault();
    var target = mine ? SITE + u.pathname + u.search + u.hash : u.href;
    window.open(target, "_blank", "noopener");                        // Capacitor hands it to the system browser
  }, true);

  // ── 2. status bar, splash, back button ──────────────────────────────────
  var StatusBar = plugin("StatusBar"), Splash = plugin("SplashScreen"), AppPlugin = plugin("App");
  function paintStatusBar() {
    if (!StatusBar) return;
    var dark = document.documentElement.classList.contains("theme-dark");
    // Style names are the *content* colour: LIGHT text on the dark navy header, DARK on paper.
    StatusBar.setStyle({ style: dark ? "DARK" : "LIGHT" }).catch(noop);
    if (platform === "android") StatusBar.setBackgroundColor({ color: dark ? "#0F1B2D" : "#F1ECDD" }).catch(noop);
  }
  if (AppPlugin) {
    AppPlugin.addListener("backButton", function (ev) {
      if (ev && ev.canGoBack) history.back(); else AppPlugin.exitApp();
    });
  }
  window.addEventListener("storage", paintStatusBar);
  new MutationObserver(paintStatusBar).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // ── 3. offline / stale-data strip ───────────────────────────────────────
  var strip = null, online = true, NetworkPlugin = plugin("Network");
  function dataDate() {
    var d = window.SNAPSHOT_DATE ? new Date(window.SNAPSHOT_DATE + "T00:00:00Z") : null;
    if (!d || isNaN(d)) return null;
    try { return new Intl.DateTimeFormat(lang(), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d); } catch (e) { return window.SNAPSHOT_DATE; }
  }
  function ageDays() { var d = window.SNAPSHOT_DATE ? new Date(window.SNAPSHOT_DATE + "T00:00:00Z") : null; return d && !isNaN(d) ? (Date.now() - d.getTime()) / 864e5 : 0; }
  function drawStrip(online) {
    var when = dataDate();
    var text = !when ? "" : !online ? tr("offline", { d: when }) : ageDays() > 3 ? tr("stale", { d: when }) : "";
    if (!text) { if (strip) strip.hidden = true; document.documentElement.style.setProperty("--strip-h", "0px"); return; }
    if (!strip) { strip = document.createElement("div"); strip.className = "app-strip"; strip.setAttribute("role", "status"); strip.setAttribute("data-no-i18n", ""); document.body.appendChild(strip); }
    strip.textContent = text; strip.hidden = false;
  }
  function watchNetwork() {
    online = navigator.onLine !== false;
    drawStrip(online);
    var on = function (o) { online = o; drawStrip(o); };
    window.addEventListener("online", function () { on(true); });
    window.addEventListener("offline", function () { on(false); });
    if (NetworkPlugin) {
      NetworkPlugin.getStatus().then(function (s) { on(!!s.connected); }).catch(noop);
      NetworkPlugin.addListener("networkStatusChange", function (s) { on(!!s.connected); });
    }
  }

  // ── 4. push ─────────────────────────────────────────────────────────────
  var Messaging = plugin("FirebaseMessaging");
  var push = window.ATLAS_PUSH = {
    supported: !!Messaging,
    isOn: function () { return ls("atlas.push") === "on"; },
    // Ask the OS, get the FCM token, store it under the signed-in account so the
    // daily job (backend/dispatch-push.js) knows where to send.
    enable: function () {
      var acct = window.ATLAS_ACCOUNT;
      if (!Messaging) return Promise.resolve({ ok: false, reason: "unsupported" });
      if (!acct || !acct.state || !acct.state.user) return Promise.resolve({ ok: false, reason: "signin" });
      return Messaging.requestPermissions().then(function (p) {
        if (p.receive !== "granted") return { ok: false, reason: "denied" };
        return Messaging.getToken().then(function (t) {
          return acct.registerDevice(t.token, { platform: platform, lang: lang() }).then(function () {
            ls("atlas.push", "on"); ls("atlas.push.token", t.token);
            return { ok: true };
          });
        });
      }).catch(function () { return { ok: false, reason: "error" }; });
    },
    disable: function () {
      var acct = window.ATLAS_ACCOUNT, token = ls("atlas.push.token");
      ls("atlas.push", "off");
      var jobs = [];
      if (acct && acct.unregisterDevice && token) jobs.push(acct.unregisterDevice(token).catch(noop));
      if (Messaging) jobs.push(Messaging.deleteToken().catch(noop));
      return Promise.all(jobs).then(function () { return { ok: true }; });
    },
    beforeSignOut: function () { return push.isOn() ? push.disable() : Promise.resolve(); },
    text: tr,
  };
  if (Messaging) {
    // The token can change (reinstall, restore); keep the stored copy current.
    Messaging.addListener("tokenReceived", function (ev) {
      var acct = window.ATLAS_ACCOUNT;
      if (push.isOn() && acct && acct.state && acct.state.user && acct.registerDevice) {
        acct.registerDevice(ev.token, { platform: platform, lang: lang() }).then(function () { ls("atlas.push.token", ev.token); }).catch(noop);
      }
    });
    // A tap on a notification opens the page the message names (data.path).
    Messaging.addListener("notificationActionPerformed", function (ev) {
      var p = ev && ev.notification && ev.notification.data && ev.notification.data.path;
      if (p && (p === "/" || /^\/[^/]/.test(p))) location.href = p;
    });
  }

  // ── 5. ads ──────────────────────────────────────────────────────────────
  var AdMob = plugin("AdMob");
  function wantsBanner() { var a = CFG.ads || {}; return a.enabled && (a.pages || []).indexOf(pagePath) >= 0; }
  function ads() {
    if (!AdMob) return;
    if (!wantsBanner()) { AdMob.removeBanner().catch(noop); return; }
    var a = CFG.ads;
    // Consent before any request: iOS tracking prompt, then the EU/UK consent form.
    AdMob.initialize({ testingDevices: a.testingDevices || [] }).then(function () {
      return Promise.all([AdMob.trackingAuthorizationStatus(), AdMob.requestConsentInfo()]);
    }).then(function (r) {
      var chain = Promise.resolve(r[1]);
      if (r[0].status === "notDetermined") chain = AdMob.requestTrackingAuthorization().then(function () { return r[1]; });
      return chain;
    }).then(function (consent) {
      if (consent.canRequestAds === false && consent.isConsentFormAvailable) return AdMob.showConsentForm();
      return consent;
    }).then(function (consent) {
      if (consent && consent.canRequestAds === false) return;
      return AdMob.showBanner({
        adId: platform === "ios" ? a.bannerIos : a.bannerAndroid,
        adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 56,
      });
    }).catch(noop);
  }

  // ── start ───────────────────────────────────────────────────────────────
  function start() {
    drawTabs();
    watchNetwork();
    paintStatusBar();
    window.addEventListener("atlas:lang", function () { drawTabs(); drawStrip(online); });
    ads();
    // First paint is done; let the splash go.
    if (Splash) setTimeout(function () { Splash.hide({ fadeOutDuration: 200 }).catch(noop); }, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

// push-web.js: browser notifications for the website. The app has its own native
// version in assets/app-native.js; both expose the same window.ATLAS_PUSH.
// Needs account.js (sign-in, device registration) and push-text.js (texts).
// A device record is users/{uid}/devices/{token} with platform "web"; the daily job
// (backend/dispatch-push.js) sends to it like to a phone.
(function () {
  "use strict";
  if (window.ATLAS_APP) return;
  var acct = window.ATLAS_ACCOUNT || { enabled: false };
  var text = window.atlasPushText || function (k) { return k; };
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
  var lang = function () { return window.ATLAS_LANG || ls("atlas.lang") || "en"; };
  var supported = !!(acct.enabled && acct.webPushToken && window.isSecureContext &&
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  var reg = null;
  function registration() {
    if (reg) return Promise.resolve(reg);
    return navigator.serviceWorker.register("/firebase-messaging-sw.js").then(function (r) { reg = r; return r; });
  }
  var push = window.ATLAS_PUSH = {
    supported: supported,
    platform: "web",
    isOn: function () { return supported && ls("atlas.push") === "on" && Notification.permission === "granted"; },
    enable: function () {
      if (!supported) return Promise.resolve({ ok: false, reason: "unsupported" });
      if (!acct.state || !acct.state.user) return Promise.resolve({ ok: false, reason: "signin" });
      // Called straight from the click, so the permission prompt counts as user-initiated.
      return Notification.requestPermission().then(function (perm) {
        if (perm !== "granted") return { ok: false, reason: "denied" };
        return registration()
          .then(function (r) { return acct.webPushToken(r); })
          .then(function (token) {
            return acct.registerDevice(token, { platform: "web", lang: lang() }).then(function () {
              ls("atlas.push", "on"); ls("atlas.push.token", token);
              return { ok: true };
            });
          });
      }).catch(function (e) {
        return { ok: false, reason: /unsupported/.test((e && e.code) || "") ? "unsupported" : "error" };
      });
    },
    disable: function () {
      var token = ls("atlas.push.token");
      ls("atlas.push", "off"); ls("atlas.push.token", null);
      var jobs = [];
      if (token && acct.unregisterDevice) jobs.push(acct.unregisterDevice(token).catch(function () {}));
      if (acct.deleteWebPushToken) jobs.push(acct.deleteWebPushToken().catch(function () {}));
      return Promise.all(jobs).then(function () { return { ok: true }; });
    },
    beforeSignOut: function () { return push.isOn() ? push.disable() : Promise.resolve(); },
    text: text,
  };
})();

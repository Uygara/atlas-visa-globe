// /account/ — sign in (Google, email + password, phone, emailed link), see what is
// saved, download it, sign out, delete it.
// All in the page (no dialogs). Text is English; data/static-i18n.js
// translates it (its MutationObserver re-translates what this renders).
(function () {
  "use strict";
  var root = document.getElementById("account-root");
  if (!root) return;
  var acct = window.ATLAS_ACCOUNT || { enabled: false };
  var ui = { busy: false, message: null, messageTone: "info", linkSent: null, needEmailForLink: false, confirmDelete: false, phoneStep: 0, phoneNumber: "" };
  // The invisible reCAPTCHA that guards SMS sends lives outside the re-rendered
  // root, so it survives the render() that run() triggers.
  var recaptchaHost = document.createElement("div");
  recaptchaHost.id = "phone-recaptcha";
  document.body.appendChild(recaptchaHost);

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === "on") for (var ev in attrs.on) el.addEventListener(ev, attrs.on[ev]);
      else if (k === "text") el.textContent = attrs.text;
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { try { return localStorage.getItem(key); } catch (e2) { return null; } } }
  function name(iso) {
    var c = (window.COUNTRIES || []).filter(function (x) { return x.iso2 === iso; })[0];
    if (!c) return iso;
    // country-names.js reads window.ATLAS_LANG (set by the SPA's i18n.js elsewhere).
    try { window.ATLAS_LANG = localStorage.getItem("atlas.lang") || "en"; } catch (e) {}
    return c.flag + " " + (window.countryName ? window.countryName(iso) : c.name);
  }

  // What this browser has saved, in plain words.
  function savedRows() {
    var rows = [];
    var passport = read("atlas.passport");
    var watch = read("atlas.watchlist") || [];
    var trip = read("atlas.itinerary") || {};
    var schengen = read("atlas.schengen.trips") || [];
    rows.push(["Passport", passport ? name(passport) : "—"]);
    rows.push(["Watched destinations", Array.isArray(watch) && watch.length ? watch.map(name).join(", ") : "—"]);
    rows.push(["Planned trip", Array.isArray(trip.stops) && trip.stops.length ? trip.stops.map(function (s) { return name(s.iso2 || s); }).join(" → ") : "—"]);
    rows.push(["Schengen calculator trips", Array.isArray(schengen) ? String(schengen.length) : "—"]);
    return rows;
  }

  function savedTable() {
    return h("table", { class: "saved" }, [h("tbody", {}, savedRows().map(function (r) {
      return h("tr", {}, [h("th", { scope: "row", text: r[0] }), h("td", { "data-no-i18n": true, text: r[1] })]);
    }))]);
  }

  function run(promise, okMessage) {
    ui.busy = true; ui.message = null; render();
    return promise.then(function () {
      ui.busy = false; if (okMessage) { ui.message = okMessage; ui.messageTone = "ok"; } render();
    }).catch(function (e) {
      ui.busy = false; ui.message = errorText(e); ui.messageTone = "risk"; render();
    });
  }
  function errorText(e) {
    var code = (e && e.code) || "";
    if (/^push-/.test(code) && window.ATLAS_PUSH) return window.ATLAS_PUSH.text({ denied: "push_denied", signin: "push_signin" }[code.slice(5)] || "push_fail");
    if (/popup-closed|cancelled-popup/.test(code)) return "Sign-in was cancelled.";
    if (/invalid-email/.test(code)) return "That email address doesn't look right.";
    if (/invalid-action-code|expired-action-code/.test(code)) return "This sign-in link has expired or was already used. Ask for a new one.";
    if (/network-request-failed/.test(code)) return "No connection — try again.";
    if (/requires-recent-login/.test(code)) return "For your security, sign out, sign in again, then delete.";
    if (/unauthorized-domain/.test(code)) return "Sign-in isn't set up for this address yet.";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return "That email and password don't match.";
    if (/email-already-in-use/.test(code)) return "There is already an account with that email — sign in instead.";
    if (/weak-password/.test(code)) return "Use a password of at least 6 characters.";
    if (/missing-password/.test(code)) return "Enter your password.";
    if (/too-many-requests/.test(code)) return "Too many attempts. Wait a few minutes and try again.";
    if (/invalid-phone-number|missing-phone-number/.test(code)) return "That phone number doesn't look right. Include the country code, like +90 5xx xxx xx xx.";
    if (/invalid-verification-code|missing-verification-code/.test(code)) return "That code isn't right.";
    if (/code-expired|session-expired/.test(code)) return "That code has expired. Ask for a new one.";
    if (/quota-exceeded|captcha-check-failed/.test(code)) return "We can't send a code right now. Try another sign-in method or try again later.";
    if (/operation-not-allowed/.test(code)) return "This sign-in method isn't switched on yet.";
    return "Something went wrong. Please try again.";
  }

  function download() {
    var data = acct.exportData ? acct.exportData() : { data: {} };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = h("a", { href: URL.createObjectURL(blob), download: "travelnow-saved-data.json" });
    document.body.appendChild(a); a.click(); a.remove();
  }

  function note(text, tone) { return h("p", { class: "note note-" + (tone || "info") }, [h("span", { class: "note-k", text: text })]); }

  function render() {
    root.innerHTML = "";
    var st = acct.state || {};

    if (!acct.enabled) {
      root.appendChild(h("p", { text: "Accounts aren't switched on yet. Everything you save — your passport, watched destinations, planned trip and Schengen calculator trips — stays in this browser only." }));
      root.appendChild(h("h2", { text: "Saved in this browser" }));
      root.appendChild(savedTable());
      return;
    }

    if (ui.message) root.appendChild(note(ui.message, ui.messageTone));

    if (!st.ready) { root.appendChild(h("p", { class: "fine", text: "Loading…" })); return; }

    if (!st.user) {
      if (ui.needEmailForLink) {
        root.appendChild(h("h2", { text: "Finish signing in" }));
        root.appendChild(h("p", { text: "Enter the email address the sign-in link was sent to." }));
        root.appendChild(emailForm("Sign in", function (email) { return acct.finishEmailLink(email); }));
        return;
      }
      root.appendChild(h("p", { text: "Sign in to keep your passport, watched destinations, planned trip and Schengen calculator trips on every device. Use Google, your email and a password, or your phone number." }));
      root.appendChild(h("div", { class: "account-actions" }, [
        h("button", { type: "button", class: "btn btn-primary", disabled: ui.busy, on: { click: function () { run(acct.signInWithGoogle()); } } }, ["Continue with Google"]),
      ]));
      root.appendChild(h("h2", { text: "Email and password" }));
      root.appendChild(passwordForm());
      root.appendChild(h("h2", { text: "Phone number" }));
      root.appendChild(phoneForm());
      // (Sign-in by an emailed link is not offered: it needs a separate switch in the Firebase
      // console and email + password already covers "no social account". acct.sendEmailLink
      // and the link-landing handler below stay, so old links still work if it is ever enabled.)
      root.appendChild(h("h2", { text: "What an account stores" }));
      root.appendChild(h("p", { class: "fine", text: "Your email address and the items listed below — nothing else. No passport numbers or documents. You can download or delete it all at any time." }));
      root.appendChild(savedTable());
      return;
    }

    // Signed in
    root.appendChild(h("p", {}, ["Signed in as ", h("strong", { "data-no-i18n": true, text: st.user.email || st.user.phone || st.user.name || "" })]));
    var status = st.syncing ? "Syncing…" : st.error ? "Couldn't sync — will retry when you change something." : st.lastSync ? "Up to date on this device." : "";
    if (status) root.appendChild(h("p", { class: "fine", text: status }));
    root.appendChild(h("h2", { text: "Saved to your account" }));
    root.appendChild(savedTable());
    root.appendChild(h("div", { class: "account-actions" }, [
      h("button", { type: "button", class: "btn", disabled: ui.busy, on: { click: function () { run(acct.syncNow()); } } }, ["Sync now"]),
      h("button", { type: "button", class: "btn", on: { click: download } }, ["Download my data"]),
      h("button", { type: "button", class: "btn", disabled: ui.busy, on: { click: function () { run(acct.signOut()); } } }, ["Sign out"]),
    ]));
    if (window.ATLAS_PUSH && window.ATLAS_PUSH.supported) root.appendChild(pushBlock());
    root.appendChild(h("h2", { text: "Delete account" }));
    root.appendChild(h("p", { class: "fine", text: "Deletes your sign-in and everything stored with it. What's saved in this browser stays here." }));
    root.appendChild(h("button", {
      type: "button", class: "btn btn-danger", disabled: ui.busy,
      on: { click: function () {
        if (!ui.confirmDelete) { ui.confirmDelete = true; render(); return; }
        ui.confirmDelete = false;
        run(acct.deleteAccount(), "Your account has been deleted.");
      } },
    }, [ui.confirmDelete ? "Tap again to delete permanently" : "Delete my account"]));
  }

  // App only (assets/app-native.js defines ATLAS_PUSH): the switch that asks the
  // phone for permission and registers its token. Texts come from the bridge, which
  // carries its own translations, so the block opts out of the page translator.
  function pushBlock() {
    var P = window.ATLAS_PUSH, on = P.isOn();
    return h("div", { class: "app-push", "data-no-i18n": true }, [
      h("h2", { text: P.text("push") }),
      h("p", { class: "fine", text: on ? P.text("push_on") : P.text("push_off") }),
      h("button", {
        type: "button", class: "btn" + (on ? "" : " btn-primary"), disabled: ui.busy,
        on: { click: function () {
          if (on) { run(P.disable()); return; }
          run(P.enable().then(function (r) { if (!r.ok) throw { code: "push-" + r.reason }; }));
        } },
      }, [on ? P.text("push_disable") : P.text("push_enable")]),
    ]);
  }

  function passwordForm() {
    var email = h("input", { class: "field", type: "email", required: true, autocomplete: "email", placeholder: "you@example.com", "aria-label": "Email address", value: acct.pendingEmail && acct.pendingEmail() || "" });
    var pw = h("input", { class: "field", type: "password", required: true, minlength: "6", autocomplete: "current-password", placeholder: "Password", "aria-label": "Password" });
    var create = false;
    var form = h("form", { class: "account-email", on: { submit: function (e) {
      e.preventDefault();
      var em = email.value.trim();
      if (!em || !pw.value) return;
      if (create) run(acct.signUpWithPassword(em, pw.value), "Account created.");
      else run(acct.signInWithPassword(em, pw.value));
    } } }, [
      email, pw,
      h("button", { type: "submit", class: "btn btn-primary", disabled: ui.busy, on: { click: function () { create = false; } } }, ["Sign in"]),
      h("button", { type: "submit", class: "btn", disabled: ui.busy, on: { click: function () { create = true; } } }, ["Create account"]),
    ]);
    var forgot = h("button", { type: "button", class: "btn-link", disabled: ui.busy, on: { click: function () {
      var em = email.value.trim();
      if (!em) { ui.message = "Enter your email above, then tap “Forgot password?”."; ui.messageTone = "info"; render(); return; }
      run(acct.resetPassword(em), "We sent a password reset link — check your inbox.");
    } } }, ["Forgot password?"]);
    return h("div", {}, [form, h("p", { class: "fine" }, [forgot])]);
  }

  function phoneForm() {
    if (ui.phoneStep === 1) {
      var code = h("input", { class: "field", type: "text", inputmode: "numeric", pattern: "[0-9]*", maxlength: "6", required: true, autocomplete: "one-time-code", placeholder: "123456", "aria-label": "Enter the 6-digit code" });
      return h("form", { class: "account-email", on: { submit: function (e) {
        e.preventDefault();
        var c = code.value.trim();
        if (!c) return;
        run(acct.confirmPhoneCode(c).then(function () { ui.phoneStep = 0; }));
      } } }, [
        h("p", { class: "fine", style: "flex-basis:100%;margin:0", text: "We sent a code by SMS." }),
        code,
        h("button", { type: "submit", class: "btn btn-primary", disabled: ui.busy }, ["Verify"]),
        h("button", { type: "button", class: "btn", disabled: ui.busy, on: { click: function () { ui.phoneStep = 0; render(); } } }, ["Use another number"]),
      ]);
    }
    var num = h("input", { class: "field", type: "tel", required: true, autocomplete: "tel", placeholder: "+90 5xx xxx xx xx", "aria-label": "Phone number", value: ui.phoneNumber });
    return h("form", { class: "account-email", on: { submit: function (e) {
      e.preventDefault();
      // Firebase wants E.164: a leading + and digits only.
      var raw = num.value.trim();
      var n = (raw.charAt(0) === "+" ? "+" : "") + raw.replace(/\D/g, "");
      ui.phoneNumber = raw;
      run(acct.sendPhoneCode(n, recaptchaHost).then(function () { ui.phoneStep = 1; }));
    } } }, [num, h("button", { type: "submit", class: "btn", disabled: ui.busy }, ["Send code"])]);
  }

  function emailForm(label, submit) {
    var input = h("input", { class: "field", type: "email", required: true, autocomplete: "email", placeholder: "you@example.com", "aria-label": "Email address", value: acct.pendingEmail && acct.pendingEmail() || "" });
    var form = h("form", { class: "account-email", on: { submit: function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!email) return;
      run(submit(email));
    } } }, [input, h("button", { type: "submit", class: "btn", disabled: ui.busy }, [label])]);
    return form;
  }

  if (acct.enabled) {
    acct.onChange(function () { if (!ui.busy) render(); });
    // Arriving from an emailed sign-in link.
    acct.isEmailLink().then(function (isLink) {
      if (!isLink) return;
      var email = acct.pendingEmail();
      if (email) run(acct.finishEmailLink(email));
      else { ui.needEmailForLink = true; render(); }
    }).catch(function () {});
  }
  window.addEventListener("atlas:lang", function () { render(); });
  render();
})();

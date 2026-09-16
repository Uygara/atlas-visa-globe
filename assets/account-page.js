// /account/ — sign in, see what is saved, download it, sign out, delete it.
// All in the page (no dialogs). Text is English; data/static-i18n.js
// translates it (its MutationObserver re-translates what this renders).
(function () {
  "use strict";
  var root = document.getElementById("account-root");
  if (!root) return;
  var acct = window.ATLAS_ACCOUNT || { enabled: false };
  var ui = { busy: false, message: null, messageTone: "info", linkSent: null, needEmailForLink: false, confirmDelete: false };

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
    if (/popup-closed|cancelled-popup/.test(code)) return "Sign-in was cancelled.";
    if (/invalid-email/.test(code)) return "That email address doesn't look right.";
    if (/invalid-action-code|expired-action-code/.test(code)) return "This sign-in link has expired or was already used. Ask for a new one.";
    if (/network-request-failed/.test(code)) return "No connection — try again.";
    if (/requires-recent-login/.test(code)) return "For your security, sign out, sign in again, then delete.";
    if (/unauthorized-domain/.test(code)) return "Sign-in isn't set up for this address yet.";
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
      root.appendChild(h("p", { text: "Sign in to keep your passport, watched destinations, planned trip and Schengen calculator trips on every device. No password — use Google or a one-time link by email." }));
      root.appendChild(h("div", { class: "account-actions" }, [
        h("button", { type: "button", class: "btn btn-primary", disabled: ui.busy, on: { click: function () { run(acct.signInWithGoogle()); } } }, ["Continue with Google"]),
      ]));
      root.appendChild(h("h2", { text: "Or get a sign-in link by email" }));
      if (ui.linkSent) {
        root.appendChild(note("Check your inbox — we sent a sign-in link. Open it on this device.", "ok"));
      } else {
        root.appendChild(emailForm("Email me a link", function (email) {
          return acct.sendEmailLink(email).then(function () { ui.linkSent = email; });
        }));
      }
      root.appendChild(h("h2", { text: "What an account stores" }));
      root.appendChild(h("p", { class: "fine", text: "Your email address and the items listed below — nothing else. No passport numbers or documents. You can download or delete it all at any time." }));
      root.appendChild(savedTable());
      return;
    }

    // Signed in
    root.appendChild(h("p", {}, ["Signed in as ", h("strong", { "data-no-i18n": true, text: st.user.email || st.user.name || "" })]));
    var status = st.syncing ? "Syncing…" : st.error ? "Couldn't sync — will retry when you change something." : st.lastSync ? "Up to date on this device." : "";
    if (status) root.appendChild(h("p", { class: "fine", text: status }));
    root.appendChild(h("h2", { text: "Saved to your account" }));
    root.appendChild(savedTable());
    root.appendChild(h("div", { class: "account-actions" }, [
      h("button", { type: "button", class: "btn", disabled: ui.busy, on: { click: function () { run(acct.syncNow()); } } }, ["Sync now"]),
      h("button", { type: "button", class: "btn", on: { click: download } }, ["Download my data"]),
      h("button", { type: "button", class: "btn", disabled: ui.busy, on: { click: function () { run(acct.signOut()); } } }, ["Sign out"]),
    ]));
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

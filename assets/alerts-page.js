// /alerts/: choose a passport and the countries to watch, then turn on notifications for
// this browser (or the app). Everything here is the same data the rest of the site uses:
// atlas.passport and atlas.watchlist in local storage, synced to the account by account.js.
// The daily job backend/dispatch-push.js decides what to send. Text is English; the page
// translator (data/static-i18n.js) translates it, the notification block carries its own.
(function () {
  "use strict";
  var root = document.getElementById("alerts-root");
  if (!root) return;
  var acct = window.ATLAS_ACCOUNT || { enabled: false };
  var P = window.ATLAS_PUSH;
  var MAX = 20;
  var ui = { busy: false, msg: null, tone: "info", q: "" };

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
  function lang() { try { return localStorage.getItem("atlas.lang") || "en"; } catch (e) { return "en"; } }
  function name(iso) {
    window.ATLAS_LANG = lang();
    return window.countryName ? window.countryName(iso) : iso;
  }
  function flag(iso) { var c = (window.COUNTRIES || []).filter(function (x) { return x.iso2 === iso; })[0]; return c ? c.flag : ""; }
  function passport() { try { return localStorage.getItem("atlas.passport") || ""; } catch (e) { return ""; } }
  function watchlist() {
    try { var a = JSON.parse(localStorage.getItem("atlas.watchlist") || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveWatch(list) { try { localStorage.setItem("atlas.watchlist", JSON.stringify(list)); } catch (e) {} }
  var countries = (window.COUNTRIES || []).filter(function (c) { return c.continent !== "AN"; });

  function section(n, title, body) {
    return h("section", { class: "al-sec" }, [h("h2", {}, [h("span", { class: "al-n", "aria-hidden": "true", text: String(n).padStart(2, "0") }), title])].concat(body));
  }

  function passportSection() {
    var cur = passport();
    var sorted = countries.slice().sort(function (a, b) { return name(a.iso2).localeCompare(name(b.iso2), lang()); });
    var sel = h("select", { class: "field", "aria-label": "Your passport", on: { change: function (e) {
      try { localStorage.setItem("atlas.passport", e.target.value); } catch (err) {}
      render();
    } } }, [h("option", { value: "", text: "Choose your passport" })].concat(sorted.map(function (c) {
      return h("option", { value: c.iso2, selected: c.iso2 === cur, "data-no-i18n": true, text: c.flag + " " + name(c.iso2) });
    })));
    return section(1, "Your passport", [sel]);
  }

  function watchSection() {
    var list = watchlist();
    var chips = list.length
      ? h("ul", { class: "al-chips" }, list.map(function (iso) {
          return h("li", { class: "al-chip" }, [
            h("span", { "data-no-i18n": true, text: flag(iso) + " " + name(iso) }),
            h("button", { type: "button", class: "al-x", "aria-label": "Remove", on: { click: function () {
              saveWatch(watchlist().filter(function (x) { return x !== iso; })); render();
            } } }, ["×"]),
          ]);
        }))
      : h("p", { class: "fine", text: "You're not watching any country yet. Add one here, or tap the star on a country's card on the map." });
    var q = ui.q.trim().toLowerCase();
    var hits = q ? countries.filter(function (c) {
      return list.indexOf(c.iso2) < 0 && (name(c.iso2).toLowerCase().indexOf(q) >= 0 || c.name.toLowerCase().indexOf(q) >= 0 || c.iso2.toLowerCase() === q);
    }).slice(0, 8) : [];
    var input = h("input", { class: "field", type: "search", value: ui.q, autocomplete: "off", placeholder: "Add a country", "aria-label": "Add a country",
      on: { input: function (e) { ui.q = e.target.value; render(); var i = root.querySelector(".al-add input"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } } });
    var results = hits.length ? h("div", { class: "al-results" }, hits.map(function (c) {
      return h("button", { type: "button", class: "al-hit", "data-no-i18n": true, on: { click: function () {
        var l = watchlist(); if (l.length >= MAX) return; l.push(c.iso2); saveWatch(l); ui.q = ""; render();
      } } }, [c.flag + " " + name(c.iso2)]);
    })) : null;
    var full = list.length >= MAX;
    return section(2, "Countries you watch", [chips, full ? h("p", { class: "fine", text: "You can watch up to 20 countries." }) : h("div", { class: "al-add" }, [input, results])]);
  }

  function notifySection() {
    var st = acct.state || {};
    var body = [];
    if (!acct.enabled) {
      body.push(h("p", { class: "fine", text: "Alerts need an account, and accounts are not available right now." }));
    } else if (!st.ready) {
      body.push(h("p", { class: "fine", text: "Loading…" }));
    } else if (!st.user) {
      body.push(h("p", { text: "Alerts are tied to your account, so they reach every device where you turn them on." }));
      body.push(h("a", { class: "btn btn-primary", href: "/account/" }, ["Sign in or create an account"]));
    } else {
      body.push(h("p", { class: "fine" }, ["Signed in as ", h("strong", { "data-no-i18n": true, text: st.user.email || st.user.phone || "" })]));
      if (!P || !P.supported) {
        body.push(h("p", { class: "note note-info", "data-no-i18n": true }, [h("span", { class: "note-k", text: P ? P.text("push_unsupported") : "" })]));
      } else {
        var on = P.isOn();
        body.push(h("div", { "data-no-i18n": true }, [
          h("p", { class: "fine", text: on ? P.text("push_on") : P.text("push_off") }),
          h("button", { type: "button", class: "btn" + (on ? "" : " btn-primary"), disabled: ui.busy, on: { click: function () {
            ui.busy = true; ui.msg = null; render();
            var job = on ? P.disable() : P.enable();
            job.then(function (r) {
              ui.busy = false;
              if (!r.ok) { ui.msg = P.text({ denied: "push_denied", signin: "push_signin", unsupported: "push_unsupported" }[r.reason] || "push_fail"); ui.tone = "risk"; }
              render();
            });
          } } }, [on ? P.text("push_disable") : P.text("push_enable")]),
        ]));
      }
    }
    if (ui.msg) body.push(h("p", { class: "note note-" + ui.tone, "data-no-i18n": true }, [h("span", { class: "note-k", text: ui.msg })]));
    if (!passport() && !watchlist().length) body.push(h("p", { class: "fine", text: "Choose a passport or a country to watch first, otherwise there is nothing to alert you about." }));
    return section(3, "Where to send alerts", body);
  }

  function render() {
    root.innerHTML = "";
    root.appendChild(passportSection());
    root.appendChild(watchSection());
    root.appendChild(notifySection());
  }
  if (acct.onChange) acct.onChange(function () { if (!ui.busy) render(); });
  window.addEventListener("atlas:lang", render);
  window.addEventListener("storage", function (e) { if (e.key === "atlas.watchlist" || e.key === "atlas.passport") render(); });
  render();
})();

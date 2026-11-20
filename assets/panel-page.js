// /panel/: the personal travel panel. Passports (main + up to 2 extra), followed countries,
// their visa status side by side, and what changed lately. Everything lives in local storage
// (atlas.passport, atlas.passports, atlas.watchlist, atlas.panel.seen); assets/account.js carries
// those keys to the account when someone is signed in, so this page never talks to Firebase.
// Visa facts come from /open-data/visa-matrix.json and data/changelog.js, nothing is typed by hand.
// Text is English with a Turkish table next to it (the page is also built as a /tr/ twin).
(function () {
  "use strict";
  var root = document.getElementById("panel-root");
  if (!root) return;
  var acct = window.ATLAS_ACCOUNT || { enabled: false };

  var MAX_PASSPORTS = 3, MAX_WATCH = 30, DAYS = 90, MAX_CHANGES = 50;
  // Easiest first. Same order as scripts/generate-seo.js STATUS_ORDER.
  var ORDER = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];

  var TR = {
    "Sign in to see this panel on every device.": "Bu paneli her cihazda görmek için giriş yap.",
    "Your passports": "Pasaportların",
    "Main": "Ana",
    "Add a passport": "Pasaport ekle",
    "Remove": "Kaldır",
    "You can keep up to 3 passports.": "En fazla 3 pasaport tutabilirsin.",
    "Countries you follow": "Takip ettiğin ülkeler",
    "Add a country": "Ülke ekle",
    "Add the countries you want to follow.": "Takip etmek istediğin ülkeleri ekle.",
    "You can follow up to 30 countries.": "En fazla 30 ülke takip edebilirsin.",
    "Visa status": "Vize durumu",
    "Choose a passport to see visa rules.": "Vize kurallarını görmek için bir pasaport seç.",
    "Add a country to see its visa rules.": "Vize kurallarını görmek için bir ülke ekle.",
    "Loading visa rules…": "Vize kuralları yükleniyor…",
    "Visa rules could not be loaded. Try again later.": "Vize kuralları yüklenemedi. Daha sonra tekrar dene.",
    "Country": "Ülke",
    "Easiest": "En kolay",
    "Your passport": "Senin pasaportun",
    "No data": "Veri yok",
    "Data updated {date}.": "Veriler {date} tarihinde güncellendi.",
    "Source: Wikipedia visa requirement articles, daily snapshot": "Kaynak: Wikipedia vize koşulları sayfaları, günlük kayıt",
    "Open data": "Açık veri",
    "Changes": "Değişiklikler",
    "New": "Yeni",
    "No changes in the last 90 days for your passports and countries.": "Son 90 günde pasaportların ve ülkelerin için değişiklik olmadı.",
    "Notifications": "Bildirimler",
    "Get a notification when one of these changes": "Bunlardan biri değiştiğinde bildirim al",
    "ID card travel": "Kimlikle giriş", "Visa-free": "Vizesiz", "Travel authorization": "Seyahat izni",
    "eVisa": "e-Vize", "Visa on arrival": "Varışta vize", "Visa required": "Vize gerekli", "No entry allowed": "Girişe kapalı"
  };
  var STATUS = { idc: "ID card travel", vf: "Visa-free", eta: "Travel authorization", ev: "eVisa", voa: "Visa on arrival", vr: "Visa required", ban: "No entry allowed" };

  function lang() {
    var p = document.documentElement.getAttribute("data-page-lang");
    if (p) return p;
    try { return localStorage.getItem("atlas.lang") || "en"; } catch (e) { return "en"; }
  }
  function t(s, vars) {
    var out = (lang() === "tr" && TR[s]) || s;
    for (var k in (vars || {})) out = out.replace("{" + k + "}", vars[k]);
    return out;
  }
  function upTo(n) { return lang() === "tr" ? n + " güne kadar" : "up to " + n + " days"; }
  function prefix() { return lang() === "tr" ? "/tr" : ""; }

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

  // ── countries ──
  var countries = (window.COUNTRIES || []).filter(function (c) { return c.continent !== "AN"; });
  var byIso = {};
  (window.COUNTRIES || []).forEach(function (c) { byIso[c.iso2] = c; });
  function nameIn(iso, lg) {
    var prev = window.ATLAS_LANG;
    window.ATLAS_LANG = lg;
    var n = window.countryName ? window.countryName(iso) : (byIso[iso] ? byIso[iso].name : iso);
    window.ATLAS_LANG = prev;
    return n;
  }
  function name(iso) { return nameIn(iso, lang()); }
  function flag(iso) { return byIso[iso] ? byIso[iso].flag : ""; }

  // ── storage ──
  function getRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setRaw(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function readIsoList(k) {
    var a; try { a = JSON.parse(getRaw(k) || "[]"); } catch (e) { a = []; }
    if (!Array.isArray(a)) return [];
    return a.filter(function (x, i) { return typeof x === "string" && byIso[x] && a.indexOf(x) === i; });
  }
  // atlas.passport is a plain ISO2 string (the map writes it that way); tolerate a JSON string too.
  function mainPassport() {
    var raw = getRaw("atlas.passport") || "";
    try { var j = JSON.parse(raw); if (typeof j === "string") raw = j; } catch (e) {}
    return byIso[raw] ? raw : "";
  }
  function passports() {
    var main = mainPassport();
    var extras = readIsoList("atlas.passports").filter(function (x) { return x !== main; });
    return (main ? [main] : []).concat(extras).slice(0, MAX_PASSPORTS);
  }
  function watchlist() { return readIsoList("atlas.watchlist"); }
  function saveWatch(list) {
    setRaw("atlas.watchlist", JSON.stringify(list));
    try { window.dispatchEvent(new CustomEvent("atlas:watchlist", { detail: { list: list } })); } catch (e) {}
  }
  function addPassport(iso) {
    var list = passports();
    if (!byIso[iso] || list.indexOf(iso) >= 0 || list.length >= MAX_PASSPORTS) return;
    if (!mainPassport()) { setRaw("atlas.passport", iso); return; }
    var extras = list.slice(1); extras.push(iso);
    setRaw("atlas.passports", JSON.stringify(extras));
  }
  function removePassport(iso) {
    var main = mainPassport();
    var extras = passports().slice(main ? 1 : 0).filter(function (x) { return x !== iso; });
    if (iso === main) {
      if (extras.length) { setRaw("atlas.passport", extras[0]); extras = extras.slice(1); }
      else { try { localStorage.removeItem("atlas.passport"); } catch (e) {} }
    }
    setRaw("atlas.passports", JSON.stringify(extras));
  }

  // ── visa matrix ──
  var matrix = null, matrixState = "loading";
  function loadMatrix() {
    fetch("/open-data/visa-matrix.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { matrix = j; matrixState = "ok"; render(); })
      .catch(function () { matrixState = "error"; render(); });
  }
  function rule(p, dest) {
    var row = matrix && matrix.passports && matrix.passports[p];
    var r = row && row[dest];
    return r && r[0] ? { s: r[0], days: r[1] } : null;
  }
  function rank(r) { var i = ORDER.indexOf(r.s); return i < 0 ? ORDER.length : i; }
  // Passports that give the easiest entry to a country; empty when they are all equal or there is one.
  function easiest(plist, dest) {
    var rs = plist.map(function (p) { return p === dest ? null : rule(p, dest); });
    var known = rs.filter(Boolean);
    if (plist.length < 2 || known.length < 1) return [];
    function better(a, b) { return rank(a) - rank(b) || (b.days || 0) - (a.days || 0); }
    var best = known.slice().sort(better)[0];
    var same = rs.map(function (r) { return !!r && better(r, best) === 0; });
    var allSame = rs.every(function (r) { return !!r && better(r, best) === 0; });
    return allSame ? [] : plist.filter(function (p, i) { return same[i]; });
  }

  function swatch(s) {
    return h("span", { class: "sw" + (s === "ban" ? " sw-ban" : ""), "data-s": s || null, style: s ? "--sw:var(--" + s + ")" : null, "aria-hidden": "true" });
  }
  function cellFor(p, dest, isBest) {
    var r;
    if (p === dest) return { s: null, label: t("Your passport"), days: null, best: false };
    r = rule(p, dest);
    if (!r) return { s: null, label: t("No data"), days: null, best: false };
    return { s: r.s, label: t(STATUS[r.s] || r.s), days: r.days ? upTo(r.days) : null, best: isBest };
  }

  function section(title, kids) {
    return h("section", { class: "pn-sec" }, [h("h2", { text: title })].concat(kids));
  }

  // ── sections ──
  function signinNote() {
    var st = acct.state || {};
    if (!acct.enabled || !st.ready || st.user) return null;
    return h("p", { class: "note" }, [h("a", { href: "/account/?next=" + prefix() + "/panel/", text: t("Sign in to see this panel on every device.") })]);
  }

  function passportSection() {
    var list = passports(), main = mainPassport();
    var chips = h("ul", { class: "pn-chips" }, list.map(function (iso, i) {
      return h("li", { class: "pn-chip" }, [
        h("span", { "data-no-i18n": true, text: flag(iso) + " " + name(iso) }),
        i === 0 && list.length > 1 && main ? h("small", { text: t("Main") }) : null,
        h("button", { type: "button", class: "pn-x", "aria-label": t("Remove") + " " + name(iso), on: { click: function () { removePassport(iso); render(); } } }, ["×"]),
      ]);
    }));
    var body = [list.length ? chips : null];
    if (list.length >= MAX_PASSPORTS) {
      body.push(h("p", { class: "fine", text: t("You can keep up to 3 passports.") }));
    } else {
      var sorted = countries.filter(function (c) { return list.indexOf(c.iso2) < 0; })
        .sort(function (a, b) { return name(a.iso2).localeCompare(name(b.iso2), lang()); });
      body.push(h("select", { class: "field", "aria-label": t("Add a passport"), on: { change: function (e) {
        if (e.target.value) { addPassport(e.target.value); render(); }
      } } }, [h("option", { value: "", text: t("Add a passport") })].concat(sorted.map(function (c) {
        return h("option", { value: c.iso2, "data-no-i18n": true, text: c.flag + " " + name(c.iso2) });
      }))));
    }
    return section(t("Your passports"), body);
  }

  var ui = { q: "" };
  function watchSection() {
    var list = watchlist();
    var chips = list.length
      ? h("ul", { class: "pn-chips" }, list.map(function (iso) {
          return h("li", { class: "pn-chip" }, [
            h("span", { "data-no-i18n": true, text: flag(iso) + " " + name(iso) }),
            h("button", { type: "button", class: "pn-x", "aria-label": t("Remove") + " " + name(iso), on: { click: function () {
              saveWatch(watchlist().filter(function (x) { return x !== iso; })); render();
            } } }, ["×"]),
          ]);
        }))
      : h("p", { class: "fine", text: t("Add the countries you want to follow.") });
    var body = [chips];
    if (list.length >= MAX_WATCH) {
      body.push(h("p", { class: "fine", text: t("You can follow up to 30 countries.") }));
    } else {
      var results = h("div", { class: "pn-results", hidden: true });
      function hits() {
        var q = ui.q.trim().toLowerCase(), cur = watchlist();
        if (q.length < 2) return [];
        return countries.filter(function (c) {
          return cur.indexOf(c.iso2) < 0 && (c.name.toLowerCase().indexOf(q) >= 0 || nameIn(c.iso2, "tr").toLowerCase().indexOf(q) >= 0 || name(c.iso2).toLowerCase().indexOf(q) >= 0);
        }).slice(0, 8);
      }
      function fill() {
        results.innerHTML = "";
        var hs = hits();
        hs.forEach(function (c) {
          results.appendChild(h("button", { type: "button", class: "pn-hit", "data-no-i18n": true, on: { click: function () {
            var l = watchlist(); if (l.length >= MAX_WATCH || l.indexOf(c.iso2) >= 0) return;
            l.push(c.iso2); saveWatch(l); ui.q = ""; render();
          } } }, [c.flag + " " + name(c.iso2)]));
        });
        results.hidden = !hs.length;
      }
      var input = h("input", { class: "field", type: "search", value: ui.q, autocomplete: "off", placeholder: t("Add a country"), "aria-label": t("Add a country"),
        on: { input: function (e) { ui.q = e.target.value; fill(); } } });
      body.push(h("div", { class: "pn-add" }, [input, results]));
      fill();
    }
    return section(t("Countries you follow"), body);
  }

  function statusSection(plist, wlist) {
    var body = [];
    if (!plist.length) body.push(h("p", { class: "fine", text: t("Choose a passport to see visa rules.") }));
    else if (!wlist.length) body.push(h("p", { class: "fine", text: t("Add a country to see its visa rules.") }));
    else if (matrixState === "loading") body.push(h("p", { class: "fine", text: t("Loading visa rules…") }));
    else if (matrixState === "error") body.push(h("p", { class: "note", text: t("Visa rules could not be loaded. Try again later.") }));
    else {
      var link = function (iso) { return prefix() + "/visa/" + iso.toLowerCase() + "/"; };
      var cell = function (p, dest, best) {
        var c = cellFor(p, dest, best.indexOf(p) >= 0);
        return c;
      };
      // Desktop table.
      var head = h("tr", {}, [h("th", { scope: "col", text: t("Country") })].concat(plist.map(function (p) {
        return h("th", { scope: "col", "data-no-i18n": true, text: flag(p) + " " + name(p) });
      })));
      var rows = wlist.map(function (dest) {
        var best = easiest(plist, dest);
        return h("tr", {}, [h("td", { class: "pn-dest" }, [h("a", { href: link(dest), "data-no-i18n": true, text: flag(dest) + " " + name(dest) })])].concat(plist.map(function (p) {
          var c = cell(p, dest, best);
          return h("td", { class: "pn-c" }, [
            swatch(c.s), h("span", { text: c.label }), c.best ? h("span", { class: "pn-best", text: t("Easiest") }) : null,
            c.days ? h("span", { class: "pn-days", text: c.days }) : null,
          ]);
        })));
      });
      body.push(h("div", { class: "pn-tablewrap table-scroll" }, [h("table", { class: "pn-table" }, [h("thead", {}, [head]), h("tbody", {}, rows)])]));
      // Phone: one card per country.
      body.push(h("div", { class: "pn-cards" }, wlist.map(function (dest) {
        var best = easiest(plist, dest);
        return h("article", { class: "pn-card" }, [
          h("h3", {}, [h("a", { href: link(dest), "data-no-i18n": true, text: flag(dest) + " " + name(dest) })]),
          h("ul", {}, plist.map(function (p) {
            var c = cell(p, dest, best);
            return h("li", {}, [
              h("b", { "data-no-i18n": true, text: flag(p) + " " + name(p) }),
              h("span", {}, [swatch(c.s), " ", c.label, c.best ? h("span", { class: "pn-best", text: t("Easiest") }) : null, c.days ? h("span", { class: "pn-days", text: c.days }) : null]),
            ]);
          })),
        ]);
      })));
      var upd = matrix.generated ? fmtDate(matrix.generated) : "";
      body.push(h("p", { class: "fine" }, [
        upd ? t("Data updated {date}.", { date: upd }) + " " : "",
        t("Source: Wikipedia visa requirement articles, daily snapshot"), ". ",
        h("a", { href: prefix() + "/open-data/", text: t("Open data") }),
      ]));
    }
    return section(t("Visa status"), body);
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    if (isNaN(d)) return iso;
    try { return d.toLocaleDateString(lang() === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); } catch (e) { return iso; }
  }

  // Entries from the last 90 days for followed countries and the visitor's own passports.
  function changes(plist, wlist) {
    var cutoff = Date.now() - DAYS * 86400000;
    return (window.CHANGELOG || []).filter(function (c) {
      if (!c.affects || wlist.indexOf(c.affects.dest) < 0) return false;
      if (Date.parse(c.date + "T00:00:00Z") < cutoff) return false;
      return (c.affects.passports || []).some(function (p) { return plist.indexOf(p) >= 0; });
    }).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, MAX_CHANGES);
  }
  var seenAtLoad = null, seenWritten = false;
  function changesSection(plist, wlist) {
    var body = [];
    if (!plist.length) body.push(h("p", { class: "fine", text: t("Choose a passport to see visa rules.") }));
    else if (!wlist.length) body.push(h("p", { class: "fine", text: t("Add a country to see its visa rules.") }));
    else {
      var list = changes(plist, wlist);
      if (seenAtLoad == null) seenAtLoad = parseInt(getRaw("atlas.panel.seen") || "0", 10) || 0;
      if (!list.length) body.push(h("p", { class: "fine", text: t("No changes in the last 90 days for your passports and countries.") }));
      else {
        body.push(h("ul", { class: "pn-feed" }, list.map(function (c) {
          var mine = (c.affects.passports || []).filter(function (p) { return plist.indexOf(p) >= 0; });
          var isNew = seenAtLoad > 0 && Date.parse(c.date + "T00:00:00Z") > seenAtLoad;
          return h("li", {}, [
            h("div", { class: "pn-meta" }, [h("time", { datetime: c.date, text: fmtDate(c.date) }), isNew ? h("span", { class: "pn-new", text: t("New") }) : null]),
            h("div", { "data-no-i18n": true, text: mine.map(name).join(", ") + " → " + name(c.affects.dest) + ": " + t(STATUS[c.statusFrom] || c.statusFrom) + " → " + t(STATUS[c.statusTo] || c.statusTo) }),
          ]);
        })));
        body.push(h("p", { class: "fine", text: t("Source: Wikipedia visa requirement articles, daily snapshot") }));
        // The list is on screen: remember when, so the next visit can tag what is newer.
        if (!seenWritten) { seenWritten = true; setRaw("atlas.panel.seen", String(Date.now())); }
      }
    }
    return section(t("Changes"), body);
  }

  function notifySection() {
    return section(t("Notifications"), [h("a", { class: "pn-link", href: prefix() + "/alerts/", text: t("Get a notification when one of these changes") })]);
  }

  function render() {
    var plist = passports(), wlist = watchlist();
    root.innerHTML = "";
    [signinNote(), passportSection(), watchSection(), statusSection(plist, wlist), changesSection(plist, wlist), notifySection()]
      .forEach(function (n) { if (n) root.appendChild(n); });
  }

  if (acct.onChange) acct.onChange(function () { render(); });
  window.addEventListener("atlas:lang", render);
  window.addEventListener("storage", function (e) {
    if (!e.key || /^atlas\.(passport|passports|watchlist)$/.test(e.key)) render();
  });
  render();
  loadMatrix();
})();

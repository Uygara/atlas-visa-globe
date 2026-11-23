// Behaviour for the static-page masthead stamped by scripts/partials.js:
//   • "All tools" and "Language and theme" pop-over menus (button + hidden panel)
//   • mobile sheet (opened by "More" in the tab bar)
//   • light/dark toggle (shares atlas.tweaks.background with the globe apps)
//   • language choice (hands off to data/static-i18n.js when the page has it)
// Pure progressive enhancement: without JS every link is still a real link
// (the panel markup is in the HTML, only hidden).
(function () {
  "use strict";

  // ── Theme ─────────────────────────────────────────────────────────────
  function readTheme() {
    try { return JSON.parse(localStorage.getItem("atlas.tweaks") || "{}").background === "dark" ? "dark" : "light"; }
    catch (e) { return "light"; }
  }
  function applyTheme(theme) {
    var dark = theme === "dark";
    [document.documentElement, document.body].forEach(function (el) {
      if (!el) return;
      el.classList.toggle("theme-dark", dark);
      el.classList.toggle("theme-light", !dark);
    });
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === theme));
    });
    // The menu button shows the current theme's name.
    document.querySelectorAll("[data-theme-label]").forEach(function (el) {
      el.hidden = el.getAttribute("data-theme-label") !== theme;
    });
  }
  function setTheme(theme) {
    try {
      var tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      tw.background = theme;
      localStorage.setItem("atlas.tweaks", JSON.stringify(tw));
    } catch (e) {}
    applyTheme(theme);
  }

  function init() {
    applyTheme(readTheme());
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme-set")); });
    });
    window.addEventListener("storage", function (e) {
      if (e.key === "atlas.tweaks") applyTheme(readTheme());
    });

    // Skip link: the first tab stop, past the masthead to the page's content.
    // (Its text is translated by static-i18n.js like the rest of the page.)
    var content = document.querySelector("main, .wrap");
    if (content && !document.querySelector(".skip-link")) {
      if (!content.id) content.id = "main-content";
      content.setAttribute("tabindex", "-1");
      var skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#" + content.id;
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
    var head = document.querySelector("body > .masthead");
    if (!head) return;

    // ── Language ──────────────────────────────────────────────────────
    var selects = head.querySelectorAll("[data-lang-select]");
    var langBtns = head.querySelectorAll("[data-lang-set]");
    var lang = "en";
    try { lang = localStorage.getItem("atlas.lang") || "en"; } catch (e) {}
    // Pages with a Turkish twin (/x/ ↔ /tr/x/) carry <link rel="alternate"
    // hreflang>; on a Turkish page the language IS the page's, not the stored one.
    var pageLang = document.documentElement.getAttribute("data-page-lang");
    if (pageLang) lang = pageLang;
    function twin(code) {
      var l = document.querySelector('link[rel="alternate"][hreflang="' + code + '"]');
      return l ? l.getAttribute("href") : null;
    }
    function showLang(code) {
      selects.forEach(function (s) { s.value = code; });
      langBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang-set") === code)); });
      head.querySelectorAll("[data-lang-code]").forEach(function (el) { el.textContent = code.toUpperCase(); });
    }
    function chooseLang(code) {
      showLang(code);
      try { localStorage.setItem("atlas.lang", code); } catch (e) {}
      // Between the two twins, navigate: the Turkish text is real HTML, not a
      // client-side overlay. From a Turkish page to es/de/fr/ar go to the
      // English twin, which translates in place.
      var target = (code === "en" || code === "tr") ? twin(code) : (pageLang === "tr" ? twin("en") : null);
      if (target && target.replace(/^https?:\/\/[^/]+/, "") !== location.pathname) {
        location.href = target.replace(/^https?:\/\/[^/]+/, "") + location.hash;
        return;
      }
      if (window.ATLAS_STATIC_I18N) window.ATLAS_STATIC_I18N.apply(code);
      window.dispatchEvent(new CustomEvent("atlas:lang", { detail: { code: code } }));
    }
    showLang(lang);
    selects.forEach(function (sel) { sel.addEventListener("change", function () { chooseLang(sel.value); }); });
    langBtns.forEach(function (b) { b.addEventListener("click", function () { chooseLang(b.getAttribute("data-lang-set")); }); });

    // ── Current page ─────────────────────────────────────────────────
    var path = location.pathname.replace(/index\.html$/, "").replace(/^\/tr(?=\/)/, "");
    // A dropdown button is lit only when the current page is one of ITS links: the "Maps" menu
    // for a map, "All tools" for a tool. (Both buttons share .mh-all-btn, so look inside each panel.)
    document.querySelectorAll(".masthead a.mh-link, .masthead a.mh-sheet-link, .masthead a.mh-sheet-tool, .masthead a.mh-tool, .tabbar a.tb-item").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace(/^\/tr(?=\/)/, "");
      var on = href === "/" ? (path === "/") : (path === href || path.indexOf(href) === 0);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    head.querySelectorAll(".mh-all-btn[aria-controls]").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.classList.toggle("has-current", !!(panel && panel.querySelector('a.mh-tool[aria-current="page"]')));
    });

    // ── Pop-over menus ───────────────────────────────────────────────
    // A real <button aria-expanded aria-controls> and a `hidden` panel. Opening moves focus
    // into the panel; Esc, a click outside, or tabbing out closes it and (for Esc) returns focus.
    var pops = [];
    function closeAll(except) {
      pops.forEach(function (p) { if (p !== except) p.close(); });
    }
    function pop(btn, panel) {
      if (!btn || !panel) return;
      var p = {
        btn: btn, panel: panel,
        isOpen: function () { return !panel.hidden; },
        open: function () {
          closeAll(p);
          panel.hidden = false;
          btn.setAttribute("aria-expanded", "true");
          var first = panel.querySelector("a[href], button");
          if (first) first.focus();
        },
        close: function (refocus) {
          if (panel.hidden) return;
          panel.hidden = true;
          btn.setAttribute("aria-expanded", "false");
          if (refocus) btn.focus();
        }
      };
      btn.addEventListener("click", function () { if (p.isOpen()) p.close(true); else p.open(); });
      panel.addEventListener("focusout", function (e) {
        var to = e.relatedTarget;
        if (to && !panel.contains(to) && to !== btn) p.close();
      });
      pops.push(p);
    }
    Array.prototype.forEach.call(head.querySelectorAll(".mh-top-btn"), function (b) { pop(b, document.getElementById(b.getAttribute("aria-controls"))); });
    pop(head.querySelector(".mh-all-btn:not(.mh-top-btn)"), head.querySelector(".mh-all-panel"));
    pop(head.querySelector(".mh-prefs-btn"), head.querySelector(".mh-prefs-panel"));

    // ── Phone "Maps" tab: a small menu of the three maps ─────────────
    var mapsBtn = document.querySelector(".tb-maps-btn"), mapsPanel = document.getElementById("tb-maps-panel");
    function closeMaps() { if (mapsPanel) { mapsPanel.hidden = true; mapsBtn.setAttribute("aria-expanded", "false"); } }
    if (mapsBtn && mapsPanel) {
      mapsBtn.addEventListener("click", function () {
        var open = mapsPanel.hidden;
        mapsPanel.hidden = !open; mapsBtn.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("pointerdown", function (e) { if (!e.target.closest(".tb-maps")) closeMaps(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMaps(); });
    }

    // ── Mobile sheet ──────────────────────────────────────────────────
    // The sheet is opened by "More" in the phone tab bar (a sibling of the header, so the
    // outside-click test below has to let it through).
    var burger = document.querySelector(".tb-more");
    function closeSheet() {
      head.classList.remove("is-open");
      if (burger) burger.setAttribute("aria-expanded", "false");
    }
    if (burger) {
      burger.addEventListener("click", function () {
        var open = !head.classList.contains("is-open");
        head.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    document.addEventListener("pointerdown", function (e) {
      if (burger && burger.contains(e.target)) return;
      if (!head.contains(e.target)) {
        closeAll();
        closeSheet();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var open = pops.filter(function (p) { return p.isOpen(); })[0];
      if (open) open.close(true);
      if (head.classList.contains("is-open")) { closeSheet(); if (burger) burger.focus(); }
    });
    // Resizing past the phone breakpoint with a menu open would leave a stale one behind.
    window.addEventListener("resize", closeAll);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

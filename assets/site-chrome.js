// Behaviour for the static-page masthead stamped by scripts/partials.js:
//   • priority+ nav — links that don't fit fold into "More", last first
//   • mobile sheet (burger)
//   • light/dark toggle (shares atlas.tweaks.background with the globe apps)
//   • language select (hands off to data/static-i18n.js when the page has it)
// Pure progressive enhancement: without JS every link is still a real link.
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

    var head = document.querySelector("body > .masthead");
    if (!head) return;

    // ── Language ──────────────────────────────────────────────────────
    var selects = head.querySelectorAll("[data-lang-select]");
    var lang = "en";
    try { lang = localStorage.getItem("atlas.lang") || "en"; } catch (e) {}
    selects.forEach(function (sel) {
      sel.value = lang;
      sel.addEventListener("change", function () {
        var code = sel.value;
        selects.forEach(function (s) { s.value = code; });
        try { localStorage.setItem("atlas.lang", code); } catch (e) {}
        if (window.ATLAS_STATIC_I18N) window.ATLAS_STATIC_I18N.apply(code);
        window.dispatchEvent(new CustomEvent("atlas:lang", { detail: { code: code } }));
      });
    });

    // ── Current page ─────────────────────────────────────────────────
    var path = location.pathname.replace(/index\.html$/, "");
    head.querySelectorAll("a.mh-link, a.mh-sheet-link").forEach(function (a) {
      var href = a.getAttribute("href");
      var on = href === "/" ? (path === "/") : (path === href || path.indexOf(href) === 0);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });

    // ── Priority+ overflow ───────────────────────────────────────────
    var nav = head.querySelector(".mh-nav");
    var list = head.querySelector(".mh-links");
    var more = head.querySelector(".mh-more");
    var moreBtn = more && more.querySelector(".mh-more-btn");
    var menu = more && more.querySelector(".mh-menu");
    var items = list ? Array.prototype.slice.call(list.children) : [];

    function closeMenu() { if (menu) { menu.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); } }

    function fit() {
      if (!nav || !list || !more) return;
      if (getComputedStyle(nav).display === "none") return; // mobile: burger sheet instead
      items.forEach(function (li) { li.hidden = false; });
      more.hidden = false;
      var moreW = more.getBoundingClientRect().width;
      more.hidden = true;
      var avail = nav.clientWidth;
      var widths = items.map(function (li) { return li.getBoundingClientRect().width; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0);
      var n = items.length;
      if (total > avail) {
        var used = moreW; n = 0;
        while (n < widths.length && used + widths[n] <= avail) { used += widths[n]; n++; }
      }
      menu.innerHTML = "";
      items.forEach(function (li, i) {
        li.hidden = i >= n;
        if (i >= n) {
          var a = li.querySelector("a").cloneNode(true);
          a.className = "";
          var item = document.createElement("li");
          item.appendChild(a);
          menu.appendChild(item);
        }
      });
      more.hidden = n >= items.length;
      if (more.hidden) closeMenu();
    }

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        var open = menu.hidden;
        menu.hidden = !open;
        moreBtn.setAttribute("aria-expanded", String(open));
      });
    }

    // ── Mobile sheet ──────────────────────────────────────────────────
    var burger = head.querySelector(".mh-burger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = !head.classList.contains("is-open");
        head.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    document.addEventListener("pointerdown", function (e) {
      if (!head.contains(e.target)) {
        closeMenu();
        head.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMenu(); head.classList.remove("is-open"); }
    });

    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("atlas:lang", function () { setTimeout(fit, 0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    // static-i18n translates labels in place; re-measure when text changes.
    if (window.MutationObserver && list) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; fit(); });
      }).observe(list, { subtree: true, characterData: true, childList: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

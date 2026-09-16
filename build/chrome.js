// Generated from components/chrome.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

var _excluded = ["open"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useStateC = _React.useState,
  useEffectC = _React.useEffect,
  useRefC = _React.useRef,
  useLayoutEffectC = _React.useLayoutEffect,
  useCallbackC = _React.useCallback;
function tr(key, fallback, vars) {
  if (!window.t) return fallback;
  var v = window.t(key, vars);
  return v === key ? fallback : v;
}
function useLangTick() {
  var _useStateC = useStateC(0),
    _useStateC2 = _slicedToArray(_useStateC, 2),
    force = _useStateC2[1];
  useEffectC(function () {
    var f = function f() {
      return force(function (x) {
        return x + 1;
      });
    };
    window.addEventListener("atlas:lang", f);
    return function () {
      return window.removeEventListener("atlas:lang", f);
    };
  }, []);
}
function readTheme() {
  try {
    var tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
    return tw.background === "dark" ? "dark" : "light";
  } catch (e) {
    return "light";
  }
}
function applyThemeClass(theme) {
  var dark = theme === "dark";
  [document.documentElement, document.body].forEach(function (el) {
    if (!el) return;
    el.classList.toggle("theme-dark", dark);
    el.classList.toggle("theme-light", !dark);
  });
}
function useSiteTheme() {
  var _useStateC3 = useStateC(readTheme),
    _useStateC4 = _slicedToArray(_useStateC3, 2),
    theme = _useStateC4[0],
    setThemeState = _useStateC4[1];
  useEffectC(function () {
    applyThemeClass(theme);
  }, [theme]);
  useEffectC(function () {
    var onStorage = function onStorage(e) {
      if (e.key === "atlas.tweaks") setThemeState(readTheme());
    };
    window.addEventListener("storage", onStorage);
    return function () {
      return window.removeEventListener("storage", onStorage);
    };
  }, []);
  var setTheme = useCallbackC(function (next) {
    try {
      var tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      tw.background = next;
      localStorage.setItem("atlas.tweaks", JSON.stringify(tw));
    } catch (e) {}
    setThemeState(next);
  }, []);
  return [theme, setTheme];
}
function BrandMark(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true"
  }, props), React.createElement("rect", {
    x: "2.75",
    y: "1.75",
    width: "18.5",
    height: "20.5",
    rx: "2",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }), React.createElement("circle", {
    cx: "12",
    cy: "11",
    r: "5.25",
    stroke: "currentColor",
    strokeWidth: "1.3"
  }), React.createElement("ellipse", {
    cx: "12",
    cy: "11",
    rx: "2.2",
    ry: "5.25",
    stroke: "currentColor",
    strokeWidth: "1.1"
  }), React.createElement("path", {
    d: "M6.9 11h10.2",
    stroke: "currentColor",
    strokeWidth: "1.1"
  }), React.createElement("path", {
    d: "M8 19h8",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }));
}
function IconCaret(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 12 12",
    "aria-hidden": "true"
  }, props), React.createElement("path", {
    d: "M3 4.5 6 7.5 9 4.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}
function IconClose(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 14 14",
    "aria-hidden": "true"
  }, props), React.createElement("path", {
    d: "M3 3l8 8M11 3l-8 8",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }));
}
function IconSearch(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 16 16",
    "aria-hidden": "true"
  }, props), React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "4.8",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }), React.createElement("path", {
    d: "M10.6 10.6 14 14",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }));
}
function IconSun(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 16 16",
    "aria-hidden": "true"
  }, props), React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "3",
    fill: "currentColor"
  }), React.createElement("g", {
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }, React.createElement("path", {
    d: "M8 1.2v1.7M8 13.1v1.7M1.2 8h1.7M13.1 8h1.7M3.2 3.2l1.2 1.2M11.6 11.6l1.2 1.2M12.8 3.2l-1.2 1.2M4.4 11.6l-1.2 1.2"
  })));
}
function IconMoon(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 16 16",
    "aria-hidden": "true"
  }, props), React.createElement("path", {
    d: "M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z",
    fill: "currentColor"
  }));
}
function IconUser(props) {
  return React.createElement("svg", _extends({
    viewBox: "0 0 16 16",
    width: "16",
    height: "16",
    "aria-hidden": "true"
  }, props), React.createElement("circle", {
    cx: "8",
    cy: "5.6",
    r: "2.9",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4"
  }), React.createElement("path", {
    d: "M2.6 14.2c.7-2.8 2.8-4.3 5.4-4.3s4.7 1.5 5.4 4.3",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round"
  }));
}
function AccountLink() {
  var acct = window.ATLAS_ACCOUNT;
  var _useStateC5 = useStateC(0),
    _useStateC6 = _slicedToArray(_useStateC5, 2),
    force = _useStateC6[1];
  useEffectC(function () {
    return acct && acct.enabled ? acct.onChange(function () {
      return force(function (x) {
        return x + 1;
      });
    }) : undefined;
  }, []);
  if (!acct || !acct.enabled) return null;
  var user = acct.state.user;
  var label = tr("nav.account", "Account");
  return React.createElement("a", {
    className: "mh-account" + (user ? " is-signed-in" : ""),
    href: "/account/",
    "aria-label": label,
    title: user && user.email ? user.email : label
  }, user && user.email ? React.createElement("span", null, user.email.charAt(0).toUpperCase()) : React.createElement(IconUser, null));
}
function IconMenu(_ref) {
  var open = _ref.open,
    props = _objectWithoutProperties(_ref, _excluded);
  return React.createElement("svg", _extends({
    viewBox: "0 0 18 18",
    width: "18",
    height: "18",
    "aria-hidden": "true"
  }, props), open ? React.createElement("path", {
    d: "M4.5 4.5l9 9M13.5 4.5l-9 9",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }) : React.createElement("path", {
    d: "M3 5.5h12M3 9h12M3 12.5h12",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }));
}
function ViewToggle(_ref2) {
  var value = _ref2.value,
    onChange = _ref2.onChange;
  var opts = [["globe3d", tr("mode.3d", "3D")], ["flat", tr("mode.2d", "2D")]];
  return React.createElement("div", {
    className: "seg",
    role: "group",
    "aria-label": tr("nav.mode", "Globe view")
  }, opts.map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
      v = _ref4[0],
      l = _ref4[1];
    return React.createElement("button", {
      key: v,
      type: "button",
      "aria-pressed": value === v,
      onClick: function onClick() {
        return onChange(v);
      }
    }, l);
  }));
}
function ThemeToggle(_ref5) {
  var value = _ref5.value,
    onChange = _ref5.onChange;
  var opts = [["light", React.createElement(IconSun, null), tr("settings.theme_light", "Light")], ["dark", React.createElement(IconMoon, null), tr("settings.theme_dark", "Dark")]];
  return React.createElement("div", {
    className: "seg",
    role: "group",
    "aria-label": tr("settings.theme", "Theme")
  }, opts.map(function (_ref6) {
    var _ref7 = _slicedToArray(_ref6, 3),
      v = _ref7[0],
      icon = _ref7[1],
      label = _ref7[2];
    return React.createElement("button", {
      key: v,
      type: "button",
      "aria-pressed": value === v,
      "aria-label": label,
      title: label,
      onClick: function onClick() {
        return onChange(v);
      }
    }, icon);
  }));
}
function LangSelect(_ref8) {
  var className = _ref8.className;
  useLangTick();
  var cur = window.ATLAS_LANG || "en";
  return React.createElement("select", {
    className: "lang-select" + (className ? " " + className : ""),
    value: cur,
    "aria-label": tr("nav.language", "Language"),
    onChange: function onChange(e) {
      return window.setLang && window.setLang(e.target.value);
    }
  }, (window.LANGS || []).map(function (l) {
    return React.createElement("option", {
      key: l.code,
      value: l.code
    }, l.code.toUpperCase(), " \xB7 ", l["native"]);
  }));
}
function Masthead(_ref9) {
  var view = _ref9.view,
    onView = _ref9.onView,
    theme = _ref9.theme,
    onTheme = _ref9.onTheme,
    onHelp = _ref9.onHelp;
  useLangTick();
  var nav = window.SITE_NAV || {
    NAV: [],
    SUPPORT: null,
    isCurrent: function isCurrent() {
      return false;
    }
  };
  var items = nav.NAV;
  var path = location.pathname;
  var _useStateC7 = useStateC(items.length),
    _useStateC8 = _slicedToArray(_useStateC7, 2),
    fit = _useStateC8[0],
    setFit = _useStateC8[1];
  var _useStateC9 = useStateC(false),
    _useStateC0 = _slicedToArray(_useStateC9, 2),
    moreOpen = _useStateC0[0],
    setMoreOpen = _useStateC0[1];
  var _useStateC1 = useStateC(false),
    _useStateC10 = _slicedToArray(_useStateC1, 2),
    sheetOpen = _useStateC10[0],
    setSheetOpen = _useStateC10[1];
  var navRef = useRefC(null);
  var measureRef = useRefC(null);
  var headerRef = useRefC(null);
  var label = function label(it) {
    return tr(it.key, it.en);
  };
  useLayoutEffectC(function () {
    var navEl = navRef.current,
      m = measureRef.current;
    if (!navEl || !m) return;
    var compute = function compute() {
      var widths = Array.from(m.children).map(function (li) {
        return li.getBoundingClientRect().width;
      });
      var moreW = widths.pop();
      var avail = navEl.clientWidth;
      if (!avail) return;
      var total = widths.reduce(function (a, b) {
        return a + b;
      }, 0);
      if (total <= avail) {
        setFit(widths.length);
        return;
      }
      var used = moreW,
        n = 0;
      while (n < widths.length && used + widths[n] <= avail) {
        used += widths[n];
        n++;
      }
      setFit(n);
    };
    compute();
    var ro = new ResizeObserver(compute);
    ro.observe(navEl);
    ro.observe(m);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(compute);
    return function () {
      return ro.disconnect();
    };
  }, []);
  useEffectC(function () {
    if (!moreOpen && !sheetOpen) return;
    var onDown = function onDown(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMoreOpen(false);
        setSheetOpen(false);
      }
    };
    var onKey = function onKey(e) {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setSheetOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen, sheetOpen]);
  var overflow = items.slice(fit);
  var moreLabel = tr("nav.more", "More");
  return React.createElement("header", {
    ref: headerRef,
    className: "masthead" + (sheetOpen ? " is-open" : "")
  }, React.createElement("a", {
    className: "brand",
    href: "/",
    "aria-label": "travelnow.info"
  }, React.createElement(BrandMark, {
    className: "brand-mark"
  }), React.createElement("span", {
    className: "brand-word"
  }, "travelnow", React.createElement("span", {
    className: "brand-tld"
  }, ".info"))), React.createElement("nav", {
    ref: navRef,
    className: "mh-nav",
    "aria-label": tr("nav.main", "Main")
  }, React.createElement("ul", {
    className: "mh-links"
  }, items.map(function (it, i) {
    return React.createElement("li", {
      key: it.href,
      hidden: i >= fit
    }, React.createElement("a", {
      className: "mh-link",
      href: it.href,
      "aria-current": nav.isCurrent(it, path) ? "page" : undefined
    }, label(it)));
  })), React.createElement("div", {
    className: "mh-more",
    hidden: overflow.length === 0
  }, React.createElement("button", {
    type: "button",
    className: "mh-link mh-more-btn",
    "aria-expanded": moreOpen,
    onClick: function onClick() {
      return setMoreOpen(function (o) {
        return !o;
      });
    }
  }, moreLabel, React.createElement(IconCaret, null)), moreOpen && React.createElement("ul", {
    className: "mh-menu"
  }, overflow.map(function (it) {
    return React.createElement("li", {
      key: it.href
    }, React.createElement("a", {
      href: it.href,
      "aria-current": nav.isCurrent(it, path) ? "page" : undefined
    }, label(it)));
  }))), React.createElement("ul", {
    ref: measureRef,
    className: "mh-links",
    "aria-hidden": "true",
    style: {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      height: "auto",
      left: 0,
      top: 0
    }
  }, items.map(function (it) {
    return React.createElement("li", {
      key: it.href
    }, React.createElement("span", {
      className: "mh-link"
    }, label(it)));
  }), React.createElement("li", null, React.createElement("span", {
    className: "mh-link mh-more-btn"
  }, moreLabel, React.createElement(IconCaret, null))))), React.createElement("div", {
    className: "mh-tools"
  }, React.createElement(AccountLink, null), onView && React.createElement(ViewToggle, {
    value: view,
    onChange: onView
  }), onTheme && React.createElement(ThemeToggle, {
    value: theme,
    onChange: onTheme
  }), React.createElement(LangSelect, null), onHelp && React.createElement("button", {
    type: "button",
    className: "mh-help",
    onClick: onHelp,
    "aria-label": tr("nav.help", "What is this?"),
    title: tr("nav.help", "What is this?")
  }, "?"), nav.SUPPORT && React.createElement("a", {
    className: "mh-support",
    href: nav.SUPPORT.href,
    target: "_blank",
    rel: "noopener"
  }, tr(nav.SUPPORT.key, nav.SUPPORT.en))), React.createElement("button", {
    type: "button",
    className: "mh-burger",
    "aria-label": tr("nav.menu", "Menu"),
    "aria-expanded": sheetOpen,
    onClick: function onClick() {
      return setSheetOpen(function (o) {
        return !o;
      });
    }
  }, React.createElement(IconMenu, {
    open: sheetOpen
  })), React.createElement("div", {
    className: "mh-sheet"
  }, items.map(function (it) {
    return React.createElement("a", {
      key: it.href,
      className: "mh-sheet-link",
      href: it.href,
      "aria-current": nav.isCurrent(it, path) ? "page" : undefined
    }, label(it));
  }), React.createElement("div", {
    className: "mh-sheet-foot"
  }, React.createElement(LangSelect, null), nav.SUPPORT && React.createElement("a", {
    className: "mh-support",
    style: {
      display: "inline-block"
    },
    href: nav.SUPPORT.href,
    target: "_blank",
    rel: "noopener"
  }, tr(nav.SUPPORT.key, nav.SUPPORT.en)))));
}
function MobileSheetHandle() {
  var ref = useRefC(null);
  useEffectC(function () {
    var handle = ref.current;
    var panel = handle && handle.closest(".panel");
    if (!panel) return;
    var isMobile = function isMobile() {
      return window.matchMedia("(max-width: 900px)").matches;
    };
    var snaps = function snaps() {
      return [96, Math.round(window.innerHeight * 0.48), Math.round(window.innerHeight * 0.88)];
    };
    var startY = 0,
      startH = 0,
      dragging = false,
      moved = false,
      lastH = 0;
    var setH = function setH(h) {
      lastH = h;
      panel.style.setProperty("--sheet-h", h + "px");
      document.documentElement.style.setProperty("--sheet-h", h + "px");
    };
    var curH = function curH() {
      return panel.getBoundingClientRect().height;
    };
    var nearest = function nearest(h) {
      return snaps().reduce(function (a, b) {
        return Math.abs(b - h) < Math.abs(a - h) ? b : a;
      });
    };
    var down = function down(e) {
      if (!isMobile()) return;
      dragging = true;
      moved = false;
      startY = e.clientY;
      startH = curH();
      lastH = startH;
      panel.classList.add("sheet-dragging");
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
    };
    var move = function move(e) {
      if (!dragging) return;
      var dy = startY - e.clientY;
      if (Math.abs(dy) > 3) moved = true;
      setH(Math.min(window.innerHeight * 0.92, Math.max(72, startH + dy)));
    };
    var settle = function settle() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("sheet-dragging");
      if (!moved) {
        var order = snaps();
        var i = order.indexOf(nearest(curH()));
        setH(order[(i + 1) % order.length]);
      } else {
        setH(nearest(lastH));
      }
    };
    handle.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", settle);
    window.addEventListener("pointercancel", settle);
    return function () {
      handle.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", settle);
      window.removeEventListener("pointercancel", settle);
    };
  }, []);
  return React.createElement("div", {
    ref: ref,
    className: "sheet-handle",
    "aria-hidden": "true"
  }, React.createElement("span", {
    className: "sheet-grabber"
  }));
}
function Caption(_ref0) {
  var n = _ref0.n,
    children = _ref0.children,
    aside = _ref0.aside;
  return React.createElement("span", {
    className: "p-cap"
  }, n != null && React.createElement("span", {
    className: "p-cap-n"
  }, String(n).padStart(2, "0")), React.createElement("span", null, children), aside && React.createElement("span", {
    className: "p-cap-aside"
  }, aside));
}
function Swatch(_ref1) {
  var s = _ref1.s;
  if (s === "ban") return React.createElement("span", {
    className: "sw sw-ban",
    "aria-hidden": "true"
  });
  return React.createElement("span", {
    className: "sw",
    "aria-hidden": "true",
    style: {
      "--sw": "var(--".concat(s, ")")
    }
  });
}
function Dot(_ref10) {
  var s = _ref10.s;
  return React.createElement("span", {
    className: "dot",
    "aria-hidden": "true",
    style: {
      "--sw": "var(--".concat(s, ")")
    }
  });
}
Object.assign(window, {
  tr: tr,
  useLangTick: useLangTick,
  readTheme: readTheme,
  applyThemeClass: applyThemeClass,
  useSiteTheme: useSiteTheme,
  BrandMark: BrandMark,
  IconCaret: IconCaret,
  IconClose: IconClose,
  IconSearch: IconSearch,
  IconSun: IconSun,
  IconMoon: IconMoon,
  ViewToggle: ViewToggle,
  ThemeToggle: ThemeToggle,
  LangSelect: LangSelect,
  Masthead: Masthead,
  MobileSheetHandle: MobileSheetHandle,
  Caption: Caption,
  Swatch: Swatch,
  Dot: Dot
});

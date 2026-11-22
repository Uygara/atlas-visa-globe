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
  var fill = function fill(s) {
    return vars ? Object.keys(vars).reduce(function (acc, k) {
      return acc.split("{" + k + "}").join(String(vars[k]));
    }, s) : s;
  };
  if (!window.t) return fill(fallback);
  var v = window.t(key, vars);
  return v === key ? fill(fallback) : v;
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
  }), React.createElement("path", {
    d: "M6.4 14.6V6.8h2.9a2.4 2.4 0 0 1 0 4.8H6.4",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: "M16.9 7.3 13.9 10.7l3 3.4",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: "M6.4 18.3h11.2",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeDasharray: "0.1 2.3"
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
    title: user && user.email ? user.email : undefined
  }, React.createElement("span", {
    className: "mh-signin"
  }, tr("nav.signin", "Sign in")), React.createElement("span", {
    className: "mh-acct-dot",
    "aria-hidden": "true"
  }, React.createElement("span", null, user && user.email ? user.email.charAt(0).toUpperCase() : "")), React.createElement("span", {
    className: "mh-acct-name"
  }, label));
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
    onChange = _ref2.onChange,
    className = _ref2.className;
  var opts = [["globe3d", tr("mode.3d", "3D")], ["flat", tr("mode.2d", "2D")]];
  return React.createElement("div", {
    className: "seg" + (className ? " " + className : ""),
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
    }, l["native"], l.beta ? " (beta)" : "");
  }));
}
function Masthead(_ref9) {
  var theme = _ref9.theme,
    onTheme = _ref9.onTheme;
  useLangTick();
  var nav = window.SITE_NAV || {
    PRIMARY: [],
    GROUPS: [],
    SUPPORT: null,
    isCurrent: function isCurrent() {
      return false;
    }
  };
  var path = location.pathname;
  var lang = window.ATLAS_LANG || "en";
  var to = function to(h) {
    return nav.localHref ? nav.localHref(h, lang) : h;
  };
  var _useStateC7 = useStateC(null),
    _useStateC8 = _slicedToArray(_useStateC7, 2),
    open = _useStateC8[0],
    setOpen = _useStateC8[1];
  var _useStateC9 = useStateC(false),
    _useStateC0 = _slicedToArray(_useStateC9, 2),
    sheetOpen = _useStateC0[0],
    setSheetOpen = _useStateC0[1];
  var headerRef = useRefC(null),
    moreRef = useRefC(null);
  var toolsBtn = useRefC(null),
    prefsBtn = useRefC(null);
  var toolsPanel = useRefC(null),
    prefsPanel = useRefC(null);
  var label = function label(it) {
    return tr(it.key, it.en);
  };
  var cur = function cur(it) {
    return nav.isCurrent(it, path) ? "page" : undefined;
  };
  var TOP = nav.GROUPS.filter(function (g) {
      return g.top;
    }),
    REST = nav.GROUPS.filter(function (g) {
      return !g.top;
    });
  var toolOn = REST.some(function (g) {
    return g.items.some(function (it) {
      return nav.isCurrent(it, path);
    });
  });
  var langs = window.LANGS || [];
  var themeNow = theme === "dark" ? "dark" : "light";
  var themeName = function themeName(v) {
    return tr(v === "dark" ? "settings.theme_dark" : "settings.theme_light", v === "dark" ? "Dark" : "Light");
  };
  useEffectC(function () {
    var panel = open === "tools" ? toolsPanel.current : open === "prefs" ? prefsPanel.current : open && open.indexOf("top") === 0 ? document.getElementById("mh-" + open + "-panel") : null;
    var first = panel && panel.querySelector("a[href], button");
    if (first) first.focus();
  }, [open]);
  useEffectC(function () {
    if (!open && !sheetOpen) return;
    var onDown = function onDown(e) {
      if (headerRef.current && !headerRef.current.contains(e.target) && !(moreRef.current && moreRef.current.contains(e.target))) {
        setOpen(null);
        setSheetOpen(false);
      }
    };
    var onKey = function onKey(e) {
      if (e.key !== "Escape") return;
      var btn = open === "tools" ? toolsBtn.current : open === "prefs" ? prefsBtn.current : open && open.indexOf("top") === 0 ? document.querySelector('[aria-controls="mh-' + open + '-panel"]') : sheetOpen ? moreRef.current : null;
      setOpen(null);
      setSheetOpen(false);
      if (btn) btn.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, sheetOpen]);
  var leave = function leave(btn) {
    return function (e) {
      var next = e.relatedTarget;
      if (next && !e.currentTarget.contains(next) && next !== btn.current) setOpen(null);
    };
  };
  var themeOpts = onTheme && React.createElement("div", {
    className: "mh-opts-row",
    role: "group",
    "aria-label": tr("settings.theme", "Theme")
  }, ["light", "dark"].map(function (v) {
    return React.createElement("button", {
      key: v,
      type: "button",
      className: "mh-opt",
      "aria-pressed": themeNow === v,
      onClick: function onClick() {
        return onTheme(v);
      }
    }, themeName(v));
  }));
  var TAB_LABEL = {
    "/": tr("nav.tab_map", "Map"),
    "/visa/": tr("nav.countries", "Countries"),
    "/itinerary/": tr("nav.tab_planner", "Planner"),
    "/panel/": tr("nav.panel", "My panel")
  };
  return React.createElement(React.Fragment, null, React.createElement("header", {
    ref: headerRef,
    className: "masthead" + (sheetOpen ? " is-open" : "")
  }, React.createElement("a", {
    className: "skip-link",
    href: "#panel"
  }, tr("a11y.skip", "Skip to content")), React.createElement("a", {
    className: "brand",
    href: to("/"),
    "aria-label": "travelnow.info"
  }, React.createElement(BrandMark, {
    className: "brand-mark"
  }), React.createElement("span", {
    className: "brand-word"
  }, "travelnow", React.createElement("span", {
    className: "brand-tld"
  }, ".info"))), React.createElement("nav", {
    className: "mh-nav",
    "aria-label": tr("nav.main", "Main")
  }, React.createElement("ul", {
    className: "mh-links"
  }, nav.PRIMARY.map(function (it) {
    return React.createElement("li", {
      key: it.href
    }, React.createElement("a", {
      className: "mh-link",
      href: to(it.href),
      "aria-current": cur(it)
    }, label(it)));
  })), TOP.map(function (g, i) {
    return React.createElement("div", {
      key: g.key,
      className: "mh-all mh-top"
    }, React.createElement("button", {
      type: "button",
      className: "mh-link mh-all-btn mh-top-btn" + (g.items.some(function (it) {
        return nav.isCurrent(it, path);
      }) ? " has-current" : ""),
      "aria-expanded": open === "top" + i,
      "aria-controls": "mh-top" + i + "-panel",
      onClick: function onClick() {
        return setOpen(function (o) {
          return o === "top" + i ? null : "top" + i;
        });
      }
    }, tr(g.key, g.en), React.createElement(IconCaret, null)), React.createElement("div", {
      className: "mh-panel mh-top-panel",
      id: "mh-top" + i + "-panel",
      hidden: open !== "top" + i
    }, React.createElement("ul", null, g.items.map(function (it) {
      return React.createElement("li", {
        key: it.href
      }, React.createElement("a", {
        className: "mh-tool",
        href: to(it.href),
        "aria-current": cur(it)
      }, React.createElement("span", {
        className: "mh-tool-t"
      }, label(it)), it.dkey && React.createElement("span", {
        className: "mh-tool-d"
      }, tr(it.dkey, it.den))));
    }))));
  }), React.createElement("div", {
    className: "mh-all"
  }, React.createElement("button", {
    ref: toolsBtn,
    type: "button",
    className: "mh-link mh-all-btn" + (toolOn ? " has-current" : ""),
    "aria-expanded": open === "tools",
    "aria-controls": "mh-all-panel",
    onClick: function onClick() {
      return setOpen(function (o) {
        return o === "tools" ? null : "tools";
      });
    }
  }, tr("nav.all_tools", "All tools"), React.createElement(IconCaret, null)), React.createElement("div", {
    ref: toolsPanel,
    className: "mh-panel mh-all-panel",
    id: "mh-all-panel",
    hidden: open !== "tools",
    onBlur: leave(toolsBtn)
  }, REST.map(function (g) {
    return React.createElement("div", {
      key: g.key,
      className: "mh-grp"
    }, React.createElement("p", {
      className: "mh-grp-label"
    }, tr(g.key, g.en)), React.createElement("ul", null, g.items.map(function (it) {
      return React.createElement("li", {
        key: it.href
      }, React.createElement("a", {
        className: "mh-tool",
        href: to(it.href),
        "aria-current": cur(it)
      }, React.createElement("span", {
        className: "mh-tool-t"
      }, label(it)), it.dkey && React.createElement("span", {
        className: "mh-tool-d"
      }, tr(it.dkey, it.den))));
    })));
  })))), React.createElement("div", {
    className: "mh-tools"
  }, React.createElement("div", {
    className: "mh-prefs"
  }, React.createElement("button", {
    ref: prefsBtn,
    type: "button",
    className: "mh-prefs-btn",
    "aria-expanded": open === "prefs",
    "aria-controls": "mh-prefs-panel",
    "aria-label": tr("nav.lang_theme", "Language and theme"),
    onClick: function onClick() {
      return setOpen(function (o) {
        return o === "prefs" ? null : "prefs";
      });
    }
  }, React.createElement("span", null, lang.toUpperCase()), React.createElement("span", {
    "aria-hidden": "true"
  }, " \xB7 "), React.createElement("span", null, themeName(themeNow)), React.createElement(IconCaret, null)), React.createElement("div", {
    ref: prefsPanel,
    className: "mh-panel mh-prefs-panel",
    id: "mh-prefs-panel",
    hidden: open !== "prefs",
    onBlur: leave(prefsBtn)
  }, React.createElement("p", {
    className: "mh-grp-label"
  }, tr("nav.language", "Language")), React.createElement("ul", {
    className: "mh-opts"
  }, langs.map(function (l) {
    return React.createElement("li", {
      key: l.code
    }, React.createElement("button", {
      type: "button",
      className: "mh-opt",
      "aria-pressed": lang === l.code,
      onClick: function onClick() {
        setOpen(null);
        window.setLang && window.setLang(l.code);
      }
    }, l["native"], l.beta ? " (beta)" : ""));
  })), themeOpts && React.createElement("p", {
    className: "mh-grp-label"
  }, tr("settings.theme", "Theme")), themeOpts)), React.createElement(AccountLink, null)), React.createElement("div", {
    className: "mh-sheet"
  }, nav.PRIMARY.map(function (it) {
    return React.createElement("a", {
      key: it.href,
      className: "mh-sheet-link",
      href: to(it.href),
      "aria-current": cur(it)
    }, label(it));
  }), React.createElement("p", {
    className: "mh-sheet-h"
  }, tr("nav.all_tools", "All tools")), React.createElement("ul", {
    className: "mh-sheet-tools"
  }, nav.GROUPS.map(function (g) {
    return g.items.map(function (it) {
      return React.createElement("li", {
        key: it.href
      }, React.createElement("a", {
        className: "mh-sheet-tool",
        href: to(it.href),
        "aria-current": cur(it)
      }, label(it)));
    });
  })), React.createElement("div", {
    className: "mh-sheet-foot"
  }, React.createElement(LangSelect, null), themeOpts, nav.INSTAGRAM && React.createElement("a", {
    className: "mh-sheet-ext",
    href: nav.INSTAGRAM.href,
    target: "_blank",
    rel: "noopener",
    "aria-label": tr(nav.INSTAGRAM.key, nav.INSTAGRAM.en)
  }, "Instagram"), nav.SUPPORT && React.createElement("a", {
    className: "mh-sheet-ext",
    href: nav.SUPPORT.href,
    target: "_blank",
    rel: "noopener"
  }, tr(nav.SUPPORT.key, nav.SUPPORT.en))))), React.createElement("nav", {
    className: "tabbar",
    "aria-label": tr("nav.tabs", "Quick links")
  }, nav.PRIMARY.map(function (it) {
    return React.createElement("a", {
      key: it.href,
      className: "tb-item",
      href: to(it.href),
      "aria-current": cur(it)
    }, TAB_LABEL[it.href] || label(it));
  }), React.createElement("button", {
    ref: moreRef,
    type: "button",
    className: "tb-item tb-more",
    "aria-expanded": sheetOpen,
    onClick: function onClick() {
      return setSheetOpen(function (o) {
        return !o;
      });
    }
  }, tr("nav.tab_more", "More"))));
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
    var reduced = function reduced() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };
    var tabH = function tabH() {
      var t = document.querySelector(".tabbar");
      return t ? t.getBoundingClientRect().height : 0;
    };
    var room = function room() {
      return window.innerHeight - tabH();
    };
    var snaps = function snaps() {
      return [96, Math.round(room() * 0.48), Math.round(room() * 0.88)];
    };
    var MIN = 72,
      max = function max() {
        return room() * 0.92;
      };
    var startY = 0,
      startH = 0,
      dragging = false,
      moved = false,
      lastH = 0,
      hist = [],
      raf = 0;
    var publish = function publish(h) {
      panel.style.setProperty("--sheet-h", h + "px");
      document.documentElement.style.setProperty("--sheet-h", h + "px");
    };
    var paint = function paint(h) {
      lastH = h;
      panel.style.height = h + "px";
    };
    var curH = function curH() {
      return panel.getBoundingClientRect().height;
    };
    var nearest = function nearest(h) {
      return snaps().reduce(function (a, b) {
        return Math.abs(b - h) < Math.abs(a - h) ? b : a;
      });
    };
    var rubber = function rubber(over, dim) {
      return over * dim * 0.55 / (dim + 0.55 * Math.abs(over));
    };
    var clampSoft = function clampSoft(h) {
      var hi = max();
      if (h > hi) return hi + rubber(h - hi, room() - hi);
      if (h < MIN) return MIN - rubber(MIN - h, MIN / 2);
      return h;
    };
    var stop = function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    var springTo = function springTo(target) {
      var v0 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var damping = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var response = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.32;
      stop();
      var x = curH(),
        v = v0,
        t0 = performance.now();
      paint(x);
      publish(target);
      if (reduced()) {
        paint(target);
        panel.style.height = "";
        return;
      }
      var k = Math.pow(2 * Math.PI / response, 2),
        c = 4 * Math.PI * damping / response;
      var _step = function step(now) {
        var dt = Math.min(0.032, (now - t0) / 1000);
        t0 = now;
        for (var i = 0; i < 2; i++) {
          var a = -k * (x - target) - c * v;
          v += a * dt / 2;
          x += v * dt / 2;
        }
        if (Math.abs(x - target) < 0.5 && Math.abs(v) < 8) {
          paint(target);
          panel.style.height = "";
          raf = 0;
          return;
        }
        paint(x);
        raf = requestAnimationFrame(_step);
      };
      raf = requestAnimationFrame(_step);
    };
    var down = function down(e) {
      if (!isMobile()) return;
      stop();
      dragging = true;
      moved = false;
      startY = e.clientY;
      startH = curH();
      paint(startH);
      hist = [{
        t: e.timeStamp,
        h: startH
      }];
      panel.classList.add("sheet-dragging");
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
    };
    var move = function move(e) {
      if (!dragging) return;
      var dy = startY - e.clientY;
      if (Math.abs(dy) > 6) moved = true;
      if (!moved) return;
      var h = clampSoft(startH + dy);
      paint(h);
      publish(Math.min(max(), Math.max(MIN, h)));
      hist.push({
        t: e.timeStamp,
        h: h
      });
      if (hist.length > 6) hist.shift();
    };
    var velocity = function velocity() {
      var last = hist[hist.length - 1],
        first = hist.find(function (p) {
          return last.t - p.t <= 100;
        }) || hist[0];
      var dt = (last.t - first.t) / 1000;
      return dt > 0 ? (last.h - first.h) / dt : 0;
    };
    var settle = function settle() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("sheet-dragging");
      if (!moved) {
        var order = snaps();
        var i = order.indexOf(nearest(curH()));
        springTo(order[(i + 1) % order.length]);
        return;
      }
      var v = velocity();
      var projected = lastH + v / 1000 * 0.998 / (1 - 0.998);
      var target = nearest(Math.min(max(), Math.max(MIN, projected)));
      springTo(target, v, Math.abs(v) > 600 ? 0.8 : 1);
    };
    window.atlasSheet = {
      ensure: function ensure(fraction) {
        if (!isMobile()) return;
        var want = Math.round(room() * fraction);
        if (curH() < want - 4) springTo(want);
      }
    };
    var onKey = function onKey(e) {
      if (!isMobile()) return;
      var order = snaps();
      var i = order.indexOf(nearest(curH()));
      var next = null;
      if (e.key === "ArrowUp") next = Math.min(order.length - 1, i + 1);else if (e.key === "ArrowDown") next = Math.max(0, i - 1);else if (e.key === "Home") next = 0;else if (e.key === "End") next = order.length - 1;else if (e.key === "Enter" || e.key === " ") next = (i + 1) % order.length;
      if (next == null) return;
      e.preventDefault();
      springTo(order[next]);
    };
    handle.addEventListener("keydown", onKey);
    handle.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", settle);
    window.addEventListener("pointercancel", settle);
    return function () {
      stop();
      delete window.atlasSheet;
      handle.removeEventListener("keydown", onKey);
      handle.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", settle);
      window.removeEventListener("pointercancel", settle);
    };
  }, []);
  return React.createElement("div", {
    ref: ref,
    className: "sheet-handle",
    role: "button",
    tabIndex: 0,
    "aria-label": tr("sheet.resize", "Resize panel")
  }, React.createElement("span", {
    className: "sheet-grabber",
    "aria-hidden": "true"
  }));
}
function Caption(_ref0) {
  var children = _ref0.children,
    aside = _ref0.aside;
  return React.createElement("span", {
    className: "p-cap"
  }, React.createElement("span", null, children), aside && React.createElement("span", {
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
    "data-s": s,
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

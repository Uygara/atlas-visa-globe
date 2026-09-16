// Generated from components/safety-map.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback;
var ADVISORIES = window.TRAVEL_ADVISORIES || {
  countries: {},
  sources: {}
};
var LEVEL_COLOR = {
  0: "var(--land)",
  1: "var(--vf)",
  2: "var(--ev)",
  3: "var(--voa)",
  4: "var(--vr)"
};
function advisoryFor(iso2) {
  return ADVISORIES.countries[iso2] || null;
}
var levelLabel = function levelLabel(n) {
  return tr("safety.l" + (n || 0), ["No advisory data", "Normal precautions", "Increased caution", "Reconsider travel", "Do not travel"][n || 0]);
};
function readView() {
  try {
    return sessionStorage.getItem("atlas.globeStyle") || "globe3d";
  } catch (e) {
    return "globe3d";
  }
}
function fmtDate(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString(window.ATLAS_LANG || "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function SafetyMapApp() {
  var _useState = useState(readView),
    _useState2 = _slicedToArray(_useState, 2),
    mode = _useState2[0],
    setModeState = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    selected = _useState4[0],
    setSelected = _useState4[1];
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    filter = _useState6[0],
    setFilter = _useState6[1];
  var _useSiteTheme = useSiteTheme(),
    _useSiteTheme2 = _slicedToArray(_useSiteTheme, 2),
    theme = _useSiteTheme2[0],
    setTheme = _useSiteTheme2[1];
  useLangTick();
  var setMode = function setMode(v) {
    setModeState(v);
    try {
      sessionStorage.setItem("atlas.globeStyle", v);
    } catch (e) {}
  };
  useEffect(function () {
    var el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, []);
  var fillResolver = useCallback(function (iso2) {
    var a = advisoryFor(iso2);
    var level = a ? a.level : 0;
    if (filter && level !== filter) return {
      color: "var(--land)"
    };
    return {
      color: LEVEL_COLOR[level]
    };
  }, [filter]);
  var hoverRenderer = useCallback(function (hover) {
    return React.createElement(SafetyHover, {
      hover: hover
    });
  }, []);
  var open = function open(iso2) {
    setSelected(iso2);
    if (window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(function () {
        var _document$querySelect;
        return (_document$querySelect = document.querySelector(".panel")) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    }
  };
  return React.createElement("div", {
    className: "layout"
  }, React.createElement(Masthead, {
    view: mode,
    onView: setMode,
    theme: theme,
    onTheme: setTheme
  }), React.createElement("div", {
    className: "globe-stage"
  }, React.createElement(Globe, {
    passport: null,
    mode: mode,
    fillResolver: fillResolver,
    hoverRenderer: hoverRenderer,
    onCountryClick: open,
    focusedCountry: selected
  }), React.createElement(SafetyLegend, null)), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("div", {
    className: "p-head-title"
  }, tr("safety.title", "Travel Safety Map"), " ", React.createElement("span", {
    className: "stamp is-small",
    style: {
      "--st": "var(--foil)",
      verticalAlign: "middle",
      marginLeft: 6
    }
  }, React.createElement("span", {
    className: "stamp-k",
    style: {
      fontSize: 12
    }
  }, tr("safety.draft", "Beta")))), React.createElement("p", {
    className: "p-head-sub"
  }, tr("safety.subtitle", "Official government travel advisories on one map."))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(SafetySearch, {
    onPick: open
  })), selected && React.createElement(SafetyDetail, {
    iso2: selected,
    onClose: function onClose() {
      return setSelected(null);
    }
  }), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 1
  }, tr("safety.levels", "Countries by level")), React.createElement(LevelLedger, {
    filter: filter,
    setFilter: setFilter
  }), React.createElement("p", {
    className: "p-fine",
    style: {
      marginTop: 6
    }
  }, tr("safety.stricter_note", "Coloured by the stricter of the two governments."))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, tr("safety.do_not_travel", "Do not travel ({n})", {
    n: countAt(4)
  })), React.createElement("div", {
    className: "chips"
  }, countriesAt(4).map(function (iso2) {
    var _window$byIso2$iso;
    return React.createElement("button", {
      key: iso2,
      type: "button",
      className: "chip" + (iso2 === selected ? " is-on" : ""),
      onClick: function onClick() {
        return open(iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$iso = window.byIso2[iso2]) === null || _window$byIso2$iso === void 0 ? void 0 : _window$byIso2$iso.flag), window.countryName(iso2));
  }))), React.createElement("footer", {
    className: "panel-foot"
  }, React.createElement("div", null, tr("safety.disclaimer", "")))));
}
function countriesAt(level) {
  return Object.entries(ADVISORIES.countries).filter(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      iso2 = _ref2[0],
      a = _ref2[1];
    return a.level === level && window.byIso2[iso2];
  }).map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 1),
      iso2 = _ref4[0];
    return iso2;
  }).sort(function (a, b) {
    return window.countryName(a).localeCompare(window.countryName(b), window.ATLAS_LANG || "en");
  });
}
function countAt(level) {
  return countriesAt(level).length;
}
function LevelLedger(_ref5) {
  var filter = _ref5.filter,
    setFilter = _ref5.setFilter;
  var rows = [1, 2, 3, 4].map(function (n) {
    return {
      n: n,
      count: countAt(n)
    };
  });
  var total = rows.reduce(function (s, r) {
    return s + r.count;
  }, 0);
  return React.createElement("ul", {
    className: "ledger"
  }, React.createElement("li", null, React.createElement("button", {
    type: "button",
    className: "lg-row",
    "aria-pressed": filter === 0,
    onClick: function onClick() {
      return setFilter(0);
    }
  }, React.createElement("span", {
    className: "sw sw-all",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "lg-label"
  }, tr("tally.filter_all", "All")), React.createElement("span", {
    className: "lg-dots"
  }), React.createElement("span", {
    className: "lg-n"
  }, total))), rows.map(function (r) {
    return React.createElement("li", {
      key: r.n
    }, React.createElement("button", {
      type: "button",
      className: "lg-row",
      "aria-pressed": filter === r.n,
      onClick: function onClick() {
        return setFilter(filter === r.n ? 0 : r.n);
      }
    }, React.createElement("span", {
      className: "sw",
      style: {
        "--sw": LEVEL_COLOR[r.n]
      },
      "aria-hidden": "true"
    }), React.createElement("span", {
      className: "lg-label"
    }, r.n, " \xB7 ", levelLabel(r.n)), React.createElement("span", {
      className: "lg-dots"
    }), React.createElement("span", {
      className: "lg-n"
    }, r.count)));
  }));
}
function SafetyLegend() {
  return React.createElement("div", {
    className: "map-key overlay-card"
  }, React.createElement("div", {
    className: "map-key-title"
  }, tr("safety.legend", "Advisory level")), React.createElement("ul", null, [1, 2, 3, 4].map(function (n) {
    return React.createElement("li", {
      key: n
    }, React.createElement("span", {
      className: "sw",
      style: {
        "--sw": LEVEL_COLOR[n]
      }
    }), React.createElement("span", null, levelLabel(n)));
  })));
}
function SafetyHover(_ref6) {
  var hover = _ref6.hover;
  var dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  var a = advisoryFor(hover.iso2);
  var level = a ? a.level : 0;
  return React.createElement("div", {
    className: "hovercard overlay-card",
    style: {
      left: hover.x + 18,
      top: hover.y + 18
    }
  }, React.createElement("div", {
    className: "hovercard-title"
  }, React.createElement("span", {
    className: "flag"
  }, dest.flag), React.createElement("span", null, window.countryName(hover.iso2))), React.createElement("div", {
    className: "hovercard-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      "--sw": LEVEL_COLOR[level]
    }
  }), React.createElement("span", null, level ? "".concat(level, " \xB7 ").concat(levelLabel(level)) : levelLabel(0))));
}
function SafetySearch(_ref7) {
  var onPick = _ref7.onPick;
  var _useState7 = useState(""),
    _useState8 = _slicedToArray(_useState7, 2),
    q = _useState8[0],
    setQ = _useState8[1];
  var results = useMemo(function () {
    var ql = q.toLowerCase().trim();
    if (!ql) return [];
    return window.COUNTRIES.filter(function (c) {
      return c.name.toLowerCase().includes(ql) || window.countryName(c.iso2).toLowerCase().includes(ql);
    }).slice(0, 6);
  }, [q]);
  return React.createElement("div", null, React.createElement("div", {
    className: "search"
  }, React.createElement(IconSearch, null), React.createElement("input", {
    className: "field",
    type: "search",
    value: q,
    onChange: function onChange(e) {
      return setQ(e.target.value);
    },
    placeholder: tr("safety.search", "Search a country…"),
    "aria-label": tr("safety.search", "Search a country…")
  })), results.length > 0 && React.createElement("div", {
    className: "dd"
  }, results.map(function (c) {
    var a = advisoryFor(c.iso2);
    var level = a ? a.level : 0;
    return React.createElement("button", {
      key: c.iso2,
      type: "button",
      className: "dd-item",
      onClick: function onClick() {
        onPick(c.iso2);
        setQ("");
      }
    }, React.createElement("span", {
      className: "flag"
    }, c.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(c.iso2)), React.createElement("span", {
      className: "dd-code"
    }, level ? levelLabel(level) : "—"), React.createElement("span", {
      className: "dot",
      style: {
        "--sw": LEVEL_COLOR[level]
      }
    }));
  })));
}
function SafetyDetail(_ref8) {
  var iso2 = _ref8.iso2,
    onClose = _ref8.onClose;
  var dest = window.byIso2[iso2];
  var a = advisoryFor(iso2);
  if (!dest) return null;
  var level = a ? a.level : 0;
  var regional = a && (a.us && a.us.regional || a.ca && a.ca.regional);
  var disagree = a && a.us && a.ca && a.us.level !== a.ca.level;
  return React.createElement("article", {
    className: "entry"
  }, React.createElement("div", {
    className: "entry-top"
  }, React.createElement("span", {
    className: "flag entry-flag",
    "aria-hidden": "true"
  }, dest.flag), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "entry-name"
  }, window.countryName(iso2))), React.createElement("div", {
    className: "entry-actions"
  }, React.createElement("button", {
    type: "button",
    className: "icon-btn",
    onClick: onClose,
    "aria-label": tr("detail.close", "Close")
  }, React.createElement(IconClose, null)))), React.createElement("div", {
    className: "entry-verdict"
  }, React.createElement("div", {
    className: "stamp",
    style: {
      "--st": level ? LEVEL_COLOR[level] : "var(--ink-3)"
    }
  }, React.createElement("span", {
    className: "stamp-k"
  }, levelLabel(level)), level > 0 && React.createElement("span", {
    className: "stamp-s"
  }, tr("safety.level_n", "Level {n}", {
    n: level
  }), " / 4"))), regional && React.createElement("div", {
    className: "note note-warn"
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, tr("safety.regional", ""))), disagree && React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, tr("safety.disagree", ""))), React.createElement(SourceRow, {
    label: tr("safety.us", "U.S. State Department"),
    src: a && a.us
  }, a && a.us && a.us.risks.length > 0 && React.createElement("div", {
    className: "chips",
    style: {
      marginTop: 6
    },
    "aria-label": tr("safety.why", "Named risks")
  }, a.us.risks.map(function (r) {
    return React.createElement("span", {
      key: r,
      className: "chip",
      style: {
        cursor: "default"
      }
    }, tr("safety.risk." + r, r));
  }))), React.createElement(SourceRow, {
    label: tr("safety.ca", "Government of Canada"),
    src: a && a.ca
  }, a && a.ca && a.ca.text && (window.ATLAS_LANG || "en") === "en" && React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "4px 0 0"
    }
  }, "\u201C", a.ca.text, "\u201D")));
}
function SourceRow(_ref9) {
  var label = _ref9.label,
    src = _ref9.src,
    children = _ref9.children;
  return React.createElement("div", {
    className: "box",
    style: {
      marginBottom: 8
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "space-between"
    }
  }, React.createElement("strong", {
    style: {
      fontSize: 13.5
    }
  }, label), src && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5
    }
  }, React.createElement("span", {
    className: "dot",
    style: {
      "--sw": LEVEL_COLOR[src.level]
    }
  }), tr("safety.level_n", "Level {n}", {
    n: src.level
  }))), src ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "2px 0 0"
    }
  }, levelLabel(src.level)), children, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 8
    }
  }, React.createElement("span", {
    className: "p-fine"
  }, tr("safety.updated", "updated {date}", {
    date: fmtDate(src.updated)
  })), React.createElement("a", {
    className: "link-quiet",
    href: src.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, tr("safety.read_full", "Full advisory"), " \u2197"))) : React.createElement("div", {
    className: "p-fine",
    style: {
      marginTop: 4
    }
  }, tr("safety.no_source", "No advisory from this source.")));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(SafetyMapApp, null));

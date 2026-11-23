// Generated from components/climate-map.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
var CLIMATE = window.CLIMATE || {
  countries: {}
};
var ALIAS = {
  XN: "CY"
};
var climateOf = function climateOf(iso2) {
  return CLIMATE.countries[iso2] || CLIMATE.countries[ALIAS[iso2]] || null;
};
var T_BANDS = [0, 10, 18, 24, 30, 35, Infinity];
var T_COLOR = ["var(--cl-t1)", "var(--cl-t2)", "var(--cl-t3)", "var(--cl-t4)", "var(--cl-t5)", "var(--cl-t6)", "var(--cl-t7)"];
var T_LABEL = ["below 0°", "0–10°", "10–18°", "18–24°", "24–30°", "30–35°", "above 35°"];
var P_BANDS = [25, 60, 120, 200, Infinity];
var P_COLOR = ["var(--cl-p1)", "var(--cl-p2)", "var(--cl-p3)", "var(--cl-p4)", "var(--cl-p5)"];
var P_LABEL = ["under 25 mm", "25–60 mm", "60–120 mm", "120–200 mm", "over 200 mm"];
var band = function band(v, bands) {
  return bands.findIndex(function (b) {
    return v < b;
  });
};
var GOOD_HI = [18, 30],
  GOOD_PR = 100;
var isGood = function isGood(c, m) {
  return c && c.hi[m] >= GOOD_HI[0] && c.hi[m] <= GOOD_HI[1] && c.pr[m] < GOOD_PR;
};
var VARIED = new Set(["RU", "CA", "US", "CN", "BR", "AU", "IN", "AR", "KZ", "DZ", "CD", "SA", "MX", "ID", "SD", "LY", "IR", "MN", "PE", "CL", "TR", "ZA", "NO", "JP", "IT", "FR", "ES", "PK", "AF", "NP", "BO", "CO", "EC", "ET", "KE", "TZ", "MA", "VN", "MM", "TH", "PH", "NZ", "GB", "SE", "FI", "UA", "EG", "NG", "AO", "ML", "NE", "TD", "MR", "VE", "PG"]);
function monthName(m, style) {
  var lang = window.ATLAS_LANG || "en";
  try {
    return new Date(2021, m, 1).toLocaleDateString(lang, {
      month: style || "long"
    });
  } catch (e) {
    return String(m + 1);
  }
}
function readParams() {
  var p = new URLSearchParams(location.search);
  var m = parseInt(p.get("m"), 10);
  var c = (p.get("c") || "").toUpperCase();
  return {
    month: m >= 1 && m <= 12 ? m - 1 : new Date().getMonth(),
    country: window.byIso2 && window.byIso2[c] ? c : null,
    view: p.get("v") === "rain" ? "rain" : "temp"
  };
}
function writeParams(month, country, view) {
  var p = new URLSearchParams();
  p.set("m", String(month + 1));
  if (view === "rain") p.set("v", "rain");
  if (country) p.set("c", country);
  try {
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  } catch (e) {}
}
function readView() {
  try {
    return sessionStorage.getItem("atlas.globeStyle") || "globe3d";
  } catch (e) {
    return "globe3d";
  }
}
function ClimateMapApp() {
  var init = useMemo(readParams, []);
  var _useState = useState(readView),
    _useState2 = _slicedToArray(_useState, 2),
    mode = _useState2[0],
    setModeState = _useState2[1];
  var _useState3 = useState(init.month),
    _useState4 = _slicedToArray(_useState3, 2),
    month = _useState4[0],
    setMonth = _useState4[1];
  var _useState5 = useState(init.view),
    _useState6 = _slicedToArray(_useState5, 2),
    view = _useState6[0],
    setView = _useState6[1];
  var _useState7 = useState(init.country),
    _useState8 = _slicedToArray(_useState7, 2),
    selected = _useState8[0],
    setSelected = _useState8[1];
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
  useEffect(function () {
    writeParams(month, selected, view);
  }, [month, selected, view]);
  var fillResolver = useCallback(function (iso2) {
    var c = climateOf(iso2);
    if (!c) return {
      color: "var(--na)"
    };
    return view === "rain" ? {
      color: P_COLOR[band(c.pr[month], P_BANDS)]
    } : {
      color: T_COLOR[band(c.hi[month], T_BANDS)]
    };
  }, [month, view]);
  var hoverRenderer = useCallback(function (hover) {
    return React.createElement(ClimateHover, {
      hover: hover,
      month: month
    });
  }, [month]);
  var open = function open(iso2) {
    setSelected(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
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
    theme: theme,
    onTheme: setTheme
  }), React.createElement("div", {
    className: "globe-stage has-key"
  }, React.createElement(Globe, {
    passport: null,
    mode: mode,
    onView: setMode,
    fillResolver: fillResolver,
    hoverRenderer: hoverRenderer,
    onCountryClick: open,
    focusedCountry: selected,
    nightShade: true,
    keepSpinning: true
  }), React.createElement(ClimateLegend, {
    view: view
  })), React.createElement(PanelResizer, null), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("h1", {
    className: "p-head-title"
  }, tr("clim.title", "Climate map")), React.createElement("p", {
    className: "p-head-sub"
  }, tr("clim.subtitle", "The usual weather in every country, month by month. Long-term averages, not a forecast."))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 1
  }, tr("clim.pick_month", "Month")), React.createElement("div", {
    className: "cl-months",
    role: "group",
    "aria-label": tr("clim.pick_month", "Month")
  }, Array.from({
    length: 12
  }, function (_, m) {
    return React.createElement("button", {
      key: m,
      type: "button",
      className: "cl-month",
      "aria-pressed": m === month,
      onClick: function onClick() {
        return setMonth(m);
      }
    }, monthName(m, "short"));
  })), React.createElement("div", {
    className: "seg cl-view",
    role: "group",
    "aria-label": tr("clim.show", "Show")
  }, React.createElement("button", {
    type: "button",
    "aria-pressed": view === "temp",
    onClick: function onClick() {
      return setView("temp");
    }
  }, tr("clim.view_temp", "Daytime high")), React.createElement("button", {
    type: "button",
    "aria-pressed": view === "rain",
    onClick: function onClick() {
      return setView("rain");
    }
  }, tr("clim.view_rain", "Rain")))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(ClimateSearch, {
    onPick: open,
    month: month
  })), selected && React.createElement(ClimateDetail, {
    iso2: selected,
    month: month,
    setMonth: setMonth,
    onClose: function onClose() {
      return setSelected(null);
    }
  }), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, tr("clim.good_in", "Pleasant in {month}", {
    month: monthName(month)
  })), React.createElement(GoodList, {
    month: month,
    selected: selected,
    onOpen: open
  }), React.createElement("p", {
    className: "p-fine",
    style: {
      marginTop: 6
    }
  }, tr("clim.good_rule", "Daytime high between 18° and 30° and under 100 mm of rain in the month."))), React.createElement("footer", {
    className: "panel-foot"
  }, React.createElement("div", null, tr("clim.source", "Monthly averages for 1991–2020, one value per country."), " ", React.createElement("a", {
    href: CLIMATE.sourceUrl || "https://climateknowledgeportal.worldbank.org/",
    target: "_blank",
    rel: "noopener"
  }, "World Bank Climate Change Knowledge Portal"), " (ERA5, CC BY 4.0).", " ", tr("clim.disclaimer", "Check the forecast before you travel.")))));
}
function GoodList(_ref) {
  var month = _ref.month,
    selected = _ref.selected,
    onOpen = _ref.onOpen;
  var _useState9 = useState(false),
    _useState0 = _slicedToArray(_useState9, 2),
    expanded = _useState0[0],
    setExpanded = _useState0[1];
  var rows = useMemo(function () {
    return window.COUNTRIES.filter(function (c) {
      return isGood(climateOf(c.iso2), month);
    }).map(function (c) {
      return c.iso2;
    }).sort(function (a, b) {
      return window.countryName(a).localeCompare(window.countryName(b), window.ATLAS_LANG || "en");
    });
  }, [month]);
  useEffect(function () {
    return setExpanded(false);
  }, [month]);
  if (!rows.length) return React.createElement("p", {
    className: "p-fine",
    style: {
      margin: 0
    }
  }, tr("clim.good_none", "No country matches this month."));
  var shown = expanded ? rows : rows.slice(0, 24);
  return React.createElement("div", null, React.createElement("div", {
    className: "chips"
  }, shown.map(function (iso2) {
    var _window$byIso2$iso;
    return React.createElement("button", {
      key: iso2,
      type: "button",
      className: "chip" + (iso2 === selected ? " is-on" : ""),
      onClick: function onClick() {
        return onOpen(iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$iso = window.byIso2[iso2]) === null || _window$byIso2$iso === void 0 ? void 0 : _window$byIso2$iso.flag), window.countryName(iso2));
  })), rows.length > 24 && React.createElement("button", {
    type: "button",
    className: "more-btn",
    onClick: function onClick() {
      return setExpanded(function (v) {
        return !v;
      });
    }
  }, expanded ? tr("changelog.show_less", "Show less") : tr("tally.show_all", "Show all {n}", {
    n: rows.length
  })));
}
function ClimateLegend(_ref2) {
  var view = _ref2.view;
  var rain = view === "rain";
  var colors = rain ? P_COLOR : T_COLOR;
  var labels = rain ? P_LABEL : T_LABEL;
  return React.createElement("div", {
    className: "map-key map-key-below overlay-card"
  }, React.createElement("div", {
    className: "map-key-title"
  }, rain ? tr("clim.legend_rain", "Rain in the month") : tr("clim.legend_temp", "Daytime high")), React.createElement("ul", null, colors.map(function (c, i) {
    return React.createElement("li", {
      key: i
    }, React.createElement("span", {
      className: "sw",
      style: {
        "--sw": c
      }
    }), React.createElement("span", null, tr("clim." + (rain ? "p" : "t") + i, labels[i])));
  }), React.createElement("li", null, React.createElement("span", {
    className: "sw cl-night-sw"
  }), React.createElement("span", null, tr("clim.night_now", "Night right now")))));
}
function ClimateHover(_ref3) {
  var hover = _ref3.hover,
    month = _ref3.month;
  var dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  var c = climateOf(hover.iso2);
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
  }, dest.flag), React.createElement("span", null, window.countryName(hover.iso2))), c ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "hovercard-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      "--sw": T_COLOR[band(c.hi[month], T_BANDS)]
    }
  }), React.createElement("span", null, tr("clim.day_night", "{hi}° by day, {lo}° at night", {
    hi: c.hi[month],
    lo: c.lo[month]
  }))), React.createElement("div", {
    className: "hovercard-row"
  }, React.createElement("span", {
    className: "dot",
    style: {
      "--sw": P_COLOR[band(c.pr[month], P_BANDS)]
    }
  }), React.createElement("span", null, tr("clim.rain_mm", "{mm} mm of rain", {
    mm: c.pr[month]
  })))) : React.createElement("div", {
    className: "hovercard-row hovercard-cap"
  }, tr("clim.no_data", "No climate data")));
}
function ClimateSearch(_ref4) {
  var onPick = _ref4.onPick,
    month = _ref4.month;
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    q = _useState10[0],
    setQ = _useState10[1];
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
    var cl = climateOf(c.iso2);
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
    }, cl ? cl.hi[month] + "°" : "-"));
  })));
}
function ClimateDetail(_ref5) {
  var iso2 = _ref5.iso2,
    month = _ref5.month,
    setMonth = _ref5.setMonth,
    onClose = _ref5.onClose;
  var dest = window.byIso2[iso2];
  var c = climateOf(iso2);
  if (!dest) return null;
  var good = c ? Array.from({
    length: 12
  }, function (_, m) {
    return m;
  }).filter(function (m) {
    return isGood(c, m);
  }) : [];
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
  }, window.countryName(iso2)), React.createElement("div", {
    className: "entry-sub"
  }, tr("clim.in_month", "In {month}", {
    month: monthName(month)
  }))), React.createElement("div", {
    className: "entry-actions"
  }, React.createElement("button", {
    type: "button",
    className: "icon-btn",
    onClick: onClose,
    "aria-label": tr("detail.close", "Close")
  }, React.createElement(IconClose, null)))), !c ? React.createElement("p", {
    className: "p-fine"
  }, tr("clim.no_data", "No climate data")) : React.createElement(React.Fragment, null, React.createElement("dl", {
    className: "cl-now"
  }, React.createElement("div", null, React.createElement("dt", null, tr("clim.by_day", "By day")), React.createElement("dd", null, c.hi[month], "\xB0")), React.createElement("div", null, React.createElement("dt", null, tr("clim.at_night", "At night")), React.createElement("dd", null, c.lo[month], "\xB0")), React.createElement("div", null, React.createElement("dt", null, tr("clim.rain", "Rain")), React.createElement("dd", null, c.pr[month], " ", React.createElement("small", null, "mm")))), React.createElement(YearChart, {
    c: c,
    month: month,
    setMonth: setMonth
  }), React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "10px 0 0"
    }
  }, good.length === 12 ? tr("clim.good_all", "Pleasant all year round.") : good.length ? tr("clim.good_months", "Most pleasant: {months}.", {
    months: good.map(function (m) {
      return monthName(m);
    }).join(", ")
  }) : tr("clim.good_never", "No month meets the pleasant-weather rule; pick by the chart.")), (VARIED.has(iso2) || ALIAS[iso2]) && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "6px 0 0"
    }
  }, ALIAS[iso2] ? tr("clim.alias_cy", "Average for the whole island of Cyprus.") : tr("clim.varied", "Average for the whole country. Coasts, mountains and the far north or south can be very different."))));
}
function YearChart(_ref6) {
  var c = _ref6.c,
    month = _ref6.month,
    setMonth = _ref6.setMonth;
  var maxPr = Math.max.apply(Math, [60].concat(_toConsumableArray(c.pr)));
  return React.createElement("div", {
    className: "cl-year",
    role: "group",
    "aria-label": tr("clim.year", "The year at a glance")
  }, c.hi.map(function (hi, m) {
    return React.createElement("button", {
      key: m,
      type: "button",
      className: "cl-col" + (m === month ? " is-on" : ""),
      "aria-pressed": m === month,
      onClick: function onClick() {
        return setMonth(m);
      },
      "aria-label": monthName(m) + ": " + tr("clim.day_night", "{hi}° by day, {lo}° at night", {
        hi: hi,
        lo: c.lo[m]
      }) + ", " + tr("clim.rain_mm", "{mm} mm of rain", {
        mm: c.pr[m]
      })
    }, React.createElement("span", {
      className: "cl-hi",
      style: {
        "--sw": T_COLOR[band(hi, T_BANDS)]
      }
    }, hi, "\xB0"), React.createElement("span", {
      className: "cl-bar-wrap"
    }, React.createElement("span", {
      className: "cl-bar",
      style: {
        height: Math.max(2, Math.round(c.pr[m] / maxPr * 100)) + "%"
      }
    })), React.createElement("span", {
      className: "cl-m"
    }, monthName(m, "narrow")));
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(ClimateMapApp, null));

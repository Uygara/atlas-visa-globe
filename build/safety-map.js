// Generated from components/safety-map.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
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
  useCallback = _React.useCallback,
  useRef = _React.useRef;
var ADVISORIES = window.TRAVEL_ADVISORIES || {
  countries: {},
  sources: {}
};
var ADMIN1_INDEX_URL = "/data/admin1/index.json";
var LEVEL_COLOR = {
  0: "var(--na)",
  1: "var(--risk1)",
  2: "var(--risk2)",
  3: "var(--risk3)",
  4: "var(--risk4)"
};
var STALE_DAYS = 180;
var SOURCE_ORDER = ["uk", "us", "ca"];
var EVENT_LABEL = {
  earthquake: "safety.event.earthquake",
  storm: "safety.event.storm",
  flood: "safety.event.flood",
  volcano: "safety.event.volcano",
  wildfire: "safety.event.wildfire",
  drought: "safety.event.drought"
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
function daysSince(iso) {
  if (!iso) return null;
  var d = new Date(iso + "T00:00:00").getTime();
  return isNaN(d) ? null : Math.floor((Date.now() - d) / 86400000);
}
function ago(iso) {
  var days = daysSince(iso);
  if (days == null) return "";
  if (days <= 0) return tr("safety.today", "today");
  if (days === 1) return tr("safety.yesterday", "yesterday");
  if (days < 30) return tr("safety.days_ago", "{n} days ago", {
    n: days
  });
  var months = Math.round(days / 30.4);
  if (months < 24) return tr("safety.months_ago", "{n} months ago", {
    n: months
  });
  return tr("safety.years_ago", "{n} years ago", {
    n: Math.round(days / 365)
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
  var _useState7 = useState(null),
    _useState8 = _slicedToArray(_useState7, 2),
    regions = _useState8[0],
    setRegions = _useState8[1];
  var _useState9 = useState({}),
    _useState0 = _slicedToArray(_useState9, 2),
    regionNames = _useState0[0],
    setRegionNames = _useState0[1];
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
    var alive = true;
    fetch(ADMIN1_INDEX_URL).then(function (r) {
      return r.json();
    }).then(function (j) {
      if (alive) setRegionNames(j);
    })["catch"](function () {});
    return function () {
      alive = false;
    };
  }, []);
  var loadedFor = useRef(null);
  useEffect(function () {
    if (!selected) {
      setRegions(null);
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === selected) return;
    loadedFor.current = selected;
    var alive = true;
    fetch("/data/admin1/".concat(selected, ".json")).then(function (r) {
      return r.ok ? r.json() : Promise.reject(new Error("no boundaries"));
    }).then(function (topo) {
      if (!alive || loadedFor.current !== selected) return;
      var key = Object.keys(topo.objects)[0];
      setRegions({
        iso2: selected,
        features: topojson.feature(topo, topo.objects[key]).features
      });
    })["catch"](function () {
      if (alive) setRegions(null);
    });
    return function () {
      alive = false;
    };
  }, [selected]);
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
  var regionLevels = useMemo(function () {
    var a = selected && advisoryFor(selected);
    var map = {};
    var _iterator = _createForOfIteratorHelper(a && a.regions || []),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var r = _step.value;
        map[r.id] = r.level;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return map;
  }, [selected]);
  var countryLevel = selected && advisoryFor(selected) ? advisoryFor(selected).level : 0;
  var regionFill = useCallback(function (f) {
    var id = f.properties && f.properties.id;
    return LEVEL_COLOR[regionLevels[id] || countryLevel || 0];
  }, [regionLevels, countryLevel]);
  var hoverRenderer = useCallback(function (hover) {
    return React.createElement(SafetyHover, {
      hover: hover
    });
  }, []);
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
    focusedCountry: selected,
    regionFeatures: regions && regions.iso2 === selected ? regions.features : null,
    regionFill: regionFill
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
    names: regionNames,
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
  }, tr("safety.stricter_note", "Coloured by the strictest of the three governments."))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, tr("safety.recent", "Updated in the last week")), React.createElement(RecentlyUpdated, {
    onOpen: open
  })), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 3
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
function RecentlyUpdated(_ref6) {
  var onOpen = _ref6.onOpen;
  var _useState1 = useState(false),
    _useState10 = _slicedToArray(_useState1, 2),
    expanded = _useState10[0],
    setExpanded = _useState10[1];
  var rows = useMemo(function () {
    var out = [];
    for (var _i = 0, _Object$entries = Object.entries(ADVISORIES.countries); _i < _Object$entries.length; _i++) {
      var _daysSince;
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        iso2 = _Object$entries$_i[0],
        c = _Object$entries$_i[1];
      if (!window.byIso2[iso2] || !c.uk || !c.uk.updates || !c.uk.updates.length) continue;
      var latest = c.uk.updates[0];
      if (((_daysSince = daysSince(latest.date)) !== null && _daysSince !== void 0 ? _daysSince : 999) > 7) continue;
      out.push({
        iso2: iso2,
        date: latest.date,
        note: latest.note,
        level: c.level
      });
    }
    return out.sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
  }, []);
  if (!rows.length) return React.createElement("p", {
    className: "p-fine",
    style: {
      margin: 0
    }
  }, tr("safety.recent_none", "No advisory changed in the last week."));
  var shown = expanded ? rows : rows.slice(0, 5);
  return React.createElement("div", null, React.createElement("div", {
    className: "feed"
  }, shown.map(function (r) {
    var _window$byIso2$r$iso;
    return React.createElement("button", {
      key: r.iso2,
      type: "button",
      className: "feed-item",
      style: {
        "--tone": LEVEL_COLOR[r.level],
        textAlign: "left",
        width: "100%",
        cursor: "pointer"
      },
      onClick: function onClick() {
        return onOpen(r.iso2);
      }
    }, React.createElement("div", {
      className: "feed-meta"
    }, React.createElement("time", {
      dateTime: r.date
    }, fmtDate(r.date)), React.createElement("span", null, "\xB7"), React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$r$iso = window.byIso2[r.iso2]) === null || _window$byIso2$r$iso === void 0 ? void 0 : _window$byIso2$r$iso.flag), React.createElement("span", null, window.countryName(r.iso2))), React.createElement("div", {
      className: "feed-sum"
    }, r.note));
  })), rows.length > 5 && React.createElement("button", {
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
    }), React.createElement("span", null, React.createElement("span", {
      className: "mono",
      style: {
        color: "var(--ink-3)"
      }
    }, n), " ", levelLabel(n)));
  })));
}
function SafetyHover(_ref7) {
  var hover = _ref7.hover;
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
  }), React.createElement("span", null, level ? "".concat(level, " \xB7 ").concat(levelLabel(level)) : levelLabel(0))), a && a.regions && a.regions.length > 0 && React.createElement("div", {
    className: "hovercard-row hovercard-cap"
  }, tr("safety.has_regions", "Some regions are worse — tap to see them")));
}
function SafetySearch(_ref8) {
  var onPick = _ref8.onPick;
  var _useState11 = useState(""),
    _useState12 = _slicedToArray(_useState11, 2),
    q = _useState12[0],
    setQ = _useState12[1];
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
function SafetyDetail(_ref9) {
  var iso2 = _ref9.iso2,
    names = _ref9.names,
    onClose = _ref9.onClose;
  var dest = window.byIso2[iso2];
  var a = advisoryFor(iso2);
  if (!dest) return null;
  var level = a ? a.level : 0;
  var regionName = function regionName(id) {
    var list = names[iso2] || [];
    var hit = list.find(function (u) {
      return u.id === id;
    });
    return hit ? hit.nm : id;
  };
  var regions = a && a.regions || [];
  var notes = a && a.regionNotes || [];
  var events = a && a.events || [];
  var updates = a && a.uk && a.uk.updates || [];
  var disagree = a && a.uk && a.us && a.ca && Math.max(a.uk.level, a.us.level, a.ca.level) - Math.min(a.uk.level, a.us.level, a.ca.level) >= 2;
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
  }, window.countryName(iso2)), a && a.updated && React.createElement("div", {
    className: "entry-sub"
  }, tr("safety.updated_ago", "Updated {ago}", {
    ago: ago(a.updated)
  }))), React.createElement("div", {
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
  }), " / 4"))), disagree && React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, tr("safety.disagree", ""))), regions.length === 0 && notes.length === 0 && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "0 0 12px"
    }
  }, tr("safety.regions_none", "No region of this country carries its own warning — the provinces on the map all sit at the country's level.")), (regions.length > 0 || notes.length > 0) && React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, tr("safety.regions_title", "Inside the country")), regions.length > 0 && React.createElement("ul", {
    className: "ledger",
    style: {
      marginBottom: notes.length ? 8 : 0
    }
  }, regions.map(function (r) {
    return React.createElement("li", {
      key: r.id
    }, React.createElement("div", {
      className: "lg-row",
      style: {
        cursor: "default"
      }
    }, React.createElement("span", {
      className: "sw",
      style: {
        "--sw": LEVEL_COLOR[r.level]
      },
      "aria-hidden": "true"
    }), React.createElement("span", {
      className: "lg-label",
      style: {
        whiteSpace: "normal"
      }
    }, regionName(r.id)), React.createElement("span", {
      className: "lg-dots"
    }), React.createElement("span", {
      className: "lg-n",
      style: {
        fontSize: 11.5,
        color: "var(--ink-2)",
        textAlign: "right"
      }
    }, levelLabel(r.level))));
  })), notes.map(function (n, i) {
    return React.createElement("div", {
      key: i,
      className: "box box-dashed p-fine",
      style: {
        marginBottom: 6
      }
    }, React.createElement("strong", {
      style: {
        color: "var(--ink-2)"
      }
    }, levelLabel(n.level), ":"), " ", n.text);
  }), React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "4px 0 0"
    }
  }, tr("safety.regions_note", "Shaded on the map. Areas described only in words (\"within 10km of the border\") cannot be drawn — read the full advisory."))), events.length > 0 && React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, tr("safety.events_title", "Active alerts")), events.map(function (e, i) {
    return React.createElement("a", {
      key: i,
      className: "note " + (e.level === "red" ? "note-risk" : "note-warn"),
      href: e.url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, React.createElement("span", {
      className: "note-k"
    }, tr(EVENT_LABEL[e.type] || "safety.event.other", e.type), e.name ? " — " + e.name : ""), React.createElement("span", {
      className: "note-s"
    }, tr("safety.event_since", "since {date}", {
      date: fmtDate(e.from)
    }), " \xB7 GDACS"), React.createElement("span", {
      className: "note-go",
      "aria-hidden": "true"
    }, "\u2192"));
  })), updates.length > 0 && React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, tr("safety.updates_title", "Recent official updates")), React.createElement("div", {
    className: "feed"
  }, updates.slice(0, 4).map(function (u, i) {
    return React.createElement("div", {
      key: i,
      className: "feed-item",
      style: {
        "--tone": "var(--rule-strong)"
      }
    }, React.createElement("div", {
      className: "feed-meta"
    }, React.createElement("time", {
      dateTime: u.date
    }, fmtDate(u.date)), React.createElement("span", null, "\xB7"), React.createElement("span", null, "UK FCDO")), React.createElement("div", {
      className: "feed-sum"
    }, u.note));
  }))), SOURCE_ORDER.map(function (key) {
    return React.createElement(SourceRow, {
      key: key,
      k: key,
      src: a && a[key]
    });
  }));
}
function SourceRow(_ref0) {
  var _daysSince2;
  var k = _ref0.k,
    src = _ref0.src;
  var label = tr("safety." + k, {
    uk: "UK FCDO",
    us: "U.S. State Department",
    ca: "Government of Canada"
  }[k]);
  var stale = src && ((_daysSince2 = daysSince(src.updated)) !== null && _daysSince2 !== void 0 ? _daysSince2 : 0) > STALE_DAYS;
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
  }, levelLabel(src.level)), k === "us" && src.risks && src.risks.length > 0 && React.createElement("div", {
    className: "chips",
    style: {
      marginTop: 6
    },
    "aria-label": tr("safety.why", "Named risks")
  }, src.risks.map(function (r) {
    return React.createElement("span", {
      key: r,
      className: "chip",
      style: {
        cursor: "default"
      }
    }, tr("safety.risk." + r, r));
  })), k === "uk" && src.change && React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "6px 0 0"
    }
  }, src.change), k === "ca" && src.change && React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "6px 0 0"
    }
  }, src.change), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 8,
      alignItems: "baseline"
    }
  }, React.createElement("span", {
    className: "p-fine" + (stale ? " is-stale" : "")
  }, ago(src.updated), stale ? " · " + tr("safety.stale", "not revised recently") : ""), React.createElement("a", {
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

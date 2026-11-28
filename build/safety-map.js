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
var ADMIN1_WORLD_URL = "/data/admin1/world.json";
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
function countryLevelOf(iso2) {
  var a = iso2 && advisoryFor(iso2);
  return a ? a.level : 0;
}
var REGION_LEVELS = function () {
  var out = {};
  for (var _i = 0, _Object$entries = Object.entries(ADVISORIES.countries); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
      iso2 = _Object$entries$_i[0],
      a = _Object$entries$_i[1];
    if (!a || !a.regions || !a.regions.length) continue;
    out[iso2] = {};
    var _iterator = _createForOfIteratorHelper(a.regions),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var r = _step.value;
        out[iso2][r.id] = r.level;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  return out;
}();
function worseLevelOf(iso2) {
  var own = countryLevelOf(iso2);
  var hi = 0;
  for (var _i2 = 0, _Object$values = Object.values(REGION_LEVELS[iso2] || {}); _i2 < _Object$values.length; _i2++) {
    var lv = _Object$values[_i2];
    if (lv > own && lv > hi) hi = lv;
  }
  return hi;
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
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    pickedRegion = _useState10[0],
    setPickedRegion = _useState10[1];
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
      var features = topojson.feature(topo, topo.objects[key]).features;
      var _iterator2 = _createForOfIteratorHelper(features),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var f = _step2.value;
          f.properties = Object.assign({}, f.properties, {
            id: f.properties && f.properties.id || f.id,
            c: selected
          });
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      setRegions({
        iso2: selected,
        features: features
      });
    })["catch"](function () {
      if (alive) setRegions(null);
    });
    return function () {
      alive = false;
    };
  }, [selected]);
  var fillResolver = useCallback(function (iso2) {
    var level = countryLevelOf(iso2);
    if (selected) return {
      color: LEVEL_COLOR[level],
      opacity: iso2 === selected ? 1 : 0.35
    };
    if (filter && level !== filter) return {
      color: "var(--land)"
    };
    return {
      color: LEVEL_COLOR[level]
    };
  }, [filter, selected]);
  var regionFill = useCallback(function (f) {
    var p = f.properties || {};
    var iso2 = p.c || selected;
    var lv = (REGION_LEVELS[iso2] || {})[p.id] || countryLevelOf(iso2);
    if (p.id && p.id === pickedRegion) return "var(--ink)";
    return LEVEL_COLOR[lv || 0];
  }, [selected, pickedRegion]);
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    worldRegions = _useState12[0],
    setWorldRegions = _useState12[1];
  useEffect(function () {
    var alive = true;
    var load = function load() {
      return fetch(ADMIN1_WORLD_URL).then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("no world provinces"));
      }).then(function (topo) {
        if (!alive) return;
        var out = [];
        for (var _i3 = 0, _Object$keys = Object.keys(REGION_LEVELS); _i3 < _Object$keys.length; _i3++) {
          var iso2 = _Object$keys[_i3];
          var obj = topo.objects[iso2];
          if (!obj) continue;
          var own = countryLevelOf(iso2);
          var _iterator3 = _createForOfIteratorHelper(topojson.feature(topo, obj).features),
            _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var f = _step3.value;
              var id = f.properties && f.properties.id || f.id;
              var lv = REGION_LEVELS[iso2][id];
              if (!lv || lv === own) continue;
              f.properties = {
                id: id,
                c: iso2
              };
              out.push(f);
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        }
        setWorldRegions(out);
      })["catch"](function () {});
    };
    if (window.requestIdleCallback) window.requestIdleCallback(load, {
      timeout: 1500
    });else setTimeout(load, 300);
    return function () {
      alive = false;
    };
  }, []);
  var regionFeatures = useMemo(function () {
    if (selected) return regions && regions.iso2 === selected ? regions.features : null;
    if (!worldRegions) return null;
    var list = filter ? worldRegions.filter(function (f) {
      return REGION_LEVELS[f.properties.c][f.properties.id] === filter;
    }) : worldRegions;
    return list.length ? list : null;
  }, [regions, selected, worldRegions, filter]);
  var regionBorders = useCallback(function (f) {
    return !!selected && f.properties.c === selected;
  }, [selected]);
  var hoverRenderer = useCallback(function (hover) {
    return React.createElement(SafetyHover, {
      hover: hover,
      names: regionNames
    });
  }, [regionNames]);
  var open = function open(iso2) {
    setSelected(iso2);
    setPickedRegion(null);
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
  var back = function back() {
    setSelected(null);
    setPickedRegion(null);
  };
  useEffect(function () {
    if (!selected) return;
    var onKey = function onKey(e) {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return function () {
      return window.removeEventListener("keydown", onKey);
    };
  }, [selected]);
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
    fitFocus: true,
    regionFeatures: regionFeatures,
    regionFill: regionFill,
    regionInteractive: true,
    regionBorders: regionBorders,
    onRegionClick: function onRegionClick(f) {
      if (!selected || f.properties.c !== selected) {
        open(f.properties.c);
        return;
      }
      setPickedRegion(function (id) {
        return id === f.properties.id ? null : f.properties.id;
      });
    }
  }), selected && React.createElement("div", {
    style: {
      position: "absolute",
      insetInlineStart: 12,
      top: 12,
      zIndex: 6,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 8,
      maxWidth: "calc(100% - 24px)"
    }
  }, React.createElement("button", {
    type: "button",
    className: "overlay-card safety-back",
    onClick: back,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      minHeight: 40,
      padding: "8px 14px",
      border: "1px solid var(--rule-strong)",
      borderRadius: 999,
      font: "inherit",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--ink)",
      cursor: "pointer"
    }
  }, React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2190"), tr("safety.back", "All countries")), pickedRegion && React.createElement(PickedRegion, {
    iso2: selected,
    id: pickedRegion,
    names: regionNames
  })), React.createElement(SafetyLegend, null)), React.createElement(PanelResizer, null), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("h1", {
    className: "p-head-title"
  }, tr("safety.title", "Travel safety map")), React.createElement("p", {
    className: "p-head-sub"
  }, tr("safety.subtitle", "Official government travel advisories on one map."))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(SafetySearch, {
    onPick: open
  })), selected && React.createElement(SafetyDetail, {
    iso2: selected,
    names: regionNames,
    picked: pickedRegion,
    onPick: setPickedRegion,
    onClose: back
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
  }, tr("safety.rule_note", "Each country shows its country-wide level: the strictest of the three governments. Provinces with their own warning are coloured in their level. Tap a country to see its province borders."))), React.createElement("section", {
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
    }, r.n, ": ", levelLabel(r.n)), React.createElement("span", {
      className: "lg-dots"
    }), React.createElement("span", {
      className: "lg-n"
    }, r.count)));
  }));
}
function RecentlyUpdated(_ref6) {
  var onOpen = _ref6.onOpen;
  var _useState13 = useState(false),
    _useState14 = _slicedToArray(_useState13, 2),
    expanded = _useState14[0],
    setExpanded = _useState14[1];
  var rows = useMemo(function () {
    var out = [];
    for (var _i4 = 0, _Object$entries2 = Object.entries(ADVISORIES.countries); _i4 < _Object$entries2.length; _i4++) {
      var _daysSince;
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i4], 2),
        iso2 = _Object$entries2$_i[0],
        c = _Object$entries2$_i[1];
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
        textAlign: "start",
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
    }, fmtDate(r.date)), React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$r$iso = window.byIso2[r.iso2]) === null || _window$byIso2$r$iso === void 0 ? void 0 : _window$byIso2$r$iso.flag), React.createElement("span", null, window.countryName(r.iso2))), React.createElement("div", {
      className: "feed-sum",
      dir: "auto"
    }, (window.ATLAS_LANG || "en") === "en" ? wholeWords(r.note) : tr("safety.recent_uk", "UK travel advice for this country was updated. Open it for the details.")));
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
function PickedRegion(_ref7) {
  var iso2 = _ref7.iso2,
    id = _ref7.id,
    names = _ref7.names;
  var lv = (REGION_LEVELS[iso2] || {})[id] || countryLevelOf(iso2);
  var hit = (names[iso2] || []).find(function (u) {
    return u.id === id;
  });
  return React.createElement("div", {
    className: "overlay-card safety-picked",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      maxWidth: "100%",
      padding: "5px 10px",
      border: "1px solid var(--rule-strong)",
      borderRadius: 999,
      fontSize: 12.5,
      color: "var(--ink-2)"
    }
  }, React.createElement("span", {
    className: "dot",
    style: {
      "--sw": LEVEL_COLOR[lv]
    }
  }), React.createElement("strong", {
    style: {
      color: "var(--ink)",
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, hit ? hit.nm : id), React.createElement("span", {
    style: {
      whiteSpace: "nowrap"
    }
  }, lv ? "".concat(lv, ": ").concat(levelLabel(lv)) : levelLabel(0)));
}
function SafetyLegend() {
  return React.createElement("div", {
    className: "map-key map-key-below overlay-card"
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
function SafetyHover(_ref8) {
  var hover = _ref8.hover,
    names = _ref8.names;
  var dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  var a = advisoryFor(hover.iso2);
  var level = a ? a.level : 0;
  if (hover.region) {
    var own = (REGION_LEVELS[hover.iso2] || {})[hover.region];
    var hit = (names[hover.iso2] || []).find(function (u) {
      return u.id === hover.region;
    });
    var lv = own || level;
    return React.createElement("div", {
      className: "hovercard overlay-card",
      style: {
        left: hover.x + 18,
        top: hover.y + 18
      }
    }, React.createElement("div", {
      className: "hovercard-title"
    }, React.createElement("span", null, hit ? hit.nm : hover.region)), React.createElement("div", {
      className: "hovercard-row"
    }, React.createElement("span", {
      className: "dot",
      style: {
        "--sw": LEVEL_COLOR[lv]
      }
    }), React.createElement("span", null, lv ? "".concat(lv, ": ").concat(levelLabel(lv)) : levelLabel(0))), !own && React.createElement("div", {
      className: "hovercard-row hovercard-cap"
    }, tr("safety.region_country_level", "No separate warning: country level")));
  }
  var worse = worseLevelOf(hover.iso2);
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
  }), React.createElement("span", null, level ? "".concat(level, ": ").concat(levelLabel(level)) : levelLabel(0))), worse > 0 && React.createElement("div", {
    className: "hovercard-row hovercard-cap"
  }, tr("safety.parts_higher", "Parts at level {n}: {label}. Tap to see them", {
    n: worse,
    label: levelLabel(worse)
  })));
}
function SafetySearch(_ref9) {
  var onPick = _ref9.onPick;
  var _useState15 = useState(""),
    _useState16 = _slicedToArray(_useState15, 2),
    q = _useState16[0],
    setQ = _useState16[1];
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
    }, level ? levelLabel(level) : "-"), React.createElement("span", {
      className: "dot",
      style: {
        "--sw": LEVEL_COLOR[level]
      }
    }));
  })));
}
function SafetyDetail(_ref0) {
  var iso2 = _ref0.iso2,
    names = _ref0.names,
    picked = _ref0.picked,
    onPick = _ref0.onPick,
    onClose = _ref0.onClose;
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
  var mfa = a && a.mfa || [];
  var worse = worseLevelOf(iso2);
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
  }), " / 4"))), worse > 0 && React.createElement("div", {
    className: "note note-risk",
    style: {
      cursor: "default"
    }
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, tr("safety.parts_note", "Parts of this country are rated level {n} ({label}). The provinces are shaded on the map and listed below.", {
    n: worse,
    label: levelLabel(worse)
  }))), disagree && React.createElement("div", {
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
  }, tr("safety.regions_none", "No region of this country carries its own warning. The provinces on the map all sit at the country's level.")), (regions.length > 0 || notes.length > 0) && React.createElement("div", {
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
    }, React.createElement("button", {
      type: "button",
      className: "lg-row",
      "aria-pressed": picked === r.id,
      onClick: function onClick() {
        return onPick(picked === r.id ? null : r.id);
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
        fontSize: 12,
        color: "var(--ink-2)",
        textAlign: "end"
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
  }, tr("safety.regions_note", "Shaded on the map. Areas described only in words (\"within 10km of the border\") cannot be drawn. Read the full advisory."))), events.length > 0 && React.createElement("div", {
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
    }, tr(EVENT_LABEL[e.type] || "safety.event.other", e.type), e.name ? ": " + e.name : ""), React.createElement("span", {
      className: "note-s"
    }, tr("safety.event_since", "since {date}", {
      date: fmtDate(e.from)
    }), " (GDACS)"), React.createElement("span", {
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
    }, fmtDate(u.date)), React.createElement("span", null, "UK FCDO")), React.createElement("div", {
      className: "feed-sum",
      dir: "auto"
    }, u.note));
  }))), mfa.length > 0 && React.createElement("div", {
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
  }, tr("safety.mfa_title", "Turkish Foreign Ministry")), mfa.map(function (m, i) {
    return React.createElement("a", {
      key: i,
      className: "note note-info",
      href: m.url,
      target: "_blank",
      rel: "noopener noreferrer"
    }, React.createElement("span", {
      className: "note-k",
      dir: "auto"
    }, m.title), React.createElement("span", {
      className: "note-s"
    }, fmtDate(m.date)), React.createElement("span", {
      className: "note-go",
      "aria-hidden": "true"
    }, "\u2192"));
  })), SOURCE_ORDER.map(function (key) {
    return React.createElement(SourceRow, {
      key: key,
      k: key,
      src: a && a[key]
    });
  }));
}
function SourceRow(_ref1) {
  var _daysSince2;
  var k = _ref1.k,
    src = _ref1.src;
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
  }, ago(src.updated), stale ? ", " + tr("safety.stale", "not revised recently") : ""), React.createElement("a", {
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
function wholeWords(s) {
  s = String(s || "").trim();
  if (/[.!?)"'”’]$/.test(s)) return s;
  var cut = s.replace(/\s+\S*$/, "").replace(/[\s,;:(\-–'"‘“]+$/, "");
  return (cut || s) + "…";
}

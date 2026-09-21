// Generated from components/itinerary-app.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
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
  useRef = _React.useRef,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback;
function loadInitial() {
  var passport = null,
    stops = [],
    departure = "";
  try {
    var params = new URLSearchParams(location.search);
    if (params.get("p")) passport = params.get("p").toUpperCase();
    if (params.get("stops")) stops = params.get("stops").split(",").map(function (s) {
      return s.trim().toUpperCase();
    }).filter(Boolean);
    if (params.get("d")) departure = params.get("d");
  } catch (e) {}
  try {
    var saved = JSON.parse(localStorage.getItem("atlas.itinerary") || sessionStorage.getItem("atlas.itinerary") || "{}");
    if (!passport && saved.passport) passport = saved.passport;
    if (stops.length === 0 && Array.isArray(saved.stops)) stops = saved.stops;
    if (!departure && saved.departure) departure = saved.departure;
  } catch (e) {}
  if (passport && !window.PASSPORTS[passport]) passport = null;
  return {
    passport: passport,
    stops: stops,
    departure: departure
  };
}
function readView() {
  try {
    return sessionStorage.getItem("atlas.globeStyle") || "globe3d";
  } catch (e) {
    return "globe3d";
  }
}
var itinFeeLabel = function itinFeeLabel(s) {
  return window.translateFeeText ? window.translateFeeText(s) : s;
};
function procDays(p, iso) {
  var fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.processingDays) return 0;
  var m = fee.processingDays.match(/(\d+)\s*(?:–|-|to)\s*(\d+)\s*(week|day|month)/i) || fee.processingDays.match(/(\d+)\s*(week|day|month)/i);
  if (!m) return 0;
  var n = parseInt(m[m.length - 2] || m[1], 10);
  var unit = m[m.length - 1].toLowerCase();
  return unit.startsWith("week") ? n * 7 : unit.startsWith("month") ? n * 30 : n;
}
function feeUSD(p, iso) {
  var fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.fee) return null;
  var m = String(fee.fee).match(/\$([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  var v = parseFloat(m[1].replace(/,/g, ""));
  return v > 0 ? v : null;
}
function fmtDate(d) {
  return d.toLocaleDateString(window.ATLAS_LANG || undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}
function ItineraryApp() {
  var init = loadInitial();
  var _useState = useState(init.passport),
    _useState2 = _slicedToArray(_useState, 2),
    passport = _useState2[0],
    setPassport = _useState2[1];
  var _useState3 = useState(init.stops),
    _useState4 = _slicedToArray(_useState3, 2),
    stops = _useState4[0],
    setStops = _useState4[1];
  var _useState5 = useState(init.departure),
    _useState6 = _slicedToArray(_useState5, 2),
    departure = _useState6[0],
    setDeparture = _useState6[1];
  var _useState7 = useState(readView),
    _useState8 = _slicedToArray(_useState7, 2),
    mode = _useState8[0],
    setModeState = _useState8[1];
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
    try {
      localStorage.setItem("atlas.itinerary", JSON.stringify({
        passport: passport,
        stops: stops,
        departure: departure
      }));
    } catch (e) {}
    try {
      if (passport) localStorage.setItem("atlas.passport", passport);
    } catch (e) {}
  }, [passport, stops, departure]);
  var plan = applyPlan(passport, stops, departure);
  var addStop = useCallback(function (iso) {
    setStops(function (prev) {
      return prev.includes(iso) ? prev : [].concat(_toConsumableArray(prev), [iso]);
    });
  }, []);
  var removeStop = useCallback(function (iso) {
    setStops(function (prev) {
      return prev.filter(function (s) {
        return s !== iso;
      });
    });
  }, []);
  var toggleStop = useCallback(function (iso) {
    setStops(function (prev) {
      return prev.includes(iso) ? prev.filter(function (s) {
        return s !== iso;
      }) : [].concat(_toConsumableArray(prev), [iso]);
    });
  }, []);
  var onCountryClick = useCallback(function (iso) {
    if (!window.PASSPORTS[iso] && !window.byIso2[iso]) return;
    if (!passport) {
      setPassport(iso);
      return;
    }
    if (iso === passport) return;
    toggleStop(iso);
  }, [passport, toggleStop]);
  var sequence = passport ? [passport].concat(_toConsumableArray(stops)) : stops;
  var arcs = [];
  for (var i = 0; i < sequence.length - 1; i++) arcs.push({
    from: sequence[i],
    to: sequence[i + 1]
  });
  var stopMarkers = stops.map(function (iso, i) {
    return {
      iso2: iso,
      label: i + 1
    };
  });
  var fillResolver = useCallback(function (iso2) {
    if (passport && iso2 === passport) return {
      color: "var(--self)"
    };
    if (stops.includes(iso2)) {
      var r = window.resolveStatus(passport, iso2);
      if (r.status === "ban") return {
        color: "url(#hatch-ban)"
      };
      return {
        color: STATUS_HEX[r.status] || STATUS_HEX.na
      };
    }
    return {
      color: "var(--land)"
    };
  }, [passport, stops]);
  var hoverRenderer = useCallback(function (hover) {
    var dest = window.byIso2[hover.iso2];
    if (!dest) return null;
    var isStop = stops.includes(hover.iso2);
    var isSelf = hover.iso2 === passport;
    var r = passport && isStop ? window.resolveStatus(passport, hover.iso2) : null;
    return React.createElement("div", {
      className: "hovercard overlay-card",
      style: {
        left: hover.x + 16,
        top: hover.y + 16,
        minWidth: 150
      }
    }, React.createElement("div", {
      className: "hovercard-title"
    }, React.createElement("span", {
      className: "flag"
    }, dest.flag), React.createElement("span", null, window.countryName(hover.iso2))), isSelf && React.createElement("div", {
      className: "hovercard-row hovercard-cap"
    }, window.t("itin.your_passport")), r && React.createElement("div", {
      className: "hovercard-row"
    }, React.createElement(Dot, {
      s: r.status
    }), React.createElement("span", null, statusLabel(r.status))), !isSelf && !isStop && React.createElement("div", {
      className: "hovercard-row hovercard-cap"
    }, "+ ", window.t("itin.add_destination")));
  }, [passport, stops]);
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
    passport: passport,
    mode: mode,
    fillResolver: fillResolver,
    hoverRenderer: hoverRenderer,
    arcs: arcs,
    stopMarkers: stopMarkers,
    onCountryClick: onCountryClick
  }), sequence.length === 0 && React.createElement("div", {
    className: "welcome"
  }, React.createElement("div", {
    className: "welcome-card overlay-card",
    style: {
      width: "min(320px, 100%)"
    }
  }, React.createElement("p", {
    className: "welcome-body",
    style: {
      margin: 0
    }
  }, window.t("itin.subtitle"))))), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("div", {
    className: "p-head-title"
  }, window.t("itin.title")), React.createElement("p", {
    className: "p-head-sub"
  }, window.t("itin.subtitle"))), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 1
  }, window.t("itin.your_passport")), React.createElement(CountryPicker, {
    value: passport,
    placeholder: window.t("picker.select_passport"),
    onPick: setPassport,
    isPassport: true
  })), passport && React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, window.t("itin.depart_label")), React.createElement(DepartureRow, {
    departure: departure,
    setDeparture: setDeparture,
    plan: plan
  })), passport && React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 3,
    aside: stops.length ? React.createElement("span", {
      className: "mono"
    }, stops.length) : null
  }, window.t("itin.add_destination")), React.createElement(StopsList, {
    passport: passport,
    stops: stops,
    onRemove: removeStop
  }), React.createElement(AddDestinationRow, {
    passport: passport,
    stops: stops,
    onAdd: addStop
  })), React.createElement(Summary, {
    passport: passport,
    stops: stops
  }), React.createElement(Reminders, {
    passport: passport,
    stops: stops,
    departure: departure,
    plan: plan
  }), React.createElement("footer", {
    className: "panel-foot"
  }, window.t("tmap.disclaimer"))));
}
function CountryPicker(_ref) {
  var value = _ref.value,
    placeholder = _ref.placeholder,
    exclude = _ref.exclude,
    onPick = _ref.onPick,
    isPassport = _ref.isPassport;
  var _useState9 = useState(false),
    _useState0 = _slicedToArray(_useState9, 2),
    open = _useState0[0],
    setOpen = _useState0[1];
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    q = _useState10[0],
    setQ = _useState10[1];
  var ref = useRef(null);
  useEffect(function () {
    if (!open) return;
    var onDown = function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return function () {
      return document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  var ex = exclude || new Set();
  var list = useMemo(function () {
    var ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(function (p) {
      return !ex.has(p.iso2);
    }).filter(function (p) {
      return !ql || p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql);
    }).slice(0, 80);
  }, [q, exclude]);
  var c = value ? window.byIso2[value] : null;
  return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative"
    }
  }, isPassport ? React.createElement("button", {
    type: "button",
    className: "pp-card",
    style: {
      paddingBottom: 2
    },
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, React.createElement("span", {
    className: "pp-doc",
    "aria-hidden": "true"
  }, "Passport \xB7 Pasaport \xB7 Passeport", React.createElement(IconCaret, null)), c ? React.createElement("span", {
    className: "pp-main"
  }, React.createElement("span", {
    className: "flag pp-flag",
    "aria-hidden": "true"
  }, c.flag), React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("span", {
    className: "pp-name",
    style: {
      display: "block"
    }
  }, window.countryName(value)), React.createElement("span", {
    className: "pp-meta",
    style: {
      display: "block"
    }
  }, value))) : React.createElement("span", {
    className: "pp-empty",
    style: {
      display: "block"
    }
  }, placeholder)) : React.createElement("button", {
    type: "button",
    className: "row-btn",
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, React.createElement("span", {
    className: "row-btn-label"
  }, placeholder), React.createElement(IconCaret, {
    className: open ? "is-flipped" : ""
  })), open && React.createElement("div", {
    className: "dd",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 20
    }
  }, React.createElement("input", {
    autoFocus: true,
    className: "field dd-search",
    placeholder: window.t("itin.search"),
    value: q,
    onChange: function onChange(e) {
      return setQ(e.target.value);
    }
  }), React.createElement("div", {
    className: "dd-list"
  }, list.map(function (p) {
    var _window$byIso2$p$iso;
    return React.createElement("button", {
      key: p.iso2,
      type: "button",
      className: "dd-item",
      onClick: function onClick() {
        onPick(p.iso2);
        setOpen(false);
        setQ("");
      }
    }, React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$p$iso = window.byIso2[p.iso2]) === null || _window$byIso2$p$iso === void 0 ? void 0 : _window$byIso2$p$iso.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(p.iso2)), React.createElement("span", {
      className: "dd-code"
    }, p.iso2));
  }))));
}
function AddDestinationRow(_ref2) {
  var passport = _ref2.passport,
    stops = _ref2.stops,
    onAdd = _ref2.onAdd;
  if (!passport) return null;
  var exclude = new Set([passport].concat(_toConsumableArray(stops)));
  return React.createElement(CountryPicker, {
    value: null,
    placeholder: "+ " + window.t("itin.add_destination"),
    exclude: exclude,
    onPick: onAdd
  });
}
function StopsList(_ref3) {
  var passport = _ref3.passport,
    stops = _ref3.stops,
    onRemove = _ref3.onRemove;
  if (!passport) return null;
  if (stops.length === 0) {
    return React.createElement("div", {
      className: "box box-dashed p-hint",
      style: {
        marginTop: 0
      }
    }, window.t("itin.no_stops"));
  }
  return React.createElement("ol", {
    className: "stops"
  }, stops.map(function (iso, idx) {
    var _window$byIso2$iso;
    var r = window.resolveStatus(passport, iso);
    var fee = window.visaFee && window.visaFee(passport, iso);
    var noApp = r.status === "vf" || r.status === "idc";
    var feeText = fee && fee.fee ? itinFeeLabel(fee.fee) : noApp ? window.t("itin.fee_free") : r.status === "self" ? "—" : window.t("itin.fee_missing");
    var proc = fee && fee.processingDays ? itinFeeLabel(fee.processingDays) : noApp || r.status === "self" ? window.t("itin.no_app_needed") : "";
    return React.createElement("li", {
      key: iso,
      className: "stop",
      style: {
        "--tone": "var(--".concat(r.status, ", var(--rule-strong))")
      }
    }, React.createElement("span", {
      className: "stop-n"
    }, idx + 1), React.createElement("span", {
      className: "flag",
      style: {
        fontSize: 20
      }
    }, (_window$byIso2$iso = window.byIso2[iso]) === null || _window$byIso2$iso === void 0 ? void 0 : _window$byIso2$iso.flag), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      className: "stop-name"
    }, window.countryName(iso)), React.createElement("span", {
      className: "stop-meta"
    }, statusLabel(r.status), feeText ? " · " + feeText : "", proc ? " · " + proc : "")), React.createElement("button", {
      type: "button",
      className: "icon-btn",
      onClick: function onClick() {
        return onRemove(iso);
      },
      title: window.t("itin.remove"),
      "aria-label": window.t("itin.remove")
    }, React.createElement(IconClose, null)));
  }));
}
function applyPlan(passport, stops, departure) {
  if (!passport || !stops.length || !departure) return null;
  var dep = new Date(departure + "T00:00:00Z");
  if (isNaN(dep)) return null;
  var today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (dep - today < 0) return {
    past: true,
    items: [],
    late: []
  };
  var items = stops.map(function (iso) {
    var r = window.resolveStatus(passport, iso);
    if (r.status === "vf" || r.status === "self") return null;
    var proc = procDays(passport, iso) || 14;
    var lead = proc + 7;
    var applyBy = new Date(dep.getTime() - lead * 86400000);
    return {
      iso: iso,
      status: r.status,
      applyBy: applyBy,
      lead: lead,
      proc: proc,
      overdue: applyBy < today
    };
  }).filter(Boolean).sort(function (a, b) {
    return a.applyBy - b.applyBy;
  });
  var earliest = items.length ? items[0].applyBy : null;
  return {
    dep: dep,
    today: today,
    items: items,
    late: items.filter(function (i) {
      return i.overdue;
    }),
    earliest: earliest,
    earliestDays: earliest ? Math.ceil((earliest - today) / 86400000) : null
  };
}
function DepartureRow(_ref4) {
  var departure = _ref4.departure,
    setDeparture = _ref4.setDeparture,
    plan = _ref4.plan;
  var dep = departure ? new Date(departure + "T00:00:00Z") : null;
  var hint = "";
  if (dep && !isNaN(dep)) {
    var today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    var days = Math.floor((dep - today) / 86400000);
    hint = days < 0 ? window.t("itin.date_past") : window.t("itin.days_until", {
      n: days
    });
  }
  var late = plan && plan.late ? plan.late : [];
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    type: "date",
    className: "field",
    style: {
      width: "auto"
    },
    value: departure,
    onChange: function onChange(e) {
      return setDeparture(e.target.value);
    },
    "aria-label": window.t("itin.depart_label")
  }), departure && React.createElement("button", {
    type: "button",
    className: "btn btn-quiet",
    onClick: function onClick() {
      return setDeparture("");
    }
  }, window.t("itin.depart_clear")), hint && React.createElement("span", {
    className: "p-hint",
    style: {
      margin: 0
    }
  }, hint)), !departure && React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "8px 0 0"
    }
  }, window.t("itin.depart_hint")), late.length > 0 && React.createElement("div", {
    className: "note note-risk",
    style: {
      display: "block",
      marginTop: 10
    },
    role: "alert"
  }, React.createElement("div", {
    className: "note-k"
  }, window.t("itin.late_title")), React.createElement("div", {
    className: "note-s"
  }, window.t("itin.late_body", {
    names: late.map(function (i) {
      return window.countryName(i.iso);
    }).join(", ")
  }))));
}
function Summary(_ref5) {
  var passport = _ref5.passport,
    stops = _ref5.stops;
  if (!passport || stops.length === 0) return null;
  var totalFee = 0,
    unknown = 0,
    maxProc = 0;
  var visaStops = [];
  var _iterator = _createForOfIteratorHelper(stops),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var iso = _step.value;
      var r = window.resolveStatus(passport, iso);
      if (r.status === "vf" || r.status === "self") continue;
      visaStops.push({
        iso: iso,
        status: r.status
      });
      var usd = feeUSD(passport, iso);
      if (usd) totalFee += usd;else unknown++;
      var pd = procDays(passport, iso);
      if (pd > maxProc) maxProc = pd;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var order = visaStops.slice().sort(function (a, b) {
    return procDays(passport, b.iso) - procDays(passport, a.iso);
  });
  var totalStr = totalFee > 0 ? "$".concat(totalFee.toFixed(0)) : "—";
  var procStr = maxProc > 0 ? "".concat(maxProc, "d") : "—";
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 4
  }, window.t("itin.order_title")), React.createElement("div", {
    className: "stats3",
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, visaStops.length), React.createElement("div", {
    className: "l"
  }, window.t("itin.visas_needed"))), React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, totalStr), React.createElement("div", {
    className: "l"
  }, window.t("itin.est_cost"))), React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, procStr), React.createElement("div", {
    className: "l"
  }, window.t("itin.lead_time")))), order.length === 0 ? React.createElement("p", {
    className: "p-hint"
  }, window.t("itin.no_visas_needed")) : React.createElement("ol", {
    className: "apply-order"
  }, order.map(function (s) {
    var _window$byIso2$s$iso;
    var fee = window.visaFee && window.visaFee(passport, s.iso);
    return React.createElement("li", {
      key: s.iso
    }, React.createElement("strong", null, React.createElement("span", {
      className: "flag"
    }, (_window$byIso2$s$iso = window.byIso2[s.iso]) === null || _window$byIso2$s$iso === void 0 ? void 0 : _window$byIso2$s$iso.flag), " ", window.countryName(s.iso)), React.createElement("span", null, " \xB7 ", statusLabel(s.status), fee && fee.processingDays ? " · " + itinFeeLabel(fee.processingDays) : ""));
  })), unknown > 0 && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "8px 0 0"
    }
  }, window.t("itin.missing_fee", {
    n: unknown
  })), maxProc > 0 && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "4px 0 0"
    }
  }, window.t("itin.start_buffer", {
    n: maxProc
  })), React.createElement("button", {
    type: "button",
    className: "btn btn-block",
    style: {
      marginTop: 10
    },
    onClick: function onClick() {
      return window.print();
    }
  }, window.t("itin.print")));
}
function Reminders(_ref6) {
  var passport = _ref6.passport,
    stops = _ref6.stops,
    departure = _ref6.departure,
    plan = _ref6.plan;
  var _useState11 = useState(""),
    _useState12 = _slicedToArray(_useState11, 2),
    shareMsg = _useState12[0],
    setShareMsg = _useState12[1];
  if (!plan || plan.past) return null;
  var items = plan.items;
  if (items.length === 0) {
    return React.createElement("div", {
      className: "note note-ok",
      style: {
        display: "block"
      }
    }, React.createElement("div", {
      className: "note-k"
    }, window.t("itin.good_news")), React.createElement("div", {
      className: "note-s"
    }, window.t("itin.good_news_body", {
      name: window.countryName(passport)
    })));
  }
  var earliest = plan.earliest,
    earliestDays = plan.earliestDays;
  var downloadICS = function downloadICS() {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//travelnow.info//Visa Reminder//EN", "CALSCALE:GREGORIAN"];
    var stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    var _iterator2 = _createForOfIteratorHelper(items),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var it = _step2.value;
        var ymd = it.applyBy.toISOString().slice(0, 10).replace(/-/g, "");
        var next = new Date(it.applyBy.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        var nm = window.countryName(it.iso);
        lines.push("BEGIN:VEVENT", "UID:atlas-visa-".concat(it.iso, "-").concat(ymd, "@travelnow.info"), "DTSTAMP:".concat(stamp), "DTSTART;VALUE=DATE:".concat(ymd), "DTEND;VALUE=DATE:".concat(next), "SUMMARY:Apply for ".concat(nm, " visa"), "DESCRIPTION:Submit your ".concat(nm, " visa application today. Processing ~").concat(it.proc, " days; departure ").concat(departure, "."), "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Apply for ".concat(nm, " visa tomorrow."), "END:VALARM", "END:VEVENT");
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    lines.push("END:VCALENDAR");
    var blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "atlas-visa-reminders.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      return URL.revokeObjectURL(url);
    }, 5000);
  };
  var copyShare = function copyShare() {
    var u = new URL(location.href);
    u.search = "";
    if (passport) u.searchParams.set("p", passport);
    if (stops.length) u.searchParams.set("stops", stops.join(","));
    if (departure) u.searchParams.set("d", departure);
    navigator.clipboard.writeText(u.toString()).then(function () {
      setShareMsg(window.t("itin.copied"));
      setTimeout(function () {
        return setShareMsg("");
      }, 2000);
    });
  };
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 5
  }, window.t("itin.reminders_title")), React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "0 0 8px",
      color: "var(--ink-2)"
    }
  }, earliestDays <= 0 ? window.t("itin.past_window") : window.t("itin.start_by", {
    date: fmtDate(earliest),
    n: earliestDays
  })), React.createElement("div", {
    className: "members",
    style: {
      marginTop: 0
    }
  }, items.map(function (it) {
    var _window$byIso2$it$iso;
    return React.createElement("div", {
      key: it.iso,
      className: "member"
    }, React.createElement("span", {
      className: "flag",
      style: {
        fontSize: 18
      }
    }, (_window$byIso2$it$iso = window.byIso2[it.iso]) === null || _window$byIso2$it$iso === void 0 ? void 0 : _window$byIso2$it$iso.flag), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      className: "stop-name"
    }, window.countryName(it.iso)), React.createElement("span", {
      className: "stop-meta"
    }, window.t("itin.proc_lead", {
      proc: it.proc,
      lead: it.lead
    }))), React.createElement("span", {
      style: {
        textAlign: "end"
      }
    }, React.createElement("span", {
      className: "stop-name",
      style: {
        fontSize: 12.5,
        color: it.overdue ? "var(--vr)" : "var(--ink)"
      }
    }, it.overdue ? window.t("itin.apply_asap") : window.t("itin.apply_by")), React.createElement("span", {
      className: "stop-meta"
    }, fmtDate(it.applyBy))));
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: downloadICS
  }, window.t("itin.dl_ics")), React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: copyShare
  }, window.t("itin.copy_url")), shareMsg && React.createElement("span", {
    className: "p-hint",
    style: {
      margin: 0,
      color: "var(--vf)"
    }
  }, shareMsg)));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(ItineraryApp, null));

// Generated from components/itinerary-app.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useRef = _React.useRef,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback;
var pt = function pt(key, vars) {
  return window.t("itin." + key, vars);
};
function plReadPassports() {
  var main = "";
  try {
    main = localStorage.getItem("atlas.passport") || "";
    try {
      var j = JSON.parse(main);
      if (typeof j === "string") main = j;
    } catch (e) {}
  } catch (e) {}
  main = String(main).toUpperCase();
  if (!window.PASSPORTS[main]) main = "";
  var extra = [];
  try {
    var a = JSON.parse(localStorage.getItem("atlas.passports") || "[]");
    if (Array.isArray(a)) extra = a.map(function (x) {
      return String(x).toUpperCase();
    });
  } catch (e) {}
  var out = main ? [main] : [];
  extra.forEach(function (x) {
    if (window.PASSPORTS[x] && !out.includes(x)) out.push(x);
  });
  return out.slice(0, 3);
}
function plReadList(key) {
  try {
    var a = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(a) ? a.map(function (x) {
      return String(x).toUpperCase();
    }).filter(function (x) {
      return window.byIso2[x];
    }) : [];
  } catch (e) {
    return [];
  }
}
function plReadExpiry() {
  try {
    var v = localStorage.getItem("atlas.passport.expiry") || "";
    return /^\d{4}-\d{2}$/.test(v) ? v : "";
  } catch (e) {
    return "";
  }
}
function plReadSchengenPast() {
  try {
    var a = JSON.parse(localStorage.getItem("atlas.schengen.trips") || "[]");
    return Array.isArray(a) ? a.filter(function (x) {
      return x && /^\d{4}-\d{2}-\d{2}$/.test(x.entry) && /^\d{4}-\d{2}-\d{2}$/.test(x.exit);
    }).map(function (x) {
      return {
        entry: x.entry,
        exit: x.exit
      };
    }) : [];
  } catch (e) {
    return [];
  }
}
function plFromUrl() {
  try {
    var q = new URLSearchParams(location.search);
    var stops = (q.get("stops") || "").split(",").map(function (s) {
      return s.trim().toUpperCase();
    }).filter(function (s) {
      return /^[A-Z]{2}$/.test(s);
    });
    var p = (q.get("p") || "").toUpperCase();
    var d = q.get("d") || "";
    if (!stops.length) return {
      passport: window.PASSPORTS[p] ? p : "",
      trip: null
    };
    var t = window.TRIPS_CORE.cleanTrip({
      stops: stops
    });
    if (t.stops.length && /^\d{4}-\d{2}-\d{2}$/.test(d)) t.stops[0].arrive = d;
    return {
      passport: window.PASSPORTS[p] ? p : "",
      trip: t.stops.length ? t : null
    };
  } catch (e) {
    return {
      passport: "",
      trip: null
    };
  }
}
function plPersist(state, passport) {
  try {
    var o = window.TRIPS_CORE.serialize(state, passport);
    localStorage.setItem("atlas.trips", o.trips);
    if (o.itinerary) localStorage.setItem("atlas.itinerary", o.itinerary);
  } catch (e) {}
}
function plLoadState() {
  var raw = ["", ""];
  try {
    raw = [localStorage.getItem("atlas.trips"), localStorage.getItem("atlas.itinerary") || sessionStorage.getItem("atlas.itinerary")];
  } catch (e) {}
  var state = window.TRIPS_CORE.load(raw[0], raw[1]);
  var migrated = !raw[0] && state.trips.length > 0;
  var url = plFromUrl();
  var importedPassport = "";
  if (url.passport) importedPassport = url.passport;
  if (url.trip) {
    var key = function key(t) {
      return t.stops.map(function (s) {
        return s.iso;
      }).join(",");
    };
    var same = state.trips.find(function (t) {
      return key(t) === key(url.trip);
    });
    if (same) {
      state = _objectSpread(_objectSpread({}, state), {}, {
        active: same.id
      });
      if (url.trip.stops[0].arrive && !same.stops[0].arrive) same.stops[0].arrive = url.trip.stops[0].arrive;
    } else if (state.trips.length < window.TRIPS_CORE.LIMITS.trips) {
      state = _objectSpread(_objectSpread({}, state), {}, {
        trips: [].concat(_toConsumableArray(state.trips), [url.trip]),
        active: url.trip.id
      });
    } else {
      state = _objectSpread(_objectSpread({}, state), {}, {
        trips: [].concat(_toConsumableArray(state.trips.slice(0, -1)), [url.trip]),
        active: url.trip.id
      });
    }
    return {
      state: state,
      importedPassport: importedPassport,
      dirty: true
    };
  }
  return {
    state: state,
    importedPassport: importedPassport,
    dirty: migrated
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
function plFmtISO(s) {
  if (!s) return "";
  var d = new Date(s + "T00:00:00Z");
  return isNaN(d) ? s : d.toLocaleDateString(window.ATLAS_LANG || undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
}
function plDiff(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
function plPrefix() {
  return window.ATLAS_LANG === "tr" ? "/tr" : "";
}
var PL_ORDER = ["self", "idc", "vf", "eta", "ev", "voa", "vr", "ban"];
function plRank(s) {
  var i = PL_ORDER.indexOf(s);
  return i < 0 ? 99 : i;
}
function plBest(pps, iso) {
  var best = null;
  var _iterator = _createForOfIteratorHelper(pps),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var p = _step.value;
      if (p === iso) return {
        p: p,
        r: {
          status: "self",
          days: null
        }
      };
      var r = window.resolveStatus(p, iso);
      if (!best || plRank(r.status) < plRank(best.r.status)) best = {
        p: p,
        r: r
      };
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return best;
}
var plNeedsApp = function plNeedsApp(s) {
  return s === "eta" || s === "ev" || s === "voa" || s === "vr";
};
function plAdvisory(iso) {
  var A = window.TRAVEL_ADVISORIES;
  return A && A.countries && A.countries[iso] ? A.countries[iso] : null;
}
function plTransit(pps, code) {
  var c = String(code || "").toUpperCase();
  if (!c) return null;
  var ap = (window.AIRPORTS || {})[c];
  if (!ap) return {
    code: c,
    unknown: true,
    loaded: !!window.AIRPORTS
  };
  if (!window.transitLeg) return {
    code: c,
    unknown: true,
    loaded: true
  };
  var rk = {
    self: -1,
    free: 0,
    twov: 1,
    vr: 2
  };
  var best = null;
  var _iterator2 = _createForOfIteratorHelper(pps),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var p = _step2.value;
      var leg = window.transitLeg(p, null, c, null);
      if (!leg || leg.error) continue;
      var k = rk[leg.status.status] != null ? rk[leg.status.status] : 3;
      if (!best || k < best.k) best = {
        p: p,
        leg: leg,
        k: k
      };
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return best ? {
    code: c,
    city: ap[1],
    iso: ap[0],
    p: best.p,
    leg: best.leg
  } : {
    code: c,
    city: ap[1],
    iso: ap[0],
    none: true
  };
}
function plApplyPlan(entries, firstArrive) {
  var today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  var items = [];
  var anyDate = false;
  entries.forEach(function (e) {
    if (!e.best || !plNeedsApp(e.best.r.status)) return;
    var arrive = e.stop.arrive || firstArrive;
    if (!arrive) return;
    anyDate = true;
    var dep = new Date(arrive + "T00:00:00Z");
    if (isNaN(dep) || dep < today) return;
    var proc = procDays(e.best.p, e.stop.iso) || 14;
    var lead = proc + 7;
    var applyBy = new Date(dep.getTime() - lead * 86400000);
    items.push({
      iso: e.stop.iso,
      status: e.best.r.status,
      arrive: arrive,
      applyBy: applyBy,
      lead: lead,
      proc: proc,
      overdue: applyBy < today
    });
  });
  items.sort(function (a, b) {
    return a.applyBy - b.applyBy;
  });
  if (!anyDate) return null;
  var earliest = items.length ? items[0].applyBy : null;
  return {
    today: today,
    items: items,
    late: items.filter(function (i) {
      return i.overdue;
    }),
    earliest: earliest,
    earliestDays: earliest ? Math.ceil((earliest - today) / 86400000) : null
  };
}
function PartnerSlot(_ref) {
  var kind = _ref.kind,
    status = _ref.status,
    dest = _ref.dest;
  var list = window.affiliatesFor && window.affiliatesFor(status || "*", dest || "") || [];
  var mine = list.filter(function (a) {
    return Array.isArray(a.kinds) && a.kinds.includes(kind) && a.href;
  });
  if (!mine.length) return null;
  return React.createElement("div", {
    className: "pl-partner"
  }, mine.map(function (a) {
    return React.createElement("a", {
      key: a.id,
      className: "pl-partner-link",
      href: a.href,
      target: "_blank",
      rel: "sponsored noopener"
    }, React.createElement("span", {
      className: "pl-sponsored"
    }, pt("sponsored")), React.createElement("span", {
      className: "pl-partner-label"
    }, a.label), React.createElement("span", {
      className: "pl-partner-blurb"
    }, a.blurb));
  }));
}
function PlSrc(_ref2) {
  var url = _ref2.url,
    label = _ref2.label;
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return React.createElement("a", {
    className: "link-quiet",
    href: url,
    target: "_blank",
    rel: "noopener nofollow"
  }, label || pt("source"));
  return React.createElement("span", {
    className: "p-fine"
  }, pt("source_is", {
    s: url
  }));
}
function PlRow(_ref3) {
  var k = _ref3.k,
    children = _ref3.children;
  return React.createElement("div", {
    className: "pl-row"
  }, React.createElement("span", {
    className: "pl-k"
  }, k), React.createElement("span", {
    className: "pl-v"
  }, children));
}
var plNoData = function plNoData() {
  return React.createElement("span", {
    className: "pl-nodata"
  }, pt("no_data"));
};
function plChecklist(e, ctx) {
  var iso = e.stop.iso;
  if (!e.best || e.best.r.status === "self") return [];
  var out = [];
  var st = e.best.r.status;
  var rule = window.PASSPORT_VALIDITY ? window.PASSPORT_VALIDITY[iso] : undefined;
  var pv;
  if (typeof rule !== "number") pv = pt("ck_pv_nodata");else {
    var ruleText = rule === 6 ? window.t("validity.rule6") : rule === 3 ? window.t("validity.rule3") : rule === 0 ? window.t("validity.rule0") : pt("ck_pv_n", {
      n: rule
    });
    var chk = ctx.expiry && e.stop.leave && window.passportValidityCheck ? window.passportValidityCheck(iso, {
      expiry: ctx.expiry + "-01",
      exit: e.stop.leave
    }) : null;
    if (chk && chk.ok != null) pv = ruleText + ". " + (chk.ok ? pt("ck_pv_ok") : pt("ck_pv_short")) + " " + pt("ck_airline");else pv = ruleText + ". " + pt("ck_airline");
  }
  out.push({
    key: iso + ":passport",
    text: pt("ck_passport"),
    detail: pv,
    href: "/passport-validity/"
  });
  if (plNeedsApp(st)) {
    var it = ctx.plan && ctx.plan.items.find(function (i) {
      return i.iso === iso;
    });
    var text = st === "ev" ? pt("ck_evisa") : st === "eta" ? pt("ck_eta") : st === "voa" ? pt("ck_voa") : pt("ck_visa");
    var detail = "";
    if (st !== "voa") detail = it ? pt("ck_apply_by", {
      date: plFmtISO(it.applyBy.toISOString().slice(0, 10)),
      n: it.proc
    }) : pt("ck_add_date");
    out.push({
      key: iso + ":visa",
      text: text,
      detail: detail
    });
  }
  var et = window.etiasStatus ? window.etiasStatus(e.best.p, iso) : null;
  if (et && et.kind === "required") out.push({
    key: iso + ":etias",
    text: pt("ck_etias"),
    detail: pt("ck_etias_d"),
    href: window.ETIAS && window.ETIAS.applicationUrl
  });
  if (iso === "US" && window.estaEligible && window.estaEligible(e.best.p) && (st === "eta" || st === "ev")) out.push({
    key: iso + ":esta",
    text: pt("ck_esta"),
    detail: pt("ck_esta_d"),
    href: window.ESTA && window.ESTA.source
  });
  out.push({
    key: iso + ":insurance",
    text: pt("ck_insurance"),
    partner: "insurance"
  });
  out.push({
    key: iso + ":flight",
    text: pt("ck_flight"),
    partner: "flights"
  });
  out.push({
    key: iso + ":stay",
    text: pt("ck_stay"),
    partner: "hotels"
  });
  if (e.stop.via && e.transit && e.transit.leg && (e.transit.leg.status.status === "vr" || e.transit.leg.status.status === "twov") && !e.transit.leg.status.generic) {
    out.push({
      key: iso + ":transit",
      text: pt("ck_transit", {
        code: e.stop.via
      }),
      detail: e.transit.leg.status.status === "vr" ? pt("tr_vr") : pt("tr_twov", {
        h: e.transit.leg.status.twovHours || ""
      })
    });
  }
  out.push({
    key: iso + ":docs",
    text: pt("ck_docs"),
    detail: pt("ck_docs_d")
  });
  var adv = plAdvisory(iso);
  if (adv && adv.level >= 3) out.push({
    key: iso + ":advisory",
    text: pt("ck_advisory", {
      n: adv.level
    }),
    detail: pt("ck_advisory_d")
  });
  return out;
}
var plLoading = {};
function plLoad(src, done) {
  if (plLoading[src]) {
    if (plLoading[src] === "ok") done();else plLoading[src].push(done);
    return;
  }
  plLoading[src] = [done];
  var s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.onload = function () {
    var q = plLoading[src];
    plLoading[src] = "ok";
    q.forEach(function (f) {
      return f();
    });
  };
  s.onerror = function () {
    delete plLoading[src];
  };
  document.head.appendChild(s);
}
var PL_STAMP = "?v=20261120d";
var plLoadAirports = function plLoadAirports(cb) {
  if (window.AIRPORTS) cb();else plLoad("/data/airports.js" + PL_STAMP, cb);
};
var plLoadAdvisories = function plLoadAdvisories(cb) {
  if (window.TRAVEL_ADVISORIES) cb();else plLoad("/data/travel-advisories.js" + PL_STAMP, cb);
};
function plEnsure(s) {
  if (s.trips.length) return s;
  var t = window.TRIPS_CORE.cleanTrip({});
  return _objectSpread(_objectSpread({}, s), {}, {
    trips: [t],
    active: t.id
  });
}
function ItineraryApp() {
  var _useState = useState(plLoadState),
    _useState2 = _slicedToArray(_useState, 1),
    boot = _useState2[0];
  var _useState3 = useState(boot.state),
    _useState4 = _slicedToArray(_useState3, 2),
    state = _useState4[0],
    setState = _useState4[1];
  var stateRef = useRef(boot.state);
  var _useState5 = useState(function () {
      if (boot.importedPassport) {
        try {
          localStorage.setItem("atlas.passport", boot.importedPassport);
        } catch (e) {}
      }
      return plReadPassports();
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    pps = _useState6[0],
    setPps = _useState6[1];
  var _useState7 = useState(plReadExpiry),
    _useState8 = _slicedToArray(_useState7, 2),
    expiry = _useState8[0],
    setExpiryState = _useState8[1];
  var _useState9 = useState(function () {
      return plReadList("atlas.watchlist");
    }),
    _useState0 = _slicedToArray(_useState9, 2),
    watch = _useState0[0],
    setWatch = _useState0[1];
  var _useState1 = useState(0),
    _useState10 = _slicedToArray(_useState1, 2),
    setTick = _useState10[1];
  var bump = useCallback(function () {
    return setTick(function (x) {
      return x + 1;
    });
  }, []);
  var _useState11 = useState(readView),
    _useState12 = _slicedToArray(_useState11, 2),
    mode = _useState12[0],
    setModeState = _useState12[1];
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
    if (boot.dirty) plPersist(stateRef.current, plReadPassports()[0] || "");
  }, []);
  useEffect(function () {
    var id = setTimeout(function () {
      return plLoadAdvisories(bump);
    }, 400);
    return function () {
      return clearTimeout(id);
    };
  }, []);
  useEffect(function () {
    var reload = function reload() {
      try {
        var s = window.TRIPS_CORE.load(localStorage.getItem("atlas.trips"), localStorage.getItem("atlas.itinerary"));
        stateRef.current = s;
        setState(s);
      } catch (e) {}
      setPps(plReadPassports());
      setExpiryState(plReadExpiry());
      setWatch(plReadList("atlas.watchlist"));
    };
    var onStorage = function onStorage(e) {
      if (!e.key || /^atlas\.(trips|itinerary|passport|passports|passport\.expiry|watchlist)$/.test(e.key)) reload();
    };
    var onWatch = function onWatch() {
      return setWatch(plReadList("atlas.watchlist"));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("atlas:watchlist", onWatch);
    return function () {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("atlas:watchlist", onWatch);
    };
  }, []);
  var update = useCallback(function (fn) {
    var next = fn(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
    plPersist(next, plReadPassports()[0] || "");
  }, []);
  var updTrip = useCallback(function (fn) {
    return update(function (s0) {
      var s = plEnsure(s0);
      return _objectSpread(_objectSpread({}, s), {}, {
        trips: s.trips.map(function (t) {
          return t.id === s.active ? _objectSpread(_objectSpread({}, fn(t)), {}, {
            updated: Date.now()
          }) : t;
        })
      });
    });
  }, [update]);
  var trip = state.trips.find(function (t) {
    return t.id === state.active;
  }) || null;
  var stops = trip ? trip.stops : [];
  var LIM = window.TRIPS_CORE.LIMITS;
  var addStop = useCallback(function (iso) {
    return updTrip(function (t) {
      return t.stops.length >= LIM.stops || t.stops.some(function (s) {
        return s.iso === iso;
      }) ? t : _objectSpread(_objectSpread({}, t), {}, {
        stops: [].concat(_toConsumableArray(t.stops), [{
          iso: iso,
          arrive: "",
          leave: "",
          via: ""
        }])
      });
    });
  }, [updTrip]);
  var removeStop = useCallback(function (i) {
    return updTrip(function (t) {
      return _objectSpread(_objectSpread({}, t), {}, {
        stops: t.stops.filter(function (_, j) {
          return j !== i;
        })
      });
    });
  }, [updTrip]);
  var toggleStop = useCallback(function (iso) {
    return updTrip(function (t) {
      return t.stops.some(function (s) {
        return s.iso === iso;
      }) ? _objectSpread(_objectSpread({}, t), {}, {
        stops: t.stops.filter(function (s) {
          return s.iso !== iso;
        })
      }) : t.stops.length >= LIM.stops ? t : _objectSpread(_objectSpread({}, t), {}, {
        stops: [].concat(_toConsumableArray(t.stops), [{
          iso: iso,
          arrive: "",
          leave: "",
          via: ""
        }])
      });
    });
  }, [updTrip]);
  var patchStop = useCallback(function (i, patch) {
    return updTrip(function (t) {
      return _objectSpread(_objectSpread({}, t), {}, {
        stops: t.stops.map(function (s, j) {
          return j === i ? _objectSpread(_objectSpread({}, s), patch) : s;
        })
      });
    });
  }, [updTrip]);
  var moveStop = useCallback(function (i, to) {
    return updTrip(function (t) {
      return _objectSpread(_objectSpread({}, t), {}, {
        stops: window.TRIPS_CORE.move(t.stops, i, to)
      });
    });
  }, [updTrip]);
  var toggleDone = useCallback(function (key) {
    return updTrip(function (t) {
      var done = _objectSpread({}, t.done);
      if (done[key]) delete done[key];else done[key] = 1;
      return _objectSpread(_objectSpread({}, t), {}, {
        done: done
      });
    });
  }, [updTrip]);
  var setMainPassport = useCallback(function (iso) {
    try {
      localStorage.setItem("atlas.passport", iso);
    } catch (e) {}
    setPps(plReadPassports());
    if (stateRef.current.trips.length) plPersist(stateRef.current, iso);
  }, []);
  var setExpiry = function setExpiry(v) {
    setExpiryState(v);
    try {
      if (v) localStorage.setItem("atlas.passport.expiry", v);else localStorage.removeItem("atlas.passport.expiry");
    } catch (e) {}
  };
  var onCountryClick = useCallback(function (iso) {
    if (!window.PASSPORTS[iso] && !window.byIso2[iso]) return;
    if (!pps.length) {
      if (window.PASSPORTS[iso]) setMainPassport(iso);
      return;
    }
    if (pps.includes(iso)) return;
    toggleStop(iso);
  }, [pps, toggleStop, setMainPassport]);
  var from = trip && trip.from.country ? trip.from.country : pps[0] || "";
  var sequence = from ? [from].concat(_toConsumableArray(stops.map(function (s) {
    return s.iso;
  }))) : stops.map(function (s) {
    return s.iso;
  });
  var arcs = [];
  for (var i = 0; i < sequence.length - 1; i++) arcs.push({
    from: sequence[i],
    to: sequence[i + 1]
  });
  var stopMarkers = stops.map(function (s, i) {
    return {
      iso2: s.iso,
      label: i + 1
    };
  });
  var stopIsos = stops.map(function (s) {
    return s.iso;
  }).join(",");
  var fillResolver = useCallback(function (iso2) {
    if (pps.includes(iso2)) return {
      color: "var(--self)"
    };
    if (stopIsos.split(",").includes(iso2)) {
      var b = plBest(pps, iso2);
      var st = b ? b.r.status : "na";
      if (st === "ban") return {
        color: "url(#hatch-ban)"
      };
      return {
        color: STATUS_HEX[st] || STATUS_HEX.na
      };
    }
    return {
      color: "var(--land)"
    };
  }, [pps, stopIsos]);
  var hoverRenderer = useCallback(function (hover) {
    var dest = window.byIso2[hover.iso2];
    if (!dest) return null;
    var isStop = stopIsos.split(",").includes(hover.iso2);
    var isSelf = pps.includes(hover.iso2);
    var b = isStop && pps.length ? plBest(pps, hover.iso2) : null;
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
    }, pt("your_passport")), b && React.createElement("div", {
      className: "hovercard-row"
    }, React.createElement(Dot, {
      s: b.r.status
    }), React.createElement("span", null, statusLabel(b.r.status))), !isSelf && !isStop && React.createElement("div", {
      className: "hovercard-row hovercard-cap"
    }, "+ ", pt("add_destination")));
  }, [pps, stopIsos]);
  var entries = stops.map(function (stop, i) {
    return {
      stop: stop,
      i: i,
      best: pps.length ? plBest(pps, stop.iso) : null,
      transit: stop.via ? plTransit(pps, stop.via) : null
    };
  });
  var firstArrive = (stops.find(function (s) {
    return s.arrive;
  }) || {}).arrive || "";
  var plan = pps.length ? plApplyPlan(entries, stops[0] && stops[0].arrive ? stops[0].arrive : firstArrive) : null;
  var ctx = {
    expiry: expiry,
    plan: plan
  };
  var lists = entries.map(function (e) {
    return plChecklist(e, ctx);
  });
  var done = trip ? trip.done : {};
  var needAirports = stops.some(function (s) {
    return s.via;
  });
  useEffect(function () {
    if (needAirports) plLoadAirports(bump);
  }, [needAirports]);
  return React.createElement("div", {
    className: "layout"
  }, React.createElement(Masthead, {
    theme: theme,
    onTheme: setTheme
  }), React.createElement("div", {
    className: "globe-stage"
  }, React.createElement(Globe, {
    passport: pps[0] || null,
    mode: mode,
    onView: setMode,
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
  }, pt("subtitle"))))), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("div", {
    className: "p-head-title"
  }, pt("title")), React.createElement("p", {
    className: "p-head-sub"
  }, pt("subtitle"))), React.createElement(PlPassports, {
    pps: pps,
    onPick: setMainPassport
  }), pps.length > 0 && React.createElement(PlTrip, {
    state: state,
    trip: trip,
    update: update,
    updTrip: updTrip,
    expiry: expiry,
    setExpiry: setExpiry,
    bump: bump
  }), pps.length > 0 && React.createElement(PlStops, {
    stops: stops,
    entries: entries,
    pps: pps,
    watch: watch,
    onAdd: addStop,
    onRemove: removeStop,
    onPatch: patchStop,
    onMove: moveStop
  }), pps.length > 0 && stops.length > 0 && React.createElement(PlRules, {
    entries: entries,
    pps: pps
  }), pps.length > 0 && stops.length > 0 && React.createElement(PlSchengen, {
    entries: entries
  }), pps.length > 0 && stops.length > 0 && React.createElement(PlChecklist, {
    entries: entries,
    lists: lists,
    done: done,
    onToggle: toggleDone
  }), pps.length > 0 && stops.length > 0 && React.createElement(PlSummary, {
    trip: trip,
    entries: entries,
    lists: lists,
    done: done,
    plan: plan,
    pps: pps,
    from: from
  }), React.createElement(PlSignIn, null), React.createElement("footer", {
    className: "panel-foot"
  }, window.t("tmap.disclaimer"))));
}
function CountryPicker(_ref4) {
  var value = _ref4.value,
    placeholder = _ref4.placeholder,
    exclude = _ref4.exclude,
    onPick = _ref4.onPick,
    isPassport = _ref4.isPassport;
  var _useState13 = useState(false),
    _useState14 = _slicedToArray(_useState13, 2),
    open = _useState14[0],
    setOpen = _useState14[1];
  var _useState15 = useState(""),
    _useState16 = _slicedToArray(_useState15, 2),
    q = _useState16[0],
    setQ = _useState16[1];
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
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, c ? React.createElement("span", {
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
  }, window.countryName(value))), React.createElement(IconCaret, null)) : React.createElement("span", {
    className: "pp-main"
  }, React.createElement("span", {
    className: "pp-empty",
    style: {
      flex: 1
    }
  }, placeholder), React.createElement(IconCaret, null))) : React.createElement("button", {
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
function PlPassports(_ref5) {
  var pps = _ref5.pps,
    onPick = _ref5.onPick;
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, null, pt("your_passport")), React.createElement(CountryPicker, {
    value: pps[0] || null,
    placeholder: window.t("picker.select_passport"),
    onPick: onPick,
    isPassport: true
  }), pps.length > 1 && React.createElement("div", {
    className: "chips",
    style: {
      marginTop: 8
    }
  }, pps.slice(1).map(function (p) {
    return React.createElement("span", {
      key: p,
      className: "chip",
      style: {
        cursor: "default"
      }
    }, React.createElement("span", {
      className: "flag"
    }, window.byIso2[p] && window.byIso2[p].flag), window.countryName(p));
  })), React.createElement("p", {
    className: "p-hint"
  }, pps.length > 1 ? pt("pp_many") : pt("pp_one"), " ", React.createElement("a", {
    className: "link-quiet",
    href: plPrefix() + "/panel/"
  }, pt("pp_manage"))));
}
function PlTrip(_ref6) {
  var state = _ref6.state,
    trip = _ref6.trip,
    update = _ref6.update,
    updTrip = _ref6.updTrip,
    expiry = _ref6.expiry,
    setExpiry = _ref6.setExpiry,
    bump = _ref6.bump;
  var _useState17 = useState(false),
    _useState18 = _slicedToArray(_useState17, 2),
    confirmDel = _useState18[0],
    setConfirmDel = _useState18[1];
  var LIM = window.TRIPS_CORE.LIMITS;
  var label = function label(t, i) {
    return t.name || pt("trip_n", {
      n: i + 1
    });
  };
  var newTrip = function newTrip() {
    return update(function (s) {
      if (s.trips.length >= LIM.trips) return s;
      var t = window.TRIPS_CORE.cleanTrip({});
      return _objectSpread(_objectSpread({}, s), {}, {
        trips: [].concat(_toConsumableArray(s.trips), [t]),
        active: t.id
      });
    });
  };
  var delTrip = function delTrip() {
    setConfirmDel(false);
    update(function (s) {
      var trips = s.trips.filter(function (t) {
        return t.id !== s.active;
      });
      return _objectSpread(_objectSpread({}, s), {}, {
        trips: trips,
        active: trips[0] ? trips[0].id : ""
      });
    });
  };
  var from = trip ? trip.from : {
    country: "",
    city: ""
  };
  var setFrom = function setFrom(patch) {
    return updTrip(function (t) {
      return _objectSpread(_objectSpread({}, t), {}, {
        from: _objectSpread(_objectSpread({}, t.from), patch)
      });
    });
  };
  var cities = useMemo(function () {
    var A = window.AIRPORTS;
    if (!A || !from.country) return [];
    var seen = {};
    Object.keys(A).forEach(function (k) {
      if (A[k][0] === from.country) seen[A[k][1]] = 1;
    });
    return Object.keys(seen).sort().slice(0, 80);
  }, [from.country, window.AIRPORTS]);
  var fc = from.country ? window.byIso2[from.country] : null;
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    aside: state.trips.length ? React.createElement("span", {
      className: "mono"
    }, state.trips.length, "/", LIM.trips) : null
  }, pt("s_trip")), state.trips.length > 0 && React.createElement("div", {
    className: "pl-line"
  }, React.createElement("select", {
    className: "field pl-grow",
    "aria-label": pt("trip_switch"),
    value: state.active,
    onChange: function onChange(e) {
      var id = e.target.value;
      setConfirmDel(false);
      update(function (s) {
        return _objectSpread(_objectSpread({}, s), {}, {
          active: id
        });
      });
    }
  }, state.trips.map(function (t, i) {
    return React.createElement("option", {
      key: t.id,
      value: t.id
    }, label(t, i));
  })), React.createElement("button", {
    type: "button",
    className: "btn pl-btn",
    onClick: newTrip,
    disabled: state.trips.length >= LIM.trips
  }, pt("trip_new"))), state.trips.length >= LIM.trips && React.createElement("p", {
    className: "p-hint"
  }, pt("trip_max", {
    n: LIM.trips
  })), React.createElement("label", {
    className: "pl-label",
    htmlFor: "pl-name"
  }, pt("trip_name")), React.createElement("input", {
    id: "pl-name",
    className: "field",
    maxLength: LIM.name,
    value: trip ? trip.name : "",
    placeholder: pt("trip_name_ph"),
    onChange: function onChange(e) {
      return updTrip(function (t) {
        return _objectSpread(_objectSpread({}, t), {}, {
          name: e.target.value
        });
      });
    }
  }), trip && state.trips.length > 0 && (confirmDel ? React.createElement("div", {
    className: "note note-risk pl-confirm",
    role: "alert"
  }, React.createElement("div", {
    className: "note-k"
  }, pt("trip_del_q")), React.createElement("div", {
    className: "pl-line",
    style: {
      marginTop: 8
    }
  }, React.createElement("button", {
    type: "button",
    className: "btn pl-btn",
    onClick: delTrip
  }, pt("trip_del_yes")), React.createElement("button", {
    type: "button",
    className: "btn btn-quiet pl-btn",
    onClick: function onClick() {
      return setConfirmDel(false);
    }
  }, pt("trip_del_no")))) : React.createElement("button", {
    type: "button",
    className: "btn btn-quiet pl-btn",
    style: {
      marginTop: 8
    },
    onClick: function onClick() {
      return setConfirmDel(true);
    }
  }, pt("trip_del"))), React.createElement("div", {
    className: "pl-label",
    style: {
      marginTop: 14
    }
  }, pt("depart_from")), React.createElement("div", {
    className: "pl-line"
  }, React.createElement("div", {
    className: "pl-grow",
    style: {
      minWidth: 0
    }
  }, React.createElement(CountryPicker, {
    value: null,
    placeholder: fc ? fc.flag + " " + window.countryName(from.country) : pt("from_country"),
    onPick: function onPick(iso) {
      return setFrom({
        country: iso
      });
    }
  })), from.country && React.createElement("button", {
    type: "button",
    className: "btn btn-quiet pl-btn",
    onClick: function onClick() {
      return setFrom({
        country: "",
        city: ""
      });
    }
  }, pt("clear"))), React.createElement("input", {
    className: "field",
    style: {
      marginTop: 8
    },
    maxLength: LIM.city,
    list: "pl-cities",
    value: from.city,
    placeholder: pt("from_city"),
    "aria-label": pt("from_city"),
    autoComplete: "off",
    onFocus: function onFocus() {
      return plLoadAirports(bump);
    },
    onChange: function onChange(e) {
      return setFrom({
        city: e.target.value
      });
    }
  }), React.createElement("datalist", {
    id: "pl-cities"
  }, cities.map(function (c) {
    return React.createElement("option", {
      key: c,
      value: c
    });
  })), React.createElement("label", {
    className: "pl-label",
    htmlFor: "pl-exp",
    style: {
      marginTop: 14
    }
  }, pt("expiry")), React.createElement("div", {
    className: "pl-line"
  }, React.createElement("input", {
    id: "pl-exp",
    type: "month",
    className: "field",
    style: {
      width: "auto"
    },
    value: expiry,
    placeholder: "YYYY-MM",
    onChange: function onChange(e) {
      return setExpiry(e.target.value);
    }
  }), expiry && React.createElement("button", {
    type: "button",
    className: "btn btn-quiet pl-btn",
    onClick: function onClick() {
      return setExpiry("");
    }
  }, pt("clear"))), React.createElement("p", {
    className: "p-hint"
  }, pt("expiry_note")));
}
function PlStops(_ref7) {
  var stops = _ref7.stops,
    entries = _ref7.entries,
    pps = _ref7.pps,
    watch = _ref7.watch,
    onAdd = _ref7.onAdd,
    onRemove = _ref7.onRemove,
    onPatch = _ref7.onPatch,
    onMove = _ref7.onMove;
  var LIM = window.TRIPS_CORE.LIMITS;
  var exclude = new Set([].concat(_toConsumableArray(pps), _toConsumableArray(stops.map(function (s) {
    return s.iso;
  }))));
  var quick = watch.filter(function (iso) {
    return !exclude.has(iso);
  }).slice(0, 8);
  var issues = window.TRIPS_CORE.dateIssues({
    stops: stops
  });
  var msgFor = function msgFor(i) {
    var out = [];
    var s = stops[i];
    if (s.arrive && s.leave && s.leave < s.arrive) out.push(pt("iss_order"));
    issues.filter(function (x) {
      return x.index === i;
    }).forEach(function (x) {
      if (x.kind === "missing" && !(s.arrive && s.leave && s.leave < s.arrive)) out.push(pt("iss_missing"));
      if (x.kind === "overlap") out.push(pt("iss_overlap"));
    });
    return out;
  };
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    aside: stops.length ? React.createElement("span", {
      className: "mono"
    }, stops.length, "/", LIM.stops) : null
  }, pt("s_stops")), stops.length === 0 ? React.createElement("div", {
    className: "box box-dashed p-hint",
    style: {
      marginTop: 0
    }
  }, pt("no_stops")) : React.createElement("ol", {
    className: "pl-stops"
  }, entries.map(function (e, i) {
    var s = e.stop;
    var b = e.best;
    var msgs = msgFor(i);
    return React.createElement("li", {
      key: s.iso,
      className: "pl-stop",
      style: {
        "--tone": "var(--".concat(b ? b.r.status : "na", ", var(--rule-strong))")
      }
    }, React.createElement("div", {
      className: "pl-stop-head"
    }, React.createElement("span", {
      className: "stop-n"
    }, i + 1), React.createElement("span", {
      className: "flag",
      style: {
        fontSize: 20
      }
    }, window.byIso2[s.iso] && window.byIso2[s.iso].flag), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      className: "stop-name"
    }, window.countryName(s.iso)), b && React.createElement("span", {
      className: "stop-meta"
    }, statusLabel(b.r.status))), React.createElement("button", {
      type: "button",
      className: "pl-icon",
      disabled: i === 0,
      onClick: function onClick() {
        return onMove(i, i - 1);
      },
      "aria-label": pt("move_up"),
      title: pt("move_up")
    }, "\u2191"), React.createElement("button", {
      type: "button",
      className: "pl-icon",
      disabled: i === stops.length - 1,
      onClick: function onClick() {
        return onMove(i, i + 1);
      },
      "aria-label": pt("move_down"),
      title: pt("move_down")
    }, "\u2193"), React.createElement("button", {
      type: "button",
      className: "pl-icon",
      onClick: function onClick() {
        return onRemove(i);
      },
      "aria-label": pt("remove"),
      title: pt("remove")
    }, React.createElement(IconClose, null))), React.createElement("div", {
      className: "pl-dates"
    }, React.createElement("label", {
      className: "pl-field"
    }, React.createElement("span", {
      className: "pl-label"
    }, pt("arrive")), React.createElement("input", {
      type: "date",
      className: "field",
      value: s.arrive,
      onChange: function onChange(e) {
        return onPatch(i, {
          arrive: e.target.value
        });
      }
    })), React.createElement("label", {
      className: "pl-field"
    }, React.createElement("span", {
      className: "pl-label"
    }, pt("leave")), React.createElement("input", {
      type: "date",
      className: "field",
      value: s.leave,
      min: s.arrive || undefined,
      onChange: function onChange(e) {
        return onPatch(i, {
          leave: e.target.value
        });
      }
    })), React.createElement("label", {
      className: "pl-field"
    }, React.createElement("span", {
      className: "pl-label"
    }, pt("via")), React.createElement("input", {
      className: "field",
      maxLength: 3,
      value: s.via,
      placeholder: "IST",
      autoComplete: "off",
      autoCapitalize: "characters",
      onFocus: function onFocus() {
        return plLoadAirports(function () {});
      },
      onChange: function onChange(e) {
        return onPatch(i, {
          via: e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
        });
      }
    }))), msgs.map(function (m, j) {
      return React.createElement("p", {
        key: j,
        className: "pl-issue",
        role: "status"
      }, m);
    }));
  })), stops.length >= LIM.stops ? React.createElement("p", {
    className: "p-hint"
  }, pt("stops_max", {
    n: LIM.stops
  })) : React.createElement(React.Fragment, null, React.createElement(CountryPicker, {
    value: null,
    placeholder: "+ " + pt("add_destination"),
    exclude: exclude,
    onPick: onAdd
  }), quick.length > 0 && React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, React.createElement("div", {
    className: "pl-label"
  }, pt("watched")), React.createElement("div", {
    className: "chips"
  }, quick.map(function (iso) {
    return React.createElement("button", {
      key: iso,
      type: "button",
      className: "chip pl-chip",
      onClick: function onClick() {
        return onAdd(iso);
      }
    }, React.createElement("span", {
      className: "flag"
    }, window.byIso2[iso] && window.byIso2[iso].flag), "+ ", window.countryName(iso));
  })))));
}
function PlRules(_ref8) {
  var entries = _ref8.entries,
    pps = _ref8.pps;
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, null, pt("s_rules")), entries.map(function (e) {
    return React.createElement(PlRulesCard, {
      key: e.stop.iso,
      e: e,
      pps: pps
    });
  }), React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "8px 0 0"
    }
  }, pt("data_src", {
    date: plFmtISO(window.SNAPSHOT_DATE)
  })));
}
function PlRulesCard(_ref9) {
  var e = _ref9.e,
    pps = _ref9.pps;
  var stop = e.stop,
    best = e.best,
    transit = e.transit;
  var iso = stop.iso;
  var name = window.countryName(iso);
  var head = React.createElement("div", {
    className: "pl-card-head"
  }, React.createElement("span", {
    className: "flag",
    style: {
      fontSize: 18
    }
  }, window.byIso2[iso] && window.byIso2[iso].flag), React.createElement("strong", null, name));
  if (!best) return React.createElement("div", {
    className: "pl-card"
  }, head);
  var st = best.r.status;
  if (st === "self") return React.createElement("div", {
    className: "pl-card"
  }, head, React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "6px 0 0"
    }
  }, pt("own_country")));
  var days = stop.arrive && stop.leave && stop.leave >= stop.arrive ? plDiff(stop.arrive, stop.leave) + 1 : null;
  var max = best.r.days;
  var fee = plNeedsApp(st) && window.visaFee ? window.visaFee(best.p, iso) : null;
  var et = window.etiasStatus ? window.etiasStatus(best.p, iso) : null;
  var esta = iso === "US" && window.estaEligible && window.estaEligible(best.p) && (st === "eta" || st === "ev") ? window.ESTA : null;
  var cond = window.visaCondition && window.visaCondition(best.p, iso) || [];
  var ORD = {
    idc: 0,
    vf: 1,
    eta: 2,
    ev: 3,
    voa: 4,
    vr: 5,
    ban: 6,
    na: 7
  };
  var useful = st === "vf" ? [] : cond.filter(function (r) {
    return ORD[r.then] < ORD[st];
  });
  var lang = window.ATLAS_LANG || "en";
  var adv = plAdvisory(iso);
  var advAll = window.TRAVEL_ADVISORIES;
  var others = pps.filter(function (p) {
    return p !== best.p && p !== iso;
  });
  return React.createElement("div", {
    className: "pl-card"
  }, head, React.createElement(PlRow, {
    k: pt("k_status")
  }, React.createElement(Dot, {
    s: st
  }), " ", React.createElement("strong", null, statusLabel(st)), pps.length > 1 ? React.createElement("span", {
    className: "p-fine"
  }, " ", pt("via_passport", {
    name: window.countryName(best.p)
  })) : null), others.length > 0 && React.createElement(PlRow, {
    k: pt("k_others")
  }, others.map(function (p) {
    return window.countryName(p) + ": " + statusLabel(window.resolveStatus(p, iso).status);
  }).join("; ")), !best.r.fom && st !== "idc" && React.createElement(PlRow, {
    k: pt("k_stay")
  }, max ? window.t("detail.up_to_days", {
    n: max
  }) : plNoData()), max && days && days > max && React.createElement("div", {
    className: "note note-risk pl-note",
    role: "alert"
  }, React.createElement("span", {
    className: "note-s",
    style: {
      margin: 0
    }
  }, pt("stay_long", {
    n: days,
    max: max,
    name: name
  }))), plNeedsApp(st) && (fee ? React.createElement(React.Fragment, null, React.createElement(PlRow, {
    k: pt("k_fee")
  }, itinFeeLabel(fee.fee)), fee.processingDays && React.createElement(PlRow, {
    k: pt("k_proc")
  }, itinFeeLabel(fee.processingDays)), fee.type && React.createElement(PlRow, {
    k: pt("k_type")
  }, itinFeeLabel(fee.type)), React.createElement("div", {
    className: "pl-srcline"
  }, fee.source && React.createElement("a", {
    className: "link-quiet",
    href: fee.source,
    target: "_blank",
    rel: "noopener nofollow"
  }, pt("apply_link")), fee.lastReviewed && React.createElement("span", {
    className: "p-fine"
  }, window.t("detail.reviewed", {
    date: fee.lastReviewed
  })))) : React.createElement(PlRow, {
    k: pt("k_fee")
  }, plNoData())), et && et.kind === "required" && React.createElement("div", {
    className: "note note-info pl-note"
  }, React.createElement("span", {
    className: "note-k"
  }, pt("etias_t")), React.createElement("span", {
    className: "note-s"
  }, pt("etias_b", {
    fee: et.fee,
    n: et.validityYears
  })), React.createElement("span", {
    className: "note-s"
  }, React.createElement("a", {
    className: "link-quiet",
    href: window.ETIAS && window.ETIAS.officialUrl || et.url,
    target: "_blank",
    rel: "noopener nofollow"
  }, pt("etias_link")))), esta && React.createElement("div", {
    className: "note note-info pl-note"
  }, React.createElement("span", {
    className: "note-k"
  }, pt("esta_t")), React.createElement("span", {
    className: "note-s"
  }, pt("esta_b", {
    fee: esta.applicationFee,
    n: esta.validityYears
  })), React.createElement("span", {
    className: "note-s"
  }, React.createElement("a", {
    className: "link-quiet",
    href: esta.source,
    target: "_blank",
    rel: "noopener nofollow"
  }, pt("esta_link")))), useful.map(function (row, i) {
    var labels = window.conditionHoldsLabels && window.conditionHoldsLabels(row.ifHolds) || row.ifHolds;
    var note = lang === "tr" ? row.note || row.noteEn : row.noteEn || row.note;
    return React.createElement("div", {
      key: i,
      className: "note note-ok pl-note"
    }, React.createElement("span", {
      className: "note-k"
    }, pt("cond_t", {
      holds: labels.join(", "),
      status: statusLabel(row.then)
    }), row.days ? ", " + window.t("detail.up_to_days", {
      n: row.days
    }) : ""), note && React.createElement("span", {
      className: "note-s"
    }, note), row.source && React.createElement("span", {
      className: "note-s"
    }, React.createElement("a", {
      className: "link-quiet",
      href: row.source,
      target: "_blank",
      rel: "noopener nofollow"
    }, window.t("cond.source"))));
  }), transit && React.createElement(PlTransitRow, {
    transit: transit,
    stop: stop
  }), React.createElement(PlRow, {
    k: pt("k_safety")
  }, !advAll ? React.createElement("span", {
    className: "p-fine"
  }, pt("adv_loading")) : !adv || !adv.level ? plNoData() : React.createElement("span", null, React.createElement("strong", {
    className: adv.level >= 3 ? "pl-warn" : ""
  }, window.t("safety.level_n", {
    n: adv.level
  }), ": ", window.t("safety.l" + adv.level)), React.createElement("span", {
    className: "p-fine",
    style: {
      display: "block"
    }
  }, ["uk", "us", "ca"].filter(function (k) {
    return adv[k] && adv[k].level;
  }).map(function (k) {
    return (advAll.sources[k] ? advAll.sources[k].name : k) + " " + adv[k].level;
  }).join("; "), adv.updated ? ". " + pt("adv_upd", {
    date: plFmtISO(adv.updated)
  }) : ""), React.createElement("a", {
    className: "link-quiet",
    href: "/safety-map/"
  }, pt("adv_link")))), plNeedsApp(st) && React.createElement(PartnerSlot, {
    kind: "visa",
    status: st,
    dest: iso
  }));
}
function PlTransitRow(_ref0) {
  var transit = _ref0.transit,
    stop = _ref0.stop;
  var k = pt("k_transit", {
    code: transit.code
  });
  if (transit.unknown) return React.createElement(PlRow, {
    k: k
  }, transit.loaded ? pt("tr_unknown") : React.createElement("span", {
    className: "p-fine"
  }, pt("adv_loading")));
  if (transit.none) return React.createElement(PlRow, {
    k: k
  }, plNoData());
  var s = transit.leg.status;
  var where = transit.city + " (" + window.countryName(transit.iso) + ")";
  var body;
  if (s.status === "self") body = pt("tr_self");else if (s.generic) body = plNoData();else if (s.status === "vr") body = React.createElement("strong", {
    className: "pl-warn"
  }, pt("tr_vr"));else if (s.status === "twov") body = React.createElement("strong", null, pt("tr_twov", {
    h: s.twovHours || ""
  }));else body = React.createElement("strong", null, pt("tr_free"));
  var o = window.TRANSIT_REQUIRED_OVERRIDES;
  return React.createElement(PlRow, {
    k: k
  }, React.createElement("span", null, where, ": ", body), !s.generic && s.status !== "self" && React.createElement("span", {
    className: "p-fine",
    style: {
      display: "block"
    }
  }, window.countryName(transit.p) + ". ", o && o.lastUpdated ? pt("tr_upd", {
    date: plFmtISO(o.lastUpdated)
  }) + " " : "", React.createElement(PlSrc, {
    url: s.source
  })));
}
function PlSchengen(_ref1) {
  var entries = _ref1.entries;
  var SC = window.SCHENGEN_CORE;
  var inSchengen = entries.filter(function (e) {
    return SC.isMember(e.stop.iso);
  });
  var members = inSchengen.filter(function (e) {
    return e.best && e.best.r.status !== "self" && e.best.r.status !== "idc" && !e.best.r.fom;
  });
  if (!members.length) {
    var free = inSchengen.find(function (e) {
      return e.best;
    });
    if (!free) return null;
    return React.createElement("section", {
      className: "p-sec"
    }, React.createElement(Caption, null, pt("s_schengen")), React.createElement("p", {
      className: "p-hint",
      style: {
        margin: 0
      }
    }, pt("sg_free", {
      passport: window.countryName(free.best.p)
    })));
  }
  var dated = members.filter(function (e) {
    return e.stop.arrive && e.stop.leave && e.stop.leave >= e.stop.arrive;
  });
  var undated = members.length - dated.length;
  var past = plReadSchengenPast();
  var res = dated.length ? SC.checkPlan([].concat(_toConsumableArray(dated.map(function (e) {
    return {
      entry: e.stop.arrive,
      exit: e.stop.leave
    };
  })), _toConsumableArray(past))) : null;
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, null, pt("s_schengen")), res ? React.createElement("div", {
    className: "note pl-note " + (res.ok ? "note-ok" : "note-risk"),
    style: {
      display: "block",
      margin: 0
    },
    role: res.ok ? undefined : "alert"
  }, React.createElement("div", {
    className: "note-k"
  }, res.ok ? pt("sg_ok") : pt("sg_breach", {
    date: plFmtISO(res.firstBreach)
  })), React.createElement("div", {
    className: "note-s"
  }, pt("sg_peak", {
    n: res.peak,
    max: SC.MAX_DAYS
  })), past.length > 0 && React.createElement("div", {
    className: "note-s"
  }, pt("sg_past", {
    n: past.length
  }))) : React.createElement("p", {
    className: "p-hint",
    style: {
      margin: 0
    }
  }, pt("sg_nodates")), undated > 0 && res && React.createElement("p", {
    className: "p-hint"
  }, pt("sg_undated", {
    n: undated
  })), React.createElement("p", {
    className: "p-hint"
  }, pt("sg_scope")), React.createElement("a", {
    className: "link-quiet",
    href: plPrefix() + "/schengen-calculator/"
  }, pt("sg_link")));
}
function PlChecklist(_ref10) {
  var entries = _ref10.entries,
    lists = _ref10.lists,
    done = _ref10.done,
    onToggle = _ref10.onToggle;
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, null, pt("s_checklist")), entries.map(function (e, i) {
    var list = lists[i];
    if (!list.length) return null;
    var open = list.filter(function (it) {
      return !done[it.key];
    }).length;
    return React.createElement("div", {
      key: e.stop.iso,
      className: "pl-card"
    }, React.createElement("div", {
      className: "pl-card-head"
    }, React.createElement("span", {
      className: "flag",
      style: {
        fontSize: 18
      }
    }, window.byIso2[e.stop.iso] && window.byIso2[e.stop.iso].flag), React.createElement("strong", {
      style: {
        flex: 1
      }
    }, window.countryName(e.stop.iso)), React.createElement("span", {
      className: "mono p-fine"
    }, pt("ck_open", {
      n: open
    }))), React.createElement("ul", {
      className: "pl-ck-list"
    }, list.map(function (it) {
      return React.createElement("li", {
        key: it.key
      }, React.createElement("label", {
        className: "pl-ck"
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!done[it.key],
        onChange: function onChange() {
          return onToggle(it.key);
        }
      }), React.createElement("span", {
        className: "pl-ck-text"
      }, React.createElement("span", {
        className: "pl-ck-main"
      }, it.text), it.detail && React.createElement("span", {
        className: "pl-ck-detail"
      }, it.detail))), it.href && /^(\/|https?:)/.test(it.href) && React.createElement("a", {
        className: "link-quiet pl-ck-link",
        href: it.href,
        target: it.href.charAt(0) === "/" ? undefined : "_blank",
        rel: "noopener nofollow"
      }, pt("more")), it.partner && React.createElement(PartnerSlot, {
        kind: it.partner,
        status: e.best && e.best.r.status,
        dest: e.stop.iso
      }));
    })));
  }));
}
function PlSummary(_ref11) {
  var trip = _ref11.trip,
    entries = _ref11.entries,
    lists = _ref11.lists,
    done = _ref11.done,
    plan = _ref11.plan,
    pps = _ref11.pps,
    from = _ref11.from;
  var _useState19 = useState(""),
    _useState20 = _slicedToArray(_useState19, 2),
    shareMsg = _useState20[0],
    setShareMsg = _useState20[1];
  var stops = entries.map(function (e) {
    return e.stop;
  });
  var days = stops.length && stops.every(function (s) {
    return s.arrive && s.leave;
  }) ? window.TRIPS_CORE.totalDays({
    stops: stops
  }) : 0;
  var first = stops.find(function (s) {
    return s.arrive;
  });
  var last = stops.slice().reverse().find(function (s) {
    return s.leave || s.arrive;
  });
  var fc = from ? window.byIso2[from] : null;
  var route = [fc ? fc.flag + " " + (trip.from.city || window.countryName(from)) : null].concat(stops.map(function (s) {
    return (window.byIso2[s.iso] ? window.byIso2[s.iso].flag + " " : "") + window.countryName(s.iso) + (s.arrive ? " (" + plFmtISO(s.arrive) + (s.leave ? " → " + plFmtISO(s.leave) : "") + ")" : "");
  })).filter(Boolean);
  var totalFee = 0,
    unknown = 0,
    maxProc = 0;
  var visaStops = [];
  entries.forEach(function (e) {
    if (!e.best || !plNeedsApp(e.best.r.status)) return;
    visaStops.push({
      iso: e.stop.iso,
      status: e.best.r.status,
      p: e.best.p
    });
    var usd = feeUSD(e.best.p, e.stop.iso);
    if (usd) totalFee += usd;else unknown++;
    var pd = procDays(e.best.p, e.stop.iso);
    if (pd > maxProc) maxProc = pd;
  });
  var order = visaStops.slice().sort(function (a, b) {
    return procDays(b.p, b.iso) - procDays(a.p, a.iso);
  });
  var items = plan && plan.items ? plan.items : [];
  var downloadICS = function downloadICS() {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//travelnow.info//Visa Reminder//EN", "CALSCALE:GREGORIAN"];
    var stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    var _iterator3 = _createForOfIteratorHelper(items),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var it = _step3.value;
        var ymd = it.applyBy.toISOString().slice(0, 10).replace(/-/g, "");
        var next = new Date(it.applyBy.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        var nm = window.countryName(it.iso);
        lines.push("BEGIN:VEVENT", "UID:atlas-visa-".concat(it.iso, "-").concat(ymd, "@travelnow.info"), "DTSTAMP:".concat(stamp), "DTSTART;VALUE=DATE:".concat(ymd), "DTEND;VALUE=DATE:".concat(next), "SUMMARY:Apply for ".concat(nm, " visa"), "DESCRIPTION:Submit your ".concat(nm, " visa application today. Processing ~").concat(it.proc, " days; arrival ").concat(it.arrive, "."), "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Apply for ".concat(nm, " visa tomorrow."), "END:VALARM", "END:VEVENT");
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
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
    if (pps[0]) u.searchParams.set("p", pps[0]);
    if (stops.length) u.searchParams.set("stops", stops.map(function (s) {
      return s.iso;
    }).join(","));
    if (stops[0] && stops[0].arrive) u.searchParams.set("d", stops[0].arrive);
    navigator.clipboard.writeText(u.toString()).then(function () {
      setShareMsg(pt("copied"));
      setTimeout(function () {
        return setShareMsg("");
      }, 2000);
    });
  };
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, null, pt("s_summary")), React.createElement("p", {
    className: "pl-route"
  }, route.join("  →  ")), React.createElement("div", {
    className: "stats3",
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, days || "-"), React.createElement("div", {
    className: "l"
  }, pt("sum_days"))), React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, visaStops.length), React.createElement("div", {
    className: "l"
  }, pt("visas_needed"))), React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, totalFee > 0 ? "$" + totalFee.toFixed(0) : "-"), React.createElement("div", {
    className: "l"
  }, pt("est_cost")))), React.createElement("div", {
    className: "pl-tablewrap"
  }, React.createElement("table", {
    className: "pl-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, pt("th_country")), React.createElement("th", null, pt("th_status")), React.createElement("th", null, pt("th_stay")), React.createElement("th", null, pt("th_open")))), React.createElement("tbody", null, entries.map(function (e, i) {
    var b = e.best;
    var open = lists[i].filter(function (it) {
      return !done[it.key];
    }).length;
    return React.createElement("tr", {
      key: e.stop.iso
    }, React.createElement("td", null, React.createElement("span", {
      className: "flag"
    }, window.byIso2[e.stop.iso] && window.byIso2[e.stop.iso].flag), " ", window.countryName(e.stop.iso)), React.createElement("td", null, b ? React.createElement(React.Fragment, null, React.createElement(Dot, {
      s: b.r.status
    }), " ", statusLabel(b.r.status), React.createElement("span", {
      className: "p-fine",
      style: {
        display: "block"
      }
    }, b.p === e.stop.iso ? "" : window.countryName(b.p))) : plNoData()), React.createElement("td", null, b && b.r.days ? window.t("detail.up_to_days", {
      n: b.r.days
    }) : b && (b.r.status === "self" || b.r.status === "idc" || b.r.fom) ? "-" : plNoData()), React.createElement("td", {
      className: "mono"
    }, b && b.r.status === "self" ? "-" : open));
  })))), React.createElement("div", {
    className: "pl-key"
  }, React.createElement("div", {
    className: "pl-label"
  }, pt("sum_dates")), plan && plan.earliest ? React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "2px 0 0",
      color: "var(--ink-2)"
    }
  }, plan.earliestDays <= 0 ? pt("past_window") : pt("start_by", {
    date: fmtDate(plan.earliest),
    n: plan.earliestDays
  })) : null, first ? React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "2px 0 0"
    }
  }, pt("sum_depart", {
    date: plFmtISO(first.arrive)
  }), last && (last.leave || last.arrive) !== first.arrive ? " " + pt("sum_return", {
    date: plFmtISO(last.leave || last.arrive)
  }) : "") : React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "2px 0 0"
    }
  }, pt("depart_hint"))), plan && plan.late.length > 0 && React.createElement("div", {
    className: "note note-risk",
    style: {
      display: "block",
      marginTop: 10
    },
    role: "alert"
  }, React.createElement("div", {
    className: "note-k"
  }, pt("late_title")), React.createElement("div", {
    className: "note-s"
  }, pt("late_body", {
    names: plan.late.map(function (i) {
      return window.countryName(i.iso);
    }).join(", ")
  }))), items.length > 0 && React.createElement("div", {
    className: "members",
    style: {
      marginTop: 10
    }
  }, items.map(function (it) {
    return React.createElement("div", {
      key: it.iso,
      className: "member"
    }, React.createElement("span", {
      className: "flag",
      style: {
        fontSize: 18
      }
    }, window.byIso2[it.iso] && window.byIso2[it.iso].flag), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      className: "stop-name"
    }, window.countryName(it.iso)), React.createElement("span", {
      className: "stop-meta"
    }, pt("proc_lead", {
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
    }, it.overdue ? pt("apply_asap") : pt("apply_by")), React.createElement("span", {
      className: "stop-meta"
    }, fmtDate(it.applyBy))));
  })), plan && items.length === 0 && visaStops.length === 0 && React.createElement("div", {
    className: "note note-ok",
    style: {
      display: "block",
      marginTop: 10
    }
  }, React.createElement("div", {
    className: "note-k"
  }, pt("good_news")), React.createElement("div", {
    className: "note-s"
  }, pt("good_news_b"))), order.length > 0 && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "pl-label",
    style: {
      marginTop: 12
    }
  }, pt("order_title")), React.createElement("ol", {
    className: "apply-order"
  }, order.map(function (s) {
    var fee = window.visaFee && window.visaFee(s.p, s.iso);
    return React.createElement("li", {
      key: s.iso
    }, React.createElement("strong", null, React.createElement("span", {
      className: "flag"
    }, window.byIso2[s.iso] && window.byIso2[s.iso].flag), " ", window.countryName(s.iso)), React.createElement("span", null, ": ", statusLabel(s.status), fee && fee.processingDays ? ", " + itinFeeLabel(fee.processingDays) : ""));
  }))), unknown > 0 && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "8px 0 0"
    }
  }, pt("missing_fee", {
    n: unknown
  })), maxProc > 0 && React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "4px 0 0"
    }
  }, pt("start_buffer", {
    n: maxProc
  })), React.createElement(PartnerSlot, {
    kind: "esim",
    status: "*",
    dest: ""
  }), React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, items.length > 0 && React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: downloadICS
  }, pt("dl_ics")), React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: copyShare
  }, pt("copy_url")), React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return window.print();
    }
  }, pt("print")), shareMsg && React.createElement("span", {
    className: "p-hint",
    style: {
      margin: 0,
      color: "var(--vf)"
    }
  }, shareMsg)));
}
function PlSignIn() {
  var acct = window.ATLAS_ACCOUNT || {
    enabled: false
  };
  var _useState21 = useState(0),
    _useState22 = _slicedToArray(_useState21, 2),
    force = _useState22[1];
  useEffect(function () {
    if (!acct.onChange) return undefined;
    var off = acct.onChange(function () {
      return force(function (x) {
        return x + 1;
      });
    });
    return typeof off === "function" ? off : undefined;
  }, []);
  var st = acct.state || {};
  if (!acct.enabled || !st.ready || st.user) return null;
  return React.createElement("p", {
    className: "p-hint pl-signin"
  }, React.createElement("a", {
    className: "link-quiet",
    href: "/account/"
  }, pt("signin")));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(ItineraryApp, null));

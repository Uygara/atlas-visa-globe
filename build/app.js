// Generated from app.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _excluded = ["globeStyle"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
var TWEAK_DEFAULTS = {
  "globeStyle": "globe3d",
  "background": "light",
  "compareMode": false,
  "groupMode": false
};
function useTweaks(defaults) {
  var _useState = useState(function () {
      try {
        var stored = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
        var merged = _objectSpread(_objectSpread({}, defaults), stored);
        var sessionMode = sessionStorage.getItem("atlas.globeStyle");
        merged.globeStyle = sessionMode || defaults.globeStyle;
        return merged;
      } catch (e) {
        return defaults;
      }
    }),
    _useState2 = _slicedToArray(_useState, 2),
    values = _useState2[0],
    setValues = _useState2[1];
  var setTweak = useCallback(function (key, val) {
    setValues(function (prev) {
      var next = _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, val));
      try {
        if (key === "globeStyle") {
          sessionStorage.setItem("atlas.globeStyle", val);
        } else {
          var _drop = next.globeStyle,
            persistable = _objectWithoutProperties(next, _excluded);
          localStorage.setItem("atlas.tweaks", JSON.stringify(persistable));
        }
      } catch (e) {}
      return next;
    });
  }, []);
  return [values, setTweak];
}
var TZ_FALLBACK = {
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "America/Detroit": "US",
  "America/Indianapolis": "US",
  "America/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Halifax": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Montreal": "CA",
  "America/Mexico_City": "MX",
  "America/Monterrey": "MX",
  "America/Cancun": "MX",
  "America/Sao_Paulo": "BR",
  "America/Recife": "BR",
  "America/Manaus": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "America/Caracas": "VE",
  "America/La_Paz": "BO",
  "America/Asuncion": "PY",
  "America/Montevideo": "UY",
  "America/Guayaquil": "EC",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Luxembourg": "LU",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Lisbon": "PT",
  "Europe/Reykjavik": "IS",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Bratislava": "SK",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Sofia": "BG",
  "Europe/Athens": "GR",
  "Europe/Riga": "LV",
  "Europe/Tallinn": "EE",
  "Europe/Vilnius": "LT",
  "Europe/Ljubljana": "SI",
  "Europe/Zagreb": "HR",
  "Europe/Malta": "MT",
  "Europe/Andorra": "AD",
  "Europe/Monaco": "MC",
  "Europe/San_Marino": "SM",
  "Europe/Vatican": "VA",
  "Europe/Moscow": "RU",
  "Europe/Kaliningrad": "RU",
  "Europe/Samara": "RU",
  "Europe/Minsk": "BY",
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "Europe/Chisinau": "MD",
  "Europe/Istanbul": "TR",
  "Asia/Istanbul": "TR",
  "Turkey": "TR",
  "Europe/Tirane": "AL",
  "Europe/Sarajevo": "BA",
  "Europe/Belgrade": "RS",
  "Europe/Podgorica": "ME",
  "Europe/Skopje": "MK",
  "Europe/Pristina": "XK",
  "Asia/Nicosia": "CY",
  "Europe/Nicosia": "CY",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Pyongyang": "KP",
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Urumqi": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Macau": "MO",
  "Asia/Taipei": "TW",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Saigon": "VN",
  "Asia/Phnom_Penh": "KH",
  "Asia/Vientiane": "LA",
  "Asia/Yangon": "MM",
  "Asia/Rangoon": "MM",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Kathmandu": "NP",
  "Asia/Colombo": "LK",
  "Asia/Thimphu": "BT",
  "Asia/Male": "MV",
  "Asia/Tehran": "IR",
  "Asia/Baghdad": "IQ",
  "Asia/Damascus": "SY",
  "Asia/Beirut": "LB",
  "Asia/Amman": "JO",
  "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL",
  "Asia/Gaza": "PS",
  "Asia/Hebron": "PS",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Qatar": "QA",
  "Asia/Bahrain": "BH",
  "Asia/Kuwait": "KW",
  "Asia/Muscat": "OM",
  "Asia/Aden": "YE",
  "Asia/Kabul": "AF",
  "Asia/Tashkent": "UZ",
  "Asia/Almaty": "KZ",
  "Asia/Bishkek": "KG",
  "Asia/Dushanbe": "TJ",
  "Asia/Ashgabat": "TM",
  "Asia/Ulaanbaatar": "MN",
  "Asia/Yerevan": "AM",
  "Asia/Baku": "AZ",
  "Asia/Tbilisi": "GE",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Johannesburg": "ZA",
  "Africa/Nairobi": "KE",
  "Africa/Algiers": "DZ",
  "Africa/Casablanca": "MA",
  "Africa/Tunis": "TN",
  "Africa/Tripoli": "LY",
  "Africa/Khartoum": "SD",
  "Africa/Addis_Ababa": "ET",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG",
  "Africa/Kigali": "RW",
  "Africa/Accra": "GH",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Douala": "CM",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Darwin": "AU",
  "Pacific/Auckland": "NZ",
  "Pacific/Fiji": "FJ"
};
function detectPassport() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var iso = TZ_FALLBACK[tz];
    if (iso && window.PASSPORTS[iso]) return iso;
  } catch (e) {}
  return null;
}
function App() {
  var _useTweaks = useTweaks(TWEAK_DEFAULTS),
    _useTweaks2 = _slicedToArray(_useTweaks, 2),
    t = _useTweaks2[0],
    setTweak = _useTweaks2[1];
  var _useState3 = useState(function () {
      try {
        var saved = localStorage.getItem("atlas.passport");
        return saved && window.PASSPORTS[saved] ? saved : null;
      } catch (e) {
        return null;
      }
    }),
    _useState4 = _slicedToArray(_useState3, 2),
    passport = _useState4[0],
    setPassport = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    compare = _useState6[0],
    setCompare = _useState6[1];
  var _useState7 = useState("all"),
    _useState8 = _slicedToArray(_useState7, 2),
    filter = _useState8[0],
    setFilter = _useState8[1];
  var _useState9 = useState(null),
    _useState0 = _slicedToArray(_useState9, 2),
    detailCountry = _useState0[0],
    _setDetailCountry = _useState0[1];
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    search = _useState10[0],
    setSearch = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    focusedCountry = _useState12[0],
    setFocusedCountry = _useState12[1];
  var _useState13 = useState(false),
    _useState14 = _slicedToArray(_useState13, 2),
    showIntro = _useState14[0],
    setShowIntro = _useState14[1];
  var dismissIntro = useCallback(function () {
    return setShowIntro(false);
  }, []);
  var reopenIntro = useCallback(function () {
    return setShowIntro(true);
  }, []);
  var _useState15 = useState(null),
    _useState16 = _slicedToArray(_useState15, 2),
    pickerMode = _useState16[0],
    setPickerMode = _useState16[1];
  var _useState17 = useState(null),
    _useState18 = _slicedToArray(_useState17, 2),
    autoDetectedPassport = _useState18[0],
    setAutoDetectedPassport = _useState18[1];
  var _useState19 = useState("outgoing"),
    _useState20 = _slicedToArray(_useState19, 2),
    direction = _useState20[0],
    setDirection = _useState20[1];
  var _useState21 = useState([]),
    _useState22 = _slicedToArray(_useState21, 2),
    groupPassports = _useState22[0],
    setGroupPassports = _useState22[1];
  var _useState23 = useState(function () {
      try {
        return localStorage.getItem("atlas.variant") || "ordinary";
      } catch (e) {
        return "ordinary";
      }
    }),
    _useState24 = _slicedToArray(_useState23, 2),
    passportVariant = _useState24[0],
    setPassportVariant = _useState24[1];
  var updatePassportVariant = useCallback(function (v) {
    setPassportVariant(v);
    try {
      localStorage.setItem("atlas.variant", v);
    } catch (e) {}
  }, []);
  useEffect(function () {
    updatePassportVariant("ordinary");
  }, [passport, updatePassportVariant]);
  var _useState25 = useState(function () {
      try {
        return JSON.parse(localStorage.getItem("atlas.permits") || "[]");
      } catch (e) {
        return [];
      }
    }),
    _useState26 = _slicedToArray(_useState25, 2),
    residencePermits = _useState26[0],
    setResidencePermitsState = _useState26[1];
  var setResidencePermits = useCallback(function (next) {
    var arr = Array.isArray(next) ? next : [];
    window.ATLAS_RESIDENCE_PERMITS = arr;
    setResidencePermitsState(arr);
    try {
      localStorage.setItem("atlas.permits", JSON.stringify(arr));
    } catch (e) {}
  }, []);
  useEffect(function () {
    window.ATLAS_RESIDENCE_PERMITS = residencePermits;
  }, []);
  useEffect(function () {
    try {
      if (passport) localStorage.setItem("atlas.passport", passport);
    } catch (e) {}
  }, [passport]);
  useEffect(function () {
    if (passport) return;
    var guess = detectPassport();
    if (guess) {
      setPassport(guess);
      setAutoDetectedPassport(guess);
    }
  }, []);
  var choosePassport = useCallback(function (iso2) {
    setAutoDetectedPassport(null);
    setPassport(iso2);
  }, []);
  useEffect(function () {
    applyThemeClass(t.background === "dark" ? "dark" : "light");
  }, [t.background]);
  useEffect(function () {
    var onStorage = function onStorage(e) {
      if (e.key !== "atlas.tweaks" || !e.newValue) return;
      try {
        var tw = JSON.parse(e.newValue);
        if (tw.background && tw.background !== t.background) {
          setTweak("background", tw.background);
        }
      } catch (err) {}
    };
    window.addEventListener("storage", onStorage);
    return function () {
      return window.removeEventListener("storage", onStorage);
    };
  }, [t.background, setTweak]);
  useEffect(function () {
    var onKey = function onKey(e) {
      if (e.key === "Escape") {
        if (showIntro) dismissIntro();
        if (detailCountry) _setDetailCountry(null);
      }
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target && e.target.tagName || "")) {
        var _document$getElementB;
        e.preventDefault();
        (_document$getElementB = document.getElementById("country-search")) === null || _document$getElementB === void 0 || _document$getElementB.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return function () {
      return window.removeEventListener("keydown", onKey);
    };
  }, [detailCountry, showIntro, dismissIntro]);
  var onCountryClick = function onCountryClick(iso2) {
    if (pickerMode && window.PASSPORTS[iso2]) {
      if (pickerMode === "primary") choosePassport(iso2);else if (pickerMode === "compare") setCompare(iso2);
      setPickerMode(null);
      return;
    }
    if (!passport) {
      if (window.PASSPORTS[iso2]) choosePassport(iso2);
      return;
    }
    _setDetailCountry(iso2);
    setFocusedCountry(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
  };
  var onPickFromSearch = function onPickFromSearch(iso2) {
    _setDetailCountry(iso2);
    setFocusedCountry(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
  };
  return React.createElement("div", {
    className: "layout"
  }, React.createElement(Masthead, {
    view: t.globeStyle,
    onView: function onView(v) {
      return setTweak("globeStyle", v);
    },
    theme: t.background === "dark" ? "dark" : "light",
    onTheme: function onTheme(v) {
      return setTweak("background", v);
    },
    onHelp: reopenIntro
  }), showIntro && React.createElement(IntroDialog, {
    onClose: dismissIntro
  }), React.createElement("div", {
    className: "globe-stage"
  }, React.createElement(Globe, {
    passport: passport,
    comparePassport: t.compareMode ? compare : null,
    groupPassports: t.groupMode ? groupPassports : null,
    filter: filter,
    mode: t.globeStyle,
    direction: direction,
    variant: passportVariant,
    residencePermits: residencePermits,
    onCountryClick: onCountryClick,
    focusedCountry: focusedCountry
  }), passport && !detailCountry && React.createElement(MapKey, null), React.createElement(CompareStrip, {
    enabled: t.compareMode,
    passport: passport,
    compare: compare
  }), !detailCountry && React.createElement(ChangelogFloater, null)), React.createElement(Panel, {
    passport: passport,
    setPassport: choosePassport,
    autoDetected: !!passport && passport === autoDetectedPassport,
    compare: compare,
    setCompare: setCompare,
    compareMode: t.compareMode,
    setCompareMode: function setCompareMode(v) {
      return setTweak("compareMode", v);
    },
    groupMode: t.groupMode,
    setGroupMode: function setGroupMode(v) {
      return setTweak("groupMode", v);
    },
    groupPassports: groupPassports,
    setGroupPassports: setGroupPassports,
    filter: filter,
    setFilter: setFilter,
    direction: direction,
    setDirection: setDirection,
    detailCountry: detailCountry,
    setDetailCountry: function setDetailCountry(v) {
      _setDetailCountry(v);
      if (v && window.atlasSheet) window.atlasSheet.ensure(0.48);
    },
    search: search,
    setSearch: setSearch,
    onPickFromSearch: onPickFromSearch,
    showCompare: t.compareMode,
    variant: passportVariant,
    setVariant: updatePassportVariant,
    residencePermits: residencePermits,
    setResidencePermits: setResidencePermits,
    pickerMode: pickerMode,
    setPickerMode: setPickerMode
  }));
}
function interpolateNodes(str, nodes) {
  var parts = String(str).split(/(\{\w+\})/g);
  return parts.map(function (p, i) {
    var m = p.match(/^\{(\w+)\}$/);
    return m && nodes[m[1]] != null ? React.createElement(React.Fragment, {
      key: i
    }, nodes[m[1]]) : p;
  });
}
function IntroDialog(_ref) {
  var onClose = _ref.onClose;
  useLangTick();
  var n = (window.PASSPORT_LIST || []).length || 199;
  var sign = window.t ? window.t("intro.sign") : "";
  return React.createElement("div", {
    className: "dialog-scrim",
    onClick: onClose
  }, React.createElement("div", {
    className: "dialog",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "intro-title",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, React.createElement("div", {
    className: "dialog-band",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "dialog-body"
  }, React.createElement("div", {
    className: "dialog-top"
  }, React.createElement(BrandMark, {
    className: "brand-mark"
  }), React.createElement("span", {
    className: "brand-word"
  }, "travelnow", React.createElement("span", {
    className: "brand-tld"
  }, ".info")), React.createElement(LangSelect, null)), React.createElement("div", {
    className: "welcome-kicker"
  }, tr("intro.kicker", "An independent visa atlas")), React.createElement("h1", {
    id: "intro-title"
  }, tr("intro.headline", "Visa rules for {n} passports, on one map.", {
    n: n
  })), React.createElement("p", null, tr("intro.lede", "")), React.createElement("ol", null, [1, 2, 3].map(function (i) {
    return React.createElement("li", {
      key: i
    }, React.createElement("span", null, tr("intro.step_".concat(i), "")));
  })), sign && sign !== "intro.sign" && React.createElement("p", {
    className: "dialog-sign"
  }, interpolateNodes(sign, {
    name: React.createElement("strong", null, "Uygar Atalay"),
    email: React.createElement("a", {
      href: "mailto:hello@travelnow.info"
    }, "hello@travelnow.info")
  })), React.createElement("button", {
    className: "btn btn-primary btn-block",
    onClick: onClose,
    autoFocus: true
  }, tr("intro.open", "Open the map")))));
}
function MapKey() {
  var keys = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];
  var permitsActive = Array.isArray(window.ATLAS_RESIDENCE_PERMITS) && window.ATLAS_RESIDENCE_PERMITS.length > 0;
  return React.createElement("div", {
    className: "map-key overlay-card"
  }, React.createElement("div", {
    className: "map-key-title"
  }, tr("map.key", "Key")), React.createElement("ul", null, keys.map(function (k) {
    return React.createElement("li", {
      key: k
    }, React.createElement(Swatch, {
      s: k
    }), React.createElement("span", null, statusLabel(k)));
  }), permitsActive && React.createElement("li", null, React.createElement("span", {
    className: "sw sw-permit",
    "aria-hidden": "true"
  }), React.createElement("span", null, window.t("status.permit")))));
}
function CompareStrip(_ref2) {
  var enabled = _ref2.enabled,
    passport = _ref2.passport,
    compare = _ref2.compare;
  if (!enabled || !compare || !passport) return null;
  var a = window.byIso2[passport];
  var b = window.byIso2[compare];
  var ta = window.tally(passport);
  var tb = window.tally(compare);
  if (!a || !b || !ta || !tb) return null;
  var sa = window.mobilityScore(ta),
    sb = window.mobilityScore(tb);
  var d = sa - sb;
  return React.createElement("div", {
    className: "compare-strip overlay-card"
  }, React.createElement("div", {
    style: {
      boxShadow: "inset 3px 0 0 var(--self)"
    }
  }, React.createElement("span", {
    className: "flag"
  }, a.flag), React.createElement("span", null, window.countryName(passport)), React.createElement("span", {
    className: "n"
  }, sa)), React.createElement("div", {
    style: {
      boxShadow: "inset 3px 0 0 var(--compare-self)"
    }
  }, React.createElement("span", {
    className: "flag"
  }, b.flag), React.createElement("span", null, window.countryName(compare)), React.createElement("span", {
    className: "n"
  }, sb)), React.createElement("div", null, React.createElement("span", {
    className: "n",
    style: {
      color: d > 0 ? "var(--vf)" : d < 0 ? "var(--vr)" : "var(--ink-3)",
      fontWeight: 600
    }
  }, d > 0 ? "+" : "", d)));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));

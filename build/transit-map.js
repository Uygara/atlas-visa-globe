// Generated from components/transit-map.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
var TG_COLOR = window.TRANSIT_GLOBE_COLOR;
function readSavedPassport() {
  try {
    return localStorage.getItem("atlas.passport") || null;
  } catch (e) {
    return null;
  }
}
function savePassport(iso2) {
  try {
    if (iso2) localStorage.setItem("atlas.passport", iso2);
  } catch (e) {}
}
function readView() {
  try {
    return sessionStorage.getItem("atlas.globeStyle") || "globe3d";
  } catch (e) {
    return "globe3d";
  }
}
function TransitMapApp() {
  var _useState = useState(function () {
      return readSavedPassport();
    }),
    _useState2 = _slicedToArray(_useState, 2),
    passport = _useState2[0],
    setPassport = _useState2[1];
  var _useState3 = useState(readView),
    _useState4 = _slicedToArray(_useState3, 2),
    mode = _useState4[0],
    setModeState = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    selected = _useState6[0],
    setSelected = _useState6[1];
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
  var openCountry = function openCountry(iso2) {
    setSelected(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
  };
  useEffect(function () {
    savePassport(passport);
  }, [passport]);
  useEffect(function () {
    var el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, []);
  var fillResolver = useCallback(function (iso2) {
    if (!passport) return {
      color: "var(--land)",
      status: "na"
    };
    var t = window.transitStatusForGlobe(passport, iso2);
    return _objectSpread(_objectSpread({}, t), {}, {
      color: TG_COLOR[t.status] || "var(--land)"
    });
  }, [passport]);
  var hoverRenderer = useCallback(function (hover) {
    return React.createElement(TransitHover, {
      hover: hover,
      passport: passport
    });
  }, [passport]);
  return React.createElement("div", {
    className: "layout"
  }, React.createElement(Masthead, {
    theme: theme,
    onTheme: setTheme
  }), React.createElement("div", {
    className: "globe-stage has-key"
  }, React.createElement(Globe, {
    passport: passport,
    mode: mode,
    onView: setMode,
    fillResolver: fillResolver,
    hoverRenderer: hoverRenderer,
    onCountryClick: openCountry,
    focusedCountry: selected
  }), React.createElement(TransitLegend, null)), React.createElement(PanelResizer, null), React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement(TransitPanelHeader, null), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 1
  }, window.t("tmap.pick")), React.createElement(TransitPicker, {
    value: passport,
    onChange: function onChange(v) {
      setPassport(v);
      setSelected(null);
    }
  }), !passport && React.createElement("div", {
    className: "box box-dashed p-hint",
    style: {
      marginTop: 10
    }
  }, window.t("tmap.pick_prompt"))), passport && React.createElement(TransitSchengenSummary, {
    passport: passport,
    onOpen: openCountry
  }), passport && selected && React.createElement(TransitDetail, {
    passport: passport,
    iso2: selected,
    onClose: function onClose() {
      return setSelected(null);
    }
  }), passport && React.createElement(TransitLegChecker, {
    passport: passport,
    onOpen: openCountry
  }), passport && React.createElement(TransitHubList, {
    passport: passport,
    onOpen: openCountry
  }), React.createElement("footer", {
    className: "panel-foot"
  }, window.t("tmap.disclaimer"))));
}
function TransitPanelHeader() {
  return React.createElement("header", {
    className: "p-head",
    style: {
      display: "block"
    }
  }, React.createElement("h1", {
    className: "p-head-title"
  }, window.t("tmap.title")), React.createElement("p", {
    className: "p-head-sub"
  }, window.t("tmap.subtitle")));
}
function TransitPicker(_ref) {
  var value = _ref.value,
    onChange = _ref.onChange;
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    open = _useState8[0],
    setOpen = _useState8[1];
  var _useState9 = useState(""),
    _useState0 = _slicedToArray(_useState9, 2),
    q = _useState0[0],
    setQ = _useState0[1];
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
  var country = value ? window.byIso2[value] : null;
  var list = useMemo(function () {
    var ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(function (p) {
      return !ql || p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql);
    });
  }, [q]);
  return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative"
    }
  }, React.createElement("button", {
    type: "button",
    className: "pp-card",
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, country ? React.createElement("span", {
    className: "pp-main"
  }, React.createElement("span", {
    className: "flag pp-flag",
    "aria-hidden": "true"
  }, country.flag), React.createElement("span", {
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
  }, window.t("picker.select_passport")), React.createElement(IconCaret, null))), open && React.createElement("div", {
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
    placeholder: window.t("tmap.search"),
    value: q,
    onChange: function onChange(e) {
      return setQ(e.target.value);
    }
  }), React.createElement("div", {
    className: "dd-list"
  }, list.map(function (p) {
    var c = window.byIso2[p.iso2];
    var active = p.iso2 === value;
    return React.createElement("button", {
      key: p.iso2,
      type: "button",
      className: "dd-item",
      "aria-selected": active,
      onClick: function onClick() {
        onChange(p.iso2);
        setOpen(false);
        setQ("");
      }
    }, React.createElement("span", {
      className: "flag"
    }, c === null || c === void 0 ? void 0 : c.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(p.iso2)), React.createElement("span", {
      className: "dd-code"
    }, p.iso2));
  }))));
}
function TransitLegend() {
  var items = [{
    s: "vf",
    k: "tmap.legend_free"
  }, {
    s: "eta",
    k: "tmap.legend_twov"
  }, {
    s: "ev",
    k: "tmap.legend_auth"
  }, {
    s: "voa",
    k: "tmap.legend_atv"
  }, {
    s: "vr",
    k: "tmap.legend_vr"
  }, {
    s: "na",
    k: "tmap.legend_unknown"
  }];
  return React.createElement("div", {
    className: "map-key map-key-below overlay-card"
  }, React.createElement("div", {
    className: "map-key-title"
  }, window.t("tmap.legend")), React.createElement("ul", null, items.map(function (i) {
    return React.createElement("li", {
      key: i.k
    }, React.createElement(Swatch, {
      s: i.s
    }), React.createElement("span", null, window.t(i.k)));
  })));
}
var AUTH_DOC = {
  US: "ESTA",
  CA: "eTA"
};
function transitLine(t) {
  if (t.status === "vr") return {
    label: window.t("tmap.needs_visa"),
    color: TG_COLOR.vr,
    s: "vr"
  };
  if (t.status === "atv") return {
    label: window.t("tmap.atv"),
    color: TG_COLOR.atv,
    s: "voa"
  };
  if (t.status === "auth") return {
    label: window.t("tmap.auth", {
      doc: t.authDoc || AUTH_DOC[t.area] || "ETA"
    }),
    color: TG_COLOR.auth,
    s: "ev"
  };
  if (t.status === "twov" && !t.twovHours) return {
    label: window.t("tmap.cond_ok"),
    color: TG_COLOR.twov,
    s: "eta"
  };
  if (t.status === "twov") return {
    label: window.t("tmap.twov_ok", {
      n: t.twovHours
    }),
    color: TG_COLOR.twov,
    s: "eta"
  };
  if (t.status === "free") return {
    label: window.t("tmap.free_ok"),
    color: TG_COLOR.free,
    s: "vf"
  };
  if (t.status === "unknown") return {
    label: window.t("tmap.unknown"),
    color: TG_COLOR.unknown,
    s: "na"
  };
  return null;
}
function transitWhy(passport, iso2, t) {
  var country = window.countryName(iso2);
  var out = [];
  if (t.status === "unknown") out.push(window.t(t.unverified ? "tmap.why_unverified" : "tmap.why_unknown", {
    country: country
  }));else if (t.generic && t.byEntry) out.push(window.t("tmap.why_entry_free"));else if (t.status === "atv" && t.area === "SCHENGEN") out.push(window.t(t.basis === "common" ? "tmap.why_common" : "tmap.why_national", {
    country: country
  }));else if (t.status === "atv" && t.area === "GB") out.push(window.t("tmap.why_gb"));else if (t.status === "atv") out.push(window.t("tmap.why_list", {
    country: country
  }));else if (t.status === "auth" && t.kind !== "visa") out.push(window.t("tmap.why_auth", {
    doc: t.authDoc || "ETA"
  }));else if (t.status === "auth") {
    out.push(window.t("tmap.why_no_airside", {
      country: country
    }));
    out.push(window.t("tmap.why_auth", {
      doc: t.authDoc || AUTH_DOC[t.area] || "ETA"
    }));
  } else if (t.status === "vr" && t.kind === "visa") out.push(window.t("tmap.why_no_airside", {
    country: country
  }));else if (t.status === "free" && t.byEntry) out.push(window.t("tmap.why_entry_free"));else if (t.status === "free" && t.area === "SCHENGEN") out.push(window.t("tmap.why_free_schengen", {
    country: country
  }));
  if (t.area === "SCHENGEN" && !t.byEntry && (t.status === "free" || t.status === "atv")) out.push(window.t("tmap.schengen_entry"));
  if (t.condition) out.push(tr("tmap.cond_" + passport + "_" + (t.state || t.area), t.condition));
  return out;
}
function TransitExemptions(_ref2) {
  var t = _ref2.t;
  if (t.status !== "atv" || !t.exemptions || !t.exemptions.length) return null;
  return React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 600
    }
  }, window.t("tmap.exemptions")), React.createElement("ul", {
    className: "note-s",
    style: {
      margin: "4px 0 0",
      paddingInlineStart: 18
    }
  }, t.exemptions.map(function (ex, i) {
    return React.createElement("li", {
      key: i
    }, tr("tmap.ex_" + ex.key, ex.note));
  })), t.area === "SCHENGEN" && React.createElement("span", {
    className: "note-s",
    style: {
      display: "block",
      marginTop: 4
    }
  }, window.t("tmap.no_uk_visa")));
}
function fmtDay(iso) {
  try {
    return new Date(iso + "T00:00:00Z").toLocaleDateString(window.ATLAS_LANG || "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
  } catch (e) {
    return iso;
  }
}
function TransitSource(_ref3) {
  var t = _ref3.t;
  if (!t.source) return null;
  var nat = t.area === "SCHENGEN" && t.basis === "national" && window.SCHENGEN_NATIONAL_ATV;
  return React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "6px 0 0"
    }
  }, React.createElement("a", {
    className: "link-quiet",
    href: t.source,
    target: "_blank",
    rel: "noopener noreferrer"
  }, window.t("tmap.source"), " \u2192"), nat && React.createElement("span", null, " · " + window.t("tmap.checked", {
    date: fmtDay(nat.checked)
  })));
}
function TransitHover(_ref4) {
  var hover = _ref4.hover,
    passport = _ref4.passport;
  var dest = window.byIso2[hover.iso2];
  if (!dest || !passport) return null;
  var t = window.transitStatusForGlobe(passport, hover.iso2);
  var line = transitLine(t);
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
  }, dest.flag), React.createElement("span", null, window.countryName(hover.iso2))), line ? React.createElement("div", {
    className: "hovercard-row"
  }, React.createElement(Dot, {
    s: line.s
  }), React.createElement("span", null, line.label)) : React.createElement("div", {
    className: "hovercard-row hovercard-cap"
  }, window.t("tmap.legend_na")));
}
function TransitDetail(_ref5) {
  var passport = _ref5.passport,
    iso2 = _ref5.iso2,
    onClose = _ref5.onClose;
  var dest = window.byIso2[iso2];
  var t = window.transitStatusForGlobe(passport, iso2);
  var line = transitLine(t);
  if (!dest) return null;
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
    "aria-label": window.t("detail.close")
  }, React.createElement(IconClose, null)))), line ? React.createElement("div", {
    className: "entry-verdict"
  }, React.createElement("div", {
    className: "stamp",
    style: {
      "--st": "var(--".concat(line.s, ")")
    }
  }, React.createElement("span", {
    className: "stamp-k",
    style: {
      fontSize: 17
    }
  }, line.label))) : React.createElement("p", {
    className: "entry-note",
    style: {
      marginTop: 10
    }
  }, window.t("tmap.legend_na")), transitWhy(passport, iso2, t).map(function (x, i) {
    return React.createElement("p", {
      key: i,
      className: "entry-note"
    }, x);
  }), React.createElement(TransitExemptions, {
    t: t
  }), t.notes && t.area !== "SCHENGEN" && !(t.area === "AU" && t.status === "atv") && !t.byEntry && t.status !== "unknown" && React.createElement("p", {
    className: "entry-note"
  }, tr("tmap.note_" + t.area, t.notes)), React.createElement(TransitSource, {
    t: t
  }));
}
function TransitLegChecker(_ref6) {
  var passport = _ref6.passport,
    onOpen = _ref6.onOpen;
  var _useState1 = useState({
      from: "",
      via: "",
      to: ""
    }),
    _useState10 = _slicedToArray(_useState1, 2),
    codes = _useState10[0],
    setCodes = _useState10[1];
  var A = window.AIRPORTS || {};
  var set = function set(k) {
    return function (e) {
      return setCodes(function (c) {
        return _objectSpread(_objectSpread({}, c), {}, _defineProperty({}, k, e.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3)));
      });
    };
  };
  var known = function known(c) {
    return c.length === 3 && !!A[c];
  };
  var place = function place(c) {
    return A[c] ? A[c][1] + ", " + window.countryName(A[c][0]) : null;
  };
  var leg = codes.via.length === 3 ? window.transitLeg(passport, codes.from, codes.via, codes.to) : null;
  var t = leg && !leg.error ? leg.status : null;
  var line = t ? transitLine(t) : null;
  var field = function field(k, label) {
    return React.createElement("label", {
      style: {
        flex: "1 1 0",
        minWidth: 0
      }
    }, React.createElement("span", {
      className: "p-hint",
      style: {
        display: "block",
        margin: "0 0 3px"
      }
    }, label), React.createElement("input", {
      className: "field",
      value: codes[k],
      onChange: set(k),
      inputMode: "text",
      autoCapitalize: "characters",
      autoComplete: "off",
      spellCheck: "false",
      maxLength: 3,
      placeholder: {
        from: "IST",
        via: "FRA",
        to: "JFK"
      }[k],
      style: {
        width: "100%",
        textTransform: "uppercase",
        letterSpacing: "0.08em"
      },
      "aria-label": label
    }));
  };
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, window.t("tmap.leg_title")), React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "0 0 8px"
    }
  }, window.t("tmap.leg_hint")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, field("from", window.t("tmap.leg_from")), field("via", window.t("tmap.leg_via")), field("to", window.t("tmap.leg_to"))), ["from", "via", "to"].map(function (k) {
    return codes[k].length === 3 && !known(codes[k]) && React.createElement("p", {
      key: k,
      className: "p-fine",
      style: {
        margin: "6px 0 0"
      }
    }, codes[k], ": ", window.t("tmap.leg_unknown"));
  }), leg && !leg.error && React.createElement("div", {
    style: {
      marginTop: 10
    },
    "aria-live": "polite"
  }, React.createElement("p", {
    className: "entry-note",
    style: {
      margin: "0 0 6px"
    }
  }, window.t("tmap.leg_in", {
    place: leg.via[1],
    country: window.countryName(leg.viaIso)
  })), leg.entry ? React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, window.t("tmap.leg_not_transit", {
    country: window.countryName(leg.viaIso)
  }))) : React.createElement(React.Fragment, null, line && React.createElement("div", {
    className: "note " + (t.status === "vr" || t.status === "atv" ? "note-risk" : t.status === "free" ? "note-ok" : "note-warn")
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 600
    }
  }, line.label)), transitWhy(passport, leg.viaIso, t).filter(function (x) {
    return x !== window.t("tmap.schengen_entry");
  }).map(function (x, i) {
    return React.createElement("p", {
      key: i,
      className: "entry-note"
    }, x);
  }), leg.legExemptions.map(function (ex, i) {
    return React.createElement("div", {
      key: i,
      className: "note note-info"
    }, React.createElement("span", {
      className: "note-k",
      style: {
        fontWeight: 500
      }
    }, window.t("tmap.leg_exempt", {
      country: window.countryName((ex.holds || []).find(function (h) {
        return [leg.fromIso, leg.toIso].includes(String(h).toUpperCase());
      }))
    })));
  }), t.status === "twov" && leg.thirdCountry !== null && React.createElement("p", {
    className: "entry-note"
  }, window.t("tmap.leg_third", {
    answer: window.t(leg.thirdCountry ? "tmap.leg_yes" : "tmap.leg_no")
  })), t.notes && t.area !== "SCHENGEN" && !(t.area === "AU" && t.status === "atv") && !t.byEntry && t.status !== "unknown" && React.createElement("p", {
    className: "entry-note"
  }, tr("tmap.note_" + t.area, t.notes))), React.createElement("button", {
    type: "button",
    className: "btn",
    style: {
      marginTop: 6
    },
    onClick: function onClick() {
      return onOpen(leg.viaIso);
    }
  }, window.t("tmap.leg_open", {
    country: window.countryName(leg.viaIso)
  }))));
}
function TransitSchengenSummary(_ref7) {
  var passport = _ref7.passport,
    onOpen = _ref7.onOpen;
  var S = window.ETIAS && window.ETIAS.schengenStates;
  if (!S || !window.schengenAtvFor) return null;
  var entry = window.resolveStatus ? (window.resolveStatus(passport, "DE") || {}).status : null;
  if (S.includes(passport) || entry === "vf" || entry === "idc" || entry === "self") return null;
  var all = window.schengenAtvFor(passport);
  var states = all.needs ? [] : (all.states || []).filter(function (x) {
    return S.includes(x) && x !== "CY";
  }).sort(function (a, b) {
    return window.countryName(a).localeCompare(window.countryName(b));
  });
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement("div", {
    className: "note " + (all.needs || states.length ? "note-warn" : "note-ok")
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 600
    }
  }, window.t("tmap.schengen_title")), React.createElement("span", {
    className: "note-s"
  }, all.needs ? window.t("tmap.atv_common") : states.length ? React.createElement(React.Fragment, null, window.t("tmap.atv_states", {
    list: "\x01"
  }).split("\x01")[0], states.map(function (x, i) {
    return React.createElement(React.Fragment, {
      key: x
    }, i ? ", " : "", React.createElement("button", {
      type: "button",
      className: "link-quiet",
      style: {
        padding: 0,
        border: 0,
        background: "none",
        cursor: "pointer",
        font: "inherit"
      },
      onClick: function onClick() {
        return onOpen(x);
      }
    }, window.countryName(x)));
  }), window.t("tmap.atv_states", {
    list: "\x01"
  }).split("\x01")[1]) : window.t("tmap.atv_none")), React.createElement("span", {
    className: "note-s",
    style: {
      display: "block",
      marginTop: 4
    }
  }, window.t("tmap.schengen_entry"))));
}
function TransitHubList(_ref8) {
  var passport = _ref8.passport,
    onOpen = _ref8.onOpen;
  var hubs = window.COMMON_TRANSIT_HUBS || [];
  var rows = hubs.map(function (h) {
    var iso = h.state || h.area;
    var t = window.transitStatusForGlobe(passport, iso);
    var c = window.byIso2[iso];
    var hubLabel = c && h.hubLabel === c.name.replace(/\s*\(.*\)$/, "") ? window.countryName(iso) : tr("hub." + iso, h.hubLabel);
    return _objectSpread(_objectSpread({}, h), {}, {
      hubLabel: hubLabel,
      iso: iso,
      t: t,
      line: transitLine(t)
    });
  });
  return React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 3
  }, window.t("tmap.hubs")), React.createElement("ul", {
    className: "ledger"
  }, rows.map(function (r) {
    return React.createElement("li", {
      key: r.iso
    }, React.createElement("button", {
      type: "button",
      className: "lg-row",
      onClick: function onClick() {
        return onOpen(r.iso);
      }
    }, r.line ? React.createElement(Swatch, {
      s: r.line.s
    }) : React.createElement("span", {
      className: "sw sw-all",
      "aria-hidden": "true"
    }), React.createElement("span", {
      className: "lg-label",
      style: {
        whiteSpace: "normal"
      }
    }, r.hubLabel), React.createElement("span", {
      className: "lg-dots"
    }), React.createElement("span", {
      className: "lg-n",
      style: {
        fontSize: 12,
        color: "var(--ink-2)",
        textAlign: "end"
      }
    }, r.line ? r.line.label : r.iso === passport ? tr("tmap.home_hub", "Your own country") : "-")));
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(TransitMapApp, null));

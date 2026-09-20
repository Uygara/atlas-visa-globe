// Generated from components/panel.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function _permitLabel(code) {
  var map = {
    SCHENGEN: "Schengen",
    US: "US",
    GB: "UK",
    CA: "Canada",
    AU: "Australia/NZ",
    GCC: "GCC",
    AE: "UAE",
    SA: "Saudi",
    KW: "Kuwait",
    QA: "Qatar",
    BH: "Bahrain",
    OM: "Oman"
  };
  return map[code] || code;
}
function Panel(_ref) {
  var passport = _ref.passport,
    setPassport = _ref.setPassport,
    autoDetected = _ref.autoDetected,
    compare = _ref.compare,
    setCompare = _ref.setCompare,
    compareMode = _ref.compareMode,
    setCompareMode = _ref.setCompareMode,
    groupMode = _ref.groupMode,
    setGroupMode = _ref.setGroupMode,
    groupPassports = _ref.groupPassports,
    setGroupPassports = _ref.setGroupPassports,
    filter = _ref.filter,
    setFilter = _ref.setFilter,
    detailCountry = _ref.detailCountry,
    setDetailCountry = _ref.setDetailCountry,
    search = _ref.search,
    setSearch = _ref.setSearch,
    onPickFromSearch = _ref.onPickFromSearch,
    showCompare = _ref.showCompare,
    direction = _ref.direction,
    setDirection = _ref.setDirection,
    variant = _ref.variant,
    setVariant = _ref.setVariant,
    residencePermits = _ref.residencePermits,
    setResidencePermits = _ref.setResidencePermits,
    pickerMode = _ref.pickerMode,
    setPickerMode = _ref.setPickerMode;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    showPicker = _useState2[0],
    setShowPickerRaw = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    showComparePicker = _useState4[0],
    setShowComparePickerRaw = _useState4[1];
  var setShowPicker = function setShowPicker(v) {
    setShowPickerRaw(v);
    if (setPickerMode) setPickerMode(v ? "primary" : null);
    if (v) setShowComparePickerRaw(false);
  };
  var setShowComparePicker = function setShowComparePicker(v) {
    setShowComparePickerRaw(v);
    if (setPickerMode) setPickerMode(v ? "compare" : null);
    if (v) setShowPickerRaw(false);
  };
  useLangTick();
  var groupActive = groupMode && groupPassports && groupPassports.length > 0;
  var tallyData = groupActive ? window.tallyGroup(groupPassports) : passport ? direction === "incoming" ? window.tallyIncoming(passport) : variant && variant !== "ordinary" ? window.tallyVariant(passport, variant) : window.tally(passport) : null;
  return React.createElement("aside", {
    className: "panel"
  }, React.createElement(MobileSheetHandle, null), React.createElement(PanelHeader, null), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 1
  }, window.t("panel.your_passport")), React.createElement(PassportPicker, {
    value: passport,
    open: showPicker,
    setOpen: setShowPicker,
    onChange: function onChange(v) {
      setPassport(v);
      setShowPicker(false);
    }
  }), autoDetected && !showPicker && React.createElement("button", {
    type: "button",
    className: "link-quiet guess-note",
    onClick: function onClick() {
      return setShowPicker(true);
    }
  }, tr("picker.guessed", "Guessed from your time zone — not your passport? Change it")), passport && setVariant && window.passportVariants && window.passportVariants(passport).length > 0 && React.createElement(PassportTypeSelector, {
    passport: passport,
    value: variant || "ordinary",
    onChange: setVariant
  }), passport && setResidencePermits && React.createElement(ResidencePermitPicker, {
    value: residencePermits || [],
    onChange: setResidencePermits
  }), passport && setGroupMode && setGroupPassports && !groupMode && React.createElement(DualCitizenshipHint, {
    primary: passport,
    onAccept: function onAccept(secondary) {
      setGroupPassports([passport, secondary]);
      setGroupMode(true);
      if (setCompareMode) setCompareMode(false);
    }
  })), tallyData && React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 2
  }, groupActive ? window.t("tally.group_label") : window.t("panel.direction")), passport && !groupMode && React.createElement(DirectionToggle, {
    value: direction,
    onChange: setDirection,
    passport: passport
  }), React.createElement(Tally, {
    tally: tallyData,
    filter: filter,
    setFilter: setFilter,
    groupActive: groupActive,
    direction: direction
  }), filter !== "all" && React.createElement(FilterList, {
    filter: filter,
    passport: passport,
    direction: direction,
    variant: variant,
    groupPassports: groupActive ? groupPassports : null,
    onOpen: onPickFromSearch
  })), React.createElement("section", {
    className: "p-sec"
  }, React.createElement(CountrySearch, {
    passport: passport,
    search: search,
    setSearch: setSearch,
    onPick: onPickFromSearch
  }), passport === "US" && !groupActive && direction !== "incoming" && React.createElement(PopularDestinations, {
    passport: passport,
    onPick: onPickFromSearch
  })), detailCountry && (passport || groupActive) && React.createElement(DetailCard, {
    passport: passport,
    compare: compareMode && !groupMode ? compare : null,
    groupPassports: groupActive ? groupPassports : null,
    iso2: detailCountry,
    direction: direction,
    variant: variant,
    onClose: function onClose() {
      return setDetailCountry(null);
    }
  }), passport && setCompareMode && setGroupMode && React.createElement("section", {
    className: "p-sec"
  }, React.createElement(Caption, {
    n: 3
  }, window.t("modes.title")), React.createElement(ModeBar, {
    compareMode: compareMode,
    setCompareMode: setCompareMode,
    groupMode: groupMode,
    setGroupMode: setGroupMode
  }), showCompare && !groupMode && React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, React.createElement(PassportPicker, {
    value: compare,
    open: showComparePicker,
    setOpen: setShowComparePicker,
    onChange: function onChange(v) {
      setCompare(v);
      setShowComparePicker(false);
    },
    isCompare: true,
    placeholder: window.t("picker.pick_second"),
    allowClear: true
  })), groupMode && React.createElement(GroupPicker, {
    primary: passport,
    values: groupPassports || [],
    onChange: setGroupPassports
  })), !detailCountry && passport && React.createElement(ForYouSection, null, React.createElement(WeeklyDigest, {
    passport: passport
  }), !groupActive && React.createElement(PassportPulse, {
    passport: passport
  }), React.createElement(WatchlistCard, {
    onOpen: function onOpen(iso2) {
      setDetailCountry(iso2);
    }
  }), React.createElement(ItineraryCTA, null), React.createElement(PassportNewsFeed, {
    passport: passport
  })), !detailCountry && !passport && React.createElement(WatchlistCard, {
    onOpen: function onOpen(iso2) {
      setDetailCountry(iso2);
    }
  }), React.createElement(PanelFooter, null));
}
function ForYouSection(_ref2) {
  var children = _ref2.children;
  var _useState5 = useState(function () {
      try {
        return localStorage.getItem("atlas.foryou.collapsed") !== "1";
      } catch (e) {
        return true;
      }
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    open = _useState6[0],
    setOpen = _useState6[1];
  var toggle = function toggle() {
    setOpen(function (o) {
      var next = !o;
      try {
        localStorage.setItem("atlas.foryou.collapsed", next ? "0" : "1");
      } catch (e) {}
      return next;
    });
  };
  return React.createElement("div", null, React.createElement("button", {
    type: "button",
    className: "collapse-btn",
    onClick: toggle,
    "aria-expanded": open
  }, React.createElement(Caption, {
    n: 4
  }, window.t("panel.for_you")), React.createElement(IconCaret, null)), open && children);
}
function PanelHeader() {
  var date = new Date(window.SNAPSHOT_DATE + "T00:00:00");
  var formatted = isNaN(date) ? "" : date.toLocaleDateString(window.ATLAS_LANG || "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  return React.createElement("header", {
    className: "p-head"
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "p-head-title"
  }, window.t("header.tagline"))), formatted && React.createElement("time", {
    className: "p-head-date",
    dateTime: window.SNAPSHOT_DATE,
    title: window.t("footer.refresh")
  }, window.t("header.updated"), " ", formatted));
}
function PassportTypeSelector(_ref3) {
  var passport = _ref3.passport,
    value = _ref3.value,
    onChange = _ref3.onChange;
  var variants = window.passportVariants(passport);
  if (!variants.length) return null;
  var lang = window.ATLAS_LANG || "en";
  var opts = [{
    key: "ordinary",
    label: window.passportVariantLabel(passport, "ordinary"),
    sub: null,
    source: null
  }].concat(_toConsumableArray(variants.map(function (k) {
    var e = window.PASSPORT_VARIANTS[passport][k];
    return {
      key: k,
      label: window.passportVariantLabel(passport, k),
      sub: lang === "tr" ? e.sub || null : e.subEn || e.sub || null,
      source: e.source || null
    };
  })));
  var active = opts.find(function (o) {
    return o.key === value;
  }) || opts[0];
  return React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 5px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("panel.passport_type")), React.createElement("div", {
    className: "seg seg-wide",
    role: "group",
    "aria-label": window.t("panel.passport_type")
  }, opts.map(function (o) {
    return React.createElement("button", {
      key: o.key,
      type: "button",
      "aria-pressed": o.key === value,
      onClick: function onClick() {
        return onChange(o.key);
      },
      title: o.label
    }, o.label);
  })), (active.sub || active.source) && React.createElement("p", {
    className: "p-hint"
  }, active.sub, active.source && React.createElement(React.Fragment, null, " \xB7 ", React.createElement("a", {
    className: "link-quiet",
    href: active.source,
    target: "_blank",
    rel: "noopener nofollow"
  }, window.t("cond.source")))), value !== "ordinary" && React.createElement("p", {
    className: "p-fine",
    style: {
      marginTop: 4
    }
  }, window.t("panel.variant_disclaimer")));
}
function ResidencePermitPicker(_ref4) {
  var value = _ref4.value,
    onChange = _ref4.onChange;
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    open = _useState8[0],
    setOpen = _useState8[1];
  var T = function T(k, fallback) {
    var v = window.t ? window.t(k) : k;
    return v === k ? fallback : v;
  };
  var blocs = [{
    key: "SCHENGEN",
    flag: "🇪🇺",
    label: T("permits.schengen", "Schengen residence")
  }, {
    key: "US",
    flag: "🇺🇸",
    label: T("permits.us", "US Green Card / visa")
  }, {
    key: "GB",
    flag: "🇬🇧",
    label: T("permits.gb", "UK ILR / visa")
  }, {
    key: "CA",
    flag: "🇨🇦",
    label: T("permits.ca", "Canada PR / visa")
  }, {
    key: "AU",
    flag: "🇦🇺",
    label: T("permits.au", "Australia / NZ PR")
  }, {
    key: "GCC",
    flag: "🇸🇦",
    label: T("permits.gcc", "GCC residence")
  }];
  var set = new Set(value);
  var toggle = function toggle(k) {
    var next = new Set(set);
    if (next.has(k)) next["delete"](k);else next.add(k);
    onChange(_toConsumableArray(next));
  };
  var active = value.length > 0;
  return React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, React.createElement("button", {
    type: "button",
    className: "row-btn" + (active ? " is-on" : ""),
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, React.createElement("span", {
    className: "row-btn-label"
  }, active ? React.createElement(React.Fragment, null, T("permits.active", "Holding"), " ", React.createElement("span", {
    className: "flag"
  }, value.map(function (v) {
    var b = blocs.find(function (x) {
      return x.key === v;
    });
    return b ? b.flag : v;
  }).join(" "))) : T("permits.add", "Also have a residence permit? Add it →").replace(/\s*→\s*$/, "")), React.createElement(IconCaret, {
    className: open ? "is-flipped" : ""
  })), open && React.createElement("div", {
    className: "box",
    style: {
      marginTop: 6,
      marginBottom: 0
    }
  }, React.createElement("div", {
    className: "check-grid"
  }, blocs.map(function (b) {
    return React.createElement("label", {
      key: b.key,
      className: "check" + (set.has(b.key) ? " is-on" : "")
    }, React.createElement("input", {
      type: "checkbox",
      checked: set.has(b.key),
      onChange: function onChange() {
        return toggle(b.key);
      }
    }), React.createElement("span", {
      className: "flag"
    }, b.flag), React.createElement("span", null, b.label));
  })), React.createElement("p", {
    className: "p-fine",
    style: {
      margin: "8px 0 0"
    }
  }, T("permits.hint", "Holding any of these unlocks easier entry to certain destinations — the map and the tally update automatically."))));
}
var _POPULAR_DESTS = {
  US: ["MX", "CA", "GB", "FR", "IT", "DO", "JP", "ES"]
};
function PopularDestinations(_ref5) {
  var passport = _ref5.passport,
    onPick = _ref5.onPick;
  var dests = _POPULAR_DESTS[passport];
  if (!dests) return null;
  var T = function T(k, fallback) {
    var v = window.t ? window.t(k) : k;
    return v === k ? fallback : v;
  };
  return React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, T("popular.title", "Popular with US travelers")), React.createElement("div", {
    className: "chips"
  }, dests.map(function (iso2) {
    var c = (window.COUNTRIES || []).find(function (x) {
      return x.iso2 === iso2;
    });
    if (!c) return null;
    var r = window.resolveStatus(passport, iso2);
    return React.createElement("button", {
      key: iso2,
      type: "button",
      className: "chip",
      onClick: function onClick() {
        return onPick(iso2);
      },
      title: statusLabel(r.status)
    }, React.createElement("span", {
      className: "flag"
    }, c.flag), React.createElement("span", null, window.countryName(iso2)), React.createElement(Dot, {
      s: r.status
    }));
  })));
}
function DualCitizenshipHint(_ref6) {
  var primary = _ref6.primary,
    onAccept = _ref6.onAccept;
  var hints = window.DUAL_CITIZENSHIP_HINTS;
  if (!hints || !hints[primary]) return null;
  var hint = hints[primary];
  var list = window.PASSPORT_LIST || [];
  var sec = list.find(function (p) {
    return p.iso2 === hint.suggest;
  });
  if (!sec) return null;
  var T = function T(k, fallback) {
    var v = window.t ? window.t(k) : k;
    return v === k ? fallback : v;
  };
  var verbKey = hint.strength === "strong" ? T("dual.likely", "You probably also hold") : hint.strength === "common" ? T("dual.may_hold", "Many also hold") : T("dual.may_qualify", "You may also qualify for");
  var cflag = (window.COUNTRIES || []).find(function (c) {
    return c.iso2 === hint.suggest;
  });
  return React.createElement("div", {
    className: "note note-accent",
    style: {
      marginTop: 10,
      marginBottom: 0
    }
  }, React.createElement("span", {
    className: "note-k"
  }, cflag && React.createElement("span", {
    className: "flag",
    style: {
      marginRight: 6
    }
  }, cflag.flag), verbKey, " ", T("dual.a_passport", "a"), " ", sec.name, " ", T("dual.passport_word", "passport"), "."), React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    style: {
      gridRow: "1 / span 2",
      gridColumn: 2,
      padding: "5px 10px",
      fontSize: 12.5
    },
    onClick: function onClick() {
      return onAccept(hint.suggest);
    }
  }, T("dual.add_passport", "Add it →").replace(/\s*→\s*$/, "")), React.createElement("span", {
    className: "note-s"
  }, hint.reason));
}
function ModeBar(_ref7) {
  var compareMode = _ref7.compareMode,
    setCompareMode = _ref7.setCompareMode,
    groupMode = _ref7.groupMode,
    setGroupMode = _ref7.setGroupMode;
  var toggleCompare = function toggleCompare() {
    var next = !compareMode;
    setCompareMode(next);
    if (next && groupMode) setGroupMode(false);
  };
  var toggleGroup = function toggleGroup() {
    var next = !groupMode;
    setGroupMode(next);
    if (next && compareMode) setCompareMode(false);
  };
  return React.createElement("div", null, React.createElement("p", {
    className: "p-hint",
    style: {
      margin: "0 0 8px"
    }
  }, window.t("modes.hint")), React.createElement("div", {
    className: "mode-pair"
  }, React.createElement("button", {
    type: "button",
    className: "btn",
    "aria-pressed": compareMode,
    onClick: toggleCompare
  }, React.createElement("span", {
    className: "mode-mark",
    style: {
      "--m": "var(--compare-self)"
    },
    "aria-hidden": "true"
  }, compareMode ? "✓" : "+"), window.t("mode.compare_short")), React.createElement("button", {
    type: "button",
    className: "btn",
    "aria-pressed": groupMode,
    onClick: toggleGroup
  }, React.createElement("span", {
    className: "mode-mark",
    style: {
      "--m": "var(--self)"
    },
    "aria-hidden": "true"
  }, groupMode ? "✓" : "+"), window.t("mode.group_short"))));
}
function DirectionToggle(_ref8) {
  var value = _ref8.value,
    onChange = _ref8.onChange,
    passport = _ref8.passport;
  var cur = value || "outgoing";
  var opts = [{
    v: "outgoing",
    l: window.t("panel.outgoing"),
    hint: window.t("panel.outgoing_hint"),
    a: passport + " →"
  }, {
    v: "incoming",
    l: window.t("panel.incoming"),
    hint: window.t("panel.incoming_hint"),
    a: "→ " + passport
  }];
  var active = opts.find(function (o) {
    return o.v === cur;
  });
  return React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, React.createElement("div", {
    className: "tabs",
    role: "tablist",
    "aria-label": window.t("panel.direction")
  }, opts.map(function (o) {
    return React.createElement("button", {
      key: o.v,
      type: "button",
      role: "tab",
      "aria-selected": o.v === cur,
      onClick: function onClick() {
        return onChange(o.v);
      },
      title: o.hint
    }, React.createElement("span", {
      className: "arrow"
    }, o.a), o.l);
  })), React.createElement("p", {
    className: "p-hint"
  }, active === null || active === void 0 ? void 0 : active.hint));
}
function GroupPicker(_ref9) {
  var primary = _ref9.primary,
    values = _ref9.values,
    onChange = _ref9.onChange;
  var _useState9 = useState(false),
    _useState0 = _slicedToArray(_useState9, 2),
    pickerOpen = _useState0[0],
    setPickerOpen = _useState0[1];
  var MAX = 10;
  useEffect(function () {
    if (primary && values.length === 0) onChange([primary]);
  }, [primary]);
  var remove = function remove(iso) {
    return onChange(values.filter(function (v) {
      return v !== iso;
    }));
  };
  var add = function add(iso) {
    if (values.includes(iso) || values.length >= MAX) {
      setPickerOpen(false);
      return;
    }
    onChange([].concat(_toConsumableArray(values), [iso]));
    setPickerOpen(false);
  };
  return React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("group.label"), " ", React.createElement("span", {
    className: "mono",
    style: {
      fontWeight: 400,
      color: "var(--ink-3)"
    }
  }, values.length, "/", MAX)), React.createElement("div", {
    className: "chips",
    style: {
      marginBottom: values.length ? 8 : 0
    }
  }, values.map(function (iso) {
    var c = window.byIso2[iso];
    if (!c) return null;
    return React.createElement("span", {
      key: iso,
      className: "chip",
      style: {
        cursor: "default"
      }
    }, React.createElement("span", {
      className: "flag"
    }, c.flag), React.createElement("span", null, window.countryName(iso)), React.createElement("button", {
      type: "button",
      className: "chip-x",
      onClick: function onClick() {
        return remove(iso);
      },
      "aria-label": window.t("group.remove", {
        name: window.countryName(iso)
      })
    }, "\xD7"));
  })), values.length < MAX && React.createElement("button", {
    type: "button",
    className: "btn btn-block box-dashed",
    style: {
      borderStyle: "dashed"
    },
    onClick: function onClick() {
      return setPickerOpen(!pickerOpen);
    },
    "aria-expanded": pickerOpen
  }, window.t("group.add_passport")), pickerOpen && React.createElement(GroupAddDropdown, {
    existing: values,
    onPick: add,
    onClose: function onClose() {
      return setPickerOpen(false);
    }
  }));
}
function GroupAddDropdown(_ref0) {
  var existing = _ref0.existing,
    onPick = _ref0.onPick;
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    q = _useState10[0],
    setQ = _useState10[1];
  var filtered = window.PASSPORT_LIST.filter(function (p) {
    return !existing.includes(p.iso2);
  }).filter(function (p) {
    if (!q) return true;
    var ql = q.toLowerCase();
    return p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql);
  }).slice(0, 50);
  return React.createElement("div", {
    className: "dd"
  }, React.createElement("input", {
    autoFocus: true,
    type: "text",
    className: "field dd-search",
    placeholder: window.t("picker.search"),
    value: q,
    onChange: function onChange(e) {
      return setQ(e.target.value);
    }
  }), React.createElement("div", {
    className: "dd-list",
    style: {
      maxHeight: 220
    }
  }, filtered.map(function (p) {
    var c = window.byIso2[p.iso2];
    return React.createElement("button", {
      key: p.iso2,
      type: "button",
      className: "dd-item",
      onClick: function onClick() {
        return onPick(p.iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, c === null || c === void 0 ? void 0 : c.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(p.iso2)), React.createElement("span", {
      className: "dd-code"
    }, p.iso2));
  }), filtered.length === 0 && React.createElement("div", {
    className: "dd-empty"
  }, window.t("picker.no_matches_short"))));
}
function PassportPicker(_ref1) {
  var value = _ref1.value,
    open = _ref1.open,
    setOpen = _ref1.setOpen,
    onChange = _ref1.onChange,
    isCompare = _ref1.isCompare,
    placeholder = _ref1.placeholder,
    allowClear = _ref1.allowClear;
  var current = value ? window.PASSPORTS[value] : null;
  var country = value ? window.byIso2[value] : null;
  var mrz = value && window.mrzLines ? window.mrzLines(value) : null;
  return React.createElement("div", null, React.createElement("button", {
    type: "button",
    className: "pp-card" + (isCompare ? " is-compare" : ""),
    onClick: function onClick() {
      return setOpen(!open);
    },
    "aria-expanded": open,
    "aria-label": (isCompare ? window.t("panel.compare_with") : window.t("panel.your_passport")) + (country ? ": " + window.countryName(value) : "")
  }, React.createElement("span", {
    className: "pp-doc",
    "aria-hidden": "true"
  }, isCompare ? window.t("panel.compare_with") : "Passport · Pasaport · Passeport", React.createElement(IconCaret, null)), country ? React.createElement("span", {
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
  }, window.countryName(value)), React.createElement("span", {
    className: "pp-meta",
    style: {
      display: "block"
    }
  }, value, window.passportRank(value) && React.createElement(React.Fragment, null, " \xB7 ", window.t("pulse.rank"), " #", window.passportRank(value).rank)))) : React.createElement("span", {
    className: "pp-empty",
    style: {
      display: "block"
    }
  }, placeholder || window.t("picker.select_passport")), mrz && React.createElement("span", {
    className: "mrz",
    "aria-hidden": "true"
  }, React.createElement("span", null, mrz[0]), React.createElement("span", null, mrz[1]))), open && React.createElement(PassportDropdown, {
    value: value,
    onChange: onChange,
    allowClear: allowClear,
    onClear: function onClear() {
      onChange(null);
      setOpen(false);
    }
  }));
}
function PassportDropdown(_ref10) {
  var value = _ref10.value,
    onChange = _ref10.onChange,
    allowClear = _ref10.allowClear,
    onClear = _ref10.onClear;
  var _useState11 = useState(""),
    _useState12 = _slicedToArray(_useState11, 2),
    q = _useState12[0],
    setQ = _useState12[1];
  var list = useMemo(function () {
    var ql = q.toLowerCase().trim();
    var filtered = window.PASSPORT_LIST.filter(function (p) {
      if (!ql) return true;
      return p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql);
    });
    if (!value) return filtered;
    var idx = filtered.findIndex(function (p) {
      return p.iso2 === value;
    });
    if (idx <= 0) return filtered;
    var _filtered$splice = filtered.splice(idx, 1),
      _filtered$splice2 = _slicedToArray(_filtered$splice, 1),
      selected = _filtered$splice2[0];
    return [selected].concat(_toConsumableArray(filtered));
  }, [q, value]);
  return React.createElement("div", {
    className: "dd"
  }, React.createElement("input", {
    autoFocus: true,
    className: "field dd-search",
    placeholder: window.t("picker.search_passports"),
    value: q,
    onChange: function onChange(e) {
      return setQ(e.target.value);
    }
  }), React.createElement("div", {
    className: "dd-tip"
  }, window.t("picker.tap_map_hint")), React.createElement("div", {
    className: "dd-list",
    role: "listbox"
  }, allowClear && React.createElement("button", {
    type: "button",
    className: "dd-item",
    onClick: onClear,
    style: {
      color: "var(--ink-3)",
      fontStyle: "italic"
    }
  }, window.t("picker.clear")), list.map(function (p) {
    var c = window.byIso2[p.iso2];
    var active = p.iso2 === value;
    return React.createElement("button", {
      key: p.iso2,
      type: "button",
      role: "option",
      "aria-selected": active,
      className: "dd-item",
      onClick: function onClick() {
        return onChange(p.iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, c === null || c === void 0 ? void 0 : c.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(p.iso2)), active && React.createElement("span", {
      className: "dd-tag"
    }, window.t("picker.selected")), window.passportRank(p.iso2) && React.createElement("span", {
      className: "dd-code"
    }, "#", window.passportRank(p.iso2).rank));
  }), list.length === 0 && React.createElement("div", {
    className: "dd-empty"
  }, window.t("picker.no_matches"))));
}
function Tally(_ref11) {
  var tally = _ref11.tally,
    filter = _ref11.filter,
    setFilter = _ref11.setFilter,
    groupActive = _ref11.groupActive,
    direction = _ref11.direction;
  var total = (tally.idc || 0) + tally.vf + (tally.eta || 0) + tally.ev + tally.voa + tally.vr + (tally.ban || 0);
  var rows = [].concat(_toConsumableArray((tally.idc || 0) > 0 ? [{
    k: "idc",
    n: tally.idc
  }] : []), [{
    k: "vf",
    n: tally.vf
  }], _toConsumableArray((tally.eta || 0) > 0 ? [{
    k: "eta",
    n: tally.eta
  }] : []), [{
    k: "ev",
    n: tally.ev
  }, {
    k: "voa",
    n: tally.voa
  }, {
    k: "vr",
    n: tally.vr
  }], _toConsumableArray((tally.ban || 0) > 0 ? [{
    k: "ban",
    n: tally.ban
  }] : []));
  var noVisa = window.mobilityScore(tally);
  var withEvisa = window.accessScore(tally);
  var scoreLabel = groupActive ? window.t("tally.group_score") : direction === "incoming" ? window.t("tally.incoming_label") : window.t("tally.no_visa");
  return React.createElement("div", null, React.createElement("div", {
    className: "score"
  }, React.createElement("span", {
    className: "score-n"
  }, noVisa), React.createElement("span", {
    className: "score-l"
  }, scoreLabel, React.createElement("br", null), React.createElement("span", {
    className: "mono"
  }, window.t("tally.of"), " ", total, groupActive && " · " + window.t("tally.worst_case")))), withEvisa > noVisa && React.createElement("p", {
    className: "score-sub"
  }, window.t("tally.with_evisa", {
    n: withEvisa
  })), React.createElement("div", {
    className: "bar",
    "aria-hidden": "true"
  }, rows.map(function (r) {
    return r.n > 0 && React.createElement("span", {
      key: r.k,
      className: r.k === "ban" ? "sw-ban" : "",
      style: {
        flex: "".concat(r.n, " 0 0"),
        background: r.k === "ban" ? undefined : "var(--".concat(r.k, ")")
      }
    });
  })), React.createElement("ul", {
    className: "ledger"
  }, React.createElement("li", null, React.createElement("button", {
    type: "button",
    className: "lg-row",
    "aria-pressed": filter === "all",
    onClick: function onClick() {
      return setFilter("all");
    }
  }, React.createElement("span", {
    className: "sw sw-all",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "lg-label"
  }, window.t("tally.filter_all")), React.createElement("span", {
    className: "lg-dots"
  }), React.createElement("span", {
    className: "lg-n"
  }, total))), rows.map(function (r) {
    return React.createElement("li", {
      key: r.k
    }, React.createElement("button", {
      type: "button",
      className: "lg-row",
      "aria-pressed": filter === r.k,
      onClick: function onClick() {
        return setFilter(filter === r.k ? "all" : r.k);
      }
    }, React.createElement(Swatch, {
      s: r.k
    }), React.createElement("span", {
      className: "lg-label"
    }, statusLabel(r.k)), React.createElement("span", {
      className: "lg-dots"
    }), React.createElement("span", {
      className: "lg-n"
    }, r.n)));
  })));
}
var FILTER_LIST_PREVIEW = 12;
function FilterList(_ref12) {
  var filter = _ref12.filter,
    passport = _ref12.passport,
    direction = _ref12.direction,
    variant = _ref12.variant,
    groupPassports = _ref12.groupPassports,
    onOpen = _ref12.onOpen;
  var _useState13 = useState(false),
    _useState14 = _slicedToArray(_useState13, 2),
    showAll = _useState14[0],
    setShowAll = _useState14[1];
  useEffect(function () {
    setShowAll(false);
  }, [filter, passport, direction]);
  useLangTick();
  var rows = useMemo(function () {
    var group = Array.isArray(groupPassports) && groupPassports.length > 0;
    var incoming = direction === "incoming" && !group;
    var variantActive = !!variant && variant !== "ordinary" && !group && !incoming;
    var resolve = function resolve(iso2) {
      return group ? window.resolveGroupStatus(groupPassports, iso2) : incoming ? window.resolveStatus(iso2, passport) : variantActive ? window.resolveVariantStatus(passport, iso2, variant) : window.resolveStatus(passport, iso2);
    };
    return window.COUNTRIES.filter(function (c) {
      return c.continent !== "AN" && (group ? !groupPassports.includes(c.iso2) : c.iso2 !== passport);
    }).map(function (c) {
      return {
        iso2: c.iso2,
        flag: c.flag,
        r: resolve(c.iso2)
      };
    }).filter(function (x) {
      return x.r.status === filter;
    }).sort(function (a, b) {
      return window.countryName(a.iso2).localeCompare(window.countryName(b.iso2), window.ATLAS_LANG || "en");
    });
  }, [filter, passport, direction, variant, groupPassports, window.ATLAS_LANG]);
  if (rows.length === 0) return null;
  var shown = showAll ? rows : rows.slice(0, FILTER_LIST_PREVIEW);
  return React.createElement("div", {
    className: "clist"
  }, shown.map(function (x) {
    return React.createElement("button", {
      key: x.iso2,
      type: "button",
      className: "dd-item",
      onClick: function onClick() {
        return onOpen(x.iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, x.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(x.iso2)), x.r.days ? React.createElement("span", {
      className: "dd-code"
    }, window.t("detail.up_to_days", {
      n: x.r.days
    })) : null);
  }), rows.length > FILTER_LIST_PREVIEW && React.createElement("button", {
    type: "button",
    className: "more-btn",
    onClick: function onClick() {
      return setShowAll(function (v) {
        return !v;
      });
    }
  }, showAll ? window.t("changelog.show_less") : tr("tally.show_all", "Show all {n}", {
    n: rows.length
  })));
}
function CountrySearch(_ref13) {
  var passport = _ref13.passport,
    search = _ref13.search,
    setSearch = _ref13.setSearch,
    onPick = _ref13.onPick;
  var results = useMemo(function () {
    var q = search.toLowerCase().trim();
    if (!q) return [];
    return window.COUNTRIES.filter(function (c) {
      return c.name.toLowerCase().includes(q) || window.countryName(c.iso2).toLowerCase().includes(q) || c.iso2.toLowerCase() === q;
    }).slice(0, 6);
  }, [search]);
  return React.createElement("div", null, React.createElement("div", {
    className: "search"
  }, React.createElement(IconSearch, null), React.createElement("input", {
    id: "country-search",
    className: "field",
    type: "search",
    placeholder: window.t("panel.search_placeholder"),
    "aria-label": window.t("panel.search_placeholder"),
    value: search,
    onChange: function onChange(e) {
      return setSearch(e.target.value);
    }
  })), results.length > 0 && React.createElement("div", {
    className: "dd"
  }, results.map(function (c) {
    var r = passport ? window.resolveStatus(passport, c.iso2) : {
      status: "na"
    };
    return React.createElement("button", {
      key: c.iso2,
      type: "button",
      className: "dd-item",
      onClick: function onClick() {
        onPick(c.iso2);
        setSearch("");
      }
    }, React.createElement("span", {
      className: "flag"
    }, c.flag), React.createElement("span", {
      className: "dd-grow"
    }, window.countryName(c.iso2)), React.createElement("span", {
      className: "dd-code"
    }, statusLabel(r.status)), React.createElement(Dot, {
      s: r.status
    }));
  })));
}
function stampVar(s) {
  return ["idc", "vf", "eta", "ev", "voa", "vr", "ban"].includes(s) ? "var(--".concat(s, ")") : "var(--ink-3)";
}
function DetailCard(_ref14) {
  var _window$byIso2$compar2;
  var passport = _ref14.passport,
    compare = _ref14.compare,
    iso2 = _ref14.iso2,
    onClose = _ref14.onClose,
    direction = _ref14.direction,
    groupPassports = _ref14.groupPassports,
    variant = _ref14.variant;
  var ref = useRef(null);
  useEffect(function () {
    if (ref.current && ref.current.scrollIntoView) {
      ref.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [iso2]);
  var dest = window.byIso2[iso2];
  if (!dest) return null;
  var groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  var incoming = direction === "incoming" && !groupActive;
  var variantActive = !!variant && variant !== "ordinary" && !groupActive && !incoming;
  var r = groupActive ? window.resolveGroupStatus(groupPassports, iso2) : incoming ? window.resolveStatus(iso2, passport) : variantActive ? window.resolveVariantStatus(passport, iso2, variant) : window.resolveStatus(passport, iso2);
  var rc = !groupActive && compare ? incoming ? window.resolveStatus(iso2, compare) : window.resolveStatus(compare, iso2) : null;
  var groupRows = groupActive ? groupPassports.map(function (p) {
    return {
      p: p,
      r: window.resolveStatus(p, iso2)
    };
  }) : null;
  var myPp = window.byIso2[passport];
  var NOTES = {
    idc: window.t("detail.note.idc"),
    vf: window.t("detail.note.vf"),
    eta: window.t("detail.note.eta"),
    ev: window.t("detail.note.ev"),
    voa: window.t("detail.note.voa"),
    vr: window.t("detail.note.vr"),
    self: window.t("detail.note.self"),
    na: window.t("detail.note.na")
  };
  var ORDER = {
    self: 0,
    idc: 1,
    vf: 2,
    eta: 3,
    ev: 4,
    voa: 5,
    vr: 6,
    ban: 7,
    na: 8
  };
  var recommended = null;
  if (compare && rc && !groupActive && !incoming) {
    var _ORDER$r$status, _ORDER$rc$status;
    var rScore = (_ORDER$r$status = ORDER[r.status]) !== null && _ORDER$r$status !== void 0 ? _ORDER$r$status : 5;
    var cScore = (_ORDER$rc$status = ORDER[rc.status]) !== null && _ORDER$rc$status !== void 0 ? _ORDER$rc$status : 5;
    if (rScore !== cScore) {
      var _window$byIso2$compar;
      recommended = rScore < cScore ? {
        r: r,
        label: window.countryName(passport),
        flag: myPp === null || myPp === void 0 ? void 0 : myPp.flag
      } : {
        r: rc,
        label: window.countryName(compare),
        flag: (_window$byIso2$compar = window.byIso2[compare]) === null || _window$byIso2$compar === void 0 ? void 0 : _window$byIso2$compar.flag
      };
    }
  }
  var continent = dest.continent ? window.t("cont." + dest.continent) !== "cont." + dest.continent ? window.t("cont." + dest.continent) : dest.continent : "—";
  var caveat = window.entryCaveat ? window.entryCaveat(iso2, r.status) : null;
  var cautions = [r.note, caveat].filter(Boolean);
  var from = incoming ? dest.flag : groupActive ? "" : myPp === null || myPp === void 0 ? void 0 : myPp.flag;
  var to = incoming ? myPp === null || myPp === void 0 ? void 0 : myPp.flag : dest.flag;
  return React.createElement("article", {
    ref: ref,
    className: "entry",
    "aria-label": window.countryName(iso2)
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
  }, continent)), React.createElement("div", {
    className: "entry-actions"
  }, React.createElement(WatchToggle, {
    iso2: iso2
  }), React.createElement("button", {
    type: "button",
    className: "icon-btn",
    onClick: onClose,
    "aria-label": window.t("detail.close")
  }, React.createElement(IconClose, null)))), React.createElement("div", {
    className: "entry-verdict"
  }, React.createElement("div", {
    className: "stamp",
    style: {
      "--st": stampVar(r.status)
    }
  }, React.createElement("span", {
    className: "stamp-k"
  }, r.fom ? window.t("detail.fom") : statusLabel(r.status)), r.fom ? React.createElement("span", {
    className: "stamp-s"
  }, window.t("detail.fom_sub")) : r.days ? React.createElement("span", {
    className: "stamp-s"
  }, window.t("detail.up_to_days", {
    n: r.days
  })) : null), (from || to) && React.createElement("span", {
    className: "route",
    "aria-hidden": "true"
  }, from && React.createElement("span", {
    className: "flag"
  }, from), React.createElement("span", null, "\u2192"), to && React.createElement("span", {
    className: "flag"
  }, to))), r.upgradedBy && React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k"
  }, tr("detail.via_permit_title", "Unlocked by your permit")), React.createElement("span", {
    className: "note-s"
  }, tr("detail.via_permit_sub", "Easier entry thanks to your " + _permitLabel(r.upgradedBy) + " residence/visa. Without it, this country would normally be visa-required.", {
    which: _permitLabel(r.upgradedBy)
  }))), cautions.length > 0 && React.createElement("div", {
    className: "note note-warn"
  }, cautions.map(function (n, i) {
    return React.createElement("span", {
      key: i,
      className: i === 0 ? "note-k" : "note-s",
      style: i === 0 ? {
        fontWeight: 500
      } : null
    }, n);
  })), React.createElement("p", {
    className: "entry-note"
  }, NOTES[r.status]), !groupActive && React.createElement(ConditionsBox, {
    passport: passport,
    destIso2: iso2,
    baseStatus: r.status
  }), !groupActive && React.createElement(TripNotesGroup, {
    passport: passport,
    destIso2: iso2
  }), !groupActive && React.createElement(VisaFeeBox, {
    passport: passport,
    destIso2: iso2,
    status: r.status
  }), !groupActive && React.createElement(NewsBox, {
    passport: passport,
    destIso2: iso2
  }), React.createElement(AffiliatePartners, {
    status: r.status,
    iso2: iso2
  }), React.createElement(AlertsCTA, {
    iso2: iso2,
    destName: window.countryName(iso2)
  }), React.createElement(AdSlot, {
    slotKey: "sidebar"
  }), rc && compare && React.createElement("div", {
    className: "box box-dashed",
    style: {
      marginBottom: 0
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("detail.compare")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    className: "flag",
    style: {
      fontSize: 18
    }
  }, (_window$byIso2$compar2 = window.byIso2[compare]) === null || _window$byIso2$compar2 === void 0 ? void 0 : _window$byIso2$compar2.flag), React.createElement("span", {
    className: "stamp is-small",
    style: {
      "--st": stampVar(rc.status)
    }
  }, React.createElement("span", {
    className: "stamp-k"
  }, statusLabel(rc.status))), rc.days && React.createElement("span", {
    className: "mono",
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--ink-3)"
    }
  }, window.t("detail.up_to_days", {
    n: rc.days
  }))), recommended && React.createElement("div", {
    className: "entry-recommend"
  }, React.createElement("span", {
    className: "tag"
  }, window.t("detail.recommended")), React.createElement("span", {
    className: "flag"
  }, recommended.flag), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontWeight: 600
    }
  }, recommended.label), React.createElement(Dot, {
    s: recommended.r.status
  }), React.createElement("span", null, statusLabel(recommended.r.status)))), groupRows && React.createElement("div", {
    className: "members"
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "8px 0 2px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("detail.per_group_member")), groupRows.map(function (_ref15) {
    var p = _ref15.p,
      rr = _ref15.r;
    var c = window.byIso2[p];
    var isBest = r.via === p;
    return React.createElement("div", {
      key: p,
      className: "member" + (isBest ? " is-best" : "")
    }, React.createElement("span", {
      className: "flag"
    }, c === null || c === void 0 ? void 0 : c.flag), React.createElement("span", {
      className: "member-name"
    }, window.countryName(p)), isBest && React.createElement("span", {
      className: "best-tag"
    }, window.t("detail.best_passport")), React.createElement(Dot, {
      s: rr.status
    }), React.createElement("span", {
      style: {
        color: "var(--ink-2)"
      }
    }, statusLabel(rr.status)), rr.days && React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        color: "var(--ink-3)"
      }
    }, rr.days, "d"));
  })));
}
function ConditionsBox(_ref16) {
  var passport = _ref16.passport,
    destIso2 = _ref16.destIso2,
    baseStatus = _ref16.baseStatus;
  if (!passport || !destIso2) return null;
  if (baseStatus === "self" || baseStatus === "vf") return null;
  var rows = window.visaCondition && window.visaCondition(passport, destIso2);
  if (!rows || rows.length === 0) return null;
  var ORDER = {
    idc: 0,
    vf: 1,
    eta: 2,
    ev: 3,
    voa: 4,
    vr: 5,
    ban: 6,
    na: 7
  };
  var useful = rows.filter(function (r) {
    return ORDER[r.then] < ORDER[baseStatus];
  });
  if (useful.length === 0) return null;
  var lang = window.ATLAS_LANG || "en";
  return React.createElement("div", {
    className: "note note-ok",
    style: {
      display: "block"
    }
  }, React.createElement("div", {
    className: "note-k"
  }, window.t("cond.title")), React.createElement("div", {
    className: "note-s",
    style: {
      marginBottom: 6
    }
  }, window.t("cond.subtitle")), useful.map(function (row, i) {
    var labels = window.conditionHoldsLabels && window.conditionHoldsLabels(row.ifHolds) || row.ifHolds;
    var note = lang === "en" ? row.noteEn || row.note : row.note || row.noteEn;
    return React.createElement("div", {
      key: i,
      style: {
        paddingTop: i ? 8 : 2,
        marginTop: i ? 8 : 0,
        borderTop: i ? "1px solid var(--rule)" : "none"
      }
    }, React.createElement("div", {
      className: "chips",
      style: {
        marginBottom: 6
      }
    }, labels.map(function (l, j) {
      return React.createElement("span", {
        key: j,
        className: "chip",
        style: {
          cursor: "default",
          fontSize: 12
        }
      }, row.ifHolds[j] === "SCHENGEN" && React.createElement("span", {
        className: "flag"
      }, "\uD83C\uDDEA\uD83C\uDDFA"), l);
    })), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13
      }
    }, React.createElement("span", {
      style: {
        color: "var(--ink-3)"
      }
    }, "\u2192 ", window.t("cond.becomes")), React.createElement(Dot, {
      s: row.then
    }), React.createElement("strong", {
      style: {
        fontWeight: 650
      }
    }, statusLabel(row.then)), row.days && React.createElement("span", {
      className: "mono",
      style: {
        marginLeft: "auto",
        color: "var(--ink-3)",
        fontSize: 11.5
      }
    }, window.t("detail.up_to_days", {
      n: row.days
    }))), note && React.createElement("div", {
      className: "note-s",
      style: {
        marginTop: 5
      }
    }, note), row.source && React.createElement("a", {
      className: "link-quiet",
      href: row.source,
      target: "_blank",
      rel: "noopener nofollow",
      style: {
        display: "inline-block",
        marginTop: 5
      }
    }, window.t("cond.source")));
  }));
}
function TripNotesGroup(_ref17) {
  var _window$etiasStatus;
  var passport = _ref17.passport,
    destIso2 = _ref17.destIso2;
  if (!passport || !destIso2) return null;
  var transitWouldRender = !!transitNoteFor(passport, destIso2);
  var estaWouldRender = destIso2 === "US" && !!window.estaEligible;
  var etiasWouldRender = !!(window.etiasStatus && ((_window$etiasStatus = window.etiasStatus(passport, destIso2)) === null || _window$etiasStatus === void 0 ? void 0 : _window$etiasStatus.kind) === "required");
  var validityWouldRender = !!(window.PASSPORT_VALIDITY && window.PASSPORT_VALIDITY[destIso2] != null);
  var israelWouldRender = !!(window.israelStampWarning && window.israelStampWarning(destIso2));
  var loiWouldRender = !!(window.loiRule && window.loiRule(destIso2));
  var schengenWouldRender = !!schengenHelpFor(passport, destIso2);
  var total = [transitWouldRender, estaWouldRender, etiasWouldRender, validityWouldRender, israelWouldRender, loiWouldRender, schengenWouldRender].filter(Boolean).length;
  if (total === 0) return null;
  return React.createElement("div", {
    style: {
      margin: "4px 0 2px"
    }
  }, total >= 2 && React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("detail.trip_notes")), schengenWouldRender && React.createElement(SchengenHelp, {
    passport: passport,
    destIso2: destIso2
  }), transitWouldRender && React.createElement(TransitVisaHint, {
    passport: passport,
    destIso2: destIso2
  }), estaWouldRender && React.createElement(EstaHint, {
    passport: passport
  }), etiasWouldRender && React.createElement(EtiasHint, {
    passport: passport,
    destIso2: destIso2
  }), validityWouldRender && React.createElement(ValidityHint, {
    destIso2: destIso2
  }), israelWouldRender && React.createElement(IsraelStampHint, {
    destIso2: destIso2
  }), loiWouldRender && React.createElement(LoiHint, {
    destIso2: destIso2
  }));
}
var EASY_ENTRY = new Set(["self", "idc", "vf", "eta"]);
function transitNoteFor(passport, destIso2) {
  if (!passport || !destIso2 || !window.transitStatusForGlobe) return null;
  var entry = window.resolveStatus(passport, destIso2);
  if (EASY_ENTRY.has(entry.status)) return null;
  var t = window.transitStatusForGlobe(passport, destIso2);
  if (t.status === "vr") return {
    tone: "note-warn",
    key: "detail.transit_dest_vr"
  };
  if (t.status === "twov" && t.twovHours) return {
    tone: "note-ok",
    key: "detail.transit_dest_twov",
    hours: t.twovHours
  };
  return null;
}
function TransitVisaHint(_ref18) {
  var passport = _ref18.passport,
    destIso2 = _ref18.destIso2;
  var note = transitNoteFor(passport, destIso2);
  if (!note) return null;
  var vars = {
    country: window.countryName(destIso2),
    n: note.hours
  };
  return React.createElement("a", {
    className: "note " + note.tone,
    href: "/transit-map/"
  }, React.createElement("span", {
    className: "note-k"
  }, tr(note.key, "", vars)), React.createElement("span", {
    className: "note-s"
  }, tr("detail.transit_dest_sub", "Airport transit rules — see the transit map.")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
var SCHENGEN_CHECKLISTS = {
  TR: "/visa-checklist/tr-schengen/"
};
function schengenHelpFor(passport, destIso2) {
  if (!passport || !destIso2 || !window.ETIAS) return null;
  if (!window.ETIAS.schengenStates.includes(destIso2)) return null;
  var r = window.resolveStatus(passport, destIso2);
  if (r.status === "self" || r.status === "idc" || r.fom) return null;
  var checklist = r.status === "vr" ? SCHENGEN_CHECKLISTS[passport] : null;
  return {
    checklist: checklist
  };
}
function SchengenHelp(_ref19) {
  var passport = _ref19.passport,
    destIso2 = _ref19.destIso2;
  var help = schengenHelpFor(passport, destIso2);
  if (!help) return null;
  return React.createElement("div", {
    className: "note note-info"
  }, React.createElement("span", {
    className: "note-k"
  }, tr("detail.schengen_title", "Schengen area: 90 days in any 180")), React.createElement("span", {
    className: "note-s"
  }, React.createElement("a", {
    href: "/schengen-calculator/"
  }, tr("detail.schengen_calc", "Count your days")), help.checklist && React.createElement(React.Fragment, null, " \xB7 ", React.createElement("a", {
    href: help.checklist
  }, tr("detail.schengen_checklist", "Visa document checklist")))));
}
function EstaHint(_ref20) {
  var passport = _ref20.passport;
  if (!passport || !window.estaEligible) return null;
  var eligible = window.estaEligible(passport);
  return React.createElement("a", {
    className: "note " + (eligible ? "note-ok" : "note-info"),
    href: "/esta-rules/"
  }, React.createElement("span", {
    className: "note-k"
  }, window.t(eligible ? "detail.esta_eligible" : "detail.esta_not_vwp")), React.createElement("span", {
    className: "note-s"
  }, window.t(eligible ? "detail.esta_check_disq" : "detail.esta_visa_path")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
function IsraelStampHint(_ref21) {
  var destIso2 = _ref21.destIso2;
  if (!destIso2 || !window.israelStampWarning) return null;
  var r = window.israelStampWarning(destIso2);
  if (!r) return null;
  var tone = r.level === "strict" ? "note-risk" : r.level === "relaxed" ? "note-warn" : "note-info";
  var label = r.level === "strict" ? window.t("detail.israel_strict") : r.level === "relaxed" ? window.t("detail.israel_relaxed") : window.t("detail.israel_normalized");
  return React.createElement("div", {
    className: "note " + tone
  }, React.createElement("span", {
    className: "note-k"
  }, label), React.createElement("span", {
    className: "note-s"
  }, r.note));
}
function LoiHint(_ref22) {
  var destIso2 = _ref22.destIso2;
  if (!destIso2 || !window.loiRule) return null;
  var r = window.loiRule(destIso2);
  if (!r) return null;
  return React.createElement("div", {
    className: "note note-warn"
  }, React.createElement("span", {
    className: "note-k"
  }, window.t("detail.loi_required")), React.createElement("span", {
    className: "note-s"
  }, r.note), r.typicalCost && React.createElement("span", {
    className: "note-fine"
  }, window.t("detail.loi_cost", {
    cost: r.typicalCost
  })));
}
function ValidityHint(_ref23) {
  var destIso2 = _ref23.destIso2;
  if (!destIso2 || !window.passportValidityCheck) return null;
  var res = window.passportValidityCheck(destIso2, {});
  if (!res) return null;
  var sevKey = res.rule === 6 ? "validity.rule6" : res.rule === 3 ? "validity.rule3" : res.rule === 0 ? "validity.rule0" : null;
  if (!sevKey) return null;
  var tone = res.rule >= 6 ? "note-risk" : res.rule >= 3 ? "note-warn" : "note-ok";
  return React.createElement("a", {
    className: "note " + tone,
    href: "/passport-validity/"
  }, React.createElement("span", {
    className: "note-k"
  }, window.t(sevKey)), React.createElement("span", {
    className: "note-s"
  }, window.t("validity.check_cta")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
function EtiasHint(_ref24) {
  var passport = _ref24.passport,
    destIso2 = _ref24.destIso2;
  if (!passport || !destIso2 || !window.etiasStatus) return null;
  var res = window.etiasStatus(passport, destIso2);
  if (!res || res.kind !== "required") return null;
  var days = window.etiasDaysUntilLaunch ? window.etiasDaysUntilLaunch() : null;
  return React.createElement("a", {
    className: "note note-info",
    href: "/etias/"
  }, React.createElement("span", {
    className: "note-k"
  }, days != null && days > 0 ? window.t("detail.etias_pre", {
    days: days
  }) : window.t("detail.etias_live")), React.createElement("span", {
    className: "note-s"
  }, window.t("detail.etias_sub")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
var feeLabel = function feeLabel(s) {
  return window.translateFeeText ? window.translateFeeText(s) : s;
};
function VisaFeeBox(_ref25) {
  var passport = _ref25.passport,
    destIso2 = _ref25.destIso2,
    status = _ref25.status;
  if (!passport || !destIso2) return null;
  if (status === "vf" || status === "self" || status === "ban") return null;
  var data = window.visaFee && window.visaFee(passport, destIso2);
  if (!data) {
    return React.createElement("div", {
      className: "box box-dashed p-fine",
      style: {
        fontSize: 12.5,
        color: "var(--ink-3)"
      }
    }, window.t("detail.no_fee_data"));
  }
  return React.createElement("div", {
    className: "box"
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 4px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("detail.visa_cost")), React.createElement("div", {
    className: "fee"
  }, feeLabel(data.fee)), data.processingDays && React.createElement("div", {
    className: "p-hint",
    style: {
      marginTop: 4
    }
  }, window.t("detail.processing"), ": ", feeLabel(data.processingDays)), React.createElement("dl", {
    className: "kv"
  }, data.type && React.createElement(React.Fragment, null, React.createElement("dt", null, window.t("detail.type")), React.createElement("dd", null, feeLabel(data.type))), data.validity && React.createElement(React.Fragment, null, React.createElement("dt", null, window.t("detail.validity")), React.createElement("dd", null, feeLabel(data.validity))), data.durationOfStay && React.createElement(React.Fragment, null, React.createElement("dt", null, window.t("detail.duration_of_stay")), React.createElement("dd", null, feeLabel(data.durationOfStay)))), data.notes && React.createElement("div", {
    className: "note note-warn",
    style: {
      margin: "10px 0 0",
      fontSize: 12.5
    }
  }, React.createElement("span", {
    className: "note-s",
    style: {
      margin: 0,
      color: "var(--ink-2)"
    }
  }, feeLabel(data.notes))), data.source && React.createElement("a", {
    className: "link-quiet",
    href: data.source,
    target: "_blank",
    rel: "noopener nofollow",
    style: {
      display: "inline-block",
      marginTop: 8
    }
  }, window.t("detail.official_source")), React.createElement("div", {
    className: "p-fine mono",
    style: {
      marginTop: 4,
      fontSize: 10.5
    }
  }, window.t("detail.reviewed", {
    date: data.lastReviewed
  })));
}
function AlertsCTA(_ref26) {
  var iso2 = _ref26.iso2,
    destName = _ref26.destName;
  var href = "/alerts/?country=".concat(encodeURIComponent(iso2));
  return React.createElement("a", {
    className: "note note-accent",
    href: href
  }, React.createElement("span", {
    className: "note-k"
  }, window.t("detail.get_alerts_for", {
    name: destName
  })), React.createElement("span", {
    className: "note-s"
  }, window.t("detail.get_alerts_sub")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
function AdSlot(_ref27) {
  var slotKey = _ref27.slotKey;
  var ref = React.useRef(null);
  var pushed = React.useRef(false);
  var ads = window.ADSENSE || {};
  var clientId = ads.clientId;
  var slot = ads.slots && ads.slots[slotKey];
  React.useEffect(function () {
    if (!clientId || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {}
  }, [clientId, slot]);
  if (!clientId || !slot) return null;
  return React.createElement("div", {
    className: "ad-slot"
  }, React.createElement("ins", {
    ref: ref,
    className: "adsbygoogle",
    style: {
      display: "block",
      minHeight: 100
    },
    "data-ad-client": clientId,
    "data-ad-slot": slot,
    "data-ad-format": "auto",
    "data-full-width-responsive": "true"
  }), React.createElement("div", {
    className: "ad-label"
  }, "Ad"));
}
function AffiliatePartners(_ref28) {
  var status = _ref28.status,
    iso2 = _ref28.iso2;
  var partners = window.affiliatesFor && window.affiliatesFor(status, iso2) || [];
  if (partners.length === 0) return null;
  return React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("detail.plan_your_trip")), React.createElement("div", {
    className: "feed"
  }, partners.map(function (p) {
    return React.createElement("a", {
      key: p.id,
      className: "feed-item",
      href: p.href,
      target: "_blank",
      rel: "sponsored noopener noreferrer"
    }, React.createElement("div", {
      className: "feed-title"
    }, p.label), React.createElement("div", {
      className: "feed-sum"
    }, p.blurb));
  })), React.createElement("div", {
    className: "ad-label",
    style: {
      marginTop: 4
    }
  }, window.t("detail.sponsored")));
}
function namesPassport(item, passport) {
  var _item$affects;
  return !!passport && (((_item$affects = item.affects) === null || _item$affects === void 0 ? void 0 : _item$affects.passports) || []).includes(passport);
}
function namesDest(item, dest) {
  var _item$affects2;
  return !!dest && (((_item$affects2 = item.affects) === null || _item$affects2 === void 0 ? void 0 : _item$affects2.destinations) || []).includes(dest);
}
function sortNewsDesc(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}
var NEWS_SOURCE_LABEL = {
  wiki: "Wikipedia",
  fco: "UK FCDO"
};
var SEVERITY_TONE = {
  positive: "var(--vf)",
  warning: "var(--vr)",
  neutral: "var(--rule-strong)"
};
function fmtDay(iso, withYear) {
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso || "";
  return d.toLocaleDateString(window.ATLAS_LANG || "en", withYear ? {
    day: "numeric",
    month: "short",
    year: "numeric"
  } : {
    day: "numeric",
    month: "short"
  });
}
function NewsItem(_ref29) {
  var item = _ref29.item,
    compact = _ref29.compact;
  var tone = SEVERITY_TONE[item.severity] || SEVERITY_TONE.neutral;
  var hasLink = !!item.sourceUrl;
  var Wrapper = hasLink ? "a" : "div";
  var wrapperProps = hasLink ? {
    href: item.sourceUrl,
    target: "_blank",
    rel: "noopener noreferrer"
  } : {};
  return React.createElement(Wrapper, _extends({}, wrapperProps, {
    className: "feed-item",
    style: {
      "--tone": tone
    }
  }), React.createElement("div", {
    className: "feed-meta"
  }, React.createElement("time", {
    dateTime: item.date
  }, fmtDay(item.date, true)), React.createElement("span", null, "\xB7"), React.createElement("span", null, NEWS_SOURCE_LABEL[item.source] || item.source)), React.createElement("div", {
    className: "feed-title"
  }, item.title), !compact && item.summary && React.createElement("div", {
    className: "feed-sum"
  }, item.summary));
}
function weeklyDigest(passport) {
  var cutoff = Date.now() - 7 * 86400000;
  var total = 0,
    mine = 0;
  if (window.CHANGELOG) {
    var _iterator = _createForOfIteratorHelper(window.CHANGELOG),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _c$affects;
        var c = _step.value;
        if (new Date(c.date + "T00:00:00").getTime() < cutoff) continue;
        total++;
        if (passport && (_c$affects = c.affects) !== null && _c$affects !== void 0 && (_c$affects = _c$affects.passports) !== null && _c$affects !== void 0 && _c$affects.includes(passport)) mine++;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  if (window.VISA_NEWS) {
    var _iterator2 = _createForOfIteratorHelper(window.VISA_NEWS),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var n = _step2.value;
        if (new Date(n.date + "T00:00:00").getTime() < cutoff) continue;
        total++;
        if (namesPassport(n, passport)) mine++;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return {
    total: total,
    mine: mine
  };
}
function WeeklyDigest(_ref30) {
  var passport = _ref30.passport;
  var stats = useMemo(function () {
    return weeklyDigest(passport);
  }, [passport]);
  if (stats.total === 0) return null;
  return React.createElement("div", {
    className: "note note-accent",
    style: {
      marginBottom: 14
    }
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500
    }
  }, passport && stats.mine > 0 ? window.t("digest.this_week_with_yours", {
    total: stats.total,
    mine: stats.mine
  }) : window.t("digest.this_week_total", {
    total: stats.total
  })));
}
function readItinerary() {
  try {
    var raw = localStorage.getItem("atlas.itinerary") || sessionStorage.getItem("atlas.itinerary");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function ItineraryCTA() {
  var _useState15 = useState(0),
    _useState16 = _slicedToArray(_useState15, 2),
    tick = _useState16[0],
    setTick = _useState16[1];
  useEffect(function () {
    var onFocus = function onFocus() {
      return setTick(function (x) {
        return x + 1;
      });
    };
    window.addEventListener("focus", onFocus);
    return function () {
      return window.removeEventListener("focus", onFocus);
    };
  }, []);
  var data = useMemo(function () {
    return readItinerary();
  }, [tick]);
  var stops = Array.isArray(data === null || data === void 0 ? void 0 : data.stops) ? data.stops : [];
  var hasPlan = stops.length > 0;
  return React.createElement("a", {
    className: "note note-accent",
    href: "/itinerary/",
    style: {
      marginBottom: 16
    }
  }, React.createElement("span", {
    className: "note-k"
  }, hasPlan ? window.t("itinerary.continue", {
    n: stops.length
  }) : window.t("itinerary.start")), React.createElement("span", {
    className: "note-s"
  }, hasPlan ? React.createElement("span", {
    className: "flag"
  }, stops.slice(0, 6).map(function (s) {
    var _window$byIso;
    return ((_window$byIso = window.byIso2[s.iso2 || s]) === null || _window$byIso === void 0 ? void 0 : _window$byIso.flag) || "";
  }).join(" ")) : window.t("itinerary.sub")), React.createElement("span", {
    className: "note-go",
    "aria-hidden": "true"
  }, "\u2192"));
}
var WATCHLIST_KEY = "atlas.watchlist";
function readWatchlist() {
  try {
    var raw = localStorage.getItem(WATCHLIST_KEY);
    var arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(function (x) {
      return typeof x === "string";
    }) : [];
  } catch (e) {
    return [];
  }
}
function writeWatchlist(list) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent("atlas:watchlist", {
    detail: {
      list: list
    }
  }));
}
function inWatchlist(iso2) {
  return readWatchlist().includes(iso2);
}
function toggleWatchlist(iso2) {
  var list = readWatchlist();
  var idx = list.indexOf(iso2);
  if (idx >= 0) list.splice(idx, 1);else list.push(iso2);
  writeWatchlist(list);
  return list;
}
function useWatchlist() {
  var _useState17 = useState(function () {
      return readWatchlist();
    }),
    _useState18 = _slicedToArray(_useState17, 2),
    list = _useState18[0],
    setList = _useState18[1];
  useEffect(function () {
    var onChange = function onChange() {
      return setList(readWatchlist());
    };
    var onStorage = function onStorage(e) {
      if (e.key === WATCHLIST_KEY) onChange();
    };
    window.addEventListener("atlas:watchlist", onChange);
    window.addEventListener("storage", onStorage);
    return function () {
      window.removeEventListener("atlas:watchlist", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return list;
}
function watchlistAlerts(list) {
  var days = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 14;
  var cutoff = Date.now() - days * 86400000;
  var alerted = new Set();
  if (window.CHANGELOG) {
    var _iterator3 = _createForOfIteratorHelper(window.CHANGELOG),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var _c$affects2;
        var c = _step3.value;
        if (!list.includes((_c$affects2 = c.affects) === null || _c$affects2 === void 0 ? void 0 : _c$affects2.dest)) continue;
        if (new Date(c.date + "T00:00:00").getTime() < cutoff) continue;
        alerted.add(c.affects.dest);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  }
  if (window.VISA_NEWS) {
    var _iterator4 = _createForOfIteratorHelper(window.VISA_NEWS),
      _step4;
    try {
      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
        var _n$affects;
        var n = _step4.value;
        var dests = ((_n$affects = n.affects) === null || _n$affects === void 0 ? void 0 : _n$affects.destinations) || [];
        var hit = dests.find(function (d) {
          return list.includes(d);
        });
        if (!hit) continue;
        if (new Date(n.date + "T00:00:00").getTime() < cutoff) continue;
        alerted.add(hit);
      }
    } catch (err) {
      _iterator4.e(err);
    } finally {
      _iterator4.f();
    }
  }
  return alerted;
}
function WatchlistCard(_ref31) {
  var onOpen = _ref31.onOpen;
  var list = useWatchlist();
  var alerts = useMemo(function () {
    return watchlistAlerts(list, 14);
  }, [list]);
  if (list.length === 0) return null;
  return React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, window.t("watchlist.heading"), alerts.size > 0 && React.createElement("span", {
    className: "dot",
    style: {
      "--sw": "var(--vr)"
    },
    "aria-hidden": "true"
  })), alerts.size > 0 && React.createElement("div", {
    className: "note note-risk",
    style: {
      marginBottom: 6
    }
  }, React.createElement("span", {
    className: "note-k",
    style: {
      fontWeight: 500,
      fontSize: 12.5
    }
  }, window.t("watchlist.recent_alert", {
    n: alerts.size
  }))), React.createElement("div", {
    className: "chips"
  }, list.map(function (iso2) {
    var c = window.byIso2[iso2];
    if (!c) return null;
    var flagged = alerts.has(iso2);
    return React.createElement("button", {
      key: iso2,
      type: "button",
      className: "chip" + (flagged ? " is-alert" : ""),
      onClick: function onClick() {
        return onOpen === null || onOpen === void 0 ? void 0 : onOpen(iso2);
      }
    }, React.createElement("span", {
      className: "flag"
    }, c.flag), React.createElement("span", null, window.countryName(iso2)), flagged && React.createElement("span", {
      className: "dot",
      style: {
        "--sw": "var(--vr)"
      },
      "aria-hidden": "true"
    }));
  })));
}
function WatchToggle(_ref32) {
  var iso2 = _ref32.iso2;
  var list = useWatchlist();
  var on = list.includes(iso2);
  return React.createElement("button", {
    type: "button",
    className: "watch-btn",
    onClick: function onClick(e) {
      e.stopPropagation();
      toggleWatchlist(iso2);
    },
    title: window.t(on ? "watchlist.remove" : "watchlist.add"),
    "aria-pressed": on
  }, React.createElement("span", {
    "aria-hidden": "true"
  }, on ? "★" : "☆"), React.createElement("span", null, window.t(on ? "watchlist.added" : "watchlist.add_short")));
}
var STATUS_RANK = {
  vr: 0,
  voa: 1,
  ev: 2,
  vf: 3,
  self: 3,
  na: 0
};
function passportPulse(passport) {
  var days = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 30;
  if (!passport || !window.CHANGELOG) return {
    gains: 0,
    losses: 0,
    items: []
  };
  var cutoff = Date.now() - days * 86400000;
  var items = [];
  var gains = 0,
    losses = 0;
  var _iterator5 = _createForOfIteratorHelper(window.CHANGELOG),
    _step5;
  try {
    for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
      var _c$affects3, _STATUS_RANK$c$status, _STATUS_RANK$c$status2;
      var c = _step5.value;
      if (!((_c$affects3 = c.affects) !== null && _c$affects3 !== void 0 && (_c$affects3 = _c$affects3.passports) !== null && _c$affects3 !== void 0 && _c$affects3.includes(passport))) continue;
      var t = new Date(c.date + "T00:00:00").getTime();
      if (t < cutoff) continue;
      var dFrom = (_STATUS_RANK$c$status = STATUS_RANK[c.statusFrom]) !== null && _STATUS_RANK$c$status !== void 0 ? _STATUS_RANK$c$status : 0;
      var dTo = (_STATUS_RANK$c$status2 = STATUS_RANK[c.statusTo]) !== null && _STATUS_RANK$c$status2 !== void 0 ? _STATUS_RANK$c$status2 : 0;
      if (dTo > dFrom) gains++;else if (dTo < dFrom) losses++;
      items.push(c);
    }
  } catch (err) {
    _iterator5.e(err);
  } finally {
    _iterator5.f();
  }
  return {
    gains: gains,
    losses: losses,
    items: items
  };
}
function PassportPulse(_ref33) {
  var passport = _ref33.passport;
  var _useState19 = useState(30),
    _useState20 = _slicedToArray(_useState19, 2),
    days = _useState20[0],
    setDays = _useState20[1];
  var pulse = useMemo(function () {
    return passportPulse(passport, days);
  }, [passport, days]);
  var tally = useMemo(function () {
    return window.tally ? window.tally(passport) : null;
  }, [passport]);
  var meta = passport ? window.PASSPORTS[passport] : null;
  if (!meta || !tally) return null;
  var totalOpen = window.mobilityScore(tally);
  var rankInfo = window.passportRank(passport);
  var rank = rankInfo && rankInfo.rank;
  var hasMovement = pulse.gains + pulse.losses > 0;
  var windowKey = days === 30 ? "daily.window_30" : "daily.window_90";
  return React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 6
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: 0,
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("pulse.heading")), React.createElement("div", {
    className: "seg",
    role: "group"
  }, [30, 90].map(function (d) {
    return React.createElement("button", {
      key: d,
      type: "button",
      "aria-pressed": days === d,
      onClick: function onClick() {
        return setDays(d);
      },
      style: {
        fontSize: 11.5,
        padding: "1px 7px"
      }
    }, d, "d");
  }))), React.createElement("div", {
    className: "stats3"
  }, React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, rank ? "#" + rank : "—"), React.createElement("div", {
    className: "l"
  }, window.t("pulse.rank"))), React.createElement("div", null, React.createElement("div", {
    className: "n",
    style: {
      color: "var(--vf)"
    }
  }, totalOpen), React.createElement("div", {
    className: "l"
  }, window.t("pulse.open"))), React.createElement("div", null, React.createElement("div", {
    className: "n"
  }, hasMovement ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      color: "var(--vf)"
    }
  }, "+", pulse.gains), pulse.losses > 0 && React.createElement("span", {
    style: {
      color: "var(--vr)"
    }
  }, " \u2212", pulse.losses)) : React.createElement("span", {
    style: {
      color: "var(--ink-4)"
    }
  }, "\u2014")), React.createElement("div", {
    className: "l"
  }, window.t(windowKey)))), hasMovement && React.createElement("p", {
    className: "p-hint"
  }, pulse.gains > 0 && window.t("pulse.gains_msg", {
    n: pulse.gains
  }), pulse.gains > 0 && pulse.losses > 0 && " · ", pulse.losses > 0 && window.t("pulse.losses_msg", {
    n: pulse.losses
  })));
}
var FEED_DAYS = 90;
function passportFeed(passport) {
  if (!passport) return [];
  var cutoff = Date.now() - FEED_DAYS * 86400000;
  var recent = function recent(d) {
    return new Date(d + "T00:00:00").getTime() >= cutoff;
  };
  var changes = (window.CHANGELOG || []).filter(function (c) {
    var _c$affects4;
    return recent(c.date) && ((_c$affects4 = c.affects) === null || _c$affects4 === void 0 || (_c$affects4 = _c$affects4.passports) === null || _c$affects4 === void 0 ? void 0 : _c$affects4.includes(passport));
  }).map(function (c, i) {
    return {
      kind: "change",
      key: "c" + i,
      date: c.date,
      entry: c
    };
  });
  var news = (window.VISA_NEWS || []).filter(function (n) {
    return recent(n.date) && namesPassport(n, passport);
  }).map(function (n) {
    return {
      kind: "news",
      key: n.id,
      date: n.date,
      item: n
    };
  });
  return [].concat(_toConsumableArray(changes), _toConsumableArray(news)).sort(sortNewsDesc);
}
function PassportNewsFeed(_ref34) {
  var passport = _ref34.passport;
  var _useState21 = useState(false),
    _useState22 = _slicedToArray(_useState21, 2),
    expanded = _useState22[0],
    setExpanded = _useState22[1];
  var list = useMemo(function () {
    return passportFeed(passport);
  }, [passport]);
  if (list.length === 0) return null;
  var items = expanded ? list : list.slice(0, 3);
  return React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("news.for_passport", {
    name: window.countryName(passport)
  })), React.createElement("div", {
    className: "feed"
  }, items.map(function (it) {
    return it.kind === "change" ? React.createElement(ChangelogItem, {
      key: it.key,
      entry: it.entry
    }) : React.createElement(NewsItem, {
      key: it.key,
      item: it.item
    });
  })), list.length > 3 && React.createElement("button", {
    type: "button",
    className: "more-btn",
    onClick: function onClick() {
      return setExpanded(!expanded);
    }
  }, expanded ? window.t("changelog.show_less") : window.t("changelog.more", {
    n: list.length - 3
  })));
}
function NewsBox(_ref35) {
  var passport = _ref35.passport,
    destIso2 = _ref35.destIso2;
  var list = useMemo(function () {
    if (!window.VISA_NEWS) return [];
    return window.VISA_NEWS.filter(function (it) {
      var _it$affects;
      return namesDest(it, destIso2) && (!passport || (((_it$affects = it.affects) === null || _it$affects === void 0 ? void 0 : _it$affects.passports) || []).length === 0 || namesPassport(it, passport));
    }).sort(sortNewsDesc).slice(0, 2);
  }, [passport, destIso2]);
  if (list.length === 0) return null;
  return React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", {
    className: "p-hint",
    style: {
      margin: "0 0 6px",
      fontWeight: 600,
      color: "var(--ink-2)"
    }
  }, window.t("news.recent_for_dest")), React.createElement("div", {
    className: "feed"
  }, list.map(function (it) {
    return React.createElement(NewsItem, {
      key: it.id,
      item: it,
      compact: true
    });
  })));
}
function ChangelogFloater() {
  var _useState23 = useState(false),
    _useState24 = _slicedToArray(_useState23, 2),
    open = _useState24[0],
    setOpen = _useState24[1];
  useLangTick();
  var count = (window.CHANGELOG || []).length;
  if (count === 0) return null;
  return React.createElement("div", {
    className: "floater"
  }, React.createElement("button", {
    type: "button",
    className: "floater-btn overlay-card",
    onClick: function onClick() {
      return setOpen(function (o) {
        return !o;
      });
    },
    "aria-expanded": open
  }, React.createElement("span", {
    className: "live-dot",
    "aria-hidden": "true"
  }), React.createElement("span", null, window.t("panel.recently_changed")), React.createElement("span", {
    className: "count"
  }, count), React.createElement(IconCaret, null)), open && React.createElement("div", {
    className: "floater-body overlay-card"
  }, React.createElement(Changelog, {
    embedded: true
  })));
}
function Changelog(_ref36) {
  var embedded = _ref36.embedded;
  var _useState25 = useState(false),
    _useState26 = _slicedToArray(_useState25, 2),
    expanded = _useState26[0],
    setExpanded = _useState26[1];
  var items = expanded ? window.CHANGELOG : window.CHANGELOG.slice(0, 4);
  return React.createElement("div", {
    style: {
      marginBottom: embedded ? 0 : 16
    }
  }, !embedded && React.createElement(Caption, null, window.t("panel.recently_changed")), React.createElement("div", {
    className: "feed"
  }, items.length === 0 ? React.createElement("div", {
    className: "box box-dashed p-hint",
    style: {
      margin: 0
    }
  }, window.t("panel.no_changes"), React.createElement("br", null), React.createElement("span", {
    className: "p-fine"
  }, window.t("panel.no_changes_sub"))) : items.map(function (c, i) {
    return React.createElement(ChangelogItem, {
      key: i,
      entry: c
    });
  })), window.CHANGELOG.length > 4 && React.createElement("button", {
    type: "button",
    className: "more-btn",
    onClick: function onClick() {
      return setExpanded(!expanded);
    }
  }, expanded ? window.t("changelog.show_less") : window.t("changelog.more", {
    n: window.CHANGELOG.length - 4
  })));
}
function describeStatusChange(from, to) {
  if (from === to) return window.t("change.rules_updated");
  var key = "change.".concat(from, "_to_").concat(to);
  var specific = window.t(key);
  if (specific && specific !== key) return specific;
  return window.t("change.now_".concat(to)) || window.t("change.rules_updated");
}
function ChangelogItem(_ref37) {
  var _entry$affects$passpo;
  var entry = _ref37.entry;
  var passportIso = (_entry$affects$passpo = entry.affects.passports) === null || _entry$affects$passpo === void 0 ? void 0 : _entry$affects$passpo[0];
  var passport = passportIso ? window.byIso2[passportIso] : null;
  var dest = window.byIso2[entry.affects.dest];
  return React.createElement("div", {
    className: "feed-item",
    style: {
      "--tone": "var(--".concat(entry.statusTo, ", var(--rule-strong))")
    }
  }, React.createElement("div", {
    className: "feed-meta"
  }, React.createElement("time", {
    dateTime: entry.date
  }, fmtDay(entry.date)), React.createElement("span", null, "\xB7"), passport && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "flag"
  }, passport.flag), React.createElement("span", null, window.countryName(passportIso))), React.createElement("span", null, "\u2192"), dest && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "flag"
  }, dest.flag), React.createElement("span", null, window.countryName(entry.affects.dest)))), React.createElement("div", {
    className: "feed-title",
    style: {
      fontWeight: 500
    }
  }, describeStatusChange(entry.statusFrom, entry.statusTo)), React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, React.createElement("span", {
    className: "stamp is-small",
    style: {
      "--st": stampVar(entry.statusTo)
    }
  }, React.createElement("span", {
    className: "stamp-k"
  }, statusLabel(entry.statusTo)))));
}
function PanelFooter() {
  return React.createElement("footer", {
    className: "panel-foot"
  }, React.createElement("div", null, window.t("footer.refresh")), React.createElement("nav", {
    "aria-label": "Footer"
  }, React.createElement("a", {
    href: "/alerts/"
  }, window.t("footer.alerts")), React.createElement("a", {
    href: "/schengen-calculator/"
  }, window.t("footer.schengen")), React.createElement("a", {
    href: "/itinerary/"
  }, window.t("footer.itinerary")), React.createElement("a", {
    href: "/transit-map/"
  }, window.t("nav.transit_map")), React.createElement("a", {
    href: "/etias/"
  }, window.t("footer.etias")), React.createElement("a", {
    href: "/passport-validity/"
  }, window.t("footer.validity")), React.createElement("a", {
    href: "/visa-shortcuts/"
  }, window.t("footer.shortcuts")), React.createElement("a", {
    href: "/digital-nomad-visa/"
  }, window.t("footer.nomad")), React.createElement("a", {
    href: "/citizenship-by-investment/"
  }, window.t("footer.cbi")), React.createElement("a", {
    href: "/guides/"
  }, tr("nav.guides", "Guides")), React.createElement("a", {
    href: "/about/"
  }, window.t("footer.about")), React.createElement("a", {
    href: "/privacy/"
  }, window.t("footer.privacy")), React.createElement("a", {
    href: "/passport/"
  }, window.t("footer.all_passports")), React.createElement("a", {
    href: "https://github.com/Uygara/atlas-visa-globe",
    target: "_blank",
    rel: "noopener"
  }, window.t("footer.source"))), React.createElement("div", {
    className: "byline"
  }, "\xA9 ", new Date().getFullYear(), " travelnow.info \xB7 Uygar Atalay"));
}
Object.assign(window, {
  Panel: Panel
});

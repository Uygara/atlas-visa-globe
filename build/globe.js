// Generated from components/globe.jsx by tools/build.js — edit the .jsx and rebuild.
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
  useEffect = _React.useEffect,
  useRef = _React.useRef,
  useState = _React.useState,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback;
var STATUS_COLOR = {
  idc: {
    fill: "var(--idc)",
    label: "ID card / free movement",
    "short": "ID card"
  },
  vf: {
    fill: "var(--vf)",
    label: "Visa-free",
    "short": "Visa-free"
  },
  eta: {
    fill: "var(--eta)",
    label: "Travel authorization",
    "short": "ETA"
  },
  ev: {
    fill: "var(--ev)",
    label: "eVisa",
    "short": "eVisa"
  },
  voa: {
    fill: "var(--voa)",
    label: "Visa on arrival",
    "short": "VoA"
  },
  vr: {
    fill: "var(--vr)",
    label: "Visa required",
    "short": "Visa req."
  },
  ban: {
    fill: "var(--ban)",
    label: "No entry allowed",
    "short": "No entry"
  },
  self: {
    fill: "var(--self)",
    label: "Your passport",
    "short": "Home"
  },
  na: {
    fill: "var(--na)",
    label: "No data",
    "short": "—"
  }
};
function statusLabel(s) {
  var _STATUS_COLOR$s2;
  if (window.t) {
    var _STATUS_COLOR$s;
    var k = "status." + s;
    return window.t(k) !== k ? window.t(k) : ((_STATUS_COLOR$s = STATUS_COLOR[s]) === null || _STATUS_COLOR$s === void 0 ? void 0 : _STATUS_COLOR$s.label) || s;
  }
  return ((_STATUS_COLOR$s2 = STATUS_COLOR[s]) === null || _STATUS_COLOR$s2 === void 0 ? void 0 : _STATUS_COLOR$s2.label) || s;
}
var STATUS_HEX = {
  idc: "var(--idc)",
  vf: "var(--vf)",
  eta: "var(--eta)",
  ev: "var(--ev)",
  voa: "var(--voa)",
  vr: "var(--vr)",
  ban: "var(--ban)",
  self: "var(--self)",
  na: "var(--na)"
};
function Globe(_ref) {
  var passport = _ref.passport,
    comparePassport = _ref.comparePassport,
    groupPassports = _ref.groupPassports,
    filter = _ref.filter,
    mode = _ref.mode,
    direction = _ref.direction,
    variant = _ref.variant,
    residencePermits = _ref.residencePermits,
    onCountryClick = _ref.onCountryClick,
    onCountryHover = _ref.onCountryHover,
    focusedCountry = _ref.focusedCountry,
    fillResolver = _ref.fillResolver,
    hoverRenderer = _ref.hoverRenderer,
    arcs = _ref.arcs,
    stopMarkers = _ref.stopMarkers;
  var groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  var resolveDirected = function resolveDirected(iso2) {
    return direction === "incoming" ? window.resolveStatus(iso2, passport) : window.resolveStatus(passport, iso2);
  };
  var svgRef = useRef(null);
  var wrapRef = useRef(null);
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    topology = _useState2[0],
    setTopology = _useState2[1];
  var _useState3 = useState(function () {
      return {
        w: Math.max(1, window.innerWidth - 360),
        h: window.innerHeight
      };
    }),
    _useState4 = _slicedToArray(_useState3, 2),
    size = _useState4[0],
    setSize = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    hover = _useState6[0],
    setHover = _useState6[1];
  var _useState7 = useState(0),
    _useState8 = _slicedToArray(_useState7, 2),
    forceLangTick = _useState8[1];
  useEffect(function () {
    var onLang = function onLang() {
      return forceLangTick(function (x) {
        return x + 1;
      });
    };
    window.addEventListener("atlas:lang", onLang);
    return function () {
      return window.removeEventListener("atlas:lang", onLang);
    };
  }, []);
  var rotRef = useRef([20, -10, 0]);
  var panRef = useRef([0, 0]);
  var zoomRef = useRef(1);
  var baseScaleRef = useRef(1);
  var autoRef = useRef(false);
  var lastInteractRef = useRef(performance.now());
  var rafRef = useRef(null);
  var projRef = useRef(null);
  var pathRef = useRef(null);
  var _useState9 = useState(1),
    _useState0 = _slicedToArray(_useState9, 2),
    zoomDisplay = _useState0[0],
    setZoomDisplay = _useState0[1];
  useEffect(function () {
    var alive = true;
    fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(function (r) {
      return r.json();
    }).then(function (world) {
      if (!alive) return;
      var features = topojson.feature(world, world.objects.countries);
      setTopology(features);
      var loader = document.getElementById("loading");
      if (loader) loader.classList.add("hidden");
    })["catch"](function (err) {
      console.error("Failed to load topology", err);
    });
    return function () {
      alive = false;
    };
  }, []);
  useEffect(function () {
    var measure = function measure() {
      var el = wrapRef.current;
      if (!el) return;
      var r = el.getBoundingClientRect();
      var w = Math.floor(r.width),
        h = Math.floor(r.height);
      if (w > 0 && h > 0) {
        setSize(function (prev) {
          return prev.w === w && prev.h === h ? prev : {
            w: w,
            h: h
          };
        });
      }
    };
    measure();
    var t1 = setTimeout(measure, 50);
    var t2 = setTimeout(measure, 200);
    var t3 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    var ro;
    if (typeof ResizeObserver !== "undefined" && wrapRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(wrapRef.current);
    }
    return function () {
      var _ro;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", measure);
      (_ro = ro) === null || _ro === void 0 || _ro.disconnect();
    };
  }, []);
  var redrawPaths = useCallback(function () {
    if (!pathRef.current || !svgRef.current) return;
    var paths = svgRef.current.querySelectorAll("path.country");
    paths.forEach(function (p) {
      var d = pathRef.current(p.__feature);
      if (d) p.setAttribute("d", d);else p.setAttribute("d", "");
    });
    if (projRef.current) {
      var isGlobe = mode !== "flat";
      var rot = projRef.current.rotate ? projRef.current.rotate() : [0, 0, 0];
      var center = [-rot[0], -rot[1]];
      var markers = svgRef.current.querySelectorAll("g[data-micro-iso]");
      markers.forEach(function (g) {
        var iso = g.getAttribute("data-micro-iso");
        var c = window.byIso2[iso];
        if (!c) return;
        if (isGlobe && d3.geoDistance([c.lon, c.lat], center) >= Math.PI / 2) {
          g.style.visibility = "hidden";
          g.style.pointerEvents = "none";
          return;
        }
        var proj = projRef.current([c.lon, c.lat]);
        if (proj && isFinite(proj[0]) && isFinite(proj[1])) {
          g.setAttribute("transform", "translate(".concat(proj[0], ",").concat(proj[1], ")"));
          g.style.visibility = "visible";
          g.style.pointerEvents = "auto";
        } else {
          g.style.visibility = "hidden";
          g.style.pointerEvents = "none";
        }
      });
      var labels = svgRef.current.querySelectorAll("text.country-label");
      var FONT = mode === "flat" ? 11 : 10;
      var MIN_WIDTH = mode === "flat" ? 36 : 28;
      var placed = [];
      var candidates = [];
      labels.forEach(function (l) {
        if (!l.__feature) {
          l.style.display = "none";
          return;
        }
        try {
          var b = pathRef.current.bounds(l.__feature);
          var bw = b[1][0] - b[0][0];
          var bh = b[1][1] - b[0][1];
          if (!isFinite(bw) || bw < MIN_WIDTH) {
            l.style.display = "none";
            return;
          }
          if (isGlobe) {
            var f = l.__feature;
            var geoCenter = d3.geoCentroid(f);
            if (geoCenter && d3.geoDistance(geoCenter, center) >= Math.PI / 2.2) {
              l.style.display = "none";
              return;
            }
          }
          var c = pathRef.current.centroid(l.__feature);
          if (!c || !isFinite(c[0])) {
            l.style.display = "none";
            return;
          }
          candidates.push({
            el: l,
            x: c[0],
            y: c[1],
            area: bw * bh,
            bw: bw
          });
        } catch (e) {
          l.style.display = "none";
        }
      });
      candidates.sort(function (a, b) {
        return b.area - a.area;
      });
      candidates.forEach(function (_ref2) {
        var el = _ref2.el,
          x = _ref2.x,
          y = _ref2.y;
        var txt = el.textContent || "";
        var w = Math.max(20, txt.length * FONT * 0.55);
        var h = FONT * 1.1;
        var rect = {
          x: x - w / 2,
          y: y - h / 2,
          w: w,
          h: h
        };
        var collides = placed.some(function (p) {
          return rect.x < p.x + p.w && rect.x + rect.w > p.x && rect.y < p.y + p.h && rect.y + rect.h > p.y;
        });
        if (collides) {
          el.style.display = "none";
          return;
        }
        placed.push(rect);
        el.setAttribute("x", x);
        el.setAttribute("y", y);
        el.setAttribute("font-size", FONT);
        el.style.display = "";
      });
      var arcPaths = svgRef.current.querySelectorAll("path.route-arc");
      arcPaths.forEach(function (p) {
        var a = p.__arcCoords;
        if (!a) {
          p.setAttribute("d", "");
          return;
        }
        var d = pathRef.current({
          type: "LineString",
          coordinates: [a.from, a.to]
        });
        p.setAttribute("d", d || "");
      });
      var stopG = svgRef.current.querySelectorAll("g[data-stop-iso]");
      stopG.forEach(function (g) {
        var iso = g.getAttribute("data-stop-iso");
        var c = window.byIso2[iso];
        if (!c) {
          g.style.visibility = "hidden";
          return;
        }
        if (isGlobe && d3.geoDistance([c.lon, c.lat], center) >= Math.PI / 2) {
          g.style.visibility = "hidden";
          return;
        }
        var proj = projRef.current([c.lon, c.lat]);
        if (proj && isFinite(proj[0]) && isFinite(proj[1])) {
          g.setAttribute("transform", "translate(".concat(proj[0], ",").concat(proj[1], ")"));
          g.style.visibility = "visible";
        } else {
          g.style.visibility = "hidden";
        }
      });
    }
  }, [mode]);
  var projection = useMemo(function () {
    var w = size.w,
      h = size.h;
    var proj, base;
    if (mode === "flat") {
      base = Math.min(w / 5.5, h / 3);
      proj = d3.geoEquirectangular().scale(base * zoomRef.current).translate([w / 2, h / 2 + panRef.current[1]]).rotate([rotRef.current[0], 0, 0]);
    } else {
      base = Math.min(w, h) * 0.42;
      proj = d3.geoOrthographic().scale(base * zoomRef.current).translate([w / 2, h / 2]).clipAngle(90).rotate(rotRef.current);
    }
    baseScaleRef.current = base;
    projRef.current = proj;
    pathRef.current = d3.geoPath(proj);
    return proj;
  }, [size.w, size.h, mode]);
  var applyZoom = useCallback(function (newZoom) {
    var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var resetPan = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    newZoom = Math.max(1, Math.min(8, newZoom));
    if (resetPan) {
      panRef.current = [0, 0];
      if (mode === "flat") rotRef.current = [0, 0, 0];
    }
    var applyScaleAndTranslate = function applyScaleAndTranslate() {
      if (!projRef.current) return;
      projRef.current.scale(baseScaleRef.current * zoomRef.current);
      if (mode === "flat") {
        projRef.current.rotate(rotRef.current);
        projRef.current.translate([size.w / 2, size.h / 2 + panRef.current[1]]);
      }
      redrawPaths();
    };
    if (!animate) {
      zoomRef.current = newZoom;
      applyScaleAndTranslate();
      setZoomDisplay(newZoom);
      return;
    }
    var start = zoomRef.current;
    var t0 = performance.now();
    var dur = 600;
    var _step = function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      zoomRef.current = start + (newZoom - start) * e;
      applyScaleAndTranslate();
      setZoomDisplay(zoomRef.current);
      if (t < 1) requestAnimationFrame(_step);
    };
    requestAnimationFrame(_step);
  }, [mode, size.w, size.h]);
  useEffect(function () {
    if (!focusedCountry) return;
    var c = window.byIso2[focusedCountry];
    if (!c) return;
    applyZoom(2.2, true);
    if (mode === "flat") return;
    var target = [-c.lon, -c.lat, 0];
    var start = _toConsumableArray(rotRef.current);
    var t0 = performance.now();
    var dur = 800;
    autoRef.current = false;
    lastInteractRef.current = performance.now();
    var _tween = function tween(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      rotRef.current = [start[0] + (target[0] - start[0]) * e, start[1] + (target[1] - start[1]) * e, 0];
      if (projRef.current && projRef.current.rotate) {
        projRef.current.rotate(rotRef.current);
        redrawPaths();
      }
      if (t < 1) requestAnimationFrame(_tween);
    };
    requestAnimationFrame(_tween);
  }, [focusedCountry, mode, applyZoom]);
  useEffect(function () {
    if (!topology) return;
    var svg = svgRef.current;
    var onWheel = function onWheel(e) {
      e.preventDefault();
      lastInteractRef.current = performance.now();
      autoRef.current = false;
      var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      var newZoom = Math.max(1, Math.min(8, zoomRef.current * factor));
      if (mode === "flat" && projRef.current && projRef.current.invert) {
        var rect = svg.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var worldPt = projRef.current.invert([mx, my]);
        zoomRef.current = newZoom;
        projRef.current.scale(baseScaleRef.current * newZoom);
        if (worldPt && isFinite(worldPt[0])) {
          var newPx = projRef.current(worldPt);
          if (newPx && isFinite(newPx[0])) {
            var dx = mx - newPx[0];
            var dy = my - newPx[1];
            var degPerPx = 180 / (Math.PI * projRef.current.scale());
            rotRef.current = [rotRef.current[0] + dx * degPerPx, 0, 0];
            panRef.current[1] += dy;
            projRef.current.rotate(rotRef.current);
            projRef.current.translate([size.w / 2, size.h / 2 + panRef.current[1]]);
          }
        }
        setZoomDisplay(newZoom);
        redrawPaths();
      } else {
        applyZoom(newZoom, false);
      }
    };
    svg.addEventListener("wheel", onWheel, {
      passive: false
    });
    var dragging = false;
    var startRot = null;
    var startPan = null;
    var startPt = null;
    var sensitivity = 0.35;
    var onDown = function onDown(e) {
      dragging = true;
      autoRef.current = false;
      lastInteractRef.current = performance.now();
      startRot = _toConsumableArray(rotRef.current);
      startPan = _toConsumableArray(panRef.current);
      startPt = [e.clientX, e.clientY];
      svg.style.cursor = "grabbing";
    };
    var onMove = function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startPt[0];
      var dy = e.clientY - startPt[1];
      if (mode === "flat") {
        var scale = projRef.current ? projRef.current.scale() : baseScaleRef.current;
        var degPerPx = 180 / (Math.PI * scale);
        var lambda = (startRot[0] + dx * degPerPx) % 360;
        if (lambda > 180) lambda -= 360;
        if (lambda < -180) lambda += 360;
        rotRef.current = [lambda, 0, 0];
        panRef.current = [0, startPan[1] + dy];
        if (projRef.current) {
          projRef.current.rotate(rotRef.current);
          projRef.current.translate([size.w / 2, size.h / 2 + panRef.current[1]]);
          redrawPaths();
        }
      } else {
        var s = sensitivity / Math.max(1, zoomRef.current * 0.85);
        rotRef.current = [startRot[0] + dx * s, Math.max(-90, Math.min(90, startRot[1] - dy * s)), 0];
        if (projRef.current && projRef.current.rotate) {
          projRef.current.rotate(rotRef.current);
          redrawPaths();
        }
      }
    };
    var onUp = function onUp() {
      dragging = false;
      svg.style.cursor = "grab";
      lastInteractRef.current = performance.now();
    };
    svg.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    var pinching = false;
    var pinchStartDist = 0;
    var pinchStartZoom = 1;
    var dist = function dist(t) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    };
    var onTouchStart = function onTouchStart(e) {
      lastInteractRef.current = performance.now();
      autoRef.current = false;
      if (e.touches.length === 2) {
        pinching = true;
        dragging = false;
        pinchStartDist = dist(e.touches);
        pinchStartZoom = zoomRef.current;
      } else if (e.touches.length === 1) {
        pinching = false;
        onDown({
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
      }
    };
    var onTouchMove = function onTouchMove(e) {
      if (pinching && e.touches.length >= 2) {
        e.preventDefault();
        var d = dist(e.touches);
        if (pinchStartDist > 0) {
          var factor = d / pinchStartDist;
          applyZoom(pinchStartZoom * factor, false);
        }
        return;
      }
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        onMove({
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
      }
    };
    var onTouchEnd = function onTouchEnd(e) {
      if (e.touches.length === 0) {
        pinching = false;
        onUp();
      } else if (e.touches.length === 1 && pinching) {
        pinching = false;
        onDown({
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
      }
    };
    svg.addEventListener("touchstart", onTouchStart, {
      passive: true
    });
    svg.addEventListener("touchmove", onTouchMove, {
      passive: false
    });
    svg.addEventListener("touchend", onTouchEnd);
    svg.addEventListener("touchcancel", onTouchEnd);
    svg.style.cursor = "grab";
    svg.style.touchAction = "none";
    if (mode !== "flat") {
      var _tick = function tick() {
        var now = performance.now();
        var idleFor = now - lastInteractRef.current;
        if (autoRef.current || idleFor > 60000) {
          autoRef.current = true;
          rotRef.current[0] += 0.035;
          if (rotRef.current[0] > 180) rotRef.current[0] -= 360;
          if (projRef.current && projRef.current.rotate) {
            projRef.current.rotate(rotRef.current);
            redrawPaths();
          }
        }
        rafRef.current = requestAnimationFrame(_tick);
      };
      rafRef.current = requestAnimationFrame(_tick);
    }
    return function () {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("touchcancel", onTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, [topology, mode, redrawPaths, applyZoom, size.w, size.h]);
  useEffect(function () {
    zoomRef.current = 1;
    panRef.current = [0, 0];
    setZoomDisplay(1);
    if (projRef.current) {
      projRef.current.scale(baseScaleRef.current);
      if (mode === "flat" && projRef.current.translate) {
        projRef.current.translate([size.w / 2, size.h / 2]);
      }
      redrawPaths();
    }
  }, [mode, redrawPaths, size.w, size.h]);
  useEffect(function () {
    if (topology) redrawPaths();
  }, [topology, projection, redrawPaths]);
  useEffect(function () {
    if (topology) redrawPaths();
  }, [arcs, stopMarkers, topology, redrawPaths]);
  var resolveOne = useCallback(function (iso2) {
    if (groupActive) {
      if (groupPassports.includes(iso2)) return {
        status: "self",
        days: null
      };
      return window.resolveGroupStatus(groupPassports, iso2);
    }
    if (direction === "incoming") {
      return window.resolveStatus(iso2, passport);
    }
    if (variant && variant !== "ordinary") {
      return window.resolveVariantStatus(passport, iso2, variant);
    }
    return window.resolveStatus(passport, iso2);
  }, [passport, direction, groupActive, groupPassports, variant, residencePermits]);
  var fillFor = useCallback(function (iso2) {
    var _STATUS_COLOR$r$statu;
    if (fillResolver) {
      var res = fillResolver(iso2);
      return res && res.color || "var(--land)";
    }
    if (!passport && !groupActive) return STATUS_COLOR.na.fill;
    var r = resolveOne(iso2);
    if (filter !== "all" && r.status !== filter && r.status !== "self") {
      return "var(--land)";
    }
    if (comparePassport && !groupActive && r.status !== "self" && iso2 !== comparePassport) {
      var rc = direction === "incoming" ? window.resolveStatus(iso2, comparePassport) : window.resolveStatus(comparePassport, iso2);
      if (rc.status && rc.status !== r.status && STATUS_HEX[r.status] && STATUS_HEX[rc.status]) {
        return "url(#stripe-".concat(r.status, "-").concat(rc.status, ")");
      }
    }
    if (r.upgradedBy && STATUS_HEX[r.status]) {
      return "url(#permit-".concat(r.status, ")");
    }
    if (r.status === "ban") return "url(#hatch-ban)";
    return ((_STATUS_COLOR$r$statu = STATUS_COLOR[r.status]) === null || _STATUS_COLOR$r$statu === void 0 ? void 0 : _STATUS_COLOR$r$statu.fill) || STATUS_COLOR.na.fill;
  }, [passport, filter, resolveOne, groupActive, comparePassport, direction, fillResolver]);
  var opacityFor = useCallback(function (iso2) {
    if (fillResolver) return 1;
    if (!passport && !groupActive) return 1;
    if (filter === "all") return 1;
    var r = resolveOne(iso2);
    if (r.status === filter || r.status === "self") return 1;
    return 0.25;
  }, [passport, filter, resolveOne, groupActive, fillResolver]);
  var strokeFor = useCallback(function (iso2) {
    var _STATUS_COLOR$r$statu2;
    if (!comparePassport) return "var(--land-stroke)";
    if (iso2 === comparePassport) return "var(--compare-self)";
    var r = window.resolveStatus(comparePassport, iso2);
    return ((_STATUS_COLOR$r$statu2 = STATUS_COLOR[r.status]) === null || _STATUS_COLOR$r$statu2 === void 0 ? void 0 : _STATUS_COLOR$r$statu2.fill) || "var(--land-stroke)";
  }, [comparePassport]);
  var handleEnter = function handleEnter(e, feature) {
    var iso2 = featureToIso2(feature);
    if (!iso2) return;
    var rect = wrapRef.current.getBoundingClientRect();
    setHover({
      iso2: iso2,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    onCountryHover === null || onCountryHover === void 0 || onCountryHover(iso2);
  };
  var handleMove = function handleMove(e) {
    if (!hover) return;
    var rect = wrapRef.current.getBoundingClientRect();
    setHover(function (h) {
      return h && _objectSpread(_objectSpread({}, h), {}, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    });
  };
  var handleLeave = function handleLeave() {
    setHover(null);
    onCountryHover === null || onCountryHover === void 0 || onCountryHover(null);
  };
  var handleClick = function handleClick(feature) {
    var iso2 = featureToIso2(feature);
    if (iso2) onCountryClick === null || onCountryClick === void 0 || onCountryClick(iso2);
  };
  var features = (topology === null || topology === void 0 ? void 0 : topology.features) || [];
  var cx = size.w / 2;
  var cy = size.h / 2;
  var r = Math.min(size.w, size.h) * 0.42;
  var showGlobe = mode !== "flat";
  var showGlow = mode === "globe3d";
  return React.createElement("div", {
    ref: wrapRef,
    className: "globe-wrap",
    style: {
      width: "100%",
      height: "100%",
      position: "relative"
    }
  }, React.createElement("svg", {
    ref: svgRef,
    width: size.w,
    height: size.h,
    style: {
      display: "block",
      userSelect: "none"
    },
    onMouseMove: handleMove
  }, React.createElement("defs", null, React.createElement("radialGradient", {
    id: "limb",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, React.createElement("stop", {
    offset: "62%",
    style: {
      stopColor: "var(--ink)",
      stopOpacity: 0
    }
  }), React.createElement("stop", {
    offset: "100%",
    style: {
      stopColor: "var(--ink)",
      stopOpacity: 0.16
    }
  })), React.createElement("pattern", {
    id: "hatch-ban",
    width: "6",
    height: "6",
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)"
  }, React.createElement("rect", {
    width: "6",
    height: "6",
    style: {
      fill: "var(--ban)"
    }
  }), React.createElement("rect", {
    width: "1.4",
    height: "6",
    style: {
      fill: "var(--paper-raised)",
      fillOpacity: 0.38
    }
  })), ["idc", "vf", "eta", "ev", "voa", "vr", "ban"].flatMap(function (a) {
    return ["idc", "vf", "eta", "ev", "voa", "vr", "ban"].filter(function (b) {
      return b !== a;
    }).map(function (b) {
      return React.createElement("pattern", {
        key: "".concat(a, "-").concat(b),
        id: "stripe-".concat(a, "-").concat(b),
        width: "8",
        height: "8",
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(45)"
      }, React.createElement("rect", {
        width: "8",
        height: "8",
        style: {
          fill: STATUS_HEX[a]
        }
      }), React.createElement("rect", {
        x: "4",
        width: "4",
        height: "8",
        style: {
          fill: STATUS_HEX[b]
        }
      }));
    });
  }), ["vf", "eta", "ev", "voa"].map(function (s) {
    return React.createElement("pattern", {
      key: "permit-".concat(s),
      id: "permit-".concat(s),
      width: "7",
      height: "7",
      patternUnits: "userSpaceOnUse",
      patternTransform: "rotate(45)"
    }, React.createElement("rect", {
      width: "7",
      height: "7",
      style: {
        fill: STATUS_HEX[s]
      }
    }), React.createElement("rect", {
      x: "5",
      width: "2",
      height: "7",
      style: {
        fill: STATUS_HEX.self
      }
    }));
  })), showGlobe && React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * zoomDisplay,
    style: {
      fill: "var(--ocean)"
    }
  }), showGlobe && topology && React.createElement("path", {
    d: pathRef.current(d3.geoGraticule10()) || "",
    fill: "none",
    stroke: "var(--graticule)",
    strokeWidth: "0.6"
  }), React.createElement("g", null, features.map(function (f, idx) {
    var iso2 = featureToIso2(f);
    var fill = iso2 ? fillFor(iso2) : "var(--land)";
    var op = iso2 ? opacityFor(iso2) : 1;
    var isHover = (hover === null || hover === void 0 ? void 0 : hover.iso2) === iso2;
    var isCompareSelf = comparePassport && iso2 === comparePassport;
    return React.createElement("path", {
      key: f.id || "f-".concat(idx),
      ref: function ref(el) {
        if (el) el.__feature = f;
      },
      className: "country",
      d: "",
      fill: fill,
      opacity: op,
      stroke: isHover ? "var(--ink)" : strokeFor(iso2),
      strokeWidth: isHover ? 1.2 : isCompareSelf ? 2.4 : comparePassport ? 1.4 : 0.6,
      onMouseEnter: function onMouseEnter(e) {
        return handleEnter(e, f);
      },
      onMouseLeave: handleLeave,
      onClick: function onClick() {
        return handleClick(f);
      }
    });
  })), showGlobe && React.createElement("g", {
    style: {
      pointerEvents: "none"
    }
  }, showGlow && React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * zoomDisplay,
    fill: "url(#limb)"
  }), React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * zoomDisplay,
    fill: "none",
    style: {
      stroke: "var(--globe-edge)"
    },
    strokeWidth: "1"
  })), React.createElement("g", {
    "data-label-layer": "1",
    style: {
      pointerEvents: "none"
    }
  }, features.map(function (f, idx) {
    var iso2 = featureToIso2(f);
    if (!iso2) return null;
    return React.createElement("text", {
      key: "l-" + (f.id || iso2 || idx),
      ref: function ref(el) {
        if (el) el.__feature = f;
      },
      className: "country-label",
      textAnchor: "middle",
      dominantBaseline: "central",
      style: {
        fill: "var(--ink)",
        fontFamily: "var(--font-sans, sans-serif)",
        fontWeight: 600,
        letterSpacing: "0.01em",
        opacity: 0.82,
        display: "none",
        paintOrder: "stroke",
        stroke: "var(--paper-raised)",
        strokeOpacity: 0.85,
        strokeWidth: 2.6,
        strokeLinejoin: "round"
      }
    }, window.countryName(iso2));
  })), Array.isArray(arcs) && arcs.length > 0 && React.createElement("g", {
    "data-arc-layer": "1",
    style: {
      pointerEvents: "none"
    }
  }, arcs.map(function (a, i) {
    var cf = window.byIso2[a.from],
      ct = window.byIso2[a.to];
    if (!cf || !ct) return null;
    return React.createElement("path", {
      key: "arc-".concat(i),
      className: "route-arc",
      ref: function ref(el) {
        if (el) el.__arcCoords = {
          from: [cf.lon, cf.lat],
          to: [ct.lon, ct.lat]
        };
      },
      d: "",
      fill: "none",
      stroke: "var(--accent)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeDasharray: "1 6",
      opacity: "0.9"
    });
  })), Array.isArray(stopMarkers) && stopMarkers.length > 0 && React.createElement("g", {
    "data-stop-layer": "1",
    style: {
      pointerEvents: "none"
    }
  }, stopMarkers.map(function (s, i) {
    return React.createElement("g", {
      key: "stop-".concat(s.iso2, "-").concat(i),
      "data-stop-iso": s.iso2,
      style: {
        visibility: "hidden"
      }
    }, React.createElement("circle", {
      r: "11",
      style: {
        fill: "var(--accent)",
        stroke: "var(--paper-raised)"
      },
      strokeWidth: "2"
    }), React.createElement("text", {
      textAnchor: "middle",
      dominantBaseline: "central",
      y: "0.5",
      style: {
        fill: "var(--on-accent)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 500
      }
    }, s.label != null ? s.label : i + 1));
  })), topology && React.createElement(MicroStateMarkers, {
    passport: passport,
    comparePassport: comparePassport,
    fillFor: fillFor,
    opacityFor: opacityFor,
    onClick: handleClick,
    onHover: handleEnter,
    onLeave: handleLeave,
    hover: hover,
    zoom: zoomDisplay
  })), topology && React.createElement(ZoomControls, {
    zoom: zoomDisplay,
    onZoomIn: function onZoomIn() {
      return applyZoom(zoomRef.current * 1.4, true);
    },
    onZoomOut: function onZoomOut() {
      return applyZoom(zoomRef.current / 1.4, true);
    },
    onReset: function onReset() {
      return applyZoom(1, true, true);
    }
  }), hover && hoverRenderer && hoverRenderer(hover), hover && !hoverRenderer && (passport || groupActive) && React.createElement(HoverCard, {
    hover: hover,
    passport: passport,
    compare: comparePassport,
    direction: direction,
    variant: variant,
    groupPassports: groupActive ? groupPassports : null
  }));
}
var FEATURE_NAME_TO_ISO2 = {
  "Kosovo": "XK",
  "N. Cyprus": "XN",
  "Northern Cyprus": "XN",
  "Somaliland": "SO",
  "Siachen Glacier": null,
  "Indian Ocean Ter.": "AU"
};
function featureToIso2(feature) {
  if (!feature) return null;
  if (feature.id) {
    var c = window.byId[feature.id] || window.byId[String(parseInt(feature.id, 10))];
    if (c) return c.iso2;
  }
  var n = feature.properties && feature.properties.name;
  if (n && FEATURE_NAME_TO_ISO2[n] !== undefined) return FEATURE_NAME_TO_ISO2[n];
  return null;
}
function idToIso2(id) {
  if (!id) return null;
  var c = window.byId[id] || window.byId[String(parseInt(id, 10))];
  return c === null || c === void 0 ? void 0 : c.iso2;
}
function HoverCard(_ref3) {
  var _window$byIso2$compar;
  var hover = _ref3.hover,
    passport = _ref3.passport,
    compare = _ref3.compare,
    direction = _ref3.direction,
    variant = _ref3.variant,
    groupPassports = _ref3.groupPassports;
  var dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  var groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  var variantActive = !!variant && variant !== "ordinary" && !groupActive && direction !== "incoming";
  var r = groupActive ? window.resolveGroupStatus(groupPassports, hover.iso2) : direction === "incoming" ? window.resolveStatus(hover.iso2, passport) : variantActive ? window.resolveVariantStatus(passport, hover.iso2, variant) : window.resolveStatus(passport, hover.iso2);
  var groupBreakdown = groupActive ? groupPassports.map(function (p) {
    return {
      passport: p,
      r: window.resolveStatus(p, hover.iso2)
    };
  }) : null;
  var rc = !groupActive && compare ? direction === "incoming" ? window.resolveStatus(hover.iso2, compare) : window.resolveStatus(compare, hover.iso2) : null;
  var ofs = 18;
  return React.createElement("div", {
    className: "hovercard overlay-card",
    style: {
      left: hover.x + ofs,
      top: hover.y + ofs
    }
  }, React.createElement("div", {
    className: "hovercard-title"
  }, React.createElement("span", {
    className: "flag"
  }, dest.flag), React.createElement("span", null, window.countryName(hover.iso2))), React.createElement("div", {
    className: "hovercard-row"
  }, r.status === "ban" ? React.createElement(Swatch, {
    s: "ban"
  }) : React.createElement(Dot, {
    s: r.status
  }), React.createElement("span", null, statusLabel(r.status)), r.days && React.createElement("span", {
    className: "aside"
  }, window.t("detail.up_to_days", {
    n: r.days
  }))), rc && React.createElement("div", {
    className: "hovercard-row hovercard-sep"
  }, React.createElement("span", {
    className: "hovercard-cap"
  }, window.t("detail.vs"), " ", React.createElement("span", {
    className: "flag"
  }, (_window$byIso2$compar = window.byIso2[compare]) === null || _window$byIso2$compar === void 0 ? void 0 : _window$byIso2$compar.flag)), React.createElement(Dot, {
    s: rc.status
  }), React.createElement("span", null, statusLabel(rc.status)), rc.days && React.createElement("span", {
    className: "aside"
  }, rc.days, "d")), groupBreakdown && React.createElement("div", {
    className: "hovercard-sep"
  }, React.createElement("div", {
    className: "hovercard-cap"
  }, window.t("detail.per_member")), groupBreakdown.map(function (_ref4) {
    var p = _ref4.passport,
      rr = _ref4.r;
    var c = window.byIso2[p];
    return React.createElement("div", {
      key: p,
      className: "hovercard-row",
      style: {
        marginTop: 3,
        fontSize: 12.5
      }
    }, React.createElement("span", {
      className: "flag"
    }, (c === null || c === void 0 ? void 0 : c.flag) || ""), React.createElement(Dot, {
      s: rr.status
    }), React.createElement("span", null, statusLabel(rr.status)), rr.days && React.createElement("span", {
      className: "aside"
    }, rr.days, "d"));
  })));
}
var MICRO_STATES = ["VA", "MC", "SM", "LI", "AD", "MT", "SG", "BH", "MV", "KN", "AG", "DM", "GD", "LC", "VC", "BB", "TT", "SC", "MU", "CV", "ST", "KM", "NR", "TV", "PW", "MH", "FM", "KI", "TO", "WS", "FJ", "VU", "BN", "HK", "MO", "PS"];
function MicroStateMarkers(_ref5) {
  var passport = _ref5.passport,
    comparePassport = _ref5.comparePassport,
    fillFor = _ref5.fillFor,
    opacityFor = _ref5.opacityFor,
    _onClick = _ref5.onClick,
    onHover = _ref5.onHover,
    onLeave = _ref5.onLeave,
    hover = _ref5.hover,
    zoom = _ref5.zoom;
  var baseR = 3.5;
  var r = Math.max(3, baseR + zoom * 0.6);
  return React.createElement("g", {
    "data-micro-layer": "1"
  }, MICRO_STATES.map(function (iso2) {
    var c = window.byIso2[iso2];
    if (!c) return null;
    var fill = passport ? fillFor(iso2) : "var(--land)";
    var op = passport ? opacityFor(iso2) : 0.7;
    var isHover = (hover === null || hover === void 0 ? void 0 : hover.iso2) === iso2;
    var isPrimary = iso2 === passport;
    var isCompare = iso2 === comparePassport;
    var showRing = isPrimary || isCompare || isHover;
    var ringColor = isPrimary ? "var(--self)" : isCompare ? "var(--compare-self)" : "var(--ink)";
    return React.createElement("g", {
      key: "marker-".concat(iso2),
      "data-micro-iso": iso2,
      style: {
        cursor: "pointer",
        visibility: "hidden"
      },
      onMouseEnter: function onMouseEnter(e) {
        return onHover(e, {
          id: c.id,
          __micro: true
        });
      },
      onMouseLeave: onLeave,
      onClick: function onClick() {
        return _onClick({
          id: c.id,
          __micro: true
        });
      }
    }, React.createElement("circle", {
      r: r + 1.8,
      style: {
        fill: "var(--paper-raised)"
      },
      opacity: op
    }), React.createElement("circle", {
      r: r,
      fill: fill,
      opacity: op,
      stroke: showRing ? ringColor : "var(--rule-strong)",
      strokeWidth: showRing ? 2 : 0.8
    }));
  }));
}
function ZoomControls(_ref6) {
  var zoom = _ref6.zoom,
    onZoomIn = _ref6.onZoomIn,
    onZoomOut = _ref6.onZoomOut,
    onReset = _ref6.onReset;
  return React.createElement("div", {
    className: "zoom overlay-card"
  }, React.createElement("button", {
    type: "button",
    onClick: onZoomIn,
    title: window.t("zoom.in"),
    "aria-label": window.t("zoom.in")
  }, React.createElement("svg", {
    viewBox: "0 0 14 14",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M7 2 V12 M2 7 H12",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }))), React.createElement("button", {
    type: "button",
    onClick: onZoomOut,
    title: window.t("zoom.out"),
    "aria-label": window.t("zoom.out")
  }, React.createElement("svg", {
    viewBox: "0 0 14 14",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M2 7 H12",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }))), React.createElement("output", {
    title: window.t("zoom.current")
  }, zoom.toFixed(1), "\xD7"), React.createElement("button", {
    type: "button",
    onClick: onReset,
    title: window.t("zoom.reset"),
    "aria-label": window.t("zoom.reset"),
    disabled: zoom === 1
  }, React.createElement("svg", {
    viewBox: "0 0 14 14",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M3 7 a4 4 0 1 0 1.2 -2.8",
    stroke: "currentColor",
    strokeWidth: "1.5",
    fill: "none",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M3 2 V5 H6",
    stroke: "currentColor",
    strokeWidth: "1.5",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))));
}
Object.assign(window, {
  Globe: Globe,
  STATUS_COLOR: STATUS_COLOR
});

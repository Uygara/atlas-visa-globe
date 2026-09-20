// Globe component — D3 orthographic / natural-earth projection rendered to SVG.
// Owns: topology load, projection, rotation animation, hover state, fills.
// Imperatively updates path "d" attrs on rotation to keep React out of the hot loop.

const { useEffect, useRef, useState, useMemo, useCallback } = React;

const STATUS_COLOR = {
  idc:  { fill: "var(--idc)",  label: "ID card / free movement", short: "ID card" },
  vf:   { fill: "var(--vf)",   label: "Visa-free",        short: "Visa-free" },
  eta:  { fill: "var(--eta)",  label: "Travel authorization", short: "ETA" },
  ev:   { fill: "var(--ev)",   label: "eVisa",            short: "eVisa" },
  voa:  { fill: "var(--voa)",  label: "Visa on arrival",  short: "VoA" },
  vr:   { fill: "var(--vr)",   label: "Visa required",    short: "Visa req." },
  ban:  { fill: "var(--ban)",  label: "No entry allowed", short: "No entry" },
  self: { fill: "var(--self)", label: "Your passport",    short: "Home" },
  na:   { fill: "var(--na)",   label: "No data",          short: "—" },
};

// Localised status label. Falls through to STATUS_COLOR.label if i18n missing.
function statusLabel(s) {
  if (window.t) {
    const k = "status." + s;
    return window.t(k) !== k ? window.t(k) : (STATUS_COLOR[s]?.label || s);
  }
  return STATUS_COLOR[s]?.label || s;
}

// Pattern / resolver colours. These used to be hard-coded hex because pattern
// tiles were painted through attributes; they're set through `style` now, so
// the design tokens (and therefore light/dark) apply inside patterns too.
// Statuses drawn with a texture as well as a colour (patterns in <defs> below).
const TEXTURED = { eta: "url(#tex-eta)", ev: "url(#tex-ev)", vr: "url(#tex-vr)" };

const STATUS_HEX = {
  idc: "var(--idc)",
  vf: "var(--vf)",
  eta: "var(--eta)",
  ev: "var(--ev)",
  voa: "var(--voa)",
  vr: "var(--vr)",
  ban: "var(--ban)",
  self: "var(--self)",
  na: "var(--na)",
};

function Globe({
  passport,        // iso2 string, or null
  comparePassport, // iso2 string, or null (compare mode)
  groupPassports,  // string[] — when set + non-empty, group mode is active
  filter,          // "all" | "vf" | "ev" | "voa" | "vr"
  mode,            // "globe3d" | "globe2d" | "flat"
  direction,       // "outgoing" (default) | "incoming"
  variant,         // "ordinary" | "diplomatik" | "hususi" | "hizmet" | ...
  residencePermits,// string[] — held permit blocs (consumed via window global by resolveStatus; kept as a prop so this component re-renders when they change)
  onCountryClick,
  onCountryHover,
  focusedCountry,  // iso2 string or null — highlights / centers
  // ── Optional decoupling hooks (used by the standalone Transit Map page) ──
  // When `fillResolver` is supplied, the globe ignores visa-status colouring
  // entirely and paints each country with the colour the resolver returns:
  //   fillResolver(iso2) => { color: <css colour>, ...extra }
  // When `hoverRenderer` is supplied, it replaces the built-in visa HoverCard:
  //   hoverRenderer({ iso2, x, y }) => ReactNode
  // The home page passes neither, so its behaviour is unchanged.
  fillResolver,
  hoverRenderer,
  // ── Sub-national overlay (used by the Safety Map) ───────────────────────
  // regionFeatures: GeoJSON features of one country's provinces/states, drawn
  // over the country layer; regionFill(feature) returns each one's colour.
  regionFeatures,
  regionFill,
  // ── Route overlay (used by the Itinerary globe) ──────────────────────────
  // arcs: [{ from: iso2, to: iso2 }] — great-circle routes drawn over the map.
  // stopMarkers: [{ iso2, label }] — numbered dots at each stop centroid.
  // Both rotate/cull with the globe. Home page passes neither.
  arcs,
  stopMarkers,
}) {
  // Group mode wins over direction when active — the question is "where can
  // this group of people go", which is inherently outgoing.
  const groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  // Helper: in outgoing mode each country is coloured by (myPassport → that country).
  // In incoming mode it's coloured by (that country → myPassport) — i.e. "would
  // they need a visa to come to me?"
  const resolveDirected = (iso2) =>
    direction === "incoming"
      ? window.resolveStatus(iso2, passport)
      : window.resolveStatus(passport, iso2);
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [topology, setTopology] = useState(null);
  const [size, setSize] = useState(() => ({
    w: Math.max(1, window.innerWidth - 360),
    h: window.innerHeight,
  }));
  const [hover, setHover] = useState(null); // { iso2, x, y }
  // Force a re-render whenever the SPA language changes so country labels
  // pick up the new localized names from window.countryName().
  const [, forceLangTick] = useState(0);
  useEffect(() => {
    const onLang = () => forceLangTick(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);

  // Mutable state that lives outside React's render loop.
  const rotRef = useRef([20, -10, 0]);     // current rotation (globe modes)
  const panRef = useRef([0, 0]);           // pan offset in pixels (flat mode)
  const zoomRef = useRef(1);               // 1.0 = default; multiplier on baseScale
  const baseScaleRef = useRef(1);          // base scale computed from size
  const autoRef = useRef(false);           // auto-rotate flag (starts off, kicks in after idle)
  const lastInteractRef = useRef(performance.now());       // ms timestamp
  const velRef = useRef([0, 0]);           // drag momentum, degrees/second (lon, lat)
  const dragMovedRef = useRef(false);      // the last press travelled > CLICK_SLOP: its click is a drag, not a selection
  const restRef = useRef(false);           // a country is focused or hovered: hold still (no auto-rotate)
  const rafRef = useRef(null);
  const projRef = useRef(null);
  const pathRef = useRef(null);
  const [zoomDisplay, setZoomDisplay] = useState(1);  // for UI label
  useEffect(() => { restRef.current = !!focusedCountry || !!hover; }, [focusedCountry, hover]);

  // ─── Topology load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then(r => r.json())
      .then(world => {
        if (!alive) return;
        const features = topojson.feature(world, world.objects.countries);
        setTopology(features);
        // hide loading screen
        const loader = document.getElementById("loading");
        if (loader) loader.classList.add("hidden");
      })
      .catch(err => {
        console.error("Failed to load topology", err);
      });
    return () => { alive = false; };
  }, []);

  // ─── Size tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width), h = Math.floor(r.height);
      if (w > 0 && h > 0) {
        setSize(prev => (prev.w === w && prev.h === h) ? prev : { w, h });
      }
    };
    measure();
    // Schedule a few re-measures to catch late layout
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 200);
    const t3 = setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    // ResizeObserver as belt-and-suspenders (may not fire in all iframes)
    let ro;
    if (typeof ResizeObserver !== "undefined" && wrapRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(wrapRef.current);
    }
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  // ─── Projection (recomputed on size / mode) ────────────────────────────────
  const redrawPaths = useCallback(() => {
    if (!pathRef.current || !svgRef.current) return;
    const paths = svgRef.current.querySelectorAll("path.country, path.region");
    paths.forEach(p => {
      const d = pathRef.current(p.__feature);
      if (d) p.setAttribute("d", d);
      else p.setAttribute("d", "");
    });
    // Also reposition micro-state markers (countries too small to draw as polygons).
    // d3.geoOrthographic's raw projection function returns coordinates even for the
    // back hemisphere — clipAngle only kicks in inside d3.geoPath. So for raw point
    // projection we must check visibility manually using great-circle distance.
    if (projRef.current) {
      const isGlobe = mode !== "flat";
      const rot = projRef.current.rotate ? projRef.current.rotate() : [0, 0, 0];
      const center = [-rot[0], -rot[1]];
      const markers = svgRef.current.querySelectorAll("g[data-micro-iso]");
      markers.forEach(g => {
        const iso = g.getAttribute("data-micro-iso");
        const c = window.byIso2[iso];
        if (!c) return;
        // Back-hemisphere cull (globe modes only)
        if (isGlobe && d3.geoDistance([c.lon, c.lat], center) >= Math.PI / 2) {
          g.style.visibility = "hidden";
          g.style.pointerEvents = "none";
          return;
        }
        const proj = projRef.current([c.lon, c.lat]);
        if (proj && isFinite(proj[0]) && isFinite(proj[1])) {
          g.setAttribute("transform", `translate(${proj[0]},${proj[1]})`);
          g.style.visibility = "visible";
          g.style.pointerEvents = "auto";
        } else {
          g.style.visibility = "hidden";
          g.style.pointerEvents = "none";
        }
      });

      // Country name labels — flat AND globe modes.
      // - Fixed font size (no jarring big/small mix).
      // - Cull by minimum projected width so micro-states don't get labelled
      //   (the dot markers already cover them).
      // - Globe modes: back-hemisphere cull via great-circle distance.
      // - Greedy collision avoidance: sort by country area, place largest
      //   first, hide any whose approx label bbox overlaps a placed one.
      const labels = svgRef.current.querySelectorAll("text.country-label");
      const FONT = mode === "flat" ? 11 : 10;
      const MIN_WIDTH = mode === "flat" ? 36 : 28;
      const placed = []; // [{ x, y, w, h }]
      // First pass: compute candidates with their bbox area, sort biggest first.
      const candidates = [];
      labels.forEach(l => {
        if (!l.__feature) { l.style.display = "none"; return; }
        try {
          const b = pathRef.current.bounds(l.__feature);
          const bw = b[1][0] - b[0][0];
          const bh = b[1][1] - b[0][1];
          if (!isFinite(bw) || bw < MIN_WIDTH) { l.style.display = "none"; return; }
          if (isGlobe) {
            const f = l.__feature;
            // Pull a representative coordinate — use d3.geoCentroid on the geo
            // feature (lat/lon), then test great-circle distance from the
            // visible-hemisphere centre.
            const geoCenter = d3.geoCentroid(f);
            if (geoCenter && d3.geoDistance(geoCenter, center) >= Math.PI / 2.2) {
              l.style.display = "none"; return;
            }
          }
          const c = pathRef.current.centroid(l.__feature);
          if (!c || !isFinite(c[0])) { l.style.display = "none"; return; }
          candidates.push({ el: l, x: c[0], y: c[1], area: bw * bh, bw });
        } catch (e) { l.style.display = "none"; }
      });
      candidates.sort((a, b) => b.area - a.area);
      candidates.forEach(({ el, x, y }) => {
        const txt = el.textContent || "";
        const w = Math.max(20, txt.length * FONT * 0.55);
        const h = FONT * 1.1;
        const rect = { x: x - w / 2, y: y - h / 2, w, h };
        const collides = placed.some(p =>
          rect.x < p.x + p.w && rect.x + rect.w > p.x &&
          rect.y < p.y + p.h && rect.y + rect.h > p.y);
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

      // ── Route arcs (great-circle LineStrings) ──────────────────────────
      // d3.geoPath adaptively resamples a 2-point LineString into a geodesic
      // arc and clips the back hemisphere for us under geoOrthographic.
      const arcPaths = svgRef.current.querySelectorAll("path.route-arc");
      arcPaths.forEach(p => {
        const a = p.__arcCoords;
        if (!a) { p.setAttribute("d", ""); return; }
        const d = pathRef.current({ type: "LineString", coordinates: [a.from, a.to] });
        p.setAttribute("d", d || "");
      });

      // ── Stop markers (numbered dots) ───────────────────────────────────
      const stopG = svgRef.current.querySelectorAll("g[data-stop-iso]");
      stopG.forEach(g => {
        const iso = g.getAttribute("data-stop-iso");
        const c = window.byIso2[iso];
        if (!c) { g.style.visibility = "hidden"; return; }
        if (isGlobe && d3.geoDistance([c.lon, c.lat], center) >= Math.PI / 2) {
          g.style.visibility = "hidden";
          return;
        }
        const proj = projRef.current([c.lon, c.lat]);
        if (proj && isFinite(proj[0]) && isFinite(proj[1])) {
          g.setAttribute("transform", `translate(${proj[0]},${proj[1]})`);
          g.style.visibility = "visible";
        } else {
          g.style.visibility = "hidden";
        }
      });
    }
  }, [mode]);

  const projection = useMemo(() => {
    const w = size.w, h = size.h;
    let proj, base;
    if (mode === "flat") {
      base = Math.min(w / 5.5, h / 3);
      // Use d3.geoEquirectangular for the flat view — it's a true cylindrical
      // projection so rotation in longitude wraps the world infinitely. Pseudo-
      // cylindrical NaturalEarth1 also wraps, but its meridians curve, which
      // makes the seam visible at the antimeridian. Equirectangular keeps the
      // wrap seamless and reads cleanly as a "flat" world map.
      proj = d3.geoEquirectangular()
        .scale(base * zoomRef.current)
        .translate([w / 2, h / 2 + panRef.current[1]])
        .rotate([rotRef.current[0], 0, 0]);
    } else {
      base = Math.min(w, h) * 0.42;
      proj = d3.geoOrthographic()
        .scale(base * zoomRef.current)
        .translate([w / 2, h / 2])
        .clipAngle(90)
        .rotate(rotRef.current);
    }
    baseScaleRef.current = base;
    projRef.current = proj;
    pathRef.current = d3.geoPath(proj);
    return proj;
  }, [size.w, size.h, mode]);

  // Apply zoom changes without recomputing projection from scratch.
  // resetPan=true is opt-in (used by the explicit Reset button) so that
  // wheel-zooming back to 1× doesn't suddenly snap the user's pan to centre.
  const applyZoom = useCallback((newZoom, animate = false, resetPan = false) => {
    newZoom = Math.max(1, Math.min(8, newZoom));
    if (resetPan) {
      panRef.current = [0, 0];
      // Also recentre longitude for flat mode (we pan via rotation there).
      if (mode === "flat") rotRef.current = [0, 0, 0];
    }
    const applyScaleAndTranslate = () => {
      if (!projRef.current) return;
      projRef.current.scale(baseScaleRef.current * zoomRef.current);
      // Re-apply translation (preserves Y-pan offset for flat mode; X comes
      // from rotation, not translate, so the world wraps horizontally).
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
    const start = zoomRef.current;
    const t0 = performance.now();
    const dur = 600;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
      zoomRef.current = start + (newZoom - start) * e;
      applyScaleAndTranslate();
      setZoomDisplay(zoomRef.current);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [mode, size.w, size.h]);

  // ─── Center on focused country ─────────────────────────────────────────────
  useEffect(() => {
    if (!focusedCountry) return;
    const c = window.byIso2[focusedCountry];
    if (!c) return;

    // Zoom to a sensible level for showing detail of a country
    applyZoom(2.2, true);

    if (mode === "flat") return;

    // Animate rotation to face this country
    const target = [-c.lon, -c.lat, 0];
    const start = [...rotRef.current];
    const t0 = performance.now();
    const dur = 800;
    autoRef.current = false;
    velRef.current = [0, 0];
    lastInteractRef.current = performance.now();
    const tween = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      // ease-in-out
      const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
      rotRef.current = [
        start[0] + (target[0] - start[0]) * e,
        start[1] + (target[1] - start[1]) * e,
        0,
      ];
      if (projRef.current && projRef.current.rotate) {
        projRef.current.rotate(rotRef.current);
        redrawPaths();
      }
      if (t < 1) requestAnimationFrame(tween);
    };
    requestAnimationFrame(tween);
  }, [focusedCountry, mode, applyZoom]);

  // ─── Drag + auto-rotate ────────────────────────────────────────────────────
  useEffect(() => {
    if (!topology) return;

    const svg = svgRef.current;

    // Wheel zoom — flat mode zooms toward the cursor (Google-Maps style);
    // globe modes zoom from centre because rotation-based panning makes
    // "zoom toward cursor" feel unnatural on a sphere.
    const onWheel = (e) => {
      e.preventDefault();
      lastInteractRef.current = performance.now();
      autoRef.current = false;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newZoom = Math.max(1, Math.min(8, zoomRef.current * factor));
      if (mode === "flat" && projRef.current && projRef.current.invert) {
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldPt = projRef.current.invert([mx, my]);
        zoomRef.current = newZoom;
        projRef.current.scale(baseScaleRef.current * newZoom);
        if (worldPt && isFinite(worldPt[0])) {
          const newPx = projRef.current(worldPt);
          if (newPx && isFinite(newPx[0])) {
            const dx = mx - newPx[0];
            const dy = my - newPx[1];
            const degPerPx = 180 / (Math.PI * projRef.current.scale());
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
    svg.addEventListener("wheel", onWheel, { passive: false });

    let dragging = false;
    let startRot = null;
    let startPan = null;
    let startPt = null;
    const sensitivity = 0.35;

    // Feel. Releasing a drag keeps the globe turning (friction); after a short
    // stillness it starts a slow spin that eases in; a press that travelled more
    // than a few px is a drag, never a selection. Everything is time-based with a
    // capped step, so it looks the same at 60 and 120 Hz and does not jump when a
    // background tab wakes up. Reduced-motion users get none of the motion.
    const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const IDLE_MS = 2500;      // still for this long -> start turning
    const SPIN_DPS = 4;        // cruising speed, degrees per second
    const FRICTION = 3.2;      // momentum decay rate, 1/second
    const CLICK_SLOP = 6;      // px of travel that turns a press into a drag
    let spin = 0;              // eased auto-rotate speed, degrees per second
    let trail = [];            // recent { t, lon, lat } while dragging (for the release velocity)
    let lastFrame = performance.now();
    let frameNo = 0;

    const onDown = (e) => {
      dragging = true;
      autoRef.current = false;
      spin = 0;
      velRef.current = [0, 0];
      dragMovedRef.current = false;
      lastInteractRef.current = performance.now();
      startRot = [...rotRef.current];
      startPan = [...panRef.current];
      startPt = [e.clientX, e.clientY];
      trail = [{ t: performance.now(), lon: rotRef.current[0], lat: rotRef.current[1] }];
      svg.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startPt[0];
      const dy = e.clientY - startPt[1];
      if (Math.hypot(dx, dy) > CLICK_SLOP) dragMovedRef.current = true;
      if (mode === "flat") {
        // Horizontal pan → longitude rotation so the world wraps. Vertical pan
        // stays as a translate (limited by clamping later if needed).
        // Pixels-per-degree at the equator: scale * π / 180.
        const scale = projRef.current ? projRef.current.scale() : baseScaleRef.current;
        const degPerPx = 180 / (Math.PI * scale);
        let lambda = (startRot[0] + dx * degPerPx) % 360;
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
        const s = sensitivity / Math.max(1, zoomRef.current * 0.85);
        rotRef.current = [
          startRot[0] + dx * s,
          Math.max(-90, Math.min(90, startRot[1] - dy * s)),
          0,
        ];
        if (projRef.current && projRef.current.rotate) {
          projRef.current.rotate(rotRef.current);
          redrawPaths();
        }
      }
      const now = performance.now();
      trail.push({ t: now, lon: rotRef.current[0], lat: rotRef.current[1] });
      while (trail.length > 2 && now - trail[0].t > 120) trail.shift();
    };
    const onUp = () => {
      if (dragging && dragMovedRef.current && !reduceMotion && trail.length >= 2) {
        const a = trail[0], b = trail[trail.length - 1];
        const secs = (b.t - a.t) / 1000;
        // Only a globe that was still moving when let go keeps moving.
        if (secs > 0.01 && performance.now() - b.t < 80) {
          let dLon = b.lon - a.lon;
          if (dLon > 180) dLon -= 360; else if (dLon < -180) dLon += 360;
          const cap = (v) => Math.max(-360, Math.min(360, v));
          velRef.current = [cap(dLon / secs), mode === "flat" ? 0 : cap((b.lat - a.lat) / secs)];
        }
      }
      trail = [];
      dragging = false;
      svg.style.cursor = "grab";
      lastInteractRef.current = performance.now();
    };
    // A moving pointer is not an idle one.
    const onHoverMove = () => { lastInteractRef.current = performance.now(); };

    svg.addEventListener("mousedown", onDown);
    svg.addEventListener("mousemove", onHoverMove);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    // Touch: single-finger drag (pan/rotate) + two-finger pinch (zoom)
    let pinching = false;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    const dist = (t) => Math.hypot(
      t[0].clientX - t[1].clientX,
      t[0].clientY - t[1].clientY,
    );
    const onTouchStart = (e) => {
      lastInteractRef.current = performance.now();
      autoRef.current = false;
      if (e.touches.length === 2) {
        pinching = true;
        dragging = false;
        pinchStartDist = dist(e.touches);
        pinchStartZoom = zoomRef.current;
      } else if (e.touches.length === 1) {
        pinching = false;
        onDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
      }
    };
    const onTouchMove = (e) => {
      if (pinching && e.touches.length >= 2) {
        e.preventDefault();
        const d = dist(e.touches);
        if (pinchStartDist > 0) {
          const factor = d / pinchStartDist;
          applyZoom(pinchStartZoom * factor, false);
        }
        return;
      }
      if (dragging && e.touches.length === 1) {
        e.preventDefault();
        onMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        pinching = false;
        onUp();
      } else if (e.touches.length === 1 && pinching) {
        // Transition from pinch → single-finger drag
        pinching = false;
        onDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
      }
    };
    svg.addEventListener("touchstart", onTouchStart, { passive: true });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    svg.addEventListener("touchcancel", onTouchEnd);
    svg.style.cursor = "grab";
    // Prevent browser default pinch-zoom on the globe area
    svg.style.touchAction = "none";

    // Momentum after a drag (every mode) + the idle spin (globes only: turning
    // a flat map makes no sense).
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      frameNo++;
      let lon = rotRef.current[0], lat = rotRef.current[1];
      let moved = false, glide = false;
      if (!dragging) {
        const v = velRef.current;
        if (Math.abs(v[0]) > 1.5 || Math.abs(v[1]) > 1.5) {
          const k = Math.exp(-FRICTION * dt);
          velRef.current = [v[0] * k, v[1] * k];
          lon += v[0] * dt;
          lat = Math.max(-90, Math.min(90, lat + v[1] * dt));
          if (lat === 90 || lat === -90) velRef.current[1] = 0;
          moved = glide = true;
        } else if (v[0] || v[1]) {
          velRef.current = [0, 0];
        }
        const idle = now - lastInteractRef.current > IDLE_MS;
        const want = mode !== "flat" && !reduceMotion && idle && !restRef.current && !document.hidden ? SPIN_DPS : 0;
        // Ease in slowly, stop quickly.
        spin += (want - spin) * (1 - Math.exp(-dt / (want > spin ? 1.2 : 0.25)));
        if (want === 0 && spin < 0.02) spin = 0;
        if (spin > 0) { lon += spin * dt; moved = true; }
        autoRef.current = spin > 0;
      }
      if (moved) {
        if (lon > 180) lon -= 360; else if (lon < -180) lon += 360;
        rotRef.current = [lon, mode === "flat" ? 0 : lat, 0];
        if (projRef.current && projRef.current.rotate) {
          projRef.current.rotate(rotRef.current);
          // A slow spin needs no more than 30 fps; a glide follows the finger's speed.
          if (glide || frameNo % 2 === 0) redrawPaths();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("mousedown", onDown);
      svg.removeEventListener("mousemove", onHoverMove);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("touchcancel", onTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, [topology, mode, redrawPaths, applyZoom, size.w, size.h]);

  // Reset zoom + pan when mode changes so the new projection starts fresh.
  useEffect(() => {
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

  // Initial paint after topology load
  useEffect(() => {
    if (topology) redrawPaths();
  }, [topology, projection, redrawPaths]);

  // Repaint route overlay geometry when the itinerary changes (new path /
  // marker elements need their d / transform set imperatively).
  useEffect(() => {
    if (topology) redrawPaths();
  }, [arcs, stopMarkers, topology, redrawPaths]);

  // Provinces of the focused country: redraw as soon as they arrive.
  useEffect(() => {
    if (topology) redrawPaths();
  }, [regionFeatures, topology, redrawPaths]);

  // ─── Fill resolution ───────────────────────────────────────────────────────
  // resolveOne picks the right resolver for the active mode. Group mode
  // overrides direction. Self-highlight (blue) still works because the
  // primary passport's own country comes back as "self" from resolveStatus
  // before we ever ask the group resolver — group mode skips that special
  // case by stripping the home-country bias.
  const resolveOne = useCallback((iso2) => {
    if (groupActive) {
      // Members' own countries should still render as "self" (blue) so the
      // user can pick them out on the map.
      if (groupPassports.includes(iso2)) return { status: "self", days: null };
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

  const fillFor = useCallback((iso2) => {
    if (fillResolver) {
      const res = fillResolver(iso2);
      return (res && res.color) || "var(--land)";
    }
    if (!passport && !groupActive) return STATUS_COLOR.na.fill;
    const r = resolveOne(iso2);
    if (filter !== "all" && r.status !== filter && r.status !== "self") {
      return "var(--land)"; // dim out
    }
    // Compare mode: when the two passports' statuses differ, paint the country
    // with a diagonal 45° stripe pattern carrying both colours. This is much
    // easier to read at a glance than the old "border colour changes" trick.
    if (comparePassport && !groupActive && r.status !== "self" && iso2 !== comparePassport) {
      const rc = direction === "incoming"
        ? window.resolveStatus(iso2, comparePassport)
        : window.resolveStatus(comparePassport, iso2);
      if (rc.status && rc.status !== r.status && STATUS_HEX[r.status] && STATUS_HEX[rc.status]) {
        return `url(#stripe-${r.status}-${rc.status})`;
      }
    }
    // Permit-unlocked destination → hatched fill (status colour + blue
    // hatching) so it reads differently from natural passport access.
    if (r.upgradedBy && STATUS_HEX[r.status]) {
      return `url(#permit-${r.status})`;
    }
    if (r.status === "ban") return "url(#hatch-ban)";
    if (TEXTURED[r.status]) return TEXTURED[r.status];
    return STATUS_COLOR[r.status]?.fill || STATUS_COLOR.na.fill;
  }, [passport, filter, resolveOne, groupActive, comparePassport, direction, fillResolver]);

  const opacityFor = useCallback((iso2) => {
    if (fillResolver) return 1;
    if (!passport && !groupActive) return 1;
    if (filter === "all") return 1;
    const r = resolveOne(iso2);
    if (r.status === filter || r.status === "self") return 1;
    return 0.25;
  }, [passport, filter, resolveOne, groupActive, fillResolver]);

  // Compare mode: highlight the compare passport's home country with a distinct
  // amber stroke (so it never collides with the primary passport's blue self-fill).
  const strokeFor = useCallback((iso2) => {
    if (!comparePassport) return "var(--land-stroke)";
    if (iso2 === comparePassport) return "var(--compare-self)";
    const r = window.resolveStatus(comparePassport, iso2);
    return STATUS_COLOR[r.status]?.fill || "var(--land-stroke)";
  }, [comparePassport]);

  // ─── Hover ─────────────────────────────────────────────────────────────────
  const handleEnter = (e, feature) => {
    const iso2 = featureToIso2(feature);
    if (!iso2) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setHover({ iso2, x: e.clientX - rect.left, y: e.clientY - rect.top });
    onCountryHover?.(iso2);
  };
  const handleMove = (e) => {
    if (!hover) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setHover(h => h && { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleLeave = () => {
    setHover(null);
    onCountryHover?.(null);
  };
  const handleClick = (feature) => {
    // A drag that happens to end on a country is not a selection.
    if (dragMovedRef.current) { dragMovedRef.current = false; return; }
    const iso2 = featureToIso2(feature);
    if (iso2) onCountryClick?.(iso2);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const features = topology?.features || [];
  const cx = size.w / 2;
  const cy = size.h / 2;
  const r = Math.min(size.w, size.h) * 0.42;
  const showGlobe = mode !== "flat";
  const showGlow = mode === "globe3d";

  return (
    <div ref={wrapRef} className="globe-wrap" style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        style={{ display: "block", userSelect: "none" }}
        onMouseMove={handleMove}
      >
        <defs>
          {/* Limb shading: a faint darkening toward the edge of the sphere so
              the 3D globe reads as round without any glow or gradient ocean. */}
          <radialGradient id="limb" cx="50%" cy="50%" r="50%">
            <stop offset="62%" style={{ stopColor: "var(--ink)", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "var(--ink)", stopOpacity: 0.16 }} />
          </radialGradient>
          {/* Textures make the status readable without colour (colour-blind
              readers, greyscale prints): travel authorisation = fine 45° lines,
              eVisa = dot grid, visa required = fine 135° hatching. Visa-free,
              ID card and visa on arrival stay solid. */}
          <pattern id="tex-eta" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" style={{ fill: "var(--eta)" }} />
            <rect width="1.1" height="5" style={{ fill: "var(--paper-raised)", fillOpacity: 0.7 }} />
          </pattern>
          <pattern id="tex-ev" width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" style={{ fill: "var(--ev)" }} />
            <circle cx="2.5" cy="2.5" r="1.05" style={{ fill: "var(--ink)", fillOpacity: 0.42 }} />
          </pattern>
          <pattern id="tex-vr" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="4.5" height="4.5" style={{ fill: "var(--vr)" }} />
            <rect width="0.9" height="4.5" style={{ fill: "var(--paper-raised)", fillOpacity: 0.45 }} />
          </pattern>

          {/* "No entry allowed": hatched like a restricted zone on a chart. */}
          <pattern id="hatch-ban" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: "var(--ban)" }} />
            <rect width="1.4" height="6" style={{ fill: "var(--paper-raised)", fillOpacity: 0.38 }} />
          </pattern>

          {/* Diagonal-stripe patterns for compare mode. Twelve combinations:
              every ordered (primary, compare) pair where the two statuses
              differ. Stripe alternates between the two colours at 45°. */}
          {["idc", "vf", "eta", "ev", "voa", "vr", "ban"].flatMap(a =>
            ["idc", "vf", "eta", "ev", "voa", "vr", "ban"].filter(b => b !== a).map(b => (
              <pattern key={`${a}-${b}`} id={`stripe-${a}-${b}`}
                       width="8" height="8" patternUnits="userSpaceOnUse"
                       patternTransform="rotate(45)">
                <rect width="8" height="8" style={{ fill: STATUS_HEX[a] }} />
                <rect x="4" width="4" height="8" style={{ fill: STATUS_HEX[b] }} />
              </pattern>
            ))
          )}

          {/* Permit-hatch patterns: a destination unlocked by a residence
              permit (r.upgradedBy set) paints in its status colour with thin
              brand-blue diagonal hatching — so the user can tell "mine by
              passport" from "mine via my permit" at a glance. One pattern per
              status an upgrade can produce. */}
          {["vf", "eta", "ev", "voa"].map(s => (
            <pattern key={`permit-${s}`} id={`permit-${s}`}
                     width="7" height="7" patternUnits="userSpaceOnUse"
                     patternTransform="rotate(45)">
              <rect width="7" height="7" style={{ fill: STATUS_HEX[s] }} />
              <rect x="5" width="2" height="7" style={{ fill: STATUS_HEX.self }} />
            </pattern>
          ))}
        </defs>

        {/* Sphere (ocean). Radius tracks the zoom — without scaling, zoom > 1
            drew country polygons outside the sphere. */}
        {showGlobe && (
          <circle cx={cx} cy={cy} r={r * zoomDisplay} style={{ fill: "var(--ocean)" }} />
        )}

        {/* Graticule (lat/lon grid lines) */}
        {showGlobe && topology && (
          <path
            d={pathRef.current(d3.geoGraticule10()) || ""}
            fill="none"
            stroke="var(--graticule)"
            strokeWidth="0.6"
          />
        )}

        {/* Countries */}
        <g>
          {features.map((f, idx) => {
            const iso2 = featureToIso2(f);
            const fill = iso2 ? fillFor(iso2) : "var(--land)";
            const op = iso2 ? opacityFor(iso2) : 1;
            const isHover = hover?.iso2 === iso2;
            const isCompareSelf = comparePassport && iso2 === comparePassport;
            return (
              <path
                key={f.id || `f-${idx}`}
                ref={(el) => { if (el) el.__feature = f; }}
                className="country"
                d=""
                fill={fill}
                opacity={op}
                stroke={isHover ? "var(--ink)" : strokeFor(iso2)}
                strokeWidth={isHover ? 1.2 : (isCompareSelf ? 2.4 : (comparePassport ? 1.4 : 0.6))}
                onMouseEnter={(e) => handleEnter(e, f)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(f)}
              />
            );
          })}
        </g>

        {/* Provinces / states of one country, above the country layer. */}
        {regionFeatures && regionFeatures.length > 0 && (
          <g style={{ pointerEvents: "none" }}>
            {regionFeatures.map((f, i) => (
              <path
                key={(f.properties && f.properties.id) || `r-${i}`}
                ref={(el) => { if (el) el.__feature = f; }}
                className="region"
                d=""
                fill={regionFill ? regionFill(f) : "none"}
                stroke="var(--paper-raised)"
                strokeWidth="0.5"
                strokeOpacity="0.7"
              />
            ))}
          </g>
        )}

        {/* Limb shading + sphere outline, above the countries, below labels. */}
        {showGlobe && (
          <g style={{ pointerEvents: "none" }}>
            {showGlow && <circle cx={cx} cy={cy} r={r * zoomDisplay} fill="url(#limb)" />}
            <circle cx={cx} cy={cy} r={r * zoomDisplay} fill="none" style={{ stroke: "var(--globe-edge)" }} strokeWidth="1" />
          </g>
        )}

        {/* Country name labels — Positions + visibility are set
            imperatively in redrawPaths to avoid React re-rendering 200 nodes
            on every pan/zoom tick. */}
        <g data-label-layer="1" style={{ pointerEvents: "none" }}>
          {features.map((f, idx) => {
            const iso2 = featureToIso2(f);
            if (!iso2) return null;
            return (
              <text
                key={"l-" + (f.id || iso2 || idx)}
                ref={(el) => { if (el) el.__feature = f; }}
                className="country-label"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
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
                  strokeLinejoin: "round",
                }}
              >
                {window.countryName(iso2)}
              </text>
            );
          })}
        </g>

        {/* Route arcs (itinerary globe) — geometry set imperatively in redraw */}
        {Array.isArray(arcs) && arcs.length > 0 && (
          <g data-arc-layer="1" style={{ pointerEvents: "none" }}>
            {arcs.map((a, i) => {
              const cf = window.byIso2[a.from], ct = window.byIso2[a.to];
              if (!cf || !ct) return null;
              return (
                <path
                  key={`arc-${i}`}
                  className="route-arc"
                  ref={(el) => { if (el) el.__arcCoords = { from: [cf.lon, cf.lat], to: [ct.lon, ct.lat] }; }}
                  d=""
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="1 6"
                  opacity="0.9"
                />
              );
            })}
          </g>
        )}

        {/* Stop markers (itinerary globe) — numbered dots, positioned in redraw */}
        {Array.isArray(stopMarkers) && stopMarkers.length > 0 && (
          <g data-stop-layer="1" style={{ pointerEvents: "none" }}>
            {stopMarkers.map((s, i) => (
              <g key={`stop-${s.iso2}-${i}`} data-stop-iso={s.iso2} style={{ visibility: "hidden" }}>
                <circle r="11" style={{ fill: "var(--accent)", stroke: "var(--paper-raised)" }} strokeWidth="2" />
                <text textAnchor="middle" dominantBaseline="central" y="0.5"
                  style={{ fill: "var(--on-accent)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500 }}>
                  {s.label != null ? s.label : (i + 1)}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Micro-state markers — countries too small to render as polygons */}
        {topology && (
          <MicroStateMarkers
            passport={passport}
            comparePassport={comparePassport}
            fillFor={fillFor}
            opacityFor={opacityFor}
            onClick={handleClick}
            onHover={handleEnter}
            onLeave={handleLeave}
            hover={hover}
            zoom={zoomDisplay}
          />
        )}
      </svg>

      {/* Zoom controls */}
      {topology && (
        <ZoomControls
          zoom={zoomDisplay}
          onZoomIn={() => applyZoom(zoomRef.current * 1.4, true)}
          onZoomOut={() => applyZoom(zoomRef.current / 1.4, true)}
          onReset={() => applyZoom(1, true, true)}
        />
      )}

      {/* Hover tooltip */}
      {hover && hoverRenderer && hoverRenderer(hover)}
      {hover && !hoverRenderer && (passport || groupActive) && (
        <HoverCard
          hover={hover}
          passport={passport}
          compare={comparePassport}
          direction={direction}
          variant={variant}
          groupPassports={groupActive ? groupPassports : null}
        />
      )}
    </div>
  );
}

// Fallback name → ISO2 map for topology features that have no numeric id
// (disputed/partially recognised territories that Natural Earth labels by name only).
const FEATURE_NAME_TO_ISO2 = {
  "Kosovo": "XK",
  "N. Cyprus": "XN",
  "Northern Cyprus": "XN",
  "Somaliland": "SO",      // de-facto Somalia visa policy
  "Siachen Glacier": null, // unmapped, will stay neutral
  "Indian Ocean Ter.": "AU",
};

function featureToIso2(feature) {
  if (!feature) return null;
  if (feature.id) {
    const c = window.byId[feature.id] || window.byId[String(parseInt(feature.id, 10))];
    if (c) return c.iso2;
  }
  const n = feature.properties && feature.properties.name;
  if (n && FEATURE_NAME_TO_ISO2[n] !== undefined) return FEATURE_NAME_TO_ISO2[n];
  return null;
}

// Back-compat shim used in a few legacy call sites
function idToIso2(id) {
  if (!id) return null;
  const c = window.byId[id] || window.byId[String(parseInt(id, 10))];
  return c?.iso2;
}

function HoverCard({ hover, passport, compare, direction, variant, groupPassports }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  const groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  // Variant only applies when not in group / not in incoming mode (same rule
  // as DetailCard in panel.jsx — keeps the colouring on the map consistent
  // with the tooltip text).
  const variantActive = !!variant && variant !== "ordinary"
                        && !groupActive && direction !== "incoming";
  const r = groupActive
    ? window.resolveGroupStatus(groupPassports, hover.iso2)
    : direction === "incoming"
        ? window.resolveStatus(hover.iso2, passport)
        : variantActive
            ? window.resolveVariantStatus(passport, hover.iso2, variant)
            : window.resolveStatus(passport, hover.iso2);
  // In group mode, instead of a single "compare" overlay we show each member's status.
  const groupBreakdown = groupActive
    ? groupPassports.map(p => ({
        passport: p,
        r: window.resolveStatus(p, hover.iso2),
      }))
    : null;
  const rc = !groupActive && compare
    ? (direction === "incoming"
        ? window.resolveStatus(hover.iso2, compare)
        : window.resolveStatus(compare, hover.iso2))
    : null;
  const ofs = 18;
  return (
    <div className="hovercard overlay-card" style={{ left: hover.x + ofs, top: hover.y + ofs }}>
      <div className="hovercard-title">
        <span className="flag">{dest.flag}</span>
        <span>{window.countryName(hover.iso2)}</span>
      </div>
      <div className="hovercard-row">
        {r.status === "ban" ? <Swatch s="ban" /> : <Dot s={r.status} />}
        <span>{statusLabel(r.status)}</span>
        {r.days && <span className="aside">{window.t("detail.up_to_days", { n: r.days })}</span>}
      </div>
      {rc && (
        <div className="hovercard-row hovercard-sep">
          <span className="hovercard-cap">{window.t("detail.vs")} <span className="flag">{window.byIso2[compare]?.flag}</span></span>
          <Dot s={rc.status} />
          <span>{statusLabel(rc.status)}</span>
          {rc.days && <span className="aside">{rc.days}d</span>}
        </div>
      )}
      {groupBreakdown && (
        <div className="hovercard-sep">
          <div className="hovercard-cap">{window.t("detail.per_member")}</div>
          {groupBreakdown.map(({ passport: p, r: rr }) => {
            const c = window.byIso2[p];
            return (
              <div key={p} className="hovercard-row" style={{ marginTop: 3, fontSize: 12.5 }}>
                <span className="flag">{c?.flag || ""}</span>
                <Dot s={rr.status} />
                <span>{statusLabel(rr.status)}</span>
                {rr.days && <span className="aside">{rr.days}d</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Ultra-small states that either don't appear in 50m topology, or are too tiny
// to click as polygons. We draw them as clickable circle markers on top.
// Listing them by ISO2 — the marker position comes from COUNTRIES lat/lon.
const MICRO_STATES = [
  "VA", // Vatican
  "MC", // Monaco
  "SM", // San Marino
  "LI", // Liechtenstein
  "AD", // Andorra
  "MT", // Malta
  "SG", // Singapore (tiny city-state)
  "BH", // Bahrain
  "MV", // Maldives
  "KN", // Saint Kitts and Nevis
  "AG", // Antigua and Barbuda
  "DM", // Dominica
  "GD", // Grenada
  "LC", // Saint Lucia
  "VC", // Saint Vincent and the Grenadines
  "BB", // Barbados
  "TT", // Trinidad and Tobago (small but borderline)
  "SC", // Seychelles
  "MU", // Mauritius
  "CV", // Cabo Verde
  "ST", // Sao Tome
  "KM", // Comoros
  "NR", // Nauru
  "TV", // Tuvalu
  "PW", // Palau
  "MH", // Marshall Islands
  "FM", // Micronesia
  "KI", // Kiribati
  "TO", // Tonga
  "WS", // Samoa
  "FJ", // Fiji
  "VU", // Vanuatu
  "BN", // Brunei
  "HK", // Hong Kong
  "MO", // Macao
  // Palestine — 110m polygon is small (Gaza only). Marker stays so West Bank is clickable.
  "PS",
  // Kosovo (XK) and Northern Cyprus (XN) are NOT shown as dots — they're selectable
  // from the passport dropdown instead. On the map their territory inherits the
  // colour of Serbia / Cyprus respectively (since 110m has no separate polygons).
];

function MicroStateMarkers({
  passport, comparePassport, fillFor, opacityFor,
  onClick, onHover, onLeave, hover, zoom,
}) {
  // Positions are set imperatively in redrawPaths so they track globe rotation
  // without forcing a React re-render every frame.
  const baseR = 3.5;
  const r = Math.max(3, baseR + zoom * 0.6);
  return (
    <g data-micro-layer="1">
      {MICRO_STATES.map(iso2 => {
        const c = window.byIso2[iso2];
        if (!c) return null;
        const fill = passport ? fillFor(iso2) : "var(--land)";
        const op = passport ? opacityFor(iso2) : 0.7;
        const isHover = hover?.iso2 === iso2;
        const isPrimary = iso2 === passport;
        const isCompare = iso2 === comparePassport;
        const showRing = isPrimary || isCompare || isHover;
        const ringColor = isPrimary ? "var(--self)" : isCompare ? "var(--compare-self)" : "var(--ink)";
        return (
          <g
            key={`marker-${iso2}`}
            data-micro-iso={iso2}
            style={{ cursor: "pointer", visibility: "hidden" }}
            onMouseEnter={(e) => onHover(e, { id: c.id, __micro: true })}
            onMouseLeave={onLeave}
            onClick={() => onClick({ id: c.id, __micro: true })}
          >
            <circle r={r + 1.8} style={{ fill: "var(--paper-raised)" }} opacity={op} />
            <circle
              r={r}
              fill={fill}
              opacity={op}
              stroke={showRing ? ringColor : "var(--rule-strong)"}
              strokeWidth={showRing ? 2 : 0.8}
            />
          </g>
        );
      })}
    </g>
  );
}

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="zoom overlay-card">
      <button type="button" onClick={onZoomIn} title={window.t("zoom.in")} aria-label={window.t("zoom.in")}>
        <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2 V12 M2 7 H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      <button type="button" onClick={onZoomOut} title={window.t("zoom.out")} aria-label={window.t("zoom.out")}>
        <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7 H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      <output title={window.t("zoom.current")}>{zoom.toFixed(1)}×</output>
      <button type="button" onClick={onReset} title={window.t("zoom.reset")} aria-label={window.t("zoom.reset")} disabled={zoom === 1}>
        <svg viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 7 a4 4 0 1 0 1.2 -2.8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M3 2 V5 H6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

Object.assign(window, { Globe, STATUS_COLOR });

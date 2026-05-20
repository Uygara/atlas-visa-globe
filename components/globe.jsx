// Globe component — D3 orthographic / natural-earth projection rendered to SVG.
// Owns: topology load, projection, rotation animation, hover state, fills.
// Imperatively updates path "d" attrs on rotation to keep React out of the hot loop.

const { useEffect, useRef, useState, useMemo, useCallback } = React;

const STATUS_COLOR = {
  vf:   { fill: "var(--vf)",   label: "Visa-free",        short: "Visa-free" },
  ev:   { fill: "var(--ev)",   label: "eVisa",            short: "eVisa" },
  voa:  { fill: "var(--voa)",  label: "Visa on arrival",  short: "VoA" },
  vr:   { fill: "var(--vr)",   label: "Visa required",    short: "Visa req." },
  self: { fill: "var(--self)", label: "Your passport",    short: "Home" },
  na:   { fill: "var(--na)",   label: "No data",          short: "—" },
};

function Globe({
  passport,        // iso2 string, or null
  comparePassport, // iso2 string, or null (compare mode)
  filter,          // "all" | "vf" | "ev" | "voa" | "vr"
  mode,            // "globe3d" | "globe2d" | "flat"
  onCountryClick,
  onCountryHover,
  focusedCountry,  // iso2 string or null — highlights / centers
}) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [topology, setTopology] = useState(null);
  const [size, setSize] = useState(() => ({
    w: window.innerWidth - 340,
    h: window.innerHeight,
  }));
  const [hover, setHover] = useState(null); // { iso2, x, y }

  // Mutable state that lives outside React's render loop.
  const rotRef = useRef([20, -10, 0]);     // current rotation
  const zoomRef = useRef(1);               // 1.0 = default; multiplier on baseScale
  const baseScaleRef = useRef(1);          // base scale computed from size
  const autoRef = useRef(false);           // auto-rotate flag (starts off, kicks in after idle)
  const lastInteractRef = useRef(performance.now());       // ms timestamp
  const rafRef = useRef(null);
  const projRef = useRef(null);
  const pathRef = useRef(null);
  const [zoomDisplay, setZoomDisplay] = useState(1);  // for UI label

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
    const paths = svgRef.current.querySelectorAll("path.country");
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
    }
  }, [mode]);

  const projection = useMemo(() => {
    const w = size.w, h = size.h;
    let proj, base;
    if (mode === "flat") {
      base = Math.min(w / 5.5, h / 3);
      proj = d3.geoNaturalEarth1()
        .scale(base * zoomRef.current)
        .translate([w / 2, h / 2]);
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

  // Apply zoom changes without recomputing projection from scratch
  const applyZoom = useCallback((newZoom, animate = false) => {
    newZoom = Math.max(1, Math.min(8, newZoom));
    if (!animate) {
      zoomRef.current = newZoom;
      if (projRef.current) {
        projRef.current.scale(baseScaleRef.current * newZoom);
        redrawPaths();
      }
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
      if (projRef.current) {
        projRef.current.scale(baseScaleRef.current * zoomRef.current);
        redrawPaths();
      }
      setZoomDisplay(zoomRef.current);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

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

    // Wheel zoom — works in all modes
    const onWheel = (e) => {
      e.preventDefault();
      lastInteractRef.current = performance.now();
      autoRef.current = false;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      applyZoom(zoomRef.current * factor, false);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });

    if (mode === "flat") {
      return () => svg.removeEventListener("wheel", onWheel);
    }

    let dragging = false;
    let startRot = null;
    let startPt = null;
    const sensitivity = 0.35;

    const onDown = (e) => {
      dragging = true;
      autoRef.current = false;
      lastInteractRef.current = performance.now();
      startRot = [...rotRef.current];
      startPt = [e.clientX, e.clientY];
      svg.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startPt[0];
      const dy = e.clientY - startPt[1];
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
    };
    const onUp = () => {
      dragging = false;
      svg.style.cursor = "grab";
      lastInteractRef.current = performance.now();
    };

    svg.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    // touch
    const onTouchStart = (e) => onDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    const onTouchMove = (e) => { if (dragging) { e.preventDefault(); onMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }); } };
    svg.addEventListener("touchstart", onTouchStart, { passive: true });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onUp);
    svg.style.cursor = "grab";

    // Auto-rotate loop — kicks in after 60 seconds of no interaction, gentle pace
    const tick = () => {
      const now = performance.now();
      const idleFor = now - lastInteractRef.current;
      if (autoRef.current || idleFor > 60000) {
        autoRef.current = true;
        rotRef.current[0] += 0.035;
        if (rotRef.current[0] > 180) rotRef.current[0] -= 360;
        if (projRef.current && projRef.current.rotate) {
          projRef.current.rotate(rotRef.current);
          redrawPaths();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [topology, mode, redrawPaths]);

  // Reset zoom when mode changes so the new projection starts fresh.
  useEffect(() => {
    zoomRef.current = 1;
    setZoomDisplay(1);
    if (projRef.current) {
      projRef.current.scale(baseScaleRef.current);
      redrawPaths();
    }
  }, [mode, redrawPaths]);

  // Initial paint after topology load
  useEffect(() => {
    if (topology) redrawPaths();
  }, [topology, projection, redrawPaths]);

  // ─── Fill resolution ───────────────────────────────────────────────────────
  const fillFor = useCallback((iso2) => {
    if (!passport) return STATUS_COLOR.na.fill;
    const r = window.resolveStatus(passport, iso2);
    if (filter !== "all" && r.status !== filter && r.status !== "self") {
      return "var(--land)"; // dim out
    }
    return STATUS_COLOR[r.status]?.fill || STATUS_COLOR.na.fill;
  }, [passport, filter]);

  const opacityFor = useCallback((iso2) => {
    if (!passport) return 1;
    if (filter === "all") return 1;
    const r = window.resolveStatus(passport, iso2);
    if (r.status === filter || r.status === "self") return 1;
    return 0.25;
  }, [passport, filter]);

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
    const iso2 = idToIso2(feature.id);
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
    const iso2 = idToIso2(feature.id);
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
    <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        style={{ display: "block", userSelect: "none" }}
        onMouseMove={handleMove}
      >
        <defs>
          {/* Outer glow ring */}
          <radialGradient id="atm" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="rgba(96,165,250,0)" />
            <stop offset="92%" stopColor="rgba(96,165,250,0.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
          {/* Subtle ocean / sphere */}
          <radialGradient id="sphere" cx="35%" cy="35%" r="75%">
            <stop offset="0%"  stopColor="#1a2540" />
            <stop offset="60%" stopColor="#0d1426" />
            <stop offset="100%" stopColor="#06091a" />
          </radialGradient>
          <filter id="countryGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="globeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Outer atmosphere */}
        {showGlow && (
          <circle cx={cx} cy={cy} r={r * 1.18} fill="url(#atm)" />
        )}

        {/* Sphere */}
        {showGlobe && (
          <circle cx={cx} cy={cy} r={r} fill="url(#sphere)" />
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
            const iso2 = idToIso2(f.id);
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
                stroke={isHover ? "#fff" : strokeFor(iso2)}
                strokeWidth={isHover ? 1.2 : (isCompareSelf ? 2.4 : (comparePassport ? 1.4 : 0.5))}
                onMouseEnter={(e) => handleEnter(e, f)}
                onMouseLeave={handleLeave}
                onClick={() => handleClick(f)}
              />
            );
          })}
        </g>

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
          onReset={() => applyZoom(1, true)}
        />
      )}

      {/* Hover tooltip */}
      {hover && passport && <HoverCard hover={hover} passport={passport} compare={comparePassport} />}
    </div>
  );
}

function idToIso2(id) {
  // world-atlas uses string numeric ids — try both raw and zero-padded
  if (!id) return null;
  const c = window.byId[id] || window.byId[String(parseInt(id,10))];
  return c?.iso2;
}

function HoverCard({ hover, passport, compare }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  const r = window.resolveStatus(passport, hover.iso2);
  const rc = compare ? window.resolveStatus(compare, hover.iso2) : null;
  const sc = STATUS_COLOR[r.status];
  const ofs = 18;
  return (
    <div
      style={{
        position: "absolute",
        left: hover.x + ofs,
        top: hover.y + ofs,
        transform: "translate(0, 0)",
        pointerEvents: "none",
        background: "var(--panel)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--panel-border-strong)",
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 200,
        zIndex: 50,
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        fontSize: 13,
        color: "var(--fg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{dest.flag}</span>
        <strong style={{ fontSize: 14, fontWeight: 600 }}>{dest.name}</strong>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", display: "inline-block",
          background: sc.fill, boxShadow: `0 0 8px ${sc.fill}`,
        }} />
        <span style={{ color: "var(--fg-dim)" }}>{sc.label}</span>
        {r.days && (
          <span style={{ marginLeft: "auto", color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
            {r.days} days
          </span>
        )}
      </div>
      {rc && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 6,
          paddingTop: 6, borderTop: "1px solid var(--panel-border)",
        }}>
          <span style={{ fontSize: 11, color: "var(--fg-mute)", marginRight: 4 }}>vs {window.byIso2[compare]?.flag}</span>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
            background: STATUS_COLOR[rc.status].fill, boxShadow: `0 0 8px ${STATUS_COLOR[rc.status].fill}`,
          }} />
          <span style={{ color: "var(--fg-dim)" }}>{STATUS_COLOR[rc.status].label}</span>
          {rc.days && <span style={{ marginLeft: "auto", color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{rc.days}d</span>}
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
        const ringColor = isPrimary ? "var(--self)" : isCompare ? "var(--compare-self)" : "rgba(255,255,255,0.7)";
        return (
          <g
            key={`marker-${iso2}`}
            data-micro-iso={iso2}
            style={{ cursor: "pointer", visibility: "hidden" }}
            onMouseEnter={(e) => onHover(e, { id: c.id, __micro: true })}
            onMouseLeave={onLeave}
            onClick={() => onClick({ id: c.id, __micro: true })}
          >
            <circle r={r + 2.5} fill="rgba(0,0,0,0.55)" opacity={op} />
            <circle
              r={r}
              fill={fill}
              opacity={op}
              stroke={ringColor}
              strokeWidth={showRing ? 2 : 0.8}
              style={{ filter: showRing ? `drop-shadow(0 0 6px ${ringColor})` : "none" }}
            />
          </g>
        );
      })}
    </g>
  );
}

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  const btnStyle = {
    width: 32, height: 32,
    background: "var(--panel)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid var(--panel-border-strong)",
    color: "var(--fg)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
    transition: "all 140ms ease",
  };
  return (
    <div style={{
      position: "absolute",
      right: 20,
      bottom: 20,
      display: "flex",
      flexDirection: "column",
      gap: 1,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      zIndex: 5,
    }} className="zoom-controls">
      <button
        onClick={onZoomIn}
        title="Zoom in"
        style={{ ...btnStyle, borderRadius: "8px 8px 0 0", borderBottom: "none" }}
        className="zoom-btn"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 2 V12 M2 7 H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        onClick={onZoomOut}
        title="Zoom out"
        style={{ ...btnStyle, borderRadius: 0, borderTop: "none", borderBottom: "none" }}
        className="zoom-btn"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 7 H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <div
        title="Current zoom"
        style={{
          ...btnStyle,
          borderRadius: 0,
          borderTop: "none",
          borderBottom: "none",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-mute)",
          cursor: "default",
          fontWeight: 500,
        }}
      >
        {zoom.toFixed(1)}×
      </div>
      <button
        onClick={onReset}
        title="Reset"
        style={{ ...btnStyle, borderRadius: "0 0 8px 8px", borderTop: "none" }}
        className="zoom-btn"
        disabled={zoom === 1}
      >
        <svg width="13" height="13" viewBox="0 0 14 14">
          <path d="M3 7 a4 4 0 1 0 1.2 -2.8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M3 2 V5 H6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

Object.assign(window, { Globe, STATUS_COLOR });

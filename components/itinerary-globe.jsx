// Itinerary globe — a route visualiser mounted on top of the existing
// /itinerary/ planner. It does NOT replace the planner (the vanilla JS below
// still owns stops, fees, dates, ICS, sharing); it just listens for changes
// and paints the trip on a 3D globe:
//   - passport country  → blue (self)
//   - each stop         → coloured by its visa status, numbered in travel order
//   - consecutive legs  → dashed great-circle arcs (passport → 1 → 2 → …)
//
// The planner dispatches `atlas:itinerary-change` { passport, stops } whenever
// it mutates state; we re-render from that. Initial state is read from the
// same sessionStorage key the planner uses.

const { useState, useEffect, useCallback } = React;

function readItin() {
  try {
    const raw = sessionStorage.getItem("atlas.itinerary");
    const o = raw ? JSON.parse(raw) : {};
    return { passport: o.passport || null, stops: Array.isArray(o.stops) ? o.stops : [] };
  } catch (e) { return { passport: null, stops: [] }; }
}

function ItineraryGlobe() {
  const [state, setState] = useState(() => readItin());
  const [mode, setMode] = useState("globe3d");

  useEffect(() => {
    const onChange = (e) => {
      const d = e.detail || {};
      setState({ passport: d.passport || null, stops: Array.isArray(d.stops) ? d.stops : [] });
    };
    window.addEventListener("atlas:itinerary-change", onChange);
    return () => window.removeEventListener("atlas:itinerary-change", onChange);
  }, []);

  const { passport, stops } = state;

  // Sequence = passport (origin) + each stop in order. Arcs connect each
  // consecutive pair so the route reads as a path across the globe.
  const sequence = passport ? [passport, ...stops] : stops;
  const arcs = [];
  for (let i = 0; i < sequence.length - 1; i++) {
    arcs.push({ from: sequence[i], to: sequence[i + 1] });
  }
  const stopMarkers = stops.map((iso, i) => ({ iso2: iso, label: i + 1 }));

  const fillResolver = useCallback((iso2) => {
    if (passport && iso2 === passport) return { color: "var(--self)", status: "self" };
    if (stops.includes(iso2)) {
      const r = window.resolveStatus(passport, iso2);
      return { color: STATUS_HEX[r.status] || STATUS_HEX.na, status: r.status };
    }
    return { color: "var(--land)", status: "na" }; // dim everything off-route
  }, [passport, stops]);

  const hoverRenderer = useCallback((hover) => {
    const dest = window.byIso2[hover.iso2];
    if (!dest) return null;
    const isStop = stops.includes(hover.iso2);
    const isSelf = hover.iso2 === passport;
    const r = (passport && isStop) ? window.resolveStatus(passport, hover.iso2) : null;
    const sc = r ? STATUS_COLOR[r.status] : null;
    return (
      <div style={{
        position: "absolute", left: hover.x + 16, top: hover.y + 16, pointerEvents: "none",
        background: "var(--panel)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--panel-border-strong)", borderRadius: 10, padding: "8px 11px",
        zIndex: 50, fontSize: 13, color: "var(--fg)", minWidth: 150,
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{dest.flag}</span>
          <strong style={{ fontSize: 13 }}>{window.countryName(hover.iso2)}</strong>
        </div>
        {isSelf && <div style={{ fontSize: 11, color: "var(--self)", marginTop: 4 }}>{window.t("itin.origin")}</div>}
        {sc && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.fill, boxShadow: `0 0 8px ${sc.fill}` }} />
            <span style={{ color: "var(--fg-dim)" }}>{statusLabel(r.status)}</span>
          </div>
        )}
      </div>
    );
  }, [passport, stops]);

  const empty = sequence.length === 0;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Globe
        passport={passport}
        mode={mode}
        fillResolver={fillResolver}
        hoverRenderer={hoverRenderer}
        arcs={arcs}
        stopMarkers={stopMarkers}
      />
      {/* 3D / 2D toggle */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 6, display: "inline-flex",
        background: "var(--bg-3)", border: "1px solid var(--panel-border)", borderRadius: 7, padding: 2, gap: 2 }}>
        {[["globe3d", window.t("mode.3d")], ["flat", window.t("mode.2d")]].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)}
            style={{ border: "none", padding: "4px 10px", borderRadius: 5,
              background: mode === v ? "var(--self)" : "transparent",
              color: mode === v ? "#05070d" : "var(--fg-dim)",
              fontFamily: "inherit", fontSize: 11, fontWeight: mode === v ? 600 : 500, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {empty && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.5, maxWidth: 280 }}>
            {window.t("itin.globe_empty")}
          </div>
        </div>
      )}
    </div>
  );
}

const _itinMount = document.getElementById("itinerary-globe");
if (_itinMount) ReactDOM.createRoot(_itinMount).render(<ItineraryGlobe />);

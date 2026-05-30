// Itinerary planner — full single-page app (globe-left, panel-right), the
// same shell as the home + transit maps. Replaces the old static single-column
// planner. Pick a passport, then TAP COUNTRIES ON THE GLOBE (or use the picker)
// to build a multi-stop trip; the route draws as numbered stops + great-circle
// arcs. The panel ports the original planner: per-stop visa status + fee,
// totals, recommended application order, apply-by reminders, ICS download,
// shareable URL.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── State persistence (sessionStorage + URL params, same keys as before) ──
function loadInitial() {
  let passport = null, stops = [], departure = "";
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("p")) passport = params.get("p").toUpperCase();
    if (params.get("stops")) stops = params.get("stops").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    if (params.get("d")) departure = params.get("d");
  } catch (e) {}
  try {
    const saved = JSON.parse(sessionStorage.getItem("atlas.itinerary") || "{}");
    if (!passport && saved.passport) passport = saved.passport;
    if (stops.length === 0 && Array.isArray(saved.stops)) stops = saved.stops;
    if (!departure && saved.departure) departure = saved.departure;
  } catch (e) {}
  if (passport && !window.PASSPORTS[passport]) passport = null;
  return { passport, stops, departure };
}

function applyTheme() {
  let bg = "light";
  try {
    const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
    if (tw.background === "dark" || tw.background === "light") bg = tw.background;
  } catch (e) {}
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add("theme-" + bg);
}

// ─── Fee / processing helpers (ported from the old planner) ────────────────
function procDays(p, iso) {
  const fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.processingDays) return 0;
  const m = fee.processingDays.match(/(\d+)\s*(?:–|-|to)\s*(\d+)\s*(week|day|month)/i)
         || fee.processingDays.match(/(\d+)\s*(week|day|month)/i);
  if (!m) return 0;
  const n = parseInt(m[m.length - 2] || m[1], 10);
  const unit = m[m.length - 1].toLowerCase();
  return unit.startsWith("week") ? n * 7 : (unit.startsWith("month") ? n * 30 : n);
}
function feeUSD(p, iso) {
  const fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.fee) return null;
  const m = String(fee.fee).match(/\$([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  return v > 0 ? v : null;
}
function fmtDate(d) {
  return d.toLocaleDateString(window.ATLAS_LANG || undefined,
    { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ─── Root ───────────────────────────────────────────────────────────────
function ItineraryApp() {
  const init = loadInitial();
  const [passport, setPassport] = useState(init.passport);
  const [stops, setStops] = useState(init.stops);
  const [departure, setDeparture] = useState(init.departure);
  const [mode, setMode] = useState("globe3d");
  const [, forceLang] = useState(0);

  useEffect(() => { applyTheme(); const el = document.getElementById("loading"); if (el) el.classList.add("hidden"); }, []);
  useEffect(() => {
    const onLang = () => forceLang(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);
  // Persist on every change.
  useEffect(() => {
    try { sessionStorage.setItem("atlas.itinerary", JSON.stringify({ passport, stops, departure })); } catch (e) {}
    try { if (passport) localStorage.setItem("atlas.passport", passport); } catch (e) {}
  }, [passport, stops, departure]);

  const addStop = useCallback((iso) => {
    setStops(prev => prev.includes(iso) ? prev : [...prev, iso]);
  }, []);
  const removeStop = useCallback((iso) => {
    setStops(prev => prev.filter(s => s !== iso));
  }, []);
  const toggleStop = useCallback((iso) => {
    setStops(prev => prev.includes(iso) ? prev.filter(s => s !== iso) : [...prev, iso]);
  }, []);

  // Globe click: set passport if none; otherwise toggle the stop.
  const onCountryClick = useCallback((iso) => {
    if (!window.PASSPORTS[iso] && !window.byIso2[iso]) return;
    if (!passport) { setPassport(iso); return; }
    if (iso === passport) return;
    toggleStop(iso);
  }, [passport, toggleStop]);

  const sequence = passport ? [passport, ...stops] : stops;
  const arcs = [];
  for (let i = 0; i < sequence.length - 1; i++) arcs.push({ from: sequence[i], to: sequence[i + 1] });
  const stopMarkers = stops.map((iso, i) => ({ iso2: iso, label: i + 1 }));

  const fillResolver = useCallback((iso2) => {
    if (passport && iso2 === passport) return { color: "var(--self)" };
    if (stops.includes(iso2)) {
      const r = window.resolveStatus(passport, iso2);
      return { color: STATUS_HEX[r.status] || STATUS_HEX.na };
    }
    return { color: "var(--land)" };
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
        zIndex: 50, fontSize: 13, color: "var(--fg)", minWidth: 150, boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{dest.flag}</span>
          <strong style={{ fontSize: 13 }}>{window.countryName(hover.iso2)}</strong>
        </div>
        {isSelf && <div style={{ fontSize: 11, color: "var(--self)", marginTop: 4 }}>{window.t("itin.your_passport")}</div>}
        {sc && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.fill, boxShadow: `0 0 8px ${sc.fill}` }} />
            <span style={{ color: "var(--fg-dim)" }}>{statusLabel(r.status)}</span>
          </div>
        )}
        {!isSelf && !isStop && <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 4 }}>+ {window.t("itin.add_destination")}</div>}
      </div>
    );
  }, [passport, stops]);

  return (
    <div className="layout">
      <ItinTopNav mode={mode} onMode={setMode} />
      <div className="globe-stage">
        <Globe
          passport={passport}
          mode={mode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          arcs={arcs}
          stopMarkers={stopMarkers}
          onCountryClick={onCountryClick}
        />
        {sequence.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--fg-mute)", lineHeight: 1.5, maxWidth: 280, textAlign: "center" }}>
              {window.t("itin.subtitle")}
            </div>
          </div>
        )}
      </div>
      <aside className="panel">
        <ItinHeader />
        <PassportRow passport={passport} onPick={setPassport} />
        <AddDestinationRow passport={passport} stops={stops} onAdd={addStop} />
        <StopsList passport={passport} stops={stops} onRemove={removeStop} />
        <DepartureRow departure={departure} setDeparture={setDeparture} />
        <Summary passport={passport} stops={stops} />
        <Reminders passport={passport} stops={stops} departure={departure} />
        <ItinFooter />
      </aside>
    </div>
  );
}

// ─── Top nav ──────────────────────────────────────────────────────────────
function ItinTopNav({ mode, onMode }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="travelnow.info home"><span>travelnow.info</span></a>
      <div className="topbar-sheet">
        <nav className="primary-nav">
          <a href="/">{window.t("tmap.back_to_visa")}</a>
          <a href="/transit-map/">{window.t("nav.transit_map")}</a>
          <a href="/schengen-calculator/">{window.t("nav.schengen")}</a>
        </nav>
        <div className="rhs">
          <div style={{ display: "inline-flex", background: "var(--bg-3)", border: "1px solid var(--panel-border)", borderRadius: 7, padding: 2, gap: 2 }}>
            {[["globe3d", window.t("mode.3d")], ["flat", window.t("mode.2d")]].map(([v, l]) => (
              <button key={v} onClick={() => onMode(v)} style={{
                border: "none", padding: "4px 10px", borderRadius: 5,
                background: mode === v ? "var(--self)" : "transparent",
                color: mode === v ? "#05070d" : "var(--fg-dim)",
                fontFamily: "inherit", fontSize: 11, fontWeight: mode === v ? 600 : 500, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
          <ItinLang />
        </div>
      </div>
    </header>
  );
}
function ItinLang() {
  const cur = window.ATLAS_LANG || "en";
  return (
    <select value={cur} onChange={(e) => window.setLang(e.target.value)} aria-label={window.t("nav.language")}
      style={{ background: "var(--bg-3)", border: "1px solid var(--panel-border)", color: "var(--fg-dim)", borderRadius: 7, padding: "6px 8px", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>
      {(window.LANGS || []).map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
    </select>
  );
}

function ItinHeader() {
  return (
    <header style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>{window.t("itin.title")}</div>
      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.45 }}>{window.t("itin.subtitle")}</p>
    </header>
  );
}
function ItinFooter() {
  return (
    <footer style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--panel-border)", fontSize: 10, color: "var(--fg-faint)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
      {window.t("tmap.disclaimer")}
    </footer>
  );
}

// ─── Compact searchable picker (shared) ────────────────────────────────────
function CountryPicker({ label, value, placeholder, exclude, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  const ex = exclude || new Set();
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(p => !ex.has(p.iso2))
      .filter(p => !ql || p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql))
      .slice(0, 80);
  }, [q, exclude]);
  const c = value ? window.byIso2[value] : null;
  return (
    <div ref={ref} style={{ marginBottom: 12, position: "relative" }}>
      {label && <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>{label}</div>}
      <button onClick={() => setOpen(o => !o)} className="picker-trigger" style={{
        width: "100%", background: open ? "var(--bg-3)" : "var(--bg-2)",
        border: `1px solid ${open ? "var(--self)" : "var(--panel-border-strong)"}`,
        borderRadius: 10, padding: "10px 12px", color: c ? "var(--fg)" : "var(--fg-mute)", textAlign: "left",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", fontSize: 14,
      }}>
        {c ? <><span style={{ fontSize: 20 }}>{c.flag}</span><span style={{ flex: 1, fontWeight: 500 }}>{window.countryName(value)}</span><span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{value}</span></>
           : <span>{placeholder}</span>}
      </button>
      {open && (
        <div style={{ position: "absolute", left: 0, right: 0, zIndex: 20, marginTop: 6, background: "var(--bg-2)", border: "1px solid var(--panel-border-strong)", borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
          <input autoFocus placeholder={window.t("itin.search")} value={q} onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--panel-border)", padding: "10px 12px", color: "var(--fg)", fontFamily: "inherit", fontSize: 13, outline: "none" }} />
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {list.map(p => (
              <button key={p.iso2} className="dropdown-item" onClick={() => { onPick(p.iso2); setOpen(false); setQ(""); }}
                style={{ width: "100%", background: "transparent", border: "none", padding: "9px 12px", color: "var(--fg)", textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{window.byIso2[p.iso2]?.flag}</span>
                <span style={{ flex: 1 }}>{window.countryName(p.iso2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PassportRow({ passport, onPick }) {
  return <CountryPicker label={window.t("itin.your_passport")} value={passport} placeholder={window.t("picker.select_passport")} onPick={onPick} />;
}
function AddDestinationRow({ passport, stops, onAdd }) {
  if (!passport) return null;
  const exclude = new Set([passport, ...stops]);
  return <CountryPicker label={null} value={null} placeholder={"+ " + window.t("itin.add_destination")} exclude={exclude} onPick={onAdd} />;
}

// ─── Stops list ─────────────────────────────────────────────────────────
function StopsList({ passport, stops, onRemove }) {
  if (!passport) return null;
  if (stops.length === 0) {
    return <div style={{ padding: 14, marginBottom: 12, fontSize: 12, color: "var(--fg-mute)", background: "var(--bg-2)", border: "1px dashed var(--panel-border)", borderRadius: 10, lineHeight: 1.5 }}>{window.t("itin.no_stops")}</div>;
  }
  return (
    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {stops.map((iso, idx) => {
        const r = window.resolveStatus(passport, iso);
        const fee = window.visaFee && window.visaFee(passport, iso);
        const sc = STATUS_COLOR[r.status] || STATUS_COLOR.na;
        const feeText = (fee && fee.fee) ? fee.fee : (r.status === "vf" ? window.t("itin.fee_free") : (r.status === "self" ? "—" : window.t("itin.fee_missing")));
        const proc = (fee && fee.processingDays) ? fee.processingDays : ((r.status === "vf" || r.status === "self") ? window.t("itin.no_app_needed") : "");
        return (
          <div key={iso} style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, background: "var(--bg-2)", border: "1px solid var(--panel-border)", borderLeft: `3px solid ${sc.fill}`, borderRadius: 10 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", minWidth: 16 }}>{idx + 1}</span>
            <span style={{ fontSize: 20 }}>{window.byIso2[iso]?.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{window.countryName(iso)}</div>
              <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{statusLabel(r.status)}{feeText ? " · " + feeText : ""}{proc ? " · " + proc : ""}</div>
            </div>
            <button onClick={() => onRemove(iso)} title={window.t("itin.remove")} style={{ background: "transparent", border: "none", color: "var(--fg-mute)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

function DepartureRow({ departure, setDeparture }) {
  const dep = departure ? new Date(departure + "T00:00:00Z") : null;
  let hint = "";
  if (dep && !isNaN(dep)) {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const days = Math.floor((dep - today) / 86400000);
    hint = days < 0 ? window.t("itin.date_past") : window.t("itin.days_until", { n: days });
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6 }}>{window.t("itin.depart_label")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="date" value={departure} onChange={(e) => setDeparture(e.target.value)}
          style={{ background: "var(--bg-3)", border: "1px solid var(--panel-border-strong)", borderRadius: 7, color: "var(--fg)", padding: "8px 10px", fontFamily: "inherit", fontSize: 13, colorScheme: "dark" }} />
        {departure && <button onClick={() => setDeparture("")} style={{ background: "transparent", border: "none", color: "var(--fg-mute)", cursor: "pointer", fontSize: 12 }}>{window.t("itin.depart_clear")}</button>}
        {hint && <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>{hint}</span>}
      </div>
    </div>
  );
}

// ─── Summary stats + application order ─────────────────────────────────────
function Summary({ passport, stops }) {
  if (!passport || stops.length === 0) return null;
  let totalFee = 0, unknown = 0, maxProc = 0;
  const visaStops = [];
  for (const iso of stops) {
    const r = window.resolveStatus(passport, iso);
    if (r.status === "vf" || r.status === "self") continue;
    visaStops.push({ iso, status: r.status });
    const usd = feeUSD(passport, iso);
    if (usd) totalFee += usd; else unknown++;
    const pd = procDays(passport, iso);
    if (pd > maxProc) maxProc = pd;
  }
  const order = visaStops.slice().sort((a, b) => procDays(passport, b.iso) - procDays(passport, a.iso));
  const totalStr = totalFee > 0 ? `$${totalFee.toFixed(0)}` : "—";
  const procStr = maxProc > 0 ? `${maxProc}d` : "—";
  const cell = (label, value, color) => (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--panel-border)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-mono)", color: color || "var(--fg)" }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {cell(window.t("itin.visas_needed"), visaStops.length, "var(--fg)")}
        {cell(window.t("itin.est_cost"), totalStr, "var(--vf)")}
        {cell(window.t("itin.lead_time"), procStr, "var(--voa)")}
      </div>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--panel-border)", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{window.t("itin.order_title")}</div>
        {order.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--fg-dim)" }}>{window.t("itin.no_visas_needed")}</div>
        ) : (
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            {order.map(s => {
              const fee = window.visaFee && window.visaFee(passport, s.iso);
              return <li key={s.iso} style={{ margin: "4px 0", fontSize: 13, color: "var(--fg-dim)" }}>
                <strong style={{ color: "var(--fg)" }}>{window.byIso2[s.iso]?.flag} {window.countryName(s.iso)}</strong> · {statusLabel(s.status)}{fee && fee.processingDays ? " · " + fee.processingDays : ""}
              </li>;
            })}
          </ol>
        )}
        {unknown > 0 && <p style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 10, marginBottom: 0 }}>{window.t("itin.missing_fee", { n: unknown })}</p>}
        {maxProc > 0 && <p style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6, marginBottom: 0 }}>{window.t("itin.start_buffer", { n: maxProc })}</p>}
      </div>
      <button onClick={() => window.print()} style={{
        marginTop: 10, width: "100%", padding: "9px 12px", background: "var(--bg-3)",
        border: "1px solid var(--panel-border-strong)", color: "var(--fg-dim)", borderRadius: 8,
        fontSize: 13, cursor: "pointer", fontFamily: "inherit",
      }}>{window.t("itin.print")}</button>
    </div>
  );
}

// ─── Apply-by reminders + ICS + share ─────────────────────────────────────
function Reminders({ passport, stops, departure }) {
  const [shareMsg, setShareMsg] = useState("");
  if (!passport || stops.length === 0 || !departure) return null;
  const dep = new Date(departure + "T00:00:00Z");
  if (isNaN(dep)) return null;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if ((dep - today) < 0) return null;

  const items = stops.map(iso => {
    const r = window.resolveStatus(passport, iso);
    if (r.status === "vf" || r.status === "self") return null;
    const proc = procDays(passport, iso) || 14;
    const lead = proc + 7;
    const applyBy = new Date(dep.getTime() - lead * 86400000);
    return { iso, status: r.status, applyBy, lead, proc, overdue: applyBy < today };
  }).filter(Boolean);

  if (items.length === 0) {
    return (
      <div style={{ marginBottom: 14, padding: 12, border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.06)", borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--vf)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{window.t("itin.good_news")}</div>
        <div style={{ fontSize: 13, color: "var(--fg-dim)" }}>{window.t("itin.good_news_body", { name: window.countryName(passport) })}</div>
      </div>
    );
  }
  items.sort((a, b) => a.applyBy - b.applyBy);
  const earliest = items[0].applyBy;
  const earliestDays = Math.ceil((earliest - today) / 86400000);

  const downloadICS = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Atlas//Visa Reminder//EN", "CALSCALE:GREGORIAN"];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    for (const it of items) {
      const ymd = it.applyBy.toISOString().slice(0, 10).replace(/-/g, "");
      const next = new Date(it.applyBy.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, "");
      const nm = window.countryName(it.iso);
      lines.push("BEGIN:VEVENT", `UID:atlas-visa-${it.iso}-${ymd}@travelnow.info`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:Apply for ${nm} visa`,
        `DESCRIPTION:Submit your ${nm} visa application today. Processing ~${it.proc} days; departure ${departure}.`,
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:Apply for ${nm} visa tomorrow.`, "END:VALARM", "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "atlas-visa-reminders.ics";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const copyShare = () => {
    const u = new URL(location.href); u.search = "";
    if (passport) u.searchParams.set("p", passport);
    if (stops.length) u.searchParams.set("stops", stops.join(","));
    if (departure) u.searchParams.set("d", departure);
    navigator.clipboard.writeText(u.toString()).then(() => { setShareMsg(window.t("itin.copied")); setTimeout(() => setShareMsg(""), 2000); });
  };

  return (
    <div style={{ marginBottom: 14, padding: 12, background: "var(--bg-2)", border: "1px solid var(--panel-border)", borderRadius: 10 }}>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{window.t("itin.reminders_title")}</div>
      <div style={{ fontSize: 13, color: "var(--fg-dim)", marginBottom: 10 }}>
        {earliestDays <= 0 ? window.t("itin.past_window") : window.t("itin.start_by", { date: fmtDate(earliest), n: earliestDays })}
      </div>
      {items.map(it => (
        <div key={it.iso} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--panel-border)" }}>
          <span style={{ fontSize: 18 }}>{window.byIso2[it.iso]?.flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{window.countryName(it.iso)}</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{window.t("itin.proc_lead", { proc: it.proc, lead: it.lead })}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: it.overdue ? "var(--vr)" : "var(--fg)" }}>{it.overdue ? window.t("itin.apply_asap") : window.t("itin.apply_by")}</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{fmtDate(it.applyBy)}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={downloadICS} style={{ padding: "9px 14px", background: "var(--self)", color: "#05070d", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{window.t("itin.dl_ics")}</button>
        <button onClick={copyShare} style={{ padding: "9px 14px", background: "var(--bg-3)", border: "1px solid var(--panel-border-strong)", color: "var(--fg-dim)", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{window.t("itin.copy_url")}</button>
        {shareMsg && <span style={{ fontSize: 11, color: "var(--vf)" }}>{shareMsg}</span>}
      </div>
    </div>
  );
}

// ─── Layout styles (mirror the home / transit-map shell) ───────────────────
const iaStyle = document.createElement("style");
iaStyle.textContent = `
  .layout { position: relative; height: 100vh; width: 100vw; display: grid; grid-template-columns: 1fr 360px; grid-template-rows: 48px 1fr; grid-template-areas: "topbar topbar" "globe panel"; }
  .topbar { grid-area: topbar; position: relative; display: flex; align-items: center; gap: 4px; padding: 0 14px; border-bottom: 1px solid var(--panel-border); background: var(--panel); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); z-index: 6; }
  .topbar .brand { display: flex; align-items: center; padding: 0 12px 0 0; font-weight: 600; font-size: 15px; color: var(--fg); text-decoration: none; white-space: nowrap; font-family: var(--font-mono); }
  .topbar-sheet { display: flex; align-items: center; gap: 4px; flex: 1; }
  .topbar .primary-nav { display: flex; gap: 2px; flex: 1; }
  .topbar .primary-nav a { padding: 7px 10px; font-size: 13px; color: var(--fg-dim); text-decoration: none; border-radius: 6px; white-space: nowrap; }
  .topbar .primary-nav a:hover { color: var(--fg); background: var(--bg-3); }
  .topbar .rhs { display: flex; align-items: center; gap: 6px; margin-left: auto; }
  .globe-stage { grid-area: globe; position: relative; overflow: hidden; }
  .panel { grid-area: panel; position: relative; padding: 20px 18px 18px; background: var(--panel); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 1px solid var(--panel-border); overflow-y: auto; display: flex; flex-direction: column; z-index: 2; }
  .dropdown-item:hover { background: rgba(96,165,250,0.10) !important; }
  .picker-trigger:hover { border-color: var(--self) !important; }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; grid-template-rows: 48px 50vh auto; grid-template-areas: "topbar" "globe" "panel"; }
    .panel { border-left: none; border-top: 1px solid var(--panel-border); }
    .topbar { padding: 0 10px; gap: 6px; }
    .topbar .primary-nav { overflow-x: auto; }
  }
`;
document.head.appendChild(iaStyle);

ReactDOM.createRoot(document.getElementById("root")).render(<ItineraryApp />);

// Itinerary planner — full single-page app (globe-left, panel-right), the
// same shell as the home + transit maps. Pick a passport, then TAP COUNTRIES
// ON THE GLOBE (or use the picker) to build a multi-stop trip; the route draws
// as numbered stops + great-circle arcs. The panel shows per-stop visa status
// + fee, totals, recommended application order, apply-by reminders, an ICS
// download and a shareable URL.

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

function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
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
  const [mode, setModeState] = useState(readView);
  const [theme, setTheme] = useSiteTheme();
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };

  useEffect(() => { const el = document.getElementById("loading"); if (el) el.classList.add("hidden"); }, []);
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
      if (r.status === "ban") return { color: "url(#hatch-ban)" };
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
    return (
      <div className="hovercard overlay-card" style={{ left: hover.x + 16, top: hover.y + 16, minWidth: 150 }}>
        <div className="hovercard-title"><span className="flag">{dest.flag}</span><span>{window.countryName(hover.iso2)}</span></div>
        {isSelf && <div className="hovercard-row hovercard-cap">{window.t("itin.your_passport")}</div>}
        {r && <div className="hovercard-row"><Dot s={r.status} /><span>{statusLabel(r.status)}</span></div>}
        {!isSelf && !isStop && <div className="hovercard-row hovercard-cap">+ {window.t("itin.add_destination")}</div>}
      </div>
    );
  }, [passport, stops]);

  return (
    <div className="layout">
      <Masthead view={mode} onView={setMode} theme={theme} onTheme={setTheme} />
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
          <div className="welcome">
            <div className="welcome-card overlay-card" style={{ width: "min(320px, 100%)" }}>
              <p className="welcome-body" style={{ margin: 0 }}>{window.t("itin.subtitle")}</p>
            </div>
          </div>
        )}
      </div>
      <aside className="panel">
        <MobileSheetHandle />
        <header className="p-head" style={{ display: "block" }}>
          <div className="p-head-title">{window.t("itin.title")}</div>
          <p className="p-head-sub">{window.t("itin.subtitle")}</p>
        </header>
        <section className="p-sec">
          <Caption n={1}>{window.t("itin.your_passport")}</Caption>
          <CountryPicker value={passport} placeholder={window.t("picker.select_passport")} onPick={setPassport} isPassport />
        </section>
        {passport && (
          <section className="p-sec">
            <Caption n={2} aside={stops.length ? <span className="mono">{stops.length}</span> : null}>{window.t("itin.add_destination")}</Caption>
            <StopsList passport={passport} stops={stops} onRemove={removeStop} />
            <AddDestinationRow passport={passport} stops={stops} onAdd={addStop} />
          </section>
        )}
        {passport && (
          <section className="p-sec">
            <Caption n={3}>{window.t("itin.depart_label")}</Caption>
            <DepartureRow departure={departure} setDeparture={setDeparture} />
          </section>
        )}
        <Summary passport={passport} stops={stops} />
        <Reminders passport={passport} stops={stops} departure={departure} />
        <footer className="panel-foot">{window.t("tmap.disclaimer")}</footer>
      </aside>
    </div>
  );
}

// ─── Compact searchable picker ─────────────────────────────────────────────
function CountryPicker({ value, placeholder, exclude, onPick, isPassport }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
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
    <div ref={ref} style={{ position: "relative" }}>
      {isPassport ? (
        <button type="button" className="pp-card" style={{ paddingBottom: 2 }} onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <span className="pp-doc" aria-hidden="true">Passport · Pasaport · Passeport<IconCaret /></span>
          {c ? (
            <span className="pp-main">
              <span className="flag pp-flag" aria-hidden="true">{c.flag}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="pp-name" style={{ display: "block" }}>{window.countryName(value)}</span>
                <span className="pp-meta" style={{ display: "block" }}>{value}</span>
              </span>
            </span>
          ) : <span className="pp-empty" style={{ display: "block" }}>{placeholder}</span>}
        </button>
      ) : (
        <button type="button" className="row-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <span className="row-btn-label">{placeholder}</span>
          <IconCaret className={open ? "is-flipped" : ""} />
        </button>
      )}
      {open && (
        <div className="dd" style={{ position: "absolute", left: 0, right: 0, zIndex: 20 }}>
          <input autoFocus className="field dd-search" placeholder={window.t("itin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="dd-list">
            {list.map(p => (
              <button key={p.iso2} type="button" className="dd-item" onClick={() => { onPick(p.iso2); setOpen(false); setQ(""); }}>
                <span className="flag">{window.byIso2[p.iso2]?.flag}</span>
                <span className="dd-grow">{window.countryName(p.iso2)}</span>
                <span className="dd-code">{p.iso2}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddDestinationRow({ passport, stops, onAdd }) {
  if (!passport) return null;
  const exclude = new Set([passport, ...stops]);
  return <CountryPicker value={null} placeholder={"+ " + window.t("itin.add_destination")} exclude={exclude} onPick={onAdd} />;
}

// ─── Stops list ─────────────────────────────────────────────────────────
function StopsList({ passport, stops, onRemove }) {
  if (!passport) return null;
  if (stops.length === 0) {
    return <div className="box box-dashed p-hint" style={{ marginTop: 0 }}>{window.t("itin.no_stops")}</div>;
  }
  return (
    <ol className="stops">
      {stops.map((iso, idx) => {
        const r = window.resolveStatus(passport, iso);
        const fee = window.visaFee && window.visaFee(passport, iso);
        const feeText = (fee && fee.fee) ? fee.fee : (r.status === "vf" ? window.t("itin.fee_free") : (r.status === "self" ? "—" : window.t("itin.fee_missing")));
        const proc = (fee && fee.processingDays) ? fee.processingDays : ((r.status === "vf" || r.status === "self") ? window.t("itin.no_app_needed") : "");
        return (
          <li key={iso} className="stop" style={{ "--tone": `var(--${r.status}, var(--rule-strong))` }}>
            <span className="stop-n">{idx + 1}</span>
            <span className="flag" style={{ fontSize: 20 }}>{window.byIso2[iso]?.flag}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="stop-name">{window.countryName(iso)}</span>
              <span className="stop-meta">{statusLabel(r.status)}{feeText ? " · " + feeText : ""}{proc ? " · " + proc : ""}</span>
            </span>
            <button type="button" className="icon-btn" onClick={() => onRemove(iso)} title={window.t("itin.remove")} aria-label={window.t("itin.remove")}><IconClose /></button>
          </li>
        );
      })}
    </ol>
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <input type="date" className="field" style={{ width: "auto" }} value={departure} onChange={(e) => setDeparture(e.target.value)} aria-label={window.t("itin.depart_label")} />
      {departure && <button type="button" className="btn btn-quiet" onClick={() => setDeparture("")}>{window.t("itin.depart_clear")}</button>}
      {hint && <span className="p-hint" style={{ margin: 0 }}>{hint}</span>}
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
  return (
    <section className="p-sec">
      <Caption n={4}>{window.t("itin.order_title")}</Caption>
      <div className="stats3" style={{ marginBottom: 10 }}>
        <div><div className="n">{visaStops.length}</div><div className="l">{window.t("itin.visas_needed")}</div></div>
        <div><div className="n">{totalStr}</div><div className="l">{window.t("itin.est_cost")}</div></div>
        <div><div className="n">{procStr}</div><div className="l">{window.t("itin.lead_time")}</div></div>
      </div>
      {order.length === 0 ? (
        <p className="p-hint">{window.t("itin.no_visas_needed")}</p>
      ) : (
        <ol className="apply-order">
          {order.map(s => {
            const fee = window.visaFee && window.visaFee(passport, s.iso);
            return (
              <li key={s.iso}>
                <strong><span className="flag">{window.byIso2[s.iso]?.flag}</span> {window.countryName(s.iso)}</strong>
                <span> · {statusLabel(s.status)}{fee && fee.processingDays ? " · " + fee.processingDays : ""}</span>
              </li>
            );
          })}
        </ol>
      )}
      {unknown > 0 && <p className="p-fine" style={{ margin: "8px 0 0" }}>{window.t("itin.missing_fee", { n: unknown })}</p>}
      {maxProc > 0 && <p className="p-fine" style={{ margin: "4px 0 0" }}>{window.t("itin.start_buffer", { n: maxProc })}</p>}
      <button type="button" className="btn btn-block" style={{ marginTop: 10 }} onClick={() => window.print()}>{window.t("itin.print")}</button>
    </section>
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
      <div className="note note-ok" style={{ display: "block" }}>
        <div className="note-k">{window.t("itin.good_news")}</div>
        <div className="note-s">{window.t("itin.good_news_body", { name: window.countryName(passport) })}</div>
      </div>
    );
  }
  items.sort((a, b) => a.applyBy - b.applyBy);
  const earliest = items[0].applyBy;
  const earliestDays = Math.ceil((earliest - today) / 86400000);

  const downloadICS = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//travelnow.info//Visa Reminder//EN", "CALSCALE:GREGORIAN"];
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
    <section className="p-sec">
      <Caption n={5}>{window.t("itin.reminders_title")}</Caption>
      <p className="p-hint" style={{ margin: "0 0 8px", color: "var(--ink-2)" }}>
        {earliestDays <= 0 ? window.t("itin.past_window") : window.t("itin.start_by", { date: fmtDate(earliest), n: earliestDays })}
      </p>
      <div className="members" style={{ marginTop: 0 }}>
        {items.map(it => (
          <div key={it.iso} className="member">
            <span className="flag" style={{ fontSize: 18 }}>{window.byIso2[it.iso]?.flag}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="stop-name">{window.countryName(it.iso)}</span>
              <span className="stop-meta">{window.t("itin.proc_lead", { proc: it.proc, lead: it.lead })}</span>
            </span>
            <span style={{ textAlign: "right" }}>
              <span className="stop-name" style={{ fontSize: 12.5, color: it.overdue ? "var(--vr)" : "var(--ink)" }}>{it.overdue ? window.t("itin.apply_asap") : window.t("itin.apply_by")}</span>
              <span className="stop-meta">{fmtDate(it.applyBy)}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={downloadICS}>{window.t("itin.dl_ics")}</button>
        <button type="button" className="btn" onClick={copyShare}>{window.t("itin.copy_url")}</button>
        {shareMsg && <span className="p-hint" style={{ margin: 0, color: "var(--vf)" }}>{shareMsg}</span>}
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ItineraryApp />);

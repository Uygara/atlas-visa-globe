// Transit Map — a standalone globe page (sibling to the home visa globe).
// Paints every country by the airport-transit-visa status for the chosen
// passport: green = airside transit open, saffron = visa-free but time-limited
// (TWOV), red = transit visa required, neutral = not a tracked hub.
//
// Reuses components/globe.jsx via its decoupled `fillResolver` + `hoverRenderer`
// props, and the shared masthead / sheet / controls from components/chrome.jsx.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TG_COLOR = window.TRANSIT_GLOBE_COLOR;

// ─── Lightweight passport persistence (shared with the home page) ─────────
function readSavedPassport() {
  try { return localStorage.getItem("atlas.passport") || null; } catch (e) { return null; }
}
function savePassport(iso2) {
  try { if (iso2) localStorage.setItem("atlas.passport", iso2); } catch (e) {}
}

// The 3D/2D choice is per browser session, same as on the home page.
function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
}

function TransitMapApp() {
  const [passport, setPassport] = useState(() => readSavedPassport());
  const [mode, setModeState] = useState(readView);
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useSiteTheme();
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };

  useEffect(() => { savePassport(passport); }, [passport]);

  // Hide the loading screen once mounted.
  useEffect(() => {
    const el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, []);

  const fillResolver = useCallback((iso2) => {
    if (!passport) return { color: "var(--land)", status: "na" };
    const t = window.transitStatusForGlobe(passport, iso2);
    return { ...t, color: TG_COLOR[t.status] || "var(--land)" };
  }, [passport]);

  const hoverRenderer = useCallback((hover) => (
    <TransitHover hover={hover} passport={passport} />
  ), [passport]);

  return (
    <div className="layout">
      <Masthead view={mode} onView={setMode} theme={theme} onTheme={setTheme} />
      <div className="globe-stage">
        <Globe
          passport={passport}
          mode={mode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          onCountryClick={(iso2) => setSelected(iso2)}
          focusedCountry={selected}
        />
        <TransitLegend />
      </div>
      <aside className="panel">
        <MobileSheetHandle />
        <TransitPanelHeader />
        <section className="p-sec">
          <Caption n={1}>{window.t("tmap.pick")}</Caption>
          <TransitPicker value={passport} onChange={(v) => { setPassport(v); setSelected(null); }} />
          {!passport && <div className="box box-dashed p-hint" style={{ marginTop: 10 }}>{window.t("tmap.pick_prompt")}</div>}
        </section>
        {passport && selected && (
          <TransitDetail passport={passport} iso2={selected} onClose={() => setSelected(null)} />
        )}
        {passport && <TransitHubList passport={passport} onOpen={(iso2) => setSelected(iso2)} />}
        <footer className="panel-foot">{window.t("tmap.disclaimer")}</footer>
      </aside>
    </div>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────
function TransitPanelHeader() {
  return (
    <header className="p-head" style={{ display: "block" }}>
      <div className="p-head-title">{window.t("tmap.title")}</div>
      <p className="p-head-sub">{window.t("tmap.subtitle")}</p>
    </header>
  );
}

// ─── Passport picker (compact, searchable) ─────────────────────────────────
function TransitPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const country = value ? window.byIso2[value] : null;
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(p =>
      !ql || p.name.toLowerCase().includes(ql)
          || window.countryName(p.iso2).toLowerCase().includes(ql)
          || p.iso2.toLowerCase().includes(ql)
    );
  }, [q]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="pp-card" style={{ paddingBottom: 2 }} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="pp-doc" aria-hidden="true">Passport · Pasaport · Passeport<IconCaret /></span>
        {country ? (
          <span className="pp-main">
            <span className="flag pp-flag" aria-hidden="true">{country.flag}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="pp-name" style={{ display: "block" }}>{window.countryName(value)}</span>
              <span className="pp-meta" style={{ display: "block" }}>{value}</span>
            </span>
          </span>
        ) : (
          <span className="pp-empty" style={{ display: "block" }}>{window.t("picker.select_passport")}</span>
        )}
      </button>
      {open && (
        <div className="dd" style={{ position: "absolute", left: 0, right: 0, zIndex: 20 }}>
          <input autoFocus className="field dd-search" placeholder={window.t("tmap.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="dd-list">
            {list.map(p => {
              const c = window.byIso2[p.iso2];
              const active = p.iso2 === value;
              return (
                <button key={p.iso2} type="button" className="dd-item" aria-selected={active}
                  onClick={() => { onChange(p.iso2); setOpen(false); setQ(""); }}>
                  <span className="flag">{c?.flag}</span>
                  <span className="dd-grow">{window.countryName(p.iso2)}</span>
                  <span className="dd-code">{p.iso2}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend ─────────────────────────────────────────────────────────────────
function TransitLegend() {
  const items = [
    { s: "vf",  k: "tmap.legend_free" },
    { s: "voa", k: "tmap.legend_twov" },
    { s: "vr",  k: "tmap.legend_vr" },
  ];
  return (
    <div className="map-key overlay-card">
      <div className="map-key-title">{window.t("tmap.legend")}</div>
      <ul>
        {items.map(i => <li key={i.k}><Swatch s={i.s} /><span>{window.t(i.k)}</span></li>)}
      </ul>
    </div>
  );
}

// ─── Hover tooltip ──────────────────────────────────────────────────────────
function transitLine(t) {
  if (t.status === "vr") return { label: window.t("tmap.needs_visa"), color: TG_COLOR.vr, s: "vr" };
  if (t.status === "twov") return { label: window.t("tmap.twov_ok", { n: t.twovHours }), color: TG_COLOR.twov, s: "voa" };
  if (t.status === "free") return { label: window.t("tmap.free_ok"), color: TG_COLOR.free, s: "vf" };
  return null;
}

function TransitHover({ hover, passport }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest || !passport) return null;
  const t = window.transitStatusForGlobe(passport, hover.iso2);
  const line = transitLine(t);
  return (
    <div className="hovercard overlay-card" style={{ left: hover.x + 18, top: hover.y + 18 }}>
      <div className="hovercard-title"><span className="flag">{dest.flag}</span><span>{window.countryName(hover.iso2)}</span></div>
      {line
        ? <div className="hovercard-row"><Dot s={line.s} /><span>{line.label}</span></div>
        : <div className="hovercard-row hovercard-cap">{window.t("tmap.legend_na")}</div>}
    </div>
  );
}

// ─── Clicked-country detail ───────────────────────────────────────────────
function TransitDetail({ passport, iso2, onClose }) {
  const dest = window.byIso2[iso2];
  const t = window.transitStatusForGlobe(passport, iso2);
  const line = transitLine(t);
  if (!dest) return null;
  return (
    <article className="entry">
      <div className="entry-top">
        <span className="flag entry-flag" aria-hidden="true">{dest.flag}</span>
        <div style={{ minWidth: 0 }}><div className="entry-name">{window.countryName(iso2)}</div></div>
        <div className="entry-actions">
          <button type="button" className="icon-btn" onClick={onClose} aria-label={window.t("detail.close")}><IconClose /></button>
        </div>
      </div>
      {line ? (
        <div className="entry-verdict">
          <div className="stamp" style={{ "--st": `var(--${line.s})` }}><span className="stamp-k" style={{ fontSize: 17 }}>{line.label}</span></div>
        </div>
      ) : (
        <p className="entry-note" style={{ marginTop: 10 }}>{window.t("tmap.legend_na")}</p>
      )}
      {t.generic && <p className="entry-note">{window.t("tmap.generic_note")}</p>}
      {t.exemption && t.exemption.note && (
        <div className="note note-ok"><span className="note-k" style={{ fontWeight: 500 }}>{window.t("tmap.exempt_via", { note: t.exemption.note })}</span></div>
      )}
      {t.notes && <p className="entry-note">{t.notes}</p>}
      {t.source && <a className="link-quiet" href={t.source} target="_blank" rel="noopener noreferrer">{window.t("tmap.source")} →</a>}
    </article>
  );
}

// ─── Hub list ───────────────────────────────────────────────────────────────
function TransitHubList({ passport, onOpen }) {
  const hubs = window.COMMON_TRANSIT_HUBS || [];
  // SCHENGEN maps to Germany (Frankfurt) as the canonical Schengen hub.
  const repIso = (area) => area === "SCHENGEN" ? "DE" : area;
  const rows = hubs.map(h => {
    const iso = repIso(h.area);
    const t = window.transitStatusForGlobe(passport, iso);
    return { ...h, iso, t, line: transitLine(t) };
  });
  return (
    <section className="p-sec">
      <Caption n={2}>{window.t("tmap.hubs")}</Caption>
      <ul className="ledger">
        {rows.map(r => (
          <li key={r.area}>
            <button type="button" className="lg-row" onClick={() => onOpen(r.iso)}>
              {r.line ? <Swatch s={r.line.s} /> : <span className="sw sw-all" aria-hidden="true" />}
              <span className="lg-label" style={{ whiteSpace: "normal" }}>{r.hubLabel}</span>
              <span className="lg-dots" />
              <span className="lg-n" style={{ fontSize: 11.5, color: "var(--ink-2)", textAlign: "right" }}>{r.line ? r.line.label : "—"}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<TransitMapApp />);

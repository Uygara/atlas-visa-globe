// Transit Map — a standalone globe page (sibling to the home visa globe).
// Paints every country by the airport-transit-visa status for the chosen
// passport: green = airside transit open, amber = visa-free but time-limited
// (TWOV), red = transit visa required, neutral = not a tracked hub.
//
// Reuses components/globe.jsx via its decoupled `fillResolver` + `hoverRenderer`
// props, so the home page's visa colouring is untouched. Loads its own slim
// side panel (picker + legend + hub list + clicked-country detail).

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TG_COLOR = window.TRANSIT_GLOBE_COLOR;

// ─── Lightweight passport persistence (shared with the home page) ─────────
function readSavedPassport() {
  try { return localStorage.getItem("atlas.passport") || null; } catch (e) { return null; }
}
function savePassport(iso2) {
  try { if (iso2) localStorage.setItem("atlas.passport", iso2); } catch (e) {}
}

// ─── Theme (mirror the home page's localStorage convention) ───────────────
function applyTheme() {
  let bg = "light";
  try {
    const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
    if (tw.background === "dark" || tw.background === "light") bg = tw.background;
  } catch (e) {}
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add("theme-" + bg);
  return bg;
}

function TransitMapApp() {
  const [passport, setPassport] = useState(() => readSavedPassport());
  const [mode, setMode] = useState("globe3d");
  const [selected, setSelected] = useState(null);
  const [, forceLang] = useState(0);

  useEffect(() => { applyTheme(); }, []);
  useEffect(() => { savePassport(passport); }, [passport]);
  useEffect(() => {
    const onLang = () => forceLang(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);

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
      <TransitTopNav mode={mode} onMode={setMode} />
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
        <TransitPanelHeader />
        <TransitPicker value={passport} onChange={(v) => { setPassport(v); setSelected(null); }} />
        {!passport && (
          <div style={{
            padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.5,
            color: "var(--fg-mute)", background: "var(--bg-2)",
            border: "1px dashed var(--panel-border)", borderRadius: 10,
          }}>
            {window.t("tmap.pick_prompt")}
          </div>
        )}
        {passport && selected && (
          <TransitDetail passport={passport} iso2={selected} onClose={() => setSelected(null)} />
        )}
        {passport && <TransitHubList passport={passport} onOpen={(iso2) => setSelected(iso2)} />}
        <TransitPanelFooter />
      </aside>
    </div>
  );
}

// ─── Top nav ──────────────────────────────────────────────────────────────
function TransitTopNav({ mode, onMode }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="travelnow.info home">
        <span>travelnow.info</span>
      </a>
      <div className="topbar-sheet">
        <nav className="primary-nav">
          <a href="/">{window.t("tmap.back_to_visa")}</a>
          <a href="/transit-visa/">{window.t("nav.transit")}</a>
          <a href="/etias/">{window.t("nav.etias")}</a>
          <a href="/schengen-calculator/">{window.t("nav.schengen")}</a>
        </nav>
        <div className="rhs">
          <TransitModeToggle value={mode} onChange={onMode} />
          <TransitLang />
        </div>
      </div>
    </header>
  );
}

function TransitModeToggle({ value, onChange }) {
  const opts = [{ v: "globe3d", l: window.t("mode.3d") }, { v: "flat", l: window.t("mode.2d") }];
  return (
    <div style={{ display: "inline-flex", background: "var(--bg-3)", border: "1px solid var(--panel-border)", borderRadius: 7, padding: 2, gap: 2 }}>
      {opts.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)}
            style={{
              border: "none", padding: "4px 10px", borderRadius: 5,
              background: on ? "var(--self)" : "transparent",
              color: on ? "#05070d" : "var(--fg-dim)",
              fontFamily: "inherit", fontSize: 11, fontWeight: on ? 600 : 500, cursor: "pointer",
            }}>{o.l}</button>
        );
      })}
    </div>
  );
}

function TransitLang() {
  const cur = window.ATLAS_LANG || "en";
  return (
    <select
      value={cur}
      onChange={(e) => window.setLang(e.target.value)}
      aria-label={window.t("nav.language")}
      style={{
        background: "var(--bg-3)", border: "1px solid var(--panel-border)",
        color: "var(--fg-dim)", borderRadius: 7, padding: "6px 8px",
        fontFamily: "inherit", fontSize: 12, cursor: "pointer",
      }}>
      {(window.LANGS || []).map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
    </select>
  );
}

// ─── Panel header / footer ─────────────────────────────────────────────────
function TransitPanelHeader() {
  return (
    <header style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
        {window.t("tmap.title")}
      </div>
      <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.45 }}>
        {window.t("tmap.subtitle")}
      </p>
    </header>
  );
}

function TransitPanelFooter() {
  return (
    <footer style={{
      marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--panel-border)",
      fontSize: 10, color: "var(--fg-faint)", fontFamily: "var(--font-mono)", lineHeight: 1.5,
    }}>
      {window.t("tmap.disclaimer")}
    </footer>
  );
}

// ─── Passport picker (compact, searchable) ─────────────────────────────────
function TransitPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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
    <div ref={ref} style={{ marginBottom: 16, position: "relative" }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
      }}>{window.t("tmap.pick")}</div>
      <button
        onClick={() => setOpen(o => !o)}
        className="picker-trigger"
        style={{
          width: "100%", background: open ? "var(--bg-3)" : "var(--bg-2)",
          border: `1px solid ${open ? "var(--self)" : "var(--panel-border-strong)"}`,
          borderRadius: 10, padding: "10px 12px", color: "var(--fg)", textAlign: "left",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
          fontFamily: "inherit", fontSize: 14,
        }}>
        {country ? (
          <>
            <span style={{ fontSize: 20 }}>{country.flag}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{window.countryName(value)}</span>
            <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{value}</span>
          </>
        ) : (
          <span style={{ color: "var(--fg-mute)" }}>{window.t("picker.select_passport")}</span>
        )}
      </button>
      {open && (
        <div style={{
          marginTop: 6, background: "var(--bg-2)", border: "1px solid var(--panel-border-strong)",
          borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          position: "absolute", left: 0, right: 0, zIndex: 20,
        }}>
          <input autoFocus placeholder={window.t("tmap.search")} value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%", background: "transparent", border: "none",
              borderBottom: "1px solid var(--panel-border)", padding: "10px 12px",
              color: "var(--fg)", fontFamily: "inherit", fontSize: 13, outline: "none",
            }} />
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {list.map(p => {
              const c = window.byIso2[p.iso2];
              const active = p.iso2 === value;
              return (
                <button key={p.iso2} className="dropdown-item"
                  onClick={() => { onChange(p.iso2); setOpen(false); setQ(""); }}
                  style={{
                    width: "100%", background: active ? "rgba(96,165,250,0.10)" : "transparent",
                    border: "none", padding: "9px 12px", color: active ? "var(--self)" : "var(--fg)",
                    textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                  <span style={{ fontSize: 16 }}>{c?.flag}</span>
                  <span style={{ flex: 1 }}>{window.countryName(p.iso2)}</span>
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
    { c: TG_COLOR.free, k: "tmap.legend_free" },
    { c: TG_COLOR.twov, k: "tmap.legend_twov" },
    { c: TG_COLOR.vr,   k: "tmap.legend_vr" },
    { c: "var(--land)", k: "tmap.legend_na" },
  ];
  return (
    <div style={{
      position: "absolute", left: 20, bottom: 20, display: "flex", flexDirection: "column", gap: 6,
      background: "var(--panel)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      border: "1px solid var(--panel-border)", borderRadius: 10, padding: "10px 12px",
      fontSize: 11, color: "var(--fg-dim)", zIndex: 5,
    }}>
      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        {window.t("tmap.legend")}
      </div>
      {items.map(i => (
        <div key={i.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: i.c, border: "1px solid var(--panel-border)" }} />
          <span>{window.t(i.k)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Hover tooltip ──────────────────────────────────────────────────────────
function transitLine(t) {
  if (t.status === "vr") return { label: window.t("tmap.needs_visa"), color: TG_COLOR.vr };
  if (t.status === "twov") return { label: window.t("tmap.twov_ok", { n: t.twovHours }), color: TG_COLOR.twov };
  if (t.status === "free") return { label: window.t("tmap.free_ok"), color: TG_COLOR.free };
  return null;
}

function TransitHover({ hover, passport }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest || !passport) return null;
  const t = window.transitStatusForGlobe(passport, hover.iso2);
  const line = transitLine(t);
  const ofs = 18;
  return (
    <div style={{
      position: "absolute", left: hover.x + ofs, top: hover.y + ofs, pointerEvents: "none",
      background: "var(--panel)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      border: "1px solid var(--panel-border-strong)", borderRadius: 10, padding: "10px 12px",
      minWidth: 180, zIndex: 50, boxShadow: "0 12px 32px rgba(0,0,0,0.4)", fontSize: 13, color: "var(--fg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: line ? 6 : 0 }}>
        <span style={{ fontSize: 18 }}>{dest.flag}</span>
        <strong style={{ fontSize: 14, fontWeight: 600 }}>{window.countryName(hover.iso2)}</strong>
      </div>
      {line ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: line.color, boxShadow: `0 0 8px ${line.color}` }} />
          <span style={{ color: "var(--fg-dim)" }}>{line.label}</span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--fg-mute)" }}>{window.t("tmap.legend_na")}</div>
      )}
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
    <div style={{
      background: "var(--bg-2)", border: "1px solid var(--panel-border-strong)",
      borderRadius: 12, padding: 14, marginBottom: 16, position: "relative",
    }}>
      <button onClick={onClose} aria-label="close" style={{
        position: "absolute", top: 10, right: 10, background: "transparent", border: "none",
        color: "var(--fg-mute)", cursor: "pointer", padding: 2, lineHeight: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingRight: 24 }}>
        <span style={{ fontSize: 30 }}>{dest.flag}</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{window.countryName(iso2)}</div>
      </div>
      {line ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          background: "var(--bg-3)", borderRadius: 8, marginBottom: t.notes ? 10 : 0,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: line.color, boxShadow: `0 0 10px ${line.color}` }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{line.label}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--fg-mute)", marginBottom: 10 }}>{window.t("tmap.legend_na")}</div>
      )}
      {t.exemption && t.exemption.note && (
        <div style={{ fontSize: 11, color: "var(--vf)", lineHeight: 1.45, marginBottom: 8 }}>
          {window.t("tmap.exempt_via", { note: t.exemption.note })}
        </div>
      )}
      {t.notes && (
        <div style={{ fontSize: 11, color: "var(--fg-dim)", lineHeight: 1.5, marginBottom: t.source ? 8 : 0 }}>
          {t.notes}
        </div>
      )}
      {t.source && (
        <a href={t.source} target="_blank" rel="noopener noreferrer" style={{
          fontSize: 11, color: "var(--fg-mute)", textDecoration: "none",
          borderBottom: "1px dotted var(--fg-faint)",
        }}>{window.t("tmap.source")} →</a>
      )}
    </div>
  );
}

// ─── Hub list ───────────────────────────────────────────────────────────────
function TransitHubList({ passport, onOpen }) {
  const hubs = window.COMMON_TRANSIT_HUBS || [];
  // Resolve each hub to a representative ISO2 we can open + colour. SCHENGEN
  // maps to Germany (Frankfurt) as the canonical Schengen hub.
  const repIso = (area) => area === "SCHENGEN" ? "DE" : area;
  const rows = hubs.map(h => {
    const iso = repIso(h.area);
    const t = window.transitStatusForGlobe(passport, iso);
    return { ...h, iso, t, line: transitLine(t) };
  });
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 8,
      }}>{window.t("tmap.hubs")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(r => (
          <button key={r.area} onClick={() => onOpen(r.iso)}
            className="changelog-item"
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 11px", background: "var(--bg-2)",
              border: "1px solid var(--panel-border)", borderRadius: 8,
              color: "var(--fg)", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
            }}>
            <span style={{
              width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
              background: r.line ? r.line.color : "var(--land)",
              boxShadow: r.line ? `0 0 6px ${r.line.color}` : "none",
            }} />
            <span style={{ flex: 1, fontSize: 12 }}>{r.hubLabel}</span>
            <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
              {r.line ? r.line.label : "—"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Layout styles (mirrors app.jsx so the page matches the home shell) ────
const tmStyle = document.createElement("style");
tmStyle.textContent = `
  .layout {
    position: relative; height: 100vh; width: 100vw; display: grid;
    grid-template-columns: 1fr 340px; grid-template-rows: 48px 1fr;
    grid-template-areas: "topbar topbar" "globe panel";
  }
  .topbar {
    grid-area: topbar; position: relative; display: flex; align-items: center; gap: 4px;
    padding: 0 14px; border-bottom: 1px solid var(--panel-border);
    background: var(--panel); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); z-index: 6;
  }
  .topbar .brand {
    display: flex; align-items: center; padding: 0 12px 0 0;
    font-weight: 600; font-size: 15px; color: var(--fg); text-decoration: none;
    white-space: nowrap; font-family: var(--font-mono);
  }
  .topbar-sheet { display: flex; align-items: center; gap: 4px; flex: 1; }
  .topbar .primary-nav { display: flex; gap: 2px; flex: 1; }
  .topbar .primary-nav a {
    padding: 7px 10px; font-size: 13px; color: var(--fg-dim); text-decoration: none;
    border-radius: 6px; white-space: nowrap;
  }
  .topbar .primary-nav a:hover { color: var(--fg); background: var(--bg-3); }
  .topbar .rhs { display: flex; align-items: center; gap: 6px; margin-left: auto; }
  .globe-stage { grid-area: globe; position: relative; overflow: hidden; }
  .panel {
    grid-area: panel; position: relative; padding: 22px 18px 18px 18px;
    background: var(--panel); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid var(--panel-border); overflow-y: auto; display: flex; flex-direction: column; z-index: 2;
  }
  .dropdown-item:hover { background: rgba(96,165,250,0.10) !important; }
  .changelog-item:hover { border-color: var(--panel-border-strong) !important; transform: translateX(2px); }
  .picker-trigger:hover { border-color: var(--self) !important; }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; grid-template-rows: 48px 1fr auto; grid-template-areas: "topbar" "globe" "panel"; }
    .panel { max-height: 50vh; border-left: none; border-top: 1px solid var(--panel-border); }
    .topbar { padding: 0 10px; gap: 6px; }
    .topbar .primary-nav { overflow-x: auto; }
  }
`;
document.head.appendChild(tmStyle);

ReactDOM.createRoot(document.getElementById("root")).render(<TransitMapApp />);

// Transit Map — a standalone globe page (sibling to the home visa globe).
// Paints every country by the airport-transit status for the chosen passport
// (see transitStatusForGlobe in data/transit-visa-rules.js): no visa needed,
// time-limited visa-free transit, ESTA/eTA, airport transit visa, full visa,
// or "not confirmed" where we hold no rule and the passport needs a visa to enter.
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

  // A tapped country must not stay hidden under the peeking mobile sheet.
  const openCountry = (iso2) => {
    setSelected(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
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
      <Masthead theme={theme} onTheme={setTheme} />
      <div className="globe-stage has-key">
        <Globe
          passport={passport}
          mode={mode}
          onView={setMode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          onCountryClick={openCountry}
          focusedCountry={selected}
        />
        <TransitLegend />
      </div>
      <PanelResizer />
      <aside className="panel">
        <MobileSheetHandle />
        <TransitPanelHeader />
        <section className="p-sec">
          <Caption n={1}>{window.t("tmap.pick")}</Caption>
          <TransitPicker value={passport} onChange={(v) => { setPassport(v); setSelected(null); }} />
          {!passport && <div className="box box-dashed p-hint" style={{ marginTop: 10 }}>{window.t("tmap.pick_prompt")}</div>}
        </section>
        {passport && <TransitSchengenSummary passport={passport} onOpen={openCountry} />}
        {passport && selected && (
          <TransitDetail passport={passport} iso2={selected} onClose={() => setSelected(null)} />
        )}
        {passport && <TransitLegChecker passport={passport} onOpen={openCountry} />}
        {passport && <TransitHubList passport={passport} onOpen={openCountry} />}
        <footer className="panel-foot">{window.t("tmap.disclaimer")}</footer>
      </aside>
    </div>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────
function TransitPanelHeader() {
  return (
    <header className="p-head" style={{ display: "block" }}>
      <h1 className="p-head-title">{window.t("tmap.title")}</h1>
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
      <button type="button" className="pp-card" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {country ? (
          <span className="pp-main">
            <span className="flag pp-flag" aria-hidden="true">{country.flag}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="pp-name" style={{ display: "block" }}>{window.countryName(value)}</span>
            </span>
            <IconCaret />
          </span>
        ) : (
          <span className="pp-main"><span className="pp-empty" style={{ flex: 1 }}>{window.t("picker.select_passport")}</span><IconCaret /></span>
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
    { s: "eta", k: "tmap.legend_twov" },
    { s: "ev",  k: "tmap.legend_auth" },
    { s: "voa", k: "tmap.legend_atv" },
    { s: "vr",  k: "tmap.legend_vr" },
    { s: "na",  k: "tmap.legend_unknown" },
  ];
  return (
    <div className="map-key map-key-below overlay-card">
      <div className="map-key-title">{window.t("tmap.legend")}</div>
      <ul>
        {items.map(i => <li key={i.k}><Swatch s={i.s} /><span>{window.t(i.k)}</span></li>)}
      </ul>
    </div>
  );
}

// ─── Hover tooltip ──────────────────────────────────────────────────────────
const AUTH_DOC = { US: "ESTA", CA: "eTA" };
function transitLine(t) {
  if (t.status === "vr") return { label: window.t("tmap.needs_visa"), color: TG_COLOR.vr, s: "vr" };
  if (t.status === "atv") return { label: window.t("tmap.atv"), color: TG_COLOR.atv, s: "voa" };
  if (t.status === "auth") return { label: window.t("tmap.auth", { doc: t.authDoc || AUTH_DOC[t.area] || "ETA" }), color: TG_COLOR.auth, s: "ev" };
  if (t.status === "twov" && !t.twovHours) return { label: window.t("tmap.cond_ok"), color: TG_COLOR.twov, s: "eta" };
  if (t.status === "twov") return { label: window.t("tmap.twov_ok", { n: t.twovHours }), color: TG_COLOR.twov, s: "eta" };
  if (t.status === "free") return { label: window.t("tmap.free_ok"), color: TG_COLOR.free, s: "vf" };
  if (t.status === "unknown") return { label: window.t("tmap.unknown"), color: TG_COLOR.unknown, s: "na" };
  return null;
}

// Why the country has that colour, in one or two plain sentences, plus what
// lifts the requirement. Shared by the detail card and the connection check.
function transitWhy(passport, iso2, t) {
  const country = window.countryName(iso2);
  const out = [];
  if (t.status === "unknown") out.push(window.t(t.unverified ? "tmap.why_unverified" : "tmap.why_unknown", { country }));
  else if (t.generic && t.byEntry) out.push(window.t("tmap.why_entry_free"));
  else if (t.status === "atv" && t.area === "SCHENGEN") out.push(window.t(t.basis === "common" ? "tmap.why_common" : "tmap.why_national", { country }));
  else if (t.status === "atv" && t.area === "GB") out.push(window.t("tmap.why_gb"));
  else if (t.status === "atv") out.push(window.t("tmap.why_list", { country }));
  else if (t.status === "auth" && t.kind !== "visa") out.push(window.t("tmap.why_auth", { doc: t.authDoc || "ETA" }));
  else if (t.status === "auth") { out.push(window.t("tmap.why_no_airside", { country })); out.push(window.t("tmap.why_auth", { doc: t.authDoc || AUTH_DOC[t.area] || "ETA" })); }
  else if (t.status === "vr" && t.kind === "visa") out.push(window.t("tmap.why_no_airside", { country }));
  else if (t.status === "free" && t.byEntry) out.push(window.t("tmap.why_entry_free"));
  else if (t.status === "free" && t.area === "SCHENGEN") out.push(window.t("tmap.why_free_schengen", { country }));
  // A visa-required passport at a Schengen airport: the classic trap is the onward Schengen flight.
  if (t.area === "SCHENGEN" && !t.byEntry && (t.status === "free" || t.status === "atv")) out.push(window.t("tmap.schengen_entry"));
  if (t.condition) out.push(tr("tmap.cond_" + passport + "_" + (t.state || t.area), t.condition));
  return out;
}

function TransitExemptions({ t }) {
  if (t.status !== "atv" || !t.exemptions || !t.exemptions.length) return null;
  return (
    <div className="note note-info">
      <span className="note-k" style={{ fontWeight: 600 }}>{window.t("tmap.exemptions")}</span>
      <ul className="note-s" style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
        {t.exemptions.map((ex, i) => <li key={i}>{tr("tmap.ex_" + ex.key, ex.note)}</li>)}
      </ul>
      {t.area === "SCHENGEN" && <span className="note-s" style={{ display: "block", marginTop: 4 }}>{window.t("tmap.no_uk_visa")}</span>}
    </div>
  );
}

function fmtDay(iso) {
  try { return new Date(iso + "T00:00:00Z").toLocaleDateString(window.ATLAS_LANG || "en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); } catch (e) { return iso; }
}

function TransitSource({ t }) {
  if (!t.source) return null;
  const nat = t.area === "SCHENGEN" && t.basis === "national" && window.SCHENGEN_NATIONAL_ATV;
  return (
    <p className="p-fine" style={{ margin: "6px 0 0" }}>
      <a className="link-quiet" href={t.source} target="_blank" rel="noopener noreferrer">{window.t("tmap.source")} →</a>
      {nat && <span>{" · " + window.t("tmap.checked", { date: fmtDay(nat.checked) })}</span>}
    </p>
  );
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
      {transitWhy(passport, iso2, t).map((x, i) => <p key={i} className="entry-note">{x}</p>)}
      <TransitExemptions t={t} />
      {t.notes && t.area !== "SCHENGEN" && !(t.area === "AU" && t.status === "atv") && !t.byEntry && t.status !== "unknown" && <p className="entry-note">{tr("tmap.note_" + t.area, t.notes)}</p>}
      <TransitSource t={t} />
    </article>
  );
}

// ─── Connection check: three airport codes ────────────────────────────────
function TransitLegChecker({ passport, onOpen }) {
  const [codes, setCodes] = useState({ from: "", via: "", to: "" });
  const A = window.AIRPORTS || {};
  const set = (k) => (e) => setCodes(c => ({ ...c, [k]: e.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3) }));
  const known = (c) => c.length === 3 && !!A[c];
  const place = (c) => (A[c] ? A[c][1] + ", " + window.countryName(A[c][0]) : null);
  const leg = codes.via.length === 3 ? window.transitLeg(passport, codes.from, codes.via, codes.to) : null;
  const t = leg && !leg.error ? leg.status : null;
  const line = t ? transitLine(t) : null;
  const field = (k, label) => (
    <label style={{ flex: "1 1 0", minWidth: 0 }}>
      <span className="p-hint" style={{ display: "block", margin: "0 0 3px" }}>{label}</span>
      <input className="field" value={codes[k]} onChange={set(k)} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck="false"
        maxLength={3} placeholder={{ from: "IST", via: "FRA", to: "JFK" }[k]} style={{ width: "100%", textTransform: "uppercase", letterSpacing: "0.08em" }}
        aria-label={label} />
    </label>
  );
  return (
    <section className="p-sec">
      <Caption n={2}>{window.t("tmap.leg_title")}</Caption>
      <p className="p-hint" style={{ margin: "0 0 8px" }}>{window.t("tmap.leg_hint")}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {field("from", window.t("tmap.leg_from"))}
        {field("via", window.t("tmap.leg_via"))}
        {field("to", window.t("tmap.leg_to"))}
      </div>
      {["from", "via", "to"].map(k => codes[k].length === 3 && !known(codes[k]) && (
        <p key={k} className="p-fine" style={{ margin: "6px 0 0" }}>{codes[k]}: {window.t("tmap.leg_unknown")}</p>
      ))}
      {leg && !leg.error && (
        <div style={{ marginTop: 10 }} aria-live="polite">
          <p className="entry-note" style={{ margin: "0 0 6px" }}>{window.t("tmap.leg_in", { place: leg.via[1], country: window.countryName(leg.viaIso) })}</p>
          {leg.entry ? (
            <div className="note note-info"><span className="note-k" style={{ fontWeight: 500 }}>{window.t("tmap.leg_not_transit", { country: window.countryName(leg.viaIso) })}</span></div>
          ) : (
            <>
              {line && <div className={"note " + (t.status === "vr" || t.status === "atv" ? "note-risk" : t.status === "free" ? "note-ok" : "note-warn")}><span className="note-k" style={{ fontWeight: 600 }}>{line.label}</span></div>}
              {transitWhy(passport, leg.viaIso, t).filter((x) => x !== window.t("tmap.schengen_entry")).map((x, i) => <p key={i} className="entry-note">{x}</p>)}
              {leg.legExemptions.map((ex, i) => (
                <div key={i} className="note note-info"><span className="note-k" style={{ fontWeight: 500 }}>
                  {window.t("tmap.leg_exempt", { country: window.countryName((ex.holds || []).find(h => [leg.fromIso, leg.toIso].includes(String(h).toUpperCase()))) })}
                </span></div>
              ))}
              {t.status === "twov" && leg.thirdCountry !== null && (
                <p className="entry-note">{window.t("tmap.leg_third", { answer: window.t(leg.thirdCountry ? "tmap.leg_yes" : "tmap.leg_no") })}</p>
              )}
              {t.notes && t.area !== "SCHENGEN" && !(t.area === "AU" && t.status === "atv") && !t.byEntry && t.status !== "unknown" && <p className="entry-note">{tr("tmap.note_" + t.area, t.notes)}</p>}
            </>
          )}
          <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => onOpen(leg.viaIso)}>
            {window.t("tmap.leg_open", { country: window.countryName(leg.viaIso) })}
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Schengen summary: where this passport needs an airport transit visa ───
// The most common mistake: "Schengen" is not one rule. The EU-wide list covers
// every state, national lists add single states (Annex 7B).
function TransitSchengenSummary({ passport, onOpen }) {
  const S = window.ETIAS && window.ETIAS.schengenStates;
  if (!S || !window.schengenAtvFor) return null;
  const entry = window.resolveStatus ? (window.resolveStatus(passport, "DE") || {}).status : null;
  if (S.includes(passport) || entry === "vf" || entry === "idc" || entry === "self") return null; // can enter anyway
  const all = window.schengenAtvFor(passport);
  // Cyprus keeps its own list but is not in Schengen: the map shows it, this summary does not.
  const states = all.needs ? [] : (all.states || []).filter(x => S.includes(x) && x !== "CY")
    .sort((a, b) => window.countryName(a).localeCompare(window.countryName(b)));
  return (
    <section className="p-sec">
      <div className={"note " + (all.needs || states.length ? "note-warn" : "note-ok")}>
        <span className="note-k" style={{ fontWeight: 600 }}>{window.t("tmap.schengen_title")}</span>
        <span className="note-s">
          {all.needs ? window.t("tmap.atv_common")
            : states.length ? <>{window.t("tmap.atv_states", { list: "\u0001" }).split("\u0001")[0]}
                {states.map((x, i) => <React.Fragment key={x}>{i ? ", " : ""}<button type="button" className="link-quiet" style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "inherit" }} onClick={() => onOpen(x)}>{window.countryName(x)}</button></React.Fragment>)}{window.t("tmap.atv_states", { list: "\u0001" }).split("\u0001")[1]}</>
            : window.t("tmap.atv_none")}
        </span>
        <span className="note-s" style={{ display: "block", marginTop: 4 }}>{window.t("tmap.schengen_entry")}</span>
      </div>
    </section>
  );
}

// ─── Hub list ───────────────────────────────────────────────────────────────
function TransitHubList({ passport, onOpen }) {
  const hubs = window.COMMON_TRANSIT_HUBS || [];
  // Schengen hubs carry their state: the airport transit visa lists differ by state.
  const rows = hubs.map(h => {
    const iso = h.state || h.area;
    const t = window.transitStatusForGlobe(passport, iso);
    // Hubs named after a whole country ("United States", "Singapore") follow the interface language.
    const c = window.byIso2[iso];
    // City hubs follow the interface language too ("London" → "Londra"); the English name is the fallback.
    const hubLabel = c && h.hubLabel === c.name.replace(/\s*\(.*\)$/, "") ? window.countryName(iso) : tr("hub." + iso, h.hubLabel);
    return { ...h, hubLabel, iso, t, line: transitLine(t) };
  });
  return (
    <section className="p-sec">
      <Caption n={3}>{window.t("tmap.hubs")}</Caption>
      <ul className="ledger">
        {rows.map(r => (
          <li key={r.iso}>
            <button type="button" className="lg-row" onClick={() => onOpen(r.iso)}>
              {r.line ? <Swatch s={r.line.s} /> : <span className="sw sw-all" aria-hidden="true" />}
              <span className="lg-label" style={{ whiteSpace: "normal" }}>{r.hubLabel}</span>
              <span className="lg-dots" />
              <span className="lg-n" style={{ fontSize: 12, color: "var(--ink-2)", textAlign: "end" }}>{r.line ? r.line.label : (r.iso === passport ? tr("tmap.home_hub", "Your own country") : "-")}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<TransitMapApp />);

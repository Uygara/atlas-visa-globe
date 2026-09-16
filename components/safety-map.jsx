// Travel Safety Map (beta) — a standalone globe page, sibling to the visa and
// transit maps. Paints every country by its government travel-advisory level
// (data/travel-advisories.js, built by backend/fetch-advisories.js from the U.S.
// State Department and Government of Canada feeds): 1 normal precautions →
// 4 do not travel, using the stricter of the two sources. Clicking a country
// shows both sources side by side with their named risks and dates.
//
// Reuses components/globe.jsx via `fillResolver` + `hoverRenderer`, and the
// shared masthead / sheet / controls from components/chrome.jsx.

const { useState, useEffect, useMemo, useCallback } = React;

const ADVISORIES = window.TRAVEL_ADVISORIES || { countries: {}, sources: {} };
const LEVEL_COLOR = { 0: "var(--land)", 1: "var(--vf)", 2: "var(--ev)", 3: "var(--voa)", 4: "var(--vr)" };

function advisoryFor(iso2) {
  return ADVISORIES.countries[iso2] || null;
}
const levelLabel = (n) => tr("safety.l" + (n || 0), ["No advisory data", "Normal precautions", "Increased caution", "Reconsider travel", "Do not travel"][n || 0]);

function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString(window.ATLAS_LANG || "en", { day: "numeric", month: "short", year: "numeric" });
}

function SafetyMapApp() {
  const [mode, setModeState] = useState(readView);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(0); // 0 = all levels
  const [theme, setTheme] = useSiteTheme();
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };

  useEffect(() => {
    const el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, []);

  const fillResolver = useCallback((iso2) => {
    const a = advisoryFor(iso2);
    const level = a ? a.level : 0;
    if (filter && level !== filter) return { color: "var(--land)" };
    return { color: LEVEL_COLOR[level] };
  }, [filter]);

  const hoverRenderer = useCallback((hover) => <SafetyHover hover={hover} />, []);

  const open = (iso2) => {
    setSelected(iso2);
    if (window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(() => document.querySelector(".panel")?.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  return (
    <div className="layout">
      <Masthead view={mode} onView={setMode} theme={theme} onTheme={setTheme} />
      <div className="globe-stage">
        <Globe
          passport={null}
          mode={mode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          onCountryClick={open}
          focusedCountry={selected}
        />
        <SafetyLegend />
      </div>
      <aside className="panel">
        <MobileSheetHandle />
        <header className="p-head" style={{ display: "block" }}>
          <div className="p-head-title">
            {tr("safety.title", "Travel Safety Map")}{" "}
            <span className="stamp is-small" style={{ "--st": "var(--foil)", verticalAlign: "middle", marginLeft: 6 }}>
              <span className="stamp-k" style={{ fontSize: 12 }}>{tr("safety.draft", "Beta")}</span>
            </span>
          </div>
          <p className="p-head-sub">{tr("safety.subtitle", "Official government travel advisories on one map.")}</p>
        </header>

        <section className="p-sec">
          <SafetySearch onPick={open} />
        </section>

        {selected && <SafetyDetail iso2={selected} onClose={() => setSelected(null)} />}

        <section className="p-sec">
          <Caption n={1}>{tr("safety.levels", "Countries by level")}</Caption>
          <LevelLedger filter={filter} setFilter={setFilter} />
          <p className="p-fine" style={{ marginTop: 6 }}>{tr("safety.stricter_note", "Coloured by the stricter of the two governments.")}</p>
        </section>

        <section className="p-sec">
          <Caption n={2}>{tr("safety.do_not_travel", "Do not travel ({n})", { n: countAt(4) })}</Caption>
          <div className="chips">
            {countriesAt(4).map(iso2 => (
              <button key={iso2} type="button" className={"chip" + (iso2 === selected ? " is-on" : "")} onClick={() => open(iso2)}>
                <span className="flag">{window.byIso2[iso2]?.flag}</span>{window.countryName(iso2)}
              </button>
            ))}
          </div>
        </section>

        <footer className="panel-foot">
          <div>{tr("safety.disclaimer", "")}</div>
        </footer>
      </aside>
    </div>
  );
}

// ─── Level counts ─────────────────────────────────────────────────────────
// Only countries the map can draw (window.byIso2) — the feeds also cover small
// territories that have no shape on the 110m world map.
function countriesAt(level) {
  return Object.entries(ADVISORIES.countries)
    .filter(([iso2, a]) => a.level === level && window.byIso2[iso2])
    .map(([iso2]) => iso2)
    .sort((a, b) => window.countryName(a).localeCompare(window.countryName(b), window.ATLAS_LANG || "en"));
}
function countAt(level) { return countriesAt(level).length; }

function LevelLedger({ filter, setFilter }) {
  const rows = [1, 2, 3, 4].map(n => ({ n, count: countAt(n) }));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <ul className="ledger">
      <li>
        <button type="button" className="lg-row" aria-pressed={filter === 0} onClick={() => setFilter(0)}>
          <span className="sw sw-all" aria-hidden="true" />
          <span className="lg-label">{tr("tally.filter_all", "All")}</span>
          <span className="lg-dots" />
          <span className="lg-n">{total}</span>
        </button>
      </li>
      {rows.map(r => (
        <li key={r.n}>
          <button type="button" className="lg-row" aria-pressed={filter === r.n} onClick={() => setFilter(filter === r.n ? 0 : r.n)}>
            <span className="sw" style={{ "--sw": LEVEL_COLOR[r.n] }} aria-hidden="true" />
            <span className="lg-label">{r.n} · {levelLabel(r.n)}</span>
            <span className="lg-dots" />
            <span className="lg-n">{r.count}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Legend over the globe ────────────────────────────────────────────────
function SafetyLegend() {
  return (
    <div className="map-key overlay-card">
      <div className="map-key-title">{tr("safety.legend", "Advisory level")}</div>
      <ul>
        {[1, 2, 3, 4].map(n => (
          <li key={n}><span className="sw" style={{ "--sw": LEVEL_COLOR[n] }} /><span>{levelLabel(n)}</span></li>
        ))}
      </ul>
    </div>
  );
}

// ─── Hover ────────────────────────────────────────────────────────────────
function SafetyHover({ hover }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  const a = advisoryFor(hover.iso2);
  const level = a ? a.level : 0;
  return (
    <div className="hovercard overlay-card" style={{ left: hover.x + 18, top: hover.y + 18 }}>
      <div className="hovercard-title"><span className="flag">{dest.flag}</span><span>{window.countryName(hover.iso2)}</span></div>
      <div className="hovercard-row">
        <span className="dot" style={{ "--sw": LEVEL_COLOR[level] }} />
        <span>{level ? `${level} · ${levelLabel(level)}` : levelLabel(0)}</span>
      </div>
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────
function SafetySearch({ onPick }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const ql = q.toLowerCase().trim();
    if (!ql) return [];
    return window.COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(ql) || window.countryName(c.iso2).toLowerCase().includes(ql)
    ).slice(0, 6);
  }, [q]);
  return (
    <div>
      <div className="search">
        <IconSearch />
        <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tr("safety.search", "Search a country…")} aria-label={tr("safety.search", "Search a country…")} />
      </div>
      {results.length > 0 && (
        <div className="dd">
          {results.map(c => {
            const a = advisoryFor(c.iso2);
            const level = a ? a.level : 0;
            return (
              <button key={c.iso2} type="button" className="dd-item" onClick={() => { onPick(c.iso2); setQ(""); }}>
                <span className="flag">{c.flag}</span>
                <span className="dd-grow">{window.countryName(c.iso2)}</span>
                <span className="dd-code">{level ? levelLabel(level) : "—"}</span>
                <span className="dot" style={{ "--sw": LEVEL_COLOR[level] }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Detail card ──────────────────────────────────────────────────────────
function SafetyDetail({ iso2, onClose }) {
  const dest = window.byIso2[iso2];
  const a = advisoryFor(iso2);
  if (!dest) return null;
  const level = a ? a.level : 0;
  const regional = a && ((a.us && a.us.regional) || (a.ca && a.ca.regional));
  const disagree = a && a.us && a.ca && a.us.level !== a.ca.level;
  return (
    <article className="entry">
      <div className="entry-top">
        <span className="flag entry-flag" aria-hidden="true">{dest.flag}</span>
        <div style={{ minWidth: 0 }}><div className="entry-name">{window.countryName(iso2)}</div></div>
        <div className="entry-actions">
          <button type="button" className="icon-btn" onClick={onClose} aria-label={tr("detail.close", "Close")}><IconClose /></button>
        </div>
      </div>
      <div className="entry-verdict">
        <div className="stamp" style={{ "--st": level ? LEVEL_COLOR[level] : "var(--ink-3)" }}>
          <span className="stamp-k">{levelLabel(level)}</span>
          {level > 0 && <span className="stamp-s">{tr("safety.level_n", "Level {n}", { n: level })} / 4</span>}
        </div>
      </div>
      {regional && <div className="note note-warn"><span className="note-k" style={{ fontWeight: 500 }}>{tr("safety.regional", "")}</span></div>}
      {disagree && <div className="note note-info"><span className="note-k" style={{ fontWeight: 500 }}>{tr("safety.disagree", "")}</span></div>}
      <SourceRow label={tr("safety.us", "U.S. State Department")} src={a && a.us}>
        {a && a.us && a.us.risks.length > 0 && (
          <div className="chips" style={{ marginTop: 6 }} aria-label={tr("safety.why", "Named risks")}>
            {a.us.risks.map(r => <span key={r} className="chip" style={{ cursor: "default" }}>{tr("safety.risk." + r, r)}</span>)}
          </div>
        )}
      </SourceRow>
      <SourceRow label={tr("safety.ca", "Government of Canada")} src={a && a.ca}>
        {/* The feed's own wording is English-only; other languages get the level label above. */}
        {a && a.ca && a.ca.text && (window.ATLAS_LANG || "en") === "en" && <div className="p-hint" style={{ margin: "4px 0 0" }}>“{a.ca.text}”</div>}
      </SourceRow>
    </article>
  );
}

function SourceRow({ label, src, children }) {
  return (
    <div className="box" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ fontSize: 13.5 }}>{label}</strong>
        {src && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
            <span className="dot" style={{ "--sw": LEVEL_COLOR[src.level] }} />
            {tr("safety.level_n", "Level {n}", { n: src.level })}
          </span>
        )}
      </div>
      {src ? (
        <>
          <div className="p-hint" style={{ margin: "2px 0 0" }}>{levelLabel(src.level)}</div>
          {children}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
            <span className="p-fine">{tr("safety.updated", "updated {date}", { date: fmtDate(src.updated) })}</span>
            <a className="link-quiet" href={src.url} target="_blank" rel="noopener noreferrer">{tr("safety.read_full", "Full advisory")} ↗</a>
          </div>
        </>
      ) : (
        <div className="p-fine" style={{ marginTop: 4 }}>{tr("safety.no_source", "No advisory from this source.")}</div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SafetyMapApp />);

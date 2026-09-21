// Travel Safety Map (beta) — a standalone globe page, sibling to the visa and
// transit maps. Every country is painted by its government travel-advisory
// level (1 normal precautions → 4 do not travel), using the strictest of the
// UK FCDO, U.S. State Department and Government of Canada; pick a country and
// its provinces are drawn on top, so a warning about one border province is
// not smeared over the whole country.
//
// Deliberately NOT the visa palette: green means "visa-free" two tabs away, so
// the safety ramp is one ink in four strengths (tokens --risk1…--risk4).
//
// Data: data/travel-advisories.js (backend/fetch-advisories.js) and, per
// country on demand, data/admin1/<ISO2>.json (tools/build-admin1.js).

const { useState, useEffect, useMemo, useCallback, useRef } = React;

const ADVISORIES = window.TRAVEL_ADVISORIES || { countries: {}, sources: {} };
const ADMIN1_INDEX_URL = "/data/admin1/index.json";
const LEVEL_COLOR = { 0: "var(--na)", 1: "var(--risk1)", 2: "var(--risk2)", 3: "var(--risk3)", 4: "var(--risk4)" };
// A source older than this is shown as stale — the US reissues some advisories
// only once a year, and a 2025 date must not look like today's news.
const STALE_DAYS = 180;
const SOURCE_ORDER = ["uk", "us", "ca"];
const EVENT_LABEL = {
  earthquake: "safety.event.earthquake", storm: "safety.event.storm", flood: "safety.event.flood",
  volcano: "safety.event.volcano", wildfire: "safety.event.wildfire", drought: "safety.event.drought",
};

function advisoryFor(iso2) { return ADVISORIES.countries[iso2] || null; }
const levelLabel = (n) => tr("safety.l" + (n || 0), ["No advisory data", "Normal precautions", "Increased caution", "Reconsider travel", "Do not travel"][n || 0]);

function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString(window.ATLAS_LANG || "en", { day: "numeric", month: "short", year: "numeric" });
}
function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00").getTime();
  return isNaN(d) ? null : Math.floor((Date.now() - d) / 86400000);
}
// "3 gün önce" / "13 ay önce" — the freshness signal, not just a date.
function ago(iso) {
  const days = daysSince(iso);
  if (days == null) return "";
  if (days <= 0) return tr("safety.today", "today");
  if (days === 1) return tr("safety.yesterday", "yesterday");
  if (days < 30) return tr("safety.days_ago", "{n} days ago", { n: days });
  const months = Math.round(days / 30.4);
  if (months < 24) return tr("safety.months_ago", "{n} months ago", { n: months });
  return tr("safety.years_ago", "{n} years ago", { n: Math.round(days / 365) });
}

function SafetyMapApp() {
  const [mode, setModeState] = useState(readView);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(0); // 0 = all levels
  const [theme, setTheme] = useSiteTheme();
  const [regions, setRegions] = useState(null); // { iso2, features }
  const [regionNames, setRegionNames] = useState({});
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };

  useEffect(() => {
    const el = document.getElementById("loading");
    if (el) el.classList.add("hidden");
  }, []);

  // Province names for the warnings list (small file, fetched once).
  useEffect(() => {
    let alive = true;
    fetch(ADMIN1_INDEX_URL).then(r => r.json()).then(j => { if (alive) setRegionNames(j); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Province outlines for the selected country, fetched on demand — for EVERY
  // country, not just the ones an advisory names by region: seeing the country
  // break into its provinces is how you know whether a warning is local or not.
  const loadedFor = useRef(null);
  useEffect(() => {
    if (!selected) { setRegions(null); loadedFor.current = null; return; }
    if (loadedFor.current === selected) return;
    loadedFor.current = selected;
    let alive = true;
    fetch(`/data/admin1/${selected}.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("no boundaries"))))
      .then(topo => {
        if (!alive || loadedFor.current !== selected) return;
        const key = Object.keys(topo.objects)[0];
        setRegions({ iso2: selected, features: topojson.feature(topo, topo.objects[key]).features });
      })
      .catch(() => { if (alive) setRegions(null); });
    return () => { alive = false; };
  }, [selected]);

  const fillResolver = useCallback((iso2) => {
    const a = advisoryFor(iso2);
    const level = a ? a.level : 0;
    if (filter && level !== filter) return { color: "var(--land)" };
    return { color: LEVEL_COLOR[level] };
  }, [filter]);

  // Provinces named in an advisory take its level; the rest keep the country's
  // own level, so the warned areas stand out inside their own country.
  const regionLevels = useMemo(() => {
    const a = selected && advisoryFor(selected);
    const map = {};
    for (const r of (a && a.regions) || []) map[r.id] = r.level;
    return map;
  }, [selected]);
  const countryLevel = selected && advisoryFor(selected) ? advisoryFor(selected).level : 0;

  const regionFill = useCallback((f) => {
    const id = f.properties && f.properties.id;
    return LEVEL_COLOR[regionLevels[id] || countryLevel || 0];
  }, [regionLevels, countryLevel]);

  const hoverRenderer = useCallback((hover) => <SafetyHover hover={hover} />, []);

  const open = (iso2) => {
    setSelected(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
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
          regionFeatures={regions && regions.iso2 === selected ? regions.features : null}
          regionFill={regionFill}
        />
        <SafetyLegend />
      </div>
      <aside className="panel">
        <MobileSheetHandle />
        <header className="p-head" style={{ display: "block" }}>
          <div className="p-head-title">
            {tr("safety.title", "Travel Safety Map")}{" "}
            <span className="stamp is-small" style={{ "--st": "var(--foil)", verticalAlign: "middle", marginInlineStart: 6 }}>
              <span className="stamp-k" style={{ fontSize: 12 }}>{tr("safety.draft", "Beta")}</span>
            </span>
          </div>
          <p className="p-head-sub">{tr("safety.subtitle", "Official government travel advisories on one map.")}</p>
        </header>

        <section className="p-sec">
          <SafetySearch onPick={open} />
        </section>

        {selected && <SafetyDetail iso2={selected} names={regionNames} onClose={() => setSelected(null)} />}

        <section className="p-sec">
          <Caption n={1}>{tr("safety.levels", "Countries by level")}</Caption>
          <LevelLedger filter={filter} setFilter={setFilter} />
          <p className="p-fine" style={{ marginTop: 6 }}>{tr("safety.stricter_note", "Coloured by the strictest of the three governments.")}</p>
        </section>

        <section className="p-sec">
          <Caption n={2}>{tr("safety.recent", "Updated in the last week")}</Caption>
          <RecentlyUpdated onOpen={open} />
        </section>

        <section className="p-sec">
          <Caption n={3}>{tr("safety.do_not_travel", "Do not travel ({n})", { n: countAt(4) })}</Caption>
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

// Countries whose advice changed in the last seven days — the "what is going on
// right now" list (protests, strikes, fires, border closures as the issuing
// government describes them).
function RecentlyUpdated({ onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => {
    const out = [];
    for (const [iso2, c] of Object.entries(ADVISORIES.countries)) {
      if (!window.byIso2[iso2] || !c.uk || !c.uk.updates || !c.uk.updates.length) continue;
      const latest = c.uk.updates[0];
      if ((daysSince(latest.date) ?? 999) > 7) continue;
      out.push({ iso2, date: latest.date, note: latest.note, level: c.level });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, []);
  if (!rows.length) return <p className="p-fine" style={{ margin: 0 }}>{tr("safety.recent_none", "No advisory changed in the last week.")}</p>;
  const shown = expanded ? rows : rows.slice(0, 5);
  return (
    <div>
      <div className="feed">
        {shown.map(r => (
          <button key={r.iso2} type="button" className="feed-item" style={{ "--tone": LEVEL_COLOR[r.level], textAlign: "start", width: "100%", cursor: "pointer" }} onClick={() => onOpen(r.iso2)}>
            <div className="feed-meta">
              <time dateTime={r.date}>{fmtDate(r.date)}</time>
              <span>·</span>
              <span className="flag">{window.byIso2[r.iso2]?.flag}</span>
              <span>{window.countryName(r.iso2)}</span>
            </div>
            <div className="feed-sum" dir="auto">{r.note}</div>
          </button>
        ))}
      </div>
      {rows.length > 5 && (
        <button type="button" className="more-btn" onClick={() => setExpanded(v => !v)}>
          {expanded ? tr("changelog.show_less", "Show less") : tr("tally.show_all", "Show all {n}", { n: rows.length })}
        </button>
      )}
    </div>
  );
}

// ─── Legend over the globe ────────────────────────────────────────────────
function SafetyLegend() {
  return (
    <div className="map-key overlay-card">
      <div className="map-key-title">{tr("safety.legend", "Advisory level")}</div>
      <ul>
        {[1, 2, 3, 4].map(n => (
          <li key={n}>
            <span className="sw" style={{ "--sw": LEVEL_COLOR[n] }} />
            <span><span className="mono" style={{ color: "var(--ink-3)" }}>{n}</span> {levelLabel(n)}</span>
          </li>
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
      {a && a.regions && a.regions.length > 0 && (
        <div className="hovercard-row hovercard-cap">{tr("safety.has_regions", "Some regions are worse — tap to see them")}</div>
      )}
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
function SafetyDetail({ iso2, names, onClose }) {
  const dest = window.byIso2[iso2];
  const a = advisoryFor(iso2);
  if (!dest) return null;
  const level = a ? a.level : 0;
  const regionName = (id) => {
    const list = names[iso2] || [];
    const hit = list.find(u => u.id === id);
    return hit ? hit.nm : id;
  };
  const regions = (a && a.regions) || [];
  const notes = (a && a.regionNotes) || [];
  const events = (a && a.events) || [];
  const updates = (a && a.uk && a.uk.updates) || [];
  const disagree = a && a.uk && a.us && a.ca &&
    (Math.max(a.uk.level, a.us.level, a.ca.level) - Math.min(a.uk.level, a.us.level, a.ca.level) >= 2);

  return (
    <article className="entry">
      <div className="entry-top">
        <span className="flag entry-flag" aria-hidden="true">{dest.flag}</span>
        <div style={{ minWidth: 0 }}>
          <div className="entry-name">{window.countryName(iso2)}</div>
          {a && a.updated && <div className="entry-sub">{tr("safety.updated_ago", "Updated {ago}", { ago: ago(a.updated) })}</div>}
        </div>
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

      {disagree && <div className="note note-info"><span className="note-k" style={{ fontWeight: 500 }}>{tr("safety.disagree", "")}</span></div>}

      {/* Regions, the part a country-level colour hides. */}
      {regions.length === 0 && notes.length === 0 && (
        <p className="p-fine" style={{ margin: "0 0 12px" }}>{tr("safety.regions_none", "No region of this country carries its own warning — the provinces on the map all sit at the country's level.")}</p>
      )}
      {(regions.length > 0 || notes.length > 0) && (
        <div style={{ marginBottom: 12 }}>
          <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>
            {tr("safety.regions_title", "Inside the country")}
          </div>
          {regions.length > 0 && (
            <ul className="ledger" style={{ marginBottom: notes.length ? 8 : 0 }}>
              {regions.map(r => (
                <li key={r.id}>
                  <div className="lg-row" style={{ cursor: "default" }}>
                    <span className="sw" style={{ "--sw": LEVEL_COLOR[r.level] }} aria-hidden="true" />
                    <span className="lg-label" style={{ whiteSpace: "normal" }}>{regionName(r.id)}</span>
                    <span className="lg-dots" />
                    <span className="lg-n" style={{ fontSize: 11.5, color: "var(--ink-2)", textAlign: "end" }}>{levelLabel(r.level)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {notes.map((n, i) => (
            <div key={i} className="box box-dashed p-fine" style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--ink-2)" }}>{levelLabel(n.level)}:</strong> {n.text}
            </div>
          ))}
          <p className="p-fine" style={{ margin: "4px 0 0" }}>{tr("safety.regions_note", "Shaded on the map. Areas described only in words (\"within 10km of the border\") cannot be drawn — read the full advisory.")}</p>
        </div>
      )}

      {/* What is happening now. */}
      {events.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{tr("safety.events_title", "Active alerts")}</div>
          {events.map((e, i) => (
            <a key={i} className={"note " + (e.level === "red" ? "note-risk" : "note-warn")} href={e.url} target="_blank" rel="noopener noreferrer">
              <span className="note-k">{tr(EVENT_LABEL[e.type] || "safety.event.other", e.type)}{e.name ? " — " + e.name : ""}</span>
              <span className="note-s">{tr("safety.event_since", "since {date}", { date: fmtDate(e.from) })} · GDACS</span>
              <span className="note-go" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      )}

      {updates.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{tr("safety.updates_title", "Recent official updates")}</div>
          <div className="feed">
            {updates.slice(0, 4).map((u, i) => (
              <div key={i} className="feed-item" style={{ "--tone": "var(--rule-strong)" }}>
                <div className="feed-meta"><time dateTime={u.date}>{fmtDate(u.date)}</time><span>·</span><span>UK FCDO</span></div>
                <div className="feed-sum" dir="auto">{u.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {SOURCE_ORDER.map(key => <SourceRow key={key} k={key} src={a && a[key]} />)}
    </article>
  );
}

function SourceRow({ k, src }) {
  const label = tr("safety." + k, { uk: "UK FCDO", us: "U.S. State Department", ca: "Government of Canada" }[k]);
  const stale = src && (daysSince(src.updated) ?? 0) > STALE_DAYS;
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
          {k === "us" && src.risks && src.risks.length > 0 && (
            <div className="chips" style={{ marginTop: 6 }} aria-label={tr("safety.why", "Named risks")}>
              {src.risks.map(r => <span key={r} className="chip" style={{ cursor: "default" }}>{tr("safety.risk." + r, r)}</span>)}
            </div>
          )}
          {k === "uk" && src.change && <div className="p-hint" style={{ margin: "6px 0 0" }}>{src.change}</div>}
          {k === "ca" && src.change && <div className="p-hint" style={{ margin: "6px 0 0" }}>{src.change}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8, alignItems: "baseline" }}>
            <span className={"p-fine" + (stale ? " is-stale" : "")}>
              {ago(src.updated)}{stale ? " · " + tr("safety.stale", "not revised recently") : ""}
            </span>
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

// Climate map — a standalone globe page next to the visa, transit and safety
// maps. Pick a month and every country is painted by its typical weather in
// that month: the daytime high (default) or the rainfall. It answers "when is a
// good time to go", so it shows long-term averages (1991–2020), not a forecast.
//
// The globe also shades the night side live, so you can see where it is day.
//
// Data: data/climate.js (backend/fetch-climate.js) — World Bank Climate Change
// Knowledge Portal, ERA5 1991–2020, one area average per country. A country
// average hides the difference between a coast and a mountain range, so big or
// varied countries carry a note saying so.

const { useState, useEffect, useMemo, useCallback } = React;

const CLIMATE = window.CLIMATE || { countries: {} };
// Northern Cyprus shares the island (and its weather) with the Republic of Cyprus.
const ALIAS = { XN: "CY" };
const climateOf = (iso2) => CLIMATE.countries[iso2] || CLIMATE.countries[ALIAS[iso2]] || null;

// Daytime high, °C. Upper bounds of each band; the last band is open.
const T_BANDS = [0, 10, 18, 24, 30, 35, Infinity];
const T_COLOR = ["var(--cl-t1)", "var(--cl-t2)", "var(--cl-t3)", "var(--cl-t4)", "var(--cl-t5)", "var(--cl-t6)", "var(--cl-t7)"];
const T_LABEL = ["below 0°", "0–10°", "10–18°", "18–24°", "24–30°", "30–35°", "above 35°"];
// Rain, mm in the month.
const P_BANDS = [25, 60, 120, 200, Infinity];
const P_COLOR = ["var(--cl-p1)", "var(--cl-p2)", "var(--cl-p3)", "var(--cl-p4)", "var(--cl-p5)"];
const P_LABEL = ["under 25 mm", "25–60 mm", "60–120 mm", "120–200 mm", "over 200 mm"];
const band = (v, bands) => bands.findIndex(b => v < b);

// "Pleasant for sightseeing": a plain rule, written on the page.
const GOOD_HI = [18, 30], GOOD_PR = 100;
const isGood = (c, m) => c && c.hi[m] >= GOOD_HI[0] && c.hi[m] <= GOOD_HI[1] && c.pr[m] < GOOD_PR;

// Countries where one average hides very different climates (size, altitude or
// a long north–south spread).
const VARIED = new Set(["RU", "CA", "US", "CN", "BR", "AU", "IN", "AR", "KZ", "DZ", "CD", "SA", "MX", "ID", "SD", "LY", "IR", "MN", "PE", "CL", "TR", "ZA", "NO", "JP", "IT", "FR", "ES", "PK", "AF", "NP", "BO", "CO", "EC", "ET", "KE", "TZ", "MA", "VN", "MM", "TH", "PH", "NZ", "GB", "SE", "FI", "UA", "EG", "NG", "AO", "ML", "NE", "TD", "MR", "VE", "PG"]);

function monthName(m, style) {
  const lang = window.ATLAS_LANG || "en";
  try { return new Date(2021, m, 1).toLocaleDateString(lang, { month: style || "long" }); }
  catch (e) { return String(m + 1); }
}
function readParams() {
  const p = new URLSearchParams(location.search);
  const m = parseInt(p.get("m"), 10);
  const c = (p.get("c") || "").toUpperCase();
  return {
    month: m >= 1 && m <= 12 ? m - 1 : new Date().getMonth(),
    country: window.byIso2 && window.byIso2[c] ? c : null,
    view: p.get("v") === "rain" ? "rain" : "temp",
  };
}
function writeParams(month, country, view) {
  const p = new URLSearchParams();
  p.set("m", String(month + 1));
  if (view === "rain") p.set("v", "rain");
  if (country) p.set("c", country);
  try { history.replaceState(null, "", location.pathname + "?" + p.toString()); } catch (e) {}
}
function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
}

function ClimateMapApp() {
  const init = useMemo(readParams, []);
  const [mode, setModeState] = useState(readView);
  const [month, setMonth] = useState(init.month);
  const [view, setView] = useState(init.view);
  const [selected, setSelected] = useState(init.country);
  const [theme, setTheme] = useSiteTheme();
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };
  useEffect(() => { const el = document.getElementById("loading"); if (el) el.classList.add("hidden"); }, []);
  useEffect(() => { writeParams(month, selected, view); }, [month, selected, view]);

  const fillResolver = useCallback((iso2) => {
    const c = climateOf(iso2);
    if (!c) return { color: "var(--na)" };
    return view === "rain"
      ? { color: P_COLOR[band(c.pr[month], P_BANDS)] }
      : { color: T_COLOR[band(c.hi[month], T_BANDS)] };
  }, [month, view]);

  const hoverRenderer = useCallback((hover) => <ClimateHover hover={hover} month={month} />, [month]);

  const open = (iso2) => {
    setSelected(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
    if (window.matchMedia("(max-width: 900px)").matches) {
      requestAnimationFrame(() => document.querySelector(".panel")?.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  return (
    <div className="layout">
      <Masthead theme={theme} onTheme={setTheme} />
      <div className="globe-stage has-key">
        <Globe
          passport={null}
          mode={mode}
          onView={setMode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          onCountryClick={open}
          focusedCountry={selected}
          nightShade
          keepSpinning
        />
        <ClimateLegend view={view} />
      </div>
      <PanelResizer />
      <aside className="panel">
        <MobileSheetHandle />
        <header className="p-head" style={{ display: "block" }}>
          <h1 className="p-head-title">{tr("clim.title", "Climate map")}</h1>
          <p className="p-head-sub">{tr("clim.subtitle", "The usual weather in every country, month by month. Long-term averages, not a forecast.")}</p>
        </header>

        <section className="p-sec">
          <Caption n={1}>{tr("clim.pick_month", "Month")}</Caption>
          <div className="cl-months" role="group" aria-label={tr("clim.pick_month", "Month")}>
            {Array.from({ length: 12 }, (_, m) => (
              <button key={m} type="button" className="cl-month" aria-pressed={m === month} onClick={() => setMonth(m)}>
                {monthName(m, "short")}
              </button>
            ))}
          </div>
          <div className="seg cl-view" role="group" aria-label={tr("clim.show", "Show")}>
            <button type="button" aria-pressed={view === "temp"} onClick={() => setView("temp")}>{tr("clim.view_temp", "Daytime high")}</button>
            <button type="button" aria-pressed={view === "rain"} onClick={() => setView("rain")}>{tr("clim.view_rain", "Rain")}</button>
          </div>
        </section>

        <section className="p-sec">
          <ClimateSearch onPick={open} month={month} />
        </section>

        {selected && <ClimateDetail iso2={selected} month={month} setMonth={setMonth} onClose={() => setSelected(null)} />}

        <section className="p-sec">
          <Caption n={2}>{tr("clim.good_in", "Pleasant in {month}", { month: monthName(month) })}</Caption>
          <GoodList month={month} selected={selected} onOpen={open} />
          <p className="p-fine" style={{ marginTop: 6 }}>{tr("clim.good_rule", "Daytime high between 18° and 30° and under 100 mm of rain in the month.")}</p>
        </section>

        <footer className="panel-foot">
          <div>
            {tr("clim.source", "Monthly averages for 1991–2020, one value per country.")}{" "}
            <a href={CLIMATE.sourceUrl || "https://climateknowledgeportal.worldbank.org/"} target="_blank" rel="noopener">World Bank Climate Change Knowledge Portal</a> (ERA5, CC BY 4.0).{" "}
            {tr("clim.disclaimer", "Check the forecast before you travel.")}
          </div>
        </footer>
      </aside>
    </div>
  );
}

// ─── "Pleasant this month" list ──────────────────────────────────────────
function GoodList({ month, selected, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => window.COUNTRIES
    .filter(c => isGood(climateOf(c.iso2), month))
    .map(c => c.iso2)
    .sort((a, b) => window.countryName(a).localeCompare(window.countryName(b), window.ATLAS_LANG || "en")), [month]);
  useEffect(() => setExpanded(false), [month]);
  if (!rows.length) return <p className="p-fine" style={{ margin: 0 }}>{tr("clim.good_none", "No country matches this month.")}</p>;
  const shown = expanded ? rows : rows.slice(0, 24);
  return (
    <div>
      <div className="chips">
        {shown.map(iso2 => (
          <button key={iso2} type="button" className={"chip" + (iso2 === selected ? " is-on" : "")} onClick={() => onOpen(iso2)}>
            <span className="flag">{window.byIso2[iso2]?.flag}</span>{window.countryName(iso2)}
          </button>
        ))}
      </div>
      {rows.length > 24 && (
        <button type="button" className="more-btn" onClick={() => setExpanded(v => !v)}>
          {expanded ? tr("changelog.show_less", "Show less") : tr("tally.show_all", "Show all {n}", { n: rows.length })}
        </button>
      )}
    </div>
  );
}

// ─── Legend over the globe ────────────────────────────────────────────────
function ClimateLegend({ view }) {
  const rain = view === "rain";
  const colors = rain ? P_COLOR : T_COLOR;
  const labels = rain ? P_LABEL : T_LABEL;
  return (
    <div className="map-key map-key-below overlay-card">
      <div className="map-key-title">{rain ? tr("clim.legend_rain", "Rain in the month") : tr("clim.legend_temp", "Daytime high")}</div>
      <ul>
        {colors.map((c, i) => (
          <li key={i}><span className="sw" style={{ "--sw": c }} /><span>{tr("clim." + (rain ? "p" : "t") + i, labels[i])}</span></li>
        ))}
        <li><span className="sw cl-night-sw" /><span>{tr("clim.night_now", "Night right now")}</span></li>
      </ul>
    </div>
  );
}

// ─── Hover ────────────────────────────────────────────────────────────────
function ClimateHover({ hover, month }) {
  const dest = window.byIso2[hover.iso2];
  if (!dest) return null;
  const c = climateOf(hover.iso2);
  return (
    <div className="hovercard overlay-card" style={{ left: hover.x + 18, top: hover.y + 18 }}>
      <div className="hovercard-title"><span className="flag">{dest.flag}</span><span>{window.countryName(hover.iso2)}</span></div>
      {c ? (
        <>
          <div className="hovercard-row">
            <span className="dot" style={{ "--sw": T_COLOR[band(c.hi[month], T_BANDS)] }} />
            <span>{tr("clim.day_night", "{hi}° by day, {lo}° at night", { hi: c.hi[month], lo: c.lo[month] })}</span>
          </div>
          <div className="hovercard-row">
            <span className="dot" style={{ "--sw": P_COLOR[band(c.pr[month], P_BANDS)] }} />
            <span>{tr("clim.rain_mm", "{mm} mm of rain", { mm: c.pr[month] })}</span>
          </div>
        </>
      ) : (
        <div className="hovercard-row hovercard-cap">{tr("clim.no_data", "No climate data")}</div>
      )}
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────
function ClimateSearch({ onPick, month }) {
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
            const cl = climateOf(c.iso2);
            return (
              <button key={c.iso2} type="button" className="dd-item" onClick={() => { onPick(c.iso2); setQ(""); }}>
                <span className="flag">{c.flag}</span>
                <span className="dd-grow">{window.countryName(c.iso2)}</span>
                <span className="dd-code">{cl ? cl.hi[month] + "°" : "-"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Detail card: the whole year for one country ─────────────────────────
function ClimateDetail({ iso2, month, setMonth, onClose }) {
  const dest = window.byIso2[iso2];
  const c = climateOf(iso2);
  if (!dest) return null;
  const good = c ? Array.from({ length: 12 }, (_, m) => m).filter(m => isGood(c, m)) : [];
  return (
    <article className="entry">
      <div className="entry-top">
        <span className="flag entry-flag" aria-hidden="true">{dest.flag}</span>
        <div style={{ minWidth: 0 }}>
          <div className="entry-name">{window.countryName(iso2)}</div>
          <div className="entry-sub">{tr("clim.in_month", "In {month}", { month: monthName(month) })}</div>
        </div>
        <div className="entry-actions">
          <button type="button" className="icon-btn" onClick={onClose} aria-label={tr("detail.close", "Close")}><IconClose /></button>
        </div>
      </div>
      {!c ? (
        <p className="p-fine">{tr("clim.no_data", "No climate data")}</p>
      ) : (
        <>
          <dl className="cl-now">
            <div><dt>{tr("clim.by_day", "By day")}</dt><dd>{c.hi[month]}°</dd></div>
            <div><dt>{tr("clim.at_night", "At night")}</dt><dd>{c.lo[month]}°</dd></div>
            <div><dt>{tr("clim.rain", "Rain")}</dt><dd>{c.pr[month]} <small>mm</small></dd></div>
          </dl>
          <YearChart c={c} month={month} setMonth={setMonth} />
          <p className="p-hint" style={{ margin: "10px 0 0" }}>
            {good.length === 12
              ? tr("clim.good_all", "Pleasant all year round.")
              : good.length
                ? tr("clim.good_months", "Most pleasant: {months}.", { months: good.map(m => monthName(m)).join(", ") })
                : tr("clim.good_never", "No month meets the pleasant-weather rule; pick by the chart.")}
          </p>
          {(VARIED.has(iso2) || ALIAS[iso2]) && (
            <p className="p-fine" style={{ margin: "6px 0 0" }}>
              {ALIAS[iso2]
                ? tr("clim.alias_cy", "Average for the whole island of Cyprus.")
                : tr("clim.varied", "Average for the whole country. Coasts, mountains and the far north or south can be very different.")}
            </p>
          )}
        </>
      )}
    </article>
  );
}

// Twelve columns: rain as a bar, the daytime high as a number on top. Tap a
// month to switch the map to it.
function YearChart({ c, month, setMonth }) {
  const maxPr = Math.max(60, ...c.pr);
  return (
    <div className="cl-year" role="group" aria-label={tr("clim.year", "The year at a glance")}>
      {c.hi.map((hi, m) => (
        <button key={m} type="button" className={"cl-col" + (m === month ? " is-on" : "")} aria-pressed={m === month}
          onClick={() => setMonth(m)}
          aria-label={monthName(m) + ": " + tr("clim.day_night", "{hi}° by day, {lo}° at night", { hi, lo: c.lo[m] }) + ", " + tr("clim.rain_mm", "{mm} mm of rain", { mm: c.pr[m] })}>
          <span className="cl-hi" style={{ "--sw": T_COLOR[band(hi, T_BANDS)] }}>{hi}°</span>
          <span className="cl-bar-wrap"><span className="cl-bar" style={{ height: Math.max(2, Math.round(c.pr[m] / maxPr * 100)) + "%" }} /></span>
          <span className="cl-m">{monthName(m, "narrow")}</span>
        </button>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ClimateMapApp />);

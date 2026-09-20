// Main app — composes Globe + Panel, owns shared state, passport guess,
// keyboard shortcuts, Tweaks integration.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = {
  "globeStyle": "globe3d",
  // Light by default — most readers find it easier on the eyes for data-dense
  // panels. The brand stays distinctive via the accent palette, not the bg.
  // Returning users keep whatever they last set (atlas.tweaks localStorage).
  "background": "light",
  "compareMode": false,
  "groupMode": false,
};

// Lightweight user-preference store. Most settings persist to localStorage
// (theme, compareMode, groupMode) so they survive page reloads. globeStyle is
// the exception: persisted in sessionStorage only, so every fresh browser
// session starts at the 3D default — the SPA's signature view — even for
// returning visitors. They can still toggle to 2D for the duration of the
// session via the topbar.
function useTweaks(defaults) {
  const [values, setValues] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      const merged = { ...defaults, ...stored };
      // Override the persisted globeStyle with whatever this session has set
      // (or fall back to the default = "globe3d"). NEVER read globeStyle from
      // localStorage — new sessions should always open in 3D.
      const sessionMode = sessionStorage.getItem("atlas.globeStyle");
      merged.globeStyle = sessionMode || defaults.globeStyle;
      return merged;
    } catch (e) { return defaults; }
  });
  const setTweak = useCallback((key, val) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      try {
        if (key === "globeStyle") {
          sessionStorage.setItem("atlas.globeStyle", val);
        } else {
          // Persist everything except globeStyle to localStorage.
          const { globeStyle: _drop, ...persistable } = next;
          localStorage.setItem("atlas.tweaks", JSON.stringify(persistable));
        }
      } catch (e) {}
      return next;
    });
  }, []);
  return [values, setTweak];
}

// Map common timezones → ISO2 codes, for default-passport detection.
// Browsers (especially mobile + Firefox) sometimes return non-canonical names,
// so we list every variant we've seen in the wild.
const TZ_FALLBACK = {
  // North America
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "America/Detroit": "US", "America/Indianapolis": "US", "America/Honolulu": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Halifax": "CA",
  "America/Edmonton": "CA", "America/Winnipeg": "CA", "America/Montreal": "CA",
  "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Cancun": "MX",
  // South America
  "America/Sao_Paulo": "BR", "America/Recife": "BR", "America/Manaus": "BR",
  "America/Argentina/Buenos_Aires": "AR", "America/Buenos_Aires": "AR",
  "America/Santiago": "CL", "America/Lima": "PE", "America/Bogota": "CO",
  "America/Caracas": "VE", "America/La_Paz": "BO", "America/Asuncion": "PY",
  "America/Montevideo": "UY", "America/Guayaquil": "EC",
  // Europe — Western
  "Europe/London": "GB", "Europe/Dublin": "IE",
  "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES",
  "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE",
  "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Luxembourg": "LU",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Europe/Lisbon": "PT", "Europe/Reykjavik": "IS",
  // Europe — Central / Eastern
  "Europe/Warsaw": "PL", "Europe/Prague": "CZ", "Europe/Bratislava": "SK",
  "Europe/Budapest": "HU", "Europe/Bucharest": "RO", "Europe/Sofia": "BG",
  "Europe/Athens": "GR", "Europe/Riga": "LV", "Europe/Tallinn": "EE",
  "Europe/Vilnius": "LT", "Europe/Ljubljana": "SI", "Europe/Zagreb": "HR",
  "Europe/Malta": "MT", "Europe/Andorra": "AD", "Europe/Monaco": "MC",
  "Europe/San_Marino": "SM", "Europe/Vatican": "VA",
  "Europe/Moscow": "RU", "Europe/Kaliningrad": "RU", "Europe/Samara": "RU",
  "Europe/Minsk": "BY", "Europe/Kyiv": "UA", "Europe/Kiev": "UA",
  "Europe/Chisinau": "MD",
  // Europe — Balkans / Turkey (the one that bit us)
  "Europe/Istanbul": "TR", "Asia/Istanbul": "TR", "Turkey": "TR",
  "Europe/Tirane": "AL", "Europe/Sarajevo": "BA", "Europe/Belgrade": "RS",
  "Europe/Podgorica": "ME", "Europe/Skopje": "MK",
  "Europe/Pristina": "XK", "Asia/Nicosia": "CY", "Europe/Nicosia": "CY",
  // Asia
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Pyongyang": "KP",
  "Asia/Shanghai": "CN", "Asia/Chongqing": "CN", "Asia/Urumqi": "CN",
  "Asia/Hong_Kong": "HK", "Asia/Macau": "MO", "Asia/Taipei": "TW",
  "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Jakarta": "ID",
  "Asia/Manila": "PH", "Asia/Bangkok": "TH", "Asia/Ho_Chi_Minh": "VN",
  "Asia/Saigon": "VN", "Asia/Phnom_Penh": "KH", "Asia/Vientiane": "LA",
  "Asia/Yangon": "MM", "Asia/Rangoon": "MM",
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD", "Asia/Kathmandu": "NP", "Asia/Colombo": "LK",
  "Asia/Thimphu": "BT", "Asia/Male": "MV",
  "Asia/Tehran": "IR", "Asia/Baghdad": "IQ", "Asia/Damascus": "SY",
  "Asia/Beirut": "LB", "Asia/Amman": "JO", "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL", "Asia/Gaza": "PS", "Asia/Hebron": "PS",
  "Asia/Riyadh": "SA", "Asia/Dubai": "AE", "Asia/Qatar": "QA",
  "Asia/Bahrain": "BH", "Asia/Kuwait": "KW", "Asia/Muscat": "OM",
  "Asia/Aden": "YE", "Asia/Kabul": "AF",
  "Asia/Tashkent": "UZ", "Asia/Almaty": "KZ", "Asia/Bishkek": "KG",
  "Asia/Dushanbe": "TJ", "Asia/Ashgabat": "TM", "Asia/Ulaanbaatar": "MN",
  "Asia/Yerevan": "AM", "Asia/Baku": "AZ", "Asia/Tbilisi": "GE",
  // Africa
  "Africa/Cairo": "EG", "Africa/Lagos": "NG", "Africa/Johannesburg": "ZA",
  "Africa/Nairobi": "KE", "Africa/Algiers": "DZ", "Africa/Casablanca": "MA",
  "Africa/Tunis": "TN", "Africa/Tripoli": "LY", "Africa/Khartoum": "SD",
  "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ", "Africa/Kampala": "UG",
  "Africa/Kigali": "RW", "Africa/Accra": "GH", "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI", "Africa/Douala": "CM",
  // Oceania
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU",
  "Australia/Brisbane": "AU", "Australia/Adelaide": "AU", "Australia/Darwin": "AU",
  "Pacific/Auckland": "NZ", "Pacific/Fiji": "FJ",
};

function detectPassport() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const iso = TZ_FALLBACK[tz];
    if (iso && window.PASSPORTS[iso]) return iso;
  } catch (e) {}
  return null;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Returning users keep their last-chosen passport (persisted below). Only
  // brand-new visitors with nothing saved fall through to auto-detection.
  const [passport, setPassport] = useState(() => {
    try {
      // ?p=TR — links from the /passport/<iso>/ pages open on that passport.
      const q = (new URLSearchParams(location.search).get("p") || "").toUpperCase();
      if (q && window.PASSPORTS[q]) return q;
      const saved = localStorage.getItem("atlas.passport");
      return saved && window.PASSPORTS[saved] ? saved : null;
    } catch (e) { return null; }
  });
  const [compare, setCompare] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detailCountry, setDetailCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [focusedCountry, setFocusedCountry] = useState(null);
  // The site opens straight onto the map: no dialog, overlay or permission
  // prompt on arrival. The explainer is only shown from the "?" button.
  const [showIntro, setShowIntro] = useState(false);
  const dismissIntro = useCallback(() => setShowIntro(false), []);
  const reopenIntro = useCallback(() => setShowIntro(true), []);

  // Picker mode — when the panel's passport picker is open, clicks on the
  // map should set that passport instead of opening the country detail card.
  // Values: null (off), "primary", "compare".
  const [pickerMode, setPickerMode] = useState(null);
  // Set when the passport was guessed from the time zone rather than chosen, so
  // the panel can say so (inline, not in a popup) until the visitor picks one.
  const [autoDetectedPassport, setAutoDetectedPassport] = useState(null);
  const [direction, setDirection] = useState("outgoing"); // outgoing | incoming
  const [groupPassports, setGroupPassports] = useState([]); // array of iso2 — group mode active iff non-empty
  const [passportVariant, setPassportVariant] = useState(() => {
    try { return localStorage.getItem("atlas.variant") || "ordinary"; }
    catch (e) { return "ordinary"; }
  });
  const updatePassportVariant = useCallback((v) => {
    setPassportVariant(v);
    try { localStorage.setItem("atlas.variant", v); } catch (e) {}
  }, []);
  // Reset variant whenever the primary passport changes (variants don't carry
  // across passports — diplomatic of TR ≠ diplomatic of US).
  useEffect(() => { updatePassportVariant("ordinary"); }, [passport, updatePassportVariant]);

  // Residence-permit picker — array of bloc codes (SCHENGEN/US/GB/CA/AU/GCC).
  // Persisted to localStorage; mirrored to window.ATLAS_RESIDENCE_PERMITS so
  // the resolveStatus chain in frontend-tail.js can read it from any caller
  // (globe paint, tally, detail card) without prop drilling everywhere.
  const [residencePermits, setResidencePermitsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("atlas.permits") || "[]"); }
    catch (e) { return []; }
  });
  const setResidencePermits = useCallback((next) => {
    const arr = Array.isArray(next) ? next : [];
    // Write the global SYNCHRONOUSLY before setState so the same-tick re-render
    // (which calls resolveStatus → applyResidenceUpgrade → reads the global)
    // sees the new value. A useEffect mirror would lag by one render.
    window.ATLAS_RESIDENCE_PERMITS = arr;
    setResidencePermitsState(arr);
    try { localStorage.setItem("atlas.permits", JSON.stringify(arr)); } catch (e) {}
  }, []);
  // Hydrate the global from initial state on first mount (in case localStorage
  // had permits set from a previous session).
  useEffect(() => { window.ATLAS_RESIDENCE_PERMITS = residencePermits; }, []); // eslint-disable-line

  // Persist the chosen passport so sibling pages (e.g. /transit-map/) can open
  // on the same passport. Write-only — the home page still re-detects on load.
  useEffect(() => {
    try { if (passport) localStorage.setItem("atlas.passport", passport); } catch (e) {}
  }, [passport]);

  // ─── Default passport for first-time visitors ──────────────────────────
  // Returning visitors keep their saved passport. New visitors get a guess from
  // the browser's time zone (no geolocation prompt, nothing sent anywhere); the
  // panel marks it as a guess. If the time zone gives nothing, the map simply
  // opens without a passport and the panel's picker asks for one.
  useEffect(() => {
    if (passport) return;
    const guess = detectPassport();
    if (guess) {
      setPassport(guess);
      setAutoDetectedPassport(guess);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePassport = useCallback((iso2) => {
    setAutoDetectedPassport(null);
    setPassport(iso2);
  }, []);

  // ─── Background theme ───────────────────────────────────────────────────
  useEffect(() => {
    applyThemeClass(t.background === "dark" ? "dark" : "light");
  }, [t.background]);

  // Cross-tab theme sync — if a static page (or another SPA tab) toggles the
  // theme, mirror it here without forcing a reload.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "atlas.tweaks" || !e.newValue) return;
      try {
        const tw = JSON.parse(e.newValue);
        if (tw.background && tw.background !== t.background) {
          setTweak("background", tw.background);
        }
      } catch (err) {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [t.background, setTweak]);

  // ─── Keyboard: Esc closes detail / picker, "/" jumps to search ──────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showIntro) dismissIntro();
        if (detailCountry) setDetailCountry(null);
      }
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) {
        e.preventDefault();
        document.getElementById("country-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailCountry, showIntro, dismissIntro]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const onCountryClick = (iso2) => {
    // Picker-from-map: if the panel's passport picker is open, route the
    // click into the picker so the user can pick a passport by tapping its
    // country on the globe. Falls through to detail if the country isn't a
    // known passport-issuing entity.
    if (pickerMode && window.PASSPORTS[iso2]) {
      if (pickerMode === "primary") choosePassport(iso2);
      else if (pickerMode === "compare") setCompare(iso2);
      setPickerMode(null);
      return;
    }
    if (!passport) {
      // First click sets passport
      if (window.PASSPORTS[iso2]) choosePassport(iso2);
      return;
    }
    setDetailCountry(iso2);
    setFocusedCountry(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
  };

  const onPickFromSearch = (iso2) => {
    setDetailCountry(iso2);
    setFocusedCountry(iso2);
    window.atlasSheet && window.atlasSheet.ensure(0.48);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="layout">
      <Masthead
        view={t.globeStyle}
        onView={(v) => setTweak("globeStyle", v)}
        theme={t.background === "dark" ? "dark" : "light"}
        onTheme={(v) => setTweak("background", v)}
        onHelp={reopenIntro}
      />
      {showIntro && <IntroDialog onClose={dismissIntro} />}
      <div className="globe-stage">
        <Globe
          passport={passport}
          comparePassport={t.compareMode ? compare : null}
          groupPassports={t.groupMode ? groupPassports : null}
          filter={filter}
          mode={t.globeStyle}
          direction={direction}
          variant={passportVariant}
          residencePermits={residencePermits}
          onCountryClick={onCountryClick}
          focusedCountry={focusedCountry}
        />

        {passport && !detailCountry && <MapKey />}

        <CompareStrip enabled={t.compareMode} passport={passport} compare={compare} />

        {!detailCountry && <ChangelogFloater />}

      </div>

      <Panel
        passport={passport}
        setPassport={choosePassport}
        autoDetected={!!passport && passport === autoDetectedPassport}
        compare={compare}
        setCompare={setCompare}
        compareMode={t.compareMode}
        setCompareMode={(v) => setTweak("compareMode", v)}
        groupMode={t.groupMode}
        setGroupMode={(v) => setTweak("groupMode", v)}
        groupPassports={groupPassports}
        setGroupPassports={setGroupPassports}
        filter={filter}
        setFilter={setFilter}
        direction={direction}
        setDirection={setDirection}
        detailCountry={detailCountry}
        setDetailCountry={(v) => { setDetailCountry(v); if (v && window.atlasSheet) window.atlasSheet.ensure(0.48); }}
        search={search}
        setSearch={setSearch}
        onPickFromSearch={onPickFromSearch}
        showCompare={t.compareMode}
        variant={passportVariant}
        setVariant={updatePassportVariant}
        residencePermits={residencePermits}
        setResidencePermits={setResidencePermits}
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
      />
    </div>
  );
}

// Replace {tokens} in a translated string with React nodes (links, bold).
function interpolateNodes(str, nodes) {
  const parts = String(str).split(/(\{\w+\})/g);
  return parts.map((p, i) => {
    const m = p.match(/^\{(\w+)\}$/);
    return m && nodes[m[1]] != null ? <React.Fragment key={i}>{nodes[m[1]]}</React.Fragment> : p;
  });
}

// ─── Intro — first-visit explainer, re-openable from the "?" button ──────
function IntroDialog({ onClose }) {
  useLangTick();
  const n = (window.PASSPORT_LIST || []).length || 199;
  // Raw template (no vars) so the name / email can be real nodes.
  const sign = window.t ? window.t("intro.sign") : "";
  return (
    <div className="dialog-scrim" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="intro-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-band" aria-hidden="true" />
        <div className="dialog-body">
          <div className="dialog-top">
            <BrandMark className="brand-mark" />
            <span className="brand-word">travelnow<span className="brand-tld">.info</span></span>
            <LangSelect />
          </div>
          <div className="welcome-kicker">{tr("intro.kicker", "An independent visa atlas")}</div>
          <h1 id="intro-title">{tr("intro.headline", "Visa rules for {n} passports, on one map.", { n })}</h1>
          <p>{tr("intro.lede", "")}</p>
          <ol>
            {[1, 2, 3].map(i => <li key={i}><span>{tr(`intro.step_${i}`, "")}</span></li>)}
          </ol>
          {sign && sign !== "intro.sign" && (
            <p className="dialog-sign">
              {interpolateNodes(sign, {
                name: <strong>Uygar Atalay</strong>,
                email: <a href="mailto:hello@travelnow.info">hello@travelnow.info</a>,
              })}
            </p>
          )}
          <button className="btn btn-primary btn-block" onClick={onClose} autoFocus>
            {tr("intro.open", "Open the map")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map key ────────────────────────────────────────────────────────────
function MapKey() {
  const keys = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];
  // When residence permits are active, hatched fills appear on the globe —
  // explain them. App re-renders on permit changes, so reading the global
  // here is safe (it's written synchronously before the state update).
  const permitsActive = Array.isArray(window.ATLAS_RESIDENCE_PERMITS) &&
    window.ATLAS_RESIDENCE_PERMITS.length > 0;
  return (
    <div className="map-key overlay-card">
      <div className="map-key-title">{tr("map.key", "Key")}</div>
      <ul>
        {keys.map(k => (
          <li key={k}><Swatch s={k} /><span>{statusLabel(k)}</span></li>
        ))}
        {permitsActive && (
          <li><span className="sw sw-permit" aria-hidden="true" /><span>{window.t("status.permit")}</span></li>
        )}
      </ul>
    </div>
  );
}

// ─── Compare strip ──────────────────────────────────────────────────────
function CompareStrip({ enabled, passport, compare }) {
  if (!enabled || !compare || !passport) return null;
  const a = window.byIso2[passport];
  const b = window.byIso2[compare];
  const ta = window.tally(passport);
  const tb = window.tally(compare);
  if (!a || !b || !ta || !tb) return null;
  const sa = window.mobilityScore(ta), sb = window.mobilityScore(tb);
  const d = sa - sb;
  return (
    <div className="compare-strip overlay-card">
      <div style={{ boxShadow: "inset 3px 0 0 var(--self)" }}>
        <span className="flag">{a.flag}</span>
        <span>{window.countryName(passport)}</span>
        <span className="n">{sa}</span>
      </div>
      <div style={{ boxShadow: "inset 3px 0 0 var(--compare-self)" }}>
        <span className="flag">{b.flag}</span>
        <span>{window.countryName(compare)}</span>
        <span className="n">{sb}</span>
      </div>
      <div>
        <span className="n" style={{ color: d > 0 ? "var(--vf)" : d < 0 ? "var(--vr)" : "var(--ink-3)", fontWeight: 600 }}>
          {d > 0 ? "+" : ""}{d}
        </span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

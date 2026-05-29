// Main app — composes Globe + Panel, owns shared state, geolocation,
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
      const saved = localStorage.getItem("atlas.passport");
      return saved && window.PASSPORTS[saved] ? saved : null;
    } catch (e) { return null; }
  });
  const [compare, setCompare] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detailCountry, setDetailCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [focusedCountry, setFocusedCountry] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    try { return !localStorage.getItem("atlas.welcomed"); }
    catch (e) { return true; }
  });
  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    try { localStorage.setItem("atlas.welcomed", "1"); } catch (e) {}
  }, []);
  const reopenIntro = useCallback(() => setShowIntro(true), []);

  // Picker mode — when the panel's passport picker is open, clicks on the
  // map should set that passport instead of opening the country detail card.
  // Values: null (off), "primary", "compare".
  const [pickerMode, setPickerMode] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | detected | denied
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

  // Persist the chosen passport so sibling pages (e.g. /transit-map/) can open
  // on the same passport. Write-only — the home page still re-detects on load.
  useEffect(() => {
    try { if (passport) localStorage.setItem("atlas.passport", passport); } catch (e) {}
  }, [passport]);

  // ─── Default passport detection ─────────────────────────────────────────
  // Strategy:
  //   0. If a saved passport exists, we already adopted it above — skip
  //      detection entirely so returning users keep their last choice and
  //      coming back from a sub-page doesn't silently re-pick by location.
  //   1. First-time visitors see the intro overlay FIRST; detection is held
  //      until they dismiss it (gated on showIntro) so the explainer isn't
  //      pre-empted by a geolocation prompt.
  //   2. Then try geolocation (4 s soft timeout) → fall back to time-zone →
  //      fall back to the welcome picker. NEVER auto-pick alphabetically.
  const detectedRef = useRef(false);
  useEffect(() => {
    if (detectedRef.current) return;   // run at most once
    if (passport) return;              // saved/returning user — keep their pick
    if (showIntro) return;             // wait until the intro is dismissed
    detectedRef.current = true;
    // Kick off TZ resolve immediately so we have something to render against
    // even before the geolocation prompt resolves. We do NOT setPassport from
    // it yet — only stash as a candidate — so if the user denies geolocation
    // we adopt it; if they accept, the precise answer wins.
    const tzCandidate = detectPassport();

    let resolved = false;
    const adoptTZ = () => {
      if (resolved) return;
      resolved = true;
      if (tzCandidate) {
        setPassport(tzCandidate);
        setAutoDetectedPassport(tzCandidate);
        setLocationStatus("detected");
        setShowWelcome(false);
      } else {
        setShowWelcome(true);
        setLocationStatus("denied");
      }
    };

    if (!navigator.geolocation) {
      adoptTZ();
      return;
    }

    setLocationStatus("detecting");
    const timer = setTimeout(adoptTZ, 4000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        try {
          const r = await fetch(
            "https://nominatim.openstreetmap.org/reverse" +
            "?lat=" + pos.coords.latitude +
            "&lon=" + pos.coords.longitude +
            "&format=json&zoom=3",
            { headers: { "Accept-Language": "en" } }
          );
          const data = await r.json();
          const cc = data?.address?.country_code?.toUpperCase();
          if (cc && window.PASSPORTS[cc]) {
            resolved = true;
            clearTimeout(timer);
            setPassport(cc);
            setAutoDetectedPassport(cc);
            setLocationStatus("detected");
            setShowWelcome(false);
            return;
          }
        } catch (e) { /* network blocked → TZ */ }
        clearTimeout(timer);
        adoptTZ();
      },
      () => {
        clearTimeout(timer);
        adoptTZ();
      },
      { timeout: 4000, maximumAge: 600000 }
    );

    return () => clearTimeout(timer);
  }, [passport, showIntro]);

  const useLocation = () => {
    setLocationStatus("detecting");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Try a free reverse geocode. If the service is blocked, fall back to TZ.
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=3`);
          const data = await r.json();
          const cc = data?.address?.country_code?.toUpperCase();
          if (cc && window.PASSPORTS[cc]) {
            setPassport(cc);
            setLocationStatus("detected");
            setShowWelcome(false);
            return;
          }
        } catch (e) {}
        // Fallback
        const fromTZ = detectPassport();
        if (fromTZ) { setPassport(fromTZ); setLocationStatus("detected"); setShowWelcome(false); }
        else setLocationStatus("denied");
      },
      () => setLocationStatus("denied"),
      { timeout: 6000 }
    );
  };

  // ─── Background theme ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    const bg = t.background === "light" ? "light" : "dark";
    document.body.classList.add(`theme-${bg}`);
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

  // ─── Keyboard: Esc closes detail / picker ───────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showIntro) dismissIntro();
        if (detailCountry) setDetailCountry(null);
        if (showWelcome) setShowWelcome(false);
      }
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector('input[placeholder*="any country"]')?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailCountry, showWelcome, showIntro, dismissIntro]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const onCountryClick = (iso2) => {
    // Picker-from-map: if the panel's passport picker is open, route the
    // click into the picker so the user can pick a passport by tapping its
    // country on the globe. Falls through to detail if the country isn't a
    // known passport-issuing entity.
    if (pickerMode && window.PASSPORTS[iso2]) {
      if (pickerMode === "primary") setPassport(iso2);
      else if (pickerMode === "compare") setCompare(iso2);
      setPickerMode(null);
      return;
    }
    if (!passport) {
      // First click sets passport
      if (window.PASSPORTS[iso2]) setPassport(iso2);
      return;
    }
    setDetailCountry(iso2);
    setFocusedCountry(iso2);
  };

  const onPickFromSearch = (iso2) => {
    setDetailCountry(iso2);
    setFocusedCountry(iso2);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="layout">
      <TopNav
        tweaks={t}
        setTweak={setTweak}
        globeStyle={t.globeStyle}
        onGlobeStyleChange={(v) => setTweak("globeStyle", v)}
        onHelp={reopenIntro}
      />
      {showIntro && <IntroHook onClose={dismissIntro} />}
      <div className="globe-stage">
        <Globe
          passport={passport}
          comparePassport={t.compareMode ? compare : null}
          groupPassports={t.groupMode ? groupPassports : null}
          filter={filter}
          mode={t.globeStyle}
          direction={direction}
          variant={passportVariant}
          onCountryClick={onCountryClick}
          focusedCountry={focusedCountry}
        />


        {!passport && (
          <WelcomeOverlay
            onPick={(iso2) => { setPassport(iso2); setShowWelcome(false); }}
            onUseLocation={useLocation}
            locationStatus={locationStatus}
          />
        )}

        {passport && !detailCountry && (
          <Legend />
        )}

        <CompareFloater
          enabled={t.compareMode}
          passport={passport}
          compare={compare}
        />
      </div>

      <Panel
        passport={passport}
        setPassport={setPassport}
        compare={compare}
        setCompare={setCompare}
        compareMode={t.compareMode}
        setCompareMode={(v) => setTweak("compareMode", v)}
        groupMode={t.groupMode}
        groupPassports={groupPassports}
        setGroupPassports={setGroupPassports}
        filter={filter}
        setFilter={setFilter}
        direction={direction}
        setDirection={setDirection}
        detailCountry={detailCountry}
        setDetailCountry={setDetailCountry}
        search={search}
        setSearch={setSearch}
        onPickFromSearch={onPickFromSearch}
        showCompare={t.compareMode}
        variant={passportVariant}
        setVariant={updatePassportVariant}
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
      />

    </div>
  );
}

// ─── Top nav bar ──────────────────────────────────────────────────────────
// Persistent across all in-app interactions. Hosts feature shortcuts, the
// language switcher, and the settings popover (no more hidden corner button).
function TopNav({ tweaks, setTweak, globeStyle, onGlobeStyleChange, onHelp }) {
  // Re-render when language changes
  const [, force] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onLang = () => force(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);
  // Close mobile menu when clicking a link inside it
  const closeMenu = () => setMenuOpen(false);
  return (
    <header className={"topbar" + (menuOpen ? " menu-open" : "")}>
      <a className="brand" href="/" aria-label="travelnow.info home">
        <span>travelnow.info</span>
      </a>
      <div className="topbar-sheet">
        <nav className="primary-nav">
          <a href="/transit-map/" onClick={closeMenu}>{window.t("nav.transit_map")}</a>
          <a href="/transit-visa/" onClick={closeMenu}>{window.t("nav.transit")}</a>
          <a href="/etias/" onClick={closeMenu}>{window.t("nav.etias")}</a>
          <a href="/passport-validity/" onClick={closeMenu}>{window.t("nav.validity")}</a>
          <a href="/schengen-calculator/" onClick={closeMenu}>{window.t("nav.schengen")}</a>
          <a href="/itinerary/" onClick={closeMenu}>{window.t("nav.itinerary")}</a>
          <a href="/digital-nomad-visa/" onClick={closeMenu}>{window.t("nav.nomad")}</a>
          <a href="/citizenship-by-investment/" onClick={closeMenu}>{window.t("nav.cbi")}</a>
          <a href="/alerts/" onClick={closeMenu}>{window.t("nav.alerts")}</a>
        </nav>
        <div className="rhs">
          <HelpButton onClick={onHelp} />
          <SettingsButton
            tweaks={tweaks}
            setTweak={setTweak}
            inNav
            globeStyle={globeStyle}
            onGlobeStyleChange={onGlobeStyleChange}
          />
        </div>
      </div>
      {/* Hamburger only shown on mobile via CSS */}
      <button
        className="hamburger"
        aria-label={window.t("nav.menu")}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(v => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          {menuOpen ? (
            <path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M3 5 H15 M3 9 H15 M3 13 H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </header>
  );
}

// Same idea as ModeToggle but slimmer and styled to live inside the nav bar.
function InlineModeToggle({ value, onChange }) {
  const opts = [{ v: "globe3d", l: window.t("mode.3d") }, { v: "flat", l: window.t("mode.2d") }];
  return (
    <div style={{ display: "inline-flex", background: "var(--bg-3)", border: "1px solid var(--panel-border)", borderRadius: 7, padding: 2, gap: 2 }}>
      {opts.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              border: "none", padding: "4px 10px", borderRadius: 5,
              background: on ? "var(--self)" : "transparent",
              color: on ? "#05070d" : "var(--fg-dim)",
              fontFamily: "inherit", fontSize: 11, fontWeight: on ? 600 : 500,
              cursor: "pointer",
            }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

// ─── Language switcher ────────────────────────────────────────────────────
function LangSwitcher() {
  const [cur, setCur] = useState(window.ATLAS_LANG || "en");
  return (
    <select
      value={cur}
      onChange={(e) => { window.setLang(e.target.value); setCur(e.target.value); }}
      aria-label={window.t("nav.language")}
      style={{ paddingRight: 26 }}
    >
      {(window.LANGS || []).map(l => (
        <option key={l.code} value={l.code}>{l.native}</option>
      ))}
    </select>
  );
}

// ─── Settings popover (light/dark + compare mode toggle) ──────────────────
function SettingsButton({ tweaks, setTweak, inNav, globeStyle, onGlobeStyleChange }) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const onLang = () => force(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  const curLang = window.ATLAS_LANG || "en";
  const sectionLabel = (txt) => (
    <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{txt}</div>
  );
  const popoverPos = inNav
    ? { position: "absolute", top: 40, right: 0, minWidth: 240 }
    : { position: "absolute", bottom: 44, right: 0, minWidth: 220 };
  const wrapperPos = inNav
    ? { position: "relative" }
    : { position: "absolute", bottom: 16, right: 16, zIndex: 5 };
  return (
    <div ref={ref} style={{ ...wrapperPos, zIndex: 10 }}>
      {open && (
        <div style={{
          ...popoverPos,
          background: "var(--panel)", backdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)", borderRadius: 12,
          padding: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          fontSize: 12, color: "var(--fg)",
        }}>
          {sectionLabel(window.t("nav.language"))}
          <select
            value={curLang}
            onChange={(e) => { window.setLang(e.target.value); force(x => x + 1); }}
            aria-label={window.t("nav.language")}
            style={{
              width: "100%", marginBottom: 14, padding: "6px 8px",
              background: "var(--bg-3)", color: "var(--fg)",
              border: "1px solid var(--panel-border)", borderRadius: 6,
              fontFamily: "inherit", fontSize: 12,
            }}>
            {(window.LANGS || []).map(l => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>

          {sectionLabel(window.t("nav.mode"))}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["globe3d", window.t("mode.3d")], ["flat", window.t("mode.2d")]].map(([v, l]) => (
              <button key={v} onClick={() => onGlobeStyleChange(v)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6,
                  border: "1px solid " + (globeStyle === v ? "var(--self)" : "var(--panel-border)"),
                  background: globeStyle === v ? "rgba(96,165,250,0.10)" : "var(--bg-3)",
                  color: "var(--fg)", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                }}>{l}</button>
            ))}
          </div>

          {sectionLabel(window.t("settings.theme"))}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["dark", window.t("settings.theme_dark")], ["light", window.t("settings.theme_light")]].map(([v, l]) => (
              <button key={v} onClick={() => setTweak("background", v)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6,
                  border: "1px solid " + (tweaks.background === v ? "var(--self)" : "var(--panel-border)"),
                  background: tweaks.background === v ? "rgba(96,165,250,0.10)" : "var(--bg-3)",
                  color: "var(--fg)", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                }}>{l}</button>
            ))}
          </div>
          {sectionLabel(window.t("settings.modes"))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
            <input type="checkbox" checked={!!tweaks.compareMode}
                   onChange={(e) => setTweak("compareMode", e.target.checked)} />
            <span>{window.t("settings.compare_two")}</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={!!tweaks.groupMode}
                   onChange={(e) => setTweak("groupMode", e.target.checked)} />
            <span>{window.t("settings.group_travel")}</span>
          </label>
          <div style={{ fontSize: 10, color: "var(--fg-faint)", marginTop: 4 }}>
            {window.t("settings.group_sub")}
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        aria-label={window.t("nav.settings")}
        style={inNav ? {
          background: "var(--bg-3)", border: "1px solid var(--panel-border)",
          color: "var(--fg-dim)", borderRadius: 7, padding: "6px 8px",
          display: "inline-flex", alignItems: "center", cursor: "pointer",
        } : {
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--panel)", backdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)",
          color: "var(--fg-dim)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" transform="rotate(45 8 8)"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Globe view-mode toggle (top-right floating control) ───────────────────
function ModeToggle({ value, onChange }) {
  const opts = [
    { v: "globe3d", l: "3D" },
    { v: "flat",    l: "2D" },
  ];
  return (
    <div style={{
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 5,
      display: "flex",
      background: "var(--panel)",
      backdropFilter: "blur(14px)",
      border: "1px solid var(--panel-border-strong)",
      borderRadius: 999,
      padding: 3,
      gap: 2,
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: "0.04em",
      boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
    }}>
      {opts.map(o => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              border: "none",
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              background: active ? "var(--self)" : "transparent",
              color: active ? "#05070d" : "var(--fg-dim)",
              fontWeight: active ? 600 : 500,
              fontFamily: "inherit",
              fontSize: "inherit",
              letterSpacing: "inherit",
              transition: "background 180ms ease, color 180ms ease",
            }}
            aria-pressed={active}
            title={`Switch to ${o.l} view`}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

// ─── Help (?) button — re-opens the intro hook ───────────────────────────
function HelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={window.t("nav.help")}
      title={window.t("nav.help")}
      style={{
        background: "var(--bg-3)", border: "1px solid var(--panel-border)",
        color: "var(--fg-dim)", borderRadius: 7, padding: "6px 9px",
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
        cursor: "pointer",
      }}>?</button>
  );
}

// ─── Intro hook — first-visit explainer, dismissible, re-openable via ?  ───
function IntroHook({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(5, 7, 13, 0.55)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="intro-title"
        style={{
          background: "var(--panel)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--panel-border-strong)",
          borderRadius: 16, padding: 28, maxWidth: 460, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          color: "var(--fg)",
        }}>
        <div style={{
          fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10,
        }}>travelnow.info</div>
        <h1 id="intro-title" style={{
          fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em",
          margin: "0 0 10px 0", lineHeight: 1.15,
        }}>
          {window.t("intro.title")}
        </h1>
        <p style={{ fontSize: 13, color: "var(--fg-dim)", lineHeight: 1.55, margin: "0 0 16px 0" }}>
          {window.t("intro.body")}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <li key={i} style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.4 }}>
              {window.t(`intro.bullet_${i}`)}
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          autoFocus
          style={{
            width: "100%", background: "var(--self)", color: "#05070d",
            border: "none", borderRadius: 8, padding: "11px 14px",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
          {window.t("intro.cta")}
        </button>
      </div>
    </div>
  );
}

// ─── Welcome overlay ─────────────────────────────────────────────────────────
function WelcomeOverlay({ onPick, onUseLocation, locationStatus }) {
  const featured = ["US", "GB", "DE", "JP", "CA", "AU", "IN", "BR", "AE", "SG"];
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: 10,
    }}>
      <div style={{
        background: "var(--panel)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--panel-border-strong)",
        borderRadius: 16,
        padding: 28,
        maxWidth: 460,
        pointerEvents: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-mute)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 8,
        }}>{window.t("welcome.hint")}</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px 0",
          lineHeight: 1.1,
        }}>
          {window.t("welcome.title_1")}<br/>
          <span style={{ color: "var(--fg-mute)" }}>{window.t("welcome.title_2")}</span>
        </h1>
        <p style={{
          fontSize: 13,
          color: "var(--fg-dim)",
          lineHeight: 1.5,
          margin: "0 0 20px 0",
        }}>
          {window.t("welcome.body")}
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
          marginBottom: 16,
        }}>
          {featured.map(iso2 => {
            const c = window.byIso2[iso2];
            return (
              <button
                key={iso2}
                onClick={() => onPick(iso2)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 4px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  transition: "all 160ms ease",
                }}
                className="welcome-flag"
              >
                <span style={{ fontSize: 22 }}>{c?.flag}</span>
                <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{iso2}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onUseLocation}
          disabled={locationStatus === "detecting"}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--panel-border-strong)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "var(--fg-dim)",
            cursor: locationStatus === "detecting" ? "wait" : "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 160ms ease",
          }}
          className="welcome-loc"
        >
          <LocateIcon />
          {locationStatus === "detecting" ? window.t("welcome.detecting") :
           locationStatus === "denied" ? window.t("welcome.couldnt_detect") :
           window.t("welcome.use_location")}
        </button>

        <div style={{
          marginTop: 10,
          fontSize: 10,
          color: "var(--fg-faint)",
          fontFamily: "var(--font-mono)",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {window.t("welcome.or_open_panel", { n: window.PASSPORT_LIST.length })}
        </div>
      </div>
    </div>
  );
}

function LocateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <path d="M8 1 V3 M8 13 V15 M1 8 H3 M13 8 H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Legend ─────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { k: "vf",  fill: STATUS_COLOR.vf.fill,  label: window.t("status.vf")  },
    { k: "ev",  fill: STATUS_COLOR.ev.fill,  label: window.t("status.ev")  },
    { k: "voa", fill: STATUS_COLOR.voa.fill, label: window.t("status.voa") },
    { k: "vr",  fill: STATUS_COLOR.vr.fill,  label: window.t("status.vr")  },
  ];
  return (
    <div style={{
      position: "absolute",
      left: 20,
      bottom: 20,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      background: "var(--panel)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid var(--panel-border)",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 11,
      color: "var(--fg-dim)",
      zIndex: 5,
    }}>
      {items.map(i => (
        <div key={i.k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i.fill, boxShadow: `0 0 8px ${i.fill}`,
          }}/>
          <span>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Compare floater ────────────────────────────────────────────────────────
function CompareFloater({ enabled, passport, compare }) {
  if (!enabled || !compare || !passport) return null;
  const a = window.byIso2[passport];
  const b = window.byIso2[compare];
  const ta = window.tally(passport);
  const tb = window.tally(compare);
  if (!a || !b || !ta || !tb) return null;
  const sa = ta.vf + ta.ev + ta.voa;
  const sb = tb.vf + tb.ev + tb.voa;
  return (
    <div style={{
      position: "absolute",
      top: 20,
      left: 20,
      display: "flex",
      alignItems: "stretch",
      gap: 0,
      background: "var(--panel)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid var(--panel-border)",
      borderRadius: 10,
      overflow: "hidden",
      zIndex: 5,
      fontSize: 12,
    }}>
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid var(--self)" }}>
        <span style={{ fontSize: 18 }}>{a.flag}</span>
        <div>
          <div style={{ fontWeight: 500, color: "var(--fg)" }}>{window.countryName(passport)}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--vf)" }}>{sa} {window.t("compare.open")}</div>
        </div>
      </div>
      <div style={{ width: 1, background: "var(--panel-border-strong)" }} />
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid var(--compare-self)" }}>
        <span style={{ fontSize: 18 }}>{b.flag}</span>
        <div>
          <div style={{ fontWeight: 500, color: "var(--fg)" }}>{window.countryName(compare)}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--vf)" }}>{sb} {window.t("compare.open")}</div>
        </div>
      </div>
      <div style={{
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(96,165,250,0.08)",
        borderLeft: "1px solid var(--panel-border-strong)",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Δ</span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          color: sa - sb > 0 ? "var(--vf)" : sa - sb < 0 ? "var(--vr)" : "var(--fg-mute)",
        }}>
          {sa - sb > 0 ? "+" : ""}{sa - sb}
        </span>
      </div>
    </div>
  );
}

// ─── Inline layout styles ───────────────────────────────────────────────────
const layoutStyle = document.createElement("style");
layoutStyle.textContent = `
  .layout {
    position: relative;
    height: 100vh;
    width: 100vw;
    display: grid;
    grid-template-columns: 1fr 340px;
    grid-template-rows: 48px 1fr;
    grid-template-areas:
      "topbar topbar"
      "globe  panel";
  }
  .topbar {
    grid-area: topbar;
    position: relative;
    display: flex; align-items: center; gap: 4px;
    padding: 0 14px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    z-index: 6;
    scrollbar-width: none;
  }
  .topbar::-webkit-scrollbar { display: none; }
  .topbar .brand {
    display: flex; align-items: center; gap: 6px;
    padding: 0 12px 0 0;
    font-weight: 600; font-size: 15px; letter-spacing: -0.01em;
    color: var(--fg); text-decoration: none;
    white-space: nowrap;
    font-family: var(--font-mono);
  }
  .topbar .brand span { color: var(--fg); }
  .topbar-sheet { display: flex; align-items: center; gap: 4px; flex: 1; }
  .topbar .primary-nav { display: flex; gap: 2px; flex: 1; }
  .topbar .primary-nav a {
    padding: 7px 10px; font-size: 13px;
    color: var(--fg-dim); text-decoration: none;
    border-radius: 6px;
    white-space: nowrap;
  }
  .topbar .primary-nav a:hover { color: var(--fg); background: var(--bg-3); }
  .topbar .primary-nav a.active { color: var(--fg); background: rgba(96,165,250,0.10); }
  .topbar .rhs { display: flex; align-items: center; gap: 6px; margin-left: auto; }
  .topbar .rhs button, .topbar .rhs select {
    background: var(--bg-3); border: 1px solid var(--panel-border);
    color: var(--fg-dim); border-radius: 7px; padding: 6px 10px;
    font-family: inherit; font-size: 12px; cursor: pointer;
  }
  .topbar .rhs select { background-color: var(--bg-3); }
  .topbar .rhs button:hover { color: var(--fg); border-color: var(--border-strong); }
  /* (light/dark sheets pick up --panel automatically) */

  /* Hamburger lives in the DOM but is invisible by default — only mobile gets it */
  .topbar .hamburger {
    display: none;
    background: var(--bg-3);
    border: 1px solid var(--panel-border);
    color: var(--fg-dim);
    border-radius: 7px;
    padding: 6px 8px;
    cursor: pointer;
    align-items: center; justify-content: center;
  }
  .globe-stage {
    grid-area: globe;
    position: relative;
    overflow: hidden;
  }
  .panel {
    grid-area: panel;
    position: relative;
    padding: 22px 18px 18px 18px;
    background: var(--panel);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid var(--panel-border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    z-index: 2;
  }
  .dropdown-item:hover { background: rgba(96,165,250,0.10) !important; }
  .filter-row:hover { background: rgba(96,165,250,0.05) !important; }
  .changelog-item:hover { border-color: var(--panel-border-strong) !important; transform: translateX(2px); }
  .welcome-flag:hover { background: var(--bg-3) !important; transform: translateY(-2px); border-color: var(--self) !important; }
  .welcome-loc:hover:not(:disabled) { background: var(--bg-2) !important; color: var(--fg) !important; }
  .picker-trigger:hover { border-color: var(--self) !important; }
  .zoom-btn:hover:not(:disabled) { background: var(--bg-3) !important; color: var(--self) !important; }
  .zoom-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
      grid-template-rows: 48px 1fr auto;
      grid-template-areas: "topbar" "globe" "panel";
    }
    .panel { max-height: 50vh; border-left: none; border-top: 1px solid var(--panel-border); }

    /* Compact mobile topbar: brand + mode toggle on the bar, everything else
       collapses into a dropdown opened by the hamburger.
       Nav + lang + settings live in a slide-down sheet so users no longer have
       to side-scroll to reach the language picker. */
    .topbar { padding: 0 10px; gap: 6px; }
    .topbar .brand { font-size: 13px; }
    .topbar .hamburger { display: inline-flex; margin-left: auto; }

    /* Nav + lang/settings collapse into a slide-down sheet behind the hamburger */
    .topbar-sheet { display: none; }
    .topbar.menu-open .topbar-sheet {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      position: absolute;
      top: 48px;
      right: 0;
      width: min(280px, 92vw);
      background: var(--panel);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--panel-border-strong);
      border-top: none;
      border-radius: 0 0 12px 12px;
      padding: 10px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.20);
      z-index: 7;
    }
    .topbar.menu-open .primary-nav {
      flex-direction: column; align-items: stretch; gap: 2px; flex: none;
    }
    .topbar.menu-open .primary-nav a { padding: 10px 12px; font-size: 14px; border-radius: 8px; }
    .topbar.menu-open .rhs {
      flex-direction: column; align-items: stretch; gap: 8px;
      margin-left: 0; padding-top: 8px; border-top: 1px solid var(--panel-border);
    }
    .topbar.menu-open .rhs select { padding: 10px 12px; font-size: 14px; width: 100%; }
    .topbar.menu-open .rhs > div { width: 100%; }
    .topbar.menu-open .rhs > div > button { flex: 1; }
  }
`;
document.head.appendChild(layoutStyle);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

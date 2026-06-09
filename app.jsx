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

  // One-time coach hint: the map being clickable isn't obvious to first-timers.
  // Show a dismissible nudge once a passport is set, until the first country
  // click (or manual dismiss). Persisted so it never nags returning users.
  const [coachDone, setCoachDone] = useState(() => {
    try { return !!localStorage.getItem("atlas.coachClick"); } catch (e) { return true; }
  });
  const dismissCoach = useCallback(() => {
    setCoachDone(true);
    try { localStorage.setItem("atlas.coachClick", "1"); } catch (e) {}
  }, []);

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
    if (!coachDone) dismissCoach();
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
          residencePermits={residencePermits}
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

        {!detailCountry && <ChangelogFloater />}

        {passport && !detailCountry && !showIntro && !coachDone && (
          <CoachHint onDismiss={dismissCoach} />
        )}
      </div>

      <Panel
        passport={passport}
        setPassport={setPassport}
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
        setDetailCountry={setDetailCountry}
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

// ─── Top nav bar ──────────────────────────────────────────────────────────
// Persistent across all in-app interactions. Hosts feature shortcuts, the
// language switcher, and the settings popover (no more hidden corner button).
function TopNav({ tweaks, setTweak, globeStyle, onGlobeStyleChange, onHelp }) {
  // Re-render when language changes
  const [, force] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  useEffect(() => {
    const onLang = () => force(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);
  // Collapse the mobile menu when tapping anywhere outside the top bar. Uses
  // pointerdown so it fires for touch on iOS (where a tap on a plain element
  // doesn't emit mousedown) — without this the menu can't be dismissed on iPhone
  // except by hitting the small ✕ icon.
  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [menuOpen]);
  // Close mobile menu when clicking a link inside it
  const closeMenu = () => setMenuOpen(false);
  return (
    <header ref={headerRef} className={"topbar" + (menuOpen ? " menu-open" : "")}>
      <a className="brand" href="/" aria-label="travelnow.info home">
        <span>travelnow.info</span>
      </a>
      <div className="topbar-sheet">
        <nav className="primary-nav">
          {/* Primary tools stay visible; the rest fold into a Tools ▾ menu so
              the bar isn't an 8-link wall (and doesn't overflow on laptops). */}
          <a href="/transit-map/" onClick={closeMenu}>{window.t("nav.transit_map")}</a>
          <a href="/itinerary/" onClick={closeMenu}>{window.t("nav.itinerary")}</a>
          <a href="/schengen-calculator/" onClick={closeMenu}>{window.t("nav.schengen")}</a>
          {/* visa-shortcuts + passport-validity dropped from the nav — that
              info now surfaces contextually in the country detail panel
              (ConditionsBox shortcuts + TripNotesGroup validity) when you tap
              a destination, so they don't need their own tabs. Pages kept for
              SEO / direct links. */}
          <ToolsDropdown closeMenu={closeMenu} items={[
            ["/etias/", window.t("nav.etias")],
            ["/digital-nomad-visa/", window.t("nav.nomad")],
            ["/citizenship-by-investment/", window.t("nav.cbi")],
            ["/alerts/", window.t("nav.alerts")],
          ]} />
        </nav>
      </div>
      {/* Right-hand controls live OUTSIDE the collapsible sheet so they stay
          visible on mobile too. 2D/3D + dark/light are always-visible inline
          toggles; the last control is just the language switcher. */}
      <div className="rhs">
        <InlineModeToggle value={globeStyle} onChange={onGlobeStyleChange} />
        <InlineThemeToggle tweaks={tweaks} setTweak={setTweak} />
        <span className="help-btn-wrap"><HelpButton onClick={onHelp} /></span>
        <SettingsButton inNav />
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

// "Tools ▾" — folds the secondary tool pages into one dropdown so the top
// bar shows a handful of primary links instead of eight. On mobile (inside
// the slide-down sheet) it expands inline; on desktop it's a popover.
function ToolsDropdown({ items, closeMenu }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    // pointerdown (not mousedown) so a tap outside also closes the menu on iOS
    // Safari, where mousedown doesn't fire reliably on non-button elements.
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [open]);
  return (
    <div ref={ref} className="tools-dd" style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="tools-dd-btn" style={{
        padding: "7px 10px", fontSize: 13, color: "var(--fg-dim)",
        background: "transparent", border: "none", borderRadius: 6, cursor: "pointer",
        fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      }}>
        {window.t("nav.tools")}
        <svg width="10" height="10" viewBox="0 0 12 12" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease", opacity: 0.6 }}>
          <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="tools-dd-menu" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
          minWidth: 200, background: "var(--panel)", backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)", border: "1px solid var(--panel-border-strong)",
          borderRadius: 10, padding: 6, boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          {items.map(([href, label]) => (
            <a key={href} href={href} onClick={() => { setOpen(false); closeMenu && closeMenu(); }}
              style={{ padding: "8px 10px", fontSize: 13, color: "var(--fg-dim)", textDecoration: "none", borderRadius: 6, whiteSpace: "nowrap" }}
              className="tools-dd-item">{label}</a>
          ))}
        </div>
      )}
    </div>
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

// Compact dark/light segmented toggle — sits inline in the top bar next to the
// 2D/3D toggle so theme is a one-tap, always-visible control (no longer hidden
// inside the gear popover). Same visual language as InlineModeToggle.
function InlineThemeToggle({ tweaks, setTweak }) {
  const cur = tweaks.background || "dark";
  const moon = (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" fill="currentColor"/>
    </svg>
  );
  const sun = (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" fill="currentColor"/>
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"/>
      </g>
    </svg>
  );
  const opts = [
    { v: "dark",  icon: moon, label: window.t("settings.theme_dark") },
    { v: "light", icon: sun,  label: window.t("settings.theme_light") },
  ];
  return (
    <div role="group" aria-label={window.t("settings.theme")}
      style={{ display: "inline-flex", background: "var(--bg-3)", border: "1px solid var(--panel-border)", borderRadius: 7, padding: 2, gap: 2 }}>
      {opts.map(o => {
        const on = cur === o.v;
        return (
          <button key={o.v} onClick={() => setTweak("background", o.v)}
            aria-pressed={on} aria-label={o.label} title={o.label}
            style={{
              border: "none", padding: "4px 8px", borderRadius: 5,
              background: on ? "var(--self)" : "transparent",
              color: on ? "#05070d" : "var(--fg-dim)",
              cursor: "pointer", display: "inline-flex", alignItems: "center",
            }}>
            {o.icon}
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
// Language switcher (top-right). This used to be a catch-all "settings" gear, but
// 2D/3D + dark/light are now always-visible inline toggles and compare/combine
// live in the side panel — so choosing the language is this control's only
// remaining job. Shows a globe + the current language code; opens a language list.
function SettingsButton({ inNav }) {
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
    // pointerdown (not mousedown) so a tap outside also closes it on iOS Safari.
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [open]);
  const curLang = window.ATLAS_LANG || "en";
  const langs = window.LANGS || [];
  const cur = langs.find(l => l.code === curLang) || langs[0] || { code: "en", native: "EN" };
  const popoverPos = inNav
    ? { position: "absolute", top: 40, right: 0, minWidth: 150 }
    : { position: "absolute", bottom: 44, right: 0, minWidth: 150 };
  const wrapperPos = inNav
    ? { position: "relative" }
    : { position: "absolute", bottom: 16, right: 16, zIndex: 5 };
  return (
    <div ref={ref} style={{ ...wrapperPos, zIndex: 10 }}>
      {open && (
        <div style={{
          ...popoverPos,
          background: "var(--panel)", backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)", borderRadius: 12,
          padding: 6, boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          {langs.map(l => {
            const on = l.code === curLang;
            return (
              <button key={l.code}
                onClick={() => { window.setLang(l.code); force(x => x + 1); setOpen(false); }}
                style={{
                  textAlign: "left", padding: "8px 10px", borderRadius: 6,
                  border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                  background: on ? "rgba(96,165,250,0.12)" : "transparent",
                  color: on ? "var(--fg)" : "var(--fg-dim)", fontWeight: on ? 600 : 400,
                  whiteSpace: "nowrap",
                }}>
                {l.native}
              </button>
            );
          })}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        aria-label={window.t("nav.language")}
        style={inNav ? {
          background: "var(--bg-3)", border: "1px solid var(--panel-border)",
          color: "var(--fg-dim)", borderRadius: 7, padding: "6px 8px",
          display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
          fontFamily: "inherit", fontSize: 12,
        } : {
          height: 36, borderRadius: 18, padding: "0 12px",
          background: "var(--panel)", backdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)",
          color: "var(--fg-dim)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 4px 16px rgba(0,0,0,0.30)", fontFamily: "inherit", fontSize: 12,
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M2 8h12M8 1.8c1.9 1.7 2.9 3.9 2.9 6.2S9.9 12.5 8 14.2C6.1 12.5 5.1 10.3 5.1 8S6.1 3.5 8 1.8z" stroke="currentColor" strokeWidth="1.1"/>
        </svg>
        <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>{(cur.code || "en").toUpperCase()}</span>
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
  const [, force] = useState(0);
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            flex: 1, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
            textTransform: "uppercase", letterSpacing: "0.12em",
          }}>travelnow.info</div>
          {/* Language switch right on the intro, so a visitor who landed in the
              wrong language can fix it before doing anything else. */}
          <select
            value={window.ATLAS_LANG || "en"}
            onChange={(e) => { window.setLang(e.target.value); force(x => x + 1); }}
            aria-label={window.t("nav.language")}
            style={{
              background: "var(--bg-3)", border: "1px solid var(--panel-border)",
              color: "var(--fg-dim)", borderRadius: 7, padding: "5px 8px",
              fontFamily: "inherit", fontSize: 12, cursor: "pointer",
            }}>
            {(window.LANGS || []).map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
          </select>
        </div>
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
// One-time discoverability nudge — the globe is clickable but nothing says so.
function CoachHint({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 9000); // auto-dismiss if ignored
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
        zIndex: 6, display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px", cursor: "pointer",
        background: "var(--panel)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        border: "1px solid var(--self)", borderRadius: 999,
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
        fontSize: 13, color: "var(--fg)", maxWidth: "calc(100% - 40px)",
        animation: "pulse 2.4s ease-in-out infinite",
      }}
    >
      <span style={{ fontSize: 15 }}>👆</span>
      <span>{window.t("coach.tap_country")}</span>
      <span style={{ color: "var(--fg-mute)", fontSize: 16, lineHeight: 1, marginLeft: 2 }}>×</span>
    </div>
  );
}

function Legend() {
  const items = [
    { k: "idc", fill: STATUS_COLOR.idc.fill, label: window.t("status.idc") },
    { k: "vf",  fill: STATUS_COLOR.vf.fill,  label: window.t("status.vf")  },
    { k: "eta", fill: STATUS_COLOR.eta.fill, label: window.t("status.eta") },
    { k: "ev",  fill: STATUS_COLOR.ev.fill,  label: window.t("status.ev")  },
    { k: "voa", fill: STATUS_COLOR.voa.fill, label: window.t("status.voa") },
    { k: "vr",  fill: STATUS_COLOR.vr.fill,  label: window.t("status.vr")  },
    { k: "ban", fill: STATUS_COLOR.ban.fill, label: window.t("status.ban") },
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
      top: 64,
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
  .topbar .tools-dd-btn:hover { color: var(--fg); background: var(--bg-3); }
  .topbar .tools-dd-item:hover { color: var(--fg); background: var(--bg-3); }
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
  /* Mobile bottom-sheet grabber is hidden on desktop; the mobile media query
     below flips it on and turns .panel into a draggable sheet. */
  .sheet-handle { display: none; }
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
      /* Globe fills the area; the panel is a draggable bottom sheet overlay. */
      grid-template-rows: 48px 1fr 0;
      grid-template-areas: "topbar" "globe" "panel";
    }
    .panel {
      position: fixed; left: 0; right: 0; bottom: 0;
      height: var(--sheet-h, 48vh);
      max-height: 92vh; min-height: 72px;
      border-left: none; border-top: 1px solid var(--panel-border-strong);
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -10px 30px rgba(0,0,0,0.30);
      padding-top: 4px;
      z-index: 8;
      transition: height 260ms cubic-bezier(.22,1,.36,1);
      overscroll-behavior: contain;
    }
    .panel.sheet-dragging { transition: none; }
    /* Drag grabber — only on mobile. Sticky at the top of the sheet so it never
       scrolls out of reach, and a tall hit area so it's easy to grab and pull
       the sheet back up. */
    /* flex:none is CRITICAL — the panel is a column flexbox and without it the
       handle (flex-shrink:1 by default) collapsed to ~5px once the content
       overflowed, leaving an almost untappable sliver. That, not the drag logic,
       is why the sheet felt dead. Keep it a full-height, easy drag target. */
    .sheet-handle {
      flex: none;
      display: flex; align-items: center; justify-content: center;
      height: 34px; margin: -4px -18px 2px; padding: 0 18px;
      cursor: grab; touch-action: none;
      position: sticky; top: 0; z-index: 3;
      background: var(--panel);
    }
    .sheet-handle:active { cursor: grabbing; }
    /* touch-action:none so iOS doesn't treat a press on the bar as a panel scroll
       (which cancelled the drag). No pointer-events:none — the press must reach a
       real, full-height target so the drag actually starts. */
    .sheet-grabber {
      width: 44px; height: 5px; border-radius: 999px;
      background: var(--fg-faint); opacity: 0.7; touch-action: none;
    }

    /* Compact mobile topbar: brand + mode toggle on the bar, everything else
       collapses into a dropdown opened by the hamburger.
       Nav + lang + settings live in a slide-down sheet so users no longer have
       to side-scroll to reach the language picker. */
    .topbar { padding: 0 10px; gap: 6px; }
    .topbar .brand { font-size: 13px; }
    /* rhs (margin-left:auto) pushes the control cluster to the right; the
       hamburger then sits just after it, so it only needs a small gap. */
    .topbar .hamburger { display: inline-flex; margin-left: 4px; }

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
    /* Tools dropdown: inline (static) inside the mobile sheet so its items
       stack in the column instead of floating as an absolute popover. */
    .topbar.menu-open .tools-dd { width: 100%; }
    .topbar.menu-open .tools-dd-btn { width: 100%; padding: 10px 12px; font-size: 14px; }
    .topbar.menu-open .tools-dd-menu { position: static !important; box-shadow: none; border: none; padding: 0 0 0 10px; min-width: 0; background: transparent; backdrop-filter: none; }
    .topbar.menu-open .tools-dd-item { padding: 9px 12px; font-size: 14px; }
    /* The control cluster (2D/3D · theme · gear) is no longer inside the
       collapsible sheet — it stays on the bar so those toggles are always one
       tap away on mobile. Keep it tight and drop the non-essential "?" help
       shortcut to save width on narrow phones. */
    .topbar .rhs { gap: 4px; }
    .topbar .help-btn-wrap { display: none; }
  }
`;
document.head.appendChild(layoutStyle);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// Main app — composes Globe + Panel, owns shared state, geolocation,
// keyboard shortcuts, Tweaks integration.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = {
  "globeStyle": "globe3d",
  "background": "dark",
  "compareMode": false,
};

// Lightweight user-preference store, persisted to localStorage so theme / mode
// choices survive page reloads. Replaces the original iframe-host based hook.
function useTweaks(defaults) {
  const [values, setValues] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      return { ...defaults, ...stored };
    } catch (e) { return defaults; }
  });
  const setTweak = useCallback((key, val) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem("atlas.tweaks", JSON.stringify(next)); } catch (e) {}
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

  const [passport, setPassport] = useState(null);
  const [compare, setCompare] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detailCountry, setDetailCountry] = useState(null);
  const [search, setSearch] = useState("");
  const [focusedCountry, setFocusedCountry] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | detected | denied
  const [autoDetectedPassport, setAutoDetectedPassport] = useState(null);
  const [direction, setDirection] = useState("outgoing"); // outgoing | incoming

  // ─── Default passport detection ─────────────────────────────────────────
  // Strategy:
  //   1. Try the geolocation API with a 4 s soft timeout — most accurate.
  //      Permission prompt is fine; user explicitly asked for this.
  //   2. On denial / unsupported / timeout → fall back to browser time-zone.
  //   3. If TZ is also unmapped → leave passport unset and show the welcome
  //      overlay. NEVER auto-pick the alphabetically-first passport.
  useEffect(() => {
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
  }, []);

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

  // ─── Keyboard: Esc closes detail / picker ───────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
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
  }, [detailCountry, showWelcome]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const onCountryClick = (iso2) => {
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
      <div className="globe-stage">
        <Globe
          passport={passport}
          comparePassport={t.compareMode ? compare : null}
          filter={filter}
          mode={t.globeStyle}
          direction={direction}
          onCountryClick={onCountryClick}
          focusedCountry={focusedCountry}
        />

        <ModeToggle value={t.globeStyle} onChange={(v) => setTweak("globeStyle", v)} />

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
      />

      {/* Settings popover (live in production — replaces the iframe-only TweaksPanel) */}
      <SettingsButton tweaks={t} setTweak={setTweak} />
    </div>
  );
}

// ─── Settings popover (light/dark + compare mode toggle) ──────────────────
function SettingsButton({ tweaks, setTweak }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "absolute", bottom: 16, right: 16, zIndex: 5 }}>
      {open && (
        <div style={{
          position: "absolute", bottom: 44, right: 0, minWidth: 220,
          background: "var(--panel)", backdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)", borderRadius: 12,
          padding: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          fontSize: 12, color: "var(--fg)",
        }}>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Theme</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["dark","Dark"],["light","Light"]].map(([v,l]) => (
              <button key={v} onClick={() => setTweak("background", v)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6,
                  border: "1px solid " + (tweaks.background === v ? "var(--self)" : "var(--panel-border)"),
                  background: tweaks.background === v ? "rgba(96,165,250,0.10)" : "var(--bg-3)",
                  color: "var(--fg)", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                }}>{l}</button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={!!tweaks.compareMode}
                   onChange={(e) => setTweak("compareMode", e.target.checked)} />
            <span>Compare two passports</span>
          </label>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        aria-label="Settings"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--panel)", backdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)",
          color: "var(--fg-dim)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
        }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
        }}>Pick your passport to begin</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px 0",
          lineHeight: 1.1,
        }}>
          Where in the world<br/>
          <span style={{ color: "var(--fg-mute)" }}>can you go without a visa?</span>
        </h1>
        <p style={{
          fontSize: 13,
          color: "var(--fg-dim)",
          lineHeight: 1.5,
          margin: "0 0 20px 0",
        }}>
          Select the passport you hold. The globe will paint every other country
          by what you'd need to enter today: visa-free, eVisa, visa on arrival, or visa required.
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
          {locationStatus === "detecting" ? "Detecting…" :
           locationStatus === "denied" ? "Couldn't detect location — pick one above" :
           "Use my current location"}
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
          Or open the panel for the full list of {window.PASSPORT_LIST.length} passports
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
    { k: "vf",  ...STATUS_COLOR.vf  },
    { k: "ev",  ...STATUS_COLOR.ev  },
    { k: "voa", ...STATUS_COLOR.voa },
    { k: "vr",  ...STATUS_COLOR.vr  },
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
          <div style={{ fontWeight: 500, color: "var(--fg)" }}>{a.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--vf)" }}>{sa} open</div>
        </div>
      </div>
      <div style={{ width: 1, background: "var(--panel-border-strong)" }} />
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid var(--compare-self)" }}>
        <span style={{ fontSize: 18 }}>{b.flag}</span>
        <div>
          <div style={{ fontWeight: 500, color: "var(--fg)" }}>{b.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--vf)" }}>{sb} open</div>
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
  }
  .globe-stage {
    position: relative;
    overflow: hidden;
  }
  .panel {
    position: relative;
    padding: 22px 18px 18px 18px;
    background: linear-gradient(180deg,
      rgba(15, 22, 38, 0.5) 0%,
      rgba(10, 15, 28, 0.85) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid var(--panel-border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    z-index: 2;
  }
  body.theme-light .panel, body.theme-paper .panel {
    background: linear-gradient(180deg,
      rgba(255, 252, 246, 0.5) 0%,
      rgba(240, 235, 220, 0.85) 100%);
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
    .layout { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
    .panel { max-height: 50vh; border-left: none; border-top: 1px solid var(--panel-border); }
  }
`;
document.head.appendChild(layoutStyle);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

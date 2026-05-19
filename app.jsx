// Main app — composes Globe + Panel, owns shared state, geolocation,
// keyboard shortcuts, Tweaks integration.

const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "globeStyle": "globe3d",
  "background": "dark",
  "compareMode": false
}/*EDITMODE-END*/;

// Map common timezones → ISO2 codes, for default-passport detection.
const TZ_FALLBACK = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Halifax": "CA",
  "America/Mexico_City": "MX", "America/Monterrey": "MX",
  "America/Sao_Paulo": "BR", "America/Recife": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "Europe/London": "GB", "Europe/Dublin": "IE",
  "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES",
  "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE",
  "Europe/Zurich": "CH", "Europe/Vienna": "AT",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Europe/Lisbon": "PT",
  "Europe/Moscow": "RU", "Europe/Warsaw": "PL", "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK",
  "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Jakarta": "ID",
  "Asia/Manila": "PH", "Asia/Bangkok": "TH", "Asia/Ho_Chi_Minh": "VN",
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK", "Asia/Dhaka": "BD",
  "Asia/Tehran": "IR", "Asia/Riyadh": "SA", "Asia/Dubai": "AE", "Asia/Qatar": "QA",
  "Asia/Tel_Aviv": "IL", "Asia/Jerusalem": "IL",
  "Africa/Cairo": "EG", "Africa/Lagos": "NG", "Africa/Johannesburg": "ZA",
  "Africa/Nairobi": "KE", "Africa/Algiers": "DZ", "Africa/Casablanca": "MA",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | detected | denied

  // ─── Default passport detection ─────────────────────────────────────────
  useEffect(() => {
    // Try real geolocation as the user requested. Bail out fast on denial or
    // sandboxed iframes that block it; the welcome overlay handles fallback.
    if (!navigator.geolocation) {
      setShowWelcome(true);
      return;
    }
    setLocationStatus("detecting");
    let resolved = false;
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLocationStatus("denied");
        setShowWelcome(true);
      }
    }, 4500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
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
        // Got coords but reverse-geocode failed → fall back to TZ
        const fromTZ = detectPassport();
        if (fromTZ) { setPassport(fromTZ); setLocationStatus("detected"); setShowWelcome(false); }
        else { setLocationStatus("denied"); setShowWelcome(true); }
      },
      (err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(fallbackTimer);
        setLocationStatus("denied");
        setShowWelcome(true);
      },
      { timeout: 4000, maximumAge: 600000 }
    );
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
        filter={filter}
        setFilter={setFilter}
        detailCountry={detailCountry}
        setDetailCountry={setDetailCountry}
        search={search}
        setSearch={setSearch}
        onPickFromSearch={onPickFromSearch}
        showCompare={t.compareMode}
      />

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Globe" />
        <TweakRadio
          label="Style"
          value={t.globeStyle}
          options={[
            { value: "globe3d", label: "3D" },
            { value: "globe2d", label: "2D" },
            { value: "flat", label: "Map" },
          ]}
          onChange={(v) => setTweak("globeStyle", v)}
        />
        <TweakSection label="Theme" />
        <TweakRadio
          label="Background"
          value={t.background}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(v) => setTweak("background", v)}
        />
        <TweakSection label="Features" />
        <TweakToggle
          label="Compare two passports"
          value={t.compareMode}
          onChange={(v) => setTweak("compareMode", v)}
        />
      </TweaksPanel>
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

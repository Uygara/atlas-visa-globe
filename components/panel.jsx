// Side panel — passport picker, tally, search, country detail, recently-changed feed.

// Pretty label for a residence-permit bloc code (used in the detail-card
// "unlocked by your permit" banner). Falls back to the raw code for unknowns
// (e.g. when applyResidenceUpgrade tags a specific GCC member like "AE").
function _permitLabel(code) {
  const map = {
    SCHENGEN: "Schengen", US: "US", GB: "UK", CA: "Canada", AU: "Australia/NZ", GCC: "GCC",
    AE: "UAE", SA: "Saudi", KW: "Kuwait", QA: "Qatar", BH: "Bahrain", OM: "Oman",
  };
  return map[code] || code;
}

function Panel({
  passport, setPassport,
  compare, setCompare, compareMode, setCompareMode,
  groupMode, setGroupMode, groupPassports, setGroupPassports,
  filter, setFilter,
  detailCountry, setDetailCountry,
  search, setSearch,
  onPickFromSearch,
  showCompare,
  direction, setDirection,
  variant, setVariant,
  residencePermits, setResidencePermits,
  pickerMode, setPickerMode,
}) {
  const [showPicker, setShowPickerRaw] = useState(false);
  const [showComparePicker, setShowComparePickerRaw] = useState(false);
  // Wrap the open setters so we also report the open state up to App, which
  // uses it to route map clicks into the picker (Blok 2 — pick passport by
  // tapping a country on the globe).
  const setShowPicker = (v) => {
    setShowPickerRaw(v);
    if (setPickerMode) setPickerMode(v ? "primary" : null);
    if (v) setShowComparePickerRaw(false);
  };
  const setShowComparePicker = (v) => {
    setShowComparePickerRaw(v);
    if (setPickerMode) setPickerMode(v ? "compare" : null);
    if (v) setShowPickerRaw(false);
  };
  // Force re-render whenever the user switches language.
  const [, forceLangTick] = useState(0);
  useEffect(() => {
    const onLang = () => forceLangTick(x => x + 1);
    window.addEventListener("atlas:lang", onLang);
    return () => window.removeEventListener("atlas:lang", onLang);
  }, []);
  const groupActive = groupMode && groupPassports && groupPassports.length > 0;
  const tallyData = groupActive
    ? window.tallyGroup(groupPassports)
    : (passport
        ? (direction === "incoming"
            ? window.tallyIncoming(passport)
            : (variant && variant !== "ordinary"
                ? window.tallyVariant(passport, variant)
                : window.tally(passport)))
        : null);

  return (
    <aside className="panel">
      <MobileSheetHandle />
      <PanelHeader />

      <PassportPicker
        label={window.t("panel.your_passport")}
        value={passport}
        open={showPicker}
        setOpen={setShowPicker}
        onChange={(v) => { setPassport(v); setShowPicker(false); }}
      />

      {passport && setVariant && window.passportVariants && window.passportVariants(passport).length > 0 && (
        <PassportTypeSelector
          passport={passport}
          value={variant || "ordinary"}
          onChange={setVariant}
        />
      )}

      {passport && setResidencePermits && (
        <ResidencePermitPicker
          value={residencePermits || []}
          onChange={setResidencePermits}
        />
      )}

      {passport && setGroupMode && setGroupPassports && !groupMode && (
        <DualCitizenshipHint
          primary={passport}
          onAccept={(secondary) => {
            // Switch to Combine mode (which models ONE traveller holding two
            // passports → best status per destination) and pre-populate the
            // group with [primary, suggested-secondary]. The user can still
            // remove the secondary inside the GroupPicker that appears below.
            setGroupPassports([passport, secondary]);
            setGroupMode(true);
            if (setCompareMode) setCompareMode(false);
          }}
        />
      )}

      {/* ── Core: show the result (tally) + how to explore (search) FIRST, so a
          first-time visitor gets the payoff immediately. Direction sits with
          the tally because it changes what the count means. ── */}
      {passport && !groupMode && (
        <DirectionToggle value={direction} onChange={setDirection} />
      )}

      {tallyData && (
        <Tally tally={tallyData} filter={filter} setFilter={setFilter} passport={passport} groupActive={groupActive} />
      )}

      <CountrySearch
        passport={passport}
        search={search}
        setSearch={setSearch}
        onPick={onPickFromSearch}
      />

      {passport === "US" && !groupActive && direction !== "incoming" && (
        <PopularDestinations passport={passport} onPick={onPickFromSearch} />
      )}

      {/* ── Advanced modes (compare / group) come after the core result. ── */}
      {passport && setCompareMode && setGroupMode && (
        <ModeBar
          compareMode={compareMode}
          setCompareMode={setCompareMode}
          groupMode={groupMode}
          setGroupMode={setGroupMode}
        />
      )}

      {showCompare && !groupMode && (
        <PassportPicker
          label={window.t("panel.compare_with")}
          value={compare}
          open={showComparePicker}
          setOpen={setShowComparePicker}
          onChange={(v) => { setCompare(v); setShowComparePicker(false); }}
          accent="var(--compare-self)"
          placeholder={window.t("picker.pick_second")}
          allowClear
        />
      )}

      {groupMode && (
        <GroupPicker
          primary={passport}
          values={groupPassports || []}
          onChange={setGroupPassports}
        />
      )}

      {detailCountry && (passport || groupActive) && (
        <DetailCard
          passport={passport}
          compare={compareMode && !groupMode ? compare : null}
          groupPassports={groupActive ? groupPassports : null}
          iso2={detailCountry}
          direction={direction}
          variant={variant}
          onClose={() => setDetailCountry(null)}
        />
      )}

      {/* ── "For you" — secondary, daily-return content, collapsible so the
          first screen can stay focused on the core result. ── */}
      {!detailCountry && passport && (
        <ForYouSection>
          <WeeklyDigest passport={passport} />
          {!groupActive && <PassportPulse passport={passport} />}
          <WatchlistCard onOpen={(iso2) => { setDetailCountry(iso2); }} />
          <ItineraryCTA />
          {!groupActive && <DailySuggestion passport={passport} onOpen={(iso2) => { setDetailCountry(iso2); }} />}
          <PassportNewsFeed passport={passport} />
        </ForYouSection>
      )}

      {!detailCountry && !passport && (
        <WatchlistCard onOpen={(iso2) => { setDetailCountry(iso2); }} />
      )}

      <PanelFooter />
    </aside>
  );
}

// Collapsible "For you" block — keeps the daily-return widgets available
// without dominating the first screen. Collapse state persists.
function ForYouSection({ children }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem("atlas.foryou.collapsed") !== "1"; }
    catch (e) { return true; }
  });
  const toggle = () => {
    setOpen(o => {
      const next = !o;
      try { localStorage.setItem("atlas.foryou.collapsed", next ? "0" : "1"); } catch (e) {}
      return next;
    });
  };
  return (
    <div>
      <button onClick={toggle} aria-expanded={open} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        marginTop: 4, marginBottom: 10, paddingTop: 12, paddingBottom: 0,
        background: "transparent", border: "none", borderTop: "1px solid var(--panel-border)",
        color: "var(--fg-faint)", cursor: "pointer", textAlign: "left",
        fontSize: 10, fontFamily: "var(--font-mono)",
        textTransform: "uppercase", letterSpacing: "0.12em",
      }}>
        <span style={{ flex: 1 }}>{window.t("panel.for_you")}</span>
        <svg width="11" height="11" viewBox="0 0 12 12" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease", opacity: 0.6 }}>
          <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

// Mobile-only drag handle that turns the side panel into a draggable bottom
// sheet (snap points: peek / half / full). Hidden on desktop via CSS. Drives
// the panel height through the --sheet-h custom property; tap cycles snaps.
function MobileSheetHandle() {
  const ref = useRef(null);
  useEffect(() => {
    const handle = ref.current;
    const panel = handle && handle.closest(".panel");
    if (!panel) return;
    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
    const snaps = () => [96, Math.round(window.innerHeight * 0.48), Math.round(window.innerHeight * 0.88)];
    let startY = 0, startH = 0, dragging = false, moved = false, lastH = 0;
    const setH = (h) => { lastH = h; panel.style.setProperty("--sheet-h", h + "px"); };
    const curH = () => panel.getBoundingClientRect().height;
    const nearest = (h) => snaps().reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
    const down = (e) => {
      if (!isMobile()) return;
      dragging = true; moved = false;
      startY = e.clientY; startH = curH(); lastH = startH;
      panel.classList.add("sheet-dragging");
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const move = (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      if (Math.abs(dy) > 3) moved = true;
      setH(Math.min(window.innerHeight * 0.92, Math.max(72, startH + dy)));
    };
    // Snap based on lastH (the height we actually set during the drag), NOT a
    // fresh getBoundingClientRect — re-reading after re-enabling the transition
    // returns the pre-animation height and snaps to the wrong (often original)
    // position. lastH is deterministic.
    const settle = () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("sheet-dragging");
      if (!moved) {
        // Tap → cycle to the next snap (peek → half → full → peek).
        const order = snaps();
        const i = order.indexOf(nearest(curH()));
        setH(order[(i + 1) % order.length]);
      } else {
        setH(nearest(lastH));
      }
    };
    const up = settle;
    // iOS Safari fires pointercancel (not pointerup) when it reclassifies a touch
    // as a scroll. Without handling it, `dragging` stayed stuck true and the sheet
    // felt dead. Settle the same way so the drag always resolves.
    const cancel = settle;
    handle.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      handle.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);
  return (
    <div ref={ref} className="sheet-handle" aria-hidden="true">
      <span className="sheet-grabber" />
    </div>
  );
}

function PanelHeader() {
  const date = new Date(window.SNAPSHOT_DATE + "T00:00:00");
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <header style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <a href="/" style={{
          fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
          fontFamily: "var(--font-mono)", color: "var(--fg)", textDecoration: "none",
        }}>travelnow.info</a>
        <div style={{
          marginLeft: "auto",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--fg-mute)",
          letterSpacing: "0.04em",
        }}>
          {window.t("header.updated")} {formatted}
        </div>
      </div>
      <p style={{
        margin: "6px 0 0 0",
        fontSize: 12,
        color: "var(--fg-mute)",
        lineHeight: 1.45,
      }}>
        {window.t("header.tagline")}
      </p>
    </header>
  );
}

function Logomark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--self)" strokeWidth="1.4" />
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="var(--self)" strokeWidth="1.4" />
      <path d="M2 12 H22" stroke="var(--self)" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2" fill="var(--vf)" />
    </svg>
  );
}

// Segmented control under the passport picker for passports that have
// type variants (TR has hususi / hizmet / diplomatik on top of bordo;
// other countries will appear here as the scraper populates them).
// Ordinary is always first and is the implicit default.
function PassportTypeSelector({ passport, value, onChange }) {
  const variants = window.passportVariants(passport);
  if (!variants.length) return null;
  const lang = window.ATLAS_LANG || "en";
  const opts = [
    { key: "ordinary",
      label: window.passportVariantLabel(passport, "ordinary"),
      sub: null,
      source: null,
    },
    ...variants.map(k => {
      const e = window.PASSPORT_VARIANTS[passport][k];
      return {
        key: k,
        label: window.passportVariantLabel(passport, k),
        sub: lang === "tr" ? (e.sub || null) : (e.subEn || e.sub || null),
        source: e.source || null,
      };
    }),
  ];
  const active = opts.find(o => o.key === value) || opts[0];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
      }}>{window.t("panel.passport_type")}</div>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: 3,
        background: "var(--bg-2)", borderRadius: 10,
        border: "1px solid var(--panel-border)",
      }}>
        {opts.map(o => {
          const on = o.key === value;
          return (
            <button key={o.key} onClick={() => onChange(o.key)}
              style={{
                flex: "1 1 0", minWidth: 0, padding: "7px 6px", borderRadius: 7,
                border: "none",
                background: on ? "var(--self)" : "transparent",
                color: on ? "#05070d" : "var(--fg-dim)",
                fontFamily: "inherit", fontSize: 11,
                fontWeight: on ? 600 : 500, cursor: "pointer",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
              title={o.label}>
              {o.label}
            </button>
          );
        })}
      </div>
      {(active.sub || active.source) && (
        <div style={{
          marginTop: 6, fontSize: 11, color: "var(--fg-mute)",
          lineHeight: 1.5,
        }}>
          {active.sub}
          {active.source && (
            <> · <a href={active.source} target="_blank" rel="noopener nofollow"
                    style={{ color: "var(--fg-mute)", textDecoration: "none",
                             borderBottom: "1px dotted var(--fg-faint)" }}>
              {window.t("cond.source")}
            </a></>
          )}
        </div>
      )}
      {value !== "ordinary" && (
        <div style={{
          marginTop: 6, fontSize: 10, color: "var(--fg-faint)",
          fontFamily: "var(--font-mono)",
        }}>
          {window.t("panel.variant_disclaimer")}
        </div>
      )}
    </div>
  );
}

// Residence-permit picker — a row of 6 chips (Schengen / US / UK / Canada /
// Australia / GCC). When the user selects one or more, the resolver applies
// the matching upgrades and the whole map repaints. Only the 6 well-documented
// blocs are surfaced; per-country permits are too varied and too thin in the
// source data to expose without diluting the list.
function ResidencePermitPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  // Localised label + emoji for each bloc. Falls back to a generic English
  // label when i18n hasn't been wired (so it never reads as a missing key).
  const T = (k, fallback) => { const v = window.t ? window.t(k) : k; return v === k ? fallback : v; };
  const blocs = [
    { key: "SCHENGEN", flag: "🇪🇺", label: T("permits.schengen", "Schengen residence") },
    { key: "US",       flag: "🇺🇸", label: T("permits.us",       "US Green Card / visa") },
    { key: "GB",       flag: "🇬🇧", label: T("permits.gb",       "UK ILR / visa") },
    { key: "CA",       flag: "🇨🇦", label: T("permits.ca",       "Canada PR / visa") },
    { key: "AU",       flag: "🇦🇺", label: T("permits.au",       "Australia / NZ PR") },
    { key: "GCC",      flag: "🇸🇦", label: T("permits.gcc",      "GCC residence") },
  ];
  const set = new Set(value);
  const toggle = (k) => {
    const next = new Set(set);
    if (next.has(k)) next.delete(k); else next.add(k);
    onChange([...next]);
  };
  const active = value.length > 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          background: active ? "rgba(96,165,250,0.10)" : "transparent",
          border: "1px " + (active ? "solid var(--self)" : "dashed var(--panel-border-strong)"),
          borderRadius: 8, color: "var(--fg)",
          fontFamily: "inherit", fontSize: 12, cursor: "pointer",
        }}>
        <span style={{ fontSize: 14 }}>🪪</span>
        <span style={{ flex: 1, textAlign: "left" }}>
          {active
            ? T("permits.active", "Holding") + " " + value.map(v => {
                const b = blocs.find(x => x.key === v); return b ? b.flag : v;
              }).join(" ")
            : T("permits.add", "Also have a residence permit? Add it →")}
        </span>
        <span style={{ fontSize: 10, color: "var(--fg-mute)" }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div style={{
          marginTop: 6, padding: "8px 6px",
          background: "var(--bg-2)",
          border: "1px solid var(--panel-border)",
          borderRadius: 8,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {blocs.map(b => {
              const on = set.has(b.key);
              return (
                <label key={b.key} style={{
                  display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                  padding: "6px 8px", borderRadius: 6, fontSize: 12,
                  background: on ? "rgba(96,165,250,0.08)" : "transparent",
                  border: "1px solid " + (on ? "var(--self)" : "transparent"),
                }}>
                  <input type="checkbox" checked={on} onChange={() => toggle(b.key)}
                         style={{ accentColor: "var(--self)" }} />
                  <span style={{ fontSize: 13 }}>{b.flag}</span>
                  <span style={{ flex: 1, color: on ? "var(--fg)" : "var(--fg-dim)" }}>{b.label}</span>
                </label>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-faint)", marginTop: 6, lineHeight: 1.4, padding: "0 4px" }}>
            {T("permits.hint", "Holding any of these unlocks easier entry to certain destinations — the map and the tally update automatically.")}
          </div>
        </div>
      )}
    </div>
  );
}

// Most-visited destinations for the active passport — currently curated only
// for US (the site's largest audience). Eight chips, one tap → that country's
// detail card, with a live status dot so the answer ("do I need anything?") is
// visible before tapping. Destination list = top US outbound markets per the
// U.S. Commerce Dept / NTTO outbound statistics (Mexico, Canada, UK, France,
// Italy, Dominican Republic, Japan, Spain) — stable year over year, no
// scraping needed. Extend _POPULAR_DESTS with another passport's list if
// another audience grows.
const _POPULAR_DESTS = {
  US: ["MX", "CA", "GB", "FR", "IT", "DO", "JP", "ES"],
};
function PopularDestinations({ passport, onPick }) {
  const dests = _POPULAR_DESTS[passport];
  if (!dests) return null;
  const T = (k, fallback) => { const v = window.t ? window.t(k) : k; return v === k ? fallback : v; };
  const statusColor = (s) =>
    ({ idc: "var(--idc)", vf: "var(--vf)", eta: "var(--eta)", ev: "var(--ev)",
       voa: "var(--voa)", vr: "var(--vr)", ban: "var(--ban)" }[s] || "var(--na)");
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
        color: "var(--fg-mute)", textTransform: "uppercase", marginBottom: 6,
      }}>
        {T("popular.title", "Popular with US travelers")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {dests.map(iso2 => {
          const c = (window.COUNTRIES || []).find(x => x.iso2 === iso2);
          if (!c) return null;
          const r = window.resolveStatus(passport, iso2);
          return (
            <button key={iso2} onClick={() => onPick(iso2)}
              title={c.name}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 9px", borderRadius: 999, cursor: "pointer",
                background: "var(--bg-2)", border: "1px solid var(--panel-border)",
                color: "var(--fg-dim)", fontFamily: "inherit", fontSize: 11.5,
              }}>
              <span style={{ fontSize: 13 }}>{c.flag}</span>
              <span>{c.name}</span>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: statusColor(r.status), flex: "none",
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dual-citizenship hint — shown under the passport picker for primary passports
// whose holders very often (or commonly) hold a second, stronger passport.
// Tapping the "Add" CTA pre-populates Combine mode with both passports so the
// map repaints with the user's BEST access. Source data + strength tiers live
// in data/dual-citizenship.js. Quiet (1 line + 1 CTA) so it never feels like
// an ad; only renders if a hint exists for the active passport.
function DualCitizenshipHint({ primary, onAccept }) {
  const hints = window.DUAL_CITIZENSHIP_HINTS;
  if (!hints || !hints[primary]) return null;
  const hint = hints[primary];
  // Look up the suggested-passport's display name + flag from PASSPORT_LIST
  // (loaded by frontend-tail.js) so we render the same human label as the
  // picker. Bail silently if the secondary isn't a known passport.
  const list = window.PASSPORT_LIST || [];
  const sec = list.find(p => p.iso2 === hint.suggest);
  if (!sec) return null;
  // Try a localised verb based on strength; fall back to the EN reason in the
  // dict so we never render a missing key.
  const T = (k, fallback) => {
    const v = window.t ? window.t(k) : k;
    return v === k ? fallback : v;
  };
  const verbKey = hint.strength === "strong"
    ? T("dual.likely", "You probably also hold")
    : hint.strength === "common"
      ? T("dual.may_hold", "Many also hold")
      : T("dual.may_qualify", "You may also qualify for");
  const ctaLabel = T("dual.add_passport", "Add it →");
  // Country flag via the countries list (it carries the flag emoji).
  const cflag = (window.COUNTRIES || []).find(c => c.iso2 === hint.suggest);
  const flagStr = (cflag && cflag.flag) || "🪪";
  return (
    <div style={{
      marginBottom: 14, padding: "10px 12px",
      background: "rgba(96,165,250,0.08)",
      border: "1px solid rgba(96,165,250,0.32)",
      borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{flagStr}</span>
      <div style={{ flex: 1, fontSize: 12, color: "var(--fg)", lineHeight: 1.4 }}>
        <strong style={{ color: "var(--self)" }}>{verbKey}</strong>{" "}
        {T("dual.a_passport", "a")} {sec.name} {T("dual.passport_word", "passport")}.
        <div style={{ fontSize: 10.5, color: "var(--fg-mute)", marginTop: 2 }}>
          {hint.reason}
        </div>
      </div>
      <button onClick={() => onAccept(hint.suggest)}
        style={{
          background: "var(--self)", color: "#05070d",
          border: "none", borderRadius: 7,
          padding: "7px 11px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        }}>
        {ctaLabel}
      </button>
    </div>
  );
}

// Compare / group mode toggles, always visible under the passport picker.
// Compare and group are mutually exclusive in the UI — enabling one disables
// the other so the panel never shows two competing secondary pickers.
function ModeBar({ compareMode, setCompareMode, groupMode, setGroupMode }) {
  const toggleCompare = () => {
    const next = !compareMode;
    setCompareMode(next);
    if (next && groupMode) setGroupMode(false);
  };
  const toggleGroup = () => {
    const next = !groupMode;
    setGroupMode(next);
    if (next && compareMode) setCompareMode(false);
  };
  const chip = (on, onClick, label, accent) => (
    <button onClick={onClick} aria-pressed={on}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        fontFamily: "inherit", fontSize: 12, fontWeight: on ? 600 : 500,
        border: "1px solid " + (on ? accent : "var(--panel-border-strong)"),
        background: on ? "rgba(96,165,250,0.10)" : "transparent",
        color: on ? "var(--fg)" : "var(--fg-mute)",
        transition: "all 160ms ease",
      }}>
      <span style={{ color: accent, fontSize: 14, lineHeight: 1 }}>{on ? "✓" : "+"}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
  return (
    <div style={{
      marginBottom: 14, padding: "11px 12px",
      background: "var(--bg-2)", border: "1px solid var(--panel-border-strong)",
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>🪪</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{window.t("modes.title")}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", lineHeight: 1.4, marginBottom: 9 }}>
        {window.t("modes.hint")}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {chip(compareMode, toggleCompare, window.t("mode.compare_short"), "var(--compare-self)")}
        {chip(groupMode, toggleGroup, window.t("mode.group_short"), "var(--self)")}
      </div>
    </div>
  );
}

function DirectionToggle({ value, onChange }) {
  // "outgoing" — colour each country by what *I* need to enter it.
  // "incoming" — colour each country by what *its citizens* need to visit me.
  // The toggle used to be a quiet little segmented control buried in the
  // panel; users couldn't find it. Now it's a labelled card with an icon
  // on each side so the meaning of each direction is unambiguous.
  const opts = [
    { v: "outgoing", l: window.t("panel.outgoing"),  hint: window.t("panel.outgoing_hint"),  emoji: "✈️" },
    { v: "incoming", l: window.t("panel.incoming"),  hint: window.t("panel.incoming_hint"),  emoji: "🛬" },
  ];
  const active = opts.find(o => o.v === (value || "outgoing"));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 2,
          background: "var(--self)", boxShadow: "0 0 6px var(--self)",
        }} />
        {window.t("panel.direction")}
      </div>
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "var(--bg-2)", borderRadius: 10,
        border: "1px solid var(--panel-border-strong)",
      }}>
        {opts.map(o => {
          const on = o.v === (value || "outgoing");
          return (
            <button key={o.v} onClick={() => onChange(o.v)}
              title={o.hint}
              style={{
                flex: 1, padding: "9px 8px", borderRadius: 7,
                border: "none",
                background: on ? "var(--self)" : "transparent",
                color: on ? "#05070d" : "var(--fg-dim)",
                fontFamily: "inherit", fontSize: 12,
                fontWeight: on ? 600 : 500,
                cursor: "pointer",
                transition: "background 160ms ease, color 160ms ease",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
                lineHeight: 1.2,
              }}>
              <span style={{ fontSize: 14 }}>{o.emoji}</span>
              <span>{o.l}</span>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6, lineHeight: 1.5 }}>
        {active?.hint}
      </div>
    </div>
  );
}

// Group mode picker: up to 4 passports. The primary passport (top picker) is
// auto-included if the user hasn't deselected it.
function GroupPicker({ primary, values, onChange }) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const MAX = 10; // one person can realistically combine several passports/residencies

  // Auto-seed with the primary the first time the picker mounts.
  useEffect(() => {
    if (primary && values.length === 0) onChange([primary]);
  }, [primary]); // eslint-disable-line

  const remove = (iso) => onChange(values.filter(v => v !== iso));
  const add = (iso) => {
    if (values.includes(iso) || values.length >= MAX) { setPickerOpen(false); return; }
    onChange([...values, iso]);
    setPickerOpen(false);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--vf)", boxShadow: "0 0 6px var(--vf)" }} />
        {window.t("group.label")} ({values.length}/{MAX})
      </div>

      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--panel-border-strong)",
        borderRadius: 10,
        padding: 10,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: values.length ? 8 : 0 }}>
          {values.map(iso => {
            const c = window.byIso2[iso];
            if (!c) return null;
            return (
              <div key={iso} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--bg-3)", border: "1px solid var(--panel-border)",
                borderRadius: 999, padding: "5px 10px", fontSize: 12,
              }}>
                <span style={{ fontSize: 14 }}>{c.flag}</span>
                <span>{window.countryName(iso)}</span>
                <button
                  onClick={() => remove(iso)}
                  aria-label={window.t("group.remove", { name: window.countryName(iso) })}
                  style={{ background: "transparent", border: "none", color: "var(--fg-mute)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
        {values.length < MAX && (
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            style={{
              width: "100%", padding: "8px 10px",
              background: "transparent",
              border: "1px dashed var(--panel-border-strong)",
              borderRadius: 8, color: "var(--fg-dim)",
              cursor: "pointer", fontFamily: "inherit", fontSize: 12,
            }}>
            {window.t("group.add_passport")}
          </button>
        )}
      </div>

      {pickerOpen && (
        <GroupAddDropdown
          existing={values}
          onPick={add}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function GroupAddDropdown({ existing, onPick, onClose }) {
  const [q, setQ] = useState("");
  const filtered = window.PASSPORT_LIST
    .filter(p => !existing.includes(p.iso2))
    .filter(p => {
      if (!q) return true;
      const ql = q.toLowerCase();
      return p.name.toLowerCase().includes(ql)
          || window.countryName(p.iso2).toLowerCase().includes(ql)
          || p.iso2.toLowerCase().includes(ql);
    })
    .slice(0, 50);
  return (
    <div style={{
      marginTop: 6, background: "var(--bg-2)",
      border: "1px solid var(--panel-border-strong)", borderRadius: 10,
      overflow: "hidden",
    }}>
      <input autoFocus type="text" placeholder={window.t("picker.search")} value={q} onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px", background: "transparent",
          border: "none", borderBottom: "1px solid var(--panel-border)",
          color: "var(--fg)", fontSize: 13, outline: "none",
        }} />
      <div style={{ maxHeight: 200, overflow: "auto" }}>
        {filtered.map(p => {
          const c = window.byIso2[p.iso2];
          return (
            <button key={p.iso2} onClick={() => onPick(p.iso2)}
              style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                padding: "7px 12px", background: "transparent", border: "none",
                color: "var(--fg)", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                borderBottom: "1px solid rgba(148,173,220,0.05)",
              }}>
              <span style={{ fontSize: 16 }}>{c?.flag}</span>
              <span>{window.countryName(p.iso2)}</span>
              <span style={{ marginLeft: "auto", color: "var(--fg-mute)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{p.iso2}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 14, color: "var(--fg-mute)", fontSize: 12 }}>{window.t("picker.no_matches_short")}</div>
        )}
      </div>
    </div>
  );
}

function PassportPicker({ label, value, open, setOpen, onChange, accent, placeholder, allowClear }) {
  const current = value ? window.PASSPORTS[value] : null;
  const country = value ? window.byIso2[value] : null;
  const accentColor = accent || "var(--self)";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        color: "var(--fg-mute)",
        textTransform: "uppercase",
        letterSpacing: "0.10em",
        marginBottom: 6,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 2,
          background: accentColor, boxShadow: `0 0 6px ${accentColor}`,
        }} />
        {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="picker-trigger"
        style={{
          width: "100%",
          background: open ? "var(--bg-3)" : "var(--bg-2)",
          border: `1px solid ${open ? accentColor : "var(--panel-border-strong)"}`,
          borderRadius: 10,
          padding: "10px 12px",
          color: "var(--fg)",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "inherit",
          fontSize: 14,
          transition: "all 180ms ease",
        }}
      >
        {country ? (
          <>
            <span style={{ fontSize: 20 }}>{country.flag}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {window.countryName(value)}
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 6 }}>
                {current?.rank && <span>Rank #{current.rank}</span>}
                <span>· {value}</span>
              </div>
            </div>
          </>
        ) : (
          <span style={{ color: "var(--fg-mute)" }}>{placeholder || window.t("picker.select_passport")}</span>
        )}
        <Caret rotated={open} />
      </button>
      {open && (
        <PassportDropdown
          value={value}
          onChange={onChange}
          allowClear={allowClear}
          onClear={() => { onChange(null); setOpen(false); }}
        />
      )}
    </div>
  );
}

function Caret({ rotated }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: rotated ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0, opacity: 0.5 }}>
      <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PassportDropdown({ value, onChange, allowClear, onClear }) {
  const [q, setQ] = useState("");
  // Pin the currently-selected passport to the top of the dropdown so that
  // after the user taps a country on the map, opening the picker again shows
  // their pick right at the top with a SELECTED badge. The rest of the list
  // follows in its normal order.
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    const filtered = window.PASSPORT_LIST.filter(p => {
      if (!ql) return true;
      return p.name.toLowerCase().includes(ql)
          || window.countryName(p.iso2).toLowerCase().includes(ql)
          || p.iso2.toLowerCase().includes(ql);
    });
    if (!value) return filtered;
    const idx = filtered.findIndex(p => p.iso2 === value);
    if (idx <= 0) return filtered;
    const [selected] = filtered.splice(idx, 1);
    return [selected, ...filtered];
  }, [q, value]);
  return (
    <div style={{
      marginTop: 6,
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border-strong)",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
    }}>
      <input
        autoFocus
        placeholder={window.t("picker.search_passports")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--panel-border)",
          padding: "10px 12px",
          color: "var(--fg)",
          fontFamily: "inherit",
          fontSize: 13,
          outline: "none",
        }}
      />
      <div style={{
        padding: "8px 12px",
        background: "rgba(96,165,250,0.06)",
        borderBottom: "1px solid var(--panel-border)",
        fontSize: 11,
        color: "var(--fg-mute)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ color: "var(--self)" }}>🗺</span>
        <span>{window.t("picker.tap_map_hint")}</span>
      </div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {allowClear && (
          <button
            onClick={onClear}
            className="dropdown-item"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              padding: "9px 12px",
              color: "var(--fg-mute)",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontStyle: "italic",
            }}
          >
            {window.t("picker.clear")}
          </button>
        )}
        {list.map(p => {
          const c = window.byIso2[p.iso2];
          const active = p.iso2 === value;
          return (
            <button
              key={p.iso2}
              onClick={() => onChange(p.iso2)}
              className="dropdown-item"
              style={{
                width: "100%",
                background: active ? "rgba(96,165,250,0.10)" : "transparent",
                border: "none",
                padding: "9px 12px",
                color: active ? "var(--self)" : "var(--fg)",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>{c?.flag}</span>
              <span style={{ flex: 1 }}>{window.countryName(p.iso2)}</span>
              {active && (
                <span style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  background: "var(--self)",
                  color: "#05070d",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {window.t("picker.selected")}
                </span>
              )}
              {p.rank && (
                <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
                  #{p.rank}
                </span>
              )}
            </button>
          );
        })}
        {list.length === 0 && (
          <div style={{ padding: 16, color: "var(--fg-mute)", fontSize: 13, textAlign: "center" }}>
            {window.t("picker.no_matches")}
          </div>
        )}
      </div>
    </div>
  );
}

function Tally({ tally, filter, setFilter, passport, groupActive }) {
  const total = (tally.idc || 0) + tally.vf + (tally.eta || 0) + tally.ev + tally.voa + tally.vr + (tally.ban || 0);
  const rows = [
    // ID-card travel (no passport needed) — easiest tier, shown first when present.
    ...((tally.idc || 0) > 0 ? [{ k: "idc", ...STATUS_COLOR.idc, n: tally.idc, label: window.t("status.idc") }] : []),
    { k: "vf",  ...STATUS_COLOR.vf,  n: tally.vf,  label: window.t("status.vf")  },
    // ETA (ESTA / eTA / NZeTA / UK ETA): only shown when the passport has some —
    // weaker passports get none, so an always-on 0 row would just be noise.
    ...((tally.eta || 0) > 0 ? [{ k: "eta", ...STATUS_COLOR.eta, n: tally.eta, label: window.t("status.eta") }] : []),
    { k: "ev",  ...STATUS_COLOR.ev,  n: tally.ev,  label: window.t("status.ev")  },
    { k: "voa", ...STATUS_COLOR.voa, n: tally.voa, label: window.t("status.voa") },
    { k: "vr",  ...STATUS_COLOR.vr,  n: tally.vr,  label: window.t("status.vr")  },
    // Only surface "No entry allowed" when the passport actually has some — most
    // passports have zero, and an always-on 0 row would just add noise.
    ...((tally.ban || 0) > 0 ? [{ k: "ban", ...STATUS_COLOR.ban, n: tally.ban, label: window.t("status.ban") }] : []),
  ];
  const accessScore = (tally.idc || 0) + tally.vf + (tally.eta || 0) + tally.ev + tally.voa;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontFamily: "var(--font-sans)",
        }}>
          {accessScore}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.04em" }}>
          {groupActive ? window.t("tally.group_label") : window.t("tally.accessible")}<br/>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-faint)" }}>
            {window.t("tally.of")} {total}
            {groupActive && " · " + window.t("tally.worst_case")}
          </span>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{
        display: "flex",
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 12,
        background: "var(--bg-3)",
      }}>
        {rows.map(r => r.n > 0 && (
          <div key={r.k} style={{
            width: `${(r.n / total) * 100}%`,
            background: r.fill,
            boxShadow: `0 0 8px ${r.fill}`,
          }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <button
          onClick={() => setFilter("all")}
          className={"filter-row" + (filter === "all" ? " active" : "")}
          style={filterRowStyle(filter === "all")}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--fg-mute)" }} />
          <span style={{ flex: 1, textAlign: "left" }}>{window.t("tally.filter_all")}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-mute)" }}>{total}</span>
        </button>
        {rows.map(r => (
          <button
            key={r.k}
            onClick={() => setFilter(filter === r.k ? "all" : r.k)}
            className={"filter-row" + (filter === r.k ? " active" : "")}
            style={filterRowStyle(filter === r.k)}
          >
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: r.fill,
              boxShadow: `0 0 8px ${r.fill}`,
            }} />
            <span style={{ flex: 1, textAlign: "left" }}>{r.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-mute)" }}>{r.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function filterRowStyle(active) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: active ? "rgba(96,165,250,0.08)" : "transparent",
    border: `1px solid ${active ? "rgba(96,165,250,0.25)" : "transparent"}`,
    borderRadius: 6,
    color: "var(--fg-dim)",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 140ms ease",
    fontFamily: "inherit",
  };
}

function CountrySearch({ passport, search, setSearch, onPick }) {
  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return window.COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q)
      || window.countryName(c.iso2).toLowerCase().includes(q)
      || c.iso2.toLowerCase() === q
    ).slice(0, 6);
  }, [search]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: "relative" }}>
        <SearchIcon />
        <input
          placeholder={window.t("panel.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg-2)",
            border: "1px solid var(--panel-border-strong)",
            borderRadius: 8,
            padding: "9px 12px 9px 32px",
            color: "var(--fg)",
            fontFamily: "inherit",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>
      {results.length > 0 && (
        <div style={{
          marginTop: 4,
          background: "var(--bg-2)",
          border: "1px solid var(--panel-border-strong)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {results.map(c => {
            const r = passport ? window.resolveStatus(passport, c.iso2) : { status: "na" };
            const sc = STATUS_COLOR[r.status];
            return (
              <button
                key={c.iso2}
                onClick={() => { onPick(c.iso2); setSearch(""); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "8px 12px",
                  color: "var(--fg)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
                className="dropdown-item"
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{window.countryName(c.iso2)}</span>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: sc.fill,
                  boxShadow: `0 0 6px ${sc.fill}`,
                }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 16 16"
      style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--fg-mute)", pointerEvents: "none" }}
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DetailCard({ passport, compare, iso2, onClose, direction, groupPassports, variant }) {
  const dest = window.byIso2[iso2];
  if (!dest) return null;
  const groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  const incoming = direction === "incoming" && !groupActive;
  // Variant only applies to outgoing single-passport mode; group + incoming
  // fall back to the ordinary lookup so the math composes cleanly.
  const variantActive = !!variant && variant !== "ordinary" && !groupActive && !incoming;
  const r = groupActive
    ? window.resolveGroupStatus(groupPassports, iso2)
    : (incoming
        ? window.resolveStatus(iso2, passport)
        : (variantActive
            ? window.resolveVariantStatus(passport, iso2, variant)
            : window.resolveStatus(passport, iso2)));
  const rc = !groupActive && compare
    ? (incoming ? window.resolveStatus(iso2, compare) : window.resolveStatus(compare, iso2))
    : null;
  const groupRows = groupActive
    ? groupPassports.map(p => ({ p, r: window.resolveStatus(p, iso2) }))
    : null;
  const sc = STATUS_COLOR[r.status];
  const myPp = window.byIso2[passport];

  const NOTES = {
    idc:  window.t("detail.note.idc"),
    vf:   window.t("detail.note.vf"),
    eta:  window.t("detail.note.eta"),
    ev:   window.t("detail.note.ev"),
    voa:  window.t("detail.note.voa"),
    vr:   window.t("detail.note.vr"),
    self: window.t("detail.note.self"),
    na:   window.t("detail.note.na"),
  };
  const localizedStatusLabel = (s) => {
    const k = "status." + s;
    const tr = window.t(k);
    return tr === k ? (STATUS_COLOR[s]?.label || s) : tr;
  };

  // ── Dual-citizenship "recommended passport" ────────────────────────────
  // When two passports are active (compare mode, outgoing, no group), pick
  // the one with the strictly better status for this destination and lead
  // with a recommendation pill. The compare detail row below still shows
  // both statuses so users can sanity-check the choice.
  const ORDER = { self: 0, idc: 1, vf: 2, eta: 3, ev: 4, voa: 5, vr: 6, ban: 7, na: 8 };
  let recommended = null;
  if (compare && rc && !groupActive && !incoming) {
    const rScore = ORDER[r.status] ?? 5;
    const cScore = ORDER[rc.status] ?? 5;
    if (rScore !== cScore) {
      recommended = rScore < cScore
        ? { passport, r, label: window.countryName(passport), flag: myPp?.flag }
        : { passport: compare, r: rc, label: window.countryName(compare), flag: window.byIso2[compare]?.flag };
    }
  }
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border-strong)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      position: "relative",
    }}>
      <button
        onClick={onClose}
        aria-label={window.t("detail.close")}
        style={{
          position: "absolute", top: 10, right: 10,
          background: "transparent", border: "none", color: "var(--fg-mute)",
          cursor: "pointer", padding: 2, lineHeight: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingRight: 28 }}>
        <span style={{ fontSize: 32, lineHeight: 1 }}>{dest.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{window.countryName(iso2)}</div>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {dest.continent ? (window.t("cont." + dest.continent) !== ("cont." + dest.continent) ? window.t("cont." + dest.continent) : dest.continent) : "—"}
          </div>
        </div>
        <WatchToggle iso2={iso2} />
      </div>

      {recommended && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px",
          background: "rgba(34,197,94,0.10)",
          border: "1px solid rgba(34,197,94,0.40)",
          borderRadius: 8,
          marginBottom: 10,
          fontSize: 12,
        }}>
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--vf)",
            textTransform: "uppercase", letterSpacing: "0.10em",
            background: "rgba(34,197,94,0.18)", padding: "2px 6px",
            borderRadius: 4,
          }}>
            {window.t("detail.recommended")}
          </span>
          <span style={{ fontSize: 16 }}>{recommended.flag}</span>
          <span style={{ color: "var(--fg)", fontWeight: 500, flex: 1, minWidth: 0,
                         overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {recommended.label}
          </span>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: STATUS_COLOR[recommended.r.status]?.fill,
            boxShadow: `0 0 6px ${STATUS_COLOR[recommended.r.status]?.fill}`,
          }} />
          <span style={{ color: "var(--fg)", fontWeight: 500 }}>
            {localizedStatusLabel(recommended.r.status)}
          </span>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px",
        background: "var(--bg-3)",
        borderRadius: 8,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 18 }}>{myPp?.flag}</span>
        <Arrow />
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          background: sc.fill, boxShadow: `0 0 10px ${sc.fill}`,
        }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.fom ? window.t("detail.fom") : localizedStatusLabel(r.status)}</div>
          {r.fom
            ? <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{window.t("detail.fom_sub")}</div>
            : (r.days && <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{window.t("detail.up_to_days", { n: r.days })}</div>)}
        </div>
      </div>

      {/* Residence-permit upgrade banner — shown when applyResidenceUpgrade
          flipped the status because the user activated a held permit. Helps
          the user understand WHY this country lit up green/lime. */}
      {r.upgradedBy && (
        <div style={{
          display: "flex", gap: 8, padding: "8px 10px", marginBottom: 10,
          background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 13, lineHeight: 1.3 }}>🪪</span>
          <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--fg-dim)" }}>
            <strong style={{ color: "var(--fg)" }}>
              {window.t("detail.via_permit_title") !== "detail.via_permit_title"
                ? window.t("detail.via_permit_title") : "Unlocked by your permit"}
            </strong>{" "}
            {(window.t("detail.via_permit_sub", { which: _permitLabel(r.upgradedBy) }) !== "detail.via_permit_sub")
              ? window.t("detail.via_permit_sub", { which: _permitLabel(r.upgradedBy) })
              : "Easier entry thanks to your " + _permitLabel(r.upgradedBy) + " residence/visa. Without it, this country would normally be visa-required."}
          </div>
        </div>
      )}

      {/* Entry-mode / temporary-policy caveats (land vs air, time-limited
          waivers). Sourced from data/visa-overrides.js — shown only when they
          actually apply to this destination + status. */}
      {(() => {
        const caveat = window.entryCaveat ? window.entryCaveat(iso2, r.status) : null;
        const notes = [r.note, caveat].filter(Boolean);
        if (!notes.length) return null;
        return (
          <div style={{
            display: "flex", gap: 8, padding: "8px 10px", marginBottom: 10,
            background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.25)",
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 13, lineHeight: 1.3 }}>⚠️</span>
            <div style={{ fontSize: 11, lineHeight: 1.45, color: "var(--fg-dim)" }}>
              {notes.map((n, i) => <div key={i} style={{ marginTop: i ? 4 : 0 }}>{n}</div>)}
            </div>
          </div>
        );
      })()}

      <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--fg-dim)", margin: "0 0 10px 0" }}>
        {NOTES[r.status]}
      </p>

      {/* Order: good-news first, then trip warnings (grouped), then
          practical info, then sponsored slots, then secondary CTA at
          the bottom. Keeps the most actionable items above the fold. */}

      {!groupActive && (
        <ConditionsBox passport={passport} destIso2={iso2} baseStatus={r.status} />
      )}

      {!groupActive && (
        <TripNotesGroup
          passport={passport}
          destIso2={iso2}
        />
      )}

      {!groupActive && (
        <VisaFeeBox passport={passport} destIso2={iso2} status={r.status} />
      )}

      {!groupActive && <NewsBox passport={passport} destIso2={iso2} />}

      <AffiliatePartners status={r.status} iso2={iso2} />

      <AlertsCTA iso2={iso2} destName={window.countryName(iso2)} />

      <AdSlot slotKey="sidebar" />

      {rc && compare && (
        <div style={{
          padding: 10,
          borderRadius: 8,
          border: "1px dashed var(--panel-border-strong)",
          background: "rgba(96,165,250,0.05)",
        }}>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{window.t("detail.compare")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{window.byIso2[compare]?.flag}</span>
            <Arrow />
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: STATUS_COLOR[rc.status].fill, boxShadow: `0 0 10px ${STATUS_COLOR[rc.status].fill}`,
            }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{localizedStatusLabel(rc.status)}</div>
              {rc.days && <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{window.t("detail.up_to_days", { n: rc.days })}</div>}
            </div>
          </div>
        </div>
      )}

      {groupRows && (
        <div style={{
          padding: 10, borderRadius: 8,
          border: "1px dashed var(--panel-border-strong)",
          background: "rgba(96,165,250,0.05)",
        }}>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{window.t("detail.per_group_member")}</div>
          {groupRows.map(({ p, r: rr }) => {
            const c = window.byIso2[p];
            const sc2 = STATUS_COLOR[rr.status];
            // The combined status uses whichever passport gives the best access
            // (r.via). Highlight that winning passport so it's obvious which one
            // to travel on.
            const isBest = r.via === p;
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: "1px solid var(--panel-border)" }}>
                <span style={{ fontSize: 16 }}>{c?.flag}</span>
                <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isBest ? 600 : 400 }}>{window.countryName(p)}</span>
                {isBest && (
                  <span style={{
                    fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--vf)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    border: "1px solid rgba(34,197,94,0.40)", borderRadius: 4, padding: "1px 5px",
                  }}>{window.t("detail.best_passport")}</span>
                )}
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: sc2.fill,
                }} />
                <span style={{ fontSize: 11, color: "var(--fg-dim)", minWidth: 80, textAlign: "right" }}>{localizedStatusLabel(rr.status)}</span>
                {rr.days && <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{rr.days}d</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Conditional-visa box: surfaces Wikipedia's "if you also hold X" footnotes
// (e.g. "Indian citizens normally need a visa for Türkiye, but holders of a
// valid US / UK / Ireland / Schengen visa can obtain an eVisa"). Reads from
// data/visa-conditions.js. Only shown when an actual upgrade path exists for
// the resolved status — i.e. when the base status is something other than vf
// or self and the conditional `then` is strictly better.
function ConditionsBox({ passport, destIso2, baseStatus }) {
  if (!passport || !destIso2) return null;
  if (baseStatus === "self" || baseStatus === "vf") return null;
  const rows = window.visaCondition && window.visaCondition(passport, destIso2);
  if (!rows || rows.length === 0) return null;
  // Only show rows whose resulting status is strictly better than the base.
  const ORDER = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6, na: 7 };
  const useful = rows.filter(r => ORDER[r.then] < ORDER[baseStatus]);
  if (useful.length === 0) return null;

  const lang = window.ATLAS_LANG || "en";
  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: "rgba(34,197,94,0.06)",
      border: "1px solid rgba(34,197,94,0.30)",
      marginBottom: 10,
    }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--vf)", boxShadow: "0 0 6px var(--vf)",
        }} />
        {window.t("cond.title")}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-dim)", marginBottom: 8 }}>
        {window.t("cond.subtitle")}
      </div>
      {useful.map((row, i) => {
        const labels = (window.conditionHoldsLabels && window.conditionHoldsLabels(row.ifHolds)) || row.ifHolds;
        const thenColor = STATUS_COLOR[row.then]?.fill || "var(--vf)";
        const thenLabel = (() => {
          const k = "status." + row.then;
          const tr = window.t(k);
          return tr === k ? (STATUS_COLOR[row.then]?.label || row.then) : tr;
        })();
        const note = lang === "en" ? (row.noteEn || row.note) : (row.note || row.noteEn);
        return (
          <div key={i} style={{
            marginTop: i === 0 ? 0 : 8,
            paddingTop: i === 0 ? 0 : 8,
            borderTop: i === 0 ? "none" : "1px solid rgba(34,197,94,0.18)",
          }}>
            {/* Chip row of required visas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {labels.map((l, j) => (
                <span key={j} style={{
                  fontSize: 11, padding: "3px 8px",
                  background: "var(--bg-3)", border: "1px solid var(--panel-border)",
                  borderRadius: 999, color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {row.ifHolds[j] === "SCHENGEN" ? "🇪🇺 " : ""}{l}
                </span>
              ))}
            </div>
            {/* Resulting status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12,
            }}>
              <span style={{ color: "var(--fg-mute)" }}>→ {window.t("cond.becomes")}</span>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: thenColor, boxShadow: `0 0 6px ${thenColor}`,
              }} />
              <span style={{ color: "var(--fg)", fontWeight: 500 }}>{thenLabel}</span>
              {row.days && (
                <span style={{ marginLeft: "auto", color: "var(--fg-mute)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  {window.t("detail.up_to_days", { n: row.days })}
                </span>
              )}
            </div>
            {note && (
              <div style={{ fontSize: 11, color: "var(--fg-dim)", marginTop: 6, lineHeight: 1.5 }}>
                {note}
              </div>
            )}
            {row.source && (
              <a href={row.source} target="_blank" rel="noopener nofollow"
                 style={{ fontSize: 11, color: "var(--fg-mute)", textDecoration: "none",
                          borderBottom: "1px dotted var(--fg-faint)", display: "inline-block",
                          marginTop: 6 }}>
                {window.t("cond.source")}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// TripNotesGroup — bundles the per-trip rule reminders (transit visa,
// ETIAS, passport-validity rule, ESTA, Israel stamp, LOI) so they're
// visually grouped instead of stacked as 6 standalone dashed boxes.
// Pre-checks each widget's "would-render" condition so the section
// header doesn't appear with no widgets under it.
function TripNotesGroup({ passport, destIso2 }) {
  if (!passport || !destIso2) return null;

  // Replicate each widget's render guard so we know whether to draw
  // the section header at all. Yes, this is duplicated logic; the
  // alternative (post-render counting from React) is more fragile.
  const transitWouldRender = (function () {
    const rules = window.TRANSIT_RULES || {};
    const HUBS = ["SCHENGEN", "GB", "US", "CA"];
    const risky = HUBS.filter(area => {
      const r = rules[area];
      if (!r) return false;
      if (r.requiredFor === "*") return true;
      return Array.isArray(r.requiredFor) && r.requiredFor.includes(passport);
    });
    if (risky.length === 0) return false;
    // Skip when the only risky hub is the destination itself.
    if (risky.length === 1 && (
      risky[0] === destIso2 ||
      (risky[0] === "SCHENGEN" && window.byIso2[destIso2]?.continent === "EU")
    )) return false;
    return true;
  })();
  const estaWouldRender     = destIso2 === "US" && !!window.estaEligible;
  const etiasWouldRender    = !!(window.etiasStatus && window.etiasStatus(passport, destIso2)?.kind === "required");
  const validityWouldRender = !!(window.PASSPORT_VALIDITY && window.PASSPORT_VALIDITY[destIso2] != null);
  const israelWouldRender   = !!(window.israelStampWarning && window.israelStampWarning(destIso2));
  const loiWouldRender      = !!(window.loiRule && window.loiRule(destIso2));

  const total = [transitWouldRender, estaWouldRender, etiasWouldRender,
                 validityWouldRender, israelWouldRender, loiWouldRender]
    .filter(Boolean).length;
  if (total === 0) return null;

  return (
    <div>
      {total >= 2 && (
        <div style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
          textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 2,
            background: "var(--voa)", boxShadow: "0 0 6px var(--voa)",
          }} />
          {window.t("detail.trip_notes")}
        </div>
      )}
      {transitWouldRender  && <TransitVisaHint passport={passport} destIso2={destIso2} />}
      {estaWouldRender     && <EstaHint passport={passport} />}
      {etiasWouldRender    && <EtiasHint passport={passport} destIso2={destIso2} />}
      {validityWouldRender && <ValidityHint destIso2={destIso2} />}
      {israelWouldRender   && <IsraelStampHint destIso2={destIso2} />}
      {loiWouldRender      && <LoiHint destIso2={destIso2} />}
    </div>
  );
}

// Transit-visa heads-up: if the user's passport is on the Schengen ATV or
// UK DATV list (or if their route includes US/Canada — which always need a
// transit clearance), surface a small banner pointing to /transit-visa/.
// The full check requires the route; here we just flag the risk so people
// don't get blindsided at the gate.
function TransitVisaHint({ passport, destIso2 }) {
  if (!passport) return null;
  const rules = window.TRANSIT_RULES || {};
  // Major hub areas a traveller is most likely to connect through.
  const HUBS = ["SCHENGEN", "GB", "US", "CA"];
  const risky = HUBS.filter(area => {
    const r = rules[area];
    if (!r) return false;
    if (r.requiredFor === "*") return true;
    return Array.isArray(r.requiredFor) && r.requiredFor.includes(passport);
  });
  if (risky.length === 0) return null;
  // Don't flag if the destination IS the hub (trivial case).
  if (destIso2 && risky.length === 1 && (
    risky[0] === destIso2 ||
    (risky[0] === "SCHENGEN" && window.byIso2[destIso2]?.continent === "EU")
  )) return null;
  const labels = risky.map(a => rules[a].label.split(" (")[0]).join(" · ");
  return (
    <a href="/transit-map/" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: "rgba(250,204,21,0.08)",
      border: "1px dashed rgba(250,204,21,0.50)",
      borderRadius: 8, textDecoration: "none", color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>✈️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {window.t("detail.transit_heads_up")}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>
          {window.t("detail.transit_heads_up_sub", { hubs: labels })}
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>→</span>
    </a>
  );
}

// ESTA hint: shown only when destination = US. Tells VWP-eligible
// passport holders they CAN use ESTA, and warns non-VWP holders they
// need a full B1/B2 visa. Links to /esta-rules/ for the disqualifier
// checklist (post-2011 travel to Iran/Iraq/etc, dual citizenship,
// arrests, etc.).
function EstaHint({ passport }) {
  if (!passport || !window.estaEligible) return null;
  const eligible = window.estaEligible(passport);
  const tone = eligible ? "rgba(34,197,94,0.40)" : "rgba(96,165,250,0.40)";
  const bg   = eligible ? "rgba(34,197,94,0.06)" : "rgba(96,165,250,0.08)";
  return (
    <a href="/esta-rules/" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: bg, border: `1px dashed ${tone}`,
      borderRadius: 8, textDecoration: "none", color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>🇺🇸</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {window.t(eligible ? "detail.esta_eligible" : "detail.esta_not_vwp")}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>
          {window.t(eligible ? "detail.esta_check_disq" : "detail.esta_visa_path")}
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>→</span>
    </a>
  );
}

// Israel-stamp warning: when destination has a known historical refusal
// pattern (Iran, Lebanon, Syria, Libya, Yemen — strict; Saudi/UAE/Bahrain
// — normalized; Algeria/Iraq/Pakistan/Kuwait — relaxed). Tone scales
// with the severity. Doesn't ask whether the user actually has an
// Israeli stamp — surfacing the rule is the value.
function IsraelStampHint({ destIso2 }) {
  if (!destIso2 || !window.israelStampWarning) return null;
  const r = window.israelStampWarning(destIso2);
  if (!r) return null;
  const tone = r.level === "strict" ? "rgba(239,68,68,0.40)"
             : r.level === "relaxed" ? "rgba(250,204,21,0.40)"
             : "rgba(96,165,250,0.30)";
  const bg   = r.level === "strict" ? "rgba(239,68,68,0.07)"
             : r.level === "relaxed" ? "rgba(250,204,21,0.08)"
             : "rgba(96,165,250,0.05)";
  const label = r.level === "strict"     ? window.t("detail.israel_strict")
              : r.level === "relaxed"    ? window.t("detail.israel_relaxed")
              : window.t("detail.israel_normalized");
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: bg, border: `1px dashed ${tone}`,
      borderRadius: 8, color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>🇮🇱</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2, lineHeight: 1.5 }}>
          {r.note}
        </div>
      </div>
    </div>
  );
}

// Letter of Invitation requirement: surfaces destinations that demand
// a formal sponsor letter (Russia, Belarus, Turkmenistan). Includes a
// typical cost range so users know what third-party service to budget
// for.
function LoiHint({ destIso2 }) {
  if (!destIso2 || !window.loiRule) return null;
  const r = window.loiRule(destIso2);
  if (!r) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: "rgba(250,204,21,0.08)",
      border: "1px dashed rgba(250,204,21,0.40)",
      borderRadius: 8, color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>📨</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {window.t("detail.loi_required")}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2, lineHeight: 1.5 }}>
          {r.note}
        </div>
        {r.typicalCost && (
          <div style={{ fontSize: 10, color: "var(--fg-faint)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
            {window.t("detail.loi_cost", { cost: r.typicalCost })}
          </div>
        )}
      </div>
    </div>
  );
}

// Passport validity hint: surfaces the destination's "must be valid for N
// months past your stay" rule. Generic note — we don't ask for the user's
// expiry here (that's the dedicated /passport-validity/ tool). Showing the
// rule alone already prevents a lot of bad bookings.
function ValidityHint({ destIso2 }) {
  if (!destIso2 || !window.passportValidityCheck) return null;
  const res = window.passportValidityCheck(destIso2, {});
  if (!res) return null;
  const sevKey = res.rule === 6 ? "validity.rule6"
              : res.rule === 3 ? "validity.rule3"
              : res.rule === 0 ? "validity.rule0"
              : null;
  if (!sevKey) return null;
  const tone = res.rule >= 6 ? "rgba(239,68,68,0.40)"
             : res.rule >= 3 ? "rgba(250,204,21,0.40)"
             : "rgba(34,197,94,0.40)";
  const bg   = res.rule >= 6 ? "rgba(239,68,68,0.06)"
             : res.rule >= 3 ? "rgba(250,204,21,0.08)"
             : "rgba(34,197,94,0.06)";
  return (
    <a href="/passport-validity/" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: bg,
      border: `1px dashed ${tone}`,
      borderRadius: 8, textDecoration: "none", color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>📘</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {window.t(sevKey)}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>
          {window.t("validity.check_cta")}
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>→</span>
    </a>
  );
}

// ETIAS heads-up: when the user's passport is on the ETIAS-required list AND
// the selected destination is a Schengen state, surface the launch countdown
// + cost so they're not caught off guard. Only renders when actionable.
function EtiasHint({ passport, destIso2 }) {
  if (!passport || !destIso2 || !window.etiasStatus) return null;
  const res = window.etiasStatus(passport, destIso2);
  if (!res || res.kind !== "required") return null;
  const days = window.etiasDaysUntilLaunch ? window.etiasDaysUntilLaunch() : null;
  return (
    <a href="/etias/" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: "rgba(96,165,250,0.08)",
      border: "1px dashed rgba(96,165,250,0.50)",
      borderRadius: 8, textDecoration: "none", color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>🇪🇺</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {days != null && days > 0
            ? window.t("detail.etias_pre", { days })
            : window.t("detail.etias_live")}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>
          {window.t("detail.etias_sub")}
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>→</span>
    </a>
  );
}

// Renders an AdSense ad unit if (and only if) both the publisher client ID and
// the slot's numeric ID are configured in data/ads.js. Otherwise renders nothing.
// On mount it pushes a request to AdSense's queue, exactly as Google docs prescribe.
// Visa fee + processing-time card. Renders only when (a) data/visa-fees.js
// has an entry for the (passport, destination) pair AND (b) the resolved
// status is something the user actually needs to apply for — i.e. ev / voa / vr.
// We never show it for vf since the data wouldn't make sense ("fee: $0").
function VisaFeeBox({ passport, destIso2, status }) {
  if (!passport || !destIso2) return null;
  // No fee/apply UI for visa-free, your own passport, or outright entry bans
  // (you can't apply for a visa to a country that refuses you admission).
  if (status === "vf" || status === "self" || status === "ban") return null;
  const data = window.visaFee && window.visaFee(passport, destIso2);
  if (!data) {
    // We require a visa here but don't have a fee figure for this pair yet.
    // Say so explicitly so the absence doesn't read as "free".
    return (
      <div style={{
        padding: "9px 11px", borderRadius: 8, marginBottom: 10,
        background: "var(--bg-2)", border: "1px dashed var(--panel-border-strong)",
        fontSize: 11, color: "var(--fg-mute)", lineHeight: 1.5,
      }}>
        {window.t("detail.no_fee_data")}
      </div>
    );
  }

  const labelStyle = { fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" };
  const valueStyle = { fontSize: 13, color: "var(--fg)", marginTop: 1 };
  const row = (label, value) => value ? (
    <div style={{ paddingTop: 6 }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  ) : null;

  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border)",
      marginBottom: 10,
    }}>
      <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {window.t("detail.visa_cost")}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>
        {data.fee}
      </div>
      {data.processingDays && (
        <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>
          {window.t("detail.processing")}: {data.processingDays}
        </div>
      )}
      <div style={{ borderTop: "1px solid var(--panel-border)", marginTop: 8 }}>
        {row(window.t("detail.type"),             data.type)}
        {row(window.t("detail.validity"),         data.validity)}
        {row(window.t("detail.duration_of_stay"), data.durationOfStay)}
      </div>
      {data.notes && (
        <div style={{ fontSize: 11, color: "var(--fg-dim)", marginTop: 8, padding: "6px 8px", background: "rgba(250,204,21,0.05)", borderLeft: "2px solid var(--voa)", borderRadius: 2 }}>
          {data.notes}
        </div>
      )}
      {data.source && (
        <div style={{ marginTop: 8 }}>
          <a href={data.source} target="_blank" rel="noopener nofollow"
             style={{ fontSize: 11, color: "var(--fg-mute)", textDecoration: "none", borderBottom: "1px dotted var(--fg-faint)" }}>
            {window.t("detail.official_source")}
          </a>
        </div>
      )}
      <div style={{ fontSize: 9, color: "var(--fg-faint)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
        {window.t("detail.reviewed", { date: data.lastReviewed })}
      </div>
    </div>
  );
}

function AlertsCTA({ iso2, destName }) {
  // Small affordance that nudges power users to the /alerts page with the
  // current destination pre-selected (via hash). Hidden when ads.js detects
  // we're inside an embed scenario (no window.AFFILIATES).
  const href = `/alerts/?country=${encodeURIComponent(iso2)}`;
  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", marginBottom: 10,
      background: "var(--bg-3)", border: "1px dashed var(--panel-border-strong)",
      borderRadius: 8, textDecoration: "none", color: "var(--fg)",
    }}>
      <span style={{ fontSize: 18 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{window.t("detail.get_alerts_for", { name: destName })}</div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>
          {window.t("detail.get_alerts_sub")}
        </div>
      </div>
      <span style={{ fontSize: 14, color: "var(--fg-mute)" }}>→</span>
    </a>
  );
}

function AdSlot({ slotKey }) {
  const ref = React.useRef(null);
  const pushed = React.useRef(false);
  const ads = window.ADSENSE || {};
  const clientId = ads.clientId;
  const slot = ads.slots && ads.slots[slotKey];
  React.useEffect(() => {
    if (!clientId || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) { /* swallow — adsbygoogle.js may not be loaded yet */ }
  }, [clientId, slot]);
  if (!clientId || !slot) return null;
  return (
    <div style={{ margin: "10px 0", textAlign: "center" }}>
      <ins ref={ref}
           className="adsbygoogle"
           style={{ display: "block", minHeight: 100 }}
           data-ad-client={clientId}
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true" />
      <div style={{ fontSize: 9, color: "var(--fg-faint)", marginTop: 2, fontFamily: "var(--font-mono)" }}>Ad</div>
    </div>
  );
}

function AffiliatePartners({ status, iso2 }) {
  const partners = (window.affiliatesFor && window.affiliatesFor(status, iso2)) || [];
  if (partners.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
      }}>{window.t("detail.plan_your_trip")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {partners.map(p => (
          <a key={p.id} href={p.href} target="_blank" rel="sponsored noopener noreferrer"
             style={{
               display: "block", padding: "8px 10px",
               background: "var(--bg-3)", borderRadius: 8,
               textDecoration: "none", color: "var(--fg)",
               border: "1px solid var(--panel-border)",
             }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{p.label}</div>
            <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 2 }}>{p.blurb}</div>
          </a>
        ))}
      </div>
      <div style={{ fontSize: 9, color: "var(--fg-faint)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
        {window.t("detail.sponsored")}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" style={{ color: "var(--fg-mute)" }}>
      <path d="M1 5 H12 M8 1 L12 5 L8 9" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── News filtering helpers ───────────────────────────────────────────────
// VISA_NEWS items have affects.{passports, destinations} as ISO2 arrays.
// Empty array means "applies to all". `matchesPassport` and `matchesDest`
// return true if the item is relevant to the given iso2.
function matchesPassport(item, passport) {
  if (!passport) return false;
  const arr = item.affects?.passports || [];
  return arr.length === 0 || arr.includes(passport);
}
function matchesDest(item, dest) {
  if (!dest) return false;
  const arr = item.affects?.destinations || [];
  return arr.length === 0 || arr.includes(dest);
}
function sortNewsDesc(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}

const SEVERITY_STYLE = {
  positive: { border: "var(--vf)", glow: "0 0 8px rgba(74, 222, 128, 0.25)", emoji: "✓" },
  warning:  { border: "var(--vr)", glow: "0 0 8px rgba(248, 113, 113, 0.25)", emoji: "⚠" },
  neutral:  { border: "var(--panel-border-strong)", glow: "none", emoji: "•" },
};

function NewsItem({ item, compact }) {
  const sev = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.neutral;
  const date = new Date(item.date + "T00:00:00");
  const fmt = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const hasLink = !!item.sourceUrl;
  const Wrapper = hasLink ? "a" : "div";
  const wrapperProps = hasLink
    ? { href: item.sourceUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <Wrapper {...wrapperProps} style={{
      display: "block",
      padding: compact ? "8px 10px" : "10px 12px",
      background: "var(--bg-2)",
      border: `1px solid var(--panel-border)`,
      borderLeft: `3px solid ${sev.border}`,
      boxShadow: sev.glow,
      borderRadius: 8,
      color: "var(--fg)",
      textDecoration: "none",
      transition: "all 180ms ease",
      cursor: hasLink ? "pointer" : "default",
    }} className="changelog-item">
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 10, fontFamily: "var(--font-mono)",
        color: "var(--fg-mute)", textTransform: "uppercase",
        letterSpacing: "0.06em", marginBottom: 4,
      }}>
        <span style={{ color: sev.border }}>{sev.emoji}</span>
        <span>{fmt}</span>
        <span style={{ color: "var(--fg-faint)" }}>·</span>
        <span>{item.source}</span>
      </div>
      <div style={{ fontSize: compact ? 12 : 13, fontWeight: 500, lineHeight: 1.35, marginBottom: compact ? 2 : 4 }}>
        {item.title}
      </div>
      {!compact && item.summary && (
        <div style={{ fontSize: 11, color: "var(--fg-dim)", lineHeight: 1.45 }}>
          {item.summary}
        </div>
      )}
    </Wrapper>
  );
}

// ─── Weekly digest ──────────────────────────────────────────────────────
// One-line "what changed this week" banner. Counts CHANGELOG + VISA_NEWS
// events from the last 7 days and how many of them touch the current
// passport. Cheap to compute, gives the home panel a visible "since you
// last visited" sense — a small but real retention signal.
function weeklyDigest(passport) {
  const cutoff = Date.now() - 7 * 86400_000;
  let total = 0, mine = 0;
  if (window.CHANGELOG) {
    for (const c of window.CHANGELOG) {
      if (new Date(c.date + "T00:00:00").getTime() < cutoff) continue;
      total++;
      if (passport && c.affects?.passports?.includes(passport)) mine++;
    }
  }
  if (window.VISA_NEWS) {
    for (const n of window.VISA_NEWS) {
      if (new Date(n.date + "T00:00:00").getTime() < cutoff) continue;
      total++;
      const arr = n.affects?.passports || [];
      if (passport && (arr.length === 0 || arr.includes(passport))) mine++;
    }
  }
  return { total, mine };
}

function WeeklyDigest({ passport }) {
  const stats = useMemo(() => weeklyDigest(passport), [passport]);
  if (stats.total === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", marginBottom: 14,
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border)",
      borderLeft: "3px solid var(--self)",
      borderRadius: 8,
      fontSize: 12, color: "var(--fg-dim)", lineHeight: 1.45,
    }}>
      <span style={{ fontSize: 14 }}>📰</span>
      <div style={{ flex: 1 }}>
        {passport && stats.mine > 0
          ? window.t("digest.this_week_with_yours", { total: stats.total, mine: stats.mine })
          : window.t("digest.this_week_total", { total: stats.total })}
      </div>
    </div>
  );
}

// ─── Itinerary CTA ───────────────────────────────────────────────────────
// The /itinerary/ planner exists but is buried in the topnav. This card
// on the home panel surfaces it — empty state = soft 'plan a trip' nudge,
// active state = compact summary with a continue link so users don't lose
// their plan between sessions visually (sessionStorage already keeps it
// alive within one session).
function readItinerary() {
  try {
    const raw = sessionStorage.getItem("atlas.itinerary");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function ItineraryCTA() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Refresh on focus — user may have edited the itinerary in another tab.
    const onFocus = () => setTick(x => x + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  const data = useMemo(() => readItinerary(), [tick]);
  const stops = Array.isArray(data?.stops) ? data.stops : [];
  const hasPlan = stops.length > 0;
  return (
    <a href="/itinerary/" style={{
      display: "block",
      padding: "10px 12px",
      marginBottom: 16,
      background: hasPlan
        ? "linear-gradient(135deg, rgba(96,165,250,0.10) 0%, var(--bg-2) 100%)"
        : "var(--bg-2)",
      border: "1px solid " + (hasPlan ? "var(--self)" : "var(--panel-border)"),
      borderRadius: 10,
      textDecoration: "none",
      color: "var(--fg)",
      transition: "all 180ms ease",
    }} className="picker-trigger">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🧭</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>
            {hasPlan
              ? window.t("itinerary.continue", { n: stops.length })
              : window.t("itinerary.start")}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>
            {hasPlan
              ? stops.slice(0, 4).map(s => window.byIso2[s.iso2]?.flag || "").join(" ")
              : window.t("itinerary.sub")}
          </div>
        </div>
        <span style={{ color: "var(--fg-mute)" }}>→</span>
      </div>
    </a>
  );
}

// ─── Watchlist (localStorage-backed; will sync to KV / email in Faz B) ──
// Lets users star destinations they care about. The home panel surfaces
// them as chips and flags any with a fresh changelog or visa-news hit.
// Stored as `atlas.watchlist` — JSON array of ISO2 strings.
const WATCHLIST_KEY = "atlas.watchlist";
function readWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => typeof x === "string") : [];
  } catch (e) { return []; }
}
function writeWatchlist(list) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)); } catch (e) {}
  window.dispatchEvent(new CustomEvent("atlas:watchlist", { detail: { list } }));
}
function inWatchlist(iso2) { return readWatchlist().includes(iso2); }
function toggleWatchlist(iso2) {
  const list = readWatchlist();
  const idx = list.indexOf(iso2);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(iso2);
  writeWatchlist(list);
  return list;
}
function useWatchlist() {
  const [list, setList] = useState(() => readWatchlist());
  useEffect(() => {
    const onChange = () => setList(readWatchlist());
    window.addEventListener("atlas:watchlist", onChange);
    window.addEventListener("storage", (e) => {
      if (e.key === WATCHLIST_KEY) onChange();
    });
    return () => window.removeEventListener("atlas:watchlist", onChange);
  }, []);
  return list;
}

// Returns the set of watchlisted ISO2s that have had a CHANGELOG entry or
// VISA_NEWS item in the last `days` days.
function watchlistAlerts(list, days = 14) {
  const cutoff = Date.now() - days * 86400_000;
  const alerted = new Set();
  if (window.CHANGELOG) {
    for (const c of window.CHANGELOG) {
      if (!list.includes(c.affects?.dest)) continue;
      if (new Date(c.date + "T00:00:00").getTime() < cutoff) continue;
      alerted.add(c.affects.dest);
    }
  }
  if (window.VISA_NEWS) {
    for (const n of window.VISA_NEWS) {
      const dests = n.affects?.destinations || [];
      const hit = dests.find(d => list.includes(d));
      if (!hit) continue;
      if (new Date(n.date + "T00:00:00").getTime() < cutoff) continue;
      alerted.add(hit);
    }
  }
  return alerted;
}

function WatchlistCard({ onOpen }) {
  const list = useWatchlist();
  const alerts = useMemo(() => watchlistAlerts(list, 14), [list]);
  if (list.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
      }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
          textTransform: "uppercase", letterSpacing: "0.10em",
        }}>{window.t("watchlist.heading")}</div>
        {alerts.size > 0 && (
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--vr)", boxShadow: "0 0 6px var(--vr)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
        )}
      </div>
      {alerts.size > 0 && (
        <div style={{
          padding: "6px 10px", marginBottom: 6,
          background: "rgba(248,113,113,0.08)",
          border: "1px solid var(--panel-border)",
          borderLeft: "3px solid var(--vr)",
          borderRadius: 6,
          fontSize: 11, color: "var(--fg-dim)", lineHeight: 1.4,
        }}>
          {window.t("watchlist.recent_alert", { n: alerts.size })}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.map(iso2 => {
          const c = window.byIso2[iso2];
          if (!c) return null;
          const flagged = alerts.has(iso2);
          return (
            <button
              key={iso2}
              onClick={() => onOpen?.(iso2)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 10px",
                background: flagged ? "rgba(248,113,113,0.08)" : "var(--bg-2)",
                border: "1px solid " + (flagged ? "var(--vr)" : "var(--panel-border)"),
                borderRadius: 999,
                fontFamily: "inherit", fontSize: 12,
                color: "var(--fg)", cursor: "pointer",
                transition: "all 180ms ease",
              }}>
              <span style={{ fontSize: 14 }}>{c.flag}</span>
              <span>{window.countryName(iso2)}</span>
              {flagged && <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)",
                color: "var(--vr)", letterSpacing: "0.04em",
              }}>•</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Button used inside DetailCard to toggle the current country in/out of
// the watchlist.
function WatchToggle({ iso2 }) {
  const list = useWatchlist();
  const on = list.includes(iso2);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleWatchlist(iso2); }}
      title={window.t(on ? "watchlist.remove" : "watchlist.add")}
      aria-pressed={on}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 9px", borderRadius: 6,
        background: on ? "rgba(96,165,250,0.12)" : "transparent",
        border: "1px solid " + (on ? "var(--self)" : "var(--panel-border-strong)"),
        color: on ? "var(--self)" : "var(--fg-mute)",
        fontFamily: "inherit", fontSize: 11, cursor: "pointer",
      }}>
      <span style={{ fontSize: 13 }}>{on ? "★" : "☆"}</span>
      <span>{window.t(on ? "watchlist.added" : "watchlist.add_short")}</span>
    </button>
  );
}

// ─── Passport pulse ──────────────────────────────────────────────────────
// Lightweight retention hook: shows how the user's passport has moved over
// the last N days (gains vs losses), plus rank + visa-free total. Pulled
// from window.CHANGELOG (already populated daily by the scraper) — no new
// data plumbing needed.
const STATUS_RANK = { vr: 0, voa: 1, ev: 2, vf: 3, self: 3, na: 0 };

// Computed passport ranking — falls back to sorting all known passports by
// their (vf + ev + voa) score so we can always show *some* rank even when
// scraper-supplied rank fields are null. Lazily memoised in module scope.
let _rankCache = null;
function computedRank(passport) {
  if (!_rankCache) {
    if (!window.PASSPORT_LIST || !window.tally) return null;
    const scores = window.PASSPORT_LIST.map(p => {
      const t = window.tally(p.iso2);
      const score = t ? (t.vf * 3 + t.ev * 2 + t.voa * 1) : 0;
      return { iso2: p.iso2, score };
    }).sort((a, b) => b.score - a.score);
    _rankCache = {};
    let lastScore = null, lastRank = 0;
    scores.forEach((s, i) => {
      // Tied-score passports share a rank (1, 1, 3 …).
      const rank = s.score === lastScore ? lastRank : i + 1;
      _rankCache[s.iso2] = rank;
      lastScore = s.score;
      lastRank = rank;
    });
  }
  return _rankCache[passport] || null;
}

function passportPulse(passport, days = 30) {
  if (!passport || !window.CHANGELOG) return { gains: 0, losses: 0, items: [] };
  const cutoff = Date.now() - days * 86400_000;
  const items = [];
  let gains = 0, losses = 0;
  for (const c of window.CHANGELOG) {
    if (!c.affects?.passports?.includes(passport)) continue;
    const t = new Date(c.date + "T00:00:00").getTime();
    if (t < cutoff) continue;
    const dFrom = STATUS_RANK[c.statusFrom] ?? 0;
    const dTo = STATUS_RANK[c.statusTo] ?? 0;
    if (dTo > dFrom) gains++;
    else if (dTo < dFrom) losses++;
    items.push(c);
  }
  return { gains, losses, items };
}

function PassportPulse({ passport }) {
  const [days, setDays] = useState(30);
  const pulse = useMemo(() => passportPulse(passport, days), [passport, days]);
  const tally = useMemo(() => window.tally ? window.tally(passport) : null, [passport]);
  const meta = passport ? window.PASSPORTS[passport] : null;
  // Hide the card when there's literally nothing to say (no rank, no tally,
  // no recent diffs) — keeps the panel clean for tiny passports.
  if (!meta || !tally) return null;
  const totalOpen = tally.vf + tally.ev + tally.voa;
  const rank = meta.rank || computedRank(passport);
  const hasMovement = pulse.gains + pulse.losses > 0;
  const windowKey = days === 30 ? "daily.window_30" : "daily.window_90";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, marginBottom: 6,
      }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
          textTransform: "uppercase", letterSpacing: "0.10em",
        }}>{window.t("pulse.heading")}</div>
        <div style={{ display: "inline-flex", gap: 2, padding: 2,
          background: "var(--bg-3)", border: "1px solid var(--panel-border)",
          borderRadius: 6 }}>
          {[30, 90].map(d => (
            <button key={d}
              onClick={() => setDays(d)}
              style={{
                background: days === d ? "var(--self)" : "transparent",
                color: days === d ? "#05070d" : "var(--fg-mute)",
                border: "none", borderRadius: 4,
                padding: "2px 7px", fontSize: 10,
                fontFamily: "var(--font-mono)", cursor: "pointer",
                fontWeight: days === d ? 600 : 500,
              }}>{d}d</button>
          ))}
        </div>
      </div>
      <div style={{
        padding: "10px 12px",
        background: "var(--bg-2)",
        border: "1px solid var(--panel-border)",
        borderRadius: 10,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>
            {rank ? "#" + rank : "—"}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>
            {window.t("pulse.rank")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--vf)" }}>
            {totalOpen}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>
            {window.t("pulse.open")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            {hasMovement ? (
              <>
                <span style={{ color: "var(--vf)" }}>+{pulse.gains}</span>
                {pulse.losses > 0 && <>
                  <span style={{ color: "var(--fg-faint)" }}> · </span>
                  <span style={{ color: "var(--vr)" }}>−{pulse.losses}</span>
                </>}
              </>
            ) : (
              <span style={{ color: "var(--fg-faint)" }}>—</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", marginTop: 2 }}>
            {window.t(windowKey)}
          </div>
        </div>
      </div>
      {hasMovement && (
        <div style={{
          marginTop: 6, fontSize: 11, color: "var(--fg-dim)", lineHeight: 1.45,
        }}>
          {pulse.gains > 0 && window.t("pulse.gains_msg", { n: pulse.gains })}
          {pulse.gains > 0 && pulse.losses > 0 && " · "}
          {pulse.losses > 0 && window.t("pulse.losses_msg", { n: pulse.losses })}
        </div>
      )}
    </div>
  );
}

// ─── Daily destination pick ──────────────────────────────────────────────
// Surfaces one visa-free / eVisa / VoA destination per day, deterministic
// by (passport + UTC date) so it stays stable through the day but rotates
// for the next visit. Gives the site a reason to be opened daily — even
// when nothing in the user's passport has changed.
const STATUS_PRIORITY = { vf: 3, ev: 2, voa: 1 };

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickDailyDestination(passport) {
  if (!passport || !window.COUNTRIES) return null;
  const opts = [];
  for (const c of window.COUNTRIES) {
    if (c.iso2 === passport) continue;
    if (c.continent === "AN") continue; // skip Antarctica
    const r = window.resolveStatus(passport, c.iso2);
    if (STATUS_PRIORITY[r.status]) {
      opts.push({ iso2: c.iso2, status: r.status });
    }
  }
  if (opts.length === 0) return null;
  // Prefer countries with a curated tip — they read better in the card.
  const tipped = opts.filter(o => window.DESTINATION_TIPS && window.DESTINATION_TIPS[o.iso2]);
  const pool = tipped.length >= 8 ? tipped : opts;
  const today = new Date().toISOString().slice(0, 10);
  const idx = hashStr(passport + "|" + today) % pool.length;
  return pool[idx];
}

function DailySuggestion({ passport, onOpen }) {
  const pick = useMemo(() => pickDailyDestination(passport), [passport]);
  if (!pick) return null;
  const country = window.byIso2[pick.iso2];
  if (!country) return null;
  const tipEntry = window.DESTINATION_TIPS && window.DESTINATION_TIPS[pick.iso2];
  const lang = window.ATLAS_LANG || "en";
  const tip = tipEntry ? (tipEntry[lang] || tipEntry.en) : null;
  const statusInfo = STATUS_COLOR[pick.status];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
      }}>{window.t("daily.heading")}</div>
      <button
        onClick={() => onOpen?.(pick.iso2)}
        className="picker-trigger"
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)",
          border: "1px solid var(--panel-border-strong)",
          borderRadius: 10, padding: "12px 14px",
          color: "var(--fg)", fontFamily: "inherit",
          transition: "all 180ms ease",
          display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{country.flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>
              {window.countryName(pick.iso2)}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginTop: 3, padding: "2px 7px", borderRadius: 999,
              background: "rgba(96,165,250,0.10)",
              border: "1px solid var(--panel-border)",
              fontSize: 10, fontFamily: "var(--font-mono)",
              color: "var(--fg-dim)",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: statusInfo?.fill, boxShadow: `0 0 5px ${statusInfo?.fill}`,
              }} />
              <span>{statusLabel(pick.status)}</span>
            </div>
          </div>
          <span style={{ color: "var(--fg-mute)", fontSize: 18 }}>→</span>
        </div>
        {tip && (
          <div style={{
            fontSize: 12, color: "var(--fg-dim)", lineHeight: 1.45,
          }}>
            {tip}
          </div>
        )}
        {!tip && (
          <div style={{ fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.45 }}>
            {window.t("daily.generic_tip")}
          </div>
        )}
      </button>
    </div>
  );
}

function PassportNewsFeed({ passport }) {
  const [expanded, setExpanded] = useState(false);
  const list = useMemo(() => {
    if (!window.VISA_NEWS) return [];
    return window.VISA_NEWS
      .filter(it => matchesPassport(it, passport))
      .sort(sortNewsDesc);
  }, [passport]);
  if (list.length === 0) return null;
  const items = expanded ? list : list.slice(0, 3);
  const passportName = window.countryName(passport);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
          textTransform: "uppercase", letterSpacing: "0.10em",
        }}>{window.t("news.for_passport", { name: passportName })}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(it => <NewsItem key={it.id} item={it} />)}
      </div>
      {list.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent", border: "none",
            color: "var(--fg-mute)", fontFamily: "var(--font-mono)",
            fontSize: 11, cursor: "pointer", padding: "8px 0 0 0",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}
        >
          {expanded ? window.t("changelog.show_less") : window.t("changelog.more", { n: list.length - 3 })}
        </button>
      )}
    </div>
  );
}

function NewsBox({ passport, destIso2 }) {
  const list = useMemo(() => {
    if (!window.VISA_NEWS) return [];
    return window.VISA_NEWS
      .filter(it => matchesDest(it, destIso2) && (!passport || matchesPassport(it, passport)))
      .sort(sortNewsDesc)
      .slice(0, 2);
  }, [passport, destIso2]);
  if (list.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
      }}>{window.t("news.recent_for_dest")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map(it => <NewsItem key={it.id} item={it} compact />)}
      </div>
    </div>
  );
}

// Floating, collapsible "Recently changed" feed. Lives over the globe (left
// of the side panel) instead of inside it, so the right column stays short
// no matter which passport/country is selected. Collapsed by default on
// narrow screens.
function ChangelogFloater() {
  // Collapsed by default so it never covers the globe on first load — the
  // user opens it when they want the feed. Anchored top-LEFT.
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force(x => x + 1);
    window.addEventListener("atlas:lang", f);
    return () => window.removeEventListener("atlas:lang", f);
  }, []);
  const count = (window.CHANGELOG || []).length;
  if (count === 0) return null;
  return (
    <div className="changelog-floater" style={{
      position: "absolute", top: 16, left: 16, zIndex: 5,
      width: 290, maxWidth: "calc(100% - 32px)",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px", cursor: "pointer", textAlign: "left",
          background: "var(--panel)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)",
          borderRadius: open ? "10px 10px 0 0" : 10,
          color: "var(--fg)", fontFamily: "inherit",
        }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "var(--vf)", boxShadow: "0 0 6px var(--vf)",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-dim)",
          textTransform: "uppercase", letterSpacing: "0.10em", flex: 1,
        }}>{window.t("panel.recently_changed")}</span>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        }}>{count}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease", opacity: 0.5 }}>
          <path d="M3 4.5 L6 7.5 L9 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          maxHeight: "min(55vh, 420px)", overflowY: "auto",
          background: "var(--panel)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--panel-border-strong)", borderTop: "none",
          borderRadius: "0 0 10px 10px", padding: "10px 12px",
        }}>
          <Changelog embedded />
        </div>
      )}
    </div>
  );
}

function Changelog({ embedded }) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? window.CHANGELOG : window.CHANGELOG.slice(0, 4);
  return (
    <div style={{ marginBottom: embedded ? 0 : 16 }}>
      {!embedded && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
        }}>
          <div style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--fg-mute)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}>{window.t("panel.recently_changed")}</div>
          <div style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "var(--vf)", boxShadow: "0 0 6px var(--vf)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{
            padding: 12,
            background: "var(--bg-2)",
            border: "1px dashed var(--panel-border)",
            borderRadius: 8,
            fontSize: 11,
            color: "var(--fg-mute)",
            lineHeight: 1.5,
          }}>
            {window.t("panel.no_changes")}
            <br />
            <span style={{ color: "var(--fg-faint)" }}>
              {window.t("panel.no_changes_sub")}
            </span>
          </div>
        ) : (
          items.map((c, i) => <ChangelogItem key={i} entry={c} />)
        )}
      </div>
      {window.CHANGELOG.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent", border: "none",
            color: "var(--fg-mute)", fontFamily: "var(--font-mono)",
            fontSize: 11, cursor: "pointer", padding: "8px 0 0 0",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}
        >
          {expanded ? window.t("changelog.show_less") : window.t("changelog.more", { n: window.CHANGELOG.length - 4 })}
        </button>
      )}
    </div>
  );
}

// Render the "X happened" line for a changelog entry — convert raw status
// codes (vr → voa, ev → vf, …) into a plain-language sentence so non-expert
// users can read the feed at a glance.
function describeStatusChange(from, to) {
  if (from === to) return window.t("change.rules_updated");
  // Specific transitions get their own copy; otherwise we fall back to a
  // generic "X is now required" line based on the destination status.
  const key = `change.${from}_to_${to}`;
  const specific = window.t(key);
  if (specific && specific !== key) return specific;
  // Fallback: describe the new state.
  return window.t(`change.now_${to}`) || window.t("change.rules_updated");
}

function ChangelogItem({ entry }) {
  const passportIso = entry.affects.passports?.[0];
  const passport = passportIso ? window.byIso2[passportIso] : null;
  const dest = window.byIso2[entry.affects.dest];
  const toColor = STATUS_COLOR[entry.statusTo]?.fill || "var(--fg-mute)";
  const date = new Date(entry.date + "T00:00:00");
  const fmt = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sentence = describeStatusChange(entry.statusFrom, entry.statusTo);
  // Pill below the sentence makes the new status visually obvious. We drop
  // the from→to dot+code chain (too cryptic) in favour of a single labelled
  // pill in the destination-status colour.
  return (
    <div style={{
      padding: 10,
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border)",
      borderRadius: 8,
      transition: "all 180ms ease",
      cursor: "default",
    }} className="changelog-item">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {fmt}
        </span>
        <span style={{ color: "var(--fg-faint)" }}>·</span>
        {passport && <>
          <span style={{ fontSize: 14 }}>{passport.flag}</span>
          <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>{window.countryName(passportIso)}</span>
        </>}
        <Arrow />
        {dest && <>
          <span style={{ fontSize: 14 }}>{dest.flag}</span>
          <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>{window.countryName(entry.affects.dest)}</span>
        </>}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg)", lineHeight: 1.4, marginBottom: 6 }}>
        {sentence}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 10, fontFamily: "var(--font-mono)",
        padding: "3px 8px", borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--panel-border)",
        color: "var(--fg-dim)",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: toColor,
          boxShadow: `0 0 6px ${toColor}`,
        }} />
        <span>{statusLabel(entry.statusTo)}</span>
      </div>
    </div>
  );
}

function PanelFooter() {
  const linkStyle = {
    color: "var(--fg-mute)",
    textDecoration: "none",
    borderBottom: "1px dotted var(--fg-faint)",
  };
  return (
    <footer style={{
      marginTop: "auto",
      paddingTop: 12,
      borderTop: "1px solid var(--panel-border)",
      fontSize: 10,
      color: "var(--fg-faint)",
      fontFamily: "var(--font-mono)",
      lineHeight: 1.6,
    }}>
      <div style={{ marginBottom: 6 }}>
        {window.t("footer.refresh")}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/alerts/" style={linkStyle}>{window.t("footer.alerts")}</a>
        <a href="/schengen-calculator/" style={linkStyle}>{window.t("footer.schengen")}</a>
        <a href="/itinerary/" style={linkStyle}>{window.t("footer.itinerary")}</a>
        <a href="/transit-map/" style={linkStyle}>{window.t("nav.transit_map")}</a>
        <a href="/etias/" style={linkStyle}>{window.t("footer.etias")}</a>
        <a href="/passport-validity/" style={linkStyle}>{window.t("footer.validity")}</a>
        <a href="/visa-shortcuts/" style={linkStyle}>{window.t("footer.shortcuts")}</a>
        <a href="/digital-nomad-visa/" style={linkStyle}>{window.t("footer.nomad")}</a>
        <a href="/citizenship-by-investment/" style={linkStyle}>{window.t("footer.cbi")}</a>
        <a href="/about/" style={linkStyle}>{window.t("footer.about")}</a>
        <a href="/privacy/" style={linkStyle}>{window.t("footer.privacy")}</a>
        <a href="/passport/" style={linkStyle}>{window.t("footer.all_passports")}</a>
        <a href="https://github.com/Uygara/atlas-visa-globe" target="_blank" rel="noopener" style={linkStyle}>{window.t("footer.source")}</a>
      </div>
      <div style={{ marginTop: 8, color: "var(--fg-faint)" }}>
        © {new Date().getFullYear()} travelnow.info · {window.t("footer.rights")}
      </div>
    </footer>
  );
}

Object.assign(window, { Panel });

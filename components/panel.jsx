// Side panel — passport picker, tally, search, country detail, recently-changed feed.

function Panel({
  passport, setPassport,
  compare, setCompare, compareMode, setCompareMode,
  groupMode, groupPassports, setGroupPassports,
  filter, setFilter,
  detailCountry, setDetailCountry,
  search, setSearch,
  onPickFromSearch,
  showCompare,
  direction, setDirection,
  variant, setVariant,
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

      {/* Dual-citizenship hint: discoverable shortcut to compare mode without
          digging through the Settings popover. Only appears once a primary
          passport is chosen and neither compare nor group mode is active. */}
      {passport && !compareMode && !groupMode && setCompareMode && (
        <button
          onClick={() => setCompareMode(true)}
          style={{
            width: "100%", padding: "8px 10px", marginBottom: 14,
            background: "transparent",
            border: "1px dashed var(--panel-border-strong)",
            borderRadius: 8, color: "var(--fg-mute)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 12,
            textAlign: "left", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ color: "var(--compare-self)", fontSize: 14 }}>+</span>
          {window.t("panel.dual_citizenship")}
        </button>
      )}

      {groupMode && (
        <GroupPicker
          primary={passport}
          values={groupPassports || []}
          onChange={setGroupPassports}
        />
      )}

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

      {!detailCountry && passport && !groupActive && (
        <PassportPulse passport={passport} />
      )}

      {!detailCountry && passport && !groupActive && (
        <DailySuggestion passport={passport} onOpen={(iso2) => { setDetailCountry(iso2); }} />
      )}

      {!detailCountry && passport && <PassportNewsFeed passport={passport} />}

      {!detailCountry && <Changelog />}

      <PanelFooter />
    </aside>
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
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--vf)",
            boxShadow: "0 0 6px var(--vf)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          {window.t("header.live")} · {formatted}
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
  const MAX = 4;

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
  const total = tally.vf + tally.ev + tally.voa + tally.vr;
  const rows = [
    { k: "vf",  ...STATUS_COLOR.vf,  n: tally.vf,  label: window.t("status.vf")  },
    { k: "ev",  ...STATUS_COLOR.ev,  n: tally.ev,  label: window.t("status.ev")  },
    { k: "voa", ...STATUS_COLOR.voa, n: tally.voa, label: window.t("status.voa") },
    { k: "vr",  ...STATUS_COLOR.vr,  n: tally.vr,  label: window.t("status.vr")  },
  ];
  const accessScore = tally.vf + tally.ev + tally.voa;
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
    vf:   window.t("detail.note.vf"),
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
  const ORDER = { self: 0, vf: 1, ev: 2, voa: 3, vr: 4, na: 5 };
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 32, lineHeight: 1 }}>{dest.flag}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{window.countryName(iso2)}</div>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {dest.continent ? (window.t("cont." + dest.continent) !== ("cont." + dest.continent) ? window.t("cont." + dest.continent) : dest.continent) : "—"}
          </div>
        </div>
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
          <div style={{ fontSize: 13, fontWeight: 500 }}>{localizedStatusLabel(r.status)}</div>
          {r.days && <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{window.t("detail.up_to_days", { n: r.days })}</div>}
        </div>
      </div>

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
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: "1px solid var(--panel-border)" }}>
                <span style={{ fontSize: 16 }}>{c?.flag}</span>
                <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window.countryName(p)}</span>
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
  const ORDER = { vf: 0, ev: 1, voa: 2, vr: 3, na: 4 };
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
    <a href="/transit-visa/" style={{
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
  if (status === "vf" || status === "self") return null;
  const data = window.visaFee && window.visaFee(passport, destIso2);
  if (!data) return null;

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
              <span>{statusInfo?.label}</span>
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

function Changelog() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? window.CHANGELOG : window.CHANGELOG.slice(0, 4);
  return (
    <div style={{ marginBottom: 16 }}>
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
        <span>{STATUS_COLOR[entry.statusTo]?.label || STATUS_COLOR[entry.statusTo]?.short || "—"}</span>
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
        <a href="/transit-visa/" style={linkStyle}>{window.t("footer.transit")}</a>
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

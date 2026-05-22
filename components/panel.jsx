// Side panel — passport picker, tally, search, country detail, recently-changed feed.

function Panel({
  passport, setPassport,
  compare, setCompare, compareMode,
  groupMode, groupPassports, setGroupPassports,
  filter, setFilter,
  detailCountry, setDetailCountry,
  search, setSearch,
  onPickFromSearch,
  showCompare,
  direction, setDirection,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showComparePicker, setShowComparePicker] = useState(false);
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
        ? (direction === "incoming" ? window.tallyIncoming(passport) : window.tally(passport))
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
          onClose={() => setDetailCountry(null)}
        />
      )}

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
        <Logomark />
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>Atlas</div>
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

function DirectionToggle({ value, onChange }) {
  // "outgoing" — colour each country by what *I* need to enter it.
  // "incoming" — colour each country by what *its citizens* need to visit me.
  const opts = [
    { v: "outgoing", l: window.t("panel.outgoing"), hint: window.t("panel.outgoing_hint") },
    { v: "incoming", l: window.t("panel.incoming"), hint: window.t("panel.incoming_hint") },
  ];
  const active = opts.find(o => o.v === (value || "outgoing"));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)",
        textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 6,
      }}>{window.t("panel.direction")}</div>
      <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--panel-border)" }}>
        {opts.map(o => {
          const on = o.v === (value || "outgoing");
          return (
            <button key={o.v} onClick={() => onChange(o.v)}
              style={{
                flex: 1, padding: "7px 8px", borderRadius: 7,
                border: "none",
                background: on ? "var(--self)" : "transparent",
                color: on ? "#05070d" : "var(--fg-dim)",
                fontFamily: "inherit", fontSize: 12,
                fontWeight: on ? 600 : 500,
                cursor: "pointer",
                transition: "background 160ms ease, color 160ms ease",
              }}>{o.l}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
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
                <span>{c.name}</span>
                <button
                  onClick={() => remove(iso)}
                  aria-label={window.t("group.remove", { name: c.name })}
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
    .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.iso2.toLowerCase().includes(q.toLowerCase()))
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
              <span>{p.name}</span>
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
                {country.name}
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
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(p => {
      if (!ql) return true;
      return p.name.toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql);
    });
  }, [q]);
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
              <span style={{ flex: 1 }}>{p.name}</span>
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
      c.name.toLowerCase().includes(q) || c.iso2.toLowerCase() === q
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
                <span style={{ flex: 1 }}>{c.name}</span>
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

function DetailCard({ passport, compare, iso2, onClose, direction, groupPassports }) {
  const dest = window.byIso2[iso2];
  if (!dest) return null;
  const groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  const incoming = direction === "incoming" && !groupActive;
  const r = groupActive
    ? window.resolveGroupStatus(groupPassports, iso2)
    : (incoming ? window.resolveStatus(iso2, passport) : window.resolveStatus(passport, iso2));
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
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{dest.name}</div>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {dest.continent ? (window.t("cont." + dest.continent) !== ("cont." + dest.continent) ? window.t("cont." + dest.continent) : dest.continent) : "—"}
          </div>
        </div>
      </div>

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

      <AlertsCTA iso2={iso2} destName={dest.name} />

      {!groupActive && (
        <VisaFeeBox passport={passport} destIso2={iso2} status={r.status} />
      )}

      <AffiliatePartners status={r.status} iso2={iso2} />

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
                <span style={{ fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.name}</span>
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

function ChangelogItem({ entry }) {
  const dest = window.byIso2[entry.affects.dest];
  const fromColor = STATUS_COLOR[entry.statusFrom]?.fill || "var(--fg-mute)";
  const toColor = STATUS_COLOR[entry.statusTo]?.fill || "var(--fg-mute)";
  const date = new Date(entry.date + "T00:00:00");
  const fmt = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{
      padding: 10,
      background: "var(--bg-2)",
      border: "1px solid var(--panel-border)",
      borderRadius: 8,
      transition: "all 180ms ease",
      cursor: "default",
    }} className="changelog-item">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {fmt}
        </span>
        {dest && <>
          <span style={{ color: "var(--fg-faint)", margin: "0 1px" }}>·</span>
          <span style={{ fontSize: 14 }}>{dest.flag}</span>
          <span style={{ fontSize: 11, color: "var(--fg-dim)" }}>{dest.name}</span>
        </>}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg)", lineHeight: 1.4, fontWeight: 500, marginBottom: 4 }}>
        {entry.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-mute)" }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: fromColor,
        }} />
        <span>{STATUS_COLOR[entry.statusFrom]?.short || "—"}</span>
        <Arrow />
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: toColor,
          boxShadow: `0 0 6px ${toColor}`,
        }} />
        <span>{STATUS_COLOR[entry.statusTo]?.short || "—"}</span>
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
        <a href="/digital-nomad-visa/" style={linkStyle}>{window.t("footer.nomad")}</a>
        <a href="/about/" style={linkStyle}>{window.t("footer.about")}</a>
        <a href="/privacy/" style={linkStyle}>{window.t("footer.privacy")}</a>
        <a href="/passport/" style={linkStyle}>{window.t("footer.all_passports")}</a>
        <a href="https://github.com/Uygara/atlas-visa-globe" target="_blank" rel="noopener" style={linkStyle}>{window.t("footer.source")}</a>
      </div>
    </footer>
  );
}

Object.assign(window, { Panel });

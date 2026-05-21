// Side panel — passport picker, tally, search, country detail, recently-changed feed.

function Panel({
  passport, setPassport,
  compare, setCompare, compareMode,
  filter, setFilter,
  detailCountry, setDetailCountry,
  search, setSearch,
  onPickFromSearch,
  showCompare,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showComparePicker, setShowComparePicker] = useState(false);
  const tallyData = passport ? window.tally(passport) : null;

  return (
    <aside className="panel">
      <PanelHeader />

      <PassportPicker
        label="Your passport"
        value={passport}
        open={showPicker}
        setOpen={setShowPicker}
        onChange={(v) => { setPassport(v); setShowPicker(false); }}
      />

      {showCompare && (
        <PassportPicker
          label="Compare with"
          value={compare}
          open={showComparePicker}
          setOpen={setShowComparePicker}
          onChange={(v) => { setCompare(v); setShowComparePicker(false); }}
          accent="var(--compare-self)"
          placeholder="Pick a second passport…"
          allowClear
        />
      )}

      {passport && tallyData && (
        <Tally tally={tallyData} filter={filter} setFilter={setFilter} passport={passport} />
      )}

      <CountrySearch
        passport={passport}
        search={search}
        setSearch={setSearch}
        onPick={onPickFromSearch}
      />

      {detailCountry && passport && (
        <DetailCard
          passport={passport}
          compare={compareMode ? compare : null}
          iso2={detailCountry}
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
          Live · {formatted}
        </div>
      </div>
      <p style={{
        margin: "6px 0 0 0",
        fontSize: 12,
        color: "var(--fg-mute)",
        lineHeight: 1.45,
      }}>
        Where can your passport take you?
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
          <span style={{ color: "var(--fg-mute)" }}>{placeholder || "Select a passport…"}</span>
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
        placeholder="Search passports…"
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
            Clear selection
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
            No passports match
          </div>
        )}
      </div>
    </div>
  );
}

function Tally({ tally, filter, setFilter, passport }) {
  const total = tally.vf + tally.ev + tally.voa + tally.vr;
  const rows = [
    { k: "vf",  ...STATUS_COLOR.vf,  n: tally.vf  },
    { k: "ev",  ...STATUS_COLOR.ev,  n: tally.ev  },
    { k: "voa", ...STATUS_COLOR.voa, n: tally.voa },
    { k: "vr",  ...STATUS_COLOR.vr,  n: tally.vr  },
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
          destinations accessible<br/>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-faint)" }}>of {total}</span>
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
          <span style={{ flex: 1, textAlign: "left" }}>All</span>
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
          placeholder="Search any country…"
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

function DetailCard({ passport, compare, iso2, onClose }) {
  const dest = window.byIso2[iso2];
  if (!dest) return null;
  const r = window.resolveStatus(passport, iso2);
  const rc = compare ? window.resolveStatus(compare, iso2) : null;
  const sc = STATUS_COLOR[r.status];
  const myPp = window.byIso2[passport];

  const NOTES = {
    vf:  "No visa needed. Present a valid passport on arrival.",
    ev:  "Apply online before travel. Approval is typically issued in 24–72 hours.",
    voa: "Obtain visa at the border. Carry passport photos, fee in USD, and proof of onward travel.",
    vr:  "Apply for a visa at an embassy or consulate before travel.",
    self: "You are at home.",
    na:  "No data available for this passport / destination pair.",
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
        aria-label="Close"
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
            {dest.continent === "EU" ? "Europe" : dest.continent === "AS" ? "Asia" : dest.continent === "AF" ? "Africa" : dest.continent === "NA" ? "N. America" : dest.continent === "SA" ? "S. America" : dest.continent === "OC" ? "Oceania" : "—"}
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
          <div style={{ fontSize: 13, fontWeight: 500 }}>{sc.label}</div>
          {r.days && <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>Up to {r.days} days</div>}
        </div>
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--fg-dim)", margin: "0 0 10px 0" }}>
        {NOTES[r.status]}
      </p>

      <AffiliatePartners status={r.status} iso2={iso2} />

      <AdSlot slotKey="sidebar" />

      {rc && compare && (
        <div style={{
          padding: 10,
          borderRadius: 8,
          border: "1px dashed var(--panel-border-strong)",
          background: "rgba(96,165,250,0.05)",
        }}>
          <div style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Compare</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{window.byIso2[compare]?.flag}</span>
            <Arrow />
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: STATUS_COLOR[rc.status].fill, boxShadow: `0 0 10px ${STATUS_COLOR[rc.status].fill}`,
            }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{STATUS_COLOR[rc.status].label}</div>
              {rc.days && <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>Up to {rc.days} days</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Renders an AdSense ad unit if (and only if) both the publisher client ID and
// the slot's numeric ID are configured in data/ads.js. Otherwise renders nothing.
// On mount it pushes a request to AdSense's queue, exactly as Google docs prescribe.
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
      }}>Plan your trip</div>
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
        Sponsored. Atlas may earn a commission.
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
        }}>Recently changed</div>
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
            No policy changes detected in the last 24 hours.
            <br />
            <span style={{ color: "var(--fg-faint)" }}>
              Atlas re-scrapes Wikipedia every morning at 06:00 UTC. Real
              policy edits will appear here as they happen.
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
          {expanded ? "Show less" : `+ ${window.CHANGELOG.length - 4} more changes`}
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
  return (
    <footer style={{
      marginTop: "auto",
      paddingTop: 12,
      borderTop: "1px solid var(--panel-border)",
      fontSize: 10,
      color: "var(--fg-faint)",
      fontFamily: "var(--font-mono)",
      lineHeight: 1.5,
    }}>
      Data sourced from public visa policy archives, embassy notices, and IATA Travel Centre. Verify before travel.
    </footer>
  );
}

Object.assign(window, { Panel });

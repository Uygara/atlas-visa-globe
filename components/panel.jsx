// Side panel — passport picker, tally, search, country detail, "for you" feed.
// Visual language (see assets/app-shell.css): the passport picker is a data
// page with a machine-readable zone, the tally is a ledger with dotted leaders,
// and a country's verdict is an entry stamp. Shared primitives (Caption,
// Swatch, Dot, icons, MobileSheetHandle) come from components/chrome.jsx.

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
  passport, setPassport, autoDetected,
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
  // uses it to route map clicks into the picker (pick a passport by tapping
  // its country on the globe).
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
  useLangTick();
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

      <section className="p-sec">
        <Caption n={1}>{window.t("panel.your_passport")}</Caption>
        <PassportPicker
          value={passport}
          open={showPicker}
          setOpen={setShowPicker}
          onChange={(v) => { setPassport(v); setShowPicker(false); }}
        />
        {autoDetected && !showPicker && (
          <button type="button" className="link-quiet guess-note" onClick={() => setShowPicker(true)}>
            {tr("picker.guessed", "Guessed from your time zone — not your passport? Change it")}
          </button>
        )}

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
              // group with [primary, suggested-secondary].
              setGroupPassports([passport, secondary]);
              setGroupMode(true);
              if (setCompareMode) setCompareMode(false);
            }}
          />
        )}
      </section>

      {/* Core payoff first: direction + ledger, then search. */}
      {tallyData && (
        <section className="p-sec">
          <Caption n={2}>{groupActive ? window.t("tally.group_label") : window.t("panel.direction")}</Caption>
          {passport && !groupMode && (
            <DirectionToggle value={direction} onChange={setDirection} passport={passport} />
          )}
          <Tally tally={tallyData} filter={filter} setFilter={setFilter} groupActive={groupActive} direction={direction} />
          {filter !== "all" && (
            <FilterList
              filter={filter}
              passport={passport}
              direction={direction}
              variant={variant}
              groupPassports={groupActive ? groupPassports : null}
              onOpen={onPickFromSearch}
            />
          )}
        </section>
      )}

      <section className="p-sec">
        <CountrySearch
          passport={passport}
          search={search}
          setSearch={setSearch}
          onPick={onPickFromSearch}
        />
        {passport === "US" && !groupActive && direction !== "incoming" && (
          <PopularDestinations passport={passport} onPick={onPickFromSearch} />
        )}
      </section>

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

      {/* Advanced modes (compare / combine) after the core result. */}
      {passport && setCompareMode && setGroupMode && (
        <section className="p-sec">
          <Caption n={3}>{window.t("modes.title")}</Caption>
          <ModeBar
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            groupMode={groupMode}
            setGroupMode={setGroupMode}
          />
          {showCompare && !groupMode && (
            <div style={{ marginTop: 10 }}>
              <PassportPicker
                value={compare}
                open={showComparePicker}
                setOpen={setShowComparePicker}
                onChange={(v) => { setCompare(v); setShowComparePicker(false); }}
                isCompare
                placeholder={window.t("picker.pick_second")}
                allowClear
              />
            </div>
          )}
          {groupMode && (
            <GroupPicker
              primary={passport}
              values={groupPassports || []}
              onChange={setGroupPassports}
            />
          )}
        </section>
      )}

      {/* "For you" — secondary, daily-return content, collapsible. */}
      {!detailCountry && passport && (
        <ForYouSection>
          <WeeklyDigest passport={passport} />
          {!groupActive && <PassportPulse passport={passport} />}
          <WatchlistCard onOpen={(iso2) => { setDetailCountry(iso2); }} />
          <ItineraryCTA />
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

// Collapsible "For you" block. Collapse state persists.
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
      <button type="button" className="collapse-btn" onClick={toggle} aria-expanded={open}>
        <Caption n={4}>{window.t("panel.for_you")}</Caption>
        <IconCaret />
      </button>
      {open && children}
    </div>
  );
}

function PanelHeader() {
  const date = new Date(window.SNAPSHOT_DATE + "T00:00:00");
  const formatted = isNaN(date) ? "" : date.toLocaleDateString(window.ATLAS_LANG || "en", { day: "numeric", month: "short", year: "numeric" });
  return (
    <header className="p-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="p-head-title">{window.t("header.tagline")}</div>
      </div>
      {formatted && (
        <time className="p-head-date" dateTime={window.SNAPSHOT_DATE} title={window.t("footer.refresh")}>
          {window.t("header.updated")} {formatted}
        </time>
      )}
    </header>
  );
}

// Segmented control under the passport picker for passports that have
// type variants (TR has hususi / hizmet / diplomatik on top of bordo; GB has
// its nationality classes). Ordinary is always first and the default.
function PassportTypeSelector({ passport, value, onChange }) {
  const variants = window.passportVariants(passport);
  if (!variants.length) return null;
  const lang = window.ATLAS_LANG || "en";
  const opts = [
    { key: "ordinary", label: window.passportVariantLabel(passport, "ordinary"), sub: null, source: null },
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
    <div style={{ marginTop: 12 }}>
      <div className="p-hint" style={{ margin: "0 0 5px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("panel.passport_type")}</div>
      <div className="seg seg-wide" role="group" aria-label={window.t("panel.passport_type")}>
        {opts.map(o => (
          <button key={o.key} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)} title={o.label}>
            {o.label}
          </button>
        ))}
      </div>
      {(active.sub || active.source) && (
        <p className="p-hint">
          {active.sub}
          {active.source && (
            <> · <a className="link-quiet" href={active.source} target="_blank" rel="noopener nofollow">{window.t("cond.source")}</a></>
          )}
        </p>
      )}
      {value !== "ordinary" && <p className="p-fine" style={{ marginTop: 4 }}>{window.t("panel.variant_disclaimer")}</p>}
    </div>
  );
}

// Residence-permit picker — six well-documented blocs. Selecting any of them
// applies the matching upgrades and the whole map repaints.
function ResidencePermitPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
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
    <div style={{ marginTop: 10 }}>
      <button type="button" className={"row-btn" + (active ? " is-on" : "")} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="row-btn-label">
          {active
            ? <>{T("permits.active", "Holding")} <span className="flag">{value.map(v => { const b = blocs.find(x => x.key === v); return b ? b.flag : v; }).join(" ")}</span></>
            : T("permits.add", "Also have a residence permit? Add it →").replace(/\s*→\s*$/, "")}
        </span>
        <IconCaret className={open ? "is-flipped" : ""} />
      </button>
      {open && (
        <div className="box" style={{ marginTop: 6, marginBottom: 0 }}>
          <div className="check-grid">
            {blocs.map(b => (
              <label key={b.key} className={"check" + (set.has(b.key) ? " is-on" : "")}>
                <input type="checkbox" checked={set.has(b.key)} onChange={() => toggle(b.key)} />
                <span className="flag">{b.flag}</span>
                <span>{b.label}</span>
              </label>
            ))}
          </div>
          <p className="p-fine" style={{ margin: "8px 0 0" }}>
            {T("permits.hint", "Holding any of these unlocks easier entry to certain destinations — the map and the tally update automatically.")}
          </p>
        </div>
      )}
    </div>
  );
}

// Most-visited destinations for the active passport — curated only for US
// (the site's largest audience). Destination list = top US outbound markets
// per U.S. Commerce Dept / NTTO outbound statistics. Extend _POPULAR_DESTS
// with another passport's list if another audience grows.
const _POPULAR_DESTS = {
  US: ["MX", "CA", "GB", "FR", "IT", "DO", "JP", "ES"],
};
function PopularDestinations({ passport, onPick }) {
  const dests = _POPULAR_DESTS[passport];
  if (!dests) return null;
  const T = (k, fallback) => { const v = window.t ? window.t(k) : k; return v === k ? fallback : v; };
  return (
    <div style={{ marginTop: 12 }}>
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{T("popular.title", "Popular with US travelers")}</div>
      <div className="chips">
        {dests.map(iso2 => {
          const c = (window.COUNTRIES || []).find(x => x.iso2 === iso2);
          if (!c) return null;
          const r = window.resolveStatus(passport, iso2);
          return (
            <button key={iso2} type="button" className="chip" onClick={() => onPick(iso2)} title={statusLabel(r.status)}>
              <span className="flag">{c.flag}</span>
              <span>{window.countryName(iso2)}</span>
              <Dot s={r.status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dual-citizenship hint — for passports whose holders very often hold a
// second, stronger passport. "Add" pre-populates Combine mode with both.
// Data + strength tiers live in data/dual-citizenship.js.
function DualCitizenshipHint({ primary, onAccept }) {
  const hints = window.DUAL_CITIZENSHIP_HINTS;
  if (!hints || !hints[primary]) return null;
  const hint = hints[primary];
  const list = window.PASSPORT_LIST || [];
  const sec = list.find(p => p.iso2 === hint.suggest);
  if (!sec) return null;
  const T = (k, fallback) => { const v = window.t ? window.t(k) : k; return v === k ? fallback : v; };
  const verbKey = hint.strength === "strong"
    ? T("dual.likely", "You probably also hold")
    : hint.strength === "common"
      ? T("dual.may_hold", "Many also hold")
      : T("dual.may_qualify", "You may also qualify for");
  const cflag = (window.COUNTRIES || []).find(c => c.iso2 === hint.suggest);
  return (
    <div className="note note-accent" style={{ marginTop: 10, marginBottom: 0 }}>
      <span className="note-k">
        {cflag && <span className="flag" style={{ marginRight: 6 }}>{cflag.flag}</span>}
        {verbKey} {T("dual.a_passport", "a")} {sec.name} {T("dual.passport_word", "passport")}.
      </span>
      <button type="button" className="btn btn-primary" style={{ gridRow: "1 / span 2", gridColumn: 2, padding: "5px 10px", fontSize: 12.5 }} onClick={() => onAccept(hint.suggest)}>
        {T("dual.add_passport", "Add it →").replace(/\s*→\s*$/, "")}
      </button>
      <span className="note-s">{hint.reason}</span>
    </div>
  );
}

// Compare / combine toggles. Mutually exclusive: enabling one disables the other.
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
  return (
    <div>
      <p className="p-hint" style={{ margin: "0 0 8px" }}>{window.t("modes.hint")}</p>
      <div className="mode-pair">
        <button type="button" className="btn" aria-pressed={compareMode} onClick={toggleCompare}>
          <span className="mode-mark" style={{ "--m": "var(--compare-self)" }} aria-hidden="true">{compareMode ? "✓" : "+"}</span>
          {window.t("mode.compare_short")}
        </button>
        <button type="button" className="btn" aria-pressed={groupMode} onClick={toggleGroup}>
          <span className="mode-mark" style={{ "--m": "var(--self)" }} aria-hidden="true">{groupMode ? "✓" : "+"}</span>
          {window.t("mode.group_short")}
        </button>
      </div>
    </div>
  );
}

function DirectionToggle({ value, onChange, passport }) {
  // "outgoing" — colour each country by what *I* need to enter it.
  // "incoming" — colour each country by what *its citizens* need to visit me.
  const cur = value || "outgoing";
  const opts = [
    { v: "outgoing", l: window.t("panel.outgoing"), hint: window.t("panel.outgoing_hint"), a: passport + " →" },
    { v: "incoming", l: window.t("panel.incoming"), hint: window.t("panel.incoming_hint"), a: "→ " + passport },
  ];
  const active = opts.find(o => o.v === cur);
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="tabs" role="tablist" aria-label={window.t("panel.direction")}>
        {opts.map(o => (
          <button key={o.v} type="button" role="tab" aria-selected={o.v === cur} onClick={() => onChange(o.v)} title={o.hint}>
            <span className="arrow">{o.a}</span>{o.l}
          </button>
        ))}
      </div>
      <p className="p-hint">{active?.hint}</p>
    </div>
  );
}

// Combine: up to MAX passports held by ONE traveller. The primary passport is
// auto-included the first time the picker mounts.
function GroupPicker({ primary, values, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const MAX = 10;

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
    <div style={{ marginTop: 12 }}>
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>
        {window.t("group.label")} <span className="mono" style={{ fontWeight: 400, color: "var(--ink-3)" }}>{values.length}/{MAX}</span>
      </div>
      <div className="chips" style={{ marginBottom: values.length ? 8 : 0 }}>
        {values.map(iso => {
          const c = window.byIso2[iso];
          if (!c) return null;
          return (
            <span key={iso} className="chip" style={{ cursor: "default" }}>
              <span className="flag">{c.flag}</span>
              <span>{window.countryName(iso)}</span>
              <button type="button" className="chip-x" onClick={() => remove(iso)}
                aria-label={window.t("group.remove", { name: window.countryName(iso) })}>×</button>
            </span>
          );
        })}
      </div>
      {values.length < MAX && (
        <button type="button" className="btn btn-block box-dashed" style={{ borderStyle: "dashed" }} onClick={() => setPickerOpen(!pickerOpen)} aria-expanded={pickerOpen}>
          {window.t("group.add_passport")}
        </button>
      )}
      {pickerOpen && (
        <GroupAddDropdown existing={values} onPick={add} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function GroupAddDropdown({ existing, onPick }) {
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
    <div className="dd">
      <input autoFocus type="text" className="field dd-search" placeholder={window.t("picker.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="dd-list" style={{ maxHeight: 220 }}>
        {filtered.map(p => {
          const c = window.byIso2[p.iso2];
          return (
            <button key={p.iso2} type="button" className="dd-item" onClick={() => onPick(p.iso2)}>
              <span className="flag">{c?.flag}</span>
              <span className="dd-grow">{window.countryName(p.iso2)}</span>
              <span className="dd-code">{p.iso2}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="dd-empty">{window.t("picker.no_matches_short")}</div>}
      </div>
    </div>
  );
}

// The passport "data page". Shows the chosen passport like the bio page of a
// real one — including a machine-readable zone generated from its data.
function PassportPicker({ value, open, setOpen, onChange, isCompare, placeholder, allowClear }) {
  const current = value ? window.PASSPORTS[value] : null;
  const country = value ? window.byIso2[value] : null;
  // The machine-readable zone comes from data/mrz.js, shared with the generated
  // /passport/ pages. Call it through window: a top-level function named mrzLines
  // here would replace it (all compiled JSX shares one global scope) and recurse.
  const mrz = value && window.mrzLines ? window.mrzLines(value) : null;
  return (
    <div>
      <button type="button" className={"pp-card" + (isCompare ? " is-compare" : "")} onClick={() => setOpen(!open)} aria-expanded={open}
        aria-label={(isCompare ? window.t("panel.compare_with") : window.t("panel.your_passport")) + (country ? ": " + window.countryName(value) : "")}>
        <span className="pp-doc" aria-hidden="true">
          {isCompare ? window.t("panel.compare_with") : "Passport · Pasaport · Passeport"}
          <IconCaret />
        </span>
        {country ? (
          <span className="pp-main">
            <span className="flag pp-flag" aria-hidden="true">{country.flag}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="pp-name" style={{ display: "block" }}>{window.countryName(value)}</span>
              <span className="pp-meta" style={{ display: "block" }}>
                {value}
                {window.passportRank(value) && <> · {window.t("pulse.rank")} #{window.passportRank(value).rank}</>}
              </span>
            </span>
          </span>
        ) : (
          <span className="pp-empty" style={{ display: "block" }}>{placeholder || window.t("picker.select_passport")}</span>
        )}
        {mrz && (
          <span className="mrz" aria-hidden="true"><span>{mrz[0]}</span><span>{mrz[1]}</span></span>
        )}
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

function PassportDropdown({ value, onChange, allowClear, onClear }) {
  const [q, setQ] = useState("");
  // Pin the currently-selected passport to the top of the list.
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
    <div className="dd">
      <input autoFocus className="field dd-search" placeholder={window.t("picker.search_passports")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="dd-tip">{window.t("picker.tap_map_hint")}</div>
      <div className="dd-list" role="listbox">
        {allowClear && (
          <button type="button" className="dd-item" onClick={onClear} style={{ color: "var(--ink-3)", fontStyle: "italic" }}>
            {window.t("picker.clear")}
          </button>
        )}
        {list.map(p => {
          const c = window.byIso2[p.iso2];
          const active = p.iso2 === value;
          return (
            <button key={p.iso2} type="button" role="option" aria-selected={active} className="dd-item" onClick={() => onChange(p.iso2)}>
              <span className="flag">{c?.flag}</span>
              <span className="dd-grow">{window.countryName(p.iso2)}</span>
              {active && <span className="dd-tag">{window.t("picker.selected")}</span>}
              {window.passportRank(p.iso2) && <span className="dd-code">#{window.passportRank(p.iso2).rank}</span>}
            </button>
          );
        })}
        {list.length === 0 && <div className="dd-empty">{window.t("picker.no_matches")}</div>}
      </div>
    </div>
  );
}

// The ledger: one big number, a proportional bar, and filter rows with dotted
// leaders — printed-index style.
function Tally({ tally, filter, setFilter, groupActive, direction }) {
  const total = (tally.idc || 0) + tally.vf + (tally.eta || 0) + tally.ev + tally.voa + tally.vr + (tally.ban || 0);
  const rows = [
    // ID-card travel only when present; ETA only when present; ban only when present.
    ...((tally.idc || 0) > 0 ? [{ k: "idc", n: tally.idc }] : []),
    { k: "vf", n: tally.vf },
    ...((tally.eta || 0) > 0 ? [{ k: "eta", n: tally.eta }] : []),
    { k: "ev", n: tally.ev },
    { k: "voa", n: tally.voa },
    { k: "vr", n: tally.vr },
    ...((tally.ban || 0) > 0 ? [{ k: "ban", n: tally.ban }] : []),
  ];
  // One headline number: destinations you can enter WITHOUT applying for a
  // visa. eVisas are shown as a second line, never folded into the headline.
  const noVisa = window.mobilityScore(tally);
  const withEvisa = window.accessScore(tally);
  const scoreLabel = groupActive ? window.t("tally.group_score")
    : direction === "incoming" ? window.t("tally.incoming_label")
    : window.t("tally.no_visa");
  return (
    <div>
      <div className="score">
        <span className="score-n">{noVisa}</span>
        <span className="score-l">
          {scoreLabel}<br />
          <span className="mono">{window.t("tally.of")} {total}{groupActive && " · " + window.t("tally.worst_case")}</span>
        </span>
      </div>
      {withEvisa > noVisa && (
        <p className="score-sub">{window.t("tally.with_evisa", { n: withEvisa })}</p>
      )}

      <div className="bar" aria-hidden="true">
        {rows.map(r => r.n > 0 && (
          <span key={r.k} className={r.k === "ban" ? "sw-ban" : ""}
            style={{ flex: `${r.n} 0 0`, background: r.k === "ban" ? undefined : `var(--${r.k})` }} />
        ))}
      </div>

      <ul className="ledger">
        <li>
          <button type="button" className="lg-row" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            <span className="sw sw-all" aria-hidden="true" />
            <span className="lg-label">{window.t("tally.filter_all")}</span>
            <span className="lg-dots" />
            <span className="lg-n">{total}</span>
          </button>
        </li>
        {rows.map(r => (
          <li key={r.k}>
            <button type="button" className="lg-row" aria-pressed={filter === r.k} onClick={() => setFilter(filter === r.k ? "all" : r.k)}>
              <Swatch s={r.k} />
              <span className="lg-label">{statusLabel(r.k)}</span>
              <span className="lg-dots" />
              <span className="lg-n">{r.n}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The countries behind a ledger row, so "Visa-free 71" is a list you can read
// and tap, not only a recoloured globe. Resolves each country the same way the
// globe and the detail card do (direction, passport type, combined passports).
const FILTER_LIST_PREVIEW = 12;
function FilterList({ filter, passport, direction, variant, groupPassports, onOpen }) {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); }, [filter, passport, direction]);
  useLangTick();
  const rows = useMemo(() => {
    const group = Array.isArray(groupPassports) && groupPassports.length > 0;
    const incoming = direction === "incoming" && !group;
    const variantActive = !!variant && variant !== "ordinary" && !group && !incoming;
    const resolve = (iso2) => group
      ? window.resolveGroupStatus(groupPassports, iso2)
      : incoming
        ? window.resolveStatus(iso2, passport)
        : variantActive
          ? window.resolveVariantStatus(passport, iso2, variant)
          : window.resolveStatus(passport, iso2);
    return window.COUNTRIES
      .filter(c => c.continent !== "AN" && (group ? !groupPassports.includes(c.iso2) : c.iso2 !== passport))
      .map(c => ({ iso2: c.iso2, flag: c.flag, r: resolve(c.iso2) }))
      .filter(x => x.r.status === filter)
      .sort((a, b) => window.countryName(a.iso2).localeCompare(window.countryName(b.iso2), window.ATLAS_LANG || "en"));
  }, [filter, passport, direction, variant, groupPassports, window.ATLAS_LANG]);
  if (rows.length === 0) return null;
  const shown = showAll ? rows : rows.slice(0, FILTER_LIST_PREVIEW);
  return (
    <div className="clist">
      {shown.map(x => (
        <button key={x.iso2} type="button" className="dd-item" onClick={() => onOpen(x.iso2)}>
          <span className="flag">{x.flag}</span>
          <span className="dd-grow">{window.countryName(x.iso2)}</span>
          {x.r.days ? <span className="dd-code">{window.t("detail.up_to_days", { n: x.r.days })}</span> : null}
        </button>
      ))}
      {rows.length > FILTER_LIST_PREVIEW && (
        <button type="button" className="more-btn" onClick={() => setShowAll(v => !v)}>
          {showAll ? window.t("changelog.show_less") : tr("tally.show_all", "Show all {n}", { n: rows.length })}
        </button>
      )}
    </div>
  );
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
    <div>
      <div className="search">
        <IconSearch />
        <input
          id="country-search"
          className="field"
          type="search"
          placeholder={window.t("panel.search_placeholder")}
          aria-label={window.t("panel.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div className="dd">
          {results.map(c => {
            const r = passport ? window.resolveStatus(passport, c.iso2) : { status: "na" };
            return (
              <button key={c.iso2} type="button" className="dd-item" onClick={() => { onPick(c.iso2); setSearch(""); }}>
                <span className="flag">{c.flag}</span>
                <span className="dd-grow">{window.countryName(c.iso2)}</span>
                <span className="dd-code">{statusLabel(r.status)}</span>
                <Dot s={r.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Status → stamp colour variable. "self" / "na" get neutral ink.
function stampVar(s) {
  return ["idc", "vf", "eta", "ev", "voa", "vr", "ban"].includes(s) ? `var(--${s})` : "var(--ink-3)";
}

function DetailCard({ passport, compare, iso2, onClose, direction, groupPassports, variant }) {
  const ref = useRef(null);
  // Bring the record into view when a new country is picked — it can sit
  // below the fold of the panel.
  useEffect(() => {
    if (ref.current && ref.current.scrollIntoView) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [iso2]);

  const dest = window.byIso2[iso2];
  if (!dest) return null;
  const groupActive = Array.isArray(groupPassports) && groupPassports.length > 0;
  const incoming = direction === "incoming" && !groupActive;
  // Variant only applies to outgoing single-passport mode.
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

  // Dual-citizenship "recommended passport": with two passports active
  // (compare, outgoing), lead with whichever gets the strictly better status.
  const ORDER = { self: 0, idc: 1, vf: 2, eta: 3, ev: 4, voa: 5, vr: 6, ban: 7, na: 8 };
  let recommended = null;
  if (compare && rc && !groupActive && !incoming) {
    const rScore = ORDER[r.status] ?? 5;
    const cScore = ORDER[rc.status] ?? 5;
    if (rScore !== cScore) {
      recommended = rScore < cScore
        ? { r, label: window.countryName(passport), flag: myPp?.flag }
        : { r: rc, label: window.countryName(compare), flag: window.byIso2[compare]?.flag };
    }
  }
  const continent = dest.continent
    ? (window.t("cont." + dest.continent) !== ("cont." + dest.continent) ? window.t("cont." + dest.continent) : dest.continent)
    : "—";
  const caveat = window.entryCaveat ? window.entryCaveat(iso2, r.status) : null;
  const cautions = [r.note, caveat].filter(Boolean);
  const from = incoming ? dest.flag : (groupActive ? "" : myPp?.flag);
  const to = incoming ? myPp?.flag : dest.flag;

  return (
    <article ref={ref} className="entry" aria-label={window.countryName(iso2)}>
      <div className="entry-top">
        <span className="flag entry-flag" aria-hidden="true">{dest.flag}</span>
        <div style={{ minWidth: 0 }}>
          <div className="entry-name">{window.countryName(iso2)}</div>
          <div className="entry-sub">{continent}</div>
        </div>
        <div className="entry-actions">
          <WatchToggle iso2={iso2} />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={window.t("detail.close")}><IconClose /></button>
        </div>
      </div>

      <div className="entry-verdict">
        <div className="stamp" style={{ "--st": stampVar(r.status) }}>
          <span className="stamp-k">{r.fom ? window.t("detail.fom") : statusLabel(r.status)}</span>
          {r.fom
            ? <span className="stamp-s">{window.t("detail.fom_sub")}</span>
            : (r.days ? <span className="stamp-s">{window.t("detail.up_to_days", { n: r.days })}</span> : null)}
        </div>
        {(from || to) && (
          <span className="route" aria-hidden="true">
            {from && <span className="flag">{from}</span>}
            <span>→</span>
            {to && <span className="flag">{to}</span>}
          </span>
        )}
      </div>

      {r.upgradedBy && (
        <div className="note note-info">
          <span className="note-k">{tr("detail.via_permit_title", "Unlocked by your permit")}</span>
          <span className="note-s">
            {tr("detail.via_permit_sub",
              "Easier entry thanks to your " + _permitLabel(r.upgradedBy) + " residence/visa. Without it, this country would normally be visa-required.",
              { which: _permitLabel(r.upgradedBy) })}
          </span>
        </div>
      )}

      {/* Entry-mode / temporary-policy caveats (land vs air, time-limited
          waivers), sourced from data/visa-overrides.js. */}
      {cautions.length > 0 && (
        <div className="note note-warn">
          {cautions.map((n, i) => <span key={i} className={i === 0 ? "note-k" : "note-s"} style={i === 0 ? { fontWeight: 500 } : null}>{n}</span>)}
        </div>
      )}

      <p className="entry-note">{NOTES[r.status]}</p>

      {/* Order: good news, then trip warnings (grouped), then practical info,
          then sponsored slots, then the secondary CTA. */}
      {!groupActive && <ConditionsBox passport={passport} destIso2={iso2} baseStatus={r.status} />}
      {!groupActive && <TripNotesGroup passport={passport} destIso2={iso2} />}
      {!groupActive && <VisaFeeBox passport={passport} destIso2={iso2} status={r.status} />}
      {!groupActive && <NewsBox passport={passport} destIso2={iso2} />}

      <AffiliatePartners status={r.status} iso2={iso2} />
      <AlertsCTA iso2={iso2} destName={window.countryName(iso2)} />
      <AdSlot slotKey="sidebar" />

      {rc && compare && (
        <div className="box box-dashed" style={{ marginBottom: 0 }}>
          <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("detail.compare")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="flag" style={{ fontSize: 18 }}>{window.byIso2[compare]?.flag}</span>
            <span className="stamp is-small" style={{ "--st": stampVar(rc.status) }}><span className="stamp-k">{statusLabel(rc.status)}</span></span>
            {rc.days && <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>{window.t("detail.up_to_days", { n: rc.days })}</span>}
          </div>
          {recommended && (
            <div className="entry-recommend">
              <span className="tag">{window.t("detail.recommended")}</span>
              <span className="flag">{recommended.flag}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{recommended.label}</span>
              <Dot s={recommended.r.status} />
              <span>{statusLabel(recommended.r.status)}</span>
            </div>
          )}
        </div>
      )}

      {groupRows && (
        <div className="members">
          <div className="p-hint" style={{ margin: "8px 0 2px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("detail.per_group_member")}</div>
          {groupRows.map(({ p, r: rr }) => {
            const c = window.byIso2[p];
            // The combined status uses whichever passport gives the best access (r.via).
            const isBest = r.via === p;
            return (
              <div key={p} className={"member" + (isBest ? " is-best" : "")}>
                <span className="flag">{c?.flag}</span>
                <span className="member-name">{window.countryName(p)}</span>
                {isBest && <span className="best-tag">{window.t("detail.best_passport")}</span>}
                <Dot s={rr.status} />
                <span style={{ color: "var(--ink-2)" }}>{statusLabel(rr.status)}</span>
                {rr.days && <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{rr.days}d</span>}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

// Conditional-visa box: Wikipedia's "if you also hold X" footnotes (e.g.
// Indian citizens with a valid US/UK/Schengen visa can get a Türkiye eVisa).
// Only rows whose resulting status is strictly better than the base.
function ConditionsBox({ passport, destIso2, baseStatus }) {
  if (!passport || !destIso2) return null;
  if (baseStatus === "self" || baseStatus === "vf") return null;
  const rows = window.visaCondition && window.visaCondition(passport, destIso2);
  if (!rows || rows.length === 0) return null;
  const ORDER = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6, na: 7 };
  const useful = rows.filter(r => ORDER[r.then] < ORDER[baseStatus]);
  if (useful.length === 0) return null;

  const lang = window.ATLAS_LANG || "en";
  return (
    <div className="note note-ok" style={{ display: "block" }}>
      <div className="note-k">{window.t("cond.title")}</div>
      <div className="note-s" style={{ marginBottom: 6 }}>{window.t("cond.subtitle")}</div>
      {useful.map((row, i) => {
        const labels = (window.conditionHoldsLabels && window.conditionHoldsLabels(row.ifHolds)) || row.ifHolds;
        const note = lang === "en" ? (row.noteEn || row.note) : (row.note || row.noteEn);
        return (
          <div key={i} style={{ paddingTop: i ? 8 : 2, marginTop: i ? 8 : 0, borderTop: i ? "1px solid var(--rule)" : "none" }}>
            <div className="chips" style={{ marginBottom: 6 }}>
              {labels.map((l, j) => (
                <span key={j} className="chip" style={{ cursor: "default", fontSize: 12 }}>
                  {row.ifHolds[j] === "SCHENGEN" && <span className="flag">🇪🇺</span>}{l}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: "var(--ink-3)" }}>→ {window.t("cond.becomes")}</span>
              <Dot s={row.then} />
              <strong style={{ fontWeight: 650 }}>{statusLabel(row.then)}</strong>
              {row.days && <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-3)", fontSize: 11.5 }}>{window.t("detail.up_to_days", { n: row.days })}</span>}
            </div>
            {note && <div className="note-s" style={{ marginTop: 5 }}>{note}</div>}
            {row.source && (
              <a className="link-quiet" href={row.source} target="_blank" rel="noopener nofollow" style={{ display: "inline-block", marginTop: 5 }}>
                {window.t("cond.source")}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// TripNotesGroup — bundles the per-trip rule reminders (transit visa, ETIAS,
// passport-validity rule, ESTA, Israel stamp, LOI). Pre-checks each widget's
// "would-render" condition so the heading never appears with nothing under it.
function TripNotesGroup({ passport, destIso2 }) {
  if (!passport || !destIso2) return null;

  const transitWouldRender = !!transitNoteFor(passport, destIso2);
  const estaWouldRender     = destIso2 === "US" && !!window.estaEligible;
  const etiasWouldRender    = !!(window.etiasStatus && window.etiasStatus(passport, destIso2)?.kind === "required");
  const validityWouldRender = !!(window.PASSPORT_VALIDITY && window.PASSPORT_VALIDITY[destIso2] != null);
  const israelWouldRender   = !!(window.israelStampWarning && window.israelStampWarning(destIso2));
  const loiWouldRender      = !!(window.loiRule && window.loiRule(destIso2));
  const schengenWouldRender = !!schengenHelpFor(passport, destIso2);

  const total = [transitWouldRender, estaWouldRender, etiasWouldRender,
                 validityWouldRender, israelWouldRender, loiWouldRender, schengenWouldRender]
    .filter(Boolean).length;
  if (total === 0) return null;

  return (
    <div style={{ margin: "4px 0 2px" }}>
      {total >= 2 && (
        <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("detail.trip_notes")}</div>
      )}
      {schengenWouldRender && <SchengenHelp passport={passport} destIso2={destIso2} />}
      {transitWouldRender  && <TransitVisaHint passport={passport} destIso2={destIso2} />}
      {estaWouldRender     && <EstaHint passport={passport} />}
      {etiasWouldRender    && <EtiasHint passport={passport} destIso2={destIso2} />}
      {validityWouldRender && <ValidityHint destIso2={destIso2} />}
      {israelWouldRender   && <IsraelStampHint destIso2={destIso2} />}
      {loiWouldRender      && <LoiHint destIso2={destIso2} />}
    </div>
  );
}

// Transit note about THIS destination only: if you merely connect through it,
// do you still need a transit visa (UK DATV, Schengen ATV, US C-1 …), or is
// there visa-free transit? Skipped when you can enter the country anyway —
// the old version listed every risky hub on every card ("UK · US · Canada"
// on a Germany card), which had nothing to do with the trip being viewed.
const EASY_ENTRY = new Set(["self", "idc", "vf", "eta"]);
function transitNoteFor(passport, destIso2) {
  if (!passport || !destIso2 || !window.transitStatusForGlobe) return null;
  const entry = window.resolveStatus(passport, destIso2);
  if (EASY_ENTRY.has(entry.status)) return null;
  const t = window.transitStatusForGlobe(passport, destIso2);
  if (t.status === "vr") return { tone: "note-warn", key: "detail.transit_dest_vr" };
  if (t.status === "twov" && t.twovHours) return { tone: "note-ok", key: "detail.transit_dest_twov", hours: t.twovHours };
  return null;
}

function TransitVisaHint({ passport, destIso2 }) {
  const note = transitNoteFor(passport, destIso2);
  if (!note) return null;
  const vars = { country: window.countryName(destIso2), n: note.hours };
  return (
    <a className={"note " + note.tone} href="/transit-map/">
      <span className="note-k">{tr(note.key, "", vars)}</span>
      <span className="note-s">{tr("detail.transit_dest_sub", "Airport transit rules — see the transit map.")}</span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// Schengen destinations: the 90/180-day calculator for everyone who is counted
// against it, plus the document checklist where we have one for the passport.
const SCHENGEN_CHECKLISTS = { TR: "/visa-checklist/tr-schengen/" };
function schengenHelpFor(passport, destIso2) {
  if (!passport || !destIso2 || !window.ETIAS) return null;
  if (!window.ETIAS.schengenStates.includes(destIso2)) return null;
  const r = window.resolveStatus(passport, destIso2);
  if (r.status === "self" || r.status === "idc" || r.fom) return null; // free movement: no 90/180 limit
  const checklist = r.status === "vr" ? SCHENGEN_CHECKLISTS[passport] : null;
  return { checklist };
}

function SchengenHelp({ passport, destIso2 }) {
  const help = schengenHelpFor(passport, destIso2);
  if (!help) return null;
  return (
    <div className="note note-info">
      <span className="note-k">{tr("detail.schengen_title", "Schengen area: 90 days in any 180")}</span>
      <span className="note-s">
        <a href="/schengen-calculator/">{tr("detail.schengen_calc", "Count your days")}</a>
        {help.checklist && <> · <a href={help.checklist}>{tr("detail.schengen_checklist", "Visa document checklist")}</a></>}
      </span>
    </div>
  );
}

// ESTA hint (destination = US): VWP passports can use ESTA; others need B1/B2.
function EstaHint({ passport }) {
  if (!passport || !window.estaEligible) return null;
  const eligible = window.estaEligible(passport);
  return (
    <a className={"note " + (eligible ? "note-ok" : "note-info")} href="/esta-rules/">
      <span className="note-k">{window.t(eligible ? "detail.esta_eligible" : "detail.esta_not_vwp")}</span>
      <span className="note-s">{window.t(eligible ? "detail.esta_check_disq" : "detail.esta_visa_path")}</span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// Israel-stamp warning — tone scales with the destination's refusal pattern.
function IsraelStampHint({ destIso2 }) {
  if (!destIso2 || !window.israelStampWarning) return null;
  const r = window.israelStampWarning(destIso2);
  if (!r) return null;
  const tone = r.level === "strict" ? "note-risk" : r.level === "relaxed" ? "note-warn" : "note-info";
  const label = r.level === "strict"     ? window.t("detail.israel_strict")
              : r.level === "relaxed"    ? window.t("detail.israel_relaxed")
              : window.t("detail.israel_normalized");
  return (
    <div className={"note " + tone}>
      <span className="note-k">{label}</span>
      <span className="note-s">{r.note}</span>
    </div>
  );
}

// Letter of Invitation requirement (Russia, Belarus, Turkmenistan…).
function LoiHint({ destIso2 }) {
  if (!destIso2 || !window.loiRule) return null;
  const r = window.loiRule(destIso2);
  if (!r) return null;
  return (
    <div className="note note-warn">
      <span className="note-k">{window.t("detail.loi_required")}</span>
      <span className="note-s">{r.note}</span>
      {r.typicalCost && <span className="note-fine">{window.t("detail.loi_cost", { cost: r.typicalCost })}</span>}
    </div>
  );
}

// Passport validity rule for the destination ("valid N months past your stay").
function ValidityHint({ destIso2 }) {
  if (!destIso2 || !window.passportValidityCheck) return null;
  const res = window.passportValidityCheck(destIso2, {});
  if (!res) return null;
  const sevKey = res.rule === 6 ? "validity.rule6"
              : res.rule === 3 ? "validity.rule3"
              : res.rule === 0 ? "validity.rule0"
              : null;
  if (!sevKey) return null;
  const tone = res.rule >= 6 ? "note-risk" : res.rule >= 3 ? "note-warn" : "note-ok";
  return (
    <a className={"note " + tone} href="/passport-validity/">
      <span className="note-k">{window.t(sevKey)}</span>
      <span className="note-s">{window.t("validity.check_cta")}</span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// ETIAS heads-up: passport on the ETIAS list AND destination in Schengen.
function EtiasHint({ passport, destIso2 }) {
  if (!passport || !destIso2 || !window.etiasStatus) return null;
  const res = window.etiasStatus(passport, destIso2);
  if (!res || res.kind !== "required") return null;
  const days = window.etiasDaysUntilLaunch ? window.etiasDaysUntilLaunch() : null;
  return (
    <a className="note note-info" href="/etias/">
      <span className="note-k">{days != null && days > 0 ? window.t("detail.etias_pre", { days }) : window.t("detail.etias_live")}</span>
      <span className="note-s">{window.t("detail.etias_sub")}</span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// Free-text fee fields translated via data/visa-fees-i18n.js (English fallback).
const feeLabel = (s) => (window.translateFeeText ? window.translateFeeText(s) : s);

// Visa fee + processing-time card. Only when data/visa-fees.js has the pair
// AND the status is something you apply for (ev / voa / vr / eta).
function VisaFeeBox({ passport, destIso2, status }) {
  if (!passport || !destIso2) return null;
  // No fee UI for visa-free, your own passport, or entry bans.
  if (status === "vf" || status === "self" || status === "ban") return null;
  const data = window.visaFee && window.visaFee(passport, destIso2);
  if (!data) {
    // A visa is needed but we have no sourced fee — say so, so the absence
    // doesn't read as "free".
    return <div className="box box-dashed p-fine" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{window.t("detail.no_fee_data")}</div>;
  }
  return (
    <div className="box">
      <div className="p-hint" style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("detail.visa_cost")}</div>
      <div className="fee">{feeLabel(data.fee)}</div>
      {data.processingDays && <div className="p-hint" style={{ marginTop: 4 }}>{window.t("detail.processing")}: {feeLabel(data.processingDays)}</div>}
      <dl className="kv">
        {data.type && <><dt>{window.t("detail.type")}</dt><dd>{feeLabel(data.type)}</dd></>}
        {data.validity && <><dt>{window.t("detail.validity")}</dt><dd>{feeLabel(data.validity)}</dd></>}
        {data.durationOfStay && <><dt>{window.t("detail.duration_of_stay")}</dt><dd>{feeLabel(data.durationOfStay)}</dd></>}
      </dl>
      {data.notes && <div className="note note-warn" style={{ margin: "10px 0 0", fontSize: 12.5 }}><span className="note-s" style={{ margin: 0, color: "var(--ink-2)" }}>{feeLabel(data.notes)}</span></div>}
      {data.source && (
        <a className="link-quiet" href={data.source} target="_blank" rel="noopener nofollow" style={{ display: "inline-block", marginTop: 8 }}>
          {window.t("detail.official_source")}
        </a>
      )}
      <div className="p-fine mono" style={{ marginTop: 4, fontSize: 10.5 }}>{window.t("detail.reviewed", { date: data.lastReviewed })}</div>
    </div>
  );
}

function AlertsCTA({ iso2, destName }) {
  // Nudges power users to /alerts with the current destination pre-selected.
  const href = `/alerts/?country=${encodeURIComponent(iso2)}`;
  return (
    <a className="note note-accent" href={href}>
      <span className="note-k">{window.t("detail.get_alerts_for", { name: destName })}</span>
      <span className="note-s">{window.t("detail.get_alerts_sub")}</span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// Renders an AdSense unit only when both the publisher client ID and the
// slot's numeric ID are configured in data/ads.js.
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
    } catch (e) { /* adsbygoogle.js may not be loaded yet */ }
  }, [clientId, slot]);
  if (!clientId || !slot) return null;
  return (
    <div className="ad-slot">
      <ins ref={ref}
           className="adsbygoogle"
           style={{ display: "block", minHeight: 100 }}
           data-ad-client={clientId}
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true" />
      <div className="ad-label">Ad</div>
    </div>
  );
}

function AffiliatePartners({ status, iso2 }) {
  const partners = (window.affiliatesFor && window.affiliatesFor(status, iso2)) || [];
  if (partners.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("detail.plan_your_trip")}</div>
      <div className="feed">
        {partners.map(p => (
          <a key={p.id} className="feed-item" href={p.href} target="_blank" rel="sponsored noopener noreferrer">
            <div className="feed-title">{p.label}</div>
            <div className="feed-sum">{p.blurb}</div>
          </a>
        ))}
      </div>
      <div className="ad-label" style={{ marginTop: 4 }}>{window.t("detail.sponsored")}</div>
    </div>
  );
}

// ─── News filtering helpers ───────────────────────────────────────────────
// VISA_NEWS items have affects.{passports, destinations} as ISO2 arrays.
// An EMPTY array means "we couldn't tell who it affects", NOT "everyone": an
// item only surfaces under a passport/destination that it names explicitly.
// (Treating empty as "all" put "Burundi citizens now need a transit visa to
// Belgium" under every passport.)
function namesPassport(item, passport) {
  return !!passport && (item.affects?.passports || []).includes(passport);
}
function namesDest(item, dest) {
  return !!dest && (item.affects?.destinations || []).includes(dest);
}
function sortNewsDesc(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}

const NEWS_SOURCE_LABEL = { wiki: "Wikipedia", fco: "UK FCDO" };

const SEVERITY_TONE = {
  positive: "var(--vf)",
  warning:  "var(--vr)",
  neutral:  "var(--rule-strong)",
};

function fmtDay(iso, withYear) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso || "";
  return d.toLocaleDateString(window.ATLAS_LANG || "en", withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
}

function NewsItem({ item, compact }) {
  const tone = SEVERITY_TONE[item.severity] || SEVERITY_TONE.neutral;
  const hasLink = !!item.sourceUrl;
  const Wrapper = hasLink ? "a" : "div";
  const wrapperProps = hasLink ? { href: item.sourceUrl, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Wrapper {...wrapperProps} className="feed-item" style={{ "--tone": tone }}>
      <div className="feed-meta">
        <time dateTime={item.date}>{fmtDay(item.date, true)}</time>
        <span>·</span>
        <span>{NEWS_SOURCE_LABEL[item.source] || item.source}</span>
      </div>
      <div className="feed-title">{item.title}</div>
      {!compact && item.summary && <div className="feed-sum">{item.summary}</div>}
    </Wrapper>
  );
}

// ─── Weekly digest ──────────────────────────────────────────────────────
// Counts CHANGELOG + VISA_NEWS events from the last 7 days and how many of
// them touch the current passport.
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
      if (namesPassport(n, passport)) mine++;
    }
  }
  return { total, mine };
}

function WeeklyDigest({ passport }) {
  const stats = useMemo(() => weeklyDigest(passport), [passport]);
  if (stats.total === 0) return null;
  return (
    <div className="note note-accent" style={{ marginBottom: 14 }}>
      <span className="note-k" style={{ fontWeight: 500 }}>
        {passport && stats.mine > 0
          ? window.t("digest.this_week_with_yours", { total: stats.total, mine: stats.mine })
          : window.t("digest.this_week_total", { total: stats.total })}
      </span>
    </div>
  );
}

// ─── Itinerary CTA ───────────────────────────────────────────────────────
// Empty state = soft "plan a trip" nudge; active state = summary + continue.
function readItinerary() {
  try {
    const raw = localStorage.getItem("atlas.itinerary") || sessionStorage.getItem("atlas.itinerary");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function ItineraryCTA() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Refresh on focus — the itinerary may have changed in another tab.
    const onFocus = () => setTick(x => x + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  const data = useMemo(() => readItinerary(), [tick]);
  const stops = Array.isArray(data?.stops) ? data.stops : [];
  const hasPlan = stops.length > 0;
  return (
    <a className="note note-accent" href="/itinerary/" style={{ marginBottom: 16 }}>
      <span className="note-k">{hasPlan ? window.t("itinerary.continue", { n: stops.length }) : window.t("itinerary.start")}</span>
      <span className="note-s">
        {hasPlan
          ? <span className="flag">{stops.slice(0, 6).map(s => window.byIso2[s.iso2 || s]?.flag || "").join(" ")}</span>
          : window.t("itinerary.sub")}
      </span>
      <span className="note-go" aria-hidden="true">→</span>
    </a>
  );
}

// ─── Watchlist (localStorage-backed) ─────────────────────────────────────
// Users star destinations; the panel lists them and flags any with a fresh
// changelog or visa-news hit. Stored as `atlas.watchlist` (ISO2 array).
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
    const onStorage = (e) => { if (e.key === WATCHLIST_KEY) onChange(); };
    window.addEventListener("atlas:watchlist", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("atlas:watchlist", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return list;
}

// Watchlisted ISO2s with a CHANGELOG entry or VISA_NEWS item in the last N days.
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
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
        {window.t("watchlist.heading")}
        {alerts.size > 0 && <span className="dot" style={{ "--sw": "var(--vr)" }} aria-hidden="true" />}
      </div>
      {alerts.size > 0 && (
        <div className="note note-risk" style={{ marginBottom: 6 }}>
          <span className="note-k" style={{ fontWeight: 500, fontSize: 12.5 }}>{window.t("watchlist.recent_alert", { n: alerts.size })}</span>
        </div>
      )}
      <div className="chips">
        {list.map(iso2 => {
          const c = window.byIso2[iso2];
          if (!c) return null;
          const flagged = alerts.has(iso2);
          return (
            <button key={iso2} type="button" className={"chip" + (flagged ? " is-alert" : "")} onClick={() => onOpen?.(iso2)}>
              <span className="flag">{c.flag}</span>
              <span>{window.countryName(iso2)}</span>
              {flagged && <span className="dot" style={{ "--sw": "var(--vr)" }} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Toggles the current country in/out of the watchlist (inside DetailCard).
function WatchToggle({ iso2 }) {
  const list = useWatchlist();
  const on = list.includes(iso2);
  return (
    <button
      type="button"
      className="watch-btn"
      onClick={(e) => { e.stopPropagation(); toggleWatchlist(iso2); }}
      title={window.t(on ? "watchlist.remove" : "watchlist.add")}
      aria-pressed={on}>
      <span aria-hidden="true">{on ? "★" : "☆"}</span>
      <span>{window.t(on ? "watchlist.added" : "watchlist.add_short")}</span>
    </button>
  );
}

// ─── Passport pulse ──────────────────────────────────────────────────────
// How the passport moved over the last N days (gains vs losses) plus rank
// and open total, from window.CHANGELOG.
const STATUS_RANK = { vr: 0, voa: 1, ev: 2, vf: 3, self: 3, na: 0 };

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
  if (!meta || !tally) return null;
  // Same numbers as the ledger above and the /passport/ pages.
  const totalOpen = window.mobilityScore(tally);
  const rankInfo = window.passportRank(passport);
  const rank = rankInfo && rankInfo.rank;
  const hasMovement = pulse.gains + pulse.losses > 0;
  const windowKey = days === 30 ? "daily.window_30" : "daily.window_90";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div className="p-hint" style={{ margin: 0, fontWeight: 600, color: "var(--ink-2)" }}>{window.t("pulse.heading")}</div>
        <div className="seg" role="group">
          {[30, 90].map(d => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} style={{ fontSize: 11.5, padding: "1px 7px" }}>{d}d</button>
          ))}
        </div>
      </div>
      <div className="stats3">
        <div>
          <div className="n">{rank ? "#" + rank : "—"}</div>
          <div className="l">{window.t("pulse.rank")}</div>
        </div>
        <div>
          <div className="n" style={{ color: "var(--vf)" }}>{totalOpen}</div>
          <div className="l">{window.t("pulse.open")}</div>
        </div>
        <div>
          <div className="n">
            {hasMovement ? (
              <>
                <span style={{ color: "var(--vf)" }}>+{pulse.gains}</span>
                {pulse.losses > 0 && <span style={{ color: "var(--vr)" }}> −{pulse.losses}</span>}
              </>
            ) : <span style={{ color: "var(--ink-4)" }}>—</span>}
          </div>
          <div className="l">{window.t(windowKey)}</div>
        </div>
      </div>
      {hasMovement && (
        <p className="p-hint">
          {pulse.gains > 0 && window.t("pulse.gains_msg", { n: pulse.gains })}
          {pulse.gains > 0 && pulse.losses > 0 && " · "}
          {pulse.losses > 0 && window.t("pulse.losses_msg", { n: pulse.losses })}
        </p>
      )}
    </div>
  );
}

// Only changes we can tie to THIS passport: verified day-over-day status diffs
// from CHANGELOG (the dataset itself changed) plus news items that name the
// passport explicitly.
const FEED_DAYS = 90;
function passportFeed(passport) {
  if (!passport) return [];
  const cutoff = Date.now() - FEED_DAYS * 86400_000;
  const recent = (d) => new Date(d + "T00:00:00").getTime() >= cutoff;
  const changes = (window.CHANGELOG || [])
    .filter(c => recent(c.date) && c.affects?.passports?.includes(passport))
    .map((c, i) => ({ kind: "change", key: "c" + i, date: c.date, entry: c }));
  const news = (window.VISA_NEWS || [])
    .filter(n => recent(n.date) && namesPassport(n, passport))
    .map(n => ({ kind: "news", key: n.id, date: n.date, item: n }));
  return [...changes, ...news].sort(sortNewsDesc);
}

function PassportNewsFeed({ passport }) {
  const [expanded, setExpanded] = useState(false);
  const list = useMemo(() => passportFeed(passport), [passport]);
  if (list.length === 0) return null;
  const items = expanded ? list : list.slice(0, 3);
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("news.for_passport", { name: window.countryName(passport) })}</div>
      <div className="feed">
        {items.map(it => it.kind === "change"
          ? <ChangelogItem key={it.key} entry={it.entry} />
          : <NewsItem key={it.key} item={it.item} />)}
      </div>
      {list.length > 3 && (
        <button type="button" className="more-btn" onClick={() => setExpanded(!expanded)}>
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
      // Destination named explicitly; passport either named or unscoped
      // (a destination-wide rule change applies to whoever is going there).
      .filter(it => namesDest(it, destIso2)
        && (!passport || (it.affects?.passports || []).length === 0 || namesPassport(it, passport)))
      .sort(sortNewsDesc)
      .slice(0, 2);
  }, [passport, destIso2]);
  if (list.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="p-hint" style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink-2)" }}>{window.t("news.recent_for_dest")}</div>
      <div className="feed">
        {list.map(it => <NewsItem key={it.id} item={it} compact />)}
      </div>
    </div>
  );
}

// Floating, collapsible "Recently changed" feed over the globe (top-left), so
// the panel stays short. Collapsed by default so it never covers the globe.
function ChangelogFloater() {
  const [open, setOpen] = useState(false);
  useLangTick();
  const count = (window.CHANGELOG || []).length;
  if (count === 0) return null;
  return (
    <div className="floater">
      <button type="button" className="floater-btn overlay-card" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="live-dot" aria-hidden="true" />
        <span>{window.t("panel.recently_changed")}</span>
        <span className="count">{count}</span>
        <IconCaret />
      </button>
      {open && (
        <div className="floater-body overlay-card">
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
      {!embedded && <Caption>{window.t("panel.recently_changed")}</Caption>}
      <div className="feed">
        {items.length === 0 ? (
          <div className="box box-dashed p-hint" style={{ margin: 0 }}>
            {window.t("panel.no_changes")}<br />
            <span className="p-fine">{window.t("panel.no_changes_sub")}</span>
          </div>
        ) : (
          items.map((c, i) => <ChangelogItem key={i} entry={c} />)
        )}
      </div>
      {window.CHANGELOG.length > 4 && (
        <button type="button" className="more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? window.t("changelog.show_less") : window.t("changelog.more", { n: window.CHANGELOG.length - 4 })}
        </button>
      )}
    </div>
  );
}

// "X happened" sentence for a changelog entry — raw status codes become
// plain language so non-experts can read the feed.
function describeStatusChange(from, to) {
  if (from === to) return window.t("change.rules_updated");
  const key = `change.${from}_to_${to}`;
  const specific = window.t(key);
  if (specific && specific !== key) return specific;
  return window.t(`change.now_${to}`) || window.t("change.rules_updated");
}

function ChangelogItem({ entry }) {
  const passportIso = entry.affects.passports?.[0];
  const passport = passportIso ? window.byIso2[passportIso] : null;
  const dest = window.byIso2[entry.affects.dest];
  return (
    <div className="feed-item" style={{ "--tone": `var(--${entry.statusTo}, var(--rule-strong))` }}>
      <div className="feed-meta">
        <time dateTime={entry.date}>{fmtDay(entry.date)}</time>
        <span>·</span>
        {passport && <><span className="flag">{passport.flag}</span><span>{window.countryName(passportIso)}</span></>}
        <span>→</span>
        {dest && <><span className="flag">{dest.flag}</span><span>{window.countryName(entry.affects.dest)}</span></>}
      </div>
      <div className="feed-title" style={{ fontWeight: 500 }}>{describeStatusChange(entry.statusFrom, entry.statusTo)}</div>
      <div style={{ marginTop: 6 }}>
        <span className="stamp is-small" style={{ "--st": stampVar(entry.statusTo) }}><span className="stamp-k">{statusLabel(entry.statusTo)}</span></span>
      </div>
    </div>
  );
}

function PanelFooter() {
  return (
    <footer className="panel-foot">
      <div>{window.t("footer.refresh")}</div>
      <nav aria-label="Footer">
        <a href="/alerts/">{window.t("footer.alerts")}</a>
        <a href="/schengen-calculator/">{window.t("footer.schengen")}</a>
        <a href="/itinerary/">{window.t("footer.itinerary")}</a>
        <a href="/transit-map/">{window.t("nav.transit_map")}</a>
        <a href="/etias/">{window.t("footer.etias")}</a>
        <a href="/passport-validity/">{window.t("footer.validity")}</a>
        <a href="/visa-shortcuts/">{window.t("footer.shortcuts")}</a>
        <a href="/digital-nomad-visa/">{window.t("footer.nomad")}</a>
        <a href="/citizenship-by-investment/">{window.t("footer.cbi")}</a>
        <a href="/guides/">{tr("nav.guides", "Guides")}</a>
        <a href="/about/">{window.t("footer.about")}</a>
        <a href="/privacy/">{window.t("footer.privacy")}</a>
        <a href="/passport/">{window.t("footer.all_passports")}</a>
        <a href="https://github.com/Uygara/atlas-visa-globe" target="_blank" rel="noopener">{window.t("footer.source")}</a>
      </nav>
      <div className="byline">© {new Date().getFullYear()} travelnow.info · Uygar Atalay</div>
    </footer>
  );
}

Object.assign(window, { Panel });

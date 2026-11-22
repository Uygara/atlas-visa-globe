// Itinerary planner: full single-page app (globe-left, panel-right), the same shell as the
// home + transit maps. Saved trips live in localStorage "atlas.trips" (shape, limits and
// cleaning in assets/trips-core.js); the active trip is mirrored to the old "atlas.itinerary"
// key for the notification jobs. Passports come from atlas.passport / atlas.passports (set in
// /panel/). Every visa fact shown here is read from the repo's data files and carries its
// source and date; where a value is missing the planner says so and never fills the gap.
// Names that start with "pl" or "Pl" belong to this file (all compiled JSX shares one scope).

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const pt = (key, vars) => window.t("itin." + key, vars);

// ─── Reading what the person keeps in this browser ───────────────────────
function plReadPassports() {
  let main = "";
  try {
    main = localStorage.getItem("atlas.passport") || "";
    try { const j = JSON.parse(main); if (typeof j === "string") main = j; } catch (e) {}
  } catch (e) {}
  main = String(main).toUpperCase();
  if (!window.PASSPORTS[main]) main = "";
  let extra = [];
  try { const a = JSON.parse(localStorage.getItem("atlas.passports") || "[]"); if (Array.isArray(a)) extra = a.map(x => String(x).toUpperCase()); } catch (e) {}
  const out = main ? [main] : [];
  extra.forEach(x => { if (window.PASSPORTS[x] && !out.includes(x)) out.push(x); });
  return out.slice(0, 3);
}
function plReadList(key) {
  try {
    const a = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(a) ? a.map(x => String(x).toUpperCase()).filter(x => window.byIso2[x]) : [];
  } catch (e) { return []; }
}
function plReadExpiry() {
  try { const v = localStorage.getItem("atlas.passport.expiry") || ""; return /^\d{4}-\d{2}$/.test(v) ? v : ""; } catch (e) { return ""; }
}
function plReadSchengenPast() {
  try {
    const a = JSON.parse(localStorage.getItem("atlas.schengen.trips") || "[]");
    return Array.isArray(a) ? a.filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.entry) && /^\d{4}-\d{2}-\d{2}$/.test(x.exit)).map(x => ({ entry: x.entry, exit: x.exit })) : [];
  } catch (e) { return []; }
}

// A trip from a share URL (?p=TR&stops=JP,KR&d=2026-12-01), or null.
function plFromUrl() {
  try {
    const q = new URLSearchParams(location.search);
    const stops = (q.get("stops") || "").split(",").map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s));
    const p = (q.get("p") || "").toUpperCase();
    const d = q.get("d") || "";
    if (!stops.length) return { passport: window.PASSPORTS[p] ? p : "", trip: null };
    const t = window.TRIPS_CORE.cleanTrip({ stops });
    if (t.stops.length && /^\d{4}-\d{2}-\d{2}$/.test(d)) t.stops[0].arrive = d;
    return { passport: window.PASSPORTS[p] ? p : "", trip: t.stops.length ? t : null };
  } catch (e) { return { passport: "", trip: null }; }
}

function plPersist(state, passport) {
  try {
    const o = window.TRIPS_CORE.serialize(state, passport);
    localStorage.setItem("atlas.trips", o.trips);
    if (o.itinerary) localStorage.setItem("atlas.itinerary", o.itinerary);
  } catch (e) {}
}

function plLoadState() {
  let raw = ["", ""];
  try { raw = [localStorage.getItem("atlas.trips"), localStorage.getItem("atlas.itinerary") || sessionStorage.getItem("atlas.itinerary")]; } catch (e) {}
  let state = window.TRIPS_CORE.load(raw[0], raw[1]);
  const migrated = !raw[0] && state.trips.length > 0;
  const url = plFromUrl();
  let importedPassport = "";
  if (url.passport) importedPassport = url.passport;
  if (url.trip) {
    const key = (t) => t.stops.map(s => s.iso).join(",");
    const same = state.trips.find(t => key(t) === key(url.trip));
    if (same) {
      state = { ...state, active: same.id };
      if (url.trip.stops[0].arrive && !same.stops[0].arrive) same.stops[0].arrive = url.trip.stops[0].arrive;
    } else if (state.trips.length < window.TRIPS_CORE.LIMITS.trips) {
      state = { ...state, trips: [...state.trips, url.trip], active: url.trip.id };
    } else {
      state = { ...state, trips: [...state.trips.slice(0, -1), url.trip], active: url.trip.id };
    }
    return { state, importedPassport, dirty: true };
  }
  return { state, importedPassport, dirty: migrated };
}

function readView() {
  try { return sessionStorage.getItem("atlas.globeStyle") || "globe3d"; } catch (e) { return "globe3d"; }
}

// ─── Fee / processing helpers (ported from the old planner) ────────────────
// Free-text fee fields, translated via data/visa-fees-i18n.js.
const itinFeeLabel = (s) => (window.translateFeeText ? window.translateFeeText(s) : s);
function procDays(p, iso) {
  const fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.processingDays) return 0;
  const m = fee.processingDays.match(/(\d+)\s*(?:–|-|to)\s*(\d+)\s*(week|day|month)/i)
         || fee.processingDays.match(/(\d+)\s*(week|day|month)/i);
  if (!m) return 0;
  const n = parseInt(m[m.length - 2] || m[1], 10);
  const unit = m[m.length - 1].toLowerCase();
  return unit.startsWith("week") ? n * 7 : (unit.startsWith("month") ? n * 30 : n);
}
function feeUSD(p, iso) {
  const fee = window.visaFee && window.visaFee(p, iso);
  if (!fee || !fee.fee) return null;
  const m = String(fee.fee).match(/\$([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ""));
  return v > 0 ? v : null;
}
function fmtDate(d) {
  return d.toLocaleDateString(window.ATLAS_LANG || undefined,
    { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
function plFmtISO(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00Z");
  return isNaN(d) ? s : d.toLocaleDateString(window.ATLAS_LANG || undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
function plDiff(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
function plPrefix() { return window.ATLAS_LANG === "tr" ? "/tr" : ""; }

// ─── Which passport gets the person in most easily ───────────────────────
const PL_ORDER = ["self", "idc", "vf", "eta", "ev", "voa", "vr", "ban"];
function plRank(s) { const i = PL_ORDER.indexOf(s); return i < 0 ? 99 : i; }
function plBest(pps, iso) {
  let best = null;
  for (const p of pps) {
    if (p === iso) return { p, r: { status: "self", days: null } };
    const r = window.resolveStatus(p, iso);
    if (!best || plRank(r.status) < plRank(best.r.status)) best = { p, r };
  }
  return best;
}
const plNeedsApp = (s) => s === "eta" || s === "ev" || s === "voa" || s === "vr";

function plAdvisory(iso) {
  const A = window.TRAVEL_ADVISORIES;
  return A && A.countries && A.countries[iso] ? A.countries[iso] : null;
}

// Connection check for a stop's connecting airport: the easiest result across the person's passports.
function plTransit(pps, code) {
  const c = String(code || "").toUpperCase();
  if (!c) return null;
  const ap = (window.AIRPORTS || {})[c];
  if (!ap) return { code: c, unknown: true, loaded: !!window.AIRPORTS };
  if (!window.transitLeg) return { code: c, unknown: true, loaded: true };
  const rk = { self: -1, free: 0, twov: 1, vr: 2 };
  let best = null;
  for (const p of pps) {
    const leg = window.transitLeg(p, null, c, null);
    if (!leg || leg.error) continue;
    const k = rk[leg.status.status] != null ? rk[leg.status.status] : 3;
    if (!best || k < best.k) best = { p, leg, k };
  }
  return best ? { code: c, city: ap[1], iso: ap[0], p: best.p, leg: best.leg } : { code: c, city: ap[1], iso: ap[0], none: true };
}

// Apply-by dates for every stop that needs an application. Lead time = the country's processing
// time + a week's margin. `late` are the stops whose apply-by date is already behind us.
function plApplyPlan(entries, firstArrive) {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const items = [];
  let anyDate = false;
  entries.forEach(e => {
    if (!e.best || !plNeedsApp(e.best.r.status)) return;
    const arrive = e.stop.arrive || firstArrive;
    if (!arrive) return;
    anyDate = true;
    const dep = new Date(arrive + "T00:00:00Z");
    if (isNaN(dep) || dep < today) return;
    const proc = procDays(e.best.p, e.stop.iso) || 14;
    const lead = proc + 7;
    const applyBy = new Date(dep.getTime() - lead * 86400000);
    items.push({ iso: e.stop.iso, status: e.best.r.status, arrive, applyBy, lead, proc, overdue: applyBy < today });
  });
  items.sort((a, b) => a.applyBy - b.applyBy);
  if (!anyDate) return null;
  const earliest = items.length ? items[0].applyBy : null;
  return {
    today, items, late: items.filter(i => i.overdue), earliest,
    earliestDays: earliest ? Math.ceil((earliest - today) / 86400000) : null,
  };
}

// ─── Partner slot (stage 8): renders nothing unless data/affiliates.js has a url for this kind ──
function PartnerSlot({ kind, status, dest }) {
  const list = (window.affiliatesFor && window.affiliatesFor(status || "*", dest || "")) || [];
  const mine = list.filter(a => Array.isArray(a.kinds) && a.kinds.includes(kind) && a.href);
  if (!mine.length) return null;
  return (
    <div className="pl-partner">
      {mine.map(a => (
        <a key={a.id} className="pl-partner-link" href={a.href} target="_blank" rel="sponsored noopener">
          <span className="pl-sponsored">{pt("sponsored")}</span>
          <span className="pl-partner-label">{a.label}</span>
          <span className="pl-partner-blurb">{a.blurb}</span>
        </a>
      ))}
    </div>
  );
}

function PlSrc({ url, label }) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return <a className="link-quiet" href={url} target="_blank" rel="noopener nofollow">{label || pt("source")}</a>;
  return <span className="p-fine">{pt("source_is", { s: url })}</span>;
}
function PlRow({ k, children }) {
  return <div className="pl-row"><span className="pl-k">{k}</span><span className="pl-v">{children}</span></div>;
}
const plNoData = () => <span className="pl-nodata">{pt("no_data")}</span>;

// ─── Checklist items for one stop, built only from data we hold ─────────────
function plChecklist(e, ctx) {
  const { iso } = e.stop;
  if (!e.best || e.best.r.status === "self") return [];
  const out = [];
  const st = e.best.r.status;

  // Passport validity
  const rule = window.PASSPORT_VALIDITY ? window.PASSPORT_VALIDITY[iso] : undefined;
  let pv;
  if (typeof rule !== "number") pv = pt("ck_pv_nodata");
  else {
    const ruleText = rule === 6 ? window.t("validity.rule6") : rule === 3 ? window.t("validity.rule3") : rule === 0 ? window.t("validity.rule0") : pt("ck_pv_n", { n: rule });
    const chk = ctx.expiry && e.stop.leave && window.passportValidityCheck ? window.passportValidityCheck(iso, { expiry: ctx.expiry + "-01", exit: e.stop.leave }) : null;
    if (chk && chk.ok != null) pv = ruleText + ". " + (chk.ok ? pt("ck_pv_ok") : pt("ck_pv_short")) + " " + pt("ck_airline");
    else pv = ruleText + ". " + pt("ck_airline");
  }
  out.push({ key: iso + ":passport", text: pt("ck_passport"), detail: pv, href: "/passport-validity/" });

  // Visa / eVisa / ETA action with apply-by date
  if (plNeedsApp(st)) {
    const it = ctx.plan && ctx.plan.items.find(i => i.iso === iso);
    const text = st === "ev" ? pt("ck_evisa") : st === "eta" ? pt("ck_eta") : st === "voa" ? pt("ck_voa") : pt("ck_visa");
    let detail = "";
    if (st !== "voa") detail = it ? pt("ck_apply_by", { date: plFmtISO(it.applyBy.toISOString().slice(0, 10)), n: it.proc }) : pt("ck_add_date");
    out.push({ key: iso + ":visa", text, detail });
  }
  // ETIAS / ESTA
  const et = window.etiasStatus ? window.etiasStatus(e.best.p, iso) : null;
  if (et && et.kind === "required") out.push({ key: iso + ":etias", text: pt("ck_etias"), detail: pt("ck_etias_d"), href: window.ETIAS && window.ETIAS.applicationUrl });
  if (iso === "US" && window.estaEligible && window.estaEligible(e.best.p) && (st === "eta" || st === "ev")) out.push({ key: iso + ":esta", text: pt("ck_esta"), detail: pt("ck_esta_d"), href: window.ESTA && window.ESTA.source });

  out.push({ key: iso + ":insurance", text: pt("ck_insurance"), partner: "insurance" });
  out.push({ key: iso + ":flight", text: pt("ck_flight"), partner: "flights" });
  out.push({ key: iso + ":stay", text: pt("ck_stay"), partner: "hotels" });

  if (e.stop.via && e.transit && e.transit.leg && (e.transit.leg.status.status === "vr" || e.transit.leg.status.status === "twov") && !e.transit.leg.status.generic) {
    out.push({ key: iso + ":transit", text: pt("ck_transit", { code: e.stop.via }), detail: e.transit.leg.status.status === "vr" ? pt("tr_vr") : pt("tr_twov", { h: e.transit.leg.status.twovHours || "" }) });
  }
  out.push({ key: iso + ":docs", text: pt("ck_docs"), detail: pt("ck_docs_d") });
  const adv = plAdvisory(iso);
  if (adv && adv.level >= 3) out.push({ key: iso + ":advisory", text: pt("ck_advisory", { n: adv.level }), detail: pt("ck_advisory_d") });
  return out;
}

// ─── Lazy script loader (airports for city suggestions and transit, advisories for safety) ──
const plLoading = {};
function plLoad(src, done) {
  if (plLoading[src]) { if (plLoading[src] === "ok") done(); else plLoading[src].push(done); return; }
  plLoading[src] = [done];
  const s = document.createElement("script");
  s.src = src; s.async = true;
  s.onload = () => { const q = plLoading[src]; plLoading[src] = "ok"; q.forEach(f => f()); };
  s.onerror = () => { delete plLoading[src]; };
  document.head.appendChild(s);
}
const PL_STAMP = "?v=20261120d";
const plLoadAirports = (cb) => { if (window.AIRPORTS) cb(); else plLoad("/data/airports.js" + PL_STAMP, cb); };
const plLoadAdvisories = (cb) => { if (window.TRAVEL_ADVISORIES) cb(); else plLoad("/data/travel-advisories.js" + PL_STAMP, cb); };

function plEnsure(s) {
  if (s.trips.length) return s;
  const t = window.TRIPS_CORE.cleanTrip({});
  return { ...s, trips: [t], active: t.id };
}

// ─── Root ───────────────────────────────────────────────────────────────
function ItineraryApp() {
  const [boot] = useState(plLoadState);
  const [state, setState] = useState(boot.state);
  const stateRef = useRef(boot.state);
  const [pps, setPps] = useState(() => {
    if (boot.importedPassport) { try { localStorage.setItem("atlas.passport", boot.importedPassport); } catch (e) {} }
    return plReadPassports();
  });
  const [expiry, setExpiryState] = useState(plReadExpiry);
  const [watch, setWatch] = useState(() => plReadList("atlas.watchlist"));
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick(x => x + 1), []);
  const [mode, setModeState] = useState(readView);
  const [theme, setTheme] = useSiteTheme();
  useLangTick();

  const setMode = (v) => {
    setModeState(v);
    try { sessionStorage.setItem("atlas.globeStyle", v); } catch (e) {}
  };

  useEffect(() => { const el = document.getElementById("loading"); if (el) el.classList.add("hidden"); }, []);
  // Write once if the trip came from the old single-trip key or from a share link.
  useEffect(() => { if (boot.dirty) plPersist(stateRef.current, plReadPassports()[0] || ""); }, []);
  // Advisories are large (about 400 kB): fetched after the first paint.
  useEffect(() => { const id = setTimeout(() => plLoadAdvisories(bump), 400); return () => clearTimeout(id); }, []);
  // Other tabs, or the account sync, may change what we read.
  useEffect(() => {
    const reload = () => {
      try {
        const s = window.TRIPS_CORE.load(localStorage.getItem("atlas.trips"), localStorage.getItem("atlas.itinerary"));
        stateRef.current = s; setState(s);
      } catch (e) {}
      setPps(plReadPassports()); setExpiryState(plReadExpiry()); setWatch(plReadList("atlas.watchlist"));
    };
    const onStorage = (e) => { if (!e.key || /^atlas\.(trips|itinerary|passport|passports|passport\.expiry|watchlist)$/.test(e.key)) reload(); };
    const onWatch = () => setWatch(plReadList("atlas.watchlist"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("atlas:watchlist", onWatch);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("atlas:watchlist", onWatch); };
  }, []);

  const update = useCallback((fn) => {
    const next = fn(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next; setState(next);
    plPersist(next, plReadPassports()[0] || "");
  }, []);
  const updTrip = useCallback((fn) => update(s0 => {
    const s = plEnsure(s0);
    return { ...s, trips: s.trips.map(t => t.id === s.active ? { ...fn(t), updated: Date.now() } : t) };
  }), [update]);

  const trip = state.trips.find(t => t.id === state.active) || null;
  const stops = trip ? trip.stops : [];
  const LIM = window.TRIPS_CORE.LIMITS;

  const addStop = useCallback((iso) => updTrip(t => t.stops.length >= LIM.stops || t.stops.some(s => s.iso === iso) ? t : { ...t, stops: [...t.stops, { iso, arrive: "", leave: "", via: "" }] }), [updTrip]);
  const removeStop = useCallback((i) => updTrip(t => ({ ...t, stops: t.stops.filter((_, j) => j !== i) })), [updTrip]);
  const toggleStop = useCallback((iso) => updTrip(t => t.stops.some(s => s.iso === iso)
    ? { ...t, stops: t.stops.filter(s => s.iso !== iso) }
    : (t.stops.length >= LIM.stops ? t : { ...t, stops: [...t.stops, { iso, arrive: "", leave: "", via: "" }] })), [updTrip]);
  const patchStop = useCallback((i, patch) => updTrip(t => ({ ...t, stops: t.stops.map((s, j) => j === i ? { ...s, ...patch } : s) })), [updTrip]);
  const moveStop = useCallback((i, to) => updTrip(t => ({ ...t, stops: window.TRIPS_CORE.move(t.stops, i, to) })), [updTrip]);
  const toggleDone = useCallback((key) => updTrip(t => {
    const done = { ...t.done };
    if (done[key]) delete done[key]; else done[key] = 1;
    return { ...t, done };
  }), [updTrip]);

  const setMainPassport = useCallback((iso) => {
    try { localStorage.setItem("atlas.passport", iso); } catch (e) {}
    setPps(plReadPassports());
    if (stateRef.current.trips.length) plPersist(stateRef.current, iso);
  }, []);
  const setExpiry = (v) => {
    setExpiryState(v);
    try { if (v) localStorage.setItem("atlas.passport.expiry", v); else localStorage.removeItem("atlas.passport.expiry"); } catch (e) {}
  };

  // Globe click: set passport if none; otherwise toggle the stop.
  const onCountryClick = useCallback((iso) => {
    if (!window.PASSPORTS[iso] && !window.byIso2[iso]) return;
    if (!pps.length) { if (window.PASSPORTS[iso]) setMainPassport(iso); return; }
    if (pps.includes(iso)) return;
    toggleStop(iso);
  }, [pps, toggleStop, setMainPassport]);

  const from = trip && trip.from.country ? trip.from.country : (pps[0] || "");
  const sequence = from ? [from, ...stops.map(s => s.iso)] : stops.map(s => s.iso);
  const arcs = [];
  for (let i = 0; i < sequence.length - 1; i++) arcs.push({ from: sequence[i], to: sequence[i + 1] });
  const stopMarkers = stops.map((s, i) => ({ iso2: s.iso, label: i + 1 }));
  const stopIsos = stops.map(s => s.iso).join(",");

  const fillResolver = useCallback((iso2) => {
    if (pps.includes(iso2)) return { color: "var(--self)" };
    if (stopIsos.split(",").includes(iso2)) {
      const b = plBest(pps, iso2);
      const st = b ? b.r.status : "na";
      if (st === "ban") return { color: "url(#hatch-ban)" };
      return { color: STATUS_HEX[st] || STATUS_HEX.na };
    }
    return { color: "var(--land)" };
  }, [pps, stopIsos]);

  const hoverRenderer = useCallback((hover) => {
    const dest = window.byIso2[hover.iso2];
    if (!dest) return null;
    const isStop = stopIsos.split(",").includes(hover.iso2);
    const isSelf = pps.includes(hover.iso2);
    const b = isStop && pps.length ? plBest(pps, hover.iso2) : null;
    return (
      <div className="hovercard overlay-card" style={{ left: hover.x + 16, top: hover.y + 16, minWidth: 150 }}>
        <div className="hovercard-title"><span className="flag">{dest.flag}</span><span>{window.countryName(hover.iso2)}</span></div>
        {isSelf && <div className="hovercard-row hovercard-cap">{pt("your_passport")}</div>}
        {b && <div className="hovercard-row"><Dot s={b.r.status} /><span>{statusLabel(b.r.status)}</span></div>}
        {!isSelf && !isStop && <div className="hovercard-row hovercard-cap">+ {pt("add_destination")}</div>}
      </div>
    );
  }, [pps, stopIsos]);

  // Per stop: the easiest passport, the connection check, the checklist inputs.
  const entries = stops.map((stop, i) => ({
    stop, i, best: pps.length ? plBest(pps, stop.iso) : null,
    transit: stop.via ? plTransit(pps, stop.via) : null,
  }));
  const firstArrive = (stops.find(s => s.arrive) || {}).arrive || "";
  const plan = pps.length ? plApplyPlan(entries, stops[0] && stops[0].arrive ? stops[0].arrive : firstArrive) : null;
  const ctx = { expiry, plan };
  const lists = entries.map(e => plChecklist(e, ctx));
  const done = trip ? trip.done : {};

  // City suggestions and connection checks need the airport list: load it when a stop uses a connection.
  const needAirports = stops.some(s => s.via);
  useEffect(() => { if (needAirports) plLoadAirports(bump); }, [needAirports]);

  return (
    <div className="layout">
      <Masthead theme={theme} onTheme={setTheme} />
      <div className="globe-stage">
        <Globe
          passport={pps[0] || null}
          mode={mode}
          onView={setMode}
          fillResolver={fillResolver}
          hoverRenderer={hoverRenderer}
          arcs={arcs}
          stopMarkers={stopMarkers}
          onCountryClick={onCountryClick}
        />
        {sequence.length === 0 && (
          <div className="welcome">
            <div className="welcome-card overlay-card" style={{ width: "min(320px, 100%)" }}>
              <p className="welcome-body" style={{ margin: 0 }}>{pt("subtitle")}</p>
            </div>
          </div>
        )}
      </div>
      <aside className="panel">
        <MobileSheetHandle />
        <header className="p-head" style={{ display: "block" }}>
          <div className="p-head-title">{pt("title")}</div>
          <p className="p-head-sub">{pt("subtitle")}</p>
        </header>
        <PlPassports pps={pps} onPick={setMainPassport} />
        {pps.length > 0 && (
          <PlTrip state={state} trip={trip} update={update} updTrip={updTrip} expiry={expiry} setExpiry={setExpiry} bump={bump} />
        )}
        {pps.length > 0 && (
          <PlStops stops={stops} entries={entries} pps={pps} watch={watch} onAdd={addStop} onRemove={removeStop}
                   onPatch={patchStop} onMove={moveStop} />
        )}
        {pps.length > 0 && stops.length > 0 && <PlRules entries={entries} pps={pps} />}
        {pps.length > 0 && stops.length > 0 && <PlSchengen entries={entries} />}
        {pps.length > 0 && stops.length > 0 && <PlChecklist entries={entries} lists={lists} done={done} onToggle={toggleDone} />}
        {pps.length > 0 && stops.length > 0 && (
          <PlSummary trip={trip} entries={entries} lists={lists} done={done} plan={plan} pps={pps} from={from} />
        )}
        <PlSignIn />
        <footer className="panel-foot">{window.t("tmap.disclaimer")}</footer>
      </aside>
    </div>
  );
}

// ─── Compact searchable picker ─────────────────────────────────────────────
function CountryPicker({ value, placeholder, exclude, onPick, isPassport }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const ex = exclude || new Set();
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return window.PASSPORT_LIST.filter(p => !ex.has(p.iso2))
      .filter(p => !ql || p.name.toLowerCase().includes(ql) || window.countryName(p.iso2).toLowerCase().includes(ql) || p.iso2.toLowerCase().includes(ql))
      .slice(0, 80);
  }, [q, exclude]);
  const c = value ? window.byIso2[value] : null;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {isPassport ? (
        <button type="button" className="pp-card" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          {c ? (
            <span className="pp-main">
              <span className="flag pp-flag" aria-hidden="true">{c.flag}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="pp-name" style={{ display: "block" }}>{window.countryName(value)}</span>
              </span>
              <IconCaret />
            </span>
          ) : <span className="pp-main"><span className="pp-empty" style={{ flex: 1 }}>{placeholder}</span><IconCaret /></span>}
        </button>
      ) : (
        <button type="button" className="row-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <span className="row-btn-label">{placeholder}</span>
          <IconCaret className={open ? "is-flipped" : ""} />
        </button>
      )}
      {open && (
        <div className="dd" style={{ position: "absolute", left: 0, right: 0, zIndex: 20 }}>
          <input autoFocus className="field dd-search" placeholder={window.t("itin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="dd-list">
            {list.map(p => (
              <button key={p.iso2} type="button" className="dd-item" onClick={() => { onPick(p.iso2); setOpen(false); setQ(""); }}>
                <span className="flag">{window.byIso2[p.iso2]?.flag}</span>
                <span className="dd-grow">{window.countryName(p.iso2)}</span>
                <span className="dd-code">{p.iso2}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 1. Passports in use ───────────────────────────────────────────────────
function PlPassports({ pps, onPick }) {
  return (
    <section className="p-sec">
      <Caption>{pt("your_passport")}</Caption>
      <CountryPicker value={pps[0] || null} placeholder={window.t("picker.select_passport")} onPick={onPick} isPassport />
      {pps.length > 1 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {pps.slice(1).map(p => <span key={p} className="chip" style={{ cursor: "default" }}><span className="flag">{window.byIso2[p] && window.byIso2[p].flag}</span>{window.countryName(p)}</span>)}
        </div>
      )}
      <p className="p-hint">
        {pps.length > 1 ? pt("pp_many") : pt("pp_one")}{" "}
        <a className="link-quiet" href={plPrefix() + "/panel/"}>{pt("pp_manage")}</a>
      </p>
    </section>
  );
}

// ─── 2. Trip: switcher, name, departure, passport expiry ────────────────────
function PlTrip({ state, trip, update, updTrip, expiry, setExpiry, bump }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const LIM = window.TRIPS_CORE.LIMITS;
  const label = (t, i) => t.name || pt("trip_n", { n: i + 1 });
  const newTrip = () => update(s => {
    if (s.trips.length >= LIM.trips) return s;
    const t = window.TRIPS_CORE.cleanTrip({});
    return { ...s, trips: [...s.trips, t], active: t.id };
  });
  const delTrip = () => {
    setConfirmDel(false);
    update(s => {
      const trips = s.trips.filter(t => t.id !== s.active);
      return { ...s, trips, active: trips[0] ? trips[0].id : "" };
    });
  };
  const from = trip ? trip.from : { country: "", city: "" };
  const setFrom = (patch) => updTrip(t => ({ ...t, from: { ...t.from, ...patch } }));
  const cities = useMemo(() => {
    const A = window.AIRPORTS;
    if (!A || !from.country) return [];
    const seen = {};
    Object.keys(A).forEach(k => { if (A[k][0] === from.country) seen[A[k][1]] = 1; });
    return Object.keys(seen).sort().slice(0, 80);
  }, [from.country, window.AIRPORTS]);
  const fc = from.country ? window.byIso2[from.country] : null;
  return (
    <section className="p-sec">
      <Caption aside={state.trips.length ? <span className="mono">{state.trips.length}/{LIM.trips}</span> : null}>{pt("s_trip")}</Caption>
      {state.trips.length > 0 && (
        <div className="pl-line">
          <select className="field pl-grow" aria-label={pt("trip_switch")} value={state.active}
                  onChange={(e) => { const id = e.target.value; setConfirmDel(false); update(s => ({ ...s, active: id })); }}>
            {state.trips.map((t, i) => <option key={t.id} value={t.id}>{label(t, i)}</option>)}
          </select>
          <button type="button" className="btn pl-btn" onClick={newTrip} disabled={state.trips.length >= LIM.trips}>{pt("trip_new")}</button>
        </div>
      )}
      {state.trips.length >= LIM.trips && <p className="p-hint">{pt("trip_max", { n: LIM.trips })}</p>}
      <label className="pl-label" htmlFor="pl-name">{pt("trip_name")}</label>
      <input id="pl-name" className="field" maxLength={LIM.name} value={trip ? trip.name : ""} placeholder={pt("trip_name_ph")}
             onChange={(e) => updTrip(t => ({ ...t, name: e.target.value }))} />
      {trip && state.trips.length > 0 && (
        confirmDel ? (
          <div className="note note-risk pl-confirm" role="alert">
            <div className="note-k">{pt("trip_del_q")}</div>
            <div className="pl-line" style={{ marginTop: 8 }}>
              <button type="button" className="btn pl-btn" onClick={delTrip}>{pt("trip_del_yes")}</button>
              <button type="button" className="btn btn-quiet pl-btn" onClick={() => setConfirmDel(false)}>{pt("trip_del_no")}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-quiet pl-btn" style={{ marginTop: 8 }} onClick={() => setConfirmDel(true)}>{pt("trip_del")}</button>
        )
      )}

      <div className="pl-label" style={{ marginTop: 14 }}>{pt("depart_from")}</div>
      <div className="pl-line">
        <div className="pl-grow" style={{ minWidth: 0 }}>
          <CountryPicker value={null} placeholder={fc ? fc.flag + " " + window.countryName(from.country) : pt("from_country")} onPick={(iso) => setFrom({ country: iso })} />
        </div>
        {from.country && <button type="button" className="btn btn-quiet pl-btn" onClick={() => setFrom({ country: "", city: "" })}>{pt("clear")}</button>}
      </div>
      <input className="field" style={{ marginTop: 8 }} maxLength={LIM.city} list="pl-cities" value={from.city} placeholder={pt("from_city")}
             aria-label={pt("from_city")} autoComplete="off"
             onFocus={() => plLoadAirports(bump)} onChange={(e) => setFrom({ city: e.target.value })} />
      <datalist id="pl-cities">{cities.map(c => <option key={c} value={c} />)}</datalist>

      <label className="pl-label" htmlFor="pl-exp" style={{ marginTop: 14 }}>{pt("expiry")}</label>
      <div className="pl-line">
        <input id="pl-exp" type="month" className="field" style={{ width: "auto" }} value={expiry} placeholder="YYYY-MM" onChange={(e) => setExpiry(e.target.value)} />
        {expiry && <button type="button" className="btn btn-quiet pl-btn" onClick={() => setExpiry("")}>{pt("clear")}</button>}
      </div>
      <p className="p-hint">{pt("expiry_note")}</p>
    </section>
  );
}

// ─── 3. Stops ──────────────────────────────────────────────────────────────
function PlStops({ stops, entries, pps, watch, onAdd, onRemove, onPatch, onMove }) {
  const LIM = window.TRIPS_CORE.LIMITS;
  const exclude = new Set([...pps, ...stops.map(s => s.iso)]);
  const quick = watch.filter(iso => !exclude.has(iso)).slice(0, 8);
  const issues = window.TRIPS_CORE.dateIssues({ stops });
  const msgFor = (i) => {
    const out = [];
    const s = stops[i];
    if (s.arrive && s.leave && s.leave < s.arrive) out.push(pt("iss_order"));
    issues.filter(x => x.index === i).forEach(x => {
      if (x.kind === "missing" && !(s.arrive && s.leave && s.leave < s.arrive)) out.push(pt("iss_missing"));
      if (x.kind === "overlap") out.push(pt("iss_overlap"));
    });
    return out;
  };
  return (
    <section className="p-sec">
      <Caption aside={stops.length ? <span className="mono">{stops.length}/{LIM.stops}</span> : null}>{pt("s_stops")}</Caption>
      {stops.length === 0 ? (
        <div className="box box-dashed p-hint" style={{ marginTop: 0 }}>{pt("no_stops")}</div>
      ) : (
        <ol className="pl-stops">
          {entries.map((e, i) => {
            const s = e.stop;
            const b = e.best;
            const msgs = msgFor(i);
            return (
              <li key={s.iso} className="pl-stop" style={{ "--tone": `var(--${b ? b.r.status : "na"}, var(--rule-strong))` }}>
                <div className="pl-stop-head">
                  <span className="stop-n">{i + 1}</span>
                  <span className="flag" style={{ fontSize: 20 }}>{window.byIso2[s.iso] && window.byIso2[s.iso].flag}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="stop-name">{window.countryName(s.iso)}</span>
                    {b && <span className="stop-meta">{statusLabel(b.r.status)}</span>}
                  </span>
                  <button type="button" className="pl-icon" disabled={i === 0} onClick={() => onMove(i, i - 1)} aria-label={pt("move_up")} title={pt("move_up")}>↑</button>
                  <button type="button" className="pl-icon" disabled={i === stops.length - 1} onClick={() => onMove(i, i + 1)} aria-label={pt("move_down")} title={pt("move_down")}>↓</button>
                  <button type="button" className="pl-icon" onClick={() => onRemove(i)} aria-label={pt("remove")} title={pt("remove")}><IconClose /></button>
                </div>
                <div className="pl-dates">
                  <label className="pl-field"><span className="pl-label">{pt("arrive")}</span>
                    <input type="date" className="field" value={s.arrive} onChange={(e) => onPatch(i, { arrive: e.target.value })} /></label>
                  <label className="pl-field"><span className="pl-label">{pt("leave")}</span>
                    <input type="date" className="field" value={s.leave} min={s.arrive || undefined} onChange={(e) => onPatch(i, { leave: e.target.value })} /></label>
                  <label className="pl-field"><span className="pl-label">{pt("via")}</span>
                    <input className="field" maxLength={3} value={s.via} placeholder="IST" autoComplete="off" autoCapitalize="characters"
                           onFocus={() => plLoadAirports(() => {})}
                           onChange={(e) => onPatch(i, { via: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} /></label>
                </div>
                {msgs.map((m, j) => <p key={j} className="pl-issue" role="status">{m}</p>)}
              </li>
            );
          })}
        </ol>
      )}
      {stops.length >= LIM.stops ? (
        <p className="p-hint">{pt("stops_max", { n: LIM.stops })}</p>
      ) : (
        <>
          <CountryPicker value={null} placeholder={"+ " + pt("add_destination")} exclude={exclude} onPick={onAdd} />
          {quick.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="pl-label">{pt("watched")}</div>
              <div className="chips">
                {quick.map(iso => (
                  <button key={iso} type="button" className="chip pl-chip" onClick={() => onAdd(iso)}>
                    <span className="flag">{window.byIso2[iso] && window.byIso2[iso].flag}</span>+ {window.countryName(iso)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── 4. Entry rules per stop ───────────────────────────────────────────────
function PlRules({ entries, pps }) {
  return (
    <section className="p-sec">
      <Caption>{pt("s_rules")}</Caption>
      {entries.map(e => <PlRulesCard key={e.stop.iso} e={e} pps={pps} />)}
      <p className="p-fine" style={{ margin: "8px 0 0" }}>{pt("data_src", { date: plFmtISO(window.SNAPSHOT_DATE) })}</p>
    </section>
  );
}

function PlRulesCard({ e, pps }) {
  const { stop, best, transit } = e;
  const iso = stop.iso;
  const name = window.countryName(iso);
  const head = (
    <div className="pl-card-head">
      <span className="flag" style={{ fontSize: 18 }}>{window.byIso2[iso] && window.byIso2[iso].flag}</span>
      <strong>{name}</strong>
    </div>
  );
  if (!best) return <div className="pl-card">{head}</div>;
  const st = best.r.status;
  if (st === "self") return <div className="pl-card">{head}<p className="p-hint" style={{ margin: "6px 0 0" }}>{pt("own_country")}</p></div>;

  const days = stop.arrive && stop.leave && stop.leave >= stop.arrive ? plDiff(stop.arrive, stop.leave) + 1 : null;
  const max = best.r.days;
  const fee = plNeedsApp(st) && window.visaFee ? window.visaFee(best.p, iso) : null;
  const et = window.etiasStatus ? window.etiasStatus(best.p, iso) : null;
  const esta = iso === "US" && window.estaEligible && window.estaEligible(best.p) && (st === "eta" || st === "ev") ? window.ESTA : null;
  const cond = (window.visaCondition && window.visaCondition(best.p, iso)) || [];
  const ORD = { idc: 0, vf: 1, eta: 2, ev: 3, voa: 4, vr: 5, ban: 6, na: 7 };
  const useful = st === "vf" ? [] : cond.filter(r => ORD[r.then] < ORD[st]);
  const lang = window.ATLAS_LANG || "en";
  const adv = plAdvisory(iso);
  const advAll = window.TRAVEL_ADVISORIES;
  const others = pps.filter(p => p !== best.p && p !== iso);

  return (
    <div className="pl-card">
      {head}
      <PlRow k={pt("k_status")}><Dot s={st} /> <strong>{statusLabel(st)}</strong>{pps.length > 1 ? <span className="p-fine"> {pt("via_passport", { name: window.countryName(best.p) })}</span> : null}</PlRow>
      {others.length > 0 && (
        <PlRow k={pt("k_others")}>{others.map(p => window.countryName(p) + ": " + statusLabel(window.resolveStatus(p, iso).status)).join("; ")}</PlRow>
      )}
      {!best.r.fom && st !== "idc" && (
        <PlRow k={pt("k_stay")}>{max ? window.t("detail.up_to_days", { n: max }) : plNoData()}</PlRow>
      )}
      {max && days && days > max && (
        <div className="note note-risk pl-note" role="alert"><span className="note-s" style={{ margin: 0 }}>{pt("stay_long", { n: days, max, name })}</span></div>
      )}
      {plNeedsApp(st) && (
        fee ? (
          <>
            <PlRow k={pt("k_fee")}>{itinFeeLabel(fee.fee)}</PlRow>
            {fee.processingDays && <PlRow k={pt("k_proc")}>{itinFeeLabel(fee.processingDays)}</PlRow>}
            {fee.type && <PlRow k={pt("k_type")}>{itinFeeLabel(fee.type)}</PlRow>}
            <div className="pl-srcline">
              {fee.source && <a className="link-quiet" href={fee.source} target="_blank" rel="noopener nofollow">{pt("apply_link")}</a>}
              {fee.lastReviewed && <span className="p-fine">{window.t("detail.reviewed", { date: fee.lastReviewed })}</span>}
            </div>
          </>
        ) : <PlRow k={pt("k_fee")}>{plNoData()}</PlRow>
      )}
      {et && et.kind === "required" && (
        <div className="note note-info pl-note"><span className="note-k">{pt("etias_t")}</span>
          <span className="note-s">{pt("etias_b", { fee: et.fee, n: et.validityYears })}</span>
          <span className="note-s"><a className="link-quiet" href={(window.ETIAS && window.ETIAS.officialUrl) || et.url} target="_blank" rel="noopener nofollow">{pt("etias_link")}</a></span></div>
      )}
      {esta && (
        <div className="note note-info pl-note"><span className="note-k">{pt("esta_t")}</span>
          <span className="note-s">{pt("esta_b", { fee: esta.applicationFee, n: esta.validityYears })}</span>
          <span className="note-s"><a className="link-quiet" href={esta.source} target="_blank" rel="noopener nofollow">{pt("esta_link")}</a></span></div>
      )}
      {useful.map((row, i) => {
        const labels = (window.conditionHoldsLabels && window.conditionHoldsLabels(row.ifHolds)) || row.ifHolds;
        const note = lang === "tr" ? (row.note || row.noteEn) : (row.noteEn || row.note);
        return (
          <div key={i} className="note note-ok pl-note">
            <span className="note-k">{pt("cond_t", { holds: labels.join(", "), status: statusLabel(row.then) })}{row.days ? ", " + window.t("detail.up_to_days", { n: row.days }) : ""}</span>
            {note && <span className="note-s">{note}</span>}
            {row.source && <span className="note-s"><a className="link-quiet" href={row.source} target="_blank" rel="noopener nofollow">{window.t("cond.source")}</a></span>}
          </div>
        );
      })}
      {transit && <PlTransitRow transit={transit} stop={stop} />}
      <PlRow k={pt("k_safety")}>
        {!advAll ? <span className="p-fine">{pt("adv_loading")}</span>
          : !adv || !adv.level ? plNoData()
          : (
            <span>
              <strong className={adv.level >= 3 ? "pl-warn" : ""}>{window.t("safety.level_n", { n: adv.level })}: {window.t("safety.l" + adv.level)}</strong>
              <span className="p-fine" style={{ display: "block" }}>
                {["uk", "us", "ca"].filter(k => adv[k] && adv[k].level).map(k => (advAll.sources[k] ? advAll.sources[k].name : k) + " " + adv[k].level).join("; ")}
                {adv.updated ? ". " + pt("adv_upd", { date: plFmtISO(adv.updated) }) : ""}
              </span>
              <a className="link-quiet" href="/safety-map/">{pt("adv_link")}</a>
            </span>
          )}
      </PlRow>
      {plNeedsApp(st) && <PartnerSlot kind="visa" status={st} dest={iso} />}
    </div>
  );
}

function PlTransitRow({ transit, stop }) {
  const k = pt("k_transit", { code: transit.code });
  if (transit.unknown) return <PlRow k={k}>{transit.loaded ? pt("tr_unknown") : <span className="p-fine">{pt("adv_loading")}</span>}</PlRow>;
  if (transit.none) return <PlRow k={k}>{plNoData()}</PlRow>;
  const s = transit.leg.status;
  const where = transit.city + " (" + window.countryName(transit.iso) + ")";
  let body;
  if (s.status === "self") body = pt("tr_self");
  else if (s.generic) body = plNoData();
  else if (s.status === "vr") body = <strong className="pl-warn">{pt("tr_vr")}</strong>;
  else if (s.status === "twov") body = <strong>{pt("tr_twov", { h: s.twovHours || "" })}</strong>;
  else body = <strong>{pt("tr_free")}</strong>;
  const o = window.TRANSIT_REQUIRED_OVERRIDES;
  return (
    <PlRow k={k}>
      <span>{where}: {body}</span>
      {!s.generic && s.status !== "self" && (
        <span className="p-fine" style={{ display: "block" }}>
          {window.countryName(transit.p) + ". "}
          {o && o.lastUpdated ? pt("tr_upd", { date: plFmtISO(o.lastUpdated) }) + " " : ""}
          <PlSrc url={s.source} />
        </span>
      )}
    </PlRow>
  );
}

// ─── 5. Schengen 90/180 ────────────────────────────────────────────────────
function PlSchengen({ entries }) {
  const SC = window.SCHENGEN_CORE;
  const inSchengen = entries.filter(e => SC.isMember(e.stop.iso));
  const members = inSchengen.filter(e => e.best && e.best.r.status !== "self" && e.best.r.status !== "idc" && !e.best.r.fom);
  if (!members.length) {
    // Schengen stops, but the person's best passport moves freely there (EU/EEA/Swiss or ID-card travel): say why
    // there is no 90/180 count instead of silently hiding it.
    const free = inSchengen.find(e => e.best);
    if (!free) return null;
    return (
      <section className="p-sec">
        <Caption>{pt("s_schengen")}</Caption>
        <p className="p-hint" style={{ margin: 0 }}>{pt("sg_free", { passport: window.countryName(free.best.p) })}</p>
      </section>
    );
  }
  const dated = members.filter(e => e.stop.arrive && e.stop.leave && e.stop.leave >= e.stop.arrive);
  const undated = members.length - dated.length;
  const past = plReadSchengenPast();
  const res = dated.length ? SC.checkPlan([...dated.map(e => ({ entry: e.stop.arrive, exit: e.stop.leave })), ...past]) : null;
  return (
    <section className="p-sec">
      <Caption>{pt("s_schengen")}</Caption>
      {res ? (
        <div className={"note pl-note " + (res.ok ? "note-ok" : "note-risk")} style={{ display: "block", margin: 0 }} role={res.ok ? undefined : "alert"}>
          <div className="note-k">{res.ok ? pt("sg_ok") : pt("sg_breach", { date: plFmtISO(res.firstBreach) })}</div>
          <div className="note-s">{pt("sg_peak", { n: res.peak, max: SC.MAX_DAYS })}</div>
          {past.length > 0 && <div className="note-s">{pt("sg_past", { n: past.length })}</div>}
        </div>
      ) : <p className="p-hint" style={{ margin: 0 }}>{pt("sg_nodates")}</p>}
      {undated > 0 && res && <p className="p-hint">{pt("sg_undated", { n: undated })}</p>}
      <p className="p-hint">{pt("sg_scope")}</p>
      <a className="link-quiet" href={plPrefix() + "/schengen-calculator/"}>{pt("sg_link")}</a>
    </section>
  );
}

// ─── 6. Checklist ──────────────────────────────────────────────────────────
function PlChecklist({ entries, lists, done, onToggle }) {
  return (
    <section className="p-sec">
      <Caption>{pt("s_checklist")}</Caption>
      {entries.map((e, i) => {
        const list = lists[i];
        if (!list.length) return null;
        const open = list.filter(it => !done[it.key]).length;
        return (
          <div key={e.stop.iso} className="pl-card">
            <div className="pl-card-head">
              <span className="flag" style={{ fontSize: 18 }}>{window.byIso2[e.stop.iso] && window.byIso2[e.stop.iso].flag}</span>
              <strong style={{ flex: 1 }}>{window.countryName(e.stop.iso)}</strong>
              <span className="mono p-fine">{pt("ck_open", { n: open })}</span>
            </div>
            <ul className="pl-ck-list">
              {list.map(it => (
                <li key={it.key}>
                  <label className="pl-ck">
                    <input type="checkbox" checked={!!done[it.key]} onChange={() => onToggle(it.key)} />
                    <span className="pl-ck-text">
                      <span className="pl-ck-main">{it.text}</span>
                      {it.detail && <span className="pl-ck-detail">{it.detail}</span>}
                    </span>
                  </label>
                  {it.href && /^(\/|https?:)/.test(it.href) && <a className="link-quiet pl-ck-link" href={it.href} target={it.href.charAt(0) === "/" ? undefined : "_blank"} rel="noopener nofollow">{pt("more")}</a>}
                  {it.partner && <PartnerSlot kind={it.partner} status={e.best && e.best.r.status} dest={e.stop.iso} />}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

// ─── 7. Summary, reminders, ICS, share ─────────────────────────────────────
function PlSummary({ trip, entries, lists, done, plan, pps, from }) {
  const [shareMsg, setShareMsg] = useState("");
  const stops = entries.map(e => e.stop);
  // Only show a total when every stop has both dates; a partial total ("1 day") misleads.
  const days = stops.length && stops.every(s => s.arrive && s.leave) ? window.TRIPS_CORE.totalDays({ stops }) : 0;
  const first = stops.find(s => s.arrive);
  const last = stops.slice().reverse().find(s => s.leave || s.arrive);
  const fc = from ? window.byIso2[from] : null;
  const route = [fc ? fc.flag + " " + (trip.from.city || window.countryName(from)) : null]
    .concat(stops.map(s => (window.byIso2[s.iso] ? window.byIso2[s.iso].flag + " " : "") + window.countryName(s.iso) + (s.arrive ? " (" + plFmtISO(s.arrive) + (s.leave ? " → " + plFmtISO(s.leave) : "") + ")" : "")))
    .filter(Boolean);

  // Visa totals, same arithmetic as the old planner.
  let totalFee = 0, unknown = 0, maxProc = 0;
  const visaStops = [];
  entries.forEach(e => {
    if (!e.best || !plNeedsApp(e.best.r.status)) return;
    visaStops.push({ iso: e.stop.iso, status: e.best.r.status, p: e.best.p });
    const usd = feeUSD(e.best.p, e.stop.iso);
    if (usd) totalFee += usd; else unknown++;
    const pd = procDays(e.best.p, e.stop.iso);
    if (pd > maxProc) maxProc = pd;
  });
  const order = visaStops.slice().sort((a, b) => procDays(b.p, b.iso) - procDays(a.p, a.iso));

  const items = plan && plan.items ? plan.items : [];
  const downloadICS = () => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//travelnow.info//Visa Reminder//EN", "CALSCALE:GREGORIAN"];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    for (const it of items) {
      const ymd = it.applyBy.toISOString().slice(0, 10).replace(/-/g, "");
      const next = new Date(it.applyBy.getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, "");
      const nm = window.countryName(it.iso);
      lines.push("BEGIN:VEVENT", `UID:atlas-visa-${it.iso}-${ymd}@travelnow.info`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:Apply for ${nm} visa`,
        `DESCRIPTION:Submit your ${nm} visa application today. Processing ~${it.proc} days; arrival ${it.arrive}.`,
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:Apply for ${nm} visa tomorrow.`, "END:VALARM", "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "atlas-visa-reminders.ics";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const copyShare = () => {
    const u = new URL(location.href); u.search = "";
    if (pps[0]) u.searchParams.set("p", pps[0]);
    if (stops.length) u.searchParams.set("stops", stops.map(s => s.iso).join(","));
    if (stops[0] && stops[0].arrive) u.searchParams.set("d", stops[0].arrive);
    navigator.clipboard.writeText(u.toString()).then(() => { setShareMsg(pt("copied")); setTimeout(() => setShareMsg(""), 2000); });
  };

  return (
    <section className="p-sec">
      <Caption>{pt("s_summary")}</Caption>
      <p className="pl-route">{route.join("  →  ")}</p>
      <div className="stats3" style={{ marginBottom: 10 }}>
        <div><div className="n">{days || "-"}</div><div className="l">{pt("sum_days")}</div></div>
        <div><div className="n">{visaStops.length}</div><div className="l">{pt("visas_needed")}</div></div>
        <div><div className="n">{totalFee > 0 ? "$" + totalFee.toFixed(0) : "-"}</div><div className="l">{pt("est_cost")}</div></div>
      </div>
      <div className="pl-tablewrap">
        <table className="pl-table">
          <thead><tr><th>{pt("th_country")}</th><th>{pt("th_status")}</th><th>{pt("th_stay")}</th><th>{pt("th_open")}</th></tr></thead>
          <tbody>
            {entries.map((e, i) => {
              const b = e.best;
              const open = lists[i].filter(it => !done[it.key]).length;
              return (
                <tr key={e.stop.iso}>
                  <td><span className="flag">{window.byIso2[e.stop.iso] && window.byIso2[e.stop.iso].flag}</span> {window.countryName(e.stop.iso)}</td>
                  <td>{b ? <><Dot s={b.r.status} /> {statusLabel(b.r.status)}<span className="p-fine" style={{ display: "block" }}>{b.p === e.stop.iso ? "" : window.countryName(b.p)}</span></> : plNoData()}</td>
                  <td>{b && b.r.days ? window.t("detail.up_to_days", { n: b.r.days }) : (b && (b.r.status === "self" || b.r.status === "idc" || b.r.fom) ? "-" : plNoData())}</td>
                  <td className="mono">{b && b.r.status === "self" ? "-" : open}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pl-key">
        <div className="pl-label">{pt("sum_dates")}</div>
        {plan && plan.earliest ? (
          <p className="p-hint" style={{ margin: "2px 0 0", color: "var(--ink-2)" }}>
            {plan.earliestDays <= 0 ? pt("past_window") : pt("start_by", { date: fmtDate(plan.earliest), n: plan.earliestDays })}
          </p>
        ) : null}
        {first ? <p className="p-hint" style={{ margin: "2px 0 0" }}>{pt("sum_depart", { date: plFmtISO(first.arrive) })}{last && (last.leave || last.arrive) !== first.arrive ? " " + pt("sum_return", { date: plFmtISO(last.leave || last.arrive) }) : ""}</p>
          : <p className="p-hint" style={{ margin: "2px 0 0" }}>{pt("depart_hint")}</p>}
      </div>

      {plan && plan.late.length > 0 && (
        <div className="note note-risk" style={{ display: "block", marginTop: 10 }} role="alert">
          <div className="note-k">{pt("late_title")}</div>
          <div className="note-s">{pt("late_body", { names: plan.late.map(i => window.countryName(i.iso)).join(", ") })}</div>
        </div>
      )}
      {items.length > 0 && (
        <div className="members" style={{ marginTop: 10 }}>
          {items.map(it => (
            <div key={it.iso} className="member">
              <span className="flag" style={{ fontSize: 18 }}>{window.byIso2[it.iso] && window.byIso2[it.iso].flag}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="stop-name">{window.countryName(it.iso)}</span>
                <span className="stop-meta">{pt("proc_lead", { proc: it.proc, lead: it.lead })}</span>
              </span>
              <span style={{ textAlign: "end" }}>
                <span className="stop-name" style={{ fontSize: 12.5, color: it.overdue ? "var(--vr)" : "var(--ink)" }}>{it.overdue ? pt("apply_asap") : pt("apply_by")}</span>
                <span className="stop-meta">{fmtDate(it.applyBy)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {plan && items.length === 0 && visaStops.length === 0 && (
        <div className="note note-ok" style={{ display: "block", marginTop: 10 }}>
          <div className="note-k">{pt("good_news")}</div>
          <div className="note-s">{pt("good_news_b")}</div>
        </div>
      )}
      {order.length > 0 && (
        <>
          <div className="pl-label" style={{ marginTop: 12 }}>{pt("order_title")}</div>
          <ol className="apply-order">
            {order.map(s => {
              const fee = window.visaFee && window.visaFee(s.p, s.iso);
              return (
                <li key={s.iso}>
                  <strong><span className="flag">{window.byIso2[s.iso] && window.byIso2[s.iso].flag}</span> {window.countryName(s.iso)}</strong>
                  <span>: {statusLabel(s.status)}{fee && fee.processingDays ? ", " + itinFeeLabel(fee.processingDays) : ""}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {unknown > 0 && <p className="p-fine" style={{ margin: "8px 0 0" }}>{pt("missing_fee", { n: unknown })}</p>}
      {maxProc > 0 && <p className="p-fine" style={{ margin: "4px 0 0" }}>{pt("start_buffer", { n: maxProc })}</p>}

      <PartnerSlot kind="esim" status="*" dest="" />

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {items.length > 0 && <button type="button" className="btn btn-primary" onClick={downloadICS}>{pt("dl_ics")}</button>}
        <button type="button" className="btn" onClick={copyShare}>{pt("copy_url")}</button>
        <button type="button" className="btn" onClick={() => window.print()}>{pt("print")}</button>
        {shareMsg && <span className="p-hint" style={{ margin: 0, color: "var(--vf)" }}>{shareMsg}</span>}
      </div>
    </section>
  );
}

// ─── 8. Sign-in nudge (only where accounts exist and nobody is signed in) ─────
function PlSignIn() {
  const acct = window.ATLAS_ACCOUNT || { enabled: false };
  const [, force] = useState(0);
  useEffect(() => {
    if (!acct.onChange) return undefined;
    const off = acct.onChange(() => force(x => x + 1));
    return typeof off === "function" ? off : undefined;
  }, []);
  const st = acct.state || {};
  if (!acct.enabled || !st.ready || st.user) return null;
  return <p className="p-hint pl-signin"><a className="link-quiet" href={"/account/"}>{pt("signin")}</a></p>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<ItineraryApp />);

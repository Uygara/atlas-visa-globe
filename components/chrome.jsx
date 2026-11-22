// Shared chrome for the three globe apps (/, /transit-map/, /itinerary/):
// masthead + nav, theme/language menu, icons, the mobile sheet handle
// and the theme store. Before this file each app carried its own TopNav with a
// different link list; now the list comes from assets/site-nav.js and every
// page gets the same header.

const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useLayoutEffect: useLayoutEffectC, useCallback: useCallbackC } = React;

// i18n lookup that falls back to a literal when the key isn't translated.
function tr(key, fallback, vars) {
  // Fill {placeholders} in the fallback too: a cached i18n.js without the key must not show "{who}".
  const fill = (s) => vars ? Object.keys(vars).reduce((acc, k) => acc.split("{" + k + "}").join(String(vars[k])), s) : s;
  if (!window.t) return fill(fallback);
  const v = window.t(key, vars);
  return v === key ? fill(fallback) : v;
}

// Re-render the caller whenever the language changes.
function useLangTick() {
  const [, force] = useStateC(0);
  useEffectC(() => {
    const f = () => force(x => x + 1);
    window.addEventListener("atlas:lang", f);
    return () => window.removeEventListener("atlas:lang", f);
  }, []);
}

// ─── Theme ───────────────────────────────────────────────────────────────
// Stored under atlas.tweaks.background (shared with static pages). Classes go
// on BOTH <html> and <body>: tokens.css reads either, and <html> is what the
// inline boot snippet sets before first paint.
function readTheme() {
  try {
    const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
    return tw.background === "dark" ? "dark" : "light";
  } catch (e) { return "light"; }
}
function applyThemeClass(theme) {
  const dark = theme === "dark";
  [document.documentElement, document.body].forEach(el => {
    if (!el) return;
    el.classList.toggle("theme-dark", dark);
    el.classList.toggle("theme-light", !dark);
  });
}
// For apps that don't keep their own tweaks state (transit map, planner).
function useSiteTheme() {
  const [theme, setThemeState] = useStateC(readTheme);
  useEffectC(() => { applyThemeClass(theme); }, [theme]);
  useEffectC(() => {
    const onStorage = (e) => { if (e.key === "atlas.tweaks") setThemeState(readTheme()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const setTheme = useCallbackC((next) => {
    try {
      const tw = JSON.parse(localStorage.getItem("atlas.tweaks") || "{}");
      tw.background = next;
      localStorage.setItem("atlas.tweaks", JSON.stringify(tw));
    } catch (e) {}
    setThemeState(next);
  }, []);
  return [theme, setTheme];
}

// ─── Icons ───────────────────────────────────────────────────────────────
function BrandMark(props) {
  // A passport page opening its machine-readable zone: "P<" over a dotted filler
  // line. Drawn in currentColor so it takes the accent.
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="2.75" y="1.75" width="18.5" height="20.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.4 14.6V6.8h2.9a2.4 2.4 0 0 1 0 4.8H6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.9 7.3 13.9 10.7l3 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.4 18.3h11.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="0.1 2.3" />
    </svg>
  );
}
function IconCaret(props) {
  return <svg viewBox="0 0 12 12" aria-hidden="true" {...props}><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function IconClose(props) {
  return <svg viewBox="0 0 14 14" aria-hidden="true" {...props}><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function IconSearch(props) {
  return <svg viewBox="0 0 16 16" aria-hidden="true" {...props}><circle cx="7" cy="7" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10.6 10.6 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function IconSun(props) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M8 1.2v1.7M8 13.1v1.7M1.2 8h1.7M13.1 8h1.7M3.2 3.2l1.2 1.2M11.6 11.6l1.2 1.2M12.8 3.2l-1.2 1.2M4.4 11.6l-1.2 1.2" /></g>
    </svg>
  );
}
function IconMoon(props) {
  return <svg viewBox="0 0 16 16" aria-hidden="true" {...props}><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z" fill="currentColor" /></svg>;
}
// Link to /account/, only when accounts are switched on (assets/account.js). Signed out it is the
// filled "Sign in" button; signed in it is a circle with the person's initial.
function AccountLink() {
  const acct = window.ATLAS_ACCOUNT;
  const [, force] = useStateC(0);
  useEffectC(() => (acct && acct.enabled ? acct.onChange(() => force(x => x + 1)) : undefined), []);
  if (!acct || !acct.enabled) return null;
  const user = acct.state.user;
  const label = tr("nav.account", "Account");
  return (
    <a className={"mh-account" + (user ? " is-signed-in" : "")} href="/account/" title={user && user.email ? user.email : undefined}>
      <span className="mh-signin">{tr("nav.signin", "Sign in")}</span>
      <span className="mh-acct-dot" aria-hidden="true"><span>{user && user.email ? user.email.charAt(0).toUpperCase() : ""}</span></span>
      <span className="mh-acct-name">{label}</span>
    </a>
  );
}

function IconMenu({ open, ...props }) {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" {...props}>
      {open
        ? <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        : <path d="M3 5.5h12M3 9h12M3 12.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

// ─── Controls ────────────────────────────────────────────────────────────
function ViewToggle({ value, onChange, className }) {
  const opts = [["globe3d", tr("mode.3d", "3D")], ["flat", tr("mode.2d", "2D")]];
  return (
    <div className={"seg" + (className ? " " + className : "")} role="group" aria-label={tr("nav.mode", "Globe view")}>
      {opts.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

function ThemeToggle({ value, onChange }) {
  const opts = [
    ["light", <IconSun />, tr("settings.theme_light", "Light")],
    ["dark", <IconMoon />, tr("settings.theme_dark", "Dark")],
  ];
  return (
    <div className="seg" role="group" aria-label={tr("settings.theme", "Theme")}>
      {opts.map(([v, icon, label]) => (
        <button key={v} type="button" aria-pressed={value === v} aria-label={label} title={label} onClick={() => onChange(v)}>{icon}</button>
      ))}
    </div>
  );
}

function LangSelect({ className }) {
  useLangTick();
  const cur = window.ATLAS_LANG || "en";
  return (
    <select className={"lang-select" + (className ? " " + className : "")} value={cur}
      aria-label={tr("nav.language", "Language")}
      onChange={(e) => window.setLang && window.setLang(e.target.value)}>
      {(window.LANGS || []).map(l => <option key={l.code} value={l.code}>{l.native}{l.beta ? " (beta)" : ""}</option>)}
    </select>
  );
}

// ─── Masthead ────────────────────────────────────────────────────────────
// Brand, four always-visible links, an "All tools" panel (three groups, each link
// with a one-line description), a "language and theme" menu and the sign-in button.
// Same markup and class names as the static pages (scripts/partials.js), so
// assets/chrome.css styles both. The 3D/2D switch and the help button live on the
// map (components/globe.jsx), not here.
function Masthead({ theme, onTheme }) {
  useLangTick();
  const nav = window.SITE_NAV || { PRIMARY: [], GROUPS: [], SUPPORT: null, isCurrent: () => false };
  const path = location.pathname;
  // A reader of Turkish is sent to the Turkish twin of every page that has one.
  const lang = window.ATLAS_LANG || "en";
  const to = (h) => (nav.localHref ? nav.localHref(h, lang) : h);
  const [open, setOpen] = useStateC(null); // "tools" | "prefs" | null
  const [sheetOpen, setSheetOpen] = useStateC(false);
  const headerRef = useRefC(null), moreRef = useRefC(null);
  const toolsBtn = useRefC(null), prefsBtn = useRefC(null);
  const toolsPanel = useRefC(null), prefsPanel = useRefC(null);

  const label = (it) => tr(it.key, it.en);
  const cur = (it) => (nav.isCurrent(it, path) ? "page" : undefined);
  const TOP = nav.GROUPS.filter(g => g.top), REST = nav.GROUPS.filter(g => !g.top);
  const toolOn = REST.some(g => g.items.some(it => nav.isCurrent(it, path)));
  const langs = window.LANGS || [];
  const themeNow = theme === "dark" ? "dark" : "light";
  const themeName = (v) => tr(v === "dark" ? "settings.theme_dark" : "settings.theme_light", v === "dark" ? "Dark" : "Light");

  // Opening a menu moves focus to its first link or button.
  useEffectC(() => {
    const panel = open === "tools" ? toolsPanel.current : open === "prefs" ? prefsPanel.current : (open && open.indexOf("top") === 0 ? document.getElementById("mh-" + open + "-panel") : null);
    const first = panel && panel.querySelector("a[href], button");
    if (first) first.focus();
  }, [open]);

  // Close on a tap outside (pointerdown so iOS taps count) and on Escape; Escape hands focus back.
  useEffectC(() => {
    if (!open && !sheetOpen) return;
    // "More" (tab bar) toggles the sheet itself, so a press on it is not "outside".
    const onDown = (e) => { if (headerRef.current && !headerRef.current.contains(e.target) && !(moreRef.current && moreRef.current.contains(e.target))) { setOpen(null); setSheetOpen(false); } };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const btn = open === "tools" ? toolsBtn.current : open === "prefs" ? prefsBtn.current : (open && open.indexOf("top") === 0) ? document.querySelector('[aria-controls="mh-' + open + '-panel"]') : sheetOpen ? moreRef.current : null;
      setOpen(null); setSheetOpen(false);
      if (btn) btn.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, sheetOpen]);

  // Tabbing out of an open panel closes it.
  const leave = (btn) => (e) => {
    const next = e.relatedTarget;
    if (next && !e.currentTarget.contains(next) && next !== btn.current) setOpen(null);
  };

  const themeOpts = onTheme && (
    <div className="mh-opts-row" role="group" aria-label={tr("settings.theme", "Theme")}>
      {["light", "dark"].map(v => (
        <button key={v} type="button" className="mh-opt" aria-pressed={themeNow === v} onClick={() => onTheme(v)}>{themeName(v)}</button>
      ))}
    </div>
  );

  // Phone tab bar: the four main links as plain text and "More", which opens the sheet.
  const TAB_LABEL = { "/": tr("nav.tab_map", "Map"), "/visa/": tr("nav.countries", "Countries"), "/itinerary/": tr("nav.tab_planner", "Planner"), "/panel/": tr("nav.panel", "My panel") };

  return (
    <>
    <header ref={headerRef} className={"masthead" + (sheetOpen ? " is-open" : "")}>
      <a className="skip-link" href="#panel">{tr("a11y.skip", "Skip to content")}</a>
      <a className="brand" href={to("/")} aria-label="travelnow.info">
        <BrandMark className="brand-mark" />
        <span className="brand-word">travelnow<span className="brand-tld">.info</span></span>
      </a>

      <nav className="mh-nav" aria-label={tr("nav.main", "Main")}>
        {TOP.map((g, i) => (
          <div key={g.key} className="mh-all mh-top">
            <button type="button" className={"mh-link mh-all-btn mh-top-btn" + (g.items.some(it => nav.isCurrent(it, path)) ? " has-current" : "")}
              aria-expanded={open === "top" + i} aria-controls={"mh-top" + i + "-panel"} onClick={() => setOpen(o => o === "top" + i ? null : "top" + i)}>
              {tr(g.key, g.en)}<IconCaret />
            </button>
            <div className="mh-panel mh-top-panel" id={"mh-top" + i + "-panel"} hidden={open !== "top" + i}>
              <ul>
                {g.items.map(it => (
                  <li key={it.href}><a className="mh-tool" href={to(it.href)} aria-current={cur(it)}><span className="mh-tool-t">{label(it)}</span>{it.dkey && <span className="mh-tool-d">{tr(it.dkey, it.den)}</span>}</a></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        <ul className="mh-links">
          {nav.PRIMARY.filter(it => it.bar !== false).map(it => (
            <li key={it.href}><a className="mh-link" href={to(it.href)} aria-current={cur(it)}>{label(it)}</a></li>
          ))}
        </ul>
        <div className="mh-all">
          <button ref={toolsBtn} type="button" className={"mh-link mh-all-btn" + (toolOn ? " has-current" : "")}
            aria-expanded={open === "tools"} aria-controls="mh-all-panel" onClick={() => setOpen(o => o === "tools" ? null : "tools")}>
            {tr("nav.all_tools", "All tools")}<IconCaret />
          </button>
          <div ref={toolsPanel} className="mh-panel mh-all-panel" id="mh-all-panel" hidden={open !== "tools"} onBlur={leave(toolsBtn)}>
            {REST.map(g => (
              <div key={g.key} className="mh-grp">
                <p className="mh-grp-label">{tr(g.key, g.en)}</p>
                <ul>
                  {g.items.map(it => (
                    <li key={it.href}>
                      <a className="mh-tool" href={to(it.href)} aria-current={cur(it)}>
                        <span className="mh-tool-t">{label(it)}</span>
                        {it.dkey && <span className="mh-tool-d">{tr(it.dkey, it.den)}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="mh-tools">
        <div className="mh-prefs">
          <button ref={prefsBtn} type="button" className="mh-prefs-btn" aria-expanded={open === "prefs"} aria-controls="mh-prefs-panel"
            aria-label={tr("nav.lang_theme", "Language and theme")} onClick={() => setOpen(o => o === "prefs" ? null : "prefs")}>
            <span>{lang.toUpperCase()}</span><span aria-hidden="true"> · </span><span>{themeName(themeNow)}</span><IconCaret />
          </button>
          <div ref={prefsPanel} className="mh-panel mh-prefs-panel" id="mh-prefs-panel" hidden={open !== "prefs"} onBlur={leave(prefsBtn)}>
            <p className="mh-grp-label">{tr("nav.language", "Language")}</p>
            <ul className="mh-opts">
              {langs.map(l => (
                <li key={l.code}>
                  <button type="button" className="mh-opt" aria-pressed={lang === l.code} onClick={() => { setOpen(null); window.setLang && window.setLang(l.code); }}>
                    {l.native}{l.beta ? " (beta)" : ""}
                  </button>
                </li>
              ))}
            </ul>
            {themeOpts && <p className="mh-grp-label">{tr("settings.theme", "Theme")}</p>}
            {themeOpts}
          </div>
        </div>
        <AccountLink />
      </div>

      <div className="mh-sheet">
        {nav.PRIMARY.map(it => (
          <a key={it.href} className="mh-sheet-link" href={to(it.href)} aria-current={cur(it)}>{label(it)}</a>
        ))}
        <p className="mh-sheet-h">{tr("nav.all_tools", "All tools")}</p>
        <ul className="mh-sheet-tools">
          {nav.GROUPS.map(g => g.items.filter(it => it.href !== "/").map(it => (
            <li key={it.href}><a className="mh-sheet-tool" href={to(it.href)} aria-current={cur(it)}>{label(it)}</a></li>
          )))}
        </ul>
        <div className="mh-sheet-foot">
          <LangSelect />
          {themeOpts}
          {nav.INSTAGRAM && <a className="mh-sheet-ext" href={nav.INSTAGRAM.href} target="_blank" rel="noopener" aria-label={tr(nav.INSTAGRAM.key, nav.INSTAGRAM.en)}>Instagram</a>}
          {nav.SUPPORT && <a className="mh-sheet-ext" href={nav.SUPPORT.href} target="_blank" rel="noopener">{tr(nav.SUPPORT.key, nav.SUPPORT.en)}</a>}
        </div>
      </div>
    </header>
    <nav className="tabbar" aria-label={tr("nav.tabs", "Quick links")}>
      {nav.PRIMARY.map(it => (
        <a key={it.href} className="tb-item" href={to(it.href)} aria-current={cur(it)}>{TAB_LABEL[it.href] || label(it)}</a>
      ))}
      <button ref={moreRef} type="button" className="tb-item tb-more" aria-expanded={sheetOpen} onClick={() => setSheetOpen(o => !o)}>
        {tr("nav.tab_more", "More")}
      </button>
    </nav>
    </>
  );
}

// ─── Mobile bottom sheet handle ──────────────────────────────────────────
// Turns the side panel into a draggable sheet (peek / half / full) below
// 900px. The feel follows Apple's fluid-interface rules (WWDC 2018):
//   • 1:1 tracking from where it was grabbed, rubber-band resistance past the ends;
//   • on release the velocity projects a resting point (UIScrollView deceleration)
//     and the nearest snap to THAT point wins, so a flick carries the sheet on;
//   • a spring (critically damped, or slightly under-damped after a flick) takes
//     the release velocity, so there is no seam between finger and animation;
//   • grabbing a moving sheet stops the spring where it is on screen.
// The panel's height is driven directly; --sheet-h (read by the globe and the
// overlays) is set to where the sheet is going, so the globe re-fits once.
function MobileSheetHandle() {
  const ref = useRefC(null);
  useEffectC(() => {
    const handle = ref.current;
    const panel = handle && handle.closest(".panel");
    if (!panel) return;
    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The tab bar (phones, not in the app) sits under the sheet: the sheet's room is the screen minus it.
    const tabH = () => { const t = document.querySelector(".tabbar"); return t ? t.getBoundingClientRect().height : 0; };
    const room = () => window.innerHeight - tabH();
    const snaps = () => [96, Math.round(room() * 0.48), Math.round(room() * 0.88)];
    const MIN = 72, max = () => room() * 0.92;
    let startY = 0, startH = 0, dragging = false, moved = false, lastH = 0, hist = [], raf = 0;

    const publish = (h) => {
      panel.style.setProperty("--sheet-h", h + "px");
      // Mirror on <html> so overlays outside the panel (coach hint, compare
      // strip) can sit just above the sheet.
      document.documentElement.style.setProperty("--sheet-h", h + "px");
    };
    const paint = (h) => { lastH = h; panel.style.height = h + "px"; };
    const curH = () => panel.getBoundingClientRect().height;
    const nearest = (h) => snaps().reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
    // Progressive resistance past a bound instead of a hard stop.
    const rubber = (over, dim) => (over * dim * 0.55) / (dim + 0.55 * Math.abs(over));
    const clampSoft = (h) => {
      const hi = max();
      // The stretch approaches the room that is left (never past the top of the screen).
      if (h > hi) return hi + rubber(h - hi, room() - hi);
      if (h < MIN) return MIN - rubber(MIN - h, MIN / 2);
      return h;
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

    // Spring to `target` from the on-screen height, starting at velocity v0 (px/s,
    // positive = growing). damping 1 = no overshoot; 0.8 only after a flick.
    const springTo = (target, v0 = 0, damping = 1, response = 0.32) => {
      stop();
      // Read the on-screen height and pin it BEFORE --sheet-h moves to the target:
      // with no inline height the panel would otherwise jump there at once.
      let x = curH(), v = v0, t0 = performance.now();
      paint(x);
      publish(target);
      if (reduced()) { paint(target); panel.style.height = ""; return; }
      const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
      const step = (now) => {
        let dt = Math.min(0.032, (now - t0) / 1000); t0 = now;
        // two half-steps keep the integration stable on slow frames
        for (let i = 0; i < 2; i++) { const a = -k * (x - target) - c * v; v += a * dt / 2; x += v * dt / 2; }
        if (Math.abs(x - target) < 0.5 && Math.abs(v) < 8) { paint(target); panel.style.height = ""; raf = 0; return; }
        paint(x);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const down = (e) => {
      if (!isMobile()) return;
      stop();                                   // catch it mid-flight, where it is
      dragging = true; moved = false;
      startY = e.clientY; startH = curH(); paint(startH);
      hist = [{ t: e.timeStamp, h: startH }];
      panel.classList.add("sheet-dragging");
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    };
    const move = (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      if (Math.abs(dy) > 6) moved = true;       // small hysteresis before it's a drag
      if (!moved) return;
      const h = clampSoft(startH + dy);
      paint(h); publish(Math.min(max(), Math.max(MIN, h)));
      hist.push({ t: e.timeStamp, h }); if (hist.length > 6) hist.shift();
    };
    // Release velocity from the last ~100 ms of movement (px/s, + = up).
    const velocity = () => {
      const last = hist[hist.length - 1], first = hist.find((p) => last.t - p.t <= 100) || hist[0];
      const dt = (last.t - first.t) / 1000;
      return dt > 0 ? (last.h - first.h) / dt : 0;
    };
    // iOS fires pointercancel instead of pointerup when it reclassifies a touch.
    const settle = () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("sheet-dragging");
      if (!moved) {
        const order = snaps();
        const i = order.indexOf(nearest(curH()));
        springTo(order[(i + 1) % order.length]);
        return;
      }
      const v = velocity();
      // Where the flick would come to rest (decelerationRate 0.998), then the snap nearest it.
      const projected = lastH + (v / 1000) * 0.998 / (1 - 0.998);
      const target = nearest(Math.min(max(), Math.max(MIN, projected)));
      springTo(target, v, Math.abs(v) > 600 ? 0.8 : 1);
    };
    // Opening a country while the sheet is peeking would hide it: rise to at
    // least `fraction` of the screen (no-op on desktop and if already taller).
    window.atlasSheet = {
      ensure: (fraction) => {
        if (!isMobile()) return;
        const want = Math.round(room() * fraction);
        if (curH() < want - 4) springTo(want);
      },
    };
    // Keyboard: arrows step through the snap points, Enter/Space cycle like a tap.
    const onKey = (e) => {
      if (!isMobile()) return;
      const order = snaps();
      const i = order.indexOf(nearest(curH()));
      let next = null;
      if (e.key === "ArrowUp") next = Math.min(order.length - 1, i + 1);
      else if (e.key === "ArrowDown") next = Math.max(0, i - 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = order.length - 1;
      else if (e.key === "Enter" || e.key === " ") next = (i + 1) % order.length;
      if (next == null) return;
      e.preventDefault();
      springTo(order[next]);
    };
    handle.addEventListener("keydown", onKey);
    handle.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", settle);
    window.addEventListener("pointercancel", settle);
    return () => {
      stop();
      delete window.atlasSheet;
      handle.removeEventListener("keydown", onKey);
      handle.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", settle);
      window.removeEventListener("pointercancel", settle);
    };
  }, []);
  return (
    <div ref={ref} className="sheet-handle" role="button" tabIndex={0}
         aria-label={tr("sheet.resize", "Resize panel")}>
      <span className="sheet-grabber" aria-hidden="true" />
    </div>
  );
}

// Form-style section caption: "01  YOUR PASSPORT".
// A <span> (display:flex) so it's also valid inside the collapse <button>.
// `n` is accepted for old call sites but not shown: numbered section labels read as template filler.
function Caption({ children, aside }) {
  return (
    <span className="p-cap">
      <span>{children}</span>
      {aside && <span className="p-cap-aside">{aside}</span>}
    </span>
  );
}

// Status swatch / dot helpers — square swatch for keys and ledgers, round dot
// inline in text. The "ban" swatch is hatched, like a restricted zone on a map.
function Swatch({ s }) {
  if (s === "ban") return <span className="sw sw-ban" aria-hidden="true" />;
  return <span className="sw" data-s={s} aria-hidden="true" style={{ "--sw": `var(--${s})` }} />;
}
function Dot({ s }) {
  return <span className="dot" aria-hidden="true" style={{ "--sw": `var(--${s})` }} />;
}

Object.assign(window, {
  tr, useLangTick, readTheme, applyThemeClass, useSiteTheme,
  BrandMark, IconCaret, IconClose, IconSearch, IconSun, IconMoon,
  ViewToggle, ThemeToggle, LangSelect, Masthead, MobileSheetHandle, Caption, Swatch, Dot,
});

// ─── Map / panel divider (desktop) ───────────────────────────────────────────
// Drag the line between the map and the side panel to give the map more or less room.
// Arrow keys move it too; double-click puts it back. The width is a display preference kept
// on this device only (localStorage "atlas.panelW"); it is not synced or sent anywhere.
function PanelResizer() {
  const DEF = 360, MIN = 300, STEP = 24;
  const max = () => Math.max(MIN, Math.min(720, Math.round(window.innerWidth * 0.6)));
  const clamp = (v) => Math.min(max(), Math.max(MIN, Math.round(v)));
  const [w, setW] = useStateC(() => { try { const v = +localStorage.getItem("atlas.panelW"); return v >= MIN ? v : DEF; } catch (e) { return DEF; } });
  const ref = useRefC(null);
  useLangTick();
  const apply = (v) => document.documentElement.style.setProperty("--panel-w", clamp(v) + "px");
  useEffectC(() => {
    apply(w);
    try { if (w === DEF) localStorage.removeItem("atlas.panelW"); else localStorage.setItem("atlas.panelW", String(w)); } catch (e) {}
    const onResize = () => apply(w);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [w]);
  // The panel's width measured from the pointer: the panel sits at the end of the row (left in Arabic).
  const fromX = (x) => {
    const box = ref.current.parentNode.getBoundingClientRect();
    return document.documentElement.dir === "rtl" ? x - box.left : box.right - x;
  };
  const down = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = ref.current; el.setPointerCapture(e.pointerId);
    document.documentElement.classList.add("is-resizing");
    let last = w;
    const move = (ev) => { last = clamp(fromX(ev.clientX)); apply(last); };
    const up = () => {
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      document.documentElement.classList.remove("is-resizing");
      setW(last);
    };
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  };
  const key = (e) => {
    const rtl = document.documentElement.dir === "rtl";
    const grow = { ArrowLeft: rtl ? -1 : 1, ArrowRight: rtl ? 1 : -1 }[e.key];
    if (grow) { e.preventDefault(); setW(clamp(w + grow * STEP)); }
    else if (e.key === "Home") { e.preventDefault(); setW(MIN); }
    else if (e.key === "End") { e.preventDefault(); setW(max()); }
  };
  return (
    <div ref={ref} className="panel-resizer" role="separator" tabIndex={0}
      aria-orientation="vertical" aria-label={tr("nav.resize_panel", "Resize the map and the panel")}
      aria-valuemin={MIN} aria-valuemax={max()} aria-valuenow={clamp(w)}
      title={tr("nav.resize_panel_tip", "Drag to resize. Double-click to reset.")}
      onPointerDown={down} onKeyDown={key} onDoubleClick={() => setW(DEF)} />
  );
}

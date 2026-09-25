// Shared chrome for the three globe apps (/, /transit-map/, /itinerary/):
// masthead + nav, view/theme/language controls, icons, the mobile sheet handle
// and the theme store. Before this file each app carried its own TopNav with a
// different link list; now the list comes from assets/site-nav.js and every
// page gets the same header.

const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useLayoutEffect: useLayoutEffectC, useCallback: useCallbackC } = React;

// i18n lookup that falls back to a literal when the key isn't translated.
function tr(key, fallback, vars) {
  if (!window.t) return fallback;
  const v = window.t(key, vars);
  return v === key ? fallback : v;
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
function IconUser(props) {
  return <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}><circle cx="8" cy="5.6" r="2.9" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M2.6 14.2c.7-2.8 2.8-4.3 5.4-4.3s4.7 1.5 5.4 4.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

// Link to /account/ — only when accounts are switched on (assets/account.js);
// shows the signed-in person's initial.
function AccountLink() {
  const acct = window.ATLAS_ACCOUNT;
  const [, force] = useStateC(0);
  useEffectC(() => (acct && acct.enabled ? acct.onChange(() => force(x => x + 1)) : undefined), []);
  if (!acct || !acct.enabled) return null;
  const user = acct.state.user;
  const label = tr("nav.account", "Account");
  return (
    <a className={"mh-account" + (user ? " is-signed-in" : "")} href="/account/" aria-label={label} title={user && user.email ? user.email : label}>
      {user && user.email ? <span>{user.email.charAt(0).toUpperCase()}</span> : <IconUser />}
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
function ViewToggle({ value, onChange }) {
  const opts = [["globe3d", tr("mode.3d", "3D")], ["flat", tr("mode.2d", "2D")]];
  return (
    <div className="seg" role="group" aria-label={tr("nav.mode", "Globe view")}>
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

// Divider class for the first link of a new group (see `g` in assets/site-nav.js).
function grpStart(list, i) {
  return i > 0 && list[i].g !== list[i - 1].g ? "mh-grp-start" : "";
}

function LangSelect({ className }) {
  useLangTick();
  const cur = window.ATLAS_LANG || "en";
  return (
    <select className={"lang-select" + (className ? " " + className : "")} value={cur}
      aria-label={tr("nav.language", "Language")}
      onChange={(e) => window.setLang && window.setLang(e.target.value)}>
      {(window.LANGS || []).map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()} · {l.native}{l.beta ? " (beta)" : ""}</option>)}
    </select>
  );
}

// ─── Masthead ────────────────────────────────────────────────────────────
// Priority+ navigation: every link sits in one row; whatever doesn't fit folds
// into "More" from the end of the list. An invisible measuring copy keeps the
// widths current when the language (and so label length) changes.
function Masthead({ view, onView, theme, onTheme, onHelp }) {
  useLangTick();
  const nav = window.SITE_NAV || { NAV: [], SUPPORT: null, isCurrent: () => false };
  const items = nav.NAV;
  const path = location.pathname;
  // A reader of Turkish is sent to the Turkish twin of every page that has one.
  const lang = window.ATLAS_LANG || "en";
  const to = (h) => (nav.localHref ? nav.localHref(h, lang) : h);
  const [fit, setFit] = useStateC(items.length);
  const [moreOpen, setMoreOpen] = useStateC(false);
  const [sheetOpen, setSheetOpen] = useStateC(false);
  const navRef = useRefC(null);
  const measureRef = useRefC(null);
  const headerRef = useRefC(null);

  const label = (it) => tr(it.key, it.en);

  useLayoutEffectC(() => {
    const navEl = navRef.current, m = measureRef.current;
    if (!navEl || !m) return;
    const compute = () => {
      const widths = Array.from(m.children).map(li => li.getBoundingClientRect().width);
      const moreW = widths.pop(); // last child of the measurer is the More button
      const avail = navEl.clientWidth;
      if (!avail) return; // hidden (mobile uses the burger sheet)
      const total = widths.reduce((a, b) => a + b, 0);
      if (total <= avail) { setFit(widths.length); return; }
      let used = moreW, n = 0;
      while (n < widths.length && used + widths[n] <= avail) { used += widths[n]; n++; }
      setFit(n);
    };
    compute();
    // Re-measure when the bar resizes, when the measuring copy's labels change
    // width (language switch), and once web fonts have loaded.
    const ro = new ResizeObserver(compute);
    ro.observe(navEl);
    ro.observe(m);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(compute);
    return () => ro.disconnect();
  }, []);

  // Close menus on outside tap (pointerdown so iOS taps count) and on Escape.
  useEffectC(() => {
    if (!moreOpen && !sheetOpen) return;
    const onDown = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) { setMoreOpen(false); setSheetOpen(false); } };
    const onKey = (e) => { if (e.key === "Escape") { setMoreOpen(false); setSheetOpen(false); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [moreOpen, sheetOpen]);

  const overflow = items.slice(fit);
  const moreLabel = tr("nav.more", "More");

  return (
    <header ref={headerRef} className={"masthead" + (sheetOpen ? " is-open" : "")}>
      <a className="skip-link" href="#panel">{tr("a11y.skip", "Skip to content")}</a>
      <a className="brand" href={to("/")} aria-label="travelnow.info">
        <BrandMark className="brand-mark" />
        <span className="brand-word">travelnow<span className="brand-tld">.info</span></span>
      </a>

      <nav ref={navRef} className="mh-nav" aria-label={tr("nav.main", "Main")}>
        <ul className="mh-links">
          {items.map((it, i) => (
            <li key={it.href} hidden={i >= fit} className={grpStart(items, i)}>
              <a className="mh-link" href={to(it.href)} aria-current={nav.isCurrent(it, path) ? "page" : undefined}>{label(it)}</a>
            </li>
          ))}
        </ul>
        <div className="mh-more" hidden={overflow.length === 0}>
          <button type="button" className="mh-link mh-more-btn" aria-expanded={moreOpen} onClick={() => setMoreOpen(o => !o)}>
            {moreLabel}<IconCaret />
          </button>
          {moreOpen && (
            <ul className="mh-menu">
              {overflow.map((it, j) => (
                <li key={it.href} className={grpStart(overflow, j)}><a href={to(it.href)} aria-current={nav.isCurrent(it, path) ? "page" : undefined}>{label(it)}</a></li>
              ))}
            </ul>
          )}
        </div>
        {/* Invisible copy used only for measuring label widths. */}
        <ul ref={measureRef} className="mh-links" aria-hidden="true"
          style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", height: "auto", left: 0, top: 0 }}>
          {items.map(it => <li key={it.href}><span className="mh-link">{label(it)}</span></li>)}
          <li><span className="mh-link mh-more-btn">{moreLabel}<IconCaret /></span></li>
        </ul>
      </nav>

      <div className="mh-tools">
        <AccountLink />
        {onView && <ViewToggle value={view} onChange={onView} />}
        {onTheme && <ThemeToggle value={theme} onChange={onTheme} />}
        <LangSelect />
        {onHelp && (
          <button type="button" className="mh-help" onClick={onHelp} aria-label={tr("nav.help", "What is this?")} title={tr("nav.help", "What is this?")}>?</button>
        )}
        {nav.SUPPORT && (
          <a className="mh-support" href={nav.SUPPORT.href} target="_blank" rel="noopener">{tr(nav.SUPPORT.key, nav.SUPPORT.en)}</a>
        )}
      </div>

      <button type="button" className="mh-burger" aria-label={tr("nav.menu", "Menu")} aria-expanded={sheetOpen} onClick={() => setSheetOpen(o => !o)}>
        <IconMenu open={sheetOpen} />
      </button>

      <div className="mh-sheet">
        {items.map(it => (
          <a key={it.href} className={"mh-sheet-link " + grpStart(items, items.indexOf(it))} href={to(it.href)} aria-current={nav.isCurrent(it, path) ? "page" : undefined}>{label(it)}</a>
        ))}
        <div className="mh-sheet-foot">
          <LangSelect />
          {nav.SUPPORT && <a className="mh-support" style={{ display: "inline-block" }} href={nav.SUPPORT.href} target="_blank" rel="noopener">{tr(nav.SUPPORT.key, nav.SUPPORT.en)}</a>}
        </div>
      </div>
    </header>
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
    const snaps = () => [96, Math.round(window.innerHeight * 0.48), Math.round(window.innerHeight * 0.88)];
    const MIN = 72, max = () => window.innerHeight * 0.92;
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
      if (h > hi) return hi + rubber(h - hi, window.innerHeight - hi);
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
        const want = Math.round(window.innerHeight * fraction);
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
function Caption({ n, children, aside }) {
  return (
    <span className="p-cap">
      {n != null && <span className="p-cap-n">{String(n).padStart(2, "0")}</span>}
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

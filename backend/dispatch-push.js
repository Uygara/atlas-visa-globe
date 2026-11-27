// dispatch-push.js — the daily push notifications for the iOS/Android app.
//
// A notification is a decision, not a nudge, so only three things ever qualify, and
// only for the person's own passport, watched countries and planned trip:
//   1. a visa rule changed ("Japan: Visa-free → eVisa") — from data/changelog.js
//   2. the government safety level of a planned/watched country changed — the
//      strictest of UK/US/CA today vs the version committed yesterday (git HEAD)
//   3. the apply-by date of a dated stop in a saved trip (atlas.trips) is a week away,
//      or has come: same lead time as the planner (processing time on record, else
//      14 days, plus a week of margin; components/itinerary-app.jsx plApplyPlan)
// Never marketing, never "something changed": at most ONE notification per device
// per day, quiet hours 21:00–08:00 on the phone's own clock (a rule that lands at
// night is sent the next morning), and each change is sent once.
//
// Who to notify: users/{uid}/devices/{token} (written by the app when the person
// turns notifications on — assets/app-native.js) joined with the person's synced
// document users/{uid} (passport, watchlist, itinerary). Needs an Admin
// credential: the FIREBASE_SERVICE_ACCOUNT secret (JSON). Without it the step
// logs "skipping" and exits 0, like dispatch-alerts.js.
//
//   node dispatch-push.js                 send
//   node dispatch-push.js --dry-run       print what would be sent
//   node dispatch-push.js --fixture f.json --dry-run    same, from a file (tests)

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const DRY = process.argv.includes("--dry-run");
const FIXTURE = (() => { const i = process.argv.indexOf("--fixture"); return i > 0 ? process.argv[i + 1] : null; })();
const WINDOW_DAYS = 3;        // a change stays eligible this long (covers a night-time skip)
const QUIET_FROM = 21, QUIET_TO = 8;
const SENT_KEEP = 60;

// ── short texts, per language ────────────────────────────────────────────
const TXT = {
  en: { apply_week_title: "{c}: apply by {d}", apply_due_title: "{c}: time to apply", apply_body: "Your trip starts on {a}. Processing takes up to {n} days; we add a week of margin.", apply_body_default: "Your trip starts on {a}. We have no processing time on record, so we count 2 weeks plus a week of margin.", rule_body: "The rule for your passport changed on {d}.", many_title: "{n} visa rules changed for your passport", many_body: "{list}", safety_title: "{c}: safety advice {a} → {b}", safety_body: "Government travel advice changed for a country on your trip.", lvl: "level" },
  tr: { apply_week_title: "{c}: en geç {d} tarihinde başvur", apply_due_title: "{c}: başvuru zamanı geldi", apply_body: "Seyahatin {a} tarihinde başlıyor. İşlem süresi {n} güne kadar; bir hafta da pay ekliyoruz.", apply_body_default: "Seyahatin {a} tarihinde başlıyor. Kayıtlı işlem süresi yok; 2 hafta ve bir haftalık pay hesaplıyoruz.", rule_body: "Pasaportun için kural {d} tarihinde değişti.", many_title: "Pasaportun için {n} vize kuralı değişti", many_body: "{list}", safety_title: "{c}: güvenlik uyarısı {a} → {b}", safety_body: "Seyahatindeki bir ülke için devlet uyarısı değişti.", lvl: "seviye" },
  es: { apply_week_title: "{c}: solicita antes del {d}", apply_due_title: "{c}: es hora de solicitar", apply_body: "Tu viaje empieza el {a}. La tramitación tarda hasta {n} días; añadimos una semana de margen.", apply_body_default: "Tu viaje empieza el {a}. No tenemos el plazo de tramitación, así que contamos 2 semanas más una de margen.", rule_body: "La norma para tu pasaporte cambió el {d}.", many_title: "{n} normas de visado cambiaron para tu pasaporte", many_body: "{list}", safety_title: "{c}: aviso de seguridad {a} → {b}", safety_body: "Cambió el aviso oficial de viaje de un país de tu viaje.", lvl: "nivel" },
  de: { apply_week_title: "{c}: beantrage bis {d}", apply_due_title: "{c}: Zeit für den Antrag", apply_body: "Deine Reise beginnt am {a}. Die Bearbeitung dauert bis zu {n} Tage; wir rechnen eine Woche Puffer dazu.", apply_body_default: "Deine Reise beginnt am {a}. Uns liegt keine Bearbeitungszeit vor, daher rechnen wir mit 2 Wochen plus einer Woche Puffer.", rule_body: "Die Regel für deinen Pass hat sich am {d} geändert.", many_title: "{n} Visaregeln für deinen Pass geändert", many_body: "{list}", safety_title: "{c}: Sicherheitshinweis {a} → {b}", safety_body: "Der amtliche Reisehinweis für ein Land deiner Reise hat sich geändert.", lvl: "Stufe" },
  fr: { apply_week_title: "{c} : faites la demande avant le {d}", apply_due_title: "{c} : il est temps de faire la demande", apply_body: "Votre voyage commence le {a}. Le traitement prend jusqu'à {n} jours ; nous ajoutons une semaine de marge.", apply_body_default: "Votre voyage commence le {a}. Nous n'avons pas de délai de traitement, nous comptons donc 2 semaines plus une semaine de marge.", rule_body: "La règle pour votre passeport a changé le {d}.", many_title: "{n} règles de visa ont changé pour votre passeport", many_body: "{list}", safety_title: "{c} : conseil de sécurité {a} → {b}", safety_body: "Le conseil officiel aux voyageurs a changé pour un pays de votre voyage.", lvl: "niveau" },
  ar: { apply_week_title: "{c}: قدّم طلبك قبل {d}", apply_due_title: "{c}: حان وقت تقديم الطلب", apply_body: "تبدأ رحلتك في {a}. تستغرق المعالجة حتى {n} يومًا، ونضيف أسبوعًا احتياطيًا.", apply_body_default: "تبدأ رحلتك في {a}. لا تتوفر لدينا مدة المعالجة، لذا نحسب أسبوعين وأسبوعًا احتياطيًا.", rule_body: "تغيّرت القاعدة الخاصة بجواز سفرك بتاريخ {d}.", many_title: "تغيّرت {n} قواعد تأشيرة لجواز سفرك", many_body: "{list}", safety_title: "{c}: تنبيه السلامة {a} ← {b}", safety_body: "تغيّر التنبيه الحكومي للسفر لبلد ضمن رحلتك.", lvl: "المستوى" },
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));

// ── the site's own data layer, in a sandbox ───────────────────────────────
function loadWindow() {
  const win = { addEventListener() {}, dispatchEvent() {}, CustomEvent: function () {} };
  const sandbox = {
    window: win, document: { documentElement: { setAttribute() {}, getAttribute() { return null; } }, addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} }, navigator: { language: "en" },
    CustomEvent: function () {}, console, Intl, Date, Math, JSON,
  };
  win.window = win; Object.assign(win, { localStorage: sandbox.localStorage, navigator: sandbox.navigator, document: sandbox.document });
  vm.createContext(sandbox);
  for (const f of ["i18n.js", "countries.js", "country-names.js", "changelog.js", "passports.js", "visa-overrides.js", "visa-fees.js"]) {
    vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), sandbox, { filename: f });
  }
  return win;
}

// ── pure decision functions (tested in test-dispatch-push.js) ────────────
function parseStored(raw) {
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}
// users/{uid}.data = { "<key>": { v: "<raw localStorage string>", t } } → who they are
function profileOf(data) {
  const get = (k) => (data && data[k] && data[k].v != null ? parseStored(data[k].v) : null);
  const passport = typeof get("atlas.passport") === "string" ? get("atlas.passport").toUpperCase() : null;
  const watch = new Set((Array.isArray(get("atlas.watchlist")) ? get("atlas.watchlist") : []).map(String));
  const it = get("atlas.itinerary") || {};
  const stops = new Set((Array.isArray(it.stops) ? it.stops : []).map((s) => (typeof s === "string" ? s : s && (s.iso2 || s.iso))).filter(Boolean));
  const lang = ["en", "tr", "es", "de", "fr", "ar"].includes(get("atlas.lang")) ? get("atlas.lang") : null;
  const extra = Array.isArray(get("atlas.passports")) ? get("atlas.passports") : [];
  const passports = [...new Set([passport, ...extra.map((x) => String(x || "").toUpperCase())].filter((x) => /^[A-Z]{2}$/.test(x || "")))];
  // Dated stops of every saved trip (assets/trips-core.js). A stop without its own date
  // takes the trip's first date, as the planner does.
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const tr = get("atlas.trips");
  const dated = [];
  for (const trip of (tr && Array.isArray(tr.trips) ? tr.trips : [])) {
    const ss = Array.isArray(trip && trip.stops) ? trip.stops : [];
    const first = (ss.find((x) => x && DATE.test(x.arrive || "")) || {}).arrive || "";
    for (const st of ss) {
      const iso = String((st && st.iso) || "").toUpperCase(), arrive = DATE.test((st && st.arrive) || "") ? st.arrive : first;
      if (/^[A-Z]{2}$/.test(iso) && arrive) dated.push({ iso, arrive });
    }
  }
  return { passport, passports, watch, stops, lang, dated };
}

// Visa-rule changes for this person, newest first. Watched/planned countries lead.
function pickVisaChanges(changelog, profile, sent, today) {
  if (!profile.passport) return [];
  const cutoff = new Date(today + "T00:00:00Z").getTime() - (WINDOW_DAYS - 1) * 864e5;
  const seen = new Set();
  return (changelog || [])
    .filter((e) => e && e.affects && Array.isArray(e.affects.passports) && e.affects.passports.includes(profile.passport))
    .filter((e) => new Date(e.date + "T00:00:00Z").getTime() >= cutoff && e.statusFrom && e.statusTo && e.statusFrom !== e.statusTo)
    .map((e) => ({ kind: "visa", key: `v|${e.date}|${profile.passport}|${e.affects.dest}`, dest: e.affects.dest, from: e.statusFrom, to: e.statusTo, date: e.date }))
    .filter((c) => !sent.has(c.key) && !seen.has(c.key) && seen.add(c.key))
    .sort((a, b) => (watched(b, profile) - watched(a, profile)) || b.date.localeCompare(a.date));
}
const watched = (c, p) => (p.watch.has(c.dest) || p.stops.has(c.dest) ? 1 : 0);

const strictest = (c) => Math.max(0, ...["uk", "us", "ca"].map((s) => (c && c[s] && Number(c[s].level)) || 0));
// Safety level moved for a country the person plans to visit or watches.
function pickSafetyChanges(prev, cur, profile, sent, today) {
  const out = [];
  for (const iso of new Set([...profile.stops, ...profile.watch])) {
    const a = strictest(prev && prev[iso]), b = strictest(cur && cur[iso]);
    if (!a || !b || a === b) continue;
    const key = `s|${today}|${iso}|${b}`;
    if (!sent.has(key)) out.push({ kind: "safety", key, dest: iso, from: a, to: b, date: today, planned: profile.stops.has(iso) });
  }
  return out.sort((x, y) => (y.planned - x.planned) || (y.to - y.from) - (x.to - x.from));
}

// Apply-by reminders for dated trip stops that need an application (eTA, eVisa, visa).
// The easiest of the person's passports decides, like the planner. Two moments per stop:
// a week before the apply-by date ("week") and on or after it while the trip is ahead ("due").
const DAY = 864e5;
function procDays(fee) {
  const t = fee && fee.processingDays;
  if (!t) return 0;
  const m = t.match(/(\d+)\s*(?:–|-|to)\s*(\d+)\s*(week|day|month)/i) || t.match(/(\d+)\s*(week|day|month)/i);
  if (!m) return 0;
  const n = parseInt(m[m.length - 2] || m[1], 10), u = m[m.length - 1].toLowerCase();
  return u.startsWith("week") ? n * 7 : u.startsWith("month") ? n * 30 : n;
}
const RANK = ["idc", "vf", "eta", "ev", "voa", "vr", "ban"];
function pickApplyReminders(profile, sent, today, W) {
  const passports = profile.passports && profile.passports.length ? profile.passports : (profile.passport ? [profile.passport] : []);
  if (!passports.length || !W || !W.resolveStatus) return [];
  const t0 = Date.parse(today + "T00:00:00Z"), out = [], seen = new Set();
  for (const st of profile.dated || []) {
    const arr = Date.parse(st.arrive + "T00:00:00Z");
    if (!(arr > t0) || passports.includes(st.iso)) continue;
    let best = null;
    for (const p of passports) {
      const r = W.resolveStatus(p, st.iso) || {};
      const k = RANK.indexOf(r.status);
      if (k >= 0 && (!best || k < best.k)) best = { p, k, status: r.status };
    }
    if (!best || !["eta", "ev", "vr"].includes(best.status)) continue;
    const proc = procDays(W.visaFee && W.visaFee(best.p, st.iso));
    const applyBy = arr - ((proc || 14) + 7) * DAY;
    const left = Math.round((applyBy - t0) / DAY);
    const stage = left <= 0 ? "due" : left <= 7 ? "week" : null;
    if (!stage) continue;
    const key = `a|${st.iso}|${st.arrive}|${stage}`;
    if (sent.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: "apply", key, dest: st.iso, stage, arrive: st.arrive, applyBy: new Date(applyBy).toISOString().slice(0, 10), proc, date: today });
  }
  return out.sort((a, b) => a.applyBy.localeCompare(b.applyBy));
}

function isQuiet(tz, now) {
  let h;
  try { h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz || "UTC" }).format(now)); } catch (e) { h = now.getUTCHours(); }
  return h >= QUIET_FROM || h < QUIET_TO;
}

// One notification from the person's changes: the top change on its own, or a count.
function compose(changes, lang, W) {
  const t = TXT[lang] || TXT.en;
  W.ATLAS_LANG = lang in TXT ? lang : "en";
  const name = (iso) => (W.countryName ? W.countryName(iso) : iso);
  const st = (s) => W.t("status." + s);
  const first = changes[0];
  const dateText = (d) => { try { return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z")); } catch (e) { return d; } };
  const visa = changes.filter((c) => c.kind === "visa");
  if (first.kind === "apply") {
    const body = first.proc ? fmt(t.apply_body, { a: dateText(first.arrive), n: first.proc }) : fmt(t.apply_body_default, { a: dateText(first.arrive) });
    const title = first.stage === "due" ? fmt(t.apply_due_title, { c: name(first.dest) }) : fmt(t.apply_week_title, { c: name(first.dest), d: dateText(first.applyBy) });
    return { title, body, path: "/itinerary/index.html", keys: [first.key] };
  }
  if (first.kind === "safety") {
    return { title: fmt(t.safety_title, { c: name(first.dest), a: first.from, b: first.to }), body: t.safety_body, path: "/safety-map/index.html", keys: [first.key] };
  }
  if (visa.length === 1 || changes.length === 1) {
    return { title: `${name(first.dest)}: ${st(first.from)} → ${st(first.to)}`, body: fmt(t.rule_body, { d: dateText(first.date) }), path: "/", keys: [first.key] };
  }
  const list = visa.slice(0, 3).map((c) => `${name(c.dest)}: ${st(c.from)} → ${st(c.to)}`).join("; ");
  return { title: fmt(t.many_title, { n: visa.length }), body: fmt(t.many_body, { list }), path: "/", keys: visa.map((c) => c.key) };
}

// ── advisories: yesterday's committed file vs today's ────────────────────
function advisoriesAt(rev) {
  try {
    const text = rev ? execFileSync("git", ["show", `${rev}:data/travel-advisories.js`], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 }) : fs.readFileSync(path.join(DATA, "travel-advisories.js"), "utf8");
    const w = {}; new Function("window", text)(w);
    return (w.TRAVEL_ADVISORIES && w.TRAVEL_ADVISORIES.countries) || {};
  } catch (e) { return null; }
}

// ── main ─────────────────────────────────────────────────────────────────
async function collect() {
  if (FIXTURE) return JSON.parse(fs.readFileSync(FIXTURE, "utf8")).devices;
  const admin = require("firebase-admin");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const db = admin.firestore();
  const snap = await db.collectionGroup("devices").get();
  const users = new Map(), out = [];
  for (const d of snap.docs) {
    const uid = d.ref.parent.parent.id;
    if (!users.has(uid)) { const u = await db.doc(`users/${uid}`).get(); users.set(uid, u.exists ? (u.data().data || {}) : {}); }
    out.push({ uid, token: d.id, ref: d.ref, ...d.data(), userData: users.get(uid) });
  }
  return out;
}

async function main() {
  if (!FIXTURE && !process.env.FIREBASE_SERVICE_ACCOUNT) { console.log("FIREBASE_SERVICE_ACCOUNT not set — skipping push."); return; }
  const W = loadWindow();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const prevAdv = advisoriesAt("HEAD"), curAdv = advisoriesAt(null);
  const devices = await collect();
  console.log(`${devices.length} device(s)`);

  const messages = [], bookkeeping = [];
  for (const dev of devices) {
    const profile = profileOf(dev.userData);
    const sent = new Set(dev.sent || []);
    const changes = [...pickSafetyChanges(prevAdv, curAdv, profile, sent, today), ...pickApplyReminders(profile, sent, today, W), ...pickVisaChanges(W.CHANGELOG, profile, sent, today)];
    if (!changes.length) continue;
    if (isQuiet(dev.tz, now)) { console.log(`  quiet hours for ${dev.token.slice(0, 8)}… — held for later`); continue; }
    const lang = profile.lang || (TXT[dev.lang] ? dev.lang : "en");
    const m = compose(changes, lang, W);
    const msg = {
      token: dev.token,
      notification: { title: m.title, body: m.body },
      data: { path: m.path },
    };
    if (dev.platform === "web") {
      // A browser opens the website: app paths ("/safety-map/index.html") become site URLs.
      let web = m.path.replace(/index\.html$/, "");
      if (lang === "tr" && web === "/") web = "/tr/";
      msg.webpush = { fcmOptions: { link: "https://travelnow.info" + web }, notification: { icon: "https://travelnow.info/assets/icon-512.png" } };
    } else {
      msg.android = { priority: "normal", notification: { channelId: "rules" } };
    }
    messages.push(msg);
    bookkeeping.push({ dev, keys: m.keys });
    console.log(`  → ${dev.token.slice(0, 8)}… [${lang}] ${m.title}`);
  }
  if (DRY || !messages.length) { console.log(DRY ? `(dry-run) ${messages.length} notification(s) not sent` : "nothing to send"); return messages; }

  const admin = require("firebase-admin");
  const res = await admin.messaging().sendEach(messages);
  let ok = 0, dead = 0;
  for (let i = 0; i < res.responses.length; i++) {
    const r = res.responses[i], b = bookkeeping[i];
    if (r.success) {
      ok++;
      const sent = [...(b.dev.sent || []), ...b.keys].slice(-SENT_KEEP);
      await b.dev.ref.update({ sent, lastPush: today }).catch(() => {});
    } else if (/registration-token-not-registered|invalid-registration-token/.test(r.error && r.error.code)) {
      dead++; await b.dev.ref.delete().catch(() => {});     // uninstalled or expired: stop keeping it
    } else console.warn(`  ! ${b.dev.token.slice(0, 8)}…: ${r.error && r.error.code}`);
  }
  console.log(`sent ${ok}, removed ${dead} stale token(s)`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { parseStored, profileOf, pickVisaChanges, pickSafetyChanges, pickApplyReminders, procDays, isQuiet, compose, TXT, loadWindow };

#!/usr/bin/env node
// Instagram carousel generator: 1080x1350 PNG slides plus a caption file, built only from site data.
//
//   node scripts/social-cards.js month [YYYY-MM] [--lang en|tr]   monthly passport power carousel
//   node scripts/social-cards.js passport <iso> [--lang en|tr]    one slide for a single passport
//   node scripts/social-cards.js week [YYYY-MM-DD] [--lang en|tr] changes in the 7 days ending on that date
//   node scripts/social-cards.js text <spec.json>                 slides from a hand-written spec (see textSlides)
//   Any kind: --out <dir> writes the files straight into <dir> instead of social/out/<kind>-<key>-<lang>/.
//
// Without --lang both languages are rendered.
// Output: social/out/<kind>-<key>-<lang>/01.png ... and caption.txt (folder is git-ignored).
// Needs a local Chrome (CHROME_PATH to override).

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const puppeteer = require(path.join(ROOT, "tools", "node_modules", "puppeteer-core"));
const { BRAND_MARK } = require("./partials");
const { analyse } = require("./generate-reports");
const { DATA, LOC, computeRanks, passportName } = require("./generate-seo");
const CHANGELOG = (() => {
  const ctx = {};
  ctx.window = ctx;
  require("vm").runInNewContext(fs.readFileSync(path.join(ROOT, "data", "changelog.js"), "utf8"), ctx);
  return ctx.CHANGELOG;
})();

const OUT = path.join(ROOT, "social", "out");
const SITE = "travelnow.info";
const W = 1080, H = 1350;
const TOP = 6;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const INTL = { en: "en-GB", tr: "tr-TR" };
const monthLabel = (ym, lang) =>
  new Intl.DateTimeFormat(INTL[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(ym + "-01T00:00:00Z"));
const dateLabel = (iso, lang) =>
  new Intl.DateTimeFormat(INTL[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

const FLAG = {};
for (const c of DATA.COUNTRIES) FLAG[c.iso2] = c.flag;
function cn(iso, lang) {
  DATA.ATLAS_LANG = lang;
  return DATA.countryName(iso);
}

// Copy. Numbers are passed in; nothing here states a figure by itself.
const T = {
  en: {
    cover: { eyebrow: "Passport power", changes: (n) => (n === 1 ? "visa rule change" : "visa rule changes"),
      passports: (n) => (n === 1 ? "passport affected" : "passports affected"), swipe: "Swipe for the details" },
    gains: { eyebrow: "BIGGEST GAINS", title: "Passports that gained the most", unit: (n) => (n === 1 ? "destination" : "destinations"),
      note: "Net change in destinations with easy access: visa-free, ID card travel, travel authorization or visa on arrival." },
    losses: { eyebrow: "BIGGEST LOSSES", title: "Passports that lost the most", unit: (n) => (n === 1 ? "destination" : "destinations"),
      note: "Net change in destinations with easy access: visa-free, ID card travel, travel authorization or visa on arrival." },
    dests: { eyebrow: "DESTINATIONS", title: "Destinations that changed their rules most", unit: (n) => (n === 1 ? "change" : "changes"),
      note: "Number of passport and status changes recorded for each destination." },
    close: { eyebrow: "FULL REPORT", lead: "Full report", data: (d) => `Data: ${SITE}, ${d}`, partial: "Month not over yet. Figures cover changes up to this date." },
    passport: { eyebrow: "PASSPORT", label: "destinations without a visa application", rank: "GLOBAL RANK", rankLine: (r, n) => `Ranked #${r} of ${n} passports` },
    path: (ym) => `/reports/${ym}/`, passportPath: (iso) => `/passport/${iso.toLowerCase()}/`,
  },
  tr: {
    cover: { eyebrow: "Pasaport gücü", changes: () => "vize kuralı değişti",
      passports: () => "pasaport etkilendi", swipe: "Ayrıntılar için kaydır" },
    gains: { eyebrow: "EN ÇOK KAZANANLAR", title: "En çok kazanan pasaportlar", unit: () => "ülke",
      note: "Kolay erişimli ülke sayısındaki net değişim: vizesiz, kimlikle giriş, seyahat izni veya varışta vize." },
    losses: { eyebrow: "EN ÇOK KAYBEDENLER", title: "En çok kaybeden pasaportlar", unit: () => "ülke",
      note: "Kolay erişimli ülke sayısındaki net değişim: vizesiz, kimlikle giriş, seyahat izni veya varışta vize." },
    dests: { eyebrow: "VARIŞ ÜLKELERİ", title: "Kurallarını en çok değiştiren ülkeler", unit: () => "değişiklik",
      note: "Her ülke için kaydedilen pasaport ve durum değişikliği sayısı." },
    close: { eyebrow: "TAM RAPOR", lead: "Tam rapor", data: (d) => `Veri: ${SITE}, ${d}`, partial: "Ay henüz bitmedi. Rakamlar bu tarihe kadarki değişiklikleri kapsar." },
    passport: { eyebrow: "PASAPORT", label: "ülkeye vize başvurusu yapmadan giriş", rank: "DÜNYA SIRALAMASI", rankLine: (r, n) => `${n} pasaport arasında ${r}. sıra` },
    path: (ym) => `/tr/reports/${ym}/`, passportPath: (iso) => `/tr/passport/${iso.toLowerCase()}/`,
  },
};

function chromePath() {
  const cands = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  const found = cands.find((c) => fs.existsSync(c));
  if (!found) throw new Error("No Chrome found, set CHROME_PATH");
  return found;
}

// ── HTML ─────────────────────────────────────────────────────────────────────
const CSS = (tokens) => `${tokens}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:var(--paper)}
.card{position:relative;width:${W}px;height:${H}px;box-sizing:border-box;background:var(--paper);color:var(--ink);font-family:var(--font-sans)}
.top{position:absolute;left:84px;right:84px;top:76px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px;font:600 40px/1 var(--font-display);letter-spacing:0;color:var(--ink)}
.top::after{content:"";position:absolute;left:0;right:0;top:66px;height:1px;background:var(--rule-strong)}
.brand svg{width:40px;height:40px}
.brand .tld{font-weight:500;color:var(--ink-3)}
.eyebrow{position:absolute;left:84px;top:196px;font:600 32px/1.2 var(--font-sans);color:var(--accent)}
.title{position:absolute;left:84px;right:84px;top:246px;font:600 88px/1.08 var(--font-display);letter-spacing:-.01em;color:var(--ink)}
.rows{position:absolute;left:84px;right:84px;top:480px;display:flex;flex-direction:column;gap:14px}
.row{display:flex;align-items:center;gap:26px;height:100px;border-bottom:1px solid var(--rule-strong);padding-bottom:8px}
.row .fl{font-size:68px;line-height:1;flex:none;width:92px;text-align:center}
.row .nm{flex:1;min-width:0;font:600 48px/1.05 var(--font-display);letter-spacing:-.015em;color:var(--ink);white-space:nowrap;overflow:hidden}
.row .v{flex:none;text-align:right;font:700 64px/1 var(--font-display);letter-spacing:-.02em;color:var(--ink)}
.row .v small{display:block;font:500 24px var(--font-sans);letter-spacing:0;color:var(--ink-3);margin-top:6px}
.row .v.up{color:var(--vf)}.row .v.down{color:var(--vr)}
.note{position:absolute;left:84px;right:84px;bottom:96px;font:500 30px/1.35 var(--font-sans);color:var(--ink-3)}
.big{font:600 280px/.85 var(--font-display);color:var(--ink);letter-spacing:-.03em}
.cap{font:500 46px/1.2 var(--font-sans);color:var(--ink-2)}
.row2{display:flex;align-items:center;gap:26px;height:112px;border-bottom:1px solid var(--rule-strong)}
.row2 .fl{font-size:60px;line-height:1;flex:none;width:92px;text-align:center}
.row2 .tx{flex:1;min-width:0}
.row2 .nm{font:600 44px/1.1 var(--font-display);letter-spacing:-.015em;color:var(--ink);white-space:nowrap;overflow:hidden}
.row2 .st{font:500 30px/1.2 var(--font-sans);color:var(--ink-3);margin-top:6px;white-space:nowrap;overflow:hidden}
.row2 .st b{font-weight:600;color:var(--vf)}
.txt{position:absolute;left:84px;right:84px;top:246px;bottom:190px;display:flex;flex-direction:column;justify-content:center;gap:48px}
.txt .ttl{flex:none;max-height:540px;overflow:hidden;padding-bottom:.12em;font:600 96px/1.1 var(--font-display);letter-spacing:-.01em;color:var(--ink);overflow-wrap:anywhere}
.txt .bd{flex:none;max-height:520px;overflow:hidden;font:500 46px/1.35 var(--font-sans);color:var(--ink-2);white-space:pre-line}
.link{position:absolute;left:84px;right:84px;top:560px;font:600 56px/1.2 var(--font-sans);letter-spacing:-.01em;color:var(--link);word-break:break-all}
`;
const shell = (tokens, lang, body, pg) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<style>${CSS(tokens)}</style></head><body><div class="card">
<div class="top"><div class="brand">${BRAND_MARK}<span>travelnow<span class="tld">.info</span></span></div></div>
${body}</div></body></html>`;

const rowsHtml = (rows) => `<div class="rows">${rows.map((r) =>
  `<div class="row"><span class="fl">${r.flag || ""}</span><span class="nm">${esc(r.name)}</span><span class="v ${r.cls || ""}">${esc(r.value)}<small>${esc(r.unit)}</small></span></div>`).join("")}</div>`;

// ── Month carousel ───────────────────────────────────────────────────────────
function monthData(m, lang) {
  const coll = new Intl.Collator(INTL[lang]);
  const pp = [...m.perPassport.entries()].map(([iso, net]) => ({ iso, net, name: cn(iso, lang) || iso, flag: FLAG[iso] }));
  const gains = pp.filter((x) => x.net > 0).sort((a, b) => b.net - a.net || coll.compare(a.name, b.name)).slice(0, TOP);
  const losses = pp.filter((x) => x.net < 0).sort((a, b) => a.net - b.net || coll.compare(a.name, b.name)).slice(0, TOP);
  const dests = [...m.perDest.entries()].map(([iso, list]) => ({ iso, n: list.length, name: cn(iso, lang) || iso, flag: FLAG[iso] }))
    .sort((a, b) => b.n - a.n || coll.compare(a.name, b.name)).slice(0, TOP);
  return { gains, losses, dests };
}

function monthSlides(m, lang, tokens) {
  const t = T[lang], d = monthData(m, lang), label = monthLabel(m.ym, lang), s = m.stats;
  const link = SITE + t.path(m.ym);
  const total = 3 + (d.losses.length ? 1 : 0) + 1;
  let i = 0;
  const pg = () => `${++i} / ${total}`;
  const slides = [];

  slides.push(shell(tokens, lang, `
<div class="eyebrow">${esc(t.cover.eyebrow)}</div>
<div class="title" style="font-size:130px;top:240px">${esc(label)}</div>
<div style="position:absolute;left:84px;top:560px"><div class="big">${s.changes}</div><div class="cap" style="margin-top:18px">${esc(t.cover.changes(s.changes))}</div></div>
<div style="position:absolute;left:84px;top:900px"><div class="big" style="font-size:200px">${s.passports}</div><div class="cap" style="margin-top:14px">${esc(t.cover.passports(s.passports))}</div></div>
<div class="note" style="bottom:100px">${esc(t.cover.swipe)}</div>`, pg()));

  const listSlide = (k, rows) => shell(tokens, lang, `
<div class="title">${esc(t[k].title)}</div>
${rowsHtml(rows)}
<div class="note">${esc(t[k].note)}</div>`, pg());

  slides.push(listSlide("gains", d.gains.map((x) => ({ ...x, value: `+${x.net}`, unit: t.gains.unit(x.net), cls: "up" }))));
  if (d.losses.length) slides.push(listSlide("losses", d.losses.map((x) => ({ ...x, value: `-${Math.abs(x.net)}`, unit: t.losses.unit(Math.abs(x.net)), cls: "down" }))));
  slides.push(listSlide("dests", d.dests.map((x) => ({ ...x, value: String(x.n), unit: t.dests.unit(x.n) }))));

  slides.push(shell(tokens, lang, `
<div class="title" style="font-size:84px;top:260px">${esc(t.close.lead)}</div>
<div class="link">${esc(link)}</div>
<div class="cap" style="position:absolute;left:84px;right:84px;top:780px;font-size:36px;color:var(--ink-3)">${esc(t.close.data(dateLabel(m.lastDate, lang)))}</div>
${m.partial ? `<div class="note">${esc(t.close.partial)}</div>` : ""}`, pg()));

  return { slides, d, link, label };
}

function monthCaption(m, lang, d, link, label) {
  const s = m.stats, date = dateLabel(m.lastDate, lang);
  // Name a single passport only when it leads alone; a tie would make the EN and TR
  // captions pick different names (they sort by localised name).
  const lead = (list) => (list[0] && !(list[1] && list[1].net === list[0].net) ? list[0] : null);
  const g = lead(d.gains), l = lead(d.losses);
  let lines;
  if (lang === "en") {
    lines = [
      `${label}: our daily snapshot recorded ${s.changes} visa rule ${s.changes === 1 ? "change" : "changes"}, affecting ${s.passports} ${s.passports === 1 ? "passport" : "passports"} and ${s.dests} ${s.dests === 1 ? "destination" : "destinations"}.`,
      g ? `The biggest gain was ${g.name} (+${g.net}).` : "",
      l ? `The biggest loss was ${l.name} (-${Math.abs(l.net)}).` : "",
      `Counts are net changes in destinations with easy access: visa-free, ID card travel, travel authorization or visa on arrival.`,
      `Full report: ${link}`,
      `Source: ${SITE} (data as of ${date})`,
    ];
  } else {
    lines = [
      `${label}: günlük verimiz ${s.changes} vize kuralı değişikliği kaydetti. Değişiklikler ${s.passports} pasaportu ve ${s.dests} varış ülkesini etkiledi.`,
      g ? `En çok kazanan ${g.name} oldu (+${g.net}).` : "",
      l ? `En çok kaybeden ${l.name} oldu (-${Math.abs(l.net)}).` : "",
      `Rakamlar, kolay erişimli ülke sayısındaki net değişimi gösterir: vizesiz, kimlikle giriş, seyahat izni veya varışta vize.`,
      `Tam rapor: ${link}`,
      `Kaynak: ${SITE} (veri ${date} tarihi itibarıyla)`,
    ];
  }
  const tags = lang === "en" ? "#visa #passport #travel #visafree #passportpower" : "#vize #pasaport #seyahat #vizesiz #pasaportgücü";
  return lines.filter(Boolean).join("\n") + "\n\n" + tags + "\n";
}

// ── Passport slide ───────────────────────────────────────────────────────────
function passportSlide(iso, lang, tokens, ranks) {
  const t = T[lang], c = DATA.COUNTRIES.find((x) => x.iso2 === iso);
  const mob = DATA.mobilityScore(DATA.tally(iso));
  const r = ranks.get(iso);
  const name = passportName(iso, lang);
  const size = name.length <= 9 ? 140 : name.length <= 14 ? 112 : name.length <= 22 ? 88 : 70;
  const link = SITE + t.passportPath(iso);
  const date = String(DATA.SNAPSHOT_DATE || "").slice(0, 10);
  const html = shell(tokens, lang, `
<div style="position:absolute;left:84px;right:84px;top:220px"><div style="font-size:190px;line-height:1">${c.flag}</div>
<div class="title" style="position:static;margin-top:30px;font-size:${size}px">${esc(name)}</div></div>
<div style="position:absolute;left:84px;top:690px"><div class="big" style="font-size:320px">${mob}</div>
<div class="cap" style="margin-top:22px;max-width:900px">${esc(t.passport.label)}</div></div>
${r ? `<div style="position:absolute;left:84px;top:1130px;font:500 36px var(--font-sans);color:var(--ink-2)">${esc(t.passport.rankLine(r.rank, ranks.size))}</div>` : ""}
<div class="note" style="bottom:96px">${esc(link)}</div>`, "");
  return { html, link, name, mob, rank: r ? r.rank : null, total: ranks.size, date };
}

function passportCaption(p, lang) {
  const date = p.date ? dateLabel(p.date, lang) : "";
  let lines;
  if (lang === "en") {
    lines = [
      `${p.name} passport holders can enter ${p.mob} destinations without a visa application.`,
      p.rank ? `That puts it at rank ${p.rank} of ${p.total} passports in our ranking.` : "",
      `Rules differ by destination and change often. See the full list for your passport at ${p.link}`,
      `Source: ${SITE}${date ? ` (data as of ${date})` : ""}`,
    ];
  } else {
    lines = [
      `${p.name} pasaportu sahipleri ${p.mob} ülkeye vize başvurusu yapmadan girebiliyor.`,
      p.rank ? `Bu, sıralamamızdaki ${p.total} pasaport arasında ${p.rank}. sıra demek.` : "",
      `Kurallar ülkeye göre değişir ve sık güncellenir. Pasaportun için tam listeye bak: ${p.link}`,
      `Kaynak: ${SITE}${date ? ` (veri ${date} tarihi itibarıyla)` : ""}`,
    ];
  }
  const tags = lang === "en" ? "#visa #passport #travel #visafree #passportranking" : "#vize #pasaport #seyahat #vizesiz #pasaportsıralaması";
  return lines.filter(Boolean).join("\n") + "\n\n" + tags + "\n";
}

// ── Week carousel ────────────────────────────────────────────────────────────
const addDays = (iso, n) => new Date(new Date(iso + "T00:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
const rangeLabel = (a, b, lang) => {
  const f = (iso, o) => new Intl.DateTimeFormat(INTL[lang], { ...o, timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const full = { day: "numeric", month: "long", year: "numeric" };
  const from = f(a, a.slice(0, 4) === b.slice(0, 4) ? { day: "numeric", month: "long" } : full);
  return lang === "tr" ? `${from} ile ${f(b, full)} arası` : `${from} to ${f(b, full)}`;
};

function weekData(end, lang) {
  const start = addDays(end, -6);
  const entries = CHANGELOG.filter((e) => e.date >= start && e.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  // Net each (passport, dest) pair: first from, last to, drop if equal (same as analyse()).
  const pairs = new Map();
  for (const e of entries) for (const p of e.affects.passports) {
    const k = p + ">" + e.affects.dest, cur = pairs.get(k);
    if (!cur) pairs.set(k, { passport: p, dest: e.affects.dest, from: e.statusFrom, to: e.statusTo });
    else cur.to = e.statusTo;
  }
  const net = [...pairs.values()].filter((x) => x.from !== x.to);
  const coll = new Intl.Collator(INTL[lang]);
  const byDest = new Map();
  for (const x of net) { if (!byDest.has(x.dest)) byDest.set(x.dest, []); byDest.get(x.dest).push(x); }
  const dests = [...byDest.entries()].map(([iso, list]) => ({
    iso, flag: FLAG[iso], name: cn(iso, lang) || iso,
    list: list.map((x) => ({ ...x, pname: cn(x.passport, lang) || x.passport, flag: FLAG[x.passport] })).sort((a, b) => coll.compare(a.pname, b.pname)),
  })).sort((a, b) => b.list.length - a.list.length || coll.compare(a.name, b.name));
  return { start, end, net, dests, passports: new Set(net.map((x) => x.passport)).size };
}

const TW = {
  en: { eyebrow: "THIS WEEK", title: "This week in visa rules", changes: (n) => (n === 1 ? "visa rule change" : "visa rule changes"),
    passports: (n) => (n === 1 ? "passport affected" : "passports affected"), more: (n) => `+${n} more`,
    close: "Check your passport", path: "", partial: "Net change over the week, from our daily snapshot." },
  tr: { eyebrow: "BU HAFTA", title: "Bu hafta vize kuralları", changes: () => "vize kuralı değişti",
    passports: () => "pasaport etkilendi", more: (n) => `+${n} tane daha`,
    close: "Pasaportunu kontrol et", path: "tr/", partial: "Haftalık net değişim, günlük verimizden." },
};

function weekSlides(w, lang, tokens) {
  const t = TW[lang], st = LOC[lang].status, link = SITE + "/" + t.path;
  const shown = w.dests.slice(0, 4);
  const total = 2 + shown.length;
  let i = 0;
  const pg = () => `${++i} / ${total}`;
  const slides = [];
  slides.push(shell(tokens, lang, `
<div class="title" style="font-size:118px">${esc(t.title)}</div>
<div class="cap" style="position:absolute;left:84px;top:560px;font-size:36px;color:var(--ink-3)">${esc(rangeLabel(w.start, w.end, lang))}</div>
<div style="position:absolute;left:84px;top:680px"><div class="big" style="font-size:260px">${w.net.length}</div><div class="cap" style="margin-top:16px">${esc(t.changes(w.net.length))}</div></div>
<div style="position:absolute;left:84px;top:1020px"><div class="big" style="font-size:170px">${w.passports}</div><div class="cap" style="margin-top:12px">${esc(t.passports(w.passports))}</div></div>`, pg()));
  for (const d of shown) {
    const rows = d.list.slice(0, d.list.length > 6 ? 5 : 6);
    const rest = d.list.length - rows.length;
    const rh = rows.map((r) => `<div class="row2"><span class="fl">${r.flag || ""}</span><div class="tx"><div class="nm">${esc(r.pname)}</div><div class="st">${esc(st[r.from] || r.from)} → <b>${esc(st[r.to] || r.to)}</b></div></div></div>`).join("")
      + (rest > 0 ? `<div class="row2"><span class="fl"></span><div class="tx"><div class="nm" style="color:var(--ink-3)">${esc(t.more(rest))}</div></div></div>` : "");
    const size = d.name.length <= 12 ? 100 : d.name.length <= 20 ? 80 : 64;
    slides.push(shell(tokens, lang, `
<div class="title" style="font-size:${size}px;display:flex;align-items:center;gap:28px"><span style="line-height:1">${d.flag || ""}</span><span>${esc(d.name)}</span></div>
<div class="rows" style="top:400px;gap:10px">${rh}</div>`, pg()));
  }
  slides.push(shell(tokens, lang, `
<div class="title" style="font-size:96px;top:260px">${esc(t.close)}</div>
<div class="link">${esc(link)}</div>
<div class="note">${esc(t.partial)}</div>`, pg()));
  return { slides, link };
}

function weekCaption(w, lang, link, date0) {
  const n = w.net.length, rng = rangeLabel(w.start, w.end, lang), date = dateLabel(date0, lang);
  const names = w.dests.slice(0, 4).map((d) => d.name).join(", ");
  let lines;
  if (lang === "en") lines = [
    `Visa rule changes, ${rng}: ${n} ${n === 1 ? "change" : "changes"} affecting ${w.passports} ${w.passports === 1 ? "passport" : "passports"} across ${w.dests.length} ${w.dests.length === 1 ? "destination" : "destinations"}.`,
    `Destinations with the most changes: ${names}.`,
    `Check the rules for your passport: ${link}`,
    `Source: ${SITE} (data as of ${date})`];
  else lines = [
    `Vize kuralı değişiklikleri, ${rng}: ${w.passports} pasaportu ve ${w.dests.length} varış ülkesini etkileyen ${n} değişiklik.`,
    `En çok değişiklik olan ülkeler: ${names}.`,
    `Pasaportun için kurallara bak: ${link}`,
    `Kaynak: ${SITE} (veri ${date} tarihi itibarıyla)`];
  const tags = lang === "en" ? "#visa #passport #travel #visafree #traveltips" : "#vize #pasaport #seyahat #vizesiz #seyahatipuçları";
  return lines.join("\n") + "\n\n" + tags + "\n";
}

// ── Text slides from a hand-written spec ─────────────────────────────────────
// spec: { slug, lang: "en"|"tr", slides: [{ eyebrow?, title, body?, footer? }], caption }
function textSlides(spec, tokens) {
  const lang = spec.lang;
  if (!T[lang]) throw new Error("spec.lang must be en or tr");
  if (!Array.isArray(spec.slides) || !spec.slides.length) throw new Error("spec.slides must be a non-empty array");
  const total = spec.slides.length;
  return spec.slides.map((sl, i) => {
    if (!sl.title) throw new Error(`slide ${i + 1} has no title`);
    return shell(tokens, lang, `
${sl.eyebrow ? `<div class="eyebrow">${esc(sl.eyebrow)}</div>` : ""}
<div class="txt"><div class="ttl fit">${esc(sl.title)}</div>${sl.body ? `<div class="bd fit">${esc(sl.body)}</div>` : ""}</div>
${sl.footer ? `<div class="note" style="bottom:96px">${esc(sl.footer)}</div>` : ""}`, "");
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const li = args.indexOf("--lang");
  const langArg = li >= 0 ? args[li + 1] : null;
  if (li >= 0) args.splice(li, 2);
  const langs = langArg ? [langArg] : ["en", "tr"];
  if (langs.some((l) => !T[l])) throw new Error("--lang must be en or tr");
  const oi = args.indexOf("--out");
  const outArg = oi >= 0 ? args[oi + 1] : null;
  if (oi >= 0) { if (!outArg) throw new Error("--out needs a directory"); args.splice(oi, 2); }
  const kind = args[0], key = args[1];
  // The site's own fonts (IBM Plex Sans and Serif), inlined as data URLs so the cards match the site.
  const fonts = fs.readFileSync(path.join(ROOT, "assets", "fonts.css"), "utf8").split("\n")
    .filter((l) => /font-family: 'IBM Plex (Sans|Serif)'/.test(l))
    .map((l) => l.replace(/url\((\/assets\/fonts\/[^)]+)\)/, (_, p) => "url(data:font/woff2;base64," + fs.readFileSync(path.join(ROOT, p)).toString("base64") + ")"))
    .join("\n");
  const tokens = fonts + "\n" + fs.readFileSync(path.join(ROOT, "assets", "tokens.css"), "utf8").replace(/@import[^;]+;/g, "");

  const jobs = []; // { dir, htmls[], caption }
  if (kind === "month") {
    const { months } = analyse();
    let m;
    if (key) m = months.find((x) => x.ym === key);
    else m = [...months].reverse().find((x) => !x.partial) || months[months.length - 1];
    if (!m) throw new Error(`No data for month ${key}. Available: ${months.map((x) => x.ym).join(", ")}`);
    for (const lang of langs) {
      const r = monthSlides(m, lang, tokens);
      jobs.push({ dir: `month-${m.ym}-${lang}`, htmls: r.slides, caption: monthCaption(m, lang, r.d, r.link, r.label), lang });
    }
  } else if (kind === "passport") {
    const iso = String(key || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(iso) || !DATA.COUNTRIES.find((x) => x.iso2 === iso)) throw new Error("Usage: social-cards.js passport <iso>");
    const ranks = computeRanks(Object.keys(require("./generate-seo").SNAPSHOT).sort());
    for (const lang of langs) {
      const p = passportSlide(iso, lang, tokens, ranks);
      jobs.push({ dir: `passport-${iso.toLowerCase()}-${lang}`, htmls: [p.html], caption: passportCaption(p, lang), lang });
    }
  } else if (kind === "week") {
    const latest = CHANGELOG.reduce((m, e) => (e.date > m ? e.date : m), "");
    const end = key || latest;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new Error("Usage: social-cards.js week [YYYY-MM-DD]");
    for (const lang of langs) {
      const w = weekData(end, lang);
      if (!w.net.length) { console.log("no changes"); process.exit(0); }
      const r = weekSlides(w, lang, tokens);
      jobs.push({ dir: `week-${end}-${lang}`, htmls: r.slides, caption: weekCaption(w, lang, r.link, latest < end ? latest : end), lang });
    }
  } else if (kind === "text") {
    if (!key) throw new Error("Usage: social-cards.js text <spec.json>");
    const spec = JSON.parse(fs.readFileSync(path.resolve(key), "utf8"));
    if (!spec.slug) throw new Error("spec.slug is required");
    jobs.push({ dir: `text-${spec.slug}-${spec.lang}`, htmls: textSlides(spec, tokens), caption: String(spec.caption || ""), lang: spec.lang });
  } else {
    console.log("Usage:\n  node scripts/social-cards.js month [YYYY-MM] [--lang en|tr]\n  node scripts/social-cards.js passport <iso> [--lang en|tr]\n  node scripts/social-cards.js week [YYYY-MM-DD] [--lang en|tr]\n  node scripts/social-cards.js text <spec.json>\n  (any kind) --out <dir>");
    process.exit(1);
  }

  if (outArg && jobs.length > 1) throw new Error("--out with several languages would overwrite files: add --lang en or --lang tr");
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    for (const job of jobs) {
      const dir = outArg ? path.resolve(outArg) : path.join(OUT, job.dir);
      fs.mkdirSync(dir, { recursive: true });
      for (const [i, html] of job.htmls.entries()) {
        await page.setContent(html, { waitUntil: "load", timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        // Shrink any row name that is wider than its cell.
        await page.evaluate(() => {
          for (const n of document.querySelectorAll(".row .nm")) {
            let size = parseFloat(getComputedStyle(n).fontSize);
            while (n.scrollWidth > n.clientWidth && size > 28) { size -= 2; n.style.fontSize = size + "px"; }
          }
        });
        // Shrink fixed-size text blocks (text slides) until they fit their box.
        await page.evaluate(() => {
          for (const n of document.querySelectorAll(".fit")) {
            let size = parseFloat(getComputedStyle(n).fontSize);
            const lim = parseFloat(getComputedStyle(n).maxHeight) || n.clientHeight;
            while (n.scrollHeight > lim + 1 && size > 24) { size -= 2; n.style.fontSize = size + "px"; }
          }
        });
        await new Promise((r) => setTimeout(r, 120));
        await page.screenshot({ path: path.join(dir, String(i + 1).padStart(2, "0") + ".png"), type: "png", clip: { x: 0, y: 0, width: W, height: H } });
      }
      fs.writeFileSync(path.join(dir, "caption.txt"), job.caption);
      console.log(`${job.htmls.length} slide(s) + caption: ${path.relative(ROOT, dir)}`);
    }
  } finally { await browser.close(); }
}

main().catch((e) => { console.error(e.message); process.exit(1); });

#!/usr/bin/env node
// Instagram carousel generator: 1080x1350 PNG slides plus a caption file, built only from site data.
//
//   node scripts/social-cards.js month [YYYY-MM] [--lang en|tr]   monthly passport power carousel
//   node scripts/social-cards.js passport <iso> [--lang en|tr]    one slide for a single passport
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
    cover: { eyebrow: "PASSPORT POWER", changes: (n) => (n === 1 ? "visa rule change" : "visa rule changes"),
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
    cover: { eyebrow: "PASAPORT GÜCÜ", changes: () => "vize kuralı değişti",
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
.edge{position:absolute;inset:22px;border:2px solid var(--rule-strong)}
.edge::after{content:"";position:absolute;inset:7px;border:1px solid var(--rule)}
.top{position:absolute;left:72px;right:72px;top:64px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px;font:800 44px/1 var(--font-display);color:var(--ink)}
.brand svg{width:44px;height:44px}
.brand .tld{font:500 26px var(--font-mono);color:var(--ink-3)}
.pg{font:500 20px var(--font-mono);letter-spacing:.16em;color:var(--ink-4)}
.eyebrow{position:absolute;left:76px;top:190px;font:500 26px var(--font-mono);letter-spacing:.2em;color:var(--ink-3)}
.title{position:absolute;left:76px;right:76px;top:236px;font:850 92px/.95 var(--font-display);letter-spacing:-.005em;color:var(--ink)}
.rows{position:absolute;left:76px;right:76px;top:470px;display:flex;flex-direction:column;gap:14px}
.row{display:flex;align-items:center;gap:26px;height:100px;border-bottom:2px solid var(--rule);padding-bottom:8px}
.row .fl{font-size:72px;line-height:1;flex:none;width:96px;text-align:center}
.row .nm{flex:1;min-width:0;font:700 52px/1 var(--font-display);color:var(--ink);white-space:nowrap;overflow:hidden}
.row .v{flex:none;text-align:right;font:850 66px/1 var(--font-display);color:var(--ink)}
.row .v small{display:block;font:500 20px var(--font-mono);letter-spacing:.04em;color:var(--ink-3);margin-top:4px}
.row .v.up{color:var(--vf)}.row .v.down{color:var(--accent)}
.note{position:absolute;left:76px;right:76px;bottom:96px;font:500 26px/1.35 var(--font-sans);color:var(--ink-3)}
.big{font:850 300px/.8 var(--font-display);color:var(--ink);letter-spacing:-.01em}
.cap{font:500 48px/1.15 var(--font-sans);color:var(--ink-2)}
.bar{position:absolute;left:44px;right:44px;bottom:44px;height:24px;display:flex;gap:3px}
.bar i{display:block;border-radius:2px;flex:1 0 0}
`;
const BAR = ["vf", "eta", "ev", "voa", "vr"].map((s) => `<i style="background:var(--${s})"></i>`).join("");
const shell = (tokens, lang, body, pg) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400..700&family=Sofia+Sans+Extra+Condensed:wght@600..850&family=DM+Mono:wght@400;500&display=swap">
<style>${CSS(tokens)}</style></head><body><div class="card"><div class="edge"></div>
<div class="top"><div class="brand">${BRAND_MARK}<span>travelnow<span class="tld">.info</span></span></div><div class="pg">${esc(pg || "")}</div></div>
${body}<div class="bar">${BAR}</div></div></body></html>`;

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
<div style="position:absolute;left:76px;top:560px"><div class="big">${s.changes}</div><div class="cap" style="margin-top:18px">${esc(t.cover.changes(s.changes))}</div></div>
<div style="position:absolute;left:76px;top:900px"><div class="big" style="font-size:200px">${s.passports}</div><div class="cap" style="margin-top:14px">${esc(t.cover.passports(s.passports))}</div></div>
<div class="note" style="bottom:100px">${esc(t.cover.swipe)}</div>`, pg()));

  const listSlide = (k, rows) => shell(tokens, lang, `
<div class="eyebrow">${esc(t[k].eyebrow)}</div>
<div class="title">${esc(t[k].title)}</div>
${rowsHtml(rows)}
<div class="note">${esc(t[k].note)}</div>`, pg());

  slides.push(listSlide("gains", d.gains.map((x) => ({ ...x, value: `+${x.net}`, unit: t.gains.unit(x.net), cls: "up" }))));
  if (d.losses.length) slides.push(listSlide("losses", d.losses.map((x) => ({ ...x, value: `-${Math.abs(x.net)}`, unit: t.losses.unit(Math.abs(x.net)), cls: "down" }))));
  slides.push(listSlide("dests", d.dests.map((x) => ({ ...x, value: String(x.n), unit: t.dests.unit(x.n) }))));

  slides.push(shell(tokens, lang, `
<div class="eyebrow">${esc(t.close.eyebrow)}</div>
<div class="title" style="font-size:84px;top:260px">${esc(t.close.lead)}</div>
<div style="position:absolute;left:76px;right:76px;top:520px;font:700 58px/1.15 var(--font-mono);color:var(--ink);word-break:break-all">${esc(link)}</div>
<div class="cap" style="position:absolute;left:76px;right:76px;top:780px;font-size:36px;color:var(--ink-3)">${esc(t.close.data(dateLabel(m.lastDate, lang)))}</div>
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
<div class="eyebrow">${esc(t.passport.eyebrow)} · ${iso}</div>
<div style="position:absolute;left:76px;right:76px;top:250px"><div style="font-size:190px;line-height:1">${c.flag}</div>
<div class="title" style="position:static;margin-top:30px;font-size:${size}px">${esc(name)}</div></div>
<div style="position:absolute;left:76px;top:700px"><div class="big" style="font-size:340px">${mob}</div>
<div class="cap" style="margin-top:22px;max-width:900px">${esc(t.passport.label)}</div></div>
${r ? `<div style="position:absolute;left:76px;top:1150px;font:600 34px var(--font-mono);letter-spacing:.04em;color:var(--ink-2)">${esc(t.passport.rankLine(r.rank, ranks.size))}</div>` : ""}
<div class="note" style="bottom:100px;font-family:var(--font-mono)">${esc(link)}</div>`, "");
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const li = args.indexOf("--lang");
  const langArg = li >= 0 ? args[li + 1] : null;
  if (li >= 0) args.splice(li, 2);
  const langs = langArg ? [langArg] : ["en", "tr"];
  if (langs.some((l) => !T[l])) throw new Error("--lang must be en or tr");
  const kind = args[0], key = args[1];
  const tokens = fs.readFileSync(path.join(ROOT, "assets", "tokens.css"), "utf8").replace(/@import[^;]+;/g, "");

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
  } else {
    console.log("Usage:\n  node scripts/social-cards.js month [YYYY-MM] [--lang en|tr]\n  node scripts/social-cards.js passport <iso> [--lang en|tr]");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run", "--hide-scrollbars"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    for (const job of jobs) {
      const dir = path.join(OUT, job.dir);
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
        await new Promise((r) => setTimeout(r, 120));
        await page.screenshot({ path: path.join(dir, String(i + 1).padStart(2, "0") + ".png"), type: "png", clip: { x: 0, y: 0, width: W, height: H } });
      }
      fs.writeFileSync(path.join(dir, "caption.txt"), job.caption);
      console.log(`${job.htmls.length} slide(s) + caption: ${path.relative(ROOT, dir)}`);
    }
  } finally { await browser.close(); }
}

main().catch((e) => { console.error(e.message); process.exit(1); });

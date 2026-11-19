// Zero-LLM "ordinary visitor" walk over the live site (or a local server).
// Opens key pages plus a random sample from sitemap.xml in a desktop and a phone viewport, and records
// what a visitor would hit: HTTP errors, JS console errors, failed requests, slow loads, heavy pages,
// horizontal scroll on phones, missing <h1>, tiny tap targets. Screenshots go to the output folder so a
// reviewer (human or agent) can look at the few pages that matter instead of browsing everything.
// Usage: node tools/user-walk.js [--base https://travelnow.info] [--sample 12] [--out <dir>] [--lang en-US]
// Prints one line per page and a summary; writes <out>/walk.json. Exit code 0 even when issues are found.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const arg = (name, dflt) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : dflt; };
const BASE = arg("base", "https://travelnow.info").replace(/\/$/, "");
const SAMPLE = parseInt(arg("sample", "12"), 10);
const LANG = arg("lang", "en-US");
const OUT = arg("out", path.join(__dirname, "..", ".autopilot", "walk"));

const KEY_PAGES = ["/", "/tr/", "/passport/", "/itinerary/", "/transit-map/", "/safety-map/", "/alerts/",
  "/guides/schengen-90-180-rule/", "/etias/", "/passport-validity/", "/about/", "/account/",
  "/visa/mv/", "/tr/visa/mv/", "/reports/", "/open-data/"];

function chromePath() {
  const c = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) throw new Error("Chrome not found; set CHROME_PATH");
  return hit;
}

async function sitemapSample(n) {
  try {
    const xml = await (await fetch(BASE + "/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
      .filter((p) => !KEY_PAGES.includes(p));
    for (let i = urls.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [urls[i], urls[j]] = [urls[j], urls[i]]; }
    return urls.slice(0, n);
  } catch (e) { return []; }
}

async function visit(browser, p, device) {
  const page = await browser.newPage();
  if (device === "phone") {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36");
  } else await page.setViewport({ width: 1366, height: 800 });
  await page.setExtraHTTPHeaders({ "Accept-Language": LANG });
  await page.evaluateOnNewDocument((l) => { Object.defineProperty(navigator, "language", { get: () => l }); Object.defineProperty(navigator, "languages", { get: () => [l] }); }, LANG);
  const errors = [], failed = [], thirdParty = [];
  let bytes = 0;
  // Errors thrown inside third-party scripts (AdSense, analytics) are listed apart: we can't fix them.
  // Known: adsbygoogle.js throws "reading 'appendChild'" when a stored "tr" language translates an English
  // page in place before the ad slot fills (the walk visits /tr/ first, like a real visitor might).
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const src = (m.location() && m.location().url) || "";
    const msg = m.text().slice(0, 160);
    if (/googlesyndication|doubleclick|google-analytics|googletagmanager|cloudflareinsights/.test(src)) thirdParty.push(msg);
    else errors.push(msg);
  });
  page.on("pageerror", (e) => errors.push(String(e.message || e).slice(0, 160)));
  page.on("requestfailed", (r) => { const u = r.url(); if (!/google|doubleclick|analytics|adsbygoogle|cloudflareinsights/.test(u)) failed.push(u.slice(0, 120)); });
  page.on("response", async (r) => {
    const len = parseInt(r.headers()["content-length"] || "0", 10); bytes += len;
    if (r.status() >= 400 && !/google|doubleclick|analytics/.test(r.url())) failed.push(r.status() + " " + r.url().slice(0, 110));
  });
  const t0 = Date.now();
  let status = 0;
  try {
    const res = await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 45000 });
    status = res ? res.status() : 0;
  } catch (e) { errors.push("navigation: " + e.message.slice(0, 100)); }
  const ms = Date.now() - t0;
  await new Promise((r) => setTimeout(r, 1200));
  const facts = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const small = [...document.querySelectorAll("a,button,[role=button],input,select")].filter((el) => {
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && (r.height < 32 || r.width < 32);
    }).length;
    return {
      title: document.title.slice(0, 80),
      h1: h1 ? h1.textContent.trim().slice(0, 60) : "",
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 2,
      smallTargets: small,
      words: (document.body ? document.body.innerText : "").split(/\s+/).filter(Boolean).length,
    };
  }).catch(() => ({}));
  const shot = path.join(OUT, (p.replace(/[^a-z0-9]+/gi, "_") || "_") + "-" + device + ".png");
  await page.screenshot({ path: shot }).catch(() => {});
  await page.close();
  return { path: p, device, status, ms, kb: Math.round(bytes / 1024), errors: [...new Set(errors)], thirdParty: [...new Set(thirdParty)], failed: [...new Set(failed)], ...facts, shot };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pages = [...KEY_PAGES, ...(await sitemapSample(SAMPLE))];
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "new", args: ["--disable-gpu", "--no-first-run", "--lang=" + LANG], env: { ...process.env, LANG: LANG.replace("-", "_") } });
  const results = [];
  for (const p of pages) for (const device of ["desktop", "phone"]) {
    const r = await visit(browser, p, device);
    results.push(r);
    const flags = [];
    if (r.status >= 400 || r.status === 0) flags.push("HTTP " + r.status);
    if (r.errors.length) flags.push(r.errors.length + " js-err");
    if (r.thirdParty.length) flags.push(r.thirdParty.length + " 3p-err");
    if (r.failed.length) flags.push(r.failed.length + " failed-req");
    if (r.ms > 6000) flags.push("slow " + r.ms + "ms");
    if (device === "phone" && r.hscroll) flags.push("h-scroll");
    if (!r.h1) flags.push("no-h1");
    if (device === "phone" && r.smallTargets > 15) flags.push(r.smallTargets + " small-taps");
    console.log((flags.length ? "WARN " : "ok   ") + device.padEnd(7) + p.padEnd(42) + " " + r.ms + "ms " + r.kb + "kB " + flags.join(", "));
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "walk.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 1));
  const warn = results.filter((r) => r.status >= 400 || r.errors.length || r.failed.length || (r.device === "phone" && r.hscroll));
  console.log(`summary: ${results.length} visits, ${warn.length} with errors · details ${path.join(OUT, "walk.json")}`);
})().catch((e) => { console.error("user-walk failed:", e.message); process.exit(1); });

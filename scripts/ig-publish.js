#!/usr/bin/env node
// Publishes approved posts from social/queue/ to the travelnow.info Instagram account.
//
//   node scripts/ig-publish.js             publish every due, approved, unpublished post
//   node scripts/ig-publish.js --dry-run   list what would be published, call nothing
//   node scripts/ig-publish.js --check     verify the token and show the account and publishing quota
//   node scripts/ig-publish.js --refresh   refresh the long-lived token, print the new one (local use)
//
// Queue layout: social/queue/<YYYY-MM-DD>-<slug>/ holds 01.jpg, 02.jpg ... (JPEG, 4:5), caption.txt and
// post.json { "publish_on": "2026-11-24", "approved": false, "published": null }.
// A post goes out only when a person has set "approved": true. Nothing in this script approves posts.
// Meta fetches the images by URL, so the folder must already be live on travelnow.info (pushed to main).
//
// Uses the Instagram API with Instagram Login (graph.instagram.com, no Facebook Page needed).
// Env: IG_TOKEN (long-lived token with instagram_business_basic + instagram_business_content_publish).
// Locally the token can live in .secrets/instagram-token.txt instead.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUEUE = path.join(ROOT, "social", "queue");
const SITE = "https://travelnow.info";
const API = "https://graph.instagram.com/v27.0";
const DRY = process.argv.includes("--dry-run");

function token() {
  if (process.env.IG_TOKEN) return process.env.IG_TOKEN.trim();
  const f = path.join(ROOT, ".secrets", "instagram-token.txt");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim() : "";
}

async function call(method, url, params) {
  const u = new URL(url.startsWith("http") ? url : API + url);
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res = method === "GET"
    ? await fetch(u + (u.search ? "&" : "?") + body)
    : await fetch(u, { method, body });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(`${method} ${u.pathname}: ${(j.error && j.error.message) || res.status}`);
  return j;
}

// Istanbul date, so "publish_on" means the owner's calendar day.
const today = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

function duePosts() {
  if (!fs.existsSync(QUEUE)) return [];
  return fs.readdirSync(QUEUE).sort().map((d) => {
    const dir = path.join(QUEUE, d), meta = path.join(dir, "post.json");
    if (!fs.existsSync(meta)) return null;
    const post = JSON.parse(fs.readFileSync(meta, "utf8"));
    const images = fs.readdirSync(dir).filter((f) => /^\d+\.jpe?g$/i.test(f)).sort();
    const caption = fs.existsSync(path.join(dir, "caption.txt")) ? fs.readFileSync(path.join(dir, "caption.txt"), "utf8").trim() : "";
    return { d, dir, meta, post, images, caption };
  }).filter(Boolean);
}

async function waitFinished(id) {
  for (let i = 0; i < 10; i++) {
    const s = await call("GET", `/${id}`, { fields: "status_code" });
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`container ${id}: ${s.status_code}`);
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error(`container ${id}: still not ready`);
}

async function publish(p) {
  const url = (f) => `${SITE}/social/queue/${encodeURIComponent(p.d)}/${f}`;
  // Meta must be able to fetch the image; fail early with a clear message if the folder isn't live yet.
  for (const f of p.images) {
    const r = await fetch(url(f), { method: "HEAD" });
    if (!r.ok) throw new Error(`${url(f)} returns ${r.status}; push the folder first`);
  }
  let creation;
  if (p.images.length === 1) {
    creation = (await call("POST", "/me/media", { image_url: url(p.images[0]), caption: p.caption })).id;
  } else {
    const children = [];
    for (const f of p.images) children.push((await call("POST", "/me/media", { image_url: url(f), is_carousel_item: "true" })).id);
    for (const c of children) await waitFinished(c);
    creation = (await call("POST", "/me/media", { media_type: "CAROUSEL", children: children.join(","), caption: p.caption })).id;
  }
  await waitFinished(creation);
  const done = await call("POST", "/me/media_publish", { creation_id: creation });
  const info = await call("GET", `/${done.id}`, { fields: "permalink" }).catch(() => ({}));
  return { id: done.id, permalink: info.permalink || null, at: new Date().toISOString() };
}

(async () => {
  if ((process.argv.includes("--refresh") || process.argv.includes("--check")) && !token()) {
    console.log("no token: set IG_TOKEN or write .secrets/instagram-token.txt (see TODO.md)");
    return;
  }
  if (process.argv.includes("--refresh")) {
    const j = await call("GET", "https://graph.instagram.com/refresh_access_token", { grant_type: "ig_refresh_token" });
    console.log(`new token valid ${Math.round(j.expires_in / 86400)} days`);
    process.stdout.write(j.access_token + "\n");
    return;
  }
  if (process.argv.includes("--check")) {
    const me = await call("GET", "/me", { fields: "user_id,username,account_type,media_count,followers_count" });
    const q = await call("GET", "/me/content_publishing_limit", { fields: "quota_usage,config" }).catch((e) => ({ error: e.message }));
    console.log(JSON.stringify({ me, quota: q.data ? q.data[0] : q }));
    return;
  }
  const posts = duePosts();
  const due = posts.filter((p) => p.post.approved === true && !p.post.published && p.post.publish_on <= today());
  const waiting = posts.filter((p) => !p.post.published && p.post.approved !== true);
  console.log(`queue: ${posts.length} posts · due now: ${due.length} · awaiting approval: ${waiting.length}`);
  if (!due.length) return;
  if (DRY) { due.forEach((p) => console.log(`would publish ${p.d} (${p.images.length} image(s))`)); return; }
  if (!token()) { console.log("no IG_TOKEN; nothing published"); return; }
  for (const p of due) {
    if (!p.images.length) { console.log(`skip ${p.d}: no JPEG images`); continue; }
    try {
      p.post.published = await publish(p);
      fs.writeFileSync(p.meta, JSON.stringify(p.post, null, 2) + "\n");
      console.log(`published ${p.d} ${p.post.published.permalink || p.post.published.id}`);
    } catch (e) {
      console.log(`FAILED ${p.d}: ${e.message}`);
      process.exitCode = 1;
    }
  }
})().catch((e) => { console.error("ig-publish:", e.message); process.exit(1); });

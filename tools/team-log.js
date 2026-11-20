#!/usr/bin/env node
// What the other editors pushed since your own last commit on main.
// Run at session start (CLAUDE.md): Claude summarises the output for the owner in 3-5 lines.
//
//   node tools/team-log.js            since your last commit (falls back to 7 days)
//   node tools/team-log.js --days 3   fixed window instead
//
// "You" = `git config user.name`. Bot commits (daily data refresh) are skipped.
const { execFileSync } = require("child_process");

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const BOTS = /bot\b|\[bot\]|github-actions/i;

try { git("fetch", "-q", "origin", "main"); } catch (e) { console.log("(fetch failed, using local origin/main)"); }

const me = git("config", "user.name");
const daysArg = process.argv.indexOf("--days");
let since;
if (daysArg > -1) {
  since = `${Number(process.argv[daysArg + 1]) || 7} days ago`;
} else {
  const mine = git("log", "-1", "--author=" + me, "--format=%cI", "origin/main");
  since = mine || "7 days ago";
}

const out = git("log", "origin/main", "--no-merges", "--since=" + since,
  "--format=%h%x09%ad%x09%an%x09%s", "--date=format:%m-%d %H:%M");
const rows = out ? out.split("\n").map((l) => l.split("\t")) : [];
const others = rows.filter(([, , author]) => author !== me && !BOTS.test(author));

console.log(`Others' commits on main since ${since} (you: ${me}): ${others.length}`);
others.reverse().forEach(([h, d, a, s]) => console.log(`${h} ${d} ${a}: ${s}`.slice(0, 160)));
if (others.length) console.log("Details: git show --stat <hash>");

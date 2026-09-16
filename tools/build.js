// tools/build.js — precompile the site's JSX so browsers stop downloading and
// running Babel on every visit (≈650 KB compressed plus compile time on the
// phone before the map could appear).
//
//   app.jsx, components/*.jsx  →  build/<name>.js
//
// The output keeps the exact semantics the pages had under in-browser Babel:
// every file is a classic script sharing one global scope, compiled to ES5, so
// top-level `const`s become `var`s (several files each declare
// `const { useState } = React;`) and top-level functions stay globals that the
// other files use. Two things to remember when writing JSX here:
//   • a top-level name is global — don't reuse a name a data file sets on
//     `window` (a `const feeText` helper once overwrote window.feeText);
//   • edit the .jsx, then run the build: `cd tools && npm ci && node build.js`.
//     The "Build JSX" GitHub Action also runs it on every push that touches JSX.
//
// It then rewrites the <script> tags in the SPA pages to point at build/*.js
// with a content hash for cache-busting, and swaps React's development UMD
// bundles for the production ones.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const babel = require("@babel/core");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "build");
const PAGES = ["index.html", "transit-map/index.html", "itinerary/index.html", "safety-map/index.html"];

const REACT_PROD = {
  react: '<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z" crossorigin="anonymous"></script>',
  dom: '<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1" crossorigin="anonymous"></script>',
};

function sources() {
  const comps = fs.readdirSync(path.join(ROOT, "components"))
    .filter(f => f.endsWith(".jsx"))
    .map(f => "components/" + f);
  return ["app.jsx", ...comps];
}

function compile(rel) {
  const file = path.join(ROOT, rel);
  // LF-normalised so a Windows checkout (autocrlf) and the Linux CI runner
  // produce byte-identical output and the same cache-bust hash.
  const code = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const out = babel.transformSync(code, {
    filename: file,
    babelrc: false,
    configFile: false,
    browserslistConfigFile: false,
    sourceType: "script",
    // Same as @babel/standalone's defaults for <script type="text/babel">:
    // no targets ⇒ full ES5 output, JSX via React.createElement, strict mode.
    presets: [
      [require.resolve("@babel/preset-env"), { modules: false }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
    plugins: [require.resolve("@babel/plugin-transform-strict-mode")],
    comments: false,
    compact: false,
  });
  const name = path.basename(rel, ".jsx") + ".js";
  const body = `// Generated from ${rel} by tools/build.js — edit the .jsx and rebuild.\n${out.code}\n`;
  fs.writeFileSync(path.join(OUT_DIR, name), body);
  const hash = crypto.createHash("sha1").update(body).digest("hex").slice(0, 10);
  return { rel, name, hash, bytes: Buffer.byteLength(body) };
}

function rewritePage(page, built) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  for (const b of built) {
    const base = path.basename(b.rel, ".jsx");
    // Either the original Babel tag or a previous build's tag.
    const re = new RegExp(
      `<script type="text/babel" src="/?${b.rel.replace(/[.]/g, "\\.")}(\\?v=[^"]*)?"></script>` +
      `|<script src="/build/${base}\\.js(\\?v=[^"]*)?"></script>`, "g");
    html = html.replace(re, `<script src="/build/${b.name}?v=${b.hash}"></script>`);
  }

  html = html
    .replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone@[^"]*"[^>]*><\/script>\r?\n?/g, "")
    .replace(/<!-- React \+ Babel -->/g, "<!-- React -->")
    .replace(/<script src="https:\/\/unpkg\.com\/react@18\.3\.1\/umd\/react\.development\.js"[^>]*><\/script>/g, REACT_PROD.react)
    .replace(/<script src="https:\/\/unpkg\.com\/react-dom@18\.3\.1\/umd\/react-dom\.development\.js"[^>]*><\/script>/g, REACT_PROD.dom);

  if (/text\/babel/.test(html)) {
    throw new Error(`${page}: a <script type="text/babel"> tag was not converted — add its source to the build`);
  }
  if (html !== before) fs.writeFileSync(file, html);
  return html !== before;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const built = sources().map(compile);
  for (const b of built) console.log(`  ${b.rel.padEnd(28)} → build/${b.name.padEnd(18)} ${(b.bytes / 1024).toFixed(1)} KB  ${b.hash}`);
  // Drop outputs whose source is gone.
  const keep = new Set(built.map(b => b.name));
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".js") && !keep.has(f)) fs.unlinkSync(path.join(OUT_DIR, f));
  }
  for (const page of PAGES) {
    const changed = rewritePage(page, built);
    console.log(`  ${page}${changed ? " — updated" : ""}`);
  }
}

main();

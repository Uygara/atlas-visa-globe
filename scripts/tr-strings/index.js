// Loads every scripts/tr-strings/<page>.js and merges them into one table:
//   { "<8-hex id of the English unit>": "Turkish HTML" | true }
//
// The id is a hash of the English source (see hash() in scripts/build-tr.js), so
// the same sentence on two pages shares one entry, and a page whose English text
// changed stops matching until its translation is updated. `true` means "leave
// as it is" (a proper noun, a code, a symbol).
//
// Get the ids of what still needs translating with:
//   node scripts/build-tr.js --todo [/page/]

const fs = require("fs");
const path = require("path");

const table = {};
for (const f of fs.readdirSync(__dirname).sort()) {
  if (f === "index.js" || !f.endsWith(".js")) continue;
  const entries = require(path.join(__dirname, f));
  for (const [id, tr] of Object.entries(entries)) {
    if (id in table && table[id] !== tr) throw new Error(`tr-strings: ${id} is defined twice with different text (${f})`);
    table[id] = tr;
  }
}

module.exports = table;

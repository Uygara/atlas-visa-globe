// Tests firestore.rules against the Firestore emulator: accounts and traveller experiences.
// Needs Java and these packages (not in the repo's package.json, CI installs them):
//   npm i --no-save firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10
//   npx firebase emulators:exec --only firestore --project demo-travelnow "node tools/test-firestore-rules.js"
// The .github/workflows/firestore-rules.yml job runs exactly this before publishing the rules.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, writeBatch, serverTimestamp, setLogLevel } = require("firebase/firestore");
setLogLevel("silent");  // denied writes are the point of most tests

const ROOT = path.resolve(__dirname, "..");
let n = 0, failed = 0;
async function t(name, fn) {
  try { await fn(); n++; console.log("  ✓ " + name); } catch (e) { failed++; console.error("  ✗ " + name + "\n    " + (e && e.message)); }
}

(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-travelnow",
    firestore: { rules: fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8") },
  });
  const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
  const TEXT = "Applied online in March, the eVisa arrived after six working days. They asked for a hotel booking.";
  const exp = (uid, over) => Object.assign({ uid, passport: "TR", dest: "FR", pair: "TR-FR", route: "embassy", month: "2026-10",
    days: 14, text: TEXT, lang: "en", createdAt: serverTimestamp(), reports: 0, visible: true }, over || {});
  const post = (uid, over, id) => {
    const d = db(uid), b = writeBatch(d);
    b.set(doc(d, "posters", uid), { last: serverTimestamp() });
    b.set(doc(d, "experiences", id || uid + "_TR-FR"), exp(uid, over));
    return b.commit();
  };
  const report = (uid, id, cur) => {
    const d = db(uid), b = writeBatch(d), k = cur + 1;
    b.update(doc(d, "experiences", id), { reports: k, visible: k < 3 });
    b.set(doc(d, "experiences", id, "reports", uid), {});
    return b.commit();
  };

  console.log("users (unchanged)");
  await t("own document only", async () => {
    await assertSucceeds(setDoc(doc(db("u1"), "users", "u1"), { v: 1, updatedAt: serverTimestamp(), data: {} }));
    await assertFails(getDoc(doc(db("u2"), "users", "u1")));
  });

  console.log("experiences: writing");
  await t("signed-in person can post one experience", () => assertSucceeds(post("alice")));
  await t("signed out cannot post", () => assertFails(setDoc(doc(db(null), "experiences", "x_TR-FR"), exp("x"))));
  await t("a second post within 10 minutes is refused", () => assertFails(post("alice", { dest: "DE", pair: "TR-DE" }, "alice_TR-DE")));
  await t("document id must be {uid}_{pair}", () => assertFails(post("bob", {}, "someone_TR-FR")));
  await t("cannot post as someone else", () => assertFails(post("bob", { uid: "alice" }, "bob_TR-FR")));
  for (const [label, text] of [
    ["link", "Applied at https://example.org and it went fine, took about a week and a half."],
    ["bare domain", "Applied through some-agency.com and it went fine, took about a week and a half."],
    ["e-mail", "Write me at someone@gmail.com if you need help with the documents for this visa."],
    ["@handle", "Follow @traveller.joe for more tips, I posted the whole process there last month."],
    ["phone number", "Call the consulate on +90 532 123 45 67, they answered within a day and were helpful."],
    ["passport number", "My passport U12345678 was accepted without problems at the visa centre last month."],
  ]) await t(`blocked: ${label}`, () => assertFails(post("p_" + label.replace(/\W/g, ""), { text })));
  await t("dates and amounts are fine", () => assertSucceeds(post("carol", { text: "Applied on 2026-10-03, paid 80 euros, visa issued on 14.10.2026 after one short interview." })));
  await t("too short is refused", () => assertFails(post("dave", { text: "Easy." })));
  await t("unknown field or route is refused", async () => {
    await assertFails(post("erin", { name: "Erin" }));
    await assertFails(post("erin", { route: "bribe" }));
  });
  await t("must start visible with no reports", () => assertFails(post("frank", { reports: 5 })));

  console.log("experiences: reading and reporting");
  await t("anyone can list visible posts for a pair", () => assertSucceeds(getDocs(query(collection(db(null), "experiences"), where("pair", "==", "TR-FR"), where("visible", "==", true)))));
  await t("a query without the visible filter is refused", () => assertFails(getDocs(query(collection(db(null), "experiences"), where("pair", "==", "TR-FR")))));
  await t("reading a post that does not exist is not an error", () => assertSucceeds(getDoc(doc(db("zed"), "experiences", "zed_TR-FR"))));
  await t("the author cannot report their own post", () => assertFails(report("alice", "alice_TR-FR", 0)));
  await t("one report per account", async () => {
    await assertSucceeds(report("r1", "alice_TR-FR", 0));
    await assertFails(report("r1", "alice_TR-FR", 1));
  });
  await t("the count cannot jump", () => assertFails(report("r2", "alice_TR-FR", 5)));
  await t("the third report hides the post", async () => {
    await assertSucceeds(report("r2", "alice_TR-FR", 1));
    await assertSucceeds(report("r3", "alice_TR-FR", 2));
    await assertFails(getDoc(doc(db("r4"), "experiences", "alice_TR-FR")));
    await assertSucceeds(getDoc(doc(db("alice"), "experiences", "alice_TR-FR")));
  });
  await t("report records are private", () => assertFails(getDoc(doc(db("r1"), "experiences", "alice_TR-FR", "reports", "r1"))));
  await t("only the author deletes", async () => {
    await assertFails(deleteDoc(doc(db("r1"), "experiences", "carol_TR-FR")));
    await assertSucceeds(deleteDoc(doc(db("carol"), "experiences", "carol_TR-FR")));
  });
  await t("the author cannot edit the text", () => assertFails(setDoc(doc(db("alice"), "experiences", "alice_TR-FR"), exp("alice", { text: TEXT + " Edited later." }))));

  await env.cleanup();
  console.log(`\n${n} passed${failed ? `, ${failed} FAILED` : ""}`);
  if (failed) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });

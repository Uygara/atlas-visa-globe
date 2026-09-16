// Firebase web-app config for accounts (sign-in + cross-device sync).
//
// While this is null, accounts are OFF: no sign-in link is shown, nothing is
// loaded from Firebase, and everything people save stays in their browser.
//
// To switch accounts on, follow ACCOUNT-SETUP.md and paste the config Firebase
// shows under Project settings → Your apps → Web app, e.g.
//
//   window.ACCOUNT_CONFIG = {
//     apiKey: "AIza…",
//     authDomain: "travelnow-xxxx.firebaseapp.com",
//     projectId: "travelnow-xxxx",
//     appId: "1:123…:web:abc…",
//   };
//
// These values are public by design (they identify the project; access is
// enforced by firestore.rules), so committing them is safe.
window.ACCOUNT_CONFIG = null;

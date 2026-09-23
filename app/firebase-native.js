// firebase-native.js — after GoogleService-Info.plist / google-services.json are in place
// (MOBILE-SETUP.md §1), wire them into the native projects and say what is still missing.
//
//   node firebase-native.js
//
// iOS: Google sign-in returns to the app through a URL scheme, the plist's
//      REVERSED_CLIENT_ID; it is added to Info.plist (once) as CFBundleURLTypes.
// Android: only checks that google-services.json exists (the Gradle plugin is already
//      applied when it does — see android/app/build.gradle).

const fs = require("fs");
const path = require("path");

const PLIST = path.join(__dirname, "ios", "App", "App", "GoogleService-Info.plist");
const INFO = path.join(__dirname, "ios", "App", "App", "Info.plist");
const GSJSON = path.join(__dirname, "android", "app", "google-services.json");

let problems = 0;
const say = (ok, msg) => { console.log((ok ? "✓ " : "✗ ") + msg); if (!ok) problems++; };

// iOS
if (!fs.existsSync(PLIST)) say(false, "ios/App/App/GoogleService-Info.plist is missing (firebase apps:sdkconfig IOS <APP_ID>)");
else {
  const plist = fs.readFileSync(PLIST, "utf8");
  const m = /<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/.exec(plist);
  if (!m) say(false, "REVERSED_CLIENT_ID not in the plist — enable Google sign-in in Firebase (deploy --only auth), then download the plist again");
  else {
    let info = fs.readFileSync(INFO, "utf8");
    if (info.includes(m[1])) say(true, "Info.plist already has the Google URL scheme " + m[1]);
    else {
      const block = `\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${m[1]}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n`;
      const anchor = "\t<key>UIViewControllerBasedStatusBarAppearance</key>";
      if (!info.includes(anchor)) say(false, "could not find where to add the URL scheme in Info.plist");
      else { fs.writeFileSync(INFO, info.replace(anchor, () => block + anchor)); say(true, "added the Google URL scheme " + m[1] + " to Info.plist"); }
    }
  }
}

// Android
say(fs.existsSync(GSJSON), fs.existsSync(GSJSON)
  ? "android/app/google-services.json is in place (remember the SHA-1 in the Firebase console: ./gradlew signingReport)"
  : "android/app/google-services.json is missing (firebase apps:sdkconfig ANDROID <APP_ID>)");

process.exit(problems ? 1 : 0);

// Settings for the iOS/Android app build (app/). Ignored by the website: only
// app/build-www.js injects app-native.js, and that is what reads this.
//
// AdMob (account pub-2617798720306957, apps "travelnow Android" and "travelnow iOS",
// one Banner unit each). The APP ids live in app/ios/App/App/Info.plist
// (GADApplicationIdentifier) and app/android/app/src/main/res/values/strings.xml (admob_app_id).
// `live` stays false here: the banner then asks for test ads (isTesting). app/build-www.js
// turns it on only when ATLAS_ADS_LIVE=1, which CI sets for the Play release bundle.
window.ATLAS_APP_CONFIG = {
  ads: {
    enabled: true,
    live: false,
    // Only these pages show a banner; the maps keep the whole screen.
    pages: ["/itinerary/index.html", "/schengen-calculator/index.html"],
    bannerIos: "ca-app-pub-2617798720306957/3858698304",
    bannerAndroid: "ca-app-pub-2617798720306957/2924890584",
    // Test devices (production-like ads on your own phone): AdMob → Settings → Test devices.
    testingDevices: [],
  },
  site: "https://travelnow.info",
};

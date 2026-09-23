// Settings for the iOS/Android app build (app/). Ignored by the website: only
// app/build-www.js injects app-native.js, and that is what reads this.
//
// AdMob: the values below are Google's public TEST units, so a build made today
// shows test ads only. When the AdMob account exists (ACCOUNT / MOBILE-SETUP.md):
//   1. create an iOS and an Android app in AdMob, then one Banner unit each,
//   2. put the two banner unit ids below,
//   3. put the two APP ids (ca-app-pub-…~…) in app/ios/App/App/Info.plist
//      (GADApplicationIdentifier) and app/android/app/src/main/AndroidManifest.xml
//      (com.google.android.gms.ads.APPLICATION_ID meta-data).
window.ATLAS_APP_CONFIG = {
  ads: {
    enabled: true,
    // Only these pages show a banner; the maps keep the whole screen.
    pages: ["/itinerary/index.html", "/schengen-calculator/index.html"],
    bannerIos: "ca-app-pub-3940256099942544/2934735716",
    bannerAndroid: "ca-app-pub-3940256099942544/6300978111",
    // Test devices (production-like ads on your own phone): AdMob → Settings → Test devices.
    testingDevices: [],
  },
  site: "https://travelnow.info",
};

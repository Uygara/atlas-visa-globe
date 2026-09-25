// Analytics loader, included in every page's <head> (production hostname only).
//
// Google Analytics 4 (G-YVQRDY5YXH). The privacy policy promises exactly what this does:
//   - In the EU/EEA, the UK, Switzerland and Turkey no cookies are set and nothing is
//     stored on the device: Google consent mode starts "denied" there, so GA sends
//     cookieless pings that Google models. We show no consent banner, so it stays denied.
//   - Elsewhere GA may set its first-party cookies (_ga, _ga_*).
//   - GA4 does not log or store IP addresses.
// Cloudflare Web Analytics (cookieless) is injected by Cloudflare itself, not here.
// If this file changes, update /privacy/ (section 2) in the same commit.
(function () {
  try {
    var host = location.hostname || "";
    if (host !== "travelnow.info" && host !== "www.travelnow.info") return;
  } catch (_) { return; }

  var DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" };
  // EU + EEA, United Kingdom, Switzerland, Turkey (region-specific default wins where it applies).
  var CONSENT_REGIONS = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
    "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH", "TR",
  ];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  var regional = {}; for (var k in DENIED) regional[k] = DENIED[k];
  regional.region = CONSENT_REGIONS;
  gtag("consent", "default", regional);
  gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
  gtag("js", new Date());
  gtag("config", "G-YVQRDY5YXH");
  var ga = document.createElement("script");
  ga.async = true;
  ga.src = "https://www.googletagmanager.com/gtag/js?id=G-YVQRDY5YXH";
  document.head.appendChild(ga);
})();

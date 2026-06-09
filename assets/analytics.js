// Analytics loader — loaded from every page's <head>. Keeps both providers in
// one file so future changes (or a kill-switch) only need editing one place.
// Owner can disable a provider just by removing its block.
(function () {
  // Don't track in local development (file://) or on preview hosts.
  try {
    var host = location.hostname || "";
    if (host !== "travelnow.info" && host !== "www.travelnow.info") return;
  } catch (_) { /* file:// — bail */ return; }

  // ── Google Analytics 4 (gtag.js) — measurement id G-YVQRDY5YXH ────────────
  // Defines the dataLayer/gtag queue first so the async loader can consume it
  // as soon as it arrives. Standard GA4 snippet, just externalised.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", "G-YVQRDY5YXH", { anonymize_ip: true });
  var ga = document.createElement("script");
  ga.async = true;
  ga.src = "https://www.googletagmanager.com/gtag/js?id=G-YVQRDY5YXH";
  document.head.appendChild(ga);

  // ── Matomo Tag Manager (cloud container L8Pi0F9e) ────────────────────────
  // For SPA history-change tracking, the History Change trigger must be wired
  // in the Matomo console (steps 1-14 of the install guide). This snippet is
  // step 15: inject the container so the configured triggers can fire.
  window._mtm = window._mtm || [];
  window._mtm.push({ "mtm.startTime": Date.now(), event: "mtm.Start" });
  var mtm = document.createElement("script");
  mtm.async = true;
  mtm.src = "https://cdn.matomo.cloud/travelnow.matomo.cloud/container_L8Pi0F9e.js";
  document.head.appendChild(mtm);
})();

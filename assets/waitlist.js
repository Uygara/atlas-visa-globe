// Waiting lists for the demand test: the Schengen appointment alert (/appointment-alert/ and the
// Turkish twin, product "appt") and the global Travel Pass (/travel-pass/, product "pass", taken
// from the form's data-product). The pass id is sha256("pass:" + email) so one address can join both.
// A demand test: one Firestore document per address in waitlist/{sha256(email)}, written with
// the public web API key through the REST API (no SDK). firestore.rules allows create only, so
// nobody can read the list from the web and a second sign-up with the same address is refused.
// GA4: waitlist_signup { product, price, country, city, placement }.
(function () {
  var form = document.getElementById("wl-form");
  if (!form) return;
  var msgEl = document.getElementById("wl-msg");
  var btn = document.getElementById("wl-submit");
  var product = form.getAttribute("data-product") === "pass" ? "pass" : "appt";
  var lang = (document.documentElement.lang || "en").slice(0, 2) === "tr" ? "tr" : "en";
  var src = "";
  try { src = (new URLSearchParams(location.search).get("src") || "direct").replace(/[^a-z0-9_-]/gi, "").slice(0, 40); } catch (e) { src = "direct"; }

  function text(key) {
    var el = document.querySelector('[data-msg="' + key + '"]');
    return el ? el.textContent.trim() : key;
  }
  function show(key, ok) {
    msgEl.hidden = false;
    msgEl.textContent = text(key);
    msgEl.className = "wl-msg msg " + (ok ? "ok" : "warn");
  }
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = String(form.email.value || "").trim().toLowerCase();
    var priceEl = form.querySelector('input[name="price"]:checked');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return show("bad-email");
    if (!priceEl) return show("no-price");
    if (!form.consent.checked) return show("no-consent");
    var cfg = window.ACCOUNT_CONFIG;
    if (!cfg || !window.crypto || !crypto.subtle) return show("fail");
    var data = { email: email, lang: lang, price: priceEl.value, src: src, consent: true };
    if (form.country) data.country = form.country.value;
    if (form.city) data.city = form.city.value;
    if (product === "pass") {
      data.product = "pass";
      // The passport already chosen on the site (local storage), if any; disclosed in the page's notice.
      try { var pp = String(localStorage.getItem("atlas.passport") || "").toUpperCase(); if (/^[A-Z]{2}$/.test(pp)) data.passport = pp; } catch (e) {}
    }
    btn.disabled = true;
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(product === "pass" ? "pass:" + email : email)).then(function (h) {
      var fields = {};
      Object.keys(data).forEach(function (k) {
        fields[k] = typeof data[k] === "boolean" ? { booleanValue: data[k] } : { stringValue: data[k] };
      });
      var url = "https://firestore.googleapis.com/v1/projects/" + cfg.projectId +
        "/databases/(default)/documents/waitlist?documentId=" + hex(h) + "&key=" + encodeURIComponent(cfg.apiKey);
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields }) });
    }).then(function (r) {
      if (r.ok) {
        show("ok", true);
        form.querySelectorAll("input,select,button").forEach(function (el) { el.disabled = true; });
        if (window.gtag) window.gtag("event", "waitlist_signup", { product: product, price: data.price, country: data.country || "", city: data.city || "", placement: src });
        return;
      }
      // 409: the document exists. The rules refuse a create on an existing id with 403, which
      // after our own checks above almost always means the same address signed up before.
      btn.disabled = false;
      show(r.status === 409 || r.status === 403 ? "dup" : "fail");
    }).catch(function () { btn.disabled = false; show("fail"); });
  });
})();

// share-card.js: "Share this answer" on /visa/<cc>/ (roadmap A3).
// After the checker shows a result, the button shares a link that opens the page with
// the same passport chosen (/visa/fr/?p=TR) and, where the phone can share files,
// a 1080x1350 image of the answer drawn on a canvas. Nothing leaves the browser except
// through the share sheet the visitor picks. Strings come from #chk-data (generate-seo.js).
(function () {
  "use strict";
  var btn = document.getElementById("chk-share"), sel = document.getElementById("chk-sel");
  var dataEl = document.getElementById("chk-data");
  if (!btn || !sel || !dataEl) return;
  var d = JSON.parse(dataEl.textContent), S = d.share || {};
  var COL = { idc: "#3F79A8", vf: "#145A37", eta: "#5FA88C", ev: "#A5B545", voa: "#DFA132", vr: "#CF4F38", ban: "#3A1D28" };
  var DARK_TEXT = { ev: 1, voa: 1, eta: 1 };

  function current() {
    var v = sel.value, e = v && d.p[v];
    if (!e) return null;
    return { iso: v, name: sel.options[sel.selectedIndex].text, status: e[0], days: e[1] };
  }
  function link(r) { return location.origin + location.pathname + "?p=" + r.iso; }
  function sentence(r) {
    var ph = d.ph[r.status] || "";
    return S.line.replace("{from}", r.name).replace("{to}", S.dest) + ": " + ph + (r.days ? d.days.replace("{n}", r.days) : "") + ".";
  }

  function wrap(ctx, text, maxW) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function draw(r) {
    var W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d"), col = COL[r.status] || "#555", ink = DARK_TEXT[r.status] ? "#1d1a22" : "#ffffff";
    var serif = "Georgia, 'Times New Roman', serif", sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    x.fillStyle = "#F4F1EC"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#2a2433"; x.font = "600 44px " + sans; x.textBaseline = "top";
    var y = 110;
    wrap(x, S.route.replace("{from}", r.name).replace("{to}", S.dest), W - 180).forEach(function (l) { x.fillText(l, 90, y); y += 58; });
    y += 40;
    x.fillStyle = col; x.fillRect(90, y, W - 180, 560);
    x.fillStyle = ink; x.font = "700 92px " + serif;
    var ph = d.ph[r.status] || ""; ph = ph.charAt(0).toUpperCase() + ph.slice(1);
    var ty = y + 70;
    wrap(x, ph, W - 300).slice(0, 4).forEach(function (l) { x.fillText(l, 150, ty); ty += 108; });
    if (r.days) { x.font = "500 52px " + sans; x.fillText(S.stay.replace("{n}", r.days), 150, ty + 20); }
    y += 560 + 70;
    x.fillStyle = "#5b5466"; x.font = "400 36px " + sans;
    wrap(x, S.checked, W - 180).forEach(function (l) { x.fillText(l, 90, y); y += 48; });
    x.fillStyle = "#6B3F69"; x.font = "700 46px " + sans;
    x.fillText("travelnow.info" + location.pathname, 90, H - 150);
    return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/png"); });
  }

  function done(msg) {
    var s = document.getElementById("chk-share-status");
    if (s) { s.textContent = msg; setTimeout(function () { s.textContent = ""; }, 4000); }
  }
  function copy(url) {
    var ok = function () { done(S.copied); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { done(url); });
    else done(url);
  }

  btn.addEventListener("click", function () {
    var r = current(); if (!r) return;
    var url = link(r), text = sentence(r);
    try { if (window.gtag) window.gtag("event", "share_answer", { destination: location.pathname.split("/")[2] || "", passport: r.iso }); } catch (e) {}
    if (!navigator.share) { copy(url); return; }
    draw(r).then(function (blob) {
      var file = blob && typeof File === "function" ? new File([blob], "travelnow-" + r.iso.toLowerCase() + "-" + (location.pathname.split("/")[2] || "") + ".png", { type: "image/png" }) : null;
      var withFile = file && navigator.canShare && navigator.canShare({ files: [file] });
      return navigator.share(withFile ? { files: [file], text: text + " " + url } : { title: document.title, text: text, url: url });
    }).catch(function (e) { if (!e || e.name !== "AbortError") copy(url); });
  });

  function sync() { btn.hidden = !current(); }
  sel.addEventListener("change", sync);
  sync();
  // Exposed for tests only.
  window.__shareCardDraw = function () { var r = current(); return r ? draw(r) : Promise.resolve(null); };
})();

/* Resumen del viaje al parar, y botón "Este dato está mal". */
(function () {
  "use strict";
  var A = window.App, C = A.C, run = A.run;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function toast(t) { A.emit("toast", t); }

  /* ---------- Este dato está mal ---------- */
  var btn = $("btnWrong");
  function sync() { btn.disabled = !run.lastFact; }
  A.on("fact", sync); A.on("trip", sync);
  btn.addEventListener("click", function () {
    var lf = run.lastFact; if (!lf) return;
    var p = A.byId[lf.id];
    var added = A.Edits && A.Edits.flag(lf.id, p ? p.n : lf.id, lf.text);
    toast(added ? "Anotado. Saldrá en «Exportar cambios» para que se revise." : "Ese dato ya estaba anotado como incorrecto.");
  });

  /* ---------- Resumen ---------- */
  function fmtTime(ms) {
    var m = Math.round(ms / 60000), h = Math.floor(m / 60);
    return h ? h + " h " + (m % 60 < 10 ? "0" : "") + (m % 60) + " min" : m + " min";
  }
  function build(T) {
    var s = C.stats(T.pts), seen = {}, towns = [], facts = 0;
    (T.log || []).forEach(function (e) {
      if (!seen[e.id]) { seen[e.id] = 1; towns.push(e.n); }
      facts++;
    });
    return { km: s.km, ms: s.ms, avg: s.avgKmh, max: s.maxKmh, towns: towns, facts: facts, date: new Date(T.start).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) };
  }
  function textOf(r) {
    var t = "Mi viaje con Ruta con Historia, " + r.date + ":\n" + r.km.toFixed(1).replace(".", ",") + " km en " + fmtTime(r.ms) + ".\n";
    if (r.towns.length) t += "Pasé por " + r.towns.join(", ") + ".\n";
    t += "Escuché " + r.facts + (r.facts === 1 ? " dato" : " datos") + " de historia por el camino.";
    return t;
  }
  var modal = el("div", "modal"); modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  var sheet = el("div", "sheet"); modal.appendChild(sheet); document.body.appendChild(modal);
  function close() { modal.hidden = true; document.body.classList.remove("modal-open"); }
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  function show() {
    var T = A.trip(); if (!T || !T.pts || T.pts.length < 2) return;
    var r = build(T);
    sheet.textContent = "";
    sheet.appendChild(el("h2", null, "Resumen del viaje"));
    var grid = el("div", "sum-grid");
    [[r.km.toFixed(1).replace(".", ","), "km"], [fmtTime(r.ms), "tiempo"], [String(r.towns.length), r.towns.length === 1 ? "lugar" : "lugares"], [String(r.facts), r.facts === 1 ? "dato" : "datos"]].forEach(function (x) {
      var c = el("div", "sum-cell"); c.appendChild(el("b", null, x[0])); c.appendChild(el("span", null, x[1])); grid.appendChild(c);
    });
    sheet.appendChild(grid);
    if (r.towns.length) sheet.appendChild(el("p", "note", "Pasaste por: " + r.towns.join(", ") + "."));
    var row = el("div", "row");
    var sh = el("button", "btn", "Compartir"); sh.type = "button";
    sh.addEventListener("click", function () {
      var t = textOf(r);
      if (navigator.share) navigator.share({ text: t }).catch(function () {});
      else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast("Resumen copiado. Pégalo donde quieras."); });
    });
    var cl = el("button", "btn ghost", "Cerrar"); cl.type = "button"; cl.addEventListener("click", close);
    row.appendChild(sh); row.appendChild(cl); sheet.appendChild(row);
    modal.hidden = false; document.body.classList.add("modal-open");
  }
  A.showSummary = show;

  /* Al parar un viaje real de más de medio kilómetro. Se espera un instante para no salir al empezar otro viaje. */
  A.on("stopped", function () {
    setTimeout(function () { if (!run.on && A.savedTrip()) show(); }, 400);
  });
})();

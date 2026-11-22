/* Ventana de novedades al actualizar la app. */
(function () {
  "use strict";
  var A = window.App, run = A.run, N = window.NOVEDADES || [];
  if (!N.length) return;
  var CUR = N.reduce(function (m, e) { return Math.max(m, e.v); }, 0);
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function seen() { try { var v = localStorage.getItem("rch.novSeen"); return v == null ? null : +v; } catch (e) { return null; } }
  function mark() { try { localStorage.setItem("rch.novSeen", String(CUR)); } catch (e) { } }

  var modal = el("div", "modal"); modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  var sheet = el("div", "sheet"); modal.appendChild(sheet); document.body.appendChild(modal);
  function close() { modal.hidden = true; document.body.classList.remove("modal-open"); mark(); }
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  function show(since) {
    var list = N.filter(function (e) { return e.v > since; }).slice(0, 6);
    if (!list.length) list = N.slice(0, 3);
    sheet.textContent = "";
    sheet.appendChild(el("h2", null, "Novedades"));
    list.forEach(function (e) {
      sheet.appendChild(el("h3", null, "Versión " + e.v));
      var ul = el("ul", "nov");
      e.items.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      sheet.appendChild(ul);
    });
    var b = el("button", "btn", "Entendido"); b.type = "button"; b.addEventListener("click", close);
    sheet.appendChild(b);
    modal.hidden = false; document.body.classList.add("modal-open");
  }
  A.showNovedades = function () { show(-1); };

  function auto() {
    var s = seen();
    if (s != null && s >= CUR) return;
    if (run.on || document.querySelector(".modal:not([hidden])")) return;
    show(s == null ? CUR - 2 : s);
  }
  /* Tras abrir la app, cuando no haya otra ventana ni viaje en marcha. */
  var tries = 0;
  function wait() { auto(); if ((seen() == null || seen() < CUR) && modal.hidden && ++tries < 20) setTimeout(wait, 4000); }
  setTimeout(wait, 3500);

  var bt = document.getElementById("btnNov");
  if (bt) bt.addEventListener("click", function () { show(-1); });
})();

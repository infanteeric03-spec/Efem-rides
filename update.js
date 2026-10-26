/* Avisos de versión nueva para la app Android (en la web no hace nada: la web se actualiza sola). */
(function () {
  "use strict";
  var A = window.App;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  if (!A.native) return;

  var REPO = "infanteeric03-spec/efem-rides";
  var APK = "https://github.com/" + REPO + "/releases/latest/download/ruta-con-historia.apk";
  var mine = +window.APP_BUILD || 0;
  var plugin = window.Capacitor.registerPlugin("SpeechDuck");
  var st = load("rch.update", {}) || {};
  var latest = null;

  $("appSec").hidden = false;
  $("appVer").textContent = mine ? "Compilación " + mine : "Compilación de prueba";

  function check(manual) {
    if (!navigator.onLine) { if (manual) A.emit("toast", "Necesitas conexión para buscar actualizaciones."); return; }
    if (manual) { $("btnUpd").disabled = true; $("btnUpd").textContent = "Buscando…"; }
    fetch("https://api.github.com/repos/" + REPO + "/releases/latest", { headers: { "Accept": "application/vnd.github+json" } }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (rel) {
      var m = /(\d+)\s*$/.exec(rel.tag_name || ""), n = m ? +m[1] : 0;
      st.last = Date.now(); save("rch.update", st);
      latest = { n: n, url: APK };
      (rel.assets || []).forEach(function (a) { if (/\.apk$/i.test(a.name)) latest.url = a.browser_download_url; });
      if (n > mine && (manual || st.dismissed !== n)) show();
      else if (manual) A.emit("toast", "Tienes la última versión (compilación " + mine + ").");
    }).catch(function () {
      if (manual) A.emit("toast", "No he podido consultar GitHub. Inténtalo más tarde.");
    }).then(function () {
      if (manual) { $("btnUpd").disabled = false; $("btnUpd").textContent = "Buscar actualización"; }
    });
  }
  function show() {
    $("updText").textContent = "Hay una versión nueva de la app (compilación " + latest.n + "; tienes la " + mine + "). Descárgala e instálala encima: se conservan tus ajustes y viajes.";
    $("updBar").hidden = false;
  }
  $("updGo").addEventListener("click", function () {
    $("updBar").hidden = true;
    plugin.openUrl({ url: latest ? latest.url : APK }).catch(function () { A.emit("toast", "No he podido abrir la descarga. Usa el enlace de Releases en GitHub."); });
  });
  $("updLater").addEventListener("click", function () {
    $("updBar").hidden = true;
    if (latest) { st.dismissed = latest.n; save("rch.update", st); }
  });
  $("btnUpd").addEventListener("click", function () { check(true); });

  /* Comprobación automática: como mucho una vez al día, unos segundos después de abrir. */
  if (!st.last || Date.now() - st.last > 20 * 3600000) setTimeout(function () { check(false); }, 4000);
})();

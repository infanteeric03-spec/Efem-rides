/* Mapa real (Leaflet + mapa de OpenStreetMap) de la ruta preparada con los lugares de los que se hablará,
   y selector de posición para los lugares nuevos. */
(function () {
  "use strict";
  var A = window.App, C = A.C;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------- Cargar Leaflet (incluido en el proyecto, carpeta vendor) solo cuando hace falta ---------- */
  var loading = null;
  function leaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "vendor/leaflet/leaflet.css"; document.head.appendChild(css);
      var s = document.createElement("script"); s.src = "vendor/leaflet/leaflet.js";
      s.onload = function () { res(window.L); }; s.onerror = function () { loading = null; rej(new Error("leaflet")); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function dark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function tiles(Lf) {
    /* Mapa estándar de OpenStreetMap (CARTO pasó a pedir clave). En tema oscuro se oscurece con un filtro. */
    return Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, className: dark() ? "tiles-dark" : "",
      attribution: "© <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\">OpenStreetMap</a>"
    });
  }

  /* ---------- Mapa de la ruta ---------- */
  var map = null, layer = null, big = false;
  var COL = { own: "#6a3b1c", wiki: "#e6b94b", efem: "#f08a5d", off: "#8a9a97" };

  function popupFor(p, info) {
    var box = el("div", "rpop");
    box.appendChild(el("strong", null, p.n));
    var kind = p.src === "wikipedia" ? "De Wikipedia" : p.custom ? "Lugar tuyo" : "Lugar de la app";
    box.appendChild(el("span", "rpop-kind", kind + " · " + C.regName(p.reg)));
    if (info.efem[p.id]) box.appendChild(el("p", "rpop-efem", "Efeméride del día: " + info.efem[p.id]));
    var t = p.h && p.h[0] ? p.h[0] : "";
    box.appendChild(el("p", null, t.length > 190 ? t.slice(0, 187) + "…" : t));
    var row = el("div", "rpop-acts");
    var play = el("button", "btn small", "Escuchar"); play.type = "button";
    play.addEventListener("click", function () { A.speakPlace(p); });
    var skipped = A.routeSkip && A.routeSkip(p.id);
    var sk = el("button", "btn ghost small", skipped ? "Volver a incluir" : "Quitar de este viaje"); sk.type = "button";
    sk.addEventListener("click", function () {
      var nowOff = A.toggleRouteSkip(p.id);
      A.emit("toast", nowOff ? p.n + " no se contará en este viaje." : p.n + " vuelve a estar en el viaje.");
      draw();
    });
    row.appendChild(play); row.appendChild(sk);
    if (A.Edits) { var ed = el("button", "btn ghost small", "Editar"); ed.type = "button"; ed.addEventListener("click", function () { map.closePopup(); A.Edits.open(p); }); row.appendChild(ed); }
    box.appendChild(row);
    return box;
  }

  function draw() {
    var info = A.routeInfo && A.routeInfo();
    if (!map || !info) return;
    var Lf = window.L;
    if (layer) layer.remove();
    layer = Lf.layerGroup().addTo(map);
    var line = Lf.polyline(info.line, { color: "#e6b94b", weight: 5, opacity: .9 }).addTo(layer);
    Lf.polyline(info.line, { color: "#1b1303", weight: 9, opacity: .25 }).addTo(layer).bringToBack();
    var start = info.line[0], end = info.line[info.line.length - 1];
    [[start, "Salida: " + info.from], [end, "Llegada: " + info.to]].forEach(function (x) {
      Lf.circleMarker(x[0], { radius: 6, color: "#ffffff", weight: 3, fillColor: "#10201f", fillOpacity: 1 }).addTo(layer).bindTooltip(x[1]);
    });
    info.places.forEach(function (p) {
      var off = p.hidden || (A.routeSkip && A.routeSkip(p.id));
      var kind = off ? "off" : info.efem[p.id] ? "efem" : p.src === "wikipedia" ? "wiki" : "own";
      var m = Lf.circleMarker([p.lat, p.lon], {
        radius: kind === "efem" ? 11 : kind === "wiki" ? 6 : 9, color: kind === "wiki" ? "#1b1303" : "#ffffff", weight: 2.5,
        fillColor: COL[kind], fillOpacity: off ? .45 : 1
      }).addTo(layer);
      m.bindTooltip(p.n, { direction: "top", offset: [0, -8] });
      m.bindPopup(function () { return popupFor(p, info); }, { maxWidth: 280 });
    });
    map.fitBounds(line.getBounds(), { padding: [24, 24] });
  }

  function ensure() {
    var info = A.routeInfo && A.routeInfo(), wrap = $("rMapWrap");
    wrap.hidden = !info;
    if (!info || $("pPanel").hidden) return;
    leaflet().then(function (Lf) {
      if (!map) {
        map = Lf.map("rMap", { zoomControl: true, attributionControl: true, tap: true });
        tiles(Lf).addTo(map);
      }
      setTimeout(function () { map.invalidateSize(); draw(); }, 60);
    }).catch(function () {
      $("rMap").textContent = "No he podido cargar el mapa. Comprueba la conexión.";
    });
  }
  $("pToggle").addEventListener("click", function () { setTimeout(ensure, 80); });
  $("rMapBig").addEventListener("click", function () {
    big = !big; $("rMapWrap").classList.toggle("big", big);
    this.textContent = big ? "Reducir el mapa" : "Ampliar el mapa";
    if (map) setTimeout(function () { map.invalidateSize(); draw(); }, 80);
  });
  A.on("places", function () { if (map && !$("rMapWrap").hidden) draw(); });

  /* ---------- Elegir un punto en el mapa (lugares nuevos) ---------- */
  function pick(lat, lon, cb) {
    var ov = el("div", "modal pick"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Elegir la posición en el mapa");
    var sh = el("div", "sheet pick-sheet");
    sh.appendChild(el("p", "note", "Toca en el mapa donde está el lugar."));
    var mdiv = el("div", "rmap pick-map"); mdiv.id = "pickMap"; sh.appendChild(mdiv);
    var row = el("div", "row");
    var ok = el("button", "btn", "Usar este punto"); ok.type = "button"; ok.disabled = lat == null;
    var no = el("button", "btn ghost", "Cancelar"); no.type = "button";
    row.appendChild(ok); row.appendChild(no); sh.appendChild(row);
    ov.appendChild(sh); document.body.appendChild(ov);
    var chosen = lat != null ? [lat, lon] : null, pm = null, mk = null;
    function done() { if (pm) pm.remove(); ov.remove(); }
    no.addEventListener("click", done);
    ok.addEventListener("click", function () { if (chosen) cb(chosen[0], chosen[1]); done(); });
    leaflet().then(function (Lf) {
      var c = chosen || (A.run.cur ? [A.run.cur.lat, A.run.cur.lon] : [43.36, -5.85]);
      pm = Lf.map("pickMap").setView(c, chosen || A.run.cur ? 14 : 9);
      tiles(Lf).addTo(pm);
      function put(ll) {
        chosen = [ll.lat, ll.lng]; ok.disabled = false;
        if (mk) mk.setLatLng(ll); else mk = Lf.circleMarker(ll, { radius: 10, color: "#ffffff", weight: 3, fillColor: COL.own, fillOpacity: 1 }).addTo(pm);
      }
      if (chosen) put({ lat: chosen[0], lng: chosen[1] });
      pm.on("click", function (e) { put(e.latlng); });
      setTimeout(function () { pm.invalidateSize(); }, 60);
    }).catch(function () { mdiv.textContent = "No he podido cargar el mapa. Comprueba la conexión o usa tu ubicación."; });
  }

  A.Map = { refresh: ensure, pick: pick };
})();

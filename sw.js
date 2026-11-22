/* Service worker: guarda la app para que abra sin cobertura. */
var CACHE = "ruta-historia-v62";
var ARCHIVOS = [
  "./", "./index.html", "./style.css?v=62", "./engine.js?v=62", "./ui.js?v=62", "./drive.js?v=62", "./radio.js?v=62", "./explore.js?v=62", "./home.js?v=62", "./update.js?v=62", "./edits.js?v=62", "./summary.js?v=62", "./bt.js?v=62", "./fondos/costa.png", "./fondos/montanas.png", "./fondos/mapa.png", "./fondos/camino.png", "./fondos/arcos.png", "./auto.js?v=62", "./routemap.js?v=62", "./guide.js?v=62", "./novedades.js?v=62", "./novedades-ui.js?v=62", "./vendor/leaflet/leaflet.js", "./vendor/leaflet/leaflet.css", "./core.js?v=62",
  "./data-asturias.js?v=62", "./data-cantabria.js?v=62", "./data-dias.js?v=62",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var propio = url.origin === self.location.origin;
  var fuentes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!propio && !fuentes) return;
  // Primero la red para los archivos propios (así las actualizaciones llegan), y la caché si no hay cobertura.
  if (propio) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); });
      return r;
    }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match("./index.html"); }); }));
    return;
  }
  // Fuentes: caché primero.
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); });
      return r;
    });
  }));
});

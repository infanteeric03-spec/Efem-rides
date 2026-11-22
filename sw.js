/* Service worker: guarda la app para que abra sin cobertura. */
var CACHE = "ruta-historia-v63";
var ARCHIVOS = [
  "./", "./index.html", "./style.css?v=63", "./engine.js?v=63", "./ui.js?v=63", "./drive.js?v=63", "./radio.js?v=63", "./explore.js?v=63", "./home.js?v=63", "./update.js?v=63", "./edits.js?v=63", "./summary.js?v=63", "./bt.js?v=63", "./fondos/costa.png", "./fondos/montanas.png", "./fondos/mapa.png", "./fondos/camino.png", "./fondos/arcos.png", "./auto.js?v=63", "./routemap.js?v=63", "./guide.js?v=63", "./novedades.js?v=63", "./novedades-ui.js?v=63", "./vendor/leaflet/leaflet.js", "./vendor/leaflet/leaflet.css", "./core.js?v=63",
  "./data-asturias.js?v=63", "./data-cantabria.js?v=63", "./data-dias.js?v=63",
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

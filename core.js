/* Lógica sin interfaz: distancias, detección de lugares, estadísticas, GPX y simulación.
   Funciona en el navegador (window.Core) y en Node (module.exports) para poder probarla. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var RAD = Math.PI / 180, R = 6371;
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var REGIONES = { AST: "Asturias", CAN: "Cantabria" };

  function dist(lat1, lon1, lat2, lon2) {
    var dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /* Lugar en cuyo radio estás (el más "centrado" si hay varios). mul amplía o reduce los radios. */
  function inside(lat, lon, places, mul) {
    var best = null;
    mul = mul || 1;
    for (var i = 0; i < places.length; i++) {
      var p = places[i], d = dist(lat, lon, p.lat, p.lon), lim = p.rad * mul;
      if (d <= lim) {
        var score = d / lim;
        if (!best || score < best.score) best = { p: p, d: d, score: score };
      }
    }
    return best;
  }

  /* Lugar más cercano, opcionalmente filtrando con skip(p) -> true para descartar. */
  function nearest(lat, lon, places, skip) {
    var best = null;
    for (var i = 0; i < places.length; i++) {
      var p = places[i];
      if (skip && skip(p)) continue;
      var d = dist(lat, lon, p.lat, p.lon);
      if (!best || d < best.d) best = { p: p, d: d };
    }
    return best;
  }

  /* Región según el lugar catalogado más próximo, si está a menos de maxKm. */
  function regionAt(lat, lon, places, maxKm) {
    var n = nearest(lat, lon, places);
    return n && n.d <= (maxKm || 45) ? n.p.reg : null;
  }

  /* Dato que toca contar de un lugar, rotando por todos. told = datos ya contados en total. */
  function pickFact(place, told) {
    var n = place.h.length, i = ((told || 0) % n + n) % n;
    return { i: i, n: n, text: place.h[i] };
  }

  function today(date, efem) {
    var m = date.getMonth() + 1, d = date.getDate(), exact = [], month = [];
    for (var i = 0; i < efem.length; i++) {
      if (efem[i].m !== m) continue;
      if (efem[i].d === d) exact.push(efem[i]);
      else if (efem[i].d === null) month.push(efem[i]);
    }
    return { exact: exact, month: month };
  }

  function dateEs(date) { return date.getDate() + " de " + MESES[date.getMonth()]; }

  /* ¿Merece la pena guardar este punto? Cada 40 m o cada 30 s. */
  function shouldRecord(last, lat, lon, t) {
    if (!last) return true;
    return dist(last[0], last[1], lat, lon) >= 0.04 || t - last[2] >= 30000;
  }

  /* points: [lat, lon, tMs, kmh] */
  function stats(points) {
    var km = 0, maxKmh = 0, moving = 0;
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i], dt = (b[2] - a[2]) / 1000;
      var d = dist(a[0], a[1], b[0], b[1]);
      if (dt <= 0) continue;
      var v = d / (dt / 3600);
      if (v > 250) continue; // salto de GPS
      if (d < 0.005) continue; // ruido parado
      km += d;
      if (v > 3) moving += dt;
      if (b[3] != null && b[3] > maxKmh) maxKmh = b[3]; else if (v > maxKmh && v < 200) maxKmh = v;
    }
    var ms = points.length > 1 ? points[points.length - 1][2] - points[0][2] : 0;
    return { km: km, ms: ms, movingMs: moving * 1000, maxKmh: maxKmh, avgKmh: moving > 0 ? km / (moving / 3600) : 0 };
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function gpx(points, name) {
    var out = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx version="1.1" creator="Ruta con Historia" xmlns="http://www.topografix.com/GPX/1/1">',
      "<trk><name>" + esc(name) + "</name><trkseg>"];
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      out.push('<trkpt lat="' + p[0].toFixed(6) + '" lon="' + p[1].toFixed(6) + '"><time>' + new Date(p[2]).toISOString() + "</time></trkpt>");
    }
    out.push("</trkseg></trk></gpx>");
    return out.join("\n");
  }

  /* Puntos cada stepKm a lo largo de la línea que une los lugares dados (ids). */
  function simPath(ids, places, stepKm) {
    var by = {}, pts = [];
    places.forEach(function (p) { by[p.id] = p; });
    var wp = ids.map(function (id) { return by[id]; }).filter(Boolean);
    for (var i = 0; i < wp.length - 1; i++) {
      var a = wp[i], b = wp[i + 1], d = dist(a.lat, a.lon, b.lat, b.lon);
      var n = Math.max(1, Math.round(d / stepKm));
      for (var k = 0; k < n; k++) {
        var f = k / n;
        pts.push([a.lat + (b.lat - a.lat) * f, a.lon + (b.lon - a.lon) * f]);
      }
    }
    if (wp.length) pts.push([wp[wp.length - 1].lat, wp[wp.length - 1].lon]);
    return pts;
  }

  /* Trocea un texto en frases de hasta max caracteres (la voz de Android corta los textos largos). */
  function chunks(text, max) {
    max = max || 170;
    var parts = text.match(/[^.!?]+[.!?]*\s*/g) || [text], out = [], cur = "";
    parts.forEach(function (s) {
      s = s.trim();
      if (!s) return;
      while (s.length > max) {
        var cut = s.lastIndexOf(",", max);
        if (cut < 40) cut = s.lastIndexOf(" ", max);
        if (cut < 1) cut = max;
        if (cur) { out.push(cur); cur = ""; }
        out.push(s.slice(0, cut + 1).trim());
        s = s.slice(cut + 1).trim();
      }
      if (!s) return;
      if (cur && (cur + " " + s).length > max) { out.push(cur); cur = s; }
      else cur = cur ? cur + " " + s : s;
    });
    if (cur) out.push(cur);
    return out;
  }

  function fmtKm(km) {
    if (km < 1) return Math.round(km * 10) * 100 + " m";
    return (km < 10 ? km.toFixed(1) : String(Math.round(km))).replace(".", ",") + " km";
  }

  function fmtDur(ms) {
    var m = Math.floor(ms / 60000), h = Math.floor(m / 60);
    m = m % 60;
    return h ? h + " h " + (m < 10 ? "0" : "") + m + " min" : m + " min";
  }

  return {
    dist: dist, inside: inside, nearest: nearest, regionAt: regionAt, pickFact: pickFact,
    today: today, dateEs: dateEs, shouldRecord: shouldRecord, stats: stats, gpx: gpx,
    simPath: simPath, chunks: chunks, fmtKm: fmtKm, fmtDur: fmtDur,
    MESES: MESES, REGIONES: REGIONES,
    regName: function (r) { return REGIONES[r] || r || ""; }
  };
});

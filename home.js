/* Pantalla de inicio: provincia y localidad donde está el móvil, y efemérides de esa provincia
   con botones de anterior y siguiente. */
(function () {
  "use strict";
  var A = window.App, C = A.C, L = A.L, E = window.EFEMERIDES || [], run = A.run;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  var loc = load("rch.loc", null);   // { prov, town, approx, lat, lon, t }
  var items = [], idx = 0, locating = false;

  /* ---------- Dónde estoy ---------- */
  function getJSON(url, ms) {
    if (!window.fetch) return Promise.reject(new Error("sin fetch"));
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 10000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, headers: { "Accept": "application/json" } }).then(function (r) {
      clearTimeout(to); if (!r.ok) throw new Error("HTTP " + r.status); return r.json();
    }, function (e) { clearTimeout(to); throw e; });
  }
  function nearestKnown(lat, lon) {
    var best = null, bd = 20;
    L.forEach(function (p) { var d = C.dist(lat, lon, p.lat, p.lon); if (d < bd) { bd = d; best = p; } });
    return best ? { prov: C.regName(best.reg), town: best.n, approx: bd > (best.rad || 2) } : null;
  }
  function reverse(lat, lon) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=es&lat=" + lat.toFixed(5) + "&lon=" + lon.toFixed(5);
    return getJSON(url).then(function (j) {
      var a = (j && j.address) || {};
      var prov = a.province || a.state_district || a.county || a.state || "";
      prov = prov.replace(/^Principado de /i, "").replace(/^Comunidad de /i, "").replace(/^Provincia de /i, "");
      var town = a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || a.county || "";
      if (!prov && !town) throw new Error("sin datos");
      return { prov: prov, town: town, approx: false };
    });
  }
  function setLoc(lat, lon) {
    var near = nearestKnown(lat, lon);
    if (near && (!loc || C.dist(lat, lon, loc.lat || 0, loc.lon || 0) > 2)) { loc = { prov: near.prov, town: near.town, approx: near.approx, lat: lat, lon: lon, t: Date.now() }; refresh(); }
    if (!navigator.onLine) return Promise.resolve();
    return reverse(lat, lon).then(function (r) {
      loc = { prov: r.prov, town: r.town, approx: false, lat: lat, lon: lon, t: Date.now() };
      save("rch.loc", loc); refresh();
    }).catch(function () { if (loc) save("rch.loc", loc); });
  }
  function locate(ask) {
    if (locating || !navigator.geolocation || !window.isSecureContext) return;
    function go() {
      locating = true; renderLabel();
      navigator.geolocation.getCurrentPosition(function (p) {
        locating = false;
        setLoc(p.coords.latitude, p.coords.longitude);
      }, function () { locating = false; renderLabel(); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60000 });
    }
    /* Sin permiso concedido no se pregunta al abrir la app: solo si la persona toca la señal. */
    if (ask) { go(); return; }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then(function (s) { if (s.state === "granted") go(); }, function () {});
    }
  }
  A.homeLabel = function () {
    if (!loc) return locating ? "Buscando tu ubicación…" : "Toca aquí para ver dónde estás";
    var p = loc.prov, t = loc.town;
    if (!t || norm(t) === norm(p)) return p || t;
    return (p ? p + " · " : "") + (loc.approx ? "cerca de " : "") + t;
  };
  function renderLabel() {
    if (run.on) return;
    var r = $("signReg");
    r.textContent = A.homeLabel();
    r.classList.toggle("tap", !loc);
  }
  $("signReg").addEventListener("click", function () { if (!run.on && !loc) locate(true); });
  /* Al terminar un viaje se aprovecha la última posición del GPS. */
  A.on("trip", function () { if (!run.on && run.lastFix) setLoc(run.lastFix.lat, run.lastFix.lon); else renderLabel(); });

  /* ---------- Efemérides ---------- */
  function regionCode(prov) { var n = norm(prov); return /asturias/.test(n) ? "AST" : /cantabria/.test(n) ? "CAN" : null; }
  function dayOfYear(m, d) { return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000); }
  function circDist(a, b) { var x = Math.abs(a - b); return Math.min(x, 365 - x); }
  function dateLabel(e) { return (e.d ? e.d + " de " : "") + C.MESES[e.m - 1] + (e.y ? " de " + e.y : ""); }

  function localItems(code, now) {
    if (!code) return [];
    var today = dayOfYear(now.getMonth() + 1, now.getDate());
    return E.filter(function (e) { return e.r && e.r.indexOf(code) >= 0; }).map(function (e) {
      var d = circDist(today, dayOfYear(e.m, e.d || 15));
      var sameDay = e.m === now.getMonth() + 1 && e.d === now.getDate();
      var sameMonth = e.m === now.getMonth() + 1;
      return { k: sameDay ? 0 : sameMonth ? 1 + d / 100 : 2 + d / 100, head: sameDay ? "Hoy, " + C.dateEs(now) : sameMonth && !e.d ? "En " + C.MESES[e.m - 1] : dateLabel(e), text: e.t };
    }).sort(function (a, b) { return a.k - b.k; });
  }

  /* Wikipedia: página del día (por ejemplo "25 de octubre"), líneas que mencionan la provincia o la localidad. */
  function cleanWiki(s) {
    s = s.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
    var prev; do { prev = s; s = s.replace(/\{\{[^{}]*\}\}/g, ""); } while (s !== prev);
    s = s.replace(/\[\[(?:Archivo|File|Imagen|Image):[^\]]*\]\]/gi, "");
    s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1").replace(/\[\[([^\]]*)\]\]/g, "$1");
    s = s.replace(/'''?/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return s;
  }
  function parseDay(wt) {
    var out = [], sec = "";
    String(wt).split("\n").forEach(function (line) {
      var h = line.match(/^==\s*([^=]+?)\s*==\s*$/);
      if (h) { sec = norm(h[1]); return; }
      if (!/^(acontecimientos|nacimientos|fallecimientos)/.test(sec)) return;
      var m = line.match(/^\*\s*\[\[(\d{1,4})\]\][^:]*:\s*(.+)$/);
      if (!m) return;
      var txt = cleanWiki(m[2]);
      if (txt.length < 15 || txt.length > 320) return;
      out.push({ y: +m[1], sec: sec.slice(0, 3), text: txt });
    });
    return out;
  }
  function wikiDay(now) {
    var key = "rch.wday." + (now.getMonth() + 1) + "-" + now.getDate(), c = load(key, null);
    if (c && Date.now() - c.t < 30 * 86400000) return Promise.resolve(c.items);
    if (!navigator.onLine) return Promise.resolve([]);
    var page = encodeURIComponent((now.getDate() + " de " + C.MESES[now.getMonth()]).replace(/ /g, "_"));
    return getJSON("https://es.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&origin=*&prop=wikitext&page=" + page, 12000).then(function (j) {
      var list = parseDay(j && j.parse && j.parse.wikitext);
      save(key, { t: Date.now(), items: list });
      return list;
    }).catch(function () { return []; });
  }
  function mentions(text, words) {
    var n = " " + norm(text) + " ";
    return words.some(function (w) { return w && new RegExp("[^a-z]" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^a-z]").test(n); });
  }
  function wikiItems(list, words, now, label) {
    return list.filter(function (x) { return mentions(x.text, words); }).map(function (x) {
      var verb = x.sec === "nac" ? "nace " : x.sec === "fal" ? "muere " : "";
      /* En minúscula solo si empieza por una palabra corriente; los nombres propios se respetan. */
      var t = /^(En|El|La|Los|Las|Un|Una|Se|Es|Son|Tras|Durante)\b/.test(x.text) ? x.text.charAt(0).toLowerCase() + x.text.slice(1) : x.text;
      return { k: 0.5, head: "Hoy, " + C.dateEs(now) + (label ? " · " + label : ""), text: "En " + x.y + ", " + verb + t };
    });
  }

  function build() {
    var now = new Date(), prov = loc ? loc.prov : "", town = loc ? loc.town : "", code = regionCode(prov);
    var local = localItems(code, now);
    /* Palabras para filtrar Wikipedia: provincia, localidad y, en Asturias y Cantabria, sus lugares propios. */
    var words = [norm(prov), norm(town)].filter(function (w) { return w.length > 2; });
    /* Solo nombres poco ambiguos: los de pueblos pequeños coinciden a menudo con apellidos. */
    if (code === "AST") words.push("asturias", "asturiano", "asturiana", "oviedo", "gijon", "aviles", "covadonga");
    if (code === "CAN") words.push("cantabria", "cantabro", "cantabra", "santander", "torrelavega", "santillana del mar");
    items = local.slice(0, 6);
    renderCard(prov);
    wikiDay(now).then(function (list) {
      var extra = wikiItems(list, words, now, prov);
      var seen = {};
      var all = extra.concat(local).filter(function (x) { if (seen[x.text]) return false; seen[x.text] = 1; return true; });
      if (all.length < 3) {
        var spain = wikiItems(list, ["espana", "espanol", "espanola"], now, "España").filter(function (x) { return !seen[x.text]; });
        all = all.concat(spain.slice(0, 3 - all.length + 2));
      }
      all.sort(function (a, b) { return a.k - b.k; });
      var cur = items[idx] && items[idx].text;
      items = all.slice(0, 8);
      var keep = items.findIndex(function (x) { return x.text === cur; });
      idx = keep >= 0 ? keep : 0;
      renderCard(prov);
    });
  }
  function renderCard(prov) {
    var head = $("todayHead"), text = $("todayText"), pos = $("todayPos");
    if (!items.length) {
      head.textContent = prov ? "Efemérides · " + prov : "Efemérides";
      text.textContent = loc ? "Todavía no tengo efemérides de " + (prov || "esta zona") + ". Con conexión buscaré las de hoy en Wikipedia." : "Toca la señal de arriba para usar tu ubicación y ver efemérides de tu provincia.";
      pos.textContent = ""; $("todayPrev").disabled = $("todayNext").disabled = true;
      return;
    }
    idx = (idx + items.length) % items.length;
    var it = items[idx];
    head.textContent = it.head;
    text.textContent = it.text;
    pos.textContent = (idx + 1) + " de " + items.length;
    $("todayPrev").disabled = $("todayNext").disabled = items.length < 2;
  }
  function step(n) { idx += n; renderCard(loc ? loc.prov : ""); }
  $("todayPrev").addEventListener("click", function () { step(-1); });
  $("todayNext").addEventListener("click", function () { step(1); });
  /* También se puede deslizar el dedo sobre la tarjeta. */
  var sx = null;
  $("todayCard").addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  $("todayCard").addEventListener("touchend", function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  var lastKey = "";
  function refresh() {
    renderLabel();
    var key = loc ? norm(loc.prov) + "|" + norm(loc.town) : "";
    if (key !== lastKey) { lastKey = key; build(); }
  }

  A.Home = { _parseDay: parseDay, _clean: cleanWiki, refresh: refresh, locate: locate, wikiDay: wikiDay, mentions: mentions, norm: norm };
  build(); renderLabel(); locate(false);
})();

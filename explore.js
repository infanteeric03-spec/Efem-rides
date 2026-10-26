/* Destinos nuevos: prepara una ruta con los pueblos de Wikipedia que hay junto a la carretera
   y, con cobertura, busca sobre la marcha los que falten. Los lugares propios siempre tienen prioridad. */
(function () {
  "use strict";
  var A = window.App, C = A.C, L = A.L, S = A.S, run = A.run;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  if (S.live === undefined) S.live = true;

  var WIKI = "https://es.wikipedia.org/w/api.php";
  var NOMI = "https://nominatim.openstreetmap.org/search";
  var OSRM = "https://router.project-osrm.org/route/v1/driving/";
  var R = load("rch.route", null);

  /* ---------- Red ---------- */
  function getJSON(url, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 12000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, headers: { "Accept": "application/json" } }).then(function (r) {
      clearTimeout(to);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { clearTimeout(to); throw e; });
  }
  function geocode(q) {
    return getJSON(NOMI + "?format=jsonv2&limit=5&countrycodes=es,pt,fr,ad&accept-language=es&q=" + encodeURIComponent(q)).then(function (list) {
      if (!list || !list.length) throw new Error("nogeo");
      var r = list[0];
      return { lat: +r.lat, lon: +r.lon, name: r.name || String(r.display_name).split(",")[0], full: r.display_name || "" };
    });
  }
  function myPosition() {
    return new Promise(function (res, rej) {
      if (run.cur) { res({ lat: run.cur.lat, lon: run.cur.lon, name: "Tu ubicación" }); return; }
      if (!navigator.geolocation) { rej(new Error("nogps")); return; }
      navigator.geolocation.getCurrentPosition(function (p) {
        res({ lat: p.coords.latitude, lon: p.coords.longitude, name: "Tu ubicación" });
      }, function () { rej(new Error("nogps")); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    });
  }
  function routeBetween(a, b) {
    return getJSON(OSRM + a.lon + "," + a.lat + ";" + b.lon + "," + b.lat + "?overview=full&geometries=geojson&alternatives=false&steps=false", 20000).then(function (j) {
      if (!j || j.code !== "Ok" || !j.routes || !j.routes.length) throw new Error("noroute");
      var r = j.routes[0];
      return { km: r.distance / 1000, min: r.duration / 60, pts: r.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }) };
    });
  }
  function wikiAround(lat, lon, radiusM) {
    var url = WIKI + "?action=query&format=json&formatversion=2&origin=*&redirects=1" +
      "&generator=geosearch&ggscoord=" + lat.toFixed(5) + "%7C" + lon.toFixed(5) + "&ggsradius=" + Math.min(10000, Math.round(radiusM)) + "&ggslimit=20&ggsnamespace=0" +
      "&prop=coordinates%7Cdescription%7Cextracts&exintro=1&explaintext=1&exlimit=20&colimit=20";
    return getJSON(url, 15000).then(function (j) { return (j && j.query && j.query.pages) || []; });
  }

  /* ---------- Geometría ---------- */
  function thin(pts, minKm) {
    if (!pts.length) return [];
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var l = out[out.length - 1];
      if (C.dist(l[0], l[1], pts[i][0], pts[i][1]) >= minKm) out.push(pts[i]);
    }
    var last = pts[pts.length - 1];
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  }
  function resample(pts, stepKm) {
    if (pts.length < 2) return pts.slice();
    var out = [pts[0]], carry = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = C.dist(a[0], a[1], b[0], b[1]);
      if (d === 0) continue;
      var t = stepKm - carry;
      while (t <= d) {
        var f = t / d;
        out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        t += stepKm;
      }
      carry = d - (t - stepKm);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function segDist(lat, lon, a, b) {
    var k = Math.cos(lat * Math.PI / 180) * 111.32, ky = 110.57;
    var px = lon * k, py = lat * ky, ax = a[1] * k, ay = a[0] * ky, bx = b[1] * k, by = b[0] * ky;
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    var x = ax + t * dx - px, y = ay + t * dy - py;
    return Math.sqrt(x * x + y * y);
  }
  function distToLine(lat, lon, pts) {
    var m = 1e9;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      if (Math.abs(a[0] - lat) > 0.2 && Math.abs(b[0] - lat) > 0.2) continue;
      var d = segDist(lat, lon, a, b);
      if (d < m) m = d;
    }
    return m;
  }
  function offset(lat, lon, brg, km) {
    var R0 = 6371, d = km / R0, t = brg * Math.PI / 180, p1 = lat * Math.PI / 180, l1 = lon * Math.PI / 180;
    var p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
    var l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    return [p2 * 180 / Math.PI, l2 * 180 / Math.PI];
  }

  /* ---------- Qué páginas sirven y cómo se cuentan ---------- */
  /* Se mira la primera palabra que define la página: "parroquia del concejo de Lena" es una parroquia, no un concejo. */
  var KINDS = [
    { re: /\b(calle|avenida|plaza|paseo|estaci[oó]n|apeadero|empresa|club|equipo|estadio|hotel|restaurante|centro comercial|autov[ií]a|autopista|carretera|l[ií]nea|colegio|instituto|hospital|pol[ií]gono|edificio|discoteca|bar|central|f[aá]brica|mina|aeropuerto|t[uú]nel|banda|grupo|persona|futbolista|pol[ií]tico|escritor|pel[ií]cula|batalla|r[ií]o|arroyo)\b/, w: null },
    { re: /\b(ciudad|villa|capital)\b/, w: 3, rad: 2.5 },
    { re: /\b(municipio|concejo|ayuntamiento)\b/, w: 3, rad: 2.5 },
    { re: /\b(localidad|pueblo|pedan[ií]a|poblaci[oó]n|entidad local)\b/, w: 2, rad: 1.5 },
    { re: /\bparroquia\b/, w: 1.6, rad: 1.5 },
    { re: /\b(puerto de monta[nñ]a|embalse|castillo|monasterio|iglesia|ermita|colegiata|catedral|santuario|parque natural|cueva|puente|yacimiento|torre|palacio|bas[ií]lica|monumento natural|lago|desfiladero|hayedo)\b/, w: 1.6, rad: 1 },
    { re: /\b(lugar|aldea|caser[ií]o|barrio|n[uú]cleo)\b/, w: 0.6, rad: 1 }
  ];
  function kindOf(page) {
    var desc = (page.description || "").toLowerCase();
    var ex = (page.extract || "");
    var lead = ex.split(/(?<=\.)\s/)[0] || "";
    var m = lead.toLowerCase().match(/\b(?:es|fue|son) (?:un|una|el|la) (.{0,120})/);
    function first(text) {
      var best = null, pos = 1e9;
      KINDS.forEach(function (k) { var r = text.search(k.re); if (r >= 0 && r < pos) { pos = r; best = k; } });
      return best;
    }
    var k = desc ? first(desc) : null;
    if (!k && m) k = first(m[1]);
    return k && k.w ? k : null;
  }
  /* Primero la descripción, luego la primera frase: el resto del texto puede nombrar otras regiones de paso. */
  function regionIn(t) {
    var m = t.match(/provincia de ([A-ZÁÉÍÓÚÑ][^,.;()\n]{1,30})/);
    if (m) { var pv = m[1].replace(/\s+(España|y)$/, "").trim(); return /^asturias$/i.test(pv) ? "AST" : /^cantabria$/i.test(pv) ? "CAN" : pv; }
    if (/\basturias(no|na)?\b|\bconcejo\b/i.test(t)) return "AST";
    if (/\bc[aá]ntabr(ia|o|a)\b/i.test(t)) return "CAN";
    var c = t.match(/\b(Galicia|Castilla y León|País Vasco|Euskadi|Navarra|La Rioja|Aragón|Madrid)\b/);
    return c ? c[1] : null;
  }
  function regionOf(page) {
    var lead = (page.extract || "").split(/(?<=\.)\s/)[0] || "";
    return regionIn(page.description || "") || regionIn(lead);
  }
  function clean(s) {
    s = String(s || "");
    var prev;
    do { prev = s; s = s.replace(/\s*\([^()]*\)/g, ""); } while (s !== prev);
    return s.replace(/\[[^\]]*\]/g, "").replace(/\s+([,.;:])/g, "$1").replace(/\s+/g, " ").trim();
  }
  function toFacts(text) {
    var sents = text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [text], out = [], cur = "";
    sents.forEach(function (s) {
      s = s.trim(); if (!s) return;
      if (cur && (cur.length >= 170 || (cur + " " + s).length > 420)) { out.push(cur); cur = s; }
      else cur = cur ? cur + " " + s : s;
    });
    if (cur) out.push(cur);
    if (out.length > 1 && out[out.length - 1].length < 70) { var last = out.pop(); out[out.length - 1] += " " + last; }
    return out.slice(0, 3);
  }
  function candidate(page, dRoute) {
    if (!page || !page.coordinates || !page.coordinates.length || !page.extract) return null;
    var k = kindOf(page); if (!k) return null;
    var text = clean(page.extract);
    if (text.length < 90) return null;
    var lat = page.coordinates[0].lat, lon = page.coordinates[0].lon;
    return {
      id: "wp" + page.pageid, n: String(page.title).replace(/\s*\([^)]*\)\s*$/, ""), reg: regionOf(page),
      lat: lat, lon: lon, rad: Math.max(k.rad, Math.min(4.5, dRoute + 1)), h: toFacts(text),
      src: "wikipedia", url: "https://es.wikipedia.org/?curid=" + page.pageid,
      score: k.w + Math.min(text.length, 900) / 450 - dRoute / 3
    };
  }
  function pick(cands, existing, sepKm, maxN) {
    cands.sort(function (a, b) { return b.score - a.score; });
    var out = [];
    for (var i = 0; i < cands.length && out.length < maxN; i++) {
      var c = cands[i], near = false;
      for (var j = 0; j < existing.length && !near; j++) if (C.dist(c.lat, c.lon, existing[j].lat, existing[j].lon) < sepKm) near = true;
      for (j = 0; j < out.length && !near; j++) if (C.dist(c.lat, c.lon, out[j].lat, out[j].lon) < sepKm) near = true;
      if (!near) out.push(c);
    }
    return out;
  }
  function fillRegions(list, fallback) {
    list.forEach(function (p) {
      if (p.reg) return;
      var best = null, bd = 30;
      L.concat(list).forEach(function (q) { if (q !== p && q.reg) { var d = C.dist(p.lat, p.lon, q.lat, q.lon); if (d < bd) { bd = d; best = q.reg; } } });
      p.reg = best || fallback || "En ruta";
    });
    list.forEach(function (p) { delete p.score; });
  }

  /* ---------- Lugares en la app ---------- */
  function builtIn() { return L.filter(function (p) { return !p.src; }); }
  function install() {
    for (var i = L.length - 1; i >= 0; i--) if (L[i].src) { delete A.byId[L[i].id]; L.splice(i, 1); }
    if (!R) return;
    (R.places || []).concat(R.live || []).forEach(function (p) { if (!A.byId[p.id]) { L.push(p); A.byId[p.id] = p; } });
  }
  function persist() {
    if (!R) { try { localStorage.removeItem("rch.route"); } catch (e) { /* nada */ } return; }
    if (!save("rch.route", R) && R.live && R.live.length > 50) { R.live = R.live.slice(-50); save("rch.route", R); }
  }
  A.routeLabel = function () { return R && R.to ? "Ruta a " + R.to : "Lugares de Wikipedia"; };
  A.routePath = function (stepKm) { return R && R.pts && R.pts.length > 1 ? resample(R.pts, stepKm) : null; };

  /* ---------- Preparar viaje ---------- */
  var preparing = false;
  /* ---------- Efemérides del día de salida en los pueblos del camino ---------- */
  function isoToday() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function dayKey(d) { return (d.getMonth() + 1) + "-" + d.getDate(); }
  function parseIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(); }
  function lowerFirst(t) { return /^(En|El|La|Los|Las|Un|Una)\b/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  /* Pueblos del camino: los de Wikipedia guardados y los propios a menos de 4 km de la carretera. */
  function placesOnRoute(line, places) {
    return places.concat(builtIn().filter(function (p) { return distToLine(p.lat, p.lon, line) <= 4; }));
  }
  function findDayEfem(date, line, places) {
    var H = A.Home, E = window.EFEMERIDES || [], m = date.getMonth() + 1, d = date.getDate(), items = [];
    var onRoute = placesOnRoute(line, places);
    function nm(s) { return H ? H.norm(s) : String(s).toLowerCase(); }
    E.forEach(function (e) {
      if (e.m !== m || e.d !== d) return;
      onRoute.forEach(function (p) { if (H && H.mentions(e.t, [nm(p.n)])) items.push({ id: p.id, n: p.n, text: e.t, src: "propia" }); });
    });
    if (!H) return Promise.resolve(items);
    return H.wikiDay(date).then(function (list) {
      list.forEach(function (x) {
        onRoute.forEach(function (p) {
          if (nm(p.n).length < 4 || !H.mentions(x.text, [nm(p.n)])) return;
          var verb = x.sec === "nac" ? "nace " : x.sec === "fal" ? "muere " : "";
          items.push({ id: p.id, n: p.n, text: "En " + x.y + ", " + verb + lowerFirst(x.text), src: "wikipedia" });
        });
      });
      var seen = {};
      return items.filter(function (i) { var k = i.id + "|" + i.text; if (seen[k]) return false; seen[k] = 1; return true; });
    });
  }
  /* Lo usa el motor al entrar en un lugar: si hoy es el día de una efeméride de ese lugar, la cuenta primero. */
  A.dayFact = function (p) {
    var now = new Date(), key = dayKey(now), H = A.Home, out = null;
    if (R && R.dayEfem && R.dayEfem.date === key) {
      var hit = R.dayEfem.items.filter(function (x) { return x.id === p.id; })[0];
      if (hit) out = hit.src === "wikipedia" ? "Un día como hoy, " + lowerFirst(hit.text) : "Hoy es un día señalado aquí. " + hit.text;
    }
    if (!out && H) {
      var e = (window.EFEMERIDES || []).filter(function (x) { return x.m === now.getMonth() + 1 && x.d === now.getDate() && H.mentions(x.t, [H.norm(p.n)]); })[0];
      if (e) out = "Hoy es un día señalado aquí. " + e.t;
    }
    return out;
  };

  function prepare(fromText, toText) {
    if (preparing) return;
    if (!toText) { status("Escribe a dónde vas.", "warn"); return; }
    if (!navigator.onLine) { status("Necesitas conexión para preparar el viaje.", "warn"); return; }
    preparing = true; $("pGo").disabled = true;
    var origin, dest, route;
    status("Buscando " + toText + "…");
    progress(0.02);
    Promise.all([fromText ? geocode(fromText) : myPosition(), geocode(toText)]).then(function (r) {
      origin = r[0]; dest = r[1];
      status("Calculando la ruta de " + origin.name + " a " + dest.name + "…");
      progress(0.06);
      return routeBetween(origin, dest);
    }).then(function (rt) {
      route = rt;
      var line = thin(rt.pts, 0.15), samples = resample(line, 4), pages = {}, done = 0;
      status("Ruta de " + C.fmtKm(rt.km) + ". Buscando los pueblos del camino…");
      var queue = samples.slice(), workers = [];
      function work() {
        var s = queue.shift(); if (!s) return Promise.resolve();
        return wikiAround(s[0], s[1], 5000).then(function (list) {
          list.forEach(function (p) { if (p && p.pageid && !pages[p.pageid]) pages[p.pageid] = p; });
        }, function () { /* un punto sin respuesta no detiene el resto */ }).then(function () {
          done++; progress(0.08 + 0.88 * done / samples.length);
          status("Buscando los pueblos del camino… " + done + " de " + samples.length);
          return work();
        });
      }
      for (var w = 0; w < 3; w++) workers.push(work());
      return Promise.all(workers).then(function () { return { line: line, pages: pages }; });
    }).then(function (res) {
      var cands = [];
      Object.keys(res.pages).forEach(function (id) {
        var p = res.pages[id];
        if (!p.coordinates || !p.coordinates.length) return;
        var d = distToLine(p.coordinates[0].lat, p.coordinates[0].lon, res.line);
        if (d > 4.2) return;
        var c = candidate(p, d); if (c) cands.push(c);
      });
      var places = pick(cands, builtIn(), 3, Math.ceil(route.km / 3) + 5);
      fillRegions(places, String(dest.full).split(",")[1] ? String(dest.full).split(",")[1].trim() : dest.name);
      var date = parseIso($("pDate").value);
      R = { from: origin.name, to: dest.name, km: route.km, min: route.min, created: Date.now(), pts: thin(route.pts, 0.3), places: places, live: (R && R.live) || [],
        date: $("pDate").value || isoToday(), dayEfem: { date: dayKey(date), items: [] } };
      install(); persist(); A.emit("places");
      status("Buscando efemérides del " + C.dateEs(date) + " en los pueblos del camino…");
      return findDayEfem(date, res.line, places).then(function (items) {
        R.dayEfem.items = items; persist();
        return places;
      }, function () { return places; });
    }).then(function (places) {
      progress(1);
      status("");
      renderPrep();
      var ne = R.dayEfem ? R.dayEfem.items.length : 0;
      A.emit("toast", "Viaje a " + dest.name + " preparado: " + places.length + " lugares" + (ne ? " y " + ne + (ne === 1 ? " efeméride" : " efemérides") + " del día" : "") + ".");
      A.emit("trip");
    }).catch(function (e) {
      var msg = e && e.message;
      status(msg === "nogeo" ? "No encuentro ese lugar. Prueba con un nombre más completo, por ejemplo \"León, España\"." :
        msg === "nogps" ? "No tengo tu ubicación. Escribe también desde dónde sales." :
        msg === "noroute" ? "No he podido calcular la ruta entre esos dos puntos." :
        "No he podido preparar el viaje. Comprueba la conexión e inténtalo otra vez.", "warn");
    }).then(function () { preparing = false; $("pGo").disabled = false; setTimeout(function () { progress(null); }, 600); });
  }

  /* ---------- Sobre la marcha ---------- */
  var lastQ = null, busyQ = false;
  A.on("fix", function (e) {
    if (!S.live || run.sim || busyQ || !navigator.onLine) return;
    if (run.heading == null || (run.kmh || 0) < 15) return;
    if (lastQ && C.dist(lastQ[0], lastQ[1], e.lat, e.lon) < 4) return;
    lastQ = [e.lat, e.lon];
    var pos = [e.lat, e.lon], ahead = offset(e.lat, e.lon, run.heading, 7), far = offset(e.lat, e.lon, run.heading, 14);
    var known = L.filter(function (p) { return segDist(p.lat, p.lon, pos, far) < 4; }).length;
    if (known >= 2) return;
    busyQ = true;
    wikiAround(ahead[0], ahead[1], 8000).then(function (pages) {
      var cands = [];
      pages.forEach(function (p) {
        if (!p.coordinates || !p.coordinates.length || A.byId["wp" + p.pageid]) return;
        var d = segDist(p.coordinates[0].lat, p.coordinates[0].lon, pos, far);
        if (d > 3.5) return;
        var c = candidate(p, d); if (c) cands.push(c);
      });
      var add = pick(cands, L, 3, 3);
      if (!add.length) return;
      fillRegions(add, run.region);
      if (!R) R = { live: [] };
      R.live = (R.live || []).concat(add).slice(-300);
      install(); persist(); A.emit("places");
    }).catch(function () { /* sin cobertura: se intentará más adelante */ }).then(function () { busyQ = false; });
  });

  /* ---------- Interfaz ---------- */
  function status(t, kind) { var s = $("pStatus"); s.textContent = t || ""; s.className = "note" + (kind ? " " + kind : ""); s.hidden = !t; }
  function progress(f) { var b = $("pProg"); b.hidden = f == null; if (f != null) $("pBar").style.width = Math.round(f * 100) + "%"; }
  function renderPrep() {
    var has = R && R.places && R.places.length;
    $("pDone").hidden = !has;
    if (has) {
      var d = new Date(R.created);
      $("pSum").textContent = R.from + " → " + R.to + " · " + C.fmtKm(R.km) + " · " + R.places.length + " lugares guardados" +
        (R.live && R.live.length ? " (+" + R.live.length + " encontrados por el camino)" : "") +
        ". Preparado el " + d.toLocaleDateString("es-ES", { day: "numeric", month: "long" }) + ".";
    }
    var box = $("pEfem"), ef = has && R.dayEfem ? R.dayEfem.items : [];
    box.textContent = "";
    if (has && R.date) {
      var dd = parseIso(R.date), head = document.createElement("p");
      head.className = "prep-efem-head";
      head.textContent = ef.length ? "Efemérides del " + C.dateEs(dd) + " en el camino. Te las contaré al pasar por cada lugar si viajas ese día:" : "No he encontrado efemérides del " + C.dateEs(dd) + " en los pueblos del camino.";
      box.appendChild(head);
      ef.slice(0, 8).forEach(function (x) {
        var li = document.createElement("p"); li.className = "prep-efem-item";
        var b = document.createElement("strong"); b.textContent = x.n + ": ";
        li.appendChild(b); li.appendChild(document.createTextNode(x.text));
        box.appendChild(li);
      });
    }
    box.hidden = !(has && R.date);
    var mini = $("pMini");
    mini.hidden = !has;
    if (has) mini.textContent = "Ruta preparada: " + R.from + " → " + R.to + " · " + R.places.length + " lugares";
    var sel = $("s_sim"), opt = sel.querySelector('option[value="ruta"]');
    if (has && !opt) { opt = document.createElement("option"); opt.value = "ruta"; sel.insertBefore(opt, sel.firstChild); }
    if (opt) { if (has) opt.textContent = "Ruta preparada: " + R.from + " → " + R.to; else opt.remove(); }
    if (S.sim === "ruta") sel.value = has ? "ruta" : "0";
  }
  A.on("trip", function () { $("prep").hidden = run.on; });
  function setOpen(open) {
    $("pPanel").hidden = !open;
    $("pToggle").setAttribute("aria-expanded", open ? "true" : "false");
    $("pToggle").querySelector(".prep-plus").textContent = open ? "−" : "+";
    $("pMini").classList.toggle("off", open);
    if (open) setTimeout(function () { $("pTo").focus(); }, 50);
  }
  $("pToggle").addEventListener("click", function () { setOpen($("pPanel").hidden); });
  $("pGo").addEventListener("click", function () { prepare($("pFrom").value.trim(), $("pTo").value.trim()); });
  $("pTo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("pGo").click(); } });
  var armT;
  $("pClear").addEventListener("click", function () {
    var b = $("pClear");
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Pulsa otra vez para borrar"; armT = setTimeout(function () { delete b.dataset.armed; b.textContent = "Borrar ruta"; }, 3500); return; }
    clearTimeout(armT); delete b.dataset.armed; b.textContent = "Borrar ruta";
    R = null; install(); persist(); A.emit("places"); renderPrep(); A.emit("toast", "Ruta borrada.");
  });
  var pd = $("pDate"); pd.value = isoToday(); pd.min = isoToday();
  var sl = $("s_live"); sl.checked = !!S.live;
  sl.addEventListener("change", function () { A.setS("live", sl.checked); });

  install(); renderPrep(); status(""); progress(null);
  A.Explore = { prepare: prepare, _candidate: candidate, _kindOf: kindOf, _regionOf: regionOf, _clean: clean, _toFacts: toFacts, route: function () { return R; } };
})();

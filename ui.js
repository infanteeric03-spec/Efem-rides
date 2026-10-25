/* Interfaz: pestañas, tarjetas, lista de lugares, mapa del viaje y ajustes. */
(function () {
  "use strict";
  var A = window.App, C = A.C, L = A.L, S = A.S, run = A.run;
  function $(id) { return document.getElementById(id); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------- Avisos breves ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    var dock = $("dock");
    if (dock) document.documentElement.style.setProperty("--dock-h", dock.offsetHeight + "px");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4500);
  }
  A.on("toast", toast);

  /* ---------- Pestañas ---------- */
  var TABS = ["ruta", "lugares", "viaje", "radio", "ajustes"], current = "ruta";
  function showTab(n) {
    current = n;
    TABS.forEach(function (t) {
      $("tab-" + t).hidden = t !== n;
      $("t-" + t).setAttribute("aria-selected", t === n ? "true" : "false");
    });
    if (n === "lugares") renderPlaces();
    if (n === "viaje") renderViaje();
    window.scrollTo(0, 0);
  }
  TABS.forEach(function (t) { $("t-" + t).addEventListener("click", function () { showTab(t); }); });

  /* ---------- Señal y tarjetas de la pestaña Ruta ---------- */
  function renderSign() {
    var reg = "Asturias · Cantabria", name, sub;
    if (!run.on) {
      var T = A.trip();
      name = "Listo para salir";
      sub = T && T.log.length ? "Tienes un viaje guardado. Al empezar, continuará donde lo dejaste." : "Deja el móvil en el soporte, conectado al coche, y pulsa Empezar viaje.";
    } else if (run.here) {
      var p = A.byId[run.here];
      reg = C.regName(p.reg); name = p.n; sub = "Estás aquí";
    } else {
      reg = run.region ? C.regName(run.region) : "En ruta"; name = "En ruta";
      sub = run.next ? "Próximo: " + run.next.p.n + ", a " + C.fmtKm(run.next.d) : (run.lastFix ? "Buscando el siguiente lugar con historia…" : "Esperando la señal del GPS…");
    }
    $("signReg").textContent = reg; $("signName").textContent = name; $("signSub").textContent = sub;
  }

  function renderNext() {
    if (!run.on) { $("nextName").textContent = "—"; $("nextDist").textContent = "Empieza el viaje para ver el siguiente."; return; }
    if (run.next) {
      $("nextName").textContent = run.next.p.n;
      $("nextDist").textContent = "a " + C.fmtKm(run.next.d) + " · " + C.regName(run.next.p.reg);
    } else {
      $("nextName").textContent = "—";
      $("nextDist").textContent = run.lastFix ? "No hay lugares catalogados por delante." : "Esperando la señal del GPS…";
    }
  }

  function renderMetrics() {
    var T = A.trip(), st = T && T.pts.length > 1 ? C.stats(T.pts) : { km: 0, ms: 0 };
    $("mSpeed").textContent = Math.round(run.on ? run.kmh : 0);
    $("mKm").textContent = st.km.toFixed(1).replace(".", ",");
    var mins = Math.floor(st.ms / 60000);
    if (mins >= 60) { $("mTime").textContent = Math.floor(mins / 60) + ":" + ("0" + (mins % 60)).slice(-2); $("mTimeU").textContent = "h de viaje"; }
    else { $("mTime").textContent = String(mins); $("mTimeU").textContent = "min de viaje"; }
  }

  function renderToday() {
    var d = new Date(), r = C.today(d, window.EFEMERIDES), head = "Hoy, " + C.dateEs(d), txt;
    if (r.exact.length) txt = r.exact.map(function (x) { return x.t; }).join(" ");
    else if (r.month.length) { head = "En " + C.MESES[d.getMonth()]; txt = r.month.map(function (x) { return x.t; }).join(" "); }
    else txt = "Hoy no tengo ninguna efeméride señalada. Cada lugar de la lista tiene la suya.";
    $("todayHead").textContent = head; $("todayText").textContent = txt;
  }

  function renderButtons() {
    var b = $("btnStart");
    b.textContent = run.on ? (run.sim ? "Parar prueba" : "Parar viaje") : "Empezar viaje";
    b.classList.toggle("stop", run.on);
    var can = !!(run.on && (run.here || run.lastFact));
    $("btnMore").disabled = !can; $("btnRepeat").disabled = !(run.on && run.lastFact);
    $("dimmer").hidden = !(S.dim && run.on);
  }

  A.on("fact", function (e) {
    $("factMeta").textContent = e.p.n + " · dato " + (e.f.i + 1) + " de " + e.f.n + (e.p.src ? " · Wikipedia" : "");
    $("factText").textContent = e.f.text;
    renderSign(); renderButtons(); if (current === "viaje") renderViaje();
  });
  A.on("here", function () { renderSign(); renderButtons(); });
  A.on("region", renderSign);
  A.on("fix", function () { renderSign(); renderNext(); renderMetrics(); if (current === "viaje") renderViaje(); });
  A.on("trip", function () {
    if (!run.on) { $("mSpeed").textContent = "0"; }
    renderSign(); renderNext(); renderMetrics(); renderButtons(); if (current === "viaje") renderViaje();
  });
  A.on("status", function (s) {
    $("gpsTxt").textContent = s.text;
    var d = $("gpsDot");
    d.className = "dot" + (s.kind === "ok" || s.kind === "sim" ? " on" : s.kind === "warn" ? " warn" : "");
  });
  A.on("mute", function (m) {
    var b = $("btnMute");
    b.setAttribute("aria-pressed", m ? "true" : "false"); b.textContent = m ? "Voz silenciada" : "Silenciar";
  });

  $("btnStart").addEventListener("click", function () { if (run.on) A.stop(); else A.start(); renderButtons(); });
  $("btnMore").addEventListener("click", A.more);
  $("btnRepeat").addEventListener("click", A.repeat);
  $("btnMute").addEventListener("click", function () { A.setMute(!run.mute); });

  /* ---------- Lugares ---------- */
  var open = {};
  function renderPlaces() {
    var q = norm($("q").value.trim()), box = $("placesList"), T = A.trip();
    box.textContent = "";
    var groups = [];
    L.forEach(function (p) { var g = p.src ? "ruta" : p.reg; if (groups.indexOf(g) < 0) groups.push(g); });
    groups.forEach(function (reg) {
      var items = L.filter(function (p) { return (p.src ? "ruta" : p.reg) === reg && (!q || norm(p.n).indexOf(q) >= 0); });
      if (!items.length) return;
      if (run.cur) items.sort(function (a, b) { return C.dist(run.cur.lat, run.cur.lon, a.lat, a.lon) - C.dist(run.cur.lat, run.cur.lon, b.lat, b.lon); });
      else items.sort(function (a, b) { return a.n.localeCompare(b.n, "es"); });
      box.appendChild(el("h2", "group", reg === "ruta" ? (A.routeLabel ? A.routeLabel() : "Ruta preparada") : C.regName(reg)));
      items.forEach(function (p) {
        var card = el("div", "place"), head = el("button", "head");
        head.type = "button";
        head.setAttribute("aria-expanded", open[p.id] ? "true" : "false");
        var tag = el("span", "tag");
        if (T && T.visited[p.id]) { tag.textContent = "Visitado"; tag.className = "tag vis"; }
        else if (run.cur) tag.textContent = C.fmtKm(C.dist(run.cur.lat, run.cur.lon, p.lat, p.lon));
        head.appendChild(el("span", "nm", p.n)); head.appendChild(tag);
        card.appendChild(head);
        var body = el("div", "body");
        body.hidden = !open[p.id];
        p.h.forEach(function (t) { body.appendChild(el("p", null, t)); });
        var play = el("button", "btn small", "Escuchar"); play.type = "button";
        play.addEventListener("click", function () { A.speakPlace(p); });
        body.appendChild(play);
        if (p.url) { var src = el("a", "src-link", "Texto de Wikipedia (CC BY-SA)"); src.href = p.url; src.target = "_blank"; src.rel = "noopener"; body.appendChild(src); }
        card.appendChild(body);
        head.addEventListener("click", function () {
          open[p.id] = !open[p.id]; body.hidden = !open[p.id];
          head.setAttribute("aria-expanded", open[p.id] ? "true" : "false");
        });
        box.appendChild(card);
      });
    });
    if (!box.firstChild) box.appendChild(el("p", "empty", "No hay ningún lugar con ese nombre."));
  }
  $("q").addEventListener("input", renderPlaces);

  /* ---------- Viaje ---------- */
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function drawMap(T) {
    var cv = $("map"), dpr = window.devicePixelRatio || 1;
    var W = Math.max(280, Math.round(cv.clientWidth * dpr)), H = Math.round(W * 10 / 16);
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    g.clearRect(0, 0, W, H);
    var pts = T ? T.pts : [], vis = T ? T.visited : {};
    var la0 = 42.95, la1 = 43.72, lo0 = -7.05, lo1 = -3.1;
    if (pts.length > 1) {
      la0 = 90; la1 = -90; lo0 = 180; lo1 = -180;
      pts.forEach(function (p) { la0 = Math.min(la0, p[0]); la1 = Math.max(la1, p[0]); lo0 = Math.min(lo0, p[1]); lo1 = Math.max(lo1, p[1]); });
      L.forEach(function (p) { if (vis[p.id]) { la0 = Math.min(la0, p.lat); la1 = Math.max(la1, p.lat); lo0 = Math.min(lo0, p.lon); lo1 = Math.max(lo1, p.lon); } });
      var cLa = (la0 + la1) / 2, cLo = (lo0 + lo1) / 2;
      var hLa = Math.max((la1 - la0) / 2 * 1.15, 0.05), hLo = Math.max((lo1 - lo0) / 2 * 1.15, 0.07);
      la0 = cLa - hLa; la1 = cLa + hLa; lo0 = cLo - hLo; lo1 = cLo + hLo;
    }
    var lc = Math.cos(((la0 + la1) / 2) * Math.PI / 180);
    var dx = (lo1 - lo0) * lc, dy = la1 - la0, m = 22 * dpr;
    var sc = Math.min((W - 2 * m) / dx, (H - 2 * m) / dy);
    var ox = (W - dx * sc) / 2, oy = (H - dy * sc) / 2;
    function X(lo) { return ox + (lo - lo0) * lc * sc; }
    function Y(la) { return oy + (la1 - la) * sc; }
    g.fillStyle = cssVar("--map-dot");
    L.forEach(function (p) {
      if (vis[p.id] || p.lon < lo0 || p.lon > lo1 || p.lat < la0 || p.lat > la1) return;
      g.beginPath(); g.arc(X(p.lon), Y(p.lat), 2.5 * dpr, 0, 7); g.fill();
    });
    if (pts.length > 1) {
      g.strokeStyle = cssVar("--accent"); g.lineWidth = 3 * dpr; g.lineJoin = "round"; g.lineCap = "round";
      g.beginPath();
      pts.forEach(function (p, i) { if (i) g.lineTo(X(p[1]), Y(p[0])); else g.moveTo(X(p[1]), Y(p[0])); });
      g.stroke();
      var e = pts[pts.length - 1];
      g.fillStyle = cssVar("--fg"); g.beginPath(); g.arc(X(e[1]), Y(e[0]), 5 * dpr, 0, 7); g.fill();
    }
    g.font = "600 " + 12 * dpr + "px " + cssVar("--font-body");
    g.textBaseline = "middle";
    L.forEach(function (p) {
      if (!vis[p.id]) return;
      g.fillStyle = cssVar("--sign"); g.strokeStyle = "#fff"; g.lineWidth = 2 * dpr;
      g.beginPath(); g.arc(X(p.lon), Y(p.lat), 5 * dpr, 0, 7); g.fill(); g.stroke();
      g.fillStyle = cssVar("--fg");
      var tw = g.measureText(p.n).width, tx = X(p.lon) + 8 * dpr, ty = Y(p.lat);
      if (tx + tw > W - 4 * dpr) tx = X(p.lon) - 8 * dpr - tw;
      tx = Math.max(4 * dpr, tx);
      ty = Math.min(H - 10 * dpr, Math.max(10 * dpr, ty));
      g.fillText(p.n, tx, ty);
    });
    if (pts.length < 2) {
      g.fillStyle = cssVar("--muted"); g.textAlign = "center";
      g.fillText("Tu recorrido aparecerá aquí", W / 2, H - 12 * dpr); g.textAlign = "start";
    }
  }

  function renderViaje() {
    var T = A.trip(), st = T && T.pts.length > 1 ? C.stats(T.pts) : { km: 0, ms: 0, avgKmh: 0, maxKmh: 0 };
    $("vKm").textContent = C.fmtKm(st.km); $("vTime").textContent = C.fmtDur(st.ms);
    $("vAvg").textContent = Math.round(st.avgKmh) + " km/h"; $("vMax").textContent = Math.round(st.maxKmh) + " km/h";
    var log = $("log"); log.textContent = "";
    if (!T || !T.log.length) log.appendChild(el("p", "empty", "Aún no te he contado nada en este viaje."));
    else T.log.slice(-30).reverse().forEach(function (x) {
      var a = el("article"), h = el("h3");
      h.appendChild(document.createTextNode(x.n));
      h.appendChild(el("span", null, new Date(x.t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })));
      a.appendChild(h); a.appendChild(el("p", null, x.text.length > 150 ? x.text.slice(0, 147) + "…" : x.text));
      log.appendChild(a);
    });
    drawMap(T);
  }
  window.addEventListener("resize", function () { if (current === "viaje") renderViaje(); });

  $("btnGpx").addEventListener("click", function () {
    var x = A.gpx();
    if (!x) { toast("Todavía no hay recorrido que exportar."); return; }
    var url = URL.createObjectURL(new Blob([x], { type: "application/gpx+xml" }));
    var a = document.createElement("a");
    a.href = url; a.download = "ruta-con-historia.gpx";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });
  var armTimer;
  $("btnNew").addEventListener("click", function () {
    var b = $("btnNew");
    if (b.dataset.armed) {
      clearTimeout(armTimer); delete b.dataset.armed; b.textContent = "Nuevo viaje";
      A.newTrip(); toast("Viaje nuevo, desde cero.");
    } else {
      b.dataset.armed = "1"; b.textContent = "Pulsa otra vez para borrar este viaje";
      armTimer = setTimeout(function () { delete b.dataset.armed; b.textContent = "Nuevo viaje"; }, 4000);
    }
  });

  /* ---------- Ajustes ---------- */
  function applyTheme() { document.documentElement.setAttribute("data-theme", S.theme || "dark"); }
  function fillVoices() {
    var sel = $("s_voice"); sel.textContent = "";
    var auto = el("option", null, A.hasVoice ? "Automática" : "Tu móvil no tiene voz"); auto.value = ""; sel.appendChild(auto);
    A.voices().forEach(function (v) { var o = el("option", null, v.name + " (" + v.lang + ")"); o.value = v.voiceURI || v.name; sel.appendChild(o); });
    sel.value = S.voice;
  }
  A.on("voices", fillVoices);

  var sims = $("s_sim");
  A.SIMS.forEach(function (r, i) { var o = el("option", null, r.n); o.value = String(i); sims.appendChild(o); });

  [["voice", "s_voice"], ["rate", "s_rate"], ["vol", "s_vol"], ["auto", "s_auto"], ["approach", "s_approach"], ["today", "s_today"],
    ["zone", "s_zone"], ["ahorro", "s_ahorro"], ["wake", "s_wake"], ["dim", "s_dim"], ["theme", "s_theme"], ["sim", "s_sim"], ["simSpeed", "s_simSpeed"]
  ].forEach(function (pair) {
    var key = pair[0], inp = $(pair[1]), box = inp.type === "checkbox";
    if (box) inp.checked = !!S[key]; else inp.value = S[key];
    inp.addEventListener("change", function () {
      A.setS(key, box ? inp.checked : inp.value);
      if (key === "theme") applyTheme();
      if (key === "dim") renderButtons();
      if (key === "ahorro" && run.on && !run.sim && S.ahorro !== "0") toast("Ahorro activado: con " + S.ahorro + " s entre posiciones, a 90 km/h comprueba cada " + Math.round(25 * +S.ahorro) + " m.");
      if (key === "wake" && !S.wake) toast("Sin esto, el móvil puede apagar la pantalla y parar el GPS.");
    });
  });
  $("btnTest").addEventListener("click", A.testVoice);
  $("btnSim").addEventListener("click", function () { A.startSim(); showTab("ruta"); renderButtons(); });

  /* ---------- Instalar ---------- */
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; $("installRow").hidden = false; });
  $("btnInstall").addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt(); deferred = null; $("installRow").hidden = true;
  });

  /* ---------- Arranque ---------- */
  applyTheme(); fillVoices(); renderToday(); renderSign(); renderNext(); renderMetrics(); renderButtons();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) navigator.serviceWorker.register("sw.js").catch(function () { /* sin modo sin conexión */ });
  window.RCH_READY = true;
})();

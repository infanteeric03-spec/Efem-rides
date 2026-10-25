/* Radio: emisoras por internet desde el directorio público Radio Browser.
   Baja o pausa la radio mientras la app cuenta un dato y reconecta sola si se corta. */
(function () {
  "use strict";
  var A = window.App;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }

  /* Emisoras de partida. Se buscan en el directorio la primera vez; así siempre se usa el enlace vigente. */
  var PRESETS = [
    { n: "Europa FM", q: "Europa FM", prefer: ["europa fm", "europafm", "europa fm espana", "europa fm madrid"], avoid: ["gipuzkoa", "goierri", "tolosa", "navarra", "dance", "cantabria", "rioja"] },
    { n: "COPE", q: "COPE", prefer: ["cope", "cadena cope", "cope nacional", "cope espana", "cope madrid"], avoid: ["mas", "+", "rock", "deportes", "tiempo de juego"] },
    { n: "Cadena SER", q: "SER", prefer: ["cadena ser", "ser", "cadena ser madrid", "radio madrid cadena ser"], avoid: ["catalunya", "euskadi", "galicia", "andalucia", "valencia", "+"] },
    { n: "LOS40", q: "LOS40", prefer: ["los40", "los 40", "los40 principales", "los 40 principales", "los40 espana"], avoid: ["classic", "clasic", "dance", "urban", "pop", "chill"] },
    { n: "LOS40 Classic", q: "LOS40 Classic", prefer: ["los40 classic", "los 40 classic", "los40classic"], avoid: [] }
  ];
  var SERVERS = ["https://de1.api.radio-browser.info", "https://de2.api.radio-browser.info", "https://fi1.api.radio-browser.info", "https://all.api.radio-browser.info"];

  var st = load("rch.radio", null) || {};
  if (!st.favs) st.favs = PRESETS.map(function (p) { return { n: p.n, preset: p.n, uuid: null, url: null, favicon: "" }; });
  if (st.vol == null) st.vol = 0.8;
  if (!st.duck) st.duck = "bajar";
  if (st.cur == null) st.cur = 0;
  function persist() { save("rch.radio", st); }

  var audio = new Audio();
  audio.preload = "none";
  var want = false, ducked = false, connecting = false, retryTimer = null, retryN = 0, fadeTimer = null;
  var cands = [], candI = 0, playingFav = null, pausedAt = 0, pausedByUs = false, searching = false, waitSearch = false, playTok = 0;

  /* ---------- Directorio ---------- */
  var srvI = 0;
  function api(path) {
    var tries = 0;
    function attempt() {
      var base = SERVERS[(srvI + tries) % SERVERS.length];
      var ctl = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
      return fetch(base + path, { signal: ctl ? ctl.signal : undefined, headers: { "Accept": "application/json" } }).then(function (r) {
        clearTimeout(to);
        if (!r.ok) throw new Error("HTTP " + r.status);
        srvI = (srvI + tries) % SERVERS.length;
        return r.json();
      }).catch(function (e) {
        clearTimeout(to);
        tries++;
        if (tries < SERVERS.length) return attempt();
        throw e;
      });
    }
    return attempt();
  }
  function httpsOf(u) { return !u ? null : /^https:/i.test(u) ? u : /^http:/i.test(u) ? u.replace(/^http:/i, "https:") : null; }
  function searchStations(q, country) {
    var p = "/json/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=40" + (q ? "&name=" + encodeURIComponent(q) : "") + (country ? "&countrycode=" + country : "");
    return api(p).then(function (list) {
      return (list || []).filter(function (s) { return s && (s.url_resolved || s.url); }).map(function (s) {
        return { n: (s.name || "").trim(), uuid: s.stationuuid, url: s.url_resolved || s.url, favicon: s.favicon || "", tags: s.tags || "", state: s.state || "", clicks: s.clickcount || 0, codec: s.codec || "", bitrate: s.bitrate || 0 };
      });
    });
  }
  function rankForPreset(list, p) {
    function score(s) {
      var n = norm(s.n), sc = s.clicks / 1e6;
      var i = p.prefer.indexOf(n);
      if (i >= 0) sc += 100 - i;
      else if (n.indexOf(norm(p.q)) >= 0) sc += 10;
      if (p.avoid.some(function (w) { return n.indexOf(w) >= 0; })) sc -= 200;
      if (/^https:/i.test(s.url)) sc += 1;
      return sc;
    }
    return list.map(function (s) { return { s: s, sc: score(s) }; }).filter(function (x) { return x.sc > 0; })
      .sort(function (a, b) { return b.sc - a.sc; }).map(function (x) { return x.s; });
  }
  function click(uuid) { if (uuid) api("/json/url/" + encodeURIComponent(uuid)).catch(function () {}); }

  /* ---------- Reproducción ---------- */
  function status(kind, text) {
    st.status = { kind: kind, text: text };
    A.emit("radio", { playing: want, kind: kind, text: text, fav: st.favs[st.cur] });
  }
  function targetVol() { return ducked && st.duck === "bajar" ? Math.min(0.15, st.vol * 0.2) : +st.vol; }
  function fadeTo(v, ms, done) {
    clearInterval(fadeTimer);
    var from = audio.volume, steps = Math.max(1, Math.round(ms / 40)), k = 0;
    fadeTimer = setInterval(function () {
      k++; audio.volume = Math.max(0, Math.min(1, from + (v - from) * k / steps));
      if (k >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 40);
  }

  function tryCandidate() {
    if (!want) return;
    if (candI >= cands.length && searching) { waitSearch = true; return; }
    if (candI >= cands.length) {
      connecting = false;
      status("error", "No he podido conectar con " + st.favs[st.cur].n + ". Prueba otra emisora.");
      scheduleRetry();
      return;
    }
    var c = cands[candI], url = httpsOf(c.url);
    if (!url) { candI++; tryCandidate(); return; }
    connecting = true;
    status("load", "Conectando con " + st.favs[st.cur].n + "…");
    var ok = false;
    var guard = setTimeout(function () { if (!ok && want) { candI++; tryCandidate(); } }, 12000);
    audio.onplaying = function () {
      ok = true; clearTimeout(guard); connecting = false; retryN = 0;
      var f = st.favs[st.cur];
      if (f.url !== c.url || f.uuid !== c.uuid) { f.url = c.url; f.uuid = c.uuid; f.favicon = c.favicon || f.favicon; persist(); }
      playingFav = st.cur;
      status("on", "Sonando " + f.n);
      mediaSession();
    };
    audio.onerror = function () { if (ok) { onDrop(); return; } clearTimeout(guard); if (want) { candI++; tryCandidate(); } };
    audio.src = url;
    audio.volume = targetVol();
    var pr = audio.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (e && e.name === "NotAllowedError") { clearTimeout(guard); want = false; connecting = false; status("off", "Pulsa Escuchar para empezar la radio."); }
    });
    click(c.uuid);
  }

  function resolveAndPlay() {
    var f = st.favs[st.cur];
    cands = []; candI = 0;
    if (f.url) cands.push({ n: f.n, uuid: f.uuid, url: f.url, favicon: f.favicon });
    var p = PRESETS.filter(function (x) { return x.n === f.preset; })[0];
    if (!p && f.url) { tryCandidate(); return; }
    var tok = ++playTok;
    status("load", "Buscando " + f.n + "…");
    searching = true; waitSearch = false;
    if (f.url) { tryCandidate(); }
    var q = p ? p.q : f.n;
    searchStations(q, "ES").then(function (list) {
      if (tok !== playTok) return;
      searching = false;
      var ranked = p ? rankForPreset(list, p) : list.filter(function (s) { return s.uuid === f.uuid; });
      ranked.slice(0, 8).forEach(function (s) { if (!cands.some(function (c) { return c.url === s.url; })) cands.push(s); });
      if (!f.url || waitSearch) { waitSearch = false; tryCandidate(); }
    }).catch(function () {
      if (tok !== playTok) return;
      searching = false;
      if (!f.url || waitSearch) { waitSearch = false; candI = cands.length; status("error", "Sin conexión con el directorio de emisoras. Reintento en unos segundos."); scheduleRetry(); }
    });
  }

  function onDrop() {
    if (!want || connecting) return;
    status("error", "Se ha cortado la señal. Reconectando…");
    scheduleRetry();
  }
  function scheduleRetry() {
    clearTimeout(retryTimer);
    if (!want) return;
    retryN++;
    var wait = Math.min(30000, 3000 * retryN);
    retryTimer = setTimeout(function () { if (want && (audio.paused || audio.error)) { candI = 0; if (cands.length) tryCandidate(); else resolveAndPlay(); } }, wait);
  }
  audio.addEventListener("stalled", function () { if (want && !connecting) setTimeout(function () { if (want && audio.readyState < 3) onDrop(); }, 8000); });
  audio.addEventListener("ended", onDrop);
  audio.addEventListener("pause", function () {
    if (want && !pausedByUs && !connecting) setTimeout(function () { if (want && audio.paused && !ducked) restart(); }, 1500);
  });
  window.addEventListener("online", function () { if (want && audio.paused) { retryN = 0; restart(); } });

  function restart() { candI = 0; if (cands.length) tryCandidate(); else resolveAndPlay(); }

  function play(i) {
    if (i != null) { st.cur = (i + st.favs.length) % st.favs.length; persist(); }
    want = true; retryN = 0; clearTimeout(retryTimer);
    pausedByUs = false;
    resolveAndPlay();
  }
  function stop() {
    playTok++; searching = false;
    want = false; connecting = false; clearTimeout(retryTimer); clearInterval(fadeTimer);
    pausedByUs = true; audio.pause(); audio.removeAttribute("src"); audio.load(); pausedByUs = false;
    playingFav = null;
    status("off", "Radio parada");
  }
  function toggle() { if (want) stop(); else play(); }
  function next() { play(st.cur + 1); }

  /* ---------- Mientras habla la app ---------- */
  A.radioOn = function () { return want && !audio.paused && st.duck !== "nada"; };
  A.on("voice", function (speaking) {
    if (!want || st.duck === "nada") return;
    if (speaking && !ducked) {
      ducked = true;
      if (st.duck === "pausar") fadeTo(0, 300, function () { if (ducked) { pausedByUs = true; audio.pause(); pausedByUs = false; pausedAt = Date.now(); } });
      else fadeTo(targetVol(), 350);
    } else if (!speaking && ducked) {
      ducked = false;
      if (st.duck === "pausar" || audio.paused) {
        audio.volume = 0;
        /* En directo, tras una pausa larga se vuelve a conectar para no oír la emisión con retraso. */
        if (Date.now() - pausedAt > 4000 || audio.paused) {
          var f = st.favs[st.cur];
          audio.src = httpsOf(f.url) || audio.src;
        }
        var pr = audio.play(); if (pr && pr.catch) pr.catch(function () {});
      }
      fadeTo(+st.vol, 700);
    }
  });
  setInterval(function () { if (ducked && !(A.voiceBusy && A.voiceBusy())) A.emit("voice", false); }, 2000);

  function mediaSession() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({ title: st.favs[st.cur].n, artist: "Ruta con Historia", album: "Radio" });
      navigator.mediaSession.setActionHandler("play", function () { play(); });
      navigator.mediaSession.setActionHandler("pause", stop);
      navigator.mediaSession.setActionHandler("stop", stop);
      navigator.mediaSession.setActionHandler("nexttrack", next);
    } catch (e) { /* controles del sistema no disponibles */ }
  }

  /* Al parar el viaje, se para también la radio. */
  A.on("stopped", function () { if (want) stop(); });
  A.radio = { play: play, stop: stop, toggle: toggle, next: next, audio: audio, state: function () { return { want: want, st: st }; } };

  /* ---------- Interfaz ---------- */
  function renderNow() {
    var f = st.favs[st.cur] || { n: "—" };
    $("rName").textContent = f.n;
    var s = st.status || { kind: "off", text: "Radio parada" };
    $("rStatus").textContent = s.text;
    $("rStatus").className = "r-status " + s.kind;
    $("rToggle").textContent = want ? "Parar radio" : "Escuchar";
    $("rToggle").classList.toggle("stop", want);
  }
  function renderFavs() {
    var box = $("rFavs"); box.textContent = "";
    st.favs.forEach(function (f, i) {
      var row = el("div", "r-fav" + (i === st.cur ? " cur" : ""));
      var b = el("button", "r-fav-play", f.n); b.type = "button";
      b.addEventListener("click", function () { play(i); });
      var x = el("button", "r-fav-del", "Quitar"); x.type = "button";
      x.setAttribute("aria-label", "Quitar " + f.n + " de favoritas");
      x.addEventListener("click", function () {
        if (x.dataset.armed) {
          if (i === st.cur && want) stop();
          st.favs.splice(i, 1); if (st.cur >= st.favs.length) st.cur = 0; persist(); renderFavs(); renderNow();
        } else { x.dataset.armed = "1"; x.textContent = "¿Quitar?"; setTimeout(function () { delete x.dataset.armed; x.textContent = "Quitar"; }, 3000); }
      });
      row.appendChild(b); row.appendChild(x); box.appendChild(row);
    });
    if (!st.favs.length) box.appendChild(el("p", "empty", "No tienes favoritas. Busca una emisora y añádela."));
    var reset = $("rReset"); reset.hidden = st.favs.length >= PRESETS.length && PRESETS.every(function (p) { return st.favs.some(function (f) { return f.preset === p.n; }); });
  }
  function doSearch() {
    var q = $("rQ").value.trim(), box = $("rResults"), country = $("rCountry").value;
    /* Sin nombre se muestran las más escuchadas del país elegido. */
    if (q.length < 2 && !country) { box.textContent = ""; box.appendChild(el("p", "empty", "Escribe el nombre de una emisora o elige un país.")); return; }
    if (q.length < 2) q = "";
    box.textContent = ""; box.appendChild(el("p", "empty", "Buscando…"));
    searchStations(q, country).then(function (list) {
      box.textContent = "";
      if (!q && list.length) box.appendChild(el("p", "r-hint", "Las más escuchadas en " + $("rCountry").selectedOptions[0].textContent + ":"));
      var seen = {};
      list = list.filter(function (s) { var k = norm(s.n) + "|" + s.url; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 25);
      if (!list.length) { box.appendChild(el("p", "empty", "No he encontrado emisoras con ese nombre.")); return; }
      list.forEach(function (s) {
        var row = el("div", "r-res");
        var info = el("div", "r-res-info");
        info.appendChild(el("strong", null, s.n));
        info.appendChild(el("span", null, [s.state, s.codec && s.codec !== "UNKNOWN" ? s.codec : "", s.bitrate ? s.bitrate + " kbps" : "", /^https:/i.test(s.url) ? "" : "puede no sonar"].filter(Boolean).join(" · ")));
        var add = el("button", "btn small", "Añadir"); add.type = "button";
        add.addEventListener("click", function () {
          if (st.favs.some(function (f) { return f.uuid === s.uuid; })) { A.emit("toast", s.n + " ya está en favoritas."); return; }
          st.favs.push({ n: s.n, preset: null, uuid: s.uuid, url: s.url, favicon: s.favicon });
          persist(); renderFavs(); A.emit("toast", "Añadida " + s.n + " a favoritas.");
        });
        var lis = el("button", "btn ghost small", "Escuchar"); lis.type = "button";
        lis.addEventListener("click", function () {
          var i = st.favs.findIndex(function (f) { return f.uuid === s.uuid; });
          if (i < 0) { st.favs.push({ n: s.n, preset: null, uuid: s.uuid, url: s.url, favicon: s.favicon }); i = st.favs.length - 1; persist(); renderFavs(); }
          play(i);
        });
        row.appendChild(info); row.appendChild(lis); row.appendChild(add);
        box.appendChild(row);
      });
    }).catch(function () {
      box.textContent = ""; box.appendChild(el("p", "empty", "No puedo conectar con el directorio de emisoras. Comprueba la cobertura."));
    });
  }

  A.on("radio", function () { renderNow(); renderFavs(); });
  $("rToggle").addEventListener("click", toggle);
  $("rNext").addEventListener("click", next);
  $("rSearch").addEventListener("click", doSearch);
  $("rQ").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
  $("rReset").addEventListener("click", function () {
    PRESETS.forEach(function (p) { if (!st.favs.some(function (f) { return f.preset === p.n; })) st.favs.push({ n: p.n, preset: p.n, uuid: null, url: null, favicon: "" }); });
    persist(); renderFavs();
  });
  var rc = $("rCountry");
  if (st.country != null) rc.value = st.country;
  rc.addEventListener("change", function () { st.country = rc.value; persist(); doSearch(); });
  var vol = $("rVol"); vol.value = st.vol;
  vol.addEventListener("input", function () { st.vol = +vol.value; if (!ducked) audio.volume = st.vol; persist(); });
  var duck = $("rDuck"); duck.value = st.duck;
  duck.addEventListener("change", function () { st.duck = duck.value; persist(); });

  st.status = { kind: "off", text: "Radio parada" };
  renderNow(); renderFavs();
})();

/* Motor de la app: ajustes, viaje, GPS, detección de lugares y voz. Sin tocar el DOM. */
(function () {
  "use strict";
  var C = window.Core, L = window.LUGARES, E = window.EFEMERIDES;
  var App = window.App = { C: C, L: L, byId: {} };
  L.forEach(function (p) { App.byId[p.id] = p; });

  var hs = {};
  App.on = function (e, f) { (hs[e] = hs[e] || []).push(f); };
  function emit(e, a) { (hs[e] || []).forEach(function (f) { try { f(a); } catch (x) { console.error(x); } }); }
  App.emit = emit;

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }

  var DEF = { homeId: "", homeFreq: "nunca", voice: "", rate: 1, vol: 1, auto: true, maxFacts: 3, approach: true, today: true,
    zone: 1, ahorro: "0", wake: true, dim: false, theme: "dark", sim: "0", simSpeed: "10" };
  var S = App.S = Object.assign({}, DEF, load("rch.settings", {}));
  App.setS = function (k, v) { S[k] = v; save("rch.settings", S); emit("settings", k); };

  /* Rutas de prueba: líneas rectas entre lugares, solo para comprobar avisos y voz. */
  App.SIMS = [
    { n: "Oviedo a Covadonga", ids: ["oviedo", "nava", "arriondas", "cangas-onis", "covadonga"] },
    { n: "Costa: Gijón a Llanes", ids: ["gijon", "villaviciosa", "lastres", "ribadesella", "llanes"] },
    { n: "Ribadesella a Santander", ids: ["ribadesella", "llanes", "colombres", "san-vicente", "comillas", "santillana", "santander"] },
    { n: "Santander a Potes", ids: ["santander", "torrelavega", "santillana", "comillas", "san-vicente", "potes"] }
  ];

  /* ---------- Memoria entre viajes y localidad de casa ---------- */
  var told = load("rch.told", {}) || {};
  /* Datos de la localidad de casa: "nunca" no los cuenta; "semana" cuenta uno como mucho cada 7 días. */
  function homeSkip(p) {
    if (!S.homeId || p.id !== S.homeId) return false;
    if (S.homeFreq === "semana") {
      var last = +load("rch.homeLast", 0) || 0;
      return Date.now() - last < 7 * 86400000;
    }
    return true;
  }
  App.isHome = function (p) { return !!S.homeId && p && p.id === S.homeId; };
  App.resetTold = function () { told = {}; save("rch.told", told); };

  /* ---------- Viaje ---------- */
  function newTrip() { return { id: Date.now(), start: Date.now(), last: Date.now(), pts: [], log: [], told: {}, visited: {}, dayMsg: "" }; }
  var real = load("rch.trip", null);
  var run = App.run = { on: false, sim: false, watch: null, timer: null, cur: null, kmh: 0, here: null, hereN: 0,
    region: null, regCand: null, regN: 0, lastEnd: 0, mute: false, wake: null, prev: {}, appr: {}, previewed: {},
    heading: null, anchor: null, lastFix: null, simTrip: null, simPath: null, simI: 0, simT0: 0, lastSave: 0,
    next: null, lastFact: null, acc: null };
  App.trip = function () { return run.sim ? run.simTrip : real; };
  App.newTrip = function () { if (run.on && !run.sim) App.stop(); real = newTrip(); save("rch.trip", real); emit("trip"); };

  function persist(force) {
    if (run.sim || !real) return;
    var now = Date.now();
    if (!force && now - run.lastSave < (+S.ahorro ? 30000 : 10000)) return;
    run.lastSave = now;
    if (real.pts.length > 8000) real.pts = real.pts.filter(function (_, i) { return i % 2 === 0; });
    save("rch.trip", real);
  }

  /* ---------- App nativa (Android) ---------- */
  var CAP = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null;
  var NS = CAP ? CAP.registerPlugin("SpeechDuck") : null;           // voz con foco de audio: baja Spotify mientras habla
  var BG = CAP ? CAP.registerPlugin("BackgroundGeolocation") : null; // GPS con la pantalla apagada
  var KA = CAP ? CAP.registerPlugin("KeepAwake") : null;
  var nativeBusy = false;
  App.native = !!CAP;
  if (NS) {
    NS.addListener("start", function () { nativeBusy = true; });
    NS.addListener("end", function () { nativeBusy = false; run.lastEnd = Date.now(); voiceMaybeDone(); });
  }

  /* ---------- Voz ---------- */
  var synth = NS ? null : (window.speechSynthesis || null), voices = [];
  App.hasVoice = !!synth || !!NS;
  App.voices = function () { return voices; };
  function refreshVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter(function (v) { return /^es([-_]|$)/i.test(v.lang); });
    emit("voices", voices);
  }
  if (synth) {
    refreshVoices();
    if (synth.addEventListener) synth.addEventListener("voiceschanged", refreshVoices); else synth.onvoiceschanged = refreshVoices;
  }
  function pickVoice() {
    if (!voices.length) return null;
    if (S.voice) {
      var f = voices.filter(function (v) { return v.voiceURI === S.voice || v.name === S.voice; })[0];
      if (f) return f;
    }
    return voices.filter(function (v) { return /es[-_]ES/i.test(v.lang); })[0] || voices[0];
  }
  function busy() { return NS ? nativeBusy : !!synth && (synth.speaking || synth.pending); }
  function speak(text, interrupt, force) {
    if (!text || (run.mute && !force)) return false;
    if (NS) {
      /* Voz del sistema: Android baja el volumen de Spotify u otras apps mientras habla. */
      nativeBusy = true; run.lastEnd = Date.now();
      emit("voice", true);
      var wait = App.radioOn && App.radioOn() ? 450 : 0;
      setTimeout(function () {
        NS.speak({ text: text, rate: +S.rate, volume: +S.vol, flush: !!interrupt }).catch(function () { nativeBusy = false; voiceMaybeDone(); });
      }, wait);
      return true;
    }
    if (!synth) return false;
    pendingGo++;
    function go() {
      pendingGo = Math.max(0, pendingGo - 1);
      C.chunks(text).forEach(function (c, i, a) {
        var u = new SpeechSynthesisUtterance(c);
        u.lang = "es-ES";
        var v = pickVoice(); if (v) u.voice = v;
        u.rate = +S.rate; u.volume = +S.vol;
        if (i === a.length - 1) u.onend = u.onerror = function () { run.lastEnd = Date.now(); voiceMaybeDone(); };
        synth.speak(u);
      });
    }
    run.lastEnd = Date.now();
    /* Avisa a la radio para que baje antes de hablar, y le da medio segundo para hacerlo. */
    emit("voice", true);
    var wait = App.radioOn && App.radioOn() ? 450 : 0;
    if (interrupt) { synth.cancel(); setTimeout(go, Math.max(80, wait)); } else if (wait && !busy()) setTimeout(go, wait); else go();
    return true;
  }
  var doneTimer = null, pendingGo = 0;
  function voiceMaybeDone() {
    clearTimeout(doneTimer);
    doneTimer = setTimeout(function () { if (!App.voiceBusy()) emit("voice", false); }, 350);
  }
  App.voiceBusy = function () { return pendingGo > 0 || busy(); };
  App.speak = speak;
  App.setMute = function (b) { run.mute = b; if (b) { if (NS) NS.stop(); else if (synth) synth.cancel(); voiceMaybeDone(); } emit("mute", b); };
  App.testVoice = function () { speak("Así sonará la voz durante el viaje. Bienvenido a Asturias y Cantabria.", true, true); };
  App.speakPlace = function (p) {
    speak(p.h[0], true, true);
    for (var i = 1; i < p.h.length; i++) speak(p.h[i], false, true);
  };

  /* ---------- Pantalla encendida ---------- */
  function wakeOn() {
    if (KA) { if (S.wake) KA.keepAwake().catch(function () {}); return; }
    if (!S.wake || !("wakeLock" in navigator) || run.wake) return;
    navigator.wakeLock.request("screen").then(function (w) {
      run.wake = w;
      w.addEventListener("release", function () { run.wake = null; });
    }).catch(function () { /* lo intentará de nuevo al volver a la app */ });
  }
  function wakeOff() { if (KA) KA.allowSleep().catch(function () {}); if (run.wake) { try { run.wake.release(); } catch (e) { /* ya liberado */ } run.wake = null; } }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && run.on) wakeOn(); });

  /* ---------- Estado visible del GPS ---------- */
  function status(kind, text) { App.status = { kind: kind, text: text }; emit("status", App.status); }
  App.status = { kind: "off", text: "GPS apagado" };

  /* ---------- Contar un dato ---------- */
  function tell(p, mode) {
    var T = App.trip(), v = T.visited[p.id] || (T.visited[p.id] = { t: Date.now(), n: 0 }), f;
    if (mode === "repeat" && run.lastFact && run.lastFact.id === p.id) f = run.lastFact.f;
    else {
      /* La cuenta de datos ya contados se guarda entre viajes: cada viaje sigue por el siguiente dato. */
      var mem = run.sim ? T.told : told;
      f = C.pickFact(p, mem[p.id] || 0);
      mem[p.id] = (mem[p.id] || 0) + 1;
      T.told[p.id] = (T.told[p.id] || 0) + 1; v.n++;
      if (!run.sim) save("rch.told", told);
    }
    v.t = Date.now();
    var text = f.text;
    if (text.toLowerCase().indexOf(p.n.toLowerCase().split(" ")[0]) < 0) text = p.n + ". " + text;
    /* Si hoy es el día de una efeméride de este lugar, se cuenta antes que el dato (una vez por viaje). */
    var day = mode === "enter" && App.dayFact ? App.dayFact(p) : null, dayTold = T.dayTold || (T.dayTold = {});
    if (day && !dayTold[p.id]) {
      dayTold[p.id] = 1;
      T.log.push({ t: Date.now(), id: p.id, n: p.n, reg: p.reg, text: day });
      mode = "afterDay";
    } else day = null;
    run.lastFact = { id: p.id, f: f, text: text };
    if (mode !== "repeat") {
      T.log.push({ t: Date.now(), id: p.id, n: p.n, reg: p.reg, text: f.text });
      if (T.log.length > 300) T.log.shift();
    }
    /* La efeméride y el dato van en la misma frase para que se oigan en ese orden. */
    /* Solo interrumpe lo que se está diciendo cuando lo pide la persona (Otro dato).
       Al entrar en un lugar, el dato espera a que termine el saludo o la efeméride del día. */
    speak(day ? p.n + ". " + day + " " + text : text, mode === "more");
    emit("fact", { p: p, f: f, text: text });
    persist(true);
  }
  App.more = function () {
    var id = run.here || (run.lastFact && run.lastFact.id);
    if (id) tell(App.byId[id], "more");
  };
  App.repeat = function () {
    if (run.lastFact) speak(run.lastFact.text, true);
  };

  function bearing(a, b, c, d) {
    var R = Math.PI / 180, y = Math.sin((d - b) * R) * Math.cos(c * R);
    var x = Math.cos(a * R) * Math.sin(c * R) - Math.sin(a * R) * Math.cos(c * R) * Math.cos((d - b) * R);
    return (Math.atan2(y, x) / R + 360) % 360;
  }

  function todayMsg(T) {
    var d = new Date(), key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    if (T.dayMsg === key) return;
    T.dayMsg = key;
    var r = C.today(d, E), txt = "";
    if (r.exact.length) txt = r.exact[0].t;
    else if (r.month.length) txt = "Una efeméride de este mes. " + r.month[0].t;
    if (txt) speak("Hoy es " + C.dateEs(d) + ". " + txt, false);
  }

  /* ---------- Cada posición ---------- */
  function onFix(lat, lon, acc, spd, t) {
    var T = App.trip();
    if (!T || !run.on) return;
    /* Modo ahorro: se atiende una posición cada N segundos y se descartan las demás. */
    var gap = run.sim ? 0 : (+S.ahorro || 0) * 1000;
    if (gap && run.lastProc && t - run.lastProc < gap) return;
    run.lastProc = t;
    var prev = run.lastFix, kmh = null;
    if (spd != null && !isNaN(spd) && spd >= 0) kmh = spd * 3.6;
    else if (prev && t - prev.t > 500) kmh = C.dist(prev.lat, prev.lon, lat, lon) / ((t - prev.t) / 3600000);
    if (kmh != null && kmh > 250) kmh = null;
    run.kmh = kmh || 0;
    run.acc = acc;
    run.lastFix = { lat: lat, lon: lon, t: t };
    run.cur = { lat: lat, lon: lon };
    if (!run.anchor) run.anchor = { lat: lat, lon: lon };
    else if (C.dist(run.anchor.lat, run.anchor.lon, lat, lon) > 0.03) {
      run.heading = bearing(run.anchor.lat, run.anchor.lon, lat, lon);
      run.anchor = { lat: lat, lon: lon };
    }

    if (acc == null || acc <= 100) {
      var lastPt = T.pts[T.pts.length - 1];
      if (C.shouldRecord(lastPt, lat, lon, t)) T.pts.push([+lat.toFixed(5), +lon.toFixed(5), t, kmh != null ? Math.round(kmh) : null]);
      T.last = Date.now();
    }
    status(run.sim ? "sim" : (acc > 80 ? "warn" : "ok"),
      run.sim ? "Prueba" : (acc > 80 ? "Señal débil ±" + Math.round(acc) + " m" : "GPS ±" + Math.round(acc || 0) + " m"));

    /* Cambio de comunidad: se confirma con tres posiciones seguidas. */
    var reg = C.regionAt(lat, lon, L, 40);
    if (reg && reg !== run.region) {
      if (run.regCand === reg) run.regN++; else { run.regCand = reg; run.regN = 1; }
      if (run.regN >= 3) {
        var first = run.region === null;
        run.region = reg;
        if (!first) speak("Entrando en " + C.regName(reg) + ".", false);
        emit("region", reg);
      }
    } else if (reg) { run.regCand = null; run.regN = 0; }

    /* Lugar en el que estás. */
    var hit = C.inside(lat, lon, L, +S.zone), now = Date.now();
    if (hit) {
      if (run.here !== hit.p.id) {
        run.here = hit.p.id; run.hereN = 0;
        var vis = T.visited[hit.p.id];
        if (homeSkip(hit.p)) {
          /* En casa: se muestra el lugar pero no se cuenta nada ni se sigue contando. */
          run.hereN = 99;
          if (!T.visited[hit.p.id]) T.visited[hit.p.id] = { t: now, n: 0 };
        } else if (!vis || now - vis.t > 20 * 60000) {
          run.hereN = 1; tell(hit.p, "enter");
          if (App.isHome(hit.p) && !run.sim) { save("rch.homeLast", now); run.hereN = 99; }
        }
        emit("here", hit.p);
      } else if (S.auto && run.hereN < +S.maxFacts && !busy() && now - run.lastEnd > 18000) {
        run.hereN++; tell(hit.p, "auto");
      }
    } else if (run.here) {
      var hp = App.byId[run.here];
      if (C.dist(lat, lon, hp.lat, hp.lon) > hp.rad * +S.zone * 1.3) { run.here = null; emit("here", null); }
    }

    /* Siguiente lugar por delante y aviso al acercarse. */
    var cand = null, best = 1e9;
    for (var i = 0; i < L.length; i++) {
      var p = L[i];
      if (T.visited[p.id] || p.id === run.here || App.isHome(p)) continue;
      var d = C.dist(lat, lon, p.lat, p.lon);
      if (d > 30 || d >= best) continue;
      if (kmh > 8 && run.heading != null) {
        var b = bearing(lat, lon, p.lat, p.lon), diff = Math.abs(((b - run.heading + 540) % 360) - 180);
        if (diff > 70) continue;
      }
      best = d; cand = p;
    }
    run.next = cand ? { p: cand, d: best } : null;
    if (S.approach && cand && best <= 8 && best > cand.rad * +S.zone && !run.previewed[cand.id]) {
      var pd = run.prev[cand.id];
      run.prev[cand.id] = best;
      if (pd != null && best < pd - 0.02) run.appr[cand.id] = (run.appr[cand.id] || 0) + 1; else if (pd != null) run.appr[cand.id] = 0;
      if ((run.appr[cand.id] || 0) >= 3 && !busy()) {
        run.previewed[cand.id] = true;
        speak("Más adelante, a unos " + Math.max(2, Math.round(best)) + " kilómetros: " + cand.n + ".", false);
      }
    }

    emit("fix", { lat: lat, lon: lon, kmh: kmh, T: T });
    persist(false);
  }

  /* ---------- Empezar y parar ---------- */
  /* mode: "continue" sigue el viaje guardado; cualquier otro valor empieza uno nuevo. */
  function begin(sim, mode) {
    run.sim = !!sim;
    if (sim) run.simTrip = newTrip();
    else if (mode !== "continue" || !real || Date.now() - real.last > 12 * 3600000) { real = newTrip(); save("rch.trip", real); }
    run.on = true; run.here = null; run.hereN = 0; run.region = null; run.regCand = null; run.regN = 0;
    run.prev = {}; run.appr = {}; run.previewed = {}; run.heading = null; run.anchor = null; run.lastFix = null; run.lastProc = 0;
    run.next = null; run.lastFact = null; run.kmh = 0; run.cur = null;
    wakeOn();
    /* Se calla lo anterior y el saludo entra el primero en la cola: saludo, efeméride del día y luego los datos. */
    if (NS) NS.stop(); else if (synth) synth.cancel();
    speak(sim ? "Empieza la ruta de prueba." : "Viaje iniciado. Buenas carreteras.", false);
    if (S.today) todayMsg(App.trip());
    emit("trip"); emit("status", App.status);
  }

  /* Hay un viaje guardado que se puede continuar (menos de 12 horas desde la última posición). */
  App.savedTrip = function () {
    return !!(real && real.pts.length > 1 && C.stats(real.pts).km >= 0.5 && Date.now() - real.last <= 12 * 3600000);
  };
  App.start = function (mode) {
    if (run.on) return;
    if (BG) {
      /* App Android: GPS con un servicio en primer plano, sigue con la pantalla apagada. */
      begin(false, mode);
      status("warn", "Buscando señal…");
      BG.addWatcher({
        backgroundTitle: "Ruta con Historia",
        backgroundMessage: "Siguiendo el viaje para contarte los lugares por los que pasas.",
        requestPermissions: true, stale: false, distanceFilter: 10
      }, function (loc, err) {
        if (err) {
          if (err.code === "NOT_AUTHORIZED") {
            status("warn", "Permiso de ubicación denegado");
            emit("toast", "Falta el permiso de ubicación. Actívalo en los ajustes de Android para esta app.");
            App.stop();
          }
          return;
        }
        if (loc) onFix(loc.latitude, loc.longitude, loc.accuracy, loc.speed, loc.time || Date.now());
      }).then(function (id) { run.bgId = id; if (!run.on) BG.removeWatcher({ id: id }); });
      return;
    }
    if (!window.isSecureContext || !navigator.geolocation) {
      status("warn", "Sin GPS: abre la app desde una dirección https");
      emit("toast", "Este navegador no da acceso al GPS. Abre la app desde una dirección https.");
      return;
    }
    begin(false, mode);
    status("warn", "Buscando señal…");
    run.watch = navigator.geolocation.watchPosition(function (pos) {
      onFix(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed, pos.timestamp || Date.now());
    }, function (err) {
      if (err.code === 1) {
        status("warn", "Permiso de ubicación denegado");
        emit("toast", "Falta el permiso de ubicación. En Chrome: Ajustes del sitio, Ubicación, Permitir.");
        App.stop();
      } else if (err.code === 2) status("warn", "Sin posición disponible");
      else status("warn", "Buscando señal…");
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
  };

  App.startSim = function () {
    if (run.on) App.stop();
    var route = App.SIMS[+S.sim] || App.SIMS[0], factor = +S.simSpeed || 10;
    run.simPath = S.sim === "ruta" && App.routePath ? App.routePath(0.025 * factor) : C.simPath(route.ids, L, 0.025 * factor);
    if (!run.simPath || run.simPath.length < 2) run.simPath = C.simPath(App.SIMS[0].ids, L, 0.025 * factor);
    run.simI = 0; run.simT0 = Date.now();
    begin(true);
    run.timer = setInterval(function () {
      if (run.simI >= run.simPath.length) { App.stop(); emit("toast", "Fin de la ruta de prueba."); return; }
      var p = run.simPath[run.simI];
      onFix(p[0], p[1], 8, 25, run.simT0 + run.simI * 1000 * factor);
      run.simI++;
    }, 1000);
  };

  App.stop = function () {
    if (run.watch != null) { navigator.geolocation.clearWatch(run.watch); run.watch = null; }
    if (BG && run.bgId) { BG.removeWatcher({ id: run.bgId }); run.bgId = null; }
    if (run.timer) { clearInterval(run.timer); run.timer = null; }
    wakeOff();
    if (NS) NS.stop(); else if (synth) synth.cancel();
    voiceMaybeDone();
    persist(true);
    run.on = false; run.sim = false; run.here = null; run.next = null;
    status("off", "GPS apagado");
    emit("trip"); emit("here", null); emit("stopped");
  };

  App.gpx = function () {
    var T = real;
    return T && T.pts.length ? C.gpx(T.pts, "Ruta con Historia " + new Date(T.start).toLocaleDateString("es-ES")) : null;
  };
})();

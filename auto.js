/* Android Auto (solo app Android): envía el lugar y el dato actuales a la pantalla del coche y atiende sus botones. */
(function () {
  "use strict";
  var A = window.App, run = A.run;
  var CAP = window.Capacitor;
  if (!(CAP && CAP.isNativePlatform && CAP.isNativePlatform())) return;
  var P = CAP.registerPlugin("CarAuto");
  /* La sesión de medios solo se activa mientras suena la radio de la app: así los datos hablados no se llevan el control de medios del coche. */
  var radioPlaying = false, here = null, idle = "Empieza el viaje en el móvil", tick = 0;
  function nextText() {
    if (!run.on) return null;
    return run.next ? "Próximo: " + run.next.p.n + " · " + A.C.fmtKm(run.next.d) : "Buscando el próximo lugar…";
  }
  function station() {
    var s = A.radio.state().st, f = s.favs && s.favs[s.cur];
    return f ? f.n : "Radio";
  }
  /* Dos líneas en la pantalla del coche.
     Con la radio de la app sonando: arriba alterna «Ahora: sitio» y «Próximo: sitio · km» cada 30 s, y abajo va la emisora.
     Sin radio: arriba el sitio y abajo el próximo lugar. */
  function compose() {
    var next = nextText();
    if (radioPlaying) {
      var lines = []; if (here) lines.push("Ahora: " + here); if (next) lines.push(next);
      return { title: lines.length ? lines[tick % lines.length] : "Ruta con Historia", text: station() };
    }
    return { title: here || "Ruta con Historia", text: next || idle };
  }
  var sent = "";
  function push(force) {
    var c = compose(), key = [c.title, c.text, radioPlaying, !!(run.on && !run.sim), !!run.mute].join("|");
    if (!force && key === sent) return; sent = key;
    P.update({ title: c.title, text: c.text, active: radioPlaying, trip: !!(run.on && !run.sim), muted: !!run.mute }).catch(function () { });
  }
  A.on("fact", function (e) { here = e.p.n; push(); });
  A.on("fix", function () { push(); });
  A.on("trip", function () { idle = "Viaje en marcha"; push(); });
  A.on("mute", function () { push(); });
  A.on("stopped", function () { here = null; idle = "Viaje parado"; push(); });
  /* Cada 30 s alterna el sitio actual y el próximo mientras suena la radio. */
  setInterval(function () { if (radioPlaying && run.on) { tick++; push(); } }, 30000);
  /* Emisoras favoritas en la lista de la pantalla del coche. */
  var lastNames = "";
  function pushStations() {
    var favs = A.radio && A.radio.state().st.favs || [], names = favs.map(function (f) { return f.n; }), key = names.join("|");
    if (key === lastNames) return;
    lastNames = key; P.setStations({ names: names }).catch(function () { });
  }
  A.on("radio", function (e) {
    var was = radioPlaying; radioPlaying = !!e.playing;
    if (was !== radioPlaying) bgApply(radioPlaying ? "radio" : bgGet());
    pushStations(); push();
  });
  setTimeout(pushStations, 2000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) pushStations(); });
  P.addListener("action", function (a) {
    if (/^radio:\d+$/.test(a.name)) { A.radio.play(+a.name.slice(6)); return; }
    if (a.name === "trip") {
      if (run.on && !run.sim) A.stop(); else if (!run.on) A.start(A.savedTrip() ? "continue" : "new");
      return;
    }
    /* Play y pausa del coche: la radio de la app. */
    if (a.name === "radio") { A.radio.toggle(); return; }
    if (a.name === "play") { if (!A.radio.state().want) A.radio.toggle(); return; }
    if (a.name === "pause") { if (A.radio.state().want) A.radio.stop(); return; }
    /* Siguiente y anterior (pantalla y volante): emisora si suena la radio; si no, otro dato. */
    if (a.name === "next" || a.name === "prev") {
      if (A.radio.state().want) { if (a.name === "next") A.radio.next(); else A.radio.prev(); }
      else if (a.name === "next" && run.on) A.more();
      return;
    }
    if (!run.on) return;
    if (a.name === "more") A.more();
    else if (a.name === "repeat") A.repeat();
    else if (a.name === "mute") A.setMute(!run.mute);
  });
  /* Fondo muy tenue para la pantalla del coche. */
  var BGS = [["costa", "Costa"], ["montanas", "Montañas"], ["mapa", "Mapa"], ["camino", "Camino"], ["arcos", "Arcos"], ["", "Ninguno"]];
  function bgGet() { try { var v = localStorage.getItem("rch.autobg"); return v == null ? "costa" : v; } catch (e) { return "costa"; } }
  function bgApply(name) {
    if (!name) { P.setBackground({ image: "" }).catch(function () { }); return; }
    fetch("fondos/" + name + ".png").then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { P.setBackground({ image: String(fr.result).split(",")[1] || "" }).catch(function () { }); };
      fr.readAsDataURL(b);
    }).catch(function () { });
  }
  var box = document.getElementById("autoBgs");
  function bgRender() {
    var cur = bgGet(); box.textContent = "";
    BGS.forEach(function (x) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", x[0] === cur ? "true" : "false");
      if (x[0]) { var im = document.createElement("img"); im.src = "fondos/" + x[0] + ".png"; im.alt = ""; b.appendChild(im); }
      var sp = document.createElement("span"); sp.textContent = x[1]; b.appendChild(sp);
      b.addEventListener("click", function () { try { localStorage.setItem("rch.autobg", x[0]); } catch (e) { } bgRender(); bgApply(x[0]); A.emit("toast", "Fondo de Android Auto: " + x[1] + "."); });
      box.appendChild(b);
    });
  }
  bgRender(); setTimeout(function () { bgApply(bgGet()); }, 1200);
  push(true);
})();

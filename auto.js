/* Android Auto (solo app Android): envía el lugar y el dato actuales a la pantalla del coche y atiende sus botones. */
(function () {
  "use strict";
  var A = window.App, run = A.run;
  var CAP = window.Capacitor;
  if (!(CAP && CAP.isNativePlatform && CAP.isNativePlatform())) return;
  var P = CAP.registerPlugin("CarAuto");
  var cur = { title: "Ruta con Historia", text: "Empieza el viaje en el móvil" };
  /* La sesión de medios solo se activa mientras suena la radio de la app: así los datos hablados no se llevan el control de medios del coche. */
  var radioPlaying = false;
  function push() { P.update({ title: cur.title, text: cur.text, active: radioPlaying }).catch(function () { }); }
  A.on("fact", function (e) { cur = { title: e.p.n, text: e.f.text }; push(); });
  A.on("trip", push);
  A.on("stopped", function () { cur = { title: "Ruta con Historia", text: "Viaje parado" }; push(); });
  /* Emisoras favoritas en la lista de la pantalla del coche. */
  var lastNames = "";
  function pushStations() {
    var favs = A.radio && A.radio.state().st.favs || [], names = favs.map(function (f) { return f.n; }), key = names.join("|");
    if (key === lastNames) return;
    lastNames = key; P.setStations({ names: names }).catch(function () { });
  }
  A.on("radio", function (e) {
    var was = radioPlaying; radioPlaying = !!e.playing;
    if (was !== radioPlaying) push();
    pushStations();
    if (e.playing && e.fav && !(run.lastFact && run.on)) { cur = { title: e.fav.n, text: "Radio" }; push(); }
  });
  setTimeout(pushStations, 2000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) pushStations(); });
  P.addListener("action", function (a) {
    if (/^radio:\d+$/.test(a.name)) { A.radio.play(+a.name.slice(6)); return; }
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
  push();
})();

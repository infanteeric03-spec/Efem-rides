/* Android Auto (solo app Android): envía el lugar y el dato actuales a la pantalla del coche y atiende sus botones. */
(function () {
  "use strict";
  var A = window.App, run = A.run;
  var CAP = window.Capacitor;
  if (!(CAP && CAP.isNativePlatform && CAP.isNativePlatform())) return;
  var P = CAP.registerPlugin("CarAuto");
  var cur = { title: "Ruta con Historia", text: "Empieza el viaje en el móvil" };
  function push() { P.update({ title: cur.title, text: cur.text, active: !!(run.on && !run.sim) }).catch(function () { }); }
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
  push();
})();

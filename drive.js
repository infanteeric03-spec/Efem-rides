/* Vista de conducción: lo imprescindible en grande mientras el viaje está en marcha. */
(function () {
  "use strict";
  var A = window.App, C = A.C, S = A.S, run = A.run;
  function $(id) { return document.getElementById(id); }
  if (S.drive === undefined) S.drive = true;

  var shown = false, closedThisTrip = false, lastFactKey = "";

  function show(on) {
    shown = on;
    $("drive").hidden = !on;
    document.body.classList.toggle("driving", on);
    syncDriveBtn();
    if (on) { window.scrollTo(0, 0); render(); }
  }

  function syncDriveBtn() {
    var hide = shown || !run.on;
    $("btnDrive").hidden = hide;
    if (A.syncStartRow) A.syncStartRow();
  }

  function setText(id, t) { var e = $(id); if (e.textContent !== t) e.textContent = t; }

  function render() {
    if (!shown) return;
    var p = run.here ? A.byId[run.here] : null;
    setText("dReg", p ? C.regName(p.reg) : (run.region ? C.regName(run.region) : "En ruta"));
    setText("dName", p ? p.n : (run.lastFix ? "En ruta" : "Buscando GPS…"));
    setText("dNext", run.next ? "Próximo: " + run.next.p.n + "\u00a0·\u00a0" + C.fmtKm(run.next.d).replace(" ", "\u00a0") : (run.lastFix ? "Sin lugares catalogados cerca" : "Esperando la señal del GPS"));

    var T = A.trip(), st = T && T.pts.length > 1 ? C.stats(T.pts) : { km: 0, ms: 0 };
    var mins = Math.floor(st.ms / 60000);
    setText("dSpeed", String(Math.round(run.on ? run.kmh : 0)));
    setText("dKm", st.km.toFixed(1).replace(".", ","));
    setText("dTime", mins >= 60 ? Math.floor(mins / 60) + ":" + ("0" + (mins % 60)).slice(-2) : String(mins));
    setText("dTimeU", mins >= 60 ? "h" : "min");

    var f = run.lastFact;
    var key = f ? f.id + ":" + f.f.i + ":" + (T ? T.log.length : 0) : "";
    if (key !== lastFactKey) {
      lastFactKey = key;
      $("dFact").classList.remove("open");
      $("dFactToggle").setAttribute("aria-expanded", "false");
      setText("dFactToggle", "Leer entero");
    }
    setText("dFactText", f ? f.f.text : "Cuando entres en un lugar con historia, te lo contaré en voz alta.");
    var tg = $("dFactToggle");
    tg.hidden = !f || f.f.text.length < 110;

    $("dMore").disabled = !(run.here || run.lastFact);
    $("dRepeat").disabled = !run.lastFact;
    var m = $("dMute");
    m.setAttribute("aria-pressed", run.mute ? "true" : "false");
    setText("dMute", run.mute ? "Voz silenciada" : "Silenciar");
    setText("dStop", run.sim ? "Parar prueba" : "Parar viaje");
  }

  A.on("trip", function () {
    if (run.on && !shown && S.drive && !closedThisTrip) show(true);
    if (!run.on) { closedThisTrip = false; show(false); }
    syncDriveBtn();
    render();
  });
  ["fix", "fact", "here", "region", "mute", "status"].forEach(function (e) { A.on(e, render); });

  $("dMore").addEventListener("click", A.more);
  $("dRepeat").addEventListener("click", A.repeat);
  $("dMute").addEventListener("click", function () { A.setMute(!run.mute); });
  $("dStop").addEventListener("click", function () { A.stop(); });
  $("dRadio").addEventListener("click", function () { if (A.radio) A.radio.toggle(); });
  $("dStation").addEventListener("click", function () { if (A.radio) A.radio.next(); });
  A.on("radio", function (r) {
    setText("dRadio", r.playing ? "Parar radio" : "Radio");
    $("dRadio").setAttribute("aria-pressed", r.playing ? "true" : "false");
    var info = $("dRadioInfo");
    info.hidden = !r.playing && r.kind !== "error";
    setText("dRadioInfo", r.text);
    info.className = "d-radio " + r.kind;
  });
  $("dExit").addEventListener("click", function () { closedThisTrip = true; show(false); });
  $("btnDrive").addEventListener("click", function () { closedThisTrip = false; show(true); });
  $("dFactToggle").addEventListener("click", function () {
    var open = $("dFact").classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
    this.textContent = open ? "Contraer" : "Leer entero";
  });

  var sd = $("s_drive");
  sd.checked = !!S.drive;
  sd.addEventListener("change", function () { A.setS("drive", sd.checked); });

  show(false);
})();

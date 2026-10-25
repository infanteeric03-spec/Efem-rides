/* Vista de conducción: lo imprescindible en grande mientras el viaje está en marcha.
   La pantalla se divide en zonas de altura fija para que los botones no se muevan nunca durante el viaje:
   el texto se adapta a su hueco (el nombre se encoge si es largo) en lugar de empujar lo de abajo. */
(function () {
  "use strict";
  var A = window.App, C = A.C, S = A.S, run = A.run;
  function $(id) { return document.getElementById(id); }
  if (S.drive === undefined) S.drive = true;
  if (S.driveText === undefined) S.driveText = true;

  var shown = false, closedThisTrip = false, lastFactKey = "", lastName = "", lastNext = "";
  var POP_SECONDS = 30, popTimer = null, popLeft = 0;

  /* Iconos de los botones pequeños (trazo con el color del botón). */
  var ICONS = {
    repeat: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v5h5"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    muted: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke-linejoin="round"/><path d="M15.5 9.5l5 5"/><path d="M20.5 9.5l-5 5"/>',
    radio: '<rect x="3" y="8.5" width="18" height="11.5" rx="2"/><path d="M7 8.5l10-4.5"/><circle cx="15.5" cy="14.25" r="2.75"/><path d="M6.5 12.5h4M6.5 16h4"/>',
    radioOn: '<rect x="3" y="8.5" width="18" height="11.5" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M7 8.5l10-4.5"/><circle cx="15.5" cy="14.25" r="2.75" fill="currentColor"/><path d="M6.5 12.5h4M6.5 16h4"/>',
    next: '<path d="M6 6l9 6-9 6z" fill="currentColor" stroke-linejoin="round"/><path d="M18 6v12"/>'
  };
  function setIcon(id, icon, label) {
    var b = $(id);
    if (b.dataset.icon !== icon) {
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' + ICONS[icon] + '</svg>';
      b.dataset.icon = icon;
    }
    b.setAttribute("aria-label", label); b.title = label;
  }

  function setText(id, t) { var e = $(id); if (e.textContent !== t) e.textContent = t; }
  function setVisible(el, on) { el.style.visibility = on ? "visible" : "hidden"; }

  function show(on) {
    shown = on;
    $("drive").hidden = !on;
    document.body.classList.toggle("driving", on);
    $("drive").classList.toggle("no-text", !S.driveText);
    if (!on) closePop();
    syncDriveBtn();
    if (on) { window.scrollTo(0, 0); render(); layout(); }
  }
  function syncDriveBtn() {
    $("btnDrive").hidden = shown || !run.on;
    if (A.syncStartRow) A.syncStartRow();
  }

  /* ---------- Tamaños dentro de la señal ---------- */
  /* La distancia mide un 40 % del alto de la señal y tiene ancho fijo (tres cifras), así el nombre no cambia de líneas cuando pasa de 9 a 10 km. */
  function layout() {
    if (!shown) return;
    var sign = document.querySelector(".d-sign"), h = sign.clientHeight, w = sign.clientWidth;
    if (!h) return;
    /* Distancia pequeña en la esquina inferior derecha de la señal (un tercio del tamaño anterior).
       Se reserva su franja abajo para que el nombre nunca la pise. */
    var num = Math.max(14, Math.round(Math.min(h * 0.40 / 0.85, w * 0.38 / 1.75) / 3));
    var box = $("dDistBox");
    box.style.fontSize = num + "px";
    box.style.width = "";
    $("dSignIn").style.paddingBottom = Math.round(num * 1.15 + 10) + "px";
    fitName();
  }
  /* Busca el mayor tamaño de letra con el que región, nombre y próximo lugar caben en la señal. */
  function fitName() {
    var name = $("dName"), main = $("dSignMain"), inner = $("dSignIn");
    var cs = getComputedStyle(inner);
    var avail = inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (avail <= 0) return;
    var lo = 16, hi = Math.min(72, Math.round(avail * 0.55)), best = lo;
    function fits(px) {
      name.style.fontSize = px + "px";
      return main.scrollHeight <= avail + 1 && name.scrollWidth <= name.clientWidth + 1;
    }
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (fits(mid)) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    name.style.fontSize = best + "px";
  }
  window.addEventListener("resize", function () { if (shown) layout(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (shown) layout(); });

  /* ---------- Doble toque para acciones delicadas ---------- */
  var armed = {};
  function confirmTap(btn, armedText, action) {
    var id = btn.id;
    if (armed[id]) {
      clearTimeout(armed[id]); delete armed[id];
      btn.classList.remove("armed"); btn.style.fontSize = "";
      action();
      render();
      return;
    }
    btn.textContent = armedText;
    btn.classList.add("armed");
    /* Siempre en una línea: si no cabe, se reduce la letra solo mientras dura el aviso. */
    btn.style.fontSize = "";
    var fs = parseFloat(getComputedStyle(btn).fontSize);
    while (btn.scrollWidth > btn.clientWidth && fs > 12) { fs -= 1; btn.style.fontSize = fs + "px"; }
    armed[id] = setTimeout(function () { delete armed[id]; btn.classList.remove("armed"); btn.style.fontSize = ""; render(); }, 3000);
  }

  /* ---------- Ventana flotante con el texto ---------- */
  function openPop() {
    var f = run.lastFact; if (!f) return;
    var p = A.byId[f.id];
    setText("dPopTitle", (p ? p.n : "") + (p && p.src ? " · Wikipedia" : ""));
    setText("dFactText", f.f.text);
    $("dPop").hidden = false;
    $("dFactText").scrollTop = 0;
    popLeft = POP_SECONDS; tick();
    clearInterval(popTimer);
    popTimer = setInterval(function () { popLeft--; if (popLeft <= 0) closePop(); else tick(); }, 1000);
  }
  function tick() { setText("dPopTimer", "Se cierra en " + popLeft + " s"); }
  function closePop() { clearInterval(popTimer); popTimer = null; $("dPop").hidden = true; }

  /* ---------- Pintar ---------- */
  function render() {
    if (!shown) return;
    var p = run.here ? A.byId[run.here] : null;
    setText("dReg", p ? C.regName(p.reg) : (run.region ? C.regName(run.region) : "En ruta"));
    var name = p ? p.n : (run.lastFix ? "En ruta" : "Buscando GPS…");
    var nextTxt, distOn = false;
    if (run.next) {
      var dk = C.fmtKm(run.next.d).split(" ");
      nextTxt = "Próximo: " + run.next.p.n;
      setText("dDist", dk[0]); setText("dDistU", dk[1] || "km");
      distOn = true;
    } else nextTxt = run.lastFix ? "Sin lugares catalogados cerca" : "Esperando la señal del GPS";
    setText("dName", name); setText("dNextName", nextTxt);
    setVisible($("dDistBox"), distOn);
    if (name !== lastName || nextTxt !== lastNext) { lastName = name; lastNext = nextTxt; fitName(); }

    var T = A.trip(), st = T && T.pts.length > 1 ? C.stats(T.pts) : { km: 0, ms: 0 };
    var mins = Math.floor(st.ms / 60000);
    setText("dSpeed", String(Math.round(run.on ? run.kmh : 0)));
    setText("dKm", st.km.toFixed(1).replace(".", ","));
    setText("dTime", mins >= 60 ? Math.floor(mins / 60) + ":" + ("0" + (mins % 60)).slice(-2) : String(mins));
    setText("dTimeU", mins >= 60 ? "h" : "min");

    var f = run.lastFact;
    var key = f ? f.id + ":" + f.f.i + ":" + (T ? T.log.length : 0) : "";
    if (key !== lastFactKey) { lastFactKey = key; closePop(); }
    setVisible($("dFactToggle"), !!f && S.driveText);
    if (!armed.dFactToggle) setText("dFactToggle", "Mostrar contenido");

    $("dMore").disabled = !(run.here || run.lastFact);
    $("dRepeat").disabled = !run.lastFact;
    $("dMute").setAttribute("aria-pressed", run.mute ? "true" : "false");
    setIcon("dMute", run.mute ? "muted" : "sound", run.mute ? "Voz silenciada: toca para activarla" : "Silenciar la voz");
    if (!armed.dStop) setText("dStop", run.sim ? "Parar prueba" : "Parar viaje");
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
  $("dStop").addEventListener("click", function () { confirmTap(this, "Toca otra vez", function () { A.stop(); }); });
  $("dFactToggle").addEventListener("click", function () { confirmTap(this, "Toca otra vez para mostrar", openPop); });
  $("dPopClose").addEventListener("click", closePop);
  $("dRadio").addEventListener("click", function () { if (A.radio) A.radio.toggle(); });
  $("dStation").addEventListener("click", function () { if (A.radio) A.radio.next(); });
  A.on("radio", function (r) {
    setIcon("dRadio", r.playing ? "radioOn" : "radio", r.playing ? "Parar la radio" : "Encender la radio");
    $("dRadio").setAttribute("aria-pressed", r.playing ? "true" : "false");
    var info = $("dRadioInfo");
    setText("dRadioInfo", r.text || "");
    setVisible(info, r.playing || r.kind === "error");
    info.className = "d-radio " + r.kind;
  });
  $("dExit").addEventListener("click", function () { closedThisTrip = true; show(false); });
  $("btnDrive").addEventListener("click", function () { closedThisTrip = false; show(true); });

  var sd = $("s_drive");
  sd.checked = !!S.drive;
  sd.addEventListener("change", function () { A.setS("drive", sd.checked); });
  var st2 = $("s_driveText");
  st2.checked = !!S.driveText;
  st2.addEventListener("change", function () { A.setS("driveText", st2.checked); $("drive").classList.toggle("no-text", !S.driveText); });

  setIcon("dRepeat", "repeat", "Repetir el último dato");
  setIcon("dStation", "next", "Otra emisora");
  setIcon("dMute", "sound", "Silenciar la voz");
  setIcon("dRadio", "radio", "Encender la radio");
  setVisible($("dRadioInfo"), false);
  show(false);
})();

/* Bluetooth del coche (solo app Android): empieza el viaje al conectarse y lo para al desconectarse. */
(function () {
  "use strict";
  var A = window.App, run = A.run;
  var CAP = window.Capacitor;
  if (!(CAP && CAP.isNativePlatform && CAP.isNativePlatform())) return;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function toast(t) { A.emit("toast", t); }
  function load() { try { return JSON.parse(localStorage.getItem("rch.car") || "null"); } catch (e) { return null; } }
  function save(v) { try { if (v) localStorage.setItem("rch.car", JSON.stringify(v)); else localStorage.removeItem("rch.car"); } catch (e) { } }

  var BT = CAP.registerPlugin("CarBluetooth");
  var car = load(), stopTimer = null;
  $("carSec").hidden = false;
  var DEF = $("carTxt").textContent;

  function render() {
    $("btnCar").textContent = car ? "Cambiar" : "Elegir";
    $("carTxt").textContent = car ? "Coche: " + car.name + ". Empieza el viaje al conectarse y lo para al desconectarse." : DEF;
  }
  render();

  /* ---------- Elegir el coche ---------- */
  var modal = el("div", "modal"); modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  var sheet = el("div", "sheet"); modal.appendChild(sheet); document.body.appendChild(modal);
  function close() { modal.hidden = true; document.body.classList.remove("modal-open"); }
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  function picker(list) {
    sheet.textContent = "";
    var head = el("div", "sheet-head"); head.appendChild(el("h2", null, "Elige tu coche"));
    var x = el("button", "btn ghost small", "Cerrar"); x.type = "button"; x.addEventListener("click", close); head.appendChild(x);
    sheet.appendChild(head);
    sheet.appendChild(el("p", "note", list.length ? "Son los dispositivos Bluetooth emparejados con este móvil." : "No hay dispositivos emparejados. Empareja el coche en los ajustes de Bluetooth del móvil y vuelve aquí."));
    list.forEach(function (d) {
      var b = el("button", "btn ghost", d.name); b.type = "button";
      b.addEventListener("click", function () { car = { address: d.address, name: d.name }; save(car); render(); close(); toast("Coche elegido: " + d.name + "."); });
      sheet.appendChild(b);
    });
    if (car) {
      var rm = el("button", "btn ghost", "Quitar el coche"); rm.type = "button";
      rm.addEventListener("click", function () { car = null; save(null); render(); close(); toast("Ya no se usa el Bluetooth del coche."); });
      sheet.appendChild(rm);
    }
    modal.hidden = false; document.body.classList.add("modal-open");
  }
  $("btnCar").addEventListener("click", function () {
    BT.ask().then(function (r) {
      if (!r.granted) { toast("Hace falta el permiso de Bluetooth para elegir el coche."); return; }
      return BT.paired().then(function (res) { picker(res.devices || []); });
    }).catch(function () { toast("No he podido leer los dispositivos Bluetooth."); });
  });

  /* ---------- Empezar y parar ---------- */
  function begin() {
    if (run.on) return;
    A.start(A.savedTrip() ? "continue" : "new");
    toast("Viaje empezado: coche conectado.");
  }
  BT.addListener("connected", function (d) {
    if (!car || d.address !== car.address) return;
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    begin();
  });
  BT.addListener("disconnected", function (d) {
    if (!car || d.address !== car.address || !run.on || run.sim) return;
    /* Margen de 20 s por si el Bluetooth se corta un momento. */
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(function () { stopTimer = null; if (run.on && !run.sim) A.stop(); }, 20000);
  });
  /* Al abrir la app con el coche ya conectado. */
  function atOpen() {
    if (!car || run.on) return;
    BT.isConnected({ address: car.address }).then(function (r) { if (r.connected) begin(); }).catch(function () { });
  }
  setTimeout(atOpen, 1500);
})();

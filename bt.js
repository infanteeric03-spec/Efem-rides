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
  var car = load(), stopTimer = null, devices = [];
  /* Interruptor: si no se ha tocado nunca y ya había un coche elegido, sigue activado. */
  function loadOn() { try { var v = localStorage.getItem("rch.carOn"); return v == null ? !!car : v === "1"; } catch (e) { return !!car; } }
  function saveOn(v) { try { localStorage.setItem("rch.carOn", v ? "1" : "0"); } catch (e) { } }
  var on = loadOn();
  function enabled() { return on && !!car; }
  $("carSec").hidden = false;
  var DEF = $("carTxt").textContent;

  function render() {
    $("carOn").checked = on;
    $("carPick").hidden = !on;
    $("carTxt").textContent = !on ? DEF : car ? "Coche: " + car.name + ". Empieza el viaje al conectarse y lo para al desconectarse." : "Elige tu coche en la lista de abajo.";
  }

  /* ---------- Lista de coches (dispositivos emparejados) ---------- */
  function fillList() {
    var sel = $("s_car"); sel.textContent = "";
    var first = el("option", null, devices.length ? "Elige tu coche…" : "No hay dispositivos emparejados"); first.value = ""; sel.appendChild(first);
    var known = false;
    devices.forEach(function (d) { var o = el("option", null, d.name); o.value = d.address; sel.appendChild(o); if (car && d.address === car.address) known = true; });
    if (car && !known) { var o2 = el("option", null, car.name + " (no emparejado)"); o2.value = car.address; sel.appendChild(o2); }
    sel.value = car ? car.address : "";
  }
  function loadDevices() {
    return BT.ask().then(function (r) {
      if (!r.granted) { toast("Hace falta el permiso de Bluetooth para elegir el coche."); on = false; saveOn(false); render(); return; }
      return BT.paired().then(function (res) { devices = res.devices || []; fillList(); if (!devices.length) toast("No hay dispositivos emparejados. Empareja el coche en los ajustes de Bluetooth del móvil."); });
    }).catch(function () { toast("No he podido leer los dispositivos Bluetooth."); });
  }
  $("carOn").addEventListener("change", function () {
    on = $("carOn").checked; saveOn(on); render();
    if (on) loadDevices();
    else { if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; } toast("Bluetooth del coche desactivado."); }
  });
  $("s_car").addEventListener("change", function () {
    var v = $("s_car").value, d = devices.filter(function (x) { return x.address === v; })[0];
    if (!v) car = null; else if (d) car = { address: d.address, name: d.name };
    save(car); render();
    if (car) toast("Coche elegido: " + car.name + ".");
  });
  render(); fillList();
  if (on) loadDevices();

  /* ---------- Empezar y parar ---------- */
  function begin() {
    if (run.on) return;
    A.start(A.savedTrip() ? "continue" : "new");
    toast("Viaje empezado: coche conectado.");
  }
  BT.addListener("connected", function (d) {
    if (!enabled() || d.address !== car.address) return;
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    begin();
  });
  BT.addListener("disconnected", function (d) {
    if (!enabled() || d.address !== car.address || !run.on || run.sim) return;
    /* Margen de 20 s por si el Bluetooth se corta un momento. */
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(function () { stopTimer = null; if (run.on && !run.sim) A.stop(); }, 20000);
  });
  /* Al abrir la app con el coche ya conectado. */
  function atOpen() {
    if (!enabled() || run.on) return;
    BT.isConnected({ address: car.address }).then(function (r) { if (r.connected) begin(); }).catch(function () { });
  }
  setTimeout(atOpen, 1500);
})();

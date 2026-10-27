/* Edición de lugares: corregir, añadir, ordenar o borrar datos, ocultar lugares, crear lugares nuevos
   y exportar o importar los cambios. Todo se guarda en este móvil. */
(function () {
  "use strict";
  var A = window.App, C = A.C, L = A.L, S = A.S;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function toast(t) { A.emit("toast", t); }

  var ED = load("rch.edits", null) || {};
  if (!ED.places) ED.places = {};
  if (!ED.custom) ED.custom = [];
  function persist() { if (!save("rch.edits", ED)) toast("No he podido guardar los cambios en este móvil."); }

  /* Aplica los cambios a la lista de lugares. Se repite cuando se instala una ruta nueva. */
  function apply() {
    ED.custom.forEach(function (c) { c.custom = true; if (!A.byId[c.id]) { L.push(c); A.byId[c.id] = c; } });
    for (var i = L.length - 1; i >= 0; i--) {
      var p = L[i];
      if (p.custom && !ED.custom.some(function (c) { return c.id === p.id; })) { delete A.byId[p.id]; L.splice(i, 1); continue; }
      if (p.custom) { p.hidden = !!p.hiddenFlag; continue; }
      if (!p._orig) p._orig = p.h.slice();
      var e = ED.places[p.id];
      p.h = e && e.h ? e.h.slice() : p._orig.slice();
      p.hidden = !!(e && e.hidden);
      p.edited = !!(e && e.h);
    }
  }
  function changed() { apply(); persist(); A.emit("places"); if (A.Map && A.Map.refresh) A.Map.refresh(); }
  A.on("places", function () { apply(); if (A.renderPlaces) A.renderPlaces(); });

  /* ---------- Ventana de edición ---------- */
  var modal = el("div", "modal"); modal.hidden = true; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  var sheet = el("div", "sheet"); modal.appendChild(sheet); document.body.appendChild(modal);
  function close() { modal.hidden = true; sheet.textContent = ""; document.body.classList.remove("modal-open"); }
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  function field(label, input) { var w = el("label", "f"); w.appendChild(el("span", null, label)); w.appendChild(input); return w; }

  function open(p) {
    var isNew = !p, custom = isNew || !!p.custom;
    var work = { n: p ? p.n : "", reg: p ? C.regName(p.reg) : (S.lastProv || ""), lat: p ? p.lat : null, lon: p ? p.lon : null,
      rad: p ? p.rad : 2, h: p ? p.h.slice() : [""], hidden: p ? !!(custom ? p.hiddenFlag : p.hidden) : false };
    sheet.textContent = "";
    var head = el("div", "sheet-head");
    head.appendChild(el("h2", null, isNew ? "Nuevo lugar" : "Editar " + p.n));
    var x = el("button", "btn ghost small", "Cerrar"); x.type = "button"; x.addEventListener("click", close); head.appendChild(x);
    sheet.appendChild(head);
    if (p && p.src === "wikipedia") sheet.appendChild(el("p", "note", "Lugar sacado de Wikipedia. Tus cambios se mantienen mientras tengas preparada esta ruta."));

    var nameIn, regIn, radSel, posTxt;
    if (custom) {
      nameIn = el("input", "search"); nameIn.type = "text"; nameIn.id = "edName"; nameIn.value = work.n; nameIn.placeholder = "Nombre del lugar";
      sheet.appendChild(field("Nombre", nameIn));
      regIn = el("input", "search"); regIn.type = "text"; regIn.id = "edReg"; regIn.value = work.reg; regIn.placeholder = "Por ejemplo, Asturias";
      sheet.appendChild(field("Provincia o región", regIn));
      var posRow = el("div", "f");
      posRow.appendChild(el("span", null, "Posición"));
      posTxt = el("p", "ed-pos"); posRow.appendChild(posTxt);
      var posBtns = el("div", "row");
      var me = el("button", "btn ghost small", "Mi ubicación"); me.type = "button";
      me.addEventListener("click", function () {
        if (!navigator.geolocation) { toast("Este navegador no da la ubicación."); return; }
        me.disabled = true; me.textContent = "Buscando…";
        navigator.geolocation.getCurrentPosition(function (pos) {
          work.lat = pos.coords.latitude; work.lon = pos.coords.longitude; showPos(); me.disabled = false; me.textContent = "Mi ubicación";
        }, function () { toast("No tengo permiso para usar tu ubicación."); me.disabled = false; me.textContent = "Mi ubicación"; }, { timeout: 15000, maximumAge: 60000 });
      });
      var onMap = el("button", "btn ghost small", "Elegir en el mapa"); onMap.type = "button";
      onMap.addEventListener("click", function () {
        if (!A.Map) { toast("El mapa no está disponible."); return; }
        A.Map.pick(work.lat, work.lon, function (lat, lon) { work.lat = lat; work.lon = lon; showPos(); });
      });
      posBtns.appendChild(me); posBtns.appendChild(onMap); posRow.appendChild(posBtns);
      sheet.appendChild(posRow);
      radSel = el("select"); radSel.id = "edRad";
      [["1", "Pequeña (1 km)"], ["2", "Normal (2 km)"], ["3.5", "Grande (3,5 km)"]].forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; radSel.appendChild(op); });
      radSel.value = String(work.rad >= 3 ? 3.5 : work.rad <= 1 ? 1 : 2);
      sheet.appendChild(field("Zona en la que te lo cuento", radSel));
    }
    function showPos() { if (posTxt) posTxt.textContent = work.lat == null ? "Sin elegir" : work.lat.toFixed(5) + ", " + work.lon.toFixed(5); }
    showPos();

    sheet.appendChild(el("h3", "sec", "Datos"));
    var list = el("div", "ed-list"); sheet.appendChild(list);
    function renderFacts() {
      list.textContent = "";
      work.h.forEach(function (t, i) {
        var row = el("div", "ed-fact");
        var ta = el("textarea"); ta.value = t; ta.rows = 5; ta.id = "edFact" + i; ta.setAttribute("aria-label", "Dato " + (i + 1));
        ta.addEventListener("input", function () { work.h[i] = ta.value; });
        var tools = el("div", "ed-tools");
        [["↑", "Subir", -1], ["↓", "Bajar", 1]].forEach(function (b) {
          var bt = el("button", "btn ghost small", b[0]); bt.type = "button"; bt.setAttribute("aria-label", b[1]);
          bt.disabled = (b[2] < 0 && i === 0) || (b[2] > 0 && i === work.h.length - 1);
          bt.addEventListener("click", function () { var j = i + b[2], tmp = work.h[i]; work.h[i] = work.h[j]; work.h[j] = tmp; renderFacts(); });
          tools.appendChild(bt);
        });
        var del = el("button", "btn ghost small", "Borrar"); del.type = "button";
        del.addEventListener("click", function () { work.h.splice(i, 1); if (!work.h.length) work.h.push(""); renderFacts(); });
        tools.appendChild(del);
        row.appendChild(el("span", "ed-n", "Dato " + (i + 1)));
        row.appendChild(ta); row.appendChild(tools);
        list.appendChild(row);
      });
    }
    renderFacts();
    var add = el("button", "btn ghost", "+ Añadir dato"); add.type = "button";
    add.addEventListener("click", function () { work.h.push(""); renderFacts(); var t = $("edFact" + (work.h.length - 1)); if (t) t.focus(); });
    sheet.appendChild(add);

    var hid = el("input"); hid.type = "checkbox"; hid.id = "edHidden"; hid.checked = work.hidden;
    var hl = el("label", "r-check"); hl.appendChild(hid); hl.appendChild(document.createTextNode(" Ocultar este lugar: no te lo contaré en los viajes"));
    sheet.appendChild(hl);

    var acts = el("div", "row sheet-acts");
    var ok = el("button", "btn", "Guardar"); ok.type = "button";
    ok.addEventListener("click", function () {
      var facts = work.h.map(function (t) { return t.replace(/\s+/g, " ").trim(); }).filter(Boolean);
      if (!facts.length) { toast("Escribe al menos un dato."); return; }
      if (custom) {
        var n = nameIn.value.trim();
        if (!n) { toast("Ponle un nombre al lugar."); return; }
        if (work.lat == null) { toast("Elige la posición del lugar: tu ubicación o en el mapa."); return; }
        var reg = regIn.value.trim() || "Mis lugares";
        reg = /^asturias$/i.test(reg) ? "AST" : /^cantabria$/i.test(reg) ? "CAN" : reg;
        if (isNew) {
          p = { id: "my" + Date.now().toString(36), custom: true };
          ED.custom.push(p);
        }
        p.n = n; p.reg = reg; p.lat = work.lat; p.lon = work.lon; p.rad = +radSel.value; p.h = facts; p.hiddenFlag = hid.checked; p.hidden = hid.checked;
        S.lastProv = regIn.value.trim();
      } else {
        var orig = p._orig || p.h, same = facts.length === orig.length && facts.every(function (t, i) { return t === orig[i]; });
        var e = {};
        if (!same) e.h = facts;
        if (hid.checked) e.hidden = true;
        if (e.h || e.hidden) ED.places[p.id] = e; else delete ED.places[p.id];
      }
      changed(); close();
      toast(isNew ? "Lugar añadido." : "Cambios guardados.");
    });
    var cancel = el("button", "btn ghost", "Cancelar"); cancel.type = "button"; cancel.addEventListener("click", close);
    acts.appendChild(ok); acts.appendChild(cancel);
    sheet.appendChild(acts);

    var extra = el("div", "row sheet-acts");
    if (!custom && ED.places[p.id]) {
      var rest = el("button", "btn ghost small", "Restaurar el original"); rest.type = "button";
      rest.addEventListener("click", function () { delete ED.places[p.id]; changed(); close(); toast("Restaurados los datos originales de " + p.n + "."); });
      extra.appendChild(rest);
    }
    if (custom && !isNew) {
      var rm = el("button", "btn ghost small danger", "Borrar este lugar"); rm.type = "button";
      rm.addEventListener("click", function () {
        if (!rm.dataset.armed) { rm.dataset.armed = "1"; rm.textContent = "Toca otra vez para borrar"; setTimeout(function () { delete rm.dataset.armed; rm.textContent = "Borrar este lugar"; }, 3000); return; }
        ED.custom = ED.custom.filter(function (c) { return c.id !== p.id; }); changed(); close(); toast("Lugar borrado.");
      });
      extra.appendChild(rm);
    }
    if (extra.firstChild) sheet.appendChild(extra);

    modal.hidden = false; document.body.classList.add("modal-open");
    var first = custom ? nameIn : $("edFact0"); if (first) setTimeout(function () { first.focus(); }, 50);
  }

  /* ---------- Exportar e importar ---------- */
  function exportData() {
    var data = JSON.stringify({ app: "ruta-con-historia", tipo: "cambios-de-lugares", version: 1, fecha: new Date().toISOString(), cambios: ED }, null, 2);
    var n = Object.keys(ED.places).length + ED.custom.length;
    if (!n) { toast("Todavía no has hecho cambios que exportar."); return; }
    if (A.native) {
      /* En la app Android se copian al portapapeles: se pueden pegar en una nota, un correo o WhatsApp. */
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(data).then(function () { toast("Cambios copiados al portapapeles. Pégalos en una nota o un mensaje para guardarlos."); }, function () { showText(data); });
      else showText(data);
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = "ruta-con-historia-cambios.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast("Cambios exportados (" + n + (n === 1 ? " lugar" : " lugares") + ").");
  }
  function showText(t) {
    sheet.textContent = "";
    sheet.appendChild(el("h2", null, "Tus cambios"));
    sheet.appendChild(el("p", "note", "Mantén pulsado el texto, selecciónalo todo y cópialo."));
    var ta = el("textarea", "ed-json"); ta.value = t; ta.rows = 12; ta.readOnly = true; sheet.appendChild(ta);
    var c = el("button", "btn", "Cerrar"); c.type = "button"; c.addEventListener("click", close); sheet.appendChild(c);
    modal.hidden = false;
  }
  function importText(txt) {
    var d;
    try { d = JSON.parse(txt); } catch (e) { toast("Ese archivo no es un archivo de cambios válido."); return; }
    var c = d && (d.cambios || d.edits);
    if (!c || typeof c !== "object" || (!c.places && !c.custom)) { toast("Ese archivo no tiene cambios de lugares."); return; }
    ED = { places: c.places || {}, custom: (c.custom || []).filter(function (x) { return x && x.id && x.n && isFinite(x.lat) && isFinite(x.lon) && Array.isArray(x.h); }) };
    changed();
    toast("Cambios importados: " + (Object.keys(ED.places).length + ED.custom.length) + " lugares.");
  }
  function importDialog() {
    sheet.textContent = "";
    var head = el("div", "sheet-head"); head.appendChild(el("h2", null, "Importar cambios"));
    var x = el("button", "btn ghost small", "Cerrar"); x.type = "button"; x.addEventListener("click", close); head.appendChild(x);
    sheet.appendChild(head);
    sheet.appendChild(el("p", "note", "Sustituye tus cambios actuales por los del archivo. Elige el archivo exportado o pega su contenido."));
    var file = el("input"); file.type = "file"; file.accept = ".json,application/json,text/plain"; file.id = "edFile";
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { importText(String(r.result)); close(); }; r.readAsText(f);
    });
    sheet.appendChild(field("Archivo", file));
    var ta = el("textarea", "ed-json"); ta.rows = 6; ta.id = "edPaste"; ta.placeholder = "…o pega aquí el texto copiado";
    sheet.appendChild(ta);
    var go = el("button", "btn", "Importar el texto pegado"); go.type = "button";
    go.addEventListener("click", function () { if (ta.value.trim()) { importText(ta.value); close(); } });
    sheet.appendChild(go);
    modal.hidden = false; document.body.classList.add("modal-open");
  }

  $("btnNewPlace").addEventListener("click", function () { open(null); });
  $("btnExport").addEventListener("click", exportData);
  $("btnImport").addEventListener("click", importDialog);

  A.Edits = { open: open, apply: apply, data: function () { return ED; } };
  apply();
  A.renderPlaces && A.renderPlaces();
})();

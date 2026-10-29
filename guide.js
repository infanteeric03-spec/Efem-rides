/* Guía de uso: oscurece la pantalla, ilumina el botón que se explica y una mano dibujada hace el gesto.
   Sale la primera vez que se abre cada pestaña, nunca con el viaje en marcha, y se puede repetir desde Ajustes. */
(function () {
  "use strict";
  var A = window.App, run = A.run;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function visible(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== "hidden"; }

  var seen = load("rch.guide", {}) || {};
  function markSeen(k) { seen[k] = 1; save("rch.guide", seen); }

  /* ---------- Pasos de cada guía ---------- */
  /* t: selector o lista de selectores (se ilumina el conjunto) · g: gesto (tap, double, swipe) · enter/leave: preparar la pantalla */
  var drivePrev = {
    enter: function () { if (A.drivePreview) A.drivePreview(true); },
    leave: function () { if (A.drivePreview) A.drivePreview(false); }
  };
  /* En la vista previa no hay viaje: se rellena con un ejemplo para que se vea el próximo lugar y los km. */
  function demoNext() {
    $("dNextName").textContent = "Próximo: Lugones";
    $("dDist").textContent = "4,2"; $("dDistU").textContent = "km";
    $("dDistBox").style.visibility = "visible";
  }
  function inDrive(step) { step.enter = drivePrev.enter; step.drive = true; return step; }
  var GUIDES = {
    ruta: [
      { t: "#sign", text: "Aquí verás dónde estás: tu provincia y tu localidad. En el viaje, el pueblo por el que pasas." },
      { t: "#todayCard", g: "swipe", text: "Desliza la tarjeta o usa las flechas para ver más efemérides." },
      { t: "#btnContinue", g: "tap", text: "Continuar sigue tu último viaje donde lo dejaste." },
      { t: "#btnStart", g: "tap", text: "Pulsa para empezar. Te iré contando en voz alta la historia de cada lugar." },
      inDrive({ t: "#dMore", g: "tap", text: "Durante el viaje verás esta pantalla, con botones grandes. Otro dato: te cuento algo más." }),
      inDrive({ t: ["#dRepeat", "#dMute", "#dRadio", "#dStation"], text: "Repetir, silenciar la voz, encender la radio y cambiar de emisora." }),
      inDrive({ t: "#dFactToggle", need: function () { return !!A.S.driveText; }, show: function () { $("dFactToggle").style.visibility = "visible"; }, g: "double", text: "Para leer el dato, toca dos veces. Así se evitan toques sin querer." }),
      inDrive({ t: "#dNextName", show: demoNext, text: "Debajo de la señal verás el próximo lugar del que te hablaré." }),
      inDrive({ t: "#dDistBox", show: demoNext, g: "point", text: "Y aquí, en la esquina de la señal, los km que faltan para llegar a él." }),
      inDrive({ t: "#dStop", g: "tap", text: "Cuando llegues, para el viaje. La radio también se para." })
    ],
    lugares: [
      { t: "#q", g: "tap", text: "Busca cualquier lugar por su nombre." },
      { t: "#plFilter", g: "tap", text: "Filtra por provincia o por tus rutas." },
      { t: "#placesList .group-head", g: "tap", text: "Toca un apartado para abrirlo o cerrarlo." },
      { t: "#pToggle", g: "tap", text: "¿Vas a un sitio nuevo? Prepara aquí el viaje antes de salir, con cobertura." },
      { t: ["#btnNewPlace", "#btnExport", "#btnImport"], g: "tap", text: "Crea tus propios lugares. Con Exportar cambios me los pasas para añadirlos a la app." }
    ],
    prep: [
      { t: "#pTo", g: "tap", text: "Escribe a dónde vas. Si no pones el origen, salgo desde donde estás." },
      { t: "#pDate", g: "tap", text: "El día de salida: busco efemérides de ese día en los pueblos del camino." },
      { t: ["#pGo", "#pCancel"], g: "tap", text: "Prepara la ruta. Si tarda mucho, puedes cancelar." },
      { t: "#rMap", g: "tap", key: "map", text: "Toca un punto para escucharlo, quitarlo de este viaje o editarlo. Pellizca para acercar." }
    ],
    map: [
      { t: "#rMap", g: "tap", text: "Toca un punto para escucharlo, quitarlo de este viaje o editarlo. Pellizca para acercar." }
    ],
    viaje: [
      { t: "#map", text: "El recorrido de tu viaje." },
      { t: "#log", text: "Todo lo que te he contado, por si quieres repasarlo." },
      { t: ["#btnGpx", "#btnNew"], g: "tap", text: "Guarda el recorrido o empieza un viaje nuevo." }
    ],
    radio: [
      { t: "#rToggle", g: "tap", text: "Enciende la radio." },
      { t: "#rFavs", g: "tap", text: "Tus emisoras favoritas: toca una para escucharla." },
      { t: ["#rSearch", "#rCountry"], g: "tap", text: "Busca otras emisoras por país." },
      { t: "#rDuck", text: "Cuando hablo, bajo la radio para que me oigas bien." }
    ],
    ajustes: [
      { t: "label[for=s_home]", g: "tap", text: "Tu localidad: al salir de casa no te repito siempre lo mismo." },
      { t: "label[for=s_driveText]", g: "tap", text: "Si conduces solo, oculta el texto. La voz lo sigue contando." },
      { t: "#btnSim", g: "tap", text: "Prueba la app desde casa con un viaje simulado." },
      { t: "#appSec", text: "La versión de la app y las actualizaciones." },
      { t: "#btnGuide", g: "tap", text: "Aquí puedes volver a ver esta guía cuando quieras." }
    ]
  };

  /* ---------- Dibujos ---------- */
  var HAND = '<svg class="g-hand" viewBox="0 0 100 130" aria-hidden="true"><path d="M30 64 L30 17 C30 5 46 5 46 17 L46 52 C46 42 60 42 60 51 L60 57 C60 47 74 47 74 57 L74 63 C74 54 88 54 88 64 L88 93 C88 112 76 124 58 124 L50 124 C38 124 31 118 25 108 L11 85 C6 77 15 70 22 76 L30 85 Z" /><path class="g-nail" d="M33 17 C34 11 42 11 43 17" /></svg>';
  var SWIPE = '<svg class="g-arrows" viewBox="0 0 160 40" aria-hidden="true"><path d="M14 20 L146 20 M30 8 L14 20 L30 32 M130 8 L146 20 L130 32" /></svg>';

  /* ---------- Capa ---------- */
  var root = null, hole, handW, rings, textEl, bar, count, nextB, skipB;
  var steps = [], idx = 0, active = null, cleanup = [];

  function build() {
    root = el("div", "guide"); root.id = "guide";
    root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Guía de uso");
    hole = el("div", "g-hole");
    rings = el("div", "g-rings"); rings.appendChild(el("i")); rings.appendChild(el("i")); rings.appendChild(el("b", "g-x2", "×2"));
    handW = el("div", "g-handwrap"); handW.innerHTML = SWIPE + HAND;
    textEl = el("p", "g-text"); textEl.setAttribute("aria-live", "polite");
    bar = el("div", "g-bar");
    skipB = el("button", "g-skip", "✕ Saltar guía"); skipB.type = "button";
    count = el("span", "g-count");
    nextB = el("button", "g-next", "Siguiente"); nextB.type = "button";
    bar.appendChild(skipB); bar.appendChild(count); bar.appendChild(nextB);
    root.appendChild(hole); root.appendChild(rings); root.appendChild(handW); root.appendChild(textEl); root.appendChild(bar);
    document.body.appendChild(root);
    root.addEventListener("click", function (e) { if (e.target === skipB) return; e.preventDefault(); e.stopPropagation(); next(); });
    skipB.addEventListener("click", function (e) { e.stopPropagation(); end(); });
    document.addEventListener("keydown", function (e) {
      if (!active) return;
      if (e.key === "Escape") end(); else if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
    });
    window.addEventListener("resize", function () { if (active) place(); });
  }

  function targets(step) {
    var list = [].concat(step.t), out = [];
    list.forEach(function (s) { var e = document.querySelector(s); if (visible(e)) out.push(e); });
    return out;
  }
  function rectOf(els) {
    var r = null;
    els.forEach(function (e) {
      var b = e.getBoundingClientRect();
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) } : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });
    return r;
  }

  function start(key, force) {
    if (active || run.on) return false;
    if (!force && seen[key]) return false;
    var list = GUIDES[key]; if (!list) return false;
    if (!root) build();
    active = key; idx = -1; cleanup = [];
    /* Solo los pasos que se pueden enseñar ahora (los de conducción se comprueban con su condición, porque esa vista aún está oculta). */
    steps = list.filter(function (x) { return x.drive ? (!x.need || x.need()) : targets(x).length; });
    if (!steps.length) { active = null; return false; }
    document.body.classList.add("guiding");
    root.hidden = false;
    next();
    return true;
  }
  function next() {
    var prev = steps[idx];
    while (++idx < steps.length) {
      var s = steps[idx];
      if (s.enter) { s.enter(); if (s.show) s.show(); if (s.drive && cleanup.indexOf(drivePrev.leave) < 0) cleanup.push(drivePrev.leave); }
      else if (prev && prev.drive) { drivePrev.leave(); }
      if (targets(s).length) { show(s); return; }
      prev = s;
    }
    end();
  }
  function show(s) {
    if (s.key) markSeen(s.key);
    var els = targets(s);
    var r0 = rectOf(els);
    var vh = window.innerHeight;
    /* Si el elemento no está a la vista, se lleva al centro de la pantalla antes de iluminarlo. */
    if (r0.top < 60 || r0.bottom > vh - 120) {
      try { els[0].scrollIntoView({ block: "center", behavior: "instant" }); } catch (e) { els[0].scrollIntoView(); }
    }
    textEl.textContent = s.text;
    count.textContent = (idx + 1) + " / " + steps.length;
    nextB.textContent = idx === steps.length - 1 ? "Entendido" : "Siguiente";
    root.className = "guide g-" + (s.g || "none");
    requestAnimationFrame(function () { requestAnimationFrame(place); });
    setTimeout(function () { try { nextB.focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 60);
  }
  function place() {
    var s = steps[idx]; if (!s) return;
    var els = targets(s); if (!els.length) return;
    var W = window.innerWidth, H = window.innerHeight, P = 8, r = rectOf(els);
    var hl = Math.max(4, r.left - P), ht = Math.max(4, r.top - P), hr = Math.min(W - 4, r.right + P), hb = Math.min(H - 4, r.bottom + P);
    hole.style.left = hl + "px"; hole.style.top = ht + "px"; hole.style.width = (hr - hl) + "px"; hole.style.height = (hb - ht) + "px";

    /* La barra de botones va abajo, salvo que lo iluminado esté abajo del todo. */
    var barTop = hb > H - 96;
    bar.classList.toggle("top", barTop);
    var barH = bar.offsetHeight + 16, minY = barTop ? barH : 12, maxY = barTop ? H - 12 : H - barH;

    /* La mano apunta al centro; si no cabe debajo, apunta desde arriba. Si está muy a la derecha, se da la vuelta. */
    var cx = (hl + hr) / 2, cy = (ht + hb) / 2, HAND_H = 118;
    if (hb - ht > 160) cy = ht + Math.min(90, (hb - ht) / 2);
    var hasHand = !!s.g, below = maxY - cy > HAND_H + 6, mirror = cx > W - 90;
    /* "Señalar": la mano apunta al borde, sin tapar lo que se explica. */
    if (s.g === "point") { below = maxY - hb > HAND_H + 6; cy = below ? hb + 2 : ht - 2; }
    handW.style.left = cx + "px"; handW.style.top = cy + "px";
    handW.style.transform = (below ? "" : "rotate(180deg) ") + (mirror !== !below ? "scaleX(-1)" : "");
    rings.style.left = cx + "px"; rings.style.top = cy + "px";
    var handTop = below ? cy : cy - HAND_H, handBot = below ? cy + HAND_H : cy;

    /* El texto va en el hueco más grande, arriba o abajo, sin tapar la mano. */
    var upEnd = Math.min(ht, hasHand ? handTop : ht) - 14, downStart = Math.max(hb, hasHand ? handBot : hb) + 14;
    var upSpace = upEnd - minY, downSpace = maxY - downStart;
    textEl.style.top = ""; textEl.style.bottom = "";
    if (upSpace >= downSpace) { textEl.style.bottom = (H - upEnd) + "px"; textEl.style.maxHeight = Math.max(80, upSpace) + "px"; }
    else { textEl.style.top = downStart + "px"; textEl.style.maxHeight = Math.max(80, downSpace) + "px"; }
  }
  function end() {
    if (!active) return;
    var s = steps[idx];
    markSeen(active);
    if (s && s.key) markSeen(s.key);
    cleanup.forEach(function (f) { try { f(); } catch (e) { /* nada */ } });
    cleanup = []; active = null;
    root.hidden = true;
    document.body.classList.remove("guiding");
  }

  /* ---------- Cuándo aparece ---------- */
  function tabOpen(n) { var t = $("tab-" + n); return t && !t.hidden; }
  function auto(key) { setTimeout(function () { if (!run.on && !document.body.classList.contains("driving") && !document.querySelector(".modal:not([hidden])")) start(key); }, 450); }
  ["ruta", "lugares", "viaje", "radio", "ajustes"].forEach(function (n) {
    $("t-" + n).addEventListener("click", function () { auto(n); });
  });
  $("pToggle").addEventListener("click", function () {
    setTimeout(function () {
      if ($("pPanel").hidden) return;
      if (!seen.prep) auto("prep");
      else if (!seen.map && visible($("rMap"))) auto("map");
    }, 200);
  });
  /* Nunca con el viaje en marcha: si empieza uno, la guía se cierra. */
  A.on("trip", function () { if (run.on) end(); });

  /* Botón de Ajustes: borra lo visto y empieza por la pestaña Ruta. */
  $("btnGuide").addEventListener("click", function () {
    if (run.on) { A.emit("toast", "La guía se puede ver con el viaje parado."); return; }
    seen = {}; save("rch.guide", seen);
    $("t-ruta").click();
  });

  setTimeout(function () { if (tabOpen("ruta")) auto("ruta"); }, 1200);
  A.Guide = { start: start, end: end, reset: function () { seen = {}; save("rch.guide", seen); } };
})();

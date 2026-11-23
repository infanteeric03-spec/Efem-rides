/* Desplegables propios: sustituyen la lista del sistema por una con el aspecto de la app.
   El <select> sigue en la página (oculto) y manda: su valor, sus opciones y su evento «change» funcionan como siempre. */
(function () {
  "use strict";
  var getV = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  var pop = document.createElement("div");
  pop.className = "dd-pop"; pop.setAttribute("role", "listbox"); pop.hidden = true;
  document.body.appendChild(pop);
  var cur = null, uid = 0;

  function closePop(back) {
    if (!cur) return;
    var c = cur; cur = null; pop.hidden = true; pop.textContent = "";
    c.btn.setAttribute("aria-expanded", "false");
    if (back) c.btn.focus();
  }
  function labelOf(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.textContent : ""; }

  function enhance(sel) {
    if (sel.__dd) return;
    var wrap = document.createElement("span"); wrap.className = "dd";
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "dd-btn";
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    var txt = document.createElement("span"); txt.className = "dd-txt"; btn.appendChild(txt);
    var api = { btn: btn, sel: sel };
    sel.__dd = api;
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel); wrap.appendChild(btn);
    sel.classList.add("dd-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    var lab = sel.closest("label"), l = lab && (lab.querySelector(".lbl") || lab);
    if (l) { if (!l.id) l.id = "ddl" + (++uid); btn.id = "ddb" + uid; btn.setAttribute("aria-labelledby", l.id + " " + btn.id); }

    function sync() { txt.textContent = labelOf(sel); btn.disabled = sel.disabled; }
    api.sync = sync;
    /* Si la app cambia el valor por código (sel.value = …), el botón lo refleja. */
    Object.defineProperty(sel, "value", { configurable: true, get: function () { return getV.get.call(this); }, set: function (v) { getV.set.call(this, v); sync(); } });
    new MutationObserver(function () { if (cur && cur.sel === sel) closePop(false); sync(); })
      .observe(sel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    sync();

    function pick(i) {
      var o = sel.options[i]; if (!o || o.disabled) return;
      sel.selectedIndex = i; sync(); closePop(true);
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function open() {
      if (btn.disabled) return;
      if (cur) { var same = cur.btn === btn; closePop(false); if (same) return; }
      pop.textContent = "";
      var focusEl = null;
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var d = document.createElement("div"); d.className = "dd-opt"; d.setAttribute("role", "option"); d.tabIndex = -1;
        d.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
        if (o.disabled) d.setAttribute("aria-disabled", "true");
        var s = document.createElement("span"); s.textContent = o.textContent; d.appendChild(s);
        d.addEventListener("click", function () { pick(i); });
        pop.appendChild(d);
        if (i === sel.selectedIndex || (!focusEl && !o.disabled)) focusEl = d;
      });
      cur = api; btn.setAttribute("aria-expanded", "true");
      var r = btn.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
      var w = Math.min(Math.max(r.width, 200), vw - 16), left = Math.min(Math.max(8, r.left), vw - w - 8);
      pop.style.width = w + "px"; pop.style.left = left + "px";
      var below = vh - r.bottom - 12, above = r.top - 12, want = Math.min(340, pop.scrollHeight + 10);
      if (below >= want || below >= above) { pop.style.top = (r.bottom + 4) + "px"; pop.style.bottom = "auto"; pop.style.maxHeight = Math.max(120, Math.min(340, below)) + "px"; }
      else { pop.style.bottom = (vh - r.top + 4) + "px"; pop.style.top = "auto"; pop.style.maxHeight = Math.max(120, Math.min(340, above)) + "px"; }
      pop.hidden = false;
      if (focusEl) { focusEl.scrollIntoView({ block: "nearest" }); focusEl.focus({ preventScroll: true }); }
    }
    api.open = open;
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); } });
  }

  pop.addEventListener("keydown", function (e) {
    var opts = Array.prototype.slice.call(pop.querySelectorAll(".dd-opt:not([aria-disabled])")), i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (opts[Math.min(opts.length - 1, i + 1)] || opts[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (opts[Math.max(0, i - 1)] || opts[0]).focus(); }
    else if (e.key === "Home") { e.preventDefault(); if (opts[0]) opts[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); if (opts.length) opts[opts.length - 1].focus(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (document.activeElement && document.activeElement.click) document.activeElement.click(); }
    else if (e.key === "Escape") { e.preventDefault(); closePop(true); }
    else if (e.key === "Tab") closePop(false);
  });
  document.addEventListener("pointerdown", function (e) { if (cur && !pop.contains(e.target) && !cur.btn.contains(e.target)) closePop(false); }, true);
  window.addEventListener("resize", function () { closePop(false); });
  window.addEventListener("scroll", function (e) { if (cur && !pop.contains(e.target)) closePop(false); }, true);
  /* Tocar el texto de la fila también abre el desplegable. */
  document.addEventListener("click", function (e) {
    var lab = e.target.closest && e.target.closest("label");
    if (!lab || e.target.closest(".dd")) return;
    var s = lab.querySelector("select.dd-native");
    if (!s && lab.htmlFor) { var f = document.getElementById(lab.htmlFor); if (f && f.classList && f.classList.contains("dd-native")) s = f; }
    if (s && s.__dd) { e.preventDefault(); s.__dd.open(); }
  });

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.tagName === "SELECT") enhance(root);
    else if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll("select"), enhance);
  }
  scan(document.body);
  new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, scan); }); })
    .observe(document.body, { childList: true, subtree: true });
})();

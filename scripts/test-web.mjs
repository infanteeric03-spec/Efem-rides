// Pruebas automáticas de la web. Se ejecutan antes de compilar el APK y en cada cambio.
// Uso: node scripts/test-web.mjs   (necesita "playwright" con Chromium instalado)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const fails = [], oks = [];
const ok = (n) => { oks.push(n); console.log("  ✔ " + n); };
const fail = (n, why) => { fails.push(n + ": " + why); console.log("  ✘ " + n + " — " + why); };
const check = (cond, n, why) => (cond ? ok(n) : fail(n, why || "no se cumple"));

/* ---------- Servidor local ---------- */
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (f.endsWith("/")) f += "index.html";
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port + "/";

/* ---------- 1. Archivos y versión ---------- */
console.log("\nArchivos y versión");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
check(scripts.length >= 10, "index.html carga los scripts", "faltan scripts");
const missing = scripts.filter((s) => !fs.existsSync(path.join(ROOT, s.split("?")[0])));
check(!missing.length, "todos los scripts existen", missing.join(", "));
const ver = (html.match(/Versión (\d+)\./) || [])[1];
const tags = new Set([...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
check(tags.size === 1 && tags.has(ver), "la versión del texto coincide con los ?v= (" + ver + ")", "versiones: " + [...tags].join(",") + " / texto " + ver);
check(sw.includes("ruta-historia-v" + ver), "la caché del service worker es la versión " + ver, "sw.js no coincide");
const nov = fs.readFileSync(path.join(ROOT, "novedades.js"), "utf8");
check(new RegExp("v: " + ver + ",").test(nov), "hay novedades escritas para la versión " + ver, "añade una entrada en novedades.js");
const notCached = scripts.filter((s) => !sw.includes(s.split("?")[0]));
check(!notCached.length, "el service worker guarda todos los scripts", notCached.join(", "));
for (const f of ["costa", "montanas", "mapa", "camino", "arcos", "radio"]) check(fs.existsSync(path.join(ROOT, "fondos", f + ".png")) && sw.includes("fondos/" + f + ".png"), "fondo de Android Auto " + f + " existe y está en la caché", "falta");
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".js"))) {
  try { new Function(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (e) { fail("sintaxis de " + f, e.message); }
}
ok("sintaxis de los .js");

/* ---------- 2. Datos ---------- */
console.log("\nDatos de lugares y efemérides");
const b = await chromium.launch();
const mk = async (opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, permissions: ["geolocation"], geolocation: { latitude: 43.36, longitude: -5.85 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR|ERR_FAILED/.test(m.text())) errs.push("console: " + m.text()); });
  await page.route((u) => !u.href.startsWith(BASE), (r) => r.abort());
  await page.addInitScript(() => { if (!sessionStorage.__t) { sessionStorage.__t = 1; localStorage.clear(); localStorage.setItem("rch.novSeen", "9999"); localStorage.setItem("rch.guide", JSON.stringify({ ruta: 1, lugares: 1, prep: 1, map: 1, viaje: 1, radio: 1, ajustes: 1 })); } });
  return { ctx, page, errs };
};
{
  const { ctx, page, errs } = await mk();
  await page.goto(BASE + "index.html");
  await page.waitForTimeout(1200);
  const d = await page.evaluate(() => {
    const L = window.App.L, out = { n: L.length, bad: [], dup: [], efBad: [] }, seen = {};
    L.forEach((p) => {
      if (seen[p.id]) out.dup.push(p.id); seen[p.id] = 1;
      if (!p.id || !p.n || !isFinite(p.lat) || !isFinite(p.lon) || !(p.rad > 0) || !p.h || !p.h.length || p.h.some((t) => !t || t.length < 20) || !["AST", "CAN"].includes(p.reg)) out.bad.push(p.id || p.n);
      if (p.lat < 42.5 || p.lat > 43.8 || p.lon < -7.3 || p.lon > -3.0) out.bad.push(p.id + " (fuera de zona)");
    });
    (window.EFEMERIDES || []).forEach((e, i) => { if (!(e.m >= 1 && e.m <= 12) || !(e.d === null || (e.d >= 1 && e.d <= 31)) || !e.t || e.t.length < 30) out.efBad.push(i); });
    out.ef = (window.EFEMERIDES || []).length;
    return out;
  });
  check(d.n >= 40, "hay " + d.n + " lugares", "muy pocos");
  check(!d.dup.length, "ids de lugares únicos", d.dup.join(", "));
  check(!d.bad.length, "todos los lugares tienen nombre, posición, radio y datos válidos", d.bad.join(", "));
  check(!d.efBad.length && d.ef > 10, "efemérides válidas (" + d.ef + ")", d.efBad.join(", "));
  /* Nombres repetidos a menos de 800 m: se contarían dos veces. */
  const twins = await page.evaluate(() => {
    const L = window.App.L, C = window.App.C, out = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (C.dist(L[i].lat, L[i].lon, L[j].lat, L[j].lon) < 0.8) out.push(L[i].id + "/" + L[j].id);
    return out;
  });
  check(!twins.length, "no hay lugares duplicados a menos de 800 m", twins.join(", "));

  /* ---------- 3. Pantallas y guía ---------- */
  console.log("\nPantallas y guía");
  for (const t of ["lugares", "viaje", "radio", "ajustes", "ruta"]) { await page.click("#t-" + t); await page.waitForTimeout(150); }
  ok("se abren todas las pestañas");
  await page.evaluate(() => window.App.Guide.reset());
  await page.click("#t-ajustes"); await page.click("#btnGuide"); await page.waitForTimeout(700);
  let steps = 0;
  for (let i = 0; i < 20; i++) {
    const open = await page.$eval("#guide", (e) => !e.hidden).catch(() => false);
    if (!open) break;
    const r = await page.evaluate(() => { const h = document.querySelector(".g-hole").getBoundingClientRect(); return h.width > 4 && h.height > 4; });
    if (!r) fail("guía: paso " + i, "el foco no tiene tamaño");
    steps++; await page.click(".g-next"); await page.waitForTimeout(120);
  }
  check(steps >= 5, "la guía recorre " + steps + " pasos", "solo " + steps);

  /* ---------- 4. Radio ---------- */
  console.log("\nRadio");
  const radio = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("rch.radio") || "{}").favs || []; return f.map((x) => x.n); });
  check(radio.length === 0 || radio.length >= 5, "emisoras guardadas de partida", radio.join(","));
  const rs = fs.readFileSync(path.join(ROOT, "radio.js"), "utf8");
  const nDirect = (rs.match(/direct: \[/g) || []).length;
  check(nDirect >= 5, "cada emisora de partida tiene enlaces oficiales (" + nDirect + ")", "faltan");
  check(!/http:\/\/[^"']+\.(mp3|aac|m3u8)/.test(rs.split("var SERVERS")[0]), "los enlaces oficiales son https");
  check(!errs.length, "sin errores de JavaScript en las pantallas", errs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ---------- 5. Viaje simulado sin repeticiones ---------- */
console.log("\nViaje simulado");
async function trip(page, ctx, route) {
  await page.evaluate(() => { window.__f = []; window.App.start("new"); });
  for (const [lat, lon] of route) { await ctx.setGeolocation({ latitude: lat, longitude: lon, accuracy: 8 }); await page.waitForTimeout(90); }
  await page.evaluate(() => window.App.stop());
  return page.evaluate(() => window.__f);
}
{
  const { ctx, page, errs } = await mk();
  /* Un lugar de Wikipedia con el mismo nombre y casi la misma posición que otro de la app, en el recorrido. */
  await page.addInitScript(() => { if (!localStorage.getItem("rch.live")) localStorage.setItem("rch.live", JSON.stringify([{ id: "wp777", n: "Lugones", h: ["Dato wiki de Lugones, de prueba, distinto."], lat: 43.4125, lon: -5.8, src: "wikipedia", reg: "AST", rad: 1.5 }])); });
  await page.goto(BASE + "index.html"); await page.waitForTimeout(900);
  await page.evaluate(() => window.App.on("fact", (e) => window.__f.push({ id: e.p.id, text: e.text })));
  const route = []; for (let i = 0; i <= 40; i++) route.push([43.30 + i * 0.004, -5.84 + i * 0.001]); for (let i = 40; i >= 0; i--) route.push([43.30 + i * 0.004, -5.84 + i * 0.001]);
  const f1 = await trip(page, ctx, route);
  check(f1.length > 0, "el viaje cuenta datos (" + f1.length + ")", "no contó nada");
  const dupTxt = f1.map((x) => x.text).filter((t, i, a) => a.indexOf(t) !== i);
  check(!dupTxt.length, "ningún dato se repite dentro del viaje", dupTxt[0]);
  const lug = f1.filter((x) => /lugones|wp777/i.test(x.id));
  check(lug.length <= 1, "un mismo sitio de dos fuentes se cuenta una sola vez (" + lug.length + ")", "contó " + lug.length);
  /* El viaje simulado va a mucha velocidad: se espacian las horas de los puntos para que sean realistas. */
  await page.evaluate(() => { const T = window.App.trip(); T.pts.forEach((q, i) => (q[2] = T.start + i * 60000)); T.last = Date.now(); window.App.emit("stopped"); });
  await page.waitForTimeout(700);
  const sum = await page.evaluate(() => { const m = [...document.querySelectorAll(".modal")].find((x) => !x.hidden && /Resumen del viaje/.test(x.textContent)); return m ? m.textContent : null; });
  check(!!sum && /km/.test(sum), "al parar el viaje sale el resumen", "no apareció");
  await page.evaluate(() => { document.querySelectorAll(".modal").forEach((m) => (m.hidden = true)); document.body.classList.remove("modal-open"); });
  const fl = await page.evaluate(() => { window.App.run.lastFact = window.App.run.lastFact || { id: "oviedo", text: "Dato de prueba" }; document.getElementById("btnWrong").disabled = false; document.getElementById("btnWrong").click(); return JSON.parse(localStorage.getItem("rch.edits") || "{}").flags || []; });
  check(fl.length === 1, "«Este dato está mal» anota el dato", "flags: " + fl.length);
  const f2 = await trip(page, ctx, route);
  const rep = f2.filter((x) => f1.some((y) => y.text === x.text));
  check(!rep.length, "el segundo viaje no repite datos del primero", rep.length + " repetidos: " + (rep[0] && rep[0].text.slice(0, 40)));
  check(!errs.length, "sin errores de JavaScript durante el viaje", errs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ---------- Novedades al actualizar ---------- */
console.log("\nNovedades");
{
  const { ctx, page } = await mk();
  await page.addInitScript(() => { if (!sessionStorage.__n) { sessionStorage.__n = 1; localStorage.removeItem("rch.novSeen"); } });
  await page.goto(BASE + "index.html"); await page.waitForTimeout(4800);
  const shown = await page.evaluate(() => [...document.querySelectorAll(".modal")].some((m) => !m.hidden && /Novedades/.test(m.textContent) && m.querySelectorAll("li").length > 0));
  check(shown, "tras actualizar sale la lista de novedades", "no salió");
  await page.evaluate(() => [...document.querySelectorAll(".modal:not([hidden]) .btn")].pop().click());
  const saved = await page.evaluate(() => localStorage.getItem("rch.novSeen"));
  check(saved && +saved >= 77, "al cerrarla se recuerda la versión vista (" + saved + ")", "no se guardó");
  await ctx.close();
}

/* ---------- Desplegables propios ---------- */
console.log("\nDesplegables");
{
  const { ctx, page, errs } = await mk();
  await page.addInitScript(() => localStorage.setItem("rch.novSeen", "999"));
  await page.goto(BASE + "index.html"); await page.waitForTimeout(900);
  await page.evaluate(() => document.getElementById('t-ajustes').click());
  await page.waitForTimeout(300);
  const n = await page.evaluate(() => [document.querySelectorAll("select").length, document.querySelectorAll(".dd-btn").length]);
  check(n[0] > 0 && n[0] === n[1], "cada lista tiene su desplegable propio (" + n[1] + ")", "listas " + n[0] + ", desplegables " + n[1]);
  const btn = page.locator("#s_theme").locator("xpath=../button");
  await btn.scrollIntoViewIfNeeded(); await btn.click();
  const opened = await page.evaluate(() => !document.querySelector(".dd-pop").hidden && document.querySelectorAll(".dd-pop .dd-opt").length);
  check(opened >= 3, "al tocar se abre la lista con sus opciones (" + opened + ")", "no se abrió");
  await page.locator(".dd-pop .dd-opt", { hasText: "Claro" }).click();
  const st = await page.evaluate(() => ({ th: document.documentElement.getAttribute("data-theme"), v: document.getElementById("s_theme").value, txt: document.querySelector("#s_theme").parentElement.querySelector(".dd-txt").textContent, closed: document.querySelector(".dd-pop").hidden }));
  check(st.th === "light" && st.v === "light" && st.txt === "Claro" && st.closed, "elegir una opción cambia el ajuste y cierra la lista", JSON.stringify(st));
  const prog = await page.evaluate(() => { const s = document.getElementById("s_theme"); s.value = "dark"; return s.parentElement.querySelector(".dd-txt").textContent; });
  check(prog === "Oscuro", "si la app cambia el valor por código, el botón lo refleja (" + prog + ")", "mostraba " + prog);
  await btn.click(); await page.keyboard.press("Escape");
  check(await page.evaluate(() => document.querySelector(".dd-pop").hidden), "Escape cierra la lista", "seguía abierta");
  check(!errs.length, "sin errores de JavaScript en los desplegables", errs.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ---------- Sesión de audio del iPhone ---------- */
console.log("\nSesión de audio (iPhone)");
{
  const { ctx, page } = await mk();
  await page.addInitScript(() => { window.__t = []; let v = "auto"; Object.defineProperty(navigator, "audioSession", { value: { get type() { return v; }, set type(x) { v = x; window.__t.push(x); } } }); });
  await page.goto(BASE + "index.html"); await page.waitForTimeout(800);
  await page.evaluate(() => window.App.start("new")); await page.waitForTimeout(300);
  await page.evaluate(() => window.App.emit("radio", { playing: true })); await page.evaluate(() => window.App.emit("radio", { playing: false }));
  await page.evaluate(() => window.App.stop()); await page.waitForTimeout(300);
  const seq = await page.evaluate(() => window.__t.join(","));
  check(seq === "transient,playback,transient,auto", "la sesión de audio del iPhone pasa por " + seq, "secuencia: " + seq);
  await ctx.close();
}

/* ---------- Distintivo APP ---------- */
console.log("\nDistintivo");
{
  const w = await mk(); await w.page.goto(BASE + "index.html"); await w.page.waitForTimeout(500);
  check(await w.page.$eval("#vers", (e) => e.hidden || getComputedStyle(e).display === "none"), "la web no muestra el distintivo APP", "se ve en la web");
  await w.ctx.close();
  const n = await mk();
  await n.page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, registerPlugin: () => new Proxy({}, { get: () => () => Promise.resolve({}) }) }; });
  await n.page.goto(BASE + "index.html"); await n.page.waitForTimeout(500);
  check(await n.page.$eval("#vers", (e) => !e.hidden && getComputedStyle(e).display !== "none" && e.textContent === "APP"), "la aplicación Android muestra el distintivo APP", "no se ve en la app");
  await n.ctx.close();
}

/* ---------- 6. Parado en un sitio sin lugares: busca alrededor ---------- */
console.log("\nBúsqueda alrededor");
{
  const first = await mk();
  await first.page.goto(BASE + "index.html"); await first.page.waitForTimeout(900);
  const spot = await first.page.evaluate(() => {
    const L = window.App.L, C = window.App.C;
    for (let la = 42.9; la < 43.5; la += 0.05) for (let lo = -7.0; lo < -3.4; lo += 0.05) if (L.every((p) => C.dist(p.lat, p.lon, la, lo) > 6)) return [la, lo];
    return null;
  });
  await first.ctx.close();
  check(!!spot, "hay un punto de prueba lejos de todos los lugares", "no encontrado");
  if (spot) {
    const { ctx, page } = await mk({ geolocation: { latitude: spot[0], longitude: spot[1] } });
    await page.route((u) => /wikipedia\.org/.test(u.href), (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ query: { pages: [{ pageid: 9001, title: "Ermita de Prueba", description: "ermita", extract: "La ermita de Prueba es una iglesia pequeña situada junto al camino. Fue construida en el siglo XVII y reformada después. Todavía conserva su espadaña original.", coordinates: [{ lat: spot[0] + 0.01, lon: spot[1] }] }] } }) }));
    await page.goto(BASE + "index.html"); await page.waitForTimeout(900);
    await page.evaluate(() => window.App.start("new")); await page.waitForTimeout(2500);
    const found = await page.evaluate(() => !!window.App.byId["wp9001"]);
    check(found, "parado en un sitio sin lugares, busca en Wikipedia alrededor y lo encuentra", "no apareció el lugar");
    await page.evaluate(() => window.App.stop());
    await ctx.close();
  }
}

await b.close(); server.close();
console.log("\n" + oks.length + " comprobaciones correctas, " + fails.length + " fallos");
if (fails.length) {
  fails.forEach((f) => console.log("::error::" + f));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Fallos en las pruebas\n\n" + fails.map((f) => "- " + f).join("\n") + "\n");
  process.exit(1);
}

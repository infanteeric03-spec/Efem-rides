// Comprueba las emisoras guardadas de partida: busca en Radio Browser como lo hace la app,
// prueba cada enlace por https (la app solo reproduce https) y algunos enlaces oficiales conocidos.
import fs from "node:fs";
const src = fs.readFileSync(new URL("../radio.js", import.meta.url), "utf8");
const PRESETS = eval(src.match(/var PRESETS = (\[[\s\S]*?\]);/)[1]);
const SERVERS = ["https://de1.api.radio-browser.info", "https://de2.api.radio-browser.info", "https://fi1.api.radio-browser.info", "https://all.api.radio-browser.info"];
const OFFICIAL = {
  "Cadena SER": ["https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3", "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASERAAC.aac"],
  "LOS40": ["https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3", "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40AAC.aac"],
  "LOS40 Classic": ["https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3", "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSICAAC.aac"],
  "COPE": ["https://flucast-b02-04.flumotion.com/cope/net1.mp3", "https://wecast-b02-03.flumotion.com/copesedes/net1.mp3", "https://flucast-m04-06.flumotion.com/cope/net1.mp3"],
  "Europa FM": ["https://livefastly-webs.europafm.com/europafm/audio/master.m3u8", "https://atres-live.europafm.com/live/europafm/bitrate_1.m3u8", "https://livefastly-webs.europafm.com/europafm/audio/bitrate_1.m3u8"]
};
const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
async function api(path) {
  for (const b of SERVERS) {
    try { const r = await fetch(b + path, { headers: { "User-Agent": "RutaConHistoria/1.0" }, signal: AbortSignal.timeout(10000) }); if (r.ok) return await r.json(); } catch (e) { /* siguiente */ }
  }
  throw new Error("Radio Browser no responde");
}
function rank(list, p) {
  const score = s => { const n = norm(s.name); let sc = (s.clickcount || 0) / 1e6; const i = p.prefer.indexOf(n);
    if (i >= 0) sc += 100 - i; else if (n.includes(norm(p.q))) sc += 10;
    if (p.avoid.some(w => n.includes(w))) sc -= 200; if (/^https:/i.test(s.url_resolved || s.url)) sc += 1; return sc; };
  return list.map(s => ({ s, sc: score(s) })).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).map(x => x.s);
}
const https = u => /^https:/i.test(u) ? u : u.replace(/^http:/i, "https:");
async function probe(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile" }, redirect: "follow", signal: AbortSignal.timeout(9000) });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok) { r.body?.cancel(); return { ok: false, why: "HTTP " + r.status }; }
    const rd = r.body.getReader(); let n = 0, first = "";
    while (n < 16384 && Date.now() - t0 < 8000) { const { value, done } = await rd.read(); if (done) break; if (!first) first = Buffer.from(value.slice(0, 16)).toString("latin1"); n += value.length; }
    rd.cancel().catch(() => {});
    const hls = /mpegurl/i.test(ct) || first.startsWith("#EXTM3U");
    const audio = /audio|octet|aac|mpeg|ogg/i.test(ct) || hls;
    return { ok: n > 500 && audio, why: (hls ? "HLS " : "") + ct + " · " + n + " bytes · " + (Date.now() - t0) + " ms", hls };
  } catch (e) { return { ok: false, why: (e.cause && e.cause.code) || e.name || String(e) }; }
}
let md = "# Comprobación de emisoras\n\n", notes = [];
for (const p of PRESETS) {
  md += `## ${p.n}\n\n| Emisora en Radio Browser | Enlace https | Resultado |\n|---|---|---|\n`;
  let lines = [], okN = 0;
  try {
    const list = await api(`/json/stations/search?hidebroken=true&order=clickcount&reverse=true&limit=40&countrycode=ES&name=${encodeURIComponent(p.q)}`);
    const top = rank(list, p).slice(0, 8);
    if (!top.length) lines.push("SIN CANDIDATOS en Radio Browser");
    for (const s of top) {
      const u = https(s.url_resolved || s.url), r = await probe(u);
      if (r.ok) okN++;
      md += `| ${s.name} | ${u} | ${r.ok ? "✅" : "❌"} ${r.why} |\n`;
      lines.push(`${r.ok ? "OK " : "MAL"} ${s.name} -> ${u} (${r.why})`);
    }
  } catch (e) { lines.push("ERROR " + e.message); }
  md += "\nEnlaces oficiales probados:\n\n";
  for (const u of OFFICIAL[p.n] || []) { const r = await probe(u); md += `- ${r.ok ? "✅" : "❌"} ${u} — ${r.why}\n`; lines.push(`OFICIAL ${r.ok ? "OK " : "MAL"} ${u} (${r.why})`); }
  md += "\n";
  notes.push({ n: p.n, okN, lines });
}
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
fs.writeFileSync("radio-report.md", md);
for (const x of notes) console.log(`::notice title=${x.n} (${x.okN} de Radio Browser funcionan)::` + x.lines.join("%0A").replace(/::/g, ":"));

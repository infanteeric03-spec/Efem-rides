/* Copia la web (raíz del repositorio) a app/www para empaquetarla en la app Android. */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..", ".."), out = path.resolve(__dirname, "..", "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const skip = new Set(["app", ".git", ".github", "README.md", "LEEME.md", "node_modules"]);
for (const f of fs.readdirSync(root)) {
  if (skip.has(f) || f.startsWith(".")) continue;
  const src = path.join(root, f);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(out, f));
}
/* En la app se carga el puente de Capacitor antes que el resto de scripts. */
fs.copyFileSync(path.resolve(__dirname, "..", "node_modules", "@capacitor", "core", "dist", "capacitor.js"), path.join(out, "capacitor.js"));
/* Número de compilación (lo pone GitHub al compilar) para poder avisar de versiones nuevas. */
const build = parseInt(process.env.APP_BUILD || "0", 10) || 0;
fs.writeFileSync(path.join(out, "app-version.js"), "window.APP_BUILD = " + build + ";\n");
const idx = path.join(out, "index.html");
let html = fs.readFileSync(idx, "utf8");
html = html.replace(/<script src="/, '<script src="capacitor.js"></script>\n<script src="app-version.js"></script>\n<script src="');
fs.writeFileSync(idx, html);
console.log("Web copiada en", out, "(" + fs.readdirSync(out).length + " archivos)");

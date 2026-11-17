// Gera design-system/holynex-ds.scoped.css a partir de design-system/styles.css.
//
// Por quê: os tokens do HolyNex Design System usam nomes como --accent e --border-*
// no :root. O shadcn/ui deste projeto também usa --accent (em outro formato, HSL sem hsl()).
// Carregar os tokens soltos quebraria as cores do site inteiro. Aqui tudo fica preso
// dentro de .hn-ds: só o que estiver dentro de um elemento com essa classe usa o design system.
//
// Rodar sempre que design-system/ mudar:  node scripts/ds-scope.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dsDir = path.join(root, "design-system");
const outFile = path.join(dsDir, "holynex-ds.scoped.css");
const entry = fs.readFileSync(path.join(dsDir, "styles.css"), "utf8");
const imports = [...entry.matchAll(/@import\s+"([^"]+)";/g)].map((m) => m[1]);

const SCOPE = ".hn-ds";

function rebaseUrls(css, fromDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, q, ref) => {
    if (/^(data:|https?:|\/)/.test(ref)) return whole;
    const abs = path.resolve(fromDir, ref);
    const rel = path.relative(path.dirname(outFile), abs).split(path.sep).join("/");
    return `url("./${rel}")`;
  });
}

function scopeSelectors(css) {
  // Percorre as regras de topo; @font-face e @keyframes ficam como estão; @media é tratado por dentro.
  let out = "";
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) { out += css.slice(i); break; }
    const prelude = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth > 0) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (prelude.startsWith("@media") || prelude.startsWith("@supports")) {
      out += `${prelude}{${scopeSelectors(body)}}\n`;
    } else if (prelude.startsWith("@")) {
      out += `${prelude}{${body}}\n`;
    } else if (prelude) {
      const sel = prelude.split(",").map((s) => {
        s = s.trim();
        if (s === ":root" || s === "html" || s === "body") return SCOPE;
        if (s.startsWith(":root")) return SCOPE + s.slice(5);
        if (s.startsWith(".hn-")) return `${SCOPE} ${s}, ${SCOPE}${s}`;
        return `${SCOPE} ${s}`;
      }).join(",");
      out += `${sel}{${body}}\n`;
    }
    i = j;
  }
  return out;
}

let result = `/* GERADO por scripts/ds-scope.mjs a partir de design-system/styles.css. Não editar à mão. */\n`;
for (const rel of imports) {
  const file = path.join(dsDir, rel);
  const css = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  result += `/* ${rel} */\n` + scopeSelectors(rebaseUrls(css, path.dirname(file)));
}
fs.writeFileSync(outFile, result);
console.log(`ok: ${path.relative(root, outFile)} (${(result.length / 1024).toFixed(1)} KB, ${imports.length} arquivos)`);

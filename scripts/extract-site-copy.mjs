import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walkHtml(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue;
      walkHtml(p, acc);
    } else if (ent.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function stripToText(html) {
  let h = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ");
  h = h.replace(/<[^>]+>/g, " ");
  h = h
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/gi, "\u00a9")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&ldquo;/g, "\u201c")
    .replace(/&rdquo;/g, "\u201d")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019");
  return h.replace(/\s+/g, " ").trim();
}

const files = walkHtml(root).sort();
const lines = [
  "# Venture Builders Fund — site copy (extracted)",
  "",
  "This file is auto-generated from HTML: `script` / `style` / `svg` blocks removed, then tags stripped. Meta descriptions and JSON-LD are included as plain text where present.",
  "",
];

for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const raw = fs.readFileSync(abs, "utf8");
  const text = stripToText(raw);
  if (!text) continue;
  lines.push("---", "", `## \`${rel}\``, "", text, "");
}

const outPath = path.join(root, "SITE_COPY.md");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${files.length} HTML files scanned)`);
